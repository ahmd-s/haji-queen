#!/usr/bin/env python3
"""Finalize curated images into public/images with web-optimized sizes."""
import os, shutil
from PIL import Image

CAND = "/tmp/imgsearch/candidates"
OUT = "/home/z/my-project/public/images"
os.makedirs(OUT, exist_ok=True)

MAP = {
    "hero-main.jpg": "abaya_embroidered_1",
    "story-duo.jpg": "hero_4",
    "cat-abayas-tile.jpg": "abaya_embroidered_5",
    "cat-maxis-tile.jpg": "maxi_floral_2",
    "cat-indo-tile.jpg": "indo_fusion_1",
    "cat-corporate-tile.jpg": "corporate_1",
    "banner-abayas.jpg": "abaya_embroidered_3",
    "banner-maxis.jpg": "maxi_minimal_5",
    "banner-indo.jpg": "indo_kurta_4",
    "banner-corporate.jpg": "corporate2_0",
    "p-classic-black-1.jpg": "abaya_black_1",
    "p-classic-black-2.jpg": "abaya_black_2",
    "p-everyday-minimal.jpg": "abaya_minimal_0",
    "p-embroidered-occasion.jpg": "abaya_embroidered_0",
    "p-premium-layered-1.jpg": "abaya_layered_1",
    "p-premium-layered-2.jpg": "abaya_layered_3",
    "p-champagne-satin.jpg": "abaya_minimal_2",
    "p-floral-maxi.jpg": "maxi_floral_0",
    "p-blush-floral.jpg": "maxi_floral_4",
    "p-satin-evening.jpg": "dress_pleated_2",
    "p-minimal-everyday-1.jpg": "maxi_minimal_0",
    "p-minimal-everyday-2.jpg": "maxi_minimal_2",
    "p-pleated-occasion.jpg": "maxi_minimal_1",
    "p-fusion-set.jpg": "indo_fusion_0",
    "p-kurta-coord.jpg": "indo_kurta_3",
    "p-modern-layered.jpg": "indo_kurta_5",
    "p-terracotta-kurta.jpg": "indo_kurta_4",
    "p-marigold-set.jpg": "indo_fusion_2",
    "p-tailored-workwear-1.jpg": "corporate_0",
    "p-tailored-workwear-2.jpg": "corporate2_5",
    "p-office-coord.jpg": "corporate2_1",
    "p-formal-suit.jpg": "corporate_4",
    "p-blazer-set.jpg": "corporate_3",
    "story-atelier-1.jpg": "atelier_4",
    "story-atelier-2.jpg": "atelier_2",
    "story-atelier-3.jpg": "atelier_5",
    "ig-1.jpg": "abaya_embroidered_2",
    "ig-2.jpg": "abaya_minimal_1",
    "ig-3.jpg": "corporate_2",
    "ig-4.jpg": "maxi_floral_3",
    "ig-5.jpg": "maxi_minimal_4",
    "ig-6.jpg": "indo_kurta_1",
}

def find_candidate(stem):
    for ext in (".jpg", ".png", ".jpeg", ".webp"):
        p = os.path.join(CAND, stem + ext)
        if os.path.exists(p):
            return p
    return None

report = []
for out_name, stem in MAP.items():
    src = find_candidate(stem)
    if not src:
        report.append(f"MISSING {out_name} <- {stem}")
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if max(w, h) > 1600:
        scale = 1600 / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    dst = os.path.join(OUT, out_name)
    im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    kb = os.path.getsize(dst) // 1024
    report.append(f"OK {out_name} {im.size[0]}x{im.size[1]} {kb}KB <- {stem}")

# OG image: 1200x630 center-crop of hero
hero = Image.open(os.path.join(OUT, "hero-main.jpg"))
w, h = hero.size
target = 1200 / 630
if w / h > target:
    nw = int(h * target)
    x0 = (w - nw) // 2
    hero = hero.crop((x0, 0, x0 + nw, h))
else:
    nh = int(w / target)
    y0 = (h - nh) // 3
    hero = hero.crop((0, y0, w, y0 + nh))
hero = hero.resize((1200, 630), Image.LANCZOS)
hero.save(os.path.join(OUT, "og-image.jpg"), "JPEG", quality=85)
report.append("OK og-image.jpg 1200x630")

print("\n".join(report))
total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f"TOTAL {len(os.listdir(OUT))} files, {total // 1024} KB")
