/**
 * Build customer-facing WebP photos for the 2026-11-22 four-product addition.
 * Source photos are only read. Optional per-file crop [top, bottom] trims
 * screen overlays; no pixels are otherwise edited. Long edge capped at 1600px,
 * quality stepped down from 88 until <= 250 KB, metadata stripped.
 *
 * Output: public/images/products/<slug>/<slug>-<colour>[-n].webp
 *         scripts/catalogue/additions-2026-11-22-images.json
 *
 * Usage: node scripts/catalogue/build-images-additions.cjs "<catalogue folder>"
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const srcRoot = process.argv[2];
if (!srcRoot) {
  console.error('Usage: node build-images-additions.cjs "<catalogue folder containing p1..p4>"');
  process.exit(1);
}
const root = path.join(__dirname, "..", "..");
const mapping = JSON.parse(fs.readFileSync(path.join(__dirname, "additions-2026-11-22.json"), "utf8"));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function encode(input, crop, out) {
  const meta = await sharp(input).metadata();
  const base = () => {
    let p = sharp(input).rotate();
    if (crop) p = p.extract({ left: 0, top: crop[0], width: meta.width, height: meta.height - crop[0] - crop[1] });
    if (Math.max(meta.width, meta.height) > 1600) p = p.resize({ width: 1600, height: 1600, fit: "inside" });
    return p;
  };
  let q = 88, buf;
  for (;;) {
    buf = await base().webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
    if (buf.length <= 250 * 1024 || q <= 70) break;
    q -= 2;
  }
  fs.writeFileSync(out, buf);
  const m = await sharp(buf).metadata();
  return { width: m.width, height: m.height, bytes: buf.length, quality: q };
}

(async () => {
  const manifest = { generatedAt: new Date().toISOString(), products: [] };
  for (const prod of mapping.products) {
    const dir = path.join(root, "public", "images", "products", prod.slug);
    fs.mkdirSync(dir, { recursive: true });
    const colours = [];
    for (const col of prod.colours) {
      const images = [];
      for (const [i, file] of col.files.entries()) {
        const input = path.join(srcRoot, prod.folder, file);
        if (!fs.existsSync(input)) throw new Error(`Missing ${prod.folder}/${file}`);
        const name = `${prod.slug}-${slugify(col.name)}${col.files.length > 1 ? `-${i + 1}` : ""}.webp`;
        const info = await encode(input, col.crop?.[file], path.join(dir, name));
        images.push({ src: `/images/products/${prod.slug}/${name}`, from: `${prod.folder}/${file}`, ...info });
        console.log(`${name.padEnd(56)} ${info.width}x${info.height} ${(info.bytes / 1024).toFixed(0)}KB q${info.quality}`);
      }
      colours.push({ name: col.name, hex: col.hex, ...(col.hex2 ? { hex2: col.hex2 } : {}), images: images.map((x) => x.src), files: images });
    }
    manifest.products.push({ folder: prod.folder, sku: prod.sku ?? prod.existingSku, existing: Boolean(prod.existingSku), slug: prod.slug, colours });
  }
  fs.writeFileSync(path.join(__dirname, "additions-2026-11-22-images.json"), JSON.stringify(manifest, null, 2));
})();
