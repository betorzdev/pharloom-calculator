/* js/app.js — Pharloom's core: preferences, URL, header, screen bar, general render and events.
   The page is made of screens, like the game's pause menu: a one-row header, the screen bar
   and, one at a time, the screens (design/00-study.md §9 says which and in what order they're
   built). The screen travels in the URL ("view="), and so does the language ("lang=") when it
   isn't the page's own; the build will travel there too (phase 3), and splitHash keeps its
   place for it.
   Every state change repaints from templates; a single listener delegated by data-act handles
   the clicks. The language comes from js/i18n.js and applies to the whole render.
   Each screen has its own classic script (js/app-*.js), loaded after this one; they share
   SS.app ("App"). What changes value lives in App and is read as App.state; what doesn't is
   exported once with Object.assign(App, …) and each script takes it at the top from the
   scripts before it. A screen registers its painter in App.screens[view]; with none, the core
   paints the screen's head and says which phase brings it. A script reaches what's defined in
   a later one as App.name, which only happens at run time. js/app-boot.js, the last one,
   starts the page. */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const I = SS.i18n;
  const App = SS.app = {};

  const t = (k, v) => I.t(k, v);
  const pick = (v) => I.pick(v);

  // Every key starts with pharloom.: the Hollow Knight site shares this origin (CLAUDE.md).
  const KEY = { prefs: 'pharloom.prefs' };
  /* The page's own language: es/index.html will be the Spanish copy, with its own address so
     that search engines index the Spanish too. Read before setLang() rewrites <html lang>. */
  const PAGE_LANG = document.documentElement.lang === 'es' ? 'es' : 'en';
  /* The page's own screen: each search intent will have a page of its own (phase 8), the whole
     site opened on one screen, and <html data-view> says which. The root pages have none. */
  const PAGE_VIEW = document.documentElement.dataset.view || null;
  const BARE_VIEW = PAGE_VIEW || 'home';
  const PAGE_HEAD = { title: document.title, description: (document.querySelector('meta[name="description"]') || {}).content || '' };
  const $ = (sel) => document.querySelector(sel);
  const el = {
    page: $('.page'), masthead: $('#masthead'), colophon: $('#colophon'), about: $('#about'), nav: $('#nav'),
    screens: $('.screens'), banner: $('#banner'), toast: $('#toast'),
  };
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)');

  /* The screens, in two groups: your game as the save says it (Your game, the Inventory,
     Progress, the Map, the Journal) and the tools (the Crest screen and Combat). And the save
     slots, which aren't in the bar: the header opens them. */
  const VIEWS = ['home', 'game', 'progress', 'map', 'journal', 'tools', 'fight', 'saves'];
  const TOOLS = ['tools', 'fight'];
  // Which phase of the plan (design/00-study.md §9) brings each screen, while it isn't built.
  const PHASE = { home: 2, game: 2, progress: 2, map: 6, journal: 4, tools: 3, fight: 5, saves: 2 };
  const VIEW_KEY = { home: 'navHome', game: 'navGame', progress: 'navProgress', map: 'navMap', journal: 'navJournal',
    tools: 'navTools', fight: 'navFight', saves: 'savesTitle' };

  /* ── Utilities ───────────────────────────────────────────────────────── */
  /* Game names stay as the game says them even if a browser translator translates the page. */
  const NT = ' translate="no"';
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const load = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const save = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* no storage */ } };
  App.NF = {};
  const rebuildNF = () => { App.NF = { 0: I.nf(0), 1: I.nf(1), 2: I.nf(2), 3: I.nf(3) }; };
  const pctSpace = () => (I.current === 'es' ? ' %' : '%');

  /* ── Preferences ─────────────────────────────────────────────────────── */
  let prefs = { lang: 'en', langChosen: false, view: 'home', tool: 'tools' };
  function loadPrefs() {
    try { Object.assign(prefs, JSON.parse(load(KEY.prefs) || '{}')); } catch (e) { /* corrupt prefs */ }
    // Until someone chooses (selector or link), the browser's language.
    if (!prefs.langChosen || !['es', 'en'].includes(prefs.lang)) prefs.lang = browserLang();
    if (!VIEWS.includes(prefs.view)) prefs.view = 'home';
    if (!TOOLS.includes(prefs.tool)) prefs.tool = 'tools';
  }
  const savePrefs = () => save(KEY.prefs, JSON.stringify(prefs));
  function browserLang() {
    let list = [];
    try { list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]; } catch (e) { /* no navigator */ }
    for (const tag of list) {
      const base = String(tag || '').toLowerCase().split('-')[0];
      if (base === 'es' || base === 'en') return base;
    }
    return 'en';
  }

  /* ── The URL and the history ─────────────────────────────────────────── */
  /* The language and the screen travel in the hash with the build, but aren't part of it. */
  function splitHash(hash) {
    const text = String(hash || '').replace(/^#/, '');
    const keep = [];
    let lang = null, view = null;
    for (const pair of text.split('&')) {
      if (/^lang=/.test(pair)) lang = pair.slice(5);
      else if (/^view=/.test(pair)) view = pair.slice(5);
      else if (pair) keep.push(pair);
    }
    return { build: keep.join('&'), lang: ['es', 'en'].includes(lang) ? lang : null, view: VIEWS.includes(view) ? view : null };
  }
  App.build = '';   // the build's share of the hash, as it came (phase 3 encodes it)
  const hashFor = (view = prefs.view) => '#' + App.build + (prefs.lang !== PAGE_LANG ? '&lang=' + prefs.lang : '')
    + (view && view !== BARE_VIEW ? '&view=' + view : '');
  const here = (hash) => location.pathname + location.search + (hash === '#' ? '' : hash.replace(/^#&/, '#'));
  /* Where you are, which is the screen and what each screen's script registers in
     App.navParts as { get, set }. Back and Forward walk through these; the build isn't a
     place and stays as it is. */
  App.navParts = {};
  function navNow() {
    const nav = { view: prefs.view };
    for (const k of Object.keys(App.navParts)) nav[k] = App.navParts[k].get();
    return nav;
  }
  const navKey = (nav) => JSON.stringify(nav);
  function applyNav(nav) {
    const was = navKey(navNow());
    const viewChanged = !!nav.view && nav.view !== prefs.view;
    if (viewChanged) setView(nav.view);
    for (const k of Object.keys(App.navParts)) if (nav[k] !== undefined) App.navParts[k].set(nav[k]);
    return { viewChanged, changed: was !== navKey(navNow()) };
  }
  /* Every change of place leaves a history entry ({ss: 1}, the place and where it was pushed
     from); build changes rewrite the entry you're on. */
  function writeUrl(push) {
    const url = hashFor();
    const nav = navNow(), key = navKey(nav);
    const cur = history.state && history.state.ss ? history.state : null;
    try {
      if (push) history.pushState({ ss: 1, nav, key, from: cur ? cur.key : null }, '', here(url));
      else if (location.hash !== url.replace(/^#&/, '#') || !cur || cur.key !== key) history.replaceState({ ss: 1, nav, key, from: cur ? cur.from : null }, '', here(url));
    } catch (e) { if (location.hash !== url) location.hash = url; }
  }
  function navTo(back) {
    const key = navKey(navNow());
    const cur = history.state && history.state.ss ? history.state : null;
    if (back && cur && cur.from === key) { try { history.back(); return; } catch (e) { /* stays as a new entry */ } }
    if (!cur || cur.key !== key) writeUrl(true);
  }
  /* A GoatCounter event (index.html loads it). Only the name travels, never the hash. Without
     the script (blocked, offline, file://) it does nothing. */
  function track(name) {
    try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: name, title: name, event: true }); } catch (e) {}
  }
  const persist = () => { writeUrl(false); };

  /* ── Header and screen bar ───────────────────────────────────────────── */
  /* The atmosphere behind the whole page (css/app.css, .atmos): the main menu's red light, its
     vignette and 40 embers rising, in fixed places spread without randomness so that two loads come
     out the same. Put in once and never repainted. */
  const MOTES = Array.from({ length: 40 }, (_, i) => {
    const r = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    const dx = (r(6) - 0.5) * 160;
    return `<i style="--x:${(4 + r(1) * 88).toFixed(1)}%;--s:${(1.5 + r(2) * 2).toFixed(1)}px;--t:${(22 + r(3) * 20).toFixed(1)}s;--d:${(-r(4) * 42).toFixed(1)}s;--o:${(0.35 + r(5) * 0.55).toFixed(2)};--dx:${dx.toFixed(0)}px;--tilt:${(dx / 12).toFixed(1)}deg"></i>`;
  }).join('');
  el.page.insertAdjacentHTML('afterbegin', `<div class="atmos" aria-hidden="true">${MOTES}</div>`);

  function renderMasthead() {
    const own = prefs.lang === PAGE_LANG && prefs.view === (PAGE_VIEW || 'home');
    document.title = own ? PAGE_HEAD.title : prefs.view === 'home' ? t('docTitle') : t(VIEW_KEY[prefs.view]) + ' · ' + t('title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', own ? PAGE_HEAD.description : t('metaDescription'));
    for (const v of VIEWS) { const sec = screenOf(v); if (sec) sec.setAttribute('aria-label', t(VIEW_KEY[v])); }
    const langBtn = (code, label) => `<button type="button" lang="${code}" data-act="lang" data-value="${code}" aria-pressed="${prefs.lang === code}" aria-label="${label}" title="${label}">${code.toUpperCase()}</button>`;
    el.masthead.innerHTML = `
      <div class="mh-tools">
        <div class="seg langsel" role="group" aria-label="${esc(t('langGroup'))}">${langBtn('en', 'English')}${langBtn('es', 'Español')}</div>
      </div>
      <a class="brand" href="${here(hashFor('home'))}" data-act="view" data-value="home" title="${esc(t('goHome'))}">
        <p class="title">${esc(t('title'))}</p>
      </a>
      ${App.saveLink ? App.saveLink() : ''}`;
  }

  /* The About block: the page's text for search engines. It's in the page's language and about
     its own screen, so it only shows there. */
  let aboutLinks = false;
  function renderAbout() {
    if (!el.about) return;
    el.about.hidden = prefs.lang !== PAGE_LANG || prefs.view !== (PAGE_VIEW || 'home');
    if (aboutLinks || location.protocol !== 'file:') return;
    aboutLinks = true;
    for (const a of el.about.querySelectorAll('a[data-page]')) a.setAttribute('href', a.getAttribute('href').replace(/\.\/$/, '') + 'index.html');
  }
  /* The same page in the other language, when it exists (phase 8 writes each page in both,
     and its hreflang links say where): choosing a language goes there. Without one, or inside
     a frame, the language changes in place. */
  function langPage(lang) {
    try {
      if (window.top !== window.self) return null;
      const alt = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      const canon = document.querySelector('link[rel="canonical"]');
      if (!alt || !canon) return null;
      const base = document.querySelector('base');
      const root = new URL(base ? base.getAttribute('href') : './', canon.href).href;
      if (alt.href.indexOf(root) !== 0) return null;
      const path = alt.href.slice(root.length) + (location.protocol === 'file:' ? 'index.html' : '');
      return new URL(path || './', document.baseURI).href + hashFor().replace(/&lang=\w+/, '');
    } catch (e) { return null; }
  }

  // GitHub's mark (Octicons mark-github), in currentColor so it takes the links' accent.
  const GITHUB = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  /* The footer, under every screen: a fan project with Team Cherry's artwork, where the numbers
     come from (docs/guide.md, "Credits and licences") and who to write to. */
  function renderColophon() {
    const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${esc(text)}</a>`;
    el.colophon.setAttribute('aria-label', t('footLabel'));
    el.colophon.innerHTML = `
      <p>${t('footFan', { tc: ext('https://www.teamcherry.com.au/', 'Team Cherry') })}</p>
      <p>${t('footData', { wiki: ext('https://hollowknight.wiki/', 'hollowknight.wiki'), lic: ext('https://creativecommons.org/licenses/by-sa/3.0/', 'CC BY-SA 3.0') })}</p>
      <p>${t('footMade', { mail: '<a href="mailto:betorzdev@gmail.com">betorzdev@gmail.com</a>' })}
        <a class="gh" href="https://github.com/betorzdev/pharloom-calculator" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${GITHUB}</a></p>`;
  }

  /* The screen bar lives in index.html and here only its texts and which one is active change:
     repainted whole, the focus would be lost when switching screens. */
  function renderNav() {
    el.nav.setAttribute('aria-label', t('navLabel'));
    for (const a of el.nav.querySelectorAll('[data-act="view"]')) {
      const v = a.dataset.value;
      a.textContent = t(VIEW_KEY[v]);
      a.setAttribute('href', here(hashFor(v)));
      if (v === prefs.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
  }

  /* ── Ornaments ───────────────────────────────────────────────────────── */
  const brackets = '<span class="bk tl"></span><span class="bk tr"></span><span class="bk bl"></span><span class="bk br"></span>';
  const chevron = (up) => `<svg class="ic chev ${up ? 'up' : ''}" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1.5 L6 6 L11 1.5"/></svg>`;
  const lens = '<svg class="ic" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="5" r="3.6"/><path d="M7.8 7.8 L10.8 10.8"/></svg>';
  const tick = '<svg class="ic" width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 5.2 L4.6 8.2 L10.5 1.8"/></svg>';
  const cross = '<svg class="ic" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 2 L10 10 M10 2 L2 10"/></svg>';
  /* The pointers of the game's menus, either side of the item you're on (drawn: the wiki doesn't
     have the sprite). The slots' buttons on Saves and the header's save selector carry them. */
  const FLEUR = '<svg viewBox="0 0 12 20" fill="currentColor" aria-hidden="true"><path d="M1 10 C4.5 9.4 7.2 7.2 8.6 2.4 C9 6.4 10 8.8 11.6 10 C10 11.2 9 13.6 8.6 17.6 C7.2 12.8 4.5 10.6 1 10 Z"/><circle cx="2.4" cy="10" r="1.3"/></svg>';
  const FLEURS = `<span class="save-fleur is-l">${FLEUR}</span><span class="save-fleur is-r">${FLEUR}</span>`;
  // The game's sprites (tools/fetch-art.js, npm run art).
  const ART = {
    mask: 'assets/hud/mask.png', spool: 'assets/hud/spool.png', spoolEmpty: 'assets/hud/spool-empty.png',
    resting: 'assets/hornet/resting.png', idle: 'assets/hornet/idle.png', corpse: 'assets/hornet/corpse.png',
    needle: (n) => `assets/needles/${Math.max(0, Math.min(4, n | 0))}.png`,
  };
  const rule = `<svg class="rule" width="220" height="12" viewBox="0 0 220 12" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M0 6 H92"/><path d="M128 6 H220"/><path d="M110 1 L116 6 L110 11 L104 6 Z"/></svg>`;
  // An empty state (css: .empty): the rule, the text and, if there is one, the action that solves it.
  const emptyHtml = (text, act = '', { tag = 'p', cls = '' } = {}) =>
    `<${tag} class="empty${cls ? ' ' + cls : ''}"${tag === 'li' ? ' role="presentation"' : ''}>${rule}<span>${text}</span>${act}</${tag}>`;
  /* Each screen's header: the title in Cinzel, centred, with its rule and the diamond, inside
     the black. The title gets focus when arriving from another screen. */
  const screenHead = (title, after = '') => `<header class="screen-head"><h2 class="sec-title screen-title" tabindex="-1">${title}</h2>${rule}${after}</header>`;

  /* ── The screens ─────────────────────────────────────────────────────── */
  App.screens = {};   // view → painter, registered by each screen's script (js/app-*.js)
  const screenOf = (v) => el.screens.querySelector(`.screen[data-view="${v}"]`);
  function renderScreens() {
    for (const v of VIEWS) {
      const sec = screenOf(v);
      if (!sec) continue;
      if (App.screens[v]) { App.screens[v](sec); continue; }
      const study = `<a class="text-btn" href="https://github.com/betorzdev/pharloom-calculator/blob/main/design/00-study.md" target="_blank" rel="noopener">${esc(t('soonStudy'))}</a>`;
      sec.innerHTML = brackets + screenHead(esc(t(VIEW_KEY[v]))) + emptyHtml(esc(t('soon', { n: PHASE[v] })), study);
    }
  }
  function showScreen() {
    for (const v of VIEWS) { const sec = screenOf(v); if (sec) sec.hidden = v !== prefs.view; }
  }

  /* ── General render ──────────────────────────────────────────────────── */
  App.refocusing = false;
  function restoreFocus(desc) {
    if (!desc) return;
    const node = document.querySelector(desc.sel);
    if (!node) return;
    App.refocusing = true;
    node.focus({ preventScroll: true });
    App.refocusing = false;
  }
  function focusDescriptor() {
    const node = document.activeElement;
    if (!node || !node.dataset || !node.dataset.act) return null;
    const parts = [`[data-act="${node.dataset.act}"]`];
    for (const k of ['id', 'key', 'value']) if (node.dataset[k] !== undefined) parts.push(`[data-${k}="${node.dataset[k]}"]`);
    return { sel: parts.join('') };
  }
  function render() {
    const focus = focusDescriptor();
    renderMasthead();
    renderAbout();
    renderColophon();
    renderNav();
    renderScreens();
    // The notice above the screens when following the game needs you (js/app-saves.js).
    if (el.banner) el.banner.innerHTML = App.liveBanner ? App.liveBanner() : '';
    showScreen();
    restoreFocus(focus);
  }

  /* ── Switching screens ───────────────────────────────────────────────── */
  function setView(v) {
    prefs.view = VIEWS.includes(v) ? v : 'home';
    if (TOOLS.includes(prefs.view)) prefs.tool = prefs.view;
    savePrefs();
  }
  /* Leaves a history entry and scrolls up to the top of the screen, which sits just below the
     bar. Arriving from inside another screen, focus goes to its title. */
  function go(v, focusHead) {
    const changed = v !== prefs.view;
    setView(v);
    navTo(false);
    render();
    if (changed) { track('screen-' + prefs.view); fadeIn(screenOf(prefs.view)); }
    if (changed) {
      const start = el.masthead.offsetTop + el.masthead.offsetHeight;
      if (scrollY > start) scrollTo(0, start);
    }
    if (focusHead) {
      const h = screenOf(prefs.view).querySelector('.screen-title');
      if (h) h.focus({ preventScroll: true });
    }
  }
  const fadeIn = (node) => { if (!node) return; node.classList.remove('is-entering'); void node.offsetWidth; node.classList.add('is-entering'); };

  /* A notice, like the game's on-screen messages: the text between two short rules with their
     diamond, over a soft dark veil, fading in and out (css: .toast), just under the screen bar. */
  const TOAST_RULE = '<svg class="toast-rule" width="44" height="10" viewBox="0 0 44 10" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M0 5 H17"/><path d="M27 5 H44"/><path d="M22 1.5 L25.5 5 L22 8.5 L18.5 5 Z"/></svg>';
  let toastTimer = 0, toastGone = 0;
  function toast(msg, art = '') {
    clearTimeout(toastTimer); clearTimeout(toastGone);
    el.toast.hidden = false;
    const text = String(msg).split(/(\d+(?:[.,]\d+)?)/).map((part, i) => (i % 2 ? `<b class="toast-num">${part}</b>` : esc(part))).join('');
    el.toast.innerHTML = `${TOAST_RULE}${art ? `<img class="toast-art" src="${art}" alt="">` : ''}<span class="toast-t">${text}</span>${TOAST_RULE}`;
    const edge = Math.max(0, el.nav.getBoundingClientRect().bottom);
    el.toast.style.top = `calc(${Math.round(edge)}px + var(--sp-3))`;
    el.toast.classList.remove('is-on'); void el.toast.offsetWidth; el.toast.classList.add('is-on');
    const hold = 2400 + Math.max(0, String(msg).split(/\s+/).length - 10) * 200;
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('is-on');
      toastGone = setTimeout(() => { el.toast.hidden = true; }, 400);
    }, hold);
  }

  /* ── Actions ─────────────────────────────────────────────────────────── */
  /* What each data-act does. Here, the header's and the bar's; each screen's script adds its
     own with Object.assign(actions, …). */
  const actions = {
    lang(node) {
      const next = node.dataset.value;
      if (next === prefs.lang) return;
      const page = langPage(next);
      prefs.lang = I.setLang(next);
      prefs.langChosen = true;
      track('lang-' + prefs.lang);
      savePrefs();
      if (page) { persist(); location.href = page; return; }
      rebuildNF();
      persist();
      render();
    },
    view(node) { go(node.dataset.value, !node.closest('#nav, .masthead')); },
  };
  document.addEventListener('click', (ev) => {
    const node = ev.target.closest('[data-act]');
    if (!node) return;
    if (node.tagName === 'A' && (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button)) return;
    const act = node.dataset.act;
    if (actions[act]) { ev.preventDefault(); actions[act](node); }
  });
  /* Back and Forward. The entries the site leaves (marked {ss: 1}) only change the place; a
     link typed or pasted by hand brings its language and its screen. */
  function onHistory() {
    const h = splitHash(location.hash);
    if (history.state && history.state.ss) {
      const { viewChanged, changed } = applyNav(history.state.nav || { view: h.view || BARE_VIEW });
      writeUrl(false);
      if (!changed) return;
      render();
      if (viewChanged) fadeIn(screenOf(prefs.view));
      return;
    }
    if (h.lang && h.lang !== prefs.lang) { prefs.lang = I.setLang(h.lang); prefs.langChosen = true; savePrefs(); rebuildNF(); }
    setView(h.view || BARE_VIEW);
    writeUrl(false);
    render();
  }
  window.addEventListener('popstate', onHistory);
  window.addEventListener('hashchange', onHistory);

  Object.assign(App, { t, pick, KEY, PAGE_LANG, PAGE_VIEW, $, el, hoverable, VIEWS, TOOLS, NT, esc, load, save, rebuildNF, pctSpace,
    prefs, loadPrefs, savePrefs, splitHash, hashFor, here, persist, navNow, applyNav, writeUrl, navTo, track,
    brackets, chevron, lens, tick, cross, rule, FLEURS, ART, emptyHtml, screenHead, screenOf, render, go, toast, actions, restoreFocus, focusDescriptor });
})();
