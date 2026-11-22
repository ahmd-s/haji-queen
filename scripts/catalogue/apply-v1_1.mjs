// Apply Master Product Catalogue V1.1 to the six EXISTING (hidden) product rows.
//
//  - Updates in place, matched by SKU; never creates or deletes products.
//  - Touches only these six SKUs, and only while they are hidden.
//  - Never publishes: `visible` is not written.
//  - Prices stay pending (priceConfirmed=false); supplier quotes are stored only
//    on the internal SupplierCatalogueEntry.quotedPrice.
//  - Every value below is taken from MASTER_PRODUCT_CATALOGUE.csv, the supplier
//    source note, or the verified photo manifest (catalogue-v1_1-images.json).
//    Unresolved items are recorded as admin-only reviewNotes.
//
// Usage: node --env-file=.env.local scripts/catalogue/apply-v1_1.mjs [--dry-run]
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const manifest = JSON.parse(fs.readFileSync(path.join(here, "catalogue-v1_1-images.json"), "utf8"));
const url = process.env.DATABASE_URL;
const db = new PrismaClient({
  datasourceUrl: url && !/connect_timeout=/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}connect_timeout=30&pool_timeout=30` : url,
});

const APPROVAL = { field: "publish", note: "Workbook 'Website Content Review' sheet marks this row DO NOT PUBLISH pending client approval." };
const PRICE = (quote) => ({
  field: "price",
  note: `Customer selling price not supplied in the catalogue. Supplier quote ₹${quote.toLocaleString("en-IN")} is internal reference only.`,
});

const PRODUCTS = {
  "AB-234": {
    description: "Elegant organza outer with a tik-tok inner attachment and latkan handwork.",
    fabricDetails: "Outer: organza. Inner: tik-tok attachment.",
    sizes: ["52", "54", "56", "57"],
    sizeNotes: "Sizes are lengths: 52, 54, 56, 57. Chest: 48.",
    availability: "READY_TO_DISPATCH",
    quote: 2550,
    review: [
      { field: "colours", note: "Supplier states 5 colours; only 4 photographed (Mauve Pink, Taupe, Dusty Grey, Ivory). 5th colour name and photo missing." },
      { field: "sizes", note: "Measurement unit not stated (lengths 52–57, chest 48)." },
      { field: "includes", note: "Supplier mentions a matching organza hijab; confirm whether it is included before mentioning it to customers." },
    ],
  },
  "AB-233": {
    description: "Kaftan-style design with separate full-sleeve inner, adjustable belt and black hijab; graceful flowing silhouette.",
    fabricDetails: "Prada (outer and separate full-sleeve inner).",
    sizes: ["52", "54", "56"],
    sizeNotes: "Sizes are lengths: 52, 54, 56 (outer and inner). Outer chest: free size. Inner chest: 44.",
    availability: "READY_TO_DISPATCH",
    quote: 1800,
    review: [
      { field: "colours", note: "Supplier states 8 colours; 6 photographed (Wine, Navy Blue, Dark Grey, Biscuit, Mehndi Green, Teal Blue). 2 colours missing." },
      { field: "fabric", note: "Supplier spells the fabric 'Parada' (outer) / 'Prada' (inner), also 'Havy seltos Prada'. Confirm customer-facing fabric name." },
      { field: "sizes", note: "Measurement unit not stated." },
    ],
  },
  "AB-222": {
    description: "Two-piece coat set with a graceful long shirt and separate adjustable belt.",
    fabricDetails: "Prada.",
    sizes: [],
    sizeNotes: "Top length: 38. Chest: 44. Pant length: 39.",
    availability: "READY_TO_DISPATCH",
    quote: 1700,
    review: [
      { field: "sizes", note: "No size options supplied — only one set of measurements (may be a single size). Cannot be purchased until sizes are entered." },
      { field: "sizes", note: "Measurement unit not stated." },
      { field: "fabric", note: "Supplier text says 'Havy seltos Prada'. Confirm customer-facing fabric name." },
    ],
  },
  "HQ-ST-001": {
    description: "Skirt and top set with a button-front top, voluminous embroidered sleeves and a tiered long skirt.",
    fabricDetails: "Imported CEY.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeNotes: null,
    availability: "PRE_ORDER",
    quote: 1999,
    review: [
      { field: "includes", note: "Bags appear in photos (Navy/Burgundy, Tan/Dark Brown, Dark Green/Ivory) but are not confirmed as included." },
      { field: "sizes", note: "No measurements provided for S–XXL." },
      { field: "terms", note: "Supplier terms: dispatch in one week; colour-variation disclaimer; uncut unboxing video required for damage claims; Kerala/postal shipping surcharges. Decide which apply to customers." },
    ],
  },
  "HQ-EID-001": {
    description: "Customisable inner shrug skirt set. All sizes and colours can be customised.",
    fabricDetails: "Imported CEY.",
    sizes: [],
    sizeNotes: "Custom sizing. 3XL and 4XL cost extra.",
    availability: "PRE_ORDER",
    quote: 2299,
    review: [
      { field: "photos", note: "No standalone product photos. WhatsApp albums near this caption are ambiguous; request original photos from the supplier." },
      { field: "colours", note: "Colours are custom; no colour list supplied." },
      { field: "sizes", note: "No size list or measurements; 3XL/4XL surcharge amount not stated." },
      { field: "status", note: "Confirm the listing is still active." },
    ],
  },
  "HQ-ST-002": {
    description: "Embroidered skirt and top set with inner.",
    fabricDetails: "Imported CEY.",
    sizes: ["M", "L", "XL", "XXL"],
    sizeNotes: null,
    availability: "PRE_ORDER",
    quote: 2399,
    review: [
      { field: "photos", note: "No standalone product photos. WhatsApp albums near this caption are ambiguous; request original photos from the supplier." },
      { field: "colours", note: "Colours not specified." },
      { field: "sizes", note: "No measurements provided." },
      { field: "terms", note: "Supplier terms: dispatch in one week; limited stock; colour-variation disclaimer; uncut unboxing video required for damage claims; Kerala/postal shipping surcharges." },
    ],
  },
};

const results = [];
for (const [sku, spec] of Object.entries(PRODUCTS)) {
  const product = await db.product.findFirst({ where: { sku }, include: { catalogueEntry: true } });
  if (!product) throw new Error(`${sku}: existing product not found — refusing to create`);
  if (product.visible) throw new Error(`${sku}: product is published — refusing to modify a live product`);

  const m = manifest.products.find((p) => p.code === sku);
  const colours = (m?.colours ?? []).map((c) => ({
    name: c.name,
    hex: c.hex,
    ...(c.hex2 ? { hex2: c.hex2 } : {}),
    images: c.images.map((i) => i.src),
    available: true,
  }));
  const images = colours.flatMap((c) => c.images);
  const review = [PRICE(spec.quote), ...spec.review, APPROVAL];

  const data = {
    description: spec.description,
    fabricDetails: spec.fabricDetails,
    colors: JSON.stringify(colours),
    sizes: JSON.stringify(spec.sizes),
    images: JSON.stringify(images),
    sizeNotes: spec.sizeNotes,
    availability: spec.availability,
    trackStock: false,
    priceConfirmed: false,
    price: 0,
    stock: 0,
    reviewNotes: JSON.stringify(review),
    catalogueBatch: "MASTER_V1_1",
  };
  results.push({ sku, colours: colours.length, images: images.length, sizes: spec.sizes.length, flags: review.length });
  if (dryRun) continue;

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: product.id }, data });
    // Rebuild the colour × size matrix (no quantities: trackStock=false).
    await tx.productVariant.deleteMany({ where: { productId: product.id } });
    const rows = [];
    for (const s of spec.sizes) {
      if (colours.length) for (const c of colours) rows.push({ productId: product.id, size: s, color: c.name, stock: 0 });
      else rows.push({ productId: product.id, size: s, color: "", stock: 0 });
    }
    if (rows.length) await tx.productVariant.createMany({ data: rows });
    if (product.catalogueEntry) {
      await tx.supplierCatalogueEntry.update({ where: { id: product.catalogueEntry.id }, data: { quotedPrice: spec.quote } });
    }
  });
}
console.table(results);
console.log(dryRun ? "Dry run — nothing written." : "Applied. All six products remain hidden.");
await db.$disconnect();
