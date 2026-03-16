const DEFAULTS = {
  clickToFilter: true,
  domainMode: true,
  profileHover: true,
  clickToCopy: true,
  alwaysShowEmail: true,
  hideGemini: true,
  hideEmojiReaction: true,
  deleteSpamButton: true,
  hideStorageUsed: true,
  hideAIOverview: true,
  hideFooterLinks: true,
  hideSuggestedReplies: true,
  hideSupportButton: true,
  autoExpandThreads: true,
};

const keys = Object.keys(DEFAULTS);

function updateToggleLabel() {
  const anyOn = keys.some((k) => document.getElementById(k).checked);
  document.getElementById("toggleAll").textContent = anyOn
    ? "Disable All"
    : "Enable All";
}

async function load() {
  const settings = await browser.storage.local.get(DEFAULTS);
  for (const key of keys) {
    document.getElementById(key).checked = settings[key];
  }
  updateToggleLabel();
}

async function save() {
  const settings = {};
  for (const key of keys) {
    settings[key] = document.getElementById(key).checked;
  }
  await browser.storage.local.set(settings);
  updateToggleLabel();
  const status = document.getElementById("status");
  status.textContent = "Saved.";
  setTimeout(() => (status.textContent = ""), 1500);
}

load();

for (const key of keys) {
  document.getElementById(key).addEventListener("change", save);
}

document.getElementById("toggleAll").addEventListener("click", () => {
  const anyOn = keys.some((k) => document.getElementById(k).checked);
  for (const key of keys) {
    document.getElementById(key).checked = !anyOn;
  }
  save();
});
