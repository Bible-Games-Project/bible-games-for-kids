// Things cut out of each story painting, with a transparent background
// (scripts/make-shapes.cjs): Drag & Drop drops them onto their dark
// silhouette and Seek & Find shows them in its list of things to find.
// Each story has src/assets/shapes/<slug>/shapes.json plus one webp per thing,
// in the order of story-items.ts (easiest first), keeping only the clean cuts.
import type { DifficultyId } from "./puzzles";

export interface StoryShape {
  word: string; // name in seek-words.ts
  src: string;
  // The cut-out's box: top-left corner and size, in % of the painting
  // (x and w of its width, y and h of its height).
  x: number;
  y: number;
  w: number;
  h: number;
  // The thing's circle from story-items.ts (centre in % of width/height,
  // radius in % of width), for taps in Seek & Find.
  cx: number;
  cy: number;
  r: number;
}

interface ShapeMeta extends Omit<StoryShape, "src"> {
  file: string;
}

const META = import.meta.glob<ShapeMeta[]>("../assets/shapes/*/shapes.json", {
  eager: true,
  import: "default",
});
const FILES = import.meta.glob<string>("../assets/shapes/*/*.webp", {
  eager: true,
  import: "default",
});

export const STORY_SHAPES: Record<string, StoryShape[]> = Object.fromEntries(
  Object.entries(META).map(([path, list]) => {
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const slug = dir.split("/").at(-2)!;
    return [slug, list.map(({ file, ...s }) => ({ ...s, src: FILES[dir + file] }))];
  }),
);

export const LEVEL_COUNT: Record<DifficultyId, number> = {
  easy: 3,
  "easy-medium": 5,
  medium: 7,
  "medium-hard": 9,
  hard: 11,
};

// For Drag & Drop: the shapes in order, skipping any whose box overlaps one
// already chosen too much, so silhouettes don't sit on top of each other.
export function separateShapes(slug: string): StoryShape[] {
  const chosen: StoryShape[] = [];
  for (const s of STORY_SHAPES[slug] ?? []) {
    const clash = chosen.some((c) => {
      const ix = Math.max(0, Math.min(s.x + s.w, c.x + c.w) - Math.max(s.x, c.x));
      const iy = Math.max(0, Math.min(s.y + s.h, c.y + c.h) - Math.max(s.y, c.y));
      return ix * iy > 0.2 * Math.min(s.w * s.h, c.w * c.h);
    });
    if (!clash) chosen.push(s);
  }
  return chosen;
}
