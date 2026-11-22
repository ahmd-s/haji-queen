#!/bin/bash
# Sequential image searches with retry (parallel triggers gateway rate limits)
cd /tmp/imgsearch
declare -A QUERIES=(
  [hero]="elegant modest fashion editorial campaign, woman in flowing abaya, luxury fashion photography"
  [abaya_black]="luxury black abaya fashion photography model editorial"
  [abaya_minimal]="minimal beige abaya neutral tones modest fashion photography"
  [abaya_embroidered]="embroidered occasion abaya luxury fashion detail photography"
  [maxi_floral]="elegant floral maxi dress modest fashion editorial photography"
  [maxi_satin]="satin evening maxi dress elegant luxury fashion photography"
  [maxi_minimal]="minimal modest maxi dress neutral beige fashion editorial"
  [indo_fusion]="indo western fusion fashion woman kurta set editorial photography"
  [indo_kurta]="indian ethnic wear woman elegant kurta co-ord set fashion"
  [corporate]="modest professional workwear woman blazer fashion editorial"
  [corporate2]="elegant business attire woman tailored suit hijab fashion"
  [atelier]="fashion atelier fabric draping designer studio elegant craft"
)

search_one() {
  local key=$1 q=$2 attempt=1
  while [ $attempt -le 3 ]; do
    z-ai image-search -q "$q" -c 6 --gl us --no-rank > "/tmp/imgsearch/${key}.json" 2>"/tmp/imgsearch/${key}.err"
    if grep -q '"success": true' "/tmp/imgsearch/${key}.json"; then
      echo "OK $key (attempt $attempt)"
      return 0
    fi
    echo "RETRY $key attempt $attempt"
    sleep 20
    attempt=$((attempt+1))
  done
  echo "FAIL $key"
}

for key in "${!QUERIES[@]}"; do
  if [ -f "/tmp/imgsearch/${key}.json" ] && grep -q '"success": true' "/tmp/imgsearch/${key}.json"; then
    echo "SKIP $key (already ok)"
    continue
  fi
  search_one "$key" "${QUERIES[$key]}"
  sleep 8
done
echo "ALL_DONE"
