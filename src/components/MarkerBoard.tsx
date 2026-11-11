import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  MARKER_H as H,
  MARKER_W as W,
  loadStrokes,
  saveStrokes,
  type ColoringPage,
  type MarkerStroke,
} from "@/lib/coloring";
import { BackButton, ResultCard, ScreenFade } from "@/components/GameShell";
import { UndoIcon } from "@/components/Icons";

// Marker coloring: free painting with a finger over a coloring-book drawing.
// The drawing is split into its closed shapes, and every stroke is clipped to
// the shape where it started, so even on a small phone screen the color never
// runs over the lines. Two fingers zoom and move the page.

const COLORS = [
  "#e63b3b",
  "#f5862e",
  "#fbd643",
  "#9bd24f",
  "#2f9e4f",
  "#86c9f0",
  "#2f6fd6",
  "#8e5cc8",
  "#f59cc3",
  "#ffffff",
  "#f6e7c6",
  "#f2c6a0",
  "#d6a06c",
  "#9a5b32",
  "#5b3a24",
  "#a3262c",
  "#9aa0a6",
  "#2b2b2b",
];
const SIZES = [12, 26, 52]; // brush widths in drawing pixels
const MAX_ZOOM = 4;

// Each pixel's shape: the white areas between the lines are numbered, tiny
// specks are dropped, and every line pixel joins its nearest shape so a
// shape's color reaches under its outline.
interface Shapes {
  owner: Int32Array;
  box: Int32Array; // per shape: x0, y0, x1, y1
}

function loadShapes(src: string): Promise<Shapes> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, W, H);
      const a = ctx.getImageData(0, 0, W, H).data;
      const n = W * H;
      const line = new Uint8Array(n);
      for (let i = 0; i < n; i++) line[i] = a[i * 4 + 3] > 110 ? 1 : 0;
      const owner = new Int32Array(n);
      const queue = new Int32Array(n);
      let next = 1;
      for (let start = 0; start < n; start++) {
        if (line[start] || owner[start]) continue;
        let head = 0;
        let tail = 0;
        queue[tail++] = start;
        owner[start] = next;
        while (head < tail) {
          const i = queue[head++];
          const x = i % W;
          if (x > 0 && !line[i - 1] && !owner[i - 1]) (owner[i - 1] = next), (queue[tail++] = i - 1);
          if (x < W - 1 && !line[i + 1] && !owner[i + 1]) (owner[i + 1] = next), (queue[tail++] = i + 1);
          if (i >= W && !line[i - W] && !owner[i - W]) (owner[i - W] = next), (queue[tail++] = i - W);
          if (i < n - W && !line[i + W] && !owner[i + W]) (owner[i + W] = next), (queue[tail++] = i + W);
        }
        if (tail < 80) {
          // A speck: treat it as part of the line around it.
          for (let k = 0; k < tail; k++) {
            owner[queue[k]] = -1;
            line[queue[k]] = 1;
          }
        } else next++;
      }
      // Grow the shapes into the lines, nearest shape first.
      let tail = 0;
      for (let i = 0; i < n; i++) {
        if (owner[i] === -1) owner[i] = 0;
        if (owner[i]) queue[tail++] = i;
      }
      for (let head = 0; head < tail; head++) {
        const i = queue[head];
        const o = owner[i];
        const x = i % W;
        if (x > 0 && !owner[i - 1]) (owner[i - 1] = o), (queue[tail++] = i - 1);
        if (x < W - 1 && !owner[i + 1]) (owner[i + 1] = o), (queue[tail++] = i + 1);
        if (i >= W && !owner[i - W]) (owner[i - W] = o), (queue[tail++] = i - W);
        if (i < n - W && !owner[i + W]) (owner[i + W] = o), (queue[tail++] = i + W);
      }
      const box = new Int32Array(next * 4);
      for (let s = 0; s < next; s++) {
        box[s * 4] = W;
        box[s * 4 + 1] = H;
        box[s * 4 + 2] = -1;
        box[s * 4 + 3] = -1;
      }
      for (let i = 0; i < n; i++) {
        const s = owner[i] * 4;
        const x = i % W;
        const y = (i - x) / W;
        if (x < box[s]) box[s] = x;
        if (y < box[s + 1]) box[s + 1] = y;
        if (x > box[s + 2]) box[s + 2] = x;
        if (y > box[s + 3]) box[s + 3] = y;
      }
      resolve({ owner, box });
    };
    img.onerror = reject;
    img.src = src;
  });
}

type View = { s: number; tx: number; ty: number };

export function MarkerBoard({
  page,
  lines,
  level,
  onExit,
}: {
  page: ColoringPage;
  lines: string;
  level: DifficultyId;
  onExit: () => void;
}) {
  const { lang } = useSettings();
  const audio = useAudio();
  const ct = (k: string) => gameText(lang, k);
  const slug = page.story.slug;

  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const liveRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const masks = useRef(new Map<number, HTMLCanvasElement>());
  const strokes = useRef<MarkerStroke[]>(loadStrokes(slug, level));
  const drawing = useRef<{ stroke: MarkerStroke & { t: "b" }; shape: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; mx: number; my: number; view: View } | null>(null);
  const waitAllUp = useRef(false);

  const [shapes, setShapes] = useState<Shapes | null>(null);
  const [count, setCount] = useState(strokes.current.length);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(1);
  const [fill, setFill] = useState(false);
  const [view, setView] = useState<View>({ s: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [peek, setPeek] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadShapes(lines).then((s) => {
      if (!cancelled) setShapes(s);
    });
    return () => {
      cancelled = true;
    };
  }, [lines]);

  // A shape's mask: opaque where the shape is, over the shape's box.
  const maskOf = (shape: number) => {
    const cached = masks.current.get(shape);
    if (cached || !shapes) return cached;
    const b = shapes.box;
    const x0 = b[shape * 4];
    const y0 = b[shape * 4 + 1];
    const w = b[shape * 4 + 2] - x0 + 1;
    const h = b[shape * 4 + 3] - y0 + 1;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (shapes.owner[(y + y0) * W + x + x0] === shape) img.data[(y * w + x) * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (masks.current.size > 40) masks.current.clear();
    masks.current.set(shape, c);
    return c;
  };

  const scratchCtx = () => {
    if (!scratch.current) {
      scratch.current = document.createElement("canvas");
      scratch.current.width = W;
      scratch.current.height = H;
    }
    return scratch.current.getContext("2d")!;
  };

  const shapeAt = (x: number, y: number) =>
    shapes ? shapes.owner[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))] : 0;

  // Shows what is on the scratch canvas, cut to the shape, on `target`.
  const clipTo = (target: CanvasRenderingContext2D, shape: number) => {
    const mask = maskOf(shape);
    if (!shapes || !mask || !scratch.current) return;
    const b = shapes.box;
    const x0 = b[shape * 4];
    const y0 = b[shape * 4 + 1];
    const w = mask.width;
    const h = mask.height;
    const live = liveRef.current!.getContext("2d")!;
    live.clearRect(x0, y0, w, h);
    live.save();
    live.beginPath();
    live.rect(x0, y0, w, h);
    live.clip();
    live.drawImage(scratch.current, 0, 0);
    live.globalCompositeOperation = "destination-in";
    live.drawImage(mask, x0, y0);
    live.restore();
    if (target !== live) {
      target.drawImage(liveRef.current!, x0, y0, w, h, x0, y0, w, h);
      live.clearRect(x0, y0, w, h);
    }
  };

  const brush = (ctx: CanvasRenderingContext2D, s: MarkerStroke & { t: "b" }, from: number) => {
    ctx.strokeStyle = s.c;
    ctx.fillStyle = s.c;
    ctx.lineWidth = s.s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = s.p;
    if (from === 0) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], s.s / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.length < 4) return;
    ctx.beginPath();
    ctx.moveTo(p[Math.max(0, from - 2)], p[Math.max(1, from - 1)]);
    for (let k = Math.max(2, from); k < p.length; k += 2) ctx.lineTo(p[k], p[k + 1]);
    ctx.stroke();
  };

  // Paints one finished stroke or fill onto the page.
  const apply = (s: MarkerStroke) => {
    const paint = paintRef.current?.getContext("2d");
    if (!paint || !shapes) return;
    const shape = s.t === "b" ? shapeAt(s.p[0], s.p[1]) : shapeAt(s.x, s.y);
    if (!shape) return;
    const sc = scratchCtx();
    sc.clearRect(0, 0, W, H);
    if (s.t === "b") brush(sc, s, 0);
    else {
      sc.fillStyle = s.c;
      sc.fillRect(0, 0, W, H);
    }
    clipTo(paint, shape);
    sc.clearRect(0, 0, W, H);
  };

  const redraw = () => {
    paintRef.current?.getContext("2d")!.clearRect(0, 0, W, H);
    for (const s of strokes.current) apply(s);
  };

  // Once the shapes are known, the saved painting is put back.
  useEffect(() => {
    if (shapes) redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes]);

  const commit = (s: MarkerStroke) => {
    strokes.current = [...strokes.current, s];
    setCount(strokes.current.length);
    saveStrokes(slug, level, strokes.current);
  };

  const toPage = (clientX: number, clientY: number) => {
    const r = sheetRef.current!.getBoundingClientRect();
    return [
      Math.round(((clientX - r.left) / r.width) * W),
      Math.round(((clientY - r.top) / r.height) * H),
    ];
  };

  const frameSize = () => {
    const r = frameRef.current!.getBoundingClientRect();
    return { r, w: r.width, h: r.height };
  };

  const clampView = (v: View): View => {
    const { w, h } = frameSize();
    const s = Math.min(MAX_ZOOM, Math.max(1, v.s));
    return {
      s,
      tx: Math.min(0, Math.max(w - w * s, v.tx)),
      ty: Math.min(0, Math.max(h - h * s, v.ty)),
    };
  };

  const cancelStroke = () => {
    if (!drawing.current) return;
    const { shape } = drawing.current;
    drawing.current = null;
    scratchCtx().clearRect(0, 0, W, H);
    const live = liveRef.current?.getContext("2d");
    if (live && shapes) {
      const b = shapes.box;
      live.clearRect(b[shape * 4], b[shape * 4 + 1], W, H);
    }
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!shapes || peek || done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // Second finger: no painting, zoom and move instead.
      cancelStroke();
      waitAllUp.current = true;
      const [a, b] = [...pointers.current.values()];
      const { r } = frameSize();
      pinch.current = {
        d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mx: (a.x + b.x) / 2 - r.left,
        my: (a.y + b.y) / 2 - r.top,
        view: viewRef.current,
      };
      return;
    }
    if (pointers.current.size > 2 || waitAllUp.current) return;
    const [x, y] = toPage(e.clientX, e.clientY);
    const shape = shapeAt(x, y);
    if (!shape) return;
    if (fill) {
      const s: MarkerStroke = { t: "f", c: color, x, y };
      apply(s);
      commit(s);
      audio.playClick();
      return;
    }
    const s = { t: "b" as const, c: color, s: SIZES[size], p: [x, y] };
    drawing.current = { stroke: s, shape };
    const sc = scratchCtx();
    sc.clearRect(0, 0, W, H);
    brush(sc, s, 0);
    clipTo(liveRef.current!.getContext("2d")!, shape);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const { r } = frameSize();
      const p = pinch.current;
      const s = Math.min(MAX_ZOOM, Math.max(1, (p.view.s * Math.hypot(a.x - b.x, a.y - b.y)) / p.d));
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      // Keep the point that was under the fingers under the fingers.
      const px = (p.mx - p.view.tx) / p.view.s;
      const py = (p.my - p.view.ty) / p.view.s;
      setView(clampView({ s, tx: mx - px * s, ty: my - py * s }));
      return;
    }
    const d = drawing.current;
    if (!d) return;
    const [x, y] = toPage(e.clientX, e.clientY);
    const p = d.stroke.p;
    if (Math.abs(x - p[p.length - 2]) + Math.abs(y - p[p.length - 1]) < 2) return;
    p.push(x, y);
    brush(scratchCtx(), d.stroke, p.length - 2);
    clipTo(liveRef.current!.getContext("2d")!, d.shape);
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) waitAllUp.current = false;
    const d = drawing.current;
    if (!d) return;
    drawing.current = null;
    clipTo(paintRef.current!.getContext("2d")!, d.shape);
    scratchCtx().clearRect(0, 0, W, H);
    commit(d.stroke);
  };

  const undo = () => {
    if (!strokes.current.length) return;
    strokes.current = strokes.current.slice(0, -1);
    setCount(strokes.current.length);
    saveStrokes(slug, level, strokes.current);
    redraw();
  };

  const clearAll = () => {
    strokes.current = [];
    setCount(0);
    saveStrokes(slug, level, []);
    redraw();
  };

  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    setConfirmClear(false);
    clearAll();
  };

  const toggleZoom = () => {
    const { w, h } = frameSize();
    setView(view.s > 1 ? { s: 1, tx: 0, ty: 0 } : { s: 2.5, tx: (w - w * 2.5) / 2, ty: (h - h * 2.5) / 2 });
  };

  const finish = () => {
    audio.playWin();
    setDone(true);
  };

  const tool =
    "grid h-10 w-10 place-items-center rounded-full bg-card text-base shadow-sm transition active:scale-90 disabled:opacity-40";

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <ScreenFade />
      <div className="mx-auto flex w-full max-w-md flex-col px-3 py-3">
        <header className="flex items-center gap-2 pb-2">
          <BackButton onClick={onExit} label={ct("color.back")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {localizeSceneTitle(slug, lang)}
          </h1>
          <button onClick={undo} disabled={!count} aria-label={ct("color.undo")} className={tool}>
            <UndoIcon />
          </button>
          <button
            onClick={toggleZoom}
            aria-label={ct("color.zoom")}
            aria-pressed={view.s > 1}
            className={`${tool} ${view.s > 1 ? "ring-2 ring-[var(--color-primary)]" : ""}`}
          >
            🔍
          </button>
          <button
            onClick={() => setPeek((p) => !p)}
            aria-label={ct("color.peek")}
            aria-pressed={peek}
            className={`${tool} ${peek ? "ring-2 ring-[var(--color-primary)]" : ""}`}
          >
            👁️
          </button>
          <button
            onClick={clear}
            aria-label={ct("color.clear")}
            className={`${tool} ${confirmClear ? "w-auto px-3 text-sm font-semibold ring-2 ring-[oklch(0.62_0.18_25)]" : ""}`}
          >
            {confirmClear ? `🗑️ ${ct("color.clear")}?` : "🗑️"}
          </button>
        </header>

        {/* The page keeps its shape and shrinks on short screens so the
            colors below always fit. */}
        <div
          className="paint-box paint-tall mx-auto w-full p-3"
          style={{ maxWidth: `calc((100dvh - 17rem) * ${W / H} + 1.5rem)` }}
        >
          <div
            ref={frameRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative w-full touch-none select-none overflow-hidden rounded-2xl bg-white"
            style={{ aspectRatio: `${W} / ${H}`, cursor: fill ? "cell" : "crosshair" }}
          >
            <div
              ref={sheetRef}
              className="absolute inset-0 origin-top-left"
              style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` }}
            >
              <canvas ref={paintRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
              <canvas ref={liveRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
              <img
                src={lines}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
              />
            </div>
            {peek && (
              <img
                src={page.story.image}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover animate-in fade-in"
              />
            )}
            {!shapes && <span className="absolute inset-0 grid place-items-center text-3xl">🎨</span>}
          </div>
        </div>

        {/* Brush sizes, the fill bucket and "I'm done". */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {SIZES.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                setSize(i);
                setFill(false);
              }}
              aria-label={`${ct("color.brush")} ${i + 1}`}
              aria-pressed={!fill && size === i}
              className={`grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm transition active:scale-90 ${
                !fill && size === i ? "ring-[3px] ring-[oklch(0.3_0.07_45)]" : ""
              }`}
            >
              <span
                className="rounded-full border border-black/15"
                style={{ width: 6 + i * 8, height: 6 + i * 8, backgroundColor: color }}
              />
            </button>
          ))}
          <button
            onClick={() => setFill(true)}
            aria-label={ct("color.fill")}
            aria-pressed={fill}
            className={`grid h-11 w-11 place-items-center rounded-full bg-card text-xl shadow-sm transition active:scale-90 ${
              fill ? "ring-[3px] ring-[oklch(0.3_0.07_45)]" : ""
            }`}
          >
            🪣
          </button>
          <button
            onClick={finish}
            disabled={!count}
            className="ml-1 h-11 rounded-full bg-[var(--color-primary)] px-4 font-display text-base font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            {ct("color.finish")}
          </button>
        </div>

        <div className="mx-auto mt-2 grid w-full max-w-sm grid-cols-9 gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={`aspect-square w-full rounded-full border-2 border-white shadow-sm transition active:scale-90 ${
                color === c ? "scale-110 ring-[3px] ring-[oklch(0.3_0.07_45)]" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <p className="pt-2 text-center text-xs text-muted-foreground">{ct("color.markerHint")}</p>
      </div>

      {done && (
        <ResultCard
          top="🎨"
          title={ct("color.done")}
          replayLabel={ct("color.clear")}
          onReplay={() => {
            clearAll();
            setDone(false);
          }}
          backLabel={ct("color.back")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
