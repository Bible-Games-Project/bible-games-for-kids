import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import {
  MEMORY_LEVELS,
  buildDeck,
  computeMemoryStars,
  loadMemoryProgress,
  saveMemoryResult,
  type MemoryCard,
  type MemoryLevel,
} from "@/lib/memory";

import menuBg from "@/assets/menu-background.jpg";

const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function MemoryGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<MemoryLevel | null>(null);
  const [progress, setProgress] = useState(() => loadMemoryProgress());

  const mt = (k: string) => memText(lang, k);

  if (level) {
    return (
      <MemoryBoard
        level={level}
        onExit={() => setLevel(null)}
        onComplete={(stars) => setProgress(saveMemoryResult(level.id, stars))}
      />
    );
  }

  const bgStyle = {
    backgroundImage: `linear-gradient(180deg, oklch(0.98 0.015 80 / 0.4), oklch(0.96 0.03 60 / 0.85)), url(${menuBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  } as const;

  // ---------- Level select ----------
  return (
    <div className="min-h-[100dvh] w-full">
      <div className="relative min-h-[100dvh] w-full" style={bgStyle}>
        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
            aria-label={t("select.back")}
          >
            ←
          </button>
          <h1 className="font-display text-2xl sm:text-3xl">{mt("mem.chooseLevel")}</h1>
        </header>
        <p className="mx-auto max-w-3xl px-6 pt-1 text-sm italic text-muted-foreground">
          {mt("mem.instruction")}
        </p>
        <main className="mx-auto grid max-w-3xl gap-4 px-4 pb-12 pt-4">
          {MEMORY_LEVELS.map((lv) => {
            const best = progress[lv.id] ?? 0;
            const cards = lv.pairs * 2;
            return (
              <button
                key={lv.id}
                onClick={() => setLevel(lv)}
                className="paper-card flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.99]"
              >
                {/* Miniature of the real card layout for this level */}
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--color-sage-soft)] p-2">
                  <span
                    className="grid gap-[2px]"
                    style={{
                      gridTemplateColumns: `repeat(${lv.cols}, minmax(0, 1fr))`,
                      // Narrow tall layouts so every row fits inside the tile.
                      width: `min(100%, ${Math.floor((34 * lv.cols * lv.cols) / cards)}px)`,
                    }}
                    aria-hidden
                  >
                    {Array.from({ length: cards }, (_, i) => (
                      <span
                        key={i}
                        className="aspect-[4/5] rounded-[2px] bg-[var(--color-primary)]"
                      />
                    ))}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl leading-snug">{t(`diff.${lv.id}`)}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mt("mem.pairsCount").replace("{n}", String(lv.pairs))}
                  </p>
                </div>
                <span className="shrink-0 text-base tracking-wider" aria-label={`${best} of 3 stars`}>
                  <span className="text-[var(--color-gold)]">{"★".repeat(best)}</span>
                  <span className="text-[oklch(0.85_0.02_75)]">{"★".repeat(3 - best)}</span>
                </span>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}

// ---------- The matching-pairs board ----------
function MemoryBoard({
  level,
  onExit,
  onComplete,
}: {
  level: MemoryLevel;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const mt = (k: string) => memText(lang, k);

  const [deck, setDeck] = useState<MemoryCard[]>(() => buildDeck(level.pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  // Boost music volume while playing; restore menu volume on exit.
  useEffect(() => {
    audio.setScope("puzzle");
    return () => audio.setScope("menu");
  }, [audio]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (startedAt === null || done) return;
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };

  const flip = (index: number) => {
    const card = deck[index];
    if (busyRef.current || done || matched.has(card.scene.slug) || flipped.includes(index)) return;
    audio.playClick();
    if (startedAt === null) setStartedAt(Date.now());

    if (flipped.length === 0) {
      setFlipped([index]);
      return;
    }

    const first = deck[flipped[0]];
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (first.scene.slug === card.scene.slug) {
      const next = new Set(matched);
      next.add(card.scene.slug);
      setMatched(next);
      setFlipped([]);
      setLastFound(card.scene.slug);
      audio.playCorrect();
      if (next.size === level.pairs) {
        busyRef.current = true;
        const earned = computeMemoryStars(level.pairs, nextMoves);
        later(() => {
          setElapsed(Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000));
          setStars(earned);
          setDone(true);
          busyRef.current = false;
          audio.playWin();
          onComplete(earned);
        }, 600);
      }
      return;
    }

    // Not a pair — let the child see both paintings, then turn them back.
    setFlipped([flipped[0], index]);
    busyRef.current = true;
    later(() => audio.playIncorrect(), 450);
    later(() => {
      setFlipped([]);
      busyRef.current = false;
    }, 1100);
  };

  const restart = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
    busyRef.current = false;
    setDeck(buildDeck(level.pairs));
    setFlipped([]);
    setMatched(new Set());
    setLastFound(null);
    setMoves(0);
    setStartedAt(null);
    setElapsed(0);
    setStars(0);
    setDone(false);
  };

  const rows = deck.length / level.cols;

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-2">
          <button
            onClick={onExit}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
            aria-label={mt("mem.levels")}
          >
            ←
          </button>
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {t("game.memory")} · {t(`diff.${level.id}`)}
          </h1>
          <div className="flex shrink-0 gap-3 text-right text-xs text-muted-foreground tabular-nums">
            <span>
              {mt("mem.moves")}
              <span className="block text-base font-bold text-foreground">{moves}</span>
            </span>
            <span>
              {mt("mem.time")}
              <span className="block text-base font-bold text-foreground">{formatTime(elapsed)}</span>
            </span>
          </div>
        </header>

        <p className="min-h-[1.5rem] pb-3 text-center text-sm text-muted-foreground">
          {lastFound ? (
            <span key={lastFound} className="inline-block animate-in fade-in font-semibold text-[oklch(0.45_0.12_70)]">
              ✓ {localizeSceneTitle(lastFound, lang)}
            </span>
          ) : (
            mt("mem.instruction")
          )}
        </p>

        {/* Width is capped by the screen height so the whole grid stays
            visible without scrolling, even at 30 cards. */}
        <div
          className="mx-auto grid w-full gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
            maxWidth: `min(100%, calc((100dvh - 150px) * ${(level.cols * 0.8) / rows}))`,
          }}
        >
          {deck.map((card, i) => {
            const isMatched = matched.has(card.scene.slug);
            const faceUp = isMatched || flipped.includes(i);
            const title = localizeSceneTitle(card.scene.slug, lang);
            return (
              <button
                key={card.key}
                onClick={() => flip(i)}
                disabled={isMatched}
                aria-label={faceUp ? title : mt("mem.hidden")}
                className="relative aspect-[4/5] w-full rounded-xl [perspective:800px]"
              >
                <span
                  className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
                  style={{ transform: faceUp ? "rotateY(180deg)" : "none" }}
                >
                  {/* Card back */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-xl bg-[var(--color-primary)] shadow-md ring-2 ring-inset ring-[oklch(0.98_0.02_80/0.55)] [backface-visibility:hidden]"
                    style={{
                      backgroundImage:
                        "radial-gradient(oklch(1 0 0 / 0.16) 1.2px, transparent 1.4px), linear-gradient(145deg, oklch(0.74 0.11 45), oklch(0.62 0.12 35))",
                      backgroundSize: "12px 12px, 100% 100%",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" aria-hidden>
                      <path
                        d="M12 3v18M6 9h12"
                        stroke="oklch(0.98 0.02 80)"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                  {/* Card face */}
                  <span
                    className={`absolute inset-0 overflow-hidden rounded-xl bg-card shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                      isMatched ? "ring-[3px] ring-[var(--color-gold)]" : ""
                    }`}
                  >
                    <img
                      src={card.scene.image}
                      alt=""
                      draggable={false}
                      className="h-full w-full select-none object-cover"
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="paper-card w-full max-w-sm p-6 text-center">
            <div className="text-5xl">
              {"⭐".repeat(stars)}
              {"☆".repeat(3 - stars)}
            </div>
            <h2 className="mt-3 font-display text-2xl text-foreground">{mt("mem.complete")}</h2>
            <p className="mt-2 text-base text-muted-foreground tabular-nums">
              {mt("mem.moves")}: {moves} · {mt("mem.time")}: {formatTime(elapsed)}
            </p>
            <button
              onClick={restart}
              className="mt-5 w-full rounded-2xl bg-card px-5 py-3 text-base font-semibold text-foreground/80 shadow-sm transition active:scale-95"
            >
              {mt("mem.replay")}
            </button>
            <button
              onClick={onExit}
              className="mt-2 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
            >
              {mt("mem.levels")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
