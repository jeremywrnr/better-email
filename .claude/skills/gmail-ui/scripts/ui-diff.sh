#!/usr/bin/env bash
# usage: ui-diff.sh <outdir> [url]
# Relaunches chrome-dev with the extension OFF, then ON, and captures Gmail at the
# top and scrolled to the footer. Writes {off,on}-{top,bottom}.png plus
# side-by-side diff-{top,bottom}.png (off | on | changed pixels in red).
# Leaves chrome-dev running with the extension ON. Needs ImageMagick (`magick`).
set -euo pipefail

OUT="$1"
URL="${2:-https://mail.google.com/mail/u/0/#inbox}"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
mkdir -p "$OUT"

wait_ready() {
  for _ in {1..60}; do
    if node "$HERE/eval.mjs" mail.google.com '!!document.querySelector("[role=contentinfo]") && !!document.querySelector("[role=main] tr")' 2>/dev/null | grep -q true; then
      sleep 3 # let the extension's timers and Gmail's lazy UI settle
      return
    fi
    sleep 1
  done
  echo "Gmail did not finish loading" >&2
  exit 1
}

capture() {
  local mode="$1"
  if [[ "$mode" == on ]]; then
    chrome-dev --restart --ext "$REPO" "$URL" >/dev/null
  else
    (cd / && chrome-dev --restart "$URL" >/dev/null)
  fi
  wait_ready
  node "$HERE/eval.mjs" mail.google.com '[...document.querySelectorAll("*")].forEach(e => { if (e.scrollTop) e.scrollTop = 0 })' >/dev/null
  sleep 1
  node "$HERE/screenshot.mjs" mail.google.com "$OUT/$mode-top.png" 0 >/dev/null
  node "$HERE/eval.mjs" mail.google.com 'document.querySelector("[role=contentinfo]").scrollIntoView({block: "end"})' >/dev/null
  sleep 1
  node "$HERE/screenshot.mjs" mail.google.com "$OUT/$mode-bottom.png" 0 >/dev/null
  echo "captured $mode"
}

capture off
capture on

for view in top bottom; do
  magick compare -metric AE -fuzz 2% "$OUT/off-$view.png" "$OUT/on-$view.png" "$OUT/delta-$view.png" 2>"$OUT/ae-$view.txt" || true
  magick "$OUT/off-$view.png" "$OUT/on-$view.png" "$OUT/delta-$view.png" +append -resize 50% "$OUT/diff-$view.png"
  echo "$view: $(cat "$OUT/ae-$view.txt") pixels differ -> $OUT/diff-$view.png"
done
