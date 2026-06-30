import walkingWater from "@/assets/puzzle-walking-water.jpg";
import blessingChildren from "@/assets/puzzle-blessing-children.jpg";
import feeding5000 from "@/assets/puzzle-feeding-5000.jpg";
import calmingStorm from "@/assets/puzzle-calming-storm.jpg";
import goodSamaritan from "@/assets/puzzle-good-samaritan.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import creation from "@/assets/puzzle-creation.jpg";
import mosesBasket from "@/assets/puzzle-moses-basket.jpg";
import davidShepherd from "@/assets/puzzle-david-shepherd.jpg";
import nativity from "@/assets/puzzle-nativity.jpg";
import calmingStormTwo from "@/assets/puzzle-calming-storm-2.jpg";
import blessingChildrenTwo from "@/assets/puzzle-blessing-children-2.jpg";
import feeding5000Two from "@/assets/puzzle-feeding-5000-2.jpg";
import noahsArkTwo from "@/assets/puzzle-noahs-ark-2.jpg";
import creationTwo from "@/assets/puzzle-creation-2.jpg";
import mosesBasketTwo from "@/assets/puzzle-moses-basket-2.jpg";
import weddingCana from "@/assets/puzzle-wedding-cana.jpg";
import prodigalSon from "@/assets/puzzle-prodigal-son.jpg";
import zacchaeus from "@/assets/puzzle-zacchaeus.jpg";
import jonahFish from "@/assets/puzzle-jonah-fish.jpg";
import danielLions from "@/assets/puzzle-daniel-lions.jpg";
import josephCoat from "@/assets/puzzle-joseph-coat.jpg";
import sermonMount from "@/assets/puzzle-sermon-mount.jpg";
import baptismJesus from "@/assets/puzzle-baptism-jesus.jpg";
import palmSunday from "@/assets/puzzle-palm-sunday.jpg";
import adamAnimals from "@/assets/puzzle-adam-animals.jpg";
import ruthFields from "@/assets/puzzle-ruth-fields.jpg";
import abrahamStars from "@/assets/puzzle-abraham-stars.jpg";
import annunciation from "@/assets/puzzle-annunciation.jpg";
import wiseMen from "@/assets/puzzle-wise-men.jpg";
import lostSheep from "@/assets/puzzle-lost-sheep.jpg";
import jacobsLadder from "@/assets/puzzle-jacobs-ladder.jpg";
import samuelCall from "@/assets/puzzle-samuel-call.jpg";
import elijahRavens from "@/assets/puzzle-elijah-ravens.jpg";
import goodShepherd from "@/assets/puzzle-good-shepherd.jpg";
import healsBlind from "@/assets/puzzle-heals-blind.jpg";
import resurrectionMorning from "@/assets/puzzle-resurrection-morning.jpg";
import queenEsther from "@/assets/puzzle-queen-esther.jpg";
import josephForgives from "@/assets/puzzle-joseph-forgives.jpg";
import gideonFleece from "@/assets/puzzle-gideon-fleece.jpg";
import angelsShepherds from "@/assets/puzzle-angels-shepherds.jpg";
import boyTemple from "@/assets/puzzle-boy-temple.jpg";
import catchFish from "@/assets/puzzle-catch-fish.jpg";
import bethlehemJourney from "@/assets/puzzle-bethlehem-journey.jpg";
import sowerSeed from "@/assets/puzzle-sower-seed.jpg";

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
  { slug: "walking-water", title: "Jesus Walks on Water", verse: "Matthew 14:25", image: walkingWater },
  { slug: "feeding-5000", title: "Jesus Feeds the 5,000", verse: "John 6:11", image: feeding5000 },
  { slug: "calming-storm", title: "Jesus Calms the Storm", verse: "Mark 4:39", image: calmingStorm },
  { slug: "good-samaritan", title: "The Good Samaritan", verse: "Luke 10:33", image: goodSamaritan },
  { slug: "noahs-ark", title: "Noah's Ark", verse: "Genesis 9:13", image: noahsArk },
  { slug: "creation", title: "The Creation", verse: "Genesis 1:31", image: creation },
  { slug: "moses-basket", title: "Baby Moses in the Basket", verse: "Exodus 2:3", image: mosesBasket },
  { slug: "david-shepherd", title: "David the Shepherd Boy", verse: "1 Samuel 16:11", image: davidShepherd },
  { slug: "nativity", title: "The Nativity", verse: "Luke 2:7", image: nativity },
  { slug: "calming-storm-2", title: "Jesus Calms the Storm", verse: "Mark 4:39", image: calmingStormTwo },
  { slug: "blessing-children-2", title: "Jesus Blesses the Children", verse: "Matthew 19:14", image: blessingChildrenTwo },
  { slug: "feeding-5000-2", title: "Jesus Feeds the 5,000", verse: "John 6:11", image: feeding5000Two },
  { slug: "noahs-ark-2", title: "Noah's Ark", verse: "Genesis 9:13", image: noahsArkTwo },
  { slug: "creation-2", title: "The Creation", verse: "Genesis 1:31", image: creationTwo },
  { slug: "moses-basket-2", title: "Baby Moses in the Basket", verse: "Exodus 2:3", image: mosesBasketTwo },
  { slug: "wedding-cana", title: "The Wedding at Cana", verse: "John 2:9", image: weddingCana },
  { slug: "prodigal-son", title: "The Prodigal Son", verse: "Luke 15:20", image: prodigalSon },
  { slug: "zacchaeus", title: "Zacchaeus in the Tree", verse: "Luke 19:5", image: zacchaeus },
  { slug: "jonah-fish", title: "Jonah and the Great Fish", verse: "Jonah 2:10", image: jonahFish },
  { slug: "daniel-lions", title: "Daniel in the Lions' Den", verse: "Daniel 6:22", image: danielLions },
  { slug: "joseph-coat", title: "Joseph's Coat of Many Colors", verse: "Genesis 37:3", image: josephCoat },
  { slug: "sermon-mount", title: "The Sermon on the Mount", verse: "Matthew 5:1", image: sermonMount },
  { slug: "baptism-jesus", title: "The Baptism of Jesus", verse: "Matthew 3:16", image: baptismJesus },
  { slug: "palm-sunday", title: "The Triumphal Entry", verse: "Matthew 21:9", image: palmSunday },
  { slug: "adam-animals", title: "Adam Names the Animals", verse: "Genesis 2:19", image: adamAnimals },
  { slug: "ruth-fields", title: "Ruth in the Fields", verse: "Ruth 2:3", image: ruthFields },
  { slug: "abraham-stars", title: "Abraham Counts the Stars", verse: "Genesis 15:5", image: abrahamStars },
  { slug: "annunciation", title: "The Annunciation", verse: "Luke 1:30", image: annunciation },
  { slug: "wise-men", title: "The Wise Men Visit Jesus", verse: "Matthew 2:11", image: wiseMen },
  { slug: "lost-sheep", title: "The Lost Sheep", verse: "Luke 15:6", image: lostSheep },
  { slug: "jacobs-ladder", title: "Jacob's Ladder", verse: "Genesis 28:12", image: jacobsLadder },
  { slug: "samuel-call", title: "Samuel Hears God's Voice", verse: "1 Samuel 3:10", image: samuelCall },
  { slug: "elijah-ravens", title: "Elijah Fed by the Ravens", verse: "1 Kings 17:6", image: elijahRavens },
  { slug: "good-shepherd", title: "Jesus the Good Shepherd", verse: "John 10:11", image: goodShepherd },
  { slug: "heals-blind", title: "Jesus Heals a Blind Man", verse: "Mark 10:52", image: healsBlind },
  { slug: "resurrection-morning", title: "The Resurrection Morning", verse: "Matthew 28:6", image: resurrectionMorning },
  { slug: "queen-esther", title: "Queen Esther", verse: "Esther 2:17", image: queenEsther },
  { slug: "joseph-forgives", title: "Joseph Forgives His Brothers", verse: "Genesis 45:15", image: josephForgives },
  { slug: "gideon-fleece", title: "Gideon's Fleece", verse: "Judges 6:37", image: gideonFleece },
  { slug: "angels-shepherds", title: "Angels Appear to the Shepherds", verse: "Luke 2:9", image: angelsShepherds },
  { slug: "boy-temple", title: "The Boy Jesus in the Temple", verse: "Luke 2:46", image: boyTemple },
  { slug: "catch-fish", title: "The Miraculous Catch of Fish", verse: "John 21:6", image: catchFish },
  { slug: "bethlehem-journey", title: "The Journey to Bethlehem", verse: "Luke 2:4", image: bethlehemJourney },
  { slug: "sower-seed", title: "The Sower and the Seed", verse: "Matthew 13:3", image: sowerSeed },
];

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

export const DIFFICULTIES: Difficulty[] = DIFFICULTY_DEFS.map((d) => {
  const targets = buildPieceTargets(d, SCENES.length);
  return {
    id: d.id,
    label: d.label,
    description: d.description,
    puzzles: targets.map((target, i) => {
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
  };
});

export const ALL_PUZZLES: Puzzle[] = DIFFICULTIES.flatMap((d) => d.puzzles);

export const findPuzzle = (id: string): Puzzle | undefined =>
  ALL_PUZZLES.find((p) => p.id === id);

export const findDifficulty = (id: DifficultyId): Difficulty | undefined =>
  DIFFICULTIES.find((d) => d.id === id);

export const pieceCount = (p: Puzzle) => p.cols * p.rows;
