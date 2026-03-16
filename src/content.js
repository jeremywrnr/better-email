const { log } = require("./log.js");
const {
  wrapImageWithSubjectLink,
  wrapImageWithDomainLink,
  getProfileImages,
  addProfileHover,
  addSenderNameClickToFilter,
} = require("./clickToFilter.js");
const { setupSpamButton } = require("./spamActions.js");
const {
  getEmailSpans,
  addClickToCopy,
  addClickToCopyStyle,
} = require("./clickToCopy.js");
const {
  getSenderSpansWithoutEmail,
  showSenderEmail,
} = require("./showSenderEmail.js");
const {
  hideGeminiButton,
  hideEmojiReaction,
  hideStorageUsed,
  hideSupportButton,
  redirectSettingsToAll,
} = require("./hideElements.js");
const { DEFAULTS } = require("./defaults.js");

log("Extension Loading...", window.location.href);

const BETTER_GMAIL_TIMEOUT = 250;

function wrapImagesSubject() {
  getProfileImages().forEach(wrapImageWithSubjectLink);
}

function wrapImagesDomain() {
  getProfileImages().forEach(wrapImageWithDomainLink);
}

function applyClickToCopy() {
  getEmailSpans().forEach(addClickToCopy);
}

let clickToFilterInterval;

async function init() {
  const settings = await browser.storage.local.get(DEFAULTS);
  log("Settings", settings);

  if (settings.profileHover) {
    addProfileHover();
  }

  if (settings.clickToFilter) {
    addSenderNameClickToFilter();
    clickToFilterInterval = setInterval(
      wrapImagesSubject,
      BETTER_GMAIL_TIMEOUT,
    );

    if (settings.domainMode) {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Alt" || event.key === "Meta") {
          clearInterval(clickToFilterInterval);
          log("WRAP DOMAIN");
          wrapImagesDomain();
          clickToFilterInterval = setInterval(
            wrapImagesDomain,
            BETTER_GMAIL_TIMEOUT,
          );
        }
      });
      document.addEventListener("keyup", (event) => {
        if (event.key === "Alt" || event.key === "Meta") {
          clearInterval(clickToFilterInterval);
          log("WRAP SUBJECT");
          wrapImagesSubject();
          clickToFilterInterval = setInterval(
            wrapImagesSubject,
            BETTER_GMAIL_TIMEOUT,
          );
        }
      });
    }
  }

  if (settings.clickToCopy) {
    addClickToCopyStyle();
    setInterval(applyClickToCopy, BETTER_GMAIL_TIMEOUT);
  }

  if (settings.hideGemini) {
    hideGeminiButton();
  }

  if (settings.hideEmojiReaction) {
    hideEmojiReaction();
  }

  if (settings.hideStorageUsed) {
    hideStorageUsed();
  }

  if (settings.hideSupportButton) {
    hideSupportButton();
  }

  redirectSettingsToAll();

  if (settings.deleteSpamButton) {
    setupSpamButton();
  }

  if (settings.alwaysShowEmail) {
    setInterval(() => {
      getSenderSpansWithoutEmail().forEach(showSenderEmail);
    }, BETTER_GMAIL_TIMEOUT);
  }
}

init();
