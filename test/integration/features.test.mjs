// End-to-end checks for the features the extension adds. These copy to the
// system clipboard.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { openTab } from "./cdp.mjs";
import {
  assertBrowser,
  openGmail,
  openReadThread,
  readClipboard,
  settle,
  waitFor,
} from "./gmail.mjs";

describe("footer (hideFooterLinks)", () => {
  let page;
  before(async () => {
    await assertBrowser();
    page = await openGmail("#inbox");
  });
  after(() => page?.close());

  test("activity sits on one line at the right edge", async () => {
    const box = await page.evaluate(`(() => {
      const footer = document.querySelector("[role=contentinfo]");
      footer.scrollIntoView({ block: "end" });
      const leaf = [...footer.querySelectorAll("div")].find(
        (e) => !e.children.length && e.textContent.startsWith("Last account activity"));
      const line = leaf.parentElement.getBoundingClientRect();
      const f = footer.getBoundingClientRect();
      return { gapRight: Math.round(f.right - line.right), height: Math.round(line.height),
        lineHeight: Math.round(leaf.getBoundingClientRect().height) };
    })()`);
    assert.ok(box.gapRight < 40, `activity is ${box.gapRight}px from the right edge`);
    assert.ok(box.height <= box.lineHeight * 1.5, `activity wraps (${box.height}px tall)`);
  });
});

describe("thread features", () => {
  let page;
  before(async () => {
    await assertBrowser();
    page = await openGmail("#inbox");
    await openReadThread(page);
  });
  after(() => page?.close());

  test("copy permalink copies a link that opens the same thread", async () => {
    const subject = await page.evaluate(
      `document.querySelector("h2[data-legacy-thread-id]").textContent`,
    );
    await waitFor(page, `document.querySelector("button.bg-permalink")`, "permalink button");
    await page.click("button.bg-permalink");
    await settle(page, 300);

    const link = await readClipboard(page);
    assert.match(link, /^https:\/\/mail\.google\.com\/mail\/\?authuser=[^#]+#all\/[0-9a-f]+$/);
    const toast = await page.evaluate(`document.querySelector(".bg-toast")?.innerText`);
    assert.ok(toast?.includes(link), "toast shows the copied link");

    // A cold load in a fresh tab is what a pasted link gets; /u/<email>/ 404ed here.
    const fresh = await openTab(link);
    try {
      const opened = await waitFor(
        fresh,
        `document.querySelector("h2[data-legacy-thread-id]")?.textContent`,
        "thread from permalink",
      );
      assert.equal(opened, subject);
    } finally {
      await fresh.close();
    }
  });

  test("contact card copy button copies the sender's address", async (t) => {
    const email = await page.evaluate(`document.querySelector("[role=main] span[email]")?.getAttribute("email")`);
    assert.ok(email, "sender address on the open thread");
    await page.evaluate(`location.hash = "#search/from%3A" + encodeURIComponent(${JSON.stringify(email)})`);
    await waitFor(page, `location.hash.startsWith("#search/from") && document.querySelector("[role=main] tr[role=row]")`, "search results");
    await settle(page);
    const hasCard = await page.evaluate(`!!document.querySelector("span.DQ")`);
    if (!hasCard) return t.skip(`Gmail showed no contact card for ${email}`);

    await waitFor(page, `document.querySelector("button.bg-copy-email")`, "copy email button");
    await page.click("button.bg-copy-email");
    await settle(page, 300);
    assert.equal(await readClipboard(page), email);
    assert.ok(
      !(await page.evaluate(`location.href.includes("compose=")`)),
      "clicking copy must not open a new message",
    );
  });
});
