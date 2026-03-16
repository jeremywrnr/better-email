# Better Email

A Firefox extension that declutters Gmail — removes AI features, hides distractions, and adds useful navigation shortcuts. All features are individually configurable.

![Click a Gmail profile image to filter by all conversations](./media/clickToFilter.gif)

## What it does

**Clean up** — Hide AI Overview summaries, suggested replies, "Try Gemini" button, emoji reactions, support button, footer clutter, and storage usage.

**Navigate faster** — Click sender names to filter by address, click profile images to filter by sender or domain, auto-expand long threads, copy email addresses with one click.

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
```

## License

[MIT](https://jeremywrnr.com/mit-license/)
