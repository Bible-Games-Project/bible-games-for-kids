import { useEffect, useState } from "react";

// Screen-size helpers so games can use the whole screen on a computer or a
// tablet held sideways, while phones keep their portrait layouts.

// True on screens wide enough to put a game's controls beside its board
// (computers, landscape tablets). Phones and portrait tablets get false.
export function useWideScreen(minWidth = 900) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px) and (min-aspect-ratio: 1/1)`);
    const update = () => setWide(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [minWidth]);
  return wide;
}

// The size inside an element's padding, kept up to date as the window changes. Pass the
// returned ref callback to the element (it may appear later than the first
// render, e.g. only in the wide layout).
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!el) return;
    const update = () => {
      // The room inside the padding.
      const cs = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const height = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      setSize((s) =>
        Math.abs(s.width - width) < 1 && Math.abs(s.height - height) < 1 ? s : { width, height },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size] as const;
}

// The number of columns that makes `count` cards (height = ratio × width)
// as big as possible while all of them fit in width × height.
export function fitGrid(count: number, width: number, height: number, ratio: number, gap: number) {
  let best = { cols: 1, cell: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const byWidth = (width - gap * (cols - 1)) / cols;
    const byHeight = (height - gap * (rows - 1)) / rows / ratio;
    const cell = Math.floor(Math.min(byWidth, byHeight));
    if (cell > best.cell) best = { cols, cell };
  }
  return best;
}
