/*
Cut the marked things (src/lib/story-items.ts) out of the story paintings,
with a transparent background, for Drag & Drop (dropped onto their dark
silhouette) and Seek & Find (shown in the list of things to find).

Each thing is cut from a square around its circle by imgly's background
removal model (ISNet, runs on the CPU), keeping only the parts that touch the
thing's centre and clipping to a disc so cut-off bodies end round. Bad cuts
(the model found something else, or nothing) are dropped by the numbers
below and by SKIP (checked by eye).

Setup, in a scratch folder outside the repo (the model is inside the npm
package; --ignore-scripts skips a GPU download from GitHub; sharp 0.33 has
prebuilt binaries on npm):

  mkdir ~/bgr && cd ~/bgr && npm init -y
  npm pkg set overrides.sharp=0.33.5
  npm i --ignore-scripts @imgly/background-removal-node@1.4.5

Then, from the repo:

  NODE_PATH=~/bgr/node_modules node scripts/make-shapes.cjs cut <slug>...   # slow: ~10 s a thing
  NODE_PATH=~/bgr/node_modules node scripts/make-shapes.cjs save <slug>...  # writes the repo files

"cut" writes ~/shapes-cut/<slug>/<i>-<word>.png + <i>.json (2 things per
child process: the model leaks memory and the container has ~1.2 GB).
"save" writes src/assets/shapes/<slug>/<i>-<word>.webp and shapes.json.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const CUT = process.env.SHAPES_CUT || path.join(require("os").homedir(), "shapes-cut");
const MAX_ITEMS = 16; // the first ones, easiest first; levels use up to 11

// Cuts that pass the numbers but are wrong, by eye: "<slug>/<word>".
const SKIP = new Set([
  "annunciation/rug",
  "walking-water/anchor",
  "walking-water/feet",
  "feeding-5000/disciple.face",
  "feeding-5000/staff",
  "feeding-5000/bread",
  "creation/elephant",
  "moses-basket/flower",
  "good-samaritan/sun",
  "good-samaritan/bag",
  "david-goliath/david.face",
  "burning-bush/moses.face",
  "burning-bush/feet",
  "rainbow-promise/zebra",
  "rainbow-promise/tree",
  "tower-babel/basket",
  "passover-supper/man.head",
  "passover-supper/cup",
  "passover-supper/scroll",
  "wedding-cana/servant.face",
  "prodigal-son/cloud",
  "daniel-lions/paw",
  "joseph-coat/coat",
  "joseph-coat/goat",
  "sermon-mount/cloud",
  "baptism-jesus/cloud",
  "baptism-jesus/tree",
  "palm-sunday/gate",
  "palm-sunday/crowd",
  "adam-animals/ladybug",
  "ruth-fields/basket",
  "jacobs-ladder/staff",
  "jacobs-ladder/tent",
  "jacobs-ladder/bag",
  "samuel-call/blanket",
  "heals-blind/jesus.face",
  "joseph-forgives/brother.head",
  "joseph-forgives/brothers",
  "joseph-forgives/scroll",
  "joseph-forgives/jar",
  "angels-shepherds/shepherd.head",
  "boy-temple/man.head",
  "catch-fish/jesus.head",
  "catch-fish/shell",
  "sower-seed/bag",
  "sower-seed/town",
  "transfiguration/disciple.head",
  "transfiguration/man.head",
  "washes-feet/disciples",
  "emmaus/sun",
  "mustard-seed/woman.head",
  "mustard-seed/jar",
]);

function items(slug) {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/story-items.ts"), "utf8");
  const m = src.match(new RegExp(`^  "${slug}": (\\[.*\\]),?$`, "m"));
  if (!m) throw new Error(`no story-items line for ${slug}`);
  return JSON.parse(m[1]).slice(0, MAX_ITEMS);
}

// ---------- the model ----------
let session;
async function mask(png, w, h) {
  const ort = require("onnxruntime-node");
  if (!session) {
    const dist = path.dirname(require.resolve("@imgly/background-removal-node"));
    const res = JSON.parse(fs.readFileSync(path.join(dist, "resources.json")));
    const buf = Buffer.concat(res["/models/medium"].chunks.map((c) => fs.readFileSync(path.join(dist, c.hash))));
    session = await ort.InferenceSession.create(buf, {
      graphOptimizationLevel: "all",
      enableCpuMemArena: false,
      enableMemPattern: false,
      executionMode: "sequential",
      intraOpNumThreads: 2,
    });
  }
  const S = 1024;
  const data = await sharp(png).resize(S, S, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const f = new Float32Array(3 * S * S);
  for (let i = 0, j = 0; j < S * S; i += 3, j++) {
    f[j] = (data[i] - 128) / 256;
    f[j + S * S] = (data[i + 1] - 128) / 256;
    f[j + 2 * S * S] = (data[i + 2] - 128) / 256;
  }
  const out = await session.run({ input: new ort.Tensor("float32", f, [1, 3, S, S]) });
  const o = out.output.data;
  const u = Buffer.alloc(S * S);
  for (let i = 0; i < S * S; i++) u[i] = Math.max(0, Math.min(255, o[i] * 255));
  if (global.gc) global.gc();
  return new Uint8Array(
    await sharp(u, { raw: { width: S, height: S, channels: 1 } }).resize(w, h, { fit: "fill" }).extractChannel(0).raw().toBuffer(),
  );
}

// ---------- cut: one thing ----------
async function cutOne(slug, i) {
  const [word, x, y, r] = items(slug)[i];
  const file = path.join(ROOT, `src/assets/puzzle-${slug}.jpg`);
  const { width: W, height: H } = await sharp(file).metadata();
  const cx = (x / 100) * W, cy = (y / 100) * H, R = (r / 100) * W;
  const win = R * 2.4;
  const left = Math.max(0, Math.round(cx - win)), top = Math.max(0, Math.round(cy - win));
  const w = Math.min(W, Math.round(cx + win)) - left, h = Math.min(H, Math.round(cy + win)) - top;
  const crop = await sharp(file).extract({ left, top, width: w, height: h }).png().toBuffer();
  const a = await mask(crop, w, h);

  // Binarise, keep the parts that reach the thing's centre.
  const m = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) m[k] = a[k] > 110 ? 1 : 0;
  const lab = new Int32Array(w * h).fill(-1);
  const keep = new Set();
  const ccx = cx - left, ccy = cy - top;
  let id = 0;
  for (let k = 0; k < w * h; k++) {
    if (!m[k] || lab[k] >= 0) continue;
    const st = [k];
    lab[k] = id;
    let near = false;
    while (st.length) {
      const j = st.pop();
      const px = j % w, py = (j / w) | 0;
      if (Math.hypot(px - ccx, py - ccy) <= R * 0.6) near = true;
      for (const d of [1, -1, w, -w]) {
        const q = j + d;
        if (q < 0 || q >= w * h || (d === 1 && px === w - 1) || (d === -1 && px === 0)) continue;
        if (m[q] && lab[q] < 0) { lab[q] = id; st.push(q); }
      }
    }
    if (near) keep.add(id);
    id++;
  }

  // Clip to a disc so a cut-off body ends round, not on a straight edge.
  const clip = R * 2.2;
  let area = 0, inner = 0, minX = w, minY = h, maxX = 0, maxY = 0;
  const alpha = Buffer.alloc(w * h);
  for (let k = 0; k < w * h; k++) {
    const px = k % w, py = (k / w) | 0;
    const d = Math.hypot(px - ccx, py - ccy);
    if (keep.has(lab[k]) && d <= clip) {
      alpha[k] = 255;
      area++;
      if (d <= R) inner++;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  const circle = Math.PI * R * R;
  // area: the cut's size compared with the thing's circle; inner: how much of
  // the circle it covers.
  const rec = { i, word, x, y, r, area: +(area / circle).toFixed(2), inner: +(inner / circle).toFixed(2) };
  if (area > 0) {
    const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(0.7).extractChannel(0).raw().toBuffer();
    const rgb = await sharp(crop).removeAlpha().raw().toBuffer();
    const rgba = Buffer.alloc(w * h * 4);
    for (let k = 0; k < w * h; k++) {
      rgba[k * 4] = rgb[k * 3]; rgba[k * 4 + 1] = rgb[k * 3 + 1]; rgba[k * 4 + 2] = rgb[k * 3 + 2]; rgba[k * 4 + 3] = soft[k];
    }
    const l = Math.max(0, minX - 2), t = Math.max(0, minY - 2);
    const cw = Math.min(w, maxX + 3) - l, ch = Math.min(h, maxY + 3) - t;
    await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: l, top: t, width: cw, height: ch })
      .png()
      .toFile(path.join(CUT, slug, `${i}-${word}.png`));
    Object.assign(rec, {
      bx: +(((left + l) / W) * 100).toFixed(2),
      by: +(((top + t) / H) * 100).toFixed(2),
      bw: +((cw / W) * 100).toFixed(2),
      bh: +((ch / H) * 100).toFixed(2),
    });
  }
  fs.writeFileSync(path.join(CUT, slug, `${i}.json`), JSON.stringify(rec));
  console.log(slug, JSON.stringify(rec));
}

// A cut is good when it covers most of the thing's circle without being
// much bigger than it (else the model picked the whole figure or scenery).
const good = (rec) => rec.bw && rec.inner >= 0.3 && rec.area <= 4.5;

async function save(slug) {
  const dir = path.join(CUT, slug);
  const out = path.join(ROOT, "src/assets/shapes", slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const list = [];
  const recs = fs
    .readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f))))
    .sort((a, b) => a.i - b.i);
  for (const rec of recs) {
    if (!good(rec) || SKIP.has(`${slug}/${rec.word}`)) continue;
    const file = `${rec.i}-${rec.word}.webp`;
    await sharp(path.join(dir, `${rec.i}-${rec.word}.png`))
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(path.join(out, file));
    list.push({ word: rec.word, file, x: rec.bx, y: rec.by, w: rec.bw, h: rec.bh, cx: rec.x, cy: rec.y, r: rec.r });
  }
  fs.writeFileSync(path.join(out, "shapes.json"), JSON.stringify(list, null, 1) + "\n");
  console.log(slug, list.length, "shapes");
}

(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === "worker") {
    const [slug, from, to] = rest;
    for (let i = +from; i < Math.min(+to, items(slug).length); i++) await cutOne(slug, i);
  } else if (mode === "cut") {
    for (const slug of rest) {
      fs.mkdirSync(path.join(CUT, slug), { recursive: true });
      const n = items(slug).length;
      for (let f = 0; f < n; f += 2) {
        const missing = [...Array(Math.min(2, n - f)).keys()].some((k) => !fs.existsSync(path.join(CUT, slug, `${f + k}.json`)));
        if (missing) execFileSync(process.execPath, ["--expose-gc", __filename, "worker", slug, f, f + 2], { stdio: "inherit" });
      }
    }
  } else if (mode === "save") {
    for (const slug of rest) await save(slug);
  } else {
    console.log("usage: make-shapes.cjs cut|save <slug>...");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
