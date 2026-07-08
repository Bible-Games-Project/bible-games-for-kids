// Drag & Drop game — data model. Designed to scale to 25 Old Testament +
// 25 Life of Jesus stories across two independent collections without any
// structural changes: just append entries to the arrays below.
//
// NEW APPROACH: the scene painting is kept 100% intact. Every draggable piece
// is a pixel-identical crop lifted straight from the finished illustration, so
// perspective, scale, colours and painting style always match perfectly. Each
// crop is placed back exactly where it came from; until then, a soft grey
// painted shadow of that same crop marks its spot on top of the untouched art.
import creation from "@/assets/puzzle-creation.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import babel from "@/assets/dragdrop-babel.jpg";
import abrahamStars from "@/assets/puzzle-abraham-stars.jpg";
import josephCoat from "@/assets/puzzle-joseph-coat.jpg";

// True object cut-outs — each PNG is a single object lifted from the scene
// with a tight alpha silhouette (background fully removed, "cut with
// scissors"), so both the draggable piece and its shaped placeholder match
// the object's exact outline. Each one drops back onto its original spot.
import creation_sheep from "@/assets/dd/objects/creation-sheep.png";
import creation_deer from "@/assets/dd/objects/creation-deer.png";
import creation_flowers from "@/assets/dd/objects/creation-flowers-l.png";
import noah_giraffes from "@/assets/dd/objects/noah-giraffes.png";
import noah_eleph_ramp from "@/assets/dd/objects/noah-eleph-ramp.png";
import noah_eleph_win from "@/assets/dd/objects/noah-eleph-win.png";
import noah_ram from "@/assets/dd/objects/noah-ram.png";
import noah_lamb_r from "@/assets/dd/objects/noah-lamb-r.png";
import babel_crane from "@/assets/dd/objects/babel-crane.png";
import babel_carrier from "@/assets/dd/objects/babel-carrier.png";
import babel_block from "@/assets/dd/objects/babel-block.png";
import babel_blocks_r from "@/assets/dd/objects/babel-blocks-r.png";
import babel_tree from "@/assets/dd/objects/babel-tree.png";
import abraham_figure from "@/assets/dd/objects/abraham-abraham.png";
import abraham_flowers_l from "@/assets/dd/objects/abraham-flowers-l.png";
import abraham_flowers_r from "@/assets/dd/objects/abraham-flowers-r.png";
import joseph_figure from "@/assets/dd/objects/joseph-joseph.png";
import joseph_lamb_r from "@/assets/dd/objects/joseph-lamb-r.png";
import joseph_sheep_l from "@/assets/dd/objects/joseph-sheep-l.png";
import joseph_sheep_r from "@/assets/dd/objects/joseph-sheep-r.png";

export type CollectionId = "old-testament" | "life-of-jesus";

export interface DragItem {
  id: string; // stable, unique within a story
  art: string; // pixel-identical crop of the object taken from the scene
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
// Every piece below is a real crop of an object already painted in the scene,
// dropped back onto its exact original spot. A finished board is therefore
// visually identical to the untouched storybook painting.
const OLD_TESTAMENT_STORIES: Omit<DragStory, "collectionId" | "index">[] = [
  {
    id: "ot-1-creation",
    slug: "creation",
    image: creation,
    // Sunlit meadow: a grazing lamb, a deer on the far bank, two doves in flight.
    items: [
      { id: "sheep", art: creation_sheep, labelKey: "dd.item.sheep", x: 30.8, y: 75.5, w: 26.5 },
      { id: "deer", art: creation_deer, labelKey: "dd.item.deer", x: 84.8, y: 54.5, w: 11.5 },
      { id: "dove-hi", art: creation_dove_hi, labelKey: "dd.item.dove", x: 68.5, y: 33.8, w: 10.0 },
      { id: "dove-lo", art: creation_dove_lo, labelKey: "dd.item.dove", x: 61.5, y: 39.0, w: 10.0 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    // Doves on the bow, giraffes and elephants at the windows and ramp, and the
    // little flock of sheep on the grassy shore.
    items: [
      { id: "dove-1", art: noah_dove_1, labelKey: "dd.item.dove", x: 14.8, y: 43.0, w: 10.5 },
      { id: "dove-2", art: noah_dove_2, labelKey: "dd.item.dove", x: 23.5, y: 42.5, w: 10.0 },
      { id: "giraffes", art: noah_giraffes, labelKey: "dd.item.giraffe", x: 43.0, y: 58.2, w: 15.0 },
      { id: "eleph-win", art: noah_eleph_win, labelKey: "dd.item.elephant", x: 62.5, y: 54.8, w: 15.0 },
      { id: "eleph-ramp", art: noah_eleph_ramp, labelKey: "dd.item.elephant", x: 65.0, y: 67.5, w: 15.0 },
      { id: "ram", art: noah_ram, labelKey: "dd.item.sheep", x: 89.8, y: 79.2, w: 13.5 },
      { id: "lamb", art: noah_lamb, labelKey: "dd.item.sheep", x: 59.8, y: 83.2, w: 13.5 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    // The building site: the wooden crane, stacked stone blocks, a builder
    // carrying a block, a basket, a laden sawhorse and the tree on the right.
    items: [
      { id: "crane", art: babel_crane, labelKey: "dd.item.crane", x: 12.8, y: 64.0, w: 21.5 },
      { id: "blocks", art: babel_blocks, labelKey: "dd.item.bricks", x: 22.0, y: 91.8, w: 24.0 },
      { id: "carrier", art: babel_carrier, labelKey: "dd.item.workers", x: 52.5, y: 87.8, w: 15.0 },
      { id: "basket", art: babel_basket, labelKey: "dd.item.basket", x: 67.2, y: 93.5, w: 11.5 },
      { id: "sawhorse", art: babel_sawhorse, labelKey: "dd.item.bricks", x: 84.7, y: 92.2, w: 21.5 },
      { id: "tree", art: babel_tree, labelKey: "dd.item.tree", x: 91.8, y: 62.3, w: 14.5 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    // Tents on the horizon and clusters of wildflowers along the meadow's edge.
    items: [
      { id: "tents-r", art: abraham_tents_r, labelKey: "dd.item.tent", x: 86.8, y: 65.8, w: 17.5 },
      { id: "tent-l", art: abraham_tent_l, labelKey: "dd.item.tent", x: 13.5, y: 77.5, w: 13.0 },
      { id: "flowers-l", art: abraham_flowers_l, labelKey: "dd.item.flowers", x: 12.2, y: 91.0, w: 22.5 },
      { id: "flowers-r", art: abraham_flowers_r, labelKey: "dd.item.flowers", x: 86.5, y: 92.5, w: 25.0 },
      { id: "flowers-m", art: abraham_flowers_m, labelKey: "dd.item.flowers", x: 70.0, y: 94.2, w: 20.0 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    // Joseph's flock grazing around him and a cluster of meadow flowers.
    items: [
      { id: "lamb-r", art: joseph_lamb_r, labelKey: "dd.item.sheep", x: 74.2, y: 77.2, w: 24.5 },
      { id: "sheep-lf", art: joseph_sheep_lf, labelKey: "dd.item.sheep", x: 13.8, y: 55.0, w: 23.5 },
      { id: "sheep-lb", art: joseph_sheep_lb, labelKey: "dd.item.sheep", x: 24.2, y: 46.5, w: 14.5 },
      { id: "sheep-r1", art: joseph_sheep_r1, labelKey: "dd.item.sheep", x: 79.8, y: 50.7, w: 17.5 },
      { id: "sheep-r2", art: joseph_sheep_r2, labelKey: "dd.item.sheep", x: 90.8, y: 52.5, w: 11.5 },
      { id: "flowers-l", art: joseph_flowers_l, labelKey: "dd.item.flowers", x: 12.0, y: 89.8, w: 22.0 },
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
