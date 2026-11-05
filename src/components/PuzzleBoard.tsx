import { useEffect, useMemo, useRef, useState } from "react";
import type { Puzzle } from "@/lib/puzzles";
import { pieceCount } from "@/lib/puzzles";
import {
  computeStars,
  saveSession,
  type SavedSession,
} from "@/lib/progress";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { useSettings } from "@/lib/i18n";
import { localizeSceneTitle, localizeVerse } from "@/lib/scenes-i18n";
import homeArt from "@/assets/ui/home.webp";
import hintArt from "@/assets/ui/hint.webp";


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

interface PendingPointer {
  pieceId: number;
  fromTray: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface Props {
  puzzle: Puzzle;
  seed: number;
  initialSession: SavedSession | null;
  onComplete: (stars: number, timeSec: number) => void;
  onExit: () => void;
}

const ASPECT = 896 / 1152;
const FRAME = 16;
const TAB_RATIO = 0.15;
const DRAG_THRESHOLD = 6; // px of movement before a tap becomes a drag

// Seeded RNG (mulberry32) — guarantees stable piece shapes & shuffle on resume.
const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- Audio ----------
// Sound effects are provided by the global AudioProvider via useAudio().

// ---------- Jigsaw edge generation ----------
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

type Rng = () => number;
const jitter = (rng: Rng, base: number, spread: number) => base + (rng() - 0.5) * spread;

const randEdge = (rng: Rng): EdgeShape => {
  const character = rng();
  const baseNeck = 0.075 + character * 0.06;
  const baseOver = 0.055 + (1 - character) * 0.095;
  const baseDepth = 0.88 + rng() * 0.26;
  const shift = (rng() - 0.5) * 0.26;
  return {
    sign: rng() < 0.5 ? -1 : 1,
    shift,
    neckL: jitter(rng, baseNeck, 0.045),
    neckR: jitter(rng, baseNeck, 0.045),
    overL: Math.max(0.025, jitter(rng, baseOver, 0.07)),
    overR: Math.max(0.025, jitter(rng, baseOver, 0.07)),
    depthL: Math.max(0.65, jitter(rng, baseDepth, 0.2)),
    depthR: Math.max(0.65, jitter(rng, baseDepth, 0.2)),
  };
};

const PEAK = 0.75;

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

const edgeLeft = (L: number, T: number, e: EdgeShape) => {
  if (e.sign === 0) return `l ${-L} 0`;
  const cx = L * (0.5 + e.shift);
  const preEnd = cx - L * e.neckL;
  const postStart = cx + L * e.neckR;
  const span = postStart - preEnd;
  const cpYL = (e.sign * T * e.depthL) / PEAK;
  const cpYR = (e.sign * T * e.depthR) / PEAK;
  return (
    `l ${-(L - postStart)} 0 ` +
    `c ${L * e.overR} ${cpYR} ${-(span + L * e.overL)} ${cpYL} ${-span} 0 ` +
    `l ${-preEnd} 0`
  );
};

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

export function PuzzleBoard({ puzzle, seed, initialSession, onComplete, onExit }: Props) {
  useSoundTheme("puzzle");
  const total = pieceCount(puzzle);
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justDraggedRef = useRef(false);
  const audio = useAudio();
  const { lang, t } = useSettings();
  const localizedTitle = localizeSceneTitle(puzzle.slug, lang);
  const localizedVerse = localizeVerse(puzzle.verse, lang);


  // Boost music volume while playing; restore menu volume on exit.
  useEffect(() => {
    audio.setScope("puzzle");
    return () => audio.setScope("menu");
  }, [audio]);

  // Two independent seeded streams so shuffle order and edge shapes
  // both stay stable across resumes without coupling to each other.
  const shuffleRng = useMemo(() => mulberry32(seed ^ 0x9e3779b9), [seed]);
  const edgeRng = useMemo(() => mulberry32(seed ^ 0x85ebca6b), [seed]);

  const [pieces, setPieces] = useState<Piece[]>(() => {
    const placedSet = new Set(initialSession?.placedIds ?? []);
    const arr: Piece[] = [];
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const id = r * puzzle.cols + c;
        arr.push({ id, row: r, col: c, placed: placedSet.has(id) });
      }
    }
    // Seeded Fisher–Yates so tray order is stable per seed.
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(shuffleRng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const edgeData = useMemo(() => {
    const eH: EdgeShape[][] = [];
    for (let r = 0; r < puzzle.rows - 1; r++) {
      const row: EdgeShape[] = [];
      for (let c = 0; c < puzzle.cols; c++) row.push(randEdge(edgeRng));
      eH.push(row);
    }
    const eV: EdgeShape[][] = [];
    for (let r = 0; r < puzzle.rows; r++) {
      const row: EdgeShape[] = [];
      for (let c = 0; c < puzzle.cols - 1; c++) row.push(randEdge(edgeRng));
      eV.push(row);
    }
    return { eH, eV };
  }, [puzzle.id, puzzle.rows, puzzle.cols, edgeRng]);

  const flipSign = (e: EdgeShape): EdgeShape => ({ ...e, sign: -e.sign });

  const edgesFor = (r: number, c: number) => ({
    top: r === 0 ? FLAT : flipSign(edgeData.eH[r - 1][c]),
    bottom: r === puzzle.rows - 1 ? FLAT : edgeData.eH[r][c],
    left: c === 0 ? FLAT : flipSign(edgeData.eV[r][c - 1]),
    right: c === puzzle.cols - 1 ? FLAT : edgeData.eV[r][c],
  });

  const [pending, setPending] = useState<PendingPointer | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });
  const [hint, setHint] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(initialSession?.hintsUsed ?? 0);
  // startTime is shifted back by the saved elapsed seconds so the timer
  // continues from where the player left off. It does NOT keep counting
  // while the app is closed — savedAt is not used to advance time.
  const initialElapsedRef = useRef(initialSession?.elapsedSec ?? 0);
  const [startTime] = useState(() => Date.now() - initialElapsedRef.current * 1000);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [elapsed, setElapsed] = useState(initialElapsedRef.current);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [shakeId, setShakeId] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const padding = 16;
      const trayH = window.innerWidth < 640 ? 130 : 150;
      const headerH = 64;
      // the painted panel around the board takes FRAME on each side
      const availH = window.innerHeight - headerH - trayH - padding * 3 - FRAME * 2;
      const availW = container.clientWidth - padding * 2 - FRAME * 2;
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

  // Persist session whenever placed pieces change (and we're not done).
  // Cheap — localStorage write of a small JSON object.
  const doneRef = useRef(false);
  doneRef.current = done;
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;
  const hintsRef = useRef(hintsUsed);
  hintsRef.current = hintsUsed;

  useEffect(() => {
    if (done) return;
    const placedIds = pieces.filter((p) => p.placed).map((p) => p.id);
    saveSession(puzzle.id, {
      placedIds,
      elapsedSec: Math.floor((Date.now() - startTime) / 1000),
      hintsUsed,
      seed,
      savedAt: Date.now(),
    });
  }, [pieces, done, puzzle.id, startTime, hintsUsed, seed]);

  // Save once more on unmount (e.g. browser tab close) so the very latest
  // elapsed time is captured if the user leaves mid-second.
  useEffect(() => {
    return () => {
      if (doneRef.current) return;
      const placedIds = piecesRef.current.filter((p) => p.placed).map((p) => p.id);
      saveSession(puzzle.id, {
        placedIds,
        elapsedSec: Math.floor((Date.now() - startTime) / 1000),
        hintsUsed: hintsRef.current,
        seed,
        savedAt: Date.now(),
      });
    };
  }, [puzzle.id, seed, startTime]);


  const pieceW = boardSize.w / puzzle.cols;
  const pieceH = boardSize.h / puzzle.rows;
  const tab = Math.min(pieceW, pieceH) * TAB_RATIO;
  const paddedW = pieceW + 2 * tab;
  const paddedH = pieceH + 2 * tab;

  const trayPieces = useMemo(() => pieces.filter((p) => !p.placed), [pieces]);
  const placedCount = total - trayPieces.length;

  const trayPieceSize = window.innerWidth < 640 ? 88 : 100;

  const toggleSelect = (pieceId: number) => {
    setSelectedId((cur) => (cur === pieceId ? null : pieceId));
  };

  const triggerShake = (pieceId: number) => {
    setShakeId(pieceId);
    audio.playIncorrect();
    setTimeout(() => setShakeId((s) => (s === pieceId ? null : s)), 500);
  };

  // Pointer handlers — covers both drag-and-drop and tap-to-select
  useEffect(() => {
    if (!pending && !drag) return;
    const move = (e: PointerEvent) => {
      if (drag) {
        e.preventDefault();
        setDrag((d) => (d ? { ...d, pointerX: e.clientX, pointerY: e.clientY } : d));
        return;
      }
      if (pending) {
        const dx = e.clientX - pending.startX;
        const dy = e.clientY - pending.startY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          // Promote to drag
          setDrag({
            pieceId: pending.pieceId,
            fromTray: pending.fromTray,
            pointerX: e.clientX,
            pointerY: e.clientY,
            offsetX: pending.offsetX,
            offsetY: pending.offsetY,
          });
          setPending(null);
          // Dragging a piece cancels tap-selection
          setSelectedId(null);
        }
      }
    };
    const up = (e: PointerEvent) => {
      if (drag) {
        const d = drag;
        const board = boardRef.current?.getBoundingClientRect();
        const piece = pieces.find((p) => p.id === d.pieceId);
        if (board && piece && boardSize.w > 0) {
          const ratio = d.fromTray ? paddedW / trayPieceSize : 1;
          const paddedLeft = e.clientX - d.offsetX * ratio;
          const paddedTop = e.clientY - d.offsetY * ratio;
          const innerLeft = paddedLeft + tab;
          const innerTop = paddedTop + tab;
          const targetX = board.left + piece.col * pieceW;
          const targetY = board.top + piece.row * pieceH;
          const dx = innerLeft - targetX;
          const dy = innerTop - targetY;
          const snap = Math.min(pieceW, pieceH) * 0.5;
          if (Math.abs(dx) < snap && Math.abs(dy) < snap) {
            setPieces((prev) => prev.map((p) => (p.id === piece.id ? { ...p, placed: true } : p)));
            audio.playCorrect();
          }
        }
        setDrag(null);
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 150);
      } else if (pending) {
        // Treat as a tap — toggle selection of this piece
        toggleSelect(pending.pieceId);
        setPending(null);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [pending, drag, pieces, pieceW, pieceH, tab, paddedW, trayPieceSize, boardSize.w]);

  useEffect(() => {
    if (done) return;
    if (placedCount === total && total > 0) {
      const t = Math.floor((Date.now() - startTime) / 1000);
      const s = computeStars(total, hintsUsed, t);
      setStars(s);
      setDone(true);
      setTimeout(() => {
        audio.playWin();
        onComplete(s, t);
      }, 300);
    }
  }, [placedCount, total, hintsUsed, startTime, done, onComplete]);

  const startPointer = (e: React.PointerEvent, pieceId: number, fromTray: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPending({
      pieceId,
      fromTray,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleBoardClick = (e: React.MouseEvent) => {
    if (justDraggedRef.current) return;
    if (selectedId == null) return;
    const piece = pieces.find((p) => p.id === selectedId);
    if (!piece || piece.placed) return;
    const board = boardRef.current?.getBoundingClientRect();
    if (!board) return;
    const cx = board.left + piece.col * pieceW + pieceW / 2;
    const cy = board.top + piece.row * pieceH + pieceH / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const tolerance = Math.min(pieceW, pieceH) * 0.65;
    if (dist < tolerance) {
      setPieces((prev) => prev.map((p) => (p.id === selectedId ? { ...p, placed: true } : p)));
      setSelectedId(null);
      audio.playCorrect();
    } else {
      triggerShake(selectedId);
    }
  };

  const useHint = () => {
    const candidate = trayPieces[0];
    if (!candidate) return;
    setHint(candidate.id);
    setHintsUsed((n) => n + 1);
    setTimeout(() => setHint(null), 2000);
  };

  const renderPieceSvg = (
    p: Piece,
    width: number,
    height: number,
    opts?: { dim?: boolean },
  ) => {
    const edges = edgesFor(p.row, p.col);
    const d = buildPiecePath(pieceW, pieceH, tab, edges);
    const clipId = `clip-${puzzle.id}-${p.id}`;
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
          aria-label={t("puzzle.menu")}
          className="grid h-12 w-12 shrink-0 place-items-center transition active:scale-90"
        >
          <img src={homeArt} alt="" draggable={false} className="h-full w-full select-none drop-shadow-[0_2px_4px_oklch(0.3_0.06_50/0.35)]" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="truncate font-display text-base leading-tight sm:text-lg">{localizedTitle}</h2>
          <p className="text-xs text-muted-foreground">
            {placedCount} / {total} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </p>
        </div>
        <button
          onClick={useHint}
          disabled={trayPieces.length === 0}
          aria-label={t("puzzle.hint")}
          className="grid h-12 w-12 shrink-0 place-items-center transition active:scale-90 disabled:opacity-40"
        >
          <img src={hintArt} alt="" draggable={false} className="h-full w-full select-none drop-shadow-[0_2px_4px_oklch(0.3_0.06_50/0.35)]" />
        </button>
      </div>


      {/* Board, on a painted panel */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="paint-box paint-tall" style={{ padding: FRAME }}>
          <div
            ref={boardRef}
            onClick={handleBoardClick}
            className="relative overflow-visible rounded-xl bg-[oklch(0.94_0.02_75)] shadow-[inset_0_1px_6px_oklch(0.4_0.06_50/0.25)]"
            style={{
              width: boardSize.w,
              height: boardSize.h,
              backgroundImage: `linear-gradient(oklch(0.97 0.015 80 / 0.75), oklch(0.97 0.015 80 / 0.75)), url(${puzzle.image})`,
              backgroundSize: `cover, ${boardSize.w}px ${boardSize.h}px`,
              backgroundPosition: "center, top left",
              cursor: selectedId != null ? "crosshair" : "default",
            }}
          >
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

            {done && (
              <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-[oklch(0.97_0.015_80/0.9)] p-6 text-center">
                <div className="mb-2 text-5xl">
                  {"⭐".repeat(stars)}
                  {"☆".repeat(3 - stars)}
                </div>
                <h3 className="font-display text-2xl">{t("puzzle.done")}</h3>
                <p className="mt-1 text-sm italic text-muted-foreground">"{localizedVerse}"</p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={onExit}
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm active:scale-95"
                  >
                    {t("puzzle.continue")}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tray */}
      <div className="paint-box paint-long mx-2 mb-2">
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3"
          style={{ minHeight: trayPieceSize + 24 }}
        >
          {trayPieces.length === 0 && !done && (
            <p className="w-full text-center text-sm text-muted-foreground">{t("puzzle.allPlaced")}</p>
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
              const isSelected = selectedId === p.id;
              const isShaking = shakeId === p.id;
              return (
                <div
                  key={p.id}
                  onPointerDown={(e) => startPointer(e, p.id, true)}
                  className={`no-select piece-shadow shrink-0 cursor-grab transition-transform active:cursor-grabbing ${
                    isSelected ? "piece-selected" : ""
                  } ${isShaking ? "piece-shake" : ""}`}
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
      </div>

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
