---
name: gmail-ui
description: Workflow for adding, fixing, or verifying anything this extension changes in Gmail's UI — hiding elements, broken or stale selectors, "X still shows up", new clean-up toggles. Inspects live Gmail in the chrome-dev browser (chrome-devtools MCP), prototypes CSS in the page, wires it into the extension, and verifies with screenshots.
---

# Gmail UI development

Gmail's DOM uses obfuscated class names and changes without notice. Never guess
a selector — find it in live Gmail, prove it, then ship it.

## 1. Inspect live

- Browser: the `chrome-dev` Chrome for Testing instance, driven by the
  `chrome-devtools` MCP (`mcp__chrome-devtools__*`). From the repo root run
  `chrome-dev https://mail.google.com`, which loads this extension and is a
  no-op if it's already running. The profile persists, so the user only signs
  in to Gmail once.
- Use `take_snapshot` to read the page and `evaluate_script` to locate the target:
  ```js
  [...document.querySelectorAll('[aria-label*="X"], [data-tooltip*="X"]')]
    .map(e => ({tag: e.tagName, role: e.getAttribute('role'),
      aria: e.getAttribute('aria-label'), tip: e.getAttribute('data-tooltip'),
      data: [...e.attributes].filter(a => a.name.startsWith('data-')).map(a => `${a.name}=${a.value}`),
      parents: (() => { let p = e.parentElement, out = []; for (let i = 0; p && i < 4; i++, p = p.parentElement) out.push(p.tagName + (p.getAttribute('role') ? `[role=${p.getAttribute('role')}]` : '')); return out; })()}))
  ```
- **MCP not loaded in this session?** If `chrome-dev` is running, use the
  zero-dependency DevTools protocol scripts in `scripts/` (Node 22+):
  - `node .claude/skills/gmail-ui/scripts/eval.mjs mail.google.com '<js expr>'`
    prints the JSON result. Wrap multi-statement code in `(() => { … })()`.
  - `node .claude/skills/gmail-ui/scripts/screenshot.mjs mail.google.com <scratchpad>/top.png [height|0]`
    captures the image, then `Read` it to look at it.
- **No browser at all?** (`chrome-dev` isn't on PATH.) Give the user the snippet
  above to paste into the DevTools console on Gmail, and ask them to paste back
  the output with `copy(JSON.stringify(result, null, 2))`. Do the same for the
  step 3 prototype. Treat any selector that hasn't been through this as
  provisional.
- Some entry points only appear in context. Check the inbox, an open thread,
  and the compose window when they apply.

## 2. Choose a stable selector

In order of preference:

1. Semantic `data-*` IDs (`data-rp-placement-id`, `data-pep-id`, …)
2. `aria-label` / `data-tooltip`, using an exact match or `*=` substring
3. `:has()` to hide a wrapper that would otherwise leave a gap
4. Obfuscated classes (`div.aeU`) only as a last resort, and noted in the table below

Prove it's specific. Count the matches and confirm none fall inside the message
list or a message body, since an email whose subject mentions the same word
must not disappear. If one does, narrow with the element's tag, a top-bar
ancestor, or `:not(...)`. Don't narrow with `[role="button"]` alone: Gmail's
newer controls are native `<button>`s with no `role` attribute (the Gemini
button was one).

## 3. Prototype in the page

Inject the CSS before touching code:

```js
const s = document.createElement('style'); s.id = 'bg-proto';
s.textContent = `SELECTOR { display: none !important; }`;
document.head.appendChild(s);
```

Take a screenshot. Check that the element is gone, no gap is left, and the
neighbors (Settings, apps grid, avatar, toolbar) look right. Iterate by editing
`#bg-proto`.

## 4. Wire it in

- **Fixing an existing hide toggle:** edit its entry in `HIDE_SELECTORS` (or
  `EXTRA_CSS` for rules that aren't plain `display: none`) in `src/hideElements.js`.
- **New hide toggle:**
  1. `src/hideElements.js`: add `key: [selectors]` to `HIDE_SELECTORS`.
     `applyHideSettings()` injects every enabled entry as one stylesheet.
  2. `src/defaults.js`: add the key to `DEFAULTS` (also read by the options page)
  3. `options.html`: add a checkbox whose `id` matches the key, with a label like `Top - hide …`
  4. `readme.md`: add it to the "Clean up" line
  5. `test/integration/hide.test.mjs`: add a `PROBES` entry (the Gmail control
     it hides, and whether it shows on the `inbox` or `thread` view)
- **New behavior (buttons, copying):** add a module and register it in
  `src/content.js` under `if (settings.key)`. Use `copyWithToast()` from
  `src/toast.js` for anything that copies to the clipboard.

## 5. Build and check

```sh
npx webpack --no-watch   # the config sets watch: true; don't let it hang
npm run check            # prettier; run `npm run fix` if it fails
```

## 6. Verify in the real extension

- **Run the integration suite:** `npm run test:integration` (needs chrome-dev
  running with the fresh build). It opens its own tabs against the signed-in
  Gmail, only opens already-read threads, and overwrites the clipboard. Hide
  probes fail when a control is visible (stale selector) and skip when Gmail
  didn't render it. New features get an end-to-end test in
  `test/integration/features.test.mjs`, which should open any link they
  produce in a fresh tab (`openTab`).
- Run `chrome-dev --restart https://mail.google.com` from the repo root. It
  relaunches Chrome with the rebuilt `dist/` bundle, and the profile keeps you
  signed in. Then reconnect, because the MCP's page handles go stale.
- Use `take_screenshot` to confirm the element is hidden
  and the layout is intact.
- Turn the toggle off in Options, reload, and take a screenshot to confirm the
  element is back.
- Click the neighboring controls to make sure nothing else broke.
- **Extension on/off diff:** `scripts/ui-diff.sh <scratchpad>/diff [url]`
  relaunches Chrome with the extension off, then on, and captures the top of
  the inbox and the footer for each. It writes `diff-{top,bottom}.png` (off |
  on | changed pixels in red) and prints the pixel counts. Read the diff images
  to catch anything that changed unexpectedly. This restarts the browser, so ask
  first if the user is working in it.
- **Links/URLs the extension generates:** test exactly what lands on the
  clipboard (`navigator.clipboard.readText()` after `click.mjs`) by opening it
  in a **fresh tab** (`curl -X PUT "http://127.0.0.1:9222/json/new?<url with # as %23>"`),
  then close that tab. Navigating an already-loaded Gmail tab can succeed where
  a cold load fails.
- Scripts target the first tab whose URL matches, so when the user has several
  Gmail tabs, match on a more specific URL fragment.
- Gmail ignores JS `.click()` on many controls. Use `scripts/click.mjs`
  (`text:Exact label` or a CSS selector) to send real mouse events.

## 7. Record

Update the table below with the selector and today's date. When Gmail breaks
something, check this table first.

## Known selectors

| Feature (setting) | Selector | Last verified | Notes |
| --- | --- | --- | --- |
| Gemini (`hideGemini`) | `[data-rp-placement-id="gemkick-pep-icon-callout-id"]`, `div:has(> span > button[aria-label*="Gemini"])` | 2026-10-24 | top-bar sparkle is a native `<button aria-label="Try Gemini">` (no role attr); hide its wrapper div to avoid a 40px gap |
| AI Overview (`hideAIOverview`) | `div.eJPjde` | unverified | obfuscated class |
| Suggested replies (`hideSuggestedReplies`) | `.mVCoBd:has([aria-label^="Suggested reply"])` | 2026-10-24 | card is `[role=button][aria-label^="Suggested reply, …"]`; the `.mVCoBd` wrapper also holds the header and its "Feedback" button. Old `div.brb` is dead (removed) |
| Storage used (`hideStorageUsed`) | `a[href*="storage_meter"]` | unverified | |
| Footer links (`hideFooterLinks`) | `div.aeU`; `[role="contentinfo"] > .ae3` (+ `.l6`) | 2026-10-24 | footer is 3 floated 1/3 columns (`.aeV` storage, `.aeU` links, `.ae3` activity); hiding `.aeU` strands `.ae3` mid-page, so it is floated right on one line. Tried `visibility: hidden` to keep the slot instead: activity still lands mid-page and wraps. Obfuscated classes scoped under `role=contentinfo` |
| Emoji reaction (`hideEmojiReaction`) | `div.wrsVRe[data-position="dynamic"]`, `[aria-label="Add reaction"]` | unverified | |
| Support (`hideSupportButton`) | `[data-tooltip="Support"]` | unverified | |
| Upgrade (`hideUpgradeButton`) | `[data-pep-id="global-pep-gmail"]` | unverified | |
| Side panel (`hideSidePanel`) | `div:has(> [role="complementary"][aria-label="Side panel"])` | 2026-10-24 | hide the 56px wrapper, not just the panel, so content reclaims the width |
| Print all (`hidePrintAll`) | `span:has(> button[aria-label="Print all"])` | 2026-10-24 | native `<button>` in a tooltip-wrapper span, in the open-thread header |
| Copy permalink (`copyPermalink`) | inserted before `button[aria-label="In new window"]`'s wrapper span; thread id from `h2[data-legacy-thread-id]`; account from `[aria-label^="Google Account"]` | 2026-10-24 | link is `/mail/?authuser=<email>#all/<legacy thread id>`. `/mail/u/<email>/…` 404s on a fresh load even though it works when navigated from an open Gmail tab |
| Copy contact email (`copyContactEmail`) | after `span.DQ` (envelope `img` + address `div.Cz`) on the search contact card | 2026-10-24 | obfuscated classes only; `span.DQ` itself opens a new message, so the copy button sits outside it, nudged up 6px to center on the address line |
