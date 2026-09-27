/* js/app-journal.js — the Hunter's Journal («Diario de caza»), as the game's pane: the portraits
   in the Journal's own order and, beside them, the one picked: its portrait, name, description,
   the kills against what the full entry needs, and the Hunter's note, which the game shows only
   once the entry is complete. In a save, what's complete is the entries with their kills done:
   the game writes the kills even for the entries it completes another way (a boss's minions,
   the Void Tendrils' tablet), as the author's full Journal shows, and npm run check-pack checks
   it against Nuu's Memento (230 required, 231 in Steel Soul; six optional). An entry not yet
   seen is a dark silhouette; one seen and not complete, half-lit with its kills. In Free mode,
   the whole Journal, complete. Shares SS.app with js/app.js (see there). */
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
    if (!x) return `<p class="inv-hint">${esc(t('hjHint'))}</p>`;
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
      ${state !== 'done' && e.inspect ? `<p class="hj-by">${esc(t('hjInspect'))}</p>` : ''}`;
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
