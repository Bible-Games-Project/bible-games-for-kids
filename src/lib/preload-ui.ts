// The small pictures every screen uses (the painted boxes and buttons, the
// card back, the pawns), fetched and decoded once, so a box never shows up
// empty while its picture is still on the way.
const ART = import.meta.glob<string>(["../assets/ui/*.webp", "../assets/tokens/pawn-*.webp"], {
  eager: true,
  import: "default",
});

let ready: Promise<void> | null = null;

export function preloadUi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ready ??= Promise.all(
    Object.values(ART).map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    }),
  ).then(() => undefined);
  return ready;
}

// Resolves when `src` has loaded (or failed).
export function loaded(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    if (img.complete) resolve();
  });
}

// The games' backgrounds, boards, story thumbnails and pieces. Fetched
// quietly, a few at a time, while the home screen is open, so a game's
// pictures are already there when it opens.
const GAME_ART = import.meta.glob<string>(
  [
    "../assets/*-bg.webp",
    "../assets/order-map.webp",
    "../assets/chess-board.webp",
    "../assets/parchis-board.webp",
    "../assets/thumbs/*.webp",
    "../assets/chess/*.webp",
    "../assets/guesswho/*.webp",
  ],
  { eager: true, import: "default" },
);

let gamesStarted = false;

export function preloadGameArt() {
  if (typeof window === "undefined" || gamesStarted) return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  gamesStarted = true;
  const queue = Object.values(GAME_ART);
  const next = (): Promise<void> => {
    const src = queue.shift();
    if (!src) return Promise.resolve();
    const img = new Image();
    img.fetchPriority = "low";
    img.src = src;
    return img
      .decode()
      .catch(() => undefined)
      .then(next);
  };
  // after the home screen's own pictures, three at a time
  const start = () => void Promise.all([next(), next(), next()]);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(start, { timeout: 2500 });
  } else {
    setTimeout(start, 1200);
  }
}
