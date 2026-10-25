// Shared DevTools-protocol connection to the chrome-dev browser.
// connect(match) attaches to the first page tab whose URL contains `match`.
export const CDP = `http://127.0.0.1:${process.env.CHROME_DEV_PORT || 9222}`;

export async function connect(match) {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  const t = targets.find((t) => t.type === "page" && t.url.includes(match));
  if (!t) {
    console.error("no page matching", match);
    process.exit(1);
  }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Set();
  // A navigation or tab close drops the socket; fail in-flight calls instead of hanging.
  ws.addEventListener("close", () => pending.forEach((fail) => fail(new Error("CDP connection closed"))));
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
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  };
  return { send, evaluate, close: () => ws.close() };
}
