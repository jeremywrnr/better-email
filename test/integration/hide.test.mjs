// Every hide setting has a probe: the Gmail control it should remove, and the
// view where that control normally shows up. The test fails if the probe is
// visible (the extension's selector went stale) and is skipped if Gmail did not
// render the control this time (e.g. no suggested reply on this thread).
// Assumes the default settings (all hide options on).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  assertBrowser,
  openGmail,
  openReadThread,
  visibility,
} from "./gmail.mjs";

const PROBES = {
  hideGemini: ["inbox", 'button[aria-label*="Gemini"]'],
  hideSupportButton: ["inbox", '[data-tooltip="Support"]'],
  hideUpgradeButton: ["inbox", '[data-pep-id="global-pep-gmail"]'],
  hideSidePanel: ["inbox", '[role="complementary"][aria-label="Side panel"]'],
  hideStorageUsed: ["inbox", 'a[href*="storage_meter"]'],
  hideFooterLinks: ["inbox", "div.aeU"],
  hidePrintAll: ["thread", 'button[aria-label="Print all"]'],
  hideSuggestedReplies: ["thread", '[aria-label^="Suggested reply"]'],
  hideEmojiReaction: ["thread", '[aria-label="Add reaction"]'],
  hideAIOverview: ["thread", "div.eJPjde"],
};

describe("hide settings", () => {
  const pages = {};

  before(async () => {
    await assertBrowser();
    pages.inbox = await openGmail("#inbox");
    pages.thread = await openGmail("#inbox");
    await openReadThread(pages.thread);
  });

  after(() => Promise.all(Object.values(pages).map((p) => p.close())));

  for (const [setting, [view, probe]] of Object.entries(PROBES)) {
    test(`${setting} hides ${probe} (${view})`, async (t) => {
      const state = await visibility(pages[view], probe);
      if (state === "absent") return t.skip("not rendered on this page");
      assert.equal(state, "hidden");
    });
  }
});
