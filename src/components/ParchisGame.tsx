import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import {
  EXIT,
  GOAL,
  HOME_LANE,
  LOOP,
  SAFE,
  SAFE_STORIES,
  loopSquare,
  seatColors,
  spot,
  target,
  type Color,
} from "@/lib/parchis";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { BackButton, MenuScreen, ResultCard, ScreenFade } from "@/components/GameShell";
import { PlayerPawn } from "@/components/Token";
import { StoryQuiz, randomStory } from "@/components/StoryQuiz";
import type { Story } from "@/lib/stories";

import parchisBg from "@/assets/parchis-bg.webp";
import boardArt from "@/assets/parchis-board.webp";

// The colours of the painted board's home lanes.
const LANE: Record<Color, string> = {
  yellow: "#fcc80d",
  blue: "#2684e1",
  red: "#fc3e33",
  green: "#3ea648",
};

// The board picture (its frame, the four bases with their pawn circles and
// the cross in the middle) is the base; the squares are drawn over its arms.
// The game's 19 x 19 grid is stretched to fit: grid lines 0, 8, 11 and 19
// fall on these pixels of the picture, across and down.
const BOARD_W = 1132;
const BOARD_H = 1093;
const X_STOPS: [number, number][] = [
  [0, 40],
  [8, 457],
  [11, 673],
  [19, 1092],
];
const Y_STOPS: [number, number][] = [
  [0, 34],
  [8, 431],
  [11, 634],
  [19, 1044],
];
const stretch = (v: number, stops: [number, number][]) => {
  const k = Math.max(
    1,
    stops.findIndex(([g]) => g >= v),
  );
  const [g0, p0] = stops[Math.min(k, stops.length - 1) - 1];
  const [g1, p1] = stops[Math.min(k, stops.length - 1)];
  return p0 + ((v - g0) / (g1 - g0)) * (p1 - p0);
};
const bx = (col: number) => (stretch(col, X_STOPS) / BOARD_W) * 100;
const by = (row: number) => (stretch(row, Y_STOPS) / BOARD_H) * 100;
const cellStyle = (col: number, row: number, w = 1, h = 1) => ({
  left: `${bx(col)}%`,
  top: `${by(row)}%`,
  width: `${bx(col + w) - bx(col)}%`,
  height: `${by(row + h) - by(row)}%`,
});

// The four circles in each base of the picture (pixels), one per pawn.
const BASE_SPOTS: Record<Color, [number, number][]> = {
  blue: [
    [187, 176],
    [308, 176],
    [187, 279],
    [308, 279],
  ],
  red: [
    [830, 176],
    [951, 176],
    [830, 279],
    [951, 279],
  ],
  yellow: [
    [187, 786],
    [308, 786],
    [187, 889],
    [308, 889],
  ],
  green: [
    [830, 786],
    [951, 786],
    [830, 889],
    [951, 889],
  ],
};

// The arms, under the squares (their colour shows as the lines between them).
const ARMS: [number, number, number, number][] = [
  [8, 0, 3, 8],
  [8, 11, 3, 8],
  [0, 8, 8, 3],
  [11, 8, 8, 3],
];

export function ParchisGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("parchis");
  const { lang, t } = useSettings();
  const [setup, setSetup] = useState<{ players: number; pawns: number } | null>(null);
  const [quick, setQuick] = useState(false);
  const pt = (k: string) => gameText(lang, k);
  const mt = (k: string) => memText(lang, k);

  useBackButton(setup !== null, () => setSetup(null));

  if (setup) {
    return (
      <ParchisBoard players={setup.players} pawns={setup.pawns} onExit={() => setSetup(null)} />
    );
  }

  return (
    <MenuScreen
      title={t("game.parchis")}
      subtitle={pt("par.instruction")}
      background={parchisBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <h2 className="text-center font-display text-2xl">{mt("mem.howManyPlayers")}</h2>
      {/* Small boxes with just the pawns, like Memory's; one pawn plays the computer */}
      <div className="mx-auto mt-4 grid w-fit grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => {
              window.scrollTo(0, 0);
              setSetup({ players: n, pawns: quick ? 2 : 4 });
            }}
            aria-label={
              n === 1 ? pt("dom.vsComputer") : mt("mem.playersMany").replace("{n}", String(n))
            }
            className="paint-box paint-square paint-thin grid h-24 w-24 place-items-center p-3 transition active:scale-[0.95]"
          >
            <span className="flex max-w-[3.5rem] flex-wrap justify-center gap-1">
              {seatColors(n)
                .slice(0, n)
                .map((c) => (
                  <Pawn key={c} color={c} size={18} />
                ))}
            </span>
          </button>
        ))}
      </div>
      <label className="paint-box paint-long paint-thin mt-3 flex items-center gap-3 px-5 py-3.5 text-sm font-semibold">
        <input
          type="checkbox"
          checked={quick}
          onChange={(e) => setQuick(e.target.checked)}
          className="h-5 w-5"
        />
        {pt("par.quick")}
      </label>
      <div className="paint-box paint-wide mt-4 p-5">
        <h3 className="font-display text-lg">{pt("par.rules")}</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
          <li>{pt("par.rule5")}</li>
          <li>{pt("par.ruleSix")}</li>
          <li>{pt("par.ruleSafe")}</li>
          <li>{pt("par.ruleCapture")}</li>
          <li>{pt("par.ruleGoal")}</li>
        </ul>
      </div>
    </MenuScreen>
  );
}

// The pieces are the round tokens shared by all the board games.
function Pawn({ color, size, dim = false }: { color: Color; size?: number; dim?: boolean }) {
  return <PlayerPawn color={color} size={size} className={dim ? "opacity-50" : ""} />;
}

interface Seat {
  color: Color;
  human: boolean;
  pawns: number[]; // progress: -1 base, 0..63 loop, 64..70 home lane, 71 goal
}

function ParchisBoard({
  players,
  pawns,
  onExit,
}: {
  players: number;
  pawns: number;
  onExit: () => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const pt = (k: string) => gameText(lang, k);
  const mt = (k: string) => memText(lang, k);
  const vsComputer = players === 1;

  const fresh = (): Seat[] =>
    seatColors(players).map((color, i) => ({
      color,
      human: !vsComputer || i === 0,
      pawns: Array(pawns).fill(-1),
    }));
  const [seats, setSeatsState] = useState<Seat[]>(fresh);
  const seatsRef = useRef(seats);
  const setSeats = (next: Seat[]) => {
    seatsRef.current = next;
    setSeatsState(next);
  };
  const [turn, setTurn] = useState(0);
  const turnRef = useRef(0);
  const [die, setDie] = useState(5);
  const [rolling, setRolling] = useState(false);
  const [phase, setPhase] = useState<"roll" | "choose" | "busy">("roll");
  const [options, setOptions] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  // A 6 earns another roll only for naming the story in a painting.
  const [quiz, setQuiz] = useState<{ seat: number; story: Story } | null>(null);
  const dieRef = useRef(5);
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

  const nameOf = (i: number) =>
    vsComputer ? (i === 0 ? pt("dom.you") : pt("dom.computer")) : pt(`par.${seats[i].color}`);

  const setPawn = (s: number, p: number, progress: number) =>
    setSeats(
      seatsRef.current.map((seat, i) =>
        i === s ? { ...seat, pawns: seat.pawns.map((x, k) => (k === p ? progress : x)) } : seat,
      ),
    );

  // Moves worth offering: one per distinct square (pawns side by side in the
  // base are the same move).
  const movable = (s: number, d: number) => {
    const seen = new Set<number>();
    return seatsRef.current[s].pawns.flatMap((p, k) => {
      if (target(p, d) === null || seen.has(p)) return [];
      seen.add(p);
      return [k];
    });
  };

  const startTurn = (s: number) => {
    turnRef.current = s;
    setTurn(s);
    setOptions([]);
    setPhase("roll");
    if (!seatsRef.current[s].human) later(roll, 800);
  };

  const nextTurn = () => startTurn((turnRef.current + 1) % seatsRef.current.length);

  // After a 6: players answer a story question for the extra roll; the
  // computer gets it right most of the time.
  const sixAgain = (s: number) => {
    if (seatsRef.current[s].human) {
      setQuiz({ seat: s, story: randomStory() });
    } else if (Math.random() < 0.75) {
      setMessage(pt("par.again"));
      later(() => startTurn(s), 900);
    } else {
      setMessage(pt("quiz.missed"));
      later(nextTurn, 900);
    }
  };

  const answer = (right: boolean) => {
    const s = quiz?.seat ?? turnRef.current;
    setQuiz(null);
    if (right) {
      setMessage(pt("par.again"));
      later(() => startTurn(s), 300);
    } else {
      setMessage(pt("quiz.missed"));
      later(nextTurn, 600);
    }
  };

  // What landing on `to` does: send others home, reach the goal.
  const settle = (s: number, k: number, to: number, d: number) => {
    const seat = seatsRef.current[s];
    let again = false;
    let note: string | null = null;
    if (to >= GOAL) {
      again = true;
      note = pt("par.goal");
      audio.playCorrect();
    } else {
      const sq = loopSquare(seat.color, to);
      if (sq !== null && !SAFE.includes(sq)) {
        let hit = false;
        const next = seatsRef.current.map((other, i) => {
          if (i === s) return other;
          const pawns = other.pawns.map((p) => {
            if (loopSquare(other.color, p) === sq) {
              hit = true;
              return -1;
            }
            return p;
          });
          return { ...other, pawns };
        });
        if (hit) {
          setSeats(next);
          again = true;
          note = pt("par.captured");
          audio.playIncorrect();
        }
      }
    }
    setMessage(note);
    if (seatsRef.current[s].pawns.every((p) => p >= GOAL)) {
      audio.playWin();
      setWinner(s);
      return;
    }
    if (again) later(() => startTurn(s), 700);
    else if (d === 6) later(() => sixAgain(s), 700);
    else later(nextTurn, 600);
  };

  const move = (k: number) => {
    const s = turnRef.current;
    const d = dieRef.current;
    const from = seatsRef.current[s].pawns[k];
    const to = target(from, d);
    if (to === null) return;
    setPhase("busy");
    setOptions([]);
    const path = from < 0 ? [0] : Array.from({ length: to - from }, (_, i) => from + 1 + i);
    path.forEach((p, i) =>
      later(() => {
        setPawn(s, k, p);
        audio.play("parchis-step", 0.5);
      }, i * 170),
    );
    later(() => settle(s, k, to, d), path.length * 170 + 120);
  };

  // The computer's pick: send someone home, reach the goal, come out, land
  // safe, else push the pawn that is furthest along.
  const bestMove = (s: number, d: number, choices: number[]) => {
    const seat = seatsRef.current[s];
    const score = (k: number) => {
      const from = seat.pawns[k];
      const to = target(from, d)!;
      const sq = loopSquare(seat.color, to);
      const hits =
        sq !== null &&
        !SAFE.includes(sq) &&
        seatsRef.current.some(
          (o, i) => i !== s && o.pawns.some((p) => loopSquare(o.color, p) === sq),
        );
      return (
        (hits ? 100 : 0) +
        (to >= GOAL ? 80 : 0) +
        (from < 0 ? 60 : 0) +
        (sq !== null && SAFE.includes(sq) ? 20 : 0) +
        to / 10
      );
    };
    return [...choices].sort((a, b) => score(b) - score(a))[0];
  };

  function roll() {
    const s = turnRef.current;
    setPhase("busy");
    setRolling(true);
    setMessage(null);
    audio.play("dice-shake");
    for (let k = 0; k < 7; k++) later(() => setDie(1 + Math.floor(Math.random() * 6)), k * 80);
    const d = 1 + Math.floor(Math.random() * 6);
    later(() => {
      setRolling(false);
      setDie(d);
      dieRef.current = d;
      audio.playClick();
      const choices = movable(s, d);
      if (!choices.length) {
        const waiting = seatsRef.current[s].pawns.every((p) => p < 0);
        setMessage(waiting ? pt("par.need5") : pt("par.noMove"));
        if (d === 6) later(() => sixAgain(s), 1200);
        else later(nextTurn, 1200);
      } else if (choices.length === 1) {
        later(() => move(choices[0]), 350);
      } else if (!seatsRef.current[s].human) {
        later(() => move(bestMove(s, d, choices)), 600);
      } else {
        setOptions(choices);
        setPhase("choose");
        setMessage(pt("par.choose"));
      }
    }, 600);
  }

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setSeats(fresh());
    setWinner(null);
    setMessage(null);
    setQuiz(null);
    startTurn(0);
  };

  // Several pawns on one square sit side by side.
  const placed = seats.flatMap((seat, s) =>
    seat.pawns.map((p, k) => ({
      s,
      k,
      color: seat.color,
      at: spot(seat.color, p, k),
      progress: p,
    })),
  );
  const crowd = (i: number) => {
    const me = placed[i];
    if (me.progress < 0 || me.progress >= GOAL) return { n: 1, idx: 0 };
    const same = placed.filter(
      (o) => o.progress >= 0 && o.progress < GOAL && o.at[0] === me.at[0] && o.at[1] === me.at[1],
    );
    return { n: same.length, idx: same.indexOf(me) };
  };

  const seat = seats[turn];
  const human = seat.human && winner === null;

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={parchisBg} fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-3 py-3">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={pt("dom.players")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.parchis")}
          </h1>
        </header>

        {/* The board */}
        <div className="relative mx-auto aspect-[1132/1093] w-full max-w-[min(100%,72dvh)] drop-shadow-[0_14px_22px_oklch(0.25_0.05_50/0.45)]">
          <img
            src={boardArt}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {ARMS.map(([x, y, w, h]) => (
            <div
              key={`${x}-${y}`}
              className="absolute bg-[#c39d71]"
              style={cellStyle(x, y, w, h)}
            />
          ))}
          {/* Home lanes */}
          {(Object.keys(HOME_LANE) as Color[]).flatMap((c) =>
            HOME_LANE[c].map(([x, y], i) => (
              <div key={`${c}${i}`} className="absolute p-[1.5px]" style={cellStyle(x, y)}>
                <div
                  className="h-full w-full rounded-[3px] border border-black/25 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.18)]"
                  style={{ backgroundColor: LANE[c] }}
                />
              </div>
            )),
          )}
          {/* The loop; safe squares show a painting, exits take their colour */}
          {LOOP.map(([x, y], i) => {
            const story = SAFE_STORIES.get(i);
            const exitOf = (Object.keys(EXIT) as Color[]).find((c) => EXIT[c] === i);
            return (
              <div key={i} className="absolute p-[1.5px]" style={cellStyle(x, y)}>
                <div
                  className="h-full w-full overflow-hidden rounded-[3px] border border-[#b1774a] bg-[#faf7e4]"
                  style={{ boxShadow: exitOf ? `inset 0 0 0 2.5px ${LANE[exitOf]}` : undefined }}
                >
                  {story && <img src={story.thumb} alt="" className="h-full w-full object-cover" />}
                </div>
              </div>
            );
          })}

          {/* Pawns */}
          {placed.map((p, i) => {
            const { n, idx } = crowd(i);
            const shift = n > 1 ? (idx - (n - 1) / 2) * 0.32 : 0;
            // in its base a pawn stands on one of the picture's circles
            const circle = p.progress < 0 ? BASE_SPOTS[p.color][p.k] : null;
            const left = circle ? (circle[0] / BOARD_W) * 100 : bx(p.at[0] + shift);
            const top = circle ? (circle[1] / BOARD_H) * 100 : by(p.at[1]);
            const canPick = human && phase === "choose" && p.s === turn && options.includes(p.k);
            return (
              <button
                key={`${p.s}-${p.k}`}
                onClick={() => canPick && move(p.k)}
                disabled={!canPick}
                aria-label={`${nameOf(p.s)} ${p.k + 1}`}
                className={`absolute -translate-x-1/2 -translate-y-[82%] transition-[left,top] duration-150 ease-out ${
                  canPick ? "z-30" : "z-20"
                }`}
                style={{ left: `${left}%`, top: `${top}%`, width: "5.6%" }}
              >
                {canPick && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-gold)]/60" />
                )}
                <Pawn color={p.color} />
                {canPick && (
                  <span className="absolute -top-2 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-white text-[10px] font-bold text-foreground shadow">
                    {p.k + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Whose turn, the die and the pawn choice */}
        <div className="paint-box paint-long paint-thin mt-3 flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Pawn color={seat.color} size={18} />
              <span className="truncate">{mt("mem.turn").replace("{name}", nameOf(turn))}</span>
            </p>
            <p className="mt-1 min-h-[1.25rem] text-xs text-foreground/80" aria-live="polite">
              {message ?? ""}
            </p>
            {human && phase === "choose" && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {options.map((k) => (
                  <button
                    key={k}
                    onClick={() => move(k)}
                    className="flex items-center gap-1 rounded-full bg-card px-2 py-1 text-xs font-bold shadow-sm ring-2 ring-[var(--color-gold)] transition active:scale-95"
                  >
                    <Pawn color={seat.color} size={14} />
                    {k + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={roll}
            disabled={!human || phase !== "roll"}
            aria-label={pt("goose.roll")}
            className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.82_0.1_62)] shadow-md ring-1 ring-[oklch(1_0_0/0.6)] transition active:scale-90 disabled:opacity-60"
          >
            <DieFace value={die} spinning={rolling} />
          </button>
        </div>
      </div>

      {quiz && <StoryQuiz story={quiz.story} onAnswer={answer} />}

      {winner !== null && (
        <ResultCard
          top={vsComputer && winner !== 0 ? "🤖" : "🏆"}
          title={
            vsComputer
              ? winner === 0
                ? pt("dom.youWin")
                : pt("dom.computerWins")
              : pt("par.wins").replace("{name}", nameOf(winner))
          }
          replayLabel={pt("dom.replay")}
          onReplay={replay}
          backLabel={pt("dom.players")}
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
        stroke="oklch(0.3 0.07 45)"
        strokeWidth="1.2"
      />
      {PIPS[value].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="oklch(0.3 0.07 45)" />
      ))}
    </svg>
  );
}
