// usage: node click.mjs <url-substring> <css-selector | text:Exact text>
// Sends a real mouse press/release at the element's center (Gmail ignores many synthetic .click() calls).
import { connect } from "./cdp.mjs";

const [match, target] = process.argv.slice(2);
const { send, evaluate, close } = await connect(match);
// text: walks text nodes instead of reading innerText on every element (which forces layout).
const find = target.startsWith("text:")
  ? `(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, hit;
      while ((n = w.nextNode())) if (n.nodeValue.trim() === ${JSON.stringify(target.slice(5))}) hit = n.parentElement;
      return hit; })()`
  : `document.querySelector(${JSON.stringify(target)})`;
const pos = await evaluate(`(() => { const e = ${find}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: e.tagName }; })()`);
if (!pos) {
  console.error("no element for", target);
  process.exit(1);
}
for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
  await send("Input.dispatchMouseEvent", { type, x: pos.x, y: pos.y, button: "left", clickCount: 1 });
console.log("clicked", pos);
close();
