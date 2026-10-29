// Cold-loads a Gmail URL in a fresh chrome-dev tab and records every network
// request plus load milestones, to see what Gmail fetches while it boots.
//
//   node test/perf/inventory.mjs [--nocache] <outfile.json> [url]
//
// Prints a per-host summary; the JSON has every request and the milestone times.
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { CDP } from "#cdp";

// --nocache bypasses the HTTP cache and Gmail's service worker (a first visit).
const args = process.argv.slice(2);
const nocache = args.includes("--nocache");
const [out, url = "https://mail.google.com/mail/u/0/#inbox"] = args.filter(
  (a) => a !== "--nocache",
);
if (!out) {
  console.error("usage: inventory.mjs <outfile.json> [url]");
  process.exit(1);
}

// Runs in every document before Gmail's scripts: timestamps when the splash,
// the app shell and the first content appear, and what the splash looks like.
const RECORDER = `(() => {
  if (window.top !== window) return;
  const t = (window.__bgTrace = { marks: {}, splash: [] });
  const mark = (k) => (t.marks[k] ??= Math.round(performance.now()));
  const probes = {
    loadingEl: () => document.getElementById("loading"),
    mainRole: () => document.querySelector("[role=main]"),
    firstRow: () => document.querySelector("[role=main] tr[role=row]"),
    threadTitle: () => document.querySelector("h2[data-legacy-thread-id]"),
    messageBody: () => document.querySelector("[role=listitem] .a3s"),
    extStyle: () => document.querySelector("style[data-better-email]"),
    extPermalink: () => document.querySelector(".bg-permalink"),
  };
  const describe = (e) => e && {
    tag: e.tagName, id: e.id, cls: e.className?.baseVal ?? e.className,
    style: e.getAttribute("style"), text: e.textContent.trim().slice(0, 80),
    rect: (() => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })(),
  };
  const check = () => {
    for (const [k, f] of Object.entries(probes)) if (f()) mark(k);
    const l = document.getElementById("loading");
    if (l && t.splash.length < 40) {
      const kids = [...l.querySelectorAll("*")].map(describe);
      t.splash.push({ at: Math.round(performance.now()), display: getComputedStyle(l).display, root: describe(l), kids });
    }
    if (t.marks.loadingEl && !l) mark("loadingGone");
    else if (l && getComputedStyle(l).display === "none") mark("loadingHidden");
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
  setInterval(check, 100);
})()`;

const t = await (
  await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })
).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const waiting = new Map();
const reqs = new Map();
const docs = [];
ws.addEventListener("message", (m) => {
  const d = JSON.parse(m.data);
  if (d.id && waiting.has(d.id)) {
    waiting.get(d.id)(d.result ?? d.error);
    waiting.delete(d.id);
    return;
  }
  const p = d.params;
  switch (d.method) {
    case "Network.requestWillBeSent": {
      const r = reqs.get(p.requestId) ?? { id: p.requestId, redirects: [] };
      if (r.url) r.redirects.push(r.url);
      Object.assign(r, {
        url: p.request.url,
        method: p.request.method,
        type: p.type,
        start: p.timestamp,
        initiator: p.initiator?.url || p.initiator?.stack?.callFrames?.[0]?.url,
      });
      reqs.set(p.requestId, r);
      if (p.type === "Document") docs.push(p.request.url);
      break;
    }
    case "Network.responseReceived": {
      const r = reqs.get(p.requestId);
      if (r)
        Object.assign(r, {
          status: p.response.status,
          mime: p.response.mimeType,
          fromSW: p.response.fromServiceWorker,
          fromCache: p.response.fromDiskCache,
        });
      break;
    }
    case "Network.loadingFinished": {
      const r = reqs.get(p.requestId);
      if (r) Object.assign(r, { end: p.timestamp, bytes: p.encodedDataLength });
      break;
    }
    case "Network.loadingFailed": {
      const r = reqs.get(p.requestId);
      if (r) Object.assign(r, { end: p.timestamp, failed: p.errorText });
      break;
    }
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    waiting.set(++id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: nocache });
await send("Network.setBypassServiceWorker", { bypass: nocache });
await send("Page.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: RECORDER });
const t0 = Date.now();
await send("Page.navigate", { url });

// Wait for content, then a few seconds more to catch post-load beacons.
let trace;
for (let end = Date.now() + 45000; Date.now() < end; await sleep(250)) {
  const res = await send("Runtime.evaluate", {
    expression: "JSON.stringify(window.__bgTrace || null)",
    returnByValue: true,
  });
  trace = JSON.parse(res?.result?.value ?? "null");
  if (trace?.marks.firstRow || trace?.marks.messageBody) break;
}
await sleep(8000);
const res = await send("Runtime.evaluate", {
  expression: `JSON.stringify({ trace: window.__bgTrace, nav: performance.getEntriesByType("navigation")[0]?.toJSON(), href: location.href })`,
  returnByValue: true,
});
const page = JSON.parse(res.result.value);
await fetch(`${CDP}/json/close/${t.id}`);
ws.close();

const all = [...reqs.values()];
const base = Math.min(...all.map((r) => r.start));
for (const r of all) {
  r.startMs = Math.round((r.start - base) * 1000);
  r.endMs = r.end ? Math.round((r.end - base) * 1000) : null;
  const u = new URL(r.url);
  r.host = u.host;
  r.path = u.pathname;
}
writeFileSync(
  out,
  JSON.stringify(
    { url, wallMs: Date.now() - t0, docs, ...page, requests: all },
    null,
    2,
  ),
);

const byHost = {};
for (const r of all) {
  const h = (byHost[r.host] ??= { n: 0, kb: 0, types: new Set(), first: 1e9 });
  h.n++;
  h.kb += (r.bytes || 0) / 1024;
  h.types.add(r.type);
  h.first = Math.min(h.first, r.startMs);
}
console.log("marks (ms since navigationStart):", page.trace?.marks);
console.log("documents:", docs);
console.table(
  Object.entries(byHost)
    .sort((a, b) => b[1].kb - a[1].kb)
    .map(([host, h]) => ({
      host,
      n: h.n,
      kb: Math.round(h.kb),
      firstMs: h.first,
      types: [...h.types].join(","),
    })),
);
