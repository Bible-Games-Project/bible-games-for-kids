import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { DragDropGame } from "@/components/DragDropGame";
import { MemoryGame } from "@/components/MemoryGame";
import { SeekGame } from "@/components/SeekGame";
import { OrderGame } from "@/components/OrderGame";
import { ColoringGame } from "@/components/ColoringGame";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { useAudio } from "@/lib/audio";
import { useBackButton } from "@/lib/back-button";
import { isFreePuzzle } from "@/lib/freemium";
import homeBg from "@/assets/home-bedtime.webp";
import titleImg from "@/assets/title-faithfun.webp";
import puzzlesBg from "@/assets/puzzles-bedtime.webp";
import memoryBg from "@/assets/memory-bedtime.webp";
import puzzlesIcon from "@/assets/icon-puzzles.webp";
import memoryIcon from "@/assets/icon-memory.webp";
import dragdropIcon from "@/assets/icon-dragdrop.webp";
import coloringIcon from "@/assets/icon-coloring.webp";
import seekIcon from "@/assets/icon-seek.webp";
import orderIcon from "@/assets/icon-order.webp";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FaithFun: Bible Games for Kids" },
      {
        name: "description",
        content:
          "A peaceful watercolor jigsaw puzzle app for children, illustrating gentle stories from the life of Jesus and the New Testament.",
      },
      { property: "og:title", content: "FaithFun: Bible Games for Kids" },
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

type Screen = "home" | "select" | "more" | "premium" | GameScreen;
// Games with their own screen; Puzzles uses the story list ("select").
type GameScreen = "dragdrop" | "memory" | "seek" | "order" | "coloring";
const GAME_SCREENS: string[] = ["dragdrop", "memory", "seek", "order", "coloring"];

interface GameDef {
  id: string;
  labelKey: string;
  icon?: string;
  emoji?: string;
  tint: string;
  playable: boolean;
}

// Playable games first so they sit in the first view of the shelf.
const GAMES: GameDef[] = [
  { id: "puzzles", labelKey: "game.puzzles", icon: puzzlesIcon, tint: "oklch(0.88 0.06 262 / 0.6)", playable: true },
  { id: "memory", labelKey: "game.memory", icon: memoryIcon, tint: "oklch(0.84 0.06 262 / 0.6)", playable: true },
  { id: "dragdrop", labelKey: "game.dragdrop", icon: dragdropIcon, tint: "oklch(0.9 0.08 79 / 0.6)", playable: true },
  { id: "coloring", labelKey: "game.coloring", icon: coloringIcon, tint: "oklch(0.86 0.06 13 / 0.6)", playable: true },
  { id: "seek", labelKey: "game.seek", icon: seekIcon, tint: "oklch(0.87 0.07 62 / 0.6)", playable: true },
  { id: "order", labelKey: "game.order", icon: orderIcon, tint: "oklch(0.8 0.07 258 / 0.6)", playable: true },
  { id: "spot", labelKey: "game.spot", emoji: "🔍", tint: "oklch(0.87 0.07 62 / 0.6)", playable: false },
  { id: "wordsearch", labelKey: "game.wordsearch", emoji: "🔤", tint: "oklch(0.85 0.045 6 / 0.6)", playable: false },
  { id: "quiz", labelKey: "game.quiz", emoji: "❓", tint: "oklch(0.8 0.07 258 / 0.6)", playable: false },
];

function GameTile({
  game,
  label,
  comingLabel,
  highlighted = false,
  onPlay,
}: {
  game: GameDef;
  label: string;
  comingLabel: string;
  highlighted?: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={() => game.playable && onPlay()}
      disabled={!game.playable}
      aria-label={label}
      className={`glass-card group relative flex aspect-[4/5] w-full flex-col overflow-hidden p-1.5 transition active:scale-[0.97] disabled:active:scale-100 ${
        highlighted ? "scale-[1.04] ring-4 ring-[var(--color-gold)]" : ""
      }`}
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
          <span className="absolute inset-x-1 top-1.5 z-10 mx-auto w-fit max-w-full truncate rounded-full bg-[oklch(0.31_0.08_262/0.8)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[var(--color-primary-foreground)] shadow">
            {comingLabel}
          </span>
        )}
        {!game.playable && (
          <div className="pointer-events-none absolute inset-0 bg-[oklch(0.975_0.025_85/0.3)]" />
        )}
      </div>
      <span className="mt-1 line-clamp-2 hyphens-auto text-center text-[10px] font-semibold leading-tight tracking-tight text-foreground sm:text-xs">
        {label}
      </span>
    </button>
  );
}

// One row of game tiles, exactly three at a time. Each arrow (or a swipe)
// glides to the previous or next three, and the row loops endlessly in both
// directions. The dice under the right arrow spins the row like a roulette
// and opens a random playable game.
//
// The loop works by rendering the games several times in a row and quietly
// re-centering on the middle copy after each move; copies look identical,
// so the jump is invisible.
const SHELF_COPIES = 5;

function GameShelf({
  games,
  labelFor,
  comingLabel,
  prevLabel,
  nextLabel,
  randomLabel,
  onPlay,
}: {
  games: GameDef[];
  labelFor: (g: GameDef) => string;
  comingLabel: string;
  prevLabel: string;
  nextLabel: string;
  randomLabel: string;
  onPlay: (g: GameDef) => void;
}) {
  const audio = useAudio();
  const n = games.length;
  // Index (in the repeated row) of the left-most visible tile.
  const [pos, setPos] = useState(n);
  // Length of the current slide in ms; 0 = jump without animation.
  const [slideMs, setSlideMs] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  // Back into the middle copy, without animation.
  const recenter = () => {
    setSlideMs(0);
    setPos((p) => n + ((((p - n) % n) + n) % n));
  };

  const move = (dir: 1 | -1) => {
    if (spinning) return;
    setSlideMs(300);
    setPos((p) => p + dir * 3);
  };

  const spin = () => {
    if (spinning) return;
    const playable = games.map((g, i) => (g.playable ? i : -1)).filter((i) => i >= 0);
    const target = playable[Math.floor(Math.random() * playable.length)];
    const start = n + ((((pos - n) % n) + n) % n);
    const middle = (start + 1) % n; // game in the middle slot right now
    // Two laps through every game, then on to the winner, slowing down.
    const steps = n * 2 + ((target - middle + n) % n);
    setSpinning(true);
    setSlideMs(0);
    setPos(start);
    let t = 0;
    for (let k = 1; k <= steps; k++) {
      const last = k === steps;
      const delay = 45 + 230 * Math.pow(k / steps, 3);
      t += delay;
      timers.current.push(
        window.setTimeout(() => {
          setSlideMs(Math.round(Math.min(delay, 260)));
          setPos(start + k);
          setHighlight((middle + k) % n);
          if (last) audio.playCorrect();
          else audio.playClick();
        }, t),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        setSpinning(false);
        setHighlight(null);
        recenter();
        onPlay(games[target]);
      }, t + 750),
    );
  };

  const tiles = Array.from({ length: n * SHELF_COPIES }, (_, k) => k);

  const roundButton =
    "grid h-8 w-8 place-items-center rounded-full bg-card text-foreground shadow-md transition active:scale-90 disabled:opacity-35 disabled:active:scale-100";

  const chevron = (flip: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={flip ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180"}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );

  return (
    <div className="flex w-full items-center gap-1.5">
      <button onClick={() => move(-1)} disabled={spinning} aria-label={prevLabel} className={`${roundButton} shrink-0`}>
        {chevron(true)}
      </button>

      <div
        className="min-w-0 flex-1 overflow-hidden px-1 py-2"
        style={{ touchAction: "pan-y" }}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, moved: false };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > 40) {
            start.moved = true;
            move((dx < 0) !== rtl ? 1 : -1);
          }
        }}
        onClickCapture={(e) => {
          // A swipe that ends on a tile must not also open that game.
          if (swipe.current?.moved) {
            e.stopPropagation();
            swipe.current = null;
          }
        }}
      >
        <div
          className="flex gap-3"
          style={{
            transform: `translateX(calc(${rtl ? pos : -pos} * (100% + 0.75rem) / 3))`,
            transition: slideMs ? `transform ${slideMs}ms ease-out` : "none",
          }}
          onTransitionEnd={() => {
            if (!spinning) recenter();
          }}
        >
          {tiles.map((k) => {
            const i = k % n;
            const g = games[i];
            const visible = k >= pos && k < pos + 3;
            return (
              <div key={k} className="w-[calc((100%-1.5rem)/3)] shrink-0" inert={!visible} aria-hidden={!visible}>
                <GameTile
                  game={g}
                  label={labelFor(g)}
                  comingLabel={comingLabel}
                  highlighted={highlight === i}
                  onPlay={() => !spinning && onPlay(g)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* The arrow lines up with the left one; the dice sits just below it. */}
      <div className="relative shrink-0">
        <button onClick={() => move(1)} disabled={spinning} aria-label={nextLabel} className={roundButton}>
          {chevron(false)}
        </button>
        <button
          onClick={spin}
          disabled={spinning}
          aria-label={randomLabel}
          className="absolute left-1/2 top-full mt-2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.82_0.1_62)] text-foreground shadow-md ring-1 ring-[oklch(1_0_0/0.6)] transition active:scale-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className={spinning ? "animate-spin" : ""}>
            <rect x="3" y="3" width="18" height="18" rx="4.5" fill="oklch(0.99 0.012 85)" stroke="currentColor" strokeWidth="1.6" />
            {[[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" />
            ))}
          </svg>
        </button>
      </div>
    </div>
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

  // Phone / browser back: puzzle board → story list → home.
  useBackButton(screen !== "home", () => setScreen("home"));
  useBackButton(active !== null, () => setActive(null));

  useEffect(() => {
    setProgress(loadProgress());
    // Warm the cache so the game screens open with their painting already
    // loaded instead of fading it in.
    for (const src of [puzzlesBg, memoryBg]) {
      const img = new Image();
      img.src = src;
    }
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
  if (screen === "dragdrop") return <DragDropGame onBack={() => setScreen("home")} />;
  if (screen === "memory") return <MemoryGame onBack={() => setScreen("home")} />;
  if (screen === "seek") return <SeekGame onBack={() => setScreen("home")} />;
  if (screen === "order") return <OrderGame onBack={() => setScreen("home")} />;
  if (screen === "coloring") return <ColoringGame onBack={() => setScreen("home")} />;

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

  if (screen === "home") {
    return (
      <div className="theme-bedtime relative min-h-[100dvh] w-full">
        {/* The family scene in the middle of the painting stays at full color
            behind the frosted tiles. */}
        <BedtimeBackdrop image={homeBg} position="center 40%" fadeEnd={0} />
        <div className="relative z-10 min-h-[100dvh] w-full">
          {settingsButton}
          <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center px-4 pt-16 pb-6 text-center">
            <h1 className="w-[82%] max-w-sm">
              <img
                src={titleImg}
                alt={`FaithFun: ${t("app.title")}`}
                draggable={false}
                className="h-auto w-full select-none drop-shadow-[0_4px_10px_oklch(0.4_0.08_50/0.35)]"
              />
            </h1>

            <div className="min-h-8 flex-1" />

            <GameShelf
              games={GAMES}
              labelFor={(g) => t(g.labelKey)}
              comingLabel={t("game.comingSoon")}
              prevLabel={t("home.prevGames")}
              nextLabel={t("home.nextGames")}
              randomLabel={t("home.randomGame")}
              onPlay={(g) => setScreen(GAME_SCREENS.includes(g.id) ? (g.id as GameScreen) : "select")}
            />

            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <button
                onClick={() => setScreen("premium")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[oklch(1_0_0/0.5)] bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.82_0.1_62)] px-3 py-3 text-base font-semibold text-foreground shadow-md transition active:scale-95"
              >
                <span aria-hidden>⭐</span>
                {t("home.premium")}
              </button>
              <button
                onClick={() => setScreen("more")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-3 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
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
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <BedtimeBackdrop image={puzzlesBg} position="center 40%" fadeEnd={30} />
      <div className="relative z-10 w-full">
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
  useEffect(() => {
    setMounted(true);
  }, []);


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
            className="glass-card group relative grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-4 overflow-hidden p-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:grid-cols-[120px_minmax(0,1fr)]"
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
                    <span className="rounded-full bg-[var(--color-sky-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {t("home.resume")}
                    </span>
                  )}
                  {!premiumLocked && (
                    <span className="text-base tracking-wider" aria-label={`${stars} of 3 stars`}>
                      <span className="text-[var(--color-gold)]">{"★".repeat(stars)}</span>
                      <span className="text-foreground/20">{"★".repeat(3 - stars)}</span>
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

