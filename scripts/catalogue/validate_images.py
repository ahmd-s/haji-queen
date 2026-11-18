"""Validate the 26 extracted catalogue PNGs, copy them into the site's
public/images/products/ (original bytes untouched), build a one-shot contact
sheet for visual review, and print dominant-colour hints for the
image-to-colour mapping questions.

Checks per file: opens as PNG, reasonable dimensions, not blank/near-blank,
not corrupt.
"""
import shutil
from pathlib import Path
from PIL import Image

SRC = Path("/home/z/my-project/catalogue_download/extracted/02_PRODUCT_IMAGES")
DEST = Path("/home/z/my-project/public/images/products")
SHEET = Path("/home/z/my-project/catalogue_download/contact_sheet.jpg")

EXPECTED = {
    "AB-234": 4, "AB-233": 6, "AB-222": 10, "HQ-ST-001": 6,
}

files = sorted(SRC.rglob("*.png"))
print(f"Found {len(files)} PNG files")

ok, bad = [], []
for f in files:
    stem = f.stem  # e.g. AB-234-01
    product_id = stem.rsplit("-", 1)[0]
    try:
        im = Image.open(f)
        im.load()
        rgb = im.convert("RGB")
        # dominant colour (coarse): downsample and average
        small = rgb.resize((24, 24))
        pixels = list(small.getdata())
        avg = tuple(sum(c) // len(pixels) for c in zip(*pixels))
        # non-white ratio on grayscale histogram
        g = rgb.convert("L")
        hist = g.histogram()
        nonwhite = 1 - sum(hist[245:]) / max(1, sum(hist))
        info = {
            "file": f.name, "product": product_id, "size": im.size,
            "avg_rgb": avg, "nonwhite": round(nonwhite, 2),
        }
        if nonwhite < 0.02:
            bad.append((f.name, "near-blank image"))
        elif min(im.size) < 400:
            bad.append((f.name, f"too small: {im.size}"))
        else:
            ok.append(info)
    except Exception as e:
        bad.append((f.name, f"unreadable: {e}"))

# Manifest check
counts = {}
for info in ok:
    counts[info["product"]] = counts.get(info["product"], 0) + 1
print("\nPer-product count vs expected:")
manifest_ok = True
for pid, n in EXPECTED.items():
    got = counts.get(pid, 0)
    status = "OK" if got == n else "MISMATCH"
    if got != n:
        manifest_ok = False
    print(f"  {pid}: {got}/{n} {status}")

print(f"\nValid: {len(ok)}  Problems: {len(bad)}")
for name, why in bad:
    print(f"  ! {name}: {why}")

# Dominant colour hints for the mapping questions
print("\nDominant-colour hints (avg of downsampled RGB):")
for info in ok:
    r, g, b = info["avg_rgb"]
    print(f"  {info['file']}  {info['size']}  avg=({r:3d},{g:3d},{b:3d})  nonwhite={info['nonwhite']}")

# Copy originals untouched into the site images dir
DEST.mkdir(parents=True, exist_ok=True)
if ok and manifest_ok and not bad:
    for f in files:
        shutil.copy2(f, DEST / f.name)
    print(f"\nCopied {len(files)} originals -> {DEST}")
else:
    print("\nNOT copying — resolve problems first")

# Contact sheet: 26 thumbs in a grid, labelled by filename
if len(ok) == 26:
    cols, thumb_w, thumb_h, label_h = 6, 220, 220, 18
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "white")
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        im = Image.open(f).convert("RGB")
        im.thumbnail((thumb_w - 8, thumb_h - 8))
        x = (i % cols) * thumb_w
        y = (i // cols) * (thumb_h + label_h)
        sheet.paste(im, (x + (thumb_w - im.width) // 2, y + (thumb_h - im.height) // 2))
        draw.text((x + 6, y + thumb_h + 2), f.stem, fill="black")
    sheet.save(SHEET, quality=80)
    print(f"Contact sheet -> {SHEET} ({sheet.size[0]}x{sheet.size[1]})")
