// Seek & Find: tap the things hidden in a story painting. Works for every
// story with marked things in story-items.ts; the five levels ask for 3, 5, 7,
// 9 or 11 of them (fewer if a painting has fewer), starting with the easiest
// to spot.
import type { DifficultyId } from "./puzzles";
import { STORIES, type Story } from "./stories";
import { STORY_ITEMS } from "./story-items";

export interface SeekItem {
  word: string; // name and emoji in seek-words.ts
  // Centre: x in % of the painting's width, y in % of its height.
  x: number;
  y: number;
  // Tap radius in % of the painting's width.
  r: number;
}

const COUNTS: Record<DifficultyId, number> = {
  easy: 3,
  "easy-medium": 5,
  medium: 7,
  "medium-hard": 9,
  hard: 11,
};

export const SEEK_STORIES: Story[] = STORIES.filter((s) => (STORY_ITEMS[s.slug]?.length ?? 0) >= 3);

export const itemsFor = (story: Story, level: DifficultyId): SeekItem[] =>
  (STORY_ITEMS[story.slug] ?? [])
    .slice(0, COUNTS[level])
    .map(([word, x, y, r]) => ({ word, x, y, r }));

export const seekCount = (level: DifficultyId) => COUNTS[level];

// Fewer stars for hints and for lots of wrong taps.
export const seekStars = (hints: number, misses: number) =>
  Math.max(1, 3 - hints - Math.floor(misses / 4));
