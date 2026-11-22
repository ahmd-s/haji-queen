/**
 * Attach the 26 validated catalogue images to their pending products and
 * store ONLY source-confirmed colour names.
 *
 * Confirmed from the supplier photographs themselves (read at full resolution):
 *  - AB-233: labels printed on photos → Wine, Navy blue, Dark grey, Biscuit,
 *            Mehndi green, Teal blue (6 of the 8 stated colours; 2 unphotographed).
 *  - HQ-ST-001: the catalogue text itself names 6 combos which map 1:1 to the
 *            6 photos in order.
 * NOT confirmed (no printed labels; names left pending, colours stay []):
 *  - AB-234 (4 colourways photographed of 5 stated)
 *  - AB-222 (10 photos of 9 stated colourways — one is an alternate view)
 *
 * Swatch hexes are auto-sampled from the garment region of each photo —
 * approximations the admin can fine-tune in the colour picker.
 * Products stay hidden (visible=false, price=0) — publishing still requires
 * admin approval via the publish guard.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const IMG = "/images/products";
const SRC = "/home/z/my-project/catalogue_download/extracted/02_PRODUCT_IMAGES";

// garment region per product: [x0,y0,x1,y1] fractions used for hex sampling
const SAMPLE_REGION = {
  "AB-233": [0.35, 0.35, 0.65, 0.65], // kaftan torso
  "HQ-ST-001": [0.3, 0.55, 0.7, 0.9], // skirt (lower half of flat-lay)
};

function sampleHex(file, [x0, y0, x1, y1]) {
  const out = execFileSync("python3", [
    "-c",
    `from PIL import Image; im=Image.open(${JSON.stringify(file)}).convert("RGB"); w,h=im.size; c=im.crop((int(w*${x0}),int(h*${y0}),int(w*${x1}),int(h*${y1}))).resize((16,16)); px=sorted(c.getdata()); r,g,b=px[len(px)//2]; print("#%02x%02x%02x"%(r,g,b))`,
  ]).toString().trim();
  return out;
}

const PLAN = {
  "AB-234": { files: 4, colors: null },
  "AB-233": {
    files: 6,
    colors: [
      { img: 1, name: "Wine" },
      { img: 2, name: "Navy blue" },
      { img: 3, name: "Dark grey" },
      { img: 4, name: "Biscuit" },
      { img: 5, name: "Mehndi green" },
      { img: 6, name: "Teal blue" },
    ],
  },
  "AB-222": { files: 10, colors: null },
  "HQ-ST-001": {
    files: 6,
    colors: [
      { img: 1, name: "Navy / Burgundy" },
      { img: 2, name: "Black / Pink" },
      { img: 3, name: "Black / Black" },
      { img: 4, name: "Ivory / Olive" },
      { img: 5, name: "Tan / Dark Brown" },
      { img: 6, name: "Dark Green / Ivory" },
    ],
  },
};

const pad = (n) => String(n).padStart(2, "0");

const SUBDIR = {
  "AB-234": "ABAYAS/AB-234",
  "AB-233": "ABAYAS/AB-233",
  "AB-222": "INDO_WESTERN/AB-222",
  "HQ-ST-001": "MAXIS_DRESSES/HQ-ST-001",
};

async function main() {
  let imagesAttached = 0;
  const summary = [];

  for (const [sku, plan] of Object.entries(PLAN)) {
    const product = await db.product.findFirst({ where: { sku } });
    if (!product) {
      console.error(`! ${sku}: product missing — run import first`);
      continue;
    }
    const dir = `${SRC}/${SUBDIR[sku]}`;
    const paths = [];
    for (let i = 1; i <= plan.files; i++) {
      paths.push(`${IMG}/${sku}-${pad(i)}.png`);
    }
    // sanity: every referenced file must exist on disk
    const { existsSync } = await import("node:fs");
    for (const p of paths) {
      const fsPath = `/home/z/my-project/public${p}`;
      if (!existsSync(fsPath)) throw new Error(`Missing file: ${fsPath}`);
    }

    const data = { images: JSON.stringify(paths) };
    if (plan.colors) {
      data.colors = JSON.stringify(
        plan.colors.map((c) => {
          const fs = `${SRC}/${SUBDIR[sku]}/${sku}-${pad(c.img)}.png`;
          const hex = sampleHex(fs, SAMPLE_REGION[sku]);
          return { name: c.name, hex };
        })
      );
    }
    await db.product.update({ where: { id: product.id }, data });
    imagesAttached += paths.length;
    summary.push(
      `${sku}: ${paths.length} images${plan.colors ? `, ${plan.colors.length} confirmed colours` : ", colours pending (no printed labels)"}`
    );
    console.log(`+ ${summary[summary.length - 1]}`);
  }

  // Append mapping findings to the internal supplier entries (admin-only).
  const findings = {
    "AB-233":
      "IMAGE-COLOUR MAPPING: labels printed on supplier photos read at full resolution — 01 Wine, 02 Navy blue, 03 Dark grey, 04 Biscuit, 05 Mehndi green, 06 Teal blue. Catalogue states 8 colours: 2 remain unphotographed/unnamed — confirm with supplier. Swatch hexes are auto-sampled approximations.",
    "AB-234":
      "IMAGE-COLOUR MAPPING: NO printed colour labels on photos. 4 colourways photographed (approx: mauve-pink, brown, grey-blue, cream) of 5 stated — exact colour names PENDING supplier confirmation; product colours left empty until named. Swatch rule not applied.",
    "AB-222":
      "IMAGE-COLOUR MAPPING: labels show only 'Design No. AB-222' — no colour names. 10 photos cover 9 stated colourways, so one colour has an alternate view (candidates: 01/02 similar shade). Exact colour names PENDING; product colours left empty until named.",
    "HQ-ST-001":
      "IMAGE-COLOUR MAPPING: catalogue's own 6 named combos map 1:1 in order — 01 Navy/Burgundy, 02 Black/Pink, 03 Black/Black, 04 Ivory/Olive, 05 Tan/Dark Brown, 06 Dark Green/Ivory. Bags visible in 01 and 05 remain NOT confirmed as included. Swatch hexes auto-sampled from skirt region (approximations).",
  };
  for (const [ref, note] of Object.entries(findings)) {
    const entry = await db.supplierCatalogueEntry.findFirst({
      where: { supplierRef: ref },
    });
    if (entry) {
      await db.supplierCatalogueEntry.update({
        where: { id: entry.id },
        data: { notes: `${entry.notes}\n\n${note}` },
      });
    }
  }

  console.log(`\nImages attached: ${imagesAttached}`);
  console.log("Internal mapping notes appended to 4 supplier entries.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
