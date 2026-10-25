// Gmail-specific helpers for the integration tests. Tests run against the real,
// signed-in Gmail in chrome-dev, in their own tabs, and only open threads that
// are already read so nothing in the mailbox changes.
import { CDP, openTab } from "./cdp.mjs";

export const GMAIL = "https://mail.google.com/mail/u/0/";

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
// Polls in short in-page bursts and retries across navigations (Gmail redirects
// while booting, which destroys the page's JS context mid-wait).
export async function waitFor(page, expr, what = expr, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end; ) {
    try {
      const v = await page.evaluate(`(async () => {
        for (const end = Date.now() + 2000; Date.now() < end; ) {
          // Elements can't cross CDP by value; report them as true.
          try { const v = ${expr}; if (v) return v instanceof Node ? true : v; } catch {}
          await new Promise((r) => setTimeout(r, 250));
        }
        return null;
      })()`);
      if (v) return v;
    } catch (err) {
      if (!/context|Target closed|Inspected target navigated/i.test(err.message))
        throw err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`timed out waiting for ${what}`);
}

export const settle = (page, ms = 1500) =>
  page.evaluate(`new Promise((r) => setTimeout(r, ${ms}))`);

// A fresh tab on a Gmail view, with the list loaded and the extension active.
export async function openGmail(hash = "#inbox") {
  const page = await openTab(GMAIL + hash);
  await waitFor(page, `document.querySelector("[role=main] tr")`, "message list");
  await waitFor(
    page,
    `[...document.querySelectorAll("style")].some((s) => s.textContent.includes("display: none !important"))`,
    "extension styles (is the extension loaded in chrome-dev?)",
  );
  await settle(page);
  return page;
}

// Opens the newest already-read thread in this tab.
export async function openReadThread(page) {
  await page.evaluate(`location.hash = "#search/is%3Aread"`);
  await waitFor(
    page,
    `location.hash.startsWith("#search") && document.querySelector("[role=main] tr[role=row]")`,
    "read-mail search results",
  );
  await settle(page, 500);
  await page.click("[role=main] tr[role=row]");
  await waitFor(page, `document.querySelector("h2[data-legacy-thread-id]")`, "open thread");
  await settle(page);
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

export const readClipboard = (page) =>
  page.evaluate(`navigator.clipboard.readText()`);
