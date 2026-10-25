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

page() { node "$HERE/eval.mjs" mail.google.com "$1" >/dev/null; }
# Resolves after two animation frames, i.e. once layout and paint have caught up.
FRAMES='new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))'

wait_ready() {
  # Retry: the tab may not exist yet, and Gmail can reload itself while booting,
  # which drops the connection mid-check.
  for _ in {1..30}; do
    # Poll inside the page instead of spawning a node process per check.
    if page '(async () => {
      for (let i = 0; i < 120; i++) {
        if (document.querySelector("[role=contentinfo]") && document.querySelector("[role=main] tr")) break;
        await new Promise(r => setTimeout(r, 500));
      }
      await new Promise(r => setTimeout(r, 2000)); // let the extension timers and lazy UI settle
    })()' 2>/dev/null; then
      return
    fi
    sleep 0.5
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
  # Gmail can restore a scrolled list; start every capture from the top.
  page "(async () => { const m = document.querySelector('[role=main]'); for (let e = m; e; e = e.parentElement) e.scrollTop = 0; await $FRAMES; })()"
  node "$HERE/screenshot.mjs" mail.google.com "$OUT/$mode-top.png" >/dev/null
  page "(async () => { document.querySelector('[role=contentinfo]').scrollIntoView({block: 'end'}); await $FRAMES; })()"
  node "$HERE/screenshot.mjs" mail.google.com "$OUT/$mode-bottom.png" >/dev/null
  echo "captured $mode"
}

capture off
capture on

for view in top bottom; do
  ae=$(magick compare -metric AE -fuzz 2% "$OUT/off-$view.png" "$OUT/on-$view.png" "$OUT/delta-$view.png" 2>&1 >/dev/null || true)
  magick "$OUT/off-$view.png" "$OUT/on-$view.png" "$OUT/delta-$view.png" +append -resize 50% "$OUT/diff-$view.png"
  echo "$view: $ae pixels differ -> $OUT/diff-$view.png"
done
