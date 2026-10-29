const { createIconButton } = require("./iconButton.js");
const { copyWithToast } = require("./toast.js");

const LINK_ICON =
  '<svg viewBox="0 -960 960 960" height="20" width="20"><path d="M432-288H288q-80 0-136-56T96-480q0-80 56-136t136-56h144v72H288q-50 0-85 35t-35 85q0 50 35 85t85 35h144v72Zm-96-156v-72h288v72H336Zm192 156v-72h144q50 0 85-35t35-85q0-50-35-85t-85-35H528v-72h144q80 0 136 56t56 136q0 80-56 136t-136 56H528Z"/></svg>';

// /mail/u/<email>/ 404s on a fresh load; ?authuser=<email> works and survives
// account-order changes.
function getAccountParam() {
  const label =
    document
      .querySelector('[aria-label^="Google Account"]')
      ?.getAttribute("aria-label") || "";
  const email = label.match(/\(([^)\s]+@[^)\s]+)\)/)?.[1];
  if (email) return email;
  return window.location.pathname.match(/\/mail\/u\/(\d+)/)?.[1] || "0";
}

function getPermalink() {
  const threadId = document
    .querySelector("h2[data-legacy-thread-id]")
    ?.getAttribute("data-legacy-thread-id");
  if (!threadId) return null;
  return `https://mail.google.com/mail/?authuser=${getAccountParam()}#all/${threadId}`;
}

function addCopyPermalinkButton() {
  const newWindow = document.querySelector(
    'button[aria-label="In new window"]',
  )?.parentElement;
  if (!newWindow || newWindow.parentElement.querySelector(".bg-permalink")) {
    return;
  }

  const button = createIconButton(
    "bg-permalink",
    "Copy permalink",
    LINK_ICON,
    () => {
      const link = getPermalink();
      if (link) copyWithToast(link, "Link");
    },
  );
  newWindow.before(button);
}

module.exports = { addCopyPermalinkButton };
