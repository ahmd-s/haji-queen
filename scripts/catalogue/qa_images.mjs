/**
 * Post-image-attachment verification.
 * Run: node scripts/catalogue/qa_images.mjs
 */
const BASE = "http://localhost:3000";
if (!process.env.QA_ADMIN_COOKIE) {
  throw new Error("QA_ADMIN_COOKIE must contain a real hq_admin_session cookie value.");
}
const cookieValue = process.env.QA_ADMIN_COOKIE;
const COOKIE = cookieValue.startsWith("hq_admin_session=")
  ? cookieValue
  : `hq_admin_session=${cookieValue}`;

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`  ✓ ${name}${detail ? " — " + detail : ""}`); }
  else { fail++; console.log(`  ✗ FAIL ${name}${detail ? " — " + detail : ""}`); }
};

// 1. Public isolation unchanged
const pub = await (await fetch(`${BASE}/api/products`)).json();
check("public count still 19 (hidden products stay hidden)", (pub.products ?? []).length === 19, `got ${pub.products?.length}`);

// 2. Hidden detail pages still 404
for (const slug of ["luxury-organza-shrug-style-abaya", "elegant-shrug-style-kaftan-abaya", "elegant-coat-set", "embroidered-sleeve-skirt-top-set"]) {
  const r = await fetch(`${BASE}/product/${slug}`);
  check(`hidden page 404: ${slug}`, r.status === 404, `status ${r.status}`);
}

// 3. Images are served
const img = await fetch(`${BASE}/images/products/AB-233-01.png`);
check("catalogue image served from /images/products/", img.status === 200 && (await img.arrayBuffer()).byteLength > 1_000_000, `status ${img.status}`);

// 4. Admin sees images + confirmed colours; privacy holds
const adm = await (await fetch(`${BASE}/api/admin/products`, { headers: { Cookie: COOKIE } })).json();
const rows = adm.products ?? [];
check("admin count 25", rows.length === 25, `got ${rows.length}`);
const bySku = Object.fromEntries(rows.filter((p) => p.sku).map((p) => [p.sku, p]));
for (const [sku, n] of [["AB-234", 4], ["AB-233", 6], ["AB-222", 10], ["HQ-ST-001", 6]]) {
  const p = bySku[sku];
  check(`${sku} has ${n} images`, p?.images?.length === n, `got ${p?.images?.length}`);
  check(`${sku} still hidden with price 0`, p?.visible === false && p?.price === 0);
}
check("AB-233 colours = 6 confirmed names", bySku["AB-233"]?.colors?.length === 6, JSON.stringify((bySku["AB-233"]?.colors ?? []).map((c) => c.name)));
check("HQ-ST-001 colours = 6 confirmed combos", bySku["HQ-ST-001"]?.colors?.length === 6, JSON.stringify((bySku["HQ-ST-001"]?.colors ?? []).map((c) => c.name)));
check("AB-234 colours pending (empty)", bySku["AB-234"]?.colors?.length === 0);
check("AB-222 colours pending (empty)", bySku["AB-222"]?.colors?.length === 0);

// 5. Sitemap unchanged
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
check("sitemap excludes hidden products", !sm.includes("kaftan") && !sm.includes("organza"));

console.log(`\n═══ IMAGE QA RESULT: ${pass} passed, ${fail} failed ═══`);
process.exit(fail ? 1 : 0);
