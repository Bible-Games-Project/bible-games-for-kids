// Building blocks shared by the newer games (Drag & Drop, Seek & Find,
// What Came First?, Coloring): a menu screen over a painting, a five-level
// list, star ratings and the end-of-game card.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { useSettings } from "@/lib/i18n";
import type { DifficultyId } from "@/lib/puzzles";
import { storiesForLevel, type Story } from "@/lib/stories";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import backArt from "@/assets/ui/back.webp";

export const LEVEL_IDS: DifficultyId[] = ["easy", "easy-medium", "medium", "medium-hard", "hard"];

// A half-second fade from black when a screen opens, so its paintings
// appear smoothly instead of popping in while they load.
export function ScreenFade() {
  const [clear, setClear] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setClear(true));
    });
    const id = window.setTimeout(() => setGone(true), 650);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, []);
  if (gone) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] bg-black transition-opacity duration-500 ease-out motion-reduce:hidden"
      style={{ opacity: clear ? 0 : 1 }}
    />
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-[3.25rem] shrink-0 place-items-center transition active:scale-90"
    >
      <img
        src={backArt}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain drop-shadow-[0_2px_3px_oklch(0.3_0.06_50/0.35)] rtl:-scale-x-100"
      />
    </button>
  );
}

export function MenuScreen({
  title,
  subtitle,
  background,
  onBack,
  backLabel,
  blur = false,
  position = "center 35%",
  children,
}: {
  title: string;
  subtitle?: string;
  background: string;
  onBack: () => void;
  backLabel: string;
  blur?: boolean;
  position?: string;
  children: ReactNode;
}) {
  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={background} position={position} fadeEnd={30} blur={blur} />
      <div className="relative z-10 min-h-[100dvh] w-full">
        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <BackButton onClick={onBack} label={backLabel} />
          <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
        </header>
        {subtitle && (
          <p className="mx-auto max-w-3xl px-6 pt-1 text-sm italic text-muted-foreground">
            {subtitle}
          </p>
        )}
        <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">{children}</main>
      </div>
    </div>
  );
}

export function Stars({ value, className = "text-base" }: { value: number; className?: string }) {
  return (
    <span className={`tracking-wider ${className}`} aria-label={`${value} of 3 stars`}>
      <span className="text-[var(--color-gold)]">{"★".repeat(value)}</span>
      <span className="text-foreground/20">{"★".repeat(3 - value)}</span>
    </span>
  );
}

// The five difficulty levels as frosted cards, each with a picture, a short
// description and the best stars earned so far.
export function LevelList({
  describe,
  picture,
  best,
  onPick,
}: {
  describe: (id: DifficultyId, index: number) => string;
  picture: (id: DifficultyId, index: number) => ReactNode;
  best: (id: DifficultyId) => number;
  onPick: (id: DifficultyId) => void;
}) {
  const { t } = useSettings();
  return (
    <div className="grid gap-4">
      {LEVEL_IDS.map((id, i) => (
        <button
          key={id}
          onClick={() => {
            window.scrollTo(0, 0);
            onPick(id);
          }}
          className="paint-box paint-wide flex w-full items-center gap-4 overflow-hidden p-4 text-left transition active:scale-[0.99]"
        >
          <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl" aria-hidden>
            {picture(id, i)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-snug">{t(`diff.${id}`)}</span>
            <span className="block text-[11px] font-semibold text-muted-foreground/90">
              {t(`diff.${id}.age`)}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{describe(id, i)}</span>
            <Stars value={best(id)} className="mt-1.5 block text-base" />
          </span>
        </button>
      ))}
    </div>
  );
}

// Five difficulty tabs over a grid of story paintings: pick a level, then a
// story. `badge` shows progress for a story on the selected level.
export function StoryPicker({
  level,
  onLevel,
  describe,
  stories,
  badge,
  picture,
  onPick,
}: {
  level: DifficultyId;
  onLevel: (id: DifficultyId) => void;
  describe: (id: DifficultyId) => string;
  stories: Story[];
  badge: (story: Story) => ReactNode;
  // Thumbnail contents; the painting itself by default.
  picture?: (story: Story) => ReactNode;
  onPick: (story: Story) => void;
}) {
  const { t, lang } = useSettings();
  const ordered = useMemo(() => storiesForLevel(stories, level), [stories, level]);
  return (
    <>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {LEVEL_IDS.map((id) => {
          const active = id === level;
          return (
            <button
              key={id}
              onClick={() => onLevel(id)}
              aria-pressed={active}
              className={`paint-box paint-square paint-thin min-w-0 truncate px-2 py-3 text-[11px] font-semibold transition active:scale-95 sm:text-sm ${
                active ? "paint-picked z-10 scale-105 text-[var(--color-primary)]" : "text-foreground/80"
              }`}
            >
              <span className="block truncate">{t(`diff.${id}`)}</span>
              <span className="block truncate text-[9px] font-medium text-muted-foreground sm:text-[11px]">
                {t(`diff.${id}.age`)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs italic text-muted-foreground">{describe(level)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ordered.map((s) => (
          <button
            key={s.slug}
            onClick={() => {
              window.scrollTo(0, 0);
              onPick(s);
            }}
            className="paint-box paint-tall paint-thin flex flex-col p-2.5 text-left transition active:scale-[0.98]"
          >
            <span className="relative aspect-[7/9] w-full overflow-hidden rounded-xl">
              {picture ? (
                picture(s)
              ) : (
                <img src={s.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              <span className="absolute right-1.5 top-1.5">{badge(s)}</span>
            </span>
            <span className="line-clamp-2 px-1 pt-1.5 text-center text-xs font-semibold leading-tight">
              {localizeSceneTitle(s.slug, lang)}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

export function ResultCard({
  top,
  title,
  detail,
  replayLabel,
  onReplay,
  backLabel,
  onBack,
}: {
  top: ReactNode;
  title: string;
  detail?: ReactNode;
  replayLabel: string;
  onReplay: () => void;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="paint-box paint-square paint-solid w-full max-w-sm p-7 text-center">
        <div className="text-5xl">{top}</div>
        <h2 className="mt-3 font-display text-2xl text-foreground">{title}</h2>
        {detail && <div className="mt-2 text-base text-muted-foreground">{detail}</div>}
        <button
          onClick={onReplay}
          className="mt-5 w-full rounded-2xl bg-card px-5 py-3 text-base font-semibold text-foreground/80 shadow-sm transition active:scale-95"
        >
          {replayLabel}
        </button>
        <button
          onClick={onBack}
          className="mt-2 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}

// A yes / no question over the screen, e.g. before wiping progress.
export function ConfirmCard({
  icon,
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  icon: ReactNode;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onCancel}
    >
      <div
        className="paint-box paint-square paint-solid w-full max-w-sm p-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl">{icon}</div>
        <p className="mt-3 text-base font-semibold text-foreground">{text}</p>
        <button
          onClick={onConfirm}
          className="mt-5 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="mt-2 w-full rounded-2xl bg-card px-5 py-3 text-base font-semibold text-foreground/80 shadow-sm transition active:scale-95"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

export const starText = (stars: number) => "⭐".repeat(stars) + "☆".repeat(3 - stars);

// Best stars per level, stored under one key per game.
export function loadBest(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveBest(key: string, level: string, stars: number): Record<string, number> {
  const all = loadBest(key);
  if (stars > (all[level] ?? 0)) {
    all[level] = stars;
    try {
      localStorage.setItem(key, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }
  return all;
}
