// Building blocks shared by the newer games (Drag & Drop, Seek & Find,
// What Came First?, Coloring): a menu screen over a painting, a five-level
// list, star ratings and the end-of-game card.
import type { ReactNode } from "react";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { useSettings } from "@/lib/i18n";
import type { DifficultyId } from "@/lib/puzzles";

export const LEVEL_IDS: DifficultyId[] = ["easy", "easy-medium", "medium", "medium-hard", "hard"];

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
    >
      ←
    </button>
  );
}

export function MenuScreen({
  title,
  subtitle,
  background,
  onBack,
  backLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  background: string;
  onBack: () => void;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <BedtimeBackdrop image={background} position="center 35%" fadeEnd={30} />
      <div className="relative z-10 min-h-[100dvh] w-full">
        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <BackButton onClick={onBack} label={backLabel} />
          <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
        </header>
        {subtitle && (
          <p className="mx-auto max-w-3xl px-6 pt-1 text-sm italic text-muted-foreground">{subtitle}</p>
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
          className="glass-card flex w-full items-center gap-4 overflow-hidden p-3 pr-4 text-left transition active:scale-[0.99]"
        >
          <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl" aria-hidden>
            {picture(id, i)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-snug">{t(`diff.${id}`)}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{describe(id, i)}</span>
            <Stars value={best(id)} className="mt-1.5 block text-base" />
          </span>
        </button>
      ))}
    </div>
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
      <div className="paper-card w-full max-w-sm p-6 text-center">
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
