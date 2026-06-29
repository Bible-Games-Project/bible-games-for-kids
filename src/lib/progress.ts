const KEY = "jesus-puzzles-progress-v1";

export interface PuzzleResult {
  stars: number; // 0-3, 0 means not completed
  bestTimeSec?: number;
}

export type Progress = Record<string, PuzzleResult>;

export const loadProgress = (): Progress => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};

export const saveResult = (id: string, stars: number, timeSec: number): Progress => {
  const p = loadProgress();
  const prev = p[id];
  const bestTime = prev?.bestTimeSec ? Math.min(prev.bestTimeSec, timeSec) : timeSec;
  const bestStars = Math.max(prev?.stars ?? 0, stars);
  p[id] = { stars: bestStars, bestTimeSec: bestTime };
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
};

export const isUnlocked = (index: number, ids: string[], progress: Progress): boolean => {
  if (index === 0) return true;
  const prev = ids[index - 1];
  return (progress[prev]?.stars ?? 0) > 0;
};

export const computeStars = (pieces: number, hintsUsed: number, timeSec: number): number => {
  const perPiece = timeSec / pieces;
  if (hintsUsed === 0 && perPiece <= 4) return 3;
  if (hintsUsed <= 1 && perPiece <= 7) return 2;
  return 1;
};
