// Picture dominoes: a double-six set where each number 0-6 is also a story
// painting, so a tile can be matched by its picture or by counting its dots.
// Each game picks seven paintings at random.
import { STORIES, type Story } from "./stories";

export interface Tile {
  id: number;
  a: number;
  b: number;
}

// A tile on the table, turned so that `a` touches the tile before it.
export type Placed = Tile;

export const ALL_TILES: Tile[] = (() => {
  const tiles: Tile[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) tiles.push({ id: tiles.length, a, b });
  return tiles;
})();

export const HAND_SIZE = 7;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The seven paintings for numbers 0 to 6.
export const pickFaces = (): Story[] => shuffle(STORIES).slice(0, 7);

export function deal(players: number): { hands: Tile[][]; pile: Tile[] } {
  const tiles = shuffle(ALL_TILES);
  const hands = Array.from({ length: players }, (_, i) =>
    tiles.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE),
  );
  return { hands, pile: tiles.slice(players * HAND_SIZE) };
}

export const dots = (tiles: Tile[]) => tiles.reduce((sum, t) => sum + t.a + t.b, 0);

export type Side = "start" | "end";

// The sides of the line where `tile` can go (any side on an empty table).
export function sidesFor(tile: Tile, line: Placed[]): Side[] {
  if (!line.length) return ["end"];
  const first = line[0].a;
  const last = line[line.length - 1].b;
  const sides: Side[] = [];
  if (tile.a === first || tile.b === first) sides.push("start");
  if ((tile.a === last || tile.b === last) && !(sides.length && first === last)) sides.push("end");
  return sides;
}

// The line with `tile` added at `side`, turned to match its neighbour.
export function addTile(line: Placed[], tile: Tile, side: Side): Placed[] {
  if (!line.length) return [tile];
  if (side === "start") {
    const first = line[0].a;
    const turned = tile.b === first ? tile : { ...tile, a: tile.b, b: tile.a };
    return [turned, ...line];
  }
  const last = line[line.length - 1].b;
  const turned = tile.a === last ? tile : { ...tile, a: tile.b, b: tile.a };
  return [...line, turned];
}

// The computer plays its tile with the most dots that fits.
export function computerChoice(hand: Tile[], line: Placed[]): { tile: Tile; side: Side } | null {
  const options = hand
    .flatMap((tile) => sidesFor(tile, line).map((side) => ({ tile, side })))
    .sort((x, y) => y.tile.a + y.tile.b - (x.tile.a + x.tile.b));
  return options[0] ?? null;
}

// Where the dots sit on a half (in 0..1), like on a die.
export const PIPS: [number, number][][] = [
  [],
  [[0.5, 0.5]],
  [
    [0.27, 0.27],
    [0.73, 0.73],
  ],
  [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  [
    [0.27, 0.27],
    [0.73, 0.27],
    [0.27, 0.73],
    [0.73, 0.73],
  ],
  [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  [
    [0.27, 0.22],
    [0.73, 0.22],
    [0.27, 0.5],
    [0.73, 0.5],
    [0.27, 0.78],
    [0.73, 0.78],
  ],
];

// ---- Laying the line out on the table ----
// The first tile played sits in the middle and the line grows from both of
// its ends, tiles touching end to end, doubles placed crosswise. When an arm
// reaches the edge of the table it turns the corner with an upright tile
// (the right arm downwards, the left arm upwards) and comes back the other
// way. `long` and `short` are a tile's sides; positions are top-left corners.
export interface Spot {
  x: number;
  y: number;
  vertical: boolean;
  flipped: boolean; // show b before a (left to right, or top to bottom)
}

const GAP = 2;

export function layoutLine(
  line: Placed[],
  firstId: number | null,
  width: number,
  long: number,
  short: number,
): { spots: Spot[]; height: number } {
  const spots: Spot[] = [];
  if (!line.length) return { spots, height: 0 };
  const origin = Math.max(
    0,
    line.findIndex((t) => t.id === firstId),
  );
  const isDouble = (t: Tile) => t.a === t.b;
  const minX = 2;
  const maxX = width - 2;
  const centre = width / 2;
  const first = line[origin];
  const firstAlong = isDouble(first) ? short : long;
  spots[origin] = isDouble(first)
    ? { x: centre - short / 2, y: -long / 2, vertical: true, flipped: false }
    : { x: centre - long / 2, y: -short / 2, vertical: false, flipped: false };

  // One arm of the line. `touchesA`: the half of each tile that touches the
  // tile before it (a on the right arm, b on the left one).
  const arm = (indices: number[], startDir: 1 | -1, down: boolean, touchesA: boolean) => {
    let dir = startDir;
    let x = centre + (dir * firstAlong) / 2; // where the next tile touches, on the row's axis
    let y = 0;
    // how far the last tile reaches above and below the row's axis
    let reach = isDouble(first) ? long / 2 : short / 2;
    for (const i of indices) {
      const tile = line[i];
      const along = isDouble(tile) ? short : long;
      const fits = dir > 0 ? x + GAP + along <= maxX : x - GAP - along >= minX;
      if (!fits) {
        // Round the corner: an upright tile below (or above) the row's end.
        const left = dir > 0 ? x - short : x;
        const top = down ? y + reach + GAP : y - reach - GAP - long;
        spots[i] = { x: left, y: top, vertical: true, flipped: false };
        x = dir > 0 ? left - GAP : left + short + GAP;
        // the new row runs through the far half of the upright tile
        y = down ? top + long - short / 2 : top + short / 2;
        reach = short / 2;
        dir = dir > 0 ? -1 : 1;
        continue;
      }
      const left = dir > 0 ? x + GAP : x - GAP - along;
      spots[i] = isDouble(tile)
        ? { x: left, y: y - long / 2, vertical: true, flipped: false }
        : { x: left, y: y - short / 2, vertical: false, flipped: touchesA ? dir < 0 : dir > 0 };
      x = dir > 0 ? left + along : left;
      reach = isDouble(tile) ? long / 2 : short / 2;
    }
  };
  arm(line.map((_, i) => i).slice(origin + 1), 1, true, true);
  arm(
    line
      .map((_, i) => i)
      .slice(0, origin)
      .reverse(),
    -1,
    false,
    false,
  );

  const top = Math.min(...spots.map((s) => s.y));
  const bottom = Math.max(...spots.map((s) => s.y + (s.vertical ? long : short)));
  return { spots: spots.map((s) => ({ ...s, y: s.y - top })), height: bottom - top };
}
