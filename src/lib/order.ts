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
