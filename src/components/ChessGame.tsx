import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  computerMove,
  inCheck,
  legalMoves,
  other,
  outcome,
  play,
  startPosition,
  type Kind,
  type Move,
  type Piece,
  type Position,
  type Side,
} from "@/lib/chess";
import type { Story } from "@/lib/stories";
import { useBackButton } from "@/lib/back-button";
import { StoryQuiz, randomStory } from "@/components/StoryQuiz";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import {
  BackButton,
  LevelList,
  MenuScreen,
  ResultCard,
  ScreenFade,
  loadBest,
  saveBest,
} from "@/components/GameShell";

import ntKing from "@/assets/chess/nt-king.webp";
import ntQueen from "@/assets/chess/nt-queen.webp";
import ntBishop from "@/assets/chess/nt-bishop.webp";
import ntKnight from "@/assets/chess/nt-knight.webp";
import ntRook from "@/assets/chess/nt-rook.webp";
import ntPawn from "@/assets/chess/nt-pawn.webp";
import otKing from "@/assets/chess/ot-king.webp";
import otQueen from "@/assets/chess/ot-queen.webp";
import otBishop from "@/assets/chess/ot-bishop.webp";
import otKnight from "@/assets/chess/ot-knight.webp";
import otRook from "@/assets/chess/ot-rook.webp";
import otPawn from "@/assets/chess/ot-pawn.webp";
import chessBg from "@/assets/chess-bg.webp";
import boardArt from "@/assets/chess-board.webp";
import { ChessIcon, NoteIcon } from "@/components/Icons";

const ART: Record<string, string> = {
  "nt-k": ntKing,
  "nt-q": ntQueen,
  "nt-b": ntBishop,
  "nt-n": ntKnight,
  "nt-r": ntRook,
  "nt-p": ntPawn,
  "ot-k": otKing,
  "ot-q": otQueen,
  "ot-b": otBishop,
  "ot-n": otKnight,
  "ot-r": otRook,
  "ot-p": otPawn,
};

const KINDS: Kind[] = ["k", "q", "r", "b", "n", "p"];
const BEST_KEY = "chess-wins-v1";

export function ChessGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("chess");
  const { lang, t } = useSettings();
  const [game, setGame] = useState<{ players: number; level: DifficultyId } | null>(null);
  const [choosingLevel, setChoosingLevel] = useState(false);
  const [wins, setWins] = useState(() => loadBest(BEST_KEY));
  const ct = (k: string) => gameText(lang, k);

  useBackButton(game !== null || choosingLevel, () => {
    if (game) setGame(null);
    else setChoosingLevel(false);
  });

  if (game) {
    return (
      <ChessBoard
        players={game.players}
        level={game.level}
        onExit={() => setGame(null)}
        onWin={() => setWins(saveBest(BEST_KEY, game.level, 3))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.chess")}
      subtitle={ct("chess.instruction")}
      background={chessBg}
      onBack={choosingLevel ? () => setChoosingLevel(false) : onBack}
      backLabel={t("select.back")}
    >
      {choosingLevel ? (
        <>
          <p className="mb-3 text-center text-sm font-semibold">{ct("chess.youPlay")}</p>
          <LevelList
            describe={(id) => ct(`chess.lvl.${id}`)}
            picture={(_, i) => (
              <span className="absolute inset-0 bg-[#f3e3c3] p-1">
                <img
                  src={ART[`ot-${["p", "n", "b", "q", "k"][i]}`]}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
            )}
            best={(id) => wins[id] ?? 0}
            onPick={(level) => setGame({ players: 1, level })}
          />
        </>
      ) : (
        <>
          <div className="grid gap-3">
            <button
              onClick={() => setChoosingLevel(true)}
              className="paint-box paint-square flex items-center gap-4 p-4 text-left transition active:scale-[0.98]"
            >
              <PieceFigure side="nt" kind="k" size={60} fx />
              <span className="font-display text-xl">{ct("dom.vsComputer")}</span>
            </button>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                setGame({ players: 2, level: "medium" });
              }}
              className="paint-box paint-square flex items-center gap-4 p-4 text-left transition active:scale-[0.98]"
            >
              <span className="flex -space-x-3">
                <PieceFigure side="nt" kind="k" size={60} fx />
                <PieceFigure side="ot" kind="k" size={60} fx />
              </span>
              <span className="font-display text-xl">
                {memText(lang, "mem.playersMany").replace("{n}", "2")}
              </span>
            </button>
          </div>
          <p className="paint-box paint-long mt-4 px-5 py-3.5 text-center text-sm text-foreground/80">
            {ct("chess.captureRule")}
          </p>
          <PieceGuide />
        </>
      )}
    </MenuScreen>
  );
}

// Every piece of both teams with how it moves.
function PieceGuide() {
  const { lang } = useSettings();
  const ct = (k: string) => gameText(lang, k);
  return (
    <div className="paint-box paint-tall mt-5 p-5">
      <h3 className="font-display text-lg">{ct("chess.pieces")}</h3>
      <div className="mt-3 grid gap-2">
        {KINDS.map((kind) => (
          <div key={kind} className="flex items-center gap-3 rounded-2xl bg-card/70 p-2">
            <PieceFigure side="nt" kind={kind} size={62} fx />
            <PieceFigure side="ot" kind={kind} size={62} fx />
            <div className="min-w-0 flex-1 text-sm leading-snug">
              <p className="font-semibold">
                {ct(`chess.role.${kind}`)} ·{" "}
                <span className="font-normal">{ct(`chess.name.nt-${kind}`)}</span> /{" "}
                <span className="font-normal">{ct(`chess.name.ot-${kind}`)}</span>
              </p>
              <p className="text-xs text-muted-foreground">{ct(`chess.move.${kind}`)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// A piece: the character standing on its team's pedestal (light wood for the
// New Testament, black for the Old), with the chess symbol in a corner so
// children can tell how it moves. With a size it is that tall; without, it
// fills its box, standing on the box's bottom edge.
function PieceFigure({
  side,
  kind,
  size,
  fx = false,
}: {
  side: Side;
  kind: Kind;
  size?: number;
  fx?: boolean;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-end justify-center ${size ? "" : "h-full w-full"}`}
      style={
        size
          ? { height: size, width: size * 0.62, containerType: "inline-size" }
          : { containerType: "inline-size" }
      }
    >
      {fx && <PieceFx side={side} kind={kind} layer="back" />}
      <img
        src={ART[`${side}-${kind}`]}
        alt=""
        draggable={false}
        className={`block h-full w-full select-none object-contain object-bottom ${
          fx && side === "nt" && kind === "k"
            ? "fx-glow"
            : "drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]"
        }`}
      />
      <span
        className={`absolute bottom-0 right-0 grid aspect-square place-items-center rounded-full leading-none shadow ${
          side === "nt" ? "bg-[#fff4e4] text-[#9b2a1c]" : "bg-[#1f2f6e] text-[#eef2ff]"
        }`}
        style={
          size ? { width: size * 0.3, fontSize: size * 0.22 } : { width: "34%", fontSize: "24cqw" }
        }
      >
        {/* the usual chess piece, so children can tell how it moves */}
        <ChessIcon kind={kind} />
      </span>
      {fx && <PieceFx side={side} kind={kind} layer="front" />}
    </span>
  );
}

// Places in the figure's box (in %) and timings of each character's effect.
type Spot = { x: number; y: number; d: number; dx?: number };
const FLAMES: Spot[] = [
  { x: 34, y: 30, d: 0, dx: -4 },
  { x: 44, y: 24, d: 0.35, dx: -2 },
  { x: 54, y: 22, d: 0.7, dx: 3 },
  { x: 63, y: 27, d: 0.15, dx: 5 },
  { x: 49, y: 26, d: 0.55, dx: 0 },
  { x: 71, y: 36, d: 0.85, dx: 6 },
];
const EMBERS: Spot[] = [
  { x: 40, y: 24, d: 0.2, dx: -8 },
  { x: 58, y: 22, d: 0.9, dx: 6 },
  { x: 67, y: 30, d: 1.4, dx: 10 },
];
const SMOKE: Spot[] = [
  { x: 50, y: 36, d: 0, dx: 6 },
  { x: 46, y: 36, d: 0.9, dx: -5 },
  { x: 54, y: 36, d: 1.8, dx: 9 },
  { x: 50, y: 36, d: 2.7, dx: -2 },
];
const NOTES: (Spot & { beamed: boolean })[] = [
  { x: 80, y: 52, d: 0, dx: 14, beamed: false },
  { x: 78, y: 56, d: 1, dx: 22, beamed: true },
  { x: 82, y: 50, d: 2, dx: 8, beamed: false },
  { x: 76, y: 54, d: 1.5, dx: 18, beamed: true },
];

const fxStyle = (p: Spot) =>
  ({
    "--x": `${p.x}%`,
    "--y": `${p.y}%`,
    "--d": `${p.d}s`,
    "--dx": `${p.dx ?? 0}cqw`,
  }) as React.CSSProperties;

// Little touches of life: Elijah's chariot horse burns, the smoke of the
// sacrifice rises from the Temple, Jesus shines and David plays his harp.
// Drawn behind the figure ("back") or over it ("front").
function PieceFx({ side, kind, layer }: { side: Side; kind: Kind; layer: "back" | "front" }) {
  const who = `${side}-${kind}`;
  if (who === "ot-n")
    return layer === "back" ? (
      <>
        {FLAMES.map((p, i) => (
          <span key={i} className="fx fx-flame" style={fxStyle(p)} />
        ))}
      </>
    ) : (
      <>
        {EMBERS.map((p, i) => (
          <span key={i} className="fx fx-ember" style={fxStyle(p)} />
        ))}
      </>
    );
  if (who === "nt-r" && layer === "front")
    return (
      <>
        {SMOKE.map((p, i) => (
          <span key={i} className="fx fx-smoke" style={fxStyle(p)} />
        ))}
      </>
    );
  if (who === "nt-k" && layer === "back")
    return (
      <>
        <span className="fx fx-rays" style={fxStyle({ x: 50, y: 34, d: 0 })} />
        <span className="fx fx-halo" style={fxStyle({ x: 50, y: 34, d: 0 })} />
      </>
    );
  if (who === "ot-k" && layer === "front")
    return (
      <>
        {NOTES.map((p, i) => (
          <span key={i} className="fx fx-note" style={fxStyle(p)}>
            <NoteIcon beamed={p.beamed} />
          </span>
        ))}
      </>
    );
  return null;
}

// Where the squares are on the board picture, in % of its width and height.
const COLS = [7.03, 17.26, 28.04, 38.81, 49.77, 60.55, 71.51, 82.28, 92.97];
const ROWS = [6.85, 17.59, 28.52, 39.26, 49.81, 60.56, 71.02, 81.57, 92.31];

const square = (sq: number) => {
  const r = Math.floor(sq / 8);
  const c = sq % 8;
  return {
    left: `${COLS[c]}%`,
    top: `${ROWS[r]}%`,
    width: `${COLS[c + 1] - COLS[c]}%`,
    height: `${ROWS[r + 1] - ROWS[r]}%`,
  };
};

// A figure is almost twice as tall as its square and stands near the square's
// bottom edge; lower rows are drawn in front.
const figureBox = (sq: number) => {
  const r = Math.floor(sq / 8);
  const h = ROWS[r + 1] - ROWS[r];
  return { ...square(sq), top: `${ROWS[r] - 0.83 * h}%`, height: `${1.75 * h}%`, zIndex: 10 + r };
};

// The squares a piece passes through on its way (the knight goes two squares
// one way, then one to the side) and how long the trip takes.
function travel(from: number, to: number, kind: Kind) {
  const [r0, c0, r1, c1] = [Math.floor(from / 8), from % 8, Math.floor(to / 8), to % 8];
  const turn = Math.abs(r1 - r0) === 2 ? r1 * 8 + c0 : r0 * 8 + c1;
  const path = kind === "n" ? [from, turn, to] : [from, to];
  const steps = kind === "n" ? 3 : Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  return { path, ms: Math.min(1100, 260 + 160 * steps) };
}

// A piece on the board. When its square changes it travels there, lifted a
// little, so children can follow the move.
function BoardPiece({ piece, sq }: { piece: Piece; sq: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const was = useRef(sq);
  useLayoutEffect(() => {
    const from = was.current;
    was.current = sq;
    const el = ref.current;
    if (from === sq || !el?.animate) return;
    const { path, ms } = travel(from, sq, piece.kind);
    const legs = path.slice(1).map((s, i) => {
      const a = path[i];
      return Math.max(Math.abs((s >> 3) - (a >> 3)), Math.abs((s & 7) - (a & 7)));
    });
    const total = legs.reduce((a, b) => a + b, 0);
    let done = 0;
    const frames = path.map((s, i) => {
      if (i > 0) done += legs[i - 1];
      const box = figureBox(s);
      return { left: box.left, top: box.top, zIndex: 60, offset: done / total };
    });
    const glide = el.animate(frames, { duration: ms, easing: "ease-in-out" });
    const lift = el.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: `translateY(-${piece.kind === "n" ? 22 : 10}%) scale(1.08)` },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: ms, easing: "ease-in-out" },
    );
    return () => {
      glide.cancel();
      lift.cancel();
    };
  }, [sq, piece.kind]);
  return (
    <span ref={ref} className="pointer-events-none absolute" style={figureBox(sq)}>
      <PieceFigure side={piece.side} kind={piece.kind} fx />
    </span>
  );
}

// A captured piece waits on its square until the attacker lands, then spins
// away in a burst of light.
function CaptureBurst({ piece, sq, delay }: { piece: Piece; sq: number; delay: number }) {
  return (
    <>
      <span className="pointer-events-none absolute" style={figureBox(sq)}>
        <span className="chess-victim block h-full w-full" style={{ animationDelay: `${delay}ms` }}>
          <PieceFigure side={piece.side} kind={piece.kind} />
        </span>
      </span>
      <span
        className="pointer-events-none absolute"
        style={{ ...figureBox(sq), zIndex: 70, animationDelay: `${delay}ms` }}
      >
        <span className="chess-flash" />
        <span className="chess-ring" />
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="chess-spark" style={{ rotate: `${i * 36 + 18}deg` }} />
        ))}
      </span>
    </>
  );
}

function ChessBoard({
  players,
  level,
  onExit,
  onWin,
}: {
  players: number;
  level: DifficultyId;
  onExit: () => void;
  onWin: () => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const ct = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const vsComputer = players === 1;

  const [pos, setPos] = useState<Position>(startPosition);
  const [selected, setSelected] = useState<number | null>(null);
  const [last, setLast] = useState<Move | null>(null);
  const [taken, setTaken] = useState<Piece[]>([]);
  const [bursts, setBursts] = useState<{ piece: Piece; sq: number; delay: number }[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  // A capture waits for its story question; a miss loses the turn.
  const [quiz, setQuiz] = useState<{ move: Move; story: Story } | null>(null);
  const [ended, setEnded] = useState<"checkmate" | "stalemate" | "draw" | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const team = (s: Side) => ct(s === "nt" ? "chess.nt" : "chess.ot");
  const moves = ended ? [] : legalMoves(pos);
  const mine = (sq: number) =>
    pos.board[sq]?.side === pos.turn && !(vsComputer && pos.turn === "ot");
  const targets = selected === null ? [] : moves.filter((m) => m.from === selected);

  // The captured piece goes to the tray once the attacker has landed on it.
  const capture = (victim: Piece, sq: number, ms: number) => {
    setBursts((list) => [...list, { piece: victim, sq, delay: ms }]);
    later(() => setTaken((list) => [...list, victim]), ms);
    later(() => setBursts((list) => list.filter((b) => b.piece.id !== victim.id)), ms + 1100);
  };

  const apply = (m: Move) => {
    const capturedSq = m.enPassant ? m.from - (m.from % 8) + (m.to % 8) : m.to;
    const victim = pos.board[capturedSq];
    const mover = pos.board[m.from]!;
    const next = play(pos, m);
    const { ms } = travel(m.from, m.to, mover.kind);
    setPos(next);
    setLast(m);
    setSelected(null);
    if (victim) capture(victim, capturedSq, ms);
    const result = outcome(next);
    if (m.promote) setNote(ct("chess.promoted", { name: ct(`chess.name.${mover.side}-q`) }));
    else setNote(null);
    if (result !== "play") {
      // the game ends once the last move has landed
      later(() => {
        setEnded(result);
        if (result === "checkmate") {
          const winner = pos.turn;
          if (!vsComputer || winner === "nt") audio.playWin();
          else audio.playIncorrect();
          if (vsComputer && winner === "nt") onWin();
        }
      }, ms + 400);
      return;
    }
    if (victim)
      later(() => {
        audio.playCorrect();
        audio.play("chess-sparkle", 0.7);
      }, ms);
    else audio.playClick();
    if (inCheck(next)) later(() => audio.play("chess-check"), ms + 120);
    // let the board show the move before the computer starts thinking
    if (vsComputer && next.turn === "ot") computerReply(next, ms + 250);
  };

  // A capture needs its story named first, unless the king is in check
  // (then the move is needed to get out of it).
  const asksFirst = (base: Position, m: Move) =>
    (!!base.board[m.to] || !!m.enPassant) && !inCheck(base);

  const computerReply = (base: Position, wait: number) => {
    setThinking(true);
    later(() => {
      const reply = computerMove(base, level);
      setThinking(false);
      if (!reply) return;
      // the computer knows most stories, not all of them
      if (asksFirst(base, reply) && Math.random() >= 0.75) skipTurn(base, ct("dom.computerMissed"));
      else applyFrom(base, reply);
    }, wait);
  };

  // No move this turn: the other team plays next.
  const skipTurn = (base: Position, text: string) => {
    const next: Position = { ...base, turn: other(base.turn), enPassant: null };
    setPos(next);
    setSelected(null);
    setNote(text);
    audio.playIncorrect();
    const result = outcome(next);
    if (result !== "play") {
      later(() => setEnded(result), 400);
      return;
    }
    if (vsComputer && next.turn === "ot") computerReply(next, 700);
  };

  const answer = (right: boolean) => {
    const m = quiz?.move;
    setQuiz(null);
    if (!m) return;
    if (right) apply(m);
    else skipTurn(pos, ct("chess.captureMissed"));
  };

  // The computer's reply is played on the position it was thinking about.
  const applyFrom = (base: Position, m: Move) => {
    const capturedSq = m.enPassant ? m.from - (m.from % 8) + (m.to % 8) : m.to;
    const victim = base.board[capturedSq];
    const mover = base.board[m.from]!;
    const next = play(base, m);
    const { ms } = travel(m.from, m.to, mover.kind);
    setPos(next);
    setLast(m);
    if (victim) capture(victim, capturedSq, ms);
    setNote(m.promote ? ct("chess.promoted", { name: ct(`chess.name.${mover.side}-q`) }) : null);
    const result = outcome(next);
    if (result !== "play") {
      later(() => {
        setEnded(result);
        if (result === "checkmate") audio.playIncorrect();
      }, ms + 400);
      return;
    }
    if (victim) later(() => audio.playIncorrect(), ms);
    else audio.playClick();
    if (inCheck(next)) later(() => audio.play("chess-check"), ms + 120);
  };

  const tap = (sq: number) => {
    if (ended || thinking || quiz) return;
    const target = targets.find((m) => m.to === sq);
    if (target && asksFirst(pos, target)) {
      setQuiz({ move: target, story: randomStory() });
      return;
    }
    if (target) return apply(target);
    if (mine(sq)) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPos(startPosition());
    setSelected(null);
    setLast(null);
    setTaken([]);
    setBursts([]);
    setNote(null);
    setThinking(false);
    setQuiz(null);
    setEnded(null);
  };

  const check = !ended && inCheck(pos);
  const kingSq = pos.board.findIndex((p) => p?.side === pos.turn && p.kind === "k");
  const chosen = selected !== null ? pos.board[selected] : null;

  let status: string;
  if (thinking) status = ct("dom.thinking");
  else if (check) status = `${ct("chess.check")} ${ct("chess.turn", { team: team(pos.turn) })}`;
  else status = ct("chess.turn", { team: team(pos.turn) });

  // All pieces, keyed by id and always in the same order, so a piece keeps
  // its element and can travel from square to square.
  const pieces = pos.board
    .flatMap((p, sq) => (p ? [{ p, sq }] : []))
    .sort((a, b) => a.p.id - b.p.id);

  const tray = (side: Side) => (
    <div className="flex min-h-7 flex-wrap items-center gap-1 px-1">
      <span className="mr-1 text-xs font-semibold text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
        {team(side)}
      </span>
      {taken
        .filter((p) => p.side !== side)
        .map((p) => (
          <PieceFigure key={p.id} side={p.side} kind={p.kind} size={30} />
        ))}
    </div>
  );

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={chessBg} fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-3 py-3">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={ct("dom.players")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.chess")}
            {vsComputer ? ` · ${t(`diff.${level}`)}` : ""}
          </h1>
        </header>

        {tray("ot")}

        {/* The board: the Old Testament at the top, the New at the bottom */}
        <div className="relative mx-auto mb-1 mt-7 aspect-[1095/1080] w-full max-w-[min(100%,64dvh)] drop-shadow-[0_14px_22px_oklch(0.25_0.05_50/0.45)]">
          <img
            src={boardArt}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {Array.from({ length: 64 }, (_, sq) => {
            const isLast = last && (last.from === sq || last.to === sq);
            const target = targets.find((m) => m.to === sq);
            return (
              <button
                key={sq}
                onClick={() => tap(sq)}
                aria-label={`${"abcdefgh"[sq % 8]}${8 - Math.floor(sq / 8)}`}
                className="absolute"
                style={square(sq)}
              >
                {isLast && <span className="absolute inset-0 bg-[oklch(0.85_0.13_90/0.45)]" />}
                {selected === sq && (
                  <span className="absolute inset-0 bg-[oklch(0.8_0.14_80/0.7)]" />
                )}
                {check && sq === kingSq && (
                  <span className="absolute inset-0 bg-[radial-gradient(circle,oklch(0.6_0.22_25/0.85),transparent_70%)]" />
                )}
                {target && (
                  <span
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      pos.board[sq] || target.enPassant
                        ? "h-[92%] w-[92%] border-[4px] border-[oklch(0.45_0.13_150/0.8)]"
                        : "h-[30%] w-[30%] bg-[oklch(0.45_0.13_150/0.6)]"
                    }`}
                  />
                )}
              </button>
            );
          })}
          {bursts.map((b) => (
            <CaptureBurst key={b.piece.id} {...b} />
          ))}
          {pieces.map(({ p, sq }) => (
            <BoardPiece key={p.id} piece={p} sq={sq} />
          ))}
        </div>

        {tray("nt")}

        <div className="paint-box paint-long paint-thin mt-2 px-4 py-2.5">
          <p
            className={`text-center text-sm font-semibold ${check ? "text-[oklch(0.55_0.2_25)]" : ""}`}
            aria-live="polite"
          >
            {status}
          </p>
          {note && (
            <p className="text-center text-xs font-semibold text-[oklch(0.5_0.13_150)]">{note}</p>
          )}
          {chosen && (
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-card/80 p-2">
              <PieceFigure side={chosen.side} kind={chosen.kind} size={72} fx />
              <div className="min-w-0 text-sm leading-snug">
                <p className="font-semibold">
                  {ct(`chess.name.${chosen.side}-${chosen.kind}`)} ·{" "}
                  {ct(`chess.role.${chosen.kind}`)}
                </p>
                <p className="text-xs text-muted-foreground">{ct(`chess.move.${chosen.kind}`)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {quiz && (
        <StoryQuiz story={quiz.story} reward={ct("chess.captureReward")} onAnswer={answer} />
      )}

      {ended && (
        <ResultCard
          top={ended === "checkmate" ? (vsComputer && pos.turn === "nt" ? "🤖" : "👑") : "🤝"}
          title={
            ended === "checkmate"
              ? ct("chess.mate", { team: team(pos.turn === "nt" ? "ot" : "nt") })
              : ended === "stalemate"
                ? ct("chess.stalemate")
                : ct("chess.draw")
          }
          replayLabel={ct("dom.replay")}
          onReplay={replay}
          backLabel={ct("dom.players")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
