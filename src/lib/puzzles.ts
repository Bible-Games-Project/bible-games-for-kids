import { STORIES as SCENES, type Story as Scene } from "./stories";

export type DifficultyId = "easy" | "easy-medium" | "medium" | "medium-hard" | "hard";

export interface Puzzle {
  id: string;
  difficultyId: DifficultyId;
  indexInDifficulty: number;
  slug: string;
  title: string;
  verse: string;
  image: string;
  thumb: string;
  cols: number;
  rows: number;
}

export interface Difficulty {
  id: DifficultyId;
  label: string;
  description: string;
  puzzles: Puzzle[];
}

// Each difficulty defines its piece-count range. Targets are generated as
// a smooth ascending curve from min→max with small deterministic variation
// so progression feels gradual without identical repetition. Adding more
// scenes or difficulties just works — counts adapt to SCENES.length.
interface DifficultyDef {
  id: DifficultyId;
  label: string;
  description: string;
  min: number;
  max: number;
}

const DIFFICULTY_DEFS: DifficultyDef[] = [
  { id: "easy", label: "Easy", description: "Gentle first puzzles", min: 5, max: 15 },
  { id: "easy-medium", label: "Normal", description: "A little more to piece together", min: 15, max: 30 },
  { id: "medium", label: "Hard", description: "For curious little builders", min: 30, max: 65 },
  { id: "medium-hard", label: "Expert", description: "A satisfying challenge", min: 65, max: 100 },
  { id: "hard", label: "Master", description: "For patient hearts and hands", min: 100, max: 250 },
];

// Deterministic small-integer hash → [0,1) for stable per-slot variation.
const hash01 = (seed: string, i: number): number => {
  let h = 2166136261 >>> 0;
  const s = `${seed}#${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

// Build N piece targets that ascend smoothly from min→max with ±12%
// jitter, clamped to the range and monotonically non-decreasing so the
// curve never dips backwards.
const buildPieceTargets = (def: DifficultyDef, count: number): number[] => {
  const { min, max, id } = def;
  if (count <= 0) return [];
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1); // 0..1
    // Mild ease-in-out for a gentle curve.
    const eased = t * t * (3 - 2 * t);
    const base = min + (max - min) * eased;
    const jitter = (hash01(id, i) - 0.5) * 0.24; // ±12%
    let v = Math.round(base * (1 + jitter));
    v = Math.max(min, Math.min(max, v));
    if (v < prev) v = prev; // keep non-decreasing
    out.push(v);
    prev = v;
  }
  return out;
};


const TARGET_ASPECT = 896 / 1152; // cols / rows of the artwork (portrait)

// Find a (cols, rows) grid whose total piece count is close to `target`
// and whose aspect ratio matches the artwork. Works for any number,
// including primes — we trade an exact count for a pleasing layout.
const computeGrid = (target: number): { cols: number; rows: number } => {
  let best = { cols: 1, rows: target, score: Infinity };
  for (let c = 1; c <= 16; c++) {
    for (let r = 1; r <= 20; r++) {
      const total = c * r;
      if (total < 4) continue;
      const aspect = c / r;
      const aspectErr = Math.abs(aspect - TARGET_ASPECT) / TARGET_ASPECT;
      const totalErr = Math.abs(total - target) / target;
      // Weight count error heavily so we stay near the requested size.
      const score = totalErr * 2.5 + aspectErr;
      if (score < best.score) best = { cols: c, rows: r, score };
    }
  }
  return { cols: best.cols, rows: best.rows };
};

// Deterministic per-difficulty shuffle of the scene pool. Each difficulty
// gets a unique order seeded by its id (Fisher–Yates with hash01), so the
// sequence is stable across sessions but differs between difficulties.
const shuffledScenesFor = (seed: string): Scene[] => {
  const arr = SCENES.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(hash01(`${seed}:shuffle`, i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const DIFFICULTIES: Difficulty[] = DIFFICULTY_DEFS.map((d) => {
  const targets = buildPieceTargets(d, SCENES.length);
  const scenes = shuffledScenesFor(d.id);
  return {
    id: d.id,
    label: d.label,
    description: d.description,
    puzzles: targets.map((target, i) => {
      const scene = scenes[i % scenes.length];
      const grid = computeGrid(target);
      return {
        id: `${d.id}__${i + 1}__${scene.slug}`,
        difficultyId: d.id,
        indexInDifficulty: i,
        slug: scene.slug,

        title: scene.title,
        verse: scene.verse,
        image: scene.image,
        thumb: scene.thumb,
        cols: grid.cols,
        rows: grid.rows,
      };
    }),
  };
});

export const ALL_PUZZLES: Puzzle[] = DIFFICULTIES.flatMap((d) => d.puzzles);

export const findPuzzle = (id: string): Puzzle | undefined =>
  ALL_PUZZLES.find((p) => p.id === id);

export const findDifficulty = (id: DifficultyId): Difficulty | undefined =>
  DIFFICULTIES.find((d) => d.id === id);

export const pieceCount = (p: Puzzle) => p.cols * p.rows;
