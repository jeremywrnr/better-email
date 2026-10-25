// usage: node eval.mjs <url-substring> <js-expression>
const [match, expr] = process.argv.slice(2);
const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const t = targets.find((t) => t.type === "page" && t.url.includes(match));
if (!t) { console.error("no page matching", match); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } }));
ws.addEventListener("message", (m) => {
  const d = JSON.parse(m.data);
  if (d.id === 1) { console.log(JSON.stringify(d.result.result.value ?? d.result, null, 2)); ws.close(); }
});
