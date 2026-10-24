/* js/app-progress.js — Progress: what's missing for 100%, piece by piece, and what lies beyond it.
   The wiki's ten categories in its order (js/completion.js), each with its things by name —the
   Tools, Crests, Silk Skills and abilities— or one by one —which Mask Shard, which Crafting Kit—,
   each with its Act and the area it's in (js/collectibles.js: the area its entry is filed
   under, named as the game names it). Then the collectibles that don't count but open things:
   Memory Lockets, Craftmetal, Pale Oil and the Lost Fleas, and the enemy gauntlets. In a save, only what's missing by
   default (or everything, ticked where you have it), and what belongs to a later Act than
   yours dimmed; without one, the whole list, as a guide. The exact spot (which room) comes with
   the map. Two tabs (design/03-redesign.md, step 5, the restructure): the road to the next Act,
   drawn as rings of what's left and what's next (or, in Act 3, the endings), and the 100% with
   how it splits and the rest; the one used last opens (prefs.pgTab). Over them, where you are
   among the three Acts (step 5, at first sight). Shares SS.app with js/app.js (see there). */
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
  const dist = (x) => { const scene = !x.got && (x.scene || spotScene(x.mark)); return scene ? away(scene) : null; };
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
    // An ability it waits on (the Needolin for the Threefold Pin) only while the game lacks it.
    const arts = (need.arts || []).filter((id) => !(cur && (cur.arts || []).includes(id))).map((id) => pick(D.ARTS.find((x) => x.id === id).name));
    const keys = [...need.keys.map((k) => pick(HW.KEYS[k].name)), ...arts].join(', ');
    if (!keys) return '';
    return need.or ? t('howNeedsOr', { keys, alt: pick(D.ARTS.find((x) => x.id === need.or).name) }) : t('howNeeds', { keys });
  }
  /* The way shown is js/completion.js wayOf's, for the game on screen (Free mode's marks: none, the
     guide's first), in two parts (design/41, 2 B): lead, what it is and what it costs; more, what it
     waits for (from an Act, the wishes first, the abilities and keys), which a phone folds. */
  // Where a wish is taken: its Wishwall, else who offers it (js/quests.js FROM).
  const takenAt = (quest) => { const f = (SS.quests.FROM || {})[quest] || {}; return f.board || (f.npc || [])[0] || null; };
  function howParts(ways, need, key) {
    const { way: w, first, arts } = CP.wayOf(ways, marking ? null : cur, SS.savefile.ART_PD, key);
    const needs = needText(need);
    if (!w) return { how: needs, more: [] };
    const npc = (id) => (HW.NPCS[id] ? pick(HW.NPCS[id]) : id);
    const cost = [w.craftmetal ? `${num(w.craftmetal)} ${itemName('craftmetal')}` : '', w.paleOil ? `${num(w.paleOil)} ${itemName('pale-oil')}` : ''];
    const main = {
      shop: () => (w.price ? t('howShop', { vendor: npc(w.vendor), price: num(w.price) }) : npc(w.vendor)),
      // Who plays a melody once brought what it's kept on (js/how.js bring: the Vaultkeeper's).
      npc: () => (w.bring ? t('howBring', { npc: npc(w.npc), item: pick(w.bring.name), area: areaName(R.areaOf(w.bring.scene)) }) : t('howGift', { npc: npc(w.npc) })),
      // A wish ended in person elsewhere than where it's taken (js/how.js by): who gives it, and where it's taken.
      wish: () => (w.by ? t('howWishBy', { wish: pick(CO.WISHES[w.wish][4]), npc: npc(w.by), area: areaName(R.areaOf(takenAt(w.quest))) })
        : t('howWish', { wish: pick(CO.WISHES[w.wish][4]) })),
      boss: () => t('howBoss', { foe: pick(SS.enemies.FOES.find((f) => f.id === w.foe).name) }),
      craft: () => t('howCraft'),
      challenge: () => t('howChallenge', { npc: npc(w.npc) }),
      fleas: () => (w.fleas === 'all' ? t('howFleasAll', { npc: npc(w.npc) }) : t('howFleas', { npc: npc(w.npc), n: num(w.fleas) })),
    }[w.kind];
    if (!main) return { how: needs, more: [] };
    // "From Act 3" only before the game is there; what a shop waits for that the game lacks: the
    // wishes to do first, the abilities it asks for.
    return { how: [main(), ...cost].filter(Boolean).join(' · '),
      more: [w.act && !(cur && !marking && cur.act >= w.act) ? t('howFromAct', { n: num(w.act) }) : '',
        first.length ? t('roadBefore', { name: first.map((i) => pick(CO.WISHES[i][4])).join(', ') }) : '',
        arts.length ? t('howNeeds', { keys: arts.map(artName).join(', ') }) : '', needs].filter(Boolean) };
  }
  // The same in one line (the Map's cards).
  const howText = (ways, need, key) => { const h = howParts(ways, need, key); return [h.how, ...h.more].filter(Boolean).join(' · '); };

  /* One row: its name, whether you have it, its Act and its area; how to get it, when it's missing. */
  // Where the Map has a thing (js/spots.js AT), to sort by nearest when its check names no room.
  const SPOT = SS.spots ? SS.spots.AT : null;
  const spotScene = (mark) => {
    if (!SPOT || !mark) return null;
    if (mark === 'everbloom') return SPOT.everbloom;
    const [cat, id] = mark.split(':');
    return (SPOT[cat === 'piece' ? 'pieces' : cat] || {})[id] || null;
  };
  /* One row (design/25-progress-lists-variants.html, B): the thing's picture, its name in the
     game's face (a Tool with its slot's diamond) and how to get it under it; on the right its
     area, and a pin to see it on the Map. Its Act heads the list (listHtml); sorted by nearest,
     it goes with the area instead. */
  /* How to get it (design/41-progress-leftovers-variants.html, 2 B): its lead, and what it waits
     for (more: posted after, first, needs) after it; on a phone only the lead, the rest behind
     «+n more». */
  let howN = 0;
  function howHtml(how, more = []) {
    if (!more.length) return how ? `<span class="pg-how">${esc(how)}</span>` : '';
    if (!how) return `<span class="pg-how">${esc(more.join(' · '))}</span>`;
    const id = 'pg-how-' + (++howN);
    return `<span class="pg-how" id="${id}">${esc(how)}<span class="pg-how-more">${more.map((x) => `<span> · ${esc(x)}</span>`).join('')}</span>
      <button type="button" class="text-btn pg-how-btn" data-act="pgMore" aria-expanded="false" aria-controls="${id}">${esc(t('pgHowMore', { n: num(more.length) }))}</button></span>`;
  }
  /* A thing of the 100% lying in a room (its way 'found', or none) says so (design/41, 4 A): with
     no line under its name it looked like missing data. */
  const isFound = (x) => !x.got && !x.how && !(x.more || []).length && 'ways' in x
    && (!x.ways || !x.ways.length || (CP.wayOf(x.ways, marking ? null : cur, {}, x.mark).way || {}).kind === 'found');
  function row(x, g) {
    const { name, got, act, area, color, sub = [], mark, icon, more = [] } = x;
    const later = g && !got && act > g.act;
    const place = [prefs.pgNear && act ? t('saveAct', { n: act }) : '', areaName(area), ...sub].filter(Boolean);
    // A task's pin goes its own way (focus, taskPin): it may open several marks.
    const onMap = !got && (x.focus || (mark && App.mapHas && App.mapHas(mark)));
    const how = isFound(x) ? t(onMap ? 'pgFound' : 'pgFoundNoPin') : x.how;
    return `<li class="pg-item${got ? ' is-got' : ''}${later ? ' is-later' : ''}${icon ? '' : ' is-plain'}"${later ? ` title="${esc(t('pgLater', { n: act }))}"` : ''}>
        ${marking && mark && !(mark.startsWith('piece:') && LADDER[CO.PIECES[+mark.slice(6)][0]]) ? `<button type="button" class="pg-mark check is-own" data-act="pgOwn" data-value="${esc(mark)}" aria-pressed="${!!got}" aria-label="${esc(name)}"><span class="check-box" aria-hidden="true"></span></button>`
          : `<span class="pg-mark" aria-hidden="true">${got ? App.tick : x.promise ? `<span class="pg-promise${x.promise.done ? ' is-ready' : ''}"></span>` : ''}</span>`}
        ${icon ? `<span class="pg-art"><img src="${icon}" alt="" loading="lazy"></span>` : ''}
        <span class="pg-main"><span class="pg-name"${NT}>${color ? `<span class="pg-slot is-${color}" aria-hidden="true"></span>` : ''}${esc(name)}</span>
          ${got ? `<span class="sr-only">${esc(t('pgGot'))}</span>` : ''}${!got && x.promise ? `<span class="sr-only">${esc(t('pgPromised'))}</span>${wishLine(x.promise)}` : ''}${!got && !x.promise ? howHtml(how, more) + saysRow(x.says) : ''}</span>
        <span class="pg-place"><span class="pg-where">${place.map((w, i) => `<span${i || prefs.pgNear ? NT : ''}>${esc(w)}</span>`).join('')}</span></span>
        ${onMap ? `<button type="button" class="pg-onmap" data-act="${x.focus ? 'pgFocus' : 'mapShow'}" data-value="${esc(x.focus || mark)}" aria-label="${esc(t('mapOnMap') + ': ' + name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
      </li>`;
  }
  /* A list of rows; in the Act's order, each Act a small head over its rows, when they span two
     Acts or more. A row with no Act has no head (the caravan's condition had a lone «·»). The
     wishes promised go first, under a head of their own (design/81-task-states-variants.html, 2 A),
     and then the rest has its heads whatever it spans: by Act, or «The rest» by distance. */
  function listHtml(shown, g) {
    let last = null;
    const first = shown.filter((x) => x.promise && !x.got), rest = first.length ? shown.filter((x) => !first.includes(x)) : shown;
    const acts = !prefs.pgNear && (first.length > 0 || new Set(rest.map((x) => x.act || 0).filter(Boolean)).size > 1);
    const head = (s) => `<li class="pg-act" aria-hidden="true">${esc(s)}</li>`;
    return `<ul class="pg-list">${first.length ? head(t('pgPromisedHead')) + first.map((x) => row(x, g)).join('') : ''}${first.length && rest.length && prefs.pgNear ? head(t('pgRest')) : ''}${rest.map((x) => {
      const h = acts && x.act && x.act !== last ? head(t('saveAct', { n: x.act })) : '';
      last = x.act || 0;
      return h + row(x, g);
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

  /* A Tool had at one of several places, a variant each (js/spots.js VARIANTS: the Silkshot's three
     repairs of the Ruined Tool; design/102, all A): what to do first (find the Ruined Tool where it
     lies, or repair it once held), then each place still open with its way (a vendor the game has
     taken away, savefile left, is gone); the area where to go now (the Ruined Tool's, then the
     places'), and its pin every mark of it on the Map, the Ruined Tool first while missing. */
  function variantRow(key, g) {
    const v = SS.spots && SS.spots.VARIANTS && SS.spots.VARIANTS[key];
    if (!v) return {};
    const own = App.game(), id = key.slice(6), x = SS.spots.EXTRAS[v.item];
    const trap = HW.TRAPS.find((tr) => tr.variants && tr.thing[1] === id);
    const gone = new Set(own && own.leftRead ? own.left : []);
    const held = !marking && !!g && (g.extras || []).includes(v.item);
    const open = v.at.map((p, i) => ({ scene: p[2], way: trap.variants[i].way })).filter((p) => !(p.way.vendor && gone.has(p.way.vendor)));
    const item = pick(x[4]), lead = held ? t('pgShotRepair', { item }) : t('pgShotFind', { item, area: areaName(R.areaOf(x[3])) });
    const cost = (w) => (w.craftmetal ? `${num(w.craftmetal)} ${itemName('craftmetal')}` : '');
    const more = open.map((p) => (p.way.kind === 'shop' ? howParts([p.way], null, key).how : [t('pgShotRune', { area: areaName(R.areaOf(p.scene)) }), cost(p.way)].filter(Boolean).join(': ')));
    const areas = held ? [...new Set(open.map((p) => R.areaOf(p.scene)))] : [R.areaOf(x[3])];
    // Its marks on the Map (js/app-map.js: the Ruined Tool 'extra:<i>', each place key or key:variant), not had.
    const marks = App.mapApi ? App.mapApi.list() : [];
    const keys = [...(held ? [] : ['extra:' + v.item]), ...marks.filter((m) => m.chk === key && !m.key.startsWith('extra:')).map((m) => m.key)]
      .filter((k) => marks.some((m) => m.key === k && !m.got && !m.lost));
    if (keys.length) FOCUS.set('variants:' + key, { keys, name: pick(D.TOOLS.find((tl) => tl.id === id).name) });
    return { how: lead, more, area: areas[0] || null, sub: areas.slice(1).map(areaName), scene: held ? undefined : x[3],
      focus: keys.length ? 'variants:' + key : null };
  }
  /* The things of a category: [{ name, got, act, area, color, icon, mark }] in the order to show them. */
  const byAct = (a, b) => (a.act || 9) - (b.act || 9) || areaName(a.area).localeCompare(areaName(b.area));
  function things(g) {
    const has = (list, id) => !!g && list.includes(id);
    const where = (map, id) => { const w = map[id] || []; return { act: w[0] || 0, area: w[1] || null }; };
    const pieces = (kind, name) => CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
      .map(({ p, i }, k) => ({ name: name ? name(k) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]),
        ...howParts(HW.HOW.pieces[i], HW.NEEDS.pieces[i], 'piece:' + i), ways: HW.HOW.pieces[i], icon: pieceIcon(kind, k), mark: 'piece:' + i }));
    /* A Steel Soul save has the Tool its mode gives instead of another (js/data.js replaces: the
       Shell Satchel for the Dead Bug's Purse): the row is named and drawn as that one. Free mode,
       with no mode, as Classic. Where it is, how to get it and its mark stay the pair's. */
    const steel = !!(g && App.game() && (App.gameMeta() || {}).steel);
    const tools = CO.COUNTED.map((ids) => {
      const tool = (steel && ids.map((id) => D.TOOLS.find((x) => x.id === id)).find((x) => x && x.replaces)) || D.TOOLS.find((x) => x.id === ids[0]);
      const got = !!g && ids.some((id) => g.tools.includes(id));
      return { name: pick(tool.name), got, color: tool.color, ...where(CO.WHERE.tools, ids[0]), ...howParts(HW.HOW.tools[ids[0]], HW.NEEDS.tools[ids[0]], 'tools:' + ids[0]), ways: HW.HOW.tools[ids[0]],
        icon: `assets/icons/tools/${tool.id}.webp`, mark: 'tools:' + ids[0], ...(got ? {} : variantRow('tools:' + ids[0], g)) };
    });
    const named = (list, ids, map, key) => ids.map((id) => ({ name: pick(list.find((x) => x.id === id).name), got: has(g ? g[key] : [], id), ...where(map, id),
      ...howParts(HW.HOW[key][id], HW.NEEDS[key][id], key + ':' + id), ways: HW.HOW[key][id], icon: `assets/icons/${key}/${id}.webp`, mark: key + ':' + id }));
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
      items: [{ name: pick(item('everbloom').name), got: !!g && g.everbloom, act: ev[0], area: ev[1] || null, ...howParts(HW.HOW.everbloom), ways: HW.HOW.everbloom,
        icon: 'assets/icons/items/everbloom.webp', mark: 'everbloom' }],
    };
  }
  const BEYOND = [['memory-locket'], ['craftmetal'], ['pale-oil'], ['flea', 'kind_fleas'], ['old-heart', 'kind_oldHearts'], ['melody', 'kind_melodies']];
  // The abilities that aren't in the 100%: the two cloaks, Beastling Call and Elegy of the Deep.
  const OTHER_ARTS = ['drifters-cloak', 'faydown-cloak', 'beastling-call', 'elegy-of-the-deep'];

  /* A category as a row of the ledger (the sibling's Progress, design/03-redesign.md step 5):
     its name, its things as the game's pictures (what you lack dimmed; past twelve, smaller and
     wrapping, design/105-progress-strip-variants.html, all A) or, a thing with none, as pips, its
     count and the disclosure's ring; open, its list. Which rows are open is kept (prefs.pgOpen).
     A thing's picture in the strip is its row's, or its face (a gauntlet's champion). */
  const MAX_PIPS = 60;
  const isOpen = (id) => (prefs.pgOpen || []).includes(id);
  function strip(list, g, got, max, pips = false) {
    if (!pips && list.every((x) => x.icon || x.face)) {
      return `<span class="pg-strip${list.length > 12 ? ' is-many' : ''}" aria-hidden="true">${list.map((x) => `<img class="${!g || x.got ? '' : 'is-missing'}" src="${x.icon || x.face}" alt="" loading="lazy">`).join('')}</span>`;
    }
    if (max > MAX_PIPS) return '<span class="pg-strip" aria-hidden="true"></span>';
    // A wish promised lights its pip halfway, after the done ones (design/81, 3 A).
    const promised = g ? list.filter((x) => x.promise && !x.got).length : 0;
    return `<span class="pg-strip pg-pips" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i class="${g && i < got ? 'is-on' : g && i < got + promised ? 'is-promised' : ''}"></i>`).join('')}</span>`;
  }
  /* Free mode's marks (design/41, 6 A): the categories whose pieces follow the Inventory's
     ladders (masks, silk, the upgrades, the Needle, the Silk Hearts) have no box; their group says
     where they're set, with the way there. */
  const LADDER_CATS = ['masks', 'spools', 'upgrades', 'needle', 'hearts'];
  const ladderNote = (id, g) => (marking && g && LADDER_CATS.includes(id)
    ? `<p class="pg-note">${esc(t('pgLadderNote'))} <a class="text-btn" href="${App.here(App.hashFor('game'))}" data-act="view" data-value="game">${esc(t('navGame'))}</a></p>` : '');
  /* o: all, every row, the done ones ticked, whatever the toggle says; emblem, a picture by the
     title (null keeps its place, so the titles line up); pips, pips in the strip even when every
     row has a picture; keys, the group's marks when its rows have none (the gauntlets). */
  /* The group's pin (design/106-group-pins-variants.html, 1 A): the Map on what's missing of it, at
     the end of its head, in the rows' pins' column; a group with nothing left there keeps the place. */
  // A row's marks: a wish's where it stands now (its pin's focus, taskPin), else its own mark.
  const rowKeys = (x) => (x.focus && FOCUS.has(x.focus) ? FOCUS.get(x.focus).keys : x.mark ? [x.mark] : []);
  const groupKeys = (list) => list.filter((x) => !x.got).flatMap(rowKeys);
  function group(id, title, list, g, got, max, o = {}) {
    const all = o.all || prefs.pgAll || !g;
    const open = isOpen(id);
    const done = g && got >= max;
    const shown = open ? nearFirst(all ? list : list.filter((x) => !x.got)) : [];
    const body = !open ? '' : shown.length ? listHtml(shown, g)
      : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`;
    return `<section class="pg-group${done ? ' is-done' : ''}${open ? ' is-open' : ''}" aria-labelledby="pg-${id}">
        <h3 class="pg-head" id="pg-${id}"><button type="button" class="pg-open" data-act="pgOpen" data-value="${id}" aria-expanded="${open}">
          <span class="pg-title">${o.emblem !== undefined ? `<span class="pg-emb" aria-hidden="true">${o.emblem ? `<img src="${o.emblem}" alt="" loading="lazy">` : ''}</span>` : ''}${esc(title)}</span>${strip(list, g, got, max, o.pips)}
          ${g ? `<span class="pg-count"><b>${pts(got)}</b><i class="u">/${num(max)}</i></span>` : `<span class="pg-count"><i class="u">${num(max)}</i></span>`}
          <span class="disc-ring">${App.chevron(open)}</span></button>${(App.groupPin && App.groupPin('pg:' + id, o.keys || groupKeys(list), title, 'pg-onmap')) || '<span class="pg-onmap is-none" aria-hidden="true"></span>'}</h3>
        ${open ? `${ladderNote(id, g)}${body}` : ''}
      </section>`;
  }

  /* The pane «Tareas» as the game's three Wishwalls (design/104-tasks-variants.html, all A, and its
     look, design/104b-tasks-look-variants.html, all A): the main objective you're on and a thread of
     all 21, then the walls of Bone Bottom, Bellhart and the Songclave side by side, each headed by
     its figure in its town and lit by its area, then whoever asks for a wish in person, each standing
     over their name. Who posts a wish (js/quests.js FROM, the game's) is where it's taken, so the tab
     reads as where to go. In each, what's left as lines (promised first, what it asks counted with
     the pane's own bar or dots), what comes in a later Act and what's done as rows of pictures. Each
     task with the picture the pane draws by it (design/75, 4 A; tools/extract-wish-icons.py): a main
     objective's own (tasks/main-<its quest>), a wish's its type's (tasks/<type>). The objectives the
     save checks by a flag or the Journal take their quest's; the Soul Snare's two are Wayfarer
     wishes in the game (their QuestType). */
  const TASK_QUEST = { HasMelodyConductor: 'Citadel Ascent Melody Conductor', HasMelodyArchitect: 'Citadel Ascent Melody Architect',
    HasMelodyLibrarian: 'Citadel Ascent Melody Librarian', CollectedHeartCoral: 'Black Thread Pt5 Heart Coral',
    CollectedHeartFlower: 'Black Thread Pt5 Heart Flower', CollectedHeartHunter: 'Black Thread Pt5 Heart Ant', 'Lost Lace': 'Black Thread Pt6 Flower' };
  const TASK_TYPE = { 'Soul Snare': 'wayfarer', 'Soul Snare Pre': 'wayfarer' };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function taskIcon(w) {
    const q = wishQuest(w) || TASK_QUEST[w[2][1]];
    const ty = TASK_TYPE[q] || (w[0] === 'main-objectives' ? null : w[0]);
    return ty ? `assets/icons/tasks/${ty}.webp` : q ? `assets/icons/tasks/main-${slug(q)}.webp` : null;
  }
  /* A wish promised and not done (design/81-task-states-variants.html, all A): what it asks with
     how much of each Hornet carries (js/savefile.js carried; the rosaries, the shell shards, the
     Journal's entries), and once she has it all the game's line for handing it in (CHAIN ready).
     A delivery is ready from the moment it's taken: she carries it. A stage before it taken (a
     board's Pre) promises it with nothing counted yet. The main objectives are the road's. */
  function wishState(w, taken, g) {
    const q = wishQuest(w) || TASK_QUEST[w[2][1]];
    if (!q || !taskStages(q).some((s) => taken.has(s))) return null;
    const e = QU.CHAIN[q] || {}, all = taken.has(q) ? e.asks || [] : [];
    const delivery = all.length === 1 && !!all[0].delivery;
    const asks = delivery ? [] : all.map((a) => (a.kind === 'item' ? { name: pick(a.name), n: a.n, have: (g.carried || {})[a.save] || 0 }
      : a.kind === 'journal' ? { name: pick(item('hunters-journal').name), n: a.n, have: Object.keys(g.journal || {}).length }
        : { name: pick(item(a.kind === 'shards' ? 'shell-shards' : 'rosaries').name), n: a.n, have: a.kind === 'shards' ? g.shards : g.rosaries }));
    const ready = delivery || (asks.length > 0 && asks.every((a) => a.have >= a.n));
    return { asks, ready: ready && (e.ready || e.desc) ? pick(e.ready || e.desc) : '', done: ready };
  }
  // Its line, where other rows say how to get a thing: «Ragpelt 7/25», what's in hand dimmed.
  function wishLine(s) {
    if (s.done) return s.ready ? `<span class="pg-how pg-wish">${esc(s.ready)}</span>` : '';
    return s.asks.length ? `<span class="pg-how pg-wish">${s.asks.map((a) => `<span class="pg-wish-n${a.have >= a.n ? ' is-full' : ''}"><span${NT}>${esc(a.name)}</span> <b>${num(Math.min(a.have, a.n))}</b><i>/${num(a.n)}</i></span>`).join('')}</span>` : '';
  }
  /* Where a wish is posted: its Wishwall (the first stage of it a board lists: the Lost Fleas' is on
     Bone Bottom's, though Mooshka offers it too), else who offers it in person, as js/spots.js GIVER
     keys them (a room, or 'room:who'). */
  const WALLS = [['Bonetown', 'bonebottom', 'BONEBOTTOM'], ['Belltown', 'bellhart', 'BELLHART'], ['Song_Enclave', 'songclave', 'ENCLAVE']];
  function wishSource(q) {
    let npc = null;
    for (let x = q; x; x = QU.CHAIN[x] && QU.CHAIN[x].prev) {
      const f = QU.FROM[x] || {};
      if (f.board) return { wall: f.board };
      if (f.npc && !npc) npc = f.npc[0];
    }
    return npc ? { npc, giver: ((SS.spots || {}).QUEST_GIVER || {})[q] || npc } : {};
  }
  /* Who asks in person, by name and figure (assets/map/people, named as the game's NPC key);
     NO_FIGURE, one tools/extract-people.py takes no figure of (none since Greyroot's, 24-Oct).
     Fleatopia's wish has nobody in its room (GIVER null): it's Mister Mushroom's, offered at his
     tablet (tools/gen-spots.js), so he stands for it (js/people.js). */
  const NO_FIGURE = new Set();
  const NOBODY = { Aqueduct_05: 'mr-mushroom' };
  function giverOf(src) {
    const G = (SS.spots || {}).GIVER || {}, gv = G[src.giver] || G[src.npc];
    const area = R.areaOf(src.npc);
    const who = !gv && NOBODY[src.npc] && SS.people ? SS.people.PEOPLE.find((x) => x.id === NOBODY[src.npc]) : null;
    if (who) return { id: who.id, name: pick(who.name), area: areaName(area), key: area, art: `assets/map/${who.art}.webp` };
    if (!gv) return { id: src.giver, name: areaName(area), area: null, key: area, art: null };
    return { id: gv[0], name: pick(gv[1]), area: areaName(area), key: area, art: NO_FIGURE.has(gv[0]) ? null : `assets/map/people/${gv[0].toLowerCase().replace(/_/g, '-')}.webp` };
  }
  // What a promised wish asks, counted as the pane counts it: a dot each up to twelve, else its bar.
  const METER_DOTS = 12;
  function wishMeter(s) {
    if (s.done) return s.ready ? `<span class="pg-how pg-wish">${esc(s.ready)}</span>` : '';
    return s.asks.length ? `<span class="pg-meters">${s.asks.map((a) => { const h = Math.min(a.have, a.n);
      // One thing asked has its count alone: a single dot says nothing more.
      const meter = a.n === 1 ? '' : a.n <= METER_DOTS ? `<span class="pg-dots">${Array.from({ length: a.n }, (_, k) => `<i class="${k < h ? 'is-on' : ''}"></i>`).join('')}</span>`
        : `<span class="pg-bar">${h ? `<i style="width:${(100 * h / a.n).toFixed(1)}%"></i>` : ''}</span>`;
      return `<span class="pg-meter"><span${NT}>${esc(a.name)}</span><span class="pg-meter-n"><b>${num(h)}</b>/${num(a.n)}</span>${meter}</span>`; }).join('')}</span>` : '';
  }
  // A task left: its mark (a promised one the game's diamond), its picture, its name, who asks or what's carried, its pin.
  function taskRow(x) {
    return `<li class="pg-item pg-task${x.promise ? ' is-promised' : ''}"><span class="pg-mark" aria-hidden="true">${x.promise ? `<span class="pg-promise${x.promise.done ? ' is-ready' : ''}"></span>` : ''}</span>
        <span class="pg-art"><img src="${x.icon}" alt="" loading="lazy"></span>
        <span class="pg-main"><span class="pg-name"${NT}>${esc(x.name)}</span>${x.promise ? `<span class="sr-only">${esc(t('pgPromised'))}</span>${wishMeter(x.promise)}` : x.loc ? `<span class="pg-how">${esc(x.loc)}</span>` : ''}</span>
        ${x.focus ? `<button type="button" class="pg-onmap" data-act="pgFocus" data-value="${esc(x.focus)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
      </li>`;
  }
  const pic = (x) => `<li${x.got ? ' class="is-done"' : ''} title="${esc(x.name)}"><img src="${x.icon}" alt="${esc(x.name)}" loading="lazy"></li>`;
  const pictures = (list, label) => `<p class="pg-tasks-l">${esc(label)}</p><ul class="pg-pics">${list.map(pic).join('')}</ul>`;
  // What's left of a list now, promised first.
  const leftOf = (list) => list.filter((x) => !x.got && !x.later).sort((a, b) => !!b.promise - !!a.promise || a.act - b.act);
  // A wall's wishes: what's left as lines, what comes later and what's done as pictures.
  function taskList(list) {
    const left = leftOf(list);
    const later = list.filter((x) => !x.got && x.later), done = list.filter((x) => x.got);
    return `${left.length ? `<ul class="pg-list pg-tasks">${left.map(taskRow).join('')}</ul>` : later.length ? '' : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`}
      ${later.length ? pictures(later, t('pgTasksLater')) : ''}${done.length ? pictures(done, t('pgTasksDone')) : ''}`;
  }
  const tally = (list, g) => (g ? `<span class="pg-count"><b>${num(list.filter((x) => x.got).length)}</b><i class="u">/${num(list.length)}</i></span>`
    : `<span class="pg-count"><i class="u">${num(list.length)}</i></span>`);
  // A section's head as the pane's: a centred title over its filigree (design/80, E), and its count.
  const tasksHead = (title, list, g) => `<div class="pg-tasks-head"><h3>${esc(title)}</h3><img src="assets/icons/tasks/spacer.webp" alt="" loading="lazy">${tally(list, g)}</div>`;
  /* The main objectives: the one you're on (those of your Act not done, two at most; in Free mode
     the first not marked), large with the pane's words, and all 21 on a line by Act, the done lit. */
  function mainHtml(list, g) {
    const open = list.filter((x) => !x.got);
    const now = (g ? open.filter((x) => !x.later) : open).slice(0, 2);
    const cur = now.length ? now : open.slice(0, 1);
    const track = [1, 2, 3].map((a) => `<li class="pg-track-act"><span class="pg-track-n">${esc(t('saveAct', { n: num(a) }))}</span><ul class="pg-track-row">${list.filter((x) => x.act === a)
      .map((x) => `<li class="${x.got ? 'is-done' : ''}${cur.includes(x) ? ' is-now' : ''}" title="${esc(x.name)}"><img src="${x.icon}" alt="${esc(x.name)}" loading="lazy">${x.got ? `<span class="sr-only">${esc(t('pgGot'))}</span>` : ''}</li>`).join('')}</ul></li>`).join('');
    return `<section class="pg-tasks-sec">${tasksHead(t('pgTasksMain'), list, g)}
        <div class="pg-nows">${cur.map((x) => `<div class="pg-now"><img src="${x.icon}" alt="" loading="lazy"><div><p class="pg-now-act">${esc(t('saveAct', { n: num(x.act) }))}</p>
          <p class="pg-now-name"${NT}>${esc(x.name)}</p>${x.desc ? `<p class="pg-now-says">${esc(x.desc)}</p>` : ''}</div>
          ${x.focus ? `<button type="button" class="pg-onmap" data-act="pgFocus" data-value="${esc(x.focus)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span></span>'}</div>`).join('')}</div>
        <ol class="pg-track">${track}</ol></section>`;
  }
  // The rows, and how many tasks are done of how many (the tab's card).
  function tasks(g) {
    /* A wish only one mode has (the Steel Soul's, a Classic one) shows in a save of that mode. Free
       mode has none: it shows both, as the Journal and the Map do. */
    const m = App.gameMeta();
    const mode = !g || !App.game() ? null : m && m.steel ? 'steel' : 'classic';
    const pin = taskPin(g), taken = new Set(g ? g.taken || [] : []);
    const all = CO.WISHES.map((w, i) => ({ w, i })).filter(({ w }) => !mode || !w[5] || w[5] === mode).map(({ w, i }) => {
      const main = w[0] === 'main-objectives', q = wishQuest(w) || TASK_QUEST[w[2][1]], e = (q && QU.CHAIN[q]) || {};
      const got = !!g && g.wishes.includes(i);
      return { name: pick(w[4]), got, act: w[1], icon: taskIcon(w), main, src: main || !q ? {} : wishSource(q), loc: q ? wishLoc(q) : '',
        desc: e.desc ? pick(e.desc).split('\n')[0] : '', later: !!g && !got && w[1] > g.act,
        focus: got ? null : pin(w, i), promise: !g || got || main ? null : wishState(w, taken, g) };
    });
    // A promised wish is under way whatever its Act.
    for (const x of all) if (x.promise) x.later = false;
    const mains = all.filter((x) => x.main);
    const walls = WALLS.map(([scene, id, area]) => {
      const list = all.filter((x) => x.src.wall === scene);
      return list.length ? `<section class="pg-wall" data-wall="${id}" style="--area-line:var(--area-${area.toLowerCase()}-line, var(--spotlight));--area-fill:var(--area-${area.toLowerCase()}-fill, var(--scene-glow))">
          <div class="pg-wall-fig"><img src="assets/icons/wishes/wall-${id}.webp" alt="" loading="lazy"><h4${NT}>${esc(areaName(area))}</h4><img class="pg-wall-fil" src="assets/icons/tasks/spacer.webp" alt="" loading="lazy">${tally(list, g)}</div>
          ${taskList(list)}</section>` : '';
    }).join('');
    /* Who asks in person (design/110-tasks-givers-variants.html: 1 A, 2 A, 3 A, 4 A): one row each,
       read across in the order you meet them (their first wish's Act), their figure lit by their
       area; what's left as lines, what comes later and what's done as pictures with no label. Who
       has nothing to take now leaves the rows for a strip at the end, under the pane's «Later» or
       «Completed». A line under a wish that only names who asks, already over it («Greyroot of
       Shellwood»), goes; one naming somewhere else stays («Yarnaby of Greymoor»). */
    const people = new Map();
    for (const x of all.filter((y) => y.src.npc)) {
      const p = people.get(x.src.giver) || { ...giverOf(x.src), act: x.act, list: [] };
      p.list.push(x); p.act = Math.min(p.act, x.act); people.set(x.src.giver, p);
    }
    const folk = [...people.values()].sort((a, b) => a.act - b.act || a.name.localeCompare(b.name));
    const asked = folk.flatMap((p) => p.list);
    for (const p of folk) {
      const words = p.name.toLowerCase().split(/[^\p{L}']+/u).filter((w) => w.length >= 3 && !['and', 'the', 'del', 'los', 'las'].includes(w));
      const area = (p.area || '').toLowerCase();
      for (const x of p.list) { const l = x.loc.toLowerCase(); if (area && l.includes(area) && words.some((w) => l.includes(w))) x.loc = ''; }
    }
    const lit = (p) => (p.key ? ` style="--area-line:var(--area-${p.key.toLowerCase()}-line, var(--spotlight));--area-fill:var(--area-${p.key.toLowerCase()}-fill, var(--scene-glow))"` : '');
    const fig = (p) => `<span class="pg-person-fig">${p.art ? `<img src="${p.art}" alt="" loading="lazy">` : '<span class="pg-person-none" aria-hidden="true"><i></i></span>'}</span>`;
    const marks = (list) => { const parts = [[list.filter((x) => !x.got && x.later), 'pgTasksLater'], [list.filter((x) => x.got), 'pgTasksDone']].filter(([l]) => l.length);
      return parts.length ? `<div class="pg-person-pics">${parts.map(([l, k]) => `<span class="sr-only">${esc(t(k))}</span><ul class="pg-pics">${l.map(pic).join('')}</ul>`).join('')}</div>` : ''; };
    const rows = folk.filter((p) => leftOf(p.list).length), rest = folk.filter((p) => !rows.includes(p));
    const strip = (list, k) => (list.length ? `<div class="pg-folk-sec"><p class="pg-tasks-l">${esc(t(k))}</p><ul class="pg-folk${k === 'pgTasksLater' ? ' is-later' : ''}">${list.map((p) => `<li${lit(p)}>${fig(p)}<span class="pg-folk-name"${NT}>${esc(p.name)}</span>${marks(p.list)}</li>`).join('')}</ul></div>` : '');
    const html = `<div class="pg-tasks-view">${mains.length ? mainHtml(mains, g) : ''}
        ${walls ? `<section class="pg-tasks-sec">${tasksHead(t('pgTasksWalls'), all.filter((x) => x.src.wall), g)}<div class="pg-walls">${walls}</div></section>` : ''}
        ${folk.length ? `<section class="pg-tasks-sec">${tasksHead(t('mapLayer_givers'), asked, g)}${rows.length ? `<div class="pg-people">${rows.map((p) => `<section class="pg-person"${lit(p)}>${fig(p)}
          <div class="pg-person-who"><h4${NT}>${esc(p.name)}</h4>${p.area ? `<p>${esc(p.area)}</p>` : ''}${tally(p.list, g)}</div>
          <div class="pg-person-wishes"><ul class="pg-list pg-tasks">${leftOf(p.list).map(taskRow).join('')}</ul>${marks(p.list)}</div></section>`).join('')}</div>` : ''}
          ${strip(rest.filter((p) => p.list.some((x) => !x.got)), 'pgTasksLater')}${strip(rest.filter((p) => p.list.every((x) => x.got)), 'pgTasksDone')}</section>` : ''}</div>`;
    return { html, got: all.filter((x) => x.got).length, max: all.length };
  }
  /* Each task's pin to the Map (design/78-task-pins-variants.html, all A): the lists' round pin, to
     where the task stands now. Before it's taken, who gives it (its Wishwall or who asks, wishFrom);
     taken, what's still to do of it on the Map (what it asks for, where it's done: js/spots.js
     TASKS), and once nothing is, back to who gives it. A main objective goes to the game's own pin
     (the melodies and the old hearts to their piece). Without a save, who gives it, else its marks.
     Several marks open the Map on them alone (App.mapFocus), the nearest to the bench first; with
     none the row keeps the empty slot, and a done task has no pin. */
  let ownQuests = null;
  // A task's quest and the stages before it that no other task names (a Pre, the Diving Bell's first two).
  function taskStages(q) {
    ownQuests = ownQuests || new Set([...CO.WISHES.map(wishQuest), ...Object.values(TASK_QUEST)].filter(Boolean));
    const out = [q];
    for (let x = QU.CHAIN[q] && QU.CHAIN[q].prev; x && QU.CHAIN[x] && !ownQuests.has(x); x = QU.CHAIN[x].prev) out.unshift(x);
    return out;
  }
  /* What a wish asks for that the Map marks on another layer (js/spots.js ASKS: Pale Oil, the
     Mossberries, a Tool, the Fleas, the Void Masses), by stage: { stage: [{ save, n, keys, held }] }. */
  const asksOf = (s) => ((SS.spots && SS.spots.ASKS) || {})[s] || [];
  // What a task asks for on the Map, by stage, in order: [[keys], ...].
  function taskTargets(w) {
    const piece = w[2][0] === 'flag' ? CO.PIECES.findIndex((p) => p[2][0] === 'flag' && p[2][1] === w[2][1]) : -1;
    if (piece >= 0) return [['piece:' + piece]];
    const q = wishQuest(w) || TASK_QUEST[w[2][1]], T = SS.spots ? SS.spots.TASKS : [];
    if (!q) return [];
    // A wish's place that is a boss's fight is that boss's mark (App.mapKeyOf).
    const markOf = (k) => (App.mapKeyOf ? App.mapKeyOf(k) : k);
    const by = taskStages(q).map((s) => [...new Set([...T.flatMap((k, i) => (k[1] === s ? [markOf('task:' + i)] : [])), ...asksOf(s).flatMap((a) => a.keys)])])
      .filter((a) => a.length);
    if (by.length || w[0] !== 'main-objectives') return by;
    // An objective with no pin of its own (After the Fall): the game's pin whose check is the nearest to it.
    const has = (k) => k[0] === 'goal' && JSON.stringify(k[2]).includes(JSON.stringify(['quest', q]));
    const i = T.reduce((b, k, j) => (has(k) && (b < 0 || k[2].length < T[b][2].length) ? j : b), -1);
    return i >= 0 ? [['task:' + i]] : [];
  }
  function taskPin(g) {
    const marks = new Map((App.mapApi ? App.mapApi.list() : []).map((m) => [m.key, m]));
    const own = App.game(), done = new Set(own ? own.quests : []), taken = new Set((own && own.taken) || []);
    const rooms = (k) => (marks.get(k).scene ? away(marks.get(k).scene) : null);
    return (w, i) => {
      const q = wishQuest(w), from = q ? wishFrom(q, done).mark : null;
      const giver = from && marks.has(from) ? [from] : [];
      /* What it asks for on another layer, once the save has enough of it, is no more to find (Pale
         Oil held, three Mossberries, five fleas saved, twelve Void Masses): its marks drop out. */
      const met = new Set(own && q ? taskStages(q).flatMap(asksOf).filter((a) => (a.held ? ((own.carried || {})[a.save] || 0)
        : a.keys.filter((k) => marks.has(k) && marks.get(k).got).length) >= a.n).flatMap((a) => a.keys) : []);
      const left = taskTargets(w).map((s) => s.filter((k) => marks.has(k) && !(g && marks.get(k).got) && !met.has(k))).find((s) => s.length) || [];
      const isTaken = !!q && taskStages(q).some((s) => taken.has(s));
      /* A hunt taken and still short of what it asks (design/103, 1 A): the Journal's rooms of the
         enemies that give its thing (js/spots.js HUNTS, App.mapHuntKeys), nearest first as the rest. */
      const hunt = own && isTaken && ((SS.spots || {}).HUNTS || {})[q];
      const ask = hunt && ((QU.CHAIN[q] || {}).asks || []).find((a) => a.save === hunt[0]);
      const grounds = ask && ((own.carried || {})[hunt[0]] || 0) < ask.n && App.mapHuntKeys ? App.mapHuntKeys(q) : [];
      const keys = grounds.length ? grounds : !own ? (giver.length ? giver : left) : giver.length && !isTaken ? giver : left.length ? left : giver;
      if (!keys.length) return null;
      FOCUS.set('task:' + i, { keys: keys.map((k, n) => ({ k, n, d: rooms(k) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.n - b.n).map((e) => e.k),
        name: grounds.length ? t('mapHuntFocus', { wish: pick(w[4]) }) : pick(w[4]) });
      return 'task:' + i;
    };
  }

  /* How the 100% splits (design/75-progress-100-variants.html, 1 A): one line of a hundred, a
     stretch per category as wide as it's worth and lit as far as it's done, in a thin filigree
     frame with a diamond at each end; a hairline notch where each category ends, and a taller
     one with its diamonds where the Tools' half (the first category) ends. Its legend names each
     category with what it's worth. Self-contained (here and .pg-split in css/app.css): Albert
     asked for more designs of it, so it may be swapped. */
  function splitBar(cats) {
    const label = cats.map((x) => `${x.name} ${num(x.got)}/${num(x.max)}`).join(', ');
    const total = cats.reduce((a, x) => a + x.max, 0);
    return `<div class="pg-split-box"><div class="pg-split" role="img" aria-label="${esc(label)}"><div class="pg-split-track">${cats.map((x) =>
        `<span class="pg-split-seg" style="flex:${x.max}" title="${esc(`${x.name}: ${num(x.got)}/${num(x.max)}`)}"><i style="width:${(100 * x.got / x.max).toFixed(1)}%"></i></span>`).join('')}
        <span class="pg-split-half" style="left:${(100 * cats[0].max / total).toFixed(1)}%"></span></div></div>
        <ul class="pg-legend">${cats.map((x) => `<li>${esc(x.name)} <b>${num(x.max)}</b></li>`).join('')}</ul></div>`;
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
  // A person's name as the game titles them (js/people.js: PEOPLE, or TRADE for the couriers).
  const personName = (id) => { const p = SS.people && [...SS.people.PEOPLE, ...(SS.people.TRADE || [])].find((x) => x.id === id); return p ? pick(p.name) : id; };
  /* How each piece is had (the wiki's pages and the Caretaker's FSM): his sister and his uncle give
     theirs only once the wish is accepted. The uncle, the Bell Hermit, sits below Bellhart's Bellway
     (Belltown_basement): past its right side's hidden wall (a Remasker, walked through: the room has
     no breakable wall, whatever the guides say) and down its drop (bot1) into Belltown_basement_03,
     left of where you land (the wiki's Bell Hermit page agrees). The Seeker's Soul lies past Groal the Great; the Snare
     Setter past a ledge only the Faydown Cloak reaches (the completionist's prereqs). And its mark on the
     Map: a soul's (js/spots.js TASKS, what the wish asks for), the Snare Setter's as a Tool's. */
  const SNARE_HOW = {
    'Snare Soul Churchkeeper': () => t('roadPieceGiven', { npc: personName('churchkeeper') }),
    // Met first: his FSM gives the soul only once BelltownHermitMet is set (Do Snare Convo?).
    'Snare Soul Bell Hermit': () => [t('roadPieceGiven', { npc: personName('bell-hermit') }), t('roadHermitWay'), t('roadHermitMeet')].join(' · '),
    'Snare Soul Swamp Bug': () => t('roadPieceAfter', { foe: foeName('groal-the-great') }),
    'Silk Snare': () => t('roadPieceNeeds', { art: artName('faydown-cloak') }),
  };
  function snareMark(x) {
    if (x.kind === 'tool') { const id = Object.keys(CO.TOOLS).find((k) => CO.TOOLS[k].includes(x.save)); return id ? 'tools:' + id : null; }
    const held = JSON.stringify(['held', x.save]);
    const i = SS.spots ? SS.spots.TASKS.findIndex((k) => k[0] === 'qitem' && JSON.stringify(k[2]).includes(held)) : -1;
    return i >= 0 ? 'task:' + i : null;
  }
  // What the Caretaker says of each piece once the wish is taken (CARETAKER_SNARE_REPEAT_*).
  const SNARE_SAYS = { 'Snare Soul Churchkeeper': 'roadSays_churchkeeper', 'Snare Soul Bell Hermit': 'roadSays_hermit',
    'Snare Soul Swamp Bug': 'roadSays_swamp', 'Silk Snare': 'roadSays_snare' };
  const snareRow = (x) => ({ name: pick(x.name), got: x.ok, act: 2, area: SNARE_AREA[x.save] || null,
    how: SNARE_HOW[x.save] ? SNARE_HOW[x.save]() : '', mark: snareMark(x), says: SNARE_SAYS[x.save] ? says('caretaker', t(SNARE_SAYS[x.save])) : null });
  /* Where a wish is taken (js/quests.js FROM, the game's): its Wishwall, or else the NPC who offers
     it, as a room and as the Map's mark there (js/app-map.js: board:, giver:). A wish after another
     (prev) is taken where the first one not done yet is: the board's Pre, then the NPC it sends you to. */
  function wishFrom(quest, done) {
    let q = quest;
    while (q && QU.CHAIN[q] && QU.CHAIN[q].prev && !done.has(QU.CHAIN[q].prev)) q = QU.CHAIN[q].prev;
    const f = (q && QU.FROM[q]) || QU.FROM[quest] || {};
    const scene = f.board || (f.npc || [])[0] || null;
    return { scene, mark: scene ? (f.board ? 'board:' + scene.toLowerCase() : App.giverMark ? App.giverMark(q, scene) : 'giver:' + scene.toLowerCase()) : null };
  }
  const wishScene = (quest, done) => wishFrom(quest, done).scene;
  // The game's line under a wish's title (js/quests.js CHAIN loc: who asks for it, or where); a
  // step with none takes the one of the stage before it.
  const wishLoc = (q) => { for (let x = q; x && QU.CHAIN[x]; x = QU.CHAIN[x].prev) if (QU.CHAIN[x].loc) return pick(QU.CHAIN[x].loc); return ''; };
  /* What a wish asks to be brought (js/quests.js CHAIN asks, its targets in the game's files): the
     rosaries or shell shards a donation takes, the Journal's entries, or its things, n of each. A
     delivery's thing goes unsaid when it's all the wish asks (the wish is carrying it): the
     Courier's Rasher is said among the Great Gourmand's dishes. */
  function wishAsks(q) {
    const asks = (QU.CHAIN[q] && QU.CHAIN[q].asks) || [];
    const items = asks.filter((a) => a.kind === 'item' && (!a.delivery || asks.length > 1));
    return [...asks.map((a) => (a.kind === 'rosaries' ? t('roadAskRosaries', { n: num(a.n) }) : a.kind === 'shards' ? t('roadAskShards', { n: num(a.n) })
      : a.kind === 'journal' ? t('roadAskJournal', { n: num(a.n), journal: pick(item('hunters-journal').name) }) : '')),
    items.length ? t('roadAskItems', { items: items.map((a) => (a.n > 1 ? t('roadAskN', { n: num(a.n), item: pick(a.name) }) : pick(a.name))).join(', ') }) : '']
      .filter(Boolean).join(' · ');
  }
  /* What posts a required wish later than the rest, and what the point of Pinmaster's Oil also
     comes with (the wiki: the second Needle upgrade grants it, wish or not; the author's Steel
     Soul save has it complete, never accepted). Shown while the wish isn't done. Shakra's maps are
     the ones she sells (js/spots.js EXTRAS), counted in a save. The flags these wishes wait for
     are set as time passes (Assembly-CSharp, GameManager.TimePasses; a bench's rest is where it
     does, its Bench Control FSM's Save Game state), so each says the rest too:
       Trail's End      ShakraFinalQuestAppear: every map of Shakra's stock (Mapper Stock, type
                        flag 2) bought, and DefeatedSwampShaman (Groal) or 2 of the 3 melodies;
                        not while in the Belltown scene. The wish adds the Faydown Cloak.
       Bellhart's Glory citadelHalfwayComplete: the Cogwork Dancers, the Clawline (hasHarpoonDash)
                        or Songclave entered (visitedEnclave); and BelltownHouseState 1, set
                        once Restoration of Bellhart is done, away from Bellhart's map zone.
       Restoration      BelltownGreeterMetTimePassed, away from Bellhart's map zone.
       Strengthening    enclaveDonation2_Available (4 of Songclave's board done), not while in
                        Song_Enclave or Bellshrine_Enclave.
       Balm             shermaQuestActive, in TimePassesElsewhere: when the map zone differs
                        from the last rest's. */
  const SHAKRA_MAPS = SS.spots ? SS.spots.EXTRAS.filter((x) => x[0] === 'map' && x[5] && x[5].shop === 'shakra').map((x) => x[2][1].slice(3, -3)) : [];
  const OPENS = {
    'Shakra Final Quest': (g) => [t('roadOpensShakra', { npc: pick(HW.NPCS.shakra), art: artName('faydown-cloak'), foe: foeName('groal-the-great') }),
      g ? t('roadMapsBought', { n: num(SHAKRA_MAPS.filter((m) => (g.maps || []).includes(m)).length), of: num(SHAKRA_MAPS.length) }) : '',
      t('roadRestOut', { area: areaName('BELLHART') })],
    'Save Sherma': () => [t('roadOpensSherma', { npc: personName('sherma'), clave: areaName('ENCLAVE'), ward: areaName('WARD') }), t('roadRestAway')],
    'Songclave Donation 2': () => [t('roadOpensClave', { clave: areaName('ENCLAVE'), first: wishName('Songclave Donation 1') }),
      t('roadRestOut', { area: areaName('ENCLAVE') })],
    'Belltown House Start': () => [t('roadOpensTown', { npc: t('mapScrounge'), pavo: personName('bellhart-greeter') }), t('roadRestOut', { area: areaName('BELLHART') })],
    'Belltown House Mid': () => [t('roadOpensGlory', { foe: foeName('cogwork-dancers'), art: artName('clawline'), clave: areaName('ENCLAVE') }),
      t('roadRestOut', { area: areaName('BELLHART') })],
    'A Pinsmiths Tools': () => [t('roadPinOil', { npc: pick(HW.NPCS.plinney) })],
  };
  // A wish's quest (js/collectibles.js WISHES check): its own, or the first of several.
  const wishQuest = (w) => (w[2][0] === 'quest' ? w[2][1] : w[2][0] === 'any' ? (w[2].slice(1).find((c) => c[0] === 'quest') || [])[1] : null);
  // The three melodies the Cradle's way asks for (the pieces of kind 'melody').
  const melodies = (g) => (g ? CO.PIECES.filter((p, i) => p[0] === 'melody' && g.pieces.includes(i)).length : 0);

  /* ── Each step and row in the game's own words (design/28-progress-steps-variants.html, 1 A to
     5 A) ─────────────────────────────────────────────────────────────────────────────
     What the pane «Tareas» says of it (js/quests.js CHAIN desc, or ready once its targets are
     met), its Wishwall before it's taken (wall), the Inventory's line, the Journal's, or the
     Caretaker's directions; each tagged with where the game says it. A step the game has no word
     for (unlocking Silk and Soul, the caravan) has none: nothing is written by hand. */
  const TAG = { tasks: () => t('pgTasks'), wall: () => t('mapLayer_wishwall1'), inv: () => t('navGame'), journal: () => t('navJournal'),
    caretaker: () => t('roadCaretaker') };
  const says = (tag, text, name, loc) => (text ? { tag, text, name, loc } : null);
  const sayText = (v) => (typeof v === 'string' ? v : pick(v));
  /* A wish as the game shows it now: its first stage not done (a board's Pre, then the wish); taken
     (the save's IsAccepted, js/savefile.js taken), what «Tareas» says; else what its Wishwall says,
     when it's posted on one. */
  function wishSays(quest, g) {
    const done = new Set(g ? g.quests : []), taken = new Set((g && g.taken) || []);
    let q = quest;
    while (QU.CHAIN[q] && QU.CHAIN[q].prev && !done.has(QU.CHAIN[q].prev)) q = QU.CHAIN[q].prev;
    const e = QU.CHAIN[q] || {};
    return !taken.has(q) && e.wall ? says('wall', e.wall) : says('tasks', e.desc);
  }
  /* Lace atop the Cradle's tower: the objective Pharloom's Crown at its stage (its melodies, all
     three learned, the lift, Silk), as «Tareas» says it. */
  const LACE_STAGES = ['Citadel Ascent Melodies', 'Citadel Ascent Lift', 'Citadel Ascent Silk Defeat'];
  function laceSays(g) {
    const done = new Set(g ? g.quests : []);
    const q = LACE_STAGES.find((x) => !done.has(x)) || LACE_STAGES[0], e = QU.CHAIN[q];
    return e ? says('tasks', q === LACE_STAGES[0] && melodies(g) >= 3 && e.ready ? e.ready : e.desc) : null;
  }
  // A main objective's or a wish's card: its title and line, and what «Tareas» says (desc, or ready).
  const questSays = (q, k = 'desc') => { const e = QU.CHAIN[q]; return e ? { ...says('tasks', e[k] || e.desc, e.name, e.loc), icon: questIcon(q) } : null; };
  // A task's picture, as the pane «Tareas» draws it (taskIcon; design/79, 1 A).
  const questIcon = (q) => { const w = CO.WISHES.find((x) => wishQuest(x) === q); return w ? taskIcon(w) : null; };
  const STEP_SAYS = {
    bellshrines: (s) => questSays(s.quest || 'Grand Gate Bellshrines'),
    // The Bellshrines rung, the objective's own next line: back to the Grand Gate (and its Judge).
    'grand-gate': (s) => questSays(s.quest, 'ready'),
    citadel: () => questSays('Citadel Seeker'),
    /* No task yet (design/79, 4 A): the wish the step opens, its picture dim, with its name and
       place as «Tareas» will show them (Q_SOUL_SNARE_NAME, Q_SOUL_SNARE_LOC). */
    unlock: () => { const e = QU.CHAIN['Soul Snare Pre']; return e ? { name: e.name, loc: e.loc, icon: questIcon('Soul Snare Pre'), dim: true } : null; },
    offer: (s) => questSays(s.quest),
    pieces: () => questSays('Soul Snare'),
    // The pieces held, the wish's own next line: bring them to the Caretaker.
    ready: (s) => questSays(s.quest, 'ready'),
    silk: () => questSays('Silk Defeat Snare'),
  };

  // The other way in (design/90c): no objective names the Phantom, so its Journal entry says who it is.
  const journalSays = (id) => { const e = SS.journal && SS.journal.BOOK.find((x) => x.id === id); return e ? says('journal', e.desc, e.name) : null; };
  const ALT_SAYS = { phantom: () => journalSays('phantom') };

  /* Where a step is on the Map (design/28, 3 A): the marks still to do, in the order to go. The
     objectives' are the game's own map pins, found by their quest (js/spots.js TASKS 'goal'). */
  const goal = (q) => { const i = SS.spots ? SS.spots.TASKS.findIndex((k) => k[0] === 'goal' && k[1] === q) : -1; return i >= 0 ? 'task:' + i : null; };
  const lower = (x) => String(x || '').toLowerCase();
  const caretakerMark = () => { const f = QU.FROM['Soul Snare'] || {}; return f.npc && f.npc[0] ? 'giver:' + lower(f.npc[0]) : null; };
  // Pavo, who gives the Bellhome's key, where the Map has him (js/people.js).
  const PAVO = (() => { const p = SS.people && SS.people.PEOPLE.find((x) => x.id === 'bellhart-greeter'); return p && p.spots[0] ? 'npc:bellhart-greeter:' + lower(p.spots[0][0]) : null; })();
  function stepMarks(r, s, g) {
    const of = {
      bellshrines: () => s.shrines.filter((b) => !(g && b.ok)).map((b) => 'bell:' + b.field),
      'grand-gate': () => [goal(s.quest), 'boss:last-judge'],
      phantom: () => ['boss:phantom'],
      citadel: () => [goal('Citadel Seeker')],
      offer: () => [caretakerMark(), QU.FROM[s.quest] && QU.FROM[s.quest].board ? 'board:' + lower(QU.FROM[s.quest].board) : null],
      ready: () => [caretakerMark()],
      silk: () => [goal('Silk Defeat Snare')],
    }[s.id];
    /* A step of several things: what's next of it with a place on the Map, each wish where it
       stands now, as its row's pin (rowKeys): the union of their marks, one focus. */
    const keys = of ? of() : todo(r, s, parts(r, s, g)).flatMap((x) => (x.opts ? x.opts : [x])).flatMap(rowKeys);
    // The nearest to the bench first, in rooms (each mark's room on the Map), the rest as they come.
    const marks = App.mapApi ? App.mapApi.list() : [];
    const roomsAway = (k) => { const m = marks.find((x) => x.key === k); return m && m.scene ? away(m.scene) : null; };
    return [...new Set(keys)].filter((k) => k && App.mapHas && App.mapHas(k)).map((k, i) => ({ k, i, d: roomsAway(k) }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.i - b.i).map((e) => e.k);
  }
  // The Map's way for a step (App.mapFocus, js/app-map.js), kept by the step's road and id for the click.
  const FOCUS = new Map();
  function mapLink(r, s, keys) {
    if (!keys.length) return '';
    FOCUS.set(r.act + ':' + s.id, { keys, name: stepShort(r, s) });
    return `<button type="button" class="text-btn pg-says-map" data-act="pgFocus" data-value="${r.act}:${s.id}">${App.pin}<span>${esc(keys.length > 1 ? t('pgMapN', { n: num(keys.length) }) : t('mapOnMap'))}</span></button>`;
  }
  /* A task's card has its picture beside its words (design/79, 1 A to 5 A): 48 px under the step's
     heading, 32 in the whole road and a step opened; dim when it's the wish the step opens. */
  function saysHtml(x) {
    const words = `<p class="pg-says-k">${x.tag ? `<span class="pg-says-tag">${esc(TAG[x.tag]())}</span>` : ''}${x.name ? `<span class="pg-says-name"${NT}>${esc(pick(x.name))}</span>` : ''}${x.loc
      ? `<span class="pg-says-loc"${NT}>${esc(pick(x.loc))}</span>` : ''}</p>${x.text ? `<p class="pg-says-d"${NT}>${esc(sayText(x.text))}</p>` : ''}`;
    return x.icon ? `<div class="pg-says-task"><span class="pg-says-art${x.dim ? ' is-dim' : ''}" aria-hidden="true"><img src="${x.icon}" alt="" loading="lazy"></span><div>${words}</div></div>` : words;
  }
  // A step's card (1 A): under its heading, what the game says of it and its way onto the Map.
  function stepCard(r, s, g, cls = '') {
    const say = s.alt ? ALT_SAYS[s.id] : STEP_SAYS[s.id];
    const x = say ? say(s) : null, map = mapLink(r, s, stepMarks(r, s, g));
    return x || map ? `<div class="pg-says${x && x.text ? '' : ' is-line'}${cls}">${x ? saysHtml(x) : ''}${map}</div>` : '';
  }
  // A row's own words (4 A), folded under «Lo que dice el juego».
  function saysRow(x) {
    if (!x || !x.text) return '';
    const id = 'pg-says-' + (++howN);
    return `<span class="pg-says-row"><button type="button" class="text-btn pg-says-btn" data-act="pgSays" aria-expanded="false" aria-controls="${id}">${esc(t('pgSays'))}${App.chevron(false)}</button>
        <span class="pg-says-q" id="${id}" hidden><span class="pg-says-tag">${esc(TAG[x.tag]())}</span> <span${NT}>${esc(sayText(x.text))}</span></span></span>`;
  }

  /* A wish of a group as a row: its Act and area (the pane's, js/collectibles.js WISHES; with none
     there, the area it's taken in), the room it's taken in and its mark on the Map, who asks for it
     (the game's line), what it asks to be brought and what posts it, half a point when it's worth
     that, and the wishes to do before it. Its pin is the Tasks tab's own for it (taskPin): the Map
     on where the wish stands now, its step's targets once taken. */
  function wishRow(x, got, done, g, pin) {
    const w = x.wish >= 0 ? CO.WISHES[x.wish] : null;
    const runt = HW.TRAPS.find((r) => r.id === 'broodfeast-runt');
    const from = wishFrom(x.quest, done);
    const sub = [x.value === 0.5 ? t('roadHalf') : '', !got && x.before.length ? t('roadBefore', { name: x.before.map(wishName).join(', ') }) : '',
      !got && runt && x.quest === runt.counts ? t('roadRunt') : ''];
    // Who asks and what it asks lead; what posts it follows (folded on a phone, design/41, 2 B).
    const how = got ? '' : [wishLoc(x.quest), wishAsks(x.quest)].filter(Boolean).join(' · ');
    const more = got ? [] : (OPENS[x.quest] ? OPENS[x.quest](g) : []).filter(Boolean);
    return { name: x.name ? pick(x.name) : w ? pick(w[4]) : x.quest, got, act: w ? w[1] : 0, area: (w && w[3]) || (from.scene && R.areaOf(from.scene)) || null,
      scene: from.scene, mark: from.mark, focus: !got && w && pin ? pin(w, x.wish) : null, sub, how, more, wish: x.wish, value: x.value, says: got ? null : wishSays(x.quest, g) };
  }
  function groupRows(name, g, required) {
    // cur: the game the Tasks tab reads (a save, Free mode's marks or none), so the pins agree.
    const done = new Set(g ? g.quests : []), pin = taskPin(cur);
    return QU.GROUPS[name].quests.filter((q) => q.required === required)
      .map((q) => wishRow(A.missing(q.quest, done, required ? undefined : q.value), done.has(q.quest), done, g, pin)).sort(byAct);
  }
  /* The caravan, while it isn't in Fleatopia (js/acts.js LEGS, caravanOf): its next move, from the
     stop it's at, with the fleas that move asks and the rest of what it asks not met yet (the
     Last Judge and the Grand Gate to leave Greymoor, the empty Pale Lake to leave the Blasted
     Steps, and at both, a bench's rest away from the stop once Mooshka has been met there); a slot
     kept before the site read those flags lists them all. Without a save, the three moves' rule. */
  const STOP = ['BONEFOREST', 'GREYMOOR', 'CORAL_STEPS'];
  // { how, more }: the next move's fleas, then what else it asks.
  function caravanHow(c, g) {
    const npc = pick(HW.NPCS.mooshka), judge = foeName('last-judge'), gate = gateOf({});
    const lake = { lake: t('roadPaleLake'), ducts: areaName('AQUEDUCTS') };
    if (!g || !c) {
      const [a, b, d] = A.LEGS.map((l) => num(l.fleas));
      return { how: t('roadCaravanRule', { npc, a, b, c: d, s0: areaName(STOP[0]), s1: areaName(STOP[1]), s2: areaName(STOP[2]) }),
        more: [t('roadCaravanRuleJudge', { at: areaName(STOP[1]), judge, gate }), t('roadCaravanRuleLake', { at: areaName(STOP[2]), ...lake }),
          t('roadCaravanRuleRest', { a: areaName(STOP[1]), b: areaName(STOP[2]), npc })] };
    }
    const at = areaName(STOP[c.at]);
    const ask = { judge: () => t('roadCaravanJudge', { judge }), gate: () => t('roadCaravanGate', { gate }),
      lake: () => t('roadCaravanLake', lake), rest: () => t('roadCaravanRest', { npc, at }) };
    const words = { n: num(c.fleas), need: num(c.need), from: at, to: c.at + 1 < STOP.length ? areaName(STOP[c.at + 1]) : t('roadFleatopia'), npc };
    return { how: t(c.fleas >= c.need ? 'roadCaravanEnough' : 'roadCaravanHow', words),
      more: c.asks.filter((x) => x.ok !== true).map((x) => ask[x.id]()) };
  }
  const count = (got, max) => `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>`;
  /* The Soul Snare's four checks on the save (js/acts.js): the caravan, the Faydown Cloak, Lace
     beaten atop the Cradle's tower (defeatedLaceTower: set in Song_Tower_01, the Cradle's) and the
     Bellhome's key, with what each still asks. Pavo's FSM (Belltown Greeter NPC, Convo) gives the
     key at BelltownHouseState 2, set once Bellhart's Glory is done, as time passes away from
     Bellhart's map zone (GameManager.TimePasses), and never while she wears the Cursed Crest
     (IsAnyCursed): the row says both. */
  function checkRows(unlock, g) {
    const test = (id) => unlock.tests.find((x) => x.id === id);
    const key = test('bellhomeKey').key;
    const fay = CO.WHERE.arts['faydown-cloak'] || [];
    return [
      { test: 'caravan', name: t('roadCaravan'), got: test('caravan').ok, icon: 'assets/benches/caravan.png', ...(test('caravan').ok ? {} : caravanHow(test('caravan').caravan, g)) },
      { test: 'doubleJump', name: artName('faydown-cloak'), got: test('doubleJump').ok, act: fay[0], area: fay[1], icon: 'assets/icons/arts/faydown-cloak.webp', mark: 'arts:faydown-cloak',
        says: says('inv', D.ARTS.find((x) => x.id === 'faydown-cloak').desc) },
      { test: 'laceTower', name: t('roadLace'), got: test('laceTower').ok, act: 2, area: 'CRADLE', icon: PORTRAIT('lace'), mark: 'boss:lace-the-cradle',
        how: test('laceTower').ok ? '' : t('roadMelodies', { n: num(melodies(g)) }), says: laceSays(g) },
      { test: 'bellhomeKey', ready: key.ready && !key.cursed, name: t('roadKey'), got: test('bellhomeKey').ok, act: 2, area: 'BELLHART', icon: 'assets/benches/bellhome.png', mark: PAVO,
        how: test('bellhomeKey').ok ? '' : key.ready ? t(key.cursed ? 'roadKeyCursed' : 'roadPavo', { pavo: personName('bellhart-greeter') }) : t('roadKeyRule', { glory: wishName('Belltown House Mid'), n: num(key.need) }),
        more: test('bellhomeKey').ok ? [] : [t('roadKeyRest', { glory: wishName('Belltown House Mid'), town: areaName('BELLHART'), pavo: personName('bellhart-greeter') })], says: says('inv', t('roadKeyDesc')) },
    ].map((x) => ({ act: 0, area: null, ...x }));
  }

  /* Each step by what it asks, read from its id (js/acts.js next()), so a step the road gains or
     loses keeps its words: its title (the whole road's, and the heading of the step you're on), and
     a short name for the thread, as what to do (design/40-progress-clarity-variants.html, 3 A). */
  const wishOf = (r) => { const o = r.steps.find((x) => x.id === 'offer'); return wishName(o ? o.quest : 'Soul Snare Pre'); };
  const gateOf = (s) => pick(QU.CHAIN[s.quest || 'Grand Gate Bellshrines'].name);
  const TITLE = {
    bellshrines: () => t('roadBells'), 'grand-gate': (r, s) => t('roadGate', { gate: gateOf(s), judge: foeName('last-judge') }),
    citadel: () => t('roadCitadel'), phantom: () => t('roadPhantom', { phantom: foeName('phantom') }),
    unlock: (r) => t('roadUnlock', { wish: wishOf(r) }),
    offer: (r) => t('roadOffer', { wish: wishOf(r), caretaker: t('roadCaretaker'), town: areaName('BELLHART'), clave: areaName('ENCLAVE') }),
    pieces: () => t('roadPieces'), ready: () => t('roadReady', { caretaker: t('roadCaretaker'), clave: areaName('ENCLAVE') }), silk: () => t('roadSilk'),
  };
  const SHORT = {
    bellshrines: () => t('pgStepBells'), 'grand-gate': (r, s) => t('pgStepGate', { gate: gateOf(s) }),
    citadel: () => t('roadCitadel'), phantom: () => t('roadPhantom', { phantom: foeName('phantom') }),
    unlock: (r) => t('pgStepUnlock', { wish: wishOf(r) }), offer: () => t('pgStepOffer'), pieces: () => t('pgStepSnare'),
    ready: () => t('pgStepReady', { caretaker: t('roadCaretaker') }), silk: () => t('pgStepSilk', { silk: foeName('grand-mother-silk') }),
  };
  const stepTitle = (r, s) => (TITLE[s.id] ? TITLE[s.id](r, s) : s.id);
  const stepShort = (r, s) => (SHORT[s.id] ? SHORT[s.id](r, s) : stepTitle(r, s));
  const stepAt = (r) => r.steps.findIndex((x) => !x.ok && !x.bypassed);
  /* In Act 3, the endings (Albert, then design/40, 1 A: the Acts are on top of the tab now), lit the
     ones this save has seen (js/savefile.js ENDINGS), named as the game names them. They aren't a
     sequence: the thread under them stays unlit. An Act 2 ending never seen is closed for good once
     the snare has taken her (the wiki's Endings): in Act 3 it's crossed out, «closed» under it, and
     the ring and the tab's card count only the ones still within reach (design/41, 1 A). */
  function endsOf(g) {
    const E = SS.savefile.ENDINGS, seen = new Set(g.endings || []);
    const shut = g.act >= 3 ? E.filter((e) => !seen.has(e.id) && (e.bit === 1 || e.bit === 2)) : [];
    return { E, seen, shut, of: E.length - shut.length };
  }
  function journeyEnds(g) {
    const { E, seen, shut } = endsOf(g);
    return `<div class="pg-journey is-game" style="--n:${E.length}">
        <ol class="pg-journey-steps">${E.map((e) => `<li class="is-ending${seen.has(e.id) ? ' is-done' : ''}${shut.includes(e) ? ' is-shut' : ''}"><i aria-hidden="true"></i><span${NT}>${esc(t('ending_' + e.key))}${shut.includes(e)
          ? `<small translate="yes">${esc(t('pgShut'))}</small>` : ''}</span></li>`).join('')}</ol>
      </div>`;
  }
  /* Where you are, over the tabs (design/40-progress-clarity-variants.html, 1 A): the three Acts as
     the game titles them (ACT_n_SUPER, ACT_n_NAME), yours marked, and one sentence: what the next
     Act asks, or what's left of the 100%. Without a save, what the tab is. */
  function actsTop(own, next, c, sum) {
    const act = own ? own.act : 0;
    const full = !!(own && c && c.total >= 100);
    let line;
    if (!own) line = marking ? `<strong>${esc(t('pgHereFreeK'))}</strong> ${esc(t('pgHereFree'))}` : esc(t('pgHereNone'));
    else if (next) {
      const at = stepAt(next);
      // What's left of the step, as its rings count it (a point short is one); a step of one thing, just its number.
      const left = sum ? Math.max(0, Math.ceil(sum.of - sum.got)) : 0;
      line = `<strong>${esc(t('pgHereAct', { n: num(act) }))}</strong> ${esc(t(sum && sum.of > 1 ? 'pgHereNext' : 'pgHereStep',
        { m: num(next.act), of: num(next.steps.length), i: num(at + 1), n: num(left) }))}`;
    } else if (full) line = `<strong>${esc(t('pgHereFull'))}</strong>`;
    else line = `<strong>${esc(t('pgHereAct', { n: num(act) }))}</strong> ${esc(t('pgHere100', { pct: num(Math.max(0, 100 - c.total)) + App.pctSpace() }))}`;
    const f = !own ? 0 : act <= 1 ? 0 : act === 2 ? 50 : 100;
    const acts = [1, 2, 3].map((n) => {
      const cls = !own ? '' : n < act || (full && n === 3) ? 'is-done' : n === act ? 'is-cur' : '';
      return `<li class="${cls}"${cls === 'is-cur' ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span${NT}>${esc(t('saveAct', { n: num(n) }))}<small>${esc(t('pgActName' + n))}</small>${cls === 'is-cur' ? `<em>${esc(t('pgHere'))}</em>` : ''}</span></li>`;
    }).join('');
    return `<div class="pg-acts"><div class="pg-journey" style="--n:3;--f:${f}%"><ol class="pg-journey-steps">${acts}</ol></div><p class="pg-here">${line}</p></div>`;
  }

  /* ── What's left, drawn (design/03-redesign.md, step 5) ──────────────
     The step you're on in its parts (parts(): the wishes it requires, its points, its checks…),
     counted in one line on the route (routeParts()); the rings stay for Act 3's «Your game»
     (gameHtml()). The pictures are the game's: the map's quest medallions (assets/map/pins), the
     Journal's portraits, the benches, the wishes' type emblems (assets/icons/wishes,
     tools/extract-wish-icons.py). */
  const QUEST = (n) => `assets/map/pins/quest_map_icon_${n}.webp`;
  const PORTRAIT = (id) => `assets/icons/journal/${id}.webp`;
  const BOARD = 'assets/icons/wishes/board.webp';
  const WISH_ICON = new Set(['wayfarer', 'gather', 'donate', 'hunt', 'grand-hunt', 'delivery', 'learn', 'sprint', 'witness', 'steel']);
  const wishArt = (i) => { const ty = i >= 0 ? CO.WISHES[i][0] : null; return WISH_ICON.has(ty) ? `assets/icons/wishes/${ty}.webp` : BOARD; };
  const STEP_ART = { bellshrines: QUEST('songshrines'), 'grand-gate': PORTRAIT('last-judge'), phantom: PORTRAIT('phantom'),
    citadel: QUEST('citadel_seeker'), unlock: BOARD, offer: QUEST('snare'), pieces: QUEST('citadel_seeker'), ready: QUEST('act3_finale'),
    silk: PORTRAIT('grand-mother-silk') };
  // Half a point shows as such: 16,5.
  const pts = (n) => (Number.isInteger(n) ? num(n) : App.NF[1].format(n));
  /* A medallion: { name, icon, badge?, sub?, mark?, plain? } (plain: a name the site wrote, so a
     browser translator may translate it). */
  function medal(x) {
    const onMap = x.mark && App.mapHas && App.mapHas(x.mark);
    return `<li class="pg-md"><span class="pg-md-art"><img src="${x.icon}" alt="" loading="lazy">${x.badge ? `<span class="pg-md-badge">${esc(x.badge)}</span>` : ''}</span>
        ${onMap ? `<button type="button" class="pg-md-pin" data-act="mapShow" data-value="${esc(x.mark)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : ''}
        <span class="pg-md-name"${x.plain ? '' : NT}>${esc(x.name)}</span>${x.sub ? `<span class="pg-md-sub">${esc(x.sub)}</span>` : ''}</li>`;
  }
  // A ring: { label, icon, got, of, items (the missing ones), more? }.
  function ring(r) {
    const p = r.of ? Math.min(100, (r.got / r.of) * 100) : 0;
    return `<section class="pg-rg${r.got >= r.of ? ' is-done' : ''}"><span class="pg-ring pg-rg-ring" style="--p:${p.toFixed(1)}" aria-hidden="true"><img src="${r.icon}" alt="" loading="lazy"></span>
        <p class="pg-rg-n"><b>${pts(Math.min(r.got, r.of))}</b><span class="u">/${num(r.of)}</span></p><h4 class="pg-rg-k">${esc(r.label)}</h4>
        ${r.after ? `<p class="pg-rg-after">${esc(r.after)}</p>` : ''}${r.items.length ? `<ul class="pg-mds">${r.items.map(medal).join('')}${r.more ? `<li class="pg-md-more">+${num(r.more)}</li>` : ''}</ul>` : ''}</section>`;
  }
  /* The step you're on, in its parts (design/03-redesign.md, step 5, E): the wishes it requires,
     its points, its checks; the Bellshrines; the snare's pieces. Each a ring for the summary on
     top, and its rows (the 100% tab's own: group(), row()) for the list under it, with its goal
     in words and how much is left. A step of one thing is its ring alone. */
  function parts(r, s, g) {
    const part = (id, label, icon, got, of, rows) => ({ id, label, icon, got: Math.min(got, of), of, rows });
    // A wish's picture is its type's emblem; what it waits for goes under its name.
    // Half a point leads with the rest; the wish to do first and the runt's warning follow.
    const wishes = (rows) => rows.map(({ sub, ...x }) => ({ ...x, icon: wishArt(x.wish), how: [x.how, sub[0]].filter(Boolean).join(' · '),
      more: [...x.more, ...sub.slice(1)].filter(Boolean) }));
    if (s.id === 'bellshrines') {
      return [part('shrines', t('pgShrines'), STEP_ART.bellshrines, s.done, s.total, s.shrines.map((b) => ({ name: pick(b.name), got: b.ok, act: 1, icon: STEP_ART.bellshrines, mark: 'bell:' + b.field })))];
    }
    if (s.id === 'unlock') {
      const points = wishes(groupRows('Soul Snare', g, false));
      return [
        part('required', t('roadRequired'), BOARD, s.required.done, s.required.total, wishes(groupRows('Soul Snare', g, true))),
        part('points', t('pgPoints'), QUEST('snare'), s.points.got, s.points.need, points),
        part('checks', t('roadFour'), 'assets/benches/bellhome.png', s.tests.filter((x) => x.ok).length, s.tests.length, checkRows(s, g)),
      ];
    }
    if (s.id === 'pieces') {
      return [part('snare', t('roadSnare'), STEP_ART.pieces, s.done, s.total, s.pieces.map((x) => ({ ...snareRow(x), icon: QUEST('snare') })))];
    }
    return [part(s.id, stepShort(r, s), STEP_ART[s.id] || BOARD, s.done, s.total, [])];
  }
  // A step's parts at once: what the tab's card counts, in the rings' own units.
  const partsSum = (ps) => ps.reduce((a, p) => ({ got: a.got + p.got, of: a.of + p.of }), { got: 0, of: 0 });
  // The Act tab with a save before Act 3: the road as the whole route (routeHtml).
  const actHtml = (r, g) => routeHtml(r, g);
  /* The road to the next Act as the whole route (design/83, A in all four; Act 3's, design/84): the
     road's thread down the page,
     a station per step (done ones lit and ticked, the one you're on larger, «You are here»), each
     opening to what the game says of it and its way onto the Map; the one you're on opens on its
     list of what's left too, its count on its line (no ring), and a step of one thing doesn't repeat
     its title as a list. It ends at the Act it opens, named as the Acts on top name it. A step's
     open or shut is kept while the page is (routeOpen), the one you're on open at first. */
  const routeOpen = new Map();
  /* A part's count: what it asks in the guide, ticked when met. */
  const partCount = (p, g) => (!g ? `<span class="pg-count"><i class="u">${num(p.of)}</i></span>` : p.got >= p.of
    ? `<span class="pg-count"><span class="pg-mark">${App.tick}</span> <b>${pts(p.of)}</b><i class="u">/${num(p.of)}</i></span>` : count(p.got, p.of));
  /* What the step you're on asks, said once (design/84, 2 A); its parts head its list (todoHtml,
     design/103, 2 A). */
  function routeParts(r, s, g) {
    const say = s.id === 'unlock' ? t('roadAllThree', { caretaker: t('roadCaretaker'), wish: wishOf(r) })
      : s.id === 'offer' ? offerNote(s, g) : s.id === 'silk' ? t('roadSilkNote', { twisted: t('ending_D') }) : '';
    /* The Cursed Crest worn blocks the road to Act 3 (js/acts.js cursed): Pavo's FSM keeps the key,
       the couriers' (Couriers Quest Giver, Shop?: the Cursed Crest equipped) give no deliveries, and
       Grand Mother Silk's Death Type state ends a cursed fight in Twisted Child. Its cure is the
       wish Infestation Operation (Doctor Curse Cure). */
    const warn = r.cursed ? `<p class="pg-note is-warn">${esc(t('roadCursed', { cure: wishName('Doctor Curse Cure'), pavo: personName('bellhart-greeter'),
      couriers: personName('couriers'), silk: foeName('grand-mother-silk'), twisted: t('ending_D') }))}</p>` : '';
    return warn + (say ? `<p class="pg-lead">${esc(say)}</p>` : '');
  }
  /* The other way in beside the road (design/90c, 1 A): the Phantom's station, framed, before the
     step it leads back to, on a second thread that parts from the road before its first step and
     joins it there again; an «or» between the two threads, level with it. Lit once taken (the
     steps it skips crossed out on a faint thread), dashed while it's open, dotted while it isn't. */
  function wayHtml(r, w, g, guide) {
    const key = (guide ? 'guide:' : '') + r.act + ':' + w.id, done = !guide && w.ok;
    const open = routeOpen.has(key) ? routeOpen.get(key) : false;
    const n = w.skips.map((id) => num(r.steps.findIndex((x) => x.id === id) + 1)), ab = { a: n[0], b: n[n.length - 1] };
    const gate = gateOf(r.steps.find((x) => x.id === 'grand-gate') || {});
    const lead = guide ? t('roadAltGuide', ab) : done ? t('roadAltDone', { gate }) : t(w.open ? 'roadAltOpen' : 'roadAltShut', ab);
    const needs = done ? '' : `<span class="pg-rt-needs"><span class="pg-rt-pk">${esc(t('roadNeeds'))}</span>${w.needs.map((x) => `<span class="${guide || x.ok ? 'is-on' : 'is-off'}"><img src="assets/icons/arts/${x.id}.webp" alt="" loading="lazy"><span${NT}>${esc(artName(x.id))}</span>${!guide && x.ok
      ? `<span class="pg-mark">${App.tick}</span><span class="sr-only">${esc(t('pgGot'))}</span>` : ''}</span>`).join('')}</span>`;
    const x = { ...w, alt: true };
    const says = done && ALT_SAYS[w.id] ? ALT_SAYS[w.id](x) : null;
    const body = open ? `<div class="pg-rt-body">${done ? (says ? `<div class="pg-says">${saysHtml(says)}</div>` : '') : stepCard(r, x, g)}</div>` : '';
    return `<li class="pg-rt-st is-alt${done ? ' is-done' : guide ? '' : ' is-later'}">
          <h3 class="pg-rt-h"><span class="pg-rt-dia" aria-hidden="true"></span><span class="pg-rt-or" aria-hidden="true">${esc(t('roadOr'))}</span><button type="button" class="pg-rt-open" data-act="pgRoute" data-value="${key}" aria-expanded="${open}">
            <img class="pg-rt-art" src="${STEP_ART[w.id] || BOARD}" alt="" loading="lazy">
            <span class="pg-rt-t"><span class="pg-rt-k">${esc(t('roadInstead', ab))}</span><span class="pg-rt-name">${esc(stepTitle(r, w))}</span><span class="pg-rt-sub">${esc(lead)}</span>${needs}</span>
            <span class="pg-rt-n">${done ? `<span class="pg-mark">${App.tick}</span><span class="sr-only">${esc(t('pgPeekDone'))}</span>` : ''}</span><span class="disc-ring">${App.chevron(open)}</span></button></h3>${body}<span class="pg-rt-join" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M100 0 C100 50 0 50 0 100" vector-effect="non-scaling-stroke"/></svg></span></li>`;
  }
  function routeHtml(r, g) {
    // Without a save it's the guide: no step is yours, each says how much it asks and opens on all
    // of it, every station shut at first (their open or shut kept apart from a save's: 'guide:').
    const guide = !g;
    const at = guide ? -1 : stepAt(r);
    const stale = !guide && !g.quests.length && g.wishes.length;
    const ways = r.alt || [];
    const beside = new Set(ways.flatMap((w) => w.skips));
    const stations = r.steps.map((s, i) => {
      const key = (guide ? 'guide:' : '') + r.act + ':' + s.id, done = !guide && s.ok, skipped = !guide && !s.ok && !!s.bypassed, cur = i === at;
      const open = routeOpen.has(key) ? routeOpen.get(key) : cur;
      const ps = cur || guide ? parts(r, s, g) : [];
      // Yours counts as its parts do, as the tab's card does (a wish point short is one); in the guide, what it asks.
      const sum = partsSum(ps);
      const mark = done ? `<span class="pg-mark">${App.tick}</span><span class="sr-only">${esc(t('pgPeekDone'))}</span>`
        : guide && sum.of > 1 ? `<span class="pg-count"><i class="u">${num(sum.of)}</i></span>` : cur && sum.of > 1 ? count(Math.floor(sum.got), sum.of) : '';
      let body = '';
      if (open) {
        const one = ps.length === 1 && !ps[0].rows.length;
        // A step done or skipped keeps the game's words, without the way onto the Map (as a step peeked at did).
        const x = (done || skipped) && STEP_SAYS[s.id] ? STEP_SAYS[s.id](s) : null;
        body = `<div class="pg-rt-body">${done || skipped ? (x ? `<div class="pg-says">${saysHtml(x)}</div>` : '') : stepCard(r, s, g)}${cur && stale ? `<p class="pg-note is-warn">${esc(t('roadStale'))}</p>` : ''}${cur || guide ? routeParts(r, s, g) : ''}${ps.length && !one ? todoHtml(r, s, ps, g) : ''}</div>`;
      }
      const li = `<li class="pg-rt-st${done ? ' is-done' : skipped ? ' is-skipped' : cur ? ' is-cur' : guide ? '' : ' is-later'}${beside.has(s.id) ? ' is-beside' : ''}"${cur ? ' aria-current="step"' : ''}><span class="pg-rt-dia" aria-hidden="true"></span>
          <h3 class="pg-rt-h"><button type="button" class="pg-rt-open" data-act="pgRoute" data-value="${key}" aria-expanded="${open}">
            <img class="pg-rt-art" src="${STEP_ART[s.id] || BOARD}" alt="" loading="lazy">
            <span class="pg-rt-t"><span class="pg-rt-k">${esc(t('pgPeekStep', { n: num(i + 1) }))}${cur ? `<em>${esc(t('pgHere'))}</em>` : ''}</span>
              <span class="pg-rt-name">${esc(stepTitle(r, s))}</span>${skipped ? `<span class="pg-rt-sub">${esc(t('roadBypassed', { phantom: foeName('phantom') }))}</span>` : ''}</span>
            <span class="pg-rt-n">${mark}</span><span class="disc-ring">${App.chevron(open)}</span></button></h3>${body}</li>`;
      // The other ways go just before the step they lead back to.
      return ways.filter((w) => w.joins === s.id).map((w) => wayHtml(r, w, g, guide)).join('') + li;
    }).join('');
    // Where the threads part: before the first step, when the road has another way in.
    const lane = !ways.length ? '' : guide ? ' is-alt-open' : ways.some((w) => w.ok) ? ' is-alt-lit' : ways.some((w) => w.open) ? ' is-alt-open' : ' is-alt-shut';
    const start = ways.length ? `<li class="pg-rt-start${guide ? '' : ' is-done'}"><span class="pg-rt-dia" aria-hidden="true"></span><p class="pg-rt-h"><span class="pg-rt-t"><span class="pg-rt-k">${esc(t('roadTwoWays'))}</span>
        <span class="pg-rt-name">${esc(t('roadFromTo', { from: t('homeKingdom') }))}</span></span></p><span class="pg-rt-fork" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 0 C0 50 100 50 100 100" vector-effect="non-scaling-stroke"/></svg></span></li>` : '';
    const end = `<li class="pg-rt-end"><span class="pg-rt-dia" aria-hidden="true"></span><p class="pg-rt-h"><span class="pg-rt-t"><span class="pg-rt-k">${esc(t('pgRouteEnd'))}</span>
        <span class="pg-rt-name"${NT}>${esc(t('saveAct', { n: num(r.act) }))} · ${esc(t('pgActName' + r.act))}</span></span></p></li>`;
    return `<ol class="pg-rt${ways.length ? ' has-alt' + lane : ''}">${start}${stations}${end}</ol>`;
  }

  /* What's next (design/40, 2 A), the step's one list (design/82, 1 A): what the step still lacks,
     as numbered things to do, read from its parts' rows: each wish it requires, the wish points short
     (with the nearest wishes that would give them, the rest unfolding), each condition, Bellshrine or
     piece of the snare; a step of one thing, its title. Each with its picture, its place and the
     Map's pin. With «Everything» (prefs.pgAll, the 100% tab's own toggle), what's done too, ticked in
     its place, and the wishes that gave points among the options. A step of several parts lists each
     under its part's head (design/103, 2 A), its rows named bare: the head says what they are. */
  const byNear = (rows) => rows.map((x, i) => ({ x, i, d: dist(x) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.i - b.i).map((e) => e.x);
  function todo(r, s, ps, all) {
    const out = [], heads = ps.length > 1;
    for (const p of ps) {
      const left = p.rows.filter((x) => !x.got);
      if (p.id === 'points') {
        // Met, its head says so; with no heads, a done row in its place.
        if (p.got >= p.of) { if (all && !heads) out.push({ part: p.id, name: p.label, icon: p.icon, done: true }); continue; }
        const known = left.some((x) => dist(x) != null);
        out.push({ part: p.id, name: t('pgTodoPoints', { n: pts(p.of - p.got) }), icon: p.icon, how: t(known ? 'pgTodoAnyNear' : 'pgTodoAny', { n: num(left.length) }),
          opts: byNear(left), had: all ? p.rows.filter((x) => x.got) : [] });
        continue;
      }
      if (!p.rows.length) { if (p.got < p.of) out.push({ part: p.id, name: stepTitle(r, s), icon: p.icon }); continue; }
      for (const x of all ? p.rows : left) {
        const ready = !x.got && x.test === 'bellhomeKey' && x.ready;
        const name = ready ? t('pgTodoPavo', { key: x.name }) : heads ? x.name
          : p.id === 'shrines' ? t('pgTodoShrine', { area: x.name })
          : p.id === 'snare' ? t('pgTodoGet', { name: x.name }) : x.name;
        out.push({ ...x, part: p.id, name, done: x.got, ...(ready ? { how: '' } : {}), area: p.id === 'shrines' ? null : x.area });
      }
    }
    return out;
  }
  /* A row's how (design/103, 1 A): its lead on one line, «More» at its end unfolding what it waits
     for and what the game says of it (pgFold). */
  function foldHtml(how, more = [], says = null) {
    const q = says && says.text ? says : null;
    if (!more.length && !q) return how ? `<span class="pg-how">${esc(how)}</span>` : '';
    const id = 'pg-fold-' + (++howN);
    return `<span class="pg-how">${how ? esc(how) + ' · ' : ''}<button type="button" class="text-btn pg-fold-btn" data-act="pgFold" aria-expanded="false" aria-controls="${id}">${esc(t('pgFold'))}${App.chevron(false)}</button></span>
        <span class="pg-fold" id="${id}" hidden>${more.map((m) => `<span>${esc(m)}</span>`).join('')}${q
          ? `<span class="pg-says-q"><span class="pg-says-tag">${esc(TAG[q.tag]())}</span> <span${NT}>${esc(sayText(q.text))}</span></span>` : ''}</span>`;
  }
  const OPTS = 4;   // the nearest wishes for points shown before «and n more»
  let todoN = 0;    // each list's own ids (the guide has one per road's step opened)
  /* A wish for points opens in place (design/97-road-points-links-variants.html, A): each is a
     button that opens its card under the points' row, drawn as the required wishes' rows (who asks
     and what it asks, «More» with the game's words, its area, its pin to where it stands now). One
     open at a time, kept by its wish while the page is (optOpen, as routeOpen). */
  let optOpen = -1;
  function todoHtml(r, s, ps, g) {
    const toggle = !!g, heads = ps.length > 1;
    const items = todo(r, s, ps, !!prefs.pgAll);
    if (!items.length && !heads) return '';
    const hid = 'pg-todo-' + (++todoN);
    const opt = (o, i) => { const on = o.wish === optOpen;
      return `<li class="${i >= OPTS ? 'is-extra' : ''}${on ? ' is-open' : ''}"><button type="button" class="pg-opt" data-act="pgOpt" data-value="${o.wish}" aria-expanded="${on}" aria-controls="${hid}-card-${o.wish}"><img src="${o.icon}" alt="" loading="lazy"><span><span${NT}>${esc(o.name)}</span>${o.value === 0.5 ? ` · ${esc(t('roadHalf'))}` : ''}</span>${App.chevron(on)}</button></li>`; };
    const card = (o) => `<li class="pg-opt-li" id="${hid}-card-${o.wish}" data-wish="${o.wish}"${o.wish === optOpen ? '' : ' hidden'}><div class="pg-item pg-opt-card" role="group" aria-label="${esc(o.name)}">
          <span class="pg-art"><img src="${o.icon}" alt="" loading="lazy"></span>
          <span class="pg-main"><span class="pg-name"${NT}>${esc(o.name)}</span>${foldHtml(o.how, o.more, o.says)}</span>
          <span class="pg-place"><span class="pg-where">${o.area ? `<span${NT}>${esc(areaName(o.area))}</span>` : ''}</span></span>
          ${o.focus ? `<button type="button" class="pg-onmap" data-act="pgFocus" data-value="${esc(o.focus)}" aria-label="${esc(t('mapOnMap') + ': ' + o.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
        </div></li>`;
    const had = (o) => `<li class="is-got">${App.tick}<img src="${o.icon}" alt="" loading="lazy"><span><span${NT}>${esc(o.name)}</span><span class="sr-only">${esc(t('pgGot'))}</span></span></li>`;
    let n = 0;
    // In the guide (toggle off), the whole list under its station, with no «What's missing ·
    // Everything»: nothing's next or done there.
    return `<section class="pg-todo"${toggle ? ` aria-label="${esc(t('pgTodo'))}"` : ''}>
      ${toggle ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgShow'))}">
        <button type="button" data-act="pgShow" data-value="missing" aria-pressed="${!prefs.pgAll}">${esc(t('pgMissing'))}</button>
        <button type="button" data-act="pgShow" data-value="all" aria-pressed="${!!prefs.pgAll}">${esc(t('pgAll'))}</button>
      </div>` : ''}${(() => { const li = (x) => {
      if (x.done) {
        return `<li class="pg-item is-got"><span class="pg-num is-done" aria-hidden="true">${App.tick}</span>
          <span class="pg-art"><img src="${x.icon}" alt="" loading="lazy"></span>
          <span class="pg-main"><span class="pg-name">${esc(x.name)}</span><span class="sr-only">${esc(t('pgGot'))}</span></span>
          <span class="pg-place"><span class="pg-where">${x.area ? `<span${NT}>${esc(areaName(x.area))}</span>` : ''}</span></span>
          <span class="pg-onmap is-none" aria-hidden="true"></span>
        </li>`;
      }
      // A wish goes where it stands now (focus, taskPin), as the Tasks tab's pin.
      const onMap = x.focus || (x.mark && App.mapHas && App.mapHas(x.mark));
      const more = x.opts ? x.opts.length - OPTS : 0;
      return `<li class="pg-item"><span class="pg-num" aria-hidden="true"><b>${num(++n)}</b></span>
          <span class="pg-art"><img src="${x.icon}" alt="" loading="lazy"></span>
          <span class="pg-main"><span class="pg-name">${esc(x.name)}</span>${foldHtml(x.how, x.more, x.says)}
            ${x.opts ? `<ul class="pg-opts" id="${hid}-opts">${x.opts.map(opt).join('')}${x.had.map(had).join('')}${more > 0 ? `<li class="is-more"><button type="button" class="text-btn" data-act="pgOpts" aria-expanded="false" aria-controls="${hid}-opts">${esc(t('pgTodoMore', { n: num(more) }))}</button></li>` : ''}</ul>` : ''}</span>
          <span class="pg-place"><span class="pg-where">${x.area ? `<span${NT}>${esc(areaName(x.area))}</span>` : ''}</span></span>
          ${onMap ? `<button type="button" class="pg-onmap" data-act="${x.focus ? 'pgFocus' : 'mapShow'}" data-value="${esc(x.focus || x.mark)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
        </li>${x.opts ? x.opts.map(card).join('') : ''}`;
    };
      if (!heads) return `<ol class="pg-list">${items.map(li).join('')}</ol>`;
      // Each part's head: its picture, its name and its count, ticked when met; its rows under it.
      return ps.map((p) => `<h4 class="pg-todo-h${g && p.got >= p.of ? ' is-done' : ''}"><img src="${p.icon}" alt="" loading="lazy"><span class="pg-rt-pk">${esc(p.label)}</span>${partCount(p, g)}</h4>${(() => {
        const mine = items.filter((x) => x.part === p.id);
        return mine.length ? `<ol class="pg-list">${mine.map(li).join('')}</ol>` : '';
      })()}`).join(''); })()}</section>`;
  }
  /* «Tu partida», in Act 3 (round 1, 4 A): the endings, then two rings: the endings seen, and the
     things of the 100% only Act 3 holds. */
  function gameHtml(g, all) {
    const { E, seen, shut, of } = endsOf(g);
    const only = Object.values(all).flat().filter((x) => x.act === 3);
    const lack = only.filter((x) => !x.got);
    const names = shut.map((e) => t('ending_' + e.key)).join(', ');
    return journeyEnds(g) + `<div class="pg-rings">${[
      { label: t(shut.length ? 'pgEndingsReach' : 'pgEndings'), icon: QUEST('act3_finale'), got: E.filter((e) => seen.has(e.id)).length, of,
        after: shut.length ? t(shut.length > 1 ? 'pgEndingsShutN' : 'pgEndingsShut', { name: names }) : '',
        items: E.filter((e) => !seen.has(e.id) && !shut.includes(e)).map((e) => ({ name: t('ending_' + e.key), icon: QUEST('act3_finale') })) },
      { label: t('pgOnlyAct3'), icon: lack.length ? lack[0].icon : 'assets/icons/items/everbloom.webp', got: only.length - lack.length, of: only.length,
        items: lack.map((x) => ({ name: x.name, icon: x.icon, mark: x.mark })) },
    ].map(ring).join('')}</div>`;
  }
  // The offer: turned down already (js/acts.js declined), or how it comes.
  const offerNote = (s, g) => (g && s.declined ? t('roadDeclined') : t('roadOfferNote', { town: areaName('BELLHART') }));

  /* Without a save (and in Free mode), the guide (design/40, 5 A): each road under its title and what
     it is, as the route with no step yours (routeHtml). */
  function roadHtml() {
    return [A.next({ act: 1 }), A.next({ act: 2 })].map((r) => `<section class="pg-road" id="pg-road-${r.act}" aria-labelledby="pg-road-${r.act}-h">
        <h3 class="pg-part" id="pg-road-${r.act}-h">${esc(t('roadTitle', { n: num(r.act) }))}</h3>
        <p class="pg-note">${esc(t(r.act === 3 ? 'roadNote3' : 'roadNote2'))}</p>
        ${routeHtml(r, null)}
      </section>`).join('');
  }

  /* Free mode's game for Progress: the Inventory's marks, a New Game until you mark (design/42,
     3 A), and its ladders (masks, silk, Silk Hearts, Needle, Kit, Pouch) as the Inventory sets
     them: their pieces had in order up to the level, so the lists and the counts agree. In Act 3,
     so nothing reads as later. */
  const LADDER = { 'mask-shard': (b) => 4 * b.masks, 'spool-fragment': (b) => 2 * b.spools, 'silk-heart': (b) => b.hearts,
    needle: (b) => b.needle, 'crafting-kit': (b) => b.kit, 'tool-pouch': (b) => b.pouch };
  function freeView(free) {
    const b = free;
    const pieces = free.pieces.filter((i) => !LADDER[CO.PIECES[i][0]]);
    for (const [kind, n] of Object.entries(LADDER)) {
      CO.PIECES.forEach((p, i) => { if (p[0] === kind) pieces.push(i); });
      const mine = pieces.filter((i) => CO.PIECES[i][0] === kind);
      for (const i of mine.slice(n(b))) pieces.splice(pieces.indexOf(i), 1);
    }
    return { ...free, act: 3, pieces, masks: b.masks, spools: b.spools, hearts: b.hearts, needle: b.needle, kit: b.kit, pouch: b.pouch };
  }

  // The Map's card, with the game on screen (cur is Progress's, set per render).
  App.howPiece = (i) => { cur = App.game(); marking = false; return howText(HW.HOW.pieces[i], HW.NEEDS.pieces[i]); };
  // ways: only those (one of a Tool's variants, the Map's mark of its place: js/spots.js VARIANTS).
  App.howOf = (key, ways) => {   // the Map's card, for a Tool, Crest, Silk Skill, ability or the Everbloom
    cur = App.game(); marking = false;
    if (key === 'everbloom') return howText(HW.HOW.everbloom);
    const [cat, id] = key.split(':');
    return HW.HOW[cat] && HW.HOW[cat][id] ? howText(ways || HW.HOW[cat][id], (HW.NEEDS[cat] || {})[id], cat + ':' + id) : '';
  };
  App.freeView = () => { const f = App.freeGame(); return f ? freeView(f) : null; };   // the Map's too

  App.screens.progress = (sec) => {
    howN = 0;
    const own = App.game();
    /* Free mode counts its marks (the Inventory's or these boxes', js/app-saves.js App.freeGame:
       0 % on a New Game), as a game in Act 3 so nothing reads as later; its road stays the guide,
       as no save told it. */
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
      /* Beastling Call and Elegy of the Deep aren't in WHERE: their Act and room are the Map's
         (js/spots.js AT.act, AT.arts), so they don't sit under the Act 2 head of the cloaks. */
      const list = OTHER_ARTS.map((id) => { const w = CO.WHERE.arts[id] || [], scene = spotScene('arts:' + id);
        return { name: pick(D.ARTS.find((x) => x.id === id).name), got: !!g && g.arts.includes(id), act: w[0] || (SPOT && SPOT.act && SPOT.act['arts:' + id]) || 0,
          area: w[1] || (scene && R.areaOf(scene)) || null, icon: `assets/icons/arts/${id}.webp`, mark: 'arts:' + id }; });
      return group('other-arts', t('pgOtherArts'), list, g, list.filter((x) => x.got).length, list.length);
    })() + (() => {
      /* The enemy gauntlets, in the wiki's order (by area), named as Combat names them; in the strip
         each its champion, as the Map draws it (js/app-map.js champion: its last wave's enemy). */
      const champion = (x) => { const w = x.waves[x.waves.length - 1]; return w && w[0] ? `assets/icons/journal/${w[0][0]}.webp` : null; };
      const list = SS.gauntlets.GAUNTLETS.map((x) => ({ name: App.gauntletName(x.id), got: !!g && g.gauntlets.includes(x.id), act: 0, area: x.area, face: champion(x) }));
      return group('gauntlets', t('ftModeGauntlets'), list, g, list.filter((x) => x.got).length, list.length,
        { keys: SS.gauntlets.GAUNTLETS.filter((x) => !(g && g.gauntlets.includes(x.id))).map((x) => 'gaunt:' + x.id) });
    })();
    // How to show the lists goes just over them.
    const controls = g ? `<div class="pg-controls">${seg}</div>` : '';
    /* The three tabs (design/27b-progress-variants.html, 1 D; Tasks since design/75, 3 A): cards,
       each with its picture of how far you are; the one used last opens (prefs.pgTab), the Act's
       the first time. As the ARIA tabs pattern: only the selected one is in the Tab order, and the
       arrows, Home and End move to another and select it (the keydown below). On a phone a card
       keeps its figure and drops the words after it (.pg-tab-x). */
    const tab = TABS.includes(prefs.pgTab) ? prefs.pgTab : 'act';
    const s = next ? next.steps[stepAt(next)] : null;
    // What's done of the step, in the units its rings count (a point a point, a check a check).
    const sum = s && !s.bypassed ? partsSum(parts(next, s, own)) : null;
    const x = (html) => `<span class="pg-tab-x">${html}</span>`;
    const actCard = next
      ? { art: STEP_ART[s ? s.id : 'citadel'], label: t('roadTitle', { n: num(next.act) }),
        sub: s ? `${sum && sum.of > 1 ? `<b>${pts(sum.got)}</b>/${num(sum.of)}${x(' · ' + esc(t('pgStepOf', { n: num(stepAt(next) + 1), of: num(next.steps.length) })))}`
          : x(esc(t('pgStepOf', { n: num(stepAt(next) + 1), of: num(next.steps.length) })))}` : '' }
      : own ? { art: QUEST('act3_finale'), label: t('roadGame'),
        sub: x(esc((({ seen, shut, of }) => t(shut.length ? 'roadEndingsReach' : 'roadEndings', { n: num(seen.size), of: num(of) }))(endsOf(own)))) }
        : { art: QUEST('grand_gate_final'), label: t('roadBoth'), sub: '' };
    /* Every wish on its wall, those the road to Act 3 requires too (Albert, 21 October 2026: the
       walls as the game's, their counts its own), though the road's tab lists them as well. */
    const taskList = tasks(g);
    const card = (id, art, label, sub) => `<button type="button" class="pg-tab" role="tab" id="pg-tab-${id}" aria-controls="pg-panel" aria-selected="${tab === id}" tabindex="${tab === id ? 0 : -1}" data-act="pgTab" data-value="${id}">
        <span class="pg-tab-art" aria-hidden="true">${art}</span><span class="pg-tab-l">${esc(label)}</span>${sub ? `<span class="pg-tab-s">${sub}</span>` : ''}</button>`;
    const tabs = `<div class="pg-tabs" role="tablist" aria-label="${esc(t('navProgress'))}">
        ${card('act', `<img src="${actCard.art}" alt="" loading="lazy">`, actCard.label, actCard.sub)}
        ${card('100', `<span class="pg-ring" style="--p:${c ? Math.min(100, c.total) : 0}"><span class="pg-total-n"><b>${num(c ? c.total : 100)}</b><span class="u">%</span></span></span>`,
          t('pg100'), x(esc(c ? t('pgToGo', { pct: num(Math.max(0, 100 - c.total)) + App.pctSpace() }) : t('pgInCats', { n: num(CP.CATEGORIES.length) }))))}
        ${card('tasks', `<img src="${BOARD}" alt="" loading="lazy">`, t('pgTasks'), g ? `<b>${num(taskList.got)}</b>/${num(taskList.max)}` : num(taskList.max))}
      </div>`;
    // How the 100% splits: one line of a hundred, in its categories (splitBar).
    const cats = CP.CATEGORIES.map((k, i) => ({ name: t('cat_' + k.id), max: k.max, got: c ? Math.min(k.max, c.categories[i].got) : 0 }));
    // Without a save (design/40, 5 A): what importing one shows, on every tab.
    const invite = own ? '' : `<div class="banner is-hint pg-invite"><span class="banner-tag lbl">${esc(t('pgInviteTag'))}</span><span class="banner-text">${esc(t('pgInvite'))}</span>
        <button type="button" class="btn btn-primary" data-act="homeImport">${esc(t('homeInviteBtn'))}</button></div>`;
    /* The 100% and Tasks open straight on their rows, with no line over them (design/75, Albert);
       their rows take the whole width (2 B), and the part's title carries the masthead's filigree
       (6 B). */
    const panel = tab === 'act' ? (next ? actHtml(next, own) : own ? gameHtml(own, all) : roadHtml())
      : tab === '100' ? `${total}${splitBar(cats)}
        ${controls}
        <p class="pg-colhead" aria-hidden="true">${esc(t(g ? 'pgColHead' : 'pgColHeadNone'))}</p>
        <div class="pg-groups is-wide">${hundred}</div>
        <h3 class="pg-part is-crowned">${esc(t('pgBeyond'))}${App.crown('pg-crown')}</h3>
        <div class="pg-groups is-wide">${beyond}</div>`
        : taskList.html;
    sec.innerHTML = `<div class="pg">${brackets}${screenHead(esc(t('navProgress')))}
        ${actsTop(own, next, c, sum)}
        ${tabs}
        <div class="pg-panel" id="pg-panel" role="tabpanel" aria-labelledby="pg-tab-${tab}">${invite}${panel}</div>
      </div>`;
  };

  /* The tabs from the keyboard (the ARIA tabs pattern, selection following focus): Left and Right
     go to the next tab or the one before, wrapping round, Home to the first and End to the last;
     pgTab selects it, repaints and focuses it. */
  const TABS = ['act', '100', 'tasks'];
  document.addEventListener('keydown', (ev) => {
    const tab = ev.target.closest && ev.target.closest('.pg-tab[role="tab"]');
    if (!tab || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const at = TABS.indexOf(tab.dataset.value), n = TABS.length;
    const to = { ArrowRight: (at + 1) % n, ArrowLeft: (at - 1 + n) % n, Home: 0, End: n - 1 }[ev.key];
    if (to === undefined) return;
    ev.preventDefault();
    actions.pgTab({ dataset: { value: TABS[to] } });
  });

  Object.assign(actions, {
    pgOpen(node) {
      const id = node.dataset.value, list = prefs.pgOpen || [];
      prefs.pgOpen = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      savePrefs();
      render();
    },
    // A station of the route (design/83): it opens or shuts, kept while the page is.
    pgRoute(node) {
      const v = node.dataset.value;
      routeOpen.set(v, node.getAttribute('aria-expanded') !== 'true');
      render();
      const b = document.querySelector(`.pg-rt-open[data-value="${v}"]`);
      if (b) b.focus({ preventScroll: true });
    },
    // A step's «See on the map»: the Map on what's left of it (js/app-map.js App.mapFocus).
    pgFocus(node) { const f = FOCUS.get(node.dataset.value); if (f && f.keys.length) App.mapFocus(f.keys, f.name); },
    pgSays(node) {
      const q = document.getElementById(node.getAttribute('aria-controls'));
      if (!q) return;
      q.hidden = !q.hidden;
      node.setAttribute('aria-expanded', String(!q.hidden));
      node.innerHTML = esc(t(q.hidden ? 'pgSays' : 'pgSaysHide')) + App.chevron(!q.hidden);
    },
    // What's next's wishes for points past the nearest four (design/82, 1 A).
    pgOpts(node) {
      const ul = document.getElementById(node.getAttribute('aria-controls'));
      if (!ul) return;
      const open = ul.classList.toggle('is-open');
      node.setAttribute('aria-expanded', String(open));
      node.textContent = open ? t('pgHowLess') : t('pgTodoMore', { n: num(ul.querySelectorAll('.is-extra').length) });
      // Folded away, a wish's card goes with it.
      const shut = !open && ul.querySelector('.is-extra.is-open .pg-opt');
      if (shut) actions.pgOpt(shut);
    },
    // A wish for points: its card opens under the points' row, the one open before shuts (design/97, A).
    pgOpt(node) {
      optOpen = node.getAttribute('aria-expanded') === 'true' ? -1 : Number(node.dataset.value);
      const list = node.closest('.pg-list');
      if (!list) return;
      for (const b of list.querySelectorAll('.pg-opt')) {
        const on = Number(b.dataset.value) === optOpen;
        b.setAttribute('aria-expanded', String(on));
        b.parentNode.classList.toggle('is-open', on);
        b.querySelector('.chev').classList.toggle('up', on);
      }
      for (const c of list.querySelectorAll('.pg-opt-li')) c.hidden = Number(c.dataset.wish) !== optOpen;
    },
    // The tab: kept in the preferences, so the one used last opens next time.
    pgTab(node) {
      prefs.pgTab = TABS.includes(node.dataset.value) ? node.dataset.value : 'act';
      savePrefs();
      render();
      const tab = document.getElementById('pg-tab-' + prefs.pgTab);
      if (tab) tab.focus();
    },
    /* Free mode: a row's box marks it had or not (the Inventory's own marks). A Tool's row is its
       point (js/collectibles.js COUNTED): marked with its upgrade (the Curvesickle), the box
       unmarks both. */
    pgOwn(node) {
      const [kind, id] = node.dataset.value.split(':');
      App.freeMark((m) => {
        const flip = (arr, x) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);
        const pair = kind === 'tools' ? CO.COUNTED.find((ids) => ids.includes(id)) : null;
        if (pair) m.tools = pair.some((x) => m.tools.includes(x)) ? m.tools.filter((x) => !pair.includes(x)) : [...m.tools, id];
        else if (kind === 'piece') m.pieces = flip(m.pieces, Number(id));
        else if (kind === 'everbloom') m.everbloom = !m.everbloom;
        else m[kind] = flip(m[kind], id);
      });
    },
    // A row's «More» on the road (design/103, 1 A): what it waits for and the game's words.
    pgFold(node) {
      const f = document.getElementById(node.getAttribute('aria-controls'));
      if (!f) return;
      f.hidden = !f.hidden;
      node.setAttribute('aria-expanded', String(!f.hidden));
      node.innerHTML = esc(t(f.hidden ? 'pgFold' : 'pgSaysHide')) + App.chevron(!f.hidden);
    },
    pgMore(node) {
      const how = document.getElementById(node.getAttribute('aria-controls'));
      if (!how) return;
      const open = how.classList.toggle('is-open');
      node.setAttribute('aria-expanded', String(open));
      node.textContent = open ? t('pgHowLess') : t('pgHowMore', { n: num(how.querySelectorAll('.pg-how-more > span').length) });
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
