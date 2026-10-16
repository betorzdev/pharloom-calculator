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
    const keys = need.keys.map((k) => pick(HW.KEYS[k].name)).join(', ');
    return need.or ? t('howNeedsOr', { keys, alt: pick(D.ARTS.find((x) => x.id === need.or).name) }) : t('howNeeds', { keys });
  }
  /* The way shown is js/completion.js wayOf's, for the game on screen (Free mode's marks: none, the
     guide's first), in two parts (design/41, 2 B): lead, what it is and what it costs; more, what it
     waits for (from an Act, the wishes first, the abilities and keys), which a phone folds. */
  function howParts(ways, need) {
    const { way: w, first, arts } = CP.wayOf(ways, marking ? null : cur, SS.savefile.ART_PD);
    const needs = needText(need);
    if (!w) return { how: needs, more: [] };
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
    if (!main) return { how: needs, more: [] };
    // "From Act 3" only before the game is there; what a shop waits for that the game lacks: the
    // wishes to do first, the abilities it asks for.
    return { how: [main(), ...cost].filter(Boolean).join(' · '),
      more: [w.act && !(cur && !marking && cur.act >= w.act) ? t('howFromAct', { n: num(w.act) }) : '',
        first.length ? t('roadBefore', { name: first.map((i) => pick(CO.WISHES[i][4])).join(', ') }) : '',
        arts.length ? t('howNeeds', { keys: arts.map(artName).join(', ') }) : '', needs].filter(Boolean) };
  }
  // The same in one line (the Map's cards).
  const howText = (ways, need) => { const h = howParts(ways, need); return [h.how, ...h.more].filter(Boolean).join(' · '); };

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
    && (!x.ways || !x.ways.length || (CP.wayOf(x.ways, marking ? null : cur).way || {}).kind === 'found');
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

  /* The things of a category: [{ name, got, act, area, color, icon, mark }] in the order to show them. */
  const byAct = (a, b) => (a.act || 9) - (b.act || 9) || areaName(a.area).localeCompare(areaName(b.area));
  function things(g) {
    const has = (list, id) => !!g && list.includes(id);
    const where = (map, id) => { const w = map[id] || []; return { act: w[0] || 0, area: w[1] || null }; };
    const pieces = (kind, name) => CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
      .map(({ p, i }, k) => ({ name: name ? name(k) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]),
        ...howParts(HW.HOW.pieces[i], HW.NEEDS.pieces[i]), ways: HW.HOW.pieces[i], icon: pieceIcon(kind, k), mark: 'piece:' + i }));
    /* A Steel Soul save has the Tool its mode gives instead of another (js/data.js replaces: the
       Shell Satchel for the Dead Bug's Purse): the row is named and drawn as that one. Free mode,
       with no mode, as Classic. Where it is, how to get it and its mark stay the pair's. */
    const steel = !!(g && App.game() && (App.gameMeta() || {}).steel);
    const tools = CO.COUNTED.map((ids) => {
      const tool = (steel && ids.map((id) => D.TOOLS.find((x) => x.id === id)).find((x) => x && x.replaces)) || D.TOOLS.find((x) => x.id === ids[0]);
      const got = !!g && ids.some((id) => g.tools.includes(id));
      return { name: pick(tool.name), got, color: tool.color, ...where(CO.WHERE.tools, ids[0]), ...howParts(HW.HOW.tools[ids[0]], HW.NEEDS.tools[ids[0]]), ways: HW.HOW.tools[ids[0]],
        icon: `assets/icons/tools/${tool.id}.webp`, mark: 'tools:' + ids[0] };
    });
    const named = (list, ids, map, key) => ids.map((id) => ({ name: pick(list.find((x) => x.id === id).name), got: has(g ? g[key] : [], id), ...where(map, id),
      ...howParts(HW.HOW[key][id], HW.NEEDS[key][id]), ways: HW.HOW[key][id], icon: `assets/icons/${key}/${id}.webp`, mark: key + ':' + id }));
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
     its name, its things as the game's pictures (up to twelve, what you lack dimmed) or as pips,
     its count and the disclosure's ring; open, its list. Which rows are open is kept (prefs.pgOpen). */
  const MAX_PIPS = 60;
  const isOpen = (id) => (prefs.pgOpen || []).includes(id);
  function strip(list, g, got, max, pips = false) {
    if (!pips && list.length <= 12 && list.every((x) => x.icon)) {
      return `<span class="pg-strip" aria-hidden="true">${list.map((x) => `<img class="${!g || x.got ? '' : 'is-missing'}" src="${x.icon}" alt="" loading="lazy">`).join('')}</span>`;
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
     row has a picture. */
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
          <span class="disc-ring">${App.chevron(open)}</span></button></h3>
        ${open ? `${ladderNote(id, g)}${body}` : ''}
      </section>`;
  }

  /* The pane «Tareas»: the main objectives, then the wishes by type, each with the game's name and
     the picture the pane draws by it (design/75, 4 A; tools/extract-wish-icons.py): a main
     objective's own (tasks/main-<its quest>), a wish's its type's (tasks/<type>). The objectives the
     save checks by a flag or the Journal take their quest's; the Soul Snare's two are Wayfarer
     wishes in the game (their QuestType), though the pane's groups put them elsewhere. Each type's
     group has its large emblem by its name (7 B), the Wishwalls' (assets/icons/wishes). The main
     objectives have none, as in the game (MainQuest typeLargeIcon is empty in every one): no slot,
     and the pane's own filigree between them and the wishes (design/80, E: its Current Heading). */
  const TYPE_NAME = { 'main-objectives': () => t('pgTasksMain'), collect: () => t('pgTasksCollect') };
  const TASK_QUEST = { HasMelodyConductor: 'Citadel Ascent Melody Conductor', HasMelodyArchitect: 'Citadel Ascent Melody Architect',
    HasMelodyLibrarian: 'Citadel Ascent Melody Librarian', CollectedHeartCoral: 'Black Thread Pt5 Heart Coral',
    CollectedHeartFlower: 'Black Thread Pt5 Heart Flower', CollectedHeartHunter: 'Black Thread Pt5 Heart Ant', 'Lost Lace': 'Black Thread Pt6 Flower' };
  const TASK_TYPE = { 'Soul Snare': 'wayfarer', 'Soul Snare Pre': 'wayfarer' };
  // The group «collect» is the Soul Snare's wish, a Wayfarer one in the game: it has no emblem of its own.
  const GROUP_EMBLEM = { collect: TASK_TYPE['Soul Snare'] };
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
  // The groups, and how many tasks are done of how many (the tab's card).
  function tasks(g, skip = new Set()) {
    /* A wish only one mode has (the Steel Soul's, a Classic one) shows in a save of that mode. Free
       mode has none: it shows both, as the Journal and the Map do. */
    const m = App.gameMeta();
    const mode = !g || !App.game() ? null : m && m.steel ? 'steel' : 'classic';
    const done = new Set(g ? g.quests : []);
    const sum = { got: 0, max: 0 };
    const pin = taskPin(g), taken = new Set(g ? g.taken || [] : []);
    const [main, ...rest] = CO.WISH_TYPES.map((ty) => {
      const list = CO.WISHES.map((w, i) => ({ w, i })).filter(({ w, i }) => w[0] === ty.id && !skip.has(i) && (!mode || !w[5] || w[5] === mode))
        .map(({ w, i }) => { const scene = wishScene(wishQuest(w), done);
          // With no area in the pane's list, the area it's taken in, as the road's rows (wishRow).
          return { name: pick(w[4]), got: !!g && g.wishes.includes(i), act: w[1], area: w[3] || (scene && R.areaOf(scene)) || null, scene, icon: taskIcon(w),
            focus: !!g && g.wishes.includes(i) ? null : pin(w, i), promise: !g || g.wishes.includes(i) || ty.id === 'main-objectives' ? null : wishState(w, taken, g) }; }).sort(byAct);
      const title = ty.name ? pick(ty.name) : TYPE_NAME[ty.id]();
      const got = list.filter((x) => x.got).length;
      sum.got += got;
      sum.max += list.length;
      const emb = GROUP_EMBLEM[ty.id] || ty.id;
      return list.length ? group('wish-' + ty.id, title, list, g, got, list.length,
        { pips: true, emblem: ty.id === 'main-objectives' ? undefined : WISH_ICON.has(emb) ? `assets/icons/wishes/${emb}.webp` : null }) : '';
    });
    // The filigree only between the two: with either side missing it has nothing to part.
    const wishes = rest.join('');
    const html = main && wishes ? `${main}<div class="pg-spacer" aria-hidden="true"><img src="assets/icons/tasks/spacer.webp" alt="" loading="lazy"></div>${wishes}` : main + wishes;
    return { html, ...sum };
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
  // What a task asks for on the Map, by stage, in order: [[keys], ...].
  function taskTargets(w) {
    const piece = w[2][0] === 'flag' ? CO.PIECES.findIndex((p) => p[2][0] === 'flag' && p[2][1] === w[2][1]) : -1;
    if (piece >= 0) return [['piece:' + piece]];
    const q = wishQuest(w) || TASK_QUEST[w[2][1]], T = SS.spots ? SS.spots.TASKS : [];
    if (!q) return [];
    const by = taskStages(q).map((s) => T.flatMap((k, i) => (k[1] === s ? ['task:' + i] : []))).filter((a) => a.length);
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
      const left = taskTargets(w).map((s) => s.filter((k) => marks.has(k) && !(g && marks.get(k).got))).find((s) => s.length) || [];
      const isTaken = !!q && taskStages(q).some((s) => taken.has(s));
      const keys = !own ? (giver.length ? giver : left) : giver.length && !isTaken ? giver : left.length ? left : giver;
      if (!keys.length) return null;
      FOCUS.set('task:' + i, { keys: keys.map((k, n) => ({ k, n, d: rooms(k) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.n - b.n).map((e) => e.k), name: pick(w[4]) });
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
  const personName = (id) => { const p = SS.people && SS.people.PEOPLE.find((x) => x.id === id); return p ? pick(p.name) : id; };
  /* How each piece is had (the wiki's pages and the Caretaker's FSM): his sister and his uncle give
     theirs only once the wish is accepted. The uncle, the Bell Hermit, sits below Bellhart's Bellway
     (Belltown_basement): past its right side's hidden wall (a Remasker, walked through: the room has
     no breakable wall, whatever the guides say) and down its drop (bot1) into Belltown_basement_03,
     left of where you land (the wiki's Bell Hermit page agrees). The Seeker's Soul lies past Groal the Great; the Snare
     Setter past a ledge only the Faydown Cloak reaches (the completionist's prereqs). And its mark on the
     Map: a soul's (js/spots.js TASKS, what the wish asks for), the Snare Setter's as a Tool's. */
  const SNARE_HOW = {
    'Snare Soul Churchkeeper': () => t('roadPieceGiven', { npc: personName('churchkeeper') }),
    'Snare Soul Bell Hermit': () => [t('roadPieceGiven', { npc: personName('bell-hermit') }), t('roadHermitWay')].join(' · '),
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
    return { scene, mark: scene ? (f.board ? 'board:' : 'giver:') + scene.toLowerCase() : null };
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
     the ones she sells (js/spots.js EXTRAS), counted in a save. */
  const SHAKRA_MAPS = SS.spots ? SS.spots.EXTRAS.filter((x) => x[0] === 'map' && x[5] && x[5].shop === 'shakra').map((x) => x[2][1].slice(3, -3)) : [];
  const OPENS = {
    'Shakra Final Quest': (g) => [t('roadOpensShakra', { npc: pick(HW.NPCS.shakra), art: artName('faydown-cloak') }),
      g ? t('roadMapsBought', { n: num(SHAKRA_MAPS.filter((m) => (g.maps || []).includes(m)).length), of: num(SHAKRA_MAPS.length) }) : ''],
    'Save Sherma': () => [t('roadOpensSherma', { npc: personName('sherma'), clave: areaName('ENCLAVE'), ward: areaName('WARD') })],
    'Songclave Donation 2': () => [t('roadOpensClave', { clave: areaName('ENCLAVE'), first: wishName('Songclave Donation 1') })],
    'Belltown House Start': () => [t('roadOpensTown', { npc: t('mapScrounge'), pavo: personName('bellhart-greeter') })],
    'Belltown House Mid': () => [t('roadOpensGlory', { foe: foeName('cogwork-dancers'), art: artName('clawline') })],
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
    // The Bellshrines rung, the objective's own next line: back to the Grand Gate.
    'grand-gate': (s) => questSays(s.quest, 'ready'),
    // No objective names her: her Journal entry says who she is and what she guards (design/28, 5 A).
    judge: () => { const e = SS.journal && SS.journal.BOOK.find((x) => x.id === 'last-judge'); return e ? says('journal', e.desc, e.name) : null; },
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
      'grand-gate': () => [goal(s.quest)],
      judge: () => ['boss:last-judge', 'boss:phantom'],
      citadel: () => [goal('Citadel Seeker')],
      offer: () => [caretakerMark(), QU.FROM[s.quest] && QU.FROM[s.quest].board ? 'board:' + lower(QU.FROM[s.quest].board) : null],
      ready: () => [caretakerMark()],
      silk: () => [goal('Silk Defeat Snare')],
    }[s.id];
    // A step of several things: what's next of it with a place on the Map.
    const keys = of ? of() : todo(r, s, parts(r, s, g)).flatMap((x) => (x.opts ? x.opts : [x])).filter((x) => x.mark).map((x) => x.mark);
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
    const x = STEP_SAYS[s.id] ? STEP_SAYS[s.id](s) : null, map = mapLink(r, s, stepMarks(r, s, g));
    return x || map ? `<div class="pg-says${cls}">${x ? saysHtml(x) : ''}${map}</div>` : '';
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
     that, and the wishes to do before it. */
  function wishRow(x, got, done, g) {
    const w = x.wish >= 0 ? CO.WISHES[x.wish] : null;
    const runt = HW.TRAPS.find((r) => r.id === 'broodfeast-runt');
    const from = wishFrom(x.quest, done);
    const sub = [x.value === 0.5 ? t('roadHalf') : '', !got && x.before.length ? t('roadBefore', { name: x.before.map(wishName).join(', ') }) : '',
      !got && runt && x.quest === runt.counts ? t('roadRunt') : ''];
    // Who asks and what it asks lead; what posts it follows (folded on a phone, design/41, 2 B).
    const how = got ? '' : [wishLoc(x.quest), wishAsks(x.quest)].filter(Boolean).join(' · ');
    const more = got ? [] : (OPENS[x.quest] ? OPENS[x.quest](g) : []).filter(Boolean);
    return { name: x.name ? pick(x.name) : w ? pick(w[4]) : x.quest, got, act: w ? w[1] : 0, area: (w && w[3]) || (from.scene && R.areaOf(from.scene)) || null,
      scene: from.scene, mark: from.mark, sub, how, more, wish: x.wish, value: x.value, says: got ? null : wishSays(x.quest, g) };
  }
  function groupRows(name, g, required) {
    const done = new Set(g ? g.quests : []);
    return QU.GROUPS[name].quests.filter((q) => q.required === required)
      .map((q) => wishRow(A.missing(q.quest, done, required ? undefined : q.value), done.has(q.quest), done, g)).sort(byAct);
  }
  /* The caravan, while it isn't in Fleatopia (js/acts.js): the fleas rescued and its stop now, what
     its last move asks (the empty Pale Lake seen), and on the Phantom's way, the Last Judge (the
     stop after Greymoor is the Judge's arena). Without a save, the rule. */
  const STOP = ['BONEFOREST', 'GREYMOOR', 'CORAL_STEPS'];
  // { how, more }: where it stands, then what its next stop asks first.
  function caravanHow(c, g) {
    const lake = t('roadCaravanLake', { lake: t('roadPaleLake'), ducts: areaName('AQUEDUCTS') });
    if (!g || !c) return { how: t('roadCaravanRule', { need: num(A.FLEAS), npc: pick(HW.NPCS.mooshka) }), more: [lake] };
    return { how: t('roadCaravanHow', { n: num(c.fleas), need: num(c.need), npc: pick(HW.NPCS.mooshka), at: areaName(STOP[c.at]) }),
      more: [c.at === 2 ? lake : '', c.at < 2 && !g.lastJudge ? t('roadCaravanJudge', { steps: areaName('CORAL_STEPS'), judge: foeName('last-judge') }) : ''].filter(Boolean) };
  }
  const count = (got, max) => `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>`;
  /* The Soul Snare's four checks on the save (js/acts.js): the caravan, the Faydown Cloak, Lace
     beaten atop the Cradle's tower (defeatedLaceTower: set in Song_Tower_01, the Cradle's) and the
     Bellhome's key, with what each still asks. */
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
      { test: 'bellhomeKey', ready: key.ready, name: t('roadKey'), got: test('bellhomeKey').ok, act: 2, area: 'BELLHART', icon: 'assets/benches/bellhome.png', mark: PAVO,
        how: test('bellhomeKey').ok ? '' : key.ready ? t('roadPavo') : t('roadKeyRule', { glory: wishName('Belltown House Mid'), n: num(key.need) }), says: says('inv', t('roadKeyDesc')) },
    ].map((x) => ({ act: 0, area: null, ...x }));
  }

  /* Each step by what it asks, read from its id (js/acts.js next()), so a step the road gains or
     loses keeps its words: its title (the whole road's, and the heading of the step you're on), and
     a short name for the thread, as what to do (design/40-progress-clarity-variants.html, 3 A). */
  const wishOf = (r) => { const o = r.steps.find((x) => x.id === 'offer'); return wishName(o ? o.quest : 'Soul Snare Pre'); };
  const gateOf = (s) => pick(QU.CHAIN[s.quest || 'Grand Gate Bellshrines'].name);
  const TITLE = {
    bellshrines: () => t('roadBells'), 'grand-gate': (r, s) => t('roadGate', { gate: gateOf(s) }),
    judge: () => t('roadJudge', { judge: foeName('last-judge'), phantom: foeName('phantom') }), citadel: () => t('roadCitadel'),
    unlock: (r) => t('roadUnlock', { wish: wishOf(r) }),
    offer: (r) => t('roadOffer', { wish: wishOf(r), caretaker: t('roadCaretaker'), town: areaName('BELLHART'), clave: areaName('ENCLAVE') }),
    pieces: () => t('roadPieces'), ready: () => t('roadReady', { caretaker: t('roadCaretaker'), clave: areaName('ENCLAVE') }), silk: () => t('roadSilk'),
  };
  const SHORT = {
    bellshrines: () => t('pgStepBells'), 'grand-gate': (r, s) => t('pgStepGate', { gate: gateOf(s) }),
    judge: () => t('pgStepJudge', { judge: foeName('last-judge') }), citadel: () => t('roadCitadel'),
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
  const STEP_ART = { bellshrines: QUEST('songshrines'), 'grand-gate': QUEST('grand_gate_final'), judge: PORTRAIT('last-judge'),
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
  /* The step you're on, when it has several parts (design/84, 2 A): what it asks said once, then its
     parts in one line, each its picture, its name and its count, ticked when met. */
  function routeParts(r, s, g, ps) {
    const say = s.id === 'unlock' ? t('roadAllThree', { caretaker: t('roadCaretaker'), wish: wishOf(r) })
      : s.id === 'offer' ? offerNote(s, g) : s.id === 'silk' ? t('roadSilkNote') : '';
    const lead = say ? `<p class="pg-lead">${esc(say)}</p>` : '';
    if (ps.length < 2) return lead;
    return lead + `<ul class="pg-rt-parts">${ps.map((p) => `<li class="${g && p.got >= p.of ? 'is-done' : ''}"><img src="${p.icon}" alt="" loading="lazy"><span class="pg-rt-pk">${esc(p.label)}</span>${!g ? `<span class="pg-count"><i class="u">${num(p.of)}</i></span>` : p.got >= p.of
      ? `<span class="pg-count"><span class="pg-mark">${App.tick}</span> <b>${pts(p.of)}</b><i class="u">/${num(p.of)}</i></span>` : count(p.got, p.of)}</li>`).join('')}</ul>`;
  }
  function routeHtml(r, g) {
    // Without a save it's the guide: no step is yours, each says how much it asks and opens on all
    // of it, every station shut at first (their open or shut kept apart from a save's: 'guide:').
    const guide = !g;
    const at = guide ? -1 : stepAt(r);
    const stale = !guide && !g.quests.length && g.wishes.length;
    const stations = r.steps.map((s, i) => {
      const key = (guide ? 'guide:' : '') + r.act + ':' + s.id, done = !guide && (s.ok || s.bypassed), cur = i === at;
      const open = routeOpen.has(key) ? routeOpen.get(key) : cur;
      const ps = cur || guide ? parts(r, s, g) : [];
      // Yours counts as its parts do, as the tab's card does (a wish point short is one); in the guide, what it asks.
      const sum = partsSum(ps);
      const mark = done ? `<span class="pg-mark">${App.tick}</span><span class="sr-only">${esc(t('pgPeekDone'))}</span>`
        : guide && sum.of > 1 ? `<span class="pg-count"><i class="u">${num(sum.of)}</i></span>` : cur && sum.of > 1 ? count(Math.floor(sum.got), sum.of) : '';
      let body = '';
      if (open) {
        const one = ps.length === 1 && !ps[0].rows.length;
        // A step done keeps the game's words, without the way onto the Map (as a step peeked at did).
        const x = done && STEP_SAYS[s.id] ? STEP_SAYS[s.id](s) : null;
        body = `<div class="pg-rt-body">${done ? (x ? `<div class="pg-says">${saysHtml(x)}</div>` : '') : stepCard(r, s, g)}${cur && stale ? `<p class="pg-note is-warn">${esc(t('roadStale'))}</p>` : ''}${cur || guide ? routeParts(r, s, g, ps) : ''}${ps.length && !one ? todoHtml(r, s, ps, !guide) : ''}</div>`;
      }
      return `<li class="pg-rt-st${done ? ' is-done' : cur ? ' is-cur' : guide ? '' : ' is-later'}"${cur ? ' aria-current="step"' : ''}><span class="pg-rt-dia" aria-hidden="true"></span>
          <h3 class="pg-rt-h"><button type="button" class="pg-rt-open" data-act="pgRoute" data-value="${key}" aria-expanded="${open}">
            <img class="pg-rt-art" src="${STEP_ART[s.id] || BOARD}" alt="" loading="lazy">
            <span class="pg-rt-t"><span class="pg-rt-k">${esc(t('pgPeekStep', { n: num(i + 1) }))}${cur ? `<em>${esc(t('pgHere'))}</em>` : ''}</span>
              <span class="pg-rt-name">${esc(stepTitle(r, s))}</span>${s.bypassed && !s.ok ? `<span class="pg-rt-sub">${esc(t('roadBypassed', { phantom: foeName('phantom') }))}</span>` : ''}</span>
            <span class="pg-rt-n">${mark}</span><span class="disc-ring">${App.chevron(open)}</span></button></h3>${body}</li>`;
    }).join('');
    const end = `<li class="pg-rt-end"><span class="pg-rt-dia" aria-hidden="true"></span><p class="pg-rt-h"><span class="pg-rt-t"><span class="pg-rt-k">${esc(t('pgRouteEnd'))}</span>
        <span class="pg-rt-name"${NT}>${esc(t('saveAct', { n: num(r.act) }))} · ${esc(t('pgActName' + r.act))}</span></span></p></li>`;
    return `<ol class="pg-rt">${stations}${end}</ol>`;
  }
  /* What's next (design/40, 2 A), the step's one list (design/82, 1 A): what the step still lacks,
     as numbered things to do, read from its parts' rows: each wish it requires, the wish points short
     (with the nearest wishes that would give them, the rest unfolding), each condition, Bellshrine or
     piece of the snare; a step of one thing, its title. Each with its picture, its place and the
     Map's pin. With «Everything» (prefs.pgAll, the 100% tab's own toggle), what's done too, ticked in
     its place, and the wishes that gave points among the options. */
  const byNear = (rows) => rows.map((x, i) => ({ x, i, d: dist(x) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.i - b.i).map((e) => e.x);
  function todo(r, s, ps, all) {
    const out = [];
    for (const p of ps) {
      const left = p.rows.filter((x) => !x.got);
      if (p.id === 'points') {
        if (p.got >= p.of) { if (all) out.push({ name: p.label, icon: p.icon, done: true }); continue; }
        const known = left.some((x) => dist(x) != null);
        out.push({ name: t('pgTodoPoints', { n: pts(p.of - p.got) }), icon: p.icon, how: t(known ? 'pgTodoAnyNear' : 'pgTodoAny', { n: num(left.length) }),
          opts: byNear(left), had: all ? p.rows.filter((x) => x.got) : [] });
        continue;
      }
      if (!p.rows.length) { if (p.got < p.of) out.push({ name: stepTitle(r, s), icon: p.icon }); continue; }
      for (const x of all ? p.rows : left) {
        const ready = !x.got && x.test === 'bellhomeKey' && x.ready;
        const name = p.id === 'required' ? t('pgTodoWish', { wish: x.name })
          : p.id === 'shrines' ? t('pgTodoShrine', { area: x.name })
          : ready ? t('pgTodoPavo', { key: x.name })
          : x.test === 'doubleJump' || x.test === 'bellhomeKey' || p.id === 'snare' ? t('pgTodoGet', { name: x.name }) : x.name;
        out.push({ ...x, name, done: x.got, ...(ready ? { how: '', more: [] } : {}), area: p.id === 'shrines' ? null : x.area });
      }
    }
    return out;
  }
  const OPTS = 4;   // the nearest wishes for points shown before «and n more»
  let todoN = 0;    // each list's own ids (the guide has one per road's step opened)
  function todoHtml(r, s, ps, toggle = true) {
    const items = todo(r, s, ps, !!prefs.pgAll);
    if (!items.length) return '';
    const opt = (o, i) => `<li${i >= OPTS ? ' class="is-extra"' : ''}><img src="${o.icon}" alt="" loading="lazy"><span><span${NT}>${esc(o.name)}</span>${o.value === 0.5 ? ` · ${esc(t('roadHalf'))}` : ''}</span></li>`;
    const had = (o) => `<li class="is-got">${App.tick}<img src="${o.icon}" alt="" loading="lazy"><span><span${NT}>${esc(o.name)}</span><span class="sr-only">${esc(t('pgGot'))}</span></span></li>`;
    let n = 0;
    // In the guide (toggle off), the whole list under its station, with no title and no «What's
    // missing · Everything»: nothing's next or done there.
    const hid = 'pg-todo-' + (++todoN);
    return `<section class="pg-todo"${toggle ? ` aria-labelledby="${hid}"><h3 class="pg-part" id="${hid}">${esc(t('pgTodo'))}</h3>` : '>'}
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
      const onMap = x.mark && App.mapHas && App.mapHas(x.mark);
      const more = x.opts ? x.opts.length - OPTS : 0;
      return `<li class="pg-item"><span class="pg-num" aria-hidden="true"><b>${num(++n)}</b></span>
          <span class="pg-art"><img src="${x.icon}" alt="" loading="lazy"></span>
          <span class="pg-main"><span class="pg-name">${esc(x.name)}</span>${howHtml(x.how, x.more)}${saysRow(x.says)}
            ${x.opts ? `<ul class="pg-opts" id="${hid}-opts">${x.opts.map(opt).join('')}${x.had.map(had).join('')}${more > 0 ? `<li class="is-more"><button type="button" class="text-btn" data-act="pgOpts" aria-expanded="false" aria-controls="${hid}-opts">${esc(t('pgTodoMore', { n: num(more) }))}</button></li>` : ''}</ul>` : ''}</span>
          <span class="pg-place"><span class="pg-where">${x.area ? `<span${NT}>${esc(areaName(x.area))}</span>` : ''}</span></span>
          ${onMap ? `<button type="button" class="pg-onmap" data-act="mapShow" data-value="${esc(x.mark)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>` : '<span class="pg-onmap is-none" aria-hidden="true"></span>'}
        </li>`;
    };
      return `<ol class="pg-list">${items.map(li).join('')}</ol>`; })()}</section>`;
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
  App.howOf = (key) => {   // the Map's card, for a Tool, Crest, Silk Skill, ability or the Everbloom
    cur = App.game(); marking = false;
    if (key === 'everbloom') return howText(HW.HOW.everbloom);
    const [cat, id] = key.split(':');
    return HW.HOW[cat] && HW.HOW[cat][id] ? howText(HW.HOW[cat][id], (HW.NEEDS[cat] || {})[id]) : '';
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
      // The enemy gauntlets, in the wiki's order (by area), named as Combat names them.
      const list = SS.gauntlets.GAUNTLETS.map((x) => ({ name: App.gauntletName(x.id), got: !!g && g.gauntlets.includes(x.id), act: 0, area: x.area }));
      return group('gauntlets', t('ftModeGauntlets'), list, g, list.filter((x) => x.got).length, list.length);
    })();
    // How to show the lists goes just over them.
    const controls = g ? `<div class="pg-controls">${seg}</div>` : '';
    // The wishes the road to Act 3 requires are in the Act tab (round 1, 5): not again in Tasks.
    const roadWishes = next && next.act === 3 ? new Set(QU.GROUPS['Soul Snare'].quests.filter((q) => q.required)
      .map((q) => A.missing(q.quest, new Set(own.quests)).wish).filter((i) => i >= 0)) : new Set();
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
    const taskList = tasks(g, roadWishes);
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
        : `${controls}<div class="pg-groups is-wide">${taskList.html}</div>`;
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
