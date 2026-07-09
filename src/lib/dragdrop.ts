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
// scissors"), so the draggable piece is one isolated object with a clean
// outline. Each object has a matching "socket": an object-shaped placeholder
// with the exact same silhouette, a clean contour outline and a softly
// recessed interior, so the empty spot reads like a wooden-puzzle socket
// (the painting stays visible through it) rather than a blurred shadow.
import creation_sheep from "@/assets/dd/objects/creation-sheep.png";
import creation_deer from "@/assets/dd/objects/creation-deer.png";
import creation_flowers from "@/assets/dd/objects/creation-flowers-l.png";
import noah_doves from "@/assets/dd/objects/noah-doves.png";
import noah_eleph_ramp from "@/assets/dd/objects/noah-eleph-ramp.png";
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

// Object-shaped sockets (identical silhouettes, clean contour outline).
import creation_sheep_s from "@/assets/dd/sockets/creation-sheep.png";
import creation_deer_s from "@/assets/dd/sockets/creation-deer.png";
import creation_flowers_s from "@/assets/dd/sockets/creation-flowers-l.png";
import noah_doves_s from "@/assets/dd/sockets/noah-doves.png";
import noah_eleph_ramp_s from "@/assets/dd/sockets/noah-eleph-ramp.png";
import noah_ram_s from "@/assets/dd/sockets/noah-ram.png";
import noah_lamb_r_s from "@/assets/dd/sockets/noah-lamb-r.png";
import babel_crane_s from "@/assets/dd/sockets/babel-crane.png";
import babel_carrier_s from "@/assets/dd/sockets/babel-carrier.png";
import babel_block_s from "@/assets/dd/sockets/babel-block.png";
import babel_blocks_r_s from "@/assets/dd/sockets/babel-blocks-r.png";
import babel_tree_s from "@/assets/dd/sockets/babel-tree.png";
import abraham_figure_s from "@/assets/dd/sockets/abraham-abraham.png";
import abraham_flowers_l_s from "@/assets/dd/sockets/abraham-flowers-l.png";
import abraham_flowers_r_s from "@/assets/dd/sockets/abraham-flowers-r.png";
import joseph_figure_s from "@/assets/dd/sockets/joseph-joseph.png";
import joseph_lamb_r_s from "@/assets/dd/sockets/joseph-lamb-r.png";
import joseph_sheep_l_s from "@/assets/dd/sockets/joseph-sheep-l.png";
import joseph_sheep_r_s from "@/assets/dd/sockets/joseph-sheep-r.png";

export type CollectionId = "old-testament" | "life-of-jesus";

export interface DragItem {
  id: string; // stable, unique within a story
  art: string; // pixel-identical crop of the object taken from the scene
  socket: string; // object-shaped socket (same silhouette, clean outline)
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
    // Sunlit meadow: the grazing sheep, a deer on the far bank, a flower cluster.
    items: [
      { id: "sheep", art: creation_sheep, socket: creation_sheep_s, labelKey: "dd.item.sheep", x: 32.6, y: 73.7, w: 24.0 },
      { id: "deer", art: creation_deer, socket: creation_deer_s, labelKey: "dd.item.deer", x: 82.8, y: 52.8, w: 9.2 },
      { id: "flowers", art: creation_flowers, socket: creation_flowers_s, labelKey: "dd.item.flowers", x: 12.6, y: 90.6, w: 7.4 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    // Fully-visible objects only: the pair of doves on the bow rail, the
    // elephant coming down the ramp, and the ram and lamb on the grassy shore.
    items: [
      { id: "doves", art: noah_doves, socket: noah_doves_s, labelKey: "dd.item.dove", x: 15.5, y: 43.0, w: 15.0 },
      { id: "eleph-ramp", art: noah_eleph_ramp, socket: noah_eleph_ramp_s, labelKey: "dd.item.elephant", x: 73.3, y: 68.4, w: 12.2 },
      { id: "ram", art: noah_ram, socket: noah_ram_s, labelKey: "dd.item.sheep", x: 91.3, y: 79.6, w: 13.9 },
      { id: "lamb-r", art: noah_lamb_r, socket: noah_lamb_r_s, labelKey: "dd.item.sheep", x: 85.7, y: 83.8, w: 10.1 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    // The building site: the wooden crane, a builder carrying a stone, stacked
    // stone blocks and the tree on the right.
    items: [
      { id: "crane", art: babel_crane, socket: babel_crane_s, labelKey: "dd.item.crane", x: 12.4, y: 63.5, w: 22.3 },
      { id: "carrier", art: babel_carrier, socket: babel_carrier_s, labelKey: "dd.item.workers", x: 53.1, y: 85.7, w: 13.4 },
      { id: "block", art: babel_block, socket: babel_block_s, labelKey: "dd.item.bricks", x: 19.0, y: 92.4, w: 22.9 },
      { id: "blocks-r", art: babel_blocks_r, socket: babel_blocks_r_s, labelKey: "dd.item.bricks", x: 84.4, y: 91.5, w: 10.9 },
      { id: "tree", art: babel_tree, socket: babel_tree_s, labelKey: "dd.item.tree", x: 93.2, y: 65.1, w: 13.6 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    // Abraham gazing at the stars, with clusters of wildflowers at the meadow's edge.
    items: [
      { id: "abraham", art: abraham_figure, socket: abraham_figure_s, labelKey: "dd.item.man", x: 51.2, y: 56.7, w: 36.0 },
      { id: "flowers-l", art: abraham_flowers_l, socket: abraham_flowers_l_s, labelKey: "dd.item.flowers", x: 12.1, y: 93.2, w: 6.7 },
      { id: "flowers-r", art: abraham_flowers_r, socket: abraham_flowers_r_s, labelKey: "dd.item.flowers", x: 90.2, y: 87.2, w: 7.4 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    // Joseph in his colorful coat with the lamb at his side and his flock grazing.
    items: [
      { id: "joseph", art: joseph_figure, socket: joseph_figure_s, labelKey: "dd.item.boy", x: 49.6, y: 54.2, w: 38.1 },
      { id: "lamb-r", art: joseph_lamb_r, socket: joseph_lamb_r_s, labelKey: "dd.item.sheep", x: 79.7, y: 76.8, w: 31.7 },
      { id: "sheep-l", art: joseph_sheep_l, socket: joseph_sheep_l_s, labelKey: "dd.item.sheep", x: 16.8, y: 54.3, w: 22.4 },
      { id: "sheep-r", art: joseph_sheep_r, socket: joseph_sheep_r_s, labelKey: "dd.item.sheep", x: 82.9, y: 51.0, w: 26.4 },
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
