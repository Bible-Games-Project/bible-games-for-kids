// Full-screen painting behind a .theme-bedtime screen. Fixed to the viewport
// so long, scrolling lists don't stretch the painting into a blurry zoom.
// A cream fade at the top keeps titles readable over the artwork.
export function BedtimeBackdrop({
  image,
  position = "center",
  fadeEnd = 40,
  keepWhole = false,
}: {
  image: string;
  position?: string;
  // Percentage of the screen height where the top fade disappears; 0 turns
  // the fade off (for paintings that carry their own title).
  fadeEnd?: number;
  // Never crop the painting's height on wide screens: show it full height
  // in the middle over a blurred copy that fills the sides. Phones still
  // fill the screen as with `cover`.
  keepWhole?: boolean;
}) {
  const fade =
    fadeEnd > 0
      ? `linear-gradient(180deg, oklch(0.975 0.025 85 / 0.88) 0%, oklch(0.975 0.025 85 / 0.5) ${fadeEnd / 2}%, oklch(0.975 0.025 85 / 0) ${fadeEnd}%), `
      : "";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[oklch(0.95_0.03_70)]"
    >
      {keepWhole && (
        <div
          className="absolute -inset-8 scale-110 blur-2xl"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `${fade}url(${image})`,
          backgroundSize: keepWhole ? "auto 100%" : "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: position,
        }}
      />
    </div>
  );
}
