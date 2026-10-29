// Gmail-specific helpers for the integration tests. Tests run against the real,
// signed-in Gmail in chrome-dev, in their own tabs, and only open threads that
// are already read so nothing in the mailbox changes.
import { setTimeout as sleep } from "node:timers/promises";
import { CDP, openTab } from "./cdp.mjs";

export const GMAIL = "https://mail.google.com/mail/u/0/";
export { sleep };

export async function assertBrowser() {
  try {
    await fetch(`${CDP}/json/version`);
  } catch {
    throw new Error(
      "chrome-dev is not running. Build and launch it first:\n" +
        "  npx webpack --no-watch && chrome-dev --restart --ext . https://mail.google.com",
    );
  }
}

// Resolves to the value of `expr` once it is truthy, or throws after `ms`.
// Only Gmail's own boot-time reloads (which destroy the JS context) are retried;
// any other error in `expr` is thrown as is.
export async function waitFor(page, expr, what = expr, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(250)) {
    try {
      // Elements can't cross CDP by value; report them as true.
      const v = await page.evaluate(
        `(() => { const v = ${expr}; return v instanceof Node ? true : v; })()`,
      );
      if (v) return v;
    } catch (err) {
      if (!/context|navigated/i.test(err.message)) throw err;
    }
  }
  throw new Error(`timed out waiting for ${what}`);
}

// A fresh tab on a Gmail view, with the list loaded and the extension active.
export async function openGmail(hash = "#inbox") {
  const page = await openTab(GMAIL + hash);
  await waitFor(
    page,
    `document.querySelector("[role=main] tr[role=row]")`,
    "message list",
  );
  await waitFor(
    page,
    `document.querySelector("style[data-better-email]")`,
    "extension styles (is the extension loaded in chrome-dev?)",
  );
  return page;
}

export async function openSearch(page, query) {
  await page.evaluate(
    `location.hash = "#search/" + encodeURIComponent(${JSON.stringify(query)})`,
  );
  // The previous view's rows linger until results render; wait for the title.
  await waitFor(
    page,
    `document.title.startsWith("Search results") && document.querySelector("[role=main] tr[role=row]")`,
    `results for ${query}`,
  );
}

// Opens the newest already-read thread without drafts in this tab, so nothing
// gets marked read and no draft editor pops open.
const READ_THREADS = "is:read -in:drafts -from:me";

export async function openReadThread(page) {
  await openSearch(page, READ_THREADS);
  const picked = await page.evaluate(`(() => {
    const row = [...document.querySelectorAll("[role=main] tr[role=row]")].find(
      (r) => r.getClientRects().length && !/\\bDraft\\b/.test(r.innerText));
    row?.setAttribute("data-bg-test-target", "");
    return !!row;
  })()`);
  if (!picked) throw new Error(`no thread matching "${READ_THREADS}"`);
  await page.click("[data-bg-test-target]");
  await waitFor(
    page,
    `document.querySelector("button.bg-permalink")`,
    "open thread",
  );
}

// "visible" | "hidden" | "absent" for the first element matching `selector`.
export function visibility(page, selector) {
  return page.evaluate(`(() => {
    const e = document.querySelector(${JSON.stringify(selector)});
    if (!e) return "absent";
    return e.getClientRects().length && getComputedStyle(e).visibility !== "hidden"
      ? "visible"
      : "hidden";
  })()`);
}

// Waits for the extension's copy toast to show `text`, then returns the clipboard.
export async function copiedText(page, text) {
  await waitFor(
    page,
    `document.querySelector(".bg-toast[data-visible]")?.textContent.includes(${JSON.stringify(text)})`,
    `toast for ${text}`,
    5000,
  );
  return page.evaluate(`navigator.clipboard.readText()`);
}
