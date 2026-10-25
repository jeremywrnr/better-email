# Better Email

A Firefox extension that declutters Gmail — removes AI features, hides distractions, and adds useful navigation shortcuts. All features are individually configurable.

![Click a Gmail profile image to filter by all conversations](./media/clickToFilter.gif)

## What it does

**Clean up** — Hide AI Overview summaries, suggested replies, Gemini buttons, emoji reactions, support button, side panel, "Print all" button, footer clutter, and storage usage.

**Navigate faster** — Click sender names to filter by address, click profile images to filter by sender or domain, auto-expand long threads, copy email addresses with one click (or from the search contact card), copy a permalink to any conversation.

**Load without the blank page:** while Gmail starts, show its logo and a progress bar that follows the real load (fetching your mailbox, then starting Gmail) instead of a blank page with a "having trouble loading?" link.

## Privacy

Runs entirely in your browser. No data collected, no network requests, nothing leaves your device.

## Development

```
npm install        # install dependencies
npm run build      # build and watch for changes
npm run start      # run with web-ext (auto-reloads)
npm run publish    # production zip for addons.mozilla.org
npm run check      # check formatting
npm run fix        # fix formatting
npm run clean      # remove build artifacts
just ci            # what CI runs on PRs: build, store lint, format check
npm run test:integration  # end-to-end checks against live Gmail (see below)
```

`test:integration` needs a signed-in Gmail in a Chrome on DevTools port 9222
with this extension loaded unpacked (e.g. `npx webpack --no-watch && chrome-dev
--restart --ext . https://mail.google.com`, or any Chrome started with
`--remote-debugging-port=9222 --load-extension=$PWD`). The tests open their own
tabs, only open threads that are already read, and write to the clipboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
