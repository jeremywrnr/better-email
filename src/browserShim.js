// Chrome has no `browser` namespace; its MV3 `chrome.*` APIs return promises,
// so aliasing is enough. Also loaded as a plain <script> by options.html.
globalThis.browser ??= chrome;
