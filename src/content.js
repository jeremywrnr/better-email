require("./browserShim.js");
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
  injectStyle,
  applyHideSettings,
  redirectSettingsToAll,
} = require("./hideElements.js");
const { expandCollapsedMessages } = require("./autoExpand.js");
const { addCopyPermalinkButton } = require("./copyPermalink.js");
const { addCopyContactEmailButtons } = require("./copyContactEmail.js");
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
  // Fix Gmail bug: sender name descenders clipped in search header
  injectStyle(".c5 { overflow: visible !important; }");
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

  applyHideSettings(settings);

  redirectSettingsToAll();

  if (settings.deleteSpamButton) {
    setupSpamButton();
  }

  if (settings.autoExpandThreads) {
    setInterval(expandCollapsedMessages, BETTER_GMAIL_TIMEOUT);
  }

  if (settings.copyPermalink) {
    setInterval(addCopyPermalinkButton, BETTER_GMAIL_TIMEOUT);
  }

  if (settings.copyContactEmail) {
    setInterval(addCopyContactEmailButtons, BETTER_GMAIL_TIMEOUT);
  }

  if (settings.alwaysShowEmail) {
    setInterval(() => {
      getSenderSpansWithoutEmail().forEach(showSenderEmail);
    }, BETTER_GMAIL_TIMEOUT);
  }
}

init();
