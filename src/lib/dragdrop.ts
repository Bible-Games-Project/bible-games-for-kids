// Drag & Drop: round pieces are cut from a story painting and the child
// drags each one back to its spot. The painting stays visible under a frosted
// socket, so the picture itself is the clue. Every story with pieces in
// dragdrop-pieces.ts (made by scripts/make-dragdrop.py) is playable on five
// levels: 3, 5, 7, 9 or 11 pieces, smaller as the count grows.
import type { DifficultyId } from "./puzzles";
import { STORIES, type Story } from "./stories";
import { DD_PIECES } from "./dragdrop-pieces";

export interface DragPiece {
  // Centre of the piece: x in % of the painting's width, y in % of its height.
  x: number;
  y: number;
  // Radius in % of the painting's width.
  r: number;
}

export interface DragStory {
  story: Story;
  pieces: DragPiece[];
}

const LEVEL_INDEX: Record<DifficultyId, number> = {
  easy: 0,
  "easy-medium": 1,
  medium: 2,
  "medium-hard": 3,
  hard: 4,
};

// Must match LEVELS in scripts/make-dragdrop.py.
export const PIECE_RADIUS = [11, 10, 9, 8, 7];

export const DRAG_STORIES: Story[] = STORIES.filter((s) => DD_PIECES[s.slug]);

export const piecesFor = (story: Story, level: DifficultyId): DragPiece[] => {
  const i = LEVEL_INDEX[level];
  return (DD_PIECES[story.slug]?.[i] ?? []).map(([x, y]) => ({ x, y, r: PIECE_RADIUS[i] }));
};

export const pieceCountFor = (level: DifficultyId) => [3, 5, 7, 9, 11][LEVEL_INDEX[level]];

// The painting's height as a share of its width (896 x 1152).
export const PAINTING_RATIO = 1152 / 896;

// CSS background settings that show just this piece of the painting in a
// square element.
export function pieceBackground(image: string, p: DragPiece) {
  const d = 2 * p.r; // diameter, % of width
  const h = d / PAINTING_RATIO; // diameter, % of height
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${(100 * 100) / d}% auto`,
    backgroundPosition: `${((p.x - p.r) / (100 - d)) * 100}% ${((p.y - h / 2) / (100 - h)) * 100}%`,
  };
}

const KEY = "dd-progress-v3";

// Finished stories per level.
export type DoneStories = Record<string, string[]>;

export const loadDoneStories = (): DoneStories => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DoneStories) : {};
  } catch {
    return {};
  }
};

export const markStoryDone = (level: DifficultyId, slug: string): DoneStories => {
  const done = loadDoneStories();
  const list = done[level] ?? [];
  if (!list.includes(slug)) {
    done[level] = [...list, slug];
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }
  return done;
};
