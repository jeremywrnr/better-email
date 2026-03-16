const { log } = require("./log.js");
const { injectStyle } = require("./hideElements.js");

function getProfileImages() {
  return document.querySelectorAll(
    'tr img[jid]:not([jid=""]), .aju img[jid]:not([jid=""])',
  );
}

function wrapImageWithSubjectLink(img) {
  const jid = img.getAttribute("jid");
  const searchUrl = `#search/from%3A${encodeURIComponent(jid)}`;
  wrapImageCommon(img, searchUrl);
}

function wrapImageWithDomainLink(img) {
  const jid = img.getAttribute("jid");
  const domain = jid.split("@")[1];
  const searchUrl = `#search/from%3A${encodeURIComponent(domain)}`;
  wrapImageCommon(img, searchUrl);
}

function wrapImageCommon(img, searchUrl) {
  let anchor, mustInsert;
  if (img.parentNode.tagName === "A") {
    anchor = img.parentNode;
  } else {
    anchor = document.createElement("a");
    mustInsert = true;
  }

  if (anchor.href.includes(searchUrl)) {
    return;
  }

  log("WRAP", searchUrl);
  anchor.href = searchUrl;
  anchor.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.location.hash = searchUrl;
    },
    true,
  );
  if (mustInsert) {
    img.parentNode.insertBefore(anchor, img);
    anchor.appendChild(img);
  }
}

function addProfileHover() {
  injectStyle(`
    img[jid]:hover {
      box-shadow: 0 0 5px 4px rgba(0, 255, 0, 1) !important;
      cursor: pointer !important;
    }
  `);
}

let senderNameClickRegistered = false;

function addSenderNameClickToFilter() {
  if (senderNameClickRegistered) return;
  senderNameClickRegistered = true;

  injectStyle(`
    td.yX:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  `);

  const handler = (e) => {
    const senderCell = e.target.closest("td.yX");
    if (!senderCell) return;

    const emailSpan =
      senderCell.querySelector("span[email]") ||
      e.target.closest("span[email]");
    if (!emailSpan) return;

    const email = emailSpan.getAttribute("email");
    if (!email) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (e.type !== "click") return; // only navigate once

    log("SENDER NAME CLICK", email);
    window.location.hash = `#search/from%3A${encodeURIComponent(email)}`;
  };

  for (const evt of ["mousedown", "mouseup", "click"]) {
    document.addEventListener(evt, handler, true);
  }
}

module.exports = {
  addProfileHover,
  addSenderNameClickToFilter,
  getProfileImages,
  wrapImageWithSubjectLink,
  wrapImageWithDomainLink,
};
