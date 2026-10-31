import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { Story } from "@/lib/stories";
import {
  PIPS,
  addTile,
  computerChoice,
  deal,
  dots,
  pickFaces,
  sidesFor,
  type Placed,
  type Side,
  type Tile,
} from "@/lib/domino";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { BackButton, MenuScreen, ResultCard, ScreenFade } from "@/components/GameShell";
import { TOKEN_ORDER, Token } from "@/components/Token";

import dominoBg from "@/assets/domino-bg.webp";

export function DominoGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [players, setPlayers] = useState<number | null>(null);
  const dt = (k: string) => gameText(lang, k);
  const mt = (k: string) => memText(lang, k);
  const sample = useRef(pickFaces()).current;

  useBackButton(players !== null, () => setPlayers(null));

  if (players) return <DominoBoard players={players} onExit={() => setPlayers(null)} />;

  return (
    <MenuScreen
      title={t("game.domino")}
      subtitle={dt("dom.instruction")}
      background={dominoBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <div className="grid gap-3">
        {[1, 2].map((n) => (
          <button
            key={n}
            onClick={() => {
              window.scrollTo(0, 0);
              setPlayers(n);
            }}
            className="paint-box paint-square flex items-center gap-4 p-4 text-left transition active:scale-[0.98]"
          >
            <span className="shrink-0 whitespace-nowrap text-3xl" aria-hidden>
              {n === 1 ? "🧒🤖" : "🧒🧒"}
            </span>
            <span className="text-lg font-semibold">
              {n === 1 ? dt("dom.vsComputer") : mt("mem.playersMany").replace("{n}", "2")}
            </span>
          </button>
        ))}
      </div>
      <div className="glass-card mt-5 flex flex-col items-center gap-3 p-4 text-center">
        <div className="flex gap-2">
          <DominoTile tile={{ id: -1, a: 2, b: 5 }} faces={sample} size={44} />
          <DominoTile tile={{ id: -2, a: 5, b: 3 }} faces={sample} size={44} />
        </div>
        <p className="text-sm">{dt("dom.howTo")}</p>
      </div>
    </MenuScreen>
  );
}

// One half: the painting for its number with that many dots on top.
function Half({ value, faces, size }: { value: number; faces: Story[]; size: number }) {
  const r = Math.max(2.5, size * 0.085);
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-md"
      style={{ width: size, height: size }}
    >
      <img
        src={faces[value].thumb}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
      />
      {PIPS[value].map(([x, y], k) => (
        <span
          key={k}
          className="absolute rounded-full border border-[oklch(0.25_0.03_60)] bg-white shadow-[0_1px_2px_oklch(0_0_0/0.5)]"
          style={{ width: 2 * r, height: 2 * r, left: x * size - r, top: y * size - r }}
        />
      ))}
    </span>
  );
}

function DominoTile({
  tile,
  faces,
  size,
  vertical = false,
  flipped = false,
  className = "",
}: {
  tile: Tile;
  faces: Story[];
  size: number;
  vertical?: boolean;
  flipped?: boolean;
  className?: string;
}) {
  const [first, second] = flipped ? [tile.b, tile.a] : [tile.a, tile.b];
  return (
    <span
      className={`relative flex shrink-0 items-center gap-[3px] rounded-lg border border-[oklch(0.85_0.02_80)] bg-[oklch(0.98_0.012_85)] p-[3px] shadow-[0_3px_6px_oklch(0.3_0.04_60/0.35)] ${
        vertical ? "flex-col" : "flex-row"
      } ${className}`}
    >
      <Half value={first} faces={faces} size={size} />
      <Half value={second} faces={faces} size={size} />
      {/* The little brass pin in the middle */}
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.7_0.1_75)] ring-1 ring-white" />
    </span>
  );
}

interface GameState {
  faces: Story[];
  hands: Tile[][];
  pile: Tile[];
  line: Placed[];
  turn: number;
  passes: number; // passes in a row; everybody passing means a blocked game
  winner: number | null;
  blocked: boolean;
}

function newGame(players: number): GameState {
  const { hands, pile } = deal(players);
  return {
    faces: pickFaces(),
    hands,
    pile,
    line: [],
    turn: 0,
    passes: 0,
    winner: null,
    blocked: false,
  };
}

function DominoBoard({ players, onExit }: { players: number; onExit: () => void }) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const dt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);
  const vsComputer = players === 1;
  const seats = vsComputer ? 2 : players;
  const nameOf = (i: number) =>
    vsComputer
      ? i === 0
        ? dt("dom.you")
        : dt("dom.computer")
      : mt("mem.player").replace("{n}", String(i + 1));

  const [g, setG] = useState(() => newGame(seats));
  const gRef = useRef(g);
  const set = (next: GameState) => {
    gRef.current = next;
    setG(next);
  };
  // A tile that fits at both ends, waiting for the player to pick a side.
  const [choosing, setChoosing] = useState<Tile | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  // Two players share the phone: hide the hand until the next one is ready.
  const [cover, setCover] = useState(false);
  const [width, setWidth] = useState(340);
  const table = useRef<HTMLDivElement | null>(null);
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
    const el = table.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
    };
  }, []);

  const human = !vsComputer || g.turn === 0;
  const hand = g.hands[g.turn];
  const canPlay = hand.some((tile) => sidesFor(tile, g.line).length > 0);

  const finish = (state: GameState, winner: number, blocked: boolean) => {
    set({ ...state, winner, blocked });
    if (!vsComputer || winner === 0) audio.playWin();
    else audio.playIncorrect();
  };

  const nextTurn = (state: GameState) => {
    const turn = (state.turn + 1) % seats;
    const next = { ...state, turn };
    set(next);
    if (vsComputer && turn === 1) later(computerTurn, 900);
    else if (!vsComputer) setCover(true);
  };

  const commit = (tile: Tile, side: Side) => {
    const s = gRef.current;
    const hands = s.hands.map((h, i) => (i === s.turn ? h.filter((x) => x.id !== tile.id) : h));
    const next = { ...s, hands, line: addTile(s.line, tile, side), passes: 0 };
    setChoosing(null);
    audio.playClick();
    if (!hands[s.turn].length) finish(next, s.turn, false);
    else nextTurn(next);
  };

  const pass = () => {
    const s = gRef.current;
    const passes = s.passes + 1;
    if (passes >= seats) {
      // Nobody can move: the fewest dots wins.
      const totals = s.hands.map(dots);
      finish({ ...s, passes }, totals.indexOf(Math.min(...totals)), true);
      return;
    }
    nextTurn({ ...s, passes });
  };

  const draw = () => {
    const s = gRef.current;
    if (!s.pile.length) return;
    const [tile, ...pile] = s.pile;
    set({ ...s, pile, hands: s.hands.map((h, i) => (i === s.turn ? [...h, tile] : h)) });
    audio.playClick();
  };

  function computerTurn() {
    const s = gRef.current;
    if (s.winner !== null) return;
    const choice = computerChoice(s.hands[s.turn], s.line);
    if (choice) commit(choice.tile, choice.side);
    else if (s.pile.length) {
      draw();
      later(computerTurn, 450);
    } else pass();
  }

  const tap = (tile: Tile) => {
    if (!human || g.winner !== null) return;
    const sides = sidesFor(tile, g.line);
    if (!sides.length) {
      audio.playIncorrect();
      setShake(tile.id);
      later(() => setShake(null), 450);
      return;
    }
    if (sides.length === 1) commit(tile, sides[0]);
    else setChoosing(tile);
  };

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    set(newGame(seats));
    setChoosing(null);
    setCover(false);
  };

  // ---- The line on the table, laid out as a snake ----
  const S = Math.round(Math.min(46, Math.max(30, width / 9)));
  const tileW = 2 * S + 9;
  const tileH = S + 6;
  const gap = 6;
  const perRow = Math.max(2, Math.floor((width + gap) / (tileW + gap)));
  const rows = Math.max(1, Math.ceil(g.line.length / perRow));
  const offset = (width - (perRow * tileW + (perRow - 1) * gap)) / 2;

  const handSize = Math.round(Math.min(40, Math.max(28, width / 11)));
  const first = g.line[0];
  const last = g.line[g.line.length - 1];

  let status = "";
  if (g.winner === null) {
    if (vsComputer && g.turn === 1) status = dt("dom.thinking");
    else if (choosing) status = dt("dom.where");
    else if (!canPlay) status = g.pile.length ? dt("dom.noMove") : dt("dom.noMovePass");
    else status = vsComputer ? dt("dom.yourTurn") : `${nameOf(g.turn)} · ${dt("dom.yourTurn")}`;
  }

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={dominoBg} fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-3 py-3">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={dt("dom.players")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.domino")}
          </h1>
          <span className="shrink-0 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold text-foreground/80 shadow-sm">
            {dt("dom.pile", { n: g.pile.length })}
          </span>
        </header>

        {/* The other players: how many tiles they still hold */}
        <div className="flex flex-wrap justify-center gap-2 pb-2">
          {g.hands.map((h, i) =>
            i === g.turn && human ? null : (
              <span
                key={i}
                className={`flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold shadow-sm ${
                  i === g.turn ? "ring-2 ring-[var(--color-gold)]" : ""
                }`}
              >
                <Token color={TOKEN_ORDER[i]} size={22} />
                {nameOf(i)}
                <span className="flex">
                  {h.slice(0, 10).map((x) => (
                    <span
                      key={x.id}
                      className="-ml-1 h-5 w-3 rounded-[3px] border border-white bg-[oklch(0.45_0.12_262)] first:ml-0"
                    />
                  ))}
                </span>
                <span className="text-xs text-muted-foreground">{h.length}</span>
              </span>
            ),
          )}
        </div>

        {/* The table */}
        <div className="rounded-3xl bg-[oklch(0.62_0.08_60/0.85)] p-3 shadow-[inset_0_2px_8px_oklch(0.3_0.05_50/0.4)]">
          <div ref={table} className="relative w-full" style={{ height: rows * (tileH + gap) + 4 }}>
            {g.line.map((tile, i) => {
              const row = Math.floor(i / perRow);
              const col = i % perRow;
              const back = row % 2 === 1;
              const x = offset + (back ? perRow - 1 - col : col) * (tileW + gap);
              const y = row * (tileH + gap);
              const isEnd = choosing && (i === 0 || i === g.line.length - 1);
              return (
                <span
                  key={tile.id}
                  className="absolute left-0 top-0 transition-transform duration-500 ease-out"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <DominoTile
                    tile={tile}
                    faces={g.faces}
                    size={S}
                    flipped={back}
                    className={isEnd ? "ring-4 ring-[var(--color-gold)]" : ""}
                  />
                </span>
              );
            })}
            {!g.line.length && (
              <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white/90">
                {status}
              </span>
            )}
          </div>
        </div>

        <div className="glass-card mt-3 px-3 pb-3 pt-2">
          <p
            className="flex min-h-[1.25rem] items-center justify-center gap-2 text-center text-sm font-semibold"
            aria-live="polite"
          >
            {g.winner === null && <Token color={TOKEN_ORDER[g.turn]} size={22} />}
            {status}
          </p>

          {choosing && first && last && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {(["start", "end"] as Side[]).map((side) => (
                <button
                  key={side}
                  onClick={() => commit(choosing, side)}
                  className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm font-semibold shadow-md ring-2 ring-[var(--color-gold)] transition active:scale-95"
                >
                  {dt("dom.nextTo")}
                  <Half value={side === "start" ? first.a : last.b} faces={g.faces} size={36} />
                </button>
              ))}
            </div>
          )}

          {human && g.winner === null && !canPlay && (
            <div className="mt-2 flex justify-center">
              {g.pile.length ? (
                <button
                  onClick={draw}
                  className="rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
                >
                  🂠 {dt("dom.draw")}
                </button>
              ) : (
                <button
                  onClick={pass}
                  className="rounded-2xl bg-card px-5 py-2.5 text-base font-semibold shadow-md transition active:scale-95"
                >
                  {dt("dom.pass")} ➜
                </button>
              )}
            </div>
          )}

          {/* The hand of whoever is playing (always yours against the computer) */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {g.hands[vsComputer ? 0 : g.turn].map((tile) => {
              const fits = human && sidesFor(tile, g.line).length > 0;
              return (
                <button
                  key={tile.id}
                  onClick={() => tap(tile)}
                  disabled={!human || g.winner !== null}
                  aria-label={`${localizeSceneTitle(g.faces[tile.a].slug, lang)} · ${localizeSceneTitle(g.faces[tile.b].slug, lang)}`}
                  className={`transition ${fits ? "-translate-y-1" : human ? "opacity-60" : ""} ${
                    shake === tile.id ? "piece-shake" : ""
                  } ${choosing?.id === tile.id ? "scale-110" : ""}`}
                >
                  <DominoTile
                    tile={tile}
                    faces={g.faces}
                    size={handSize}
                    vertical
                    className={fits ? "ring-2 ring-[var(--color-gold)]" : ""}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {cover && g.winner === null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[oklch(0.3_0.05_262/0.75)] p-6">
          <div className="paper-card w-full max-w-sm p-6 text-center">
            <div className="text-4xl">📱</div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {dt("dom.passDevice", { name: nameOf(g.turn) })}
            </p>
            <button
              onClick={() => setCover(false)}
              className="mt-5 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
            >
              {dt("dom.ready")}
            </button>
          </div>
        </div>
      )}

      {g.winner !== null && (
        <ResultCard
          top={vsComputer && g.winner !== 0 ? "🤖" : "🏆"}
          title={
            vsComputer
              ? g.winner === 0
                ? dt("dom.youWin")
                : dt("dom.computerWins")
              : mt("mem.wins").replace("{name}", nameOf(g.winner))
          }
          detail={g.blocked ? dt("dom.blocked") : undefined}
          replayLabel={dt("dom.replay")}
          onReplay={replay}
          backLabel={dt("dom.players")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
