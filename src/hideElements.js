function injectStyle(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

function hideGeminiButton() {
  injectStyle(
    '[data-rp-placement-id="gemkick-pep-icon-callout-id"] { display: none !important; }',
  );
}

function hideAIOverview() {
  injectStyle("div.eJPjde { display: none !important; }");
}

function hideSuggestedReplies() {
  injectStyle("div.brb { display: none !important; }");
}

function hideStorageUsed() {
  injectStyle('a[href*="storage_meter"] { display: none !important; }');
}

function hideFooterLinks() {
  injectStyle("div.aeU { display: none !important; }");
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
  redirectSettingsToAll,
};
