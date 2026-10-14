/* js/app-game.js — the Inventory, the sibling's sheet in Silksong's pieces (design/03-redesign.md,
   step 4; its third round, design/43, A in all six, puts each thing beside what it feeds). On the
   left what Hornet is: the five Needles with the Pale Oil, the masks and the silk (beads on a
   thread) each with its loose shards or fragments under it, the Silk Hearts, the Silk Skills with
   what they deal and the abilities. On the right her equipment: the Crests with the Memory
   Lockets that open their slots, then the Crafting Kit and the Tool Pouch with the Craftmetal, and
   the Tools on their slots by colour, one slot per point of the 100% (a Tool and its upgrade
   share one, the two a wish lends apart). Under both, across the width, what she carries: the
   purse (Rosaries and Shell Shards with the strings, bundles and shards that break into them,
   design/29-inventory-variants.html, A), the items, the Relics and the Mementos, each a plate
   with its name. Every shelf's head counts n/max and its rule lights up to it.
   In Free mode all of it is set here: your game marked by hand, from a New Game
   (js/app-saves.js, App.freeGame; design/42-free-mode-start-variants.html, 1 A): the levels, a
   tap on a thing had or not, − N + for what comes in numbers. Progress counts it, and the Crest
   screen tries it on «What I have». In a save it shows what the game saved, and what you don't
   have yet is faint. A tap opens the game's text under its shelf. The icons are the wiki's
   (tools/fetch-icons.js, npm run icons). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles, SP = SS.spots;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions } = App;

  const num = (n) => App.NF[0].format(n);
  // A Silk Skill as the game lists it (the Crest pane's solid white sprite, assets/icons/skills-inv), not the
  // wiki's line art of the prompt when you get one.
  const icon = (list, id) => `assets/icons/${list === 'skills' ? 'skills-inv' : list}/${id}.webp`;
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
  /* The Tools by the 100%'s points (js/collectibles.js COUNTED): a Tool and its upgrade, or the
     Steel Soul twin, are one point and one slot; the two a wish lends and takes back (lost) are
     no point, drawn apart. */
  const GROUP = new Map();
  CO.COUNTED.forEach((ids) => ids.forEach((id) => GROUP.set(id, ids)));
  const LENT = D.TOOLS.filter((x) => x.lost).map((x) => x.id);
  // Rosaries have no cap in the game's files; the typed field stops at five digits, as the screen can hold.
  const MAX_ROSARIES = 99999;
  // What only a Steel Soul game holds (the wiki's Growstone page): left out of a Classic save's purse.
  const STEEL_ONLY = ['growstone'];
  /* The Hunter Crest's evolution: Eva's two rewards (js/spots.js EXTRAS, the save's Hunter_v2 and
     _v3), or the stage worn; Free mode keeps it in its marks. Evolved, the game describes the Crest
     with CREST_HUNTER_UPGRADED_DESC (js/data.js CRESTS evolved). */
  const EVA_AT = (r) => SP.EXTRAS.findIndex((x) => x[0] === 'eva' && x[5] && x[5].reward === r);
  const EVOLVED = [EVA_AT('hunter-2'), EVA_AT('hunter-3')].filter((i) => i >= 0);
  const hunterStage = (g) => Math.max((g.build && g.build.hunterStage) || 1, 1 + EVOLVED.filter((i) => g.extras.includes(i)).length);
  const shardCap = (pouch) => D.HORNET.shells.base + D.HORNET.shells.perPouch * pouch;

  // Free mode's «Everything maxed»: every thing marked, at the top of every ladder, the Hunter fully evolved (nothing loose or carried: a full game has spent it).
  function fullGame() {
    return { tools: D.TOOLS.map((x) => x.id), crests: D.CRESTS.map((x) => x.id), skills: D.SKILLS.map((x) => x.id),
      arts: D.ARTS.map((x) => x.id), masks: 5, spools: 9, hearts: 3, needle: 4, kit: 4, pouch: 4, everbloom: true,
      pieces: CO.PIECES.map((p, i) => i), purse: {}, rosaries: 0, shards: 0, farsight: true, hasJournal: true,
      extras: [...RELIC_AT, ...MEMENTOS], journal: {}, act: 3, build: { hunterStage: 3 } };
  }
  App.fullGame = fullGame;

  /* Every thing the pane can show, by a key "list/id": { list, id, name, desc, got, count, color }.
     steel: a Steel Soul game, or Free mode (which has no mode): what only Steel Soul holds shows. */
  function things(g, steel = true) {
    const found = (kind) => g.pieces.filter((i) => CO.PIECES[i][0] === kind).length;
    const total = (kind) => CO.PIECES.filter((p) => p[0] === kind).length;
    const item = (id) => D.ITEMS.find((x) => x.id === id);
    const out = [];
    // A Tool as the game holds it: Silkshot's picture and words are the variant's (js/engine.js toolArt).
    for (const x of D.TOOLS) { const a = SS.engine.toolArt(x.id, g); out.push({ list: 'tools', id: x.id, art: a.art, name: x.name, desc: a.desc, got: g.tools.includes(x.id) || (x.lost && g.gaveBack.includes(x.id)), color: x.color }); }
    const evolved = hunterStage(g) > 1;
    for (const x of D.CRESTS) out.push({ list: 'crests', id: x.id, name: x.name, desc: evolved && x.evolved ? x.evolved : x.desc, got: g.crests.includes(x.id) });
    for (const x of D.SKILLS) out.push({ list: 'skills', id: x.id, name: x.name, desc: x.desc, got: g.skills.includes(x.id) });
    for (const x of D.ARTS) out.push({ list: 'arts', id: x.id, name: x.name, desc: x.desc, got: g.arts.includes(x.id) });
    // The items: the two upgrade ladders with their level, the materials with how many were found.
    const it = (id, got, count, n, top) => { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got, count, n, top }); };
    it('crafting-kit', g.kit > 0, `${num(g.kit)}/4`);
    it('tool-pouch', g.pouch > 0, `${num(g.pouch)}/4`);
    // The loose ones: up to three shards (one), and none past what the whole masks (spools) left.
    const shards = found('mask-shard') - 4 * g.masks, frags = found('spool-fragment') - 2 * g.spools;
    it('mask-shard', shards > 0, `${num(Math.max(0, shards))}/4`, [Math.max(0, Math.min(3, shards)), 3], Math.max(0, Math.min(3, total('mask-shard') - 4 * g.masks)));
    it('spool-fragment', frags > 0, `${num(Math.max(0, frags))}/2`, [Math.max(0, Math.min(1, frags)), 1], Math.max(0, Math.min(1, total('spool-fragment') - 2 * g.spools)));
    for (const id of ['memory-locket', 'craftmetal', 'pale-oil']) it(id, found(id) > 0, `${num(found(id))}/${num(total(id))}`, [found(id), total(id)]);
    it('everbloom', g.everbloom);
    it('farsight', g.farsight);
    it('hunters-journal', g.hasJournal);
    // The purse: the two currencies (their picture opens the text), and what breaks into them, held counts.
    for (const id of ['rosaries', 'shell-shards']) { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got: true, shelf: 'currency' }); }
    for (const [id, , cur, worth, max] of CO.PURSE) {
      if (!steel && STEEL_ONLY.includes(id)) continue;
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

  /* A cell of the Tools' grid: the Tool on its slot, the game's diamond in the slot's colour (the
     Crest screen's own drawing, design/02-silksong.md §3); one you lack, the slot hollow in its
     colour and the picture faint (design/43, 3 A). One fixed square, so every row lines up. A
     Tool and its upgrade on one slot (design/43, 4 A) show the one you have, with two pips under
     it, had and upgraded; in Free mode a tap goes none, had, upgraded (invTwin). */
  function cell(x, twin = null) {
    const lent = LENT.includes(x.id);
    const cls = `inv-cell${x.got ? '' : ' is-missing'}${x.color ? ' is-slot' : ''}${picked === keyOf(x) ? ' is-picked' : ''}`;
    const name = twin ? twin.names : pick(x.name);
    const label = name + (x.count ? ' ' + x.count : '') + (x.got ? '' : ' · ' + t('invMissing'));
    const act = marking && twin ? 'invTwin' : marking && markable(x) ? 'invOwn' : 'invPick';
    const pips = twin && twin.pips ? `<span class="inv-pips" aria-hidden="true">${twin.pips.map((on) => `<i class="${on ? 'is-on' : ''}"></i>`).join('')}</span>` : '';
    const li = [pips ? 'is-twin' : '', lent ? 'is-lent' : ''].filter(Boolean).join(' ');
    return `<li${li ? ` class="${li}"` : ''}><button type="button" class="${cls}"${x.color ? ` style="--c: var(--slot-${x.color})"` : ''} data-act="${act}" data-key="${esc(twin && marking ? twin.key : keyOf(x))}"
      ${act === 'invPick' ? `aria-expanded="${picked === keyOf(x)}"` : `aria-pressed="${x.got}"`} aria-label="${esc(label)}" title="${esc(name)}"${NT}>
        <img src="${icon(x.list, x.art || x.id)}" alt="" loading="lazy"></button>${pips}</li>`;
  }
  /* Free mode marks (design/03-redesign.md, step 4): a tap on a Tool, Crest, Silk Skill,
     ability, the Everbloom, an Old Heart or a melody marks it had or not and opens its text; the
     counted ones (loose shards and fragments, lockets, Craftmetal, Pale Oil, fleas, what's in the
     purse, the Relics of each kind) go by − N +, and the two currencies are typed.
     The Hunter Crest is always had: Hornet starts with it. */
  let marking = false;
  const markable = (x) => !x.n && x.id !== 'silk-heart' && !(x.list === 'crests' && x.id === 'hunter')
    && (x.list !== 'items' || ['everbloom', 'farsight', 'hunters-journal'].includes(x.id));
  // x.top: how far + goes, when less than the most there can be (the loose shards once the masks are whole).
  const stepper = (x) => {
    const [v, max] = x.n, top = x.top ?? max, what = pick(x.name);
    return `<span class="inv-step"><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v - 1}" data-dir="less" ${v > 0 ? '' : 'disabled'} aria-label="${esc(t('invLess', { what }))}" title="${esc(t('invLess', { what }))}">−</button>
      <b>${num(v)}</b><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v + 1}" data-dir="more" ${v < top ? '' : 'disabled'} aria-label="${esc(t('invMore', { what }))}" title="${esc(t('invMore', { what }))}">+</button></span>`;
  };
  /* After a mark repaints the screen, the focus goes back where the key was: the repaint changes
     the steppers' and the pieces' data-value, so js/app.js restoreFocus can't find them. */
  const refocus = (sel, ...more) => {
    const b = [sel, ...more].map((s) => document.querySelector(s)).find((n) => n && !n.disabled);
    if (b) b.focus({ preventScroll: true });
  };
  /* A plate for the Crests, the items, what's in the purse, the Relics and the Mementos (design/43,
     5 A), drawn as the Silk Skills': the picture, the pip, the name, and under it the count or
     «Not found yet». What comes in numbers keeps its − N + in Free mode, so only its picture is
     the button there; the rest is one button. */
  function plate(x) {
    const counted = marking && x.n;
    const v = counted ? stepper(x) : x.count ? esc(x.count) : x.got ? '' : esc(t('invNotFound'));
    const vcls = `inv-plate-v${!counted && (!x.got || !x.count) ? ' is-none' : ''}`;
    const cls = `inv-plate${x.got ? '' : ' is-missing'}${picked === keyOf(x) ? ' is-picked' : ''}`;
    const label = pick(x.name) + (x.count ? ' ' + x.count : '') + (x.got ? '' : ' · ' + t('invMissing'));
    if (counted) {
      return `<li><div class="${cls}"><button type="button" class="inv-plate-art" data-act="invPick" data-key="${esc(keyOf(x))}" aria-expanded="${picked === keyOf(x)}" aria-label="${esc(label)}"${NT}>
        <img src="${icon(x.list, x.art || x.id)}" alt="" loading="lazy"></button><span class="inv-plate-name"${NT}>${esc(pick(x.name))}</span><span class="${vcls}">${v}</span></div></li>`;
    }
    const mark = marking && markable(x);
    return `<li><button type="button" class="${cls}" data-act="${mark ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}" ${mark ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`} aria-label="${esc(label)}"${NT}>
      <span class="inv-plate-art"><img src="${icon(x.list, x.art || x.id)}" alt="" loading="lazy"></span><span class="inv-plate-name">${esc(pick(x.name))}</span><span class="${vcls}">${v}</span></button></li>`;
  }
  const platesOf = (list, sm = false) => `<ul class="inv-plates${sm ? ' is-sm' : ''}">${list.map(plate).join('')}</ul>`;
  /* A material beside what it feeds (design/43, 1 A; drawn as a row, design/49): the Memory
     Lockets under the Crests and the Craftmetal under the Kit and the Pouch, as their rows: the
     picture, which opens its text, the name, and under it the count, or − N + in Free mode. */
  function mat(x, rule = false) {
    return `<div class="inv-mat${x.got ? '' : ' is-missing'}${rule ? ' is-rule' : ''}"><button type="button" class="inv-mat-art" data-act="invPick" data-key="${esc(keyOf(x))}" aria-expanded="${picked === keyOf(x)}" aria-label="${esc(pick(x.name) + ' ' + x.count)}"${NT}>
      <img src="${icon(x.list, x.art || x.id)}" alt=""></button><span class="inv-fname"${NT}>${esc(pick(x.name))}</span>
      ${marking ? stepper(x) : `<span class="inv-mat-n">${num(x.n[0])}<i>/${num(x.n[1])}</i></span>`}</div>`;
  }
  /* The loose Mask Shards or Spool Fragments under their row, as the sibling draws its shards: the
     game's piece lit up to what you hold, how many make a whole one, and − N + in Free mode. The
     Pale Oil the same way, centred under the Needle's name (design/49). */
  function loose(x, of, note, cls = '') {
    const v = Math.max(0, x.n[0]);
    const pcs = Array.from({ length: x.n[1] }, (_, i) => `<img class="${i < v ? '' : 'is-off'}" src="${icon(x.list, x.art || x.id)}" alt="">`).join('');
    return `<div class="inv-loose${cls}"><button type="button" class="inv-loose-art" data-act="invPick" data-key="${esc(keyOf(x))}" aria-expanded="${picked === keyOf(x)}" aria-label="${esc(pick(x.name) + ' ' + num(v) + '/' + num(of))}">
      <span class="inv-loose-name"${NT}>${esc(pick(x.name))}</span><span class="inv-loose-pcs" aria-hidden="true">${pcs}</span><b>${num(v)}<i>/${num(of)}</i></b></button>
      ${note ? `<span class="inv-loose-note">${esc(note)}</span>` : ''}${marking ? stepper(x) : ''}</div>`;
  }
  // What's open under a shelf: the picture, the name and the game's text.
  function open(list) {
    const x = shown.find((y) => keyOf(y) === picked);
    if (!x || !list.includes(x)) return '';
    return `<div class="inv-open" aria-live="polite"><img class="${x.got ? '' : 'is-missing'}" src="${icon(x.list, x.art || x.id)}" alt="">
      <h4 class="inv-name"${NT}>${esc(pick(x.name))}</h4>
      ${x.got ? '' : `<p class="inv-not">${esc(t('invMissing'))}</p>`}
      ${x.desc ? `<p class="inv-desc">${esc(pick(x.desc))}</p>` : ''}</div>`;
  }
  /* A shelf's head (design/43, 2 A): its name and n/max, and its rule a gauge lit up to that
     part; complete, its diamond fills. */
  const count = (c) => (c ? ` <span class="inv-n">${num(c.got)}<i>/${num(c.max)}</i></span>` : '');
  const head = (title, c, list) => {
    const f = c && c.max ? Math.min(1, c.got / c.max) : 0;
    return `<h3 class="ct-h inv-h${c ? ' is-gauge' : ''}${c && f >= 1 ? ' is-full' : ''}"${c ? ` style="--f: ${(f * 100).toFixed(1)}%"` : ''}>${esc(title)}${count(c)}${marking && list ? `<span class="inv-all">
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="1">${esc(t('invAll'))}</button><span aria-hidden="true">·</span>
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="0">${esc(t('invNone'))}</button></span>` : ''}</h3>`;
  };

  /* ── What Hornet is, the sibling's way (hallownest-calculator's Inventory, design/03-redesign.md
     step 4): the Needle as the focal point, the body as rows of the game's own pieces, the Kit
     and the Pouch as pips. In Free mode each one sets your game's level (invLevel, into the
     marks: the Crest screen's own build is apart); in a save they show what the game saved, at
     full light but still. ── */
  let before = null;   // the last build drawn: what changed since lights up
  const lit = (b, k, on) => (on && before && before[k] !== b[k] ? ' is-lit' : '');
  function needles(b, still, oil) {
    const row = D.NEEDLES.map((n, i) => `<button type="button" class="inv-np${b.needle === i ? ' is-on' : ''}${lit(b, 'needle', b.needle === i)}"
        data-act="invLevel" data-key="needle" data-value="${i}" aria-pressed="${b.needle === i}"${still} title="${esc(pick(n.name))}" aria-label="${esc(pick(n.name) + ', ' + n.damage)}"${NT}>
        <img src="${ART.needle(i)}" alt="" width="80" height="600"><b>${num(n.damage)}</b></button>`).join('');
    return `<section class="inv-sec">${head(t('invNeedle'))}<div class="inv-needles" role="group" aria-label="${esc(t('invNeedle'))}">${row}</div>
      <p class="inv-caption"${NT}>${esc(pick(D.NEEDLES[b.needle].name))}</p>${loose(oil, oil.n[1], '', ' is-centre')}${open([oil])}</section>`;
  }
  /* A row of pieces: the first `base` always there, then one per upgrade; a tap on one sets the
     count to it (on the last one lit, one less). Under it, what's loose of the next one. */
  function pieces(b, key, name, base, max, piece, still, after = '') {
    const v = base + b[key];
    const btns = Array.from({ length: base + max }, (_, i) => {
      const fixed = i < base, on = i < v, n = i + 1 - base;
      const to = n === b[key] ? n - 1 : n;
      return `<button type="button" class="inv-pc${on ? ' is-on' : ''}${fixed ? ' is-base' : ''}${lit(b, key, i === v - 1)}"${fixed ? ' disabled' : ` data-act="invLevel" data-key="${key}" data-value="${to}"${still}`}
        aria-label="${esc(name + ' ' + num(i + 1))}" aria-pressed="${on}">${piece}</button>`;
    }).join('');
    return `<div class="inv-field"><div class="inv-frow"><span><span class="inv-fname"${NT}>${esc(name)}</span><span class="inv-fnote">${esc(t('invFromTo', { a: num(base), b: num(base + max) }))}</span></span>
      <span class="inv-fnum">${num(v)}<i>/${num(base + max)}</i></span></div><div class="inv-pieces is-${key}" role="group" aria-label="${esc(name)}">${btns}</div>${after}</div>`;
  }
  function level(b, key, id, still) {
    const it = D.ITEMS.find((x) => x.id === id);
    const opts = [0, 1, 2, 3, 4].map((n) => `<button type="button" data-act="invLevel" data-key="${key}" data-value="${n}" aria-pressed="${b[key] === n}"${still}>${num(n)}</button>`).join('');
    return `<div class="inv-level"><img class="${b[key] ? '' : 'is-missing'}" src="${icon('items', id)}" alt=""><span class="inv-fname"${NT}>${esc(pick(it.name))}</span>
      <div class="seg sm" role="group" aria-label="${esc(pick(it.name))}">${opts}</div></div>`;
  }
  // Hornet: the masks and the silk with what's loose of the next one under each, the Silk Hearts.
  function hornet(b, still, shards, frags) {
    return `<section class="inv-sec">${head(t('ctBody'))}
      ${pieces(b, 'masks', t('cat_masks'), 5, 5, `<img src="${ART.mask}" alt="">`, still, loose(shards, 4, t('invLooseMask')))}
      ${pieces(b, 'spools', t('invSilk'), 9, 9, '<i class="inv-bead"></i>', still, loose(frags, 2, t('invLooseSpool')))}
      ${pieces(b, 'hearts', t('cat_hearts'), 0, 3, `<img src="${icon('pieces', 'silk-heart')}" alt="">`, still)}${open([shards, frags])}</section>`;
  }
  /* Plates: the Silk Skills with what each deals at this build (js/engine.js), the abilities with
     Needle Strike's; the rest say whether they're learnt. A tap opens the game's text. */
  function plates(list, x2v) {
    return `<ul class="inv-plates">${list.map((x) => {
      const v = x.got ? x2v(x) : null;
      return `<li><button type="button" class="inv-plate${x.got ? '' : ' is-missing'}${picked === keyOf(x) ? ' is-picked' : ''}" data-act="${marking ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}" ${marking ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`}${NT}>
        <span class="inv-plate-art"><img src="${icon(x.list, x.art || x.id)}" alt="" loading="lazy"></span><span class="inv-plate-name">${esc(pick(x.name))}</span>
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
        <button type="button" class="inv-fig-art${picked === keyOf(x) ? ' is-picked' : ''}" data-act="invPick" data-key="${esc(keyOf(x))}" aria-expanded="${picked === keyOf(x)}" aria-label="${esc(name)}" title="${esc(name)}"${NT}><img src="${icon(x.list, x.art || x.id)}" alt=""></button>
        <span class="inv-fig-name"${NT}>${esc(name)}</span>
        <span class="inv-fig-num">${fig}${ros ? '' : `<i> / ${esc(num(cap))}</i>`}</span>
        ${ros ? '' : `<span class="inv-bar" style="--f:${(Math.min(v, cap) / cap * 100).toFixed(1)}%"></span>`}</div>
        ${platesOf(list, true)}
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
      tools: b0.tools.filter((id) => g.tools.includes(id)), skills: b0.skills.filter((id) => g.skills.includes(id)),
      crest: g.crests.includes(b0.crest) ? b0.crest : 'hunter', hunterStage: (g.build && g.build.hunterStage) || 1 });
    marking = !own;
    const all = shown = things(g, !own || !!(App.gameMeta() || {}).steel);
    const by = (list) => all.filter((x) => x.list === list);
    const still = own ? ' disabled' : '';
    const cats = Object.fromEntries(SS.completion.count(g).categories.map((c) => [c.id, c]));
    const r = SS.engine.compute(b);
    const skillV = (x) => { const s = r.skills.find((y) => y.id === x.id); return s ? s.total : null; };
    const artV = (x) => (x.id === 'needle-strike' && r.strike ? r.strike.total : null);
    const item = (id) => all.find((x) => x.list === 'items' && x.id === id);
    /* The Tools by colour, one slot per point of the 100% (design/43, 4 A): a Tool and its upgrade
       share one, showing the one you have with two pips (had, upgraded); the Steel Soul twin
       shows Shell Satchel when you have it. The two a wish lends sit among the reds where the
       game lists them, their slot dashed and out of the count, a line under the row saying why
       (design/51). */
    const tool = (id) => all.find((x) => x.list === 'tools' && x.id === id);
    const rows = ['red', 'blue', 'yellow'].map((c) => {
      const seen = new Set(), cells = [];
      let got = 0;
      for (const x of by('tools').filter((y) => y.color === c)) {
        if (LENT.includes(x.id)) { cells.push(cell(x)); continue; }
        const grp = GROUP.get(x.id);
        if (!grp || seen.has(grp)) continue;
        seen.add(grp);
        if (grp.length === 1) { cells.push(cell(x)); if (x.got) got++; continue; }
        const [a, z] = grp.map(tool), on = a.got || z.got, steel = !!D.TOOLS.find((y) => y.id === z.id).replaces;
        if (on) got++;
        cells.push(cell({ ...(z.got ? z : a), got: on }, { key: a.id, names: `${pick(a.name)} · ${pick(z.name)}`, pips: steel ? null : [on, z.got] }));
      }
      const lent = by('tools').some((y) => y.color === c && LENT.includes(y.id));
      return `<p class="inv-sub" style="--c: var(--slot-${c})">${esc(t('ct_' + c))} <span><b>${num(got)}</b><i>/${num(seen.size)}</i></span></p><ul class="inv-grid">${cells.join('')}</ul>
        ${lent ? `<p class="inv-lent" style="--c: var(--slot-${c})">${esc(t('invLentNote'))}</p>` : ''}`;
    }).join('');
    // The Hunter Crest is always had, and drawn lit: the head counts it with the rest (the 100% doesn't).
    const crests = by('crests'), crestsN = { got: crests.filter((x) => x.got).length, max: crests.length };
    // The items: the Everbloom, the Farsight, the Journal, the Old Hearts and the melodies; the fleas count on their own plate.
    const items = [item('everbloom'), item('farsight'), item('hunters-journal'), ...by('pieces').filter((x) => x.id !== 'silk-heart')];
    const itemsN = { got: items.filter((x) => x.got && !x.n).length, max: items.filter((x) => !x.n).length };
    const relics = all.filter((x) => x.shelf === 'relics'), mementos = all.filter((x) => x.shelf === 'mementos');
    const money = own ? { rosaries: (App.gameMeta() || {}).rosaries || 0, shards: (App.gameMeta() || {}).shards || 0 } : g;
    const counts = { relics: { got: relics.reduce((a, x) => a + x.n[0], 0), max: relics.reduce((a, x) => a + x.n[1], 0) },
      mementos: { got: mementos.filter((x) => x.got).length, max: mementos.length } };
    const purseShelf = [...all.filter((x) => x.shelf === 'currency'), ...all.filter((x) => x.shelf === 'purse')];
    const start = own ? ''
      : `<p class="inv-lead">${esc(t('invFreeLead'))}</p><p class="inv-presets"><span class="lbl">${esc(t('invStart'))}</span><button type="button" class="text-btn" data-act="ctPreset" data-value="base">${esc(t('invBase'))}</button>
          <span class="lbl" aria-hidden="true">·</span><button type="button" class="text-btn" data-act="ctPreset" data-value="max">${esc(t('invMax'))}</button></p>`;
    sec.innerHTML = `<div class="inv">${brackets}${screenHead(esc(t('navGame')), start)}
      <div class="inv-body">
        <div class="inv-col">
          ${needles(b, still, item('pale-oil'))}
          ${hornet(b, still, item('mask-shard'), item('spool-fragment'))}
          <section class="inv-sec">${head(t('cat_skills'), cats.skills, 'skills')}${plates(by('skills'), skillV)}${open(by('skills'))}</section>
          <section class="inv-sec">${head(t('cat_arts'), cats.arts, 'arts')}${plates(by('arts'), artV)}${open(by('arts'))}</section>
        </div>
        <div class="inv-col">
          <section class="inv-sec">${head(t('cat_crests'), crestsN, 'crests')}${platesOf(crests)}${mat(item('memory-locket'), true)}${open([...crests, item('memory-locket')])}</section>
          <section class="inv-sec is-tools">${head(t('cat_tools'), cats.tools, 'tools')}
            <div class="inv-levels">${level(b, 'kit', 'crafting-kit', still)}${level(b, 'pouch', 'tool-pouch', still)}${mat(item('craftmetal'))}</div>${open([item('craftmetal')])}
            ${rows}${open(by('tools'))}</section>
        </div>
      </div>
      <div class="inv-bag">
        <section class="inv-sec">${head(t('invPurse'))}${purse(g, all, money)}${open(purseShelf)}</section>
        <section class="inv-sec">${head(t('invItems'), itemsN, 'items')}${platesOf(items)}${open(items)}</section>
        <section class="inv-sec">${head(t('invRelics'), counts.relics, 'relics')}${platesOf(relics, true)}${open(relics)}</section>
        <section class="inv-sec">${head(t('invMementos'), counts.mementos, 'mementos')}${platesOf(mementos, true)}${open(mementos)}</section>
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
  /* The typed fields (data-change) don't click: they commit when the browser says the value changed.
     A moment later, so a Tab out of the field has landed first: the repaint then puts the focus
     back where it went (js/app.js render), or in the field again after Enter. */
  document.addEventListener('change', (e) => {
    const f = e.target.closest && e.target.closest('[data-change="invMoney"]');
    if (!f) return;
    setTimeout(() => {
      const a = document.activeElement, field = a && a.dataset && a.dataset.change === 'invMoney' ? a.dataset.key : null;
      actions.invMoney(f);
      if (field) refocus(`[data-change="invMoney"][data-key="${field}"]`);
    }, 0);
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
    /* A Tool and its upgrade on one slot (design/43, 4 A): a tap goes none, had, upgraded, none,
       as a save keeps them (the upgrade replaces the Tool). The Steel Soul twin goes on and off
       as the Tool it replaces. */
    invTwin(node) {
      const grp = GROUP.get(node.dataset.key);
      if (!grp || grp.length < 2) return;
      const [a, z] = grp, steel = !!D.TOOLS.find((y) => y.id === z).replaces;
      picked = 'tools/' + a;
      mark((m) => {
        const now = m.tools.includes(z) ? 2 : m.tools.includes(a) ? 1 : 0;
        const next = steel ? (now ? 0 : 1) : (now + 1) % 3;
        m.tools = [...m.tools.filter((id) => !grp.includes(id)), ...(next === 1 ? [a] : next === 2 ? [z] : [])];
      });
    },
    invAll(node) {
      const on = node.dataset.value === '1', list = node.dataset.list;
      mark((m) => {
        if (list === 'items') {
          // Only what the Items shelf holds: the three key items, the Old Hearts, the melodies and the fleas.
          const kinds = ['old-heart', 'melody', 'flea'];
          m.everbloom = on;
          m.farsight = on;
          m.hasJournal = on;
          m.pieces = [...m.pieces.filter((i) => !kinds.includes(CO.PIECES[i][0])),
            ...(on ? CO.PIECES.map((p, i) => (kinds.includes(p[0]) ? i : -1)).filter((i) => i >= 0) : [])];
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
      const b = App.freeGame(), v = Math.max(0, Math.min(x.top ?? x.n[1], Number(node.dataset.value)));
      const key = CSS.escape(node.dataset.key), dir = node.dataset.dir, other = dir === 'more' ? 'less' : 'more';
      const back = () => refocus(`[data-act="invCount"][data-key="${key}"][data-dir="${dir}"]`, `[data-act="invCount"][data-key="${key}"][data-dir="${other}"]`);
      if (x.shelf === 'purse') { mark((m) => { m.purse[x.id] = v; }); back(); return; }
      if (x.shelf === 'relics') { mark((m) => setRelics(m, x.kind, v)); back(); return; }
      // The loose shards and fragments come after those already in whole masks and spools.
      const over = x.id === 'mask-shard' ? 4 * b.masks : x.id === 'spool-fragment' ? 2 * b.spools : 0;
      mark((m) => setKind(m, KIND[x.id], over + v));
      back();
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
      // A piece of a row (a mask, a bead, a Silk Heart): the focus back on the same one.
      const row = node.closest('.inv-pieces'), at = row ? [...row.children].indexOf(node) : -1;
      mark((m) => { m[key] = Math.max(0, Math.min(top, Number(node.dataset.value) || 0)); });
      if (at >= 0) refocus(`.inv-pieces.is-${key} > :nth-child(${at + 1})`);
    },
    invPick(node) {
      picked = node.dataset.key === picked ? null : node.dataset.key;
      App.render();
      const b = document.querySelector(`[data-act="invPick"][data-key="${CSS.escape(node.dataset.key)}"]`);
      if (b) b.focus({ preventScroll: true });
    },
  });
})();
