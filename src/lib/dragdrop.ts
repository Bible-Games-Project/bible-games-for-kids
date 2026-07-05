// Drag & Drop game — data model. Designed to scale to 25 Old Testament +
// 25 Life of Jesus stories across two independent collections without any
// structural changes: just append entries to the arrays below.
import creation from "@/assets/puzzle-creation.jpg";
import noahsArk from "@/assets/puzzle-noahs-ark.jpg";
import babel from "@/assets/dragdrop-babel.jpg";
import abrahamStars from "@/assets/puzzle-abraham-stars.jpg";
import josephCoat from "@/assets/puzzle-joseph-coat.jpg";

export type CollectionId = "old-testament" | "life-of-jesus";

export interface DragItem {
  id: string; // stable, unique within a story
  emoji: string; // child-friendly visual token
  labelKey: string; // dd-i18n key for accessible / caption text
  // Target position as a percentage of the scene (center of the drop zone).
  x: number;
  y: number;
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
      { id: "sun", emoji: "☀️", labelKey: "dd.item.sun", x: 26, y: 20 },
      { id: "moon", emoji: "🌙", labelKey: "dd.item.moon", x: 74, y: 22 },
      { id: "stars", emoji: "✨", labelKey: "dd.item.stars", x: 50, y: 13 },
    ],
  },
  {
    id: "ot-2-noah",
    slug: "noah",
    image: noahsArk,
    items: [
      { id: "elephant", emoji: "🐘", labelKey: "dd.item.elephant", x: 28, y: 70 },
      { id: "lion", emoji: "🦁", labelKey: "dd.item.lion", x: 52, y: 74 },
      { id: "giraffe", emoji: "🦒", labelKey: "dd.item.giraffe", x: 74, y: 58 },
    ],
  },
  {
    id: "ot-3-babel",
    slug: "babel",
    image: babel,
    items: [
      { id: "bricks", emoji: "🧱", labelKey: "dd.item.bricks", x: 34, y: 66 },
      { id: "beams", emoji: "🪵", labelKey: "dd.item.beams", x: 64, y: 58 },
      { id: "workers", emoji: "👷", labelKey: "dd.item.workers", x: 50, y: 80 },
    ],
  },
  {
    id: "ot-4-abraham",
    slug: "abraham",
    image: abrahamStars,
    items: [
      { id: "tent", emoji: "⛺", labelKey: "dd.item.tent", x: 28, y: 74 },
      { id: "camel", emoji: "🐫", labelKey: "dd.item.camel", x: 70, y: 72 },
      { id: "stick", emoji: "🦯", labelKey: "dd.item.stick", x: 50, y: 82 },
    ],
  },
  {
    id: "ot-5-joseph",
    slug: "joseph",
    image: josephCoat,
    items: [
      { id: "coat", emoji: "🧥", labelKey: "dd.item.coat", x: 50, y: 48 },
      { id: "grain", emoji: "🌾", labelKey: "dd.item.grain", x: 28, y: 74 },
      { id: "dreamstars", emoji: "⭐", labelKey: "dd.item.dreamstars", x: 72, y: 24 },
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
