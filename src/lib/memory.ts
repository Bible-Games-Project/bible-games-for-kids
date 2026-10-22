// Memory (matching pairs) game. Reuses the puzzle paintings as card faces and
// keeps its own save data, fully isolated from the Puzzle and Drag & Drop games.
import { SCENES, type DifficultyId, type Scene } from "./puzzles";

export interface MemoryLevel {
  // Shares ids with the puzzle difficulties so the level names reuse the
  // existing diff.* translations.
  id: DifficultyId;
  pairs: number;
  // Columns on tablets and desktops; phones always use 3 large columns and
  // scroll. Card counts are multiples of 3 so phone rows are always full.
  wideCols: 3 | 4 | 6;
  // Painting shown on the level's cards in the level menu.
  cover: string;
}

export const MEMORY_LEVELS: MemoryLevel[] = [
  { id: "easy", pairs: 3, wideCols: 3, cover: "noahs-ark" },
  { id: "easy-medium", pairs: 6, wideCols: 4, cover: "nativity" },
  { id: "medium", pairs: 9, wideCols: 6, cover: "walking-water" },
  { id: "medium-hard", pairs: 12, wideCols: 6, cover: "good-shepherd" },
  { id: "hard", pairs: 15, wideCols: 6, cover: "creation" },
];

export const findScene = (slug: string): Scene | undefined =>
  SCENES.find((s) => s.slug === slug);

export interface MemoryCard {
  key: string;
  scene: Scene;
}

// Some stories have two different paintings ("calming-storm" and
// "calming-storm-2"). Keep one painting per story so two look-alike cards
// never count as different pairs.
const UNIQUE_SCENES: Scene[] = SCENES.filter(
  (s, i) => SCENES.findIndex((o) => o.title === s.title) === i,
);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A fresh random deck: `pairs` different paintings, each appearing twice.
export const buildDeck = (pairs: number): MemoryCard[] => {
  const scenes = shuffle(UNIQUE_SCENES).slice(0, pairs);
  return shuffle(
    scenes.flatMap((scene) => [
      { key: `${scene.slug}#a`, scene },
      { key: `${scene.slug}#b`, scene },
    ]),
  );
};

// Generous thresholds: even a perfect memory needs some lucky first flips,
// so 3 stars only asks for a little more than one move per pair.
export const computeMemoryStars = (pairs: number, moves: number): number => {
  if (moves <= Math.ceil(pairs * 1.6)) return 3;
  if (moves <= Math.ceil(pairs * 2.4)) return 2;
  return 1;
};

const KEY = "memory-progress-v1";

// Best star result per level id.
export type MemoryProgress = Record<string, number>;

export const loadMemoryProgress = (): MemoryProgress => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MemoryProgress) : {};
  } catch {
    return {};
  }
};

export const saveMemoryResult = (levelId: string, stars: number): MemoryProgress => {
  const p = loadMemoryProgress();
  if (stars > (p[levelId] ?? 0)) {
    p[levelId] = stars;
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }
  return p;
};
