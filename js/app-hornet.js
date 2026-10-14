/* js/app-hornet.js: the Hornet who walks the page, ported from the Hollow Knight site's Knight
   (js/app-knight.js there). One sprite (css: .hn; the strips in assets/hornet/, from the game's own
   frames by tools/extract-hornet.py) that says where you are, the way her mark does on the game's
   map. She sits on the screen bar under the tab you're on, on its bottom edge, and never leaves it:
   she is the bar's mark of the current tab (on a computer it draws no rule under it while she's
   there). When you change screens she gets up and runs along the bar to the new one, at a steady
   pace (--dur-run per 100 px): never a slide; she only fades in on arriving, and out where the bar
   has no room for her (below 900 px). On the Map she sits at your bench (js/app-map.js draws her
   there). With reduced motion she only stands or sits. Decorative for the page: hidden from screen readers and out of the tab
   order; the click (she binds) is an easter egg.
   Shares SS.app (see js/app.js): App.hornet.sync() after every render, App.hornet.start() once,
   from js/app-boot.js. */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const App = SS.app;
  const { el, track } = App;

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  // Below 900 px the bar spreads its tabs over the width: no room for her beside a tab (css).
  const phone = matchMedia('(max-width: 899px)');

  const hn = document.createElement('button');
  hn.type = 'button'; hn.className = 'hn'; hn.tabIndex = -1;
  hn.setAttribute('aria-hidden', 'true');

  /* A duration from the tokens (css/tokens.css), in ms. */
  const ms = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  const after = (t) => new Promise((r) => setTimeout(r, t));

  let perch = '';        // 'bar' while she's on it, '' while she isn't (a phone's bar has no room)
  let tabId = '';        // the tab she sits under, to run along the bar when it changes
  let run = null;        // the run under way (an Animation), if any
  let binding = false, lastBind = 0;
  let fadeTimer = 0;

  // Her pose: '' stands, 'run', 'sit'. The strips face left, as the game draws her.
  const clip = (node, c) => { node.classList.toggle('is-run', c === 'run'); node.classList.toggle('is-sit', c === 'sit'); };
  const face = (node, dx) => { if (dx) node.classList.toggle('is-right', dx > 0); };
  // Where she is: mid-run the style already holds the destination, so the run's own frame.
  const at = () => parseFloat(run ? getComputedStyle(hn).translate : hn.style.translate) || 0;
  const place = (x) => { hn.style.translate = `${Math.round(x)}px 0`; };
  let pending = 0;       // a run waiting for its frame (runTo)
  function stopRun() { cancelAnimationFrame(pending); if (run) { run.cancel(); run = null; } clip(hn, ''); }

  /* Along the bar, from where she is to x: the run at its steady pace (--dur-run per 100 px),
     never shorter than a response from a standstill. The style holds the destination and the
     animation covers the way there, so nothing jumps when it ends. A new tab mid-run turns her
     from where she is, at the same pace. It starts on the next frame, pinned to that frame's
     time: the render a tab click sets off keeps the main thread busy while the old run goes on
     in the compositor, and a run measured before it would start behind her. */
  function runTo(x) {
    x = Math.round(x);
    if (still.matches) { stopRun(); place(x); return Promise.resolve(); }
    cancelAnimationFrame(pending);
    return new Promise((r) => { pending = requestAnimationFrame(() => {
      const running = !!run, from = at(), dx = x - from;
      stopRun(); place(x);
      if (!dx) { r(); return; }
      face(hn, dx); clip(hn, 'run');
      const pace = Math.abs(dx) * ms('--dur-run') / 100;
      run = hn.animate([{ translate: `${from}px 0` }, { translate: `${x}px 0` }], { duration: running ? pace : Math.max(ms('--dur'), pace), easing: 'linear' });
      run.startTime = document.timeline.currentTime;
      run.onfinish = () => { run = null; clip(hn, ''); r(); }; run.oncancel = r;
    }); });
  }

  /* ── The screen bar ── */
  const tabs = () => el.nav.querySelector('.nav-tabs');
  const activeTab = () => Array.from(el.nav.querySelectorAll('.nav-tabs > .nav-tab[aria-current="page"]')).find((a) => a.offsetParent !== null) || null;
  // Under the middle of the tab's title, on the bar's bottom edge.
  const spotBy = (tab) => tab.offsetLeft + tab.offsetWidth / 2 - hn.offsetWidth / 2;

  /* Onto the bar, at the spot the callback sets. Already there: just the spot (and a fade-out
     under way is called off). Otherwise, the first time or back from a phone's width: fading in. */
  function mount(box, spot) {
    clearTimeout(fadeTimer);
    box.classList.add('has-hn');
    if (hn.parentNode === box) { hn.classList.remove('is-out'); perch = 'bar'; spot(); return; }
    stopRun();
    hn.classList.add('is-out');
    box.appendChild(hn);
    perch = 'bar';
    spot();
    void hn.offsetWidth; hn.classList.remove('is-out');   // a flush in between, so the fade runs
  }
  /* Off the bar, fading out (a phone's width); the rule marks the tab again. */
  function unmount() {
    clearTimeout(fadeTimer);
    const box = tabs();
    if (box) box.classList.remove('has-hn');
    if (!hn.isConnected) { perch = ''; tabId = ''; return; }
    hn.classList.add('is-out');
    fadeTimer = setTimeout(() => { stopRun(); hn.remove(); perch = ''; tabId = ''; }, ms('--dur-slow'));
  }
  // Under the current tab: running there if the tab changed, sitting once she's there.
  function syncBar() {
    const tab = activeTab(), id = tab.dataset.value;
    mount(tabs(), () => {
      if (binding) return;                     // she takes her spot once she's done binding
      if (tabId && tabId !== id) runTo(spotBy(tab)).then(() => { if (!run && !binding) clip(hn, 'sit'); });
      else if (!run) { place(spotBy(tab)); clip(hn, 'sit'); }
      tabId = id;
    });
  }

  /* The easter egg: a click and she binds, as the game heals: she gets up and stands still while
     a white light swells around her and fades (css: .is-bind, --dur-flash), then sits again. */
  async function bind() {
    if (!hn.isConnected || still.matches || binding || performance.now() - lastBind < 2000) return;
    lastBind = performance.now(); binding = true;
    stopRun();
    clip(hn, ''); hn.classList.add('is-bind');
    track('hornet');
    await after(ms('--dur-flash'));
    hn.classList.remove('is-bind'); binding = false;
    clip(hn, 'sit'); sync();
  }

  /* ── The whole ── */
  function sync() {
    if (document.hidden) return;             // she catches up when the tab comes back (visibilitychange)
    if (activeTab() && !phone.matches) syncBar(); else unmount();
  }
  function start() {
    hn.addEventListener('click', bind);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopRun(); else sync(); });
    // The bar reflows (the window resized, the language changed): back under her tab, without running.
    if (window.ResizeObserver) {
      new ResizeObserver(() => { if (perch === 'bar' && !run && !binding) { const tab = activeTab(); if (tab) place(spotBy(tab)); } }).observe(tabs());
    }
    still.addEventListener('change', () => { stopRun(); sync(); });
    phone.addEventListener('change', sync);
    sync();
  }

  // Where she is, for a smoke test in a browser.
  const state = () => ({ perch, tabId, cls: hn.className });
  App.hornet = { start, sync, state };
})();
