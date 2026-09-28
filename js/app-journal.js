/* js/app-journal.js — the Hunter's Journal («Diario de caza») (design/16-journal-top-variants.html,
   B, next hunts): on top, Nuu's Memento as a ring beside the four entries missing closest to your
   bench; under it the portraits by area, the areas with the most missing first, or in the
   Journal's own order, each in a ring that fills with its kills and lights up once complete. A
   tap opens the entry as the game's page (design/17-journal-entry-variants.html, A; a modal
   <dialog>): the whole drawing (assets/journal/art/, tools/extract-journal-art.py) on the pane's
   light at the size the game draws it, and beside it the name, kills, places, description, and
   the Hunter's note under the Hunter's symbol, which the game shows only once the entry is complete
   (until then, its «Defeat {0} more…»). In a save, what's complete is the entries with
   their kills done: the game writes the kills even for the entries it completes another way (a
   boss's minions, the Void Tendrils' tablet), as the author's full Journal shows, and npm run
   check-pack checks it against Nuu's Memento (230 required, 231 in Steel Soul; six optional). An
   entry not yet seen is in shadow in a dashed ring, «???». In Free mode, the whole Journal, complete.
   Where to find each one: js/journal-rooms.js, from the game's own files: the enemies it places in
   each scene, and for the 29 it makes at run time (bosses, a hive's, a corpse's, a hazard's) the
   scenes whose objects name or spawn them; an arena off the map (Lost Lace's, the Bell Eater's)
   as the scenes that load it. Named by area; the Border Caves, which the site's areas don't
   have, by the game's name, and the Bell Eater by the Bellways it's met from; with no scene, a
   boss by its wiki infobox (js/enemies.js BOSSES). In a save, the nearest place from your bench in
   rooms (js/rooms.js), and on top, what's missing closest.
   Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const J = SS.journal;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const portrait = (id) => `assets/icons/journal/${id}.webp`;
  const NAME = new Map(J.BOOK.map((e) => [e.id, e]));
  let picked = null;
  const R = SS.rooms, CO = SS.collectibles, EN = SS.enemies, JR = SS.journalRooms || {}, LOADS = SS.journalLoads || {};
  const HUNTS = 4;
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  /* Places the site's areas don't name: the map's Surface branch holds the Border Caves (their
     scenes, Cradle_Destroyed_Challenge_*, by the game's name for them), and the Bell Eater's arena
     is loaded by every Bellway station, so it's met on the Bellways. */
  const PLACE = [[/^Cradle_Destroyed_Challenge/i, { es: 'Cuevas Fronterizas', en: 'Border Caves' }]];   // ABOVE_CRADLE
  const LOADED_PLACE = { bellway_centipede_arena: () => t('mapPlace_bellway') };
  const placeOf = (scene) => areaName(R.areaOf(scene)) || pick((PLACE.find(([re]) => re.test(scene)) || [])[1] || { es: '', en: '' });
  // Where an entry is: its places, the one with the most first; with no scene, its boss infobox's.
  function whereOf(e) {
    if (LOADED_PLACE[LOADS[e.key]]) return [LOADED_PLACE[LOADS[e.key]]()];
    const by = new Map();
    for (const [scene, n] of JR[e.key] || []) { const a = placeOf(scene); if (a) by.set(a, (by.get(a) || 0) + n); }
    if (by.size) return [...by].sort((a, b) => b[1] - a[1]).map(([a]) => a);
    const foe = EN.FOES.find((f) => f.key === e.key && f.boss);
    const info = foe && EN.BOSSES[foe.page];
    return info && info.where ? info.where.map((w) => pick(w)) : [];
  }
  // The nearest place it's in from your bench: { place, n } or null.
  let walked = null;
  function nearest(e, g) {
    if (!g || !g.bench) return null;
    if (!walked || walked.bench !== g.bench) walked = { bench: g.bench, w: R.walk(g.bench, g.lit) };
    let best = null;
    for (const [scene] of JR[e.key] || []) {
      const n = R.steps(g.bench, scene, g.lit, walked.w);
      if (n != null && (!best || n < best.n)) best = { n, place: placeOf(scene) };
    }
    return best;
  }
  const stepsText = (n) => (n === 0 ? t('mapHere') : t('mapSteps', { n: num(n) }));

  // Each entry's state in a game: 'done', 'seen' (listed, kills short) or 'unseen'.
  function states() {
    const g = App.game(), m = App.gameMeta();
    const steel = !!(m && m.steel);
    const book = J.BOOK.filter((e) => !e.steel || steel || !g);
    return {
      g, steel,
      list: book.map((e) => {
        const kills = g ? g.journal[e.id] : e.kills;
        const state = !g || SS.completion.journalDone(e, g.journal) ? 'done' : kills !== undefined ? 'seen' : 'unseen';
        return { e, kills: kills || 0, state };
      }),
    };
  }

  // A portrait with its kills as a ring round it: the arc is kills / needed, full and lit once complete.
  const ring = (x, cls = '') => `<span class="hj-ring is-${x.state}${cls}" style="--f:${x.state === 'done' ? 1 : Math.min(1, x.kills / (x.e.kills || 1)).toFixed(3)}">
      <img src="${portrait(x.e.id)}" alt="" loading="lazy"></span>`;

  // The entry, on a tap, as the game's page (design/17-journal-entry-variants.html, A): the whole
  // drawing on its light at the game's size, and beside it the name, kills, description and notes.
  const art = (e) => `assets/journal/art/${e.key.toLowerCase()}.webp`;
  function sheet(x) {
    if (!x) return '';
    const { e, kills, state } = x;
    const by = (e.by || []).map((id) => (NAME.get(id) ? pick(NAME.get(id).name) : null)).filter(Boolean);
    const name = pick(e.name);
    const notes = !e.note ? ''
      : state === 'done' ? `<img class="hj-sym" src="assets/journal/hunter-symbol.webp" alt=""><p class="hj-note">${esc(pick(e.note))}</p>`
      : `<img class="hj-sym is-locked" src="assets/journal/hunter-symbol.webp" alt=""><p class="hj-later">${esc(t('hjNotesDefeat', { 0: num(Math.max(0, e.kills - kills)) }))}</p>`;
    return `<dialog class="hj-sheet" tabindex="-1" aria-label="${esc(name)}"${NT}>
      <button type="button" class="icon-btn hj-sheet-x" data-act="hjPick" data-key="" aria-label="${esc(t('mapCardClose'))}" title="${esc(t('mapCardClose'))}">${App.cross}</button>
      <div class="hj-art is-${state}"><img src="${art(e)}" alt="" decoding="async"></div>
      <div class="hj-entry">
      <h3 class="hj-name">${esc(name)}</h3>
      ${state !== 'done' && App.mapHas && App.mapHas('journal:' + e.id) ? `<button type="button" class="text-btn hj-onmap" data-act="mapShow" data-value="journal:${e.id}">${esc(t('mapOnMap'))}</button>` : ''}
      <p class="hj-kills"><b>${num(Math.min(kills, 9999))}</b><i class="u">/${num(e.kills)}</i></p>
      ${whereHtml(e, state)}
      ${e.optional ? `<p class="inv-not">${esc(t('hjOptional'))}</p>` : ''}
      ${e.steel ? `<p class="inv-not">${esc(t('steelSoul'))}</p>` : ''}
      ${state !== 'unseen' && e.desc ? `<p class="inv-desc">${esc(pick(e.desc))}</p>` : ''}
      ${notes}
      ${state !== 'done' && by.length ? `<p class="hj-by">${esc(t('hjBy', { names: by.join(', ') }))}</p>` : ''}
      ${state !== 'done' && e.inspect ? `<p class="hj-by">${esc(t('hjInspect'))}</p>` : ''}</div></dialog>`;
  }

  function whereHtml(e, state) {
    const where = whereOf(e);
    const near = state !== 'done' ? nearest(e, App.game()) : null;
    return (where.length ? `<p class="hj-area">${esc(where.slice(0, 4).join(' · '))}</p>` : '')
      + (near ? `<p class="hj-where">${esc(t('hjNearest'))}: ${esc(near.place)}, ${esc(stepsText(near.n))}</p>` : '');
  }
  // The hunts: what's missing closest to your bench, by rooms, as cards.
  function hunts(list, g) {
    if (!g || !g.bench) return '';
    const rows = list.filter((x) => x.state !== 'done' && !x.e.optional).map((x) => ({ x, near: nearest(x.e, g) }))
      .filter((r) => r.near).sort((a, b) => a.near.n - b.near.n).slice(0, HUNTS);
    if (!rows.length) return '';
    return `<section class="hj-hunts" aria-labelledby="hj-hunts-h"><h3 class="ct-h" id="hj-hunts-h">${esc(t('hjNear'))}</h3>
      <ol class="hj-hunt-row">${rows.map(({ x, near }) => `<li><button type="button" class="hj-hunt${picked === x.e.id ? ' is-picked' : ''}" data-act="hjPick" data-key="${x.e.id}" title="${esc(t('mapNearNote'))}"${NT}>
        ${ring(x)}<b>${esc(pick(x.e.name))}</b><em>${esc(stepsText(near.n))}</em>
        <span class="hj-hunt-left">${esc(t('hjLeft', { n: num(Math.max(0, x.e.kills - x.kills)) }))}</span></button></li>`).join('')}</ol></section>`;
  }

  let shown = [];
  const cell = (x) => {
    const key = x.e.id, name = x.state === 'unseen' ? '???' : pick(x.e.name);
    return `<li><button type="button" class="hj-cell${picked === key ? ' is-picked' : ''}" data-act="hjPick" data-key="${key}"
        aria-pressed="${picked === key}" title="${esc(name)}" aria-label="${esc(name + ' · ' + t('hjState_' + x.state))}"${NT}>
        ${ring(x)}${x.e.optional ? '<span class="hj-opt" aria-hidden="true"></span>' : ''}</button></li>`;
  };
  // The areas, the ones with the most missing first; what has no place, last as «Elsewhere».
  function byArea(list, keep) {
    const areas = new Map();
    for (const x of list) {
      const a = whereOf(x.e)[0] || '';
      if (!areas.has(a)) areas.set(a, []);
      areas.get(a).push(x);
    }
    const left = (xs) => xs.filter((x) => x.state !== 'done').length;
    return [...areas].sort(([a, xs], [b, ys]) => (!a) - (!b) || left(ys) - left(xs))
      .map(([a, xs]) => ({ name: a || t('hjElsewhere'), done: xs.filter((x) => x.state === 'done').length, all: xs.length, xs: xs.filter(keep) }))
      .filter((a) => a.xs.length);
  }

  /* The search: in both languages and without accents («polilla» finds it in English too), by name
     or by area. While it has text it looks through the whole Journal, what's complete included. */
  let query = '';
  const fold = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const HAY = new Map(J.BOOK.map((e) => [e.id, fold(e.name.es + ' ' + e.name.en)]));
  const matches = (x, q) => HAY.get(x.e.id).includes(q) || whereOf(x.e).some((a) => fold(a).includes(q));
  // The portraits, by area or in the Journal's order, with what the toggles and the search keep.
  function shelf(list, g) {
    const q = fold(query.trim());
    const missing = !!g && !prefs.hjAll && !q;
    const keep = (x) => (!missing || x.state !== 'done') && (!q || matches(x, q));
    const groups = prefs.hjBy !== 'book' ? byArea(list, keep) : [{ name: '', xs: list.filter(keep) }];
    const grid = groups.map((a) => (a.name ? `<section class="hj-area-group"><h3 class="ct-h"><span${NT}>${esc(a.name)}</span>
        <span class="hj-area-n">${num(a.done)}/${num(a.all)}</span></h3>` : '')
      + `<ul class="hj-grid">${a.xs.map(cell).join('')}</ul>${a.name ? '</section>' : ''}`).join('');
    const empty = q ? `<p class="pg-note">${esc(t('hjNone'))}</p>` : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`;
    return `<div class="hj-shelf">${groups.some((a) => a.xs.length) ? grid : empty}</div>`;
  }

  App.screens.journal = (sec) => {
    const { g, steel, list } = states();
    shown = list;
    const req = list.filter((x) => !x.e.optional);
    const done = req.filter((x) => x.state === 'done').length;
    const need = J.REQUIRED[steel ? 'steel' : 'classic'];
    const seen = list.filter((x) => x.state !== 'unseen').length;
    const missing = !!g && !prefs.hjAll;
    const area = prefs.hjBy !== 'book';
    // Two small toggles: an icon each, the words in their title.
    const tog = (act, pairs, label) => `<div class="seg hj-tog" role="group" aria-label="${esc(label)}">${pairs.map(([v, on, text, icon]) =>
      `<button type="button" data-act="${act}" data-value="${v}" aria-pressed="${on}" aria-label="${esc(text)}" title="${esc(text)}">${icon}</button>`).join('')}</div>`;
    const search = `<label class="search hj-find"><span class="sr-only">${esc(t('hjFind'))}</span>${App.lens}
        <input type="search" data-act="hjQuery" value="${esc(query)}" placeholder="${esc(t('hjFind'))}" autocomplete="off"></label>`;
    const tools = `<div class="hj-tools">${search}${g ? tog('hjShow', [['missing', missing, t('pgMissing'), ICON.missing], ['all', !missing, t('pgAll'), ICON.all]], t('pgShow')) : ''}
        ${tog('hjBy', [['area', area, t('hjByArea'), ICON.area], ['book', !area, t('hjByBook'), ICON.book]], t('hjOrder'))}</div>`;
    // The Memento as a ring: complete, and a dimmer arc for what's seen and not yet complete.
    const memento = `<div class="hj-memento" role="img" style="--d:${(done / need).toFixed(3)};--s:${(seen / list.length).toFixed(3)}"
        aria-label="${esc(t('hjMemento') + ': ' + num(done) + '/' + num(need) + ' · ' + t('hjSeen', { n: num(seen), m: num(list.length) }))}">
        <div><b>${num(done)}</b><i class="u">/${num(need)}</i><span>${esc(t('hjMementoShort'))}</span></div></div>`;
    const current = picked ? list.find((x) => x.e.id === picked) || null : null;
    sec.innerHTML = `<div class="hj">${brackets}${screenHead(esc(t('navJournal')))}
      ${g ? `<div class="hj-hero">${memento}${hunts(list, g)}</div>` : ''}
      ${tools}
      ${shelf(list, g)}
      ${sheet(current)}</div>`;
    const d = sec.querySelector('dialog.hj-sheet');
    if (d) {
      d.showModal();
      // The sheet itself takes the focus, after render() has put back the one it had (no ring on the ×).
      setTimeout(() => { const o = document.querySelector('dialog.hj-sheet[open]'); if (o) o.focus(); });
      d.addEventListener('close', () => { if (d.isConnected) close(d); });   // not when a render replaces it
      // A tap on the dim around it closes it too.
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    }
  };
  // Closing the entry (its ×, Esc, the dim around it): back to its portrait.
  function close(d) {
    const key = picked;
    if (!key) return;
    picked = null;
    if (d.open) d.close();
    render();
    const b = document.querySelector(`.hj-cell[data-key="${key}"]`);
    if (b) b.focus({ preventScroll: true });
  }
  // Leaving the screen with the entry open (the browser's back): a modal left behind would lock the page.
  window.addEventListener('hashchange', () => {
    const d = document.querySelector('dialog.hj-sheet[open]');
    if (d) { picked = null; d.close(); }
  });

  const ICON = {
    missing: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke-dasharray="2 2"/></svg>',
    all: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/></svg>',
    area: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 4h12M2 8h5M2 12h12"/></svg>',
    book: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="3" height="3"/><rect x="6.5" y="2" width="3" height="3"/><rect x="11" y="2" width="3" height="3"/><rect x="2" y="6.5" width="3" height="3"/><rect x="6.5" y="6.5" width="3" height="3"/><rect x="11" y="6.5" width="3" height="3"/><rect x="2" y="11" width="3" height="3"/><rect x="6.5" y="11" width="3" height="3"/></svg>',
  };

  // The Map's "See in the Journal": that entry open when the screen shows.
  App.journalOpen = (id) => { picked = id; };

  Object.assign(actions, {
    hjPick(node) {
      const d = document.querySelector('dialog.hj-sheet[open]');
      if (d) { close(d); return; }
      picked = node.dataset.key || null;
      render();
    },
    hjShow(node) { prefs.hjAll = node.dataset.value === 'all'; savePrefs(); render(); },
    hjBy(node) { prefs.hjBy = node.dataset.value; savePrefs(); render(); },
  });
  // The search filters as you type; only the portraits are repainted, so the field keeps its focus.
  document.addEventListener('input', (e) => {
    if (!e.target.matches || !e.target.matches('[data-act="hjQuery"]')) return;
    query = e.target.value;
    const old = document.querySelector('.hj-shelf');
    if (!old) return;
    const { g, list } = states();
    const box = document.createElement('div');
    box.innerHTML = shelf(list, g);
    old.replaceWith(box.firstElementChild);
  });
})();
