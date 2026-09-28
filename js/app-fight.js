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

  /* ── The enemy gauntlets (js/gauntlets.js): an arena's waves, one after another ──
     Named by the place the wiki files it under, or its area (with a number when an area has
     several); its reward, the game's name for it, when it gives something the game names. */
  const G = SS.gauntlets.GAUNTLETS;
  const CO = SS.collectibles;
  // Its place's name, or its area's; numbered when several share it (Craw Lake has two).
  const baseName = (g) => (g.place ? pick(g.place) : g.area && CO.AREAS[g.area] ? pick(CO.AREAS[g.area]) : g.id);
  const gauntletName = (g) => {
    const same = G.filter((x) => baseName(x) === baseName(g));
    return same.length > 1 ? `${baseName(g)} ${num(same.indexOf(g) + 1)}` : baseName(g);
  };
  // By id, for the screens before this one ("since the previous save" on Your game).
  App.gauntletName = (id) => { const g = G.find((x) => x.id === id); return g ? gauntletName(g) : id; };
  const gHp = (g) => g.waves.reduce((a, w) => a + w.reduce((b, [id, n]) => b + ((FOE.get(id) || {}).hp || 0) * n, 0), 0);

  // In a save, the ones it has cleared (js/savefile.js reads each one's condition), ticked.
  function gauntletPicker(cur, done) {
    return `<div class="ft-pick"><ul class="ft-foes is-gauntlets">${G.map((g) => `<li><button type="button" class="ft-foe${g === cur ? ' is-on' : ''}"
        data-act="ftGauntlet" data-value="${g.id}" aria-pressed="${g === cur}"${NT}><img src="${portrait(FOE.get(g.waves[g.waves.length - 1][0][0]))}" alt="" loading="lazy">
        <span>${esc(gauntletName(g))}</span><i class="ft-boss">${done.has(g.id) ? `${App.tick}<span class="sr-only">${esc(t('ftCleared'))}</span> ` : ''}${esc(t('ftWaves', { n: num(g.waves.length) }))}</i></button></li>`).join('')}</ul></div>`;
  }
  function gauntletCard(g, game) {
    const area = g.area && CO.AREAS[g.area] ? pick(CO.AREAS[g.area]) : '';
    return `<div class="ft-card">
        <h3 class="inv-name"${NT}>${esc(gauntletName(g))}</h3>
        ${g.place && area ? `<p class="ft-hp"${NT}>${esc(area)}</p>` : ''}
        <p class="ft-hp"><span class="save-k">${esc(t('ftHp'))}</span> <b>${num(gHp(g))}</b></p>
        ${g.reward ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftReward'))}</span> <span${NT}>${esc(pick(g.reward))}</span></p>` : ''}
        ${game ? `<p class="ft-stagger">${game.gauntlets.includes(g.id) ? `${App.tick} ${esc(t('ftCleared'))}` : esc(t('ftNotCleared'))}</p>` : ''}
        <p class="pg-note">${esc(t('ftGauntletNote'))}</p>
      </div>`;
  }
  function gauntletWaves(g, st) {
    return g.waves.map((w, i) => {
      const rows = w.map(([id, n]) => {
        const f = FOE.get(id), r = E.compute(st, { foe: f });
        const a = r.needle.attacks[0];
        return `<li><img src="${portrait(f)}" alt=""><span class="ct-list-name"${NT}>${esc(pick(f.name))}${n > 1 ? ` ×${num(n)}` : ''}</span>
          <span class="ct-list-sub">${esc(t('ftHp') + ' ' + (f.hp == null ? '?' : num(f.hp)))}</span><b>${num(a.total)}</b>
          <span class="ft-uses">${a.uses == null ? '' : esc(t('ftUses', { n: num(a.uses) }))}</span></li>`;
      }).join('');
      return `<section class="ct-block"><h3 class="ct-h">${esc(t('ftWave', { n: num(i + 1) }))}</h3><ul class="ct-list ft-list">${rows}</ul></section>`;
    }).join('');
  }

  App.screens.fight = (sec) => {
    const mode = prefs.ftMode === 'gauntlets' ? 'gauntlets' : 'foe';
    const modes = `<div class="seg pg-seg" role="group" aria-label="${esc(t('ftModes'))}">
        <button type="button" data-act="ftMode" data-value="foe" aria-pressed="${mode === 'foe'}">${esc(t('ftModeFoe'))}</button>
        <button type="button" data-act="ftMode" data-value="gauntlets" aria-pressed="${mode === 'gauntlets'}">${esc(t('ftModeGauntlets'))}</button></div>`;
    if (mode === 'gauntlets') {
      const g = G.find((x) => x.id === prefs.gauntlet) || G[0];
      const st = App.currentBuild();
      const game = App.game(), done = new Set(game ? game.gauntlets : []);
      const count = game ? `<p class="saves-note">${esc(t('ftClearedCount', { n: num(done.size), of: num(G.length) }))}</p>` : '';
      /* The whole arena at once, silk and loads carrying over: its health as your Needle's level
         sees it (each enemy's health over its modifier at that level), against the plan. The Tools
         hit at the Kit's level, where the modifiers can differ: an estimate, and it says so. */
      const lvl = E.normalize(st).needle;
      const hpAll = Math.ceil(g.waves.reduce((a, w) => a + w.reduce((b, [id, n]) => {
        const f = FOE.get(id) || {};
        return b + (f.hp ? (f.hp / (f.mods ? f.mods[lvl] : 1)) * n : 0);
      }, 0), 0));
      const whole = E.compute(st, { foe: { id: g.id, hp: hpAll, mods: [1, 1, 1, 1, 1] } });
      const p = planHtml(whole);
      sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), modes + count)}
        <div class="ft-body">${gauntletPicker(g, done)}${gauntletCard(g, game)}<div class="ct-figs">${p}${gauntletWaves(g, st)}</div></div></div>`;
      return;
    }
    const f = FOE.get(prefs.foe) || FOE.get('lace');
    const black = !!prefs.ftBlack && !!f.bt;
    const r = E.compute(App.currentBuild(), { foe: f, black });
    const st = r.state;
    const build = `<p class="saves-note">${esc(t('ftBuild', { crest: pick(D.CRESTS.find((c) => c.id === st.crest).name), needle: pick(D.NEEDLES[st.needle].name), kit: num(st.kit) }))}
      <a class="text-btn" href="${App.here(App.hashFor('tools'))}" data-act="view" data-value="tools">${esc(t('navTools'))}</a></p>`;
    sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), modes + build)}
      <div class="ft-body">${picker(f)}${card(f, r)}<div class="ct-figs">${planHtml(r)}${against(f, r)}${theirs(f, r)}</div></div></div>`;
  };

  /* A boss's page (tools/pages-bosses.js) opens on that boss: <html data-foe>, applied at boot
     once the preferences are read, unless the link names another screen. Not saved: going back
     to the calculator's own page keeps the enemy you had. */
  App.adoptFoe = (linkedView) => {
    const id = document.documentElement.dataset.foe;
    if (!id || !FOE.has(id) || (linkedView && linkedView !== 'fight')) return;
    prefs.foe = id;
    prefs.ftMode = 'foe';
  };

  Object.assign(actions, {
    ftFoe(node) { prefs.foe = node.dataset.value; savePrefs(); render(); },
    ftBlack() { prefs.ftBlack = !prefs.ftBlack; savePrefs(); render(); },
    ftMode(node) { prefs.ftMode = node.dataset.value; savePrefs(); render(); },
    ftGauntlet(node) { prefs.gauntlet = node.dataset.value; savePrefs(); render(); },
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
