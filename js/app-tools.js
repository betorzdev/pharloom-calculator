/* js/app-tools.js — the Crest screen («Blasón», PANE_TOOLS): a build and Hornet's figures for it
   (js/engine.js), laid out as the game's pane (design/18-crest-variants.html, A): the figures as
   big numbers and the levels as − N + steppers on top; the Crest drawn as the game draws it, its
   slots where the game puts them (js/crest-slots.js), filled with the Tools and the Silk Skill
   worn; beside it every Tool by colour and the Silk Skills, and the one pointed at described
   with its numbers.
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
    if (!g) {
      // Free mode with marks (the Inventory): what you don't have isn't worn.
      const st = freeBuild(), have = App.freeGame ? App.freeGame() : null;
      if (have) {
        st.tools = st.tools.filter((id) => have.tools.includes(id));
        if (st.skill && !have.skills.includes(st.skill)) st.skill = null;
        if (st.crest !== 'hunter' && !have.crests.includes(st.crest)) st.crest = 'hunter';
      }
      return { st, locked: false, have };
    }
    const b = g.build || {};
    return { locked: true, have: g, st: E.normalize({ ...b, needle: g.needle, kit: g.kit, pouch: g.pouch, masks: g.masks, spools: g.spools, hearts: g.hearts,
      ...moment }) };
  }

  // The build on screen, for the other screens too (Combat, js/app-fight.js).
  App.currentBuild = () => current().st;

  /* ── The Crest and its slots, as the game's pane draws them (js/crest-slots.js) ──
     Each colour's Tools go into its slots in the game's order, the open ones first and then those
     a Memory Locket opens; a slot no Locket has opened yet shows the game's locked frame (in a
     save, as the save says, slot by slot; in Free mode every Locket is used). The
     Vesticrest's slots float under the Crest, clear of its art, as the game's "Floating Slots". In Free mode a
     Tool in a slot is taken off with a tap, and each slot keeps what it holds (seats, per Crest,
     while the page is open): taking one off leaves the others where they were, as in the game. */
  const TYPE = ['red', 'blue', 'yellow', 'skill'];
  const slotName = (kind, id) => pick((kind === 'skill' ? D.SKILLS.find((x) => x.id === id) : TOOL.get(id)).name);
  const seats = {};
  function slot(kind, frame, id, x, y, locked) {
    const style = ` style="--g:url(${SS.crestFrames[frame === 'locked' ? 'locked' : kind]})${x == null ? '' : `;--x:${x};--y:${y}`}"`;
    if (!id) return `<span class="ct-slot is-${kind}${frame === 'locked' ? ' is-locked' : ''}"${style} aria-hidden="true"></span>`;
    const name = slotName(kind, id);
    const act = locked ? 'ctDescribe' : kind === 'skill' ? 'ctSkill' : 'ctTool';
    return `<button type="button" class="ct-slot is-${kind} is-full" data-act="${act}" data-kind="${kind === 'skill' ? 'skill' : 'tool'}" data-value="${id}"${style}
        title="${esc(name)}" aria-label="${esc(name)}"${NT}><img src="${icon(kind === 'skill' ? 'skills' : 'tools', id)}" alt=""></button>`;
  }
  function crestHtml(st, r, locked, have) {
    const crest = D.CRESTS.find((c) => c.id === st.crest);
    const art = st.crest === 'hunter' ? `hunter-${st.hunterStage}` : st.crest;
    const pos = st.crest === 'hunter' ? SS.crestSlots.hunter[st.hunterStage - 1] : SS.crestSlots[st.crest];
    const [w, h, ax, ay] = SS.crestArt[art];
    // Every slot, the Crest's and then the Vesticrest's, in the order the game fills them.
    const spots = [...pos.map((p, i) => ({ kind: TYPE[p[2]], lock: p[3], x: p[0], y: p[1], i }))
      .sort((a, b) => TYPE.indexOf(a.kind) - TYPE.indexOf(b.kind) || a.lock - b.lock || a.i - b.i),
    ...COLORS.flatMap((c) => Array.from({ length: r.slots[c].extra }, () => ({ kind: c, lock: 0 })))];
    const kindOf = (id) => (id === st.skill ? 'skill' : TOOL.get(id).color);
    const wear = [...st.tools, ...(st.skill ? [st.skill] : [])];
    // Each worn one stays in the slot it had (a save's, where the game has it; Free mode's, where it
    // was put); the rest take the first free one of their colour.
    const key = st.crest === 'hunter' ? `hunter-${st.hunterStage}` : st.crest;
    const b = (locked && have && have.build) || {};
    const read = Array.isArray(b.seats) && b.seats.length === pos.length;
    const before = locked ? spots.map((s) => (read && s.i != null ? b.seats[s.i] : null)) : seats[key] || [];
    const opened = (s) => !locked || (read && Array.isArray(b.unlocked) && b.unlocked[s.i] === true);
    const held = spots.map((s, i) => (wear.includes(before[i]) && kindOf(before[i]) === s.kind ? before[i] : null));
    for (const id of wear.filter((x) => !held.includes(x))) {
      const i = spots.findIndex((s, j) => !held[j] && s.kind === kindOf(id));
      if (i >= 0) held[i] = id;
    }
    if (!locked) seats[key] = held;
    const html = (s, i) => slot(s.kind, s.lock && !held[i] && !opened(s) ? 'locked' : s.kind, held[i], s.x, s.y, locked);
    const placed = spots.map((s, i) => (s.x == null ? '' : html(s, i))).join('');
    // What doesn't fit the Crest goes on the Vesticrest's slots.
    const float = spots.map((s, i) => (s.x == null ? html(s, i) : '')).join('');
    // ‹ › change the Crest (Free mode), past the ones the Inventory's marks say you don't have.
    const had = D.CRESTS.filter((c) => c.id === 'hunter' || !have || have.crests.includes(c.id));
    const step = (d) => { const i = had.findIndex((c) => c.id === st.crest); return had[(i + d + had.length) % had.length].id; };
    const arrow = (d, label) => (locked || had.length < 2 ? '' : `<button type="button" class="icon-btn ct-arrow" data-act="ctCrest" data-value="${step(d)}" aria-label="${esc(label)}" title="${esc(label)}">${d < 0 ? '‹' : '›'}</button>`);
    return `<div class="ct-crest" style="--w:${w};--h:${h};--ax:${ax};--ay:${ay}">
        <div class="ct-crest-art"><img src="assets/crests/${art}.webp" alt="">${placed}</div>
        ${float ? `<div class="ct-float">${float}</div>` : ''}
      </div>
      <div class="ct-crest-name">${arrow(-1, t('ctPrev'))}<div><h3${NT}>${esc(pick(crest.name))}</h3>
        ${st.crest === 'hunter' ? `<span class="ct-stage">${esc(t('ctStage', { n: num(st.hunterStage) }))}</span>` : ''}</div>${arrow(1, t('ctNext'))}</div>`;
  }

  /* ── The levels: − N + for the Needle, the Kit, the Pouch and the Hunter's evolution (read
     in a save), and the moment's switches, which a save can switch too. ── */
  const check = (which, on, label) => `<button type="button" class="check" role="switch" aria-checked="${on}" data-act="ctToggle" data-value="${which}">
      <span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(label)}</span></button>`;
  // The game's upgrade pips, lit up to the level: − and + either side, and in Free mode a pip sets it.
  function stepper(key, v, min, max, label, img, locked) {
    const btn = (d, sign, what) => (locked ? '' : `<button type="button" class="icon-btn" data-act="ctLevel" data-key="${key}" data-value="${v + d}"
        ${v + d < min || v + d > max ? 'disabled' : ''} aria-label="${esc(t(what, { what: label }))}" title="${esc(t(what, { what: label }))}">${sign}</button>`);
    const pips = Array.from({ length: max - min + (min ? 1 : 0) }, (_, i) => {
      const level = min ? min + i : i + 1, on = level <= v;
      return locked ? `<i class="ct-pip${on ? ' is-on' : ''}"></i>`
        : `<button type="button" class="ct-pip${on ? ' is-on' : ''}" data-act="ctLevel" data-key="${key}" data-value="${level === v && !min ? v - 1 : level}" aria-label="${esc(label + ' ' + num(level))}"></button>`;
    }).join('');
    return `<span class="ct-lv" role="group" aria-label="${esc(label + ': ' + num(v))}">${img ? `<img src="${img}" alt="">` : ''}<span class="ct-lv-k"${NT}>${esc(label)}</span>
        ${btn(-1, '−', 'invLess')}<span class="ct-pips">${pips}</span>${btn(1, '+', 'invMore')}</span>`;
  }
  function levels(st, locked) {
    const item = (id) => pick(D.ITEMS.find((x) => x.id === id).name);
    const situ = [
      st.crest === 'hunter' && st.hunterStage >= 2 ? check('focus', st.focus, t('ctFocus')) : '',
      st.crest === 'beast' ? check('fury', st.fury, t('ctFury')) : '',
      st.tools.includes('flintslate') ? check('flint', st.flint, t('ctFlint')) : '',
      check('challenge', st.challenge, t('ctChallenge')),
    ].join('');
    return `<div class="ct-levels">
        ${stepper('needle', st.needle, 0, 4, pick(D.NEEDLES[st.needle].name), `assets/needles/${st.needle}.png`, locked)}
        ${stepper('kit', st.kit, 0, 4, item('crafting-kit'), icon('items', 'crafting-kit'), locked)}
        ${stepper('pouch', st.pouch, 0, 4, item('tool-pouch'), icon('items', 'tool-pouch'), locked)}
        ${st.crest === 'hunter' ? stepper('hunterStage', st.hunterStage, 1, 3, t('ctEvolution'), '', locked) : ''}
        <span class="ct-checks">${situ}</span></div>`;
  }

  /* ── The Tool list, by colour, and the Silk Skills, each on its slot as the Inventory draws it
     (js/app-game.js, cell: the diamond in the slot's colour), filled and lit when worn: a tap puts
     one on or takes it off (Free mode) and describes it below; in a save it's read. Only what you
     have, as the game's own pane lists them: a save's, or Free mode's marks (everything without
     them); what you lack is the Inventory's and Progress's. A colour with none is left out. ── */
  function toolList(st, locked, have) {
    const had = (list, id, on) => on || !have || have[list].includes(id);
    const btn = (kind, x, on) => {
      const name = pick(x.name);
      const act = locked ? 'ctDescribe' : kind === 'skill' ? 'ctSkill' : 'ctTool';
      return `<li><button type="button" class="inv-cell is-slot ct-tool${on ? ' is-on' : ''}" style="--c: var(--slot-${kind})" data-act="${act}" data-kind="${kind === 'skill' ? 'skill' : 'tool'}" data-value="${x.id}"
          ${locked ? '' : `aria-pressed="${on}"`} title="${esc(name)}" aria-label="${esc(name)}"${NT}>
          <img src="${icon(kind === 'skill' ? 'skills' : 'tools', x.id)}" alt="" loading="lazy"></button></li>`;
    };
    const row = (label, cells) => (cells ? `<ul class="inv-grid ct-tools" aria-label="${esc(label)}">${cells}</ul>` : '');
    const rows = COLORS.map((c) => row(t('ct_' + c), D.TOOLS.filter((x) => x.color === c && had('tools', x.id, st.tools.includes(x.id)))
      .map((x) => btn(c, x, st.tools.includes(x.id))).join(''))).join('');
    const skills = row(t('cat_skills'), D.SKILLS.filter((x) => had('skills', x.id, st.skill === x.id)).map((x) => btn('skill', x, st.skill === x.id)).join(''));
    return `<div class="ct-shelf">${rows}${skills}</div>`;
  }

  /* ── The figures ── */
  const MOD_NAME = {
    challenge: () => pick(D.MODIFIERS.find((m) => m.id === 'challenge').name), 'hunter-focus-2': () => t('ctFocus'),
    'hunter-focus-3': () => t('ctFocusFull'), 'beast-fury': () => t('ctFury'),
  };
  const modName = (id) => (MOD_NAME[id] ? MOD_NAME[id]() : TOOL.has(id) ? pick(TOOL.get(id).name)
    : pick((D.CRESTS.find((c) => c.id === id) || { name: { es: id, en: id } }).name));
  const hitsText = (each) => (each.length > 1 ? each.map((x) => num(x)).join(' + ') : '');

  /* The figures as big numbers: the slash (each attack, for the Crests that split them), damage
     per second, the critical, the Needle Strike, masks, silk and what a Bind heals. */
  function band(r, st) {
    const n = r.needle;
    const own = !!D.CRESTS.find((c) => c.id === r.state.crest).attacks;
    const fig = (v, k, title = '') => `<div class="ct-fig2"${title ? ` title="${esc(title)}"` : ''}><b>${v}</b><span>${esc(k)}</span></div>`;
    const mods = r.mods.needle.map((id) => modName(id)).join(' + ');
    // The slash large beside the Needle; for the Crests that split theirs, the others go in the middle.
    const [first, ...rest] = own ? n.attacks : [];
    const slash = own ? { v: first.total, k: t('ctAtt_' + first.id), title: hitsText(first.each) }
      : { v: n.slash, k: t('ctSlash'), title: [n.bracket !== 1 ? t('ctBracket', { base: num(n.base), x: num(n.bracket, 2) }) : '', mods].filter(Boolean).join(' · ') };
    const middle = [
      ...rest.map((a) => fig(num(a.total), t('ctAtt_' + a.id), hitsText(a.each))),
      fig(num(n.speed.dps, 1), t('ctDpsShort'), [t('ctEvery', { s: num(n.speed.interval, 2) }),
        n.speed.brew ? t('ctBrew', { name: pick(TOOL.get('flea-brew').name), d: num(n.speed.brew.dps, 1), s: num(n.speed.brew.interval, 2), l: num(n.speed.brew.lasts) }) : ''].filter(Boolean).join(' · ')),
      n.crit ? fig(num(n.crit.damage), t('ctCrit'), t('ctCritChance', { p: num(n.crit.chance * 100, 1) })) : '',
      r.strike ? fig(num(r.strike.total), t('ctStrike'), hitsText(r.strike.each)) : '',
    ].join('');
    // Hornet as the HUD shows her: her masks drawn, the spool with its silk, what a Bind heals.
    const masks = r.health.masks, silk = r.silk.spool, heals = r.health.bind.heals;
    const hud = `<div class="ct-hud">
        <span class="ct-masks" role="img" aria-label="${esc(num(masks) + ' ' + t('cat_masks'))}">${'<img src="assets/hud/mask.png" alt="">'.repeat(masks)}</span>
        <span class="ct-spool" title="${esc(t('ctCasts', { n: num(r.silk.casts), c: num(r.silk.skill) }))}"><img src="assets/hud/spool.png" alt=""><b>${num(silk)}</b><span class="sr-only">${esc(t('invSilk'))}</span></span>
        <span class="ct-heal" title="${esc(t('ctBindSub', { parts: r.health.bind.parts.map((p) => num(p)).join(' + '), s: num(r.health.bind.seconds, 2) }))}">${esc(t('ctBindHeals', { n: num(heals) }))}</span></div>`;
    return `<div class="ct-band">
        <div class="ct-slash"${slash.title ? ` title="${esc(slash.title)}"` : ''}><img src="assets/needles/${st.needle}.png" alt=""><div><b>${num(slash.v)}</b><span>${esc(slash.k)}</span></div></div>
        <div class="ct-mid">${middle}</div>${hud}</div>`;
  }

  /* The Tool or Silk Skill pointed at, or tapped: its name, the game's words, and its numbers (a
     Tool not worn, as if it were). With nothing pointed at, the first thing worn. */
  let described = null;
  function descHtml(st, r, what) {
    const w = what || (st.tools[0] ? { kind: 'tool', id: st.tools[0] } : st.skill ? { kind: 'skill', id: st.skill } : null);
    if (!w) return `<p class="ct-desc-none">${esc(t('ctPoint'))}</p>`;
    const x = w.kind === 'skill' ? D.SKILLS.find((k) => k.id === w.id) : TOOL.get(w.id);
    let nums = '';
    if (w.kind === 'skill') {
      const k = r.skills.find((s) => s.id === w.id);
      nums = `<b>${num(k.total)}</b>${[hitsText(k.each), t('ctSilkCost', { n: num(x.silk) })].filter(Boolean).map((v) => `<span>${esc(v)}</span>`).join('')}`;
    } else {
      const worn = r.tools.find((k) => k.id === w.id) || E.compute(E.normalize({ ...st, tools: [...st.tools, w.id] })).tools.find((k) => k.id === w.id);
      const a = worn && worn.attacks[0];
      const extra = worn ? [a ? hitsText(a.each) : '', worn.ammo ? t(worn.ammo === 1 ? 'ctAmmo1' : 'ctAmmo', { n: num(worn.ammo) }) : '', worn.load ? t('ctLoad', { n: num(worn.load) }) : '',
        worn.refill ? t('ctRefill', { n: num(worn.refill) }) : ''].filter(Boolean) : [];
      nums = (a ? `<b>${num(a.total)}</b>` : '') + extra.map((v) => `<span>${esc(v)}</span>`).join('');
    }
    return `<h3 class="ct-desc-name is-${w.kind === 'skill' ? 'skill' : x.color}"${NT}>${esc(pick(x.name))}</h3>
      ${x.desc ? `<p class="ct-desc-text">${esc(pick(x.desc))}</p>` : ''}
      ${nums ? `<p class="ct-desc-nums">${nums}</p>` : ''}`;
  }

  /* The figures in one strip, for a narrow window, where the full list goes below the controls:
     the slash, the Silk Skill and the first Tool that hurts (by their icon), masks and silk. It
     sits on the window's bottom edge while you pick (the CSS shows it only there). */
  function summary(r) {
    const n = r.needle;
    const own = !!D.CRESTS.find((c) => c.id === r.state.crest).attacks;
    const cell = (k, v, img = '') => `<div class="ct-sum-cell">${img}<span class="ct-sum-k"${img ? NT : ''}>${k}</span><b>${v}</b></div>`;
    const pic = (list, id, name) => `<img src="${icon(list, id)}" alt="" title="${esc(name)}">`;
    const skill = r.skills.find((s) => s.equipped);
    const tool = r.tools.find((x) => x.attacks.length);
    const cells = [
      cell(esc(own ? t('ctAtt_' + n.attacks[0].id) : t('ctSlash')), num(own ? n.attacks[0].total : n.slash)),
      skill ? (() => { const nm = pick(D.SKILLS.find((x) => x.id === skill.id).name); return cell(esc(nm), num(skill.total), pic('skills', skill.id, nm)); })() : '',
      tool ? (() => { const nm = pick(TOOL.get(tool.id).name); return cell(esc(nm), num(tool.attacks[0].total), pic('tools', tool.id, nm)); })() : '',
      cell(esc(t('cat_masks')), num(r.health.masks)),
      cell(esc(t('invSilk')), num(r.silk.spool)),
    ].filter(Boolean).join('');
    return `<div class="ct-sum" aria-label="${esc(t('ctSummary'))}">${cells}</div>`;
  }

  let shown = null;
  App.screens.tools = (sec) => {
    const { st, locked, have } = current();
    const r = E.compute(st);
    shown = { st, r };
    const share = `<button type="button" class="btn ct-share" data-act="ctShare">${esc(t('ctShare'))}</button>`;
    sec.innerHTML = `<div class="ct">${brackets}${screenHead(esc(t('navTools')), share)}
      ${band(r, st)}${levels(st, locked)}
      <div class="ct-body">
        <div class="ct-side">${crestHtml(st, r, locked, have)}</div>
        <div class="ct-pick">${toolList(st, locked, have)}<div class="ct-desc" aria-live="polite">${descHtml(st, r, described)}</div></div>
      </div>${summary(r)}</div>`;
  };
  // Pointing at a Tool, a Silk Skill or a slot describes it; leaving goes back to the one tapped.
  const paintDesc = (what) => {
    const p = document.querySelector('.screen[data-view="tools"] .ct-desc');
    if (p && shown) p.innerHTML = descHtml(shown.st, shown.r, what);
  };
  const pointed = (e) => e.target.closest && e.target.closest('.ct-tool, .ct-slot.is-full');
  document.addEventListener('pointerover', (e) => {
    const b = pointed(e);
    if (b && App.prefs.view === 'tools') paintDesc({ kind: b.dataset.kind, id: b.dataset.value });
  });
  document.addEventListener('pointerout', (e) => {
    const b = pointed(e);
    if (b && !b.contains(e.relatedTarget) && App.prefs.view === 'tools') paintDesc(described);
  });
  document.addEventListener('focusin', (e) => {
    const b = pointed(e);
    if (b && App.prefs.view === 'tools') paintDesc({ kind: b.dataset.kind, id: b.dataset.value });
  });

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
  /* Start from (the Inventory, Free mode): Hornet as the game starts her (every ladder at the
     bottom, nothing had but the Hunter Crest, so nothing equipped), or everything (the marks
     cleared: Free mode's everything-unlocked sheet). */
  const PRESET = { base: { needle: 0, kit: 0, pouch: 0, masks: 0, spools: 0, hearts: 0 }, max: { needle: 4, kit: 4, pouch: 4, masks: 5, spools: 9, hearts: 3 } };
  const BASE_GAME = { tools: [], crests: ['hunter'], skills: [], arts: [], everbloom: false, pieces: [] };
  // Free mode's build changed from the Inventory (js/app-game.js): a mark taken off takes it off Hornet too.
  App.editFree = change;
  Object.assign(actions, {
    ctPreset(node) {
      const base = node.dataset.value === 'base';
      App.setFreeGame(base ? BASE_GAME : null);
      change((st) => { Object.assign(st, PRESET[node.dataset.value] || {}); });
    },
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
    ctDescribe(node) { described = { kind: node.dataset.kind, id: node.dataset.value }; paintDesc(described); },
    ctSkill(node) {
      described = { kind: 'skill', id: node.dataset.value };
      change((st) => { st.skill = st.skill === node.dataset.value ? null : node.dataset.value; });
    },
    ctTool(node) {
      const id = node.dataset.value;
      described = { kind: 'tool', id };
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
