/* js/app-tools.js — the Crest screen («Blasón», PANE_TOOLS): a build and Hornet's figures for it
   (js/engine.js), laid out as the game's pane (design/18-crest-variants.html, A): the figures as
   big numbers and the levels as − N + steppers on top; the Crest drawn as the game draws it, its
   slots where the game puts them (js/crest-slots.js), filled with the Tools and the Silk Skill
   worn; beside it every Tool by colour and the Silk Skills, and the one pointed at described
   with its numbers.
   In a save, the build is what Hornet wears in the game (js/savefile.js, buildOf) at its levels,
   and it's read, not changed, as the Hollow Knight site does: to try builds there's Free mode,
   where the build is kept in pharloom.build and tried with «Try with» (design/42, 2 A): Everything
   (every Tool, Crest and Skill at hand, its own levels, the top to start with) or What I have
   (your game marked by hand in the Inventory: its levels, the Hunter's evolution, the Vesticrest
   Eva would give, and only what you've marked). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, E = SS.engine, CO = SS.collectibles;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions, load, save, render, toast } = App;
  const C = SS.codec, S = SS.saves;

  const KEY = 'pharloom.build';
  const num = (n, d = 0) => App.NF[d].format(n);
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  // A Tool's picture as the build holds it (Silkshot's variant: js/engine.js toolArt), or a Silk Skill's.
  let held = {};
  const pic = (kind, id) => (kind === 'skill' ? icon('skills', id) : icon('tools', E.toolArt(id, held).art));
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
     link, Free mode's own build goes into the URL; a save's never does. */
  App.adoptBuild = () => {
    const linked = App.build ? C.decode(App.build) : null;
    let store = null;
    try { store = localStorage; } catch (e) { store = null; }
    if (linked) {
      if (store && App.activeSlot() !== S.FREE && S.select(store, S.FREE)) toast(t('ctLinkFree'));
      // Another build's link is shown as it is, not cut down to what you've marked (a reload's own is left as it was).
      if (App.prefs.ctTry === 'mine' && C.encode(linked) !== C.encode(freeBuild())) { App.prefs.ctTry = 'all'; App.savePrefs(); }
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
      const st = freeBuild();
      if (App.prefs.ctTry !== 'mine') return { st, locked: false, have: null };
      // What I have: your game's levels and evolution, the Vesticrest Eva would give it, and what you don't have isn't worn.
      const have = App.freeGame();
      const lockets = have.pieces.filter((i) => CO.PIECES[i][0] === 'memory-locket').length;
      Object.assign(st, { needle: have.needle, kit: have.kit, pouch: have.pouch, masks: have.masks, spools: have.spools, hearts: have.hearts,
        hunterStage: (have.build && have.build.hunterStage) || 1, vest: E.vestOf(have.crests, lockets) });
      st.tools = st.tools.filter((id) => have.tools.includes(id));
      st.skills = st.skills.filter((id) => have.skills.includes(id));
      if (st.crest !== 'hunter' && !have.crests.includes(st.crest)) st.crest = 'hunter';
      return { st: E.normalize(st), locked: false, have };
    }
    const b = g.build || {};
    return { locked: true, have: g, st: E.normalize({ ...b, needle: g.needle, kit: g.kit, pouch: g.pouch, masks: g.masks, spools: g.spools, hearts: g.hearts, cursed: b.cursed,
      silkshot: g.silkshot || undefined, ...moment }) };
  }

  // The build on screen, for the other screens too (Combat, js/app-fight.js).
  App.currentBuild = () => current().st;

  /* ── The Crest and its slots, as the game's pane draws them (js/crest-slots.js; design/43) ──
     Each colour's Tools go into its slots in the game's order, the open ones first and then those
     a Memory Locket opens. Every piece is the game's sprite at its own size: an empty slot shows
     its sign (a red or Silk Skill slot's says the button that fires it: up, alone or down); a full
     one, the ring in its colour with the Tool inside at its own size (about the ring's), over the
     Crest's art as in the game; a slot no Locket has opened yet, the game's small lock ring in grey instead of its sign (in a
     save, as the save says, slot by slot; in Free mode every Locket is used). The Vesticrest's slots float beside the
     Crest between the game's white brackets ("Floating Slots"), and the Crest's name stays under
     the Crest alone. In Free mode a Tool in a slot is taken off with a tap, and each slot keeps
     what it holds (seats, per Crest, while the page is open): taking one off leaves the others
     where they were, as in the game. A save made while cursed wears the Cursed Crest: its art, no
     slots, and a line on what the curse does. */
  const TYPE = ['red', 'blue', 'yellow', 'skill'];
  const BUTTON = ['', '-up', '-down'];
  const slotName = (kind, id) => pick((kind === 'skill' ? D.SKILLS.find((x) => x.id === id) : TOOL.get(id)).name);
  const seats = {};
  // One of the game's sprites (js/crest-slots.js crestSprites), at its size and centre, tinted through a mask.
  const sprite = (name, cls = '', k = 1, at = null) => {
    const [uri, w, h, ax, ay] = SS.crestSprites[name];
    const [x, y] = at || [ax * k, ay * k];
    return `<i class="ct-g${cls}" style="--g:url(${uri});--gw:${w * k};--gh:${h * k};--gx:${x};--gy:${y}"></i>`;
  };
  // A locked slot's ring, scaled down (InventoryToolCrestSlot.UpdateSlotDisplay, Assembly-CSharp 1.0.30000).
  const LOCKED_SCALE = 0.8;
  const sign = (kind, bind) => sprite(kind === 'red' || kind === 'skill' ? kind + BUTTON[bind || 0] : kind);
  function slot(s, id, shut, locked) {
    const at = s.x == null ? '' : ` style="--x:${s.x};--y:${s.y}"`;
    if (!id) {
      // A locked slot is the lock ring alone, where the sign would be: the slot's Locked animation swaps
      // the sign for Tool_slot_lock_ring (centred) and scales it to LOCKED_SCALE (InventoryToolCrestSlot).
      const g = shut ? sprite('lock', '', LOCKED_SCALE) : sign(s.kind, s.bind);
      return `<span class="ct-slot is-${s.kind}${shut ? ' is-locked' : ''}"${at} aria-hidden="true">${g}</span>`;
    }
    const name = slotName(s.kind, id);
    const act = locked ? 'ctDescribe' : s.kind === 'skill' ? 'ctSkill' : 'ctTool';
    const ring = 'ring' + (s.kind === 'red' || s.kind === 'skill' ? BUTTON[s.bind || 0] : '');
    // The worn one is its inventory sprite at its own size and centre, about the ring's (SS.crestIcons, the slot's Item Icon).
    const [w, h, x, y] = s.kind === 'skill' ? SS.crestIcons.skills[id] : SS.crestIcons.tools[E.toolArt(id, held).art];
    return `<button type="button" class="ct-slot is-${s.kind} is-full" data-act="${act}" data-kind="${s.kind === 'skill' ? 'skill' : 'tool'}" data-value="${id}"${at}
        title="${esc(name)}" aria-label="${esc(name)}"${NT}>${sprite(ring)}<img src="${pic(s.kind, id)}" alt="" style="--iw:${w};--ih:${h};--ix:${x};--iy:${y}"></button>`;
  }
  // The Vesticrest's column (SS.crestFloat, the game's Floating Slots): the slots and their brackets, in the Crest's units.
  function floating(items) {
    const F = SS.crestFloat, n = items.length;
    const brackets = F.brackets[n];
    const ys = [...brackets.map(([b, y]) => [y, SS.crestSprites[b][2] * F.k]), ...items.map((_, i) => [F.slots[i], 1.43])];
    const top = Math.max(...ys.map(([y, h]) => y + h / 2)), bottom = Math.min(...ys.map(([y, h]) => y - h / 2));
    return `<div class="ct-float" style="--top:${top};--fh:${top - bottom}">${brackets.map(([b, y]) => `<span class="ct-bracket" style="--y:${y}">${sprite(b, '', F.k)}</span>`).join('')}${
      items.map((html, i) => html.replace('class="ct-slot', `style="--y:${F.slots[i]}" class="ct-slot`)).join('')}</div>`;
  }
  function crestHtml(st, r, locked, have) {
    if (st.cursed) {
      const [w, h, ax, ay] = SS.crestArt.cursed;
      return `<div class="ct-crest"><div class="ct-crest-art" style="--w:${w};--h:${h};--ax:${ax};--ay:${ay}"><img src="assets/crests/cursed.webp" alt=""></div>
        <div class="ct-crest-name"><div><h3${NT}>${esc(t('ctCursed'))}</h3></div></div><p class="ct-curse">${esc(t('ctCurse'))}</p></div>`;
    }
    const crest = D.CRESTS.find((c) => c.id === st.crest);
    const art = st.crest === 'hunter' ? `hunter-${st.hunterStage}` : st.crest;
    const pos = st.crest === 'hunter' ? SS.crestSlots.hunter[st.hunterStage - 1] : SS.crestSlots[st.crest];
    const [w, h, ax, ay] = SS.crestArt[art];
    // Every slot, the Crest's and then the Vesticrest's, in the order the game fills them.
    const spots = [...pos.map((p, i) => ({ kind: TYPE[p[2]], lock: p[3], x: p[0], y: p[1], bind: p[4], i }))
      .sort((a, b) => TYPE.indexOf(a.kind) - TYPE.indexOf(b.kind) || a.lock - b.lock || a.i - b.i),
    ...COLORS.flatMap((c) => Array.from({ length: r.slots[c].extra }, () => ({ kind: c, lock: 0 })))];
    const kindOf = (id) => (st.skills.includes(id) ? 'skill' : TOOL.get(id).color);
    const wear = [...st.tools, ...st.skills];
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
    const html = (s, i) => slot(s, held[i], s.lock && !held[i] && !opened(s), locked);
    const placed = spots.map((s, i) => (s.x == null ? '' : html(s, i))).join('');
    // What doesn't fit the Crest goes on the Vesticrest's slots, its blue over its yellow.
    const vest = spots.map((s, i) => (s.x == null ? html(s, i) : null)).filter(Boolean);
    // ‹ › change the Crest (Free mode), past the ones the Inventory's marks say you don't have.
    const had = D.CRESTS.filter((c) => c.id === 'hunter' || !have || have.crests.includes(c.id));
    const step = (d) => { const i = had.findIndex((c) => c.id === st.crest); return had[(i + d + had.length) % had.length].id; };
    const arrow = (d, label) => (locked || had.length < 2 ? '' : `<button type="button" class="icon-btn ct-arrow" data-act="ctCrest" data-value="${step(d)}" aria-label="${esc(label)}" title="${esc(label)}">${d < 0 ? '‹' : '›'}</button>`);
    return `<div class="ct-crest${vest.length ? ' has-float' : ''}">${vest.length ? floating(vest) : ''}
        <div class="ct-crest-art" style="--w:${w};--h:${h};--ax:${ax};--ay:${ay}"><img src="assets/crests/${art}.webp" alt="">${placed}</div>
        <div class="ct-crest-name">${arrow(-1, t('ctPrev'))}<div><h3${NT}>${esc(pick(crest.name))}</h3>
        ${st.crest === 'hunter' ? `<span class="ct-stage">${esc(t('ctStage', { n: num(st.hunterStage) }))}</span>` : ''}</div>${arrow(1, t('ctNext'))}</div></div>`;
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
     have, as the game's own pane lists them: a save's, or in Free mode everything (on «What I have»,
     the Inventory's marks); what you lack is the Inventory's and Progress's. A colour with none is left out. ── */
  function toolList(st, locked, have) {
    const had = (list, id, on) => on || !have || have[list].includes(id);
    const btn = (kind, x, on) => {
      const name = pick(x.name);
      const act = locked ? 'ctDescribe' : kind === 'skill' ? 'ctSkill' : 'ctTool';
      return `<li><button type="button" class="inv-cell is-slot ct-tool${on ? ' is-on' : ''}" style="--c: var(--slot-${kind})" data-act="${act}" data-kind="${kind === 'skill' ? 'skill' : 'tool'}" data-value="${x.id}"
          ${locked ? '' : `aria-pressed="${on}"`} title="${esc(name)}" aria-label="${esc(name)}"${NT}>
          <img src="${pic(kind, x.id)}" alt="" loading="lazy"></button></li>`;
    };
    const row = (label, cells) => (cells ? `<ul class="inv-grid ct-tools" aria-label="${esc(label)}">${cells}</ul>` : '');
    const rows = COLORS.map((c) => row(t('ct_' + c), D.TOOLS.filter((x) => x.color === c && had('tools', x.id, st.tools.includes(x.id)))
      .map((x) => btn(c, x, st.tools.includes(x.id))).join(''))).join('');
    const skills = row(t('cat_skills'), D.SKILLS.filter((x) => had('skills', x.id, st.skills.includes(x.id))).map((x) => btn('skill', x, st.skills.includes(x.id))).join(''));
    // «What I have» with no Tool marked yet: says so, and where they're marked.
    const none = have && !locked && !have.tools.length ? `<p class="ct-none">${esc(t('ctNoTools'))} <a class="text-btn" href="${App.here(App.hashFor('game'))}" data-act="view" data-value="game">${esc(t('navGame'))}</a></p>` : '';
    return `<div class="ct-shelf">${none}${rows}${skills}</div>`;
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
        ${r.health.bind.fails ? `<span class="ct-heal">${esc(t('ctBindFails'))}</span>`
    : `<span class="ct-heal" title="${esc(t('ctBindSub', { parts: r.health.bind.parts.map((p) => num(p)).join(' + '), s: num(r.health.bind.seconds, 2) }))}">${esc(t('ctBindHeals', { n: num(heals) }))}</span>`}</div>`;
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
    const desc = w.kind === 'skill' ? x.desc : E.toolArt(w.id, st).desc;
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
      ${desc ? `<p class="ct-desc-text">${esc(pick(desc))}</p>` : ''}
      ${nums ? `<p class="ct-desc-nums">${nums}</p>` : ''}`;
  }

  /* The figures in one strip, for a narrow window, where the full list goes below the controls:
     the slash, the Silk Skill and the first Tool that hurts (by their icon), masks and silk. It
     sits on the window's bottom edge while you pick (the CSS shows it only there). */
  function summary(r) {
    const n = r.needle;
    const own = !!D.CRESTS.find((c) => c.id === r.state.crest).attacks;
    const cell = (k, v, img = '') => `<div class="ct-sum-cell">${img}<span class="ct-sum-k"${img ? NT : ''}>${k}</span><b>${v}</b></div>`;
    const img = (kind, id, name) => `<img src="${pic(kind, id)}" alt="" title="${esc(name)}">`;
    const skill = r.skills.find((s) => s.equipped);
    const tool = r.tools.find((x) => x.attacks.length);
    const cells = [
      cell(esc(own ? t('ctAtt_' + n.attacks[0].id) : t('ctSlash')), num(own ? n.attacks[0].total : n.slash)),
      skill ? (() => { const nm = pick(D.SKILLS.find((x) => x.id === skill.id).name); return cell(esc(nm), num(skill.total), img('skill', skill.id, nm)); })() : '',
      tool ? (() => { const nm = pick(TOOL.get(tool.id).name); return cell(esc(nm), num(tool.attacks[0].total), img('tool', tool.id, nm)); })() : '',
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
    held = st;
    // Free mode: «Try with» Everything or What I have (design/42, 2 A).
    const mine = !locked && App.prefs.ctTry === 'mine';
    const tryWith = locked ? '' : `<div class="ct-try"><span class="lbl">${esc(t('ctTry'))}</span><div class="seg sm" role="group" aria-label="${esc(t('ctTry'))}">
        <button type="button" data-act="ctTry" data-value="all" aria-pressed="${!mine}">${esc(t('ctTryAll'))}</button>
        <button type="button" data-act="ctTry" data-value="mine" aria-pressed="${mine}">${esc(t('ctTryMine'))}</button></div></div>`;
    sec.innerHTML = `<div class="ct">${brackets}${screenHead(esc(t('navTools')), tryWith)}
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
  /* Start from (the Inventory, Free mode): a New Game (Hornet as the game starts her: every ladder
     at the bottom, the Hunter Crest unevolved and nothing else), or everything marked, every
     ladder at the top (a game at 100%). Your game's marks only: the build tried here is apart. */
  Object.assign(actions, {
    ctPreset(node) {
      App.setFreeGame(node.dataset.value === 'base' ? App.newGame() : App.fullGame());
      render();
    },
    ctTry(node) {
      App.prefs.ctTry = node.dataset.value === 'mine' ? 'mine' : 'all';
      App.savePrefs();
      render();
    },
    // Another Crest keeps the Silk Skills its slots have room for (js/engine.js normalize).
    ctCrest(node) { change((st) => { st.crest = node.dataset.value; }); },
    ctLevel(node) {
      const key = node.dataset.key, v = Number(node.dataset.value);
      // On «What I have» the levels and the evolution are your game's: they go into the marks.
      if (!App.game() && App.prefs.ctTry === 'mine' && App.freeMark) {
        if (key === 'hunterStage') App.freeMark((m) => { m.build = { ...(m.build || {}), hunterStage: Math.max(1, Math.min(3, v)) }; });
        else if (S.LADDER_TOP[key] != null) App.freeMark((m) => { m[key] = Math.max(0, Math.min(S.LADDER_TOP[key], v)); });
        return;
      }
      change((st) => { st[key] = v; });
    },
    ctToggle(node) {
      const k = node.dataset.value;
      if (App.game()) { moment[k] = !moment[k]; render(); return; }
      change((st) => { st[k] = !st[k]; });
    },
    ctDescribe(node) { described = { kind: node.dataset.kind, id: node.dataset.value }; paintDesc(described); },
    ctSkill(node) {
      described = { kind: 'skill', id: node.dataset.value };
      // One per Skill slot (the Shaman's three): a tap takes it off, or puts it on; with every slot
      // taken, it replaces the last one put on (a Crest with one slot: the one there).
      const id = node.dataset.value;
      change((st) => {
        const room = D.CRESTS.find((c) => c.id === st.crest).slots.skill;
        if (st.skills.includes(id)) st.skills = st.skills.filter((x) => x !== id);
        else st.skills = [...(st.skills.length < room ? st.skills : st.skills.slice(0, room - 1)), id];
      });
    },
    ctTool(node) {
      const id = node.dataset.value;
      described = { kind: 'tool', id };
      change((st) => {
        if (st.tools.includes(id)) { st.tools = st.tools.filter((x) => x !== id); return; }
        // Room in its colour: the Crest's slots, open and locked, and the Vesticrest's.
        const c = TOOL.get(id).color, s = E.compute(current().st).slots[c];
        const room = s.open + s.locked + s.extra;
        if (s.used >= room) { toast(t('ctFull', { c: t('ct_' + c) })); return; }
        st.tools = [...st.tools, id];
      });
    },
  });
})();
