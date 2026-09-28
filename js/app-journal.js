/* js/app-journal.js — the Hunter's Journal («Diario de caza»), as the game's pane: the portraits
   in the Journal's own order and, beside them, the one picked: its portrait, name, description,
   the kills against what the full entry needs, and the Hunter's note, which the game shows only
   once the entry is complete. In a save, what's complete is the entries with their kills done:
   the game writes the kills even for the entries it completes another way (a boss's minions,
   the Void Tendrils' tablet), as the author's full Journal shows, and npm run check-pack checks
   it against Nuu's Memento (230 required, 231 in Steel Soul; six optional). An entry not yet
   seen is a dark silhouette; one seen and not complete, half-lit with its kills. In Free mode,
   the whole Journal, complete.
   Where to find each one: js/journal-rooms.js, the enemies the game places in each scene (its own
   files), named by area; a boss the game spawns instead, by its wiki infobox (js/enemies.js
   BOSSES). In a save, the nearest place from your bench in rooms (js/rooms.js), and in the pane,
   while nothing is picked, what's missing closest. Shares SS.app with js/app.js (see there). */
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
  const R = SS.rooms, CO = SS.collectibles, EN = SS.enemies, JR = SS.journalRooms || {};
  const NEAR = 10;
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  // Where an entry is: its areas, the one with the most first; a boss that isn't placed, its infobox's places.
  function whereOf(e) {
    const placed = JR[e.key] || [];
    if (placed.length) {
      const by = new Map();
      for (const [scene, n] of placed) { const a = R.areaOf(scene); if (a) by.set(a, (by.get(a) || 0) + n); }
      return [...by].sort((a, b) => b[1] - a[1]).map(([a]) => areaName(a));
    }
    const foe = EN.FOES.find((f) => f.key === e.key && f.boss);
    const info = foe && EN.BOSSES[foe.page];
    return info && info.where ? info.where.map((w) => pick(w)) : [];
  }
  // The nearest place it's in from your bench: { area, n } or null.
  let walked = null;
  function nearest(e, g) {
    if (!g || !g.bench) return null;
    if (!walked || walked.bench !== g.bench) walked = { bench: g.bench, w: R.walk(g.bench, g.lit) };
    let best = null;
    for (const [scene] of JR[e.key] || []) {
      const n = R.steps(g.bench, scene, g.lit, walked.w);
      if (n != null && (!best || n < best.n)) best = { n, area: R.areaOf(scene) };
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

  function detail(x) {
    // With nothing picked, the pane offers what's missing closest to your bench.
    if (!x) return `<p class="inv-hint">${esc(t('hjHint'))}</p>${nearList(shown, App.game())}`;
    const { e, kills, state } = x;
    const by = (e.by || []).map((id) => (NAME.get(id) ? pick(NAME.get(id).name) : null)).filter(Boolean);
    return `<img class="hj-big is-${state}" src="${portrait(e.id)}" alt="">
      <h3 class="inv-name"${NT}>${esc(pick(e.name))}</h3>
      <p class="hj-kills"><span class="save-k">${esc(t('hjKills'))}</span> <b>${num(Math.min(kills, 9999))}</b><i class="u">/${num(e.kills)}</i></p>
      ${e.optional ? `<p class="inv-not">${esc(t('hjOptional'))}</p>` : ''}
      ${e.steel ? `<p class="inv-not"${NT}>${esc(t('steelSoul'))}</p>` : ''}
      ${state !== 'unseen' && e.desc ? `<p class="inv-desc">${esc(pick(e.desc))}</p>` : ''}
      ${state === 'done' && e.note ? `<p class="hj-note">${esc(pick(e.note))}</p>` : ''}
      ${state !== 'done' && by.length ? `<p class="hj-by">${esc(t('hjBy', { names: by.join(', ') }))}</p>` : ''}
      ${state !== 'done' && e.inspect ? `<p class="hj-by">${esc(t('hjInspect'))}</p>` : ''}
      ${whereHtml(e, state)}`;
  }

  function whereHtml(e, state) {
    const where = whereOf(e);
    const near = state !== 'done' ? nearest(e, App.game()) : null;
    return (where.length ? `<p class="hj-where"><span class="save-k">${esc(t('hjWhere'))}</span> <span${NT}>${esc(where.slice(0, 4).join(', '))}</span></p>` : '')
      + (near ? `<p class="hj-where"><span class="save-k">${esc(t('hjNearest'))}</span> <span${NT}>${esc(areaName(near.area))}</span>, ${esc(stepsText(near.n))}</p>` : '');
  }
  // What's missing closest to your bench: the entries not complete, by rooms, with the kills left.
  function nearList(list, g) {
    if (!g || !g.bench) return '';
    const rows = list.filter((x) => x.state !== 'done' && !x.e.optional).map((x) => ({ x, near: nearest(x.e, g) }))
      .filter((r) => r.near).sort((a, b) => a.near.n - b.near.n).slice(0, NEAR);
    if (!rows.length) return '';
    return `<section class="mp-near hj-near" aria-labelledby="hj-near-h"><h3 class="ct-h" id="hj-near-h">${esc(t('hjNear'))}</h3>
      <ol class="mp-near-list">${rows.map(({ x, near }) => `<li><img src="${portrait(x.e.id)}" alt="">
        <button type="button" class="text-btn mp-near-name" data-act="hjPick" data-key="${x.e.id}"${NT}>${esc(pick(x.e.name))}</button>
        <span class="mp-near-area"><span${NT}>${esc(areaName(near.area))}</span> · ${esc(t('hjLeft', { n: num(Math.max(0, x.e.kills - x.kills)) }))}</span>
        <b>${esc(stepsText(near.n))}</b></li>`).join('')}</ol>
      <p class="pg-note">${esc(t('mapNearNote'))}</p></section>`;
  }

  let shown = [];
  App.screens.journal = (sec) => {
    const { g, steel, list } = states();
    shown = list;
    const req = list.filter((x) => !x.e.optional);
    const done = req.filter((x) => x.state === 'done').length;
    const need = J.REQUIRED[steel ? 'steel' : 'classic'];
    const seen = list.filter((x) => x.state !== 'unseen').length;
    const missing = !!g && !prefs.hjAll;
    const cells = list.filter((x) => !missing || x.state !== 'done').map((x) => {
      const key = x.e.id;
      return `<li><button type="button" class="hj-cell is-${x.state}${picked === key ? ' is-picked' : ''}" data-act="hjPick" data-key="${key}"
          aria-pressed="${picked === key}" title="${esc(pick(x.e.name))}" aria-label="${esc(pick(x.e.name) + ' · ' + t('hjState_' + x.state))}"${NT}>
          <img src="${portrait(key)}" alt="" loading="lazy">
          ${x.state === 'seen' ? `<span class="inv-count">${num(x.kills)}/${num(x.e.kills)}</span>` : ''}
          ${x.e.optional ? '<span class="hj-opt" aria-hidden="true"></span>' : ''}</button></li>`;
    }).join('');
    const head = g ? `<p class="hj-count"><span class="save-k">${esc(t('hjMemento'))}</span> <b>${num(done)}</b><i class="u">/${num(need)}</i>
        <span class="hj-seen">${esc(t('hjSeen', { n: num(seen), m: num(list.length) }))}</span></p>
        <div class="seg pg-seg" role="group" aria-label="${esc(t('pgShow'))}">
          <button type="button" data-act="hjShow" data-value="missing" aria-pressed="${missing}">${esc(t('pgMissing'))}</button>
          <button type="button" data-act="hjShow" data-value="all" aria-pressed="${!missing}">${esc(t('pgAll'))}</button></div>`
      : `<p class="saves-note">${esc(t('hjFree'))}</p>`;
    const current = list.find((x) => x.e.id === picked) || null;
    sec.innerHTML = `<div class="hj">${brackets}${screenHead(esc(t('navJournal')), head)}
      <div class="hj-body">
        <ul class="hj-grid">${cells || `<li class="pg-done">${App.tick}${esc(t('pgDone'))}</li>`}</ul>
        <div class="inv-detail hj-detail" aria-live="polite">${detail(current)}</div>
      </div></div>`;
  };

  // Pointing at a portrait reads it in the pane; leaving the grid goes back to the one picked.
  const pane = () => document.querySelector('.screen[data-view="journal"] .hj-detail');
  const show = (key) => { const p = pane(); if (p) p.innerHTML = detail(shown.find((x) => x.e.id === key) || null); };
  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest && e.target.closest('.hj-cell');
    if (b && prefs.view === 'journal') show(b.dataset.key);
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest && e.target.closest('.hj-grid');
    if (b && !b.contains(e.relatedTarget) && prefs.view === 'journal') show(picked);
  });
  document.addEventListener('focusin', (e) => {
    const b = e.target.closest && e.target.closest('.hj-cell');
    if (b && prefs.view === 'journal') show(b.dataset.key);
  });

  Object.assign(actions, {
    hjPick(node) {
      picked = node.dataset.key === picked ? null : node.dataset.key;
      render();
      const b = document.querySelector(`[data-act="hjPick"][data-key="${node.dataset.key}"]`);
      if (b) b.focus({ preventScroll: true });
    },
    hjShow(node) { prefs.hjAll = node.dataset.value === 'all'; savePrefs(); render(); },
  });
})();
