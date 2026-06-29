import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PUZZLES, pieceCount } from "@/lib/puzzles";
import { isUnlocked, loadProgress, saveResult, type Progress } from "@/lib/progress";
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

function Home() {
  const [progress, setProgress] = useState<Progress>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const active = PUZZLES.find((p) => p.id === activeId) ?? null;

  if (active) {
    return (
      <PuzzleBoard
        key={active.id}
        puzzle={active}
        onComplete={(stars, timeSec) => {
          setProgress(saveResult(active.id, stars, timeSec));
        }}
        onExit={() => setActiveId(null)}
      />
    );
  }

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
        <header className="mx-auto max-w-3xl px-5 pt-10 pb-8 text-center sm:pt-16">
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

        <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12">
          {PUZZLES.map((p, i) => {
            const ids = PUZZLES.map((x) => x.id);
            const unlocked = isUnlocked(i, ids, progress);
            const res = progress[p.id];
            const stars = res?.stars ?? 0;
            return (
              <button
                key={p.id}
                disabled={!unlocked}
                onClick={() => unlocked && setActiveId(p.id)}
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
                    Level {i + 1} · {p.difficulty}
                  </p>
                  <h3 className="mt-1 truncate font-display text-lg leading-snug sm:text-xl">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{p.verse}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{pieceCount(p)} pieces</span>
                    <span className="text-base tracking-wider" aria-label={`${stars} of 3 stars`}>
                      <span className="text-[var(--color-gold)]">{"★".repeat(stars)}</span>
                      <span className="text-[oklch(0.85_0.02_75)]">{"★".repeat(3 - stars)}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          <p className="px-2 pt-2 text-center text-xs text-muted-foreground">
            Finish a puzzle with one ⭐ to unlock the next story.
          </p>
        </main>
      </div>
    </div>
  );
}
