const { log } = require("./log.js");
const { injectStyle } = require("./hideElements.js");

const LINK_ICON =
  '<svg viewBox="0 -960 960 960" height="20" width="20"><path d="M432-288H288q-80 0-136-56T96-480q0-80 56-136t136-56h144v72H288q-50 0-85 35t-35 85q0 50 35 85t85 35h144v72Zm-96-156v-72h288v72H336Zm192 156v-72h144q50 0 85-35t35-85q0-50-35-85t-85-35H528v-72h144q80 0 136 56t56 136q0 80-56 136t-136 56H528Z"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 -960 960 960" height="20" width="20"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>';

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

let toastTimer;

function showToast(title, detail) {
  let toast = document.querySelector(".bg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "bg-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = "<strong></strong><span></span>";
    document.body.appendChild(toast);
  }
  toast.querySelector("strong").textContent = title;
  toast.querySelector("span").textContent = detail;
  toast.setAttribute("data-visible", "true");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.removeAttribute("data-visible"), 4000);
}

function addCopyPermalinkButton() {
  const newWindow = document.querySelector(
    'span:has(> button[aria-label="In new window"])',
  );
  if (!newWindow || newWindow.parentElement.querySelector(".bg-permalink")) {
    return;
  }

  const button = document.createElement("button");
  button.className = "bg-permalink";
  button.setAttribute("aria-label", "Copy permalink");
  button.title = "Copy permalink";
  button.innerHTML = LINK_ICON;
  button.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const link = getPermalink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      log("Copied", link);
      showToast("Link copied", link);
      button.innerHTML = CHECK_ICON;
      button.title = "Copied!";
      setTimeout(() => {
        button.innerHTML = LINK_ICON;
        button.title = "Copy permalink";
      }, 1500);
    } catch (err) {
      log("Copy failed", err);
      showToast("Copy failed", link);
    }
  });

  newWindow.before(button);
}

function addCopyPermalinkStyle() {
  injectStyle(`
    button.bg-permalink {
      width: 40px;
      height: 40px;
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
    button.bg-permalink:hover {
      background: rgba(32, 33, 36, 0.06);
    }
    button.bg-permalink svg {
      fill: currentColor;
    }
    .bg-toast {
      position: fixed;
      left: 24px;
      bottom: 24px;
      z-index: 10000;
      max-width: min(560px, calc(100vw - 48px));
      padding: 14px 24px;
      border-radius: 4px;
      background: #323232;
      color: #fff;
      font: 14px/20px "Google Sans", Roboto, Arial, sans-serif;
      box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px rgba(0, 0, 0, 0.14);
      display: flex;
      flex-direction: column;
      gap: 2px;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.15s, transform 0.15s;
      pointer-events: none;
    }
    .bg-toast[data-visible] {
      opacity: 1;
      transform: none;
    }
    .bg-toast span {
      font-size: 12px;
      opacity: 0.75;
      overflow-wrap: anywhere;
    }
  `);
}

module.exports = { addCopyPermalinkButton, addCopyPermalinkStyle };
