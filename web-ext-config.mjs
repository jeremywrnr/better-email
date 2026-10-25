// web-ext reads this for build, lint and run. Keep dev-only files out of the
// package uploaded to the store; src/defaults.js stays because options.html
// loads it at runtime.
export default {
  ignoreFiles: [
    "test",
    "Justfile",
    "webpack.config.js",
    "web-ext-config.mjs",
    "package.json",
    "package-lock.json",
    "readme.md",
    "media/clickToFilter.gif",
    "src/!(defaults.js)",
  ],
};
