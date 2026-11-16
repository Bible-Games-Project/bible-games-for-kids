// Seek & Find: tap the things hidden in a story painting. Works for every
// story with marked things in story-items.ts; the five levels ask for 3, 5, 7,
// 9 or 11 of them (fewer if a painting has fewer), starting with the easiest
// to spot.
import type { DifficultyId } from "./puzzles";
import { STORIES, type Story } from "./stories";
import { STORY_ITEMS } from "./story-items";
import { LEVEL_COUNT, STORY_SHAPES, type StoryShape } from "./story-shapes";

export interface SeekItem {
  word: string; // name and emoji in seek-words.ts
  // Centre: x in % of the painting's width, y in % of its height.
  x: number;
  y: number;
  // Tap radius in % of the painting's width.
  r: number;
  // The thing cut out of the painting, shown in the list (when it has one).
  shape?: StoryShape;
}

const COUNTS = LEVEL_COUNT;

export const SEEK_STORIES: Story[] = STORIES.filter((s) => (STORY_ITEMS[s.slug]?.length ?? 0) >= 3);

// Paintings with cut-outs ask only for the things with a clean cut.
export const itemsFor = (story: Story, level: DifficultyId): SeekItem[] => {
  const shapes = STORY_SHAPES[story.slug] ?? [];
  if (shapes.length >= 3)
    return shapes
      .slice(0, COUNTS[level])
      .map((s) => ({ word: s.word, x: s.cx, y: s.cy, r: s.r, shape: s }));
  return (STORY_ITEMS[story.slug] ?? [])
    .slice(0, COUNTS[level])
    .map(([word, x, y, r]) => ({ word, x, y, r }));
};

export const seekCount = (level: DifficultyId) => COUNTS[level];

// Fewer stars for hints and for lots of wrong taps.
export const seekStars = (hints: number, misses: number) =>
  Math.max(1, 3 - hints - Math.floor(misses / 4));
