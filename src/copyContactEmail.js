const { injectStyle } = require("./hideElements.js");
const { copyWithToast } = require("./toast.js");

const COPY_ICON =
  '<svg viewBox="0 -960 960 960" height="18" width="18"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>';

let styled = false;

// Search-results contact card: span.DQ is the envelope + address that opens a
// new message. Add a copy button after it.
function addCopyContactEmailButtons() {
  const cards = document.querySelectorAll("span.DQ:not([data-copy-button])");
  if (!cards.length) return;

  if (!styled) {
    styled = true;
    injectStyle(`
      button.bg-copy-email {
        position: relative;
        top: -6px; /* center the 28px button on the 16px address line */
        margin-left: 4px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
      }
      button.bg-copy-email:hover { background: rgba(32, 33, 36, 0.06); }
      button.bg-copy-email svg { fill: currentColor; }
    `);
  }

  cards.forEach((card) => {
    card.setAttribute("data-copy-button", "true");
    const email = card.querySelector("div.Cz")?.textContent.trim();
    if (!email) return;
    const button = document.createElement("button");
    button.className = "bg-copy-email";
    button.setAttribute("aria-label", "Copy email address");
    button.title = "Copy email address";
    button.innerHTML = COPY_ICON;
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      copyWithToast(email, "Email");
    });
    card.after(button);
  });
}

module.exports = { addCopyContactEmailButtons };
