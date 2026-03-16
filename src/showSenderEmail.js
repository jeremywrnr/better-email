const { log } = require("./log.js");

function getSenderSpansWithoutEmail() {
  return document.querySelectorAll(
    'h3 span[data-hovercard-id*="@"]:not([data-email-shown])',
  );
}

function showSenderEmail(span) {
  const email = span.getAttribute("data-hovercard-id");
  if (!email) return;

  // Skip if a span.go sibling already exists
  if (span.parentNode && span.parentNode.querySelector("span.go")) return;

  span.setAttribute("data-email-shown", "true");
  log("Injecting email", email);

  const emailSpan = document.createElement("span");
  emailSpan.className = "go";
  emailSpan.textContent = email;
  emailSpan.style.marginLeft = "0.4em";
  span.insertAdjacentElement("afterend", emailSpan);
}

module.exports = { getSenderSpansWithoutEmail, showSenderEmail };
