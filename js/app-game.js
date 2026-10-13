/* js/app-game.js — the Inventory, the sibling's sheet in Silksong's pieces (design/03-redesign.md,
   step 4): on the left what Hornet is (the five Needles, the masks, the silk as beads on a
   thread, the Silk Hearts, the Crafting Kit and the Tool Pouch, the Silk Skills with what they
   deal and the abilities), on the right what she carries (the Tools on their slots by colour, the
   Crests, the items). In Free mode all of it is set here: your game marked by hand, from a New
   Game (js/app-saves.js, App.freeGame; design/42-free-mode-start-variants.html, 1 A): the left
   side its levels, a tap on the right a thing had or not. Progress counts it, and the Crest
   screen tries it on «What I have». In a save it shows what the game saved,
   and what you don't have yet is a dimmed silhouette. A tap opens the game's text under its
   shelf. Above the Items, the purse (Rosaries and Shell Shards with the strings, bundles and
   shards that break into them, design/29-inventory-variants.html, A); the Relics and the
   Mementos on shelves below. The icons are the wiki's
   (tools/fetch-icons.js, npm run icons). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles, SP = SS.spots;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  // The Old Hearts and melodies by their save flag → their icon (assets/icons/pieces/).
  const PIECE_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter',
    CollectedHeartClover: 'heart-clover', HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian',
    HasMelodyConductor: 'melody-conductor' };

  /* The Relics, one cell per kind (js/spots.js EXTRAS holds each one found), and the Mementos by the
     picture each has (assets/icons/extras/, the Map's too): the item ids of js/data.js. */
  const RELICS = ['bone-scroll', 'weaver-effigy', 'choral-commandment', 'rune-harp', 'psalm-cylinder', 'arcane-egg'];
  const MEMENTO_ID = { 'Grey Memento': 'grey-memento', 'Memento Garmond': 'heros-memento', 'Memento Surface': 'surface-memento',
    'Hunter Memento': 'hunters-memento', 'Crowman Memento': 'craw-memento', 'Sprintmaster Memento': 'sprintmaster-memento', 'Memento Seth': 'guardians-memento' };
  // The EXTRAS entries of each: indices into SP.EXTRAS (a memento is named by its check; the Old Hearts' deposit has no name of its own).
  const extrasOf = (kind) => SP.EXTRAS.map((x, i) => (x[0] === kind ? i : -1)).filter((i) => i >= 0);
  const MEMENTOS = SP.EXTRAS.map((x, i) => (x[0] === 'memento' && MEMENTO_ID[x[2][1]] ? i : -1)).filter((i) => i >= 0);
  const RELIC_AT = SP.EXTRAS.map((x, i) => (RELICS.includes(x[0]) ? i : -1)).filter((i) => i >= 0);
  // Rosaries have no cap in the game's files; the typed field stops at five digits, as the screen can hold.
  const MAX_ROSARIES = 99999;
  const shardCap = (pouch) => D.HORNET.shells.base + D.HORNET.shells.perPouch * pouch;

  // Free mode's «Everything maxed»: every thing marked, at the top of every ladder, the Hunter fully evolved (nothing loose or carried: a full game has spent it).
  function fullGame() {
    return { tools: D.TOOLS.map((x) => x.id), crests: D.CRESTS.map((x) => x.id), skills: D.SKILLS.map((x) => x.id),
      arts: D.ARTS.map((x) => x.id), masks: 5, spools: 9, hearts: 3, needle: 4, kit: 4, pouch: 4, everbloom: true,
      pieces: CO.PIECES.map((p, i) => i), purse: {}, rosaries: 0, shards: 0, farsight: true, hasJournal: true,
      extras: [...RELIC_AT, ...MEMENTOS], journal: {}, act: 3, build: { hunterStage: 3 } };
  }
  App.fullGame = fullGame;

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
    const it = (id, got, count, n) => { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got, count, n }); };
    it('crafting-kit', g.kit > 0, `${num(g.kit)}/4`);
    it('tool-pouch', g.pouch > 0, `${num(g.pouch)}/4`);
    const shards = found('mask-shard') - 4 * g.masks, frags = found('spool-fragment') - 2 * g.spools;
    it('mask-shard', shards > 0, `${num(Math.max(0, shards))}/4`, [Math.max(0, Math.min(3, shards)), 3]);
    it('spool-fragment', frags > 0, `${num(Math.max(0, frags))}/2`, [Math.max(0, Math.min(1, frags)), 1]);
    for (const id of ['memory-locket', 'craftmetal', 'pale-oil']) it(id, found(id) > 0, `${num(found(id))}/${num(total(id))}`, [found(id), total(id)]);
    it('everbloom', g.everbloom);
    it('farsight', g.farsight);
    it('hunters-journal', g.hasJournal);
    // The purse: the two currencies (their picture opens the text), and what breaks into them, held counts.
    for (const id of ['rosaries', 'shell-shards']) { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got: true, shelf: 'currency' }); }
    for (const [id, , cur, worth, max] of CO.PURSE) {
      const x = item(id), v = Math.min(max, g.purse[id] || 0);
      out.push({ list: 'items', id, name: x.name, desc: x.desc, got: v > 0, keep: true, count: `${num(v)}/${num(max)}`, n: [v, max], shelf: 'purse', cur, worth });
    }
    // The Relics by kind (how many of the kind), the Mementos one by one.
    for (const k of RELICS) {
      const at = extrasOf(k), v = at.filter((i) => g.extras.includes(i)).length, x = item(k);
      out.push({ list: 'extras', id: k, name: x.name, desc: x.desc, got: v > 0, count: `${num(v)}/${num(at.length)}`, n: [v, at.length], shelf: 'relics', kind: k });
    }
    for (const i of MEMENTOS) { const id = MEMENTO_ID[SP.EXTRAS[i][2][1]], x = item(id); out.push({ list: 'extras', id, name: x.name, desc: x.desc, got: g.extras.includes(i), shelf: 'mementos', extra: i }); }
    // The Silk Hearts, the Old Hearts and the melodies, each with its own picture.
    out.push({ list: 'pieces', id: 'silk-heart', name: { es: t('kind_silkHeart'), en: t('kind_silkHeart') }, got: g.hearts > 0, count: `${num(g.hearts)}/3` });
    CO.PIECES.forEach((p, i) => {
      if (p[0] !== 'old-heart' && p[0] !== 'melody') return;
      out.push({ list: 'pieces', id: PIECE_ICON[p[2][1]], name: p[4], desc: p[5], got: g.pieces.includes(i), piece: i });
    });
    out.push({ list: 'pieces', id: 'flea', name: { es: t('kind_fleas'), en: t('kind_fleas') }, got: found('flea') > 0, count: `${num(found('flea'))}/${num(total('flea'))}`, n: [found('flea'), total('flea')] });
    return out;
  }

  // The thing whose description is open, under its own shelf (a click; a second one closes it).
  let picked = null;
  const keyOf = (x) => x.list + '/' + x.id;

  /* A cell of the grids: the Tools on their slot, the game's diamond in the slot's colour (the
     Crest screen's own drawing, design/02-silksong.md §3), dashed in the locked slot's grey when
     you lack it; the rest plain. One fixed square, so every row lines up. */
  function cell(x) {
    const cls = `inv-cell${x.got ? '' : ' is-missing'}${x.color ? ' is-slot' : ''}${picked === keyOf(x) ? ' is-picked' : ''}`;
    const label = pick(x.name) + (x.count ? ' ' + x.count : '') + (x.got ? '' : ' · ' + t('invMissing'));
    const mark = marking && markable(x);
    return `<li><button type="button" class="${cls}"${x.color ? ` style="--c: var(--slot-${x.color})"` : ''} data-act="${mark ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}"
      ${mark ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`} aria-label="${esc(label)}" title="${esc(pick(x.name))}"${NT}>
        <img src="${icon(x.list, x.id)}" alt="" loading="lazy"></button>${marking && x.n ? stepper(x) : x.count ? `<span class="inv-count">${esc(x.count)}</span>` : ''}</li>`;
  }
  /* Free mode marks (design/03-redesign.md, step 4): a tap on a Tool, Crest, Silk Skill,
     ability, the Everbloom, an Old Heart or a melody marks it had or not and opens its text; the
     counted ones (loose shards and fragments, lockets, Craftmetal, Pale Oil, fleas, what's in the
     purse, the Relics of each kind) go by − N +, and the two currencies are typed.
     The Hunter Crest is always had: Hornet starts with it. */
  let marking = false;
  const markable = (x) => !x.n && x.id !== 'silk-heart' && !(x.list === 'crests' && x.id === 'hunter')
    && (x.list !== 'items' || ['everbloom', 'farsight', 'hunters-journal'].includes(x.id));
  const stepper = (x) => {
    const [v, max] = x.n, what = pick(x.name);
    return `<span class="inv-step"><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v - 1}" ${v > 0 ? '' : 'disabled'} aria-label="${esc(t('invLess', { what }))}" title="${esc(t('invLess', { what }))}">−</button>
      <b>${num(v)}</b><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v + 1}" ${v < max ? '' : 'disabled'} aria-label="${esc(t('invMore', { what }))}" title="${esc(t('invMore', { what }))}">+</button></span>`;
  };
  // What's open under a shelf: the picture, the name and the game's text.
  function open(list) {
    const x = shown.find((y) => keyOf(y) === picked);
    if (!x || !list.includes(x)) return '';
    return `<div class="inv-open" aria-live="polite"><img class="${x.got ? '' : 'is-missing'}" src="${icon(x.list, x.id)}" alt="">
      <h4 class="inv-name"${NT}>${esc(pick(x.name))}</h4>
      ${x.got ? '' : `<p class="inv-not">${esc(t('invMissing'))}</p>`}
      ${x.desc ? `<p class="inv-desc">${esc(pick(x.desc))}</p>` : ''}</div>`;
  }
  const count = (c) => (c ? ` <span class="inv-n">${num(c.got)}<i>/${num(c.max)}</i></span>` : '');
  const head = (title, c, list) => `<h3 class="ct-h inv-h">${esc(title)}${count(c)}${marking && list ? `<span class="inv-all">
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="1">${esc(t('invAll'))}</button><span aria-hidden="true">·</span>
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="0">${esc(t('invNone'))}</button></span>` : ''}</h3>`;

  /* ── What Hornet is, the sibling's way (hallownest-calculator's Inventory, design/03-redesign.md
     step 4): the Needle as the focal point, the body as rows of the game's own pieces, the Kit
     and the Pouch as pips. In Free mode each one sets your game's level (invLevel, into the
     marks: the Crest screen's own build is apart); in a save they show what the game saved, at
     full light but still. ── */
  let before = null;   // the last build drawn: what changed since lights up
  const lit = (b, k, on) => (on && before && before[k] !== b[k] ? ' is-lit' : '');
  function needles(b, still) {
    const row = D.NEEDLES.map((n, i) => `<button type="button" class="inv-np${b.needle === i ? ' is-on' : ''}${lit(b, 'needle', b.needle === i)}"
        data-act="invLevel" data-key="needle" data-value="${i}" aria-pressed="${b.needle === i}"${still} title="${esc(pick(n.name))}" aria-label="${esc(pick(n.name) + ', ' + n.damage)}"${NT}>
        <img src="${ART.needle(i)}" alt="" width="80" height="600"><b>${num(n.damage)}</b></button>`).join('');
    return `<section class="inv-sec">${head(t('invNeedle'))}<div class="inv-needles" role="group" aria-label="${esc(t('invNeedle'))}">${row}</div>
      <p class="inv-caption"${NT}>${esc(pick(D.NEEDLES[b.needle].name))}</p></section>`;
  }
  /* A row of pieces: the first `base` always there, then one per upgrade; a tap on one sets the
     count to it (on the last one lit, one less). */
  function pieces(b, key, name, base, max, piece, still) {
    const v = base + b[key];
    const btns = Array.from({ length: base + max }, (_, i) => {
      const fixed = i < base, on = i < v, n = i + 1 - base;
      const to = n === b[key] ? n - 1 : n;
      return `<button type="button" class="inv-pc${on ? ' is-on' : ''}${fixed ? ' is-base' : ''}${lit(b, key, i === v - 1)}"${fixed ? ' disabled' : ` data-act="invLevel" data-key="${key}" data-value="${to}"${still}`}
        aria-label="${esc(name + ' ' + num(i + 1))}" aria-pressed="${on}">${piece}</button>`;
    }).join('');
    return `<div class="inv-field"><div class="inv-frow"><span><span class="inv-fname"${NT}>${esc(name)}</span><span class="inv-fnote">${esc(t('invFromTo', { a: num(base), b: num(base + max) }))}</span></span>
      <span class="inv-fnum">${num(v)}<i>/${num(base + max)}</i></span></div><div class="inv-pieces is-${key}" role="group" aria-label="${esc(name)}">${btns}</div></div>`;
  }
  function level(b, key, id, still) {
    const it = D.ITEMS.find((x) => x.id === id);
    const opts = [0, 1, 2, 3, 4].map((n) => `<button type="button" data-act="invLevel" data-key="${key}" data-value="${n}" aria-pressed="${b[key] === n}"${still}>${num(n)}</button>`).join('');
    return `<div class="inv-level"><img class="${b[key] ? '' : 'is-missing'}" src="${icon('items', id)}" alt=""><span class="inv-fname"${NT}>${esc(pick(it.name))}</span>
      <div class="seg sm" role="group" aria-label="${esc(pick(it.name))}">${opts}</div></div>`;
  }
  function hornet(b, still) {
    return `<section class="inv-sec">${head(t('ctBody'))}
      ${pieces(b, 'masks', t('cat_masks'), 5, 5, `<img src="${ART.mask}" alt="">`, still)}
      ${pieces(b, 'spools', t('invSilk'), 9, 9, '<i class="inv-bead"></i>', still)}
      ${pieces(b, 'hearts', t('cat_hearts'), 0, 3, `<img src="${icon('pieces', 'silk-heart')}" alt="">`, still)}
      <div class="inv-levels">${level(b, 'kit', 'crafting-kit', still)}${level(b, 'pouch', 'tool-pouch', still)}</div></section>`;
  }
  /* Plates: the Silk Skills with what each deals at this build (js/engine.js), the abilities with
     Needle Strike's; the rest say whether they're learnt. A tap opens the game's text. */
  function plates(list, x2v) {
    return `<ul class="inv-plates">${list.map((x) => {
      const v = x.got ? x2v(x) : null;
      return `<li><button type="button" class="inv-plate${x.got ? '' : ' is-missing'}${picked === keyOf(x) ? ' is-picked' : ''}" data-act="${marking ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}" ${marking ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`}${NT}>
        <span class="inv-plate-art"><img src="${icon(x.list, x.id)}" alt="" loading="lazy"></span><span class="inv-plate-name">${esc(pick(x.name))}</span>
        <span class="inv-plate-v${v == null ? ' is-none' : ''}">${v == null ? esc(t(x.got ? 'invLearnt' : 'invNotLearnt')) : num(v)}</span></button></li>`;
    }).join('')}</ul>`;
  }

  /* The purse (design/29-inventory-variants.html, A): a figure for each currency with its picture
     (a tap reads the game's text), and under it what breaks into it, counted, and the sum if you
     broke it all. Rosaries have no cap; the Shell Shards' is the Tool Pouch's, 400 to 800, with a
     bar of how full. In Free mode the figures are typed (Enter or leaving the field: js/app-game.js
     invMoney, clamped to 0 up to the cap). */
  function purse(g, all, money) {
    const cap = shardCap(g.pouch);
    const of = (cur) => all.filter((x) => x.shelf === 'purse' && x.cur === cur);
    const broken = (cur) => of(cur).reduce((a, x) => a + x.n[0] * x.worth, 0);
    const field = (key, v, max, what) => `<input class="inv-in" type="text" inputmode="numeric" autocomplete="off" data-change="invMoney" data-key="${key}" value="${v}" aria-label="${esc(t('invFieldMax', { what, n: num(max) }))}">`;
    const one = (id, key, v, max) => {
      const x = all.find((y) => y.id === id), name = pick(x.name), ros = id === 'rosaries';
      const fig = marking ? field(key, v, max, name) : esc(num(v));
      const list = of(ros ? 'rosaries' : 'shards'), sum = broken(ros ? 'rosaries' : 'shards');
      return `<div class="inv-cur"><div class="inv-fig">
        <button type="button" class="inv-fig-art${picked === keyOf(x) ? ' is-picked' : ''}" data-act="invPick" data-key="${esc(keyOf(x))}" aria-expanded="${picked === keyOf(x)}" aria-label="${esc(name)}" title="${esc(name)}"${NT}><img src="${icon(x.list, x.id)}" alt=""></button>
        <span class="inv-fig-name"${NT}>${esc(name)}</span>
        <span class="inv-fig-num">${fig}${ros ? '' : `<i> / ${esc(num(cap))}</i>`}</span>
        ${ros ? '' : `<span class="inv-bar" style="--f:${(Math.min(v, cap) / cap * 100).toFixed(1)}%"></span>`}</div>
        <ul class="inv-grid is-items">${list.map(cell).join('')}</ul>
        ${sum > 0 ? `<p class="inv-broken">${esc(t('invBroken', { n: num(sum) }))}</p>` : ''}</div>`;
    };
    return `<div class="inv-two">${one('rosaries', 'rosaries', money.rosaries, MAX_ROSARIES)}${one('shell-shards', 'shards', Math.min(money.shards, cap), cap)}</div>`;
  }

  let shown = [];   // what the last render drew, for the descriptions
  App.screens.game = (sec) => {
    const own = App.game();
    // Free mode: your game marked by hand (a New Game until you mark), its levels with it; the
    // figures take the Crest screen's build for what's worn, but only what you have of it.
    const g = own || App.freeGame();
    const b0 = App.currentBuild();
    const b = own ? b0 : SS.engine.normalize({ ...b0, needle: g.needle, kit: g.kit, pouch: g.pouch, masks: g.masks, spools: g.spools, hearts: g.hearts,
      tools: b0.tools.filter((id) => g.tools.includes(id)), skill: g.skills.includes(b0.skill) ? b0.skill : null,
      crest: g.crests.includes(b0.crest) ? b0.crest : 'hunter', hunterStage: (g.build && g.build.hunterStage) || 1 });
    marking = !own;
    const all = shown = things(g);
    const by = (list) => all.filter((x) => x.list === list);
    const still = own ? ' disabled' : '';
    const cats = Object.fromEntries(SS.completion.count(g).categories.map((c) => [c.id, c]));
    const r = SS.engine.compute(b);
    const skillV = (x) => { const s = r.skills.find((y) => y.id === x.id); return s ? s.total : null; };
    const artV = (x) => (x.id === 'needle-strike' && r.strike ? r.strike.total : null);
    const tools = ['red', 'blue', 'yellow'].map((c) => {
      const l = by('tools').filter((x) => x.color === c);
      return `<p class="inv-sub" style="--c: var(--slot-${c})">${esc(t('ct_' + c))} <b>${num(l.filter((x) => x.got).length)}</b></p><ul class="inv-grid">${l.map(cell).join('')}</ul>`;
    }).join('');
    const items = [...by('items').filter((x) => !x.shelf && x.id !== 'crafting-kit' && x.id !== 'tool-pouch'), ...by('pieces').filter((x) => x.id !== 'silk-heart')];
    const relics = all.filter((x) => x.shelf === 'relics'), mementos = all.filter((x) => x.shelf === 'mementos');
    const money = own ? { rosaries: (App.gameMeta() || {}).rosaries || 0, shards: (App.gameMeta() || {}).shards || 0 } : g;
    const counts = { relics: { got: relics.reduce((a, x) => a + x.n[0], 0), max: relics.reduce((a, x) => a + x.n[1], 0) },
      mementos: { got: mementos.filter((x) => x.got).length, max: mementos.length } };
    const purseShelf = [...all.filter((x) => x.shelf === 'currency'), ...all.filter((x) => x.shelf === 'purse')];
    const start = own ? ''
      : `<p class="inv-lead">${esc(t('invFreeLead'))}</p><p class="inv-presets"><span class="lbl">${esc(t('invStart'))}</span><button type="button" class="text-btn" data-act="ctPreset" data-value="base">${esc(t('invBase'))}</button>
          <span class="lbl" aria-hidden="true">·</span><button type="button" class="text-btn" data-act="ctPreset" data-value="max">${esc(t('invMax'))}</button></p>`;
    sec.innerHTML = `<div class="inv">${brackets}${screenHead(esc(t('navGame')), start)}${own ? '' : App.freeNoteHtml()}
      <div class="inv-body">
        <div class="inv-col">
          ${needles(b, still)}
          ${hornet(b, still)}
          <section class="inv-sec">${head(t('cat_skills'), cats.skills, 'skills')}${plates(by('skills'), skillV)}${open(by('skills'))}</section>
          <section class="inv-sec">${head(t('cat_arts'), cats.arts, 'arts')}${plates(by('arts'), artV)}${open(by('arts'))}</section>
        </div>
        <div class="inv-col">
          <section class="inv-sec is-tools">${head(t('cat_tools'), cats.tools, 'tools')}${tools}${open(by('tools'))}</section>
          <section class="inv-sec">${head(t('cat_crests'), cats.crests, 'crests')}<ul class="inv-grid">${by('crests').map(cell).join('')}</ul>${open(by('crests'))}</section>
          <section class="inv-sec">${head(t('invPurse'))}${purse(g, all, money)}${open(purseShelf)}</section>
          <section class="inv-sec">${head(t('invItems'), null, 'items')}<ul class="inv-grid is-items">${items.map(cell).join('')}</ul>${open(items)}</section>
          <section class="inv-sec">${head(t('invRelics'), counts.relics, 'relics')}<ul class="inv-grid is-items">${relics.map(cell).join('')}</ul>${open(relics)}</section>
          <section class="inv-sec">${head(t('invMementos'), counts.mementos, 'mementos')}<ul class="inv-grid">${mementos.map(cell).join('')}</ul>${open(mementos)}</section>
        </div>
      </div>
    </div>`;
    before = { ...b };
  };

  /* Free mode's marks, changed: from what's marked (a New Game the first time), its levels kept.
     The Crest screen's build is apart (it tries everything); on «What I have» it filters itself. */
  function mark(f) {
    const cur = App.freeGame();
    if (!cur) return;
    const m = { ...cur, tools: [...cur.tools], crests: [...cur.crests], skills: [...cur.skills], arts: [...cur.arts], everbloom: !!cur.everbloom, pieces: [...cur.pieces],
      purse: { ...cur.purse }, rosaries: cur.rosaries || 0, shards: cur.shards || 0, farsight: !!cur.farsight, hasJournal: !!cur.hasJournal, extras: [...cur.extras] };
    f(m);
    if (!m.crests.includes('hunter')) m.crests.unshift('hunter');
    App.setFreeGame(m);
    App.render();
  }
  App.freeMark = mark;   // Progress marks from its lists too (js/app-progress.js)
  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  // The pieces of one kind, the first n in the list's order (and the rest of that kind off).
  const KIND = { 'mask-shard': 'mask-shard', 'spool-fragment': 'spool-fragment', 'memory-locket': 'memory-locket', craftmetal: 'craftmetal', 'pale-oil': 'pale-oil', flea: 'flea' };
  // The relics of one kind: the first n of them in the list's order (and the rest of that kind off).
  function setRelics(m, kind, n) {
    const at = extrasOf(kind);
    m.extras = [...m.extras.filter((i) => !at.includes(i)), ...at.slice(0, Math.max(0, n))];
  }
  function setKind(m, kind, n) {
    const all = CO.PIECES.map((p, i) => (p[0] === kind ? i : -1)).filter((i) => i >= 0);
    m.pieces = [...m.pieces.filter((i) => CO.PIECES[i][0] !== kind), ...all.slice(0, Math.max(0, n))];
  }
  // The typed fields (data-change) don't click: they commit when the browser says the value changed.
  document.addEventListener('change', (e) => {
    const f = e.target.closest && e.target.closest('[data-change="invMoney"]');
    if (f) actions.invMoney(f);
  });
  Object.assign(actions, {
    invOwn(node) {
      const x = shown.find((y) => keyOf(y) === node.dataset.key);
      if (!x) return;
      picked = keyOf(x);
      mark((m) => {
        if (['tools', 'crests', 'skills', 'arts'].includes(x.list)) m[x.list] = toggle(m[x.list], x.id);
        else if (x.id === 'everbloom') m.everbloom = !m.everbloom;
        else if (x.id === 'farsight') m.farsight = !m.farsight;
        else if (x.id === 'hunters-journal') m.hasJournal = !m.hasJournal;
        else if (x.extra != null) m.extras = toggle(m.extras, x.extra);
        else if (x.piece != null) m.pieces = toggle(m.pieces, x.piece);
      });
    },
    invAll(node) {
      const on = node.dataset.value === '1', list = node.dataset.list;
      mark((m) => {
        if (list === 'items') {
          m.everbloom = on;
          m.farsight = on;
          m.hasJournal = on;
          m.pieces = on ? CO.PIECES.map((p, i) => i) : [];
          return;
        }
        if (list === 'relics') { m.extras = on ? [...new Set([...m.extras, ...RELIC_AT])] : m.extras.filter((i) => !RELIC_AT.includes(i)); return; }
        if (list === 'mementos') { m.extras = on ? [...new Set([...m.extras, ...MEMENTOS])] : m.extras.filter((i) => !MEMENTOS.includes(i)); return; }
        const ids = { tools: D.TOOLS, crests: D.CRESTS, skills: D.SKILLS, arts: D.ARTS }[list].map((y) => y.id);
        m[list] = on ? ids : [];
      });
    },
    invCount(node) {
      const x = shown.find((y) => keyOf(y) === node.dataset.key);
      if (!x || !x.n) return;
      const b = App.freeGame(), v = Math.max(0, Math.min(x.n[1], Number(node.dataset.value)));
      if (x.shelf === 'purse') { mark((m) => { m.purse[x.id] = v; }); return; }
      if (x.shelf === 'relics') { mark((m) => setRelics(m, x.kind, v)); return; }
      // The loose shards and fragments come after those already in whole masks and spools.
      const over = x.id === 'mask-shard' ? 4 * b.masks : x.id === 'spool-fragment' ? 2 * b.spools : 0;
      mark((m) => setKind(m, KIND[x.id], over + v));
    },
    /* A typed figure of the purse, taken when the field is left or Enter is pressed: whole
       numbers only, 0 up to the cap (the Shell Shards' is the Pouch's). */
    invMoney(node) {
      const key = node.dataset.key;
      const raw = Number(String(node.value).replace(/\D/g, ''));
      const max = key === 'shards' ? shardCap(App.freeGame().pouch) : MAX_ROSARIES;
      const v = Math.max(0, Math.min(max, Number.isFinite(raw) ? Math.round(raw) : 0));
      mark((m) => { m[key] = v; });
    },
    // A level of your game (Free mode): the Needle, masks, silk, Silk Hearts, the Kit, the Pouch.
    invLevel(node) {
      const key = node.dataset.key, top = SS.saves.LADDER_TOP[key];
      if (App.game() || top == null) return;
      mark((m) => { m[key] = Math.max(0, Math.min(top, Number(node.dataset.value) || 0)); });
    },
    invPick(node) {
      picked = node.dataset.key === picked ? null : node.dataset.key;
      App.render();
      const b = document.querySelector(`[data-act="invPick"][data-key="${CSS.escape(node.dataset.key)}"]`);
      if (b) b.focus({ preventScroll: true });
    },
  });
})();
