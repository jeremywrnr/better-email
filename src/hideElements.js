function injectStyle(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function hideGeminiButton() {
  injectStyle(`
    [data-rp-placement-id="gemkick-pep-icon-callout-id"],
    div:has(> span > button[aria-label*="Gemini"]) { display: none !important; }
  `);
}

function hideAIOverview() {
  injectStyle("div.eJPjde { display: none !important; }");
}

function hideSuggestedReplies() {
  injectStyle(`
    div.brb,
    .mVCoBd:has([aria-label^="Suggested reply"]),
    [aria-label^="Suggested reply"] { display: none !important; }
  `);
}

function hideStorageUsed() {
  injectStyle('a[href*="storage_meter"] { display: none !important; }');
}

function hideFooterLinks() {
  injectStyle(`
    div.aeU { display: none !important; }
    [role="contentinfo"] > .ae3 { float: right !important; width: auto !important; }
    [role="contentinfo"] > .ae3 .l6 { display: flex !important; gap: 8px; align-items: baseline; }
    [role="contentinfo"] > .ae3 .l6 > * { display: inline !important; }
  `);
}

function hideEmojiReaction() {
  injectStyle(`
    div.wrsVRe[data-position="dynamic"] { display: none !important; }
    [aria-label="Add reaction"] { display: none !important; }
  `);
}

function hideSupportButton() {
  injectStyle('[data-tooltip="Support"] { display: none !important; }');
}

function hideUpgradeButton() {
  injectStyle(
    '[data-pep-id="global-pep-gmail"] { display: none !important; }',
  );
}

function hideSidePanel() {
  injectStyle(
    'div:has(> [role="complementary"][aria-label="Side panel"]) { display: none !important; }',
  );
}

function hidePrintAll() {
  injectStyle(
    'span:has(> button[aria-label="Print all"]) { display: none !important; }',
  );
}

function redirectSettingsToAll() {
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest('[aria-label="Settings"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = "#settings/general";
      }
    },
    true,
  );
}

module.exports = {
  injectStyle,
  hideGeminiButton,
  hideAIOverview,
  hideSuggestedReplies,
  hideEmojiReaction,
  hideFooterLinks,
  hideStorageUsed,
  hideSupportButton,
  hideUpgradeButton,
  hideSidePanel,
  hidePrintAll,
  redirectSettingsToAll,
};
