const { log } = require("./log.js");

const PROCESSED_ATTR = "data-auto-expanded";

function scrollToLatestMessage(expectedCount, attemptsLeft = 20) {
  const messages = document.querySelectorAll('[role="listitem"]');
  if (messages.length >= expectedCount) {
    messages[messages.length - 1].scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (attemptsLeft > 0) {
    setTimeout(
      () => scrollToLatestMessage(expectedCount, attemptsLeft - 1),
      100,
    );
  }
}

function expandCollapsedMessages() {
  const collapseButtons = document.querySelectorAll(
    `span.adx:not([${PROCESSED_ATTR}])`,
  );
  collapseButtons.forEach((btn) => {
    btn.setAttribute(PROCESSED_ATTR, "true");
    const collapsed = parseInt(btn.textContent.trim(), 10) || 0;
    const currentCount = document.querySelectorAll('[role="listitem"]').length;
    log("Auto-expanding thread:", collapsed, "messages");
    btn.click();
    scrollToLatestMessage(currentCount + collapsed);
  });
}

module.exports = { expandCollapsedMessages };
