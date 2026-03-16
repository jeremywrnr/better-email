# Better Gmail Helper

A Firefox extension that makes Gmail more navigable by turning sender profile images into clickable filters.

MIT License

## Features

**Click to filter by sender** — In any Gmail conversation, click a sender's profile image to instantly search for all emails from that address (`from:user@example.com`).

**Click to filter by domain** — Hold `Alt` (or `Cmd` on Mac) and click a profile image to filter by the sender's entire domain (`from:example.com`). Useful for seeing all mail from a company.

Profile images get a subtle glow on hover so you know they're clickable.

![Click a Gmail profile image to filter by all conversations](./media/clickToFilter.gif)

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
