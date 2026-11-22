// One-off: copy every row from the local SQLite file into the Postgres
// database named by DATABASE_URL. Reads SQLite read-only; never modifies it.
// Refuses to run if the target already has data (no overwrite).
//
// Usage: node --env-file=.env.local scripts/migrate-sqlite-to-postgres.mjs [path/to/sqlite.db]
import { DatabaseSync } from "node:sqlite";
import { PrismaClient, Prisma } from "@prisma/client";

const file = process.argv[2] || "db/hajiqueens.db";
const sqlite = new DatabaseSync(file, { readOnly: true });
const pg = new PrismaClient();

// Parents before children so foreign keys resolve.
const ORDER = [
  "AdminUser", "Category", "Product", "ProductVariant", "Supplier",
  "SupplierCatalogueEntry", "Customer", "Order", "OrderItem",
  "MeasurementInquiry", "ContactInquiry", "SiteContent",
];

const models = Object.fromEntries(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));

function convert(model, row) {
  const out = {};
  for (const f of model.fields) {
    if (f.kind !== "scalar" || !(f.name in row)) continue;
    let v = row[f.name];
    if (v !== null && f.type === "DateTime") v = new Date(typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v);
    if (v !== null && f.type === "Boolean") v = Boolean(v);
    if (v !== null && (f.type === "Int")) v = Number(v);
    if (v !== null && (f.type === "Float")) v = Number(v);
    out[f.name] = v;
  }
  return out;
}

const delegate = (name) => pg[name[0].toLowerCase() + name.slice(1)];

for (const name of ORDER) {
  if ((await delegate(name).count()) > 0) {
    console.error(`Target table ${name} already has rows — aborting to avoid overwriting data.`);
    process.exit(1);
  }
}

for (const name of ORDER) {
  const rows = sqlite.prepare(`SELECT * FROM "${name}"`).all();
  const data = rows.map((r) => convert(models[name], r));
  for (let i = 0; i < data.length; i += 500) {
    await delegate(name).createMany({ data: data.slice(i, i + 500) });
  }
  const n = await delegate(name).count();
  console.log(`${name.padEnd(24)} sqlite=${rows.length} postgres=${n}${n === rows.length ? "" : "  MISMATCH"}`);
}

await pg.$disconnect();
