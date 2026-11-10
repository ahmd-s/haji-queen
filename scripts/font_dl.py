#!/usr/bin/env python3
"""Download latin woff2 fonts from Google Fonts CSS for next/font/local."""
import re, os, urllib.request

CSS = open("/tmp/fonts.css", encoding="utf-8").read()
OUT = "/home/z/my-project/public/fonts"
os.makedirs(OUT, exist_ok=True)

# Split into (subset_comment, block) pairs
blocks = re.findall(r"/\* ([a-z0-9-]+) \*/\s*(@font-face\s*\{[^}]+\})", CSS)
downloaded = set()
for subset, block in blocks:
    if subset != "latin":
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    style = re.search(r"font-style:\s*(\w+)", block).group(1)
    weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
    url = re.search(r"url\((https[^)]+\.woff2)\)", block).group(1)
    slug = fam.lower().replace(" ", "-")
    # Manrope is variable: one file per subset for all weights
    name = f"{slug}-{style}-{weight}.woff2" if slug != "manrope" else f"{slug}-{style}.woff2"
    if name in downloaded:
        continue
    path = os.path.join(OUT, name)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
        f.write(r.read())
    downloaded.add(name)
    print(f"OK {name} {os.path.getsize(path)//1024}KB")
print("DONE")
