/**
 * QA suite — catalogue import + admin product workflow + public isolation.
 * Run: node scripts/catalogue/qa_catalogue.mjs
 *
 * Checks:
 *  1. Public API never lists pending products (19 live, 0 catalogue rows).
 *  2. Hidden product detail page returns 404.
 *  3. Admin GET lists all incl. hidden with sku.
 *  4. Publish guard blocks AB-234 (price 0) from going live.
 *  5. PUT edit works (rename/edit price on a scratch product).
 *  6. Upload endpoint accepts a multipart PNG and stores the original bytes.
 *  7. DELETE removes only the scratch product.
 *  8. Sitemap excludes hidden products.
 */
import { randomBytes } from "node:crypto";
import { readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const BASE = "http://localhost:3000";
if (!process.env.QA_ADMIN_COOKIE) {
  throw new Error("QA_ADMIN_COOKIE must contain a real hq_admin_session cookie value.");
}
const cookieValue = process.env.QA_ADMIN_COOKIE;
const COOKIE = cookieValue.startsWith("hq_admin_session=")
  ? cookieValue
  : `hq_admin_session=${cookieValue}`;

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  ✓ ${name}${detail ? " — " + detail : ""}`); }
  else { fail++; console.log(`  ✗ FAIL ${name}${detail ? " — " + detail : ""}`); }
}
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { Cookie: COOKIE, ...(opts.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { res, data };
}

// ── 1. Public isolation ────────────────────────────────────────────────
console.log("\n[1] Public catalogue isolation");
{
  const r = await fetch(`${BASE}/api/products`);
  const d = await r.json();
  const prods = d.products ?? [];
  check("public product count is 19 (existing only)", prods.length === 19, `got ${prods.length}`);
  const leak = prods.filter((p) => /^AB-\d{3}|^HQ-(ST|EID)-/.test(p.slug) || (p.slug || "").includes("shrug") || (p.slug || "").includes("coat-set"));
  check("no imported catalogue products exposed", leak.length === 0, JSON.stringify(leak.map((p) => p.slug)));
  const fields = JSON.stringify(prods[0] ?? {});
  const leaks = ["wholesale", "supplierEntry", "catalogueEntry", "markup"].filter((k) => fields.includes(k));
  check("no supplier/wholesale fields in public payload", leaks.length === 0, leaks.join(","));
}

// ── 2. Hidden product detail 404 ───────────────────────────────────────
console.log("\n[2] Hidden product detail page");
{
  const r = await fetch(`${BASE}/product/luxury-organza-shrug-style-abaya`);
  check("hidden product page returns 404", r.status === 404, `status ${r.status}`);
}

// ── 3. Admin list ──────────────────────────────────────────────────────
console.log("\n[3] Admin product list");
let ab234;
{
  const { res, data } = await api("/api/admin/products");
  const prods = data?.products ?? [];
  check("admin GET 200", res.status === 200);
  check("admin sees 25 products (19 + 6 imported)", prods.length === 25, `got ${prods.length}`);
  check("admin rows include sku", prods.every((p) => "sku" in p));
  ab234 = prods.find((p) => p.sku === "AB-234");
  check("AB-234 present, hidden, price 0", !!ab234 && ab234.visible === false && ab234.price === 0, ab234 ? JSON.stringify({ visible: ab234.visible, price: ab234.price }) : "missing");
  check("AB-234 has supplier entry (internal only)", !!ab234?.supplierEntry);
  check("supplier quote NOT exposed as wholesalePrice=2550 (recorded 0)", ab234?.supplierEntry?.wholesalePrice === 0, `cost=${ab234?.supplierEntry?.wholesalePrice}`);
}

// ── 4. Publish guard ───────────────────────────────────────────────────
console.log("\n[4] Publish approval guard");
{
  const { res, data } = await api(`/api/admin/products/${ab234.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...ab234, badge: "", compareAtPrice: null, fabricDetails: ab234.fabricDetails ?? "", careInstructions: "", visible: true }),
  });
  check("publish blocked with price 0", res.status === 400, `status ${res.status}: ${data?.error?.slice(0, 60)}`);
  const { res: res2, data: d2 } = await api(`/api/admin/products/${ab234.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...ab234, badge: "", compareAtPrice: null, fabricDetails: ab234.fabricDetails ?? "", careInstructions: "", visible: false, name: ab234.name }),
  });
  check("hidden save of pending product succeeds", res2.status === 200, `status ${res2.status}: ${d2?.error ?? ""}`);
}

// ── 5. Edit workflow on scratch product ────────────────────────────────
console.log("\n[5] Edit workflow (scratch product)");
let scratchId;
{
  const cats = (await api("/api/admin/categories")).data?.categories ?? [];
  const create = await api("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "QA Scratch Item", slug: "qa-scratch-item",
      description: "Temporary QA product used to verify the edit workflow.",
      categoryId: cats[0].id, source: "HQ_ORIGINAL",
      price: 99, colors: [{ name: "Black", hex: "#1d1a17" }], sizes: ["S", "M"],
      images: ["/images/p-classic-black-1.jpg"], featured: false, visible: false, stock: 3,
    }),
  });
  check("scratch product created", create.res.status === 200, `status ${create.res.status}`);
  scratchId = create.data?.id;
  const edit = await api(`/api/admin/products/${scratchId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "QA Scratch Item (edited)", slug: "qa-scratch-item",
      description: "Temporary QA product used to verify the edit workflow.",
      categoryId: cats[0].id, source: "HQ_ORIGINAL",
      price: 149, compareAtPrice: null, colors: [{ name: "Black", hex: "#1d1a17" }],
      sizes: ["S", "M", "L"], images: ["/images/p-classic-black-1.jpg"],
      featured: false, visible: true, badge: "", stock: 5, fabricDetails: "", careInstructions: "",
    }),
  });
  check("PUT edit succeeds (price/size/visible)", edit.res.status === 200, `status ${edit.res.status}: ${edit.data?.error ?? ""}`);
  const pub = await fetch(`${BASE}/api/products?search=scratch`);
  const pubd = await pub.json();
  const found = (pubd.products ?? []).find((p) => p.slug === "qa-scratch-item");
  check("published scratch product visible publicly at ₹149", !!found && found.price === 149, found ? `₹${found.price}` : "not found");
  const variants = await api(`/api/admin/products/${scratchId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    name: "QA Scratch Item (edited)", slug: "qa-scratch-item",
    description: "Temporary QA product used to verify the edit workflow.",
    categoryId: cats[0].id, source: "HQ_ORIGINAL", price: 149, compareAtPrice: null,
    colors: [], sizes: ["S", "M"], images: ["/images/p-classic-black-1.jpg"],
    featured: false, visible: false, badge: "", stock: 5, fabricDetails: "", careInstructions: "",
  })});
  check("colour-less variant sync OK (hidden save)", variants.res.status === 200, `status ${variants.res.status}`);
}

// ── 6. Image upload ────────────────────────────────────────────────────
console.log("\n[6] Image upload");
{
  // 1x1 red PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const tmp = join(tmpdir(), "qa-upload.png");
  await writeFile(tmp, png);
  const form = new FormData();
  form.append("files", new Blob([png], { type: "image/png" }), "qa-sample.png");
  const res = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: { Cookie: COOKIE }, body: form });
  const d = await res.json();
  check("upload accepted", res.status === 200 && d.urls?.length === 1, `status ${res.status} urls=${JSON.stringify(d.urls)}`);
  if (d.urls?.[0]) {
    const img = await fetch(`${BASE}${d.urls[0]}`);
    const saved = Buffer.from(await img.arrayBuffer());
    check("uploaded file served byte-identical (no recompression)", img.status === 200 && saved.equals(png), `${saved.length} bytes`);
    const reject = new FormData();
    reject.append("files", new Blob([Buffer.from("not an image")], { type: "text/plain" }), "evil.txt");
    const rej = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: { Cookie: COOKIE }, body: reject });
    check("non-image upload rejected", rej.status === 400, `status ${rej.status}`);
    const noAuth = await fetch(`${BASE}/api/admin/upload`, { method: "POST", body: form });
    check("upload requires admin session", noAuth.status === 401, `status ${noAuth.status}`);
    await rm(resolve(process.cwd(), "public", d.urls[0].replace(/^\//, "")), { force: true });
  }
}

// ── 7. Delete scratch ──────────────────────────────────────────────────
console.log("\n[7] Cleanup scratch product");
{
  const del = await api(`/api/admin/products/${scratchId}`, { method: "DELETE" });
  check("scratch deleted", del.res.status === 200, `status ${del.res.status}`);
  const after = (await api("/api/admin/products")).data?.products ?? [];
  check("25 products remain (scratch gone, imports intact)", after.length === 25, `got ${after.length}`);
}

// ── 8. Sitemap ─────────────────────────────────────────────────────────
console.log("\n[8] Sitemap");
{
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check("sitemap excludes hidden catalogue products", !sm.includes("luxury-organza"), sm.includes("luxury-organza") ? "leaked!" : "");
}

console.log(`\n═══ QA RESULT: ${pass} passed, ${fail} failed ═══`);
process.exit(fail ? 1 : 0);
