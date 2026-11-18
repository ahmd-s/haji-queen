/**
 * Haji Queens — Master Catalogue V1.1 importer (repeatable, idempotent).
 *
 * SAFETY RULES (per catalogue README + client Phase 5):
 *  - Upsert ONLY, keyed by SKU (= catalogue product_id). Never deletes.
 *  - All imported products: visible=false (pending approval), price=0
 *    (customer selling price NOT confirmed — supplier quote is NOT the price),
 *    stock=0, featured=false.
 *  - Supplier quote is stored ONLY on the internal SupplierCatalogueEntry
 *    (admin-scoped), labelled as a QUOTE — wholesale cost is unknown and
 *    recorded as 0, never assumed.
 *  - No images imported: image files were not supplied with this handoff
 *    (only filenames are listed). Nothing fabricated, nothing substituted.
 *  - Colours left [] unless exact colour names are confirmed in the catalogue
 *    (only counts are given, e.g. "5 colours (names pending)").
 *  - Re-runs refresh the internal supplier entry but never overwrite
 *    admin-edited product fields (name/description/price/images/slug).
 *
 * Run: node scripts/catalogue/import-catalogue.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const SNAP = "/home/z/my-project/scripts/catalogue/catalogue_v1_1.json";

// Catalogue category names → existing website category slugs
const CATEGORY_MAP = {
  "Abayas": "abayas",
  "Maxis & Dresses": "maxis-dresses",
  "Indo-Western": "indo-western",
  "Corporate & Workwear": "corporate-workwear",
};

// stock_status → internal availability value
const AVAILABILITY_MAP = {
  "ready to dispatch": "AVAILABLE",
  "pre-order": "PRE_ORDER",
  "pre-order / confirm": "PRE_ORDER",
};

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u2013\u2014]/g, "-") // en/em dash → hyphen
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Parse the available_sizes column conservatively. */
function parseSizes(raw, id) {
  if (!raw) return [];
  const s = String(raw).trim();
  if (/^not specified/i.test(s)) return [];
  if (/^all sizes/i.test(s)) return []; // custom-made; sizes pending client confirmation

  // Composite form "Outer: 52;54;56 | Inner: 52;54;56" — keep the set only
  // when every segment yields the same confirmed size run.
  const segments = s.split("|").map((x) => x.trim()).filter(Boolean);
  if (segments.length > 1) {
    const sets = segments.map((seg) =>
      seg
        .replace(/^(outer|inner)\s*:\s*/i, "")
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean)
    );
    const first = JSON.stringify(sets[0]);
    if (sets.every((set) => JSON.stringify(set) === first)) return sets[0];
    console.warn(`  ! ${id}: outer/inner size runs differ, keeping none: ${s}`);
    return [];
  }

  const cleaned = s.replace(/^(outer|inner)\s*:\s*/i, "");
  const sizes = cleaned.split(";").map((x) => x.trim()).filter(Boolean);
  if (sizes.some((x) => !/^[A-Za-z0-9 ]{1,10}$/.test(x))) {
    console.warn(`  ! ${id}: unexpected size tokens, keeping none: ${JSON.stringify(sizes)}`);
    return [];
  }
  return sizes;
}

function imageManifest(rec) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map((n) => rec[`image_${n}_filename`])
    .filter(Boolean);
}

async function main() {
  const { version, products } = JSON.parse(readFileSync(SNAP, "utf-8"));
  const report = { version, imported: [], updated: [], skipped: [], at: new Date().toISOString() };

  // Internal supplier of record — identity NOT supplied in the pack; never renamed to a real vendor.
  let supplier = await db.supplier.findFirst({
    where: { name: "Unidentified Supplier — Catalogue V1.1" },
  });
  if (!supplier) {
    supplier = await db.supplier.create({
      data: {
        name: "Unidentified Supplier — Catalogue V1.1",
        notes:
          "Placeholder supplier record created by the V1.1 catalogue import because no supplier identity was supplied in the handoff pack. Admin should attach the real supplier (privately) once confirmed.",
      },
    });
  }

  for (const rec of products) {
    const id = rec.product_id;
    const name = rec.product_name;
    if (String(rec.is_published).trim().toUpperCase() !== "FALSE") {
      report.skipped.push({ id, reason: "is_published is not FALSE — unexpected source state" });
      continue;
    }
    const catSlug = CATEGORY_MAP[rec.category];
    const category = catSlug ? await db.category.findUnique({ where: { slug: catSlug } }) : null;
    if (!category) {
      report.skipped.push({ id, reason: `Unknown catalogue category: ${rec.category}` });
      continue;
    }

    const sizes = parseSizes(rec.available_sizes, id);
    const expectedImages = imageManifest(rec);
    const availability =
      AVAILABILITY_MAP[String(rec.stock_status || "").toLowerCase().trim()] || "PENDING_REVIEW";

    const internalNotes = [
      `Source: Master Product Catalogue ${version} (${id}); product_type=${rec.product_type}; subcategory=${rec.subcategory || "—"}.`,
      `Supplier QUOTE ₹${rec.supplier_quoted_price_inr} — reference only, NOT a confirmed wholesale cost and NOT a selling price.`,
      `Stock status at import: ${rec.stock_status}.`,
      rec.size_notes ? `Size notes (unit unconfirmed): ${rec.size_notes}.` : "",
      expectedImages.length
        ? `Expected image files (NOT yet uploaded): ${expectedImages.join(", ")}.`
        : "No standalone product images supplied (screenshot-level only) — request before publishing.",
      `Internal review notes: ${rec.notes_internal}`,
      `Pending approval checks: fabric wording, exact colour names, size units, hijab/accessory inclusion, markup & website price. See PRODUCT_REVIEW_CHECKLIST.`,
    ]
      .filter(Boolean)
      .join(" ");

    const existing = await db.product.findFirst({ where: { sku: id } });

    if (!existing) {
      const created = await db.product.create({
        data: {
          slug: slugify(name),
          name,
          description: rec.description, // verbatim catalogue copy
          fabricDetails: rec.fabric || null, // verbatim supplier wording incl. pending flags
          categoryId: category.id,
          source: "TRUSTED_SUPPLIER",
          price: 0, // customer price pending admin approval — publish guard blocks this
          colors: "[]", // exact colour names pending — not invented
          sizes: JSON.stringify(sizes),
          images: "[]", // image files not supplied — admin uploads via admin panel
          badge: null,
          stock: 0,
          featured: false,
          visible: false, // DO NOT PUBLISH per catalogue
          sku: id,
        },
      });
      await db.supplierCatalogueEntry.create({
        data: {
          supplierId: supplier.id,
          supplierRef: id,
          itemName: name,
          wholesalePrice: 0, // unknown — quote deliberately NOT recorded as cost
          markupPct: 0,
          fixedMarkup: 0,
          availability,
          notes: internalNotes,
          productId: created.id,
        },
      });
      report.imported.push({ id, name, slug: created.slug, sizes });
      console.log(`+ imported  ${id}  ${name}  (hidden, price pending)`);
    } else {
      // Repeat run: refresh ONLY the internal catalogue entry; product fields
      // remain exactly as the admin left them — with one safe exception:
      // confirmed sizes are backfilled ONLY if no sizes were ever set.
      const currentSizes = JSON.parse(existing.sizes || "[]");
      if (sizes.length && currentSizes.length === 0) {
        await db.product.update({ where: { id: existing.id }, data: { sizes: JSON.stringify(sizes) } });
      }
      const entry = await db.supplierCatalogueEntry.findUnique({ where: { productId: existing.id } });
      if (entry) {
        await db.supplierCatalogueEntry.update({
          where: { id: entry.id },
          data: { supplierId: supplier.id, supplierRef: id, itemName: name, availability, notes: internalNotes },
        });
        report.updated.push({ id, name, note: "catalogue entry refreshed; product untouched" });
        console.log(`• refreshed ${id}  ${name}  (product untouched)`);
      } else {
        await db.supplierCatalogueEntry.create({
          data: {
            supplierId: supplier.id,
            supplierRef: id,
            itemName: name,
            wholesalePrice: 0,
            markupPct: 0,
            fixedMarkup: 0,
            availability,
            notes: internalNotes,
            productId: existing.id,
          },
        });
        report.updated.push({ id, name, note: "supplier entry linked to existing product" });
        console.log(`• linked    ${id}  ${name}  (existing product, supplier entry added)`);
      }
    }
  }

  writeFileSync("/home/z/my-project/scripts/catalogue/import_report.json", JSON.stringify(report, null, 2));
  console.log(
    `\nDone. imported=${report.imported.length} refreshed=${report.updated.length} skipped=${report.skipped.length}`
  );
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
