// usage: node screenshot.mjs <url-substring> <out.png> [height]
// Captures the top of the viewport (default 120px, enough for Gmail's top bar), or the full viewport if height=0.
const [match, out, h = "120"] = process.argv.slice(2);
const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const t = targets.find((t) => t.type === "page" && t.url.includes(match));
if (!t) { console.error("no page matching", match); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
const params = { format: "png" };
if (Number(h) > 0) params.clip = { x: 0, y: 0, width: 2000, height: Number(h), scale: 1 };
ws.send(JSON.stringify({ id: 1, method: "Page.captureScreenshot", params }));
ws.addEventListener("message", async (m) => {
  const d = JSON.parse(m.data);
  if (d.id === 1) { (await import("fs")).writeFileSync(out, Buffer.from(d.result.data, "base64")); console.log(out); ws.close(); }
});
