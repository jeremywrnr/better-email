const DEFAULTS = {
  clickToFilter: true,
  domainMode: true,
  profileHover: true,
  clickToCopy: true,
  copyPermalink: true,
  copyContactEmail: true,
  alwaysShowEmail: true,
  hideGemini: true,
  hideEmojiReaction: true,
  deleteSpamButton: true,
  hideStorageUsed: true,
  hideAIOverview: true,
  hideFooterLinks: true,
  hideSuggestedReplies: true,
  hideSupportButton: true,
  hideUpgradeButton: true,
  hideSidePanel: true,
  hidePrintAll: true,
  autoExpandThreads: true,
  loadingStatus: true,
};

// Also loaded as a plain <script> by options.html.
if (typeof module !== "undefined") module.exports = { DEFAULTS };
