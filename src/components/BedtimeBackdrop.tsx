// Full-screen painting behind a .theme-bedtime screen. Fixed to the viewport
// so long, scrolling lists don't stretch the painting into a blurry zoom.
// A cream fade at the top keeps titles readable over the artwork.
export function BedtimeBackdrop({
  image,
  position = "center",
  fadeEnd = 40,
}: {
  image: string;
  position?: string;
  // Percentage of the screen height where the top fade disappears.
  fadeEnd?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.975 0.025 85 / 0.88) 0%, oklch(0.975 0.025 85 / 0.5) ${fadeEnd / 2}%, oklch(0.975 0.025 85 / 0) ${fadeEnd}%), url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: position,
      }}
    />
  );
}
