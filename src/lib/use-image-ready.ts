import { useEffect, useState } from "react";

// True once `src` has loaded (or failed), so a picture can fade in instead of
// popping up half-drawn. Already-cached images are ready on the first render.
export function useImageReady(src: string): boolean {
  const [ready, setReady] = useState(() => {
    if (typeof Image === "undefined") return false;
    const img = new Image();
    img.src = src;
    return img.complete;
  });

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = img.onerror = () => {
      if (alive) setReady(true);
    };
    img.src = src;
    if (img.complete) setReady(true);
    return () => {
      alive = false;
    };
  }, [src]);

  return ready;
}
