// Coloring: every story painting becomes a coloring page (outlines plus a map
// of the areas a tap fills), made by scripts/make-coloring.py. Pages are
// picked up automatically for every story that has its two files in
// src/assets/coloring/, listed in Bible order.
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

// Colors chosen per area, saved per story so a picture can be finished later.
export type Fills = Record<number, string>;

// v2: paint by numbers (v1 was free coloring, whose fills no longer match).
const key = (slug: string) => `coloring-v2:${slug}`;

export function loadFills(slug: string): Fills {
  try {
    const raw = localStorage.getItem(key(slug));
    return raw ? (JSON.parse(raw) as Fills) : {};
  } catch {
    return {};
  }
}

export function saveFills(slug: string, fills: Fills) {
  try {
    if (Object.keys(fills).length) localStorage.setItem(key(slug), JSON.stringify(fills));
    else localStorage.removeItem(key(slug));
  } catch {
    /* ignore */
  }
}

export const hasFills = (slug: string) => Object.keys(loadFills(slug)).length > 0;
