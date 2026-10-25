const { injectStyle } = require("./hideElements.js");

// Values measured from Gmail's native "In new window" button and its tooltip.
const TOOLTIP_DELAY_MS = 500;
const TOOLTIP_GAP_PX = 4;
const VIEWPORT_MARGIN_PX = 4;

let tooltip;
let showTimer;

function setup() {
  injectStyle(`
    .bg-icon-button {
      position: relative;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: rgb(68, 71, 70);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }
    .bg-icon-button svg { fill: currentColor; }
    /* 28px variant for inline use; negative block margins keep it from
       growing a 16px text line while staying centered on it. */
    .bg-icon-button.bg-small {
      width: 28px;
      height: 28px;
      margin: -6px 0 -6px 4px;
    }
    .bg-icon-button::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgb(68, 71, 70);
      opacity: 0;
      transition: opacity 0.075s linear;
    }
    .bg-icon-button:hover::before { opacity: 0.08; }
    .bg-tooltip {
      position: fixed;
      z-index: 2101;
      max-width: 200px;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgb(48, 48, 48);
      color: rgb(242, 242, 242);
      font: 400 12px/16px "Google Sans", Roboto, Arial, sans-serif;
      letter-spacing: 0.1px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px);
      transition:
        opacity 0.15s cubic-bezier(0, 0, 0.2, 1),
        transform 0.15s cubic-bezier(0, 0, 0.2, 1);
    }
    .bg-tooltip[data-visible] { opacity: 1; transform: none; }
  `);
  // Lives on <body> like Gmail's tooltips, so header overflow can't clip it.
  tooltip = document.createElement("div");
  tooltip.className = "bg-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);
}

function showTooltip(button) {
  tooltip.textContent = button.getAttribute("aria-label");
  const b = button.getBoundingClientRect();
  const t = tooltip.getBoundingClientRect();
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN_PX, b.left + b.width / 2 - t.width / 2),
    window.innerWidth - t.width - VIEWPORT_MARGIN_PX,
  );
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${b.top - t.height - TOOLTIP_GAP_PX}px`;
  tooltip.setAttribute("data-visible", "");
}

function hideTooltip() {
  clearTimeout(showTimer);
  tooltip.removeAttribute("data-visible");
}

// Round icon button styled like Gmail's own, with a hover state layer and a
// dark tooltip above it. Clicks don't reach Gmail's handlers underneath.
function createIconButton(className, label, svg, onClick, { small } = {}) {
  if (!tooltip) setup();
  const button = document.createElement("button");
  button.className = `bg-icon-button ${className}${small ? " bg-small" : ""}`;
  button.setAttribute("aria-label", label);
  // Parsed rather than assigned via innerHTML, which add-on store linters flag.
  button.append(
    new DOMParser().parseFromString(svg, "text/html").body.firstChild,
  );
  button.addEventListener("mouseenter", () => {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => showTooltip(button), TOOLTIP_DELAY_MS);
  });
  button.addEventListener("mouseleave", hideTooltip);
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    hideTooltip();
    onClick();
  });
  return button;
}

module.exports = { createIconButton };
