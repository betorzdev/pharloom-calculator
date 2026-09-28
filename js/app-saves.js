/* js/app-saves.js — the Saves screen: free mode, and the four slots like the game's profile
   screen, with what each game carries and the game's own buttons: Import from the game on an
   empty one (a save only comes from the game's file: there's no New Game, since a save isn't
   changed here), Clear with the game's own question on a full one. Any slot can take a game
   imported from the real one: its Import button opens the import view in place of the list,
   which explains how to find the game's file (by system, with the folder to copy), takes it by
   drag and drop or with the picker, and shows what it read before anything is written
   (js/savefile.js reads it; a restore point too). The rules (what goes in a slot, switching,
   clearing) are in js/saves.js. Where the browser can (js/live.js), the picker keeps a handle to
   the file and the slot can stay linked to it: it catches up each time the game saves.
   Carried over from hallownest-calculator's js/app-saves.js; what changed is what a slot
   shows (Hornet's masks and Needle, the Act, the 100% and the Journal) and where Silksong keeps
   its saves. Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const S = SS.saves, F = SS.savefile, L = SS.live, CP = SS.completion, D = SS.data, J = SS.journal;
  const App = SS.app;
  const { t, pick, NT, esc, FLEURS, ART, prefs, savePrefs, brackets, screenHead, render, actions, here, PAGE_LANG, toast, track, pctSpace, screenOf } = App;
  const el = { get saves() { return screenOf('saves'); }, get home() { return screenOf('home'); } };

  let store = null;
  try { store = localStorage; } catch (e) { store = null; }
  // The slot whose Clear is asking for confirmation, or 0.
  let clearing = 0;
  /* The slot just cleared, whose Import comes in fading, or 0. After clearing the game you
     were in the page reloads, so it's handed over in sessionStorage with the row's height and
     where it was on the screen: the new page puts it back in the same place (land). */
  const CLEARED_KEY = 'pharloom.cleared';
  let justCleared = 0, landing = null;
  try {
    const h = JSON.parse(sessionStorage.getItem(CLEARED_KEY) || 'null');
    sessionStorage.removeItem(CLEARED_KEY);
    if (h && typeof h === 'object' && Number(h.n)) { justCleared = Number(h.n); landing = h; }
  } catch (e) { justCleared = 0; landing = null; }
  if (landing) { try { history.scrollRestoration = 'auto'; } catch (e) { /* nothing to put back */ } }
  // The page came in veiled (index.html). If it doesn't land on the row, the veil goes all the same.
  const unveil = () => document.documentElement.classList.remove('is-landing');
  if (document.documentElement.classList.contains('is-landing')) setTimeout(unveil, 2000);
  // Entering a game (leave) veils the page too: the new one comes in with a fade once painted.
  const ENTERED_KEY = 'pharloom.entered';
  try {
    if (sessionStorage.getItem(ENTERED_KEY)) {
      sessionStorage.removeItem(ENTERED_KEY);
      requestAnimationFrame(() => requestAnimationFrame(unveil));
    }
  } catch (e) { /* it came in unveiled */ }
  if (justCleared) setTimeout(() => { justCleared = 0; }, 1000);
  /* The import view: the slot it's for (0: the list shows), the system whose steps it shows,
     and the file: 'idle', 'reading', 'ready' (read: { name, snap, meta, restore }) or 'error'. */
  const imp = { n: 0, os: 'win', state: 'idle', file: null, fresh: false, copied: 0, sync: true, chosen: false };
  /* The link with the game (js/live.js): the linked slots ({ n: file name }), and the active
     slot's watcher and what it says: '' (not linked), 'live', 'paused' or 'lost'. */
  const live = { links: {}, ready: false, n: 0, name: '', state: '', watcher: null };
  const pickSave = () => showOpenFilePicker({ id: 'ss-save', multiple: false,
    types: [{ description: 'Hollow Knight: Silksong', accept: { 'application/octet-stream': ['.dat'], 'application/json': ['.json'] } }] });

  /* ── What a slot carries ─────────────────────────────────────────────── */
  const num = (n) => App.NF[0].format(n);
  // A restore point's day (yyyy/mm/dd) in the language's own way: «6 sept 2026», "6 Sept 2026".
  const dayOf = (ymd) => {
    const [y, m, d] = ymd.split('/').map(Number);
    try { return new Date(y, m - 1, d).toLocaleDateString(App.prefs.lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ymd; }
  };
  /* The Hunter's Journal as Nuu counts it: the required entries with their kills done (230, or
     231 in Steel Soul, js/journal.js). The Journal screen (phase 4) refines it: the entries
     completed some other way. */
  const bookTotal = (steel) => J.REQUIRED[steel ? 'steel' : 'classic'];
  const bookDone = (book, steel) => J.BOOK.filter((e) => !e.optional && (!e.steel || steel) && CP.journalDone(e, book)).length;
  function summary(snap) {
    const g = F.gameOf(snap), m = F.metaOf(snap);
    return { g, m, masks: 5 + g.masks, done: CP.count(g).total, journal: bookDone(g.journal, m.steel), bookMax: bookTotal(m.steel) };
  }
  const needleName = (n) => pick(D.NEEDLES[Math.max(0, Math.min(4, n))].name);
  const masksHtml = (n) => Array.from({ length: n }, (_, i) => `<img src="${ART.mask}" alt="" style="--r:${n - 1 - i}">`).join('');
  const fact = (k, v, max, pct) => `<span class="save-fact"><span class="save-k">${esc(k)}</span><b>${num(v)}${pct ? pctSpace() : ''}</b><i class="u">${max != null ? '/' + num(max) : ''}</i></span>`;

  function card(slot) {
    const n = slot.n, free = n === S.FREE;
    const label = free ? t('freeMode') : t('saveSlot', { n });
    // An empty slot's one way in is the game's file: importing is its whole row.
    if (!slot.snap) {
      return `<li class="save is-empty${justCleared === n ? ' is-cleared' : ''}" data-slot="${n}">
        <button type="button" class="save-main" data-act="saveImport" data-value="${n}" aria-label="${esc(label + ': ' + t('saveImport'))}">
          <span class="save-n">${n}</span>
          <span class="save-new">${FLEURS}${ICON_IMPORT}<span class="save-act-long">${esc(t('saveImport'))}</span><span class="save-act-short">${esc(t('saveImportShort'))}</span></span>
        </button>
      </li>`;
    }
    const here_ = slot.active ? `<span class="save-tag">${esc(t('saveCurrent'))}</span>` : '';
    if (free) {
      return `<li class="save is-free${slot.active ? ' is-active' : ''}" data-slot="0">
        <button type="button" class="save-main" data-act="savePick" data-value="0"${slot.active ? ' aria-current="true"' : ''}
          aria-label="${esc(label + (slot.active ? ', ' + t('saveCurrent') : ''))}" title="${esc(slot.active ? t('saveContinue') : t('saveLoad'))}">
          <span class="save-n"><img src="${ART.idle}" alt=""></span>
          <span class="save-name"><b>${esc(label)}</b>${here_}</span>
        </button>
        <span class="save-foot save-note">${esc(t('freeModeNote'))}</span>
      </li>`;
    }
    const s = summary(slot.snap);
    const facts = [
      fact(t('completion'), s.done, null, true),
      fact(t('homeJournal'), s.journal, s.bookMax),
    ].join('');
    const act = `<span class="save-where">${esc(t('saveAct', { n: s.g.act }))}${s.m.steel ? ` · <span${NT}>${esc(t(s.m.dead ? 'saveDefeated' : 'steelSoul'))}</span>` : ''}</span>`;
    const linked = live.links[n] != null ? `<span class="save-link${slot.active && live.state ? ' is-' + live.state : ''}">
        <span class="save-link-t">${esc(t('liveFollows', { file: live.links[n] }))}${slot.active && live.state ? ` · <b>${esc(t('liveState_' + live.state))}</b>` : ''}</span>
        <button type="button" class="text-btn" data-act="liveUnlink" data-value="${n}">${esc(t('liveUnlink'))}</button>
      </span>` : '';
    const confirm = clearing === n ? ask('saveClearAsk', 'saveClear', n, 'saveClearNote')
      : `${linked ? '' : followBtn(n)}${importBtn(n)}<button type="button" class="save-act is-clear" data-act="saveClear" data-value="${n}">
          ${FLEURS}${ICON_CLEAR}<span class="save-act-t">${esc(t('saveClear'))}</span></button>`;
    return `<li class="save${slot.active ? ' is-active' : ''}${s.m.dead ? ' is-dead' : ''}" data-slot="${n}">
      <button type="button" class="save-main" data-act="savePick" data-value="${n}"${slot.active ? ' aria-current="true"' : ''}
        aria-label="${esc(label + (slot.active ? ', ' + t('saveCurrent') : ''))}" title="${esc(slot.active ? t('saveContinue') : t('saveLoad'))}">
        <span class="save-n">${n}</span>
        ${here_}
        <span class="save-hud"><span class="save-masks">${masksHtml(s.masks)}</span></span>
        <span class="save-nail"><img src="${ART.needle(s.g.needle)}" alt="" width="80" height="600"><span${NT}>${esc(needleName(s.g.needle))}</span></span>
        <span class="save-facts">${act}${facts}</span>
      </button>
      <span class="save-foot">${linked}${confirm}</span>
    </li>`;
  }

  /* A slot's buttons are the game's menu items: its capitals, and on hover or focus the menu's
     pointers either side. Their icons: a tray with an arrow coming in, a bin, two arrows turning. */
  const ICON_IMPORT = '<svg class="save-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12.5 V16.5 H17 V12.5"/><g class="save-ico-arrow"><path d="M10 2.5 V11.5"/><path d="M6.2 8 L10 11.8 L13.8 8"/></g></svg>';
  const ICON_CLEAR = '<svg class="save-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="save-ico-lid"><path d="M3 5.5 H17"/><path d="M7.8 5.5 V3.5 H12.2 V5.5"/></g><path d="M4.8 5.5 L5.8 17.5 H14.2 L15.2 5.5"/><path d="M8.3 8.8 V14.2"/><path d="M11.7 8.8 V14.2"/></svg>';
  const ICON_FOLLOW = '<svg class="save-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="save-ico-turn"><path d="M16 8.5 A6.2 6.2 0 0 0 4.6 6.4"/><path d="M4.2 3.2 V6.8 H7.8"/><path d="M4 11.5 A6.2 6.2 0 0 0 15.4 13.6"/><path d="M15.8 16.8 V13.2 H12.2"/></g></svg>';
  const followBtn = (n) => (live.ready && L.canLive() ? `<button type="button" class="save-act is-follow" data-act="liveFollow" data-value="${n}"
    aria-label="${esc(t('saveSlot', { n }) + ': ' + t('liveFollow'))}" title="${esc(t('liveFollowHint'))}">${FLEURS}${ICON_FOLLOW}<span class="save-act-t"><span class="save-act-long">${esc(t('liveFollow'))}</span><span class="save-act-short">${esc(t('liveFollowShort'))}</span></span></button>` : '');
  const importBtn = (n) => `<button type="button" class="save-act is-import" data-act="saveImport" data-value="${n}"
    aria-label="${esc(t('saveSlot', { n }) + ': ' + t('saveImport'))}">${FLEURS}${ICON_IMPORT}<span class="save-act-t"><span class="save-act-long">${esc(t('saveImport'))}</span><span class="save-act-short">${esc(t('saveImportShort'))}</span></span></button>`;
  // The question before clearing, the game's own, with a note under it: yes, no.
  const ask = (q, act, n, note) => `<span class="save-ask" role="group" aria-label="${esc(t(q) + (note ? ' ' + t(note) : ''))}">
      <span class="save-ask-q">${esc(t(q))}</span>
      ${note ? `<span class="save-ask-note">${esc(t(note))}</span>` : ''}
      <span class="save-ask-yn"><button type="button" class="save-act" data-act="${act}Yes" data-value="${n}">${FLEURS}<span class="save-act-t">${esc(t('yes'))}</span></button>
      <button type="button" class="save-act" data-act="${act}No" data-value="${n}">${FLEURS}<span class="save-act-t">${esc(t('no'))}</span></button></span>
    </span>`;

  /* ── The import view ──────────────────────────────────────────────────
     Where each system keeps the game's saves (the wiki's Save Data (Silksong); the Linux one
     checked on the author's machine), and how its file picker takes a pasted folder: Windows
     expands %USERPROFILE% in the name box, macOS opens "Go to folder" with ⇧⌘G and GTK/KDE the
     location bar with Ctrl+L. Folders and keys aren't translated: they're what's on the disk. */
  const SYSTEMS = {
    win:   { name: 'Windows', dir: '%USERPROFILE%\\AppData\\LocalLow\\Team Cherry\\Hollow Knight Silksong', how: 'impHowWin', keys: [] },
    mac:   { name: 'macOS', dir: '~/Library/Application Support/unity.Team-Cherry.Silksong', how: 'impHowMac', keys: ['⇧⌘G'] },
    linux: { name: 'Linux', dir: '~/.config/unity3d/Team Cherry/Hollow Knight Silksong', how: 'impHowLinux', keys: ['Ctrl+L'] },
  };
  const ua = () => { try { return ((navigator.userAgentData && navigator.userAgentData.platform) || '') + ' ' + navigator.userAgent; } catch (e) { return ''; } };
  const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(ua());
  const detectOs = () => { const u = ua(); return /Mac/i.test(u) && !isMobile() ? 'mac' : /Linux|X11|CrOS/i.test(u) && !isMobile() ? 'linux' : 'win'; };
  const isDesktop = () => { try { return !isMobile() && !(/Mac/i.test(ua()) && navigator.maxTouchPoints > 1); } catch (e) { return false; } };

  const kbd = (k) => `<kbd translate="no">${esc(k)}</kbd>`;
  const FILE_ICON = '<svg class="imp-ficon" width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M1 1 H9 L13 5 V17 H1 Z"/><path d="M9 1 V5 H13"/></svg>';
  const DIR_ICON = '<svg class="imp-ficon" width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M1 2 H6 L7.5 3.5 H15 V13 H1 Z"/></svg>';
  const BACK = '<svg class="ic" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.5 L3.5 6 L8 10.5"/></svg>';

  function steps() {
    const sys = SYSTEMS[imp.os];
    const keys = sys.keys.map(kbd);
    const how = esc(t(sys.how, { k1: '\u0001', k2: '\u0002' }))
      .replace('\u0001', keys[0] || kbd(t('impEnter'))).replace('\u0002', kbd(t('impEnter')));
    const tabs = Object.entries(SYSTEMS).map(([id, x]) =>
      `<button type="button" data-act="importOs" data-value="${id}" aria-pressed="${id === imp.os}">${x.name}</button>`).join('');
    // What's in the folder: the account's folder, and in it the profiles and the restore points.
    const files = `<li translate="no">${DIR_ICON}123456789</li>`
      + [1, 2, 3, 4].map((k) => `<li translate="no">${FILE_ICON}user${k}.dat</li>`).join('')
      + `<li translate="no">${DIR_ICON}Restore_Points1</li>`;
    return `<ol class="imp-steps">
      <li class="imp-step" style="--i:0">
        <span class="imp-num" aria-hidden="true">1</span>
        <div class="imp-step-body">
          <h3 class="imp-step-title">${esc(t('impStep1'))}</h3>
          <div class="seg sm imp-os" role="group" aria-label="${esc(t('impOs'))}">${tabs}</div>
          <div class="imp-path">
            <code translate="no">${esc(sys.dir)}</code>
            <button type="button" class="text-btn imp-copy${imp.copied ? ' is-done' : ''}" data-act="importCopy">${esc(t(imp.copied ? 'impCopied' : 'impCopy'))}</button>
          </div>
        </div>
      </li>
      <li class="imp-step" style="--i:1">
        <span class="imp-num" aria-hidden="true">2</span>
        <div class="imp-step-body">
          <h3 class="imp-step-title">${esc(t('impStep2'))}</h3>
          <p class="imp-text">${how}</p>
        </div>
      </li>
      <li class="imp-step" style="--i:2">
        <span class="imp-num" aria-hidden="true">3</span>
        <div class="imp-step-body">
          <h3 class="imp-step-title">${esc(t('impStep3'))}</h3>
          <ul class="imp-files" aria-hidden="true">${files}</ul>
          <p class="imp-text">${esc(t('impFiles'))}</p>
        </div>
      </li>
    </ol>`;
  }

  // What the drop zone holds in each state. The file's contents go in the preview, as a slot's card would show them.
  function dropInner() {
    const choose = (key, primary) => `<button type="button" class="btn${primary ? ' btn-primary' : ''}" data-act="importPick">${esc(t(key))}</button>`;
    if (imp.state === 'ready') {
      const f = imp.file, s = summary(f.snap), m = f.meta;
      const img = (src, i) => `<img src="${src}" alt="" style="--i:${i}">`;
      const masks = Array.from({ length: s.masks }, (_, i) => img(ART.mask, i)).join('');
      const h = Math.floor(m.time / 3600), min = Math.floor((m.time % 3600) / 60);
      const metaBits = [
        `<span>${esc(t('impTime', { h: num(h), m: num(min) }))}</span>`,
        `<span><span class="save-k">${esc(t('completion'))}</span> <b>${num(Math.floor(m.completion))}${pctSpace()}</b></span>`,
        `<span><span class="save-k"${NT}>${esc(t('rosaries'))}</span> <b>${num(m.rosaries)}</b></span>`,
      ].join('');
      const verText = [m.version ? t('impVersion', { v: m.version }) : '', f.restore && f.restore.date ? t('impRestore', { date: dayOf(f.restore.date) }) : '']
        .filter(Boolean).join(' · ');
      const ver = verText ? `<span class="imp-ver" translate="no">${esc(verText)}</span>` : '';
      const facts = [
        fact(t('saveAct', { n: s.g.act }).replace(/\s*\d+$/, ''), s.g.act),
        fact(t('homeJournal'), s.journal, s.bookMax),
        fact(t('cat_tools'), CP.count(s.g).categories[0].got, 51),
      ].join('');
      const full = store && S.list(store)[imp.n].snap;
      return `<div class="imp-found" role="status">
          <p class="imp-fname" translate="no">${FILE_ICON}${esc(f.name)}${m.steel ? `<span class="tag imp-steel"${NT}>${esc(t(m.dead ? 'saveDefeated' : 'steelSoul'))}</span>` : ''}</p>
          <div class="imp-hud"><span class="save-masks">${masks}</span></div>
          <div class="imp-nail"><img src="${ART.needle(s.g.needle)}" alt="" width="80" height="600"><span${NT}>${esc(needleName(s.g.needle))}</span></div>
          <p class="imp-meta">${metaBits}${ver}</p>
          <p class="save-facts imp-facts">${facts}</p>
          ${full ? `<p class="imp-warn">${esc(t('impReplace', { n: imp.n }))}</p>` : ''}
          ${f.handle ? syncOpt() : ''}
          <div class="imp-actions">
            <button type="button" class="btn btn-primary" data-act="importDo">${esc(t('impTitle', { n: imp.n }))}</button>
            <button type="button" class="text-btn" data-act="importPick">${esc(t('impOther'))}</button>
          </div>
        </div>`;
    }
    if (imp.state === 'error') {
      return `<div class="imp-still">
          <img class="imp-figure is-fallen" src="${ART.corpse}" alt="" width="92" height="108">
          <p class="imp-err" role="alert">${esc(t('saveImportBad'))}</p>
          ${choose('impOther', true)}
        </div>`;
    }
    return `<div class="imp-still">
        <img class="imp-figure" src="${ART.idle}" alt="" width="186" height="216">
        <p class="imp-drop-title">${esc(t(imp.state === 'reading' ? 'impReading' : 'impDrop'))}</p>
        <p class="imp-drop-drag" aria-hidden="true">${esc(t('impDropping'))}</p>
        ${imp.state === 'reading' ? '' : `<p class="imp-or">${esc(t('impOr'))}</p>${choose('impChoose', true)}`}
      </div>`;
  }
  // Following the game: what it is, and its value on the site's on/off box. A press switches it.
  const syncOpt = () => `<div class="imp-sync">
      <span class="imp-sync-k" id="imp-sync-k">${esc(t('impSync'))}</span>
      <button type="button" class="check imp-sync-v" role="switch" aria-checked="${imp.sync}" aria-labelledby="imp-sync-k"
        data-act="importSync"><span class="check-box" aria-hidden="true">${App.tick}</span><span class="imp-sync-t">${esc(t(imp.sync ? 'impSyncOn' : 'impSyncOff'))}</span></button>
      <p class="imp-sync-note">${esc(t('impSyncNote'))}</p>
    </div>`;
  const drop = () => `<div class="imp-drop" data-state="${imp.state}">
      <div class="imp-light" aria-hidden="true"></div>
      <div class="imp-drop-in">${dropInner()}</div>
      <p class="imp-private">${esc(t('impPrivate'))}</p>
    </div>`;
  // Only the drop zone changes with the file: the steps stay put.
  function paintDrop() {
    const z = el.saves.querySelector('.imp-drop');
    if (!z) { render(); return; }
    z.dataset.state = imp.state;
    z.querySelector('.imp-drop-in').innerHTML = dropInner();
  }

  function importView() {
    const fresh = imp.fresh;
    imp.fresh = false;
    return `<div class="saves-body imp${fresh ? ' is-fresh' : ''}">${brackets}
      <div class="imp-bar"><button type="button" class="text-btn imp-back" data-act="importClose">${BACK}${esc(t('savesTitle'))}</button></div>
      ${screenHead(esc(t('impTitle', { n: imp.n })), `<p class="saves-note">${esc(t('impLead'))}</p>`)}
      ${isMobile() ? `<p class="imp-mobile">${esc(t('impMobile'))}</p>` : ''}
      <div class="imp-grid">${steps()}${drop()}</div>
    </div>`;
  }

  function renderSaves(sec) {
    if (prefs.view !== 'saves') { imp.n = 0; sec.innerHTML = ''; return; }
    if (imp.n) { sec.innerHTML = importView(); return; }
    const [free, ...slots] = store ? S.list(store) : [{ n: S.FREE, active: true, snap: {} }];
    sec.innerHTML = `<div class="saves-body">${brackets}
      ${screenHead(esc(t('savesTitle')), `<p class="saves-note">${esc(t('savesNote'))}</p>`)}
      <div class="saves-lists">
        <ul class="saves-list is-free">${card(free)}</ul>
        ${slots.length ? `<ol class="saves-list">${slots.map(card).join('')}</ol>` : ''}
      </div>
    </div>`;
    if (landing) { const h = landing; landing = null; queueMicrotask(() => land(h)); }
  }
  App.screens.saves = renderSaves;

  /* Back from the reload after clearing the game you were in: the row where it was, the veil
     lifts once the fonts are in, then the row shrinks to the empty row's height. */
  function land(h) {
    const li = el.saves.querySelector(`.save[data-slot="${h.n}"]`);
    if (!li) { unveil(); return; }
    const from = Number(h.from) || 0, to = li.offsetHeight, shrinks = from > 0 && from !== to;
    if (shrinks) { li.style.height = from + 'px'; li.style.overflow = 'hidden'; }
    const at = () => { if (Number.isFinite(h.top)) window.scrollBy({ top: li.getBoundingClientRect().top - h.top, behavior: 'instant' }); };
    at();
    let fonts = Promise.resolve();
    try { if (document.fonts) fonts = document.fonts.ready; } catch (e) { /* no wait */ }
    Promise.race([fonts, new Promise((ok) => setTimeout(ok, 800))]).then(() => {
      at();
      unveil();
      if (shrinks) setTimeout(() => shrink(li, to), 400);
    });
  }

  /* Entering another game reloads the page, like the game's own loading screen: every screen
     reads its slot again from scratch. It lands on Your game (or on Saves, after clearing). */
  function enter(view = 'home', swap = null) {
    prefs.view = view;
    savePrefs();
    const hash = [prefs.lang !== PAGE_LANG ? 'lang=' + prefs.lang : '', view !== 'home' ? 'view=' + view : '']
      .filter(Boolean).map((x, i) => (i ? '&' : '#') + x).join('');
    try { history.replaceState(null, '', here(hash)); } catch (e) { location.hash = hash; }
    if (!swap) { location.reload(); return; }
    swap();
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('is-leaving')));
  }
  /* Into the game without reloading, after an import that follows the file: the read permission
     just given lasts as long as this page, so the watcher takes the very handle that was granted. */
  function enterHere(rec) {
    imp.n = 0;
    stopLive();
    scrollTo(0, 0);
    App.go('home', true);
    liveStart(rec);
  }

  /* Links a slot to the game's file: the handle is stored, and the read permission is asked on
     the stored copy, inside the click (the browser doesn't carry the picker's grant over to the
     copy read back from IndexedDB). → the record for liveStart, or null. */
  async function link(n, handle, name, stamp, askNow) {
    const stored = { handle, name, stamp };
    if (!(await L.links.put(n, stored))) return null;
    live.links[n] = name;
    track('save-link');
    const rec = await L.links.get(n);
    if (!rec || !rec.handle) return stored;
    if (askNow) try { await rec.handle.requestPermission({ mode: 'read' }); } catch (e) { /* the watcher says paused */ }
    return rec;
  }

  /* Going into a game, seen: the slot's Needle catches the light and its masks glow; then the
     page fades to black and reloads (enter). Without motion, at once. */
  function leave(n, swap = null) {
    let still = false;
    try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { still = false; }
    if (still) { enter('home', swap); return; }
    if (!swap) try { sessionStorage.setItem(ENTERED_KEY, '1'); } catch (e) { /* it comes in without fading */ }
    const li = n ? el.saves.querySelector(`.save[data-slot="${n}"]`) : null;
    if (li) { li.classList.add('is-loading'); li.setAttribute('aria-busy', 'true'); }
    setTimeout(() => {
      document.documentElement.classList.add('is-leaving');
      setTimeout(() => enter('home', swap), 250);
    }, li ? 350 : 0);
  }

  Object.assign(actions, {
    savePick(node) {
      const n = Number(node.dataset.value);
      if (!store) { toast(t('savesNoStorage')); return; }
      if (S.read(store).active === n) { App.go('home', true); return; }
      if (S.select(store, n)) leave(n);
    },
    saveImport(node) {
      if (!store) { toast(t('savesNoStorage')); return; }
      track('import-open');
      Object.assign(imp, { n: Number(node.dataset.value), state: 'idle', file: null, fresh: true, copied: 0 });
      if (!imp.chosen) imp.os = detectOs();
      clearing = 0;
      if (prefs.view !== 'saves') App.go('saves'); else render();
      if (el.saves.getBoundingClientRect().top < 0) el.saves.scrollIntoView({ block: 'start' });
      focusIn('.screen-title');
    },
    importClose() {
      const n = imp.n;
      imp.n = 0;
      render();
      focusIn(`[data-act="saveImport"][data-value="${n}"]`);
    },
    importOs(node) {
      imp.os = node.dataset.value; imp.chosen = true; imp.copied = 0;
      render();
      focusIn(`[data-act="importOs"][data-value="${imp.os}"]`);
    },
    importCopy() { copyPath(); },
    // With a handle where the browser gives one (the slot can then follow the file), with the hidden input where it doesn't.
    async importPick() {
      if (!L.canLive()) { picker.value = ''; picker.click(); return; }
      let h;
      try { [h] = await pickSave(); } catch (e) {
        if (!e || e.name !== 'AbortError') { picker.value = ''; picker.click(); }
        return;
      }
      readHandle(h);
    },
    importSync(node) {
      imp.sync = !imp.sync;
      node.setAttribute('aria-checked', String(imp.sync));
      node.querySelector('.imp-sync-t').textContent = t(imp.sync ? 'impSyncOn' : 'impSyncOff');
    },
    async importDo() {
      const n = imp.n, f = imp.file;
      if (!f || !store) return;
      S.importTo(store, n, f.snap);
      track('save-import');
      let rec = null;
      if (f.handle && imp.sync) rec = await link(n, f.handle, f.name, f.stamp, true);
      else if (live.links[n] != null) { await L.links.drop(n); delete live.links[n]; }
      if (S.read(store).active !== n) S.select(store, n);
      leave(0, rec ? () => enterHere(rec) : null);
    },
    // Following a slot that follows nothing: the file is picked, the slot takes it in at once, and follows it from then on.
    async liveFollow(node) {
      const n = Number(node.dataset.value);
      if (!store) return;
      let h, file, r;
      try { [h] = await pickSave(); } catch (e) { return; }
      try { file = await h.getFile(); r = F.read(new Uint8Array(await file.arrayBuffer())); } catch (e) { r = null; }
      if (!r || !r.ok) { toast(t('saveImportBad')); return; }
      S.sync(store, n, F.toSnapshot(r.pd, r.sd, file.lastModified));
      const active = n === activeSlot();
      const rec = await link(n, h, file.name, L.stampOf(file), active);
      if (!rec) { toast(t('liveFollowNo')); return; }
      if (active) { stopLive(); render(); await liveStart(rec); } else render();
      toast(t('liveFollowing', { n, file: file.name }));
      focusIn(`.save[data-slot="${n}"] [data-act="liveUnlink"]`);
    },
    async liveUnlink(node) {
      const n = Number(node.dataset.value);
      await L.links.drop(n);
      delete live.links[n];
      if (n === live.n) stopLive();
      render();
      focusIn(`.save[data-slot="${n}"] .save-main`);
    },
    async liveResume() {
      if (!live.watcher) return;
      if (!(await live.watcher.resume())) toast(t('liveResumeNo'));
    },
    liveRelink() {
      App.go('saves');
      actions.saveImport({ dataset: { value: String(live.n) } });
    },
    saveClear(node) { clearing = Number(node.dataset.value); render(); focusIn('[data-act="saveClearNo"]'); },
    saveClearNo(node) { const n = clearing; clearing = 0; render(); focusIn(`[data-act="saveClear"][data-value="${n || node.dataset.value}"]`); },
    saveClearYes(node) {
      const n = Number(node.dataset.value);
      clearing = 0;
      if (!store || !S.list(store)[n].snap) { render(); return; }
      shatter(n, () => {
        const wasActive = S.read(store).active === n;
        if (!S.clear(store, n)) { render(); return; }
        if (live.links[n] != null) { L.links.drop(n); delete live.links[n]; if (n === live.n) stopLive(); }
        justCleared = n;
        const was = el.saves.querySelector(`.save[data-slot="${n}"]`);
        const from = was ? was.offsetHeight : 0;
        // Clearing the game you're in drops you into free mode: the page reloads, but stays here, with the row where it was.
        if (wasActive) {
          try {
            sessionStorage.setItem(CLEARED_KEY, JSON.stringify({ n, from, top: was ? was.getBoundingClientRect().top : null }));
            history.scrollRestoration = 'manual';
          } catch (e) { /* it comes in without fading */ }
          document.documentElement.classList.add('is-leaving');
          setTimeout(() => enter('saves'), 250);
          return;
        }
        render();
        settle(n, from);
        focusIn(`[data-act="saveImport"][data-value="${n}"]`);
        setTimeout(() => { justCleared = 0; }, 1000);
      });
    },
  });
  /* Clearing, seen: the masks break one by one from the right, as health is lost on the HUD,
     and the rest of the slot fades away as embers rising. Without motion, at once. */
  function shatter(n, done) {
    const li = el.saves.querySelector(`.save[data-slot="${n}"]`);
    let still = false;
    try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { still = false; }
    if (!li || still) { done(); return; }
    const masks = li.querySelectorAll('.save-masks img').length;
    li.style.setProperty('--masks', masks);
    const dust = Array.from({ length: 18 }, () => {
      const r = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
      return `<i style="--x:${r(4, 96)}%;--y:${r(15, 85)}%;--dx:${r(-24, 24)}px;--s:${r(2, 4)}px;--d:${r(0.35, 0.8)}s;--o:${r(0.4, 0.9)}"></i>`;
    }).join('');
    li.insertAdjacentHTML('beforeend', `<span class="save-dust" aria-hidden="true">${dust}</span>`);
    li.classList.add('is-clearing');
    li.setAttribute('aria-busy', 'true');
    setTimeout(done, masks * 70 + 900);
  }
  // The emptied slot is shorter than the full one: the row shrinks from the height it had.
  function settle(n, from) {
    const li = el.saves.querySelector(`.save[data-slot="${n}"]`);
    if (!li || !from) return;
    const to = li.offsetHeight;
    if (to === from) return;
    li.style.height = from + 'px';
    li.style.overflow = 'hidden';
    shrink(li, to);
  }
  function shrink(li, to) {
    void li.offsetHeight;
    li.style.transition = 'height var(--dur-slow) var(--ease)';
    li.style.height = to + 'px';
    const end = () => { li.style.height = li.style.overflow = li.style.transition = ''; };
    li.addEventListener('transitionend', end, { once: true });
    setTimeout(end, 600);
  }

  /* The file picker lives outside the screen (which is redrawn whole) and is opened from the
     click itself, as browsers require. The file is read in the browser: it isn't sent anywhere. */
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = '.dat,.json';
  picker.hidden = true;
  document.body.appendChild(picker);
  picker.addEventListener('change', () => { if (picker.files && picker.files[0]) readFile(picker.files[0]); });

  async function readHandle(h) {
    if (!imp.n || !h || h.kind !== 'file') return;
    let file;
    try { file = await h.getFile(); } catch (e) { imp.state = 'error'; imp.file = null; paintDrop(); return; }
    readFile(file, h);
  }
  function readFile(file, handle = null) {
    if (!imp.n) return;
    imp.state = 'reading'; imp.file = null; imp.sync = true;
    paintDrop();
    const reader = new FileReader();
    reader.onload = () => {
      const r = F.read(new Uint8Array(reader.result));
      if (!r.ok) { imp.state = 'error'; paintDrop(); track('import-bad'); return; }
      // A restore point isn't the game's live file: it can be imported, not followed.
      imp.file = { name: file.name, snap: F.toSnapshot(r.pd, r.sd, file.lastModified), meta: F.meta(r.pd),
        restore: r.restore || null, handle: r.restore ? null : handle, stamp: L.stampOf(file) };
      imp.state = 'ready';
      paintDrop();
      track('import-read');
      focusIn('[data-act="importDo"]');
    };
    reader.onerror = () => { imp.state = 'error'; paintDrop(); };
    reader.readAsArrayBuffer(file);
  }

  /* Dragging a file anywhere over the import view lights the zone up, and letting go anywhere
     there reads it. dragenter and dragleave come for every child crossed, hence the count. */
  let dragDepth = 0;
  const hasFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  const setDrag = (on) => { const z = el.saves.querySelector('.imp-drop'); if (z) z.classList.toggle('is-drag', on); };
  el.saves.addEventListener('dragenter', (e) => { if (!imp.n || !hasFiles(e)) return; e.preventDefault(); dragDepth++; setDrag(true); });
  el.saves.addEventListener('dragover', (e) => { if (!imp.n || !hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  el.saves.addEventListener('dragleave', () => { if (!imp.n) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) setDrag(false); });
  el.saves.addEventListener('drop', (e) => {
    if (!imp.n || !hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0; setDrag(false);
    const item = e.dataTransfer.items && e.dataTransfer.items[0];
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (L.canLive() && item && item.getAsFileSystemHandle) {
      item.getAsFileSystemHandle().then(readHandle, () => { if (file) readFile(file); });
      return;
    }
    if (file) readFile(file);
  });
  // The same over Your game's invitation (js/app-home.js): into the first empty save, already reading it.
  let homeDepth = 0;
  const inviting = (e) => prefs.view === 'home' && !activeSlot() && hasFiles(e);
  const setHomeDrag = (on) => { const z = el.home.querySelector('.hm-invite'); if (z) z.classList.toggle('is-drag', on); };
  el.home.addEventListener('dragenter', (e) => { if (!inviting(e)) return; e.preventDefault(); homeDepth++; setHomeDrag(true); });
  el.home.addEventListener('dragover', (e) => { if (!inviting(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  el.home.addEventListener('dragleave', () => { homeDepth = Math.max(0, homeDepth - 1); if (!homeDepth) setHomeDrag(false); });
  el.home.addEventListener('drop', (e) => {
    if (!inviting(e)) return;
    e.preventDefault();
    homeDepth = 0; setHomeDrag(false);
    const item = e.dataTransfer.items && e.dataTransfer.items[0];
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    const handle = L.canLive() && item && item.getAsFileSystemHandle ? item.getAsFileSystemHandle() : null;
    App.importFirstEmpty();
    if (handle) handle.then(readHandle, () => { if (file) readFile(file); });
    else if (file) readFile(file);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imp.n && prefs.view === 'saves') actions.importClose();
  });

  // Copy the folder: the clipboard API, or selecting the text and the old copy command.
  function copyPath() {
    const text = SYSTEMS[imp.os].dir;
    const done = () => {
      imp.copied++;
      const k = imp.copied, b = el.saves.querySelector('.imp-copy');
      if (b) { b.textContent = t('impCopied'); b.classList.add('is-done'); }
      setTimeout(() => {
        if (imp.copied !== k) return;
        imp.copied = 0;
        const x = el.saves.querySelector('.imp-copy');
        if (x) { x.textContent = t('impCopy'); x.classList.remove('is-done'); }
      }, 2000);
    };
    const fallback = () => {
      const code = el.saves.querySelector('.imp-path code');
      try {
        const range = document.createRange(); range.selectNodeContents(code);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
        if (document.execCommand('copy')) done();
      } catch (e) { /* the text stays selected: it can be copied by hand */ }
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  }
  const focusIn = (sel) => { const b = el.saves.querySelector(sel); if (b) b.focus(); };

  // The slot you're playing, or 0 (S.FREE) in free mode; and its game, as the screens read it.
  const activeSlot = () => (store ? S.read(store).active : S.FREE);
  App.game = () => (store && activeSlot() ? F.gameOf(S.snapshot(store)) : null);
  App.gameMeta = () => (store && activeSlot() ? F.metaOf(S.snapshot(store)) : null);
  /* Free mode's own marks (design/03-redesign.md, step 4): what you set as had in the Inventory,
     in the same keys a save uses (slot 0's, so they stay with Free mode): pharloom.owned for the
     Tools, Crests, Silk Skills and abilities, pharloom.progress for the Everbloom and the pieces.
     No marks yet is null: everything, as Free mode always was. It only reaches the Inventory and
     the Crest screen; App.game() stays null, so every other screen is Free mode's. */
  const FREE_KEYS = ['pharloom.owned', 'pharloom.progress'];
  App.freeGame = () => (store && activeSlot() === S.FREE && store.getItem('pharloom.owned') != null ? F.gameOf(S.snapshot(store)) : null);
  App.setFreeGame = (g) => {
    if (!store || activeSlot() !== S.FREE) return;
    try {
      if (!g) { for (const k of FREE_KEYS) store.removeItem(k); return; }
      store.setItem('pharloom.owned', JSON.stringify({ tools: g.tools, crests: g.crests, skills: g.skills, arts: g.arts }));
      store.setItem('pharloom.progress', JSON.stringify({ everbloom: !!g.everbloom, pieces: g.pieces.map((i) => F.pieceKey(SS.collectibles.PIECES[i])) }));
    } catch (e) { /* no storage: the marks aren't kept */ }
  };

  /* ── Following the game ───────────────────────────────────────────────
     Only the slot you're in watches its file; another linked one catches up on entering it.
     When the game saves, the slot takes the file in and every screen repaints. The stamp is
     kept with the link, so that a reload doesn't take in again a file already taken in. */
  const parseSave = (bytes) => { const r = F.read(bytes); return r.ok ? r : null; };
  function stopLive() {
    if (live.watcher) live.watcher.stop();
    Object.assign(live, { n: 0, name: '', state: '', watcher: null });
  }
  let synced = false;
  async function liveStart(given = null) {
    if (!store || !L.canLive()) return;
    live.links = await L.links.all();
    live.ready = true;
    const n = activeSlot();
    const rec = n === S.FREE ? null : given || await L.links.get(n);
    if (!rec || !rec.handle) { if (prefs.view === 'saves') render(); return; }
    let stamp = rec.stamp || null;
    Object.assign(live, { n, name: rec.name || rec.handle.name, state: '' });
    live.watcher = L.watch({
      source: L.fileSource(rec.handle, parseSave),
      since: stamp,
      async onData(r, next) {
        stamp = next;
        const changed = S.sync(store, n, F.toSnapshot(r.pd, r.sd, next.lastModified));
        await L.links.put(n, { ...rec, stamp });
        if (!changed || activeSlot() !== n) return;
        render();
        if (changed === 'game') toast((App.gainedLine && App.gainedLine()) || t('liveUpdated'));
        if (!synced) { synced = true; track('save-sync'); }
      },
      onState(s) { live.state = s; render(); },
    });
  }
  // The notice above the screen when the link needs you: paused (a click to go on) or the file gone.
  App.liveBanner = () => {
    if (live.state !== 'paused' && live.state !== 'lost') return '';
    const paused = live.state === 'paused';
    return `<div class="banner is-hint" role="status">
      <span class="banner-tag">${esc(t('liveTag'))}</span>
      <span class="banner-text">${esc(t(paused ? 'livePaused' : 'liveLost', { file: live.name }))}</span>
      <button type="button" class="btn btn-primary" data-act="${paused ? 'liveResume' : 'liveRelink'}">${esc(t(paused ? 'liveResume' : 'liveRelink'))}</button>
    </div>`;
  };
  // From Your game's invitation: into the first empty save, importing. With the four full, the Saves screen, to choose.
  const firstEmpty = () => (store ? S.SLOT_IDS.find((n) => { const x = S.read(store); return n !== x.active && !x.slots[n]; }) : null);
  App.importFirstEmpty = () => {
    const n = firstEmpty();
    if (n) actions.saveImport({ dataset: { value: String(n) } });
    else App.go('saves');
  };

  /* The header's save selector: Hornet at a bench under a lamp that breathes, and the save
     you're playing, or «Select save» in free mode. When the save follows the game's file, a
     line under the label says how: live, paused or file missing. */
  App.saveLink = () => {
    const n = activeSlot();
    const label = n ? t('saveSlot', { n }) : t('saveSelect');
    const lv = live.watcher && live.state ? { state: live.state, name: live.name } : null;
    const st = lv ? t('liveState_' + lv.state) : '';
    const liveHtml = lv ? `<span class="mh-live" aria-hidden="true"><i class="mh-live-dot"></i><span class="mh-live-t">${esc(st)}</span></span>` : '';
    const title = lv ? t('liveFollows', { file: lv.name }) + ' · ' + st : t('saveBtnHint');
    return `<a class="mh-save${lv ? ' is-' + lv.state : ''}" href="${here(App.hashFor('saves'))}" data-act="view" data-value="saves"${prefs.view === 'saves' ? ' aria-current="page"' : ''}
      aria-label="${esc(label + (lv ? ', ' + st : ''))}" title="${esc(title)}"><span class="mh-save-fig"><span class="mh-save-light" aria-hidden="true"></span><img src="${ART.resting}" alt=""></span><span class="mh-save-lbl">${FLEURS}${esc(label)}${liveHtml}</span><span class="mh-save-short" aria-hidden="true">${esc(n ? label : t('savesTitle'))}</span></a>`;
  };
  Object.assign(App, { activeSlot, liveStart, isDesktop, bookDone, bookTotal });
})();
