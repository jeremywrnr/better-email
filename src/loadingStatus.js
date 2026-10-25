const { log } = require("./log.js");
const { DEFAULTS } = require("./defaults.js");

// Gmail's splash (#loading) keeps its logo hidden for 1.25s and its progress
// bar (#nlpt) for 2.5s, but shows "If you're having trouble loading…" (#stb-msg)
// at once, so a normal ~1s load is a blank page with a help-center link.
// Show the logo and bar right away, drive the bar from real progress, and hold
// the help line back until the load is actually slow.
const CSS = `
  #loading div[style*="a-s"], #loading #nlpt {
    animation: a-s .2s .15s 1 forwards !important;
  }
  #loading #nlpt::before {
    animation: none !important;
    transform: translateX(calc(var(--bg-progress, 0) * 3px - 300px)) !important;
    transition: transform var(--bg-duration, .3s) cubic-bezier(.1, .6, .3, 1);
  }
  #loading #stb-msg {
    opacity: 0;
    animation: a-s .25s 5s 1 forwards;
  }
  #bg-load-status {
    margin: -12px 0 16px;
    color: #757575;
    font: 13px "Google Sans", arial, sans-serif;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    animation: a-s .2s .15s 1 forwards;
  }
`;

// The mailbox comes down as a hidden iframe; Gmail finds it the same way.
const DATA_URL = /\/mail(\/u\/\d+)?\/data(\?|$)/;

// Each phase sets the bar's target (in %) and how long it takes to get there:
// the mailbox phase creeps slowly toward 70% since we can't see its progress.
const PHASES = {
  mailbox: { label: "Loading your mailbox", progress: 70, duration: "3s" },
  starting: { label: "Starting Gmail", progress: 90, duration: ".3s" },
  done: { label: "Ready", progress: 100, duration: ".15s" },
};

function setup() {
  // Not marked data-better-email: tests read that as "content.js styles are in".
  const style = document.createElement("style");
  style.textContent = CSS;
  document.documentElement.appendChild(style);

  const marks = {};
  let status, bar, phase;

  const render = () => {
    if (!status) return;
    const elapsed = (performance.now() / 1000).toFixed(1);
    status.textContent = `${PHASES[phase].label}… ${elapsed}s`;
  };

  // Moves Gmail's bar toward the current phase's target.
  const apply = () => {
    bar.style.setProperty("--bg-progress", PHASES[phase].progress);
    bar.style.setProperty("--bg-duration", PHASES[phase].duration);
  };

  const enter = (next) => {
    if (phase === "done" || phase === next) return;
    phase = next;
    marks[next] = Math.round(performance.now());
    if (status) {
      status.dataset.phase = next;
      apply();
      render();
    }
  };

  // Mount next to Gmail's bar once the splash is parsed. The data request is
  // already in flight by then.
  const mount = () => {
    bar = document.getElementById("nlpt");
    if (!bar) return;
    observer.disconnect();
    if (!phase) enter("mailbox");
    status = document.createElement("div");
    status.id = "bg-load-status";
    bar.after(status);
    status.dataset.phase = phase;
    render();
    // Start the bar at 0 so its first move animates.
    requestAnimationFrame(apply);
  };
  const observer = new MutationObserver(mount);
  observer.observe(document, { childList: true, subtree: true });

  const dataWatch = new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (e.initiatorType === "iframe" && DATA_URL.test(e.name)) {
        marks.mailboxKB = Math.round(e.transferSize / 1024);
        enter("starting");
      }
  });
  dataWatch.observe({ type: "resource", buffered: true });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    observer.disconnect();
    dataWatch.disconnect();
    if (status) enter("done");
    log("Load timings (ms since navigation start)", marks);
  };

  // Ticks the elapsed time until Gmail hides the splash.
  const timer = setInterval(() => {
    const splash = document.getElementById("loading");
    if (status && (!splash || getComputedStyle(splash).display === "none"))
      finish();
    else render();
  }, 100);
  // Not a page with a splash (e.g. a popped-out window).
  document.addEventListener("DOMContentLoaded", () => bar || finish());
  // Gmail shows its own "taking longer than usual" message by then.
  setTimeout(finish, 60000);
}

// Only the top Gmail page has a splash; skip its iframes (the data frame etc.).
// A plain promise, not async/await, keeps babel's runtime out of this bundle.
if (window.top === window)
  browser.storage.local
    .get({ loadingStatus: DEFAULTS.loadingStatus })
    .then(({ loadingStatus }) => loadingStatus && setup());
