import { useEffect } from "react";
import { useSettings } from "@/lib/i18n";

// The game is played upright. Phones and tablets held sideways get this
// screen asking to turn them (shown by CSS, see .rotate-hint), and where
// the browser allows it the screen is locked upright on the first touch.
export function RotateHint() {
  const { t } = useSettings();

  useEffect(() => {
    const lock = () => {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      orientation?.lock?.("portrait").catch(() => {
        /* only installed apps and full screen may lock */
      });
    };
    window.addEventListener("pointerdown", lock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", lock);
    };
  }, []);

  return (
    <div className="rotate-hint fixed inset-0 z-[300] place-items-center bg-[#fce8c8] p-8 text-center">
      <div className="flex flex-col items-center gap-5">
        <svg viewBox="0 0 64 64" className="rotate-hint-phone h-24 w-24" aria-hidden>
          <rect
            x="18"
            y="6"
            width="28"
            height="52"
            rx="6"
            fill="#fff8ec"
            stroke="#b9772f"
            strokeWidth="4"
          />
          <circle cx="32" cy="50" r="2.5" fill="#b9772f" />
        </svg>
        <p className="font-display text-2xl text-[oklch(0.35_0.07_50)]">{t("rotate.title")}</p>
      </div>
    </div>
  );
}
