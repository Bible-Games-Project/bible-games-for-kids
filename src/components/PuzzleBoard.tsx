import { useEffect, useMemo, useRef, useState } from "react";
import type { Puzzle } from "@/lib/puzzles";
import { pieceCount } from "@/lib/puzzles";
import { computeStars } from "@/lib/progress";

interface Piece {
  id: number;
  row: number;
  col: number;
  placed: boolean;
}

interface DragState {
  pieceId: number;
  fromTray: boolean;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
}

interface Props {
  puzzle: Puzzle;
  onComplete: (stars: number, timeSec: number) => void;
  onExit: () => void;
}

const ASPECT = 896 / 1152; // image width / height
// Tab depth as fraction of the smaller piece side — smaller = subtler tabs
const TAB_RATIO = 0.15;

// ---------- Audio ----------
const playDing = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* ignore */
  }
};

const playWin = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.4);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* ignore */
  }
};

// ---------- Jigsaw edge generation ----------
// Each shared boundary stores one EdgeShape; the two adjacent pieces draw the
// SAME physical curve — one piece traverses it forward (edgeRight / edgeDown),
// the neighbor traverses it backward (edgeLeft / edgeUp). The only difference
// is the `sign`, which is flipped so one side bulges out (tab) and the other
// curves in (socket). All shape parameters are split into left/right halves
// so each bulb can be subtly asymmetric while still interlocking perfectly.
//
//   sign        : +1 / -1 bulge direction, 0 = flat border
//   shift       : bulb center offset along the edge from midpoint (~ -0.05..+0.05)
//   neckL/neckR : neck half-widths on each side of the bulb center (fraction of L)
//   overL/overR : how far the cubic control points overshoot past the neck (fraction of L)
//   depthL/depthR : cubic control-point depth multipliers on each side of the bulb
interface EdgeShape {
  sign: number;
  shift: number;
  neckL: number;
  neckR: number;
  overL: number;
  overR: number;
  depthL: number;
  depthR: number;
}

const FLAT: EdgeShape = {
  sign: 0, shift: 0, neckL: 0, neckR: 0, overL: 0, overR: 0, depthL: 0, depthR: 0,
};

const jitter = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

const randEdge = (): EdgeShape => {
  // Pick a base "character" so different boundaries vary noticeably:
  // some bulbs are narrow & tall, others wider & shorter.
  const character = Math.random();
  const baseNeck = 0.075 + character * 0.06;           // 0.075..0.135
  const baseOver = 0.055 + (1 - character) * 0.095;    // 0.055..0.15  (narrower neck → wider overshoot)
  const baseDepth = 0.88 + Math.random() * 0.26;       // 0.88..1.14
  // Subtle off-center placement of the bulb along the edge. Both pieces sharing
  // this boundary read the same shift, so tabs/sockets still align perfectly.
  const shift = (Math.random() - 0.5) * 0.26;          // ±0.13
  return {
    sign: Math.random() < 0.5 ? -1 : 1,
    shift,
    neckL: jitter(baseNeck, 0.045),
    neckR: jitter(baseNeck, 0.045),
    overL: Math.max(0.025, jitter(baseOver, 0.07)),
    overR: Math.max(0.025, jitter(baseOver, 0.07)),
    depthL: Math.max(0.65, jitter(baseDepth, 0.2)),
    depthR: Math.max(0.65, jitter(baseDepth, 0.2)),
  };
};

// Cubic peak sits at ~0.75 of control-point depth, so divide to land on target.
const PEAK = 0.75;

// Traverses the edge in the +x direction; "outward" = -y * sign.
const edgeRight = (L: number, T: number, e: EdgeShape) => {
  if (e.sign === 0) return `l ${L} 0`;
  const cx = L * (0.5 + e.shift);
  const preEnd = cx - L * e.neckL;
  const postStart = cx + L * e.neckR;
  const span = postStart - preEnd;
  const cpYL = (-e.sign * T * e.depthL) / PEAK;
  const cpYR = (-e.sign * T * e.depthR) / PEAK;
  return (
    `l ${preEnd} 0 ` +
    `c ${-L * e.overL} ${cpYL} ${span + L * e.overR} ${cpYR} ${span} 0 ` +
    `l ${L - postStart} 0`
  );
};

// Same physical curve as edgeRight, traversed in the -x direction.
// The pre/post sections and the cubic control points are swapped so the curve
// is identical to its neighbour's edgeRight output (with opposite sign).
const edgeLeft = (L: number, T: number, e: EdgeShape) => {
  if (e.sign === 0) return `l ${-L} 0`;
  const cx = L * (0.5 + e.shift);
  const preEnd = cx - L * e.neckL;
  const postStart = cx + L * e.neckR;
  const span = postStart - preEnd;
  // When traversing backward, outward (-y in the right frame) flips to +y here,
  // because we want to draw the very same physical curve. Sign of cpY stays as
  // in edgeRight relative to the canonical frame, which means we negate it.
  const cpYL = (e.sign * T * e.depthL) / PEAK;
  const cpYR = (e.sign * T * e.depthR) / PEAK;
  return (
    `l ${-(L - postStart)} 0 ` +
    // Reversed cubic: from postStart back to preEnd, controls swapped (R then L).
    `c ${L * e.overR} ${cpYR} ${-(span + L * e.overL)} ${cpYL} ${-span} 0 ` +
    `l ${-preEnd} 0`
  );
};

// Same as edgeRight but rotated 90° clockwise: traverses +y, outward = +x * sign.
const edgeDown = (L: number, T: number, e: EdgeShape) => {
  if (e.sign === 0) return `l 0 ${L}`;
  const cy = L * (0.5 + e.shift);
  const preEnd = cy - L * e.neckL;
  const postStart = cy + L * e.neckR;
  const span = postStart - preEnd;
  const cpXL = (e.sign * T * e.depthL) / PEAK;
  const cpXR = (e.sign * T * e.depthR) / PEAK;
  return (
    `l 0 ${preEnd} ` +
    `c ${cpXL} ${-L * e.overL} ${cpXR} ${span + L * e.overR} 0 ${span} ` +
    `l 0 ${L - postStart}`
  );
};

// Reverse of edgeDown.
const edgeUp = (L: number, T: number, e: EdgeShape) => {
  if (e.sign === 0) return `l 0 ${-L}`;
  const cy = L * (0.5 + e.shift);
  const preEnd = cy - L * e.neckL;
  const postStart = cy + L * e.neckR;
  const span = postStart - preEnd;
  const cpXL = (-e.sign * T * e.depthL) / PEAK;
  const cpXR = (-e.sign * T * e.depthR) / PEAK;
  return (
    `l 0 ${-(L - postStart)} ` +
    `c ${cpXR} ${L * e.overR} ${cpXL} ${-(span + L * e.overL)} 0 ${-span} ` +
    `l 0 ${-preEnd}`
  );
};

const buildPiecePath = (
  W: number,
  H: number,
  T: number,
  edges: { top: EdgeShape; right: EdgeShape; bottom: EdgeShape; left: EdgeShape },
) =>
  [
    `M ${T} ${T}`,
    edgeRight(W, T, edges.top),
    edgeDown(H, T, edges.right),
    edgeLeft(W, T, edges.bottom),
    edgeUp(H, T, edges.left),
    "Z",
  ].join(" ");

export function PuzzleBoard({ puzzle, onComplete, onExit }: Props) {
  const total = pieceCount(puzzle);
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pieces, setPieces] = useState<Piece[]>(() => {
    const arr: Piece[] = [];
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        arr.push({ id: r * puzzle.cols + c, row: r, col: c, placed: false });
      }
    }
    return arr.sort(() => Math.random() - 0.5);
  });

  // One EdgeShape per shared boundary. Adjacent pieces read the same descriptor
  // and only flip the sign so their tab+socket interlock perfectly.
  const edgeData = useMemo(() => {
    const eH: EdgeShape[][] = [];
    for (let r = 0; r < puzzle.rows - 1; r++) {
      const row: EdgeShape[] = [];
      for (let c = 0; c < puzzle.cols; c++) row.push(randEdge());
      eH.push(row);
    }
    const eV: EdgeShape[][] = [];
    for (let r = 0; r < puzzle.rows; r++) {
      const row: EdgeShape[] = [];
      for (let c = 0; c < puzzle.cols - 1; c++) row.push(randEdge());
      eV.push(row);
    }
    return { eH, eV };
  }, [puzzle.id, puzzle.rows, puzzle.cols]);

  const flipSign = (e: EdgeShape): EdgeShape => ({ ...e, sign: -e.sign });

  const edgesFor = (r: number, c: number) => ({
    top: r === 0 ? FLAT : flipSign(edgeData.eH[r - 1][c]),
    bottom: r === puzzle.rows - 1 ? FLAT : edgeData.eH[r][c],
    left: c === 0 ? FLAT : flipSign(edgeData.eV[r][c - 1]),
    right: c === puzzle.cols - 1 ? FLAT : edgeData.eV[r][c],
  });

  const [drag, setDrag] = useState<DragState | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });
  const [hint, setHint] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const padding = 16;
      const trayH = window.innerWidth < 640 ? 130 : 150;
      const headerH = 64;
      const availH = window.innerHeight - headerH - trayH - padding * 3;
      const availW = container.clientWidth - padding * 2;
      let w = availW;
      let h = w / ASPECT;
      if (h > availH) {
        h = availH;
        w = h * ASPECT;
      }
      setBoardSize({ w: Math.floor(w), h: Math.floor(h) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(i);
  }, [done, startTime]);

  const pieceW = boardSize.w / puzzle.cols;
  const pieceH = boardSize.h / puzzle.rows;
  const tab = Math.min(pieceW, pieceH) * TAB_RATIO;
  const paddedW = pieceW + 2 * tab;
  const paddedH = pieceH + 2 * tab;

  const trayPieces = useMemo(() => pieces.filter((p) => !p.placed), [pieces]);
  const placedCount = total - trayPieces.length;

  const trayPieceSize = window.innerWidth < 640 ? 88 : 100;

  // Pointer handlers
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      setDrag((d) => (d ? { ...d, pointerX: e.clientX, pointerY: e.clientY } : d));
    };
    const up = (e: PointerEvent) => {
      const d = drag;
      if (!d) return;
      const board = boardRef.current?.getBoundingClientRect();
      const piece = pieces.find((p) => p.id === d.pieceId);
      if (board && piece && boardSize.w > 0) {
        // Convert pointer offset back to padded-box scale
        const ratio = d.fromTray ? paddedW / trayPieceSize : 1;
        const paddedLeft = e.clientX - d.offsetX * ratio;
        const paddedTop = e.clientY - d.offsetY * ratio;
        // Inner rect top-left in screen space
        const innerLeft = paddedLeft + tab;
        const innerTop = paddedTop + tab;
        const targetX = board.left + piece.col * pieceW;
        const targetY = board.top + piece.row * pieceH;
        const dx = innerLeft - targetX;
        const dy = innerTop - targetY;
        const snap = Math.min(pieceW, pieceH) * 0.5;
        if (Math.abs(dx) < snap && Math.abs(dy) < snap) {
          setPieces((prev) => prev.map((p) => (p.id === piece.id ? { ...p, placed: true } : p)));
          playDing();
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, pieces, pieceW, pieceH, tab, paddedW, trayPieceSize, boardSize.w]);

  useEffect(() => {
    if (done) return;
    if (placedCount === total && total > 0) {
      const t = Math.floor((Date.now() - startTime) / 1000);
      const s = computeStars(total, hintsUsed, t);
      setStars(s);
      setDone(true);
      setTimeout(() => {
        playWin();
        onComplete(s, t);
      }, 300);
    }
  }, [placedCount, total, hintsUsed, startTime, done, onComplete]);

  const startDrag = (e: React.PointerEvent, pieceId: number, fromTray: boolean) => {
    e.preventDefault();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrag({
      pieceId,
      fromTray,
      pointerX: e.clientX,
      pointerY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const useHint = () => {
    const candidate = trayPieces[0];
    if (!candidate) return;
    setHint(candidate.id);
    setHintsUsed((n) => n + 1);
    setTimeout(() => setHint(null), 2000);
  };

  // Renders one piece as an SVG. The piece's inner rect occupies (tab,tab) .. (tab+pieceW, tab+pieceH).
  // The image is positioned so that the piece's source region appears under the inner rect.
  const renderPieceSvg = (
    p: Piece,
    width: number,
    height: number,
    opts?: { dim?: boolean },
  ) => {
    const edges = edgesFor(p.row, p.col);
    const d = buildPiecePath(pieceW, pieceH, tab, edges);
    const clipId = `clip-${puzzle.id}-${p.id}`;
    // image position so piece source region sits at (tab, tab)
    const imgX = tab - p.col * pieceW;
    const imgY = tab - p.row * pieceH;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${paddedW} ${paddedH}`}
        style={{ overflow: "visible", display: "block", pointerEvents: "none" }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={d} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={puzzle.image}
            x={imgX}
            y={imgY}
            width={boardSize.w}
            height={boardSize.h}
            preserveAspectRatio="none"
          />
          {opts?.dim && (
            <rect x={0} y={0} width={paddedW} height={paddedH} fill="oklch(0.97 0.015 80 / 0.5)" />
          )}
        </g>
        {/* Soft outline */}
        <path d={d} fill="none" stroke="oklch(0.35 0.04 60 / 0.35)" strokeWidth={1} />
        <path d={d} fill="none" stroke="oklch(1 0 0 / 0.45)" strokeWidth={0.6} strokeDasharray="2 3" />
      </svg>
    );
  };

  return (
    <div ref={containerRef} className="flex h-[100dvh] flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <button
          onClick={onExit}
          className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm transition active:scale-95"
        >
          ← Menu
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="truncate font-display text-base leading-tight sm:text-lg">{puzzle.title}</h2>
          <p className="text-xs text-muted-foreground">
            {placedCount} / {total} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </p>
        </div>
        <button
          onClick={useHint}
          disabled={trayPieces.length === 0}
          className="rounded-full bg-[var(--color-gold)]/90 px-4 py-2 text-sm font-semibold text-[oklch(0.3_0.05_50)] shadow-sm transition active:scale-95 disabled:opacity-40"
        >
          ✨ Hint
        </button>
      </div>

      {/* Board */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div
          ref={boardRef}
          className="relative overflow-visible rounded-2xl bg-[oklch(0.94_0.02_75)] shadow-[var(--shadow-soft)]"
          style={{
            width: boardSize.w,
            height: boardSize.h,
            backgroundImage: `linear-gradient(oklch(0.97 0.015 80 / 0.75), oklch(0.97 0.015 80 / 0.75)), url(${puzzle.image})`,
            backgroundSize: `cover, ${boardSize.w}px ${boardSize.h}px`,
            backgroundPosition: "center, top left",
          }}
        >
          {/* Hint highlight */}
          {hint !== null && boardSize.w > 0 && (() => {
            const hp = pieces.find((p) => p.id === hint);
            if (!hp) return null;
            return (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: hp.col * pieceW - tab,
                  top: hp.row * pieceH - tab,
                  width: paddedW,
                  height: paddedH,
                  filter: "drop-shadow(0 0 14px oklch(0.85 0.14 85 / 0.9))",
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              >
                {renderPieceSvg(hp, paddedW, paddedH, { dim: true })}
              </div>
            );
          })()}

          {/* Placed pieces */}
          {boardSize.w > 0 &&
            pieces
              .filter((p) => p.placed)
              .map((p) => (
                <div
                  key={p.id}
                  className="absolute"
                  style={{
                    left: p.col * pieceW - tab,
                    top: p.row * pieceH - tab,
                    width: paddedW,
                    height: paddedH,
                  }}
                >
                  {renderPieceSvg(p, paddedW, paddedH)}
                </div>
              ))}

          {/* Completion overlay */}
          {done && (
            <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-[oklch(0.97_0.015_80/0.9)] p-6 text-center">
              <div className="mb-2 text-5xl">
                {"⭐".repeat(stars)}
                {"☆".repeat(3 - stars)}
              </div>
              <h3 className="font-display text-2xl">Beautifully done!</h3>
              <p className="mt-1 text-sm italic text-muted-foreground">"{puzzle.verse}"</p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={onExit}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm active:scale-95"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tray */}
      <div
        className="paper-card mx-2 mb-2 flex items-center gap-2 overflow-x-auto p-3"
        style={{ minHeight: trayPieceSize + 24 }}
      >
        {trayPieces.length === 0 && !done && (
          <p className="w-full text-center text-sm text-muted-foreground">All pieces placed!</p>
        )}
        {boardSize.w > 0 &&
          trayPieces.map((p) => {
            if (drag?.pieceId === p.id) {
              return (
                <div
                  key={p.id}
                  style={{ width: trayPieceSize, height: trayPieceSize, flex: "0 0 auto", opacity: 0.25 }}
                />
              );
            }
            return (
              <div
                key={p.id}
                onPointerDown={(e) => startDrag(e, p.id, true)}
                className="no-select piece-shadow shrink-0 cursor-grab transition-transform active:cursor-grabbing active:scale-105"
                style={{
                  width: trayPieceSize,
                  height: trayPieceSize,
                  touchAction: "none",
                }}
              >
                {renderPieceSvg(p, trayPieceSize, trayPieceSize)}
              </div>
            );
          })}
      </div>

      {/* Dragging floating piece */}
      {drag && boardSize.w > 0 && (() => {
        const p = pieces.find((x) => x.id === drag.pieceId);
        if (!p) return null;
        const ratio = drag.fromTray ? paddedW / trayPieceSize : 1;
        const ox = drag.offsetX * ratio;
        const oy = drag.offsetY * ratio;
        return (
          <div
            className="pointer-events-none fixed z-50 piece-shadow"
            style={{
              left: drag.pointerX - ox,
              top: drag.pointerY - oy,
              width: paddedW,
              height: paddedH,
              transform: "rotate(-1deg)",
            }}
          >
            {renderPieceSvg(p, paddedW, paddedH)}
          </div>
        );
      })()}
    </div>
  );
}
