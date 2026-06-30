import walkingWater from "@/assets/puzzle-walking-water.jpg";
import blessingChildren from "@/assets/puzzle-blessing-children.jpg";
import feeding5000 from "@/assets/puzzle-feeding-5000.jpg";
import calmingStorm from "@/assets/puzzle-calming-storm.jpg";
import goodSamaritan from "@/assets/puzzle-good-samaritan.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import creation from "@/assets/puzzle-creation.jpg";
import mosesBasket from "@/assets/puzzle-moses-basket.jpg";
import davidShepherd from "@/assets/puzzle-david-shepherd.jpg";
import danielLions from "@/assets/puzzle-daniel-lions.jpg";

export type DifficultyId = "easy" | "easy-medium" | "medium" | "medium-hard" | "hard";

export interface Puzzle {
  id: string;
  difficultyId: DifficultyId;
  indexInDifficulty: number;
  title: string;
  verse: string;
  image: string;
  cols: number;
  rows: number;
}

export interface Difficulty {
  id: DifficultyId;
  label: string;
  description: string;
  puzzles: Puzzle[];
}

interface Scene {
  slug: string;
  title: string;
  verse: string;
  image: string;
}

// Pool of New Testament scenes. Adding more here automatically becomes
// available for puzzle slots — the progression system is content-agnostic.
const SCENES: Scene[] = [
  { slug: "blessing-children", title: "Jesus Blesses the Children", verse: "Matthew 19:14", image: blessingChildren },
  { slug: "noahs-ark", title: "Noah's Ark", verse: "Genesis 9:13", image: noahsArk },
  { slug: "walking-water", title: "Jesus Walks on Water", verse: "Matthew 14:25", image: walkingWater },
  { slug: "creation", title: "The Creation", verse: "Genesis 1:1", image: creation },
  { slug: "feeding-5000", title: "Jesus Feeds the 5,000", verse: "John 6:11", image: feeding5000 },
  { slug: "moses-basket", title: "Baby Moses in the Basket", verse: "Exodus 2:3", image: mosesBasket },
  { slug: "calming-storm", title: "Jesus Calms the Storm", verse: "Mark 4:39", image: calmingStorm },
  { slug: "david-shepherd", title: "David the Shepherd Boy", verse: "1 Samuel 16:11", image: davidShepherd },
  { slug: "good-samaritan", title: "The Good Samaritan", verse: "Luke 10:33", image: goodSamaritan },
  { slug: "daniel-lions", title: "Daniel and the Lions", verse: "Daniel 6:22", image: danielLions },
];

// Each difficulty defines its target piece counts. Adding more entries
// to the array (or more difficulties) just works — no other code changes
// needed for content expansion.
interface DifficultyDef {
  id: DifficultyId;
  label: string;
  description: string;
  pieceTargets: number[];
}

const DIFFICULTY_DEFS: DifficultyDef[] = [
  { id: "easy", label: "Easy", description: "Gentle first puzzles", pieceTargets: [5, 8, 10, 12, 15] },
  { id: "easy-medium", label: "Easy – Medium", description: "A little more to piece together", pieceTargets: [15, 18, 22, 26, 30] },
  { id: "medium", label: "Medium", description: "For curious little builders", pieceTargets: [30, 38, 45, 52, 60] },
  { id: "medium-hard", label: "Medium – Hard", description: "A satisfying challenge", pieceTargets: [60, 70, 80, 90, 100] },
  { id: "hard", label: "Hard", description: "For patient hearts and hands", pieceTargets: [100, 110, 125, 140, 150] },
];

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

export const DIFFICULTIES: Difficulty[] = DIFFICULTY_DEFS.map((d) => ({
  id: d.id,
  label: d.label,
  description: d.description,
  puzzles: d.pieceTargets.map((target, i) => {
    const scene = SCENES[i % SCENES.length];
    const grid = computeGrid(target);
    return {
      id: `${d.id}__${i + 1}__${scene.slug}`,
      difficultyId: d.id,
      indexInDifficulty: i,
      title: scene.title,
      verse: scene.verse,
      image: scene.image,
      cols: grid.cols,
      rows: grid.rows,
    };
  }),
}));

export const ALL_PUZZLES: Puzzle[] = DIFFICULTIES.flatMap((d) => d.puzzles);

export const findPuzzle = (id: string): Puzzle | undefined =>
  ALL_PUZZLES.find((p) => p.id === id);

export const findDifficulty = (id: DifficultyId): Difficulty | undefined =>
  DIFFICULTIES.find((d) => d.id === id);

export const pieceCount = (p: Puzzle) => p.cols * p.rows;
