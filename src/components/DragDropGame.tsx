import { useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { ddText } from "@/lib/dragdrop-i18n";
import {
  COLLECTIONS,
  isFreeStory,
  type CollectionId,
  type DragCollection,
  type DragStory,
} from "@/lib/dragdrop";
import {
  completedCount,
  isStoryCompleted,
  isStoryUnlocked,
  loadDDProgress,
  markStoryComplete,
} from "@/lib/dragdrop-progress";

import menuBg from "@/assets/menu-background.jpg";

type View =
  | { screen: "collections" }
  | { screen: "stories"; collectionId: CollectionId }
  | { screen: "play"; story: DragStory };

export function DragDropGame({
  onBack,
  onOpenPremium,
}: {
  onBack: () => void;
  onOpenPremium: () => void;
}) {
  const { lang, premium, devMode, t } = useSettings();
  const [view, setView] = useState<View>({ screen: "collections" });
  const [progress, setProgress] = useState(() => loadDDProgress());
  const [showLock, setShowLock] = useState(false);

  const dt = (k: string) => ddText(lang, k);

  const bgStyle = {
    backgroundImage: `linear-gradient(180deg, oklch(0.98 0.015 80 / 0.4), oklch(0.96 0.03 60 / 0.85)), url(${menuBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  } as const;

  const BackButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
      aria-label={label}
    >
      ←
    </button>
  );

  // ---------- Play screen ----------
  if (view.screen === "play") {
    return (
      <DragDropBoard
        key={view.story.id}
        story={view.story}
        onExit={() => setView({ screen: "stories", collectionId: view.story.collectionId })}
        onComplete={() => {
          setProgress(markStoryComplete(view.story.collectionId, view.story.id));
        }}
      />
    );
  }

  // ---------- Stories list ----------
  if (view.screen === "stories") {
    const collection = COLLECTIONS.find((c) => c.id === view.collectionId)!;
    return (
      <div className="min-h-[100dvh] w-full">
        <div className="relative min-h-[100dvh] w-full" style={bgStyle}>
          <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
            <BackButton onClick={() => setView({ screen: "collections" })} label={dt("dd.backStories")} />
            <h1 className="font-display text-2xl sm:text-3xl">{dt(collection.labelKey)}</h1>
          </header>
          <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3">
            {collection.stories.length === 0 ? (
              <p className="mt-16 text-center text-base italic text-muted-foreground">
                {dt("dd.emptyCollection")}
              </p>
            ) : (
              <StoryList
                collection={collection}
                progress={progress}
                premium={premium}
                devMode={devMode}
                dt={dt}
                onPlay={(story) => setView({ screen: "play", story })}
                onLocked={() => setShowLock(true)}
              />
            )}
          </main>
        </div>
        {showLock && (
          <LockModal
            t={t}
            onClose={() => setShowLock(false)}
            onUnlock={() => {
              setShowLock(false);
              onOpenPremium();
            }}
          />
        )}
      </div>
    );
  }

  // ---------- Collection select ----------
  return (
    <div className="min-h-[100dvh] w-full">
      <div className="relative min-h-[100dvh] w-full" style={bgStyle}>
        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <BackButton onClick={onBack} label={t("select.back")} />
          <h1 className="font-display text-2xl sm:text-3xl">{dt("dd.chooseCollection")}</h1>
        </header>
        <main className="mx-auto grid max-w-3xl gap-4 px-4 pb-12 pt-4">
          {COLLECTIONS.map((c) => {
            const done = completedCount(c.id, progress);
            const total = c.stories.length;
            return (
              <button
                key={c.id}
                onClick={() => setView({ screen: "stories", collectionId: c.id })}
                className="paper-card flex w-full items-center gap-4 p-5 text-left transition active:scale-[0.99]"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--color-sage-soft)] text-3xl">
                  {c.id === "old-testament" ? "📜" : "✝️"}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl leading-snug">{dt(c.labelKey)}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{dt(c.descKey)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-muted-foreground">
                  {done}/{total || 25}
                </span>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}

function StoryList({
  collection,
  progress,
  premium,
  devMode,
  dt,
  onPlay,
  onLocked,
}: {
  collection: DragCollection;
  progress: ReturnType<typeof loadDDProgress>;
  premium: boolean;
  devMode: boolean;
  dt: (k: string) => string;
  onPlay: (s: DragStory) => void;
  onLocked: () => void;
}) {
  return (
    <>
      {collection.stories.map((story, i) => {
        const progressUnlocked = devMode || isStoryUnlocked(collection.stories, i, progress);
        const premiumAllowed = devMode || premium || isFreeStory(i);
        const premiumLocked = !premiumAllowed;
        const unlocked = progressUnlocked && premiumAllowed;
        const completed = isStoryCompleted(collection.id, story.id, progress);
        const clickable = unlocked || premiumLocked;
        return (
          <button
            key={story.id}
            disabled={!clickable}
            onClick={() => {
              if (premiumLocked) return onLocked();
              if (unlocked) onPlay(story);
            }}
            className="paper-card group relative grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-4 overflow-hidden p-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:grid-cols-[120px_minmax(0,1fr)]"
          >
            <div
              className="relative aspect-[7/9] overflow-hidden rounded-xl"
              style={{ backgroundImage: `url(${story.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              {premiumLocked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.96_0.03_60/0.78)] text-2xl text-[var(--color-gold)]">
                  ✨
                </div>
              ) : !unlocked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.96_0.03_60/0.7)] text-2xl">
                  🔒
                </div>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                {dt("dd.story")} {i + 1}
              </p>
              <h3 className="mt-1 truncate font-display text-lg leading-snug sm:text-xl">
                {dt(`dd.title.${story.slug}`)}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                {premiumLocked && (
                  <span className="rounded-full bg-[var(--color-gold)]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.12_70)]">
                    ✨
                  </span>
                )}
                {completed && !premiumLocked && (
                  <span className="text-base text-[var(--color-gold)]" aria-hidden>
                    ★
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}

// ---------- The drag & drop activity ----------
function DragDropBoard({
  story,
  onExit,
  onComplete,
}: {
  story: DragStory;
  onExit: () => void;
  onComplete: () => void;
}) {
  const { lang } = useSettings();
  const { playCorrect, playIncorrect, playWin } = useAudio();
  const dt = (k: string) => ddText(lang, k);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Stable shuffled tray order for this mount.
  const trayOrder = useMemo(() => {
    const a = story.items.map((it) => it.id);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [story.id]);

  const remaining = trayOrder.filter((id) => !placed.has(id));

  const beginDrag = (id: string, e: React.PointerEvent) => {
    if (placed.has(id)) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ id, x: e.clientX, y: e.clientY });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const endDrag = () => {
    if (!drag) return;
    const board = boardRef.current;
    const item = story.items.find((it) => it.id === drag.id);
    if (board && item) {
      const rect = board.getBoundingClientRect();
      const zoneX = rect.left + (item.x / 100) * rect.width;
      const zoneY = rect.top + (item.y / 100) * rect.height;
      const dist = Math.hypot(drag.x - zoneX, drag.y - zoneY);
      const threshold = Math.max(rect.width, rect.height) * 0.16;
      if (dist <= threshold) {
        const next = new Set(placed);
        next.add(item.id);
        setPlaced(next);
        playCorrect();
        if (next.size === story.items.length) {
          setTimeout(() => {
            playWin();
            setDone(true);
            onComplete();
          }, 350);
        }
        setDrag(null);
        return;
      }
    }
    // Incorrect — gently return to tray.
    playIncorrect();
    setWrongId(drag.id);
    setTimeout(() => setWrongId(null), 400);
    setDrag(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-2">
          <button
            onClick={onExit}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
            aria-label={dt("dd.backStories")}
          >
            ←
          </button>
          <h1 className="truncate font-display text-xl">{dt(`dd.title.${story.slug}`)}</h1>
        </header>

        <p className="pb-2 text-center text-sm text-muted-foreground">{dt("dd.instruction")}</p>

        {/* Scene with drop zones */}
        <div
          ref={boardRef}
          className="relative mx-auto aspect-[7/9] w-full max-w-sm overflow-hidden rounded-3xl shadow-lg"
          style={{ backgroundImage: `url(${story.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* Soft wash so the scene reads as "to be completed". */}
          <div className="pointer-events-none absolute inset-0 bg-[oklch(0.98_0.02_80/0.28)]" />
          {story.items.map((item) => {
            const isPlaced = placed.has(item.id);
            return (
              <div
                key={item.id}
                className="pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: "22%",
                  aspectRatio: "1 / 1",
                }}
              >
                {isPlaced ? (
                  <span className="grid h-full w-full place-items-center rounded-full bg-[oklch(1_0_0/0.55)] text-4xl shadow-md sm:text-5xl">
                    {item.emoji}
                  </span>
                ) : (
                  <span className="h-full w-full rounded-full border-[3px] border-dashed border-[oklch(1_0_0/0.85)] bg-[oklch(0.4_0.02_60/0.18)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Tray */}
        <div className="mt-auto flex flex-wrap items-start justify-center gap-3 pt-5">
          {remaining.map((id) => {
            const item = story.items.find((it) => it.id === id)!;
            const isDragging = drag?.id === id;
            const isWrong = wrongId === id;
            return (
              <button
                key={id}
                onPointerDown={(e) => beginDrag(id, e)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`flex w-20 touch-none select-none flex-col items-center gap-1 rounded-2xl bg-card p-2 shadow-md transition ${
                  isDragging ? "opacity-30" : "active:scale-95"
                } ${isWrong ? "animate-pulse ring-2 ring-[oklch(0.7_0.15_25)]" : ""}`}
                style={{ touchAction: "none" }}
              >
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--color-sage-soft)] text-3xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="line-clamp-1 text-[11px] font-semibold text-foreground">
                  {dt(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating dragged token */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-card text-4xl shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          {story.items.find((it) => it.id === drag.id)?.emoji}
        </div>
      )}

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="paper-card w-full max-w-sm p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-gold)]/25 text-3xl">
              🎉
            </div>
            <h2 className="mt-3 font-display text-2xl text-foreground">{dt("dd.complete")}</h2>
            <p className="mt-2 text-base text-muted-foreground">{dt(`dd.msg.${story.slug}`)}</p>
            <button
              onClick={() => {
                setPlaced(new Set());
                setDone(false);
              }}
              className="mt-5 w-full rounded-2xl bg-card px-5 py-3 text-base font-semibold text-foreground/80 shadow-sm transition active:scale-95"
            >
              {dt("dd.replay")}
            </button>
            <button
              onClick={onExit}
              className="mt-2 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
            >
              {dt("dd.backStories")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LockModal({
  t,
  onClose,
  onUnlock,
}: {
  t: (k: string) => string;
  onClose: () => void;
  onUnlock: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div className="paper-card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-gold)]/30 text-2xl">✨</div>
        <h2 className="mt-3 font-display text-2xl text-foreground">{t("lock.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("lock.body")}</p>
        <button
          onClick={onUnlock}
          className="mt-5 w-full rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.78_0.13_55)] px-5 py-3 text-base font-semibold text-[oklch(0.25_0.05_50)] shadow-md transition active:scale-95"
        >
          {t("lock.cta")}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-card px-5 py-2.5 text-sm font-semibold text-foreground/70 transition active:scale-95"
        >
          {t("lock.later")}
        </button>
      </div>
    </div>
  );
}
