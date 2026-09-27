/* js/app-tools.js — the Crest screen («Blasón», PANE_TOOLS): a build and Hornet's figures for it
   (js/engine.js). On the left the Crest, its text and its slots, filled with the Tools and the
   Silk Skill; in the middle what makes the build; on the right the figures: the Needle's slash
   with its modifiers, the Needle Strike, the six Silk Skills, the Tools equipped (damage, ammo,
   a full load, the refill), silk, masks and the Bind.
   In a save, the build is what Hornet wears in the game (js/savefile.js, buildOf) at its levels,
   and it's read, not changed, as the Hollow Knight site does: to try builds there's Free mode,
   where everything is at hand and the build is kept in pharloom.build. Shares SS.app with
   js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, E = SS.engine;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions, load, save, render, toast } = App;
  const C = SS.codec, S = SS.saves;

  const KEY = 'pharloom.build';
  const num = (n, d = 0) => App.NF[d].format(n);
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  const TOOL = new Map(D.TOOLS.map((x) => [x.id, x]));
  const COLORS = ['red', 'blue', 'yellow'];

  /* The build on screen: in a save, the game's; in Free mode, the one kept here (a Hunter at
     the top of every ladder to start with). */
  const FREE_START = { crest: 'hunter', hunterStage: 3, needle: 4, kit: 4, pouch: 4, masks: 5, spools: 9, hearts: 3,
    tools: ['straight-pin', 'claw-mirror', 'compass'], skill: 'silkspear', vest: { yellow: true, blue: true } };
  function freeBuild() {
    let x = null;
    try { x = JSON.parse(load(KEY) || 'null'); } catch (e) { x = null; }
    return E.normalize({ ...FREE_START, ...(x && typeof x === 'object' ? x : {}) });
  }
  // Free mode's build is kept here and travels in the URL (js/codec.js), so a link says it.
  const setFree = (st) => { save(KEY, JSON.stringify(st)); App.build = C.encode(st); };

  /* A build in the link (the boot, or a link pasted by hand): it's Free mode's. In a save, which
     is read and not changed, the page goes to Free mode to show it, and says so. Without a
     link, Free mode's own build goes into the URL; a save's never does (its link is Share's). */
  App.adoptBuild = () => {
    const linked = App.build ? C.decode(App.build) : null;
    let store = null;
    try { store = localStorage; } catch (e) { store = null; }
    if (linked) {
      if (store && App.activeSlot() !== S.FREE && S.select(store, S.FREE)) toast(t('ctLinkFree'));
      setFree(linked);
      return;
    }
    App.build = App.game() ? '' : C.encode(freeBuild());
  };
  /* The moment of the fight (focus, fury, Flintslate, a Challenge) isn't part of the build: in a
     save too it can be switched, and it's kept only while the page is open. */
  const moment = { focus: true, fury: false, flint: false, challenge: false };
  function current() {
    const g = App.game();
    if (!g) return { st: freeBuild(), locked: false };
    const b = g.build || {};
    return { locked: true, st: E.normalize({ ...b, needle: g.needle, kit: g.kit, pouch: g.pouch, masks: g.masks, spools: g.spools, hearts: g.hearts,
      ...moment }) };
  }

  /* ── The Crest and its slots ── */
  function slotsHtml(st, r) {
    const crest = D.CRESTS.find((c) => c.id === st.crest);
    const worn = COLORS.map((c) => st.tools.filter((id) => TOOL.get(id).color === c));
    const box = (c, id, lockedSlot) => `<span class="ct-slot is-${c}${id ? ' is-full' : ''}${lockedSlot ? ' is-locked' : ''}"${id ? ` title="${esc(pick(TOOL.get(id).name))}"` : ''}>${id ? `<img src="${icon('tools', id)}" alt="${esc(pick(TOOL.get(id).name))}">` : ''}</span>`;
    const rows = COLORS.map((c, i) => {
      const s = r.slots[c];
      const n = Math.max(s.open + s.locked + s.extra, worn[i].length);
      if (!n) return '';
      const cells = Array.from({ length: n }, (_, k) => box(c, worn[i][k], k >= s.open && k < s.open + s.locked && !worn[i][k])).join('');
      return `<div class="ct-row"><span class="ct-row-k">${esc(t('ct_' + c))}</span><span class="ct-row-v">${cells}</span>${s.over ? `<span class="ct-over">${esc(t('ctOver', { n: s.over }))}</span>` : ''}</div>`;
    }).join('');
    const skill = crest.slots.skill ? `<div class="ct-row"><span class="ct-row-k">${esc(t('cat_skills'))}</span><span class="ct-row-v">
        <span class="ct-slot is-skill${st.skill ? ' is-full' : ''}">${st.skill ? `<img src="${icon('skills', st.skill)}" alt="${esc(pick(D.SKILLS.find((s) => s.id === st.skill).name))}">` : ''}</span></span></div>` : '';
    return `<div class="ct-crest">
        <img class="ct-crest-img" src="${icon('crests', crest.id)}" alt="">
        <h3 class="ct-crest-name"${NT}>${esc(pick(crest.name))}${st.crest === 'hunter' && st.hunterStage > 1 ? ` <span class="ct-stage">${esc(t('ctStage', { n: st.hunterStage }))}</span>` : ''}</h3>
        <p class="ct-crest-desc">${esc(pick(st.crest === 'hunter' && st.hunterStage > 1 && crest.evolved ? crest.evolved : crest.desc))}</p>
      </div>
      <div class="ct-slots">${skill}${rows}</div>`;
  }

  /* ── What makes the build (Free mode: buttons; a save: the same, read) ── */
  // A row of choices (data-key says which field) and an on/off (data-value says which situation).
  const seg = (act, key, value, opts, dis) => `<div class="seg sm" role="group">${opts.map(([v, label]) =>
    `<button type="button" data-act="${act}" data-key="${key}" data-value="${v}" aria-pressed="${String(v) === String(value)}"${dis ? ' disabled' : ''}>${label}</button>`).join('')}</div>`;
  const check = (which, on, label) => `<button type="button" class="check" role="switch" aria-checked="${on}" data-act="ctToggle" data-value="${which}">
      <span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(label)}</span></button>`;

  function controls(st, locked) {
    const crests = D.CRESTS.map((c) => `<li><button type="button" class="ct-pick${st.crest === c.id ? ' is-on' : ''}" data-act="ctCrest" data-value="${c.id}"
        aria-pressed="${st.crest === c.id}" title="${esc(pick(c.name))}"${locked ? ' disabled' : ''}${NT}><img src="${icon('crests', c.id)}" alt="${esc(pick(c.name))}"></button></li>`).join('');
    const lv = (n) => [0, 1, 2, 3, 4].map((v) => [v, num(v)]);
    const situ = [
      st.crest === 'hunter' && st.hunterStage >= 2 ? check('focus', st.focus, t('ctFocus')) : '',
      st.crest === 'beast' ? check('fury', st.fury, t('ctFury')) : '',
      st.tools.includes('flintslate') ? check('flint', st.flint, t('ctFlint')) : '',
      check('challenge', st.challenge, t('ctChallenge')),
    ].join('');
    const tools = locked ? '' : COLORS.map((c) => `<ul class="ct-tools">${D.TOOLS.filter((x) => x.color === c).map((x) => {
      const on = st.tools.includes(x.id);
      return `<li><button type="button" class="ct-tool is-${c}${on ? ' is-on' : ''}" data-act="ctTool" data-value="${x.id}" aria-pressed="${on}" title="${esc(pick(x.name))}"${NT}>
        <img src="${icon('tools', x.id)}" alt="${esc(pick(x.name))}" loading="lazy"></button></li>`; }).join('')}</ul>`).join('');
    const skills = locked ? '' : `<ul class="ct-tools">${D.SKILLS.map((x) => `<li><button type="button" class="ct-tool is-skill${st.skill === x.id ? ' is-on' : ''}"
        data-act="ctSkill" data-value="${x.id}" aria-pressed="${st.skill === x.id}" title="${esc(pick(x.name))}"${NT}><img src="${icon('skills', x.id)}" alt="${esc(pick(x.name))}"></button></li>`).join('')}</ul>`;
    return `<div class="ct-controls">
        <div class="ct-field"><span class="ct-k">${esc(t('cat_crests'))}</span><ul class="ct-crests">${crests}</ul></div>
        ${st.crest === 'hunter' ? `<div class="ct-field"><span class="ct-k">${esc(t('ctEvolution'))}</span>${seg('ctLevel', 'hunterStage', st.hunterStage, [[1, num(1)], [2, num(2)], [3, num(3)]], locked)}</div>` : ''}
        <div class="ct-field"><span class="ct-k"${NT}>${esc(pick(D.NEEDLES[st.needle].name))}</span>${seg('ctLevel', 'needle', st.needle, lv(), locked)}</div>
        <div class="ct-field"><span class="ct-k"${NT}>${esc(pick(D.ITEMS.find((x) => x.id === 'crafting-kit').name))}</span>${seg('ctLevel', 'kit', st.kit, lv(), locked)}</div>
        <div class="ct-field"><span class="ct-k"${NT}>${esc(pick(D.ITEMS.find((x) => x.id === 'tool-pouch').name))}</span>${seg('ctLevel', 'pouch', st.pouch, lv(), locked)}</div>
        <div class="ct-field"><span class="ct-k">${esc(t('ctSituation'))}</span><div class="ct-checks">${situ}</div></div>
        ${locked ? '' : `<div class="ct-field is-wide"><span class="ct-k">${esc(t('cat_tools'))}</span>${tools}</div>
        <div class="ct-field is-wide"><span class="ct-k">${esc(t('cat_skills'))}</span>${skills}</div>`}
      </div>`;
  }

  /* ── The figures ── */
  const MOD_NAME = {
    challenge: () => pick(D.MODIFIERS.find((m) => m.id === 'challenge').name), 'hunter-focus-2': () => t('ctFocus'),
    'hunter-focus-3': () => t('ctFocusFull'), 'beast-fury': () => t('ctFury'),
  };
  const modName = (id) => (MOD_NAME[id] ? MOD_NAME[id]() : TOOL.has(id) ? pick(TOOL.get(id).name)
    : pick((D.CRESTS.find((c) => c.id === id) || { name: { es: id, en: id } }).name));
  const fig = (k, v, sub = '') => `<div class="ct-fig"><span class="ct-fig-k">${k}</span><span class="ct-fig-v">${v}</span>${sub ? `<span class="ct-fig-sub">${sub}</span>` : ''}</div>`;
  const hitsText = (each) => (each.length > 1 ? each.map((x) => num(x)).join(' + ') : '');

  function figures(r) {
    const n = r.needle;
    // The Crests that split their slashes show all three; the rest, the one slash.
    const own = !!D.CRESTS.find((c) => c.id === r.state.crest).attacks;
    const mods = r.mods.needle.map((id) => `<li${NT}>${esc(modName(id))}</li>`).join('');
    const needle = `<section class="ct-block"><h3 class="ct-h">${esc(t('ctNeedle'))}</h3>
        ${own ? n.attacks.map((a) => fig(esc(t('ctAtt_' + a.id)), `<b>${num(a.total)}</b>`,
          esc([hitsText(a.each), a.charged ? t('ctCharged', { n: num(a.charged) }) : '', a.onHit ? t('ctOnHit', { n: num(a.onHit) }) : ''].filter(Boolean).join(' · ')))).join('')
        : fig(esc(t('ctSlash')), `<b>${num(n.slash)}</b>`, n.bracket !== 1 ? esc(t('ctBracket', { base: num(n.base), x: num(n.bracket, 2) })) : '')}
        ${mods ? `<ul class="ct-mods">${mods}</ul>` : ''}
        ${n.crit ? fig(esc(t('ctCrit')), `<b>${num(n.crit.damage)}</b>`, esc(t('ctCritChance', { p: num(n.crit.chance * 100, 1) }))) : ''}
        ${r.strike ? fig(esc(t('ctStrike')), `<b>${num(r.strike.total)}</b>`, esc(hitsText(r.strike.each))) : ''}
      </section>`;
    const skills = `<section class="ct-block"><h3 class="ct-h">${esc(t('cat_skills'))}</h3><ul class="ct-list">${r.skills.map((s) => `
        <li class="${s.equipped ? 'is-on' : ''}"><img src="${icon('skills', s.id)}" alt=""><span class="ct-list-name"${NT}>${esc(pick(D.SKILLS.find((x) => x.id === s.id).name))}</span>
        <span class="ct-list-sub">${esc(hitsText(s.each))}</span><b>${num(s.total)}</b></li>`).join('')}</ul>
        ${r.mods.skill.length ? `<ul class="ct-mods">${r.mods.skill.map((id) => `<li${NT}>${esc(modName(id))}</li>`).join('')}</ul>` : ''}</section>`;
    const dmgTools = r.tools.filter((x) => x.attacks.length);
    const tools = dmgTools.length ? `<section class="ct-block"><h3 class="ct-h">${esc(t('ctToolsDmg'))}</h3><ul class="ct-list">${dmgTools.map((x) => {
      const a = x.attacks[0];
      const extra = [x.ammo ? t('ctAmmo', { n: num(x.ammo) }) : '', x.load ? t('ctLoad', { n: num(x.load) }) : '', x.refill ? t('ctRefill', { n: num(x.refill) }) : ''].filter(Boolean).join(' · ');
      return `<li><img src="${icon('tools', x.id)}" alt=""><span class="ct-list-name"${NT}>${esc(pick(TOOL.get(x.id).name))}</span>
        <span class="ct-list-sub">${esc([hitsText(a.each), extra].filter(Boolean).join(' · '))}</span><b>${num(a.total)}</b></li>`; }).join('')}</ul></section>` : '';
    const body = `<section class="ct-block"><h3 class="ct-h">${esc(t('ctBody'))}</h3>
        ${fig(esc(t('cat_masks')), `<b>${num(r.health.masks)}</b>`)}
        ${fig(esc(t('invSilk')), `<b>${num(r.silk.spool)}</b>`, esc(t('ctCasts', { n: num(r.silk.casts), c: num(r.silk.skill) })))}
        ${fig(esc(t('ctBind')), `<b>${num(r.health.bind.heals)}</b>`, esc(t('ctBindSub', { parts: r.health.bind.parts.map((p) => num(p)).join(' + '), s: num(r.health.bind.seconds, 2) })))}
      </section>`;
    /* The Tools equipped that deal no damage: what each does, in the game's words (their numbers,
       where the engine has them, are in the figures above: the Bind, silk, the modifiers). */
    const passive = r.tools.filter((x) => !x.attacks.length);
    const effects = passive.length ? `<section class="ct-block"><h3 class="ct-h">${esc(t('ctEffects'))}</h3><ul class="ct-effects">${passive.map((x) => {
      const tool = TOOL.get(x.id);
      return `<li><img src="${icon('tools', x.id)}" alt=""><div><p class="ct-eff-name"${NT}>${esc(pick(tool.name))}</p>${tool.desc ? `<p class="ct-eff-desc">${esc(pick(tool.desc))}</p>` : ''}</div></li>`; }).join('')}</ul></section>` : '';
    return `<div class="ct-figs">${needle}${tools}${skills}${body}${effects}</div>`;
  }

  App.screens.tools = (sec) => {
    const { st, locked } = current();
    const r = E.compute(st);
    const share = `<button type="button" class="btn ct-share" data-act="ctShare">${esc(t('ctShare'))}</button>`;
    const note = locked ? `<p class="saves-note">${esc(t('ctLocked', { n: App.activeSlot() }))} <a class="text-btn" href="${App.here(App.hashFor('saves'))}" data-act="view" data-value="saves">${esc(t('freeMode'))}</a></p>` : '';
    sec.innerHTML = `<div class="ct">${brackets}${screenHead(esc(t('navTools')), note + share)}
      <div class="ct-body">
        <aside class="ct-side">${slotsHtml(st, r)}</aside>
        ${controls(st, locked)}
        ${figures(r)}
      </div></div>`;
  };

  /* ── Changing the build (Free mode only) ── */
  function change(f) {
    if (App.game()) return;
    const st = freeBuild();
    f(st);
    setFree(E.normalize(st));
    App.persist();
    render();
  }
  /* Share: the link to this build (a save's too), on the Crest screen and in the page's language,
     copied; where the browser won't copy, the notice shows it. */
  function shareLink() {
    const { st } = current();
    const u = new URL(location.href);
    u.hash = C.encode(st) + (App.prefs.lang !== App.PAGE_LANG ? '&lang=' + App.prefs.lang : '') + '&view=tools';
    return u.href;
  }
  Object.assign(actions, {
    ctShare() {
      const link = shareLink();
      App.track('share');
      const done = () => toast(t('ctShared'));
      try { navigator.clipboard.writeText(link).then(done, () => toast(link)); } catch (e) { toast(link); }
    },
    ctCrest(node) { change((st) => { st.crest = node.dataset.value; if (!D.CRESTS.find((c) => c.id === st.crest).slots.skill) st.skill = null; }); },
    ctLevel(node) { change((st) => { st[node.dataset.key] = Number(node.dataset.value); }); },
    ctToggle(node) {
      const k = node.dataset.value;
      if (App.game()) { moment[k] = !moment[k]; render(); return; }
      change((st) => { st[k] = !st[k]; });
    },
    ctSkill(node) { change((st) => { st.skill = st.skill === node.dataset.value ? null : node.dataset.value; }); },
    ctTool(node) {
      const id = node.dataset.value;
      change((st) => {
        if (st.tools.includes(id)) { st.tools = st.tools.filter((x) => x !== id); return; }
        // Room in its colour: the Crest's slots, open and locked, and the Vesticrest's.
        const c = TOOL.get(id).color, s = E.compute(st).slots[c];
        const room = s.open + s.locked + s.extra;
        if (s.used >= room) { toast(t('ctFull', { c: t('ct_' + c) })); return; }
        st.tools = [...st.tools, id];
      });
    },
  });
})();
