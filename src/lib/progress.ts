import type { Puzzle } from "./puzzles";

const PROGRESS_KEY = "jesus-puzzles-progress-v2";
const SESSION_KEY = "jesus-puzzles-sessions-v1";

// ---------- Completion + stars ----------

export interface PuzzleResult {
  stars: number; // 1-3 once completed; absent entry = not completed
  bestTimeSec?: number;
}

export type Progress = Record<string, PuzzleResult>;

const readJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
};

export const loadProgress = (): Progress => readJSON<Progress>(PROGRESS_KEY, {});

export const saveResult = (id: string, stars: number, timeSec: number): Progress => {
  const p = loadProgress();
  // 0 stars = not completed, don't record, don't unlock next.
  if (stars <= 0) return p;
  const prev = p[id];
  const bestTime = prev?.bestTimeSec ? Math.min(prev.bestTimeSec, timeSec) : timeSec;
  const bestStars = Math.max(prev?.stars ?? 0, stars);
  p[id] = { stars: bestStars, bestTimeSec: bestTime };
  writeJSON(PROGRESS_KEY, p);
  return p;
};

export const isCompleted = (id: string, progress: Progress): boolean =>
  (progress[id]?.stars ?? 0) > 0;

/**
 * Unlock rule (per-difficulty, scalable to any number of puzzles):
 * - First puzzle of a difficulty is always unlocked.
 * - Each subsequent puzzle unlocks when the previous one in the SAME
 *   difficulty has been completed with at least 1 star.
 * Difficulties themselves are all independent and always selectable.
 */
export const isPuzzleUnlocked = (
  puzzlesInDifficulty: Puzzle[],
  index: number,
  progress: Progress,
): boolean => {
  if (index <= 0) return true;
  const prev = puzzlesInDifficulty[index - 1];
  return prev ? isCompleted(prev.id, progress) : false;
};

export const computeStars = (pieces: number, hintsUsed: number, timeSec: number): number => {
  const perPiece = timeSec / Math.max(pieces, 1);
  if (hintsUsed === 0 && perPiece <= 4) return 3;
  if (hintsUsed <= 1 && perPiece <= 7) return 2;
  return 1;
};

// ---------- Resume sessions ----------

export interface SavedSession {
  placedIds: number[];
  elapsedSec: number;
  hintsUsed: number;
  seed: number;
  savedAt: number;
}

type Sessions = Record<string, SavedSession>;

const loadSessions = (): Sessions => readJSON<Sessions>(SESSION_KEY, {});

export const getSession = (puzzleId: string): SavedSession | null =>
  loadSessions()[puzzleId] ?? null;

export const saveSession = (puzzleId: string, session: SavedSession) => {
  const all = loadSessions();
  all[puzzleId] = session;
  writeJSON(SESSION_KEY, all);
};

export const clearSession = (puzzleId: string) => {
  const all = loadSessions();
  if (puzzleId in all) {
    delete all[puzzleId];
    writeJSON(SESSION_KEY, all);
  }
};

export const hasSession = (puzzleId: string): boolean => puzzleId in loadSessions();
