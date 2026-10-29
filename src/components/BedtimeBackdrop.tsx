import { useImageReady } from "@/lib/use-image-ready";

// Full-screen painting behind a .theme-bedtime screen. Fixed to the viewport
// so long, scrolling lists don't stretch the painting into a blurry zoom.
// A cream fade at the top keeps titles readable over the artwork.
export function BedtimeBackdrop({
  image,
  position = "center",
  fadeEnd = 40,
  blur = false,
}: {
  image: string;
  position?: string;
  // Percentage of the screen height where the top fade disappears; 0 turns
  // the fade off.
  fadeEnd?: number;
  // Soft-focus the painting, for screens that draw their own artwork on top.
  blur?: boolean;
}) {
  const fade =
    fadeEnd > 0
      ? `linear-gradient(180deg, oklch(0.975 0.025 85 / 0.88) 0%, oklch(0.975 0.025 85 / 0.5) ${fadeEnd / 2}%, oklch(0.975 0.025 85 / 0) ${fadeEnd}%), `
      : "";

  const ready = useImageReady(image);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[oklch(0.95_0.03_70)]"
    >
      {/* Fades in once loaded rather than drawing in strips. */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${blur ? "scale-110 blur-md" : ""}`}
        style={{
          backgroundImage: `${fade}url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: position,
          opacity: ready ? 1 : 0,
        }}
      />
    </div>
  );
}
