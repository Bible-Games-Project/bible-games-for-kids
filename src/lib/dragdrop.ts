// Drag & Drop: round pieces are cut from a story painting and the child
// drags each one back to its spot. The painting stays visible under a frosted
// socket, so the picture itself is the clue. Any story from stories.ts can
// join by listing where its pieces are.
import { findStory, type Story } from "./stories";

export interface DragPiece {
  // Centre of the piece: x in % of the painting's width, y in % of its height.
  x: number;
  y: number;
  // Radius in % of the painting's width.
  r: number;
}

export interface DragStory {
  story: Story;
  pieces: DragPiece[];
}

const DEFS: { slug: string; pieces: DragPiece[] }[] = [
  {
    slug: "david-goliath",
    pieces: [
      { x: 37, y: 34, r: 8 }, // David's face
      { x: 81, y: 22, r: 8 }, // Goliath's helmet
      { x: 67, y: 12, r: 6.5 }, // spear tip
      { x: 91, y: 38, r: 8 }, // shield
      { x: 7, y: 57, r: 6.5 }, // sling and stone
    ],
  },
  {
    slug: "rainbow-promise",
    pieces: [
      { x: 14, y: 40, r: 9 }, // giraffes
      { x: 33, y: 53, r: 8 }, // elephant
      { x: 42, y: 65, r: 7 }, // zebras
      { x: 78, y: 47, r: 7.5 }, // Noah
      { x: 52, y: 14, r: 8 }, // rainbow
    ],
  },
];

export const DRAG_STORIES: DragStory[] = DEFS.flatMap((d) => {
  const story = findStory(d.slug);
  return story ? [{ story, pieces: d.pieces }] : [];
});

// The painting's height as a share of its width (896 x 1152).
export const PAINTING_RATIO = 1152 / 896;

// CSS background settings that show just this piece of the painting in a
// square element.
export function pieceBackground(image: string, p: DragPiece) {
  const d = 2 * p.r; // diameter, % of width
  const h = d / PAINTING_RATIO; // diameter, % of height
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${(100 * 100) / d}% auto`,
    backgroundPosition: `${((p.x - p.r) / (100 - d)) * 100}% ${((p.y - h / 2) / (100 - h)) * 100}%`,
  };
}

const KEY = "dd-progress-v2";

export const loadDoneStories = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const markStoryDone = (slug: string): string[] => {
  const done = loadDoneStories();
  if (!done.includes(slug)) {
    done.push(slug);
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }
  return done;
};
