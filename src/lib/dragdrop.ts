// Drag & Drop game — data model. Designed to scale to 25 Old Testament +
// 25 Life of Jesus stories across two independent collections without any
// structural changes: just append entries to the arrays below.
import creation from "@/assets/dd/scene-creation.jpg";
import noahsArk from "@/assets/dd/scene-noah.jpg";
import babel from "@/assets/dd/scene-babel.jpg";
import abrahamStars from "@/assets/dd/scene-abraham.jpg";
import josephCoat from "@/assets/dd/scene-joseph.jpg";

// Painted, transparent object artwork — each piece is a real illustration cut
// from the same soft watercolor storybook style as the scenes. The very same
// artwork is rendered as a soft silhouette in its target spot, so the piece
// always fits its outline perfectly.
import artCreationSheep from "@/assets/dd/cr-sheep.png";
import artCreationDeer from "@/assets/dd/cr-deer.png";
import artCreationDoves from "@/assets/dd/cr-doves.png";
import artNoahDoves from "@/assets/dd/no-doves.png";
import artNoahElephant from "@/assets/dd/no-elephant.png";
import artNoahSheep from "@/assets/dd/no-sheep.png";
import artBabelBlock from "@/assets/dd/ba-block.png";
import artBabelBasket from "@/assets/dd/ba-basket.png";
import artBabelWorker from "@/assets/dd/ba-worker.png";
import artAbrahamTentLeft from "@/assets/dd/ab-tent-left.png";
import artAbrahamTentsRight from "@/assets/dd/ab-tents-right.png";
import artAbrahamFlowers from "@/assets/dd/ab-flowers.png";
import artJosephLamb from "@/assets/dd/jo-lamb.png";
import artJosephSheepLeft from "@/assets/dd/jo-sheep-left.png";
import artJosephSheepRight from "@/assets/dd/jo-sheep-right.png";

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
    // Restore the original painting by returning the exact animals that were
    // lifted from it: the pair of doves in the bright sky, the grazing lamb in
    // the flowered meadow, and the small deer on the far right bank.
    items: [
      { id: "doves", art: artCreationDoves, labelKey: "dd.item.dove", x: 69, y: 33, w: 18 },
      { id: "sheep", art: artCreationSheep, labelKey: "dd.item.sheep", x: 32, y: 78, w: 25 },
      { id: "deer", art: artCreationDeer, labelKey: "Deer", x: 84, y: 56, w: 12 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    // Return the exact painted animals removed from the finished ark scene:
    // the pair of doves on the bow rail, the small elephant on the ramp, and
    // the woolly sheep on the grassy shore.
    items: [
      { id: "doves", art: artNoahDoves, labelKey: "dd.item.dove", x: 18, y: 45, w: 16 },
      { id: "elephant", art: artNoahElephant, labelKey: "dd.item.elephant", x: 79, y: 78, w: 15 },
      { id: "sheep", art: artNoahSheep, labelKey: "dd.item.sheep", x: 92, y: 83, w: 16 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    // Only restore elements that naturally belonged to the original finished
    // painting: a foreground stone block, the basket by the workbench, and the
    // smiling builder carrying a block through the courtyard.
    items: [
      { id: "block", art: artBabelBlock, labelKey: "Stone block", x: 19, y: 86, w: 16 },
      { id: "worker", art: artBabelWorker, labelKey: "dd.item.workers", x: 52, y: 79, w: 16 },
      { id: "basket", art: artBabelBasket, labelKey: "dd.item.basket", x: 71, y: 90, w: 12 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    // A complete twilight camp scene, now missing only the original tents and
    // one small flower patch lifted from the foreground hillside.
    items: [
      { id: "tents-right", art: artAbrahamTentsRight, labelKey: "dd.item.tent", x: 85, y: 67, w: 22 },
      { id: "tent-left", art: artAbrahamTentLeft, labelKey: "dd.item.tent", x: 12, y: 80, w: 13 },
      { id: "flowers", art: artAbrahamFlowers, labelKey: "Flowers", x: 13, y: 90, w: 18 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    // Joseph remains untouched in the finished artwork; the removable pieces are
    // the original flock around him: a lamb at his side and two grazing sheep.
    items: [
      { id: "sheep-left", art: artJosephSheepLeft, labelKey: "dd.item.sheep", x: 15, y: 58, w: 20 },
      { id: "lamb", art: artJosephLamb, labelKey: "dd.item.sheep", x: 81, y: 78, w: 18 },
      { id: "sheep-right", art: artJosephSheepRight, labelKey: "dd.item.sheep", x: 86, y: 55, w: 19 },
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
