// usage: node click.mjs <url-substring> <css-selector | text:Exact text>
// Sends a real mouse press/release at the element's center (Gmail ignores many synthetic .click() calls).
const [match, target] = process.argv.slice(2);
const t = (await (await fetch("http://127.0.0.1:9222/json/list")).json()).find((t) => t.type === "page" && t.url.includes(match));
if (!t) { console.error("no page matching", match); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const send = (method, params) => new Promise((res) => {
  const i = ++id;
  const h = (m) => { const d = JSON.parse(m.data); if (d.id === i) { ws.removeEventListener("message", h); res(d.result); } };
  ws.addEventListener("message", h);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const find = target.startsWith("text:")
  ? `[...document.querySelectorAll("body *")].filter(e => e.innerText?.trim() === ${JSON.stringify(target.slice(5))}).pop()`
  : `document.querySelector(${JSON.stringify(target)})`;
const { result } = await send("Runtime.evaluate", { expression: `(() => { const e = ${find}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: e.tagName }; })()`, returnByValue: true });
if (!result.value) { console.error("no element for", target); process.exit(1); }
const { x, y } = result.value;
for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
  await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
console.log("clicked", result.value);
ws.close();
