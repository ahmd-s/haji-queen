/**
 * Apply client-confirmed catalogue prices to the six existing V1.1 products.
 *
 * Source of truth:
 *   upload/MASTER_PRODUCT_CATALOGUE.csv
 *   upload/MASTER_PRODUCT_CATALOGUE.xlsx
 *   column: supplier_quoted_price_inr
 *
 * Client instruction (2026-11-22): the amounts listed in the supplied
 * catalogue are to be ASSUMED to be customer-facing selling prices for the
 * current version. They are copied verbatim — no markup, margin, conversion
 * or rounding. Original source files are not modified.
 *
 * Updates existing rows in place by SKU; never creates or deletes products.
 *
 * Run: node --env-file=.env.local scripts/catalogue/apply-confirmed-prices-v1_2.mjs
 */
import { PrismaClient } from "@prisma/client";

const CONFIRMED_PRICES_INR = {
  "AB-234": 2550,
  "AB-233": 1800,
  "AB-222": 1700,
  "HQ-ST-001": 1999,
  "HQ-EID-001": 2299,
  "HQ-ST-002": 2399,
};

const rawUrl = process.env.DATABASE_URL;
const db = new PrismaClient({
  datasourceUrl:
    rawUrl && !/connect_timeout=/.test(rawUrl)
      ? `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}connect_timeout=30&pool_timeout=30`
      : rawUrl,
});

const results = [];
for (const [sku, price] of Object.entries(CONFIRMED_PRICES_INR)) {
  const matches = await db.product.findMany({ where: { sku } });
  if (matches.length !== 1) {
    throw new Error(`${sku}: expected exactly one existing product, found ${matches.length}`);
  }
  await db.product.update({
    where: { id: matches[0].id },
    data: { price, priceConfirmed: true },
  });
  results.push({ sku, slug: matches[0].slug, priceInr: price });
}

console.table(results);
await db.$disconnect();
