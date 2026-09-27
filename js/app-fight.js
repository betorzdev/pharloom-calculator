/* js/app-fight.js — Combat: your build against one enemy. Every enemy carries five damage
   modifiers, one per level of what hits (js/enemies.js, the wiki's master tables), so how many
   hits kill it is a question per enemy: the engine (js/engine.js, compute(state, { foe })) takes
   the enemy's modifier at the Needle's level for the Needle, its Strike and the Silk Skills, and at
   the Crafting Kit's for the Tools, and says how many uses of each attack take its health, normal
   or black-threaded (Act 3). The build is the Crest screen's: in a save, what Hornet wears; in
   Free mode, the one being tried. And the other way: how many hits of each of a boss's attacks
   take your masks (the wiki's figures, one mask when it gives none; the attacks' names are the
   wiki's, the game doesn't name them). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, EN = SS.enemies, E = SS.engine, J = SS.journal;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n, d = 0) => App.NF[d].format(n);
  const FOE = new Map(EN.FOES.map((f) => [f.id, f]));
  const BOOK_BY_N = new Map(J.BOOK.map((e) => [e.n, e]));
  const portrait = (f) => { const e = BOOK_BY_N.get(f.hj); return e ? `assets/icons/journal/${e.id}.webp` : ''; };
  const foeName = (f) => pick(f.name) + (f.variant ? ' · ' + pick(f.variant) : '');
  // Bosses first, then the rest, each in the Journal's order.
  const ORDER = EN.FOES.slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || a.hj - b.hj || foeName(a).localeCompare(foeName(b)));
  let query = '';
  const fold = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const HAY = new Map(EN.FOES.map((f) => [f.id, fold([f.name.es, f.name.en, f.variant ? f.variant.es + ' ' + f.variant.en : ''].join(' '))]));

  function picker(cur) {
    // In both languages and without accents: "moor" finds Moorwing in Spanish too, «paramo» «Páramo».
    const q = fold(query.trim());
    const list = ORDER.filter((f) => !q || HAY.get(f.id).includes(q)).slice(0, 80);
    return `<div class="ft-pick">
        <label class="search"><span class="sr-only">${esc(t('ftSearch'))}</span>${App.lens}
          <input type="search" data-act="ftQuery" value="${esc(query)}" placeholder="${esc(t('ftSearch'))}" autocomplete="off"></label>
        <ul class="ft-foes">${list.map((f) => `<li><button type="button" class="ft-foe${cur && f.id === cur.id ? ' is-on' : ''}" data-act="ftFoe" data-value="${f.id}"
          aria-pressed="${!!cur && f.id === cur.id}"${NT}><img src="${portrait(f)}" alt="" loading="lazy"><span>${esc(foeName(f))}</span>${f.boss ? `<i class="ft-boss">${esc(t('ftBoss'))}</i>` : ''}</button></li>`).join('')}
          ${list.length ? '' : `<li class="pg-note">${esc(t('ftNone'))}</li>`}</ul>
      </div>`;
  }

  function card(f, r) {
    const black = !!prefs.ftBlack && f.bt;
    const hp = black ? f.bt : f.hp;
    const lv = r.state.needle, kit = r.state.kit;
    const mods = f.mods.map((m, i) => `<li class="${i === lv ? 'is-needle' : ''}${i === kit ? ' is-kit' : ''}"><span>${num(i)}</span><b>×${num(m, 2)}</b></li>`).join('');
    const st = (EN.ATTACKS[f.page] || { staggers: [] }).staggers;
    return `<div class="ft-card">
        <img class="ft-big" src="${portrait(f)}" alt="">
        <h3 class="inv-name"${NT}>${esc(foeName(f))}</h3>
        <p class="ft-hp"><span class="save-k">${esc(t('ftHp'))}</span> <b>${hp == null ? '?' : num(hp)}</b>${f.bars ? ` <span class="ft-bars">${esc(f.bars.map((b) => num(b)).join(' + '))}</span>` : ''}</p>
        ${f.bt ? `<button type="button" class="check" role="switch" aria-checked="${black}" data-act="ftBlack"><span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(t('ftBlack', { n: num(f.bt) }))}</span></button>` : ''}
        <div class="ft-mods"><span class="save-k">${esc(t('ftMods'))}</span><ol>${mods}</ol>
          <p class="pg-note">${esc(t('ftModsNote', { n: num(lv), k: num(kit) }))}</p></div>
        ${st.length ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftStagger'))}</span> ${esc(st.map((x) => t('ftHits', { n: num(x) })).join(' · '))}</p>` : ''}
      </div>`;
  }

  // One row: what, the hits of one use, what a use does, and the uses that kill.
  const row = (img, name, each, total, uses, extra = '') => `<li>${img ? `<img src="${img}" alt="">` : '<span></span>'}
      <span class="ct-list-name"${NT}>${esc(name)}</span>
      <span class="ct-list-sub">${esc([each.length > 1 ? each.map((x) => num(x)).join(' + ') : '', extra].filter(Boolean).join(' · '))}</span>
      <b>${num(total)}</b><span class="ft-uses">${uses == null ? '' : esc(t('ftUses', { n: num(uses) }))}</span></li>`;
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;

  function against(f, r) {
    const n = r.needle;
    const rows = [];
    // The slash says its product: the Needle × Hornet's bracket × the enemy's modifier at its level.
    const formula = t('ftFormula', { base: num(n.base), x: num(n.bracket, 2), m: num(n.enemy, 2) });
    for (const a of n.attacks.filter((x) => x.id === 'slash' || D.CRESTS.find((c) => c.id === r.state.crest).attacks)) {
      rows.push(row(`assets/needles/${n.level}.png`, t('ctAtt_' + a.id), a.each, a.total, a.uses, a.id === 'slash' ? formula : ''));
    }
    if (r.strike) rows.push(row(icon('arts', 'needle-strike'), t('ctStrike'), r.strike.each, r.strike.total, r.strike.uses));
    const sk = r.skills.find((s) => s.equipped);
    if (sk) rows.push(row(icon('skills', sk.id), pick(D.SKILLS.find((x) => x.id === sk.id).name), sk.each, sk.total, sk.uses));
    for (const x of r.tools.filter((y) => y.attacks.length)) {
      const a = x.attacks[0];
      const load = x.loadShare != null ? t('ftLoad', { p: num(Math.min(999, x.loadShare * 100)) }) : '';
      rows.push(row(icon('tools', x.id), pick(D.TOOLS.find((y) => y.id === x.id).name), a.each, a.total, a.uses, load));
    }
    return `<section class="ct-block"><h3 class="ct-h">${esc(t('ftYours'))}</h3><ul class="ct-list ft-list">${rows.join('')}</ul>
      <p class="pg-note">${esc(t('ftYoursNote'))}</p></section>`;
  }

  /* The fight as a whole (js/engine.js, plan): the red Tools' loads first, then the fewest slashes
     with the Skill casts their silk pays for, the spool full to start and no Bind. */
  function planHtml(r) {
    const p = E.plan(r, r.foe && r.foe.hp);
    if (!p) return '';
    const parts = p.throws.map((x) => t('ftPlanThrows', { n: num(x.n), name: pick(D.TOOLS.find((y) => y.id === x.id).name) }));
    if (p.slashes) parts.push(t(p.slashes === 1 ? 'ftPlanSlash' : 'ftPlanSlashes', { n: num(p.slashes) }));
    const sk = r.skills.find((x) => x.equipped);
    if (p.casts) parts.push(t('ftPlanCasts', { n: num(p.casts), name: pick(D.SKILLS.find((y) => y.id === sk.id).name) }));
    const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' ' + t('ftAnd') + ' ' + parts.at(-1) : parts[0];
    return `<section class="ct-block ft-plan"><h3 class="ct-h">${esc(t('ftPlan'))}</h3>
      <p class="ft-plan-line">${esc(list)}</p><p class="pg-note">${esc(t('ftPlanNote', { s: num(r.silk.spool) }))}</p></section>`;
  }

  // A boss's attacks against you: how many of each take your masks (Barbed Bracelet: double damage).
  function theirs(f, r) {
    const a = EN.ATTACKS[f.page];
    if (!a || !a.attacks.length) return '';
    const masks = r.health.masks, twice = r.state.tools.includes('barbed-bracelet');
    const list = a.attacks.map((x) => {
      const per = (x.masks || [1]).reduce((s, m) => s + m, 0) * (twice ? 2 : 1);
      return `<li><span class="ct-list-name"${NT}>${esc(pick(x.name))}</span><span class="ct-list-sub">${esc([x.where ? pick(x.where) : '', x.type ? t('ftType_' + x.type) : ''].filter(Boolean).join(' · '))}</span>
        <b>${num(per)}</b><span class="ft-uses">${esc(t('ftToDie', { n: num(Math.ceil(masks / per)) }))}</span></li>`;
    }).join('');
    return `<section class="ct-block"><h3 class="ct-h">${esc(t('ftTheirs', { n: num(masks) }))}</h3><ul class="ct-list ft-list is-theirs">${list}</ul>
      <p class="pg-note">${esc(t('ftTheirsNote'))}</p></section>`;
  }

  App.screens.fight = (sec) => {
    const f = FOE.get(prefs.foe) || FOE.get('lace');
    const black = !!prefs.ftBlack && !!f.bt;
    const r = E.compute(App.currentBuild(), { foe: f, black });
    const st = r.state;
    const build = `<p class="saves-note">${esc(t('ftBuild', { crest: pick(D.CRESTS.find((c) => c.id === st.crest).name), needle: pick(D.NEEDLES[st.needle].name), kit: num(st.kit) }))}
      <a class="text-btn" href="${App.here(App.hashFor('tools'))}" data-act="view" data-value="tools">${esc(t('navTools'))}</a></p>`;
    sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), build)}
      <div class="ft-body">${picker(f)}${card(f, r)}<div class="ct-figs">${planHtml(r)}${against(f, r)}${theirs(f, r)}</div></div></div>`;
  };

  Object.assign(actions, {
    ftFoe(node) { prefs.foe = node.dataset.value; savePrefs(); render(); },
    ftBlack() { prefs.ftBlack = !prefs.ftBlack; savePrefs(); render(); },
  });
  // The search filters as you type; only the list is repainted, so the field keeps its focus.
  document.addEventListener('input', (e) => {
    if (!e.target.matches || !e.target.matches('[data-act="ftQuery"]')) return;
    query = e.target.value;
    const f = FOE.get(prefs.foe) || FOE.get('lace');
    const box = document.createElement('div');
    box.innerHTML = picker(f);
    const list = document.querySelector('.ft-foes');
    if (list) list.replaceWith(box.querySelector('.ft-foes'));
  });
})();
