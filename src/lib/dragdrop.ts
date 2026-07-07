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
import artMoon from "@/assets/dd/moon.png";
import artStars from "@/assets/dd/stars.png";
import artElephant from "@/assets/dd/elephant.png";
import artLion from "@/assets/dd/lion.png";
import artGiraffe from "@/assets/dd/giraffe.png";
import artDove from "@/assets/dd/dove.png";
import artBricks from "@/assets/dd/bricks.png";
import artBeams from "@/assets/dd/beams.png";
import artWorker from "@/assets/dd/worker.png";
import artLadder from "@/assets/dd/ladder.png";
import artBasket from "@/assets/dd/basket.png";
import artTent from "@/assets/dd/tent.png";
import artCamel from "@/assets/dd/camel.png";
import artStaff from "@/assets/dd/staff.png";
import artCampfire from "@/assets/dd/campfire.png";
import artSheep from "@/assets/dd/sheep.png";
import artJar from "@/assets/dd/jar.png";
import artCoat from "@/assets/dd/coat.png";
import artGrain from "@/assets/dd/grain.png";
import artSheaf from "@/assets/dd/sheaf.png";

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
const OLD_TESTAMENT_STORIES: Omit<DragStory, "collectionId" | "index">[] = [
  {
    id: "ot-1-creation",
    slug: "creation",
    image: creation,
    items: [
      { id: "sun", art: artSun, labelKey: "dd.item.sun", x: 26, y: 21, w: 24 },
      { id: "moon", art: artMoon, labelKey: "dd.item.moon", x: 76, y: 22, w: 19 },
      { id: "stars", art: artStars, labelKey: "dd.item.stars", x: 50, y: 12, w: 20 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    items: [
      { id: "elephant", art: artElephant, labelKey: "dd.item.elephant", x: 28, y: 70, w: 30 },
      { id: "lion", art: artLion, labelKey: "dd.item.lion", x: 53, y: 76, w: 26 },
      { id: "giraffe", art: artGiraffe, labelKey: "dd.item.giraffe", x: 76, y: 55, w: 22 },
      { id: "dove", art: artDove, labelKey: "dd.item.dove", x: 60, y: 22, w: 18 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    items: [
      { id: "bricks", art: artBricks, labelKey: "dd.item.bricks", x: 30, y: 70, w: 22 },
      { id: "beams", art: artBeams, labelKey: "dd.item.beams", x: 66, y: 62, w: 26 },
      { id: "workers", art: artWorker, labelKey: "dd.item.workers", x: 48, y: 82, w: 18 },
      { id: "ladder", art: artLadder, labelKey: "dd.item.ladder", x: 78, y: 44, w: 15 },
      { id: "basket", art: artBasket, labelKey: "dd.item.basket", x: 19, y: 78, w: 19 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    items: [
      { id: "tent", art: artTent, labelKey: "dd.item.tent", x: 27, y: 68, w: 28 },
      { id: "camel", art: artCamel, labelKey: "dd.item.camel", x: 75, y: 70, w: 26 },
      { id: "stick", art: artStaff, labelKey: "dd.item.stick", x: 50, y: 78, w: 11 },
      { id: "campfire", art: artCampfire, labelKey: "dd.item.campfire", x: 42, y: 84, w: 16 },
      { id: "sheep", art: artSheep, labelKey: "dd.item.sheep", x: 62, y: 86, w: 16 },
      { id: "jar", art: artJar, labelKey: "dd.item.jar", x: 15, y: 62, w: 13 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    items: [
      { id: "coat", art: artCoat, labelKey: "dd.item.coat", x: 48, y: 50, w: 26 },
      { id: "grain", art: artGrain, labelKey: "dd.item.grain", x: 25, y: 76, w: 20 },
      { id: "sun", art: artSun, labelKey: "dd.item.sun", x: 22, y: 19, w: 18 },
      { id: "moon", art: artMoon, labelKey: "dd.item.moon", x: 77, y: 19, w: 16 },
      { id: "star1", art: artStars, labelKey: "dd.item.stars", x: 40, y: 13, w: 15 },
      { id: "star2", art: artStars, labelKey: "dd.item.stars", x: 62, y: 15, w: 12 },
      { id: "sheaf", art: artSheaf, labelKey: "dd.item.sheaf", x: 76, y: 74, w: 18 },
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
