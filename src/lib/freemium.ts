// Freemium structure: first N puzzles per difficulty are free.
// Everything beyond requires Premium.
//
// ALL_FREE: the store launch (Nov 2026) is completely free. While this is
// true nothing is locked and the Premium screen can never be reached (the
// old "unlock" button granted Premium without a real purchase, which the
// App Store rejects). When paid packs arrive, wire real in-app purchases
// into `setPremium` and set this back to false.
export const ALL_FREE = true;

export const FREE_PER_DIFFICULTY = 3;

export const isFreePuzzle = (indexInDifficulty: number): boolean =>
  ALL_FREE || indexInDifficulty < FREE_PER_DIFFICULTY;
