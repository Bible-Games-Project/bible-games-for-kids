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
import menuBg from "@/assets/menu-background.jpg";

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
}

function Home() {
  const [progress, setProgress] = useState<Progress>({});
  const [active, setActive] = useState<ActiveState | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty["id"]>(
    DIFFICULTIES[0].id,
  );

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const startPuzzle = (puzzle: Puzzle) => {
    const existing = getSession(puzzle.id);
    const seed = existing?.seed ?? Math.floor(Math.random() * 2 ** 31);
    setActive({ puzzle, seed });
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
          setProgress(saveResult(active.puzzle.id, stars, timeSec));
        }}
        onExit={() => setActive(null)}
      />
    );
  }

  const difficulty = DIFFICULTIES.find((d) => d.id === selectedDifficulty) ?? DIFFICULTIES[0];

  return (
    <div className="min-h-[100dvh] w-full">
      <div
        className="relative w-full"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.98 0.015 80 / 0.4), oklch(0.96 0.03 60 / 0.85)), url(${menuBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <header className="mx-auto max-w-3xl px-5 pt-10 pb-6 text-center sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Storybook Puzzles
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-5xl">
            Stories of Jesus
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Piece together gentle paintings of stories from the New Testament.
          </p>
        </header>

        {/* Difficulty selector */}
        <nav className="mx-auto max-w-3xl px-3 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DIFFICULTIES.map((d) => {
              const active = d.id === selectedDifficulty;
              const completed = d.puzzles.filter((p) => (progress[p.id]?.stars ?? 0) > 0).length;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-95 ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "bg-card text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {d.label}
                  <span className={`ml-2 text-[10px] font-bold ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {completed}/{d.puzzles.length}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-2 text-center text-xs italic text-muted-foreground">
            {difficulty.description}
          </p>
        </nav>

        <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12">
          <DifficultyList
            key={difficulty.id}
            difficulty={difficulty}
            progress={progress}
            onPlay={startPuzzle}
          />
          <p className="px-2 pt-2 text-center text-xs text-muted-foreground">
            Finish a puzzle with at least ⭐ to unlock the next story in this difficulty.
          </p>
        </main>
      </div>
    </div>
  );
}

function DifficultyList({
  difficulty,
  progress,
  onPlay,
}: {
  difficulty: Difficulty;
  progress: Progress;
  onPlay: (p: Puzzle) => void;
}) {
  // Recompute resume flags whenever progress changes so the "Resume" badge
  // refreshes after completing a puzzle.
  const resumeFlags = useMemo(
    () => difficulty.puzzles.map((p) => hasSession(p.id)),
    // Intentional: re-evaluate after each completion / mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [difficulty.id, progress],
  );

  return (
    <>
      {difficulty.puzzles.map((p, i) => {
        const unlocked = isPuzzleUnlocked(difficulty.puzzles, i, progress);
        const res = progress[p.id];
        const stars = res?.stars ?? 0;
        const canResume = unlocked && resumeFlags[i];
        return (
          <button
            key={p.id}
            disabled={!unlocked}
            onClick={() => unlocked && onPlay(p)}
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
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.96_0.03_60/0.7)] text-2xl">
                  🔒
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                Puzzle {i + 1} · {difficulty.label}
              </p>
              <h3 className="mt-1 truncate font-display text-lg leading-snug sm:text-xl">
                {p.title}
              </h3>
              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{p.verse}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{pieceCount(p)} pieces</span>
                <span className="flex items-center gap-2">
                  {canResume && (
                    <span className="rounded-full bg-[var(--color-sage-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.35_0.05_150)]">
                      Resume
                    </span>
                  )}
                  <span className="text-base tracking-wider" aria-label={`${stars} of 3 stars`}>
                    <span className="text-[var(--color-gold)]">{"★".repeat(stars)}</span>
                    <span className="text-[oklch(0.85_0.02_75)]">{"★".repeat(3 - stars)}</span>
                  </span>
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}
