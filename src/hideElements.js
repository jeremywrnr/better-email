function injectStyle(css) {
  const style = document.createElement("style");
  style.dataset.betterEmail = ""; // lets tests tell the extension is active
  style.textContent = css;
  document.head.appendChild(style);
}

// Setting key -> selectors hidden when that setting is on.
const HIDE_SELECTORS = {
  hideGemini: [
    '[data-rp-placement-id="gemkick-pep-icon-callout-id"]',
    'div:has(> span > button[aria-label*="Gemini"])',
  ],
  hideAIOverview: ["div.eJPjde"],
  hideSuggestedReplies: ['.mVCoBd:has([aria-label^="Suggested reply"])'],
  hideStorageUsed: ['a[href*="storage_meter"]'],
  hideEmojiReaction: [
    'div.wrsVRe[data-position="dynamic"]',
    '[aria-label="Add reaction"]',
  ],
  hideSupportButton: ['[data-tooltip="Support"]'],
  hideUpgradeButton: ['[data-pep-id="global-pep-gmail"]'],
  hideSidePanel: ['div:has(> [role="complementary"][aria-label="Side panel"])'],
  hidePrintAll: ['span:has(> button[aria-label="Print all"])'],
};

// Extra rules that go with a hide setting but aren't plain display: none.
const EXTRA_CSS = {
  // The footer is three floated 1/3 columns; with the links column gone the
  // activity column drifts to the middle, so pin it right on one line.
  hideFooterLinks: `
    div.aeU { display: none !important; }
    [role="contentinfo"] > .ae3 { float: right !important; width: auto !important; }
    [role="contentinfo"] > .ae3 .l6 { display: flex !important; gap: 8px; align-items: baseline; }
  `,
};

function applyHideSettings(settings) {
  const selectors = Object.entries(HIDE_SELECTORS)
    .filter(([key]) => settings[key])
    .flatMap(([, sels]) => sels);
  const extra = Object.entries(EXTRA_CSS)
    .filter(([key]) => settings[key])
    .map(([, css]) => css);
  const css = [
    selectors.length
      ? `${selectors.join(",\n")} { display: none !important; }`
      : "",
    ...extra,
  ].join("\n");
  if (css.trim()) injectStyle(css);
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
  applyHideSettings,
  redirectSettingsToAll,
};
