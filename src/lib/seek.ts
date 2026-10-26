// Seek & Find: tap things hidden in a story painting. Each scene lists what
// can be found and from which level it appears, so the five levels ask for
// more (and smaller) things in the same picture. More scenes can be added
// from any story in stories.ts.
import type { DifficultyId } from "./puzzles";
import { findStory, type Story } from "./stories";

export interface SeekItem {
  id: string; // name key: seek.item.<id>
  emoji: string;
  // Centre: x in % of the painting's width, y in % of its height.
  x: number;
  y: number;
  // Tap radius in % of the painting's width.
  r: number;
  level: number; // first level (1-5) that asks for it
}

export interface SeekScene {
  story: Story;
  items: SeekItem[];
}

const DEFS: { slug: string; items: SeekItem[] }[] = [
  {
    slug: "adam-animals",
    items: [
      { id: "lion", emoji: "🦁", x: 66, y: 51, r: 10, level: 1 },
      { id: "deer", emoji: "🦌", x: 12, y: 43, r: 10, level: 1 },
      { id: "eagle", emoji: "🦅", x: 83, y: 15, r: 9, level: 1 },
      { id: "sheep", emoji: "🐑", x: 89, y: 70, r: 8, level: 2 },
      { id: "rabbit", emoji: "🐇", x: 20, y: 74, r: 7, level: 2 },
      { id: "wolf", emoji: "🐺", x: 10, y: 57, r: 8, level: 3 },
      { id: "ox", emoji: "🐂", x: 92, y: 47, r: 8, level: 3 },
      { id: "duck", emoji: "🦆", x: 28, y: 92, r: 6, level: 4 },
      { id: "bluebird", emoji: "🐦", x: 93, y: 79, r: 5, level: 4 },
      { id: "lioness", emoji: "🦁", x: 79, y: 60, r: 7, level: 5 },
      { id: "duckling", emoji: "🐥", x: 41, y: 95, r: 4.5, level: 5 },
    ],
  },
];

export const SEEK_SCENES: SeekScene[] = DEFS.flatMap((d) => {
  const story = findStory(d.slug);
  return story ? [{ story, items: d.items }] : [];
});

export const SEEK_LEVEL_NUMBER: Record<DifficultyId, number> = {
  easy: 1,
  "easy-medium": 2,
  medium: 3,
  "medium-hard": 4,
  hard: 5,
};

export const itemsForLevel = (scene: SeekScene, level: DifficultyId) =>
  scene.items.filter((it) => it.level <= SEEK_LEVEL_NUMBER[level]);

// Fewer stars for hints and for lots of wrong taps.
export const seekStars = (hints: number, misses: number) =>
  Math.max(1, 3 - hints - Math.floor(misses / 4));
