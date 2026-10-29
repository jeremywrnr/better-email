const storage = globalThis.browser?.storage ?? chrome.storage;

module.exports = { storage };
