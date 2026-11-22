/**
 * Build customer-facing WebP product photos from the V1.1 catalogue.
 *
 *  - Photos with printed supplier labels are read from <cleanDir> (output of
 *    clean-labels.cjs); photos without labels are read from the original source.
 *  - Long edge capped at 1600px (never upscaled); quality stepped down from 88
 *    until the file is <= 250 KB. All metadata is stripped.
 *  - Swatch colours are the median of a garment region in the photo itself.
 *  - Output: public/images/products/<slug>/<slug>-<colour>[-n].webp
 *    and scripts/catalogue/catalogue-v1_1-images.json (manifest).
 *
 * Folder/file names use the customer-facing product slug, NOT the supplier
 * design number, so URLs don't expose supplier codes.
 *
 * Usage: node scripts/catalogue/build-images.cjs <sourceImagesDir> <cleanDir>
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const [srcDir, cleanDir] = process.argv.slice(2);
if (!srcDir || !cleanDir) {
  console.error("Usage: node build-images.cjs <sourceImagesDir> <cleanDir>");
  process.exit(1);
}
const root = path.join(__dirname, "..", "..");
const mapping = JSON.parse(fs.readFileSync(path.join(__dirname, "catalogue-v1_1-mapping.json"), "utf8"));
const labelled = new Set(
  Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, "labels.json"), "utf8"))).filter((k) => !k.startsWith("_"))
);
const srcFiles = fs.readdirSync(srcDir, { recursive: true }).filter((f) => f.endsWith(".png"));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

async function medianColour(file, [x0, y0, x1, y1]) {
  const { data } = await sharp(file)
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = [[], [], []];
  for (let i = 0; i < data.length; i += 3) for (let c = 0; c < 3; c++) ch[c].push(data[i + c]);
  return ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
}

async function encode(input, out) {
  const meta = await sharp(input).metadata();
  const resize = Math.max(meta.width, meta.height) > 1600 ? { width: 1600, height: 1600, fit: "inside" } : null;
  let q = 88, buf;
  for (;;) {
    let p = sharp(input);
    if (resize) p = p.resize(resize);
    buf = await p.webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
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
    const entry = { code: prod.code, slug: prod.slug, colours: [] };
    if (!prod.colours.length) {
      manifest.products.push(entry);
      continue;
    }
    const dir = path.join(root, "public", "images", "products", prod.slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const col of prod.colours) {
      const images = [];
      for (const [i, file] of col.files.entries()) {
        const rel = srcFiles.find((f) => path.basename(f) === file);
        if (!rel) throw new Error(`Missing source ${file}`);
        const input = labelled.has(file) ? path.join(cleanDir, file) : path.join(srcDir, rel);
        if (!fs.existsSync(input)) throw new Error(`Missing cleaned copy for ${file} — run clean-labels.cjs first`);
        const name = `${prod.slug}-${slugify(col.name)}${col.files.length > 1 ? `-${i + 1}` : ""}.webp`;
        const info = await encode(input, path.join(dir, name));
        images.push({ src: `/images/products/${prod.slug}/${name}`, from: file, labelsRemoved: labelled.has(file), ...info });
        console.log(`${name.padEnd(64)} ${info.width}x${info.height} ${(info.bytes / 1024).toFixed(0)}KB q${info.quality}`);
      }
      const srcPath = path.join(srcDir, srcFiles.find((f) => path.basename(f) === col.files[0]));
      const c = { name: col.name, hex: hex(await medianColour(srcPath, col.sample)), images };
      if (col.sample2) c.hex2 = hex(await medianColour(srcPath, col.sample2));
      entry.colours.push(c);
    }
    manifest.products.push(entry);
  }
  fs.writeFileSync(path.join(__dirname, "catalogue-v1_1-images.json"), JSON.stringify(manifest, null, 2));
})();
