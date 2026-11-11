import { createFileRoute } from "@tanstack/react-router";
import { findStory } from "@/lib/stories";

// Trial of a new painting style for the story pictures: five stories painted
// again, shown next to the pictures the games use today. Not linked from the
// app; open /style-test to compare.
const NEW = import.meta.glob("../assets/style-test/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// Each new painting hides small objects of its story, for Seek & Find and
// Drag & Drop.
const PAGES: { slug: string; objects: string }[] = [
  { slug: "noahs-ark", objects: "dove, hammer, bucket, basket of apples, butterfly, frog, snail, ladybug, rope" },
  { slug: "david-goliath", objects: "harp, five stones, crown, sheep, helmet, water jar, flower, bird, bag" },
  { slug: "nativity", objects: "lantern, gift chest, lamb, mouse, dove, jug, candle, crown, pitchfork" },
  { slug: "good-shepherd", objects: "crook, flute, lantern, water gourd, rabbit, butterfly, nest, flowers, bell" },
  { slug: "jonah-fish", objects: "anchor, starfish, crab, octopus, seashell, seagull, jellyfish, boat, pot" },
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
        New on the left, current on the right · 896 × 1152
      </p>
      <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-10">
        {PAGES.map(({ slug, objects }) => {
          const story = findStory(slug);
          return (
            <section key={slug}>
              <h2 className="mb-2 font-display text-xl">{story?.title ?? slug}</h2>
              <div className="grid grid-cols-[3fr_2fr] items-start gap-3">
                <img
                  src={NEW[`../assets/style-test/${slug}.jpg`]}
                  alt={`${story?.title ?? slug}, new style`}
                  className="w-full rounded-2xl shadow-lg"
                />
                {story && (
                  <img
                    src={story.image}
                    alt={`${story.title}, current`}
                    loading="lazy"
                    className="w-full rounded-2xl opacity-90 shadow"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Objects: {objects}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
