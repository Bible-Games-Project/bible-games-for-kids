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

// Tiny audio "ding" using WebAudio. No assets needed.
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

export function PuzzleBoard({ puzzle, onComplete, onExit }: Props) {
  const total = pieceCount(puzzle);
  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pieces, setPieces] = useState<Piece[]>(() => {
    const arr: Piece[] = [];
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        arr.push({ id: r * puzzle.cols + c, row: r, col: c, placed: false });
      }
    }
    // shuffle order for tray
    return arr.sort(() => Math.random() - 0.5);
  });

  const [drag, setDrag] = useState<DragState | null>(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });
  const [hint, setHint] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Measure board
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      // available width and height for the board
      const padding = 16;
      const trayH = window.innerWidth < 640 ? 130 : 150;
      const headerH = 64;
      const availH = window.innerHeight - headerH - trayH - padding * 3;
      const availW = container.clientWidth - padding * 2;
      // fit by aspect (portrait)
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

  // Timer
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(i);
  }, [done, startTime]);

  const pieceW = boardSize.w / puzzle.cols;
  const pieceH = boardSize.h / puzzle.rows;

  // Tray pieces (unplaced), in shuffled order
  const trayPieces = useMemo(() => pieces.filter((p) => !p.placed), [pieces]);
  const placedCount = total - trayPieces.length;

  // Tray piece display size
  const trayPieceSize = window.innerWidth < 640 ? 84 : 96;

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
      if (board && piece) {
        // Position the piece's top-left as if dropped:
        const dropX = e.clientX - d.offsetX;
        const dropY = e.clientY - d.offsetY;
        const targetX = board.left + piece.col * pieceW;
        const targetY = board.top + piece.row * pieceH;
        const dx = dropX - targetX;
        const dy = dropY - targetY;
        const snap = Math.min(pieceW, pieceH) * 0.45;
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
  }, [drag, pieces, pieceW, pieceH]);

  // Completion
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

  const bgSize = `${boardSize.w}px ${boardSize.h}px`;

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
          className="relative overflow-hidden rounded-2xl bg-[oklch(0.94_0.02_75)] shadow-[var(--shadow-soft)]"
          style={{
            width: boardSize.w,
            height: boardSize.h,
            backgroundImage: `linear-gradient(oklch(0.97 0.015 80 / 0.6), oklch(0.97 0.015 80 / 0.6)), url(${puzzle.image})`,
            backgroundSize: `cover, ${bgSize}`,
            backgroundPosition: "center, center",
          }}
        >
          {/* Grid lines (subtle) */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30">
            {Array.from({ length: puzzle.cols - 1 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={(i + 1) * pieceW}
                y1={0}
                x2={(i + 1) * pieceW}
                y2={boardSize.h}
                stroke="oklch(0.8 0.04 60)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: puzzle.rows - 1 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={(i + 1) * pieceH}
                x2={boardSize.w}
                y2={(i + 1) * pieceH}
                stroke="oklch(0.8 0.04 60)"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Hint highlight */}
          {hint !== null && (() => {
            const hp = pieces.find((p) => p.id === hint);
            if (!hp) return null;
            return (
              <div
                className="pointer-events-none absolute rounded-md"
                style={{
                  left: hp.col * pieceW,
                  top: hp.row * pieceH,
                  width: pieceW,
                  height: pieceH,
                  boxShadow: "0 0 0 3px oklch(0.82 0.13 85), 0 0 24px oklch(0.82 0.13 85 / 0.6)",
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
            );
          })()}

          {/* Placed pieces */}
          {pieces.filter((p) => p.placed).map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: p.col * pieceW,
                top: p.row * pieceH,
                width: pieceW,
                height: pieceH,
                backgroundImage: `url(${puzzle.image})`,
                backgroundSize: bgSize,
                backgroundPosition: `-${p.col * pieceW}px -${p.row * pieceH}px`,
              }}
            />
          ))}

          {/* Completion overlay */}
          {done && (
            <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-[oklch(0.97_0.015_80/0.85)] p-6 text-center">
              <div className="mb-2 text-5xl">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
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
        ref={trayRef}
        className="paper-card mx-2 mb-2 flex items-center gap-2 overflow-x-auto p-3"
        style={{ minHeight: trayPieceSize + 24 }}
      >
        {trayPieces.length === 0 && !done && (
          <p className="w-full text-center text-sm text-muted-foreground">All pieces placed!</p>
        )}
        {trayPieces.map((p) => {
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
              className="no-select piece-shadow shrink-0 cursor-grab rounded-md transition-transform active:cursor-grabbing active:scale-105"
              style={{
                width: trayPieceSize,
                height: trayPieceSize,
                backgroundImage: `url(${puzzle.image})`,
                backgroundSize: `${trayPieceSize * puzzle.cols}px ${trayPieceSize * puzzle.rows}px`,
                backgroundPosition: `-${p.col * trayPieceSize}px -${p.row * trayPieceSize}px`,
                touchAction: "none",
              }}
            />
          );
        })}
      </div>

      {/* Dragging floating piece */}
      {drag && (() => {
        const p = pieces.find((x) => x.id === drag.pieceId);
        if (!p) return null;
        // Use board piece size while over board area, tray size otherwise — keep board size when drag started from tray for visual consistency.
        const w = pieceW;
        const h = pieceH;
        // scale offset (tray piece was trayPieceSize; remap proportionally)
        const ratioX = drag.fromTray ? w / trayPieceSize : 1;
        const ratioY = drag.fromTray ? h / trayPieceSize : 1;
        const ox = drag.offsetX * ratioX;
        const oy = drag.offsetY * ratioY;
        return (
          <div
            className="pointer-events-none fixed z-50 piece-shadow rounded-md"
            style={{
              left: drag.pointerX - ox,
              top: drag.pointerY - oy,
              width: w,
              height: h,
              backgroundImage: `url(${puzzle.image})`,
              backgroundSize: bgSize,
              backgroundPosition: `-${p.col * pieceW}px -${p.row * pieceH}px`,
              transform: "rotate(-1deg)",
            }}
          />
        );
      })()}
    </div>
  );
}
