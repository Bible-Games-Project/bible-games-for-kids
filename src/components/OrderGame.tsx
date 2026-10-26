import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import type { Story } from "@/lib/stories";
import { ORDER_OPTIONS, ORDER_ROUNDS, orderStars, pickRound } from "@/lib/order";
import { useBackButton } from "@/lib/back-button";
import {
  BackButton,
  LevelList,
  MenuScreen,
  ResultCard,
  loadBest,
  saveBest,
  starText,
} from "@/components/GameShell";
import { STORIES } from "@/lib/stories";

import homeBg from "@/assets/home-bedtime.webp";

const BEST_KEY = "order-best-v1";

export function OrderGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId | null>(null);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const ot = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(level !== null, () => setLevel(null));

  if (level) {
    return (
      <OrderBoard
        key={level}
        level={level}
        onExit={() => setLevel(null)}
        onComplete={(stars) => setBest(saveBest(BEST_KEY, level, stars))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.order")}
      subtitle={ot("order.instruction")}
      background={homeBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <LevelList
        describe={(id) => ot("order.optionsCount", { n: ORDER_OPTIONS[id] })}
        picture={(id) => {
          // A little fan of as many paintings as the level shows.
          const n = ORDER_OPTIONS[id];
          return (
            <span className="absolute inset-0 bg-[oklch(0.93_0.04_62)]">
              {STORIES.slice(0, n).map((s, i) => (
                <img
                  key={s.slug}
                  src={s.image}
                  alt=""
                  className="absolute top-3 h-[72%] w-auto rounded-md border-2 border-white shadow"
                  style={{
                    left: `${8 + (i * 56) / Math.max(1, n - 1)}%`,
                    transform: `rotate(${(i - (n - 1) / 2) * 7}deg)`,
                  }}
                />
              ))}
            </span>
          );
        }}
        best={(id) => best[id] ?? 0}
        onPick={setLevel}
      />
    </MenuScreen>
  );
}

function OrderBoard({
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
  const ot = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const count = ORDER_OPTIONS[level];

  const seen = useRef(new Set<string>());
  const newRound = () => {
    const r = pickRound(count, seen.current);
    r.forEach((s) => seen.current.add(s.slug));
    return r;
  };

  const [round, setRound] = useState(1);
  const [cards, setCards] = useState<Story[]>(newRound);
  const [answer, setAnswer] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const earliest = cards.reduce((a, b) => (b.era < a.era ? b : a), cards[0]);
  // 1, 2, 3... in Bible order, shown once the child has answered.
  const rank = (s: Story) => [...cards].sort((a, b) => a.era - b.era).indexOf(s) + 1;

  const choose = (s: Story) => {
    if (answer) return;
    setAnswer(s.slug);
    const ok = s === earliest;
    const total = right + (ok ? 1 : 0);
    if (ok) {
      setRight(total);
      audio.playCorrect();
    } else {
      audio.playIncorrect();
    }
    timer.current = window.setTimeout(
      () => {
        if (round === ORDER_ROUNDS) {
          audio.playWin();
          setFinished(true);
          onComplete(orderStars(total));
          return;
        }
        setRound((r) => r + 1);
        setCards(newRound());
        setAnswer(null);
      },
      ok ? 1600 : 2600,
    );
  };

  const replay = () => {
    seen.current = new Set();
    setRound(1);
    setRight(0);
    setCards(newRound());
    setAnswer(null);
    setFinished(false);
  };

  const wasRight = answer !== null && answer === earliest.slug;

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={ot("order.levels")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {t("game.order")} · {t(`diff.${level}`)}
          </h1>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
            ✓ {right}
          </span>
        </header>
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {ot("order.round", { n: round, total: ORDER_ROUNDS })}
        </p>
        <p
          className={`min-h-[1.75rem] pb-3 pt-1 text-center text-base font-semibold ${
            answer ? (wasRight ? "text-[oklch(0.5_0.13_150)]" : "text-[oklch(0.55_0.17_25)]") : "text-foreground"
          }`}
        >
          {answer ? (wasRight ? ot("order.correct") : ot("order.wrong")) : ot("order.instruction")}
        </p>

        <div className={`grid gap-3 ${count >= 5 ? "grid-cols-3" : "grid-cols-2"}`}>
          {cards.map((s) => {
            const isEarliest = s === earliest;
            const isChosen = answer === s.slug;
            return (
              <button
                key={s.slug}
                onClick={() => choose(s)}
                disabled={answer !== null}
                className={`flex flex-col overflow-hidden rounded-2xl bg-card p-1.5 text-left shadow-md transition active:scale-[0.97] ${
                  answer && isEarliest ? "ring-4 ring-[oklch(0.6_0.14_150)]" : ""
                } ${answer && isChosen && !isEarliest ? "piece-shake ring-4 ring-[oklch(0.62_0.18_25)]" : ""} ${
                  answer && !isEarliest && !isChosen ? "opacity-75" : ""
                }`}
              >
                <span className="relative aspect-[7/9] w-full overflow-hidden rounded-xl">
                  <img src={s.image} alt="" draggable={false} className="h-full w-full object-cover" />
                  {answer && (
                    <span
                      className={`absolute left-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full text-base font-bold text-white shadow animate-in zoom-in-50 ${
                        isEarliest ? "bg-[oklch(0.55_0.13_150)]" : "bg-[oklch(0.31_0.08_262/0.85)]"
                      }`}
                    >
                      {rank(s)}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 px-1 pt-1.5 pb-0.5 text-center text-xs font-semibold leading-tight text-foreground">
                  {localizeSceneTitle(s.slug, lang)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {finished && (
        <ResultCard
          top={starText(orderStars(right))}
          title={ot("order.result", { n: right, total: ORDER_ROUNDS })}
          replayLabel={ot("order.replay")}
          onReplay={replay}
          backLabel={ot("order.levels")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
