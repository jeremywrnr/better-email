// End-to-end checks for the features the extension adds. These copy to the
// system clipboard.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { openTab } from "./cdp.mjs";
import {
  assertBrowser,
  copiedText,
  openGmail,
  openReadThread,
  openSearch,
  waitFor,
} from "./gmail.mjs";

describe("features", () => {
  let page;
  before(async () => {
    await assertBrowser();
    page = await openGmail("#inbox");
  });
  after(() => page?.close());

  // Runs first, while the tab is still on the inbox.
  test("footer activity sits on one line at the right edge", async () => {
    await waitFor(
      page,
      `document.querySelector("[role=contentinfo]")?.textContent.includes("Last account activity")`,
      "footer activity",
    );
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
    assert.ok(
      box.gapRight < 40,
      `activity is ${box.gapRight}px from the right edge`,
    );
    assert.ok(
      box.height <= box.lineHeight * 1.5,
      `activity wraps (${box.height}px tall)`,
    );
  });

  test("copy permalink copies a link that opens the same thread", async () => {
    await openReadThread(page);
    const subject = await page.evaluate(
      `document.querySelector("h2[data-legacy-thread-id]").textContent`,
    );
    await page.click("button.bg-permalink");
    const link = await copiedText(page, "#all/");
    assert.match(
      link,
      /^https:\/\/mail\.google\.com\/mail\/\?authuser=[^#]+#all\/[0-9a-f]+$/,
    );

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

  test("permalink button shows a Gmail-style tooltip on hover", async () => {
    const button = await page.hover("button.bg-permalink");
    const tip = await waitFor(
      page,
      `(() => { const t = document.querySelector(".bg-tooltip[data-visible]");
        return t && { text: t.textContent, bottom: t.getBoundingClientRect().bottom }; })()`,
      "tooltip",
      3000,
    );
    assert.equal(tip.text, "Copy permalink");
    assert.ok(tip.bottom <= button.top, "tooltip sits above the button");
  });

  test("contact card copy button copies the sender's address", async (t) => {
    const email = await page.evaluate(
      `document.querySelector("[role=main] span[email]")?.getAttribute("email")`,
    );
    assert.ok(email, "sender address on the open thread");
    await openSearch(page, `from:${email}`);
    const hasCard = await waitFor(
      page,
      `document.querySelector("span.DQ")`,
      "contact card",
      3000,
    ).catch(() => false);
    if (!hasCard) return t.skip(`Gmail showed no contact card for ${email}`);

    await waitFor(
      page,
      `document.querySelector("button.bg-copy-email")`,
      "copy email button",
    );
    await page.click("button.bg-copy-email");
    assert.equal(await copiedText(page, email), email);
    assert.ok(
      !(await page.evaluate(`location.href.includes("compose=")`)),
      "clicking copy must not open a new message",
    );
  });
});
