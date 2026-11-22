#!/bin/bash
# Fires parallel image searches for Haji Queens imagery curation
cd /tmp/imgsearch

declare -A QUERIES=(
  [hero]="elegant modest fashion editorial campaign, woman in flowing abaya, luxury fashion photography"
  [abaya_black]="luxury black abaya fashion photography model editorial"
  [abaya_minimal]="minimal beige abaya neutral tones modest fashion photography"
  [abaya_embroidered]="embroidered occasion abaya luxury detail fashion photography"
  [abaya_layered]="layered abaya cape fashion editorial photography"
  [maxi_floral]="elegant floral maxi dress modest fashion editorial photography"
  [maxi_satin]="satin evening maxi dress elegant luxury fashion photography"
  [maxi_minimal]="minimal modest maxi dress neutral beige fashion editorial"
  [dress_pleated]="pleated occasion long dress elegant fashion photography"
  [indo_fusion]="indo western fusion fashion woman kurta set editorial photography"
  [indo_kurta]="indian ethnic wear woman elegant kurta co-ord set fashion"
  [corporate]="modest professional workwear woman blazer fashion editorial"
  [corporate2]="elegant business attire woman tailored suit hijab fashion"
  [atelier]="fashion atelier fabric draping designer studio elegant craft"
)

for key in "${!QUERIES[@]}"; do
  z-ai image-search -q "${QUERIES[$key]}" -c 6 --gl us --no-rank > "/tmp/imgsearch/${key}.json" 2>"/tmp/imgsearch/${key}.err" &
done
wait
echo "ALL_SEARCHES_DONE"
ls -la /tmp/imgsearch/*.json | wc -l
