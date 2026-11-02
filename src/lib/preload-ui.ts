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
