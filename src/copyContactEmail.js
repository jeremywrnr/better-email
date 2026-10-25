const { createIconButton } = require("./iconButton.js");
const { copyWithToast } = require("./toast.js");

const COPY_ICON =
  '<svg viewBox="0 -960 960 960" height="18" width="18"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>';

// Search-results contact card: span.DQ is the envelope + address that opens a
// new message. Add a copy button after it.
function addCopyContactEmailButtons() {
  document.querySelectorAll("span.DQ:not([data-copy-button])").forEach((card) => {
    card.setAttribute("data-copy-button", "true");
    const email = card.querySelector("div.Cz")?.textContent.trim();
    if (!email) return;
    const button = createIconButton(
      "bg-copy-email",
      "Copy email address",
      COPY_ICON,
      () => copyWithToast(email, "Email"),
      { small: true },
    );
    card.after(button);
    // Lay out envelope, address and button as one row so a long (truncated)
    // address can't push the button onto its own line.
    card.parentElement.style.cssText += "display: flex; align-items: center;";
    card.style.cssText += "display: flex; align-items: center; min-width: 0;";
    card.querySelector("div.Cz").style.minWidth = "0";
  });
}

module.exports = { addCopyContactEmailButtons };
