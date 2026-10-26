import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import {
  COLORING_PAGES,
  MAP_H,
  MAP_W,
  PALETTE,
  hasFills,
  loadFills,
  saveFills,
  type ColoringPage,
  type Fills,
} from "@/lib/coloring";
import { useBackButton } from "@/lib/back-button";
import { BackButton, MenuScreen } from "@/components/GameShell";

import homeBg from "@/assets/home-bedtime.webp";

const MAGIC = "magic";

export function ColoringGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [page, setPage] = useState<ColoringPage | null>(null);
  const ct = (k: string) => gameText(lang, k);

  useBackButton(page !== null, () => setPage(null));

  if (page) {
    return <ColoringBoard key={page.story.slug} page={page} onExit={() => setPage(null)} />;
  }

  return (
    <MenuScreen title={ct("color.choose")} background={homeBg} onBack={onBack} backLabel={t("select.back")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COLORING_PAGES.map((p) => (
          <button
            key={p.story.slug}
            onClick={() => {
              window.scrollTo(0, 0);
              setPage(p);
            }}
            className="glass-card flex flex-col overflow-hidden p-2 text-left transition active:scale-[0.98]"
          >
            <span className="relative aspect-[7/9] w-full overflow-hidden rounded-xl bg-white">
              <img src={p.lines} alt="" loading="lazy" className="h-full w-full" />
              {hasFills(p.story.slug) && (
                <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-card text-sm shadow" aria-hidden>
                  🎨
                </span>
              )}
            </span>
            <span className="line-clamp-2 px-1 pt-1.5 text-center text-xs font-semibold leading-tight">
              {localizeSceneTitle(p.story.slug, lang)}
            </span>
          </button>
        ))}
      </div>
    </MenuScreen>
  );
}

// Loads an image's pixels at the area-map size.
function pixelsOf(src: string): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = MAP_W;
      c.height = MAP_H;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, MAP_W, MAP_H);
      resolve(ctx.getImageData(0, 0, MAP_W, MAP_H).data);
    };
    img.onerror = reject;
    img.src = src;
  });
}

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function ColoringBoard({ page, onExit }: { page: ColoringPage; onExit: () => void }) {
  const { lang } = useSettings();
  const audio = useAudio();
  const ct = (k: string) => gameText(lang, k);
  const slug = page.story.slug;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ids = useRef<Uint16Array | null>(null);
  const magic = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const [fills, setFills] = useState<Fills>(() => loadFills(slug));
  const [history, setHistory] = useState<{ id: number; prev?: string }[]>([]);
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [peek, setPeek] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Read the area map and the painting's average color in each area.
  useEffect(() => {
    let cancelled = false;
    Promise.all([pixelsOf(page.regions), pixelsOf(page.story.image)]).then(([map, paint]) => {
      if (cancelled) return;
      const n = MAP_W * MAP_H;
      const idArr = new Uint16Array(n);
      let max = 0;
      for (let i = 0; i < n; i++) {
        const id = map[i * 4] + map[i * 4 + 1] * 256;
        idArr[i] = id;
        if (id > max) max = id;
      }
      const sums = new Float64Array((max + 1) * 4);
      for (let i = 0; i < n; i++) {
        const k = idArr[i] * 4;
        sums[k] += paint[i * 4];
        sums[k + 1] += paint[i * 4 + 1];
        sums[k + 2] += paint[i * 4 + 2];
        sums[k + 3] += 1;
      }
      const avg: string[] = [];
      for (let id = 0; id <= max; id++) {
        const c = sums[id * 4 + 3] || 1;
        avg[id] = hex(sums[id * 4] / c, sums[id * 4 + 1] / c, sums[id * 4 + 2] / c);
      }
      ids.current = idArr;
      magic.current = avg;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Paint every area in its chosen color (white if none yet).
  useEffect(() => {
    const canvas = canvasRef.current;
    const idArr = ids.current;
    if (!ready || !canvas || !idArr) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(MAP_W, MAP_H);
    const lut = new Map<number, [number, number, number]>();
    for (const [id, c] of Object.entries(fills)) {
      lut.set(Number(id), [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
    }
    const d = img.data;
    for (let i = 0; i < idArr.length; i++) {
      const rgb = lut.get(idArr[i]);
      d[i * 4] = rgb ? rgb[0] : 255;
      d[i * 4 + 1] = rgb ? rgb[1] : 255;
      d[i * 4 + 2] = rgb ? rgb[2] : 255;
      d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    saveFills(slug, fills);
  }, [fills, ready, slug]);

  const fillAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const idArr = ids.current;
    if (!idArr || peek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * MAP_W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * MAP_H);
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    const id = idArr[y * MAP_W + x];
    if (!id) return;
    const next = color === MAGIC ? magic.current[id] : color;
    if (fills[id] === next) return;
    setHistory((h) => [...h, { id, prev: fills[id] }]);
    setFills((f) => ({ ...f, [id]: next }));
    audio.playClick();
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setFills((f) => {
      const copy = { ...f };
      if (last.prev) copy[last.id] = last.prev;
      else delete copy[last.id];
      return copy;
    });
  };

  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    setConfirmClear(false);
    setHistory([]);
    setFills({});
  };

  const tool = "grid h-11 w-11 place-items-center rounded-full bg-card text-lg shadow-sm transition active:scale-90 disabled:opacity-40";

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-3">
          <BackButton onClick={onExit} label={ct("color.back")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">{localizeSceneTitle(slug, lang)}</h1>
          <button onClick={undo} disabled={!history.length} aria-label={ct("color.undo")} className={tool}>
            ↶
          </button>
          <button
            onClick={clear}
            aria-label={ct("color.clear")}
            className={`${tool} ${confirmClear ? "w-auto px-3 text-sm font-semibold ring-2 ring-[oklch(0.62_0.18_25)]" : ""}`}
          >
            {confirmClear ? `🗑️ ${ct("color.clear")}?` : "🗑️"}
          </button>
          <button
            onClick={() => setPeek((p) => !p)}
            aria-label={ct("color.peek")}
            aria-pressed={peek}
            className={`${tool} ${peek ? "ring-2 ring-[var(--color-primary)]" : ""}`}
          >
            👁️
          </button>
        </header>

        <div
          onPointerDown={fillAt}
          className="relative w-full cursor-pointer touch-manipulation overflow-hidden rounded-3xl bg-white shadow-lg"
          style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
        >
          <canvas ref={canvasRef} width={MAP_W} height={MAP_H} className="absolute inset-0 h-full w-full" />
          <img src={page.lines} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
          {peek && (
            <img
              src={page.story.image}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none animate-in fade-in"
            />
          )}
          {!ready && <span className="absolute inset-0 grid place-items-center text-3xl">🎨</span>}
        </div>

        {/* Palette */}
        <div className="mt-4 grid grid-cols-7 gap-2 pb-2">
          <button
            onClick={() => setColor(MAGIC)}
            aria-label={ct("color.magic")}
            aria-pressed={color === MAGIC}
            className={`col-span-2 flex h-11 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#f06292] via-[#fdd835] to-[#81d4fa] text-sm font-bold text-[oklch(0.31_0.08_262)] shadow-sm transition active:scale-95 ${
              color === MAGIC ? "ring-4 ring-[oklch(0.31_0.08_262)] ring-offset-2" : ""
            }`}
          >
            ✨ {ct("color.magic")}
          </button>
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={`aspect-square w-full rounded-full border-2 border-white shadow-sm transition active:scale-90 ${
                color === c ? "scale-110 ring-4 ring-[oklch(0.31_0.08_262)]" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
