/*
Cut whole things out of a story painting for Drag & Drop "shape" levels:
the child drags the cut-out onto its dark silhouette, instead of a round
piece onto a round socket. Each thing is found by colour inside a box
(see SHAPES below), cleaned up, and saved with a transparent background.

Needs `sharp` (install it in a scratch folder outside the repo):

  (cd ~/imgtools && npm i sharp)
  NODE_PATH=~/imgtools/node_modules node scripts/make-dragdrop-shapes.cjs

Writes src/assets/dragdrop-shapes/<slug>-<name>.webp and
src/lib/dragdrop-shapes.ts. A story/level listed here plays with shapes;
every other one keeps the round pieces.
*/
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src/assets/dragdrop-shapes");

// slug -> level -> things. box = [left, top, width, height] in px of the
// 896 x 1152 painting; fg(r, g, b) says whether a (blurred) pixel belongs to
// the thing; mirror rebuilds a symmetric thing (a vase) from its clean left
// edge.
const SHAPES = {
  annunciation: {
    easy: [
      { name: "dove", box: [115, 55, 150, 165], fg: (r, g, b) => b > 58 && r > 150 },
      { name: "bird", box: [730, 490, 85, 80], fg: (r, g) => r > g * 2.2 && r > 70 },
      { name: "vase", box: [0, 665, 135, 195], fg: (r, g) => g < 72 && r > g * 2.1, mirror: true },
    ],
  },
};

function morph(m, w, h, r, dilate) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let dy = -r; dy <= r && (dilate ? !v : v); dy++)
        for (let dx = -r; dx <= r; dx++) {
          const X = x + dx, Y = y + dy;
          const s = X < 0 || Y < 0 || X >= w || Y >= h ? 0 : m[Y * w + X];
          if (dilate && s) { v = 1; break; }
          if (!dilate && !s) { v = 0; break; }
        }
      out[y * w + x] = v;
    }
  return out;
}

function largest(m, w, h) {
  const lab = new Int32Array(w * h).fill(-1);
  let best = -1, bestN = 0, id = 0;
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || lab[i] >= 0) continue;
    let n = 0;
    const st = [i];
    lab[i] = id;
    while (st.length) {
      const j = st.pop();
      n++;
      const x = j % w, y = (j / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const k = Y * w + X;
        if (m[k] && lab[k] < 0) { lab[k] = id; st.push(k); }
      }
    }
    if (n > bestN) { bestN = n; best = id; }
    id++;
  }
  return m.map((_, i) => (lab[i] === best ? 1 : 0));
}

function fillHoles(m, w, h) {
  const bg = new Uint8Array(w * h);
  const st = [];
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) {
    const j = st.pop();
    if (bg[j] || m[j]) continue;
    bg[j] = 1;
    const x = j % w, y = (j / w) | 0;
    if (x > 0) st.push(j - 1);
    if (x < w - 1) st.push(j + 1);
    if (y > 0) st.push(j - w);
    if (y < h - 1) st.push(j + w);
  }
  return bg.map((v) => (v ? 0 : 1));
}

// Rows of a symmetric thing: keep each row's left edge, mirror it around the
// thing's axis (the median row centre) and fill in between.
function mirrorRows(m, w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < w; x++) if (m[y * w + x]) { if (l < 0) l = x; r = x; }
    rows.push([l, r]);
  }
  const mids = rows.filter(([l]) => l >= 0).map(([l, r]) => (l + r) / 2).sort((a, b) => a - b);
  const axis = mids[(mids.length / 2) | 0];
  const out = new Uint8Array(w * h);
  rows.forEach(([l], y) => {
    if (l < 0) return;
    const r = Math.min(w - 1, Math.round(2 * axis - l));
    for (let x = l; x <= r; x++) out[y * w + x] = 1;
  });
  return out;
}

(async () => {
  const src = (slug) => path.join(ROOT, `src/assets/puzzle-${slug}.jpg`);
  const lines = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const [slug, levels] of Object.entries(SHAPES)) {
    const meta = await sharp(src(slug)).metadata();
    const W = meta.width, H = meta.height;
    const lv = [];
    for (const [level, things] of Object.entries(levels)) {
      const items = [];
      for (const t of things) {
        const [x0, y0, w, h] = t.box;
        const crop = () => sharp(src(slug)).extract({ left: x0, top: y0, width: w, height: h });
        const blurred = await crop().blur(1.4).raw().toBuffer();
        let m = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) m[i] = t.fg(blurred[i * 3], blurred[i * 3 + 1], blurred[i * 3 + 2]) ? 1 : 0;
        m = morph(morph(m, w, h, 2, true), w, h, 2, false); // close small gaps
        m = morph(morph(m, w, h, 1, false), w, h, 1, true); // drop specks
        m = fillHoles(largest(m, w, h), w, h);
        if (t.mirror) m = mirrorRows(m, w, h);
        // Trim to the thing itself.
        let minX = w, minY = h, maxX = 0, maxY = 0;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++)
            if (m[y * w + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
        const alpha = Buffer.from(m.map((v) => v * 255));
        const a = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer();
        const rgb = await crop().raw().toBuffer();
        const rgba = Buffer.alloc(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2]; rgba[i * 4 + 3] = a[i];
        }
        const cw = maxX - minX + 3, ch = maxY - minY + 3;
        const left = Math.max(0, minX - 1), top = Math.max(0, minY - 1);
        const file = `${slug}-${t.name}.webp`;
        await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
          .extract({ left, top, width: Math.min(cw, w - left), height: Math.min(ch, h - top) })
          .webp({ quality: 90, alphaQuality: 100 })
          .toFile(path.join(OUT, file));
        const pct = (v, d) => +((v / d) * 100).toFixed(2);
        items.push({ name: t.name, file, x: pct(x0 + left, W), y: pct(y0 + top, H), w: pct(Math.min(cw, w - left), W), h: pct(Math.min(ch, h - top), H) });
      }
      lv.push({ level, items });
    }
    lines.push({ slug, lv });
  }

  const imports = [];
  const body = lines.map(({ slug, lv }) => {
    const levels = lv.map(({ level, items }) => {
      const list = items.map((it) => {
        const id = `${slug}_${it.name}`.replace(/-/g, "_");
        imports.push(`import ${id} from "@/assets/dragdrop-shapes/${it.file}";`);
        return `{ src: ${id}, x: ${it.x}, y: ${it.y}, w: ${it.w}, h: ${it.h} }`;
      });
      return `    ${JSON.stringify(level)}: [\n      ${list.join(",\n      ")},\n    ],`;
    });
    return `  ${JSON.stringify(slug)}: {\n${levels.join("\n")}\n  },`;
  });
  const ts = `// Made by scripts/make-dragdrop-shapes.cjs — do not edit by hand.
// Drag & Drop levels played with cut-out shapes instead of round pieces.
// x, y = top-left corner and w, h = size, all in % of the painting (x and w
// of its width, y and h of its height).
import type { DifficultyId } from "./puzzles";
${imports.join("\n")}

export interface ShapePiece {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DD_SHAPES: Record<string, Partial<Record<DifficultyId, ShapePiece[]>>> = {
${body.join("\n")}
};
`;
  fs.writeFileSync(path.join(ROOT, "src/lib/dragdrop-shapes.ts"), ts);
  console.log("wrote", lines.length, "stories");
})();
