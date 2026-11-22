/**
 * Publish the six EXISTING Master Catalogue V1.1 products as enquiry-only
 * storefront listings. Updates in place by SKU; never creates or deletes.
 *
 * No prices are invented: supplier quotes are never copied into Product.price.
 * Every row stays priceConfirmed=false, price=0 and checkout-disabled until a
 * confirmed customer-facing price is entered by an administrator.
 *
 * Run: node --env-file=.env.local scripts/catalogue/publish-v1_1.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  fs.readFileSync(path.join(here, "catalogue-v1_1-images.json"), "utf8")
);

const EXPECTED_AVAILABILITY = {
  "AB-234": "READY_TO_DISPATCH",
  "AB-233": "READY_TO_DISPATCH",
  "AB-222": "READY_TO_DISPATCH",
  "HQ-ST-001": "PRE_ORDER",
  "HQ-EID-001": "PRE_ORDER",
  "HQ-ST-002": "PRE_ORDER",
};

const rawUrl = process.env.DATABASE_URL;
const db = new PrismaClient({
  datasourceUrl:
    rawUrl && !/connect_timeout=/.test(rawUrl)
      ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}connect_timeout=30&pool_timeout=30`
      : rawUrl,
});

const results = [];
for (const sku of Object.keys(EXPECTED_AVAILABILITY)) {
  const matches = await db.product.findMany({ where: { sku } });
  if (matches.length !== 1) {
    throw new Error(`${sku}: expected exactly one existing product, found ${matches.length}`);
  }
  const product = matches[0];
  const mapped = manifest.products.find((p) => p.code === sku);
  const colours = (mapped?.colours ?? []).map((c) => ({
    name: c.name,
    hex: c.hex,
    ...(c.hex2 ? { hex2: c.hex2 } : {}),
    images: c.images.map((i) => i.src),
    available: true,
  }));
  const images = colours.flatMap((c) => c.images);

  await db.product.update({
    where: { id: product.id },
    data: {
      visible: true,
      price: 0,
      priceConfirmed: false,
      trackStock: false,
      availability: product.availability || EXPECTED_AVAILABILITY[sku],
      colors: colours.length ? JSON.stringify(colours) : product.colors,
      images: images.length ? JSON.stringify(images) : product.images,
      catalogueBatch: "MASTER_V1_1",
      featured: false,
    },
  });

  results.push({
    sku,
    visible: true,
    priceConfirmed: false,
    colours: colours.length,
    images: images.length,
    availability: product.availability || EXPECTED_AVAILABILITY[sku],
  });
}

console.table(results);
await db.$disconnect();
