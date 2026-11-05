import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import {
  CELLS,
  COLS,
  FINISH_AREA,
  LAST,
  LEGEND_AREA,
  ROWS,
  SQUARES,
  ruleFor,
  type Square,
} from "@/lib/goose";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { BackButton, MenuScreen, ResultCard, ScreenFade } from "@/components/GameShell";
import { PAWN_RATIO, PlayerPawn, TOKEN_ORDER } from "@/components/Token";
import { StoryQuiz } from "@/components/StoryQuiz";
import type { Story } from "@/lib/stories";

import gooseBg from "@/assets/goose-bg.webp";

const PLAYERS_KEY = "goose-players-v1";

function loadPlayers(): number {
  try {
    const n = Number(localStorage.getItem(PLAYERS_KEY));
    return n >= 1 && n <= 6 ? n : 2;
  } catch {
    return 2;
  }
}

export function GooseGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("goose");
  const { lang, t } = useSettings();
  const [players, setPlayers] = useState<number | null>(null);
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);
  const last = loadPlayers();

  useBackButton(players !== null, () => setPlayers(null));

  if (players)
    return <GooseBoard key={players} players={players} onExit={() => setPlayers(null)} />;

  const pick = (n: number) => {
    try {
      localStorage.setItem(PLAYERS_KEY, String(n));
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
    setPlayers(n);
  };

  return (
    <MenuScreen
      title={t("game.goose")}
      subtitle={gt("goose.instruction")}
      background={gooseBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <h2 className="text-center font-display text-2xl">{mt("mem.howManyPlayers")}</h2>
      {/* Small boxes with just the pawns, like Memory's */}
      <div className="mx-auto mt-4 grid w-fit grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => pick(n)}
            aria-label={
              n === 1 ? mt("mem.playersOne") : mt("mem.playersMany").replace("{n}", String(n))
            }
            className={`paint-box paint-square paint-thin grid h-24 w-24 place-items-center p-3 transition active:scale-[0.95] ${
              n === last ? "paint-picked" : ""
            }`}
          >
            <span className="flex max-w-[4.2rem] flex-wrap justify-center gap-1">
              {Array.from({ length: n }, (_, i) => (
                <Pawn key={i} index={i} size={16} />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="paint-box paint-wide mt-5 p-5">
        <h3 className="font-display text-lg">{gt("goose.rules")}</h3>
        <ul className="mt-2 space-y-2 text-sm">
          <RuleLine icon={<GooseBadge />} text={gt("goose.ruleGoose")} />
          <RuleLine
            icon={<Badge bg="oklch(0.55 0.11 300)">🪜</Badge>}
            text={gt("goose.ruleLadder")}
          />
          <RuleLine
            icon={<Badge bg="oklch(0.35 0.03 60)">🔒</Badge>}
            text={gt("goose.rulePrison")}
          />
          <RuleLine
            icon={<Badge bg="oklch(0.35 0.07 300)">✝️</Badge>}
            text={gt("goose.ruleDeath")}
          />
          <RuleLine
            icon={<Badge bg="oklch(0.62 0.12 75)">🏆</Badge>}
            text={gt("goose.ruleFinish")}
          />
        </ul>
      </div>
    </MenuScreen>
  );
}

function RuleLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function Badge({
  bg,
  children,
  size = 28,
}: {
  bg: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <span
      className="grid place-items-center rounded-full border-2 border-white shadow"
      style={{ backgroundColor: bg, width: size, height: size, fontSize: size * 0.5 }}
    >
      {children}
    </span>
  );
}

// The New Testament squares play the goose's part; a dove marks them.
const GooseBadge = ({ size = 28 }: { size?: number }) => (
  <Badge bg="oklch(0.79 0.135 76)" size={size}>
    🕊️
  </Badge>
);

// Each player plays with one of the standing pawns.
function Pawn({ index, size }: { index: number; size: number }) {
  return <PlayerPawn color={TOKEN_ORDER[index]} size={size} />;
}

// Three crosses on a hill at dusk, for the square without a painting.
function DeathArt() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d2c5c" />
          <stop offset="0.6" stopColor="#b8605c" />
          <stop offset="1" stopColor="#f0b26c" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-sky)`} />
      <circle cx="50" cy="70" r="16" fill="#ffd9a0" opacity="0.55" />
      <path d="M0 80 Q50 56 100 80 V100 H0Z" fill="#3b2b2e" />
      {[
        [50, 26, 1],
        [24, 44, 0.65],
        [76, 44, 0.65],
      ].map(([x, top, k]) => (
        <g key={x} fill="#2a1d22">
          <rect x={x - 2.5 * k} y={top} width={5 * k} height={44 * k} rx="1" />
          <rect x={x - 11 * k} y={top + 9 * k} width={22 * k} height={4.5 * k} rx="1" />
        </g>
      ))}
    </svg>
  );
}

// ---------- The board ----------
const CELL = 100;
const W = COLS * CELL;
const H = ROWS * CELL;

const centerOf = (n: number) =>
  n === LAST
    ? {
        x: (FINISH_AREA.col + FINISH_AREA.cols / 2) * CELL,
        y: (FINISH_AREA.row + FINISH_AREA.rows / 2) * CELL,
      }
    : { x: CELLS[n].col * CELL + CELL / 2, y: CELLS[n].row * CELL + CELL / 2 };

function Tile({ sq, title }: { sq: Square; title: string }) {
  const { lang } = useSettings();
  const gt = (k: string) => gameText(lang, k);
  const { col, row } = CELLS[sq.n];
  const goose = sq.kind === "goose";
  return (
    <div
      className={`absolute overflow-hidden rounded-xl bg-[oklch(0.97_0.02_85)] shadow-md ${
        goose ? "border-[5px] border-[oklch(0.79_0.135_76)]" : "border-[3px] border-white"
      }`}
      style={{ left: col * CELL + 4, top: row * CELL + 4, width: CELL - 8, height: CELL - 8 }}
      title={title}
    >
      {sq.kind === "start" ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[oklch(0.6_0.12_262)] to-[oklch(0.45_0.12_262)] text-white">
          <span className="text-3xl">🚩</span>
          <span className="text-[13px] font-bold uppercase tracking-wide">{gt("goose.start")}</span>
        </div>
      ) : sq.kind === "death" ? (
        <DeathArt />
      ) : (
        sq.story && (
          <img
            src={sq.story.thumb}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        )
      )}
      {sq.kind === "prison" && (
        // Bars over the lions' den.
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0 13px, oklch(0.25 0.02 60 / 0.85) 13px 19px)",
          }}
        />
      )}
      {sq.kind !== "start" && (
        <span className="absolute left-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-white/90 px-1 text-[13px] font-bold text-[oklch(0.31_0.08_262)] shadow">
          {sq.n}
        </span>
      )}
      <span className="absolute right-1 top-1">
        {goose && <GooseBadge size={26} />}
        {sq.kind === "ladder" && (
          <Badge bg="oklch(0.55 0.11 300)" size={26}>
            🪜
          </Badge>
        )}
        {sq.kind === "prison" && (
          <Badge bg="oklch(0.35 0.03 60)" size={26}>
            🔒
          </Badge>
        )}
        {sq.kind === "death" && (
          <Badge bg="oklch(0.35 0.07 300)" size={26}>
            ✝️
          </Badge>
        )}
      </span>
    </div>
  );
}

function GooseBoard({ players, onExit }: { players: number; onExit: () => void }) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);
  const playerName = (i: number) => mt("mem.player").replace("{n}", String(i + 1));

  const [pos, setPos] = useState<number[]>(() => Array(players).fill(0));
  const [turn, setTurn] = useState(0);
  const [die, setDie] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [busy, setBusy] = useState(true); // the opening zoom
  const [message, setMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  // After a New Testament square: name its story to roll again.
  const [quiz, setQuiz] = useState<{ player: number; story: Story } | null>(null);
  const [hopMs, setHopMs] = useState(220);
  // Camera: the whole board, or close up on a square.
  const [view, setView] = useState<{ all: boolean; n: number; ms: number }>({
    all: true,
    n: 0,
    ms: 0,
  });
  const [size, setSize] = useState({ w: 360, h: 480 });

  const viewport = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(pos);
  const turnRef = useRef(0);
  const skip = useRef<boolean[]>(Array(players).fill(false));
  const rolls = useRef<number[]>(Array(players).fill(0));
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

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
    };
  }, []);

  // Opening: the whole board first, then a slow zoom onto the start.
  useEffect(() => {
    const a = window.setTimeout(() => setView({ all: false, n: 0, ms: 1600 }), 900);
    const b = window.setTimeout(() => setBusy(false), 2500);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const place = (i: number, n: number) => {
    posRef.current = posRef.current.map((p, k) => (k === i ? n : p));
    setPos(posRef.current);
    setView({ all: false, n, ms: 320 });
  };

  const titleOf = (n: number) => {
    const sq = SQUARES[n];
    if (sq.kind === "death") return gt("goose.deathTitle");
    if (sq.kind === "start") return gt("goose.start");
    return sq.story ? localizeSceneTitle(sq.story.slug, lang) : "";
  };

  const nextTurn = () => {
    let t = turnRef.current;
    let note: string | null = null;
    for (let guard = 0; guard < players * 2 + 1; guard++) {
      t = (t + 1) % players;
      if (skip.current[t]) {
        skip.current[t] = false;
        rolls.current[t] += 1;
        note = gt("goose.skipped", { name: playerName(t) });
        continue;
      }
      break;
    }
    turnRef.current = t;
    setTurn(t);
    setView({ all: false, n: posRef.current[t], ms: 700 });
    if (note) setMessage(note);
    setBusy(false);
  };

  // A jump (goose, ladder, back to start): one long glide.
  const jump = (i: number, to: number, then: () => void) => {
    setHopMs(700);
    place(i, to);
    later(() => {
      setHopMs(220);
      then();
    }, 800);
  };

  const land = (i: number, n: number, bounced: boolean) => {
    if (n === LAST) {
      audio.playWin();
      setWinner(i);
      return;
    }
    const sq = SQUARES[n];
    const rule = ruleFor(n);
    const again = () => {
      setBusy(false);
      setView({ all: false, n: posRef.current[i], ms: 400 });
    };
    if (sq.kind === "goose") {
      audio.playCorrect();
      const ask = (m: number) => {
        const story = SQUARES[m].story;
        if (story) later(() => setQuiz({ player: i, story }), 500);
        else again();
      };
      if (rule.to === n) {
        setMessage(gt("goose.lastGoose"));
        ask(n);
      } else {
        setMessage(gt("goose.gooseJump"));
        later(() => jump(i, rule.to, () => ask(rule.to)), 900);
      }
    } else if (sq.kind === "ladder") {
      audio.playCorrect();
      setMessage(gt("goose.ladderJump"));
      later(() => jump(i, rule.to, again), 900);
    } else if (sq.kind === "prison") {
      audio.playIncorrect();
      skip.current[i] = true;
      setMessage(gt("goose.prison"));
      later(nextTurn, 1600);
    } else if (sq.kind === "death") {
      audio.play("goose-back");
      setMessage(gt("goose.death"));
      later(() => jump(i, 0, () => later(nextTurn, 500)), 1200);
    } else {
      setMessage(
        `${bounced ? `${gt("goose.bounce")} · ` : ""}${gt("goose.square", { n })} · ${titleOf(n)}`,
      );
      later(nextTurn, 900);
    }
  };

  const answer = (right: boolean) => {
    const i = quiz?.player ?? turnRef.current;
    setQuiz(null);
    if (right) {
      setBusy(false);
      setView({ all: false, n: posRef.current[i], ms: 400 });
    } else {
      setMessage(gt("quiz.missed"));
      later(nextTurn, 700);
    }
  };

  const roll = () => {
    if (busy || winner !== null) return;
    const i = turnRef.current;
    setBusy(true);
    setRolling(true);
    setMessage(null);
    rolls.current[i] += 1;
    audio.play("dice-shake");
    setView({ all: false, n: posRef.current[i], ms: 400 });
    for (let k = 0; k < 8; k++) later(() => setDie(1 + Math.floor(Math.random() * 6)), k * 80);
    const d = 1 + Math.floor(Math.random() * 6);
    later(() => {
      setDie(d);
      setRolling(false);
      audio.playClick();
      // Step by step; past the finish the extra steps walk back.
      const path: number[] = [];
      let p = posRef.current[i];
      let dir = 1;
      for (let s = 0; s < d; s++) {
        if (p === LAST) dir = -1;
        p += dir;
        path.push(p);
      }
      path.forEach((n, k) =>
        later(
          () => {
            place(i, n);
            audio.play("goose-step", 0.55);
          },
          350 + k * 260,
        ),
      );
      later(() => land(i, p, dir < 0), 350 + path.length * 260 + 200);
    }, 700);
  };

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    posRef.current = Array(players).fill(0);
    setPos(posRef.current);
    turnRef.current = 0;
    setTurn(0);
    skip.current = Array(players).fill(false);
    rolls.current = Array(players).fill(0);
    setMessage(null);
    setWinner(null);
    setQuiz(null);
    setBusy(false);
    setView({ all: false, n: 0, ms: 600 });
  };

  // Camera transform for the current view.
  const fit = Math.min(size.w / W, size.h / H);
  let scale = fit;
  let tx = (size.w - W * fit) / 2;
  let ty = (size.h - H * fit) / 2;
  if (!view.all) {
    scale = Math.max(fit, Math.min(size.w, size.h) / (CELL * 3.4));
    const c = centerOf(view.n);
    const clamp = (v: number, span: number, room: number) =>
      span <= room ? (room - span) / 2 : Math.min(12, Math.max(room - span - 12, v));
    tx = clamp(size.w / 2 - c.x * scale, W * scale, size.w);
    ty = clamp(size.h / 2 - c.y * scale, H * scale, size.h);
  }

  // Pawns sharing a square sit in a little ring.
  const pawnSpot = (i: number) => {
    const here = pos.map((p, k) => (p === pos[i] ? k : -1)).filter((k) => k >= 0);
    const k = here.indexOf(i);
    const c = centerOf(pos[i]);
    if (here.length === 1) return c;
    const a = (k / here.length) * Math.PI * 2 - Math.PI / 2;
    return { x: c.x + Math.cos(a) * 22, y: c.y + Math.sin(a) * 22 };
  };

  const solo = players === 1;

  return (
    <div className="theme-bedtime relative flex h-[100dvh] w-full flex-col overflow-hidden">
      <ScreenFade />
      <BedtimeBackdrop image={gooseBg} fadeEnd={0} blur />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center gap-3 px-3 pt-3 pb-2">
        <BackButton onClick={onExit} label={gt("goose.players")} />
        <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
          {t("game.goose")}
        </h1>
        <button
          onClick={() =>
            setView((v) => ({ all: !v.all, n: posRef.current[turnRef.current], ms: 700 }))
          }
          aria-label={gt("goose.board")}
          aria-pressed={view.all}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-lg shadow-sm transition active:scale-95 ${
            view.all ? "ring-2 ring-[var(--color-primary)]" : ""
          }`}
        >
          🗺️
        </button>
      </header>

      <div
        ref={viewport}
        className="relative z-10 mx-auto w-full max-w-3xl min-h-0 flex-1 overflow-hidden"
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: W,
            height: H,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: view.ms ? `transform ${view.ms}ms ease-in-out` : "none",
          }}
        >
          {/* The board itself, a painted card under the squares */}
          <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[oklch(0.93_0.05_150)] via-[oklch(0.95_0.04_90)] to-[oklch(0.9_0.05_230)] shadow-[0_20px_40px_oklch(0.25_0.05_50/0.45)]" />
          {SQUARES.slice(0, LAST).map((sq) => (
            <Tile key={sq.n} sq={sq} title={titleOf(sq.n)} />
          ))}
          {/* The finish fills the middle of the board. */}
          <div
            className="absolute overflow-hidden rounded-2xl border-[5px] border-[oklch(0.79_0.135_76)] shadow-lg"
            style={{
              left: FINISH_AREA.col * CELL + 4,
              top: FINISH_AREA.row * CELL + 4,
              width: FINISH_AREA.cols * CELL - 8,
              height: FINISH_AREA.rows * CELL - 8,
            }}
          >
            {SQUARES[LAST].story && (
              <img
                src={SQUARES[LAST].story.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.3_0.06_262/0.85)] to-transparent px-4 pb-3 pt-10 text-center font-display text-3xl text-white">
              🏆 {LAST} · {titleOf(LAST)}
            </span>
          </div>
          <div
            className="absolute flex items-center justify-center gap-3"
            style={{
              left: LEGEND_AREA.col * CELL,
              top: LEGEND_AREA.row * CELL,
              width: LEGEND_AREA.cols * CELL,
              height: LEGEND_AREA.rows * CELL,
            }}
          >
            <GooseBadge size={44} />
            <Badge bg="oklch(0.55 0.11 300)" size={44}>
              🪜
            </Badge>
            <Badge bg="oklch(0.35 0.03 60)" size={44}>
              🔒
            </Badge>
            <Badge bg="oklch(0.35 0.07 300)" size={44}>
              ✝️
            </Badge>
          </div>
          {pos.map((_, i) => {
            const p = pawnSpot(i);
            return (
              <span
                key={i}
                className="absolute left-0 top-0"
                style={{
                  // a pawn lower on the board stands in front of one above it
                  zIndex: 10 + Math.round(p.y),
                  // the pawn's foot stands on the spot
                  transform: `translate(${p.x - 20}px, ${p.y - 40 * PAWN_RATIO * 0.85}px) ${i === turn && winner === null ? "scale(1.2)" : ""}`,
                  transformOrigin: `20px ${40 * PAWN_RATIO * 0.85}px`,
                  transition: `transform ${hopMs}ms ease-out`,
                }}
              >
                <Pawn index={i} size={40} />
              </span>
            );
          })}
        </div>
      </div>

      {/* Turn, message and the die */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-3 pb-4 pt-2">
        <div className="paint-box paint-long paint-thin flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Pawn index={turn} size={22} />
              <span className="truncate">
                {solo
                  ? gt("goose.rolls", { n: rolls.current[0] })
                  : mt("mem.turn").replace("{name}", playerName(turn))}
              </span>
            </p>
            <p
              className="mt-1 min-h-[2.5rem] text-xs leading-snug text-foreground/80"
              aria-live="polite"
            >
              {message ?? ""}
            </p>
          </div>
          <button
            onClick={roll}
            disabled={busy || winner !== null}
            aria-label={gt("goose.roll")}
            className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.82_0.1_62)] shadow-md ring-1 ring-[oklch(1_0_0/0.6)] transition active:scale-90 disabled:opacity-60"
          >
            <DieFace value={die} spinning={rolling} />
          </button>
        </div>
      </div>

      {quiz && <StoryQuiz story={quiz.story} onAnswer={answer} />}

      {winner !== null && (
        <ResultCard
          top="🏆"
          title={
            solo
              ? gt("goose.soloWin", { n: rolls.current[0] })
              : mt("mem.wins").replace("{name}", playerName(winner))
          }
          detail={
            SQUARES[LAST].story && (
              <img
                src={SQUARES[LAST].story.thumb}
                alt=""
                className="mx-auto h-28 w-24 rounded-xl object-cover shadow"
              />
            )
          }
          replayLabel={gt("goose.replay")}
          onReplay={replay}
          backLabel={gt("goose.players")}
          onBack={onExit}
        />
      )}
    </div>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[12, 12]],
  2: [
    [7, 7],
    [17, 17],
  ],
  3: [
    [7, 7],
    [12, 12],
    [17, 17],
  ],
  4: [
    [7, 7],
    [17, 7],
    [7, 17],
    [17, 17],
  ],
  5: [
    [7, 7],
    [17, 7],
    [12, 12],
    [7, 17],
    [17, 17],
  ],
  6: [
    [7, 7],
    [17, 7],
    [7, 12],
    [17, 12],
    [7, 17],
    [17, 17],
  ],
};

function DieFace({ value, spinning }: { value: number; spinning: boolean }) {
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 24 24"
      aria-hidden
      className={spinning ? "animate-spin" : ""}
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="5"
        fill="oklch(0.99 0.012 85)"
        stroke="oklch(0.31 0.08 262)"
        strokeWidth="1.2"
      />
      {PIPS[value].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="oklch(0.31 0.08 262)" />
      ))}
    </svg>
  );
}
