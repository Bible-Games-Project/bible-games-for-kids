// Drag & Drop game — data model. Designed to scale to 25 Old Testament +
// 25 Life of Jesus stories across two independent collections without any
// structural changes: just append entries to the arrays below.
import creation from "@/assets/puzzle-creation.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import babel from "@/assets/dragdrop-babel.jpg";
import abrahamStars from "@/assets/puzzle-abraham-stars.jpg";
import josephCoat from "@/assets/puzzle-joseph-coat.jpg";

// Painted, transparent object artwork — each piece is a real illustration cut
// from the same soft watercolor storybook style as the scenes. The very same
// artwork is rendered as a soft silhouette in its target spot, so the piece
// always fits its outline perfectly.
import artSun from "@/assets/dd/sun.png";
import artStars from "@/assets/dd/stars.png";
import artElephant from "@/assets/dd/elephant.png";
import artDove from "@/assets/dd/dove.png";
import artBricks from "@/assets/dd/bricks.png";
import artBeams from "@/assets/dd/beams.png";
import artWorker from "@/assets/dd/worker.png";
import artLadder from "@/assets/dd/ladder.png";
import artBasket from "@/assets/dd/basket.png";
import artTent from "@/assets/dd/tent.png";
import artSheep from "@/assets/dd/sheep.png";

export type CollectionId = "old-testament" | "life-of-jesus";

export interface DragItem {
  id: string; // stable, unique within a story
  art: string; // painted transparent illustration of the missing object
  labelKey: string; // dd-i18n key for accessible / caption text
  // Target position as a percentage of the scene (center of the drop zone).
  x: number;
  y: number;
  // Rendered width as a percentage of the scene width (height keeps aspect).
  w: number;
}

export interface DragStory {
  id: string; // globally unique, stable
  slug: string; // used for localized title + message lookup
  collectionId: CollectionId;
  index: number; // position within its collection (0-based)
  image: string; // scene background (reused puzzle artwork where possible)
  items: DragItem[];
}

export interface DragCollection {
  id: CollectionId;
  labelKey: string;
  descKey: string;
  stories: DragStory[];
}

// --- Old Testament (first 5 stories only for now) ---
//
// Each scene is treated as a finished storybook painting: we only lift out
// objects that are genuinely part of that illustration and drop them back onto
// their real spot, so a completed board simply looks like the original artwork.
const OLD_TESTAMENT_STORIES: Omit<DragStory, "collectionId" | "index">[] = [
  {
    id: "ot-1-creation",
    slug: "creation",
    image: creation,
    // Peaceful meadow at first light: the sun glows behind the clouds, a dove
    // crosses the sky, and a lamb grazes among the flowers in the foreground.
    items: [
      { id: "sun", art: artSun, labelKey: "dd.item.sun", x: 57, y: 21, w: 22 },
      { id: "dove", art: artDove, labelKey: "dd.item.dove", x: 62, y: 35, w: 13 },
      { id: "sheep", art: artSheep, labelKey: "dd.item.sheep", x: 31, y: 77, w: 23 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    // Two doves rest on the bow railing, a little elephant walks down the ramp,
    // and a sheep waits on the grassy shore beside the ark.
    items: [
      { id: "dove-1", art: artDove, labelKey: "dd.item.dove", x: 15, y: 44, w: 11 },
      { id: "dove-2", art: artDove, labelKey: "dd.item.dove", x: 22, y: 41, w: 11 },
      { id: "elephant", art: artElephant, labelKey: "dd.item.elephant", x: 67, y: 76, w: 16 },
      { id: "sheep", art: artSheep, labelKey: "dd.item.sheep", x: 88, y: 81, w: 14 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    // A busy building site: cut stone blocks stacked on the ground, a basket
    // by the workbench, the wooden hoisting crane at the left, a ladder on the
    // tower's scaffold, and builders working in the courtyard.
    items: [
      { id: "bricks", art: artBricks, labelKey: "dd.item.bricks", x: 20, y: 90, w: 18 },
      { id: "basket", art: artBasket, labelKey: "dd.item.basket", x: 64, y: 92, w: 11 },
      { id: "beams", art: artBeams, labelKey: "dd.item.beams", x: 12, y: 66, w: 15 },
      { id: "ladder", art: artLadder, labelKey: "dd.item.ladder", x: 80, y: 52, w: 11 },
      { id: "workers", art: artWorker, labelKey: "dd.item.workers", x: 36, y: 71, w: 11 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    // A starry twilight over the plains: countless stars fill the sky above
    // Abraham while his family's tents sit on the horizon left and right.
    items: [
      { id: "stars-1", art: artStars, labelKey: "dd.item.stars", x: 22, y: 14, w: 20 },
      { id: "stars-2", art: artStars, labelKey: "dd.item.stars", x: 74, y: 16, w: 18 },
      { id: "tent-1", art: artTent, labelKey: "dd.item.tent", x: 84, y: 66, w: 15 },
      { id: "tent-2", art: artTent, labelKey: "dd.item.tent", x: 13, y: 80, w: 11 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    // Joseph the young shepherd keeps his colorful coat on; his little flock
    // grazes around him — two sheep in the meadow and a lamb resting at his side.
    items: [
      { id: "sheep-1", art: artSheep, labelKey: "dd.item.sheep", x: 14, y: 55, w: 22 },
      { id: "sheep-2", art: artSheep, labelKey: "dd.item.sheep", x: 83, y: 57, w: 18 },
      { id: "sheep-3", art: artSheep, labelKey: "dd.item.sheep", x: 73, y: 83, w: 17 },
    ],
  },
];

// --- Life of Jesus (content coming soon; collection scaffolded) ---
const LIFE_OF_JESUS_STORIES: Omit<DragStory, "collectionId" | "index">[] = [];

const withMeta = (
  stories: Omit<DragStory, "collectionId" | "index">[],
  collectionId: CollectionId,
): DragStory[] => stories.map((s, i) => ({ ...s, collectionId, index: i }));

export const COLLECTIONS: DragCollection[] = [
  {
    id: "old-testament",
    labelKey: "dd.collection.old-testament",
    descKey: "dd.collection.old-testament.desc",
    stories: withMeta(OLD_TESTAMENT_STORIES, "old-testament"),
  },
  {
    id: "life-of-jesus",
    labelKey: "dd.collection.life-of-jesus",
    descKey: "dd.collection.life-of-jesus.desc",
    stories: withMeta(LIFE_OF_JESUS_STORIES, "life-of-jesus"),
  },
];

export const findCollection = (id: CollectionId): DragCollection | undefined =>
  COLLECTIONS.find((c) => c.id === id);

// Freemium: first N stories of each collection are free.
export const DD_FREE_PER_COLLECTION = 3;
export const isFreeStory = (index: number): boolean => index < DD_FREE_PER_COLLECTION;
