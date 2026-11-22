#!/usr/bin/env python3
"""Download image-search candidates and build contact sheets for curation."""
import json, os, sys, urllib.request, io
from PIL import Image, ImageDraw, ImageFont

SRC = "/tmp/imgsearch"
CAND = os.path.join(SRC, "candidates")
SHEETS = os.path.join(SRC, "sheets")
os.makedirs(CAND, exist_ok=True)
os.makedirs(SHEETS, exist_ok=True)

manifest = []
for fn in sorted(os.listdir(SRC)):
    if not fn.endswith(".json"):
        continue
    key = fn[:-5]
    try:
        raw = open(os.path.join(SRC, fn), encoding="utf-8", errors="ignore").read()
        start = raw.find("{")
        data = json.loads(raw[start:])
    except Exception as e:
        print(f"PARSE_FAIL {key}: {e}")
        continue
    if not data.get("success"):
        print(f"SEARCH_FAIL {key}")
        continue
    for i, r in enumerate(data.get("results", [])):
        url = r.get("original_url")
        if not url:
            continue
        manifest.append({"key": key, "idx": i, "url": url,
                         "w": r.get("original_width", ""), "h": r.get("original_height", "")})

print(f"total candidates: {len(manifest)}")

# Download
ok = []
for m in manifest:
    name = f"{m['key']}_{m['idx']}"
    path = os.path.join(CAND, name + ".img")
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        ok.append({**m, "path": path})
        continue
    try:
        req = urllib.request.Request(m["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
        if len(data) < 8000:
            continue
        img = Image.open(io.BytesIO(data))
        img.load()
        ext = "png" if img.format == "PNG" else "jpg"
        final = os.path.join(CAND, f"{name}.{ext}")
        os.rename(path, final) if os.path.exists(path) else None
        with open(final, "wb") as f:
            f.write(data)
        ok.append({**m, "path": final, "size": img.size})
        print(f"OK {name} {img.size}")
    except Exception as e:
        print(f"DL_FAIL {name}: {type(e).__name__}")

json.dump(ok, open(os.path.join(SRC, "ok.json"), "w"), indent=1)

# Contact sheets: thumb 220x280, label with short id
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
except Exception:
    font = ImageFont.load_default()

TH_W, TH_H, PER_ROW = 220, 280, 7
items = ok[:]
sheets = []
for si in range(0, len(items), 35):
    chunk = items[si:si + 35]
    rows = (len(chunk) + PER_ROW - 1) // PER_ROW
    sheet = Image.new("RGB", (PER_ROW * TH_W, rows * (TH_H + 26)), "#f2f2f2")
    d = ImageDraw.Draw(sheet)
    for j, it in enumerate(chunk):
        try:
            im = Image.open(it["path"]).convert("RGB")
        except Exception:
            continue
        im.thumbnail((TH_W - 8, TH_H - 8))
        x = (j % PER_ROW) * TH_W
        y = (j // PER_ROW) * (TH_H + 26)
        sheet.paste(im, (x + (TH_W - im.width) // 2, y + (TH_H - im.height) // 2))
        label = os.path.basename(it["path"]).rsplit(".", 1)[0]
        d.text((x + 6, y + TH_H + 3), label, fill="#111", font=font)
    out = os.path.join(SHEETS, f"sheet_{si // 35}.jpg")
    sheet.save(out, quality=82)
    sheets.append(out)
    print("SHEET", out, len(chunk))
print("DONE")
