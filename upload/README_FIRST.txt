HAJI QUEENS — MASTER PRODUCT CATALOGUE V1.1

PURPOSE
This is the consolidated product-data and image handoff pack for the Haji Queens ecommerce website. It combines supplier-source records, product images, a master Excel workbook, CSV import data and GLM instructions.

FOLDER GUIDE
01_PRODUCT_DATA/MASTER_PRODUCT_CATALOGUE.xlsx — working master workbook.
01_PRODUCT_DATA/MASTER_PRODUCT_CATALOGUE.csv — machine-readable master CSV.
02_PRODUCT_IMAGES/ — product images grouped by product ID. Filenames are stable and product-specific.
03_SUPPLIER_CATALOGUE_SOURCE/ — WhatsApp screenshots and source note; reference only.
04_BRAND_ASSETS/ — approved brand assets (currently awaiting logo/brand files).
05_IMPORT_READY/ — copy of CSV/XLSX for GLM import review.
06_ARCHIVE/ — superseded versions.

PRODUCTS INCLUDED
AB-234 — Luxury Organza Shrug Style Abaya.
AB-233 — Elegant Shrug Style Kaftan Abaya.
AB-222 — Elegant Coat Set.
HQ-ST-001 — Embroidered Sleeve Skirt & Top Set (latest user-supplied images and prebooking details).
HQ-EID-001 — Eid Arrival Custom Inner Shrug Skirt Set (source screenshot only; standalone images pending).
HQ-ST-002 — Embroidery Skirt Top with Inner (source screenshot only; standalone images pending).

IMPORTANT DATA RULES
1. All records currently have is_published=FALSE. Do not publish until manually reviewed and approved.
2. Supplier quoted prices are captured separately from wholesale cost and customer-facing selling price. The website price remains blank until Haji Queens markup/pricing is confirmed.
3. Supplier identities, supplier codes, wholesale cost and internal notes must remain private/server-side. Never expose these fields in public APIs, browser payloads, HTML, page source or customer exports.
4. Product IDs HQ-ST-001, HQ-EID-001 and HQ-ST-002 are provisional internal IDs created because supplier design numbers were not supplied. Replace only if the client supplies official design numbers; maintain mapping.
5. Do not assume accessories shown in photos are included unless confirmed.
6. Do not infer missing measurements, fabric composition, exact colour names, shipping geography or surcharge amounts.
7. Product images are stored as PNG originals. Do not recompress or crop without keeping originals.
8. Six photos are supplied for HQ-ST-001. AB-233 has six supplied images against eight stated colours. AB-222 has ten supplied images against nine stated colours. Verify image-to-colour mapping.
9. HQ-EID-001 and HQ-ST-002 have only screenshot-level imagery in the source archive; request standalone images before website import.

PRICING INTERPRETATION
The source prices (₹2,550, ₹1,800, ₹1,700, ₹1,999, ₹2,299, ₹2,399) are recorded as supplier/source quotes, not approved Haji Queens website prices. “Dealership 50 less” is ambiguous and must not be treated as a confirmed wholesale cost or margin.

GLM HANDOFF
Provide this complete folder/ZIP and the existing website codebase to GLM. Ask it to inspect the workbook, CSV, image folders and source screenshots; validate product IDs, image mapping and required fields; preserve existing website architecture; and produce a validation report before import. Import only manually approved rows with is_published=TRUE.
