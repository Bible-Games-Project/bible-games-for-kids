import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import {
  COLOR_COUNTS,
  COLORING_PAGES,
  MAP_H,
  MAP_W,
  hasFills,
  loadFills,
  saveFills,
  type ColoringPage,
  type Fills,
} from "@/lib/coloring";
import { useBackButton } from "@/lib/back-button";
import {
  BackButton,
  MenuScreen,
  ResultCard,
  StoryPicker,
  ScreenFade,
} from "@/components/GameShell";

import homeBg from "@/assets/home-bedtime.webp";

export function ColoringGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("coloring");
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId>("easy");
  const [page, setPage] = useState<ColoringPage | null>(null);
  const ct = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(page !== null, () => setPage(null));

  if (page) {
    return (
      <ColoringBoard
        key={`${level}:${page.story.slug}`}
        page={page}
        level={level}
        onExit={() => setPage(null)}
      />
    );
  }

  return (
    <MenuScreen
      title={ct("color.choose")}
      subtitle={ct("color.instruction")}
      background={homeBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <StoryPicker
        level={level}
        onLevel={setLevel}
        describe={(id) => ct("color.colorsCount", { n: COLOR_COUNTS[id] })}
        stories={COLORING_PAGES.map((p) => p.story)}
        picture={(story) => {
          const p = COLORING_PAGES.find((x) => x.story === story)!;
          return (
            <span className="absolute inset-0 bg-white">
              <img
                src={story.thumb}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <img src={p.lines} alt="" loading="lazy" className="absolute inset-0 h-full w-full" />
            </span>
          );
        }}
        badge={(story) =>
          hasFills(story.slug, level) ? (
            <span
              className="grid h-7 w-7 place-items-center rounded-full bg-card text-sm shadow"
              aria-hidden
            >
              🎨
            </span>
          ) : null
        }
        onPick={(story) => setPage(COLORING_PAGES.find((p) => p.story === story) ?? null)}
      />
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

const hex = (rgb: number[]) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

// Areas whose widest point is narrower than this (in map pixels) are too
// small to hold a number; they start already painted.
const MIN_LABEL_DIST = 5;

interface NumberedPage {
  ids: Uint16Array; // pixel -> outlined region
  areaOf: Int32Array; // region -> paintable area (neighbouring regions of one color)
  palette: string[]; // index = number - 1
  colorOf: Int16Array; // area id -> palette index (-1 = no area)
  labels: { id: number; x: number; y: number; size: number }[];
  tiny: number[]; // areas painted from the start
}

// Turns the area map plus the painting into a paint-by-number page: the
// painting's colors are grouped into a palette of `colors` (weighted k-means
// on each region's average color), touching regions that end up with the
// same number become one paintable area, and each area's number sits at its
// widest point (furthest from any outline).
function buildNumbers(
  map: Uint8ClampedArray,
  paint: Uint8ClampedArray,
  colors: number,
): NumberedPage {
  const n = MAP_W * MAP_H;
  const ids = new Uint16Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    const id = map[i * 4] + map[i * 4 + 1] * 256;
    ids[i] = id;
    if (id > max) max = id;
  }
  const area = new Float64Array(max + 1);
  const sum = new Float64Array((max + 1) * 3);
  for (let i = 0; i < n; i++) {
    const id = ids[i];
    area[id] += 1;
    sum[id * 3] += paint[i * 4];
    sum[id * 3 + 1] += paint[i * 4 + 1];
    sum[id * 3 + 2] += paint[i * 4 + 2];
  }
  const regions: number[] = [];
  const avg: number[][] = [];
  for (let id = 1; id <= max; id++) {
    if (!area[id]) continue;
    regions.push(id);
    avg[id] = [sum[id * 3] / area[id], sum[id * 3 + 1] / area[id], sum[id * 3 + 2] / area[id]];
  }
  const d2 = (a: number[], b: number[]) =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

  // Weighted k-means, seeded with the biggest area then the farthest colors.
  const k = Math.min(colors, regions.length);
  const biggest = regions.reduce((a, b) => (area[b] > area[a] ? b : a), regions[0]);
  let centres = [avg[biggest].slice()];
  while (centres.length < k) {
    let pick = regions[0];
    let far = -1;
    for (const id of regions) {
      const d = Math.min(...centres.map((c) => d2(avg[id], c))) * area[id];
      if (d > far) {
        far = d;
        pick = id;
      }
    }
    centres.push(avg[pick].slice());
  }
  const nearest = (c: number[]) => {
    let best = 0;
    for (let j = 1; j < centres.length; j++) if (d2(c, centres[j]) < d2(c, centres[best])) best = j;
    return best;
  };
  for (let iter = 0; iter < 10; iter++) {
    const acc = centres.map(() => [0, 0, 0, 0]);
    for (const id of regions) {
      const a = acc[nearest(avg[id])];
      a[0] += avg[id][0] * area[id];
      a[1] += avg[id][1] * area[id];
      a[2] += avg[id][2] * area[id];
      a[3] += area[id];
    }
    centres = centres.map((c, j) =>
      acc[j][3] ? [acc[j][0] / acc[j][3], acc[j][1] / acc[j][3], acc[j][2] / acc[j][3]] : c,
    );
  }
  // Number the colors from light to dark.
  const lum = (c: number[]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const order = centres.map((_, j) => j).sort((a, b) => lum(centres[b]) - lum(centres[a]));
  const rank = new Int16Array(centres.length);
  order.forEach((j, r) => (rank[j] = r));
  const palette = order.map((j) => hex(centres[j]));
  const regionColor = new Int16Array(max + 1).fill(-1);
  for (const id of regions) regionColor[id] = rank[nearest(avg[id])];

  // Merge touching regions of the same color; an area is named after its
  // lowest region id.
  const parent = new Int32Array(max + 1).map((_, i) => i);
  const find = (a: number): number => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  const join = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = y * MAP_W + x;
      const a = ids[i];
      if (x + 1 < MAP_W && ids[i + 1] !== a && regionColor[ids[i + 1]] === regionColor[a])
        join(a, ids[i + 1]);
      if (y + 1 < MAP_H && ids[i + MAP_W] !== a && regionColor[ids[i + MAP_W]] === regionColor[a])
        join(a, ids[i + MAP_W]);
    }
  }
  const areaOf = new Int32Array(max + 1);
  for (let id = 0; id <= max; id++) areaOf[id] = find(id);
  const colorOf = new Int16Array(max + 1).fill(-1);
  for (const id of regions) colorOf[areaOf[id]] = regionColor[id];

  // Distance from each pixel to the nearest outline (two-pass chamfer).
  const dist = new Float32Array(n);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = y * MAP_W + x;
      const id = ids[i];
      const edge =
        x === 0 ||
        y === 0 ||
        x === MAP_W - 1 ||
        y === MAP_H - 1 ||
        ids[i - 1] !== id ||
        ids[i + 1] !== id ||
        ids[i - MAP_W] !== id ||
        ids[i + MAP_W] !== id;
      dist[i] = edge ? 0 : 1e6;
    }
  }
  for (let y = 1; y < MAP_H; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      const i = y * MAP_W + x;
      dist[i] = Math.min(
        dist[i],
        dist[i - 1] + 1,
        dist[i - MAP_W] + 1,
        dist[i - MAP_W - 1] + 1.41,
        dist[i - MAP_W + 1] + 1.41,
      );
    }
  }
  for (let y = MAP_H - 2; y >= 0; y--) {
    for (let x = MAP_W - 2; x >= 1; x--) {
      const i = y * MAP_W + x;
      dist[i] = Math.min(
        dist[i],
        dist[i + 1] + 1,
        dist[i + MAP_W] + 1,
        dist[i + MAP_W + 1] + 1.41,
        dist[i + MAP_W - 1] + 1.41,
      );
    }
  }
  // Each area's number goes in the widest spot of its regions.
  const bestD = new Float32Array(max + 1);
  const bestI = new Int32Array(max + 1);
  for (let i = 0; i < n; i++) {
    const a = areaOf[ids[i]];
    if (dist[i] > bestD[a]) {
      bestD[a] = dist[i];
      bestI[a] = i;
    }
  }
  const labels: NumberedPage["labels"] = [];
  const tiny: number[] = [];
  for (const id of new Set(regions.map((r) => areaOf[r]))) {
    if (bestD[id] >= MIN_LABEL_DIST) {
      labels.push({
        id,
        x: bestI[id] % MAP_W,
        y: Math.floor(bestI[id] / MAP_W),
        size: Math.min(16, Math.max(6.5, bestD[id] * 1.2)),
      });
    } else tiny.push(id);
  }
  return { ids, areaOf, palette, colorOf, labels, tiny };
}

function ColoringBoard({
  page,
  level,
  onExit,
}: {
  page: ColoringPage;
  level: DifficultyId;
  onExit: () => void;
}) {
  const { lang } = useSettings();
  const audio = useAudio();
  const ct = (k: string) => gameText(lang, k);
  const slug = page.story.slug;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<NumberedPage | null>(null);
  const [fills, setFills] = useState<Fills>(() => loadFills(slug, level));
  const [history, setHistory] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [peek, setPeek] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  // Once the page is done, the finished painting fades in over it before
  // the well-done card.
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    return () => {
      window.clearTimeout(celebrateTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([pixelsOf(page.regions), pixelsOf(page.story.image)]).then(([map, paint]) => {
      if (!cancelled) setData(buildNumbers(map, paint, COLOR_COUNTS[level]));
    });
    return () => {
      cancelled = true;
    };
  }, [page, level]);

  // Tiny areas are painted from the start.
  const allFills = useMemo(() => {
    if (!data) return fills;
    const all: Fills = { ...fills };
    for (const id of data.tiny) all[id] = data.palette[data.colorOf[id]];
    return all;
  }, [data, fills]);

  const remaining = useMemo(() => {
    const left = new Array(data?.palette.length ?? 0).fill(0);
    if (data) for (const l of data.labels) if (!fills[l.id]) left[data.colorOf[l.id]] += 1;
    return left as number[];
  }, [data, fills]);

  // Painted areas in full color; unpainted areas of the chosen number lightly
  // tinted so they are easy to find; the rest let the painting show through.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!data || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(MAP_W, MAP_H);
    const d = img.data;
    const rgb = (c: string) => [
      parseInt(c.slice(1, 3), 16),
      parseInt(c.slice(3, 5), 16),
      parseInt(c.slice(5, 7), 16),
    ];
    const fillRgb = new Map<number, number[]>();
    for (const [id, c] of Object.entries(allFills)) fillRgb.set(Number(id), rgb(c));
    const hint = rgb(data.palette[selected] ?? "#ffffff");
    for (let i = 0; i < data.ids.length; i++) {
      const id = data.areaOf[data.ids[i]];
      const f = fillRgb.get(id);
      if (f) {
        d[i * 4] = f[0];
        d[i * 4 + 1] = f[1];
        d[i * 4 + 2] = f[2];
        d[i * 4 + 3] = 255;
      } else if (data.colorOf[id] === selected) {
        d[i * 4] = hint[0];
        d[i * 4 + 1] = hint[1];
        d[i * 4 + 2] = hint[2];
        d[i * 4 + 3] = 70;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [data, allFills, selected]);

  useEffect(() => {
    saveFills(slug, level, fills);
  }, [fills, slug, level]);

  const paintAt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!data || peek || finished) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * MAP_W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * MAP_H);
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    const id = data.areaOf[data.ids[y * MAP_W + x]];
    if (!id || allFills[id]) return;
    if (data.colorOf[id] !== selected) {
      // Wrong number: show which area it was, don't paint.
      audio.playIncorrect();
      setWrongId(id);
      window.setTimeout(() => setWrongId(null), 700);
      return;
    }
    const next = { ...fills, [id]: data.palette[selected] };
    setFills(next);
    setHistory((h) => [...h, id]);
    audio.playClick();
    if (data.labels.every((l) => next[l.id])) {
      window.setTimeout(() => {
        audio.playWin();
        setFinished(true);
      }, 400);
      celebrateTimer.current = window.setTimeout(() => setCelebrate(true), 2600);
    }
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (last === undefined) return;
    setHistory((h) => h.slice(0, -1));
    setFills((f) => {
      const copy = { ...f };
      delete copy[last];
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
    setFinished(false);
  };

  const tool =
    "grid h-10 w-10 place-items-center rounded-full bg-card text-base shadow-sm transition active:scale-90 disabled:opacity-40";
  const wrongLabel = wrongId !== null ? data?.labels.find((l) => l.id === wrongId) : undefined;

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <ScreenFade />
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-4">
        <header className="flex items-center gap-2 pb-3">
          <BackButton onClick={onExit} label={ct("color.back")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {localizeSceneTitle(slug, lang)}
          </h1>
          <button
            onClick={undo}
            disabled={!history.length}
            aria-label={ct("color.undo")}
            className={tool}
          >
            ↶
          </button>
          <button
            onClick={() => setZoom((z) => !z)}
            aria-label={ct("color.zoom")}
            aria-pressed={zoom}
            className={`${tool} ${zoom ? "ring-2 ring-[var(--color-primary)]" : ""}`}
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

        {/* Zoomed in, the page is twice as big and scrolls with a finger. */}
        <div className="paint-box paint-tall w-full p-4">
          <div
            className={`w-full rounded-2xl bg-white ${zoom ? "max-h-[62dvh] overflow-auto" : "overflow-hidden"}`}
          >
            <div
              onClick={paintAt}
              className="relative cursor-pointer"
              style={{ width: zoom ? "200%" : "100%", aspectRatio: `${MAP_W} / ${MAP_H}` }}
            >
              <canvas
                ref={canvasRef}
                width={MAP_W}
                height={MAP_H}
                className="absolute inset-0 h-full w-full"
              />
              <img
                src={page.lines}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
              />
              {data && (
                <svg
                  viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none"
                  aria-hidden
                >
                  {data.labels
                    .filter((l) => !fills[l.id])
                    .map((l) => {
                      const mine = data.colorOf[l.id] === selected;
                      return (
                        <text
                          key={l.id}
                          x={l.x}
                          y={l.y}
                          fontSize={l.size}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontWeight={mine ? 800 : 600}
                          fill={mine ? "oklch(0.3 0.08 262)" : "oklch(0.42 0.03 60)"}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {data.colorOf[l.id] + 1}
                        </text>
                      );
                    })}
                  {wrongLabel && (
                    <circle
                      cx={wrongLabel.x}
                      cy={wrongLabel.y}
                      r={wrongLabel.size}
                      fill="none"
                      stroke="oklch(0.62 0.18 25)"
                      strokeWidth={2}
                    />
                  )}
                </svg>
              )}
              {(peek || finished) && (
                <img
                  src={page.story.image}
                  alt=""
                  draggable={false}
                  className={`pointer-events-none absolute inset-0 h-full w-full select-none animate-in fade-in ${
                    finished ? "duration-[1800ms]" : ""
                  }`}
                />
              )}
              {!data && (
                <span className="absolute inset-0 grid place-items-center text-3xl">🎨</span>
              )}
            </div>
          </div>
        </div>

        <p className="pt-3 text-center text-sm text-muted-foreground">{ct("color.instruction")}</p>

        {/* Numbered palette: the color's number, and a check once all its areas are done */}
        {data && (
          <div
            className="mt-2 grid justify-center gap-2 pb-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(data.palette.length, 6)}, minmax(0, 3.5rem))`,
            }}
          >
            {data.palette.map((c, i) => {
              const done = remaining[i] === 0;
              const light =
                parseInt(c.slice(1, 3), 16) * 0.299 +
                  parseInt(c.slice(3, 5), 16) * 0.587 +
                  parseInt(c.slice(5, 7), 16) * 0.114 >
                150;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  aria-label={`${i + 1}`}
                  aria-pressed={selected === i}
                  className={`relative grid aspect-square w-full place-items-center rounded-full border-2 border-white text-base font-bold shadow-sm transition active:scale-90 ${
                    selected === i ? "scale-110 ring-4 ring-[oklch(0.31_0.08_262)]" : ""
                  }`}
                  style={{ backgroundColor: c, color: light ? "oklch(0.3 0.05 60)" : "white" }}
                >
                  {done ? "✓" : i + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {celebrate && (
        <ResultCard
          top="🎨"
          title={ct("color.done")}
          replayLabel={ct("color.clear")}
          onReplay={() => {
            setFills({});
            setHistory([]);
            window.clearTimeout(celebrateTimer.current);
            setFinished(false);
            setCelebrate(false);
          }}
          backLabel={ct("color.back")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
