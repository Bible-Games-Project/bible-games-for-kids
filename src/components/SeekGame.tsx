import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import { PAINTING_RATIO } from "@/lib/dragdrop";
import { SEEK_STORIES, itemsFor, seekCount, seekStars } from "@/lib/seek";
import { wordEmoji, wordName } from "@/lib/seek-words";
import type { Story } from "@/lib/stories";
import { useBackButton } from "@/lib/back-button";
import {
  BackButton,
  MenuScreen,
  ResultCard,
  StoryPicker,
  loadBest,
  saveBest,
  starText,
} from "@/components/GameShell";

import homeBg from "@/assets/home-bedtime.webp";

// Best stars per "level:story".
const BEST_KEY = "seek-best-v2";

export function SeekGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId>("easy");
  const [story, setStory] = useState<Story | null>(null);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const st = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(story !== null, () => setStory(null));

  if (story) {
    return (
      <SeekBoard
        key={`${level}:${story.slug}`}
        story={story}
        level={level}
        onExit={() => setStory(null)}
        onComplete={(stars) => setBest(saveBest(BEST_KEY, `${level}:${story.slug}`, stars))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.seek")}
      subtitle={st("seek.instruction")}
      background={homeBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <StoryPicker
        level={level}
        onLevel={setLevel}
        describe={(id) => st("seek.itemsCount", { n: seekCount(id) })}
        stories={SEEK_STORIES}
        badge={(s) => {
          const stars = best[`${level}:${s.slug}`] ?? 0;
          return stars ? (
            <span className="rounded-full bg-card px-1.5 py-0.5 text-xs text-[var(--color-gold)] shadow">
              {"★".repeat(stars)}
            </span>
          ) : null;
        }}
        onPick={setStory}
      />
    </MenuScreen>
  );
}

function SeekBoard({
  story,
  level,
  onExit,
  onComplete,
}: {
  story: Story;
  level: DifficultyId;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const st = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const items = itemsFor(story, level);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState<{ id: number; x: number; y: number }[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [hints, setHints] = useState(0);
  const [hinted, setHinted] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finished) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Closest thing still hidden whose circle contains the tap (distances in
    // % of the width, so circles stay round). A face or head must be hit
    // fairly exactly; things and animals forgive a tap near their edge.
    let hit: string | null = null;
    let bestDist = Infinity;
    for (const it of items) {
      if (found.has(it.word)) continue;
      const d = Math.hypot(x - it.x, (y - it.y) * PAINTING_RATIO);
      const reach = it.word.includes(".") ? 1.15 : 1.35;
      if (d <= it.r * reach && d < bestDist) {
        hit = it.word;
        bestDist = d;
      }
    }
    if (hit) {
      const next = new Set(found).add(hit);
      setFound(next);
      setHinted(null);
      audio.playCorrect();
      if (next.size === items.length) {
        const stars = seekStars(hints, missCount);
        later(() => {
          audio.playWin();
          setFinished(true);
          onComplete(stars);
        }, 700);
      }
      return;
    }
    audio.playIncorrect();
    const id = Date.now();
    setMissCount((m) => m + 1);
    setMisses((m) => [...m, { id, x, y }]);
    later(() => setMisses((m) => m.filter((mm) => mm.id !== id)), 700);
  };

  const hint = () => {
    const left = items.filter((it) => !found.has(it.word));
    if (!left.length || finished) return;
    const pick = left[Math.floor(Math.random() * left.length)];
    setHints((h) => h + 1);
    setHinted(pick.word);
    later(() => setHinted((h) => (h === pick.word ? null : h)), 2200);
  };

  const replay = () => {
    setFound(new Set());
    setMisses([]);
    setMissCount(0);
    setHints(0);
    setHinted(null);
    setFinished(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={st("seek.levels")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {localizeSceneTitle(story.slug, lang)}
          </h1>
          <button
            onClick={hint}
            className="shrink-0 rounded-full bg-[var(--color-gold)] px-3 py-2 text-sm font-semibold text-[oklch(0.31_0.08_262)] shadow-sm transition active:scale-95"
          >
            ✨ {st("seek.hint")}
          </button>
        </header>

        <p className="pb-2 text-center text-sm text-muted-foreground">
          {st("seek.instruction")} · {st("seek.found", { n: found.size, total: items.length })}
        </p>

        {/* What to find */}
        <ul className="flex flex-wrap justify-center gap-2 pb-3">
          {items.map((it) => {
            const isFound = found.has(it.word);
            return (
              <li
                key={it.word}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                  isFound
                    ? "bg-[oklch(0.86_0.08_150)] text-[oklch(0.3_0.06_150)]"
                    : "bg-card text-foreground"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {wordEmoji(it.word)}
                </span>
                <span className={isFound ? "line-through decoration-2" : ""}>
                  {wordName(it.word, lang)}
                </span>
                {isFound && <span aria-hidden>✓</span>}
              </li>
            );
          })}
        </ul>

        <div
          ref={boardRef}
          onPointerDown={tap}
          className="relative w-full cursor-pointer touch-manipulation overflow-hidden rounded-3xl shadow-lg"
          style={{ aspectRatio: `1 / ${PAINTING_RATIO}` }}
        >
          <img
            src={story.image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {items.map((it) => {
            const isFound = found.has(it.word);
            if (!isFound && hinted !== it.word) return null;
            return (
              <span
                key={it.word}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 ${
                  isFound
                    ? "border-[oklch(0.84_0.115_78)] shadow-[0_0_0_3px_oklch(1_0_0/0.7)]"
                    : "animate-pulse border-white bg-white/25 shadow-[0_0_24px_8px_oklch(0.9_0.12_85/0.8)]"
                }`}
                style={{
                  left: `${it.x}%`,
                  top: `${it.y}%`,
                  width: `${2 * it.r * 1.1}%`,
                  aspectRatio: "1",
                }}
              >
                {isFound && (
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[oklch(0.55_0.13_150)] text-xs font-bold text-white shadow">
                    ✓
                  </span>
                )}
              </span>
            );
          })}
          {misses.map((m) => (
            <span
              key={m.id}
              aria-hidden
              className="pointer-events-none absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/90 bg-[oklch(0.6_0.18_25/0.55)] text-base font-bold text-white animate-out fade-out zoom-out-75 duration-700"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              ✗
            </span>
          ))}
        </div>
      </div>

      {finished && (
        <ResultCard
          top={starText(seekStars(hints, missCount))}
          title={st("seek.complete")}
          replayLabel={st("seek.replay")}
          onReplay={replay}
          backLabel={st("seek.levels")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
