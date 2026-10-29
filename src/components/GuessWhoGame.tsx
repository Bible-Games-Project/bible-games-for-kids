import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
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

export function GuessWhoGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId | null>(null);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(level !== null, () => setLevel(null));

  if (level) {
    return (
      <GuessBoard
        key={level}
        level={level}
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
      <LevelList
        describe={(id) => gt("gw.charactersCount", { n: CHARACTER_COUNTS[id] })}
        picture={(id, i) => (
          // A little rack of as many faces as the level deals (up to 9 shown).
          <span className="absolute inset-0 grid grid-cols-3 gap-0.5 bg-[oklch(0.5_0.13_262)] p-1">
            {CHARACTERS.slice(i * 3, i * 3 + Math.min(9, CHARACTER_COUNTS[id])).map((c) => (
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

// ---------- One game ----------
function GuessBoard({
  level,
  onExit,
  onComplete,
}: {
  level: DifficultyId;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const gt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  const [deal, setDeal] = useState(() => dealCards(level));
  const [down, setDown] = useState<Set<string>>(new Set());
  const [asked, setAsked] = useState<Map<Trait, boolean>>(new Map());
  const [message, setMessage] = useState<{ text: string; tone: "yes" | "no" | "plain" } | null>(
    null,
  );
  const [cost, setCost] = useState(0);
  const [won, setWon] = useState(false);
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

  const { cards, secret } = deal;
  const name = (c: Character) => characterName(c, lang);

  const win = (spent: number) => {
    setBusy(true);
    later(() => {
      audio.playWin();
      setWon(true);
      onComplete(guessStars(spent, cards.length));
    }, 700);
  };

  const ask = (trait: Trait, label: string) => {
    if (busy || won || asked.has(trait)) return;
    const answer = secret.traits.has(trait);
    const spent = cost + 1;
    setCost(spent);
    setAsked(new Map(asked).set(trait, answer));
    setMessage({
      text: `${label} → ${answer ? gt("gw.yes") : gt("gw.no")}`,
      tone: answer ? "yes" : "no",
    });
    if (answer) audio.playCorrect();
    else audio.playClick();
    // The cards that don't fit the answer fall one after another.
    const falling = cards.filter((c) => !down.has(c.id) && c.traits.has(trait) !== answer);
    setBusy(true);
    falling.forEach((c, k) => later(() => setDown((d) => new Set(d).add(c.id)), 450 + k * 90));
    later(
      () => {
        setBusy(false);
        const standing = cards.filter((c) => !down.has(c.id) && !falling.includes(c));
        if (standing.length === 1) {
          setMessage({ text: gt("gw.found", { name: name(standing[0]) }), tone: "yes" });
          win(spent);
        }
      },
      500 + falling.length * 90,
    );
  };

  const guess = (c: Character) => {
    if (busy || won || down.has(c.id)) return;
    const spent = cost + 1;
    setCost(spent);
    if (c === secret) {
      setMessage({ text: gt("gw.found", { name: name(c) }), tone: "yes" });
      win(spent);
      return;
    }
    audio.playIncorrect();
    setMessage({ text: gt("gw.notThis", { name: name(c) }), tone: "no" });
    const next = new Set(down).add(c.id);
    setDown(next);
    if (cards.filter((x) => !next.has(x.id)).length === 1) {
      setMessage({ text: gt("gw.found", { name: name(secret) }), tone: "yes" });
      win(spent);
    }
  };

  const replay = () => {
    setDeal(dealCards(level));
    setDown(new Set());
    setAsked(new Map());
    setMessage(null);
    setCost(0);
    setWon(false);
    setBusy(false);
  };

  const cols = cards.length <= 9 ? 3 : cards.length <= 16 ? 4 : 5;

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <BedtimeBackdrop image={guessBg} fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-3 py-3">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={gt("gw.levels")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.guesswho")} · {t(`diff.${level}`)}
          </h1>
          <span className="shrink-0 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold tabular-nums text-foreground/80 shadow-sm">
            ❓ {cost}
          </span>
        </header>

        {/* The rack of cards, like the blue board on the table. */}
        <div className="rounded-3xl bg-[oklch(0.5_0.13_262)] p-2 shadow-[0_10px_24px_oklch(0.25_0.06_262/0.45),inset_0_2px_0_oklch(1_0_0/0.25)]">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cards.map((c) => {
              const isDown = down.has(c.id);
              const isSecret = won && c === secret;
              return (
                <button
                  key={c.id}
                  onClick={() => guess(c)}
                  disabled={isDown || won}
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
                      <span className="line-clamp-1 px-0.5 pt-0.5 text-center text-[9px] font-semibold leading-tight text-foreground sm:text-[11px]">
                        {name(c)}
                      </span>
                    </span>
                    {/* Back: a blue card with a star */}
                    <span className="absolute inset-0 grid place-items-center rounded-lg border-2 border-[oklch(0.97_0.02_85)] bg-[oklch(0.45_0.12_262)] text-2xl text-[var(--color-gold)] shadow [backface-visibility:hidden] [transform:rotateX(180deg)]">
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
            {message?.text ?? gt("gw.ask")}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {QUESTIONS.map(({ trait, emoji }) => {
              const label = gt(`gw.q.${trait}`);
              const answer = asked.get(trait);
              return (
                <button
                  key={trait}
                  onClick={() => ask(trait, label)}
                  disabled={answer !== undefined || busy || won}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                    answer === undefined
                      ? "bg-card text-foreground disabled:opacity-60"
                      : answer
                        ? "bg-[oklch(0.9_0.07_150)] text-[oklch(0.35_0.08_150)]"
                        : "bg-[oklch(0.92_0.04_25)] text-[oklch(0.45_0.12_25)]"
                  }`}
                >
                  <span aria-hidden>{emoji}</span>
                  {label}
                  {answer !== undefined && <span aria-hidden>{answer ? " ✓" : " ✗"}</span>}
                </button>
              );
            })}
          </div>
          <p className="pt-2 text-center text-[11px] italic text-muted-foreground">
            {gt("gw.orGuess")}
          </p>
        </div>
      </div>

      {won && (
        <ResultCard
          top={starText(guessStars(cost, cards.length))}
          title={gt("gw.found", { name: name(secret) })}
          detail={
            <span className="flex flex-col items-center gap-2">
              <img
                src={secret.image}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover shadow"
              />
              <span className="text-sm">
                {gt("gw.from", { story: localizeSceneTitle(secret.story.slug, lang) })}
              </span>
              <span className="text-xs">{gt("gw.cost", { n: cost })}</span>
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
