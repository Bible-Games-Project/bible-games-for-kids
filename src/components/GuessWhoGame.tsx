import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  CHARACTER_COUNTS,
  QUESTIONS,
  characterName,
  dealBoards,
  guessStars,
  type Character,
  type Trait,
} from "@/lib/guesswho";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import {
  BackButton,
  LevelTabs,
  MenuScreen,
  ResultCard,
  loadBest,
  saveBest,
  starText,
  ScreenFade,
  Stars,
} from "@/components/GameShell";

import { PlayerPawn, TOKEN_ORDER } from "@/components/Token";

import guessBg from "@/assets/guesswho-bg.webp";
import hintArt from "@/assets/ui/hint.webp";

const BEST_KEY = "guesswho-best-v1";

export function GuessWhoGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("guesswho");
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId>("easy");
  const [game, setGame] = useState<{ level: DifficultyId; players: number } | null>(null);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const mt = (k: string) => memText(lang, k);

  useBackButton(game !== null, () => setGame(null));

  if (game) {
    return (
      <GuessBoard
        key={`${game.level}:${game.players}`}
        level={game.level}
        players={game.players}
        onExit={() => setGame(null)}
        onComplete={(stars) => setBest(saveBest(BEST_KEY, game.level, stars))}
      />
    );
  }

  // Pick the level on the tabs, then the number of players starts the game.
  return (
    <MenuScreen
      title={t("game.guesswho")}
      subtitle={gt("gw.instruction")}
      background={guessBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <LevelTabs level={level} onLevel={setLevel} />
      <p className="mt-2 flex items-center justify-center gap-2 text-center text-xs italic text-muted-foreground">
        {gt("gw.charactersCount", { n: CHARACTER_COUNTS[level] })}
        <Stars value={best[level] ?? 0} className="text-sm not-italic" />
      </p>
      <h2 className="mt-5 text-center font-display text-2xl text-[oklch(0.99_0.01_85)] [text-shadow:0_2px_8px_oklch(0.25_0.05_50/0.85)]">
        {mt("mem.howManyPlayers")}
      </h2>
      <div className="mx-auto mt-3 grid w-fit grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => {
              window.scrollTo(0, 0);
              setGame({ level, players: n });
            }}
            aria-label={
              n === 1 ? mt("mem.playersOne") : mt("mem.playersMany").replace("{n}", String(n))
            }
            className="paint-box paint-square paint-thin grid h-24 w-24 place-items-center p-3 transition active:scale-[0.95]"
          >
            <span className="flex max-w-[3.5rem] flex-wrap justify-center gap-1">
              {Array.from({ length: n }, (_, i) => (
                <PlayerDot key={i} index={i} size={18} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <p className="paint-box paint-long mt-4 px-5 py-3.5 text-center text-sm text-foreground/80">
        {gt("gw.twoPlayers")}
      </p>
    </MenuScreen>
  );
}

// A player's standing pawn (the Parchís pawns).
function PlayerDot({ index, size = 20 }: { index: number; size?: number }) {
  return <PlayerPawn color={TOKEN_ORDER[index]} size={size} />;
}

// What one player has found out so far about their hidden character.
interface PlayerBoard {
  cards: Character[];
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

  const newGame = () => ({
    boards: dealBoards(level, players).map(({ cards, secret }) => ({
      cards,
      secret,
      down: new Set<string>(),
      asked: new Map(),
      cost: 0,
    })),
  });
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

  const { boards } = game;
  const board = boards[turn];
  const cards = board.cards;
  const name = (c: Character) => characterName(c, lang);
  const standing = (b: PlayerBoard) => b.cards.filter((c) => !b.down.has(c.id));

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
    else audio.playIncorrect();
    // The cards that don't fit the answer fall one after another.
    const falling = standing(board).filter((c) => c.traits.has(trait) !== answer);
    const me = turn;
    setBusy(true);
    falling.forEach((c, k) =>
      later(
        () => {
          update(me, (b) => ({ ...b, down: new Set(b.down).add(c.id) }));
          if (k < 10) audio.play("card-fall", 0.45);
        },
        450 + k * 80,
      ),
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
      <ScreenFade />
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
                className={`paint-box paint-long paint-flat paint-thin flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition ${
                  i === turn && winner === null ? "paint-picked scale-[1.03]" : "opacity-70"
                }`}
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

        {/* The cards, each standing in a painted frame. A card that is
            ruled out tips over backwards and falls flat, like on the real
            game's board. */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {shown.cards.map((c) => {
            const isDown = shown.down.has(c.id);
            const isSecret = winner !== null && c === shown.secret;
            return (
              <button
                key={c.id}
                onClick={() => guess(c)}
                disabled={isDown || winner !== null}
                aria-label={name(c)}
                className="relative aspect-[4/5] w-full [perspective:500px]"
              >
                {/* where the card stood */}
                <span className="absolute inset-x-[8%] bottom-0 h-[14%] rounded-[50%] bg-[oklch(0.3_0.05_50/0.22)] blur-[2px]" />
                <span
                  className={`paint-box paint-tall paint-flat paint-tiny absolute inset-0 flex origin-bottom flex-col p-[9%] transition-[transform,opacity] duration-700 ${
                    isSecret ? "paint-picked" : ""
                  }`}
                  style={{
                    transform: isDown ? "rotateX(84deg)" : "none",
                    opacity: isDown ? 0.55 : 1,
                    transitionTimingFunction: isDown
                      ? "cubic-bezier(0.55, 0, 0.85, 0.35)"
                      : "cubic-bezier(0.2, 0.7, 0.3, 1)",
                  }}
                >
                  <img
                    src={c.image}
                    alt=""
                    draggable={false}
                    className="min-h-0 w-full flex-1 select-none rounded-[6px] object-cover"
                  />
                  <span className="line-clamp-1 px-0.5 pt-0.5 text-center text-[8px] font-semibold leading-tight text-foreground sm:text-[11px]">
                    {name(c)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="paint-box paint-long mt-3 px-5 pb-4 pt-3">
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
            onClick={() => {
              audio.playClick();
              setSheet(true);
            }}
            disabled={busy || winner !== null}
            className="paint-box paint-wide paint-flat paint-thin mx-auto mt-3 flex w-full max-w-xs items-center justify-center gap-3 px-5 py-3.5 font-display text-xl text-[oklch(0.42_0.11_50)] transition active:scale-95 disabled:opacity-50"
          >
            <img
              src={hintArt}
              alt=""
              aria-hidden
              draggable={false}
              className="h-9 w-9 select-none"
            />
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
            className="paint-box paint-tall paint-solid w-full max-w-lg animate-in slide-in-from-bottom-10 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[75dvh] overflow-y-auto px-6 pb-7 pt-6">
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
