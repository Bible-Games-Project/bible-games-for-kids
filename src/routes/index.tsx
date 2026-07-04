import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DIFFICULTIES,
  pieceCount,
  type Difficulty,
  type Puzzle,
} from "@/lib/puzzles";
import {
  clearSession,
  getSession,
  hasSession,
  isPuzzleUnlocked,
  loadProgress,
  saveResult,
  type Progress,
} from "@/lib/progress";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { useSettings } from "@/lib/i18n";
import { localizeSceneTitle, localizeVerse } from "@/lib/scenes-i18n";
import { OnboardingLanguage } from "@/components/OnboardingLanguage";
import { SettingsModal } from "@/components/SettingsModal";
import { MoreGamesScreen } from "@/components/MoreGamesScreen";
import { PremiumScreen } from "@/components/PremiumScreen";
import { isFreePuzzle } from "@/lib/freemium";
import menuBg from "@/assets/menu-background.jpg";
import puzzleIcon from "@/assets/icon-puzzle.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Storybook Puzzles — Stories of Jesus for Kids" },
      {
        name: "description",
        content:
          "A peaceful watercolor jigsaw puzzle app for children, illustrating gentle stories from the life of Jesus and the New Testament.",
      },
      { property: "og:title", content: "Storybook Puzzles — Stories of Jesus for Kids" },
      {
        property: "og:description",
        content:
          "A peaceful watercolor jigsaw puzzle app for children, illustrating gentle stories from the life of Jesus.",
      },
    ],
  }),
  component: Home,
});

interface ActiveState {
  puzzle: Puzzle;
  seed: number;
  difficultyId: Difficulty["id"];
}

type Screen = "home" | "select" | "more" | "premium";

interface GameDef {
  id: string;
  labelKey: string;
  icon?: string;
  emoji?: string;
  tint: string;
  playable: boolean;
}

const GAMES: GameDef[] = [
  { id: "puzzles", labelKey: "game.puzzles", icon: puzzleIcon.url, tint: "oklch(0.9 0.05 150)", playable: true },
  { id: "coloring", labelKey: "game.coloring", emoji: "🎨", tint: "oklch(0.92 0.06 20)", playable: false },
  { id: "dragdrop", labelKey: "game.dragdrop", emoji: "✋", tint: "oklch(0.92 0.06 90)", playable: false },
  { id: "memory", labelKey: "game.memory", emoji: "🧠", tint: "oklch(0.9 0.06 320)", playable: false },
  { id: "spot", labelKey: "game.spot", emoji: "🔍", tint: "oklch(0.9 0.06 220)", playable: false },
  { id: "wordsearch", labelKey: "game.wordsearch", emoji: "🔤", tint: "oklch(0.9 0.06 260)", playable: false },
  { id: "quiz", labelKey: "game.quiz", emoji: "❓", tint: "oklch(0.92 0.06 60)", playable: false },
];

function GameTile({
  game,
  label,
  comingLabel,
  onPlay,
}: {
  game: GameDef;
  label: string;
  comingLabel: string;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={() => game.playable && onPlay()}
      disabled={!game.playable}
      aria-label={label}
      className="paper-card group relative flex aspect-square w-full flex-col overflow-hidden p-2 transition active:scale-[0.97] disabled:active:scale-100"
    >
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: game.tint }}
      >
        {game.icon ? (
          <img src={game.icon} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl sm:text-5xl" aria-hidden>
            {game.emoji}
          </span>
        )}
        {!game.playable && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-[oklch(0.3_0.03_60/0.75)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[oklch(0.98_0.02_80)] shadow">
            {comingLabel}
          </span>
        )}
        {!game.playable && (
          <div className="pointer-events-none absolute inset-0 bg-[oklch(0.96_0.03_60/0.35)]" />
        )}
      </div>
      <span className="mt-1.5 line-clamp-2 px-0.5 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
        {label}
      </span>
    </button>
  );
}

function Home() {
  const { onboarded, devMode, premium, t } = useSettings();
  const [progress, setProgress] = useState<Progress>({});
  const [active, setActive] = useState<ActiveState | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty["id"]>(
    DIFFICULTIES[0].id,
  );
  const [pendingTutorial, setPendingTutorial] = useState<Difficulty["id"] | null>(null);
  const [showPremiumLock, setShowPremiumLock] = useState(false);


  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!onboarded) {
    return <OnboardingLanguage />;
  }

  const startPuzzle = (puzzle: Puzzle, difficultyId: Difficulty["id"]) => {
    const existing = getSession(puzzle.id);
    const seed = existing?.seed ?? Math.floor(Math.random() * 2 ** 31);
    setActive({ puzzle, seed, difficultyId });
  };

  if (active) {
    return (
      <PuzzleBoard
        key={active.puzzle.id}
        puzzle={active.puzzle}
        seed={active.seed}
        initialSession={getSession(active.puzzle.id)}
        onComplete={(stars, timeSec) => {
          clearSession(active.puzzle.id);
          const diff = DIFFICULTIES.find((d) => d.id === active.difficultyId);
          const isFirst = diff?.puzzles[0]?.id === active.puzzle.id;
          const tutKey = `sp.tutorialShown.${active.difficultyId}`;
          const alreadyShown =
            typeof window !== "undefined" && localStorage.getItem(tutKey) === "1";
          if (stars > 0 && isFirst && !alreadyShown) {
            setPendingTutorial(active.difficultyId);
          }
          setProgress(saveResult(active.puzzle.id, stars, timeSec));
        }}
        onExit={() => setActive(null)}
      />
    );
  }

  if (screen === "more") return <MoreGamesScreen onBack={() => setScreen("home")} />;
  if (screen === "premium") return <PremiumScreen onBack={() => setScreen("home")} />;

  const difficulty = DIFFICULTIES.find((d) => d.id === selectedDifficulty) ?? DIFFICULTIES[0];

  const settingsButton = (
    <button
      onClick={() => setSettingsOpen(true)}
      aria-label={t("settings.title")}
      className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-card text-foreground/80 shadow-md transition active:scale-95"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );

  const bgStyle = {
    backgroundImage: `linear-gradient(180deg, oklch(0.98 0.015 80 / 0.4), oklch(0.96 0.03 60 / 0.85)), url(${menuBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  } as const;

  if (screen === "home") {
    return (
      <div className="min-h-[100dvh] w-full">
        <div className="relative min-h-[100dvh] w-full" style={bgStyle}>
          {settingsButton}
          <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center px-5 py-14 text-center sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("app.tagline")}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              {t("app.title")}
            </h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t("home.welcome")}
            </p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {GAMES.map((g) => (
                <GameTile key={g.id} game={g} label={t(g.labelKey)} comingLabel={t("game.comingSoon")} onPlay={() => setScreen("select")} />
              ))}
            </div>

            <div className="mt-6 w-full space-y-3">
              <button
                onClick={() => setScreen("premium")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.78_0.13_55)] px-5 py-4 text-lg font-semibold text-[oklch(0.25_0.05_50)] shadow-md transition active:scale-95"
              >
                <span aria-hidden>⭐</span>
                {t("home.premium")}
              </button>
              <button
                onClick={() => setScreen("more")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card px-5 py-4 text-lg font-semibold text-foreground shadow-md transition active:scale-95"
              >
                <span aria-hidden>🎮</span>
                {t("home.moreGames")}
              </button>
            </div>
          </div>
        </div>
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    );
  }

  // screen === "select"
  return (
    <div className="min-h-[100dvh] w-full">
      <div className="relative w-full" style={bgStyle}>
        {settingsButton}

        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <button
            onClick={() => setScreen("home")}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
            aria-label={t("select.back")}
          >
            ←
          </button>
          <h1 className="font-display text-2xl sm:text-3xl">{t("select.title")}</h1>
        </header>

        {/* Difficulty selector — compact 5-col grid so every tab is always reachable */}
        <nav className="mx-auto max-w-3xl px-3 pb-3 pt-2">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {DIFFICULTIES.map((d) => {
              const isActive = d.id === selectedDifficulty;
              const completed = d.puzzles.filter((p) => (progress[p.id]?.stars ?? 0) > 0).length;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-semibold leading-tight shadow-sm transition active:scale-95 sm:text-sm ${
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "bg-card text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <span className="block w-full truncate text-center sm:hidden">
                    {t(`diff.${d.id}.short`)}
                  </span>
                  <span className="hidden w-full truncate text-center sm:block">
                    {t(`diff.${d.id}`)}
                  </span>
                  <span className={`mt-0.5 text-[9px] font-bold sm:text-[10px] ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                    {completed}/{d.puzzles.length}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-2 text-center text-xs italic text-muted-foreground">
            {t(`diff.${difficulty.id}.desc`)}
          </p>
        </nav>

        <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12">
          <DifficultyList
            key={difficulty.id}
            difficulty={difficulty}
            progress={progress}
            devMode={devMode}
            premium={premium}
            onPlay={(p) => startPuzzle(p, difficulty.id)}
            onLocked={() => setShowPremiumLock(true)}
          />
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {showPremiumLock && (
        <PremiumLockModal
          onClose={() => setShowPremiumLock(false)}
          onUnlock={() => {
            setShowPremiumLock(false);
            setScreen("premium");
          }}
        />
      )}
      {pendingTutorial && (
        <TutorialModal
          onClose={() => {
            try {
              localStorage.setItem(`sp.tutorialShown.${pendingTutorial}`, "1");
            } catch {}
            setPendingTutorial(null);
          }}
        />
      )}
    </div>
  );
}

function TutorialModal({ onClose }: { onClose: () => void }) {
  const { t } = useSettings();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="paper-card max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-foreground">{t("tutorial.title")}</h2>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
          {t("tutorial.body")}
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
        >
          {t("tutorial.ok")}
        </button>
      </div>
    </div>
  );
}

function PremiumLockModal({
  onClose,
  onUnlock,
}: {
  onClose: () => void;
  onUnlock: () => void;
}) {
  const { t } = useSettings();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="paper-card max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-gold)]/30 text-2xl">
          ✨
        </div>
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

function DifficultyList({
  difficulty,
  progress,
  devMode,
  premium,
  onPlay,
  onLocked,
}: {
  difficulty: Difficulty;
  progress: Progress;
  devMode: boolean;
  premium: boolean;
  onPlay: (p: Puzzle) => void;
  onLocked: () => void;
}) {
  const { t, lang } = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  const resumeFlags = useMemo(
    () => difficulty.puzzles.map((p) => mounted && hasSession(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [difficulty.id, progress, mounted],
  );

  return (
    <>
      {difficulty.puzzles.map((p, i) => {
        const progressUnlocked = devMode || isPuzzleUnlocked(difficulty.puzzles, i, progress);
        const premiumAllowed = devMode || premium || isFreePuzzle(i);
        const premiumLocked = !premiumAllowed;
        const unlocked = progressUnlocked && premiumAllowed;
        const res = progress[p.id];
        const stars = res?.stars ?? 0;
        const canResume = unlocked && resumeFlags[i];
        const clickable = unlocked || premiumLocked; // locked-premium still clickable → opens unlock modal
        return (
          <button
            key={p.id}
            disabled={!clickable}
            onClick={() => {
              if (premiumLocked) return onLocked();
              if (unlocked) onPlay(p);
            }}
            className="paper-card group relative grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-4 overflow-hidden p-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:grid-cols-[120px_minmax(0,1fr)]"
          >
            <div
              className="relative aspect-[7/9] overflow-hidden rounded-xl"
              style={{
                backgroundImage: `url(${p.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {premiumLocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[oklch(0.96_0.03_60/0.78)] text-[var(--color-gold)]">
                  <span className="text-2xl">✨</span>
                </div>
              ) : !unlocked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.96_0.03_60/0.7)] text-2xl">
                  🔒
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                {t("puzzle.label")} {i + 1} · {t(`diff.${difficulty.id}`)}
              </p>
              <h3 className="mt-1 truncate font-display text-lg leading-snug sm:text-xl">
                {localizeSceneTitle(p.slug, lang)}
              </h3>
              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{localizeVerse(p.verse, lang)}</p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {pieceCount(p)} {t("home.pieces")}
                </span>
                <span className="flex items-center gap-2">
                  {premiumLocked && (
                    <span className="rounded-full bg-[var(--color-gold)]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.12_70)]">
                      ✨ {t("lock.badge")}
                    </span>
                  )}
                  {canResume && (
                    <span className="rounded-full bg-[var(--color-sage-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.35_0.05_150)]">
                      {t("home.resume")}
                    </span>
                  )}
                  {!premiumLocked && (
                    <span className="text-base tracking-wider" aria-label={`${stars} of 3 stars`}>
                      <span className="text-[var(--color-gold)]">{"★".repeat(stars)}</span>
                      <span className="text-[oklch(0.85_0.02_75)]">{"★".repeat(3 - stars)}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}

