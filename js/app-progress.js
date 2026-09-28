/* js/app-progress.js — Progress: what's missing for 100%, piece by piece, and what lies beyond it.
   The wiki's ten categories in its order (js/completion.js), each with its things by name —the
   Tools, Crests, Silk Skills and abilities— or one by one —which Mask Shard, which Crafting Kit—,
   each with its Act and the area it's in (js/collectibles.js: the area its entry is filed
   under, named as the game names it). Then the collectibles that don't count but open things:
   Memory Lockets, Craftmetal, Pale Oil and the Lost Fleas, and the enemy gauntlets. In a save, only what's missing by
   default (or everything, ticked where you have it), and what belongs to a later Act than
   yours dimmed; without one, the whole list, as a guide. The exact spot (which room) comes with
   the map. Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles, CP = SS.completion;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const item = (id) => D.ITEMS.find((x) => x.id === id);
  const KIND_NAME = {
    'mask-shard': () => pick(item('mask-shard').name), 'spool-fragment': () => pick(item('spool-fragment').name),
    'memory-locket': () => pick(item('memory-locket').name), craftmetal: () => pick(item('craftmetal').name),
    'pale-oil': () => pick(item('pale-oil').name), 'tool-pouch': () => pick(item('tool-pouch').name),
    'crafting-kit': () => pick(item('crafting-kit').name), flea: () => t('kind_flea'), 'silk-heart': () => t('kind_silkHeart'),
  };
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const R = SS.rooms;
  /* How far a missing piece is from your bench, in rooms (js/rooms.js: the game's doors and the
     stations you've opened), for the pieces the save keeps in a room; set per render. */
  let away = () => null;
  /* Nearest first, when chosen: the missing rows by rooms from the bench, the ones with no room
     (a wish, an ability) after them in their own order. */
  const dist = (x) => (!x.got && x.scene ? away(x.scene) : null);
  const nearFirst = (rows) => (!prefs.pgNear ? rows
    : rows.map((x, i) => ({ x, i, d: dist(x) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.i - b.i).map((e) => e.x));

  /* How to get a thing (js/how.js): its first way, in a few words, with the game's names; a thing
     lying in a room says nothing more than its area already does. Then the keys it lies behind
     (js/how.js NEEDS), by the names the inventory gives them. */
  const HW = SS.how;
  const itemName = (id) => pick(item(id).name);
  // The game on screen, set per render: a need its other way already meets (the Clawline for the
  // Flintslate) isn't shown.
  let cur = null;
  // Free mode with the Inventory's marks: a missing row's box marks it had (App.freeMark, js/app-game.js).
  let marking = false;
  function needText(need) {
    if (!need || (need.or && cur && cur.arts.includes(need.or))) return '';
    const keys = need.keys.map((k) => pick(HW.KEYS[k].name)).join(', ');
    return need.or ? t('howNeedsOr', { keys, alt: pick(D.ARTS.find((x) => x.id === need.or).name) }) : t('howNeeds', { keys });
  }
  function howText(ways, need) {
    const w = ways && ways[0];
    if (!w) return needText(need);
    const npc = (id) => (HW.NPCS[id] ? pick(HW.NPCS[id]) : id);
    const cost = [w.craftmetal ? `${num(w.craftmetal)} ${itemName('craftmetal')}` : '', w.paleOil ? `${num(w.paleOil)} ${itemName('pale-oil')}` : ''];
    const main = {
      shop: () => (w.price ? t('howShop', { vendor: npc(w.vendor), price: num(w.price) }) : npc(w.vendor)),
      npc: () => t('howGift', { npc: npc(w.npc) }),
      wish: () => t('howWish', { wish: pick(CO.WISHES[w.wish][4]) }),
      boss: () => t('howBoss', { foe: pick(SS.enemies.FOES.find((f) => f.id === w.foe).name) }),
      craft: () => t('howCraft'),
      challenge: () => t('howChallenge', { npc: npc(w.npc) }),
      fleas: () => (w.fleas === 'all' ? t('howFleasAll', { npc: npc(w.npc) }) : t('howFleas', { npc: npc(w.npc), n: num(w.fleas) })),
    }[w.kind];
    if (!main) return needText(need);
    return [main(), ...cost, w.act ? t('howFromAct', { n: num(w.act) }) : '', needText(need)].filter(Boolean).join(' · ');
  }

  /* One row: its name, whether you have it, its Act and its area; how to get it, when it's missing. */
  // Where the Map has a thing (js/spots.js AT), for its distance when its check names no room.
  const SPOT = SS.spots ? SS.spots.AT : null;
  const spotScene = (mark) => {
    if (!SPOT || !mark) return null;
    if (mark === 'everbloom') return SPOT.everbloom;
    const [cat, id] = mark.split(':');
    return (SPOT[cat === 'piece' ? 'pieces' : cat] || {})[id] || null;
  };
  /* One row (design/25-progress-lists-variants.html, B): the thing's picture, its name in the
     game's face (a Tool with its slot's diamond) and how to get it under it; on the right how far
     it is, large, with its area under, and a pin to see it on the Map. Its Act heads the list
     (listHtml); sorted by nearest, it goes with the area instead. */
  const PIN = '<svg class="ic" width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 15 C6 15 11 9 11 6 A5 5 0 0 0 1 6 C1 9 6 15 6 15 Z"/><circle cx="6" cy="6" r="1.8"/></svg>';
  function row({ name, got, act, area, color, scene, sub = [], how, mark, icon }, g) {
    scene = scene || spotScene(mark);
    const later = g && !got && act > g.act;
    const n = !got && scene ? away(scene) : null;
    const steps = n == null ? '' : n === 0 ? t('mapHere') : t(n === 1 ? 'mapSteps1' : 'mapSteps', { n: num(n) });
    const place = [prefs.pgNear && act ? t('saveAct', { n: act }) : '', areaName(area), ...sub].filter(Boolean);
    const onMap = !got && mark && App.mapHas && App.mapHas(mark);
    return `<li class="pg-item${got ? ' is-got' : ''}${later ? ' is-later' : ''}${icon ? '' : ' is-plain'}"${later ? ` title="${esc(t('pgLater', { n: act }))}"` : ''}>
        ${marking && mark && !(mark.startsWith('piece:') && LADDER[CO.PIECES[+mark.slice(6)][0]]) ? `<button type="button" class="pg-mark check is-own" data-act="pgOwn" data-value="${esc(mark)}" aria-pressed="${!!got}" aria-label="${esc(name)}"><span class="check-box" aria-hidden="true"></span></button>`
          : `<span class="pg-mark" aria-hidden="true">${got ? App.tick : ''}</span>`}
        ${icon ? `<span class="pg-art"><img src="${icon}" alt="" loading="lazy"></span>` : ''}
        <span class="pg-main"><span class="pg-name"${NT}>${color ? `<span class="pg-slot is-${color}" aria-hidden="true"></span>` : ''}${esc(name)}</span>
          ${got ? `<span class="sr-only">${esc(t('pgGot'))}</span>` : ''}${!got && how ? `<span class="pg-how">${esc(how)}</span>` : ''}</span>
        <span class="pg-place">${steps ? `<b>${esc(steps)}</b>` : ''}<span class="pg-where">${place.map((w, i) => `<span${i || prefs.pgNear ? NT : ''}>${esc(w)}</span>`).join('')}</span></span>
        ${onMap ? `<button type="button" class="pg-onmap" data-act="mapShow" data-value="${esc(mark)}" aria-label="${esc(t('mapOnMap') + ': ' + name)}" title="${esc(t('mapOnMap'))}">${PIN}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
      </li>`;
  }
  // A list of rows; in the Act's order, each Act a small head over its rows.
  function listHtml(shown, g) {
    let last = null;
    const acts = !prefs.pgNear && new Set(shown.map((x) => x.act || 0)).size > 1;
    return `<ul class="pg-list">${shown.map((x) => {
      const head = acts && (x.act || 0) !== last ? `<li class="pg-act" aria-hidden="true">${x.act ? esc(t('saveAct', { n: x.act })) : '·'}</li>` : '';
      last = x.act || 0;
      return head + row(x, g);
    }).join('')}</ul>`;
  }

  /* The game's picture for a piece of a kind, for the ledger's strip (the k-th of its kind: the
     Needles each their own). */
  const PIECE_ICON = { 'mask-shard': 'items/mask-shard', 'spool-fragment': 'items/spool-fragment', 'crafting-kit': 'items/crafting-kit',
    'tool-pouch': 'items/tool-pouch', 'silk-heart': 'pieces/silk-heart', 'memory-locket': 'items/memory-locket', craftmetal: 'items/craftmetal',
    'pale-oil': 'items/pale-oil', flea: 'pieces/flea' };
  const HEART_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter', CollectedHeartClover: 'heart-clover',
    HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian', HasMelodyConductor: 'melody-conductor' };
  const pieceIcon = (kind, k, p) => (kind === 'needle' ? ART_NEEDLE(k + 1) : p && HEART_ICON[p[2][1]] ? `assets/icons/pieces/${HEART_ICON[p[2][1]]}.webp`
    : PIECE_ICON[kind] ? `assets/icons/${PIECE_ICON[kind]}.webp` : null);
  const ART_NEEDLE = (n) => App.ART.needle(n);

  /* The things of a category: [{ name, got, act, area, color, icon, mark }] in the order to show them. */
  const byAct = (a, b) => (a.act || 9) - (b.act || 9) || areaName(a.area).localeCompare(areaName(b.area));
  function things(g) {
    const has = (list, id) => !!g && list.includes(id);
    const where = (map, id) => { const w = map[id] || []; return { act: w[0] || 0, area: w[1] || null }; };
    const pieces = (kind, name) => CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
      .map(({ p, i }, k) => ({ name: name ? name(k) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]),
        how: howText(HW.HOW.pieces[i], HW.NEEDS.pieces[i]), ways: HW.HOW.pieces[i], icon: pieceIcon(kind, k), mark: 'piece:' + i }));
    const tools = CO.COUNTED.map((ids) => {
      const tool = D.TOOLS.find((x) => x.id === ids[0]);
      const got = !!g && ids.some((id) => g.tools.includes(id));
      return { name: pick(tool.name), got, color: tool.color, ...where(CO.WHERE.tools, ids[0]), how: howText(HW.HOW.tools[ids[0]], HW.NEEDS.tools[ids[0]]), ways: HW.HOW.tools[ids[0]],
        icon: `assets/icons/tools/${ids[0]}.webp`, mark: 'tools:' + ids[0] };
    });
    const named = (list, ids, map, key) => ids.map((id) => ({ name: pick(list.find((x) => x.id === id).name), got: has(g ? g[key] : [], id), ...where(map, id),
      how: howText(HW.HOW[key][id], HW.NEEDS[key][id]), ways: HW.HOW[key][id], icon: `assets/icons/${key}/${id}.webp`, mark: key + ':' + id }));
    const ev = CO.WHERE.everbloom || [];
    return {
      tools: tools.sort(byAct),
      spools: pieces('spool-fragment').sort(byAct),
      upgrades: [...pieces('crafting-kit'), ...pieces('tool-pouch')].sort(byAct),
      arts: named(D.ARTS, CP.ARTS, CO.WHERE.arts, 'arts').sort(byAct),
      skills: named(D.SKILLS, CP.SKILLS, CO.WHERE.skills, 'skills').sort(byAct),
      crests: named(D.CRESTS, CP.CRESTS, CO.WHERE.crests, 'crests').sort(byAct),
      masks: pieces('mask-shard').sort(byAct),
      needle: pieces('needle', (k) => pick(D.NEEDLES[k + 1].name)),
      hearts: pieces('silk-heart').sort(byAct),
      items: [{ name: pick(item('everbloom').name), got: !!g && g.everbloom, act: ev[0] || 3, area: ev[1] || null, how: howText(HW.HOW.everbloom), ways: HW.HOW.everbloom,
        icon: 'assets/icons/items/everbloom.webp', mark: 'everbloom' }],
    };
  }
  /* A group's own note: masks and spools count whole, not by piece; the Tools' traps (js/how.js
     TRAPS: the Curveclaw handed over, the Silkshot's repairs); and what each of the other
     collectibles is for. */
  const toolName = (id) => pick(D.TOOLS.find((x) => x.id === id).name);
  const NOTE = { masks: () => t('pgWholeNote'), spools: () => t('pgSpoolNote'),
    tools: () => t('pgToolsTrap', { curveclaw: toolName('curveclaw'), curvesickle: toolName('curvesickle'), silkshot: toolName('silkshot') }),
    'memory-locket': () => t('pgNote_memoryLocket'), craftmetal: () => t('pgNote_craftmetal'), 'pale-oil': () => t('pgNote_paleOil'),
    flea: () => t('pgNote_flea'), 'old-heart': () => t('pgNote_oldHeart'), melody: () => t('pgNote_melody'),
    'other-arts': () => t('pgNote_otherArts'), gauntlets: () => t('pgNote_gauntlets') };
  const BEYOND = [['memory-locket'], ['craftmetal'], ['pale-oil'], ['flea', 'kind_fleas'], ['old-heart', 'kind_oldHearts'], ['melody', 'kind_melodies']];
  // The abilities that aren't in the 100%: the two cloaks, Beastling Call and Elegy of the Deep.
  const OTHER_ARTS = ['drifters-cloak', 'faydown-cloak', 'beastling-call', 'elegy-of-the-deep'];

  /* A category as a row of the ledger (the sibling's Progress, design/03-redesign.md step 5):
     its name, its things as the game's pictures (up to twelve, what you lack dimmed) or as pips,
     its count and the disclosure's ring; open, its list. Which rows are open is kept (prefs.pgOpen). */
  const MAX_PIPS = 60;
  const isOpen = (id) => (prefs.pgOpen || []).includes(id);
  function strip(list, g, got, max) {
    if (list.length <= 12 && list.every((x) => x.icon)) {
      return `<span class="pg-strip" aria-hidden="true">${list.map((x) => `<img class="${!g || x.got ? '' : 'is-missing'}" src="${x.icon}" alt="" loading="lazy">`).join('')}</span>`;
    }
    if (max > MAX_PIPS) return '<span class="pg-strip" aria-hidden="true"></span>';
    return `<span class="pg-strip pg-pips" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i class="${g && i < got ? 'is-on' : ''}"></i>`).join('')}</span>`;
  }
  function group(id, title, list, g, got, max) {
    const all = prefs.pgAll || !g;
    const open = isOpen(id);
    const done = g && got >= max;
    const shown = open ? nearFirst(all ? list : list.filter((x) => !x.got)) : [];
    const body = !open ? '' : shown.length ? listHtml(shown, g)
      : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`;
    return `<section class="pg-group${done ? ' is-done' : ''}${open ? ' is-open' : ''}" aria-labelledby="pg-${id}">
        <h3 class="pg-head" id="pg-${id}"><button type="button" class="pg-open" data-act="pgOpen" data-value="${id}" aria-expanded="${open}">
          <span class="pg-title">${esc(title)}</span>${strip(list, g, got, max)}
          ${g ? `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>` : `<span class="pg-count"><i class="u">${num(max)}</i></span>`}
          <span class="disc-ring">${App.chevron(open)}</span></button></h3>
        ${open ? `${NOTE[id] ? `<p class="pg-note">${esc(NOTE[id]())}</p>` : ''}${body}` : ''}
      </section>`;
  }

  /* The pane «Tareas»: the main objectives, then the wishes by type, each with the game's name. */
  const TYPE_NAME = { 'main-objectives': () => t('pgTasksMain'), collect: () => t('pgTasksCollect') };
  function tasks(g) {
    // A wish only one mode has (the Steel Soul's, a Classic one) shows in a game of that mode.
    const m = App.gameMeta();
    const mode = !g ? null : m && m.steel ? 'steel' : 'classic';
    const done = new Set(g ? g.quests : []);
    return CO.WISH_TYPES.map((ty) => {
      const list = CO.WISHES.map((w, i) => ({ w, i })).filter(({ w }) => w[0] === ty.id && (!mode || !w[5] || w[5] === mode))
        .map(({ w, i }) => ({ name: pick(w[4]), got: !!g && g.wishes.includes(i), act: w[1], area: w[3], scene: wishScene(wishQuest(w), done) })).sort(byAct);
      const title = ty.name ? pick(ty.name) : TYPE_NAME[ty.id]();
      return list.length ? group('wish-' + ty.id, title, list, g, list.filter((x) => x.got).length, list.length) : '';
    }).join('');
  }

  /* The road to the next Act (js/acts.js, the game's own rules in js/quests.js): its steps in
     order, each with what's left. In a save, the road from its Act (none in Act 3); without one,
     both roads, as a guide. A slot saved before the site read the wishes' quests has none of
     them: it says to import the save again. */
  const A = SS.acts, QU = SS.quests, EN = SS.enemies;
  const foeName = (id) => pick(EN.FOES.find((f) => f.id === id).name);
  const artName = (id) => pick(D.ARTS.find((x) => x.id === id).name);
  // Where the Soul Snare's pieces are (the wiki's pages for each: Maiden's Soul, Hermit's Soul,
  // Seeker's Soul, Snare Setter), as areas of js/collectibles.js.
  const SNARE_AREA = { 'Snare Soul Churchkeeper': 'BONEBOTTOM', 'Snare Soul Bell Hermit': 'BELLHART',
    'Snare Soul Swamp Bug': 'SHADOW', 'Silk Snare': 'WEAVE_PRIME' };
  const wishName = (q) => pick(QU.CHAIN[q].name);
  /* The room a wish is taken in (js/quests.js FROM, the game's): its Wishwall, or else the NPC
     who offers it. A wish after another (prev) is taken where the first one not done yet is: the
     board's Pre, then the NPC it sends you to. */
  function wishScene(quest, done) {
    let q = quest;
    while (q && QU.CHAIN[q] && QU.CHAIN[q].prev && !done.has(QU.CHAIN[q].prev)) q = QU.CHAIN[q].prev;
    const f = (q && QU.FROM[q]) || {};
    return f.board || (f.npc || [])[0] || null;
  }
  // A wish's quest (js/collectibles.js WISHES check): its own, or the first of several.
  const wishQuest = (w) => (w[2][0] === 'quest' ? w[2][1] : w[2][0] === 'any' ? (w[2].slice(1).find((c) => c[0] === 'quest') || [])[1] : null);
  // The three melodies the Cradle's way asks for (the pieces of kind 'melody').
  const melodies = (g) => (g ? CO.PIECES.filter((p, i) => p[0] === 'melody' && g.pieces.includes(i)).length : 0);

  /* A wish of a group as a row: its Act and area (the pane's, js/collectibles.js WISHES), the room
     it's taken in, half a point when it's worth that, and the wishes to do before it. */
  function wishRow(x, got, done) {
    const w = x.wish >= 0 ? CO.WISHES[x.wish] : null;
    const runt = HW.TRAPS.find((r) => r.id === 'broodfeast-runt');
    const sub = [x.value === 0.5 ? t('roadHalf') : '', !got && x.before.length ? t('roadBefore', { name: x.before.map(wishName).join(', ') }) : '',
      !got && runt && x.quest === runt.counts ? t('roadRunt') : ''];
    return { name: x.name ? pick(x.name) : w ? pick(w[4]) : x.quest, got, act: w ? w[1] : 0, area: w ? w[3] : null, scene: wishScene(x.quest, done), sub };
  }
  function groupRows(name, g, required) {
    const done = new Set(g ? g.quests : []);
    return QU.GROUPS[name].quests.filter((q) => q.required === required)
      .map((q) => wishRow(A.missing(q.quest, done, required ? undefined : q.value), done.has(q.quest), done)).sort(byAct);
  }
  // met: a part already fulfilled (enough points) shows its rows only with Everything.
  const list = (rows, g, met) => {
    if (met && g && !prefs.pgAll) return '';
    const shown = nearFirst(prefs.pgAll || !g ? rows : rows.filter((x) => !x.got));
    return shown.length ? listHtml(shown, g) : '';
  };
  const count = (got, max) => `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>`;
  // A count past its target (21 points of 17) shows the target met, with a tick.
  const subHead = (title, got, max, g) => `<p class="pg-sub"><span>${esc(title)}</span>${!g ? `<span class="pg-count"><i class="u">${num(max)}</i></span>`
    : got >= max ? `<span class="pg-count"><span class="pg-mark">${App.tick}</span> <b>${num(max)}</b><i class="u">/${num(max)}</i></span>` : count(got, max)}</p>`;

  function step(n, s, title, body, g) {
    const state = !g ? '' : s.ok ? ' is-ok' : s.bypassed ? ' is-bypassed' : '';
    const mark = !g ? '' : s.total > 1 && !s.ok && !s.bypassed ? count(s.done, s.total) : s.ok || s.bypassed ? `<span class="pg-mark">${App.tick}</span>` : '';
    return `<li class="pg-step${state}"><h4 class="pg-step-h"><span class="pg-step-n">${num(n)}</span>
        <span class="pg-step-t">${esc(title)}</span>${mark}</h4>${s.bypassed && !s.ok ? `<p class="pg-note">${esc(t('roadBypassed', { phantom: foeName('phantom') }))}</p>` : ''}${body || ''}</li>`;
  }

  function toAct2(r, g) {
    const [bells, gate, judge] = r.steps;
    const shrines = bells.shrines.map((b) => ({ name: pick(b.name), got: b.ok, act: 1 }));   // named by their area already
    const gateName = pick(QU.CHAIN[gate.quest].name);
    return [
      step(1, bells, t('roadBells'), list(shrines, g), g),
      step(2, gate, t('roadGate', { gate: gateName }), '', g),
      step(3, judge, t('roadJudge', { judge: foeName('last-judge'), phantom: foeName('phantom') }), '', g),
      step(4, r.steps[3], t('roadCitadel'), '', g),
    ];
  }

  function toAct3(r, g) {
    const [unlock, offer, pieces, ready, silk] = r.steps;
    const wish = wishName(offer.quest);
    const rule = QU.GROUPS['Soul Snare'];
    const required = groupRows('Soul Snare', g, true), points = groupRows('Soul Snare', g, false);
    const test = (id) => unlock.tests.find((x) => x.id === id);
    const key = test('bellhomeKey').key;
    const checks = [
      { name: t('roadCaravan'), got: test('caravan').ok },
      { name: artName('faydown-cloak'), got: test('doubleJump').ok, ...(() => { const w = CO.WHERE.arts['faydown-cloak'] || []; return { act: w[0], area: w[1] }; })() },
      { name: t('roadLace'), got: test('laceTower').ok, act: 2, area: 'CRADLE', sub: [test('laceTower').ok ? '' : t('roadMelodies', { n: num(melodies(g)) })] },
      { name: t('roadKey'), got: test('bellhomeKey').ok, act: 2, area: 'BELLHART',
        sub: [test('bellhomeKey').ok ? '' : key.ready ? t('roadPavo') : t('roadKeyRule', { glory: wishName('Belltown House Mid'), n: num(key.need) })] },
    ].map((x) => ({ act: 0, area: null, ...x }));
    // The key's own rule, while it isn't there: Bellhart's Glory, then 2 of the group's wishes.
    const keyRows = [wishRow(key.gloryQuest, key.glory, new Set(g ? g.quests : [])), ...groupRows('Belltown House Key', g, false)];
    const keyPart = g && !test('bellhomeKey').ok && !key.ready
      ? subHead(t('roadKeyHead', { key: t('roadKey') }), (key.glory ? 1 : 0) + Math.min(key.got, key.need), 1 + key.need, g) + list(keyRows, g) : '';
    const unlockBody = subHead(t('roadRequired'), unlock.required.done, unlock.required.total, g) + list(required, g, !unlock.required.missing.length)
      + subHead(t('roadPoints', { n: num(rule.target), max: num(unlock.points.max) }), unlock.points.got, unlock.points.need, g)
      + `<p class="pg-note">${esc(t('roadPointsNote'))}</p>` + list(points, g, unlock.points.got >= unlock.points.need)
      + subHead(t('roadChecks'), unlock.tests.filter((x) => x.ok).length, unlock.tests.length, g) + list(checks, g) + keyPart;
    const snare = pieces.pieces.map((x) => ({ name: pick(x.name), got: x.ok, act: 2, area: SNARE_AREA[x.save] || null }));
    return [
      step(1, unlock, t('roadUnlock', { wish }), unlockBody, g),
      step(2, offer, t('roadOffer', { wish, caretaker: t('roadCaretaker'), town: areaName('BELLHART'), clave: areaName('ENCLAVE') }), '', g),
      step(3, pieces, t('roadPieces'), list(snare, g), g),
      step(4, ready, t('roadReady', { caretaker: t('roadCaretaker') }), '', g),
      step(5, silk, t('roadSilk'), `<p class="pg-note">${esc(t('roadSilkNote'))}</p>`, g),
    ];
  }

  /* The road at a glance (design/03-redesign.md, step 5, "the journey"): its steps as the game's
     diamonds on one thread, done ones lit, the one you're on larger; their names under them in
     the game's words; and the step you're on as a headline with how far into it. The whole road
     opens under it. */
  function journey(r) {
    const at = r.steps.findIndex((x) => !x.ok && !x.bypassed);
    const on = at < 0 ? r.steps.length : at;
    const names = r.act === 3
      ? [wishName(r.steps[1].quest), t('roadWishwall'), t('roadSnare'), t('roadCaretaker'), foeName('grand-mother-silk')]
      : [t('roadBellshrine'), pick(QU.CHAIN[r.steps[1].quest].name), foeName('last-judge'), t('roadCitadelName')];
    const titles = r.act === 3 ? toAct3Titles(r) : toAct2Titles(r);
    const s = r.steps[at];
    const f = ((on + (s && s.total > 1 ? s.done / s.total : 0)) / Math.max(1, r.steps.length - 1)) * 100;
    const open = !!prefs.pgRoad;
    return `<div class="pg-journey" style="--n:${r.steps.length};--f:${Math.min(100, f).toFixed(1)}%">
        <p class="pg-journey-sup">${esc(t('roadTitle', { n: num(r.act) }))}</p>
        <ol class="pg-journey-steps">${r.steps.map((x, i) => `<li class="${x.ok || x.bypassed ? 'is-done' : ''}${i === at ? ' is-cur' : ''}" title="${esc(titles[i])}">
          <i aria-hidden="true"></i><span${NT}>${esc(names[i])}</span></li>`).join('')}</ol>
        ${s ? `<p class="pg-journey-now">${esc(titles[at])}${s.total > 1 ? ` <b>${esc(t('roadOf', { n: num(s.done), of: num(s.total) }))}</b>` : ''}</p>` : ''}
        <button type="button" class="text-btn" data-act="pgRoad" aria-expanded="${open}">${esc(t(open ? 'roadLess' : 'roadWhole'))}</button>
      </div>`;
  }
  /* In Act 3, the whole game at a glance (Albert): the three Acts, the last one where you are,
     then the endings, lit the ones this save has seen (js/savefile.js ENDINGS), named as the game
     names them; the headline counts them. */
  function journeyAll(g) {
    const E = SS.savefile.ENDINGS, seen = new Set(g.endings || []);
    const acts = [1, 2, 3].map((n) => ({ name: t('saveAct', { n: num(n) }), cls: n < 3 ? 'is-done' : 'is-cur' }));
    const ends = E.map((e) => ({ name: t('ending_' + e.key), cls: 'is-ending' + (seen.has(e.id) ? ' is-done' : '') }));
    const all = [...acts, ...ends];
    return `<div class="pg-journey is-game" style="--n:${all.length};--f:${((2 + [...seen].length) / (all.length - 1) * 100).toFixed(1)}%">
        <p class="pg-journey-sup">${esc(t('roadGame'))}</p>
        <ol class="pg-journey-steps">${all.map((x) => `<li class="${x.cls}"><i aria-hidden="true"></i><span${NT}>${esc(x.name)}</span></li>`).join('')}</ol>
        <p class="pg-journey-now">${esc(t('saveAct', { n: num(3) }))} <b>${esc(t('roadEndings', { n: num(seen.size), of: num(E.length) }))}</b></p>
      </div>`;
  }
  // Each step's title, as the whole road names it.
  const toAct2Titles = (r) => [t('roadBells'), t('roadGate', { gate: pick(QU.CHAIN[r.steps[1].quest].name) }),
    t('roadJudge', { judge: foeName('last-judge'), phantom: foeName('phantom') }), t('roadCitadel')];
  const toAct3Titles = (r) => { const wish = wishName(r.steps[1].quest);
    return [t('roadUnlock', { wish }), t('roadOffer', { wish, caretaker: t('roadCaretaker'), town: areaName('BELLHART'), clave: areaName('ENCLAVE') }),
      t('roadPieces'), t('roadReady', { caretaker: t('roadCaretaker') }), t('roadSilk')]; };

  function roadHtml(g) {
    const roads = g ? [A.next(g)].filter(Boolean) : [A.next({ act: 1 }), A.next({ act: 2 })];
    if (!roads.length) return '';
    // A slot kept before the site read the quests: its wishes are there, its quests aren't.
    const stale = g && !g.quests.length && g.wishes.length;
    return roads.map((r) => `<section class="pg-road" id="pg-road-${r.act}" aria-labelledby="pg-road-${r.act}-h">
        <h3 class="pg-part" id="pg-road-${r.act}-h">${esc(t('roadTitle', { n: num(r.act) }))}${g ? ` <b>${num(r.done)}/${num(r.total)}</b>` : ''}</h3>
        <p class="pg-note">${esc(t(r.act === 3 ? 'roadNote3' : 'roadNote2'))}</p>
        ${stale ? `<p class="pg-note is-warn">${esc(t('roadStale'))}</p>` : ''}
        <ol class="pg-steps">${(r.act === 3 ? toAct3 : toAct2)(r, g).join('')}</ol>
      </section>`).join('');
  }



  /* Free mode's game for Progress: the Inventory's marks, and its ladders (masks, silk, Silk
     Hearts, Needle, Kit, Pouch) from the free build, as the Inventory sets them: their pieces had
     in order up to the build's level, so the lists and the counts agree. In Act 3, so nothing
     reads as later. */
  const LADDER = { 'mask-shard': (b) => 4 * b.masks, 'spool-fragment': (b) => 2 * b.spools, 'silk-heart': (b) => b.hearts,
    needle: (b) => b.needle, 'crafting-kit': (b) => b.kit, 'tool-pouch': (b) => b.pouch };
  function freeView(free) {
    const b = App.currentBuild();
    const pieces = free.pieces.filter((i) => !LADDER[CO.PIECES[i][0]]);
    for (const [kind, n] of Object.entries(LADDER)) {
      CO.PIECES.forEach((p, i) => { if (p[0] === kind) pieces.push(i); });
      const mine = pieces.filter((i) => CO.PIECES[i][0] === kind);
      for (const i of mine.slice(n(b))) pieces.splice(pieces.indexOf(i), 1);
    }
    return { ...free, act: 3, pieces, masks: b.masks, spools: b.spools, hearts: b.hearts, needle: b.needle, kit: b.kit, pouch: b.pouch };
  }

  App.howPiece = (i) => howText(HW.HOW.pieces[i], HW.NEEDS.pieces[i]);   // the Map's card
  App.howOf = (key) => {   // the Map's card, for a Tool, Crest, Silk Skill, ability or the Everbloom
    if (key === 'everbloom') return howText(HW.HOW.everbloom);
    const [cat, id] = key.split(':');
    return HW.HOW[cat] && HW.HOW[cat][id] ? howText(HW.HOW[cat][id], (HW.NEEDS[cat] || {})[id]) : '';
  };
  App.freeView = () => { const f = App.freeGame(); return f ? freeView(f) : null; };   // the Map's too

  App.screens.progress = (sec) => {
    const own = App.game();
    /* Free mode with marks counts from them (the Inventory's, js/app-saves.js App.freeGame), as a
       game in Act 3 so nothing reads as later; its road stays the guide, as no save told it. */
    const free = own ? null : App.freeGame();
    const g = own || (free ? freeView(free) : null);
    marking = !!free;
    const w = g && g.bench ? R.walk(g.bench, g.lit) : null;
    away = (scene) => (w ? R.steps(g.bench, scene, g.lit, w) : null);
    cur = g;
    const all = things(g);
    const c = g ? CP.count(g) : null;
    const seg = g ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgShow'))}">
        <button type="button" data-act="pgShow" data-value="missing" aria-pressed="${!prefs.pgAll}">${esc(t('pgMissing'))}</button>
        <button type="button" data-act="pgShow" data-value="all" aria-pressed="${!!prefs.pgAll}">${esc(t('pgAll'))}</button>
      </div>${w ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgOrder'))}">
        <button type="button" data-act="pgSort" data-value="act" aria-pressed="${!prefs.pgNear}">${esc(t('pgByAct'))}</button>
        <button type="button" data-act="pgSort" data-value="near" aria-pressed="${!!prefs.pgNear}">${esc(t('pgNear'))}</button>
      </div>` : ''}` : '';
    const theirs = own ? Math.round((App.gameMeta() || {}).completion || 0) : null;
    // The figure alone (Albert: no label, no «it matches»); a line only when the game's figure differs.
    // In a ring that fills with it, as the Journal's Memento (design/20-progress-total-variants.html, A).
    const total = c ? `<div class="pg-total"><div class="pg-ring" style="--p:${Math.min(100, c.total)}"><p class="pg-total-n"><b>${num(c.total)}</b><span class="u">${esc(App.pctSpace().trim() || '%')}</span></p>
        <p class="pg-ring-k">${esc(t('pgCompletion'))}</p></div>
        ${own && theirs != null && theirs !== c.total ? `<p class="hm-check is-off">${esc(t('homeDiffers', { pct: num(theirs) + App.pctSpace() }))}</p>` : ''}</div>` : '';
    const next = own ? A.next(own) : null;
    const road = next ? journey(next) + (prefs.pgRoad ? roadHtml(own) : '')
      : `<div class="pg-journey is-guide"><button type="button" class="text-btn" data-act="pgRoad" aria-expanded="${!!prefs.pgRoad}">${esc(t(prefs.pgRoad ? 'roadLess' : 'roadBoth'))}</button></div>${prefs.pgRoad ? roadHtml(null) : ''}`;
    const hundred = CP.CATEGORIES.map((k, i) => {
      const cat = c ? c.categories[i] : { got: 0, max: k.max };
      return group(k.id, t('cat_' + k.id), all[k.id], g, cat.got, cat.max);
    }).join('');
    const beyond = BEYOND.map(([kind, key]) => {
      const list = CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
        .map(({ p, i }, k) => ({ name: p[4] ? pick(p[4]) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]),
          icon: pieceIcon(kind, k, p), mark: 'piece:' + i })).sort(byAct);
      return group(kind, key ? t(key) : KIND_NAME[kind](), list, g, list.filter((x) => x.got).length, list.length);
    }).join('') + (() => {
      const list = OTHER_ARTS.map((id) => { const w = CO.WHERE.arts[id] || [];
        return { name: pick(D.ARTS.find((x) => x.id === id).name), got: !!g && g.arts.includes(id), act: w[0] || 0, area: w[1] || null, icon: `assets/icons/arts/${id}.webp`, mark: 'arts:' + id }; });
      return group('other-arts', t('pgOtherArts'), list, g, list.filter((x) => x.got).length, list.length);
    })() + (() => {
      // The enemy gauntlets, in the wiki's order (by area), named as Combat names them.
      const list = SS.gauntlets.GAUNTLETS.map((x) => ({ name: App.gauntletName(x.id), got: !!g && g.gauntlets.includes(x.id), act: 0, area: x.area }));
      return group('gauntlets', t('ftModeGauntlets'), list, g, list.filter((x) => x.got).length, list.length);
    })();
    // The total and the road lead; how to show the lists goes just over them.
    const controls = g ? `<div class="pg-controls">${seg}</div>` : '';
    sec.innerHTML = `<div class="pg">${brackets}${screenHead(esc(t('navProgress')))}
        ${total}
        ${own && !next ? (own.act >= 3 ? journeyAll(own) : '') : road}
        <h3 class="pg-part">${esc(t('pg100'))}</h3>
        ${controls}
        <div class="pg-groups">${hundred}</div>
        <h3 class="pg-part">${esc(t('pgBeyond'))}</h3>
        <p class="pg-note">${esc(t('pgBeyondNote'))}</p>
        <div class="pg-groups">${beyond}</div>
        <h3 class="pg-part">${esc(t('pgTasks'))}</h3>
        <p class="pg-note">${esc(t('pgTasksNote'))}</p>
        <div class="pg-groups">${tasks(g)}</div>
      </div>`;
  };

  Object.assign(actions, {
    pgOpen(node) {
      const id = node.dataset.value, list = prefs.pgOpen || [];
      prefs.pgOpen = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      savePrefs();
      render();
    },
    pgRoad() { prefs.pgRoad = !prefs.pgRoad; savePrefs(); render(); },
    // Free mode: a row's box marks it had or not (the Inventory's own marks).
    pgOwn(node) {
      const [kind, id] = node.dataset.value.split(':');
      App.freeMark((m) => {
        const flip = (arr, x) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);
        if (kind === 'piece') m.pieces = flip(m.pieces, Number(id));
        else if (kind === 'everbloom') m.everbloom = !m.everbloom;
        else m[kind] = flip(m[kind], id);
      });
    },
    pgSort(node) {
      prefs.pgNear = node.dataset.value === 'near';
      savePrefs();
      render();
    },
    pgShow(node) {
      prefs.pgAll = node.dataset.value === 'all';
      savePrefs();
      render();
    },
  });
})();
