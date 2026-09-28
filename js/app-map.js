/* js/app-map.js — the Map: Pharloom as the game's map screen draws it (assets/map/rooms.webp,
   extracted from the game's files by tools/extract-map.py) in your game's state: in Act 3 the
   Cradle, Cogwork Core and the Ventrica hub destroyed, and the Abyss's diving bell as your game
   has it (states.webp's layers, js/rooms.js mapFlags; Free mode: before Act 3), and on it
   everything the game has for each room (js/spots.js, from the game's own files), in layers
   grouped as the legend under the map shows them:
     Missing for 100%   every piece, Tool, Crest, Silk Skill, ability and the Everbloom, where it's
                        had: lying in its room, its vendor's, its Wishwall's, its boss's arena
     Places             benches, Bellway and Ventrica stations (the game's own pins, dimmed while
                        your game hasn't opened them), the gauntlets and bosses not beaten, the
                        Bellshrines, the locked doors and the shops
     People             Shakra's spots, the Wishwalls and who offers a wish still open, and the
                        people who give a thing of the 100%
     Other collectibles relics, Mossberries, Silkeaters, Mementos, the Bellhome's furnishings,
                        unique spawns, and the rosary and shell shard caches and breakable walls
                        (off at first; from afar, a count per room)
     Your game          the rooms not visited, dimmed (scenesVisited); your cocoon; the Journal's
                        entries still missing; the areas whose map isn't bought
   In a save, what's had is left out; in Free mode, everything shows, as a guide. The Act filter
   and "what I can reach now" (js/spots.js NEEDS against your abilities) narrow every layer. A tap
   on a mark, or on an area's name, opens its card. Hornet sits at your bench (js/app-hornet.js
   walks her there from the previous one). Other screens open the Map on a thing (App.mapShow).
   The marks are placed in percentages of the image, so they follow its zoom. Shares SS.app with
   js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const M = SS.map, R = SS.rooms, CO = SS.collectibles, D = SS.data, SP = SS.spots, J = SS.journal, QU = SS.quests, HW = SS.how;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const FOE = new Map(SS.enemies.FOES.map((f) => [f.id, f]));
  const BOOK = new Map(J.BOOK.map((e) => [e.id, e]));
  const BOOK_KEY = new Map(J.BOOK.map((e) => [e.key, e]));
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const stepsText = (n) => (n === 0 ? t('mapHere') : t(n === 1 ? 'mapSteps1' : 'mapSteps', { n: num(n) }));
  const itemName = (id) => pick(D.ITEMS.find((x) => x.id === id).name);
  const lower = (s) => String(s || '').toLowerCase();
  const pinKey = SS.savefile.pinKey;

  /* ── The layers ──
     Each: its group, its name, and its mark in the legend. The pieces' kinds keep their colour
     token on the map (css, .mp-dot.is-<layer>). */
  const PIECE_KINDS = ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea', 'needle', 'tool-pouch',
    'crafting-kit', 'silk-heart', 'old-heart', 'melody'];
  const HEART_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter',
    CollectedHeartClover: 'heart-clover', HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian', HasMelodyConductor: 'melody-conductor' };
  const PIECE_ICON = { flea: 'pieces/flea', 'silk-heart': 'pieces/silk-heart', needle: 'items/needle', 'old-heart': 'pieces/heart-bloom', melody: 'pieces/melody-architect' };
  const pieceIcon = (k, p) => `assets/icons/${p && HEART_ICON[p[2][1]] ? 'pieces/' + HEART_ICON[p[2][1]] : PIECE_ICON[k] || 'items/' + k}.webp`;
  const RELICS = ['bone-scroll', 'weaver-effigy', 'choral-commandment', 'rune-harp', 'psalm-cylinder', 'arcane-egg'];
  const MEMENTO_ICON = { 'Grey Memento': 'grey-memento', 'Memento Garmond': 'heros-memento', 'Memento Surface': 'surface-memento',
    'Hunter Memento': 'hunters-memento', 'Crowman Memento': 'craw-memento', 'Sprintmaster Memento': 'sprintmaster-memento', 'Memento Seth': 'guardians-memento' };
  const SPAWN_ICON = { NAME_RHINO: 'rhinogrund', NAME_ROSARY_PILGRIM: 'covetous-pilgrim', NAME_SHELL_FOSSIL_MIMIC: 'shardillard', NAME_BLACK_THREAD_CORE: 'void-mass' };

  const L = (id, group, name, look) => ({ id, group, name, look });
  const LAYERS = [
    ...PIECE_KINDS.map((k) => L(k, 'hundred', () => ({
      flea: t('kind_fleas'), needle: t('cat_needle'), 'silk-heart': t('cat_hearts'), 'old-heart': t('kind_oldHearts'), melody: t('kind_melodies'),
    }[k] || itemName(k)), { dot: pieceIcon(k) })),
    L('tools', 'hundred', () => t('cat_tools'), { dot: 'assets/icons/tools/straight-pin.webp' }),
    L('crests', 'hundred', () => t('cat_crests'), { dot: 'assets/icons/crests/reaper.webp' }),
    L('skills', 'hundred', () => t('cat_skills'), { dot: 'assets/icons/skills/silkspear.webp' }),
    L('arts', 'hundred', () => t('cat_arts'), { dot: 'assets/icons/arts/swift-step.webp' }),
    L('everbloom', 'hundred', () => t('cat_items'), { dot: 'assets/icons/items/everbloom.webp' }),
    L('bench', 'places', () => t('mapPlace_bench'), { pin: 'pin_bench' }),
    L('bellway', 'places', () => t('mapPlace_bellway'), { pin: 'pin_stag_station' }),
    L('ventrica', 'places', () => t('mapPlace_ventrica'), { pin: 'pin_tube_station' }),
    L('gauntlet', 'places', () => t('ftModeGauntlets'), { badge: 'gauntlet' }),
    L('boss', 'places', () => t('mapLayer_boss'), { badge: 'boss' }),
    L('bellshrine', 'places', () => t('mapLayer_bells'), { pin: 'quest_map_icon_grand_gate_final' }),
    L('lock', 'places', () => t('mapLayer_locks'), { glyph: 'lock' }),
    L('shop', 'places', () => t('mapLayer_shops'), { pin: 'pin_shop' }),
    L('shakra', 'people', () => t('mapLayer_shakra'), { glyph: 'quill' }),
    L('wishwall', 'people', () => t('mapLayer_wishwalls'), { glyph: 'wish' }),
    L('giver', 'people', () => t('mapLayer_givers'), { glyph: 'giver' }),
    L('person', 'people', () => t('mapLayer_people'), { glyph: 'person' }),
    ...RELICS.map((k) => L(k, 'extras', () => t('mapExtra_' + k), { dot: `assets/icons/extras/${k}.webp` })),
    L('mossberry', 'extras', () => t('mapExtra_mossberry'), { dot: 'assets/icons/extras/mossberry.webp' }),
    L('silkeater', 'extras', () => t('mapExtra_silkeater'), { pin: 'pin_grub_location' }),
    L('memento', 'extras', () => t('mapExtra_memento'), { dot: 'assets/icons/extras/grey-memento.webp' }),
    L('bellhome', 'extras', () => t('mapExtra_bellhome'), { glyph: 'home' }),
    L('spawn', 'extras', () => t('mapExtra_spawn'), { badge: 'spawn' }),
    L('rosary-cache', 'extras', () => t('mapExtra_rosary'), { dot: 'assets/icons/extras/rosary-cache.webp' }),
    L('shard-cache', 'extras', () => t('mapExtra_shard'), { dot: 'assets/icons/extras/shard-cache.webp' }),
    L('wall', 'extras', () => t('mapExtra_wall'), { glyph: 'wall' }),
    L('fog', 'game', () => t('mapLayer_fog'), { glyph: 'fog' }),
    L('cocoon', 'game', () => t('mapLayer_cocoon'), { pin: 'shade_pin' }),
    L('journal', 'game', () => t('mapLayer_journal'), { badge: 'journal' }),
    L('maps', 'game', () => t('mapLayer_maps'), { glyph: 'map' }),
  ];
  const LAYER = new Map(LAYERS.map((l) => [l.id, l]));
  const GROUPS = ['hundred', 'places', 'people', 'extras', 'game'];
  const groupName = (g) => t('mapGroup_' + g);
  // On at first: the whole 100%, the stations, the gauntlets and bosses, and the rooms not visited.
  const FIRST_ON = [...LAYERS.filter((l) => l.group === 'hundred').map((l) => l.id), 'bellway', 'ventrica', 'gauntlet', 'boss', 'fog', 'cocoon'];
  // So many they'd hide the map: drawn only close up; from afar, a count per room.
  const FINE = new Set(['rosary-cache', 'shard-cache', 'wall']);
  // The layers that only a save can say anything about.
  const OWN_ONLY = new Set(['fog', 'cocoon', 'journal', 'maps']);
  function layersOn() {
    if (Array.isArray(prefs.mapLayers)) return prefs.mapLayers.filter((k) => LAYER.has(k));
    // The earlier switches (mapKinds, mapPlaces), kept where they said something.
    const on = new Set(FIRST_ON);
    if (Array.isArray(prefs.mapKinds)) for (const k of ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea']) if (!prefs.mapKinds.includes(k)) on.delete(k);
    if (Array.isArray(prefs.mapPlaces)) for (const k of ['bench', 'bellway', 'ventrica', 'gauntlet']) { if (prefs.mapPlaces.includes(k)) on.add(k); else on.delete(k); }
    return [...on];
  }

  /* The glyphs, drawn in currentColor on a 14-unit grid. */
  const svg = (d) => `<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const GLYPH = {
    gauntlet: svg('<path d="M2.5 2.5l9 9M11.5 2.5l-9 9"/>'),
    boss: svg('<path d="M2.5 11.5V5l2.5 2 2-4 2 4 2.5-2v6.5z"/>'),
    lock: svg('<rect x="3" y="6.5" width="8" height="5.5" rx="1"/><path d="M4.8 6.5V4.8a2.2 2.2 0 014.4 0v1.7"/>'),
    quill: svg('<path d="M11.5 2.5c-4 .5-6.5 3.5-7.5 8M4 10.5l-1.5 1.5M7 5.5l2 2"/>'),
    wish: svg('<rect x="3" y="2.5" width="8" height="9" rx="1"/><path d="M5 5.5h4M5 8h4"/>'),
    giver: svg('<circle cx="7" cy="4.5" r="2"/><path d="M3 12c.5-2.8 2-4 4-4s3.5 1.2 4 4"/><path d="M11 2v2.5M9.8 3.2h2.4"/>'),
    person: svg('<circle cx="7" cy="4.5" r="2"/><path d="M3 12c.5-2.8 2-4 4-4s3.5 1.2 4 4"/>'),
    home: svg('<path d="M2.5 7L7 3l4.5 4M4 6v5.5h6V6"/>'),
    wall: svg('<path d="M2 3h10v8H2zM2 7h10M5 3v4M9 7v4"/>'),
    fog: svg('<path d="M2 5.5h7M4 8h8M2 10.5h6"/>'),
    map: svg('<path d="M2 3.5l3.3-1 3.4 1.5 3.3-1v8l-3.3 1-3.4-1.5-3.3 1z"/><path d="M5.3 2.5v8M8.7 4v8"/>'),
    spawn: svg('<path d="M7 2l1.5 3.2 3.5.4-2.6 2.4.7 3.5L7 9.8 3.9 11.5l.7-3.5L2 5.6l3.5-.4z"/>'),
    journal: svg('<path d="M3 2.5h7a1 1 0 011 1v8H4a1 1 0 01-1-1z"/><path d="M5 5h4"/>'),
  };

  /* ── The marks ──
     A mark with a key (data-mk) is a button: a tap opens its card. `style` places it on the map;
     without one it sits in a line (legend, lists). */
  let picked = '';   // the key of the mark whose card is open
  const tap = (key, title) => (key ? ` data-mk="${esc(key)}" role="button" tabindex="0" aria-label="${esc(title)}"` : '');
  const sel = (key) => (key && key === picked ? ' is-sel' : '');
  const attrs = (style, title, key) => `${style ? ` style="${style}"` : ''}${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}${tap(key, title)}`;
  // A piece or a thing: a dark disc with a rim in its layer's colour and the game's picture.
  const dot = (layer, src, style = '', title = '', key = '', cls = '') =>
    `<i class="mp-dot is-${layer}${cls}${sel(key)}"${attrs(style, title, key)}><img src="${src}" alt="" loading="lazy"></i>`;
  // A place: the game's own map pin.
  const pin = (layer, file, style = '', title = '', key = '', cls = '') =>
    `<img class="mp-pin is-${layer}${cls}${sel(key)}" src="assets/map/pins/${file}.webp" alt=""${attrs(style, title, key)}>`;
  // A badge: a creature's Journal portrait (a gauntlet's champion, a boss), or a glyph.
  const badge = (layer, inner, style = '', title = '', key = '', cls = '') =>
    `<span class="mp-pin is-badge is-${layer}${cls}${sel(key)}"${attrs(style, title, key)}>${inner}</span>`;
  const portrait = (id) => (id ? `<img src="assets/icons/journal/${id}.webp" alt="" loading="lazy">` : '');
  // A layer's mark in the legend.
  function legendMark(l) {
    const k = l.look;
    if (k.dot) return dot(l.id, k.dot);
    if (k.pin) return pin(l.id, k.pin);
    if (k.badge === 'gauntlet') return badge(l.id, portrait(champion(SS.gauntlets.GAUNTLETS[0])) || GLYPH.gauntlet);
    if (k.badge) return badge(l.id, GLYPH[k.badge]);
    return badge(l.id, GLYPH[k.glyph]);
  }
  /* A gauntlet: its champion, the Journal's portrait of its last wave's enemy, on the badge's rim. */
  const champion = (x) => { const w = x && x.waves[x.waves.length - 1]; return w && w[0] ? w[0][0] : null; };
  const bookOfFoe = (foe) => BOOK.get(foe) || BOOK.get(String(foe).replace(/-(the-cradle|far-fields|chapel-of-the-beast|weavenest-atla|coral-tower)$/, ''));

  /* ── What the map holds: every mark of every layer, for a game (null: Free mode with nothing) ──
     { key, layer, scene, act, got, name, sub, draw(style, title, key, cls) } */
  const haveArt = (g, id) => !!g && (g.arts.includes(id) || g.skills.includes(id));
  function wishOf(quest) { return CO.WISHES.findIndex((w) => w[2][0] === 'quest' && w[2][1] === quest); }
  const wishDone = (g, quest) => { const i = wishOf(quest); return !!g && i >= 0 && g.wishes.includes(i); };
  const complete = (g, e) => !!g && SS.completion.journalDone(e, g.journal);
  function things(g, own) {
    const out = [];
    const add = (m) => { if (m.scene && R.roomOf(m.scene)) out.push(m); };
    // The 100%.
    CO.PIECES.forEach((p, i) => {
      const scene = SP.AT.pieces[i];
      add({ key: 'piece:' + i, layer: p[0], scene, act: p[1], got: !!g && g.pieces.includes(i), area: p[3],
        name: p[4] ? pick(p[4]) : LAYER.get(p[0]).name(), draw: (s, ti, k, c) => dot(p[0], pieceIcon(p[0], p), s, ti, k, c) });
    });
    for (const ids of CO.COUNTED) {
      const id = ids[0], tool = D.TOOLS.find((x) => x.id === id), w = CO.WHERE.tools[id] || [];
      add({ key: 'tools:' + id, layer: 'tools', scene: SP.AT.tools[id], act: w[0], area: w[1], got: !!g && ids.some((x) => g.tools.includes(x)),
        name: pick(tool.name), draw: (s, ti, k, c) => dot('tools', `assets/icons/tools/${id}.webp`, s, ti, k, c) });
    }
    for (const [cat, list] of [['crests', D.CRESTS], ['skills', D.SKILLS], ['arts', D.ARTS]]) {
      for (const [id, w] of Object.entries(CO.WHERE[cat])) {
        const x = list.find((y) => y.id === id);
        add({ key: cat + ':' + id, layer: cat, scene: SP.AT[cat][id], act: w[0], area: w[1], got: !!g && g[cat].includes(id),
          name: x ? pick(x.name) : id, draw: (s, ti, k, c) => dot(cat, `assets/icons/${cat}/${id}.webp`, s, ti, k, c) });
      }
    }
    add({ key: 'everbloom', layer: 'everbloom', scene: SP.AT.everbloom, act: (CO.WHERE.everbloom || [])[0], got: !!g && g.everbloom,
      name: t('cat_items'), draw: (s, ti, k, c) => dot('everbloom', 'assets/icons/items/everbloom.webp', s, ti, k, c) });
    // Places: the pins (a station not open, a toll not paid: dimmed, cls ' is-off').
    const lit = new Set(own ? own.lit : []);
    R.pinsOn(R.mapFlags(own)).forEach((p, pi) => {
      const open = !p[4] || !own || lit.has(pinKey(p));
      const name = t(p[0] === 'bench' ? 'mapPlace_bench1' : 'mapPlace_' + p[0]);
      out.push({ key: 'pin:' + pi, layer: p[0], scene: p[3], at: { x: p[1], y: p[2] }, got: false, off: !open, pinData: p,
        name, sub: open ? '' : t(p[0] === 'bench' ? 'mapToll' : 'mapClosed'),
        draw: (s, ti, k, c) => pin(p[0], p[0] === 'bench' ? 'pin_bench' : p[0] === 'bellway' ? 'pin_stag_station' : 'pin_tube_station', s, ti, k, c + (open ? '' : ' is-off')) });
    });
    for (const x of SS.gauntlets.GAUNTLETS) {
      add({ key: 'gaunt:' + x.id, layer: 'gauntlet', scene: x.scene, got: !!g && g.gauntlets.includes(x.id), area: x.area, gauntlet: x,
        name: App.gauntletName(x.id), draw: (s, ti, k, c) => badge('gauntlet', portrait(champion(x)) || GLYPH.gauntlet, s, ti, k, c) });
    }
    for (const [foe, scene] of SP.BOSSES) {
      const f = FOE.get(foe), e = bookOfFoe(foe);
      add({ key: 'boss:' + foe, layer: 'boss', scene, got: !!g && g.bosses.includes(foe), name: f ? pick(f.name) : foe, foe, entry: e && e.id,
        draw: (s, ti, k, c) => badge('boss', portrait(e && e.id) || GLYPH.boss, s, ti, k, c) });
    }
    for (const [field, scene] of SP.BELLS) {
      const b = QU.BELLSHRINES.find((x) => x.field === field);
      add({ key: 'bell:' + field, layer: 'bellshrine', scene, got: !!g && g.bellshrines.includes(field), name: t('mapBell', { area: pick(b.name) }),
        draw: (s, ti, k, c) => pin('bellshrine', 'quest_map_icon_grand_gate_final', s, ti, k, c) });
    }
    for (const [k, scenes] of Object.entries(QU.LOCKS)) scenes.forEach((scene) => add({ key: 'lock:' + k + ':' + scene, layer: 'lock', scene, got: false,
      name: t('mapLock'), sub: t('mapLockKey', { key: pick(SP.KEYS[k]) }), lockKey: k, draw: (s, ti, kk, c) => badge('lock', GLYPH.lock, s, ti, kk, c) }));
    for (const [v, scenes] of Object.entries(SP.VENDORS)) {
      if (v === 'shakra') { scenes.forEach((scene, i) => add({ key: 'shakra:' + i, layer: 'shakra', scene, got: false, name: pick(HW.NPCS.shakra), npc: 'shakra',
        draw: (s, ti, k, c) => badge('shakra', GLYPH.quill, s, ti, k, c) })); continue; }
      scenes.forEach((scene, i) => add({ key: 'shop:' + v + ':' + i, layer: 'shop', scene, got: false, name: pick(HW.NPCS[v]), npc: v,
        draw: (s, ti, k, c) => pin('shop', 'pin_shop', s, ti, k, c) }));
    }
    // People: the Wishwalls and who offers a wish, each with the wishes still open there.
    const boards = new Map(), givers = new Map();
    for (const [quest, f] of Object.entries(QU.FROM)) {
      if (wishOf(quest) < 0) continue;
      if (f.board) { const k = lower(f.board); if (!boards.has(k)) boards.set(k, { scene: f.board, quests: [] }); boards.get(k).quests.push(quest); }
      for (const n of f.npc || []) { const k = lower(n); if (!givers.has(k)) givers.set(k, { scene: n, quests: [] }); givers.get(k).quests.push(quest); }
    }
    for (const [k, b] of boards) add({ key: 'board:' + k, layer: 'wishwall', scene: b.scene, quests: b.quests, got: !!g && b.quests.every((q) => wishDone(g, q)),
      name: t('mapLayer_wishwall1'), draw: (s, ti, kk, c) => badge('wishwall', GLYPH.wish, s, ti, kk, c) });
    for (const [k, b] of givers) add({ key: 'giver:' + k, layer: 'giver', scene: b.scene, quests: b.quests, got: !!g && b.quests.every((q) => wishDone(g, q)),
      name: t('mapLayer_giver1'), draw: (s, ti, kk, c) => badge('giver', GLYPH.giver, s, ti, kk, c) });
    for (const [id, scene] of Object.entries(SP.PEOPLE)) add({ key: 'person:' + id, layer: 'person', scene, got: false, npc: id,
      name: id === 'scrounge' ? t('mapScrounge') : pick(HW.NPCS[id]), draw: (s, ti, k, c) => badge('person', GLYPH.person, s, ti, k, c) });
    // Other collectibles.
    SP.EXTRAS.forEach((x, i) => {
      const [kind, act, check, scene, name] = x;
      const layer = kind;
      const icon = kind === 'memento' ? (MEMENTO_ICON[check[1]] ? `assets/icons/extras/${MEMENTO_ICON[check[1]]}.webp` : 'assets/icons/pieces/heart-bloom.webp')
        : kind === 'silkeater' ? null : kind === 'spawn' || kind === 'bellhome' || kind === 'wall' ? null : `assets/icons/extras/${kind}.webp`;
      const spawn = kind === 'spawn' ? BOOK_KEY.get(name && name.key) : null;
      add({ key: 'extra:' + i, layer, scene, act, got: !!g && g.extras.includes(i), needs: SP.NEEDS['extra:' + i],
        name: name ? pick(name) : LAYER.get(layer).name(),
        draw: (s, ti, k, c) => (kind === 'silkeater' ? pin('silkeater', 'pin_grub_location', s, ti, k, c)
          : kind === 'spawn' ? badge('spawn', portrait(spawn && spawn.id) || GLYPH.spawn, s, ti, k, c)
            : icon ? dot(layer, icon, s, ti, k, c) : badge(layer, GLYPH[kind === 'bellhome' ? 'home' : 'wall'], s, ti, k, c)) });
    });
    // Your game: the cocoon and the Journal's entries still missing.
    if (own && own.cocoon) add({ key: 'cocoon', layer: 'cocoon', scene: own.cocoon, got: false, name: t('mapLayer_cocoon'), sub: t('mapCocoonNote'),
      draw: (s, ti, k, c) => pin('cocoon', 'shade_pin', s, ti, k, c) });
    if (own) for (const e of J.BOOK) {
      const rooms = SS.journalRooms[e.key];
      const scene = rooms && (rooms.map(([sc]) => sc).find((sc) => R.roomOf(sc)));
      add({ key: 'journal:' + e.id, layer: 'journal', scene, got: complete(own, e), name: pick(e.name), entry: e.id,
        draw: (s, ti, k, c) => badge('journal', portrait(e.id), s, ti, k, c) });
    }
    for (const m of out) if (!m.needs) m.needs = SP.NEEDS[m.key];
    return out;
  }
  // Where a thing of the map is, by its key, for the other screens (Progress, the Journal).
  let cache = null;
  function all() {
    const own = App.game(), g = own || (App.freeView ? App.freeView() : null);
    const stamp = JSON.stringify([own ? [(App.gameMeta() || {}).saved, own.bench, own.pieces.length, own.extras.length, own.visited.length]
      : App.freeGame ? App.freeGame() : null, prefs.lang]);
    if (!cache || cache.stamp !== stamp) cache = { stamp, list: things(g, own), g, own };
    return cache;
  }
  App.mapHas = (key) => all().list.some((m) => m.key === key);

  /* Which marks show: the layer on, and in a save (or Free mode with marks) not had yet; then the
     Act and "reach now" filters. The pins show open or not; the Journal's and the save's own
     layers need a save. */
  function shows(m, g, own) {
    if (OWN_ONLY.has(m.layer) && !own) return false;
    if (g && m.got) return false;
    const act = prefs.mapAct || 0;
    if (act && m.act != null && Math.max(1, m.act) !== act) return false;
    if (prefs.mapReach && g && m.needs && !m.needs.every((id) => haveArt(g, id))) return false;
    return true;
  }

  const at = (x, y) => `left:${(x / M.W * 100).toFixed(3)}%;top:${(y / M.H * 100).toFixed(3)}%`;
  /* The rooms that change with the game (js/map.js LAYERS), those this game has. */
  const pct = (v, of) => (v / of * 100).toFixed(3) + '%';
  const layersHtml = (flags) => R.layersOn(flags).map(([, x, y, w, h, top]) =>
    `<span class="mp-layer" style="left:${pct(x, M.W)};top:${pct(y, M.H)};width:${pct(w, M.W)};height:${pct(h, M.H)}">`
    + `<img src="assets/map/states.webp" alt="" width="${M.SW}" height="${M.SH}" style="width:${pct(M.SW, w)};top:-${pct(top, h)}"></span>`).join('');
  /* The rooms not visited, dimmed: a veil over the whole map with each visited room cut out of it
     (an SVG mask in the image's pixels). */
  function fogHtml(own) {
    const seen = new Set(own.visited.map(lower));
    const holes = Object.entries(M.ROOMS).filter(([s, r]) => r[2] && seen.has(lower(s)))
      .map(([, r]) => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"/>`).join('');
    return `<svg class="mp-fog" viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="none" aria-hidden="true">
        <defs><mask id="mp-fog-m"><rect width="${M.W}" height="${M.H}" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
        <rect width="${M.W}" height="${M.H}" mask="url(#mp-fog-m)"/></svg>`;
  }

  /* Each area's name at the middle of its drawn rooms, for the areas with more than three; with
     the rooms it has (for its card). Worked out once. */
  let areaNames = null;
  function AREA_NAMES() {
    if (areaNames) return areaNames;
    const sum = {};
    for (const [scene, r] of Object.entries(M.ROOMS)) {
      const a = R.areaOf(scene);
      if (!a || !r[2] || !CO.AREAS[a]) continue;
      const s = sum[a] || (sum[a] = [0, 0, 0, []]);
      s[0] += r[0] + r[2] / 2; s[1] += r[1] + r[3] / 2; s[2]++; s[3].push(scene);
    }
    return (areaNames = Object.entries(sum).filter(([, s]) => s[2] > 3).map(([id, s]) => ({ id, x: s[0] / s[2], y: s[1] / s[2], rooms: s[3] })));
  }
  const mapped = (own) => new Set((own ? own.maps : []).map((f) => SP.MAPS[f]).filter(Boolean));
  const MAPPABLE = new Set(Object.values(SP.MAPS));

  /* Hornet's bench and her way from the previous one. */
  function before() {
    let prev = null;
    try { prev = JSON.parse(App.load('pharloom.prev') || 'null'); } catch (e) { prev = null; }
    return prev && prev.snap ? SS.savefile.gameOf(prev.snap) : null;
  }
  function benchPoint(scene, pins) {
    const room = scene ? R.roomOf(scene) : null;
    if (!room) return null;
    const p = pins.find((x) => x[0] === 'bench' && (R.roomOf(x[3]) || {}).scene === room.scene);
    return p ? { x: p[1], y: p[2] } : { x: room.x, y: room.y };
  }
  /* The way's key, cheap (no path searched): the two benches and when this save was written, so
     a later return between the same two benches walks again. null with no way to walk. */
  function wayKey(g) {
    const b = before();
    if (!g || !b || !b.bench || !g.bench || b.bench === g.bench) return null;
    return b.bench + '>' + g.bench + '@' + ((App.gameMeta() || {}).saved || '');
  }
  function way(g, pins) {
    const key = wayKey(g);
    if (!key) return null;
    const b = before();
    const path = R.path(b.bench, g.bench, g.lit) || [];
    const mid = path.slice(1, -1).map((s) => R.roomOf(s)).filter(Boolean);
    pins = pins || R.pinsOn(R.mapFlags(g));
    const pts = [benchPoint(b.bench, pins), ...mid, benchPoint(g.bench, pins)].filter(Boolean);
    return path.length > 1 && pts.length > 1 ? { key, pts } : null;
  }
  function wayHtml(g, pins) {
    const w = way(g, pins);
    if (!w) return '';
    const start = w.pts[0];
    return `<svg class="mp-way" viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${w.pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')}"/></svg>
      <i class="mp-from" style="${at(start.x, start.y)}" title="${esc(t('mapFrom'))}"></i>`;
  }

  /* What's missing nearest your bench, for Your game (App.nearList, App.nearRow): the loose pieces
     and the gauntlets, by rooms, nearest first. */
  const NEAR_KINDS = ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea'];
  function nearList(g) {
    if (!g || !g.bench) return [];
    const w = R.walk(g.bench, g.lit);
    const list = [];
    CO.PIECES.forEach((p, i) => {
      if (!NEAR_KINDS.includes(p[0]) || g.pieces.includes(i)) return;
      const n = R.steps(g.bench, R.sceneOf(p[2]) || SP.AT.pieces[i], g.lit, w);
      if (n != null) list.push({ n, key: 'piece:' + i, mark: dot(p[0], pieceIcon(p[0], p)), name: p[4] ? pick(p[4]) : LAYER.get(p[0]).name(), area: p[3] });
    });
    for (const x of SS.gauntlets.GAUNTLETS) {
      if (g.gauntlets.includes(x.id)) continue;
      const n = R.steps(g.bench, x.scene, g.lit, w);
      if (n != null) list.push({ n, key: 'gaunt:' + x.id, mark: badge('gauntlet', portrait(champion(x)) || GLYPH.gauntlet), name: App.gauntletName(x.id), area: x.area });
    }
    return list.sort((a, b) => a.n - b.n);
  }
  // Each row opens the Map on its thing.
  const nearRow = (x) => `<li>${x.mark}<button type="button" class="text-btn mp-near-name" data-act="mapShow" data-value="${esc(x.key)}" title="${esc(t('mapOnMap'))}"${NT}>${esc(x.name)}</button>
        <span class="mp-near-area"${NT}>${esc(areaName(x.area))}</span><b>${esc(stepsText(x.n))}</b></li>`;
  App.nearList = nearList;
  App.nearRow = nearRow;

  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let finds = [], placed = new Map(), pending = '';

  App.screens.map = (sec) => {
    const { list, g, own } = all();
    const on = new Set(layersOn());
    const names = prefs.mapNames !== false;
    // The marks of the layers on, placed; several in one room fan out a little, so each can be seen.
    placed = new Map();
    const count = {}, seen = new Map(), fine = new Map();
    let marks = '';
    for (const m of list) {
      if (!shows(m, g, own)) continue;
      count[m.layer] = (count[m.layer] || 0) + 1;
      const room = m.at ? null : R.roomOf(m.scene);
      const base = m.at || (room && { x: room.x, y: room.y });
      if (!base) continue;
      const k = (room && room.scene) || m.key;
      const n = m.at ? 0 : seen.get(k) || 0;
      if (!m.at) seen.set(k, n + 1);
      const pt = { x: base.x + (n % 6) * 24, y: base.y + Math.floor(n / 6) * 24 };
      placed.set(m.key, pt);
      if (!on.has(m.layer)) continue;
      const title = [m.name, m.sub, m.act ? t('saveAct', { n: m.act }) : ''].filter(Boolean).join(' · ');
      const isFine = FINE.has(m.layer);
      if (isFine) { const f = fine.get(k) || { ...base, n: 0 }; f.n++; fine.set(k, f); }
      marks += m.draw(at(pt.x, pt.y), title, m.key, isFine ? ' is-fine' : '');
    }
    const clusters = [...fine.values()].map((f) => `<span class="mp-cluster" style="${at(f.x, f.y)}" aria-hidden="true">${num(f.n)}</span>`).join('');
    const flags = R.mapFlags(own), shownPins = R.pinsOn(flags);
    const bench = own ? benchPoint(own.bench, shownPins) : null;
    const hornet = bench ? `<span class="mp-hornet hn is-sit" role="img" aria-label="${esc(t('mapBench'))}" title="${esc(t('mapBench'))}" style="${at(bench.x, bench.y)}"></span>` : '';
    const fog = own && on.has('fog') ? fogHtml(own) : '';
    const bought = mapped(own);
    const namesHtml = names ? AREA_NAMES().map((a) => {
      const unmapped = own && on.has('maps') && MAPPABLE.has(a.id) && !bought.has(a.id);
      return `<span class="mp-name${unmapped ? ' is-unmapped' : ''}${sel('area:' + a.id)}" style="${at(a.x, a.y)}" data-mk="area:${a.id}" role="button" tabindex="0"${NT}
        ${unmapped ? ` title="${esc(t('mapUnmapped'))}"` : ''}>${esc(areaName(a.id))}</span>`;
    }).join('') : '';

    /* The legend: a group per heading, folded or open as left (prefs.mapOpen), its switch for all
       of it and each layer's own mark its switch, dimmed off, with its count. */
    const open = prefs.mapOpen || { hundred: true, places: true };
    const sw = (l) => {
      const n = count[l.id];
      return `<li><button type="button" class="mp-sw" data-act="mapLayer" data-value="${l.id}" aria-pressed="${on.has(l.id)}">
        ${legendMark(l)}<span${NT}>${esc(l.name())}</span>${n != null && l.id !== 'fog' ? ` <b>${num(n)}</b>` : ''}</button></li>`;
    };
    const groups = GROUPS.map((gr) => {
      const ls = LAYERS.filter((l) => l.group === gr && (gr !== 'game' || own));
      if (!ls.length) return '';
      const isOpen = !!open[gr], allOn = ls.every((l) => on.has(l.id));
      const n = ls.reduce((a, l) => a + (on.has(l.id) && l.id !== 'fog' ? count[l.id] || 0 : 0), 0);
      return `<section class="mp-grp${isOpen ? ' is-open' : ''}">
          <div class="mp-grp-h"><button type="button" class="mp-grp-t" data-act="mapOpen" data-value="${gr}" aria-expanded="${isOpen}">
            <span class="mp-grp-c" aria-hidden="true">${isOpen ? '▾' : '▸'}</span><span class="lbl">${esc(groupName(gr))}</span>${n ? ` <b>${num(n)}</b>` : ''}</button>
            <button type="button" class="text-btn mp-grp-all" data-act="mapGroup" data-value="${gr}" aria-pressed="${allOn}">${esc(t(allOn ? 'mapNone' : 'mapAll'))}</button></div>
          ${isOpen ? `<ul class="mp-sws">${ls.map(sw).join('')}</ul>` : ''}
        </section>`;
    }).join('');
    const act = prefs.mapAct || 0;
    const filters = `<div class="mp-filters">
        <div class="seg" role="group" aria-label="${esc(t('mapActs'))}">${[0, 1, 2, 3].map((n) =>
          `<button type="button" data-act="mapAct" data-value="${n}" aria-pressed="${act === n}">${esc(n ? t('saveAct', { n }) : t('mapActAll'))}</button>`).join('')}</div>
        ${g ? `<button type="button" class="mp-sw" data-act="mapReach" aria-pressed="${!!prefs.mapReach}"><span class="check-box" aria-hidden="true"></span><span>${esc(t('mapReachNow'))}</span></button>` : ''}
        <button type="button" class="mp-sw" data-act="mapNames" aria-pressed="${names}"><span class="mp-aa" aria-hidden="true">Aa</span><span>${esc(t('mapNames'))}</span></button>
      </div>`;
    const legend = `<div class="mp-legend">${filters}${groups}</div>`;
    const big = !!prefs.mapBig;
    const tools = `<div class="mp-tools" role="group" aria-label="${esc(t('mapZoom'))}">
        <button type="button" data-act="mapZoom" data-value="in" aria-label="${esc(t('mapCloser'))}" title="${esc(t('mapCloser'))}">+</button>
        <button type="button" data-act="mapZoom" data-value="out" aria-label="${esc(t('mapFurther'))}" title="${esc(t('mapFurther'))}">−</button>
        <button type="button" class="mp-big" data-act="mapBig" aria-pressed="${big}" aria-label="${esc(t(big ? 'mapSmall' : 'mapFull'))}" title="${esc(t(big ? 'mapSmall' : 'mapFull'))}">${big ? '⤡' : '⤢'}</button></div>`;
    const search = `<div class="mp-find"><label class="search">${App.lens}<input type="search" data-change="mapFind" placeholder="${esc(t('mapFind'))}" aria-label="${esc(t('mapFind'))}" autocomplete="off"></label>
        <ul class="mp-found" hidden></ul></div>`;
    sec.innerHTML = `<div class="mp${big ? ' is-big' : ''}">${brackets}${screenHead(esc(t('navMap')))}
      <div class="mp-stage">
        <div class="mp-view"><div class="mp-map">
          <img class="mp-rooms" src="assets/map/rooms${hdOn ? '-hd' : ''}.webp" alt="${esc(t('mapAlt'))}" width="${M.W}" height="${M.H}">${layersHtml(flags).replace(/states\.webp/g, hdOn ? 'states-hd.webp' : 'states.webp')}
          ${fog}${own ? wayHtml(own, shownPins) : ''}${namesHtml}${marks}${clusters}${hornet}<i class="mp-ping" hidden></i>
        </div></div>
        ${search}${tools}
      </div>
      ${legend}
      <p class="pg-note">${esc(t('mapNote'))}</p></div>`;
    cardCtx = { g, own };
    // The view as it was, once the screen shows; or the thing another screen asked for.
    requestAnimationFrame(() => {
      applyView();
      if (pending) { const k = pending; pending = ''; focusOn(k); }
    });
  };
  // A mark centred close up, its card open and a ring pulsing where it is.
  function focusOn(key) {
    const p = placed.get(key) || (key.startsWith('area:') ? AREA_NAMES().find((a) => 'area:' + a.id === key) : null);
    if (!p) return;
    centreOn(p.x, p.y, 3);
    const sec = App.screenOf('map'), ping = sec && sec.querySelector('.mp-ping');
    if (ping) { ping.setAttribute('style', at(p.x, p.y)); ping.hidden = false; ping.classList.remove('is-on'); void ping.offsetWidth; ping.classList.add('is-on'); }
    pick1(key);
  }
  /* Another screen's "on the map" (Progress, the Journal, Your game): the Map opens on that thing,
     its layer switched on. */
  App.mapShow = (key) => {
    const m = all().list.find((x) => x.key === key);
    if (!m) return;
    const on = layersOn();
    if (!on.includes(m.layer)) { prefs.mapLayers = [...on, m.layer]; }
    prefs.mapAct = 0;
    savePrefs();
    pending = key;
    if (prefs.view === 'map') render(); else App.go('map');
  };

  /* ── Moving around, as the sibling's map (hallownest-calculator js/app-map.js) ──
     The map is the image and its marks in one layer (.mp-map), moved and scaled by a transform:
     dragging moves it, the wheel or a pinch zooms at the pointer, + and − zoom at the middle. The
     whole map fitted to the box is the furthest; eight times that the closest. The marks and the
     names keep their size on screen (--k, the scale's inverse). The view lasts while the page is
     open; it isn't saved. */
  let view = null;   // { s, x, y }: the scale and the offset in px; null = fitted
  const nodes = () => { const sec = App.screenOf('map'); return sec ? { v: sec.querySelector('.mp-view'), m: sec.querySelector('.mp-map') } : {}; };
  const fitOf = (W, H) => { const mh = W * M.H / M.W; const s = Math.min(1, H / mh); return { s, x: (W - W * s) / 2, y: (H - mh * s) / 2 }; };
  function clamp(W, H) {
    const mw = W * view.s, mh = W * M.H / M.W * view.s;
    view.x = mw <= W ? (W - mw) / 2 : Math.min(0, Math.max(W - mw, view.x));
    view.y = mh <= H ? (H - mh) / 2 : Math.min(0, Math.max(H - mh, view.y));
  }
  function applyView() {
    const { v, m } = nodes();
    if (!v || !m || !v.clientWidth) return;
    const W = v.clientWidth, H = v.clientHeight, fit = fitOf(W, H);
    if (!view) view = { ...fit };
    view.s = Math.min(fit.s * 8, Math.max(fit.s, view.s));
    clamp(W, H);
    m.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
    m.style.setProperty('--k', String(1 / view.s));
    v.classList.toggle('is-zoomed', view.s > fit.s * 1.5);
    v.classList.toggle('is-close', view.s > fit.s * 3);   // the caches and walls, one by one
    // Close up, the map at twice the resolution (assets/map/rooms-hd.webp, tools/extract-map.py):
    // loaded the first time it's needed, and kept.
    if (view.s * W * (window.devicePixelRatio || 1) > M.W * 1.1) hd(m);
    paintCard();
  }

  /* ── The card of the mark tapped, over the map, as the sibling's: its picture, its name, where
     it is and what it says (how it's had, what's still open there); in Free mode a piece can be
     marked had from it; a gauntlet or a boss takes you to fight it, a boss or an entry to the
     Journal. It follows its mark as the map moves; ×, Escape or a tap on the empty map close it. ── */
  let cardCtx = null;
  // The things of the 100% a person gives or sells (js/how.js HOW), by the map's keys.
  function givenBy(id) {
    const keys = [];
    const scan = (cat, ways, key) => { if ((ways || []).some((w) => (w.kind === 'shop' && w.vendor === id) || w.npc === id)) keys.push(key); };
    for (const [i, ways] of Object.entries(HW.HOW.pieces)) scan('pieces', ways, 'piece:' + i);
    for (const cat of ['tools', 'crests', 'skills', 'arts']) for (const [k, ways] of Object.entries(HW.HOW[cat])) scan(cat, ways, cat + ':' + k);
    return keys;
  }
  const listOf = (names, more) => names.slice(0, 6).join(', ') + (names.length > 6 ? ' ' + t('mapMore', { n: num(names.length - 6) }) : '') + (more || '');
  function cardHtml(key) {
    const c = cardCtx || {};
    const { list } = all();
    const own = c.own, g = c.g;
    const line = (xs) => xs.filter(Boolean).map((x) => `<span${NT}>${esc(x)}</span>`).join('');
    const state = (x) => `<span class="mp-card-state">${esc(x)}</span>`;
    const btn = (act, value, label) => `<button type="button" class="text-btn" data-act="${act}" data-value="${esc(value)}">${esc(label)}</button>`;
    const away = (scene) => { const n = own && own.bench && scene ? R.steps(own.bench, scene, own.lit) : null; return n == null ? '' : stepsText(n); };
    let art = '', name = '', where = '', note = '', acts = '';
    if (key.startsWith('area:')) {
      const id = key.slice(5), a = AREA_NAMES().find((x) => x.id === id);
      if (!a) return '';
      name = areaName(id);
      art = badge('maps', GLYPH.map);
      const inArea = list.filter((m) => m.scene && R.areaOf(m.scene) === id);
      const hundred = inArea.filter((m) => LAYER.get(m.layer).group === 'hundred' && (!g || !m.got)).length;
      const visited = own ? a.rooms.filter((s) => own.visited.some((v) => lower(v) === lower(s))).length : null;
      where = line([visited != null ? t('mapAreaRooms', { n: num(visited), m: num(a.rooms.length) }) : t('mapAreaRoomsAll', { m: num(a.rooms.length) }),
        own && MAPPABLE.has(id) && !mapped(own).has(id) ? t('mapUnmapped') : '']);
      note = [t('mapAreaHundred', { n: num(hundred) }),
        own ? t('mapAreaJournal', { n: num(inArea.filter((m) => m.layer === 'journal' && !m.got).length) }) : '',
        t('mapAreaGauntlets', { n: num(inArea.filter((m) => m.layer === 'gauntlet' && (!g || !m.got)).length) })].filter(Boolean).join(' · ');
      return cardShell(art, name, where, note, acts);
    }
    const m = list.find((x) => x.key === key);
    if (!m) return '';
    art = m.draw('', '', '', '');
    name = m.name;
    const area = m.area || R.areaOf(m.scene);
    where = line([areaName(area), m.act ? t('saveAct', { n: m.act }) : '', m.sub, away(m.scene)]);
    const kind = key.split(':')[0];
    if (kind === 'piece') {
      const i = Number(key.slice(6));
      note = App.howPiece ? App.howPiece(i) : '';
      acts = own ? state(t(m.got ? 'pgGot' : 'invMissing'))
        : `<button type="button" class="text-btn" data-act="mapMark" data-value="${i}" aria-pressed="${m.got}">${esc(t(m.got ? 'mapUnmark' : 'mapMark'))}</button>`;
    } else if (['tools', 'crests', 'skills', 'arts', 'everbloom'].includes(kind)) {
      note = App.howOf ? App.howOf(key) : '';
      if (g) acts = state(t(m.got ? 'pgGot' : 'invMissing'));
    } else if (kind === 'pin') {
      if (m.off) acts = state(m.sub);
      where = line([areaName(area), away(m.scene)]);
    } else if (kind === 'gaunt') {
      const x = m.gauntlet, n = x.waves.length;
      where = line([areaName(x.area), t(n === 1 ? 'ftWaves1' : 'ftWaves', { n: num(n) }), away(m.scene)]);
      note = x.reward ? t('ftReward') + ': ' + pick(x.reward) : '';
      acts = btn('mapFight', x.id, t('mapFight'));
    } else if (kind === 'boss') {
      if (g) acts = state(t(m.got ? 'mapBeaten' : 'mapNotBeaten'));
      acts += btn('mapFoe', m.foe, t('mapFight')) + (m.entry ? btn('mapJournal', m.entry, t('mapToJournal')) : '');
    } else if (kind === 'bell') {
      if (g) acts = state(t(m.got ? 'mapRung' : 'mapNotRung'));
    } else if (kind === 'shop' || kind === 'person' || kind === 'shakra') {
      const id = m.npc;
      if (id === 'shakra') {
        const bought = new Set(own ? own.maps : []);
        const left = Object.keys(SP.MAPS).filter((f) => !bought.has(f)).map((f) => areaName(SP.MAPS[f])).filter(Boolean);
        note = own ? (left.length ? t('mapShakraLeft', { list: listOf(left) }) : t('mapShakraAll')) : t('mapShakraNote');
      } else if (id === 'scrounge') {
        note = t('mapScroungeNote');
      } else {
        const things = givenBy(id).map((k) => list.find((x) => x.key === k)).filter((x) => x && (!g || !x.got));
        note = things.length ? t(g ? 'mapSellsLeft' : 'mapSells', { list: listOf(things.map((x) => x.name)) }) : g ? t('mapSellsNone') : '';
      }
    } else if (kind === 'board' || kind === 'giver') {
      const open = m.quests.filter((q) => !wishDone(g, q)).map((q) => pick(CO.WISHES[wishOf(q)][4]));
      note = open.length ? t(g ? 'mapWishesLeft' : 'mapWishes', { list: listOf(open) }) : t('mapWishesNone');
    } else if (kind === 'lock') {
      note = m.sub;
      where = line([areaName(area), away(m.scene)]);
    } else if (kind === 'extra') {
      if (g) acts = state(t(m.got ? 'pgGot' : 'invMissing'));
    } else if (kind === 'journal') {
      const e = BOOK.get(m.entry), k = own && own.journal[e.id];
      note = k === undefined ? t('hjState_unseen') : e.kills != null ? t('mapKills', { n: num(k), m: num(e.kills) }) : t('hjState_seen');
      acts = btn('mapJournal', e.id, t('mapToJournal'));
    }
    return cardShell(art, name, where, note, acts);
  }
  const cardShell = (art, name, where, note, acts) => `<div class="mp-card" role="dialog" aria-label="${esc(name)}">
        <span class="mp-card-art">${art}</span>
        <span class="mp-card-t"><b${NT}>${esc(name)}</b>${where}${note ? `<span class="mp-card-note">${esc(note)}</span>` : ''}</span>
        ${acts ? `<span class="mp-card-acts">${acts}</span>` : ''}
        <button type="button" class="icon-btn mp-card-x" data-act="mapPick" data-value="" aria-label="${esc(t('mapCardClose'))}" title="${esc(t('mapCardClose'))}">${App.cross}</button>
      </div>`;
  function paintCard() {
    const sec = App.screenOf('map'), stage = sec && sec.querySelector('.mp-stage');
    if (!stage) return;
    let c = stage.querySelector('.mp-card-wrap');
    const el = picked && stage.querySelector(`[data-mk="${CSS.escape(picked)}"]`);
    if (!el) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('div'); c.className = 'mp-card-wrap'; stage.appendChild(c); }
    if (c.dataset.key !== picked) { c.innerHTML = cardHtml(picked); c.dataset.key = picked; }
    const r = el.getBoundingClientRect(), br = stage.getBoundingClientRect();
    const sx = r.left + r.width / 2 - br.left, sy = r.top - br.top;
    const half = c.firstElementChild ? c.firstElementChild.offsetWidth / 2 + 8 : 0;
    c.style.left = (half * 2 > br.width ? br.width / 2 : Math.max(half, Math.min(br.width - half, sx))) + 'px';
    c.style.top = sy + 'px';
    c.classList.toggle('is-below', sy < (c.firstElementChild ? c.firstElementChild.offsetHeight : 0) + 24);
  }
  const pick1 = (key) => { picked = key; const { m } = nodes(); if (m) for (const x of m.querySelectorAll('.is-sel')) x.classList.remove('is-sel');
    const el = key && m && m.querySelector(`[data-mk="${CSS.escape(key)}"]`); if (el) el.classList.add('is-sel');
    const sec = App.screenOf('map'), c = sec && sec.querySelector('.mp-card-wrap'); if (c) c.dataset.key = ''; paintCard(); };
  let hdOn = false;
  function hd(m) {
    for (const img of m.querySelectorAll('.mp-rooms, .mp-layer img')) {
      if (/-hd\.webp$/.test(img.getAttribute('src'))) continue;
      const big = img.getAttribute('src').replace(/\.webp$/, '-hd.webp');
      const pre = new Image();
      pre.onload = () => { img.src = big; };
      pre.src = big;
    }
    hdOn = true;
  }
  function zoomAt(f, cx, cy) {
    if (!view) return;
    const { v } = nodes();
    const fit = fitOf(v.clientWidth, v.clientHeight);
    const s = Math.min(fit.s * 8, Math.max(fit.s, view.s * f));
    view.x = cx - (cx - view.x) * (s / view.s); view.y = cy - (cy - view.y) * (s / view.s); view.s = s;
    applyView();
  }
  // A map point (the image's pixels) centred at a scale of the fitted one.
  function centreOn(px, py, times) {
    const { v } = nodes();
    if (!v) return;
    const W = v.clientWidth, H = v.clientHeight, fit = fitOf(W, H);
    const s = fit.s * times, k = W / M.W * s;
    view = { s, x: W / 2 - px * k, y: H / 2 - py * k };
    applyView();
  }
  // Keeps a map point in view (js/app-hornet.js, while she walks).
  App.mapKeep = (px, py) => {
    const { v } = nodes();
    if (!v || !view) return;
    const k = v.clientWidth / M.W * view.s, sx = view.x + px * k, sy = view.y + py * k;
    if (sx < 0 || sy < 0 || sx > v.clientWidth || sy > v.clientHeight) { view.x += v.clientWidth / 2 - sx; view.y += v.clientHeight / 2 - sy; applyView(); }
  };
  const touches = new Map();
  let drag = null, pinch = null, moved = false;
  // A tap (not the end of a drag): on a mark, its card; on the empty map, the card closes.
  document.addEventListener('click', (e) => {
    const v = inView(e);
    if (!v || e.target.closest('.mp-card-wrap')) return;
    if (moved) { moved = false; return; }
    const mk = e.target.closest('[data-mk]');
    pick1(mk && mk.dataset.mk !== picked ? mk.dataset.mk : '');
  });
  document.addEventListener('keydown', (e) => {
    const mk = e.target.closest && e.target.closest('.mp-map [data-mk]');
    if (mk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick1(mk.dataset.mk); }
    else if (e.key === 'Escape' && picked) pick1('');
  });
  const inView = (e) => { const { v } = nodes(); return v && v.contains(e.target) && !e.target.closest('.mp-find, .mp-tools, .mp-card-wrap') ? v : null; };
  document.addEventListener('pointerdown', (e) => {
    const v = inView(e);
    if (!v || !view || (e.pointerType === 'mouse' && e.button !== 0)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 1) { drag = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y }; moved = false; v.classList.add('is-grabbing'); }
    else if (touches.size === 2) {
      const [a, b] = [...touches.values()], r = v.getBoundingClientRect();
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view.s, cx: (a[0] + b[0]) / 2 - r.left, cy: (a[1] + b[1]) / 2 - r.top };
      drag = null;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId) || !view) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true;
      view.x = drag.ox + e.clientX - drag.x; view.y = drag.oy + e.clientY - drag.y; applyView();
    }
    else if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      zoomAt((Math.hypot(a[0] - b[0], a[1] - b[1]) || 1) / pinch.d * pinch.s / view.s, pinch.cx, pinch.cy);
    }
  });
  const end = (e) => {
    if (!touches.delete(e.pointerId)) return;
    if (!touches.size) { drag = null; pinch = null; const { v } = nodes(); if (v) v.classList.remove('is-grabbing'); }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  document.addEventListener('wheel', (e) => {
    const v = inView(e);
    if (!v || !view) return;
    e.preventDefault();
    const r = v.getBoundingClientRect();
    zoomAt(e.deltaY > 0 ? 1 / 1.15 : 1.15, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  document.addEventListener('dblclick', (e) => { const v = inView(e); if (v) { const r = v.getBoundingClientRect(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); } });
  // The large map takes the window's width; 100vw would count the scrollbar.
  const pageWidth = () => document.documentElement.style.setProperty('--page-w', document.documentElement.clientWidth + 'px');
  pageWidth();
  window.addEventListener('resize', () => { pageWidth(); applyView(); });

  // For js/app-hornet.js: the way to walk, and a point's place on the image.
  Object.assign(App, { mapWay: () => way(App.game()), mapWayKey: () => wayKey(App.game()) });

  /* Typing in the search lists what matches under it, up to ten: the areas, then every thing the
     map holds (whatever layer it's on, had or not), each with its layer's name; the caches and
     walls, nameless, aren't looked in. */
  function findables() {
    const { list, g, own } = all();
    const out = AREA_NAMES().map((a) => ({ name: areaName(a.id), sub: t('mapArea'), key: 'area:' + a.id }));
    const seen = new Set();
    for (const m of list) {
      if (FINE.has(m.layer) || m.layer === 'bench' || !shows({ ...m, got: false }, g, own)) continue;
      // One result per name, layer and area (Shakra's many spots in one area are one).
      const area = areaName(m.area || R.areaOf(m.scene));
      const id = m.name + '|' + m.layer + '|' + area;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ name: m.name, sub: LAYER.get(m.layer).name() + (area ? ' · ' + area : ''), key: m.key });
    }
    return out;
  }
  document.addEventListener('input', (e) => {
    const inp = e.target.closest && e.target.closest('[data-change="mapFind"]');
    if (!inp) return;
    const list = inp.closest('.mp-find').querySelector('.mp-found');
    const q = fold(inp.value.trim());
    finds = q ? findables().filter((x) => fold(x.name).includes(q)).slice(0, 10) : [];
    list.hidden = !q;
    list.innerHTML = finds.length ? finds.map((x, i) => `<li><button type="button" data-act="mapGo" data-value="${i}"><span${NT}>${esc(x.name)}</span><small${NT}>${esc(x.sub)}</small></button></li>`).join('')
      : `<li class="mp-found-none">${esc(t('mapFindNone'))}</li>`;
  });

  Object.assign(actions, {
    mapLayer(node) {
      const k = node.dataset.value, cur = layersOn();
      prefs.mapLayers = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); render();
    },
    // A group's switch: all of it on, or, when it's all on already, all of it off.
    mapGroup(node) {
      const ids = LAYERS.filter((l) => l.group === node.dataset.value).map((l) => l.id), cur = layersOn();
      const allOn = ids.every((k) => cur.includes(k));
      prefs.mapLayers = allOn ? cur.filter((k) => !ids.includes(k)) : [...new Set([...cur, ...ids])];
      savePrefs(); render();
    },
    mapOpen(node) {
      const gr = node.dataset.value, open = { ...(prefs.mapOpen || { hundred: true, places: true }) };
      open[gr] = !open[gr];
      prefs.mapOpen = open; savePrefs(); render();
    },
    mapAct(node) { prefs.mapAct = Number(node.dataset.value) || 0; savePrefs(); render(); },
    mapReach() { prefs.mapReach = !prefs.mapReach; savePrefs(); render(); },
    mapZoom(node) { const { v } = nodes(); if (v) zoomAt(node.dataset.value === 'in' ? 1.4 : 1 / 1.4, v.clientWidth / 2, v.clientHeight / 2); },
    // The large map, a choice (prefs.mapBig), as the sibling's: refitted and brought under the bar.
    mapBig() {
      prefs.mapBig = !prefs.mapBig; savePrefs(); view = null; render();
      const sec = App.screenOf('map'), b = sec && sec.querySelector('.mp-big'), st = sec && sec.querySelector('.mp-stage');
      if (b) b.focus({ preventScroll: true });
      if (prefs.mapBig && st) st.scrollIntoView({ block: 'start' });
    },
    mapPick() { pick1(''); },
    // Free mode: a piece marked had or not from its card (the Inventory's marks). With no marks
    // yet, the map's loose pieces start as missing, the rest as had (Free mode's everything).
    mapMark(node) {
      const i = Number(node.dataset.value), fresh = !App.freeGame();
      App.freeMark((m) => {
        if (fresh) m.pieces = m.pieces.filter((j) => !NEAR_KINDS.includes(CO.PIECES[j][0]));
        m.pieces = m.pieces.includes(i) ? m.pieces.filter((j) => j !== i) : [...m.pieces, i];
      });
    },
    // A gauntlet's card: to Combat, that gauntlet chosen; a boss's: that boss.
    mapFight(node) { prefs.ftMode = 'gauntlets'; prefs.gauntlet = node.dataset.value; savePrefs(); App.go('fight'); },
    mapFoe(node) { prefs.ftMode = 'foe'; prefs.foe = node.dataset.value; savePrefs(); App.go('fight'); },
    // A boss's or an entry's card: the Journal, that entry open.
    mapJournal(node) { if (App.journalOpen) App.journalOpen(node.dataset.value); App.go('journal'); },
    mapNames() { prefs.mapNames = prefs.mapNames === false; savePrefs(); render(); },
    // A search result: its layer on, the view close on it, its card open.
    mapGo(node) {
      const x = finds[Number(node.dataset.value)];
      if (!x) return;
      const sec = App.screenOf('map'), list = sec && sec.querySelector('.mp-found');
      if (list) list.hidden = true;
      if (x.key.startsWith('area:')) { if (prefs.mapNames === false) { prefs.mapNames = true; savePrefs(); pending = x.key; render(); } else focusOn(x.key); return; }
      App.mapShow(x.key);
    },
    // Another screen's "on the map" button.
    mapShow(node) { App.mapShow(node.dataset.value); },
  });
})();
