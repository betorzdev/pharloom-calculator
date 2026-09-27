/* js/app-game.js — the Inventory, as the game's own pane: on the left the Needle and Hornet's HUD
   (masks, silk, Silk Hearts), in the middle what she carries as the game's icons in grids —the
   Tools by colour, the Crests, the Silk Skills, the abilities and the items—, and on the right
   the pane's description: the name and the game's text of what you point at or pick. In a save,
   what you don't have yet is a dimmed silhouette; in free mode (nobody's game) everything is
   there, as free mode is the everything-unlocked sheet. The icons are the wiki's
   (tools/fetch-icons.js, npm run icons). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  // The Old Hearts and melodies by their save flag → their icon (assets/icons/pieces/).
  const PIECE_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter',
    CollectedHeartClover: 'heart-clover', HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian',
    HasMelodyConductor: 'melody-conductor' };

  // Free mode: everything, as the site's everything-unlocked sheet.
  function fullGame() {
    return { tools: D.TOOLS.map((x) => x.id), crests: D.CRESTS.map((x) => x.id), skills: D.SKILLS.map((x) => x.id),
      arts: D.ARTS.map((x) => x.id), masks: 5, spools: 9, hearts: 3, needle: 4, kit: 4, pouch: 4, everbloom: true,
      pieces: CO.PIECES.map((p, i) => i), journal: {}, act: 3 };
  }

  /* Every thing the pane can show, by a key "list/id": { list, id, name, desc, got, count, color }. */
  function things(g) {
    const found = (kind) => g.pieces.filter((i) => CO.PIECES[i][0] === kind).length;
    const total = (kind) => CO.PIECES.filter((p) => p[0] === kind).length;
    const item = (id) => D.ITEMS.find((x) => x.id === id);
    const out = [];
    for (const x of D.TOOLS) out.push({ list: 'tools', id: x.id, name: x.name, desc: x.desc, got: g.tools.includes(x.id), color: x.color });
    for (const x of D.CRESTS) out.push({ list: 'crests', id: x.id, name: x.name, desc: x.desc, got: g.crests.includes(x.id) });
    for (const x of D.SKILLS) out.push({ list: 'skills', id: x.id, name: x.name, desc: x.desc, got: g.skills.includes(x.id) });
    for (const x of D.ARTS) out.push({ list: 'arts', id: x.id, name: x.name, desc: x.desc, got: g.arts.includes(x.id) });
    // The items: the two upgrade ladders with their level, the materials with how many were found.
    const it = (id, got, count) => { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got, count }); };
    it('crafting-kit', g.kit > 0, `${num(g.kit)}/4`);
    it('tool-pouch', g.pouch > 0, `${num(g.pouch)}/4`);
    const shards = found('mask-shard') - 4 * g.masks, frags = found('spool-fragment') - 2 * g.spools;
    it('mask-shard', shards > 0, `${num(Math.max(0, shards))}/4`);
    it('spool-fragment', frags > 0, `${num(Math.max(0, frags))}/2`);
    for (const id of ['memory-locket', 'craftmetal', 'pale-oil']) it(id, found(id) > 0, `${num(found(id))}/${num(total(id))}`);
    it('everbloom', g.everbloom);
    // The Silk Hearts, the Old Hearts and the melodies, each with its own picture.
    out.push({ list: 'pieces', id: 'silk-heart', name: { es: t('kind_silkHeart'), en: t('kind_silkHeart') }, got: g.hearts > 0, count: `${num(g.hearts)}/3` });
    CO.PIECES.forEach((p, i) => {
      if (p[0] !== 'old-heart' && p[0] !== 'melody') return;
      out.push({ list: 'pieces', id: PIECE_ICON[p[2][1]], name: p[4], desc: p[5], got: g.pieces.includes(i) });
    });
    out.push({ list: 'pieces', id: 'flea', name: { es: t('kind_fleas'), en: t('kind_fleas') }, got: found('flea') > 0, count: `${num(found('flea'))}/${num(total('flea'))}` });
    return out;
  }

  // The thing the description shows: the one picked (a click), else the first you have.
  let picked = null;
  const keyOf = (x) => x.list + '/' + x.id;

  function cell(x) {
    const cls = `inv-cell${x.got ? '' : ' is-missing'}${x.color ? ' is-' + x.color : ''}${picked === keyOf(x) ? ' is-picked' : ''}`;
    const label = pick(x.name) + (x.count ? ' ' + x.count : '') + (x.got ? '' : ' · ' + t('invMissing'));
    return `<li><button type="button" class="${cls}" data-act="invPick" data-key="${esc(keyOf(x))}" aria-pressed="${picked === keyOf(x)}"
      aria-label="${esc(label)}" title="${esc(pick(x.name))}"${NT}>
        <img src="${icon(x.list, x.id)}" alt="" loading="lazy">${x.count ? `<span class="inv-count">${esc(x.count)}</span>` : ''}</button></li>`;
  }
  const grid = (title, list, cls = '') => `<section class="inv-group${cls}"><h3 class="inv-h">${esc(title)}</h3><ul class="inv-grid">${list.map(cell).join('')}</ul></section>`;

  function detail(x) {
    if (!x) return `<p class="inv-hint">${esc(t('invHint'))}</p>`;
    return `<img class="inv-big${x.got ? '' : ' is-missing'}" src="${icon(x.list, x.id)}" alt="">
      <h3 class="inv-name"${NT}>${esc(pick(x.name))}</h3>
      ${x.count ? `<p class="inv-have">${esc(x.count)}</p>` : ''}
      ${x.got ? '' : `<p class="inv-not">${esc(t('invMissing'))}</p>`}
      ${x.desc ? `<p class="inv-desc">${esc(pick(x.desc))}</p>` : ''}`;
  }

  let shown = [];   // what the last render drew, for the hover
  App.screens.game = (sec) => {
    const own = App.game();
    const g = own || fullGame();
    // In free mode everything is had, the loose pieces too (a full game has none left loose).
    const all = shown = things(g).map((x) => (own ? x : { ...x, got: true }));
    const by = (list) => all.filter((x) => x.list === list);
    const current = all.find((x) => keyOf(x) === picked) || null;
    const n = 5 + g.masks;
    const needle = D.NEEDLES[Math.max(0, Math.min(4, g.needle))];
    const side = `<aside class="inv-side">
        <div class="inv-needle"><img src="${ART.needle(g.needle)}" alt="" width="80" height="600">
          <p class="inv-needle-name"${NT}>${esc(pick(needle.name))}</p>
          <p class="inv-needle-dmg"><span class="save-k">${esc(t('invDamage'))}</span> <b>${num(needle.damage)}</b></p></div>
        <div class="inv-hud">
          <p class="inv-masks" aria-label="${esc(t('chMasks', { n: num(n) }))}">${Array.from({ length: n }, () => `<img src="${ART.mask}" alt="">`).join('')}</p>
          <p class="inv-silk"><img src="${ART.spool}" alt=""><span><span class="save-k">${esc(t('invSilk'))}</span> <b>${num(9 + g.spools)}</b></span></p>
        </div>
      </aside>`;
    const tools = ['red', 'blue', 'yellow'].map((c) => by('tools').filter((x) => x.color === c));
    sec.innerHTML = `<div class="inv">${brackets}${screenHead(esc(t('navGame')), own ? '' : `<p class="saves-note">${esc(t('invFree'))}</p>`)}
      <div class="inv-body">
        ${side}
        <div class="inv-main">
          ${grid(t('cat_tools'), tools.flat(), ' is-tools')}
          ${grid(t('cat_crests'), by('crests'))}
          <div class="inv-pair">${grid(t('cat_skills'), by('skills'))}${grid(t('cat_arts'), by('arts'))}</div>
          ${grid(t('invItems'), [...by('items'), ...by('pieces')])}
        </div>
        <div class="inv-detail" aria-live="polite">${detail(current)}</div>
      </div>
    </div>`;
  };

  /* Pointing at a thing reads it in the pane, as moving the cursor does in the game; leaving the
     grids goes back to the one picked. Only the pane is repainted. */
  const pane = () => document.querySelector('.screen[data-view="game"] .inv-detail');
  const show = (key) => { const p = pane(); if (p) p.innerHTML = detail(shown.find((x) => keyOf(x) === key) || null); };
  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest && e.target.closest('.inv-cell');
    if (b && App.prefs.view === 'game') show(b.dataset.key);
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest && e.target.closest('.inv-main');
    if (b && !b.contains(e.relatedTarget) && App.prefs.view === 'game') show(picked);
  });
  document.addEventListener('focusin', (e) => {
    const b = e.target.closest && e.target.closest('.inv-cell');
    if (b && App.prefs.view === 'game') show(b.dataset.key);
  });

  Object.assign(actions, {
    invPick(node) {
      picked = node.dataset.key === picked ? null : node.dataset.key;
      App.render();
      const b = document.querySelector(`[data-act="invPick"][data-key="${CSS.escape(node.dataset.key)}"]`);
      if (b) b.focus({ preventScroll: true });
    },
  });
})();
