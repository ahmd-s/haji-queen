"""Convert the master catalogue XLSX into a stable JSON snapshot for the
repeatable import script. Preserves every field verbatim — no inference.

Output: /home/z/my-project/scripts/catalogue/catalogue_v1_1.json
"""
import json
import openpyxl

SRC = "/home/z/my-project/upload/MASTER_PRODUCT_CATALOGUE.xlsx"
OUT = "/home/z/my-project/scripts/catalogue/catalogue_v1_1.json"

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["Master Catalogue"]

rows = list(ws.iter_rows(values_only=True))
headers = [str(h) if h is not None else "" for h in rows[0]]

records = []
for raw in rows[1:]:
    if raw[0] is None:
        continue
    rec = {}
    for h, v in zip(headers, raw):
        if h and v is not None:
            rec[h] = str(v).strip() if not isinstance(v, (int, float)) else v
        elif h:
            rec[h] = None
    records.append(rec)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"version": "V1.1", "products": records}, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(records)} records -> {OUT}")
for r in records:
    imgs = [k for k in r if k.startswith("image_") and r[k]]
    print(f"- {r['product_id']}: {r['product_name']} | quote={r['supplier_quoted_price_inr']} | published={r['is_published']} | imgs listed={len(imgs)}")
