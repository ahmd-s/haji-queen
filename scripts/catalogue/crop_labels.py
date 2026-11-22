"""Crop the supplier colour-label region (top-left band) from each product PNG
at full resolution and tile them into readable composite sheets."""
from pathlib import Path
from PIL import Image, ImageDraw

SRC = Path("/home/z/my-project/catalogue_download/extracted/02_PRODUCT_IMAGES")
OUT1 = Path("/home/z/my-project/catalogue_download/labels_ab233_ab234.jpg")
OUT2 = Path("/home/z/my-project/catalogue_download/labels_ab222.jpg")

def build(files, out, cols=2, band=0.22):
    crops = []
    for f in files:
        im = Image.open(f).convert("RGB")
        w, h = im.size
        b = band
        band_top = im.crop((0, 0, int(w * 0.55), int(h * b)))
        band_top = band_top.resize((640, int(band_top.height * 640 / band_top.width)))
        crops.append((f.stem, band_top))
    rows = (len(crops) + cols - 1) // cols
    cw, ch = 660, crops[0][1].height + 26
    sheet = Image.new("RGB", (cols * cw, rows * ch), "white")
    d = ImageDraw.Draw(sheet)
    for i, (name, band_img) in enumerate(crops):
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(band_img, (x + 10, y))
        d.text((x + 12, y + band_img.height + 4), name, fill="black")
    sheet.save(out, quality=85)
    print(f"{out} -> {sheet.size}, {len(crops)} labels")

ab233_04 = [SRC / "ABAYAS" / "AB-233" / "AB-233-04.png"]
ab234 = sorted((SRC / "ABAYAS" / "AB-234").glob("*.png"))
ab222 = sorted((SRC / "INDO_WESTERN" / "AB-222").glob("*.png"))
build(ab233_04 + ab234, OUT1, cols=1)
build(ab222, OUT2, cols=2)
