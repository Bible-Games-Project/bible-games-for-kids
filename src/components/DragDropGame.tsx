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
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Deterministic, per-story seeded selection. Each story naturally uses a
  // different number of draggable pieces (between 3 and 10, never more than the
  // scene offers). The pieces that are NOT chosen stay painted into the finished
  // scene, so the illustration is never left with an empty hole.
  const { activeIds, preplacedIds } = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < story.id.length; i++) seed = (seed * 31 + story.id.charCodeAt(i)) >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const ids = story.items.map((it) => it.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const want = 3 + Math.floor(rand() * 8); // 3..10
    const count = Math.min(Math.max(want, Math.min(3, ids.length)), ids.length);
    const active = new Set(ids.slice(0, count));
    return {
      activeIds: ids.filter((id) => active.has(id)),
      preplacedIds: ids.filter((id) => !active.has(id)),
    };
  }, [story.id]);

  const [placed, setPlaced] = useState<Set<string>>(() => new Set(preplacedIds));

  // Stable shuffled tray order for this mount (only the draggable pieces).
  const trayOrder = useMemo(() => {
    const a = [...activeIds];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [story.id]);

  const remaining = trayOrder.filter((id) => !placed.has(id));

  const beginDrag = (id: string, e: React.PointerEvent) => {
    if (placed.has(id)) return;
    // Capture on the button itself so every following pointer event routes back
    // here, even if the finger/cursor leaves the tile. Guarded so a rejected
    // capture never prevents the drag from starting.
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    setDrag({ id, x: e.clientX, y: e.clientY });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const endDrag = () => {
    if (!drag) return;
    const board = boardRef.current;
    const dragItem = story.items.find((it) => it.id === drag.id);
    if (board && dragItem) {
      const rect = board.getBoundingClientRect();
      // Snap to the nearest still-empty spot that expects this same artwork.
      // For unique pieces this is simply their own target; for repeated pieces
      // (a flock of sheep, stars in the sky, a pair of doves) the child can
      // place any identical piece into any of its matching spots without being
      // punished for picking a look-alike.
      let best: { id: string; dist: number } | null = null;
      for (const it of story.items) {
        if (placed.has(it.id) || it.art !== dragItem.art) continue;
        const zoneX = rect.left + (it.x / 100) * rect.width;
        const zoneY = rect.top + (it.y / 100) * rect.height;
        const dist = Math.hypot(drag.x - zoneX, drag.y - zoneY);
        // Snap tolerance scales with the piece size so bigger pieces feel just
        // as easy to place as small ones.
        const threshold = Math.max((it.w / 100) * rect.width * 0.85, rect.width * 0.13);
        if (dist <= threshold && (!best || dist < best.dist)) best = { id: it.id, dist };
      }
      if (best) {
        const next = new Set(placed);
        next.add(best.id);
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
          {/* Very light wash so the scene still feels like a finished painting. */}
          <div className="pointer-events-none absolute inset-0 bg-[oklch(0.98_0.02_80/0.08)]" />
          {story.items.map((item) => {
            const isPlaced = placed.has(item.id);
            return (
              <div
                key={item.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%` }}
              >
                {isPlaced ? (
                  // The real painted piece, snapped into place.
                  <img
                    src={item.art}
                    alt={dt(item.labelKey)}
                    draggable={false}
                    className="h-auto w-full animate-scale-in drop-shadow-[0_8px_12px_oklch(0.4_0.03_60/0.28)]"
                  />
                ) : (
                  // Soft, dark-grey painted silhouette of the exact missing piece:
                  // slightly transparent, gently blurred and blended into the
                  // painting like a shadow. No glow, no outline, no circle — just a
                  // hint of where the object belongs.
                  <img
                    src={item.art}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="h-auto w-full"
                    style={{
                      filter: "brightness(0) blur(1.2px)",
                      opacity: 0.26,
                      mixBlendMode: "multiply",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Tray — pieces waiting to be placed, scattered with a natural tilt */}
        <div className="mt-auto flex flex-wrap items-end justify-center gap-x-4 gap-y-2 px-2 pt-6">
          {remaining.map((id, idx) => {
            const item = story.items.find((it) => it.id === id)!;
            const isDragging = drag?.id === id;
            const isWrong = wrongId === id;
            // Stable, gentle tilt so pieces feel hand-placed, not lined up.
            const rot = ((id.charCodeAt(0) + idx * 5) % 9) - 4;
            return (
              <button
                key={id}
                onPointerDown={(e) => beginDrag(id, e)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDragStart={(e) => e.preventDefault()}
                className={`group flex w-[22vw] max-w-24 touch-none select-none flex-col items-center gap-1 transition active:scale-95 ${
                  isDragging ? "opacity-25" : ""
                }`}
                style={{ touchAction: "none" }}
              >
                <span
                  className="grid aspect-square w-full place-items-center transition-transform duration-200 group-hover:-translate-y-1"
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <img
                    src={item.art}
                    alt={dt(item.labelKey)}
                    draggable={false}
                    className={`h-auto max-h-full w-full object-contain drop-shadow-[0_6px_9px_oklch(0.4_0.03_60/0.25)] transition ${
                      isWrong ? "animate-pulse" : "group-hover:drop-shadow-[0_12px_16px_oklch(0.4_0.03_60/0.32)]"
                    }`}
                  />
                </span>
                <span className="line-clamp-1 text-[11px] font-semibold text-foreground/70">
                  {dt(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating dragged piece — lifted above the painting, kept close to its
          natural size so it feels controllable (only a hair larger). */}
      {drag &&
        (() => {
          const item = story.items.find((it) => it.id === drag.id);
          if (!item) return null;
          return (
            <div
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
              style={{ left: drag.x, top: drag.y, width: "min(22vw, 96px)" }}
            >
              <img
                src={item.art}
                alt=""
                aria-hidden
                draggable={false}
                className="h-auto w-full scale-[1.04] drop-shadow-[0_16px_22px_oklch(0.35_0.04_60/0.4)]"
              />
            </div>
          );
        })()}

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
