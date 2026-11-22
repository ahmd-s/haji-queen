/**
 * Remove printed supplier labels from catalogue photos (customer-facing copies only).
 *
 * For each label box in labels.json we pick a nearby same-size background patch
 * (the "donor": directly above/below/left/right), then seamlessly clone it into the
 * box with Poisson blending, so wall panels, lighting gradients and texture continue.
 * The donor with the smallest boundary mismatch wins, unless labels.json pins one:
 *   [x0,y0,x1,y1]                          auto donor
 *   {"box":[...],"donor":[dx,dy]}          fixed donor offset
 *   {"box":[...],"donor":"membrane"}       smooth harmonic fill (plain walls)
 *   {"box":[...],"donor":"vertical"}       per-column blend of the rows just above and
 *                                          below (keeps vertical panel lines / light strips)
 * Boxes are processed in listed order; a donor may reuse an already-cleaned box.
 *
 * Source photos are only READ. Output: lossless PNGs in <outDir>.
 *
 * Usage: node scripts/catalogue/clean-labels.cjs <sourceImagesDir> <outDir> [labels.json]
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const [srcDir, outDir, cfgPath = path.join(__dirname, "labels.json")] = process.argv.slice(2);
if (!srcDir || !outDir) {
  console.error("Usage: node clean-labels.cjs <sourceImagesDir> <outDir> [labels.json]");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

function boundaryMismatch(img, W, box, dx, dy) {
  const [x0, y0, x1, y1] = box;
  const diffs = [];
  const sample = (x, y) => {
    const t = (y * W + x) * 3, s = ((y + dy) * W + (x + dx)) * 3;
    diffs.push([img[t] - img[s], img[t + 1] - img[s + 1], img[t + 2] - img[s + 2]]);
  };
  for (let x = x0; x < x1; x++) { sample(x, y0); sample(x, y1 - 1); }
  for (let y = y0; y < y1; y++) { sample(x0, y); sample(x1 - 1, y); }
  // Variance of the difference: a constant offset is fine (Poisson absorbs it);
  // structure that disagrees along the border is what shows as a seam.
  let v = 0;
  for (let c = 0; c < 3; c++) {
    const m = diffs.reduce((a, d) => a + d[c], 0) / diffs.length;
    v += diffs.reduce((a, d) => a + (d[c] - m) ** 2, 0) / diffs.length;
  }
  return v;
}

function poissonClone(img, W, H, box, dx, dy, membrane = false) {
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  for (let c = 0; c < 3; c++) {
    // f = donor + g, where g is harmonic with g = target - donor on the border.
    const g = new Float64Array((w + 2) * (h + 2));
    const at = (x, y) => (y + 1) * (w + 2) + (x + 1);
    const tgt = (x, y) => img[((y0 + y) * W + (x0 + x)) * 3 + c];
    const don = (x, y) => (membrane ? 0 : img[((y0 + y + dy) * W + (x0 + x + dx)) * 3 + c]);
    // Dirichlet border = ring just outside the box.
    for (let x = -1; x <= w; x++) {
      g[at(x, -1)] = tgt(x, -1) - don(x, -1);
      g[at(x, h)] = tgt(x, h) - don(x, h);
    }
    for (let y = -1; y <= h; y++) {
      g[at(-1, y)] = tgt(-1, y) - don(-1, y);
      g[at(w, y)] = tgt(w, y) - don(w, y);
    }
    // Initial guess: mean border offset; then SOR iterations.
    let sum = 0, n = 0;
    for (let x = -1; x <= w; x++) { sum += g[at(x, -1)] + g[at(x, h)]; n += 2; }
    const mean = sum / n;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[at(x, y)] = mean;
    const omega = 1.9;
    for (let it = 0; it < 1500; it++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = at(x, y);
        const avg = (g[i - 1] + g[i + 1] + g[i - (w + 2)] + g[i + (w + 2)]) / 4;
        g[i] += omega * (avg - g[i]);
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = don(x, y) + g[at(x, y)];
      img[((y0 + y) * W + (x0 + x)) * 3 + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(srcDir, { recursive: true }).filter((f) => f.endsWith(".png"));
  const report = {};
  for (const [name, boxes] of Object.entries(cfg)) {
    if (name.startsWith("_")) continue;
    const rel = files.find((f) => path.basename(f) === name);
    if (!rel) throw new Error(`Missing source photo ${name}`);
    const { data, info } = await sharp(path.join(srcDir, rel)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const img = new Uint8ClampedArray(data);
    const W = info.width, H = info.height;
    report[name] = [];
    const entries = boxes.map((b) => (Array.isArray(b) ? { box: b } : b));
    const allBoxes = entries.map((e) => e.box);
    for (const [idx, entry] of entries.entries()) {
      const box = entry.box;
      const [x0, y0, x1, y1] = box;
      if (entry.donor === "vertical") {
        const R = 3; // rows averaged on each side
        for (let x = x0; x < x1; x++) {
          for (let c = 0; c < 3; c++) {
            let top = 0, bot = 0;
            for (let k = 1; k <= R; k++) {
              top += img[((y0 - k) * W + x) * 3 + c];
              bot += img[((y1 - 1 + k) * W + x) * 3 + c];
            }
            top /= R; bot /= R;
            for (let y = y0; y < y1; y++) {
              const t = (y - y0 + 1) / (y1 - y0 + 1);
              img[(y * W + x) * 3 + c] = Math.round(top * (1 - t) + bot * t);
            }
          }
        }
        report[name].push({ box, donor: "vertical" });
        continue;
      }
      if (entry.donor === "membrane") {
        poissonClone(img, W, H, box, 0, 0, true);
        report[name].push({ box, donor: "membrane" });
        continue;
      }
      if (Array.isArray(entry.donor)) {
        poissonClone(img, W, H, box, entry.donor[0], entry.donor[1]);
        report[name].push({ box, donor: entry.donor, pinned: true });
        continue;
      }
      const w = x1 - x0, h = y1 - y0;
      const cands = [];
      for (const k of [1, 2]) {
        cands.push([0, -(h + 4) * k], [0, (h + 4) * k], [-(w + 4) * k, 0], [(w + 4) * k, 0]);
      }
      let best = null;
      for (const [dx, dy] of cands) {
        if (x0 + dx - 1 < 0 || x1 + dx + 1 > W || y0 + dy - 1 < 0 || y1 + dy + 1 > H) continue;
        // Donor must not overlap another label box.
        const pending = allBoxes.slice(idx); // boxes not cleaned yet
        const overlaps = pending.some((b) => !(x1 + dx <= b[0] || x0 + dx >= b[2] || y1 + dy <= b[1] || y0 + dy >= b[3]));
        if (overlaps) continue;
        const score = boundaryMismatch(img, W, box, dx, dy);
        if (!best || score < best.score) best = { dx, dy, score };
      }
      if (!best) throw new Error(`No donor for ${name} ${box}`);
      poissonClone(img, W, H, box, best.dx, best.dy);
      report[name].push({ box, donor: [best.dx, best.dy], score: Math.round(best.score) });
    }
    await sharp(Buffer.from(img.buffer), { raw: { width: W, height: H, channels: 3 } })
      .png({ compressionLevel: 6 })
      .toFile(path.join(outDir, name));
    console.log(name, report[name].map((r) => `donor(${r.donor})`).join(" "));
  }
  fs.writeFileSync(path.join(outDir, "clean-report.json"), JSON.stringify(report, null, 1));
})();
