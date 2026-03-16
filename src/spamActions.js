const { log } = require("./log.js");

const BUTTON_ID = "better-gmail-delete-spam";

function isSpamView() {
  return window.location.hash.startsWith("#spam");
}

function findDeleteLink() {
  for (const el of document.querySelectorAll("a, span")) {
    if (el.textContent.trim() === "Delete all spam messages now") return el;
  }
  return null;
}

function findVisibleElement(selector) {
  for (const el of document.querySelectorAll(selector)) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

function isButtonVisible() {
  return !!findVisibleElement("#" + BUTTON_ID);
}

function removeButton() {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) existing.remove();
}

function tryInject(attemptsLeft = 20) {
  if (!isSpamView()) return;
  if (isButtonVisible()) return;
  removeButton();

  const link = findDeleteLink();
  const anchor =
    findVisibleElement('[aria-label="More email options"]') ||
    findVisibleElement('[aria-label="Refresh"]');

  if (!link || !anchor) {
    if (attemptsLeft > 0) setTimeout(() => tryInject(attemptsLeft - 1), 250);
    return;
  }

  log("Injecting delete spam button");

  const btn = document.createElement("div");
  btn.id = BUTTON_ID;
  btn.textContent = "Delete All Spam";
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    padding: 0 10px;
    height: 28px;
    background: #c62828;
    color: white;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    user-select: none;
  `;
  btn.addEventListener("mouseenter", () => (btn.style.background = "#b71c1c"));
  btn.addEventListener("mouseleave", () => (btn.style.background = "#c62828"));
  btn.addEventListener("click", () => {
    link.click();
    btn.remove();
  });

  anchor.insertAdjacentElement("afterend", btn);
}

function setupSpamButton() {
  const check = () => {
    if (isSpamView()) {
      if (!isButtonVisible()) tryInject();
    } else {
      removeButton();
    }
  };

  window.addEventListener("hashchange", check);
  setInterval(check, 1000);
  check();
}

module.exports = { setupSpamButton };
