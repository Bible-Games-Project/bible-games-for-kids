import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import {
  BASE,
  EXIT,
  GOAL,
  HOME_LANE,
  LOOP,
  SAFE,
  SAFE_STORIES,
  SIZE,
  loopSquare,
  seatColors,
  spot,
  target,
  type Color,
} from "@/lib/parchis";
import { findStory } from "@/lib/stories";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { BackButton, MenuScreen, ResultCard, ScreenFade } from "@/components/GameShell";
import { Token } from "@/components/Token";

import parchisBg from "@/assets/parchis-bg.webp";

// Base, shadow and highlight of each colour, like the painted board.
const SHADES: Record<Color, [string, string, string]> = {
  yellow: ["#e6b43c", "#b0841c", "#f7da8a"],
  blue: ["#3f6fb5", "#2a4c85", "#7fa3dc"],
  red: ["#c4444a", "#8f2a30", "#e8848a"],
  green: ["#4f9a5e", "#336b40", "#8cc797"],
};

// A painting inside each base.
const BASE_STORY: Record<Color, string> = {
  blue: "nativity",
  red: "noahs-ark",
  yellow: "creation",
  green: "good-shepherd",
};

export function ParchisGame({ onBack }: { onBack: () => void }) {
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
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => {
              window.scrollTo(0, 0);
              setSetup({ players: n, pawns: quick ? 2 : 4 });
            }}
            className="paint-box paint-square flex flex-col items-center justify-center gap-2 p-4 text-center transition active:scale-[0.97]"
          >
            <span className="flex gap-0.5">
              {seatColors(n).map((c, i) => (
                <Pawn key={c} color={c} size={22} dim={n === 1 && i > 0} />
              ))}
            </span>
            <span className="text-sm font-semibold leading-tight">
              {n === 1 ? pt("dom.vsComputer") : mt("mem.playersMany").replace("{n}", String(n))}
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
          <li>{pt("par.rule6")}</li>
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
  return <Token color={color} size={size} className={dim ? "opacity-50" : ""} />;
}

// The middle of the board: the four colours meeting around the cross and an
// open Bible.
function Goal() {
  return (
    <svg viewBox="0 0 30 30" className="h-full w-full" aria-hidden>
      <polygon points="0,0 30,0 15,15" fill={SHADES.blue[0]} />
      <polygon points="30,0 30,30 15,15" fill={SHADES.red[0]} />
      <polygon points="30,30 0,30 15,15" fill={SHADES.green[0]} />
      <polygon points="0,30 0,0 15,15" fill={SHADES.yellow[0]} />
      <circle cx="15" cy="15" r="10" fill="#2b4f8f" stroke="#e6b43c" strokeWidth="1.2" />
      <path
        d="M8.5 19.5 Q12 18 15 19.5 Q18 18 21.5 19.5 L21.5 22 Q18 20.6 15 22 Q12 20.6 8.5 22 Z"
        fill="#fbf4e2"
        stroke="#b0841c"
        strokeWidth=".4"
      />
      <rect x="14" y="7" width="2" height="11" rx=".4" fill="#f2c94c" />
      <rect x="11" y="9.5" width="8" height="2" rx=".4" fill="#f2c94c" />
    </svg>
  );
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

  // What landing on `to` does: send others home, reach the goal.
  const settle = (s: number, k: number, to: number, d: number) => {
    const seat = seatsRef.current[s];
    let again = d === 6;
    let note: string | null = d === 6 ? pt("par.again") : null;
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
    path.forEach((p, i) => later(() => setPawn(s, k, p), i * 170));
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
        if (d === 6) later(() => startTurn(s), 1200);
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

  const pct = (v: number) => `${(v / SIZE) * 100}%`;
  const cellStyle = (col: number, row: number, w = 1, h = 1) => ({
    left: pct(col),
    top: pct(row),
    width: pct(w),
    height: pct(h),
  });

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
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,72dvh)] rounded-2xl border-[6px] border-[oklch(0.55_0.08_55)] bg-[oklch(0.98_0.01_90)] shadow-[0_14px_30px_oklch(0.25_0.05_50/0.45)]">
          {/* Bases, each with a painting and four pawn spots */}
          {(Object.keys(BASE) as Color[]).map((c) => {
            const [x, y] = BASE[c];
            const story = findStory(BASE_STORY[c]);
            return (
              <div
                key={c}
                className="absolute overflow-hidden rounded-xl p-[3%]"
                style={{ ...cellStyle(x, y, 8, 8), backgroundColor: SHADES[c][0] }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white/80">
                  {story && (
                    <img
                      src={story.thumb}
                      alt=""
                      className="h-full w-full object-cover opacity-90"
                    />
                  )}
                </div>
              </div>
            );
          })}
          {/* Home lanes */}
          {(Object.keys(HOME_LANE) as Color[]).flatMap((c) =>
            HOME_LANE[c].map(([x, y], i) => (
              <div
                key={`${c}${i}`}
                className="absolute border border-white/70"
                style={{ ...cellStyle(x, y), backgroundColor: SHADES[c][0] }}
              />
            )),
          )}
          {/* The loop; safe squares show a painting, exits take their colour */}
          {LOOP.map(([x, y], i) => {
            const story = SAFE_STORIES.get(i);
            const exitOf = (Object.keys(EXIT) as Color[]).find((c) => EXIT[c] === i);
            return (
              <div
                key={i}
                className="absolute overflow-hidden border border-[oklch(0.8_0.02_80)] bg-white"
                style={{
                  ...cellStyle(x, y),
                  boxShadow: exitOf ? `inset 0 0 0 2px ${SHADES[exitOf][0]}` : undefined,
                }}
              >
                {story && <img src={story.thumb} alt="" className="h-full w-full object-cover" />}
              </div>
            );
          })}
          <div className="absolute" style={cellStyle(8, 8, 3, 3)}>
            <Goal />
          </div>

          {/* Pawns */}
          {placed.map((p, i) => {
            const { n, idx } = crowd(i);
            const shift = n > 1 ? (idx - (n - 1) / 2) * 0.32 : 0;
            const canPick = human && phase === "choose" && p.s === turn && options.includes(p.k);
            return (
              <button
                key={`${p.s}-${p.k}`}
                onClick={() => canPick && move(p.k)}
                disabled={!canPick}
                aria-label={`${nameOf(p.s)} ${p.k + 1}`}
                className={`absolute -translate-x-1/2 -translate-y-[45%] transition-[left,top] duration-150 ease-out ${
                  canPick ? "z-30" : "z-20"
                }`}
                style={{ left: pct(p.at[0] + shift), top: pct(p.at[1]), width: pct(1.05) }}
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
        stroke="oklch(0.31 0.08 262)"
        strokeWidth="1.2"
      />
      {PIPS[value].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="oklch(0.31 0.08 262)" />
      ))}
    </svg>
  );
}
