/* js/app-map.js — the Map: Pharloom as the game's map screen draws it for your game, piece by
   piece with the game's own rules (assets/map/pieces.webp, extracted from the game's files by
   tools/extract-map.py; js/rooms.js mapView): the areas whose map you've bought, each room's
   parts as the game has mapped them, whole, or the rough sketch of those it hasn't, in Act 3 the
   Cradle, Cogwork Core and the Ventrica hub destroyed and the Abyss's diving bell as your game
   has it. The site being a guide, what the game doesn't draw yet is there too, faint (the areas
   whose map isn't bought, the rooms not mapped); turning "Whole map" off leaves it out (the
   switch is on while prefs.mapGame is false, so the stored choice reads as it did). In
   Free mode, the whole map before Act 3. On it, everything the game has for each room (js/spots.js, from the game's
   own files), in layers grouped as the selector under the map shows them:
     Upgrades       Mask Shards, Spool Fragments, Silk Hearts, the Needle, Pouch and Kit upgrades
                    and the abilities, where each is had: lying in its room, its vendor's, its
                    Wishwall's, its boss's arena
     Crest          the Tools (one switch, its caret opening them by slot colour, and the six
                    outside the 100%: four upgrades, two a wish lends), Crests and Silk Skills
     Places         benches, Bellway and Ventrica stations (the game's own pins, dimmed while your
                    game hasn't opened them), the Bellshrines and the shops; the lifts (off at first)
     Passages       what opens a way and stays open, each gone once your save has it open: levers
                    and pressure plates, gates, the doors a key opens and the keys lying, shortcuts
                    (the one-way walls among them) and silk walls (off at first; design/03-redesign.md,
                    step 6), whether the save keeps them per room or in playerData
     Fights         the gauntlets and bosses not beaten, the Void Masses' cores
     People         Shakra's spots and the people who give a thing of the 100%
     Tasks          the Wishwalls and who offers a wish still open, where a wish is done, what a
                    wish asks for, and the main objectives where the game's map pins them
     Collectibles   Memory Lockets, Lost Fleas, the Old Hearts, Melodies and the Everbloom, the
                    relics (one switch, its caret opening the six), Mementos, the Bellhome's
                    furnishings, the small silk cocoons and Eva's rewards
     Items          Craftmetal, Pale Oil, Mossberries, Silkeaters, the area maps where each is had
                    (Shakra's spot in its area, or where it lies), the key items, the rosaries and
                    shell shards lying in a room or given (the Fixer's, the Sprintmaster's)
     Secrets        the rosary and shell shard caches, breakable walls, loose rosaries and each room's
                    hidden corners (off at first; from afar, a count per room)
     Your game      your cocoon; the Journal's entries still missing
   Each layer's switch is the game's own picture, with had of total (in Free mode, the total);
   "Only the 100%" turns on just the layers that count (design/03-redesign.md, step 6).
   In a save (or Free mode's marks) what's had is left out; "Show Completed" (prefs.mapHad) brings
   it back, dimmed and ticked (design/03-redesign.md, step 6). A tap
   on a mark, or on an area's name, opens its card. Hornet sits at your bench, or stands where the
   game respawns her when the save says she isn't at one (js/app-hornet.js
   walks her there from the previous one). Other screens open the Map on a thing (App.mapShow).
   The marks are placed in percentages of the image, so they follow its zoom. Shares SS.app with
   js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const M = SS.map, R = SS.rooms, CO = SS.collectibles, D = SS.data, SP = SS.spots, J = SS.journal, QU = SS.quests, HW = SS.how;
  const PE = SS.people || { PEOPLE: [], TRADE: [] };
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const FOE = new Map(SS.enemies.FOES.map((f) => [f.id, f]));
  const BOOK = new Map(J.BOOK.map((e) => [e.id, e]));
  const BOOK_KEY = new Map(J.BOOK.map((e) => [e.key, e]));
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const itemName = (id) => pick(D.ITEMS.find((x) => x.id === id).name);
  const lower = (s) => String(s || '').toLowerCase();
  const pinKey = SS.savefile.pinKey;

  /* ── The layers ──
     Each: its group, its name, and its mark in the legend. The pieces' kinds keep their colour
     token on the map (css, .mp-dot.is-<layer>). */
  const HEART_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter',
    CollectedHeartClover: 'heart-clover', HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian', HasMelodyConductor: 'melody-conductor' };
  const PIECE_ICON = { flea: 'pieces/flea', 'silk-heart': 'pieces/silk-heart', needle: 'items/needle', 'old-heart': 'pieces/heart-bloom', melody: 'pieces/melody-architect' };
  const pieceIcon = (k, p) => `assets/icons/${p && HEART_ICON[p[2][1]] ? 'pieces/' + HEART_ICON[p[2][1]] : PIECE_ICON[k] || 'items/' + k}.webp`;
  const RELICS = ['bone-scroll', 'weaver-effigy', 'choral-commandment', 'rune-harp', 'psalm-cylinder', 'arcane-egg'];
  const MEMENTO_ICON = { 'Grey Memento': 'grey-memento', 'Memento Garmond': 'heros-memento', 'Memento Surface': 'surface-memento',
    'Hunter Memento': 'hunters-memento', 'Crowman Memento': 'craw-memento', 'Sprintmaster Memento': 'sprintmaster-memento', 'Memento Seth': 'guardians-memento' };
  const SPAWN_ICON = { NAME_RHINO: 'rhinogrund', NAME_ROSARY_PILGRIM: 'covetous-pilgrim', NAME_SHELL_FOSSIL_MIMIC: 'shardillard', NAME_BLACK_THREAD_CORE: 'void-mass' };

  /* Each layer: its id, its name and its picture in the selector under the map, the game's own
     art: the thing's, its map pin, a Journal portrait, or one of the game's menu and wish icons
     (assets/map/icons/, tools/extract-map-icons.py). The breakable walls keep the site's glyph:
     the game's walls don't read that small. */
  const PIN = (n) => `assets/map/pins/${n}.webp`, ICON = (n) => `assets/map/icons/${n}.webp`, FACE = (id) => `assets/icons/journal/${id}.webp`;
  const L = (id, name, art) => ({ id, name, art });
  const PIECE_NAME = { flea: 'kind_fleas', needle: 'cat_needle', 'silk-heart': 'cat_hearts', 'old-heart': 'kind_oldHearts', melody: 'kind_melodies' };
  const piece = (k) => L(k, () => (PIECE_NAME[k] ? t(PIECE_NAME[k]) : itemName(k)), pieceIcon(k));
  const LAYERS = [
    ...['mask-shard', 'spool-fragment', 'needle', 'tool-pouch', 'crafting-kit', 'silk-heart'].map(piece),
    // The Tools, by slot colour (the set 'tools'), and the six outside the 100%.
    L('tools-red', () => t('ct_red'), 'assets/icons/tools/straight-pin.webp'),
    L('tools-blue', () => t('ct_blue'), 'assets/icons/tools/druids-eye.webp'),
    L('tools-yellow', () => t('ct_yellow'), 'assets/icons/tools/compass.webp'),
    L('tools-other', () => t('mapToolsOut'), 'assets/icons/tools/snare-setter.webp'),
    L('crests', () => t('cat_crests'), 'assets/icons/crests/reaper.webp'),
    L('skills', () => t('cat_skills'), 'assets/icons/skills/silkspear.webp'),
    L('arts', () => t('cat_arts'), 'assets/icons/arts/swift-step.webp'),
    ...['memory-locket', 'craftmetal', 'pale-oil', 'flea', 'old-heart', 'melody'].map(piece),
    L('everbloom', () => t('cat_items'), 'assets/icons/items/everbloom.webp'),
    L('bench', () => t('mapPlace_bench'), PIN('pin_bench')),
    L('bellway', () => t('mapPlace_bellway'), PIN('pin_stag_station')),
    L('ventrica', () => t('mapPlace_ventrica'), PIN('pin_tube_station')),
    L('bellshrine', () => t('mapLayer_bells'), PIN('quest_map_icon_grand_gate_final')),
    L('shop', () => t('mapLayer_shops'), PIN('pin_shop')),
    L('lift', () => t('mapLayer_lifts'), null),   // the glyph
    L('lever', () => t('mapLayer_levers'), ICON('_0005_core_lever_02')),
    L('gate', () => t('mapLayer_gates'), null),   // the glyph
    L('lock', () => t('mapLayer_locks'), ICON('i_slab_key')),
    L('key', () => t('mapLayer_keys'), ICON('i_token_of_faith')),
    L('shortcut', () => t('mapLayer_shortcuts'), null),   // the glyph
    L('silkwall', () => t('mapLayer_silkwalls'), null),   // the glyph
    L('gauntlet', () => t('ftModeGauntlets'), null),   // the first gauntlet's champion (legendArt)
    L('boss', () => t('mapLayer_boss'), FACE('lace')),
    L('void-mass', () => t('mapExtra_voidMass'), FACE('void-mass')),
    L('shakra', () => t('mapLayer_shakra'), FACE('shakra')),
    L('wishwall', () => t('mapLayer_wishwalls'), ICON('hornet_inv_pane_icons_0002_wish')),
    L('giver', () => t('mapLayer_givers'), ICON('quest_icon_large__0008_gather')),
    L('person', () => t('mapLayer_people'), ICON('quest_icon_large_0006_herald')),
    L('npc', () => t('mapLayer_npc'), 'assets/map/people/bellhart-greeter.webp'),
    ...RELICS.map((k) => L(k, () => t('mapExtra_' + k), `assets/icons/extras/${k}.webp`)),
    L('mossberry', () => t('mapExtra_mossberry'), 'assets/icons/extras/mossberry.webp'),
    L('silkeater', () => t('mapExtra_silkeater'), PIN('pin_grub_location')),
    L('memento', () => t('mapExtra_memento'), 'assets/icons/extras/grey-memento.webp'),
    L('bellhome', () => t('mapExtra_bellhome'), PIN('pin_bench_bell')),
    // The area maps (the inventory's rolled map), and the rosaries and shell shards lying in a room.
    L('map', () => t('mapExtra_map'), ICON('i_map')),
    L('rosaries', () => t('mapExtra_rosaries'), 'assets/icons/items/rosary-string.webp'),
    L('shards', () => t('mapExtra_shards'), 'assets/icons/items/shard-bundle.webp'),
    L('keyitem', () => t('mapExtra_keyitems'), ICON('cog_heart_pieces')),
    L('silk-cocoon', () => t('mapExtra_cocoons'), ICON('silk_grub_small_cocoon')),
    L('eva', () => t('mapExtra_eva', { npc: pick(HW.NPCS.eva) }), 'assets/crests/hunter-3.webp'),
    L('rosary-cache', () => t('mapExtra_rosary'), 'assets/icons/extras/rosary-cache.webp'),
    L('shard-cache', () => t('mapExtra_shard'), 'assets/icons/extras/shard-cache.webp'),
    L('wall', () => t('mapExtra_wall'), null),   // the glyph
    L('bead', () => t('mapExtra_beads'), 'assets/icons/items/rosaries.webp'),
    L('masked', () => t('mapExtra_hidden'), null),   // the glyph
    L('cocoon', () => t('mapLayer_cocoon'), PIN('shade_pin')),
    L('journal', () => t('mapLayer_journal'), ICON('hornet_inv_pane_icons_0003_journal')),
    // The wishes and the main objectives (js/spots.js TASKS): a wish's emblem, a thing it asks for,
    // the map's own objective pin.
    L('wspot', () => t('mapLayer_wspots'), ICON('qi_wayfarer')),
    L('qitem', () => t('mapLayer_qitems'), ICON('_0007_shell_flower_purple_icon')),
    L('goal', () => t('mapLayer_goals'), PIN('quest_map_icon_citadel_seeker')),
  ];
  const LAYER = new Map(LAYERS.map((l) => [l.id, l]));
  /* The sets: one switch in the selector for several layers, its caret opening them one by one
     (the sibling's, design/24 there). */
  const SETS = { relics: { name: () => t('mapSet_relics'), art: 'assets/icons/extras/bone-scroll.webp', layers: RELICS },
    tools: { name: () => t('cat_tools'), art: 'assets/icons/tools/straight-pin.webp', layers: ['tools-red', 'tools-blue', 'tools-yellow', 'tools-other'] } };
  /* The selector's groups, in this order (design/03-redesign.md, step 6, the groups: Albert's
     choice); what counts for the 100% spread over the first three. */
  const GROUPS = [
    ['upgrades', ['mask-shard', 'spool-fragment', 'silk-heart', 'needle', 'tool-pouch', 'crafting-kit', 'arts']],
    ['crest', ['tools', 'crests', 'skills']],   // PANE_TOOLS
    ['extras', ['memory-locket', 'flea', 'old-heart', 'melody', 'everbloom', 'relics', 'memento', 'bellhome', 'silk-cocoon', 'eva']],
    ['items', ['craftmetal', 'pale-oil', 'mossberry', 'silkeater', 'map', 'keyitem', 'rosaries', 'shards']],
    ['places', ['bench', 'bellway', 'ventrica', 'bellshrine', 'shop', 'lift']],
    ['passage', ['lever', 'gate', 'lock', 'key', 'shortcut', 'silkwall']],   // design/03-redesign.md, step 6, Passages
    ['fights', ['gauntlet', 'boss', 'void-mass']],
    ['people', ['shakra', 'person', 'npc']],
    // The game's Tasks (PANE_QUESTS): the wishes and the main objectives (design/03-redesign.md, step 6).
    ['quests', ['wishwall', 'giver', 'wspot', 'qitem', 'goal']],
    ['secrets', ['rosary-cache', 'shard-cache', 'wall', 'bead', 'masked']],
    ['game', ['cocoon', 'journal']],
  ];
  const layersOf = (ids) => ids.flatMap((k) => (SETS[k] ? SETS[k].layers : [k]));
  const GROUP_OF = new Map(GROUPS.flatMap(([g, ids]) => layersOf(ids).map((k) => [k, g])));
  const groupName = (g) => t('mapGroup_' + g);
  // The layers that count for the 100% ("Only the 100%").
  const HUNDRED = ['mask-shard', 'spool-fragment', 'silk-heart', 'needle', 'tool-pouch', 'crafting-kit', 'arts', 'tools-red', 'tools-blue',
    'tools-yellow', 'crests', 'skills', 'memory-locket', 'flea', 'old-heart', 'melody', 'everbloom', 'craftmetal', 'pale-oil'];
  // On at first: the whole 100%, the stations, the gauntlets and bosses, and your cocoon.
  const FIRST_ON = [...HUNDRED, 'bellway', 'ventrica', 'gauntlet', 'boss', 'cocoon'];
  // So many they'd hide the map: drawn only close up; from afar, a count per room.
  const FINE = new Set(['rosary-cache', 'shard-cache', 'wall', 'bead', 'masked']);
  // The layers that only a save can say anything about.
  const OWN_ONLY = new Set(['cocoon', 'journal']);
  /* Passages: the extras that open a way (js/spots.js EXTRAS, from the game's scenes), each drawn
     as its layer's: the mark's name, and the game's art where it reads at a mark's size, else the
     glyph (design/03-redesign.md, step 6). A pressure plate goes among the levers; a one-way wall the completionist
     lists among the breakable walls goes among the shortcuts. A Void Mass's core has its own layer. */
  const DOOR = { lever: { name: 'mapLever', art: '_0005_core_lever_02' }, gate: { name: 'mapGate' }, lock: { name: 'mapLock', art: 'i_slab_key' },
    shortcut: { name: 'mapShortcut' }, silkwall: { name: 'mapSilkwall' } };
  const ONE_WAY = /^One Way|Shortcut/;
  const layerOf = (x) => (x[0] === 'plate' ? 'lever' : x[0] === 'wall' && ONE_WAY.test(x[2][2]) ? 'shortcut'
    : x[0] === 'spawn' && x[4] && x[4].key === 'NAME_BLACK_THREAD_CORE' ? 'void-mass' : x[0]);
  // The doors a key opens that the save keeps (a 'lock' extra), by scene → the key (js/quests.js LOCKS).
  const LOCK_AT = new Map();
  for (const x of SP.EXTRAS) {
    if (x[0] !== 'lock') continue;
    const k = Object.keys(QU.LOCKS).find((key) => QU.LOCKS[key].some((s) => lower(s) === lower(x[3])));
    if (k) LOCK_AT.set(lower(x[3]), k);
  }
  /* Eva's rewards (js/spots.js EXTRAS 'eva'): the Hunter Crest at its evolution, or the Vesticrest's
     slot in its colour (the Crest pane's own slot frame). */
  const evaArt = (r) => (/^hunter-/.test(r) ? `assets/crests/${r}.webp` : (SS.crestFrames || {})[r.slice(5)] || null);
  const evaName = (r) => (/^hunter-/.test(r) ? t('mapEvaHunter', { crest: pick(D.CRESTS.find((c) => c.id === 'hunter').name), n: r.slice(7) })
    : t(r === 'vest-yellow' ? 'mapEvaYellow' : 'mapEvaBlue', { vest: pick(D.VESTICREST.name) }));
  // A mark's own name where its layer's is a plural.
  const ONE = { lift: 'mapLift', 'silk-cocoon': 'mapCocoon', bead: 'mapBead', masked: 'mapHidden' };
  // The Tools outside the 100% (js/collectibles.js TOOLS, none a COUNTED group's first).
  const OTHER_TOOLS = Object.keys(CO.TOOLS).filter((id) => !CO.COUNTED.some((ids) => ids[0] === id));
  const SHAKRA_MAPS = SP.EXTRAS.filter((x) => x[0] === 'map' && x[5] && x[5].shop === 'shakra');
  const silkNote = () => t('mapSilkwallNote', { skill: pick(D.SKILLS.find((s) => s.id === 'silkspear').name) });
  function layersOn() {
    // The Tools were one layer before they went by colour.
    // The Void Masses were among the unique enemies (a layer gone) before they had one: on where those were.
    if (Array.isArray(prefs.mapLayers) && !prefs.mapVoidMass) {
      if (prefs.mapLayers.includes('spawn') && !prefs.mapLayers.includes('void-mass')) prefs.mapLayers = [...prefs.mapLayers, 'void-mass'];
      prefs.mapVoidMass = true;
      savePrefs();
    }
    if (Array.isArray(prefs.mapLayers)) return prefs.mapLayers.flatMap((k) => (k === 'tools' ? ['tools-red', 'tools-blue', 'tools-yellow'] : [k])).filter((k) => LAYER.has(k));
    // The earlier switches (mapKinds, mapPlaces), kept where they said something.
    const on = new Set(FIRST_ON);
    if (Array.isArray(prefs.mapKinds)) for (const k of ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea']) if (!prefs.mapKinds.includes(k)) on.delete(k);
    if (Array.isArray(prefs.mapPlaces)) for (const k of ['bench', 'bellway', 'ventrica', 'gauntlet']) { if (prefs.mapPlaces.includes(k)) on.add(k); else on.delete(k); }
    return [...on];
  }

  /* The glyphs, drawn in currentColor on a 14-unit grid: the breakable walls', and what stands in
     for a portrait that isn't there. */
  const svg = (d) => `<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const GLYPH = {
    gauntlet: svg('<path d="M2.5 2.5l9 9M11.5 2.5l-9 9"/>'),
    boss: svg('<path d="M2.5 11.5V5l2.5 2 2-4 2 4 2.5-2v6.5z"/>'),
    wall: svg('<path d="M2 3h10v8H2zM2 7h10M5 3v4M9 7v4"/>'),
    // A gate's bars, a way through a wall, three threads of silk.
    gate: svg('<path d="M3 12V3M6 12V3M9 12V3M12 12V3M2 3h11"/>'),
    shortcut: svg('<path d="M2 7h7M6.5 4L9.5 7 6.5 10M11.5 2.5v9"/>'),
    silkwall: svg('<path d="M3 2c2 3-1 7 1 10M7 2c2 3-1 7 1 10M11 2c2 3-1 7 1 10"/>'),
    // A folded map: an area's card.
    map: svg('<path d="M2 3.5l3.3-1 3.4 1.5 3.3-1v8l-3.3 1-3.4-1.5-3.3 1z"/><path d="M5.3 2.5v8M8.7 4v8"/>'),
    spawn: svg('<path d="M7 2l1.5 3.2 3.5.4-2.6 2.4.7 3.5L7 9.8 3.9 11.5l.7-3.5L2 5.6l3.5-.4z"/>'),
    // A lift's cage on its cable; a room's hidden corner, dashed.
    lift: svg('<path d="M7 1.5v3M3.5 4.5h7v8h-7zM7 7v3.5M5.5 8.5L7 7l1.5 1.5"/>'),
    masked: svg('<path d="M2 4.5V2h2.5M9.5 2H12v2.5M12 9.5V12H9.5M4.5 12H2V9.5M6 7h2"/>'),
  };

  /* ── The marks ──
     A mark with a key (data-mk) is a button: a tap opens its card. `style` places it on the map;
     without one it sits in a line (legend, lists). */
  let picked = '';   // the key of the mark whose card is open
  const tap = (key, title) => (key ? ` data-mk="${esc(key)}" role="button" tabindex="0" aria-label="${esc(title)}"` : '');
  const sel = (key) => (key && key === picked ? ' is-sel' : '');
  const attrs = (style, title, key) => `${style ? ` style="${style}"` : ''}${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}${tap(key, title)}`;
  /* Every picture at the same visible size (design/03-redesign.md, step 6, the marks' size, all A):
     its opaque box (js/mark-fit.js, tools/fit-marks.py) centred, its longest side MARK_BOX of the
     disc, shrunk just enough that no opaque pixel crosses MARK_RIM (the pale plate is r 0.47); in
     the selector, bare, ART_BOX of its square and no rim. In disc units (the disc 1 across): the
     scale (s, per pixel), where the picture's canvas goes (x, y, w, h), and for an <img> that fills
     the disc, its scale (k) and shift (dx, dy) as shares of it. null: a picture not measured. */
  const MARK_BOX = 0.8, MARK_RIM = 0.45, ART_BOX = 0.86;
  const FIT = SS.markFit || {};
  const fitKey = (src) => (src.startsWith('data:') ? 'crest:' + (Object.entries(SS.crestFrames || {}).find(([, v]) => v === src) || [''])[0] : src);
  function fitOf(src, box = MARK_BOX, rim = MARK_RIM) {
    const f = src && FIT[fitKey(src)];
    if (!f) return null;
    const [W, H, cx, cy, L, R, Lturned] = f;
    let s = box / (Lturned || L);
    if (rim) s = Math.min(s, rim / R);
    return { s, x: -cx * s, y: -cy * s, w: W * s, h: H * s, k: s * Math.max(W, H), dx: -(cx - W / 2) * s, dy: -(cy - H / 2) * s };
  }
  // An <img> that fills its disc (or the selector's square), placed by its fit (css .mp-fit).
  const n3 = (x) => +x.toFixed(3);
  function img(src, box, rim) {
    const f = fitOf(src, box, rim);
    return f ? `<img class="mp-fit" src="${src}" alt="" loading="lazy" style="--fs:${n3(f.k)};--fx:${n3(f.dx)};--fy:${n3(f.dy)}">`
      : `<img src="${src}" alt="" loading="lazy">`;
  }
  // A piece or a thing: a dark disc with a rim in its layer's colour and the game's picture.
  const dot = (layer, src, style = '', title = '', key = '', cls = '') =>
    `<i class="mp-dot is-${layer}${cls}${sel(key)}"${attrs(style, title, key)}>${img(src)}</i>`;
  // A place: the game's own map pin.
  const pin = (layer, file, style = '', title = '', key = '', cls = '') =>
    `<img class="mp-pin is-${layer}${cls}${sel(key)}" src="assets/map/pins/${file}.webp" alt=""${attrs(style, title, key)}>`;
  // A badge: a creature's Journal portrait (a gauntlet's champion, a boss), or a glyph.
  const badge = (layer, inner, style = '', title = '', key = '', cls = '') =>
    `<span class="mp-pin is-badge is-${layer}${cls}${sel(key)}"${attrs(style, title, key)}>${inner}</span>`;
  const portrait = (id) => (id ? img(`assets/icons/journal/${id}.webp`) : '');
  // A layer's (or a set's) picture in the selector: the game's art, bare.
  function legendArt(id) {
    const x = SETS[id] || LAYER.get(id);
    const src = id === 'gauntlet' ? FACE(champion(SS.gauntlets.GAUNTLETS[0])) : x.art;
    return `<span class="mp-art${id === 'needle' ? ' is-needle' : ''}">${src ? img(src, ART_BOX, 0) : GLYPH[id]}</span>`;
  }
  /* A gauntlet: its champion, the Journal's portrait of its last wave's enemy, on the badge's rim. */
  const champion = (x) => { const w = x && x.waves[x.waves.length - 1]; return w && w[0] ? w[0][0] : null; };
  // A boss's entry: its own id, its place-suffixed id's, or the entry the foe counts for (hj: the
  // Raging Conchfly is the Great Conchfly's).
  const BOOK_N = new Map(J.BOOK.map((e) => [e.n, e]));
  const bookOfFoe = (foe) => BOOK.get(foe) || BOOK.get(String(foe).replace(/-(the-cradle|far-fields|chapel-of-the-beast|weavenest-atla|coral-tower)$/, ''))
    || (FOE.get(foe) && BOOK_N.get(FOE.get(foe).hj));

  /* ── What the map holds: every mark of every layer, for a game (null: Free mode with nothing) ──
     { key, layer, scene, act, got, name, sub, draw(style, title, key, cls) } */
  /* The wish of a quest (index in CO.WISHES, or -1): the wish whose check is the quest, or an `any`
     of several (Broodfeast and Runtfeast, the Lost Fleas), or else the wish of the quest that
     follows it in the chain (QU.CHAIN prev): a «Pre» stage, Steel Sentinel's first offer. */
  const WISH_OF = new Map();
  const checksQuest = (c, quest) => c[0] === 'quest' ? c[1] === quest : (c[0] === 'any' || c[0] === 'all') && c.slice(1).some((x) => checksQuest(x, quest));
  function wishOf(quest) {
    if (WISH_OF.has(quest)) return WISH_OF.get(quest);
    let i = CO.WISHES.findIndex((w) => checksQuest(w[2], quest));
    if (i < 0) {
      const next = Object.keys(QU.CHAIN).find((q) => QU.CHAIN[q].prev === quest);
      if (next) i = wishOf(next);
    }
    WISH_OF.set(quest, i);
    return i;
  }
  const wishDone = (g, quest) => { const i = wishOf(quest); return !!g && i >= 0 && g.wishes.includes(i); };
  const complete = (g, e) => !!g && SS.completion.journalDone(e, g.journal);
  /* A person of js/people.js in a save (own): met (true, false, or null when the save has no word
     for it), gone, and where: the scenes they're in now (null: every spot, as in Free mode). A
     field the save doesn't carry (a slot kept before) says nothing. */
  const truthy = (v) => v === true || (typeof v === 'number' && v > 0);
  const personArt = (x) => (x.art ? `assets/${x.art.startsWith('journal/') ? 'icons' : 'map'}/${x.art}.webp` : ICON('quest_icon_large_0006_herald'));
  function personNow(x, own) {
    const v = own && own.peopleVars;
    if (!v) return { met: null, gone: false, where: null };
    const known = (fs) => !!fs && fs.some((f) => v[f] !== undefined);
    const met = known(x.met) ? x.met.some((f) => truthy(v[f])) : null;
    const gone = !!x.gone && x.gone.some((f) => v[f] === true);
    if (x.unsure) return { met, gone, where: null, unsure: true };
    if (!x.at || !known(x.at.map((r) => r[0]))) return { met, gone, where: null };
    const hit = x.at.find(([f, val]) => v[f] === val);
    const named = new Set(x.at.map((r) => lower(r[2])));
    const where = hit ? new Set([lower(hit[2])]) : new Set(x.spots.map((s) => lower(s[0])).filter((s) => !named.has(s)));
    return { met, gone, where: where.size ? where : null };
  }
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
      add({ key: 'tools:' + id, layer: 'tools-' + tool.color, scene: SP.AT.tools[id], act: w[0], area: w[1], got: !!g && ids.some((x) => g.tools.includes(x)),
        name: pick(tool.name), draw: (s, ti, k, c) => dot('tools', `assets/icons/tools/${id}.webp`, s, ti, k, c) });
    }
    // The six outside the 100%: a Tool's upgrade, or one a wish lends and takes back.
    for (const id of OTHER_TOOLS) {
      const tool = D.TOOLS.find((x) => x.id === id), w = CO.WHERE.tools[id] || [], of = CO.COUNTED.find((ids) => ids.includes(id));
      // One a wish lent and took back was found: it shows found (savefile gaveBack).
      add({ key: 'tools:' + id, layer: 'tools-other', scene: SP.AT.tools[id], act: w[0], area: w[1], got: !!g && (g.tools.includes(id) || (!of && g.gaveBack.includes(id))),
        name: pick(tool.name), note: of ? t('mapToolUpgrade', { tool: pick(D.TOOLS.find((x) => x.id === of[0]).name) }) : t('mapToolLent'),
        draw: (s, ti, k, c) => dot('tools', `assets/icons/tools/${id}.webp`, s, ti, k, c) });
    }
    for (const [cat, list] of [['crests', D.CRESTS], ['skills', D.SKILLS], ['arts', D.ARTS]]) {
      for (const [id, w] of Object.entries(CO.WHERE[cat])) {
        const x = list.find((y) => y.id === id);
        add({ key: cat + ':' + id, layer: cat, scene: SP.AT[cat][id], act: w[0], area: w[1], got: !!g && g[cat].includes(id),
          name: x ? pick(x.name) : id, draw: (s, ti, k, c) => dot(cat, `assets/icons/${cat}/${id}.webp`, s, ti, k, c) });
      }
    }
    // The abilities outside the 100% (the two Needolin melodies), with their Act from js/spots.js.
    for (const x of D.ARTS) {
      if (CO.WHERE.arts[x.id]) continue;
      add({ key: 'arts:' + x.id, layer: 'arts', scene: SP.AT.arts[x.id], act: SP.AT.act['arts:' + x.id], got: !!g && g.arts.includes(x.id),
        name: pick(x.name), note: t('mapArtOut'), draw: (s, ti, k, c) => dot('arts', `assets/icons/arts/${x.id}.webp`, s, ti, k, c) });
    }
    add({ key: 'everbloom', layer: 'everbloom', scene: SP.AT.everbloom, act: (CO.WHERE.everbloom || [])[0], got: !!g && g.everbloom,
      name: t('cat_items'), draw: (s, ti, k, c) => dot('everbloom', 'assets/icons/items/everbloom.webp', s, ti, k, c) });
    // Places: the pins (a station not open, a toll not paid: dimmed, cls ' is-off'). A bench
    // with a seat rests on its floor, where Hornet sits (js/rooms.js benchSeat; rests: layout).
    const lit = new Set(own ? own.lit : []);
    R.pinsOn(own).forEach((p) => {
      const open = !p[4] || !own || lit.has(pinKey(p));
      const name = t(p[0] === 'bench' ? 'mapPlace_bench1' : 'mapPlace_' + p[0]);
      const seat = R.benchSeat(p);
      out.push({ key: 'pin:' + M.PINS.indexOf(p), layer: p[0], scene: p[3], at: seat || { x: p[1], y: p[2] }, rests: !!seat, got: false, off: !open, pinData: p,
        name, sub: open ? '' : t(p[0] === 'bench' && /bell_toll_machine/.test(JSON.stringify(p[4])) ? 'mapToll' : 'mapClosed'),
        draw: (s, ti, k, c) => pin(p[0], p[0] === 'bench' ? 'pin_bench' : p[0] === 'bellway' ? 'pin_stag_station' : 'pin_tube_station', s, ti, k, c + (open ? '' : ' is-off')) });
    });
    /* A gauntlet won by beating its boss (its check is the boss's: Lugoli's, the Coral Tower's four
       ending in Khann…) is that boss's fight: on the boss's card, not a mark of its own (Albert's
       choice, 15-Oct-2026: each thing once). */
    const bossCheck = new Map(SP.BOSSES.map(([foe, , check]) => [JSON.stringify(check), foe]));
    const fightsOf = new Map();
    for (const x of SS.gauntlets.GAUNTLETS) {
      const foe = bossCheck.get(JSON.stringify(x.done));
      if (foe) { fightsOf.set(foe, (fightsOf.get(foe) || []).concat(x)); continue; }
      add({ key: 'gaunt:' + x.id, layer: 'gauntlet', scene: x.scene, act: x.act, got: !!g && g.gauntlets.includes(x.id), area: x.area, gauntlet: x,
        name: App.gauntletName(x.id), draw: (s, ti, k, c) => badge('gauntlet', portrait(champion(x)) || GLYPH.gauntlet, s, ti, k, c) });
    }
    // Steel Soul's own (the Summoned Saviour, its fight and its Journal entry) only in Steel Soul;
    // with no save, all of it, as a guide.
    const steelGame = !own || !!(App.gameMeta() || {}).steel;
    for (const [foe, scene, , act] of SP.BOSSES) {
      const f = FOE.get(foe), e = bookOfFoe(foe);
      if (e && e.steel && !steelGame) continue;
      add({ key: 'boss:' + foe, layer: 'boss', scene, act, got: !!g && g.bosses.includes(foe), name: f ? pick(f.name) : foe, foe, entry: e && e.id, gauntlets: fightsOf.get(foe),
        draw: (s, ti, k, c) => badge('boss', portrait(e && e.id) || GLYPH.boss, s, ti, k, c) });
    }
    for (const [field, scene, own] of SP.BELLS) {
      const b = own ? { name: own } : QU.BELLSHRINES.find((x) => x.field === field);
      add({ key: 'bell:' + field, layer: 'bellshrine', scene, got: !!g && g.bells.includes(field), name: t('mapBell', { area: pick(b.name) }),
        draw: (s, ti, k, c) => pin('bellshrine', 'quest_map_icon_grand_gate_final', s, ti, k, c) });
    }
    // The doors a key opens whose door the save doesn't keep (the rest are extras, LOCK_AT below).
    for (const [k, scenes] of Object.entries(QU.LOCKS)) scenes.filter((scene) => !LOCK_AT.has(lower(scene))).forEach((scene) => add({ key: 'lock:' + k + ':' + scene, layer: 'lock', scene, got: false,
      name: t('mapLock'), sub: t('mapLockKey', { key: pick(SP.KEYS[k]) }), lockKey: k, draw: (s, ti, kk, c) => badge('lock', img(ICON('i_slab_key')), s, ti, kk, c) }));
    for (const [v, scenes] of Object.entries(SP.VENDORS)) {
      if (v === 'shakra') { scenes.forEach((scene, i) => add({ key: 'shakra:' + i, layer: 'shakra', scene, got: false, name: pick(HW.NPCS.shakra), npc: 'shakra',
        draw: (s, ti, k, c) => badge('shakra', portrait('shakra'), s, ti, k, c) })); continue; }
      scenes.forEach((scene, i) => add({ key: 'shop:' + v + ':' + i, layer: 'shop', scene, got: false, name: pick(HW.NPCS[v]), npc: v,
        draw: (s, ti, k, c) => pin('shop', 'pin_shop', s, ti, k, c) }));
    }
    // Who buys or sells outside the game's shops (js/people.js TRADE): the Couriers, the Moss Druid, Creige.
    for (const x of PE.TRADE) x.spots.forEach(([scene, px, py], i) => add({ key: 'shop:' + x.id + ':' + i, layer: 'shop', scene,
      at: px != null ? { x: px, y: py } : undefined, got: false, name: pick(x.name), trade: x.note, draw: (s, ti, k, c) => pin('shop', 'pin_shop', s, ti, k, c) }));
    // People: the Wishwalls and who offers a wish, each with the wishes still open there.
    const boards = new Map(), givers = new Map();
    for (const [quest, f] of Object.entries(QU.FROM)) {
      const wi = wishOf(quest);
      if (wi < 0 || (CO.WISHES[wi][5] === 'steel' && !steelGame)) continue;   // a Steel Soul wish is only asked in Steel Soul
      if (f.board) { const k = lower(f.board); if (!boards.has(k)) boards.set(k, { scene: f.board, quests: [] }); boards.get(k).quests.push(quest); }
      for (const n of f.npc || []) { const k = lower(n); if (!givers.has(k)) givers.set(k, { scene: n, quests: [] }); givers.get(k).quests.push(quest); }
    }
    for (const [k, b] of boards) add({ key: 'board:' + k, layer: 'wishwall', scene: b.scene, quests: b.quests, got: !!g && b.quests.every((q) => wishDone(g, q)),
      name: t('mapLayer_wishwall1'), draw: (s, ti, kk, c) => badge('wishwall', img(ICON('hornet_inv_pane_icons_0002_wish')), s, ti, kk, c) });
    /* The wishes and the main objectives (js/spots.js TASKS): what a wish asks for, where a wish is
       done, the main objectives' pins. A Steel Soul wish only in Steel Soul, and of the Steel
       Sentinel's six spots the three this game chose. A wish's and an objective's name is its quest's. */
    SP.TASKS.forEach((x, i) => {
      const [kind, quest, , scene, art, name, mode, spot] = x;
      if (own && ((mode === 'steel' && !steelGame) || (spot && !own.steelSpots.includes(spot)))) return;
      const w = CO.WISHES[wishOf(quest)];
      add({ key: 'task:' + i, layer: kind, scene, act: kind === 'goal' ? undefined : w && w[1], got: !!g && (g.tasks || []).includes(i), quest,
        name: name ? pick(name) : pick(QU.CHAIN[quest].name), sub: name ? pick(QU.CHAIN[quest].name) : '',
        draw: (s, ti, k, c) => dot(kind, `assets/map/${art}.webp`, s, ti, k, c) });
    });
    // Who gives a thing of the 100%, but where they sell it: their shop is them (Jubilana in the Songclave).
    const sameRoom = (a, b) => lower((R.roomOf(a) || {}).scene || a) === lower((R.roomOf(b) || {}).scene || b);
    for (const [id, scene] of Object.entries(SP.PEOPLE)) if (!(SP.VENDORS[id] || []).some((sc) => sameRoom(sc, scene))) add({ key: 'person:' + id, layer: 'person', scene, got: false, npc: id,
      name: id === 'scrounge' ? t('mapScrounge') : pick(HW.NPCS[id]), draw: (s, ti, k, c) => badge('person', img(ICON('quest_icon_large_0006_herald')), s, ti, k, c) });
    /* Who offers a wish (js/spots.js GIVER), by name: on the mark that is them in that room already
       (a vendor, who gives a thing of the 100%) their wishes go on it; else a mark of its own. */
    for (const [k, b] of givers) {
      const [, who, mark] = SP.GIVER[b.scene] || [];
      const theirs = mark && out.find((x) => x.key === mark);
      if (theirs) { theirs.quests = (theirs.quests || []).concat(b.quests); continue; }
      add({ key: 'giver:' + k, layer: 'giver', scene: b.scene, quests: b.quests, got: !!g && b.quests.every((q) => wishDone(g, q)),
        name: who ? pick(who) : t('mapLayer_giver1'), sub: who ? t('mapLayer_giver1') : '', draw: (s, ti, kk, c) => badge('giver', img(ICON('quest_icon_large__0008_gather')), s, ti, kk, c) });
    }
    /* Everyone else (js/people.js), each at their own point in the room: in a save, only where it
       says they are now, gone once they've left, and dimmed until you've met (personNow). */
    for (const x of PE.PEOPLE) {
      const now = personNow(x, own);
      if (now.gone) continue;
      for (const [scene, px, py] of x.spots) {
        if (now.where && !now.where.has(lower(scene))) continue;
        add({ key: 'npc:' + x.id + ':' + lower(scene), layer: 'npc', scene, at: px != null ? { x: px, y: py } : undefined, got: false,
          off: now.met === false, person: x, now, name: pick(x.name), draw: (s, ti, k, c) => badge('npc', img(personArt(x)), s, ti, k, c) });
      }
    }
    // Other collectibles.
    SP.EXTRAS.forEach((x, i) => {
      const [kind, act, check, scene, name] = x;
      // The maps Shakra sells aren't marks of their own: they'd sit on her, and her card lists them.
      if (kind === 'map' && x[5] && x[5].shop === 'shakra') return;
      // The other unique enemies (Rhinogrunds, Covetous Pilgrims, Shardillards) are found from their
      // Journal entry, every room they're in (App.mapBeast).
      if (kind === 'spawn' && layerOf(x) !== 'void-mass') return;
      if (DOOR[layerOf(x)]) {
        const layer = layerOf(x), d = DOOR[layer], k = kind === 'lock' && LOCK_AT.get(lower(scene));
        add({ key: 'extra:' + i, layer, scene, act, got: !!g && g.extras.includes(i),
          name: t(kind === 'plate' ? 'mapPlate' : d.name), sub: k ? t('mapLockKey', { key: pick(SP.KEYS[k]) }) : layer === 'silkwall' ? silkNote() : '',
          draw: (s, ti, kk, c) => badge(layer, d.art ? img(ICON(kind === 'plate' ? 'dock_door_bottom_pressure_plate' : d.art)) : GLYPH[layer], s, ti, kk, c) });
        return;
      }
      const layer = layerOf(x);
      /* An area map (js/spots.js EXTRAS' last field: Shakra's price, or found lying), a rosary or
         shell shard item lying in its room (its item). */
      const more = x[5] || {};
      const icon = kind === 'map' ? ICON('i_map') : more.item ? `assets/icons/items/${more.item}.webp` : more.icon ? ICON(more.icon)
        : kind === 'bead' ? 'assets/icons/items/rosaries.webp' : kind === 'silk-cocoon' ? ICON('silk_grub_small_cocoon')
          : kind === 'eva' ? evaArt(more.reward) : kind === 'lift' || kind === 'masked' ? null
        : kind === 'memento' ? (MEMENTO_ICON[check[1]] ? `assets/icons/extras/${MEMENTO_ICON[check[1]]}.webp` : 'assets/icons/pieces/heart-bloom.webp')
        : kind === 'silkeater' ? null : kind === 'spawn' || kind === 'bellhome' || kind === 'wall' ? null : `assets/icons/extras/${kind}.webp`;
      const spawn = kind === 'spawn' ? BOOK_KEY.get(name && name.key) : null;
      add({ key: 'extra:' + i, layer, scene, act, got: !!g && g.extras.includes(i),
        name: name ? pick(name) : kind === 'eva' ? evaName(more.reward) : ONE[kind] ? t(ONE[kind]) : LAYER.get(layer).name(), eva: kind === 'eva' ? more : null,
        note: kind === 'masked' ? t('mapHiddenNote', { n: num(check[0] === 'all' ? check.length - 1 : 1) }) : more.shop ? t('mapMapShakra', { npc: pick(HW.NPCS[more.shop]), price: num(more.price) }) : more.found ? t('mapMapFound') : '',
        draw: (s, ti, k, c) => (kind === 'silkeater' ? pin('silkeater', 'pin_grub_location', s, ti, k, c)
          : kind === 'spawn' ? badge(layer, portrait(spawn && spawn.id) || GLYPH.spawn, s, ti, k, c)
            : kind === 'bellhome' ? pin('bellhome', 'pin_bench_bell', s, ti, k, c)
              : icon ? dot(layer, icon, s, ti, k, c) : badge(layer, GLYPH[layer] || GLYPH.wall, s, ti, k, c)) });
    });
    // Your game: the cocoon, where the game's map marks it (js/rooms.js mapPoint, by where Hornet fell
    // in the scene; else its room's middle), and the Journal's entries still missing.
    if (own && own.cocoon) {
      const at = own.cocoonAt && own.cocoonAt.length === 4 ? R.mapPoint(own.cocoon, ...own.cocoonAt) : null;
      add({ key: 'cocoon', layer: 'cocoon', scene: own.cocoon, at: at || undefined, got: false, name: t('mapLayer_cocoon'), sub: t('mapCocoonNote'),
        draw: (s, ti, k, c) => pin('cocoon', 'shade_pin', s, ti, k, c) });
    }
    // A boss's entry is its boss mark's already (its "See in the Journal"): not again.
    const bossEntries = new Set(SP.BOSSES.map(([foe]) => (bookOfFoe(foe) || {}).id).filter(Boolean));
    if (own) for (const e of J.BOOK) {
      if ((e.steel && !steelGame) || bossEntries.has(e.id)) continue;
      const rooms = SS.journalRooms[e.key];
      const scene = rooms && (rooms.map(([sc]) => sc).find((sc) => R.roomOf(sc)));
      add({ key: 'journal:' + e.id, layer: 'journal', scene, got: complete(own, e), name: pick(e.name), entry: e.id,
        draw: (s, ti, k, c) => badge('journal', portrait(e.id), s, ti, k, c) });
    }
    /* Every room each Journal entry's enemies are in (js/journal-rooms.js) and how many: shown only
       through a focus (App.mapBeast), never by a switch. */
    for (const e of J.BOOK) {
      if (own && e.steel && !steelGame) continue;
      for (const [scene, n] of SS.journalRooms[e.key] || []) {
        add({ key: 'beast:' + e.id + ':' + lower(scene), layer: 'beast', scene, got: false, name: pick(e.name), entry: e.id, n,
          draw: (s, ti, k, c) => badge('journal', portrait(e.id), s, ti, k, c) });
      }
    }
    return fixed(out);
  }
  /* js/map-fixes.js, last of all (and in the admin mode, js/app-map-admin.js, its unsaved
     changes): a mark moved where it really goes (fix), one hidden (in the admin mode kept,
     flagged). A fix whose scene isn't its mark's any more (a list regenerated in another order)
     is left alone. */
  const MF = SS.mapFixes || { FIXES: {} };
  function fixed(out) {
    const F = App.mapFixes ? App.mapFixes() : MF.FIXES, moved = F.moved || {}, hidden = F.hidden || {}, keep = !!App.admin;
    const list = [];
    for (const m of out) {
      if (OWN_ONLY.has(m.layer)) { list.push(m); continue; }
      const mv = moved[m.key];
      if (mv && mv[2] === m.scene) m.fix = { x: mv[0], y: mv[1] };
      if (hidden[m.key] === m.scene) { if (!keep) continue; m.hidden = true; }
      list.push(m);
    }
    return list;
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

  /* Which marks show: the layer on, and in a save (or Free mode's marks) not had yet. The pins
     show open or not; the Journal's and the save's own layers need a save. (Two filters were here
     until 14-Oct-2026: by Act, which most marks had no Act of their own for, an Act showing only
     what first appears in it; and «what I can reach now», which only 44 marks had any needs for,
     js/spots.js NEEDS. A mark's card and title still say its Act; Progress says what it waits on.) */
  function passes(m, g, own) {
    return !(OWN_ONLY.has(m.layer) && !own);
  }
  const shows = (m, g, own) => passes(m, g, own) && !(g && m.got && !prefs.mapHad);

  /* ── The map, in SVG in the image's own pixels (M.W × M.H): the view is its viewBox, as the
     sibling's (hallownest-calculator js/app-map.js). ── */
  const n2 = (v) => (Math.round(v * 100) / 100).toString();
  /* The map's pieces as the game draws them for this game (js/rooms.js mapView), on a canvas
     under the SVG: composed once from assets/map/pieces.webp (js/map-paint.js), with a half and a
     quarter of it, and close up from pieces-hd.webp, twice as fine; the view is drawn from the one
     nearest above what the screen needs. A window per piece let a hairline of black through where
     two pieces met. */
  const MP = SS.mapPaint;
  const sheets = {};   // scale → { img, ready, wait }: pieces.webp (1), pieces-hd.webp (2)
  function sheet(scale, then) {
    let s = sheets[scale];
    if (!s) {
      s = sheets[scale] = { img: new Image(), ready: false, wait: [] };
      s.img.onload = () => { s.ready = true; for (const f of s.wait.splice(0)) f(); };
      s.img.src = `assets/map/pieces${scale === 2 ? '-hd' : ''}.webp`;
    }
    if (s.ready) then(); else s.wait.push(then);
  }
  let shown = null, shownKey = '', shownStamp = 0, wantFine = false;
  // The composed maps for what's shown (shownStamp `at`): the map's own pixels with its half and
  // quarter, and the fine one, made the first time the view needs it. The ones before stay until
  // these are ready.
  let coarse = { at: -1, list: [] }, fine = { at: -1, comp: null };
  const faintOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-faint')) || 0.45;
  const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function composeMap(r) {
    if (!shown) return;
    const at = shownStamp;
    if (coarse.at !== at) {
      sheet(1, () => {
        if (shownStamp !== at || coarse.at === at) return;   // something newer is on its way, or it's done
        coarse = { at, list: MP.levels(MP.compose(shown, sheets[1].img, 1, faintOf(), makeCanvas), makeCanvas) };
        paintMap();
      });
    }
    if (fine.at !== at && wantFine) {
      sheet(2, () => {
        if (shownStamp !== at || fine.at === at) return;
        fine = { at, comp: MP.compose(shown, sheets[2].img, 2, faintOf(), makeCanvas) };
        paintMap();
      });
    } else if (fine.at !== at) fine = { at: -1, comp: null };   // another game's: made again when needed
    paintMap(r);
  }
  /* While the view moves (a drag, a pinch, the wheel), the map is drawn with the plain smoothing,
     and once it has been still for SETTLE ms, again as at rest. Drawn at its finest at every
     frame, the browser made the map's mipmaps again each time: twice the GPU memory, and most of a
     frame's work on a slow device (14-Oct-2026). At rest it's the same pixels as before. */
  const SETTLE = 150;
  let movedAt = -Infinity, settle = 0;
  // `r`: the view's box, when the caller has just measured it (the canvas has the SVG's).
  function paintMap(r) {
    const { v } = nodes(), cv = v && v.querySelector('.mp-canvas');
    if (!cv || !vb) return;
    const [w, h] = canvasPixels(cv, r);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const moving = performance.now() - movedAt < SETTLE;
    MP.paint(cv.getContext('2d'), [...coarse.list, fine.comp], vb, w, h, moving ? 'low' : 'high');
    if (moving) { clearTimeout(settle); settle = setTimeout(() => paintMap(), SETTLE); }
  }
  /* The canvas as many pixels as the screen has under it: as the browser measures them where it
     can (ResizeObserver's device-pixel-content-box). Rounded from its CSS size × devicePixelRatio
     it can be a pixel off at a fractional ratio (a zoomed page, a 125% screen), and the browser
     then stretches the whole map by that pixel and smooths it over. */
  let seen = null, watched = null;   // seen: { cv, w, h }, the canvas's size as last measured
  const watch = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => {
    const e = es[es.length - 1], s = e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0];
    if (s) { seen = { cv: e.target, w: s.inlineSize, h: s.blockSize }; paintMap(); }
  }) : null;
  function canvasPixels(cv, r = cv.getBoundingClientRect()) {
    if (watch && watched !== cv) {
      watched = cv;
      watch.disconnect();
      try { watch.observe(cv, { box: 'device-pixel-content-box' }); } catch (e) { /* a browser without it */ }
    }
    const dpr = window.devicePixelRatio || 1, w = r.width * dpr, h = r.height * dpr;
    // The measure only settles the rounding: one that disagrees by more (an emulated screen) isn't taken.
    if (seen && seen.cv === cv && Math.abs(seen.w - w) <= 1 && Math.abs(seen.h - h) <= 1) return [seen.w, seen.h];
    return [Math.round(w), Math.round(h)];
  }
  /* A mark on the map, as the sibling's pins: a dark disc with a thin rim, the thing's picture
     (its own art, the game's pin, a Journal portrait) at the same visible size as every other's,
     whole inside the disc (fitOf), or the site's glyph. It keeps
     its size on screen (--k: a pin's size in the image's pixels) and sits on its point (--px,
     --py), shifted within its point's grid (--ox, --oy, in pins). The picture is the one its
     list mark has (m.draw). */
  function artOf(m) {
    const html = m.draw('', '', '', '');
    const src = /src="([^"]+)"/.exec(html);
    // The Needle is a long thin line: laid across the disc, it's seen.
    const turn = src && /items\/needle\./.test(src[1]) ? ' transform="rotate(35)"' : '';
    // Its opaque box centred and the same visible size as every other (fitOf); a picture not measured as before.
    const f = src && fitOf(src[1]);
    if (f) return `<image href="${src[1]}" x="${n3(f.x)}" y="${n3(f.y)}" width="${n3(f.w)}" height="${n3(f.h)}" preserveAspectRatio="none"${turn}/>`;
    if (turn) return `<image href="${src[1]}" x="-0.54" y="-0.54" width="1.08" height="1.08"${turn}/>`;
    if (src) return `<image href="${src[1]}" x="-0.46" y="-0.46" width="0.92" height="0.92"/>`;
    const g = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(html);
    // The glyph keeps its stroke (svg()'s attributes): without them its lines fill black.
    return g ? `<svg class="mp-glyph" x="-0.3" y="-0.3" width="0.6" height="0.6" viewBox="0 0 14 14" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${g[1]}</svg>` : '';
  }
  const pinSvg = (m, p, title, cls) => `<g class="mp-mk is-${m.layer}${cls}${m.off ? ' is-off' : ''}${m.fix ? ' is-fixed' : ''}${m.hidden ? ' is-hidden' : ''}${sel(m.key)}" style="--px:${n2(p.x)}px;--py:${n2(p.y)}px;--ox:${n2(p.ox || 0)}px;--oy:${n2(p.oy || 0)}px"
        data-mk="${esc(m.key)}" role="button" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title><circle r="0.5"/><circle class="mp-plate" r="0.47"/>${artOf(m)}${cls.includes(' is-had') ? HAD_TICK : ''}</g>`;
  // A had mark's tick (design/77, 3 A): a small disc on its upper right, the site's tick in --good (css .mp-tick).
  const HAD_TICK = '<g class="mp-tick" aria-hidden="true"><circle cx="0.36" cy="-0.36" r="0.22"/><path d="M0.25 -0.36 L0.33 -0.28 L0.48 -0.45"/></g>';
  const markTitle = (m) => [m.name, m.sub, m.act ? t('saveAct', { n: m.act }) : ''].filter(Boolean).join(' · ');
  /* Each mark on its point: the pin the game draws, else where the game has the thing (js/spots.js
     XY), else its room's middle; those on one point in a grid around it. The marks the legend has
     on (`on`) and the filters let show, as { count per layer, items: [{ m, p }], fine: the caches
     and walls' counts per room, placed: key → point }. The Map screen reads it. */
  // Per layer: how many there are, how many had, how many show. REST: a resting mark's lift.
  const REST = 0.53;
  function layout(list, g, own, on) {
    const count = {}, items = [], fine = new Map(), placed = new Map();
    for (const m of list) {
      const inFocus = !!focusSet && focusSet.keys.includes(m.key);
      if (!inFocus && !passes(m, g, own)) continue;
      const c = count[m.layer] || (count[m.layer] = { all: 0, had: 0, shown: 0 });
      c.all++;
      // What's had: counted, and on the map only with "Show Completed" (prefs.mapHad), dimmed and ticked.
      const had = !!(g && m.got);
      if (had) { c.had++; if (!prefs.mapHad) continue; } else c.shown++;
      const p = m.fix || pointOf(m);
      if (!p) continue;
      placed.set(m.key, { x: p.x, y: p.y, lift: m.rests ? REST : 0 });
      if (focusSet ? !inFocus : !on.has(m.layer)) continue;
      if (FINE.has(m.layer) && !had) { const k = ((R.roomOf(m.scene) || {}).scene || m.key) + '|' + m.layer; const f = fine.get(k) || { ...p, m, n: 0 }; f.n++; fine.set(k, f); }
      items.push({ m, p: { x: p.x, y: p.y }, had });
    }
    arrange(items);
    // A mark that rests on a floor (a bench on its seat) has its point at its bottom: up by its
    // radius, in pins (the disc's r 0.5 and half its rim), so it sits on the floor at any zoom
    // rather than sinking into it; moved by hand (m.fix, js/app-map-admin.js), on the point it was
    // moved to.
    for (const { m, p } of items) if (m.rests) p.oy = (p.oy || 0) - REST;
    return { count, items, fine, placed };
  }
  /* Things on the same point (within SAME pixels: a room's middle, a shop's stock) are laid out
     around it in a small grid, in pins, so it keeps its shape at any zoom. */
  const SAME = 6;
  function arrange(list) {
    const groups = [];
    for (const it of list) {
      const g = groups.find((x) => Math.abs(x.x - it.p.x) < SAME && Math.abs(x.y - it.p.y) < SAME);
      if (g) g.list.push(it); else groups.push({ x: it.p.x, y: it.p.y, list: [it] });
    }
    for (const g of groups) {
      const n = g.list.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
      g.list.forEach((it, i) => {
        const c = i % cols, r = Math.floor(i / cols), inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
        it.p = { x: g.x, y: g.y, ox: n < 2 ? 0 : (c - (inRow - 1) / 2) * 1.08, oy: n < 2 ? 0 : (r - (rows - 1) / 2) * 1.08 };
      });
    }
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

  /* The map's own marks, for Your game's lists (js/app-home.js): a piece's disc, a gauntlet's
     badge with its champion, a wish's. */
  App.mapMark = {
    piece: (i) => { const p = CO.PIECES[i]; return p ? dot(p[0], pieceIcon(p[0], p)) : ''; },
    gauntlet: (id) => badge('gauntlet', portrait(champion(SS.gauntlets.GAUNTLETS.find((x) => x.id === id))) || GLYPH.gauntlet),
    wish: () => badge('wishwall', img(ICON('hornet_inv_pane_icons_0002_wish'))),
  };

  /* ── The area you rest in, for Your game (App.mapAreaHtml, App.mapAreaPaint) ──
     The sibling's "area map" idea (hallownest-calculator js/app-home.js, areaMapHtml), with this
     map's own drawing: the same view as the Map screen (js/rooms.js mapView, "Only what the game
     shows" included), composed by the same painter (js/map-paint.js) but cropped to the box of
     the rooms of the bench's branch of the map. Since the calm round (design/03-redesign.md, step
     3) it's the scene's backdrop, faint behind the area's name: a picture with no marks and no
     Hornet (she's on her bench in front), not a way in (the Map tab is). Since the map round
     (design/03-redesign.md, step 3, 14 Oct 2026) it fills the scene around her bench: the frame's
     shape cut from the area's box, the bench's room right under her, and never smaller than the
     map's own size (on a phone, the rooms round her rather than the whole area shrunk). */
  const AREA_BOX = new Map();
  // The branch's rooms' box in the map's pixels: [x, y, w, h], or null when it draws none (Surface).
  function branchBox(branch) {
    if (!AREA_BOX.has(branch)) {
      let b = null;
      for (const r of Object.values(M.ROOMS)) {
        if (r[4] !== branch || !r[2] || !r[3]) continue;
        b = b ? [Math.min(b[0], r[0]), Math.min(b[1], r[1]), Math.max(b[2], r[0] + r[2]), Math.max(b[3], r[1] + r[3])] : [r[0], r[1], r[0] + r[2], r[1] + r[3]];
      }
      AREA_BOX.set(branch, b);
    }
    return AREA_BOX.get(branch);
  }
  /* The view of that box: moved with its branch when a rule moves it (Slab with the Cloakless
     Crest), padded, and no smaller than a few rooms so that a small area isn't blown up. */
  const AREA_MIN = [360, 220];
  function areaView(branch, view) {
    const b = branchBox(branch);
    if (!b) return null;
    let [x0, y0, x1, y1] = b;
    const z = view.zones[branch];
    if (z) { const mv = (v, c, s, d) => (v - c) * s + c + d; x0 = mv(x0, z.at[0], z.sx, z.dx); x1 = mv(x1, z.at[0], z.sx, z.dx); y0 = mv(y0, z.at[1], z.sy, z.dy); y1 = mv(y1, z.at[1], z.sy, z.dy); }
    const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
    const w = Math.max(x1 - x0 + 2 * pad, AREA_MIN[0]), h = Math.max(y1 - y0 + 2 * pad, AREA_MIN[1]);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  let areaCtx = null;   // { view, box, at }: what the figure on screen draws, and her bench's point
  App.mapAreaHtml = (g) => {
    areaCtx = null;
    const room = g && g.bench ? R.roomOf(g.bench) : null;
    if (!room) return '';
    const view = R.mapView(g, { all: !prefs.mapGame });
    const box = areaView(room.area, view);
    if (!box) return '';
    const z = view.zones[room.area];
    const at = z ? [(room.x - z.at[0]) * z.sx + z.at[0] + z.dx, (room.y - z.at[1]) * z.sy + z.at[1] + z.dy] : [room.x, room.y];
    areaCtx = { view, box, at, key: MP.keyOf(view, 0) };
    return '<figure class="hmB-map" aria-hidden="true"><canvas class="hmB-canvas"></canvas></figure>';
  };
  /* The part of the area's box the figure shows (`r`, its box on screen): the figure's shape, as
     wide (or tall) as the area, no wider than the figure in map pixels, placed so that her bench's
     point falls under Hornet (.hm-rest), kept inside the area's box. */
  function areaCut(r) {
    const { box, at } = areaCtx, k = r.width / r.height;
    let w = box.w, h = box.w / k;
    if (h > box.h) { h = box.h; w = box.h * k; }
    if (w > r.width) { h *= r.width / w; w = r.width; }
    const her = (document.querySelector('.hm-scene .hm-rest') || document.querySelector('.hmB-canvas')).getBoundingClientRect();
    const fx = (her.left + her.width / 2 - r.left) / r.width, fy = (her.top + her.height / 2 - r.top) / r.height;
    return {
      x: Math.min(Math.max(at[0] - w * fx, box.x), box.x + box.w - w),
      y: Math.min(Math.max(at[1] - h * fy, box.y), box.y + box.h - h),
      w, h,
    };
  }
  /* Paints the figure just placed on the page (the screen is built whole each time, so this runs
     after every render): the pieces composed again only when what's shown changes, at the finer
     scale when the area is drawn larger than the map's own pixels. */
  let areaComp = null, areaCompKey = '';
  function areaPaint() {
    const cv = document.querySelector('.hmB-canvas');
    if (!cv || !areaCtx) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (!w || !h) return;
    const { view, key } = areaCtx, box = areaCut(r);
    const scale = w / box.w > 1.1 ? 2 : 1, ck = key + '@' + scale;
    const draw = () => {
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      MP.paint(cv.getContext('2d'), areaComp, box, w, h);
    };
    if (areaCompKey === ck) { draw(); return; }
    sheet(scale, () => {
      if (!cv.isConnected) return;
      areaComp = MP.compose(view, sheets[scale].img, scale, faintOf(), makeCanvas);
      areaCompKey = ck;
      draw();
    });
  }
  App.mapAreaPaint = () => requestAnimationFrame(areaPaint);
  window.addEventListener('resize', () => { if (document.querySelector('.hmB-canvas')) areaPaint(); });

  /* The layers whose things aren't had (a bench, a shop, a person): a count, not had of total. */
  const PLAIN = new Set(['bench', 'bellway', 'ventrica', 'shop', 'shakra', 'person', 'npc', 'cocoon']);
  const CARET = '<svg class="mp-caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1 L8 5 L3 9 Z" fill="currentColor"/></svg>';
  // The groups open: as left (prefs.mapOpen); at first all of them, on a phone the first two.
  const openGroups = () => (prefs.mapOpen && !Array.isArray(prefs.mapOpen) ? Object.keys(prefs.mapOpen).filter((k) => prefs.mapOpen[k])
    : matchMedia('(max-width: 599px)').matches ? ['upgrades', 'crest'] : GROUPS.map(([g]) => g));
  const inside = new Set();   // the sets whose caret is open, while the page is
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let finds = [], placed = new Map(), pending = '';
  // A mark's point as the data has it: the game's pin, else where the game has the thing
  // (js/spots.js XY), else its room's middle.
  function pointOf(m) {
    const own1 = (SP.XY || {})[m.key];
    const xy = m.at || (own1 && { x: own1[0], y: own1[1] });
    const room = xy ? null : R.roomOf(m.scene);
    return xy || (room && { x: room.x, y: room.y });
  }

  // Full screen's button: the four corners of a frame, opening out, and closing in to leave it.
  const corners = (d) => `<svg class="ic is-lg" width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const FULL_IN = corners('M1.5 4.5 V1.5 H4.5 M7.5 1.5 H10.5 V4.5 M10.5 7.5 V10.5 H7.5 M4.5 10.5 H1.5 V7.5');
  const FULL_OUT = corners('M4.5 1.5 V4.5 H1.5 M10.5 4.5 H7.5 V1.5 M7.5 10.5 V7.5 H10.5 M1.5 7.5 H4.5 V10.5');

  App.screens.map = (sec) => {
    delete prefs.mapAct; delete prefs.mapReach;   // the two filters' choices, from before they went: gone with the next save of the prefs
    const { list, g, own } = all();
    const on = new Set(layersOn());
    const names = prefs.mapNames !== false;
    const lay = layout(list, g, own, on);
    placed = lay.placed;
    const { count, items, fine } = lay;
    const marks = items.map(({ m, p, had }) => pinSvg(m, p, markTitle(m), (FINE.has(m.layer) ? ' is-fine' : '') + (had ? ' is-had' : ''))).join('');
    // From afar, the caches and walls of a room one mark per layer: its picture, how many in a corner.
    const clusters = [...fine.values()].map((f) => `<g class="mp-mk mp-cluster is-${f.m.layer}" style="--px:${n2(f.x)}px;--py:${n2(f.y)}px" aria-hidden="true"><circle r="0.5"/><circle class="mp-plate" r="0.47"/>${artOf(f.m)}`
      + `${f.n > 1 ? `<g class="mp-count"><circle cx="0.36" cy="-0.36" r="0.21"/><text x="0.36" y="-0.34">${num(f.n)}</text></g>` : ''}</g>`).join('');
    const exact = !!own && !!prefs.mapGame, view = R.mapView(own, { all: !exact }), shownPins = R.pinsOn(own);
    const bench = own ? R.restPoint(own, shownPins) : null;
    // Hornet at her bench, sitting, or standing where the game respawns her: the page's own sprite
    // (.hn), over the map at her point (placeOver).
    const hereName = esc(t(own && !own.rested ? 'mapRespawn' : 'mapBench'));
    const hornet = bench ? `<span class="mp-hornet hn${own.rested ? ' is-sit' : ''}" role="img" aria-label="${hereName}" title="${hereName}" data-x="${bench.x}" data-y="${bench.y}"></span>` : '';
    const bought = mapped(own);
    // An area whose map isn't bought: its name struck through; with only what the game shows,
    // not there, as in the game.
    const namesSvg = names ? AREA_NAMES().map((a) => {
      const unmapped = own && MAPPABLE.has(a.id) && !bought.has(a.id);
      if (unmapped && exact) return '';
      return `<text class="mp-name${unmapped ? ' is-unmapped' : ''}${sel('area:' + a.id)}" x="${n2(a.x)}" y="${n2(a.y)}" data-mk="area:${a.id}" data-rooms="${a.rooms.length}" role="button" tabindex="0"${NT}>`
        + `${unmapped ? `<title>${esc(t('mapUnmapped'))}</title>` : ''}${esc(areaName(a.id))}</text>`;
    }).join('') : '';

    /* The selector under the map (design/03-redesign.md, step 6, the selector; the sibling's
       filter): its head (title, show all · hide all and the choices), then the
       groups, each folding (prefs.mapOpen), its title its switch, with its count; each layer's
       picture its switch, in grey when off, with its count; a set's caret opens its layers. */
    const open = openGroups();
    // How many: of a layer whose things are had, had of total in a save (all of them in Free
    // mode); of the rest (places, people), how many show. A layer complete in --good.
    const tally = (ids) => {
      // A group counts its layers but the cocoon, which isn't had nor many: «Your game» counts as
      // its Journal does, had of total (design/64, 1 A).
      if (ids.length > 1) ids = ids.filter((k) => k !== 'cocoon');
      const cs = ids.map((k) => count[k] || { all: 0, had: 0, shown: 0 });
      const sum = (f) => cs.reduce((a, c) => a + c[f], 0);
      if (!own) return [null, sum('all')];
      return ids.some((k) => PLAIN.has(k)) ? [null, sum('shown')] : [sum('had'), sum('all')];
    };
    const nOf = ([had, all]) => (had == null ? (all ? `<span class="mp-n"><b>${num(all)}</b></span>` : '')
      : all ? `<span class="mp-n${had === all ? ' is-full' : ''}"><b>${num(had)}</b><i>/${num(all)}</i></span>` : '');
    const chip = (id, ids, act, extra = '') => {
      const nOn = ids.filter((k) => on.has(k)).length, isOn = nOn > 0;
      const name = SETS[id] ? SETS[id].name() : LAYER.get(id).name();
      return `<button type="button" class="mp-kind${isOn ? '' : ' is-off'}${isOn && nOn < ids.length ? ' is-some' : ''}" data-act="${act}" data-value="${id}" aria-pressed="${isOn}">
        ${legendArt(id)}<span class="mp-kind-t"${NT}>${esc(name)}</span>${nOf(tally(ids))}</button>${extra}`;
    };
    const kinds = (id) => {
      if (!SETS[id]) return chip(id, [id], 'mapLayer');
      const ids = SETS[id].layers, isOpen = inside.has(id), label = t('mapSetChoose') + ': ' + SETS[id].name();
      return `<span class="mp-set">${chip(id, ids, 'mapSet', `<button type="button" class="mp-more" data-act="mapInside" data-value="${id}" aria-expanded="${isOpen}" aria-label="${esc(label)}" title="${esc(label)}">${CARET}</button>`)}</span>`
        + (isOpen ? `<div class="mp-inside" role="group" aria-label="${esc(label)}">${ids.map((k) => chip(k, [k], 'mapLayer')).join('')}</div>` : '');
    };
    const groups = GROUPS.filter(([gr]) => gr !== 'game' || own).map(([gr, ids]) => {
      const all = layersOf(ids), nOn = all.filter((k) => on.has(k)).length, isOpen = open.includes(gr);
      const allOn = nOn === all.length, title = groupName(gr);
      return `<section class="mp-sec${isOpen ? ' is-open' : ''}">
          <div class="mp-sec-h">
            <button type="button" class="mp-fold" data-act="mapOpen" data-value="${gr}" aria-expanded="${isOpen}" aria-label="${esc(t(isOpen ? 'mapFoldClose' : 'mapFoldOpen', { g: title }))}">${CARET}</button>
            <button type="button" class="mp-sec-sw ${allOn ? 'is-all' : nOn ? 'is-some' : 'is-none'}" role="switch" aria-checked="${allOn}" data-act="mapGroup" data-value="${gr}" title="${esc(t(allOn ? 'mapGroupHide' : 'mapGroupShow'))}">
              <span class="mp-sec-t">${esc(title)}</span>${nOf(tally(all))}</button>
          </div>
          ${isOpen ? `<div class="mp-kinds" role="group" aria-label="${esc(title)}">${ids.map(kinds).join('')}</div>` : ''}
        </section>`;
    }).join('');
    const check = (actName, pressed, label, tip = '') => `<button type="button" class="check" role="switch" aria-checked="${pressed}" data-act="${actName}"${tip ? ` title="${esc(tip)}"` : ''}>
        <span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(label)}</span></button>`;
    const legend = `<section class="mp-legend" aria-labelledby="mp-legend-t">
        <div class="mp-legend-h">
          <h3 class="mp-legend-t" id="mp-legend-t">${esc(t('mapShows'))}</h3>
          <span class="mp-all"><button type="button" class="text-btn" data-act="mapAll" data-value="1">${esc(t('mapShowAll'))}</button><button type="button" class="text-btn" data-act="mapAll" data-value="0">${esc(t('mapHideAll'))}</button><button type="button" class="text-btn" data-act="mapHundred">${esc(t('mapOnlyHundred'))}</button></span>
          <div class="mp-opts">
            <div class="mp-checks">${own ? check('mapGame', !exact, t('mapWhole'), t('mapWholeTip')) : ''}${check('mapNames', names, t('mapNames'))}${g ? check('mapHad', !!prefs.mapHad, t('mapHad')) : ''}</div>
          </div>
        </div>
        <div class="mp-secs">${groups}</div>
      </section>`;
    const big = !!prefs.mapBig;
    const fsTitle = esc(t(full ? 'mapFullExit' : 'mapFullScreen'));
    const tools = `<div class="mp-tools" role="group" aria-label="${esc(t('mapZoom'))}">
        <button type="button" data-act="mapZoom" data-value="in" aria-label="${esc(t('mapCloser'))}" title="${esc(t('mapCloser'))}">+</button>
        <button type="button" data-act="mapZoom" data-value="out" aria-label="${esc(t('mapFurther'))}" title="${esc(t('mapFurther'))}">−</button>
        <button type="button" class="mp-big" data-act="mapBig" aria-pressed="${big}" aria-label="${esc(t(big ? 'mapSmall' : 'mapFull'))}" title="${esc(t(big ? 'mapSmall' : 'mapFull'))}">${big ? '⤡' : '⤢'}</button>
        <button type="button" class="mp-full" data-act="mapFull" aria-pressed="${full}" aria-label="${esc(t('mapFullScreen'))}" title="${fsTitle}">${full ? FULL_OUT : FULL_IN}</button></div>`;
    const search = focusSet ? focusBar() : `<div class="mp-find"><label class="search">${App.lens}<input type="search" data-change="mapFind" placeholder="${esc(t(matchMedia('(max-width: 599px)').matches ? 'mapFindShort' : 'mapFind'))}" aria-label="${esc(t('mapFind'))}" autocomplete="off"></label>
        <ul class="mp-found" hidden></ul></div>`;
    sec.innerHTML = `<div class="mp${big ? ' is-big' : ''}${full ? ' is-full' : ''}">${brackets}${screenHead(esc(t('navMap')))}
      <div class="mp-stage">
        <div class="mp-view">
          <canvas class="mp-canvas" aria-hidden="true"></canvas>
          <svg class="mp-svg" viewBox="${vb ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}` : `0 0 ${M.W} ${M.H}`}" role="img" aria-label="${esc(t('mapAlt'))}">
            <defs><radialGradient id="mp-plate"><stop offset="0"/><stop offset="0.6"/><stop offset="1"/></radialGradient></defs>
            <g class="mp-names">${namesSvg}</g><g class="mp-marks">${clusters}${marks}</g>
          </svg>${hornet}<i class="mp-ping" hidden></i>
        </div>
        ${search}${tools}
      </div>
      ${legend}</div>`;
    cardCtx = { g, own };
    // The pieces: composed again only when what's shown changes.
    const viewKey = MP.keyOf(view, 0);
    if (!shown || viewKey !== shownKey) { shownKey = viewKey; shownStamp++; }
    shown = view;
    // The view as it was, once the screen shows; or the thing another screen asked for.
    requestAnimationFrame(() => {
      applyView();
      if (focusSet && focusSet.fit) { focusSet.fit = false; fitTo(focusSet.keys); }
      if (pending) { const k = pending; pending = ''; focusOn(k); }
    });
  };
  // A mark centred close up, its card open and a ring pulsing where it is.
  function focusOn(key) {
    const p = placed.get(key) || (key.startsWith('area:') ? AREA_NAMES().find((a) => 'area:' + a.id === key) : null);
    if (!p) return;
    // A mark of a layer drawn only close up (FINE) needs the view past that, or its card has no mark to sit on.
    const mk = all().list.find((x) => x.key === key);
    centreOn(p.x, p.y, mk && FINE.has(mk.layer) ? 4 : 3);
    const sec = App.screenOf('map'), ping = sec && sec.querySelector('.mp-ping');
    if (ping) { ping.dataset.x = p.x; ping.dataset.y = p.y; ping.dataset.lift = p.lift || 0; placeOver(ping); ping.hidden = false; ping.classList.remove('is-on'); void ping.offsetWidth; ping.classList.add('is-on'); }
    pick1(key);
  }
  /* Another screen's "on the map" (Progress, the Journal): the Map opens on that thing,
     its layer switched on. */
  App.mapShow = (key) => {
    const m = all().list.find((x) => x.key === key);
    if (!m) return;
    focusSet = null;
    const on = layersOn();
    if (!on.includes(m.layer)) { prefs.mapLayers = [...on, m.layer]; }
    savePrefs();
    pending = key;
    if (prefs.view === 'map') render(); else App.go('map');
  };
  /* Several marks at once (Progress's «Ver los n en el mapa», design/28, 3 A; the sibling's focus,
     hallownest-calculator js/app-map.js showOnMap): the Map shows only them, whatever its layers
     and filters, fitted to them, and a line in the search's place says what they are, with ‹ i of
     n › to go through them in the order given (the nearest to the bench first: the caller's) and
     its × back to the whole map. One mark is App.mapShow's. */
  let focusSet = null;   // { keys, name, i (-1: none picked yet), fit } while it lasts
  App.mapFocus = (keys, name) => {
    const list = all().list, ok = [...new Set(keys)].filter((k) => list.some((m) => m.key === k));
    if (ok.length < 2) { if (ok.length) App.mapShow(ok[0]); return; }
    focusSet = { keys: ok, name, i: -1, fit: true };
    pick1('');
    if (prefs.view === 'map') render(); else App.go('map');
  };
  /* A Journal entry's rooms (the 'beast' marks), the most first, from its pin in the Journal
     (design/84, A); one room is a focus of one. */
  App.mapBeastKeys = (id) => all().list.filter((m) => m.layer === 'beast' && m.entry === id).map((m) => m.key);
  App.mapBeast = (id) => {
    const keys = App.mapBeastKeys(id), e = BOOK.get(id);
    if (!keys.length || !e) return;
    focusSet = { keys, name: pick(e.name), i: keys.length > 1 ? -1 : 0, fit: true };
    pick1(keys.length > 1 ? '' : keys[0]);
    if (prefs.view === 'map') render(); else App.go('map');
  };
  function focusBar() {
    const f = focusSet, n = f.keys.length;
    const b = (dir, label, glyph) => `<button type="button" class="mp-focus-go" data-act="mapFocusStep" data-value="${dir}" aria-label="${esc(label)}" title="${esc(label)}">${glyph}</button>`;
    return `<div class="mp-find mp-focus" role="group" aria-label="${esc(f.name)}"><span class="mp-focus-t">${App.pin}<span>${esc(f.name)}</span></span>
        ${b(-1, t('mapFocusPrev'), '‹')}<span class="mp-focus-n">${esc(t('mapFocusOf', { i: f.i < 0 ? '–' : num(f.i + 1), n: num(n) }))}</span>${b(1, t('mapFocusNext'), '›')}
        <button type="button" class="mp-focus-x" data-act="mapFocusOff" aria-label="${esc(t('mapFocusOff'))}" title="${esc(t('mapFocusOff'))}">${App.cross}</button></div>`;
  }
  // The view around the focus's marks, a little room round them, never closer than a quarter of the map.
  function fitTo(keys) {
    const { m } = nodes(), pts = keys.map((k) => placed.get(k)).filter(Boolean);
    if (!m || !pts.length) return;
    const r = m.getBoundingClientRect(), fit = fitView(r.width, r.height), ratio = r.height / r.width;
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), pad = fit.w / 10;
    const w = Math.min(fit.w, Math.max(fit.w / 4, Math.max(...xs) - Math.min(...xs) + 2 * pad, (Math.max(...ys) - Math.min(...ys) + 2 * pad) / ratio));
    vb = { x: (Math.max(...xs) + Math.min(...xs)) / 2 - w / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 - (w * ratio) / 2, w, h: w * ratio };
    applyView();
  }

  /* ── Moving around, as the sibling's map (hallownest-calculator js/app-map.js) ──
     The view is the SVG's viewBox, in the image's pixels: dragging moves it, the wheel or a pinch
     zooms at the pointer, + and − at the middle. The whole map fitted to the box is the furthest;
     eight times closer the closest. The pins keep about the same size on screen (--k), a little
     more close up. The view lasts while the page is open; it isn't saved. */
  let vb = null;   // { x, y, w, h }: the viewBox; null = fitted
  let pinPx = 22;  // a pin's size on screen (applyView)
  let full = false;   // the map in full screen (setFull)
  const nodes = () => { const sec = App.screenOf('map'); return sec ? { v: sec.querySelector('.mp-view'), m: sec.querySelector('.mp-svg') } : {}; };
  // The whole map fitted to a box of that shape: a wide box shows it all; a tall one (a phone)
  // fills its height, to be slid sideways.
  function fitView(bw, bh) {
    const ratio = bw / bh;
    if (ratio >= M.W / M.H) { const w = M.H * ratio; return { x: -(w - M.W) / 2, y: 0, w, h: M.H }; }
    const h = M.H * 0.92, w = h * ratio;
    return { x: (M.W - w) / 2, y: (M.H - h) / 2, w, h };
  }
  let zoom = 1;   // how many times closer than the whole map
  /* The marks that touch at this zoom pushed apart, each a little: a pin's size (k, in the
     image's pixels) is what they need between them. Each starts on its point and its grid
     (arrange()) and moves at most `max` pins from it: none with the whole map (spread, a crowd
     would cover it), SPREAD_MAX from four times closer, so close up every mark stands clear near
     its own place. Again whenever the pins' size or the
     marks change; the caches and walls only when they show (close), else their rooms' counts.
     Each mark's transform is written whole (its point, the pins' size, its shift), and only when
     it changes: read from a --k the SVG passed down, every zoom step restyled every node of every
     mark, most of a frame with every layer shown (14-Oct-2026). */
  const SPREAD_GAP = 1.04, SPREAD_MAX = 1.2;
  // The marks of a map drawn (a render makes a new SVG), listed once: all, from afar, close up.
  function marksOf(m) {
    if (!m._marks) {
      const all = [...m.querySelectorAll('.mp-mk[data-mk], .mp-cluster')];
      m._marks = { all, far: all.filter((el) => !el.classList.contains('is-fine')), close: all.filter((el) => !el.classList.contains('mp-cluster')) };
    }
    return m._marks;
  }
  // A mark's point and its grid's shift (arrange()), as the page wrote them.
  const styleNum = (el, p) => parseFloat(el.style.getPropertyValue(p)) || 0;
  const baseOf = (el) => el._base || (el._base = { x: styleNum(el, '--px'), y: styleNum(el, '--py'), ox: styleNum(el, '--ox'), oy: styleNum(el, '--oy') });
  // A mark at its point, `k` image pixels a pin, shifted (ox, oy) pins.
  function placeMark(el, k, ox, oy) {
    const b = baseOf(el), t = `translate(${b.x}px,${b.y}px) scale(${k}) translate(${n2(ox)}px,${n2(oy)}px)`;
    el._at = { k, ox, oy };
    if (el._t !== t) { el._t = t; el.style.transform = t; }
  }
  function spread(m, k, close, max) {
    const els = close ? marksOf(m).close : marksOf(m).far;
    const stamp = `${k.toFixed(4)}|${close}|${max.toFixed(3)}`;
    if (stamp === m._spread) return;
    m._spread = stamp;
    // In pins: where each starts (x0, y0) and where it's pushed to (x, y).
    const n = els.length, x0 = new Float64Array(n), y0 = new Float64Array(n), x = new Float64Array(n), y = new Float64Array(n);
    els.forEach((el, i) => { const b = baseOf(el); x0[i] = x[i] = b.x / k + b.ox; y0[i] = y[i] = b.y / k + b.oy; });
    const G = SPREAD_GAP, cell = (cx, cy) => cx * 65536 + cy;
    for (let pass = 0; max > 0 && pass < 10; pass++) {
      const cells = new Map();
      for (let i = 0; i < n; i++) { const c = cell(Math.floor(x[i] / G), Math.floor(y[i] / G)), l = cells.get(c); if (l) l.push(i); else cells.set(c, [i]); }
      let moved = false;
      for (let i = 0; i < n; i++) {
        const cx = Math.floor(x[i] / G), cy = Math.floor(y[i] / G);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const j of cells.get(cell(cx + dx, cy + dy)) || []) {
          if (j <= i) continue;
          let ux = x[j] - x[i], uy = y[j] - y[i], d = Math.hypot(ux, uy);
          if (d >= G) continue;
          // Two on one point: apart sideways, the later one to the right.
          if (d < 1e-6) { ux = 1; uy = 0; d = 1; } else { ux /= d; uy /= d; }
          const push = (G - Math.min(d, G)) / 2;
          x[i] -= ux * push; y[i] -= uy * push; x[j] += ux * push; y[j] += uy * push;
          moved = true;
        }
      }
      for (let i = 0; i < n; i++) {
        const ex = x[i] - x0[i], ey = y[i] - y0[i], e = Math.hypot(ex, ey);
        if (e > max) { x[i] = x0[i] + (e ? ex / e * max : 0); y[i] = y0[i] + (e ? ey / e * max : 0); }
      }
      if (!moved) break;
    }
    els.forEach((el, i) => { const b = baseOf(el); placeMark(el, k, b.ox + x[i] - x0[i], b.oy + y[i] - y0[i]); });
  }
  /* Close up, the marks well outside the view (a quarter of it past each edge) leave the layout
     (.is-away): a move then lays out and paints the marks near the view, not every mark of every
     layer (14-Oct-2026). Up to 1.5 times closer than the whole map they all stay, so Tab goes
     through all of them. */
  const AWAY = 0.25;
  function cull(m, on) {
    const ax = vb.w * AWAY, ay = vb.h * AWAY;
    for (const el of marksOf(m).all) {
      const b = baseOf(el);
      const away = on && (b.x < vb.x - ax || b.x > vb.x + vb.w + ax || b.y < vb.y - ay || b.y > vb.y + vb.h + ay);
      if (!!el._away !== away) { el._away = away; el.classList.toggle('is-away', away); }
    }
  }
  function applyView() {
    const { v, m } = nodes();
    if (!v || !m) return;
    const r = m.getBoundingClientRect();
    if (!r.width) return;
    const fit = fitView(r.width, r.height);
    if (!vb) vb = { ...fit };
    // The view keeps the box's shape, and between the whole map and eight times closer.
    const w = Math.min(fit.w * 1.1, Math.max(fit.w / 8, vb.w)), h = w * (r.height / r.width);
    vb = { x: vb.x + (vb.w - w) / 2, y: vb.y + (vb.h - h) / 2, w, h };
    // It doesn't wander off the map: its middle stays over it.
    vb.x = Math.min(M.W - vb.w / 2, Math.max(-vb.w / 2, vb.x));
    vb.y = Math.min(M.H - vb.h / 2, Math.max(-vb.h / 2, vb.y));
    m.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    zoom = fit.w / vb.w;
    // The pins' size on screen: about 22 px with the whole map (18 on a phone), up to a quarter
    // more close up, so zooming in makes room between them rather than making them bigger.
    const px = (r.width < 600 ? 18 : 22) * Math.min(1.25, Math.max(1, Math.pow(zoom, 0.15)));
    pinPx = px;
    const k = vb.w / r.width * px;
    // The names (and whatever else on the map isn't a mark) still take the pins' size from --k.
    for (const g of m.querySelectorAll(':scope > g:not(.mp-marks)')) g.style.setProperty('--k', String(k));
    v.classList.toggle('is-zoomed', zoom > 1.5);
    spread(m, k, zoom > 3, SPREAD_MAX * Math.min(1, Math.max(0, (zoom - 1.5) / 2.5)));
    v.classList.toggle('is-close', zoom > 3);   // the caches and walls, one by one
    cull(m, zoom > 1.5);
    // The box measured above serves the rest: measured again, the marks just moved would be laid
    // out there and then, in the middle of the frame.
    unclutter(m, zoom > 1.5, r);
    // Close up, the map at twice the resolution (assets/map/pieces-hd.webp, tools/extract-map.py):
    // loaded the first time the screen has more pixels than the map, and kept.
    if (r.width * (window.devicePixelRatio || 1) / vb.w > 1) wantFine = true;
    composeMap(r);
    for (const el of v.querySelectorAll('.mp-hornet, .mp-ping')) placeOver(el, r);
    paintCard();
  }
  /* The area names, from afar (design/64, 2 A): one that would overlap another waits for the zoom,
     the larger area's (by its rooms) staying; zoomed in, all of them. Their size on screen is the
     same at any zoom, so only the view's size and the names shown change it. */
  function unclutter(m, zoomed, r0 = m.getBoundingClientRect()) {
    // Worked out again only when the map (a render makes a new one), its size or the zoom change.
    const stamp = `${zoomed}|${Math.round(r0.width)}x${Math.round(r0.height)}`;
    if (m._clutter === stamp) return;
    m._clutter = stamp;
    const names = [...m.querySelectorAll('.mp-name')];
    for (const x of names) x.classList.remove('is-crowded');
    if (zoomed) return;
    const kept = [];
    for (const x of names.slice().sort((a, b) => Number(b.dataset.rooms) - Number(a.dataset.rooms))) {
      const r = x.getBoundingClientRect();
      if (!r.width) continue;
      if (kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 2 && r.bottom > k.top - 2)) x.classList.add('is-crowded');
      else kept.push(r);
    }
  }
  /* Full screen, a state and not a pref (the browser wants a tap to go in): the map's stage over
     the whole window with the search and the zoom on it (css: .mp.is-full), and the page itself
     full screen where the browser can; where it can't (an iPhone, an iframe), it fills the
     window. Out by its button, by Esc, or by leaving the Map (setView, js/app.js). As the
     sibling's (hallownest-calculator js/app-map.js). */
  const root = document.documentElement;
  const fsEnter = root.requestFullscreen || root.webkitRequestFullscreen;
  const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
  const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const fsCan = !!(fsEnter && fsExit && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
  const quiet = (f) => { try { const p = f(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* refused: it fills the window */ } };
  // Out of it without painting: whoever calls paints.
  function fullOff() {
    if (!full) return;
    full = false; vb = null;
    const mp = document.querySelector('.mp.is-full');
    if (mp) mp.classList.remove('is-full');
    if (fsCan && fsOn()) quiet(() => fsExit.call(document));
  }
  function setFull(on) {
    if (on === full) return;
    if (on) { full = true; vb = null; if (fsCan) quiet(() => fsEnter.call(root)); } else fullOff();
    render();
    const sec = App.screenOf('map'), btn = sec && sec.querySelector('.mp-full');
    if (btn) btn.focus({ preventScroll: true });
  }
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => {
    if (full && !fsOn()) setFull(false);                          // Esc, or the browser's own way out
    else if (prefs.view === 'map') { vb = null; applyView(); }    // in, or out by its button: fitted to the window as it is now
  });
  // Esc where the browser doesn't take it (filling the window); an open card takes the first Esc.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && full && !e.defaultPrevented) setFull(false); });
  App.mapFullOff = fullOff;

  /* What sits over the map in the page (Hornet, the search's ring): at its map point (data-x, -y),
     raised by data-lift pins where the mark rests on it (a bench on its floor: layout's REST). */
  function placeOver(el, r) {
    const { m } = nodes();
    if (!m || !vb || el.dataset.x === undefined) return;
    r = r || m.getBoundingClientRect();
    el.style.left = ((el.dataset.x - vb.x) / vb.w * r.width) + 'px';
    el.style.top = ((el.dataset.y - vb.y) / vb.h * r.height - (Number(el.dataset.lift) || 0) * pinPx) + 'px';
  }
  // A point on screen → the image's pixels.
  function toMap(clientX, clientY) {
    const r = nodes().m.getBoundingClientRect();
    return [vb.x + ((clientX - r.left) / r.width) * vb.w, vb.y + ((clientY - r.top) / r.height) * vb.h];
  }

  /* ── The card of the mark tapped, over the map, as the sibling's: its picture, its name, where
     it is and what it says (how it's had, what's still open there); in Free mode a piece can be
     marked had from it (a ladder's leads to the Inventory); a gauntlet or a boss takes you to fight it, a boss or an entry to the
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
  // The pieces Free mode takes from the Inventory's ladders (js/app-progress.js freeView, LADDER).
  const LADDER_KINDS = ['mask-shard', 'spool-fragment', 'silk-heart', 'needle', 'crafting-kit', 'tool-pouch'];
  const listOf = (names, more) => names.slice(0, 6).join(', ') + (names.length > 6 ? ' ' + t('mapMore', { n: num(names.length - 6) }) : '') + (more || '');
  function cardHtml(key) {
    const c = cardCtx || {};
    const { list } = all();
    const own = c.own, g = c.g;
    const line = (xs) => xs.filter(Boolean).map((x) => `<span${NT}>${esc(x)}</span>`).join('');
    const state = (x) => `<span class="mp-card-state">${esc(x)}</span>`;
    const btn = (act, value, label) => `<button type="button" class="text-btn" data-act="${act}" data-value="${esc(value)}">${esc(label)}</button>`;
    // The wishes still open of those asked here. One name per wish: Broodfeast's two quests, a wish's Pre stage and its own are the same wish.
    const wishesNote = (quests) => {
      const open = [...new Set(quests.filter((q) => !wishDone(g, q)).map((q) => wishOf(q)))].map((i) => pick(CO.WISHES[i][4]));
      return open.length ? t(g ? 'mapWishesLeft' : 'mapWishes', { list: listOf(open) }) : t('mapWishesNone');
    };
    let art = '', name = '', where = '', note = '', acts = '';
    if (key.startsWith('area:')) {
      const id = key.slice(5), a = AREA_NAMES().find((x) => x.id === id);
      if (!a) return '';
      name = areaName(id);
      art = badge('maps', GLYPH.map);
      const inArea = list.filter((m) => m.scene && R.areaOf(m.scene) === id);
      const hundred = inArea.filter((m) => HUNDRED.includes(m.layer) && (!g || !m.got)).length;
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
    where = line([areaName(area), m.act ? t('saveAct', { n: m.act }) : '', m.sub]);
    const kind = key.split(':')[0];
    if (kind === 'piece') {
      const i = Number(key.slice(6));
      note = App.howPiece ? App.howPiece(i) : '';
      /* In Free mode a piece is marked here, but those of a ladder (masks, silk, the Silk Hearts, the
         Needle, the Kit, the Pouch) follow the Inventory's levels, as on Progress: the way there. */
      acts = own ? state(t(m.got ? 'pgGot' : 'invMissing'))
        : LADDER_KINDS.includes(m.layer) ? `${state(t('pgLadderNote'))}<a class="text-btn" href="${App.here(App.hashFor('game'))}" data-act="view" data-value="game">${esc(t('navGame'))}</a>`
          : `<button type="button" class="text-btn" data-act="mapMark" data-value="${i}" aria-pressed="${m.got}">${esc(t(m.got ? 'mapUnmark' : 'mapMark'))}</button>`;
    } else if (['tools', 'crests', 'skills', 'arts', 'everbloom'].includes(kind)) {
      note = m.note || (App.howOf ? App.howOf(key) : '');
      if (g) acts = state(t(m.got ? 'pgGot' : 'invMissing'));
    } else if (kind === 'pin') {
      if (m.off) acts = state(m.sub);
      where = line([areaName(area)]);
    } else if (kind === 'gaunt') {
      const x = m.gauntlet, n = x.waves.length;
      where = line([areaName(x.area), t(n === 1 ? 'ftWaves1' : 'ftWaves', { n: num(n) })]);
      note = x.reward ? t('ftReward') + ': ' + pick(x.reward) : '';
      if (App.VIEWS.includes('fight')) acts = btn('mapFight', x.id, t('mapFight'));
    } else if (kind === 'boss') {
      if (g) acts = state(t(m.got ? 'mapBeaten' : 'mapNotBeaten'));
      // Its gauntlets, if its fight is one (or several): their waves, their reward, each on Fight.
      const xs = m.gauntlets || [], n = xs.reduce((k, x) => k + x.waves.length, 0), reward = xs.map((x) => x.reward).find(Boolean);
      if (xs.length) where = line([areaName(area), m.act ? t('saveAct', { n: m.act }) : '', t(n === 1 ? 'ftWaves1' : 'ftWaves', { n: num(n) })]);
      if (reward) note = t('ftReward') + ': ' + pick(reward);
      const fight = !App.VIEWS.includes('fight') ? '' : xs.length ? xs.map((x) => btn('mapFight', x.id, xs.length > 1 ? App.gauntletName(x.id) : t('mapFight'))).join('')
        : btn('mapFoe', m.foe, t('mapFight'));
      acts += fight + (m.entry ? btn('mapJournal', m.entry, t('mapToJournal')) : '');
    } else if (kind === 'bell') {
      if (g) acts = state(t(m.got ? 'mapRung' : 'mapNotRung'));
    } else if (kind === 'npc') {
      const x = m.person, s = m.now;
      if (s.met != null) acts = state(t(s.met ? 'mapMet' : 'mapNotMet'));
      note = s.unsure ? t('mapNpcUnsure') : !s.where && x.spots.length > 1 ? t('mapNpcSpots', { n: num(x.spots.length) }) : '';
    } else if (kind === 'shop' || kind === 'person' || kind === 'shakra') {
      const id = m.npc;
      if (m.trade) {
        note = t('mapTrade_' + m.trade);
      } else if (id === 'shakra') {
        // Her maps (js/spots.js EXTRAS: the maps with a price), by their areas.
        const bought = new Set(own ? own.maps : []), hers = SHAKRA_MAPS.map((x) => x[2][1].slice(3, -3));
        const left = hers.filter((f) => !bought.has(f)).map((f) => areaName(SP.MAPS[f])).filter(Boolean);
        note = own ? (left.length ? t('mapShakraLeft', { list: listOf(left) }) : t('mapShakraAll'))
          : t('mapShakraNote', { n: num(hers.length), m: num(Object.keys(SP.MAPS).length - hers.length) });
      } else if (id === 'scrounge') {
        note = t('mapScroungeNote');
      } else {
        const things = givenBy(id).map((k) => list.find((x) => x.key === k)).filter((x) => x && (!g || !x.got));
        note = things.length ? t(g ? 'mapSellsLeft' : 'mapSells', { list: listOf(things.map((x) => x.name)) }) : g ? t('mapSellsNone') : '';
      }
      if (m.quests) note = note ? note + (/[.!?]$/.test(note) ? ' ' : '. ') + wishesNote(m.quests) : wishesNote(m.quests);
    } else if (kind === 'board' || kind === 'giver') {
      note = wishesNote(m.quests);
    } else if (kind === 'task') {
      // What it's for, whether it's done, and where its wish is taken (the Wishwall, or who asks).
      if (m.layer === 'qitem') note = t('mapTaskFor', { wish: m.sub });
      where = line([areaName(area), m.act ? t('saveAct', { n: m.act }) : '']);
      if (g) acts = state(t(m.layer === 'qitem' ? (m.got ? 'pgGot' : 'invMissing') : m.got ? (m.layer === 'wspot' ? 'mapWishGranted' : 'mapDone') : 'mapNotDone'));
      /* Where it's taken: the part of the wish still to do (a «Pre» at the board, then who it sends
         you to; Steel Sentinel's first part, then its second), the first one if there's no save. */
      const done = new Set(g ? g.quests : []);
      let q = m.quest;
      while (QU.CHAIN[q] && QU.CHAIN[q].prev && !done.has(QU.CHAIN[q].prev)) q = QU.CHAIN[q].prev;
      const f = QU.FROM[q] || QU.FROM[m.quest] || {};
      const to = f.board ? 'board:' + lower(f.board) : f.npc && f.npc.length ? 'giver:' + lower(f.npc[0]) : '';
      if (to && list.some((x) => x.key === to)) acts += btn('mapShow', to, t(f.board ? 'mapToWall' : 'mapToGiver'));
    } else if (kind === 'lock') {
      note = m.sub;
      where = line([areaName(area)]);
    } else if (kind === 'extra') {
      note = m.note || '';
      // Eva's: the slots it needs, and with a save how many are open.
      if (m.eva) note = (m.eva.slots ? t('mapEvaSlots', { npc: pick(HW.NPCS.eva), n: num(m.eva.slots), crest: pick(D.CRESTS.find((c) => c.id === 'hunter').name) }) : t('mapEvaMeet', { npc: pick(HW.NPCS.eva) }))
        + (own && m.eva.slots ? ' ' + t('mapEvaHave', { n: num(own.evaSlots || 0) }) : '');
      if (g) acts = state(t(m.got ? 'pgGot' : 'invMissing'));
    } else if (kind === 'beast') {
      const e = BOOK.get(m.entry), k = own && own.journal[e.id];
      note = [t('mapBeastHere', { n: num(m.n) }), own ? (k === undefined ? t('hjState_unseen') : e.kills != null ? t('mapKills', { n: num(k), m: num(e.kills) }) : t('hjState_seen')) : ''].filter(Boolean).join(' · ');
      acts = btn('mapJournal', e.id, t('mapToJournal'));
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
    // Its mark far out of the view (cull), and so out of the layout: the card waits for it.
    c.hidden = !!el._away;
    if (c.hidden) return;
    const r = el.getBoundingClientRect(), br = stage.getBoundingClientRect();
    const sx = r.left + r.width / 2 - br.left, sy = r.top - br.top;
    const half = c.firstElementChild ? c.firstElementChild.offsetWidth / 2 + 8 : 0;
    c.style.left = (half * 2 > br.width ? br.width / 2 : Math.max(half, Math.min(br.width - half, sx))) + 'px';
    c.style.top = sy + 'px';
    /* Above its mark, unless it doesn't fit, or would cover the search or the zoom (design/64, 3 A):
       then below it. */
    const ch = c.firstElementChild ? c.firstElementChild.offsetHeight : 0, cw = c.firstElementChild ? c.firstElementChild.offsetWidth : 0;
    const left = parseFloat(c.style.left) - cw / 2, top = sy - ch - 16;
    const covers = [...stage.querySelectorAll('.mp-find, .mp-tools')].some((x) => {
      const b = x.getBoundingClientRect(), bx = b.left - br.left, by = b.top - br.top;
      return b.width && left < bx + b.width && left + cw > bx && top < by + b.height && sy > by;
    });
    c.classList.toggle('is-below', sy < ch + 24 || covers);
  }
  const pick1 = (key) => { picked = key; const { m } = nodes(); if (m) for (const x of m.querySelectorAll('.is-sel')) x.classList.remove('is-sel');
    const el = key && m && m.querySelector(`[data-mk="${CSS.escape(key)}"]`); if (el) el.classList.add('is-sel');
    const sec = App.screenOf('map'), c = sec && sec.querySelector('.mp-card-wrap'); if (c) c.dataset.key = ''; paintCard(); };
  // f above 1 goes further, below 1 closer, round a map point.
  function zoomAt(f, cx, cy) {
    if (!vb) return;
    const w = vb.w * f, h = vb.h * f;
    vb = { x: cx - (cx - vb.x) * f, y: cy - (cy - vb.y) * f, w, h };
    applyView();
  }
  // A map point centred at so many times closer than the whole map.
  function centreOn(px, py, times) {
    const { m } = nodes();
    if (!m) return;
    const r = m.getBoundingClientRect(), fit = fitView(r.width, r.height);
    const w = fit.w / times, h = w * (r.height / r.width);
    vb = { x: px - w / 2, y: py - h / 2, w, h };
    applyView();
  }
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
    const mk = e.target.closest && e.target.closest('.mp-svg [data-mk]');
    if (mk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick1(mk.dataset.mk); }
    else if (e.key === 'Escape' && picked) { e.preventDefault(); pick1(''); }   // (full screen's Esc waits for the next one)
  });
  const inView = (e) => { const { v } = nodes(); return v && v.contains(e.target) && !e.target.closest('.mp-find, .mp-tools, .mp-card-wrap') ? v : null; };
  document.addEventListener('pointerdown', (e) => {
    const v = inView(e);
    if (!v || !vb || (e.pointerType === 'mouse' && e.button !== 0)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 1) { drag = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moved = false; v.classList.add('is-grabbing'); }
    else if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), vb: { ...vb }, c: toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
      drag = null;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId) || !vb) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    const { m } = nodes();
    if (!m) return;
    const r = m.getBoundingClientRect();
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      vb = { ...drag.vb, x: drag.vb.x - (dx / r.width) * drag.vb.w, y: drag.vb.y - (dy / r.height) * drag.vb.h };
      movedAt = performance.now();
      applyView();
    } else if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      moved = true;
      movedAt = performance.now();
      vb = { ...pinch.vb };
      zoomAt(pinch.d / (Math.hypot(a[0] - b[0], a[1] - b[1]) || 1), pinch.c[0], pinch.c[1]);
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
    if (!v || !vb) return;
    e.preventDefault();
    const [cx, cy] = toMap(e.clientX, e.clientY);
    movedAt = performance.now();
    zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, cx, cy);
  }, { passive: false });
  document.addEventListener('dblclick', (e) => { const v = inView(e); if (v && vb) { const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(1 / 1.8, cx, cy); } });
  // The large map takes the window's width; 100vw would count the scrollbar.
  const pageWidth = () => document.documentElement.style.setProperty('--page-w', document.documentElement.clientWidth + 'px');
  pageWidth();
  window.addEventListener('resize', () => { pageWidth(); applyView(); });
  // The names' sizes once the typeface is in (unclutter measures them).
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const { m } = nodes(); if (m) { m._clutter = ''; applyView(); } });

  /* Typing in the search lists what matches under it, up to ten: the areas, then every thing the
     map can show (whatever layer it's on; in a save, what's missing), each with its layer's name;
     the caches and walls, nameless, aren't looked in. */
  function findables() {
    const { list, g, own } = all();
    const out = AREA_NAMES().map((a) => ({ name: areaName(a.id), sub: t('mapArea'), key: 'area:' + a.id }));
    const seen = new Set();
    for (const m of list) {
      // What the map can show: in a save, only what's missing (whatever its layer or the filters), and what's had with "Show Completed".
      if (FINE.has(m.layer) || m.layer === 'bench' || m.layer === 'beast' || (OWN_ONLY.has(m.layer) && !own) || (g && m.got && !prefs.mapHad)) continue;
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

  /* The legend's switches draw the Map again, not every screen (js/app.js renderOnly: the others
     took a quarter of each switch, far more on a phone; 14-Oct-2026). An app.js from before it
     (GitHub Pages caches each file on its own) draws them all, as it did. */
  const redraw = () => (App.renderOnly ? App.renderOnly('map') : render());
  // Several layers at once: all on, or (when they're all on already, or `off`) all off.
  function switchAll(ids, off = ids.every((k) => layersOn().includes(k))) {
    const cur = layersOn();
    prefs.mapLayers = off ? cur.filter((k) => !ids.includes(k)) : [...new Set([...cur, ...ids])];
    savePrefs(); redraw();
  }
  Object.assign(actions, {
    mapLayer(node) {
      const k = node.dataset.value, cur = layersOn();
      prefs.mapLayers = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); redraw();
    },
    // A group's switch: all of it on, or, when it's all on already, all of it off.
    mapGroup(node) { switchAll(layersOf(GROUPS.find(([g]) => g === node.dataset.value)[1])); },
    // A set's switch: all of its layers on, or, when any is on, all of them off.
    mapSet(node) { const ids = SETS[node.dataset.value].layers; switchAll(ids, ids.some((k) => layersOn().includes(k))); },
    mapInside(node) { const k = node.dataset.value; if (inside.has(k)) inside.delete(k); else inside.add(k); redraw(); },
    // Show all · hide all.
    mapAll(node) { prefs.mapLayers = node.dataset.value === '1' ? LAYERS.map((l) => l.id) : []; savePrefs(); redraw(); },
    // Only the 100%: just the layers that count.
    mapHundred() { prefs.mapLayers = [...HUNDRED]; savePrefs(); redraw(); },
    mapOpen(node) {
      const gr = node.dataset.value, open = Object.fromEntries(openGroups().map((k) => [k, true]));
      open[gr] = !open[gr];
      prefs.mapOpen = open; savePrefs(); redraw();
    },
    mapGame() { prefs.mapGame = !prefs.mapGame; savePrefs(); render(); },
    mapZoom(node) { if (vb) zoomAt(node.dataset.value === 'in' ? 1 / 1.4 : 1.4, vb.x + vb.w / 2, vb.y + vb.h / 2); },
    // The large map, a choice (prefs.mapBig), as the sibling's: refitted and brought under the bar.
    mapBig() {
      prefs.mapBig = !prefs.mapBig; savePrefs(); vb = null; render();
      const sec = App.screenOf('map'), b = sec && sec.querySelector('.mp-big'), st = sec && sec.querySelector('.mp-stage');
      if (b) b.focus({ preventScroll: true });
      if (prefs.mapBig && st) st.scrollIntoView({ block: 'start' });
    },
    mapFull() { setFull(!full); },
    mapPick() { pick1(''); },
    // Free mode: a piece marked had or not from its card (the Inventory's marks, a New Game until you mark).
    mapMark(node) {
      const i = Number(node.dataset.value);
      App.freeMark((m) => { m.pieces = m.pieces.includes(i) ? m.pieces.filter((j) => j !== i) : [...m.pieces, i]; });
    },
    // A gauntlet's card: to Combat, that gauntlet chosen; a boss's: that boss.
    mapFight(node) { prefs.ftMode = 'gauntlets'; prefs.gauntlet = node.dataset.value; savePrefs(); App.go('fight'); },
    mapFoe(node) { prefs.ftMode = 'foe'; prefs.foe = node.dataset.value; savePrefs(); App.go('fight'); },
    // A boss's or an entry's card: the Journal, that entry open.
    mapJournal(node) { if (App.journalOpen) App.journalOpen(node.dataset.value); App.go('journal'); },
    mapNames() { prefs.mapNames = prefs.mapNames === false; savePrefs(); redraw(); },
    // What's had, back on the map (design/77): a choice of yours, kept in the prefs.
    mapHad() { prefs.mapHad = !prefs.mapHad; savePrefs(); redraw(); },
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
    mapBeast(node) { App.mapBeast(node.dataset.value); },
    // The focus: the next or previous of its marks, centred with its card; or back to the whole map.
    mapFocusStep(node) {
      if (!focusSet) return;
      const n = focusSet.keys.length, d = Number(node.dataset.value) < 0 ? -1 : 1;
      focusSet.i = focusSet.i < 0 ? (d > 0 ? 0 : n - 1) : (focusSet.i + d + n) % n;
      pending = focusSet.keys[focusSet.i];
      render();
    },
    mapFocusOff() { focusSet = null; pick1(''); render(); },
  });
  // Whatever changes what the Map shows ends the focus, so a switch never seems to do nothing.
  for (const k of ['mapLayer', 'mapGroup', 'mapSet', 'mapAll', 'mapHundred', 'mapGame', 'mapHad']) {
    const f = actions[k];
    actions[k] = (node) => { focusSet = null; f(node); };
  }

  // For the admin mode (js/app-map-admin.js): what it reads of the Map, and the list worked out
  // again once a fix changes.
  // A mark moved by hand (the admin's drag) to a point of the image, keeping its size and shift.
  function moveMark(el, p) {
    const b = baseOf(el), at = el._at || { k: 1, ox: b.ox, oy: b.oy };
    b.x = p.x; b.y = p.y;
    el.style.setProperty('--px', p.x + 'px');
    el.style.setProperty('--py', p.y + 'px');
    placeMark(el, at.k, at.ox, at.oy);
  }
  App.mapApi = { LAYER, LAYERS, OWN_ONLY, layersOn, pointOf, toMap, nodes, focusOn, pick: pick1, picked: () => picked, list: () => all().list, placed: () => placed,
    view: () => vb, dirty: () => { cache = null; }, moveMark };
})();
