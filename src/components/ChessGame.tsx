import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  computerMove,
  inCheck,
  legalMoves,
  outcome,
  play,
  startPosition,
  type Kind,
  type Move,
  type Piece,
  type Position,
  type Side,
} from "@/lib/chess";
import { useBackButton } from "@/lib/back-button";
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
import chessBg from "@/assets/parchis-bg.webp";
import boardArt from "@/assets/chess-board.webp";

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

// The usual chess symbols, so children can tell what each character moves like.
const GLYPH: Record<Side, Record<Kind, string>> = {
  nt: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  ot: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
const KINDS: Kind[] = ["k", "q", "r", "b", "n", "p"];
const BEST_KEY = "chess-wins-v1";

export function ChessGame({ onBack }: { onBack: () => void }) {
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
              className="glass-card flex items-center gap-4 p-4 text-left transition active:scale-[0.98]"
            >
              <PieceFigure side="nt" kind="k" size={60} />
              <span className="text-lg font-semibold">{ct("dom.vsComputer")}</span>
            </button>
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                setGame({ players: 2, level: "medium" });
              }}
              className="glass-card flex items-center gap-4 p-4 text-left transition active:scale-[0.98]"
            >
              <span className="flex -space-x-3">
                <PieceFigure side="nt" kind="k" size={60} />
                <PieceFigure side="ot" kind="k" size={60} />
              </span>
              <span className="text-lg font-semibold">
                {memText(lang, "mem.playersMany").replace("{n}", "2")}
              </span>
            </button>
          </div>
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
    <div className="glass-card mt-5 p-4">
      <h3 className="font-display text-lg">{ct("chess.pieces")}</h3>
      <div className="mt-3 grid gap-2">
        {KINDS.map((kind) => (
          <div key={kind} className="flex items-center gap-3 rounded-2xl bg-card/70 p-2">
            <PieceFigure side="nt" kind={kind} size={62} />
            <PieceFigure side="ot" kind={kind} size={62} />
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
function PieceFigure({ side, kind, size }: { side: Side; kind: Kind; size?: number }) {
  return (
    <span
      className={`relative flex shrink-0 items-end justify-center ${size ? "" : "h-full w-full"}`}
      style={size ? { height: size, width: size * 0.62 } : { containerType: "inline-size" }}
    >
      <img
        src={ART[`${side}-${kind}`]}
        alt=""
        draggable={false}
        className="block h-full w-full select-none object-contain object-bottom drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]"
      />
      <span
        className={`absolute bottom-0 right-0 grid aspect-square place-items-center rounded-full leading-none shadow ${
          side === "nt" ? "bg-[#fff4e4] text-[#9b2a1c]" : "bg-[#1f2f6e] text-[#eef2ff]"
        }`}
        style={
          size ? { width: size * 0.3, fontSize: size * 0.22 } : { width: "34%", fontSize: "24cqw" }
        }
      >
        {GLYPH[side][kind]}
      </span>
    </span>
  );
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
  const [note, setNote] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
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

  const apply = (m: Move) => {
    const capturedSq = m.enPassant ? m.from - (m.from % 8) + (m.to % 8) : m.to;
    const victim = pos.board[capturedSq];
    const mover = pos.board[m.from]!;
    const next = play(pos, m);
    setPos(next);
    setLast(m);
    setSelected(null);
    if (victim) setTaken((list) => [...list, victim]);
    const result = outcome(next);
    if (m.promote) setNote(ct("chess.promoted", { name: ct(`chess.name.${mover.side}-q`) }));
    else setNote(null);
    if (result !== "play") {
      setEnded(result);
      if (result === "checkmate") {
        const winner = pos.turn;
        if (!vsComputer || winner === "nt") audio.playWin();
        else audio.playIncorrect();
        if (vsComputer && winner === "nt") onWin();
      }
      return;
    }
    if (victim) audio.playCorrect();
    else audio.playClick();
    if (vsComputer && next.turn === "ot") {
      setThinking(true);
      // let the board show the move before the computer starts thinking
      later(() => {
        const reply = computerMove(next, level);
        setThinking(false);
        if (reply) applyFrom(next, reply);
      }, 450);
    }
  };

  // The computer's reply is played on the position it was thinking about.
  const applyFrom = (base: Position, m: Move) => {
    const capturedSq = m.enPassant ? m.from - (m.from % 8) + (m.to % 8) : m.to;
    const victim = base.board[capturedSq];
    const mover = base.board[m.from]!;
    const next = play(base, m);
    setPos(next);
    setLast(m);
    if (victim) setTaken((list) => [...list, victim]);
    setNote(m.promote ? ct("chess.promoted", { name: ct(`chess.name.${mover.side}-q`) }) : null);
    const result = outcome(next);
    if (result !== "play") {
      setEnded(result);
      if (result === "checkmate") audio.playIncorrect();
      return;
    }
    if (victim) audio.playIncorrect();
    else audio.playClick();
  };

  const tap = (sq: number) => {
    if (ended || thinking) return;
    const target = targets.find((m) => m.to === sq);
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
    setNote(null);
    setThinking(false);
    setEnded(null);
  };

  const check = !ended && inCheck(pos);
  const kingSq = pos.board.findIndex((p) => p?.side === pos.turn && p.kind === "k");
  const chosen = selected !== null ? pos.board[selected] : null;

  let status: string;
  if (thinking) status = ct("dom.thinking");
  else if (check) status = `${ct("chess.check")} ${ct("chess.turn", { team: team(pos.turn) })}`;
  else status = ct("chess.turn", { team: team(pos.turn) });

  // All pieces, keyed by id so a move glides across the board.
  const pieces = pos.board.flatMap((p, sq) => (p ? [{ p, sq }] : []));

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
          {pieces.map(({ p, sq }) => (
            <span
              key={p.id}
              className="pointer-events-none absolute transition-[left,top] duration-300 ease-out"
              style={figureBox(sq)}
            >
              <PieceFigure side={p.side} kind={p.kind} />
            </span>
          ))}
        </div>

        {tray("nt")}

        <div className="glass-card mt-2 px-3 py-2">
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
              <PieceFigure side={chosen.side} kind={chosen.kind} size={72} />
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
