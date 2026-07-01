// Freemium structure: first N puzzles per difficulty are free.
// Everything beyond requires Premium.
export const FREE_PER_DIFFICULTY = 3;

export const isFreePuzzle = (indexInDifficulty: number): boolean =>
  indexInDifficulty < FREE_PER_DIFFICULTY;

