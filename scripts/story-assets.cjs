/*
Rebuild everything that comes from a story painting, for the stories named on
the command line. JavaScript port of make-thumbs.py, make-dragdrop.py,
make-guesswho.py and the hand-drawn path of make-coloring.py, for containers
without Python.

Needs `sharp` (install it in a scratch folder outside the repo):

  (cd ~/imgtools && npm i sharp)
  NODE_PATH=~/imgtools/node_modules node scripts/story-assets.cjs noahs-ark nativity

Per story it writes:
  src/assets/thumbs/<slug>.webp            320 px wide copy
  src/lib/dragdrop-pieces.ts               that story's line, from story-items.ts
  src/assets/guesswho/<id>.webp            portraits of its characters
  src/assets/coloring/<slug>-lines.webp    from scripts/coloring-art/<slug>.png,
  src/assets/coloring/<slug>-regions.png   when that drawing exists
  src/assets/coloring-marker/<slug>-lines.webp  only if the story already has one
*/
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "src", "assets");
const W = 896;
const H = 1152;
const RATIO = H / W;

function loadItems() {
  const src = fs.readFileSync(path.join(ROOT, "src", "lib", "story-items.ts"), "utf8");
  const body = src.slice(src.indexOf("= {") + 2, src.lastIndexOf("};") + 1).replace(/,\s*}/g, "}");
  return JSON.parse(body);
}

// Separable Gaussian blur on a float map, mirrored edges (OpenCV default).
function gaussian(src, w, h, sigma) {
  const rad = Math.max(1, Math.round(sigma * 4));
  const k = [];
  let sum = 0;
  for (let i = -rad; i <= rad; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const refl = (i, n) => {
    while (i < 0 || i >= n) i = i < 0 ? -i : 2 * n - 2 - i;
    return i;
  };
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -rad; i <= rad; i++) s += k[i + rad] * src[y * w + refl(x + i, w)];
      tmp[y * w + x] = s;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -rad; i <= rad; i++) s += k[i + rad] * tmp[refl(y + i, h) * w + x];
      out[y * w + x] = s;
    }
  return out;
}

// ---- Thumbs -----------------------------------------------------------------

async function thumb(slug) {
  await sharp(path.join(ASSETS, `puzzle-${slug}.jpg`))
    .resize(320)
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(ASSETS, "thumbs", `${slug}.webp`));
}

// ---- Drag & Drop pieces -----------------------------------------------------

const LEVELS = [
  [3, 11],
  [5, 10],
  [7, 9],
  [9, 8],
  [11, 7],
];
const GAP = 1.5;

async function detailMap(slug) {
  const dw = 200;
  const dh = 257;
  const { data } = await sharp(path.join(ASSETS, `puzzle-${slug}.jpg`))
    .resize(dw, dh, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const gray = new Float32Array(dw * dh);
  const sat = new Float32Array(dw * dh);
  for (let i = 0; i < dw * dh; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const mx = Math.max(r, g, b);
    sat[i] = mx ? ((mx - Math.min(r, g, b)) / mx) * 255 : 0;
  }
  const at = (x, y) => {
    x = x < 0 ? -x : x >= dw ? 2 * dw - 2 - x : x;
    y = y < 0 ? -y : y >= dh ? 2 * dh - 2 - y : y;
    return gray[y * dw + x];
  };
  const edges = new Float32Array(dw * dh);
  let max = 0;
  for (let y = 0; y < dh; y++)
    for (let x = 0; x < dw; x++) {
      const gx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      const m = Math.hypot(gx, gy);
      edges[y * dw + x] = m;
      if (m > max) max = m;
    }
  const score = new Float32Array(dw * dh);
  for (let i = 0; i < dw * dh; i++) score[i] = edges[i] / (max + 1e-6) + (0.35 * sat[i]) / 255;
  return { map: gaussian(score, dw, dh, 6), w: dw, h: dh };
}

const clamp = (x, y, r) => {
  const ry = r / RATIO;
  return [Math.min(Math.max(x, r), 100 - r), Math.min(Math.max(y, ry), 100 - ry)];
};
const fits = (x, y, r, chosen) => chosen.every(([a, b]) => Math.hypot(x - a, (y - b) * RATIO) >= 2 * r + GAP);

function piecesFor(items, detail, count, r) {
  const chosen = [];
  for (const [, ix, iy] of items) {
    const [x, y] = clamp(ix, iy, r);
    if (fits(x, y, r, chosen)) chosen.push([x, y]);
    if (chosen.length === count) return chosen;
  }
  const cands = [];
  for (let y = r / RATIO; y <= 100 - r / RATIO + 0.01; y += 2)
    for (let x = r; x <= 100 - r + 0.01; x += 2)
      cands.push([
        detail.map[Math.floor((y / 100) * (detail.h - 1)) * detail.w + Math.floor((x / 100) * (detail.w - 1))],
        x,
        y,
      ]);
  cands.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2]);
  for (const [, x, y] of cands) {
    if (fits(x, y, r, chosen)) {
      chosen.push([x, y]);
      if (chosen.length === count) break;
    }
  }
  return chosen;
}

const r1 = (v) => Math.round(v * 10) / 10;

async function dragdrop(slugs, items) {
  const file = path.join(ROOT, "src", "lib", "dragdrop-pieces.ts");
  let lines = fs.readFileSync(file, "utf8").split("\n");
  for (const slug of slugs) {
    const detail = await detailMap(slug);
    const levels = LEVELS.map(([count, r]) => {
      const ps = piecesFor(items[slug], detail, count, r);
      if (ps.length !== count) throw new Error(`${slug}: ${ps.length} of ${count} pieces`);
      return ps.map(([x, y]) => [r1(x), r1(y)]);
    });
    const line = `  ${JSON.stringify(slug)}: ${JSON.stringify(levels)},`;
    const i = lines.findIndex((l) => l.startsWith(`  ${JSON.stringify(slug)}:`));
    if (i >= 0) lines[i] = line;
    else lines.splice(lines.lastIndexOf("};"), 0, line);
  }
  fs.writeFileSync(file, lines.join("\n"));
}

// ---- Guess Who portraits ----------------------------------------------------

function guesswhoTable() {
  const src = fs.readFileSync(path.join(ROOT, "scripts", "make-guesswho.py"), "utf8");
  const chars = {};
  for (const m of src.matchAll(/"([\w-]+)": \("([\w-]+)", (\d+)\)/g)) chars[m[1]] = [m[2], +m[3]];
  const adjust = {};
  for (const m of src.matchAll(/"([\w-]+)": \((-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\)/g))
    adjust[m[1]] = [+m[2], +m[3], +m[4]];
  return { chars, adjust };
}

async function guesswho(slugs, items) {
  const { chars, adjust } = guesswhoTable();
  for (const [cid, [slug, idx]] of Object.entries(chars)) {
    if (!slugs.includes(slug)) continue;
    const [word, x, y, r] = items[slug][idx];
    let cx = (x / 100) * W;
    let cy = (y / 100) * H;
    const rad = (r / 100) * W;
    const [sx, sy, zoom] = adjust[cid] ?? [0, 0, 1];
    const half = rad * 1.75 * zoom;
    cx += rad * sx;
    cy += rad * (0.35 + sy);
    let box = [cx - half, cy - half, cx + half, cy + half];
    const dx = Math.max(0, -box[0]) - Math.max(0, box[2] - W);
    const dy = Math.max(0, -box[1]) - Math.max(0, box[3] - H);
    box = [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy].map(Math.round);
    await sharp(path.join(ASSETS, `puzzle-${slug}.jpg`))
      .extract({ left: box[0], top: box[1], width: box[2] - box[0], height: box[3] - box[1] })
      .resize(240, 240, { fit: "fill" })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(ASSETS, "guesswho", `${cid}.webp`));
    console.log("  guess who:", cid, word);
  }
}

// ---- Coloring pages ---------------------------------------------------------

const MW = 448;
const MH = 576;
const MIN_AREA = 0.0006;

// Line color: (56, 40, 48) RGB, as make-coloring.py writes it.
const INK = [56, 40, 48];

async function artLines(slug) {
  const file = path.join(ROOT, "scripts", "coloring-art", `${slug}.png`);
  if (!fs.existsSync(file)) return null;
  const data = await sharp(file).resize(W, H, { fit: "fill" }).greyscale().extractChannel(0).raw().toBuffer();
  const lines = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) lines[i] = data[i] < 128 ? 1 : 0;
  return lines;
}

function buildRegions(lines) {
  const n = MW * MH;
  // Connected spaces between lines, 4-connected.
  const reg = new Int32Array(n);
  let next = 0;
  const stack = new Int32Array(n);
  for (let s = 0; s < n; s++) {
    if (lines[s] || reg[s]) continue;
    next++;
    let top = 0;
    stack[top++] = s;
    reg[s] = next;
    while (top) {
      const p = stack[--top];
      const x = p % MW;
      const y = (p / MW) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < MW - 1 ? p + 1 : -1, y > 0 ? p - MW : -1, y < MH - 1 ? p + MW : -1];
      for (const q of nb)
        if (q >= 0 && !lines[q] && !reg[q]) {
          reg[q] = next;
          stack[top++] = q;
        }
    }
  }
  // Small areas join their biggest neighbour up to 2 px away.
  const pixels = Array.from({ length: next + 1 }, () => []);
  for (let p = 0; p < n; p++) if (reg[p]) pixels[reg[p]].push(p);
  const areas = pixels.map((l) => l.length);
  const minPx = MIN_AREA * n;
  const order = [...areas.keys()].sort((a, b) => areas[a] - areas[b]);
  for (const r of order) {
    if (r === 0 || !(areas[r] > 0 && areas[r] < minPx)) continue;
    const near = new Set();
    for (const p of pixels[r]) {
      const x = p % MW;
      const y = (p / MW) | 0;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
          const v = reg[ny * MW + nx];
          if (v && v !== r) near.add(v);
        }
    }
    if (!near.size) continue;
    let target = 0;
    for (const v of near) if (!target || areas[v] > areas[target]) target = v;
    for (const p of pixels[r]) reg[p] = target;
    pixels[target] = pixels[target].concat(pixels[r]);
    pixels[r] = [];
    areas[target] += areas[r];
    areas[r] = 0;
  }
  // Line pixels take the nearest area (breadth-first, 8 directions).
  let frontier = [];
  for (let p = 0; p < n; p++) if (reg[p]) frontier.push(p);
  while (frontier.length) {
    const nextF = [];
    for (const p of frontier) {
      const x = p % MW;
      const y = (p / MW) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
          const q = ny * MW + nx;
          if (!reg[q]) {
            reg[q] = reg[p];
            nextF.push(q);
          }
        }
    }
    frontier = nextF;
  }
  // Number the areas 1..n.
  const ids = [...new Set(reg)].sort((a, b) => a - b);
  const lut = new Map(ids.map((v, i) => [v, i + 1]));
  for (let p = 0; p < n; p++) reg[p] = lut.get(reg[p]);
  return { reg, count: ids.length };
}

function inkLayer(lines, sigma, gain, frame) {
  const f = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) f[i] = lines[i];
  const soft = gaussian(f, W, H, sigma);
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const edge = frame && (x < 3 || y < 3 || x >= W - 3 || y >= H - 3);
      rgba[i * 4] = INK[0];
      rgba[i * 4 + 1] = INK[1];
      rgba[i * 4 + 2] = INK[2];
      rgba[i * 4 + 3] = edge ? 255 : Math.round(Math.min(1, Math.max(0, soft[i] * gain)) * 255);
    }
  return rgba;
}

async function coloring(slug) {
  const lines = await artLines(slug);
  if (!lines) {
    console.log("  coloring: no scripts/coloring-art drawing, skipped");
    return;
  }
  // Region map at half size: a 2x2 block is a line if its mean is over 60/255.
  const map = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++)
    for (let x = 0; x < MW; x++) {
      const s =
        lines[2 * y * W + 2 * x] +
        lines[2 * y * W + 2 * x + 1] +
        lines[(2 * y + 1) * W + 2 * x] +
        lines[(2 * y + 1) * W + 2 * x + 1];
      const edge = x === 0 || y === 0 || x === MW - 1 || y === MH - 1;
      map[y * MW + x] = edge || (s * 255) / 4 > 60 ? 1 : 0;
    }
  const { reg, count } = buildRegions(map);
  const enc = Buffer.alloc(MW * MH * 3);
  for (let p = 0; p < MW * MH; p++) {
    enc[p * 3] = reg[p] & 255;
    enc[p * 3 + 1] = reg[p] >> 8;
  }
  const out = path.join(ASSETS, "coloring");
  await sharp(enc, { raw: { width: MW, height: MH, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, `${slug}-regions.png`));
  await sharp(inkLayer(lines, 1.1, 1.8, true), { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(path.join(out, `${slug}-lines.webp`));
  console.log(`  coloring: ${count} areas`);

  // Marker mode lines: thicker, same size as the painting.
  const marker = path.join(ASSETS, "coloring-marker", `${slug}-lines.webp`);
  if (fs.existsSync(marker)) {
    await sharp(inkLayer(lines, 1.6, 2.6, false), { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(marker);
    console.log("  marker lines");
  }
}

async function main() {
  const slugs = process.argv.slice(2);
  if (!slugs.length) throw new Error("Name the stories to rebuild, e.g. noahs-ark nativity");
  const items = loadItems();
  for (const slug of slugs) {
    if (!items[slug]) throw new Error(`${slug} is not in story-items.ts`);
    if (!fs.existsSync(path.join(ASSETS, `puzzle-${slug}.jpg`))) throw new Error(`no puzzle-${slug}.jpg`);
  }
  await dragdrop(slugs, items);
  for (const slug of slugs) {
    console.log(slug);
    await thumb(slug);
    await guesswho([slug], items);
    await coloring(slug);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
