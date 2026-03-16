const { log } = require("./log.js");
const { injectStyle } = require("./hideElements.js");

function getEmailSpans() {
  return document.querySelectorAll("span.go:not([data-copy-enabled])");
}

function addClickToCopy(span) {
  span.setAttribute("data-copy-enabled", "true");
  span.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    const email = span.textContent.trim().replace(/^<|>$/g, "");
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      log("Copied", email);
      span.setAttribute("data-copied", "true");
      setTimeout(() => span.removeAttribute("data-copied"), 1500);
    } catch (err) {
      log("Copy failed", err);
    }
  }, { capture: true });
}

function addClickToCopyStyle() {
  injectStyle(`
    span.go[data-copy-enabled] {
      cursor: pointer;
      border-bottom: 1px dashed currentColor;
    }
    span.go[data-copy-enabled]:hover::after {
      content: ' copy';
      font-size: 0.75em;
      opacity: 0.6;
    }
    span.go[data-copied]::after {
      content: ' copied!' !important;
      font-size: 0.75em;
      color: green;
      opacity: 1;
    }
  `);
}

module.exports = { getEmailSpans, addClickToCopy, addClickToCopyStyle };
