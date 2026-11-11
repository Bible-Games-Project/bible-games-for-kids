import { createFileRoute } from "@tanstack/react-router";
import { findStory } from "@/lib/stories";

// The stories already repainted in the new storybook style, all on one page.
// Not linked from the app; open /style-test to look through them.
const REPAINTED = [
  "noahs-ark",
  "david-goliath",
  "nativity",
  "good-shepherd",
  "jonah-fish",
  "blessing-children",
  "walking-water",
  "calming-storm",
  "good-samaritan",
  "creation",
  "moses-basket",
  "david-shepherd",
  "burning-bush",
  "rainbow-promise",
  "tower-babel",
];

export const Route = createFileRoute("/style-test")({
  head: () => ({ meta: [{ title: "Bibledoo: style test" }, { name: "robots", content: "noindex" }] }),
  component: StyleTest,
});

function StyleTest() {
  return (
    <div className="theme-bedtime min-h-[100dvh] w-full bg-[oklch(0.95_0.04_82)] px-4 py-6 text-foreground">
      <h1 className="text-center font-display text-3xl">New painting style</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {REPAINTED.length} stories repainted · 896 × 1152
      </p>
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
        {REPAINTED.map((slug) => {
          const story = findStory(slug);
          if (!story) return null;
          return (
            <section key={slug}>
              <h2 className="mb-2 font-display text-xl">{story.title}</h2>
              <img
                src={story.image}
                alt={story.title}
                loading="lazy"
                className="w-full rounded-2xl shadow-lg"
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
