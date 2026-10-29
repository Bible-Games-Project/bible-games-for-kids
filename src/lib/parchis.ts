// Christian parchís: the classic Spanish ludo on a 19 x 19 grid. Four arms
// three squares wide around a centre goal, four coloured bases in the
// corners, a loop of 68 squares, and seven squares up each colour's arm to
// the goal. The safe squares carry story paintings, in Bible order around
// the board.
//
// Kept simple for children: a 5 brings a pawn out; a 6, sending a pawn home
// or reaching the goal earns another roll; pawns can share squares (no
// barriers); the goal needs the exact number.
import { STORIES, type Story } from "./stories";

export const COLORS = ["yellow", "blue", "red", "green"] as const;
export type Color = (typeof COLORS)[number];

export const SIZE = 19;
export const LOOP_LEN = 68;
export const GOAL = 71; // progress at the goal

type Cell = [col: number, row: number];

// The loop, counter-clockwise, starting at the bottom of the bottom arm's
// right lane.
export const LOOP: Cell[] = (() => {
  const c: Cell[] = [];
  for (let r = 18; r >= 11; r--) c.push([10, r]); // bottom arm, up
  for (let x = 11; x <= 18; x++) c.push([x, 10]); // right arm, out
  c.push([18, 9]); // right tip
  for (let x = 18; x >= 11; x--) c.push([x, 8]); // right arm, in
  for (let r = 7; r >= 0; r--) c.push([10, r]); // top arm, up
  c.push([9, 0]); // top tip
  for (let r = 0; r <= 7; r++) c.push([8, r]); // top arm, down
  for (let x = 7; x >= 0; x--) c.push([x, 8]); // left arm, out
  c.push([0, 9]); // left tip
  for (let x = 0; x <= 7; x++) c.push([x, 10]); // left arm, in
  for (let r = 11; r <= 18; r++) c.push([8, r]); // bottom arm, down
  c.push([9, 18]); // bottom tip
  return c;
})();

const indexOf = (col: number, row: number) => LOOP.findIndex(([x, y]) => x === col && y === row);

// The tip of each colour's arm: the last loop square before its home lane.
const TIP: Record<Color, number> = {
  yellow: indexOf(0, 9),
  blue: indexOf(9, 0),
  red: indexOf(18, 9),
  green: indexOf(9, 18),
};

// Where pawns come out: five squares past the tip, next to the base.
export const EXIT: Record<Color, number> = {
  yellow: (TIP.yellow + 5) % LOOP_LEN,
  blue: (TIP.blue + 5) % LOOP_LEN,
  red: (TIP.red + 5) % LOOP_LEN,
  green: (TIP.green + 5) % LOOP_LEN,
};

// The seven squares from the tip to the goal.
export const HOME_LANE: Record<Color, Cell[]> = {
  yellow: [1, 2, 3, 4, 5, 6, 7].map((x) => [x, 9] as Cell),
  blue: [1, 2, 3, 4, 5, 6, 7].map((r) => [9, r] as Cell),
  red: [17, 16, 15, 14, 13, 12, 11].map((x) => [x, 9] as Cell),
  green: [17, 16, 15, 14, 13, 12, 11].map((r) => [9, r] as Cell),
};

// Top-left corner of each 8 x 8 base.
export const BASE: Record<Color, Cell> = {
  blue: [0, 0],
  red: [11, 0],
  yellow: [0, 11],
  green: [11, 11],
};

// Safe squares: each exit, and 7 and 12 squares after it.
export const SAFE: number[] = COLORS.flatMap((c) =>
  [0, 7, 12].map((k) => (EXIT[c] + k) % LOOP_LEN),
).sort((a, b) => a - b);

// A story painting for every safe square, in Bible order around the loop
// starting from yellow's exit.
export const SAFE_STORIES: Map<number, Story> = (() => {
  const byEra = [...STORIES].sort((a, b) => a.era - b.era);
  const order = [...SAFE].sort(
    (a, b) => ((a - EXIT.yellow + LOOP_LEN) % LOOP_LEN) - ((b - EXIT.yellow + LOOP_LEN) % LOOP_LEN),
  );
  const step = byEra.length / order.length;
  return new Map(order.map((sq, i) => [sq, byEra[Math.floor(i * step + step / 2)]]));
})();

// Which loop square a pawn of `color` stands on at this progress (null when
// it is in its base, its home lane or the goal).
export const loopSquare = (color: Color, progress: number): number | null =>
  progress >= 0 && progress < 64 ? (EXIT[color] + progress) % LOOP_LEN : null;

// Centre of the cell (in grid units) for a pawn; `slot` spreads pawns in the
// base and the goal.
export function spot(color: Color, progress: number, slot: number): [number, number] {
  if (progress < 0) {
    const [x, y] = BASE[color];
    return [x + 2.5 + (slot % 2) * 3, y + 2.5 + Math.floor(slot / 2) * 3];
  }
  if (progress >= GOAL) {
    const toward: Record<Color, [number, number]> = {
      yellow: [-0.7, 0],
      blue: [0, -0.7],
      red: [0.7, 0],
      green: [0, 0.7],
    };
    const [dx, dy] = toward[color];
    return [9.5 + dx + ((slot % 2) - 0.5) * 0.5, 9.5 + dy + (Math.floor(slot / 2) - 0.5) * 0.5];
  }
  const [x, y] =
    progress < 64 ? LOOP[(EXIT[color] + progress) % LOOP_LEN] : HOME_LANE[color][progress - 64];
  return [x + 0.5, y + 0.5];
}

// Where a pawn ends up after rolling `die`, or null if it can't move.
export function target(progress: number, die: number): number | null {
  if (progress < 0) return die === 5 ? 0 : null;
  const next = progress + die;
  return next > GOAL ? null : next;
}

// Colours taking part, keeping opposite corners for two players.
export function seatColors(players: number): Color[] {
  if (players <= 2) return ["yellow", "red"];
  if (players === 3) return ["yellow", "blue", "red"];
  return ["yellow", "blue", "red", "green"];
}
