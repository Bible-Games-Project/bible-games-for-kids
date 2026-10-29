// Coloring: every story painting becomes a coloring page (outlines plus a map
// of the areas a tap fills), made by scripts/make-coloring.py. Pages are
// picked up automatically for every story that has its two files in
// src/assets/coloring/, listed in Bible order.
import type { DifficultyId } from "./puzzles";
import { STORIES, type Story } from "./stories";

const LINES = import.meta.glob("../assets/coloring/*-lines.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const REGIONS = import.meta.glob("../assets/coloring/*-regions.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export interface ColoringPage {
  story: Story;
  lines: string; // 896x1152 outlines on transparent
  regions: string; // 448x576 area map: id = red + 256 * green
}

export const MAP_W = 448;
export const MAP_H = 576;

export const COLORING_PAGES: ColoringPage[] = [...STORIES]
  .sort((a, b) => a.era - b.era)
  .flatMap((story) => {
    const lines = LINES[`../assets/coloring/${story.slug}-lines.webp`];
    const regions = REGIONS[`../assets/coloring/${story.slug}-regions.png`];
    return lines && regions ? [{ story, lines, regions }] : [];
  });

// The five levels paint with more and more colors (and so more, smaller
// areas): Easy has 4 numbers, Master all 12.
export const COLOR_COUNTS: Record<DifficultyId, number> = {
  easy: 4,
  "easy-medium": 6,
  medium: 8,
  "medium-hard": 10,
  hard: 12,
};

// Colors chosen per area, saved per story and level so a picture can be
// finished later.
export type Fills = Record<number, string>;

// v2: paint by numbers (v1 was free coloring, whose fills no longer match).
// Master keeps the key it had before there were levels.
const key = (slug: string, level: DifficultyId) =>
  level === "hard" ? `coloring-v2:${slug}` : `coloring-v2:${level}:${slug}`;

export function loadFills(slug: string, level: DifficultyId): Fills {
  try {
    const raw = localStorage.getItem(key(slug, level));
    return raw ? (JSON.parse(raw) as Fills) : {};
  } catch {
    return {};
  }
}

export function saveFills(slug: string, level: DifficultyId, fills: Fills) {
  try {
    if (Object.keys(fills).length) localStorage.setItem(key(slug, level), JSON.stringify(fills));
    else localStorage.removeItem(key(slug, level));
  } catch {
    /* ignore */
  }
}

export const hasFills = (slug: string, level: DifficultyId) =>
  Object.keys(loadFills(slug, level)).length > 0;
