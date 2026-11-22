// Four-product addition (catalogue folders p1–p4, supplied 2026-11-22).
//
//   p1 → EXISTING HQ-ST-002 "Embroidery Skirt Top with Inner": only its colours,
//        photos and colour×size variants are added (approved by the client).
//        Name, price, description and other fields are left untouched.
//   p2, p3, p4 → new products (created once; matched by SKU on re-runs).
//
// Prices are the client-confirmed, customer-facing prices from the supplied
// screenshots, copied exactly (INR). Nothing else is invented: missing details
// are recorded in admin-only reviewNotes.
//
// Stages (the live site shares this database, so photos must be deployed first):
//   --stage    create/update p2–p4 HIDDEN; HQ-ST-002 untouched
//   --publish  make p2–p4 visible and attach p1 photos/colours to HQ-ST-002
//
// Usage: node --env-file=.env.local scripts/catalogue/apply-additions-2026-11-22.mjs --stage|--publish
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv.includes("--publish") ? "publish" : process.argv.includes("--stage") ? "stage" : null;
if (!mode) {
  console.error("Pass --stage or --publish");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(here, "additions-2026-11-22-images.json"), "utf8"));
const url = process.env.DATABASE_URL;
const db = new PrismaClient({
  datasourceUrl: url && !/connect_timeout=/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}connect_timeout=30&pool_timeout=30` : url,
});

const NEW = {
  "HQ-PS-001": {
    folder: "p2",
    name: "Pinafore Shirt",
    slug: "pinafore-shirt",
    price: 1999,
    description: "New arrival. Pinafore shirt in imported CEY fabric. Pre-booking: dispatches in one week.",
    fabricDetails: "Imported CEY.",
    sizes: ["M", "L", "XL", "XXL"],
    sizeNotes: null,
    availability: "PRE_ORDER",
    badge: "New In",
    review: [
      { field: "colours", note: "No colour names supplied; names describe the photos (Camel/White, Blue/White, Brown/Cream, Mustard/White, Maroon/White)." },
      { field: "sizes", note: "No measurements supplied for M–XXL." },
      { field: "includes", note: "Bags and sunglasses appear in photos; not confirmed as included." },
      { field: "terms", note: "Supplier terms: free shipping inside Kerala (DTDC); postal ₹50 extra; outside Kerala ₹80 extra; limited stock; colour-variation disclaimer; uncut unboxing video required for damage claims." },
    ],
  },
  "HQ-SP-001": {
    folder: "p3",
    name: "Shirt with Pinafore",
    slug: "shirt-with-pinafore",
    price: 2699,
    description: "Shirt with pinafore in imported CEY fabric. Matching hijab available at ₹150 extra. Dispatch time: 7 days.",
    fabricDetails: "Imported CEY.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeNotes: "Sizes S to XXL. 3XL: ₹100 extra. Larger sizes: ₹200 extra.",
    availability: "PRE_ORDER",
    badge: null,
    review: [
      { field: "colours", note: "Source says 'colour option available' but only Black/Red is photographed; other colours not listed." },
      { field: "availability", note: "Source states 7-day dispatch, not 'pre-order' — set to Pre-order as the closest status; confirm." },
      { field: "price", note: "Add-ons (hijab ₹150, 3XL ₹100, larger sizes ₹200) are shown as text only; checkout charges the base price." },
      { field: "terms", note: "Supplier terms: free shipping in Kerala; home/post delivery shipping ₹50 extra." },
    ],
  },
  "HQ-ST-003": {
    folder: "p4",
    name: "Skirt with Top",
    slug: "skirt-with-top",
    price: 2299,
    description:
      "Customisable skirt with top. All sizes and colours can be customised (3XL and 4XL at extra cost). Available in crush or CEY fabric (CEY ₹100 extra). Hijab available at ₹150 extra. Free shipping.",
    fabricDetails: "Crush or CEY (CEY ₹100 extra).",
    sizes: [],
    sizeNotes: "Made to your size. 3XL and 4XL cost extra.",
    availability: "PRE_ORDER",
    badge: null,
    review: [
      { field: "sizes", note: "No size list supplied ('all sizes customised'). Enquiry only until sizes are entered." },
      { field: "price", note: "3XL/4XL surcharge amount not stated. Add-ons (CEY ₹100, hijab ₹150) are text only." },
      { field: "colours", note: "Colours are customisable; only White/Blush Pink is photographed." },
      { field: "photos", note: "Photos were cropped to remove Instagram mute icon / '2/7' counter." },
    ],
  },
};

const category = await db.category.findUnique({ where: { slug: "maxis-dresses" } });
if (!category) throw new Error("Category maxis-dresses not found");
const results = [];

async function syncVariants(tx, productId, sizes, colours) {
  await tx.productVariant.deleteMany({ where: { productId } });
  const rows = [];
  for (const s of sizes) for (const c of colours) rows.push({ productId, size: s, color: c.name, stock: 0 });
  if (rows.length) await tx.productVariant.createMany({ data: rows });
  return rows.length;
}

for (const [sku, spec] of Object.entries(NEW)) {
  const m = manifest.products.find((p) => p.sku === sku);
  const colours = m.colours.map((c) => ({ name: c.name, hex: c.hex, ...(c.hex2 ? { hex2: c.hex2 } : {}), images: c.images, available: true }));
  const images = colours.flatMap((c) => c.images);
  const existing = await db.product.findMany({ where: { OR: [{ sku }, { slug: spec.slug }] } });
  if (existing.length > 1) throw new Error(`${sku}: ambiguous existing rows`);
  const data = {
    name: spec.name,
    slug: spec.slug,
    sku,
    description: spec.description,
    fabricDetails: spec.fabricDetails,
    categoryId: category.id,
    source: "TRUSTED_SUPPLIER",
    price: spec.price,
    priceConfirmed: true,
    colors: JSON.stringify(colours),
    sizes: JSON.stringify(spec.sizes),
    images: JSON.stringify(images),
    sizeNotes: spec.sizeNotes,
    availability: spec.availability,
    trackStock: false,
    stock: 0,
    badge: spec.badge,
    reviewNotes: JSON.stringify(spec.review),
    catalogueBatch: "ADDITIONS_2026_11_22",
    visible: mode === "publish",
  };
  const variants = await db.$transaction(async (tx) => {
    const row = existing[0]
      ? await tx.product.update({ where: { id: existing[0].id }, data })
      : await tx.product.create({ data });
    return syncVariants(tx, row.id, spec.sizes, colours);
  });
  results.push({ folder: spec.folder, sku, action: existing[0] ? "updated" : "created", visible: data.visible, price: spec.price, colours: colours.length, images: images.length, variants });
}

if (mode === "publish") {
  // p1 → existing HQ-ST-002: add colours, photos and variants only.
  const m = manifest.products.find((p) => p.sku === "HQ-ST-002");
  const target = await db.product.findMany({ where: { sku: "HQ-ST-002" } });
  if (target.length !== 1) throw new Error("HQ-ST-002: expected exactly one existing row");
  const t = target[0];
  const colours = m.colours.map((c) => ({ name: c.name, hex: c.hex, images: c.images, available: true }));
  const sizes = JSON.parse(t.sizes || "[]");
  const notes = JSON.parse(t.reviewNotes || "[]").filter((n) => n.field !== "photos" && n.field !== "colours");
  notes.push({ field: "colours", note: "Photos and colours added from folder p1 (2026-11-22). No colour names supplied; names describe the photos (Navy, Red, Brown, Black, Olive)." });
  notes.push({ field: "includes", note: "Bags appear in 4 of 5 photos; not confirmed as included." });
  const variants = await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: t.id },
      data: { colors: JSON.stringify(colours), images: JSON.stringify(colours.flatMap((c) => c.images)), reviewNotes: JSON.stringify(notes) },
    });
    return syncVariants(tx, t.id, sizes, colours);
  });
  results.push({ folder: "p1", sku: "HQ-ST-002", action: "photos+colours added", visible: t.visible, price: t.price, colours: colours.length, images: colours.length, variants });
}

console.table(results);
await db.$disconnect();
