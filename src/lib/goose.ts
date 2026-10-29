// Game of the Goose with the Bible stories as squares. Players race from the
// start (0) to square 65, which must be reached exactly (extra steps bounce
// back). Special squares:
//  - New Testament stories are the "geese": land on one and jump ahead to
//    the next one, then roll again.
//  - Jacob's ladder appears twice: land on one and move to the other, then
//    roll again.
//  - Daniel in the lions' den is the prison: miss your next turn.
//  - The death of Jesus sends you back to the start.
// Every other square is an Old Testament story, in Bible order, repeated as
// needed (new stories added to stories.ts join automatically).
import { STORIES, findStory, type Story } from "./stories";

export const LAST = 65;
export const GEESE = [5, 11, 16, 22, 28, 33, 39, 45, 50, 56, 62];
export const LADDERS = [26, 53];
export const PRISON = 19;
export const DEATH = 58;

export type SquareKind = "start" | "story" | "goose" | "ladder" | "prison" | "death" | "finish";

export interface Square {
  n: number;
  kind: SquareKind;
  story?: Story;
}

const NEW_TESTAMENT = 200;
const PRISON_STORY = "daniel-lions";
const LADDER_STORY = "jacobs-ladder";
const FINISH_STORY = "resurrection-morning";

const byEra = [...STORIES].sort((a, b) => a.era - b.era);
const oldStories = byEra.filter(
  (s) => s.era < NEW_TESTAMENT && s.slug !== PRISON_STORY && s.slug !== LADDER_STORY,
);
const newStories = byEra.filter((s) => s.era >= NEW_TESTAMENT && s.slug !== FINISH_STORY);

export const SQUARES: Square[] = (() => {
  const out: Square[] = [];
  let ot = 0;
  let goose = 0;
  for (let n = 0; n <= LAST; n++) {
    if (n === 0) out.push({ n, kind: "start" });
    else if (n === LAST) out.push({ n, kind: "finish", story: findStory(FINISH_STORY) });
    else if (n === PRISON) out.push({ n, kind: "prison", story: findStory(PRISON_STORY) });
    else if (n === DEATH) out.push({ n, kind: "death" });
    else if (LADDERS.includes(n)) out.push({ n, kind: "ladder", story: findStory(LADDER_STORY) });
    else if (GEESE.includes(n)) {
      // Spread the geese across the New Testament, still in order.
      const i = Math.floor((goose++ * newStories.length) / GEESE.length);
      out.push({ n, kind: "goose", story: newStories[i] });
    } else out.push({ n, kind: "story", story: oldStories[ot++ % oldStories.length] });
  }
  return out;
})();

// Where landing on square `n` sends you, and whether you roll again.
export function ruleFor(n: number): { to: number; again: boolean; skip: boolean } {
  const kind = SQUARES[n].kind;
  if (kind === "goose") {
    const next = GEESE.find((g) => g > n);
    return { to: next ?? n, again: true, skip: false };
  }
  if (kind === "ladder") return { to: LADDERS.find((l) => l !== n) ?? n, again: true, skip: false };
  if (kind === "prison") return { to: n, again: false, skip: true };
  if (kind === "death") return { to: 0, again: false, skip: false };
  return { to: n, again: false, skip: false };
}

// ---------- Board layout ----------
// A 9 x 11 grid walked as a spiral from the bottom-left corner inwards: the
// outer ring, then the second ring, then square 64; the finish fills the
// middle of the board.
export const COLS = 9;
export const ROWS = 11;

export const CELLS: { col: number; row: number }[] = (() => {
  const cells: { col: number; row: number }[] = [];
  let left = 0;
  let right = COLS - 1;
  let top = 0;
  let bottom = ROWS - 1;
  for (let ring = 0; ring < 2; ring++) {
    for (let c = left; c <= right; c++) cells.push({ col: c, row: bottom });
    for (let r = bottom - 1; r >= top; r--) cells.push({ col: right, row: r });
    for (let c = right - 1; c >= left; c--) cells.push({ col: c, row: top });
    for (let r = top + 1; r < bottom; r++) cells.push({ col: left, row: r });
    left++;
    right--;
    top++;
    bottom--;
  }
  cells.push({ col: left, row: bottom }); // square 64
  return cells;
})();

// The finish covers the middle: these columns and rows (inclusive).
export const FINISH_AREA = { col: 2, row: 2, cols: 5, rows: 6 };
// Space left under the finish for the rules legend.
export const LEGEND_AREA = { col: 3, row: 8, cols: 4, rows: 1 };
