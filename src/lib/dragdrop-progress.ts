// Independent progress for the Drag & Drop game. Each collection tracks its
// own completed stories, so Old Testament and Life of Jesus progress
// separately. Fully isolated from the Puzzle game save system.
import type { CollectionId, DragStory } from "./dragdrop";
import { DD_FREE_PER_COLLECTION } from "./dragdrop";

const KEY = "dd-progress-v1";

// Map of collectionId -> array of completed story ids.
type DDProgress = Record<string, string[]>;

const read = (): DDProgress => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DDProgress) : {};
  } catch {
    return {};
  }
};

const write = (p: DDProgress) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

export const loadDDProgress = (): DDProgress => read();

export const isStoryCompleted = (
  collectionId: CollectionId,
  storyId: string,
  progress: DDProgress,
): boolean => (progress[collectionId] ?? []).includes(storyId);

export const markStoryComplete = (
  collectionId: CollectionId,
  storyId: string,
): DDProgress => {
  const p = read();
  const list = p[collectionId] ?? [];
  if (!list.includes(storyId)) {
    p[collectionId] = [...list, storyId];
    write(p);
  }
  return p;
};

// Story 1 of a collection is always unlocked. Each subsequent story unlocks
// once the previous story in the SAME collection is completed.
export const isStoryUnlocked = (
  stories: DragStory[],
  index: number,
  progress: DDProgress,
): boolean => {
  if (index <= 0) return true;
  const prev = stories[index - 1];
  return prev ? isStoryCompleted(prev.collectionId, prev.id, progress) : false;
};

export const completedCount = (
  collectionId: CollectionId,
  progress: DDProgress,
): number => (progress[collectionId] ?? []).length;

export { DD_FREE_PER_COLLECTION };
