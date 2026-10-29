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
  const hands = Array.from({ length: players }, (_, i) => tiles.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE));
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
