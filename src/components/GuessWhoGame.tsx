import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  CHARACTERS,
  CHARACTER_COUNTS,
  QUESTIONS,
  characterName,
  dealCards,
  guessStars,
  type Character,
  type Trait,
} from "@/lib/guesswho";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import {
  BackButton,
  LevelList,
  MenuScreen,
  ResultCard,
  loadBest,
  saveBest,
  starText,
} from "@/components/GameShell";

import guessBg from "@/assets/guesswho-bg.webp";

const BEST_KEY = "guesswho-best-v1";
const PLAYER_COLORS = ["oklch(0.5 0.13 262)", "oklch(0.55 0.17 25)"];

export function GuessWhoGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId | null>(null);
  const [players, setPlayers] = useState(1);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);

  useBackButton(level !== null, () => setLevel(null));

  if (level) {
    return (
      <GuessBoard
        key={`${level}:${players}`}
        level={level}
        players={players}
        onExit={() => setLevel(null)}
        onComplete={(stars) => setBest(saveBest(BEST_KEY, level, stars))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.guesswho")}
      subtitle={gt("gw.instruction")}
      background={guessBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[1, 2].map((n) => (
          <button
            key={n}
            onClick={() => setPlayers(n)}
            aria-pressed={players === n}
            className={`glass-card flex items-center justify-center gap-2 px-3 py-3 text-base font-semibold transition active:scale-[0.97] ${
              players === n ? "ring-4 ring-[var(--color-gold)]" : ""
            }`}
          >
            {Array.from({ length: n }, (_, i) => (
              <PlayerDot key={i} index={i} />
            ))}
            {n === 1 ? mt("mem.playersOne") : mt("mem.playersMany").replace("{n}", "2")}
          </button>
        ))}
      </div>
      {players === 2 && (
        <p className="-mt-1 mb-4 text-center text-sm text-muted-foreground">
          {gt("gw.twoPlayers")}
        </p>
      )}
      <LevelList
        describe={(id) => gt("gw.charactersCount", { n: CHARACTER_COUNTS[id] })}
        picture={(id, i) => (
          // A little rack of faces (up to 9 shown).
          <span className="absolute inset-0 grid grid-cols-3 gap-0.5 bg-[oklch(0.5_0.13_262)] p-1">
            {CHARACTERS.slice(i * 4, i * 4 + Math.min(9, CHARACTER_COUNTS[id])).map((c) => (
              <img
                key={c.id}
                src={c.image}
                alt=""
                className="aspect-square w-full rounded-sm object-cover"
              />
            ))}
          </span>
        )}
        best={(id) => best[id] ?? 0}
        onPick={setLevel}
      />
    </MenuScreen>
  );
}

function PlayerDot({ index, size = 22 }: { index: number; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border-2 border-white font-bold text-white shadow"
      style={{
        backgroundColor: PLAYER_COLORS[index],
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
      aria-hidden
    >
      {index + 1}
    </span>
  );
}

// What one player has found out so far about their hidden character.
interface PlayerBoard {
  secret: Character;
  down: Set<string>;
  asked: Map<Trait, boolean>;
  cost: number;
}

// ---------- One game ----------
function GuessBoard({
  level,
  players,
  onExit,
  onComplete,
}: {
  level: DifficultyId;
  players: number;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);
  const playerName = (i: number) => mt("mem.player").replace("{n}", String(i + 1));

  const newGame = () => {
    const { cards, secrets } = dealCards(level, players);
    return {
      cards,
      boards: secrets.map((secret) => ({
        secret,
        down: new Set<string>(),
        asked: new Map(),
        cost: 0,
      })),
    };
  };
  const [game, setGame] = useState(newGame);
  const [turn, setTurn] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "yes" | "no" | "plain" } | null>(
    null,
  );
  const [winner, setWinner] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
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

  const { cards, boards } = game;
  const board = boards[turn];
  const name = (c: Character) => characterName(c, lang);
  const standing = (b: PlayerBoard) => cards.filter((c) => !b.down.has(c.id));

  const update = (i: number, change: (b: PlayerBoard) => PlayerBoard) =>
    setGame((g) => ({ ...g, boards: g.boards.map((b, k) => (k === i ? change(b) : b)) }));

  const win = (i: number, cost: number) => {
    setBusy(true);
    later(() => {
      audio.playWin();
      setWinner(i);
      if (players === 1) onComplete(guessStars(cost, cards.length));
    }, 700);
  };

  // After a move, the other player takes their turn.
  const passTurn = (delay: number) => {
    if (players === 1) {
      later(() => setBusy(false), delay);
      return;
    }
    later(() => {
      const next = (turn + 1) % players;
      setTurn(next);
      setMessage({ text: mt("mem.turn").replace("{name}", playerName(next)), tone: "plain" });
      setBusy(false);
    }, delay + 900);
  };

  const ask = (trait: Trait) => {
    if (busy || winner !== null || board.asked.has(trait)) return;
    setSheet(false);
    const answer = board.secret.traits.has(trait);
    const cost = board.cost + 1;
    update(turn, (b) => ({ ...b, asked: new Map(b.asked).set(trait, answer), cost }));
    setMessage({
      text: `${gt(`gw.q.${trait}`)} → ${answer ? gt("gw.yes") : gt("gw.no")}`,
      tone: answer ? "yes" : "no",
    });
    if (answer) audio.playCorrect();
    else audio.playClick();
    // The cards that don't fit the answer fall one after another.
    const falling = standing(board).filter((c) => c.traits.has(trait) !== answer);
    const me = turn;
    setBusy(true);
    falling.forEach((c, k) =>
      later(() => update(me, (b) => ({ ...b, down: new Set(b.down).add(c.id) })), 450 + k * 80),
    );
    const left = standing(board).filter((c) => !falling.includes(c));
    const done = 500 + falling.length * 80;
    if (left.length === 1) {
      later(() => setMessage({ text: gt("gw.found", { name: name(left[0]) }), tone: "yes" }), done);
      later(() => win(me, cost), done);
    } else passTurn(done);
  };

  const guess = (c: Character) => {
    if (busy || winner !== null || board.down.has(c.id)) return;
    const cost = board.cost + 1;
    if (c === board.secret) {
      update(turn, (b) => ({ ...b, cost }));
      setMessage({ text: gt("gw.found", { name: name(c) }), tone: "yes" });
      win(turn, cost);
      return;
    }
    audio.playIncorrect();
    setMessage({ text: gt("gw.notThis", { name: name(c) }), tone: "no" });
    const down = new Set(board.down).add(c.id);
    update(turn, (b) => ({ ...b, down, cost }));
    const left = cards.filter((x) => !down.has(x.id));
    setBusy(true);
    if (left.length === 1) {
      setMessage({ text: gt("gw.found", { name: name(board.secret) }), tone: "yes" });
      win(turn, cost);
    } else passTurn(500);
  };

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setGame(newGame());
    setTurn(0);
    setMessage(null);
    setWinner(null);
    setBusy(false);
  };

  const cols = cards.length <= 6 ? 3 : cards.length <= 12 ? 4 : 6;
  const asked = QUESTIONS.filter((q) => board.asked.has(q.trait));
  const shown = winner !== null ? boards[winner] : board;

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <BedtimeBackdrop image={guessBg} fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-3 py-3">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={gt("gw.levels")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.guesswho")} · {t(`diff.${level}`)}
          </h1>
          {players === 1 && (
            <span className="shrink-0 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold tabular-nums text-foreground/80 shadow-sm">
              ❓ {board.cost}
            </span>
          )}
        </header>

        {players > 1 && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {boards.map((b, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-2xl bg-card/90 px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                  i === turn && winner === null ? "scale-[1.03] ring-4" : "opacity-70"
                }`}
                style={{ ["--tw-ring-color" as string]: PLAYER_COLORS[i] }}
              >
                <PlayerDot index={i} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate">{playerName(i)}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {gt("gw.left", { n: standing(b).length })}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* The rack of cards, like the blue board on the table, in the
            colour of the player whose turn it is. */}
        <div
          className="rounded-3xl p-2 shadow-[0_10px_24px_oklch(0.25_0.06_262/0.45),inset_0_2px_0_oklch(1_0_0/0.25)] transition-colors duration-500"
          style={{
            backgroundColor: players > 1 ? PLAYER_COLORS[winner ?? turn] : PLAYER_COLORS[0],
          }}
        >
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cards.map((c) => {
              const isDown = shown.down.has(c.id);
              const isSecret = winner !== null && c === shown.secret;
              return (
                <button
                  key={c.id}
                  onClick={() => guess(c)}
                  disabled={isDown || winner !== null}
                  aria-label={name(c)}
                  className="relative aspect-[4/5] w-full [perspective:600px]"
                >
                  <span
                    className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
                    style={{ transform: isDown ? "rotateX(-180deg)" : "none" }}
                  >
                    {/* Front: the portrait and the name */}
                    <span
                      className={`absolute inset-0 flex flex-col overflow-hidden rounded-lg bg-[oklch(0.98_0.015_85)] p-0.5 shadow [backface-visibility:hidden] ${
                        isSecret ? "ring-4 ring-[var(--color-gold)]" : ""
                      }`}
                    >
                      <img
                        src={c.image}
                        alt=""
                        draggable={false}
                        className="min-h-0 w-full flex-1 rounded-md object-cover"
                      />
                      <span className="line-clamp-1 px-0.5 pt-0.5 text-center text-[8px] font-semibold leading-tight text-foreground sm:text-[11px]">
                        {name(c)}
                      </span>
                    </span>
                    {/* Back: a card with a star */}
                    <span className="absolute inset-0 grid place-items-center rounded-lg border-2 border-[oklch(0.97_0.02_85)] bg-[oklch(0.4_0.08_262)] text-xl text-[var(--color-gold)] shadow [backface-visibility:hidden] [transform:rotateX(180deg)]">
                      ✦
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card mt-3 px-3 pb-3 pt-2">
          <p
            className={`min-h-[1.5rem] text-center text-sm font-semibold ${
              message?.tone === "yes"
                ? "text-[oklch(0.48_0.13_150)]"
                : message?.tone === "no"
                  ? "text-[oklch(0.55_0.17_25)]"
                  : "text-foreground"
            }`}
            aria-live="polite"
          >
            {message?.text ?? gt("gw.instruction")}
          </p>
          {asked.length > 0 && (
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {asked.map(({ trait, emoji }) => (
                <span
                  key={trait}
                  title={gt(`gw.q.${trait}`)}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    board.asked.get(trait)
                      ? "bg-[oklch(0.9_0.07_150)] text-[oklch(0.35_0.08_150)]"
                      : "bg-[oklch(0.92_0.04_25)] text-[oklch(0.45_0.12_25)]"
                  }`}
                >
                  {emoji} {board.asked.get(trait) ? "✓" : "✗"}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => setSheet(true)}
            disabled={busy || winner !== null}
            className="mx-auto mt-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <span aria-hidden>❓</span>
            {gt("gw.ask")}
          </button>
          <p className="pt-2 text-center text-[11px] italic text-muted-foreground">
            {gt("gw.orGuess")}
          </p>
        </div>
      </div>

      {/* The questions, in a sheet over the bottom of the screen */}
      {sheet && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30"
          onClick={() => setSheet(false)}
        >
          <div
            className="paper-card max-h-[75dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-4 pb-6 animate-in slide-in-from-bottom-10 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl text-foreground">{gt("gw.ask")}</h2>
              <button
                onClick={() => setSheet(false)}
                aria-label={gt("gw.close")}
                className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground/70 shadow-sm"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUESTIONS.map(({ trait, emoji }) => {
                const answer = board.asked.get(trait);
                return (
                  <button
                    key={trait}
                    onClick={() => ask(trait)}
                    disabled={answer !== undefined}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold shadow-sm transition active:scale-95 ${
                      answer === undefined
                        ? "bg-card text-foreground"
                        : answer
                          ? "bg-[oklch(0.9_0.07_150)] text-[oklch(0.35_0.08_150)]"
                          : "bg-[oklch(0.92_0.04_25)] text-[oklch(0.45_0.12_25)]"
                    }`}
                  >
                    <span className="text-xl" aria-hidden>
                      {emoji}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">{gt(`gw.q.${trait}`)}</span>
                    {answer !== undefined && <span aria-hidden>{answer ? "✓" : "✗"}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {winner !== null && (
        <ResultCard
          top={players === 1 ? starText(guessStars(shown.cost, cards.length)) : "🏆"}
          title={
            players === 1
              ? gt("gw.found", { name: name(shown.secret) })
              : mt("mem.wins").replace("{name}", playerName(winner))
          }
          detail={
            <span className="flex flex-col items-center gap-2">
              <img
                src={shown.secret.image}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover shadow"
              />
              {players > 1 && (
                <span className="font-semibold text-foreground">{name(shown.secret)}</span>
              )}
              <span className="text-sm">
                {gt("gw.from", { story: localizeSceneTitle(shown.secret.story.slug, lang) })}
              </span>
              <span className="text-xs">{gt("gw.cost", { n: shown.cost })}</span>
            </span>
          }
          replayLabel={gt("gw.replay")}
          onReplay={replay}
          backLabel={gt("gw.levels")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
