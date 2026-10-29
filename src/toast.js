const { log } = require("./log.js");
const { injectStyle } = require("./hideElements.js");

let toast;
let toastTimer;

function showToast(title, detail) {
  if (!toast) {
    injectStyle(`
      .bg-toast {
        position: fixed;
        left: 24px;
        bottom: 24px;
        z-index: 10000;
        padding: 14px 24px;
        border-radius: 4px;
        background: #323232;
        color: #fff;
        font-size: 14px;
        overflow-wrap: anywhere;
        display: none;
      }
      .bg-toast[data-visible] { display: block; }
      .bg-toast span { display: block; font-size: 12px; opacity: 0.75; }
    `);
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

async function copyWithToast(text, what) {
  try {
    await navigator.clipboard.writeText(text);
    log("Copied", text);
    showToast(`${what} copied`, text);
  } catch (err) {
    log("Copy failed", err);
    showToast("Copy failed", text);
  }
}

module.exports = { showToast, copyWithToast };
