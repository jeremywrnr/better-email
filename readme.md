# Better Gmail Helper

A Firefox extension that cleans up Gmail's interface and adds useful navigation features. All features are individually configurable.

MIT License

## Features

**Inbox - click sender name to filter** — Click any sender name in the inbox to instantly search for all emails from that address (`from:user@example.com`).

**Conversation - auto-expand collapsed messages** — Automatically expands collapsed messages in long threads and scrolls to the latest message.

**Conversation - show sender email address** — Always displays the sender's full email address in conversation view.

**Conversation - click email address to copy** — Click a sender's email address to copy it to your clipboard.

**Profile image - click to filter by sender** — Click a sender's profile image in conversations to filter by that sender.

**Profile image - highlight on hover** — Profile images get a subtle glow on hover so you know they're clickable.

**Profile image - alt/meta filters by domain** — Hold `Alt` (or `Cmd` on Mac) and click a profile image to filter by the sender's entire domain (`from:example.com`).

**Spam - "Delete All Spam" button** — Adds a prominent delete button to the spam folder toolbar.

**Settings shortcut** — The settings gear button goes directly to full settings instead of the quick settings panel.

![Click a Gmail profile image to filter by all conversations](./media/clickToFilter.gif)

## Clean Up

All optional — hide UI elements you don't need:

- **Top** — "Try Gemini" button, support button
- **Conversation** — AI Overview summary, emoji reaction button, suggested replies
- **Footer** — links (terms, privacy, activity), storage usage

## Privacy

This extension operates entirely within your browser. It does not collect, transmit, or store any data. No information ever leaves your device. The only permission it requires is access to `mail.google.com` in order to modify the Gmail interface.

## Development Setup

Install dependencies:

```
npm install
```

Build and watch for changes:

```
npm run build
```

Run with web-ext (opens Firefox with the extension loaded and auto-reloads on changes):

```
npm run start
```

Load manually in Firefox: go to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on...**, and select `manifest.json`.

## Publishing

Build a production-ready zip for submission to [addons.mozilla.org](https://addons.mozilla.org):

```
npm run publish
```

This produces `web-ext-artifacts/better_gmail_helper-1.1.zip`.

## Other Scripts

| Command         | Description                    |
| --------------- | ------------------------------ |
| `npm run check` | Check formatting with Prettier |
| `npm run fix`   | Auto-fix formatting            |
| `npm run clean` | Remove build artifacts         |
