// DevTools-protocol helpers for the chrome-dev browser (see ~/.local/bin/chrome-dev).
// Used by the integration tests and by the gmail-ui skill's scripts.
export const CDP = `http://127.0.0.1:${process.env.CHROME_DEV_PORT || 9222}`;

// Attach to the first page tab whose URL contains `match`.
export async function connect(match) {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  const t = targets.find((t) => t.type === "page" && t.url.includes(match));
  if (!t) throw new Error(`no page matching ${match}`);
  return attach(t);
}

// Open `url` in a new tab; close() closes the tab.
export async function openTab(url) {
  const t = await (
    await fetch(`${CDP}/json/new?${url.replace(/#/g, "%23")}`, { method: "PUT" })
  ).json();
  const page = await attach(t);
  // Clipboard APIs need a focused document; a tab driven from here usually isn't.
  await page.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await page.send("Browser.grantPermissions", {
    origin: new URL(url).origin,
    permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
  });
  const close = page.close;
  page.close = async () => {
    close();
    await fetch(`${CDP}/json/close/${t.id}`);
  };
  return page;
}

async function attach(t) {
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Set();
  // A navigation or tab close drops the socket; fail in-flight calls instead of hanging.
  ws.addEventListener("close", () =>
    pending.forEach((fail) => fail(new Error("CDP connection closed"))),
  );
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.add(reject);
      const onMessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id !== i) return;
        ws.removeEventListener("message", onMessage);
        pending.delete(reject);
        d.error ? reject(new Error(d.error.message)) : resolve(d.result);
      };
      ws.addEventListener("message", onMessage);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails)
      throw new Error(
        exceptionDetails.exception?.description || exceptionDetails.text,
      );
    return result.value;
  };
  // Real mouse press/release at the element's center; Gmail ignores many synthetic .click()s.
  const click = async (selector) => {
    const pos = await evaluate(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) return null;
      e.scrollIntoView({ block: "center" });
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!pos) throw new Error(`no element for ${selector}`);
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
      await send("Input.dispatchMouseEvent", {
        type,
        x: pos.x,
        y: pos.y,
        button: "left",
        clickCount: 1,
      });
  };
  return { send, evaluate, click, close: () => ws.close() };
}
