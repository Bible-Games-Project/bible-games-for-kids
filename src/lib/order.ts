// "What Came First?": show a few story paintings and tap the one that
// happened earliest in the Bible. The level sets how many paintings appear
// (2 on Easy up to 6 on Master). Uses every story in stories.ts.
import type { DifficultyId } from "./puzzles";
import { STORIES, type Story } from "./stories";

export const ORDER_OPTIONS: Record<DifficultyId, number> = {
  easy: 2,
  "easy-medium": 3,
  medium: 4,
  "medium-hard": 5,
  hard: 6,
};

export const ORDER_ROUNDS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `count` stories from different periods, so there is always one clear
// answer (stories sharing an era are never asked against each other).
export function pickRound(count: number, avoid: Set<string>): Story[] {
  const picked: Story[] = [];
  const eras = new Set<number>();
  const pool = [...shuffle(STORIES.filter((s) => !avoid.has(s.slug))), ...shuffle(STORIES)];
  for (const s of pool) {
    if (picked.length === count) break;
    if (eras.has(s.era) || picked.includes(s)) continue;
    picked.push(s);
    eras.add(s.era);
  }
  return picked;
}

export const orderStars = (right: number) => (right >= 9 ? 3 : right >= 7 ? 2 : 1);

// ---------- The journey map ----------
// Every story has a stop on a winding path across the parchment map, in
// Bible order from the bottom of the page up to the X. A story joins the map
// the first time the child picks it correctly.

// Bible order; stories from the same era keep their catalogue order.
export const JOURNEY: Story[] = STORIES.map((s, i) => ({ s, i }))
  .sort((a, b) => a.s.era - b.s.era || a.i - b.i)
  .map(({ s }) => s);

// order-map.webp is 941x1672; the parchment fills this part of it.
export const MAP_IMAGE = { w: 941, h: 1672 };
export const MAP_VIEW = { x: 47, y: 334, w: 894, h: 1204 };

// The path's turning points in map pixels, ending on the X.
const WAYPOINTS: [number, number][] = [
  [250, 1400],
  [420, 1415],
  [600, 1395],
  [700, 1330],
  [640, 1250],
  [520, 1210],
  [400, 1235],
  [290, 1180],
  [240, 1090],
  [330, 1030],
  [450, 1010],
  [580, 980],
  [690, 930],
  [700, 850],
  [600, 820],
  [470, 830],
  [330, 850],
  [220, 800],
  [190, 720],
  [280, 660],
  [400, 640],
  [500, 600],
  [560, 540],
  [640, 560],
  [690, 620],
  [750, 655],
];

// Catmull-Rom through the waypoints, as cubic Bézier segments.
function segments(): [number, number][][] {
  const p = [WAYPOINTS[0], ...WAYPOINTS, WAYPOINTS[WAYPOINTS.length - 1]];
  const out: [number, number][][] = [];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    out.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ]);
  }
  return out;
}

export const ROUTE_PATH = segments()
  .map(
    ([a, b, c, d], i) =>
      `${i === 0 ? `M${a[0]} ${a[1]}` : ""}C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`,
  )
  .join("");

// One stop per story, evenly spaced along the path.
export const JOURNEY_STOPS: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (const [a, b, c, d] of segments()) {
    for (let k = 0; k < 40; k++) {
      const t = k / 40;
      const u = 1 - t;
      pts.push([
        u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
        u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
      ]);
    }
  }
  pts.push(WAYPOINTS[WAYPOINTS.length - 1]);
  const dist = [0];
  for (let i = 1; i < pts.length; i++) {
    dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = dist[dist.length - 1];
  const n = JOURNEY.length;
  let j = 0;
  return JOURNEY.map((_, i) => {
    const target = n === 1 ? total : (i * total) / (n - 1);
    while (j < dist.length - 2 && dist[j + 1] < target) j++;
    const f = (target - dist[j]) / (dist[j + 1] - dist[j] || 1);
    return [
      Math.round(pts[j][0] + f * (pts[j + 1][0] - pts[j][0])),
      Math.round(pts[j][1] + f * (pts[j + 1][1] - pts[j][1])),
    ];
  });
})();

const JOURNEY_KEY = "order-journey-v1";

export function loadJourney(): Set<string> {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function addToJourney(slug: string): Set<string> {
  const found = loadJourney().add(slug);
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify([...found]));
  } catch {
    /* ignore */
  }
  return found;
}
