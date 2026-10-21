#!/usr/bin/env node
/* tools/gen-spots.js — generates js/spots.js: where the Map draws each thing (npm run data runs it
   after tools/gen-how.js). Offline: it reads the site's generated data (js/collectibles.js,
   js/how.js, js/shop.js, js/quests.js, js/journal-rooms.js, js/enemies.js), kb/data/completionist/
   and kb/data/game/pickups.json, wishes.json and hunts.json (tools/extract-pickups.py,
   tools/extract-wishes.py, tools/extract-hunts.py, from the game's own files).

   Where a thing of the 100% is drawn, by its first way (js/how.js HOW) that has a room:
     found      the room its check names (a piece's sceneData bool), else where the game has its
                pickup lying (pickups.json: a CollectableItemPickup of its save name)
     shop       the vendor's room (js/shop.js VENDORS; Shakra walks, so never hers)
     wish       the Wishwall that lists it, else who offers it (js/quests.js FROM)
     boss       the boss's arena: the room of its Journal entry (js/journal-rooms.js)
     npc, challenge, fleas   where that person is (PEOPLE below)
   HAND overrides that for what the game gives from a script (a shrine, an NPC's FSM) rather than a
   pickup: each is the scene pickups.json lists for it, chosen by hand, and the generator stops if
   the scene stops being one of those (a patch moved it).

   The rest the Map shows:
     EXTRAS   what doesn't count for the 100%, from kb/data/completionist/: relics, Mossberries,
              Silkeaters, Mementos, the Bellhome's furnishings, unique spawns, rosary and shell
              shard caches and breakable walls, each [kind, act, check, scene, name?]: the scene
              the check names, or the pickup's (relics, Mementos), or HAND_EXTRA's. Then, from the
              game's scenes (pickups.json doors), what opens a way: lever, plate, gate, lock,
              shortcut, silkwall, each ['bool', Scene, id] as the save keeps it. Then the 28 area
              maps (map, by their Has<Area>Map flag: Shakra's spot or where the map lies), and the
              rosaries and shell shards lying in a room (rosaries, shards: pickups.json lying; a
              "cache" of the completionist's that is one of them goes there too), and, last, the
              ones given (GIVEN_PURSE: the Fixer's Statuette, the Sprintmaster's prizes).
     BOSSES   [foe id, scene, check, act]: each boss of the completionist's list, its arena and whether
              it's beaten (a playerData flag, or its Journal entry listed), then the second fights
              it folds into one entry (BOSS_MORE), each with what the save keeps of it; act the
              first Act it can be fought in (the completionist's whichAct, BOSS_MORE's own, BOSS_ACT's fix).
     VENDORS  vendor id → its rooms (js/shop.js), Shakra's among them
     PEOPLE   npc id → its room: the people who give something of the 100%, and Scrounge, who
              buys the relics
     BELLS    [playerData field, scene (, name)]: the six Bellshrines (the Grand Gate asks for five)
     KEYS     a key's save name (js/quests.js LOCKS) → its name, the game's
     SEATS    where the game wakes Hornet, each respawn marker on the ground under it (below) */
'use strict';
const fs = require('fs');
const path = require('path');
const { write } = require('./emit.js');
const { names } = require('./names.js');
const C = require('./completionist.js');
require('../js/data.js');
require('../js/journal.js');
require('../js/enemies.js');
require('../js/collectibles.js');
require('../js/shop.js');
require('../js/quests.js');
require('../js/how.js');
require('../js/journal-rooms.js');
require('../js/gauntlets.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const SS = globalThis.SS;
const D = SS.data, J = SS.journal, E = SS.enemies, CO = SS.collectibles, SH = SS.shop, Q = SS.quests, H = SS.how;

const OUT = path.join(__dirname, '..', 'js', 'spots.js');
const PICKUPS = path.join(__dirname, '..', 'kb', 'data', 'game', 'pickups.json');
function fail(msg) { throw new Error('gen-spots: ' + msg); }
const P = JSON.parse(fs.readFileSync(PICKUPS, 'utf8'));
/* What decides whether each thing the save keeps per room can be had (kb/data/game/gating.json,
   tools/extract-gating.py, design/03-redesign.md, step 6, the save checks): the flags a way's own
   components set, the other lock of a door, what the game takes away and when, what only one mode
   or the demo has, what the scenes never switch on. By "Scene|ID" as the save writes them. */
const GATING = require('./gating.js').load('gen-spots');   // stops unless pickups.json is of the same patch
const GATE = new Map(Object.entries(GATING.items).map(([k, v]) => [k.toLowerCase(), v]));
const gateOf = (scene, id) => GATE.get((scene + '|' + id).toLowerCase()) || {};
// A check's sceneData bools, wherever they are in it; its saved items of any kind (a cache's int, a rock's hits).
const boolsOf = (c) => (c[0] === 'bool' ? [c] : c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(boolsOf) : []);
const savedOf = (c) => (['bool', 'int', 'geo'].includes(c[0]) ? [c] : c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(savedOf) : []);
/* A thing the game never has (11 A): only in the demo (a demo gate, "Demo States/Demo"), or switched
   off in its scene with nothing there that switches it on (none of the author's saves has one of
   these bools, though their rooms were entered 8 to 73 times). Left out of the Map. */
const neverHad = (c) => { const b = savedOf(c); return b.length > 0 && b.every((x) => gateOf(x[1], x[2]).never || gateOf(x[1], x[2]).demo); };
const leftOut = [];
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").trim();
const onMap = (scene) => !!(scene && R.roomOf(scene));

/* ── Where the game has a thing: the scenes whose components point at its save name ── */
const LYING = /^(CollectableItemPickup|SilkGrubCocoon|SprintRaceController)$/;
const lying = (save) => {
  const x = P.items[save];
  return x ? [...new Set(x.at.filter(([, comp]) => LYING.test(comp)).map(([s]) => s))].filter(onMap) : [];
};
const given = (save) => { const x = P.items[save]; return x ? [...new Set(x.at.map(([s]) => s))] : []; };

/* HAND: what the game gives from a script, by hand among the scenes pickups.json lists for it
   (given() for an item, P.fields for an ability's flag, P.npcs for a person), with why. */
const HAND = {
  crests: {
    // Each Crest's own shrine (Crest Get Shrine), by its chapel's area (the completionist's): the
    // Reaper's in Greymoor, the Wanderer's by Bonegrave, the Architect's in the Underworks, the
    // Shaman's with the Snail Shamans in Moss Grotto.
    reaper: ['Reaper', 'greymoor_20c'], wanderer: ['Wanderer', 'chapel_wanderer'],
    architect: ['Toolmaster', 'under_20'], shaman: ['Spell', 'tut_04'],
  },
  skills: {
    // The Weaver shrines (Shrine Weaver Ability), by their areas: Silkspear in Mosshome, Thread
    // Storm in Greymoor, Sharpdart in the Wormways; Pale Nails where the Cradle's fight ends.
    silkspear: ['Silk Spear', 'mosstown_02'], 'thread-storm': ['Thread Sphere', 'greymoor_22'],
    sharpdart: ['Silk Charge', 'crawl_05'], 'pale-nails': ['Silk Boss Needle', 'cradle_03_destroyed'],
  },
  arts: {
    // The rooms whose scripts set the ability's flag, by their areas: Swift Step's shrine in the
    // Deep Docks, Clawline's in the Underworks (Shrine Weaver HarpoonDash), Silk Soar's in the
    // Abyss, Cling Grip's in Shellwood (the room past Sister Splinter's, not her arena), the
    // Drifter's Cloak from the Seamstress, the Faydown Cloak atop Mount Fay.
    'swift-step': ['hasDash', 'bone_east_05'], clawline: ['hasHarpoonDash', 'under_18'], 'cling-grip': ['hasWalljump', 'shellwood_10'],
    'silk-soar': ['hasSuperJump', 'abyss_08'], 'drifters-cloak': ['hasBrolly', 'bone_east_umbrella'],
    'faydown-cloak': ['hasDoubleJump', 'peak_08b'],
    // The two Needolin melodies outside the 100%, both Act 3's (their wiki pages): the Beastling
    // Call from the Bell Beast once the Bell Eater is beaten, in its arena under Bellhart; the
    // Elegy of the Deep from the Snail Shamans in the Ruined Chapel. Third: the Act.
    'beastling-call': ['UnlockedFastTravelTeleport', 'belltown_basement', 3], 'elegy-of-the-deep': ['hasNeedolinMemoryPowerup', 'tut_04', 3],
  },
  tools: {
    // The craft pickups (Craft Pickup).
    cogfly: ['Cogwork Flier', 'hang_09'], pimpillo: ['Pimpilo', 'wisp_06'],
  },
};
/* The people (by js/how.js NPCS id, and Scrounge) and the object that stands for them in the
   game's scenes (pickups.json npcs); Plinney's has no name of its own there, so his room is the
   one his wish is offered in (js/quests.js FROM, A Pinsmith's Tools). Jubilana sells in three rooms
   (js/shop.js VENDORS), Songclave being her home: the other two she only scavenges in. */
const PEOPLE_OBJ = {
  eva: 'Crest Upgrade Shrine', pinstress: 'Pinstress Interior NPC', loddie: 'Ladybug Craft Pickup', lumble: 'Dice Pilgrim',
  mooshka: 'Caravan Troupe Leader Fleatopia NPC', scrounge: 'Relic Dealer NPC',
};
const PEOPLE_ROOM = { plinney: 'Belltown_Room_pinsmith', jubilana: 'song_enclave' };
// The 28 maps Shakra sells (js/savefile.js MAP_FLAGS, Has<X>Map) → the area each draws (js/collectibles.js
// AREAS), by the game's map names (its Areas page and the flags' own words).
const MAPS = {
  MossGrotto: 'MOSSCAVE', Wilds: 'WILDS', Boneforest: 'BONEFOREST', Docks: 'DOCKS', Greymoor: 'GREYMOOR', Bellhart: 'BELLHART',
  Shellwood: 'SHELLWOOD', Crawl: 'CRAWL', HuntersNest: 'HUNTERS_MARCH', JudgeSteps: 'CORAL_STEPS', Dustpens: 'DUSTPENS',
  Slab: 'SLAB', Peak: 'MOUNTAIN', CitadelUnderstore: 'UNDERSTORE', Coral: 'CORAL_RIVER', Swamp: 'SHADOW', Clover: 'GROVE',
  Abyss: 'ABYSS', Hang: 'HANG', SongGate: 'GRANDGATE', Halls: 'HALLS', Ward: 'WARD', Cog: 'COGWORK_CORE', Library: 'LIBRARY',
  Cradle: 'CRADLE', Arborium: 'ARBORIUM', Aqueduct: 'AQUEDUCTS', Weavehome: 'WEAVE_PRIME',
};
// The completionist's bosses whose names aren't a foe's (js/enemies.js), and the extras whose check
// is a flag with no room: each placed where the completionist's own sentence says it is, but the
// Mosshome Mossberry: the pickup that sets its flag is in Bone_05b, beside Mosshome (pickups.json
// fields, 13-Oct-2026; Albert's hand fix had put it there too).
const BOSS_ALIAS = { 'great conchflies': 'great-conchfly', 'raging conchfly': 'raging-conchfly' };
const HAND_EXTRA = {
  bonetownAspidBerryCollected: 'Bonetown', mosstownAspidBerryCollected: 'Bone_05b',
  bonegraveAspidBerryCollected: 'Bonegrave', churchRhinoKilled: 'Bone_East_10_Church', silkFarmAbyssCoresCleared: 'Dust_11',
};
/* The pieces with no way of their own (js/how.js HOW lists those of the 100%'s counters), by the
   check's flag or wish: where the scene that sets it is (read in the game's scenes on
   28-Sep-2026: the cage of the Huge Flea, Kratt strung up in Greymoor, the wild troupe hunter by
   the Putrified Ducts' Bellway, the Architect's cylinder puzzle, the Last Conductor, the Flea
   Games at Fleatopia's festival, the Snail Shamans who take the Old Hearts), and Mooshka's Spool
   Fragment, given at the caravan's Blasted Steps camp, the Last Judge's arena (gen-collectibles
   PIECE_FIX), not at Fleatopia where js/how.js has him stand. */
const HAND_PIECE = {
  tamedGiantFlea: 'Arborium_08', CaravanLechReturnedToCaravan: 'Greymoor_24', MetTroupeHunterWild: 'Bellway_Aqueduct',
  MetCaravanTroupeLeaderJudge: 'Coral_Judge_Arena',
  HasMelodyArchitect: 'Cog_09', HasMelodyConductor: 'Hang_12', 'Flea Games': 'Aqueduct_05_festival',
};
const EVERBLOOM = 'Tut_04';
// Bosses whose Journal entry is another's (the Raging Conchfly is the Great Conchfly fought alone),
// and the fights that aren't in their entry's first room: the first Moss Mother in Tut_03 (its
// Battle Scene; Tut_02 holds the Act 3 one, in the lower Moss Grotto), the Moss Mothers' pair in
// Weavenest Atla (where the Weavelight lies), Lace's second fight atop the Cradle's tower, the
// Savage Beastfly of the wish in the Far Fields (its boss scene's room). Then the bosses whose entry
// is in several rooms, none with more of it than the rest (the generator stops on a new one): the
// first fight of each (Lace's in the Deep Docks, the Beastfly's in its chapel, the Skull Tyrant's in
// the Marrow); Moorwing's at Bellhart's east entrance (greymoor_08_boss, Garmond and Zaza's help in
// it; greymoor_05_boss is the Act 2 rematch by the Bellway, its wiki page); the Second Sentinel's
// arena in the High Halls (Hang_17b, where the Reserve Bind it gives lies: Hang_07 and the Choral
// Chambers are where it wanders); the Bell Eater, called to any Bellway in Act 3, at Bellhart's,
// under which the Bell Beast gives the Beastling Call once it's beaten.
const BOSS_ROOM = { 'raging-conchfly': 'Coral_27', 'moss-mother-ruined-chapel': 'Tut_03', 'lace-the-cradle': 'Song_Tower_01', 'moss-mother-weavenest-atla': 'Weave_03',
  'moss-mother-act-3-moss-grotto': 'Tut_02', 'savage-beastfly-far-fields': 'Bone_East_08',
  lace: 'Bone_East_12', 'savage-beastfly-chapel-of-the-beast': 'Ant_19', 'skull-tyrant': 'Bone_15', moorwing: 'greymoor_08_boss',
  'second-sentinel': 'Hang_17b', 'bell-eater': 'Belltown_basement' };
/* The fights the completionist folds into its boss's entry (its check is the first fight's), each
   with what the save keeps once it's won, read in the scene that fights it (11-Oct-2026): the
   flag Song_Tower_01's boss scene tests, Weave_03's Boss Scene bool, the flag the Far Fields
   Beastfly's death sets. The Act 3 Moss Mother (Tut_02's "Mossbone Mother Ambient") keeps nothing
   of her own: no PersistentBoolItem (never in any of the 77 files of the author's saves, though
   Tut_02 was entered in 73), and no scene names defeatedMossEvolver (wokeMossEvolver is set when
   she wakes). Her death counts for the Journal's Mossbone Mother (EnemyDeathEffects), whose
   other fights are the Ruined Chapel's one and Weavenest Atla's two (killsRequired 3): she's
   beaten once its kills pass theirs (design/03-redesign.md, step 6, the save checks, 6 A). Then
   the first Act it can be fought in, from its wiki page: Lace atop the Cradle closes Act 2, the
   pair in Weavenest Atla guards the Weavelight (Act 1), the Far Fields Beastfly is its Act 2 wish's
   (the completionist's tasks.ts). */
const BOSS_MORE = [
  ['lace-the-cradle', ['flag', 'defeatedLaceTower'], 2],
  ['moss-mother-weavenest-atla', ['bool', 'Weave_03', 'Boss Scene'], 1],
  ['moss-mother-act-3-moss-grotto', ['any', ['all', ['not', ['bool', 'Weave_03', 'Boss Scene']], ['kills', 'Mossbone Mother', 2]],
    ['kills', 'Mossbone Mother', 4]], 3],
  ['savage-beastfly-far-fields', ['flag', 'defeatedBoneFlyerGiantGolemScene'], 2],
];
/* A boss whose Act the completionist has wrong: the Summoned Saviour, Steel Soul's, is Act 3 there,
   but its wish (A Vassal Lost) is taken in Act 2 and the author's Steel Soul game beat it then
   (Restore_Points3/restoreData24: act2Started, not blackThreadWorld; checked 14-Oct-2026). The
   Craggler is Act 2 there, but it waits in the Wormways' lower entrance from the start (wiki
   Wormways: that room, reached from Mosshome with the Swift Step, «and later, by several Cragglites
   in Act 2»; Crawl_04's Roof Crab goes only with roofCrabDefeated, read in the scene on 18-Oct-2026). */
const BOSS_ACT = { 'summoned-saviour': 2, craggler: 1 };
// Relics an NPC hands over: Jubilana's Choral Commandment, Grindle's Psalm Cylinder.
const RELIC_ROOM = { 'Seal Chit City Merchant': 'song_enclave', 'Psalm Cylinder Grindle': 'coral_42',
  // In several rooms (the generator stops on a new one): the Hero's Memento where Lost Garmond drops
  // it, his Blasted Steps arena; the Guardian's Memento from Seth at Fleatopia's festival (beating his
  // scores), not from Mooshka at the caravan.
  'Memento Garmond': 'coral_33', 'Memento Seth': 'aqueduct_05_festival' };
// The Bellhome, where its furnishings go (Pavo's house in Bellhart).
const BELLHOME = 'Belltown_Room_Spare';

(async () => {
const N = await names();
const placed = [], unplaced = [];
const chosen = (scene, from, what) => {
  if (!from.includes(scene)) fail(`${what}: ${scene} isn't among the game's scenes for it (${from.join(', ') || 'none'}): HAND needs reading again`);
  if (!onMap(scene)) fail(`${what}: ${scene} isn't on the map`);
  return scene;
};

/* ── People and vendors ── */
const VENDORS = {};
for (const [v, scenes] of Object.entries(SH.VENDORS)) VENDORS[v] = scenes.filter(onMap);
const PEOPLE = {};
for (const [id, obj] of Object.entries(PEOPLE_OBJ)) {
  const at = [...new Set((P.npcs[obj] || []).map(([s]) => s))].filter(onMap);
  if (!at.length) fail(`nobody named ${obj} (${id}) on the map: PEOPLE_OBJ needs reading again`);
  PEOPLE[id] = at[0];
}
for (const [id, scene] of Object.entries(PEOPLE_ROOM)) PEOPLE[id] = onMap(scene) ? scene : fail(`${scene} (${id}) isn't on the map`);
const personScene = (npc) => PEOPLE[npc] || (VENDORS[npc] && npc !== 'shakra' ? VENDORS[npc][0] : null);

/* ── The bosses ── */
// A name's first foe (js/enemies.js lists a boss's first fight before its others): the fight the
// completionist's entry checks (Moss Mother's Ruined Chapel, Lace's Deep Docks).
const foeBy = new Map();
for (const f of E.FOES) if (!foeBy.has(norm(f.name.en))) foeBy.set(norm(f.name.en), f.id);
const bookBy = new Map(J.BOOK.map((e) => [e.id, e]));
const bookN = new Map(J.BOOK.map((e) => [e.n, e]));
const foeOf = new Map(E.FOES.map((f) => [f.id, f]));
// A foe's Journal entry (a later fight's is its first's).
const bookOf = (foe) => bookBy.get(foe) || bookBy.get(foe.replace(/-(the-cradle|far-fields|chapel-of-the-beast|weavenest-atla|coral-tower)$/, ''))
  || (foeOf.has(foe) && bookN.get(foeOf.get(foe).hj)) || null;
const arena = (foe) => {
  const e = bookOf(foe);
  const rooms = ((e && SS.journalRooms[e.key]) || []).filter(([s]) => onMap(s));
  if (BOSS_ROOM[foe]) {
    // A room by hand has to be one where the game has its entry (or something naming its record).
    const room = (s) => (R.roomOf(s) || {}).scene;
    const has = [...rooms.map(([s]) => s), ...((e && P.records[e.key]) || []).map(([s]) => s)].map(room);
    if (!has.includes(room(BOSS_ROOM[foe]))) fail(`${foe}: BOSS_ROOM's ${BOSS_ROOM[foe]} isn't among the rooms of its Journal entry: read it again`);
    return BOSS_ROOM[foe];
  }
  // Several rooms with as much of the entry as the first: which is the fight is a choice (BOSS_ROOM).
  if (rooms.length > 1 && rooms[1][1] === rooms[0][1]) fail(`${foe} is in ${rooms.map(([s]) => s).join(', ')} alike: choose its arena in BOSS_ROOM`);
  return rooms.length ? rooms[0][0] : null;
};
const BOSSES = [];
for (const it of C.load('bosses.ts')) {
  const foe = BOSS_ALIAS[norm(it.name)] || foeBy.get(norm(it.name)) || fail(`no foe named ${it.name}`);
  const scene = arena(foe);
  if (!scene) { unplaced.push('boss ' + foe); continue; }
  if (BOSS_ACT[foe] && BOSS_ACT[foe] === it.whichAct) fail(`BOSS_ACT: the completionist gives ${foe} Act ${it.whichAct} already: the fix goes`);
  BOSSES.push([foe, scene, C.check(it.parsingInfo, fail), BOSS_ACT[foe] || it.whichAct || fail(`${it.name} has no Act`)]);
}
for (const [foe, check, act] of BOSS_MORE) {
  if (!foeOf.has(foe) || BOSSES.some((b) => b[0] === foe)) fail(`BOSS_MORE: ${foe} isn't a foe of its own`);
  if (!onMap(arena(foe))) fail(`BOSS_MORE: ${foe}'s arena isn't on the map`);
  BOSSES.push([foe, arena(foe), check, act]);
}

/* ── The 100%: each thing's room, by its ways ── */
const quests = Q.FROM;
const wishScene = (quest) => { const f = quests[quest]; return f ? (f.board && onMap(f.board) ? f.board : (f.npc || []).find(onMap)) || null : null; };
// The way each thing's room came from (key → a js/how.js way), for its point in the room (WHO below).
const WAY_OF = {};
function byWays(ways, found, key) {
  for (const w of ways || []) {
    let s = null;
    if (w.kind === 'found' || w.kind === 'craft') s = found();
    else if (w.kind === 'shop') s = w.vendor === 'shakra' ? 'Belltown' : personScene(w.vendor);   // Shakra: where she rests
    else if (w.kind === 'wish') s = found() || wishScene(w.quest);   // a reward lying in the world, where it lies (the Reserve Bind, in the Second Sentinel's arena)
    else if (w.kind === 'boss') s = found() || arena(w.foe);   // what the boss opens the way to, where it lies (Conchcutter, past the Raging Conchfly)
    else if (['npc', 'challenge', 'fleas'].includes(w.kind)) s = personScene(w.npc);
    if (s && onMap(s)) { if (key) WAY_OF[key] = w; return s; }
  }
  return null;
}
const AT = { pieces: {}, tools: {}, crests: {}, skills: {}, arts: {} };
const put = (cat, id, scene, what) => { if (scene) { AT[cat][id] = scene; placed.push(what); } else unplaced.push(what); };
/* What Act 3 moves (Albert's, 18-Oct-2026): a piece or another collectible whose own object lies
   in another room once Act 3 begins, under that room's «Black Thread World», while the first one
   goes with its own room's «Normal World» or with what the save says. ALSO too (below): that room,
   the save check that says the game has it there now or had it there, and { kind: 'moved', act: 3, foe | wish }
   for its card (js/app-map.js: why it moved); its first room and point go by its own check. Read in
   the game's scenes (patch 1.0.30000), with the wiki (Mossberry, Memory Locket) and a sweep of every
   pickup pickups.json lists, by the world its scene puts it in (only these two move; the Cradle
   Map's machine and its Act 3 pickup are two extras already, Bone_18's locket is in both worlds):
   - Mossberry no. 3 (bonetownAspidBerryCollected): the Aknid that carries it, «Aspid Collector (3)»
     under Bonetown's Normal World, is in Bone_01b's Black Thread World in Act 3, with the same
     DeactivateIfPlayerdataTrue and its Mossberry Pickup's «PD Bool» the same flag. No bool says
     which room it was had in: had, it stays in Bonetown.
   - The Memory Locket of «Volatile Flintbeetles» (tools/completionist.js PIECE_FIX): Bone_10's own,
     there while the quest isn't done; its bool says it was had there.
   Each stops the run if its thing, its pickup there or the room's Act 3 side is gone (a patch). */
const MOVED = [
  { list: 'extra', kind: 'mossberry', own: ['flag', 'bonetownAspidBerryCollected'], item: 'Mossberry', scene: 'Bone_01b',
    there: ['all', ['flag', 'blackThreadWorld'], ['not', ['flag', 'bonetownAspidBerryCollected']]], more: { foe: 'NAME_ASPID_COLLECTOR' } },
  { list: 'piece', kind: 'memory-locket', own: ['quest', 'Rock Rollers'], item: 'Crest Socket Unlocker', scene: 'Bone_10',
    bool: 'Collectable Item Pickup Locket', more: { wish: 'Rock Rollers' } },
];
// Whether a check is that one, or takes it among others (['any', …]).
const takes = (c, own) => JSON.stringify(c) === JSON.stringify(own) || (c[0] === 'any' && c.slice(1).some((x) => JSON.stringify(x) === JSON.stringify(own)));
const movedOwn = (list, x) => (MOVED.find((m) => m.list === list && m.kind === x[0] && takes(x[2], m.own)) || {}).own;
// Pieces: the room the check names first (what lies there), then the ways.
const OLD_HEARTS = { CollectedHeartFlower: 'Flower Heart', CollectedHeartCoral: 'Coral Heart', CollectedHeartHunter: 'Hunter Heart',
  CollectedHeartClover: 'Clover Heart', HasMelodyLibrarian: 'Librarian Melody Cylinder' };
CO.PIECES.forEach((p, i) => {
  const own = R.sceneOf(movedOwn('piece', p) || p[2]);
  // A piece sold with no counter of its own (js/shop.js SHOP gives it), from the vendor of the
  // earliest Act; one a wish gives (REWARDS), where the wish is taken.
  const seller = SH.SHOP.filter((x) => x.piece === i).sort((a, b) => (a.act || 0) - (b.act || 0)).find((x) => onMap(personScene(x.vendor)));
  const wish = Object.entries(SH.REWARDS).filter(([, r]) => [].concat(r).some((x) => x.piece === i)).map(([q]) => q).find((q) => onMap(wishScene(q)));
  const sold = seller && personScene(seller.vendor), reward = wish && wishScene(wish);
  const s = onMap(own) ? own
    : HAND_PIECE[p[2][1]] ? HAND_PIECE[p[2][1]]
      : OLD_HEARTS[p[2][1]] ? lying(OLD_HEARTS[p[2][1]])[0] || null
        : byWays(H.HOW.pieces[i], () => null, 'piece:' + i) || sold || reward || null;
  if (s && !WAY_OF['piece:' + i] && s === sold) WAY_OF['piece:' + i] = { kind: 'shop', vendor: seller.vendor };
  else if (s && !WAY_OF['piece:' + i] && s === reward) WAY_OF['piece:' + i] = { kind: 'wish', quest: wish };
  put('pieces', i, s, `piece ${i} ${p[0]} ${JSON.stringify(p[2])}`);
});
for (const ids of CO.COUNTED) {
  const id = ids[0], hand = HAND.tools[id];
  const s = hand ? chosen(hand[1], given(hand[0]), 'tool ' + id)
    : byWays(H.HOW.tools[id], () => ids.flatMap((x) => CO.TOOLS[x]).map((n) => lying(n)[0]).find(Boolean) || null, 'tools:' + id);
  put('tools', id, s, 'tool ' + id);
}
/* The six Tools outside the 100% (js/collectibles.js TOOLS, none a COUNTED group's first: four
   Tools' upgrades, and two a wish lends and takes back): where each lies, else by hand. */
const FIRST_TOOL = new Set(CO.COUNTED.map((ids) => ids[0]));
const OTHER_TOOLS = Object.keys(CO.TOOLS).filter((id) => !FIRST_TOOL.has(id));
if (OTHER_TOOLS.length !== 6) fail(`${OTHER_TOOLS.length} Tools outside the 100%, not 6: js/collectibles.js TOOLS or COUNTED changed`);
// The Moss Druid trades Druid's Eyes for Mossberries; Zylotol lends the Needle Phial at either of
// his wishes (hollowknight.wiki, Needle Phial), so it's where those are taken.
const OTHER_HAND = { 'druids-eyes': ['Mosscreep Tool 2', 'mosstown_02c'] };
const OTHER_WISH = { 'needle-phial': 'Extractor Blue' };
for (const id of OTHER_TOOLS) {
  const hand = OTHER_HAND[id];
  const s = hand ? chosen(hand[1], given(hand[0]), 'tool ' + id)
    : OTHER_WISH[id] ? wishScene(OTHER_WISH[id]) : CO.TOOLS[id].map((n) => lying(n)[0]).find(Boolean) || null;
  if (OTHER_WISH[id]) WAY_OF['tools:' + id] = { kind: 'wish', quest: OTHER_WISH[id] };
  put('tools', id, s, 'tool ' + id);
}
/* A Tool sold that lies in another room once its seller is gone (its ways a shop and 'found', the
   pickup in a room other than the vendor's): ALSO, that room and the save check that says the
   game has it there, its 'found' way's when (tools/gen-how.js WHEN, read in the game's scenes:
   the Curveclaw in Ant_21 once the Mottled Skarr is dead, the Weighted Belt by Mort's corpse).
   One with no when stops the run: its scene is read again. */
const ALSO = {};
{
  const room = (s) => (R.roomOf(s) || {}).scene;
  for (const ids of CO.COUNTED) {
    const id = ids[0], ways = H.HOW.tools[id] || [], scene = AT.tools[id];
    if (!ways.some((w) => w.kind === 'shop') || !ways.some((w) => w.kind === 'found')) continue;
    const apart = [...new Set(CO.TOOLS[id].flatMap(lying))].filter((s) => room(s) !== room(scene));
    if (!apart.length) continue;
    if (apart.length > 1) fail(`tools ${id} lies in ${apart.join(', ')} apart from its seller: choose one`);
    const when = ways.find((w) => w.kind === 'found').when;
    ALSO['tools:' + id] = [apart[0], when || fail(`tools ${id} lies in ${apart[0]} once its seller is gone: read its scene for the check that says so (tools/gen-how.js WHEN)`)];
  }
  /* A thing a vendor sells only in Act 3 (js/shop.js act 3), had elsewhere before: ALSO too, that
     vendor's room, the check blackThreadWorld (the save's Act 3) and the way, { kind: 'shop',
     vendor, price, act: 3, from }, from who had it before. Grindle's, in the Blasted Steps: Pebb's
     Mask Shard, Craftmetal and Magnetite Brooch, Mort's Memory Locket and Tool Pouch, Lumble's
     Magnetite Dice (his Simple Key has no mark: the sold keys have none). Read in the game's scenes
     (18-Oct-2026): Bonetown's Bonechurch_Shop (Pebb), Bone_East_10_Room's Pilgrims Rest Shop (Mort)
     and Coral_33's Dice Game (Lumble, his corpse too) are under each room's «Normal World», which
     its «Black Thread States» (TestGameObjectActivator blackThreadWorld) switches off: in Act 3
     only Grindle has them. One whose earlier source isn't among those stops the run: its scene is
     read again (GONE_ACT3). */
  const GONE_ACT3 = new Set(['pebb', 'mort', 'lumble']);
  for (const x of SH.SHOP) {
    if (x.act !== 3 || !(x.tool || x.piece != null)) continue;
    const key = x.tool ? 'tools:' + x.tool : 'piece:' + x.piece, scene = x.tool ? AT.tools[x.tool] : AT.pieces[x.piece];
    const there = VENDORS[x.vendor] && VENDORS[x.vendor][0];
    if (!scene || !there || room(scene) === room(there)) continue;
    const w = WAY_OF[key] || {}, from = w.vendor || w.npc;
    if (!GONE_ACT3.has(from)) fail(`${key}: ${x.vendor} sells it in Act 3, and ${from || 'nothing'} had it in ${scene} before: is that one gone in Act 3? (GONE_ACT3)`);
    if (ALSO[key]) fail(`${key} has two other rooms (${ALSO[key][0]}, ${there}): ALSO holds one`);
    ALSO[key] = [there, ['flag', 'blackThreadWorld'], { kind: 'shop', vendor: x.vendor, price: x.price, act: 3, from }];
  }
}
// The key of a thing's mark in its other room (ALSO): '<key>:found', or '<key>:<vendor>' for a shop's.
const alsoKey = (key, also) => key + ':' + (also[2] && also[2].kind === 'shop' ? also[2].vendor : 'found');
for (const cat of ['crests', 'skills', 'arts']) {
  for (const id of Object.keys(CO.WHERE[cat])) {
    const hand = HAND[cat][id];
    const from = hand ? (cat === 'arts' ? (P.fields[hand[0]] || []).map(([s]) => s) : given(hand[0])) : [];
    const s = hand ? chosen(hand[1], from, cat + ' ' + id) : byWays(H.HOW[cat][id], () => null, cat + ':' + id);
    put(cat, id, s, cat + ' ' + id);
  }
}
// The abilities outside the 100% (js/data.js ARTS the completionist doesn't list), by hand, with
// their Act (AT.act: js/collectibles.js WHERE has none for them).
AT.act = {};
for (const a of D.ARTS) {
  if (CO.WHERE.arts[a.id]) continue;
  const hand = HAND.arts[a.id] || fail(`ability ${a.id} outside the 100% has no room in HAND.arts`);
  put('arts', a.id, chosen(hand[1], (P.fields[hand[0]] || []).map(([sc]) => sc), 'arts ' + a.id), 'arts ' + a.id);
  AT.act['arts:' + a.id] = hand[2];
}
AT.everbloom = byWays(H.HOW.everbloom, () => null, 'everbloom') || EVERBLOOM;
(AT.everbloom ? placed : unplaced).push('everbloom');

/* ── What doesn't count: the completionist's extras ── */
const RELIC_KIND = { 'Bone Scrolls': 'bone-scroll', 'Weaver Effigies': 'weaver-effigy', 'Choral Commandments': 'choral-commandment',
  'Rune Harps': 'rune-harp', 'Psalm Cylinders': 'psalm-cylinder', 'Arcane Egg': 'arcane-egg' };
const CACHE_KIND = { 'Rosary Caches': 'rosary-cache', 'Shell Shard Caches': 'shard-cache', 'Breakable Walls': 'wall' };
const SPAWN_KIND = { Rhinogrunds: 'NAME_RHINO', 'Covetous Pilgrims': 'NAME_ROSARY_PILGRIM', Shardillards: 'NAME_SHELL_FOSSIL_MIMIC',
  'Void Masses': 'NAME_BLACK_THREAD_CORE' };
const EXTRAS = [];
const roomOfCheck = (c) => {
  const s = R.sceneOf(c);
  if (onMap(s)) return s;
  if (c[0] === 'flag' && HAND_EXTRA[c[1]]) return HAND_EXTRA[c[1]];
  if (c[0] === 'relic' || c[0] === 'memento') {
    const hand = RELIC_ROOM[c[1]], all = given(c[1]);
    if (hand && all.length && !all.includes(hand.toLowerCase())) fail(`${c[1]}: RELIC_ROOM's ${hand} isn't among the game's scenes for it (${all.join(', ')})`);
    if (hand) return hand;
    const where = lying(c[1]).length ? lying(c[1]) : given(c[1]).filter(onMap);
    if (where.length > 1) fail(`${c[1]} is in ${where.join(', ')}: choose its room in RELIC_ROOM`);
    return where[0] || null;
  }
  if (c[0] === 'any') for (const x of c.slice(1)) { const r = roomOfCheck(x); if (r) return r; }
  return null;
};
/* A cache's int as the game keeps it (pickups.json caches, from its scenes): a shell shard cache's
   or an ant rosary string's hits left (BreakableHolder: 0 once broken), a rosary cache's state
   (-1 untouched, a step up each hit; emptied from its emptied step to its last). The completionist,
   whose caches are still a work in progress, gives every one -1: an untouched rosary cache, and
   a value a BreakableHolder never holds. Done is any of its emptied values. */
const CACHE = new Map((P.caches || []).map(([s, id, comp, from, to]) => [s + '\u0000' + id, { comp, from, to }]));
/* The completionist's rosary caches whose int isn't a cache's (read in the game's scenes,
   12-Oct-2026): the Covetous Pilgrims' (Rosary Pilgrim, an enemy whose int is the rosaries it
   carries, the same once it's beaten) are left out, as the same list has each by the bool its
   defeat sets. The Underworks' Hero Treadmill (Under_03d) isn't a cache but a wheel that pays as
   Hornet runs it: its int is the needle's FSM's Value, one up each time the needle tops out and
   spits; while Value is at most Max Payout (50) a spit pays (always the visit's first, then five
   in six), past it it fails (unless it's the visit's first). So it's spent at 50: the completionist's
   -1 is a value it never holds (0 on every save). */
const NOT_CACHE = { 'Rosary Pilgrim': 'out', 'Hero Treadmill Rosaries Paid': ['int', 'Under_03d', 'Hero Treadmill Rosaries Paid', 50, 'min'] };
const cacheCheck = (c) => {
  const x = CACHE.get(c[1] + '\u0000' + c[2]);
  if (!x) return NOT_CACHE[c[2]] ? (NOT_CACHE[c[2]] === 'out' ? null : NOT_CACHE[c[2]]) : fail(`${c[1]} ${c[2]}: no cache of that name in pickups.json`);
  const at = [];
  for (let v = x.from; v <= x.to; v++) at.push(['int', c[1], c[2], v]);
  return at.length === 1 ? at[0] : ['any', ...at];
};
/* A thing whose completionist check stops holding once it's had (placed where that check says):
   Bone_East_17b's breakable wall is gone once the Savage Beastfly wish is taken: a
   TestGameObjectActivator on it turns it off while Beastfly Hunt IsAccepted (Assembly-CSharp
   1.0.30000; IsAccepted stays true once it's done), and its bool, broken or not, no longer says
   (false in 40 of the author's saves past the wish). */
const CHECK_OF = {
  'Breakable Wall (Bone_East_17b)': ['any', ['bool', 'Bone_East_17b', 'Breakable Wall'], ['accepted', 'Beastfly Hunt']],
};
/* The completionist lists some things twice: twelve breakable walls (one of them three times) by the
   same bool in the same scene, one wall at one point. Each goes in once (design/03-redesign.md,
   step 6, the switches' contents, 8 A). */
const EXTRA_SEEN = new Set();
/* An extra whose Act the completionist has wrong (the Map's Acts, checked one by one on
   18-Oct-2026), by its name there: the first Act it can be had in. The Slab's Weaver Effigy lies
   below the First Sinner's cell, behind the door the Key of Apostate opens (wiki Weaver Effigy), and
   that key is the Putrified Ducts' (wiki Slab Keys; every one of the author's saves that entered
   Slab_12 holds HasSlabKeyC): Act 2, not 1. Whiteward's second Choral Commandment takes the Silk Soar
   or a precise jump with the Faydown Cloak (wiki Choral Commandment), Act 2's: not Act 3 only. The
   run stops on one the completionist already agrees with, or no longer names. */
const EXTRA_ACT = { 'Weaver Effigy · The Slab': 2, 'Choral Commandment · Whiteward (#2)': 2 };
const EXTRA_ACT_USED = new Set();
const extra = (kind, it, name) => {
  let c = C.check(it.parsingInfo, fail);
  if ((kind === 'rosary-cache' || kind === 'shard-cache') && c[0] === 'int' && !(c = cacheCheck(c))) return;
  const s = kind === 'bellhome' ? BELLHOME : roomOfCheck(c);
  if (!s || !onMap(s)) { unplaced.push(`${kind} ${it.name}`); return; }
  if (CHECK_OF[it.name]) c = CHECK_OF[it.name];
  if (neverHad(c)) { leftOut.push(`${kind} ${s} ${it.name}`); return; }
  const seen = JSON.stringify([kind, c, s.toLowerCase()]);
  if (EXTRA_SEEN.has(seen)) return;
  EXTRA_SEEN.add(seen);
  /* A "cache" that is an item lying in its room (Coral_36's Beast Shard: a CollectableItemPickup,
     pickups.json lying) goes in the rosaries' or shards' layer, by its own bool, in its place in
     the list (js/map-fixes.js keys by it). */
  const purse = /-cache$/.test(kind) && c[0] === 'bool' && lyingPurse(c);
  if (purse) { EXTRAS.push([purse[2] === 'rosaries' ? 'rosaries' : 'shards', null, c, s, purse[3].name, { item: purse[0] }]); return; }
  const held = /-cache$/.test(kind) && heldItem(c);
  if (held) { HELD.push([held, s, it.name]); return; }
  if (EXTRA_ACT[it.name] !== undefined) {
    if (EXTRA_ACT[it.name] === it.whichAct) fail(`EXTRA_ACT: the completionist gives ${it.name} Act ${it.whichAct} already: the fix goes`);
    EXTRA_ACT_USED.add(it.name);
  }
  EXTRAS.push([kind, EXTRA_ACT[it.name] || it.whichAct || 0, c, s, name]);
};
/* A "cache" that only holds an item isn't one: the four ant_item_strings the completionist files
   among the rosary caches (Ant_04_left, Ant_21, Bone_East_18b, Bone_East_24) pay nothing (read in
   the game's scenes, 18-Oct-2026: a BreakableHolder with no holdingGameObjects, where the ant_rosary
   _strings beside them hold rosaries), nor does Dock_03's City Shard Chest among the shell shard
   caches (its Chest Control's Shards and Geo counts are 0, where Bone_19's Bone Chest has 8 and
   20); each only lets fall the item it keeps, which lies on its own point (pickups.json objects and
   lying). That item has its own mark where it lies (a Rosary Necklace among the rosaries, the Ant
   Trapper's item among the wishes', the Craftmetal among the 100%'s, the Curveclaw among the
   Tools: ALSO, below), so the holder is left out, not drawn twice on two layers.
   The item on a cache's point → its save name, else null. */
const HELD = [];
function heldItem(c) {
  if (!['bool', 'int'].includes(c[0])) return null;
  const o = (P.objects[c[1].toLowerCase()] || {})[c[2]];
  if (!o) return null;
  for (const [save, at] of Object.entries(P.lying || {})) {
    if (at.some(([sc, , x, y]) => sc.toLowerCase() === c[1].toLowerCase() && Math.abs(x - o[0]) < 0.1 && Math.abs(y - o[1]) < 0.1)) return save;
  }
  return null;
}
// A sceneData bool → [item id, save name, 'rosaries' or 'shards', the item] if it's a PURSE pickup lying there.
function lyingPurse(c) {
  for (const [id, save, cur] of CO.PURSE) {
    if (((P.lying || {})[save] || []).some(([sc, bid]) => sc.toLowerCase() === c[1].toLowerCase() && bid === c[2])) {
      return [id, save, cur, D.ITEMS.find((x) => x.id === id) || fail(`no item ${id}`)];
    }
  }
  return null;
}
for (const sec of C.sections('relics.ts')) for (const it of sec.items) extra(RELIC_KIND[sec.name] || fail(`relic kind ${sec.name}`), it);
for (const it of C.load('mossberries.ts')) extra('mossberry', it);
for (const it of C.load('silkeaters.ts')) extra('silkeater', it);
/* The Heart Memento isn't found anywhere: it's whichever of the four Old Hearts The Old Hearts
   doesn't take, so it has no room and no mark of its own (the Old Hearts' marks are where they lie;
   design/03-redesign.md, step 6, the switches' contents, 11 A). */
for (const it of C.load('mementos.ts')) if (it.name !== 'Heart Memento') extra('memento', it, N.gameName(it.name) || undefined);
for (const it of C.load('bellhome.ts')) extra('bellhome', it, N.gameName(it.name) || { es: it.name, en: it.name, key: undefined });
for (const sec of C.sections('uniqueSpawns.ts')) for (const it of sec.items) extra('spawn', it, N.text(SPAWN_KIND[sec.name] || fail(`spawn kind ${sec.name}`)));
for (const sec of C.sections('cachesAndSecrets.ts')) for (const it of sec.items) extra(CACHE_KIND[sec.name] || fail(`cache kind ${sec.name}`), it);
for (const n of Object.keys(EXTRA_ACT)) if (!EXTRA_ACT_USED.has(n)) fail(`EXTRA_ACT: the completionist has no ${n} any more`);

/* What opens a way and stays open (pickups.json doors, from the game's scenes): levers and
   pressure plates, gates, doors a key opens, shortcuts and silk walls, each by the bool the save
   keeps once it's opened, after the completionist's (whose order js/map-fixes.js keys by). One
   already there under the same check (a one-way wall among the breakable walls) isn't twice. One
   whose bool the game never sets goes by its playerData flag instead (PD_WAYS, below): Song_27's
   lever (unset in all 44 of the author's saves that keep it, read on 12-Oct-2026; song_27_opened
   in 25). Left out (kb/data/game/gating.json): what the game never switches on (neverHad:
   Clover_04b's two gates, worked by a pressure plate nothing switches on), and a gate a battle
   shuts and opens again (a BattleScene's gates, a "BG Control" FSM's), which isn't a way that
   stays open. Bone_12's two cell doors, struck open with no key (pickups.json doors breakable), go
   among the breakable walls ('wall'). */
const DOOR_KINDS = ['lever', 'plate', 'gate', 'lock', 'shortcut', 'silkwall', 'breakable'];
const MARK_KIND = { breakable: 'wall' };
/* Three doors filed as doors a key opens until 16-Oct-2026 (design/03-redesign.md, step 6, the
   leftovers, 1 A and 3 A): Slab_16's jail gate (a Gate struck open from above) and Bone_12's two cell
   doors. A slot kept before has them under that kind (more.wasKind, js/savefile.js). */
const KIND_WAS = new Set(['slab_16|jail gate door - persistent', 'bone_12|jail_door (1)', 'bone_12|jail_door (2)']);
// What opens a way: the doors and the breakable walls (the save checks' rules, below, are for these).
const WAY_KINDS = new Set([...DOOR_KINDS, 'wall']);
const DOOR_BY_FLAG = new Set(['song_27/song_lever_side']);
const SCENE_AT = new Map();
{
  const doors = P.doors || fail('pickups.json has no doors: run tools/extract-pickups.py again');
  const had = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
  for (const kind of DOOR_KINDS) {
    for (const [scene, id, x, y] of doors[kind] || fail(`pickups.json has no ${kind}`)) {
      const c = ['bool', scene, id], k = JSON.stringify(c).toLowerCase();
      if (had.has(k) || DOOR_BY_FLAG.has(`${scene}/${id}`.toLowerCase())) continue;
      if (!onMap(scene)) { unplaced.push(`${kind} ${scene} ${id}`); continue; }
      if (neverHad(c) || gateOf(scene, id).battle) { leftOut.push(`${kind} ${scene} ${id}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      EXTRAS.push([MARK_KIND[kind] || kind, 0, c, scene, ...(KIND_WAS.has(`${scene}|${id}`.toLowerCase()) ? [null, { wasKind: 'lock' }] : [])]);
    }
  }
  const kept = EXTRAS.filter((x) => x[5] && x[5].wasKind).length;
  if (kept !== KIND_WAS.size) fail(`KIND_WAS names ${KIND_WAS.size} doors, ${kept} are marks: it needs reading again`);
}

/* The area maps, after the doors: each of the 28 Has<Area>Map flags (MAPS) where it's had. Shakra
   sells 14 (js/shop.js SHOP: its price, the game's name for it), each marked at her spot in that
   map's area whose scripts set a SeenMapper<Area> flag (her stock opens with them; Shellwood_01's
   and Greymoor_08's set none); the Mosslands have no spot of hers, and their map is sold from the
   start: where she's first met, in the Marrow (MAP_SHAKRA). The other 14 are had in a room
   (pickups.json maps: a fake collectable that sets the flag, its words the name the game shows on
   getting it), marked where the game gives it: a map lying there or on a sign
   (CollectableItemPickup: found), or a Citadel map machine (its FSM), which sells it (js/shop.js
   MACHINES: its price; read on 18-Oct-2026). The Choral Chambers' are two machines, a mark each.
   A map the game lays in a room only in Act 3 (its pickup under the room's Black Thread World,
   gating.json world 'act3') is that spot's Act, 3, and its other spots are the ones before it,
   gone once Act 3 begins (MAP_BEFORE_ACT3: their Act). The Cradle's: its machine in Cradle_02,
   sold in Act 2 (the wiki's Map and Quill: «Obtained from a map machine in Act 2»), then found
   free in Tube_Hub, by the broken machine (map_and_junk) of its Act 3 collapse (read on
   18-Oct-2026): Act 3 swaps Cradle_01 and Cradle_03, Cradle_02's only ways in, for their
   _Destroyed scenes, which have no door to it, and roofs Tube_Hub's way up to them over. Each
   ['map', act, ['flag', Has<Area>Map], scene, name, { shop: 'shakra', price } or { machine: true,
   price } or { found: true }, and { gone: 'act3' } for one before an Act 3 spot]; act null but
   for those. */
const MAP_SHAKRA = { MossGrotto: 'bone_04' };
const MAP_BEFORE_ACT3 = { HasCradleMap: 2 };
const LATE_XY = new Map();   // an extra's index → its point on the map, worked out with the rest (XY below)
{
  const lower = (x) => String(x).toLowerCase();
  const seen = new Set(Object.entries(P.fields).filter(([f]) => f.startsWith('SeenMapper')).flatMap(([, at]) => at.map(([sc]) => lower(sc))));
  const found = new Map(Object.entries(P.maps || fail('pickups.json has no maps: run tools/extract-pickups.py again')).map(([item, [flag, key]]) => [flag, { item, key }]));
  const shakraAt = (scene) => entryAt([...(P.npcs['Mapper NPC'] || []), ...(P.npcs['Mapper Sit NPC'] || [])], scene);
  for (const [area, region] of Object.entries(MAPS)) {
    const flag = 'Has' + area + 'Map', sold = SH.SHOP.find((x) => x.vendor === 'shakra' && x.flag === flag), f = found.get(flag);
    if (!!sold === !!f) fail(`${flag} is ${sold ? 'both sold and found' : 'neither sold by Shakra nor found'}: MAPS needs reading again`);
    if (sold) {
      const spots = VENDORS.shakra.filter((sc) => R.areaOf(sc) === region && seen.has(lower(sc)));
      const scene = spots[0] || (MAP_SHAKRA[area] && VENDORS.shakra.includes(MAP_SHAKRA[area]) ? MAP_SHAKRA[area] : fail(`no spot of Shakra's sells ${flag}`));
      LATE_XY.set(EXTRAS.length, () => shakraAt(scene));
      EXTRAS.push(['map', null, ['flag', flag], scene, N.text(sold.name), { shop: 'shakra', price: sold.price }]);
    } else {
      const scenes = given(f.item).filter(onMap);
      if (!scenes.length) fail(`${f.item} (${flag}) is had in no room on the map`);
      const at = (scene) => P.items[f.item].at.filter(([sc]) => sc === scene);
      // Only in Act 3: every pickup of it in that room under its Black Thread World.
      const act3 = new Set(scenes.filter((sc) => at(sc).every(([, comp, obj]) => comp === 'CollectableItemPickup' && gateOf(sc, obj).world === 'act3')));
      if (act3.size && !MAP_BEFORE_ACT3[flag]) fail(`${f.item} lies in ${[...act3].join(', ')} only in Act 3: MAP_BEFORE_ACT3 needs its other spots' Act`);
      if (!act3.size && MAP_BEFORE_ACT3[flag]) fail(`${f.item} has no Act 3 spot any more: MAP_BEFORE_ACT3 needs reading again`);
      for (const scene of scenes) {
        const how = at(scene).some(([, comp]) => comp === 'PlayMakerFSM')
          ? { machine: true, price: (SH.MACHINES.find((m) => m.item === f.item && m.scene === scene) || fail(`${f.item} is given by an FSM in ${scene} that is no map machine of js/shop.js`)).price }
          : { found: true };
        const act = act3.size ? (act3.has(scene) ? 3 : MAP_BEFORE_ACT3[flag]) : null;
        if (act3.size && !act3.has(scene)) how.gone = 'act3';
        LATE_XY.set(EXTRAS.length, () => entryAt((P.items[f.item] || {}).at, scene));
        EXTRAS.push(['map', act, ['flag', flag], scene, N.text(f.key || fail(`${f.item} has no words`)), how]);
      }
    }
  }
}
/* The rosaries and shell shards lying in a room (js/collectibles.js PURSE: strings, necklaces, Shard
   Bundles, Great Shards, Pristine Cores), after the maps: each pickup that keeps a bool of its own
   (pickups.json lying), by it. Each ['rosaries' or 'shards', null, ['bool', Scene, id], scene, the
   item's name, { item: its id }]. The Flea Games' prizes (Aqueduct_05_festival's "… Reward <n>")
   are a prize, not a thing lying, and the save keeps them under Aqueduct_05 (the author's): left out. */
const PRIZE = / Reward \d+$/;
/* The gauntlet whose arena drops a pickup (gating.json inside: the pickup sits in the arena's object,
   which switches it on once won; the arena by pickups.json battles, as its mark is placed below):
   Library_02's Heavy Rosary Necklace is the Acolytes' arena's, Cog_07's Pristine Core the Cogwork
   Core's third (design/03-redesign.md, step 6, the leftovers, 2 A). Its card says so. */
function arenaDropping(scene, id) {
  const inside = gateOf(scene, id).inside;
  if (!inside) return null;
  const flat = (c) => (c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(flat) : [c]);
  const all = P.battles[scene.toLowerCase()] || [];
  const arena = all.find((b) => b[0] === inside);
  if (!arena) return null;
  const g = SS.gauntlets.GAUNTLETS.filter((x) => x.scene.toLowerCase() === scene.toLowerCase()
    && flat(x.done).some((c) => (c[0] === 'bool' && c[2] === arena[0]) || (c[0] === 'flag' && c[1] === arena[3])));
  if (g.length > 1) fail(`${scene} ${id}: ${g.length} gauntlets drop it`);
  return g.length ? g[0].id : null;
}
{
  const had = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
  for (const [id, save, cur] of CO.PURSE) {
    const item = D.ITEMS.find((x) => x.id === id) || fail(`no item ${id}`);
    for (const [scene, bid, x, y] of (P.lying || fail('pickups.json has no lying: run tools/extract-pickups.py again'))[save] || []) {
      const c = ['bool', scene, bid], k = JSON.stringify(c).toLowerCase();
      if (had.has(k) || PRIZE.test(bid)) continue;
      if (!onMap(scene)) { unplaced.push(`${id} ${scene} ${bid}`); continue; }
      if (neverHad(c)) { leftOut.push(`${id} ${scene} ${bid}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      const fight = arenaDropping(scene, bid);
      EXTRAS.push([cur === 'rosaries' ? 'rosaries' : 'shards', null, c, scene, item.name, fight ? { item: id, fight } : { item: id }]);
    }
  }
}

/* What opens a way that the save keeps in playerData rather than in sceneData (pickups.json pd,
   tools/extract-pickups.py PD_WAYS; read against all of the author's saves, 11-Oct-2026), after the
   rosaries and shards, in the Passages layers: each flag by hand → [kind, scene, the object that
   carries it there], the lever (Lever_tk2d, Lever, the Cogwork Core's cog_lever), the pressure
   plate, the gate, the Bellhome's door (the lock its key opens: its old mark goes), the wall or
   one-way way. Each [kind, null, ['flag', field], scene]; one whose object also keeps a bool of its
   own is among the doors or breakable walls already, by it, and isn't twice. Left out: slab_05_gateOpen and
   slab_17_openedGateLeft, the Slab's locks the doors already have by their bools. */
const PD_WAYS = {
  openedCitadelSpaLeft: ['lever', 'song_10', 'Song_lever_side'], openedCitadelSpaRight: ['lever', 'song_10', 'Pipe_Cog_Lever'],
  greatBoneGateOpened: ['lever', 'bone_01', 'Bone Lever'], bone01shortcutPlat: ['lever', 'bone_04', 'Song_lever_side'],
  mosstown01_shortcut: ['lever', 'mosstown_01', 'Bone Lever'], bone03_openedTrapdoor: ['lever', 'bone_03', 'Song_lever_side'],
  openedGeyserShaft: ['lever', 'bone_east_11', 'Song_lever_side'], docks_02_shortcut_right: ['lever', 'dock_02b', 'Song_lever_side'],
  rhinoChurchUnlocked: ['lever', 'bone_east_10_church', 'Song_lever_side'], droppedFloorBreakerPlat: ['lever', 'under_02', 'Song_lever_side (3)'],
  libraryRoofShortcut: ['lever', 'library_09', 'Song_lever_side'], song_27_opened: ['lever', 'song_27', 'Song_lever_side'],
  bankOpened: ['lever', 'hang_06_bank', 'Song_lever_side'], openedDust05Gate: ['lever', 'dust_05', 'greymoor_lever_simple'],
  opened_cog_06_door: ['lever', 'cog_06', 'cog_lever'], cog7_gateOpened: ['lever', 'cog_07', 'cog_lever'],
  BonePlazaOpened: ['plate', 'bone_11b', 'Plate'],
  openedTallGeyser: ['gate', 'bone_east_07', 'Song Trapdoor'], bonegraveOpen: ['gate', 'bonegrave', 'bone_gate_02004'],
  laceTowerDoorOpened: ['gate', 'song_tower_01', 'song_tower_right_gate'], wardBossHatchOpened: ['gate', 'ward_02', 'Pipe_Vent_Hatch'],
  BelltownHouseUnlocked: ['lock', 'belltown', 'Door Lock'],
  boneEast07_openedMidRoof: ['shortcut', 'bone_east_07', 'explode_wall (7) - boneEast07_openedMidRoof'],
  openedDocksBackEntrance: ['shortcut', 'dock_03b', 'Breakable Wall'], explodeWallMosstown3: ['shortcut', 'mosstown_03', 'explode_wall'],
  Bone_East_04b_ExplodeWall: ['shortcut', 'bone_east_04b', 'explode_wall'], explodeWallBoneEast18c: ['shortcut', 'bone_east_18c', 'explode_wall'],
  crawl03_oneWayWall: ['shortcut', 'crawl_03', 'Breakable Wall (1)'], shellwoodTwigShortcut: ['shortcut', 'shellwood_15', 'Shellwood Twig Wall (1)'],
  shellwood13_BellWall: ['shortcut', 'shellwood_13', 'Bell Wall Tall'], shellwoodBellshrineTwigWall: ['shortcut', 'shellwood_04b', 'Shellwood Twig Wall (1)'],
  sethShortcut: ['shortcut', 'under_27', 'Shellwood Twig Wall (1)'], antMerchantShortcut: ['shortcut', 'bone_east_16', 'Breakable Wall'],
  openedCauldronShortcut: ['shortcut', 'bone_east_09b', 'explode_wall'], song_11_oneway: ['shortcut', 'song_11', 'Plug_Gate'],
  arborium_09_oneWay: ['shortcut', 'arborium_09', 'Moss Vine Cluster'], arborium_08_oneWay: ['shortcut', 'arborium_08', 'One Way Wall'],
};
{
const hadBool = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
let same = 0;
for (const [field, [kind, scene, obj]] of Object.entries(PD_WAYS)) {
  // The same object may keep a bool of its own too, and be among the doors or the breakable walls
  // already: then it's there, by that bool.
  if (hadBool.has(JSON.stringify(['bool', scene, obj]).toLowerCase())) { same++; continue; }
  const e = ((P.pd || fail('pickups.json has no pd: run tools/extract-pickups.py again'))[field] || []).find((x) => x[0] === scene && x[2] === obj)
    || fail(`${field}: no ${obj} in ${scene} names it (pickups.json pd): PD_WAYS needs reading again`);
  if (!onMap(scene)) fail(`${field}: ${scene} isn't on the map`);
  if (typeof e[3] === 'number') SCENE_AT.set(EXTRAS.length, [e[3], e[4]]);
  EXTRAS.push([kind, null, ['flag', field], scene]);
}
console.log(`playerData ways: ${Object.keys(PD_WAYS).length - same} new, ${same} already marked by their object's own bool`);
}

/* The keys and the key items lying in a room (pickups.json lying and items): each item where its
   pickup is, a mark per room, checked by its pickup's bool (two in a room: either), or for the
   Slab's three keys (fake collectables) by their HasSlabKey flag. Its name and icon the item's own
   (the inventory's: tools/extract-map-icons.py). Three pickups' bools no save of the author's ever
   sets, though every later game holds the key: those are checked by the flag the game sets when the
   key is picked up (KEY_FLAG: the Sinner's Road cage's Simple Key, and the Whiteward's two, whose
   uniqueCollectBool is that flag). The Cogheart Pieces' music boxes (their rooms'
   "Music Box Sequence" ints) are the puzzle that drops each: the piece's own bool says it's had.
   Each ['key' or 'keyitem', null, check, scene, name, { icon }]. */
const KEY_ITEMS = [
  ['key', 'Simple Key', 'INV_NAME_TOKEN_FAITH', 'i_token_of_faith'], ['key', 'Slab Key A', null, 'i_slab_key'],
  ['key', 'Slab Key B', null, 'i_slab_key_gold'], ['key', 'Slab Key C', null, 'i_slab_key_brass'],
  ['key', 'Ward Key', 'INV_NAME_WARD_KEY', 'i_key_whiteward'], ['key', 'Ward Boss Key', 'INV_NAME_WARD_BOSS_KEY', 'i_chute_key_whiteward'],
  ['keyitem', 'Cog Heart Pieces', 'INV_NAME_COG_HEART_PIECE', 'cog_heart_pieces'], ['keyitem', 'Broken SilkShot', 'INV_NAME_BROKEN_SILKSHOT', '_0000_t_web_shot_broken'],
  ['keyitem', 'Farsight', 'INV_NAME_FARSIGHT', 'farsight'], ['keyitem', 'Materium', 'INV_NAME_MATERIUM', 'materium'],
];
const KEY_FLAG = { 'Simple Key dust_06': 'CollectedDustCageKey', 'Ward Key song_enclave': 'collectedWardKey', 'Ward Boss Key ward_07': 'collectedWardBossKey' };
for (const [kind, item, text, icon] of KEY_ITEMS) {
  const fake = (P.maps || {})[item];
  const name = N.text(fake ? fake[1] : text);
  if (!fs.existsSync(path.join(__dirname, '..', 'assets', 'map', 'icons', icon + '.webp'))) fail(`assets/map/icons/${icon}.webp is missing`);
  const rooms = new Map();
  const bools = fake ? [] : (P.lying[item] || []);
  const scenes = fake ? (P.items[item] || { at: [] }).at.filter(([, comp]) => comp === 'CollectableItemPickup').map(([sc, , , x, y]) => [sc, null, x, y]) : bools;
  for (const [scene, bid, x, y] of scenes) {
    const k = scene.toLowerCase();
    if (!rooms.has(k)) rooms.set(k, { scene, ids: [], at: typeof x === 'number' ? [x, y] : null });
    if (bid) rooms.get(k).ids.push(bid);
  }
  if (!rooms.size) fail(`${item} lies in no room`);
  for (const { scene, ids, at } of rooms.values()) {
    if (!onMap(scene)) { unplaced.push(`${kind} ${item} ${scene}`); continue; }
    const flag = KEY_FLAG[item + ' ' + scene.toLowerCase()];
    const check = fake ? ['flag', fake[0]] : flag ? ['flag', flag] : ids.length > 1 ? ['any', ...ids.map((id) => ['bool', scene, id])] : ['bool', scene, ids[0]];
    if (at) SCENE_AT.set(EXTRAS.length, at);
    EXTRAS.push([kind, null, check, scene, name, { icon }]);
  }
}

/* The rest the save keeps per room (pickups.json kept), each by its own bool:
   (the kinds as the Map calls them: silk-cocoon, masked)
     bead     the loose rosaries ("Geo Small/Med Persistent", a GeoControl that stays picked up)
     cocoon   the small silk cocoons beside the Silkeaters' large ones (the large are the Silkeaters)
     lift     the lifts and the Bone Carriage, by the bool their lift keeps once it's been called
              (the int beside it is where it stands; the Whispering Vaults' lift keeps only that int,
              and Organ_01's bool is set in none of the author's saves, 100% ones included: both
              left out, LIFT_OUT)
     hidden   what hides part of a room until Hornet walks in (Remasker, and the Unmasker of the
              "Secret Mask" rooms), one mark per room, had once all of them are uncovered: a room
              has from one to ten, so one each would bury the map. The inverse ones (they cover
              again as she leaves), the glow rims and the sound regions aren't a hidden place, and
              neither is a name two objects of the room share: the save keeps one bool for them,
              whichever wrote last (Aqueduct_04's two Remasker New Sharp Ultra: true, then false
              again, in the author's saves; 14-Oct-2026).
   Each [kind, null, ['bool', Scene, id] (hidden: all of the room's), scene]. */
const NOT_HIDDEN = /Inverse|Inverted|glow|Glow|Sound Region|vent_mask/;
const LIFT_OUT = new Set(['Organ_01 Hornet_cage_rect_lift_organ (1)']);
{
  const had = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
  const kept = P.kept || fail('pickups.json has no kept: run tools/extract-pickups.py again');
  for (const kind of ['bead', 'cocoon', 'lift']) {
    const as = kind === 'cocoon' ? 'silk-cocoon' : kind;
    for (const [scene, id, type, x, y] of kept[kind] || fail(`pickups.json has no ${kind}`)) {
      if (type !== 'bool' || (kind === 'cocoon' && !/Small Cocoon/.test(id)) || (kind === 'lift' && LIFT_OUT.has(scene + ' ' + id))) continue;
      const c = ['bool', scene, id], k = JSON.stringify(c).toLowerCase();
      if (had.has(k) || DOOR_BY_FLAG.has(`${scene}/${id}`.toLowerCase())) continue;
      if (!onMap(scene)) { unplaced.push(`${kind} ${scene} ${id}`); continue; }
      if (neverHad(c)) { leftOut.push(`${as} ${scene} ${id}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      EXTRAS.push([as, null, c, scene]);
    }
  }
  const rooms = new Map(), twice = new Map();
  for (const [scene, id] of kept.hidden || fail('pickups.json has no hidden')) twice.set(scene + '\u0000' + id, (twice.get(scene + '\u0000' + id) || 0) + 1);
  for (const [scene, id, type, x, y] of kept.hidden) {
    if (type !== 'bool' || NOT_HIDDEN.test(id) || !onMap(scene) || twice.get(scene + '\u0000' + id) > 1) continue;
    if (!rooms.has(scene)) rooms.set(scene, []);
    rooms.get(scene).push([id, x, y]);
  }
  /* Each mask as the save can say it's uncovered (design/03-redesign.md, step 6, the save checks,
     5 A; kb/data/game/gating.json): by its own bool, or the bool of the way it sits inside (a mask
     in a one-way wall's Solid, a crust wall's collider: broken from outside, the wall takes the mask
     with it and the mask never saves; 16 of those 30 were ever set in the author's saves), or a flag
     that takes it away (Bone_01's Secret Mask goes once its gate is opened). A mask the game never
     switches on, the demo's, or one only one mode has (Coral_37's Steel Soul mask) isn't asked for:
     the room is uncovered once the rest are. */
  const ways = new Set(EXTRAS.filter((x) => WAY_KINDS.has(x[0])).flatMap((x) => boolsOf(x[2])).map((c) => (c[1] + '|' + c[2]).toLowerCase()));
  for (const [scene, list] of rooms) {
    const leaves = [];
    for (const [id] of list) {
      const g = gateOf(scene, id);
      if (g.never || g.demo || g.mode) { leftOut.push(`mask ${scene} ${id}`); continue; }
      const also = [...(g.inside && ways.has((scene + '|' + g.inside).toLowerCase()) ? [['bool', scene, g.inside]] : []), ...(g.removedBy || []).map((f) => ['flag', f])];
      leaves.push(also.length ? ['any', ['bool', scene, id], ...also] : ['bool', scene, id]);
    }
    if (!leaves.length) continue;
    const pts = list.filter((r) => typeof r[1] === 'number');
    if (pts.length) SCENE_AT.set(EXTRAS.length, [pts.reduce((a, r) => a + r[1], 0) / pts.length, pts.reduce((a, r) => a + r[2], 0) / pts.length]);
    const check = leaves.length > 1 ? ['all', ...leaves] : leaves[0];
    // The room's check before the save checks (every mask by its own bool), for slots kept before (WAS).
    const bools = list.map(([id]) => ['bool', scene, id]), was = bools.length > 1 ? ['all', ...bools] : bools[0];
    EXTRAS.push(JSON.stringify(was) === JSON.stringify(check) ? ['masked', null, check, scene] : ['masked', null, check, scene, null, { was }]);
  }
}

/* Eva's rewards besides Sylphsong (a piece of the 100%), in her room, last: the Hunter Crest's two
   evolutions (the save's Crest list: Hunter_v2, Hunter_v3) and the Vesticrest's yellow and blue
   slots (UnlockedExtraYellowSlot, UnlockedExtraBlueSlot), each with the slots it needs, in the
   wiki's order (kb/data/raw/Eva.wiki: "Unlock <n> slots"; the first evolution on meeting her, 0).
   Each ['eva', null, check, scene, null, { reward, slots }], on her point (the map spreads them). */
{
  const wiki = fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'raw', 'Eva.wiki'), 'utf8');
  const needs = [...wiki.matchAll(/^! Unlock (\d+) slots/gm)].map((m) => Number(m[1]));
  const at = D.VESTICREST.at;
  if (JSON.stringify(needs) !== JSON.stringify([at.yellow, at.blue, at.hunter3, at.sylphsong])) fail(`Eva.wiki gives ${needs.join(', ')} slots, js/data.js VESTICREST another: EVA needs reading again`);
  const EVA = [['hunter-2', ['crest', 'Hunter_v2'], 0], ['vest-yellow', ['flag', 'UnlockedExtraYellowSlot'], needs[0]],
    ['vest-blue', ['flag', 'UnlockedExtraBlueSlot'], needs[1]], ['hunter-3', ['crest', 'Hunter_v3'], needs[2]]];
  const scene = PEOPLE.eva;
  for (const [reward, check, slots] of EVA) {
    LATE_XY.set(EXTRAS.length, () => entryAt(P.npcs[PEOPLE_OBJ.eva], scene));
    EXTRAS.push(['eva', null, check, scene, null, { reward, slots }]);
  }
}

/* The keys an NPC gives and the Crawbell, last (the Map's fixes, js/map-fixes.js, name an extra by
   its index: these go after every other, so nothing before them moves). All are pushed as the keys
   above are, ['key' or 'keyitem', null, check, scene, name, { icon }]; the name and icon the item's.
     Keys an NPC gives (no pickup lies for them): each at the NPC's own spot, as the game's scenes
       have it (pickups.json items: the PlayMakerFSM that hands it over, in the room whose lock it
       opens). Had once the save says it was given, or the key is held: Ballow's BallowGivenKey (set
       with his Diving Bell Key, in 29 of the author's saves), Pavo's BelltownGreeterHouseFullDlg (the
       dialogue that gives the Bellhome Key, which js/savefile.js bellhomeKey reads), the door it
       unlocked (BelltownHouseUnlocked) or the key held. Left out: the Architect's Key and the
       Simple Keys (sold: the shop cards cover them), and the Dock Demo Key (cut content).
     The Crawbell, lying in Room_CrowCourt_02 after the Court of Craws: its pickup's bool is set in
       none of the author's saves (the four that reached the room are one game, patched: it wasn't
       picked up), so it's also had once held, or installed in the Bellhome (CrawbellInstalled). */
{
  const iconOk = (icon) => fs.existsSync(path.join(__dirname, '..', 'assets', 'map', 'icons', icon + '.webp')) || fail(`assets/map/icons/${icon}.webp is missing`);
  const NPC_KEYS = [
    ['Dock Key', 'INV_NAME_DOCK_KEY', 'dock_key', 'Ballow Diving Bell NPC', ['any', ['flag', 'BallowGivenKey'], ['held', 'Dock Key']]],
    ['Belltown House Key', 'INV_NAME_BELL_HOUSE_KEY', 'belltown_house_key', 'Belltown Greeter NPC',
      ['any', ['flag', 'BelltownGreeterHouseFullDlg'], ['flag', 'BelltownHouseUnlocked'], ['held', 'Belltown House Key']]],
  ];
  for (const [item, text, icon, npc, check] of NPC_KEYS) {
    iconOk(icon);
    const e = ((P.items[item] || {}).at || []).find(([, comp, obj]) => comp === 'PlayMakerFSM' && obj === npc)
      || fail(`${item}: no ${npc} gives it in pickups.json items: NPC_KEYS needs reading again`);
    if (!onMap(e[0])) fail(`${item}: ${e[0]} isn't on the map`);
    if (typeof e[3] === 'number') SCENE_AT.set(EXTRAS.length, [e[3], e[4]]);
    EXTRAS.push(['key', null, check, e[0], N.text(text), { icon }]);
  }
  iconOk('crawbell');
  const [scene, id, x, y] = (P.lying.Crawbell || fail('the Crawbell lies in no room: pickups.json lying')).find(([sc]) => onMap(sc)) || fail('the Crawbell\'s room isn\'t on the map');
  if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
  EXTRAS.push(['keyitem', null, ['any', ['bool', scene, id], ['held', 'Crawbell'], ['flag', 'CrawbellInstalled']], scene, N.text('INV_NAME_CRAWBELL'), { icon: 'crawbell' }]);
}
/* The rosaries and shards given rather than lying, after the keys an NPC gives (so no index
   js/map-fixes.js keys moves), in the rosaries' and shards' layers, each by what the save keeps
   once it's given (read in the game's scenes and Assembly-CSharp, 12-Oct-2026, against all of the author's saves):
   the Fixer's Hornet Statuette for the statue built (his FSM's "Statue Reward" sets
   fixerStatueConvo as it hands it over: set in exactly the saves that hold the idol), and the
   Sprintmaster's prizes, a race's SprintRaceController reward: his FSM's "Give Reward" stores the
   next track's index in SprintMasterCurrentRace, its Tracks being Track 1, 2 and 3 (Track 1's
   prize a Rosary Necklace, Track 2's a Beast Shard; Track 3 gives none, the extra race the
   Memento). Each [the item's id, its save name, the scene, the component that gives it, the
   check]; the Statuette on the Fixer, the prizes in the room (their controllers have no point). */
const GIVEN_PURSE = [
  ['hornet-statuette', 'Fixer Idol', 'bonetown', 'PlayMakerFSM', ['flag', 'fixerStatueConvo']],
  ['rosary-necklace', 'Rosary_Set_Medium', 'sprintmaster_cave', 'SprintRaceController', ['min', 'SprintMasterCurrentRace', 1]],
  ['beast-shard', 'Great Shard', 'sprintmaster_cave', 'SprintRaceController', ['min', 'SprintMasterCurrentRace', 2]],
];
for (const [id, save, scene, comp, check] of GIVEN_PURSE) {
  const [, , cur] = CO.PURSE.find((p) => p[0] === id && p[1] === save) || fail(`${id} (${save}) isn't in js/collectibles.js PURSE`);
  const item = D.ITEMS.find((x) => x.id === id) || fail(`no item ${id}`);
  const from = (P.items[save] || { at: [] }).at.filter((e) => e[1] === comp);
  chosen(scene, from.map(([s]) => s), `${id} given`);
  if (comp !== 'SprintRaceController') LATE_XY.set(EXTRAS.length, () => entryAt(from, scene));
  EXTRAS.push([cur === 'rosaries' ? 'rosaries' : 'shards', null, check, R.roomOf(scene).scene, item.name, { item: id }]);
}

/* The doors a key opens that no mark has yet (kb/data/game/gating.json receptacles), last of the
   extras: by the bool the key's ItemReceptacle writes (its `persistent`) or the flag it sets.
   Ward_01's White Key machine writes the lift's own bool (under_lift_large): the door and the lift
   are had together. A demo's receptacle (Bone_East_12's, the Dock Demo Key's) isn't a door of the
   game (design/03-redesign.md, step 6, the save checks, 9 A). Each ['lock', null, check, scene]. */
{
  const hasLock = new Set(EXTRAS.filter((x) => x[0] === 'lock').map((x) => x[3].toLowerCase()));
  for (const [scene, obj, target, flag, demo] of GATING.receptacles || fail('gating.json has no receptacles: run tools/extract-gating.py again')) {
    if (demo || hasLock.has(scene.toLowerCase())) continue;
    const parts = [...(target ? [['bool', scene, target]] : []), ...(flag ? [['flag', flag]] : [])];
    if (!parts.length) fail(`${scene} ${obj}: a key's door that keeps nothing`);
    if (!onMap(scene)) { unplaced.push(`lock ${scene} ${obj}`); continue; }
    const at = ((P.locks || {})[scene.toLowerCase()] || []).find((e) => e[0] === obj);
    if (at && typeof at[1] === 'number') SCENE_AT.set(EXTRAS.length, [at[1], at[2]]);
    hasLock.add(scene.toLowerCase());
    EXTRAS.push(['lock', null, parts.length > 1 ? ['any', ...parts] : parts[0], scene]);
  }
  const demoOnly = new Set((GATING.receptacles || []).filter((r) => r[4]).map((r) => r[0].toLowerCase()));
  for (const [k, scenes] of Object.entries(Q.LOCKS)) for (const sc of scenes) {
    if (!hasLock.has(sc.toLowerCase()) && !demoOnly.has(sc.toLowerCase())) fail(`${k}'s door in ${sc} has no mark: gating.json receptacles need reading again`);
  }
}

/* ── What the save really keeps for each way, and what the game takes away (design/03-redesign.md,
   step 6, the save checks), over every extra, after they're all in (their indices don't move):
     2 A  a way (DOOR_KINDS and the breakable walls) is open by its own bool or by what the save
          keeps instead (kb/data/game/gating.json): the flags its own components set (a Lever's
          playerDataBool, which never writes the lever's bool: Ant_17, Dust_05, Room_CrowCourt), the
          other lock of its door (the Slab's cells: only the side used saves), a flag that takes it
          away (Mosshome's silk vines go with defeatedBellBeast, so a game cuts one, the other or
          neither, and both are open after the beast), and the playerData flags its scripts set
          (pickups.json pd: the Docks' back entrance seen from three rooms, the ant merchant's and
          the Shellwood Bellshrine's walls, two each where a game breaks one). A door a key opens
          isn't opened by a flag that only takes it away (Bone_12's second cell door goes with
          IsPinGallerySetup: left for a later look).
     3 A  a thing the game swaps out when Act 3 begins (every bool of its check under the room's
          «Normal World», or a DeactivateIfPlayerdataTrue blackThreadWorld): { gone: 'act3' }, and
          js/app-map.js draws it as taken away in an Act 3 game that doesn't have it.
     4 A  a thing only one mode has (a TestGameObjectActivator on permadeathMode): { mode: 'steel'
          or 'normal' }, and js/app-map.js leaves it out of the other mode's games. */
{
  const NOT_OPENING = new Set(['DeactivateIfPlayerdataFalse', 'ActivateIfPlayerdataTrue', 'ActivateIfPlayerdataFalse', 'DeactivatePlayerDataTest', 'TestGameObjectActivator']);
  const PD_OF = new Map();
  for (const [flag, hits] of Object.entries(P.pd || {})) {
    for (const [scene, comp, obj] of hits) {
      if (!obj || NOT_OPENING.has(comp)) continue;
      const k = (scene + '|' + obj).toLowerCase();
      PD_OF.set(k, [...(PD_OF.get(k) || []), flag]);
    }
  }
  /* What opens a way that no component of its own says, from its room's FSM (read on 16-Oct-2026):
     Slab_16's jail gate is its Event Control's «Battle Completed» state's, shown from the
     Cloakless fight won until the Broodmother's hunt is taken; then the room keeps the Broodmother's
     state for good, no gate at all, the way open (design/03-redesign.md, step 6, the leftovers, 1 A). */
  const OPEN_WITH = { 'slab_16|jail gate door - persistent': [['accepted', 'Broodmother Hunt']] };
  for (const cs of Object.values(OPEN_WITH)) for (const c of cs) if (c[0] === 'accepted' && !Q.CHAIN[c[1]]) fail(`OPEN_WITH: no wish ${c[1]} in js/quests.js`);
  /* Who a way's removedBy takes with it (gating.json withPerson): then it's gone, not opened, and
     its card says why (js/app-map.js, by the person). Bone_12's second cell door goes with Grindle's
     cell, Grindle getting out by himself (design/03-redesign.md, step 6, the leftovers, 3 A). */
  const PEOPLE_GONE = new Set(['GRINDLE']);
  let opened = 0, gone = 0, mode = 0, lost = 0;
  for (const x of EXTRAS) {
    const bools = boolsOf(x[2]);
    let takenBy = null;
    if (WAY_KINDS.has(x[0]) && bools.length && (x[2][0] === 'bool' || x[2][0] === 'any')) {
      const more = [];
      for (const [, s, id] of bools) {
        const g = gateOf(s, id);
        const away = x[0] !== 'lock' && !g.withPerson ? g.removedBy || [] : [];
        for (const f of [...(g.flags || []), ...away, ...(PD_OF.get((s + '|' + id).toLowerCase()) || [])]) more.push(['flag', f]);
        if (g.partner) more.push(['bool', s, g.partner]);
        more.push(...(OPEN_WITH[(s + '|' + id).toLowerCase()] || []));
        if (g.withPerson && (g.removedBy || []).length && x[0] !== 'lock') {
          if (!PEOPLE_GONE.has(g.withPerson)) fail(`${s} ${id} goes with ${g.withPerson}: its card needs words (js/app-map.js, PEOPLE_GONE)`);
          takenBy = { lost: g.removedBy.length > 1 ? ['any', ...g.removedBy.map((f) => ['flag', f])] : ['flag', g.removedBy[0]], person: g.withPerson };
        }
      }
      const had = new Set((x[2][0] === 'any' ? x[2].slice(1) : [x[2]]).map((c) => JSON.stringify(c)));
      const add = more.filter((c) => { const k = JSON.stringify(c); if (had.has(k)) return false; had.add(k); return true; });
      if (add.length) {
        const was = x[2];
        x[2] = ['any', ...(x[2][0] === 'any' ? x[2].slice(1) : [x[2]]), ...add];
        while (x.length < 5) x.push(null);
        x[5] = { ...(x[5] || {}), was };
        opened++;
      }
    }
    const saved = [...new Map(savedOf(x[2]).map((c) => [(c[1] + '|' + c[2]).toLowerCase(), c])).values()];
    if (!saved.length || x[0] === 'masked') continue;
    const gs = saved.map(([, s, id]) => gateOf(s, id));
    const extraMore = {};
    if (gs.every((g) => g.world === 'normal')) { extraMore.gone = 'act3'; gone++; }
    if (gs.every((g) => g.mode) && new Set(gs.map((g) => g.mode)).size === 1) { extraMore.mode = gs[0].mode; mode++; }
    if (takenBy) { Object.assign(extraMore, takenBy); lost++; }
    if (Object.keys(extraMore).length) {
      while (x.length < 5) x.push(null);
      x[5] = { ...(x[5] || {}), ...extraMore };
    }
  }
  console.log(`save checks: ${opened} ways also open by what the save keeps instead, ${gone} things taken away in Act 3, ${lost} with someone who leaves, ${mode} of one mode only, ${leftOut.length} left out (never had): ${leftOut.join('; ')}`);
}

/* ── What only Act 3 has: its Act (the Map's Acts, checked one by one on 18-Oct-2026) ──
   An extra with no Act of its own (null, or the completionist's 0) says Act 3 when it can only be
   had then: every saved item of its check is under its room's «Black Thread World» (gating.json
   world 'act3': the beads in Mort's room once he's gone, Bellway_01's wall, Cog_07's Pristine
   Core…), or its room is one only Act 3 has. Those rooms: the map's Act 3 pieces (js/map.js
   PIECES act3: the Cradle, Cogwork Core and Ventrica hub destroyed), the rooms the game's doors
   reach only through them (js/graph.js from Tut_01, the game's first room: the Border Caves and the
   Nameless Town above), and the areas the game opens only in Act 3 (ACT3_AREAS). A mark with an
   Act below 3 in such a place stops the run: its Act needs reading. */
const ACT3_AREAS = {
  ABYSS: 'wiki The Abyss: the diving bell takes the Diving Bell Key, Ballow\'s during «The Dark Below», in Act 3',
  GROVE: 'wiki Verdania: its entrance in Craw Lake opens upon reaching Act 3',
};
const ACT3_ROOMS = (() => {
  const low = (s) => String(s).toLowerCase();
  const G = SS.graph, M = SS.map;
  const late = new Set(M.PIECES.filter((e) => e.act3).map((e) => low(e.s)));
  const isLate = (s) => late.has(low((R.roomOf(s) || {}).scene || s)) || /_destroyed/.test(low(s));
  const adj = new Map();
  const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
  for (const [a, bs] of Object.entries(G)) for (const b of bs) { link(low(a), low(b)); link(low(b), low(a)); }
  if (!adj.has('tut_01')) fail('Tut_01 has no doors in js/graph.js: ACT3_ROOMS needs reading again');
  const reached = new Set(['tut_01']), todo = ['tut_01'];
  while (todo.length) for (const n of adj.get(todo.pop()) || []) if (!reached.has(n) && !isLate(n)) { reached.add(n); todo.push(n); }
  const out = new Set([...adj.keys()].filter((s) => !reached.has(s)));
  for (const s of late) out.add(s);
  return out;
})();
const act3Only = (scene) => !!scene && (ACT3_ROOMS.has(String(scene).toLowerCase()) || ACT3_ROOMS.has(String((R.roomOf(scene) || {}).scene).toLowerCase())
  || !!ACT3_AREAS[R.areaOf(scene)]);
{
  let late = 0;
  /* A piece of the 100% only Act 3 has: in a room only Act 3 has, or every way of its check under
     Black Thread World (an 'any' only if all its ways are; a quest, a flag or a count could be had
     before). A thing Act 3 moves (MOVED) takes a bool of its Act 3 room under Black Thread World
     (the Memory Locket of «Volatile Flintbeetles», Bone_10's, beside its quest): that room's mark
     says Act 3 (its ALSO way), the thing keeps its own Act, read by its own check. So does the
     Ladybugs' Tool Pouch (Bone_12's Act 3 pickup, or the pin galleries before). */
  const only3By = (c) => (c[0] === 'bool' || c[0] === 'int' || c[0] === 'geo' ? gateOf(c[1], c[2]).world === 'act3'
    : c[0] === 'any' ? c.slice(1).every(only3By) : c[0] === 'all' ? c.slice(1).some(only3By) : false);
  CO.PIECES.forEach((p, i) => {
    if (p[1] !== 3 && (act3Only(AT.pieces[i]) || only3By(movedOwn('piece', p) || p[2]))) fail(`piece ${i} ${p[0]} is Act ${p[1]} where only Act 3 has it: read its Act again`);
  });
  for (const x of EXTRAS) {
    const saved = savedOf(movedOwn('extra', x) || x[2]);
    const only3 = act3Only(x[3]) || (saved.length > 0 && saved.every(([, s, id]) => gateOf(s, id).world === 'act3'));
    if (!only3) continue;
    if (x[1] === 3) continue;
    if (x[1]) fail(`${x[0]} ${x[3]} ${JSON.stringify(x[2])} is Act ${x[1]} where only Act 3 has it: read its Act again`);
    x[1] = 3;
    late++;
  }
  for (const [foe, scene, , act] of BOSSES) if (act < 3 && act3Only(scene)) fail(`boss ${foe} is Act ${act} in ${scene}, where only Act 3 has it`);
  console.log(`Act 3 only: ${late} extras with no Act of their own now say Act 3 (${ACT3_ROOMS.size} rooms only Act 3 has, and ${Object.keys(ACT3_AREAS).join(', ')})`);
}

/* ── The Bellshrines and the keys ── */
/* Each Bellshrine's room: the two whose flag a scene names (Far Fields' in Bellshrine_05, Bellhart's
   in Widow's arena, where its bell is rung), and the other three by their area (js/map.js). */
const BELL_HAND = { bellShrineBoneForest: 'Bellshrine', bellShrineWilds: 'Bellshrine_05', bellShrineGreymoor: 'Bellshrine_02',
  bellShrineBellhart: 'Belltown_Shrine', bellShrineShellwood: 'Bellshrine_03', bellShrineEnclave: 'Bellshrine_Enclave' };
// The Songclave's «First Shrine» is a sixth the Grand Gate doesn't ask for (QU.BELLSHRINES has five):
// it carries its own name (the area's, ENCLAVE) as the third element.
const BELL_EXTRA = [{ field: 'bellShrineEnclave', name: N.text('ENCLAVE') }];
const BELLS = [...Q.BELLSHRINES, ...BELL_EXTRA].map((b) => {
  const s = BELL_HAND[b.field] || fail(`no room for ${b.field}`);
  const named = (P.fields[b.field] || []).map(([x]) => x);
  if (named.length && !named.includes(s.toLowerCase())) fail(`${b.field} is named in ${named.join(', ')}, not ${s}`);
  if (!onMap(s)) fail(`${s} isn't on the map`);
  return b.field === BELL_EXTRA[0].field ? [b.field, s, b.name] : [b.field, s];
});
const KEY_TEXT = { 'Simple Key': 'INV_NAME_TOKEN_FAITH', 'Belltown House Key': 'INV_NAME_BELL_HOUSE_KEY', 'Dock Key': 'INV_NAME_DOCK_KEY',
  'Ward Key': 'INV_NAME_WARD_KEY', 'Ward Boss Key': 'INV_NAME_WARD_BOSS_KEY', 'Dock Demo Key': 'INV_NAME_DOCK_DEMO_KEY',
  'Architect Key': 'INV_NAME_ARCHITECT_KEY' };
const KEYS = {};
for (const k of Object.keys(Q.LOCKS)) KEYS[k] = N.text(KEY_TEXT[k] || fail(`no text for the key ${k}`));

/* ── Where in its room: each thing's point on the map ──
   As the game places a point of a scene on its map (GameMap.GetMapPosition, js/rooms.js mapPoint):
   x / width across its room's box and y / height up it, the scene's size its tk2dTileMap's
   (pickups.json sizes). Checked on the benches: each RestBench, placed so, has to fall by the
   bench pin the map itself draws (js/map.js PINS; the game sets those by hand, a few pixels off). */
const M = SS.map;
// One rule for the generators (tools/map-point.js): a scene loaded over its room has the room's
// coordinates, an interior has no point, one just outside its room is brought in to the edge.
const { hostOf, toMap, ROOM_OF } = require('./map-point.js')(P.sizes);
{
  const errs = [];
  for (const pin of M.PINS) {
    if (pin[0] !== 'bench') continue;
    const b = P.benches[pin[3].toLowerCase()], at = b && toMap(pin[3], b[0], b[1]);
    if (at) errs.push([Math.hypot(at[0] - pin[1], at[1] - pin[2]), pin[3]]);
  }
  errs.sort((a, b) => a[0] - b[0]);
  const med = errs[Math.floor(errs.length / 2)][0];
  if (errs.length < 40 || med > 10) fail(`the benches don't fall by their pins (${errs.length} benches, median ${med.toFixed(1)} px): how a scene's point goes on the map needs reading again`);
  console.log(`benches against their pins: ${errs.length}, median ${med.toFixed(1)} px, worst ${errs.slice(-3).map(([e, s]) => s + ' ' + e.toFixed(0)).join(', ')}`);
}
/* ── Where the game wakes Hornet: SEATS ──
   Each respawn marker of pickups.json (tools/extract-pickups.py respawns: a bench's RestBench, a
   room's Death Respawn Marker), at its x and the ground her feet go on, placed as above. An
   additive scene (the Flea Caravan's) has no tilemap of its own and goes on its host's room, the
   scene without its last part, under its own name and, when no other scene loaded there names a
   marker the same, under the host's too (the save names the scene it's in). A marker in a room the
   map doesn't draw (an interior) has none: js/rooms.js restPoint takes the game's own pin for its
   bench, or the room's middle. The bench pins, which the game sets by hand, have to fall by their
   RestBenches' feet, as the RestBenches by them above. */
const SEATS = {};
{
  const toHost = new Map();   // host scene → marker name → its point (null: more than one scene names it)
  for (const [scene, marks] of Object.entries(P.respawns)) {
    // An interior has a tilemap of its own and isn't moved: only a scene without one takes a host.
    let host = scene;
    if (!P.sizes[scene]) while (host.includes('_') && !(P.sizes[host] && ROOM_OF.get(host))) host = host.slice(0, host.lastIndexOf('_'));
    for (const [name, [x, y, feet]] of Object.entries(marks)) {
      const at = toMap(host, x, feet == null ? y : feet);
      if (!at) continue;
      (SEATS[scene] || (SEATS[scene] = {}))[name] = at;
      if (host === scene) continue;
      if (!toHost.has(host)) toHost.set(host, new Map());
      const m = toHost.get(host);
      m.set(name, m.has(name) ? null : at);
    }
  }
  for (const [host, m] of toHost) for (const [name, at] of m) if (at && !(SEATS[host] || {})[name]) (SEATS[host] || (SEATS[host] = {}))[name] = at;
  for (const k of Object.keys(SEATS).sort()) { const v = SEATS[k]; delete SEATS[k]; SEATS[k] = v; }
  const errs = [];
  for (const pin of M.PINS) {
    // A room with two benches (Slab_16, the Underworks' three) has a pin for each: the nearest.
    const seat = pin[0] === 'bench' && SEATS[R.roomPiece(pin[3]).toLowerCase()];
    const d = Object.entries(seat || {}).filter(([n]) => /^RestBench/.test(n)).map(([, p]) => Math.hypot(p[0] - pin[1], p[1] - pin[2]));
    if (d.length) errs.push([Math.min(...d), pin[3]]);
  }
  errs.sort((a, b) => a[0] - b[0]);
  const med = errs[Math.floor(errs.length / 2)][0];
  if (errs.length < 40 || med > 10) fail(`the benches' feet don't fall by their pins (${errs.length} benches, median ${med.toFixed(1)} px): pickups.json respawns need reading again`);
  console.log(`where Hornet wakes: ${Object.values(SEATS).reduce((n, s) => n + Object.keys(s).length, 0)} markers in ${Object.keys(SEATS).length} rooms; `
    + `the benches' feet against their pins: median ${med.toFixed(1)} px, worst ${errs.slice(-4).map(([e, s]) => s + ' ' + e.toFixed(0)).join(', ')}`);
}
// A thing's point: the first of its entries in pickups.json (…, x, y at the end) in that scene.
const lower = (s) => String(s || '').toLowerCase();
const entryAt = (entries, scene, want = () => true) => {
  for (const e of entries || []) {
    if (lower(e[0]) !== lower(scene) || !want(e)) continue;
    const [x, y] = e.slice(-2);
    const p = typeof x === 'number' ? toMap(scene, x, y) : null;
    if (p) return p;
  }
  return null;
};
const lyingAt = (save, scene) => entryAt((P.items[save] || {}).at, scene, (e) => LYING.test(e[1]));
const itemAt = (save, scene) => lyingAt(save, scene) || entryAt((P.items[save] || {}).at, scene);
const objectAt = (c) => {
  if (!Array.isArray(c)) return null;
  if (c[0] === 'any') { for (const x of c.slice(1)) { const p = objectAt(x); if (p) return p; } return null; }
  if (!['bool', 'int', 'geo'].includes(c[0])) return null;
  const o = (P.objects[lower(c[1])] || {})[c[2]];
  if (o && o.length) return toMap(c[1], o[0], o[1]);
  // A person's own bool (Mooshka's at Fleatopia): the person, in the room or a scene loaded over it.
  const n = (P.npcs[c[2]] || []).find((e) => hostOf(e[0]) === hostOf(c[1]) && typeof e[2] === 'number');
  return n ? toMap(n[0], n[2], n[3]) : null;
};
// What Act 3 moves (MOVED, above): each in ALSO, its key → its own check.
const MOVED_FROM = {};   // a moved thing's key → its own check, the one its first room's point goes by
for (const x of MOVED) {
  const items = x.list === 'piece' ? CO.PIECES : EXTRAS, same = JSON.stringify(x.own);
  const at = items.map((y, i) => (y[0] === x.kind && takes(y[2], x.own) ? i : -1)).filter((i) => i >= 0);
  if (at.length !== 1) fail(`MOVED ${x.kind} ${same}: ${at.length} entries have it`);
  const key = x.list + ':' + at[0], check = items[at[0]][2], first = x.list === 'piece' ? AT.pieces[at[0]] : items[at[0]][3];
  const room = (s) => (R.roomOf(s) || {}).scene;
  if (!room(x.scene) || room(x.scene) === room(first)) fail(`MOVED ${key}: ${x.scene} isn't another room of the map's than ${first}`);
  if (!(P.items[x.item] || {}).at || !P.items[x.item].at.some((e) => lower(e[0]) === lower(x.scene))) fail(`MOVED ${key}: no ${x.item} in ${x.scene} any more`);
  let there = x.there;
  if (x.bool) {
    // Its own bool there: under Black Thread World (gating.json), and in the thing's check, so the mark syncs.
    if (gateOf(x.scene, x.bool).world !== 'act3') fail(`MOVED ${key}: ${x.scene} ${x.bool} isn't Act 3's any more`);
    const b = ['bool', x.scene, x.bool];
    if (!boolsOf(check).some((c) => JSON.stringify(c) === JSON.stringify(b))) fail(`MOVED ${key}: its check doesn't take ${x.scene}'s bool (tools/completionist.js PIECE_FIX)`);
    there = ['any', b, ['all', ['flag', 'blackThreadWorld'], ['not', check]]];
  }
  const more = { kind: 'moved', act: 3 };
  if (x.more.foe) more.foe = N.text(x.more.foe);
  if (x.more.wish) more.wish = Q.CHAIN[x.more.wish] ? x.more.wish : fail(`MOVED ${key}: no wish ${x.more.wish}`);
  if (ALSO[key]) fail(`MOVED ${key} has another room already (${ALSO[key][0]}): ALSO holds one`);
  ALSO[key] = [x.scene, there, more];
  MOVED_FROM[key] = x.own;
}
const XY = {};
const put2 = (key, p) => { if (p) XY[key] = p; };
CO.PIECES.forEach((p, i) => {
  const scene = AT.pieces[i], c = movedOwn('piece', p) || p[2];
  put2('piece:' + i, objectAt(c) || (OLD_HEARTS[c[1]] ? itemAt(OLD_HEARTS[c[1]], scene) : null));
});
/* A Tool lying in its room is where it lies. One a shop sells, lying nowhere there, waits for its
   vendor's point (wayAt, below): what else in the room names it is no place of its own (the
   Snitchflies' FSMs at the Blasted Steps, which stop hiding from whoever wears the Thief's Mark
   Grindle sells there). */
const soldOnly = (id, names, scene) => (WAY_OF['tools:' + id] || {}).kind === 'shop' && !names.some((n) => lyingAt(n, scene));
for (const ids of CO.COUNTED) {
  const id = ids[0], scene = AT.tools[id], hand = HAND.tools[id], names = ids.flatMap((x) => CO.TOOLS[x]);
  if (!hand && soldOnly(id, names, scene)) continue;
  put2('tools:' + id, hand ? entryAt((P.items[hand[0]] || {}).at, scene) : names.map((n) => itemAt(n, scene)).find(Boolean));
}
for (const id of OTHER_TOOLS) {
  const scene = AT.tools[id], hand = OTHER_HAND[id];
  if (!hand && soldOnly(id, CO.TOOLS[id], scene)) continue;
  put2('tools:' + id, hand ? entryAt((P.items[hand[0]] || {}).at, scene) : CO.TOOLS[id].map((n) => itemAt(n, scene)).find(Boolean));
}
// A thing's other room (ALSO): where it lies there (a Tool by its save names, what Act 3 moves by its
// item; a shop's, at its vendor: below).
for (const [key, [scene, , way]] of Object.entries(ALSO)) {
  if (way && way.kind === 'shop') continue;
  const names = key.startsWith('tools:') ? CO.TOOLS[key.slice(6)] : [MOVED.find((x) => MOVED_FROM[key] === x.own).item];
  put2(key + ':found', names.map((n) => itemAt(n, scene)).find(Boolean) || fail(`${key} has no point in ${scene}`));
}
/* Silkshot's three repairs (js/how.js TRAPS, its variants), read in the game's files (18-Oct-2026):
   the Ruined Tool (Broken SilkShot, a keyitem extra, lying in Shadow_Weavehome) is taken by one of
   three, and the Silkshot is that one's: Peak_12's «Webshot Scene» (its «Repair webshot» FSM, a rune
   desk: WEB_SHOT_WORKSHOP_PROMPT «Repair the Ruined Tool?», then WebShot Weaver), and the ShopItems
   «Forge SilkShot» and «Architect SilkShot» (each upgradeFromItem Broken SilkShot, requiredItem one
   Tool Metal; shown once the Forge Daughter or the Twelfth Architect has mentioned it, which they do
   to whoever holds the Ruined Tool: ForgeDaughterMentionedWebShot, ArchitectMentionedWebShot). The
   first repair takes the Ruined Tool (its Amount 0 after), so the other two can't follow; a vendor
   gone (LEFT, below) closes theirs before it.
   VARIANTS  key → { item: the Ruined Tool's EXTRAS index, at: [[variant, save name, scene, act]] }:
   variant the js/data.js attack id, act the first Act it can be done in there; each at the point of what takes the Ruined Tool there
   (pickups.json items: the FSM), XY key in the thing's own AT room, key + ':' + variant in the
   others.
   LEFT  a vendor the game takes away for good → the check that says it has: the Twelfth Architect
   (Under_17's «Architect Scene Control», a PlayerDataTestResponse on ArchitectLeft, switches off
   «Architect Scene», him and his shop, for «Architect Final_Scene»; 21 of the author's saves). His
   shop's pin goes, and his Silkshot. */
const LEFT = { 'twelfth-architect': ['flag', 'ArchitectLeft'] };
for (const v of Object.keys(LEFT)) if (!VENDORS[v]) fail(`LEFT: ${v} is no vendor`);
const VARIANTS = {};
{
  const ID = { 'WebShot Weaver': 'original', 'WebShot Architect': 'architect', 'WebShot Forge': 'forge' };
  const ITEM = 'Broken SilkShot';
  const trap = H.TRAPS.find((x) => x.variants), key = 'tools:' + trap.thing[1];
  const attacks = (D.TOOLS.find((x) => x.id === trap.thing[1]).attacks || []).filter((a) => a.variant).map((a) => a.id);
  const item = EXTRAS.findIndex((x) => x[0] === 'keyitem' && x[4] && x[4].key === 'INV_NAME_BROKEN_SILKSHOT');
  if (item < 0) fail(`the ${ITEM} has no keyitem extra`);
  const room = (s) => (R.roomOf(s) || {}).scene;
  /* Its Act: the earliest of the 100%'s things in that room, else in its area (js/collectibles.js
     WHERE, the Map's Acts): the Forge Daughter's Act 1, the Architect's and Mount Fay's Act 2. */
  const hundred = [...Object.entries(AT.tools).map(([id, sc]) => [sc, (CO.WHERE.tools[id] || [])[0]]),
    ...['crests', 'skills', 'arts'].flatMap((cat) => Object.entries(AT[cat]).map(([id, sc]) => [sc, (CO.WHERE[cat][id] || [])[0]])),
    ...CO.PIECES.map((x, i) => [AT.pieces[i], x[1]])].filter(([sc, a]) => sc && a);
  const actAt = (scene) => {
    for (const same of [(sc) => room(sc) === scene, (sc) => R.areaOf(sc) === R.areaOf(scene)]) {
      const acts = hundred.filter(([sc]) => same(sc)).map(([, a]) => a);
      if (acts.length) return Math.min(...acts);
    }
    return fail(`${scene}: no Act for a repair there`);
  };
  const at = trap.variants.map((v) => {
    const id = ID[v.save] || fail(`${v.save}: no variant id`);
    if (!attacks.includes(id)) fail(`${v.save}: ${id} isn't one of js/data.js ${trap.thing[1]}'s variants`);
    const scenes = v.way.kind === 'shop' ? [personScene(v.way.vendor)] : given(v.save);
    if (scenes.length !== 1 || !onMap(scenes[0])) fail(`${v.save} is repaired in ${scenes.join(', ') || 'no room'}: read its scene again`);
    const scene = room(scenes[0]);
    const p = entryAt((P.items[ITEM] || {}).at, scene) || fail(`nothing takes the ${ITEM} in ${scene}`);
    put2(room(AT.tools[trap.thing[1]]) === scene ? key : key + ':' + id, p);
    return [id, v.save, scene, actAt(scene)];
  });
  if (!at.some(([, , s]) => s === room(AT.tools[trap.thing[1]]))) fail(`${key}'s own room isn't one of its repairs`);
  VARIANTS[key] = { item, at };
}
for (const cat of ['crests', 'skills', 'arts']) {
  for (const [id, hand] of Object.entries(HAND[cat])) {
    const scene = AT[cat][id];
    put2(cat + ':' + id, cat === 'arts' ? entryAt(P.fields[hand[0]], scene) : entryAt((P.items[hand[0]] || {}).at, scene));
  }
}
EXTRAS.forEach((x, i) => {
  const c = x[2];
  if (LATE_XY.has(i)) { put2('extra:' + i, LATE_XY.get(i)()); return; }
  const door = SCENE_AT.get(i);
  put2('extra:' + i, objectAt(c) || (c[0] === 'relic' || c[0] === 'memento' ? itemAt(c[1], x[3]) : door ? toMap(x[3], door[0], door[1]) : null));
});
/* An extra whose own object is in a room the map draws, yet off its scene: parked until the game
   moves it, at its room's middle. Since its parents' turns count (tools/scene_place.py, 16-Oct-2026)
   these are the only ones; a new one is read again (a turn missed, or a patch that moved it). */
// Read on 16-Oct-2026: Dock_03c's and Dock_03d's walls above their tilemaps, Song_19_entrance's side
// lever and Slab_21's lock past their scenes' left edge, Aqueduct_04's planks under its floor,
// Bone_East_18c's Remasker past its right edge.
const PARKED = new Set(['Dock_03c/Breakable Wall_Silhouette', 'Dock_03d/Breakable Wall_Silhouette', 'Song_19_entrance/Song_lever_side',
  'Slab_21/Slab Lock', 'Aqueduct_04/drop_planks', 'Bone_East_18c/Remasker New Sharp']);
{
  const parked = [];
  EXTRAS.forEach((x, i) => {
    if (XY['extra:' + i] || LATE_XY.has(i)) return;
    // A way whose check also takes the save's flags (any) is still named by its own object.
    const c = x[2][0] === 'any' ? x[2].slice(1).find((y) => ['bool', 'int', 'geo'].includes(y[0])) || x[2] : x[2], door = SCENE_AT.get(i);
    const own = door || (['bool', 'int', 'geo'].includes(c[0]) && (P.objects[lower(c[1])] || {})[c[2]]);
    const r = R.roomOf(x[3]), box = r && r.exact && M.ROOMS[r.scene];
    if (own && own.length && box && box[2]) parked.push(`${x[3]}/${c[0] === 'bool' || c[0] === 'int' || c[0] === 'geo' ? c[2] : x[4] && x[4].en}`);
  });
  const fresh = parked.filter((k) => !PARKED.has(k));
  if (fresh.length) fail(`off their scene, in a room the map draws: ${fresh.join('; ')}: read them again (PARKED)`);
  console.log(`parked off their scene (their room's middle): ${parked.length}`);
}
for (const [id, obj] of Object.entries(PEOPLE_OBJ)) put2('person:' + id, entryAt(P.npcs[obj], PEOPLE[id]));
for (const [field, scene] of BELLS) { const b = P.benches[lower(scene)]; put2('bell:' + field, b && toMap(scene, b[0], b[1])); }
for (const [quest, f] of Object.entries(Q.FROM)) {
  if (f.board) put2('board:' + lower(f.board), entryAt(P.npcs['Quest Board Pivot'], f.board));
}

/* ── What has no object of its own: where whoever stands for it is (Albert's choice, 13-Oct-2026,
   the Map's hand fixes dropped). Each at its point in its room, as the rest:
     a vendor and Shakra   the person who sells (WHO: their NpcDialogueTitle key, people.json), and
                           what a vendor sells, there too (its way: js/how.js shop, js/shop.js SHOP)
     who offers a wish     the person (GIVER), and what a wish gives, at its Wishwall or giver
     a person's gift       that person (js/how.js npc, challenge, fleas)
     a boss and its drop   the boss in its arena: what in the scene points at its Journal record
                           (pickups.json records: the enemy carrying it, else its fight's FSM),
                           brought to the scene's edge when it waits just off it
     a gauntlet            its arena, the middle of its BattleScene's waves (pickups.json battles):
                           the one its check names (its object, or the flag it sets once won), else
                           the only one
     a lost flea           the flea in its room (pickups.json fleas), or the script that sets its
                           flag (fields: the Huge Flea, Kratt, Vog), as the melodies and the extras
                           whose flag has no room (HAND_PIECE, HAND_EXTRA)
     a key's door          its ItemReceptacle, when its room has only one (pickups.json locks)
   A point at its scene's origin or off it is something parked until the game moves it: not used.
   An interior the map doesn't draw (a point, or none) keeps its room's point: the game puts nothing
   of it anywhere else. Every person named here has to stand in that room (people.json), or the
   generator stops: a patch moved them. */
const PP = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'people.json'), 'utf8'));
const WHO = { grindle: 'GRINDLE', pebb: 'BB_SHOPKEEP', frey: 'BELLHART_SHOPKEEP', mort: 'PILGRIM_REST_SHOP', 'twelfth-architect': 'ARCHITECT',
  jubilana: 'CITY_MERCHANT', shakra: 'MAPPER', plinney: 'PINSMITH', eva: 'CREST_UPG_SHRINE', pinstress: 'PINSTRESS', loddie: 'LADYBUG_LARGE',
  lumble: 'DICE_PILGRIM', mooshka: 'FLEAMASTER', 'forge-daughter': 'FORGEDAUGHTER', 'mottled-skarr': 'ANT_MERCHANT', scrounge: 'BELLHART_RELICDEALER' };
// Who offers the wishes of each room js/quests.js FROM names (one mark per room): the Couriers in
// Bellhart, the Bartender at the Halfway House (Nuu's is the Journal's), the Caretaker in the Songclave…
// Fleatopia's Mr Mushroom (Aqueduct_05) has nobody of his in the room (null): the wish is taken at
// the object whose script offers it, the Mr Mushroom Tablet (kb/data/game/wishes.json offers).
const GIVER = { Belltown_Room_pinsmith: 'PINSMITH', Bone_East_Umbrella: 'SEAMSTRESS', Belltown: 'COURIERS_SHOP', Halfway_01: 'HH_BARTENDER',
  Belltown_Room_doctor: 'DOCTOR', Crawl_08: 'BLUE_SCIENTIST', aqueduct_05_festival: 'FLEAMASTER', Song_09b: 'GOURMAND_SERVANT',
  Room_Huntress: 'HUNTRESS', Mosstown_02c: 'MOSSCREEP', Aqueduct_05: null, Room_Pinstress: 'PINSTRESS', Dust_Shack: 'DUST_TRADERS_1',
  Bone_10: 'FLEAMASTER', Room_Witch: 'SHELLWOOD_WITCH', Song_Enclave: 'CHURCHKEEPER', Sprintmaster_Cave: 'SPEEDMASTER',
  Coral_37: 'STEEL_SENTINEL', Bone_Steel_Servant: 'STEEL_SERVANT' };
// A wish someone else than the room's GIVER offers there, a mark of their own: Nuu's (the Journal) in
// Creige's Halfway House.
const GIVER_QUEST = { Journal: 'HUNTER_FAN' };
for (const f of Object.values(Q.FROM)) for (const n of f.npc || []) if (!(n in GIVER)) fail(`nobody stands for the wishes offered in ${n}: GIVER needs reading again`);
// The first of a person's spots in a room, where the game places it (null in an interior); they have to stand there.
const personAt = (key, scene) => {
  const spots = ((PP.people[key] || fail(`${key} isn't in people.json`)).spots).filter(([sc]) => lower(sc) === lower(scene));
  if (!spots.length) fail(`${key} doesn't stand in ${scene} (people.json): WHO or GIVER needs reading again`);
  for (const [, , x, y] of spots) { const p = typeof x === 'number' ? toMap(scene, x, y) : null; if (p) return p; }
  return null;
};
const whoAt = (npc, scene) => (WHO[npc] ? personAt(WHO[npc], scene) : fail(`no person for ${npc} in WHO`));
/* Where a wish nobody offers in person is taken: the object whose FSM offers a wish of that room
   (tools/extract-wishes.py offers), or the generator stops: there's always one, or a patch moved it. */
const OFFERS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'wishes.json'), 'utf8')).offers
  || fail('wishes.json has no offers: run tools/extract-wishes.py again');
const offerAt = (scene) => {
  const at = Object.entries(Q.FROM).filter(([, f]) => (f.npc || []).some((n) => lower(n) === lower(scene)))
    .flatMap(([q]) => (OFFERS[q] || []).filter(([sc]) => lower(sc) === lower(scene)));
  if (!at.length) fail(`nobody offers the wishes of ${scene} (GIVER null), and no object of the scene does: GIVER needs reading again`);
  return at.map(([sc, , x, y]) => toMap(sc, x, y)).find(Boolean) || null;
};
const giverAt = (scene) => (GIVER[scene] ? personAt(GIVER[scene], scene) : offerAt(scene));
// A point inside its scene: one at the scene's origin, or off it, is parked until the game moves it.
const inScene = (scene, x, y) => {
  const size = P.sizes[lower(scene)];
  return typeof x === 'number' && size && (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) && x > 0 && y > 0 && x < size[0] && y < size[1];
};
// A boss where it is in its arena: the first enemy carrying its Journal record there, else what names
// it. One waiting just off its scene (the Widow above, Groal under the swamp) comes in where it waits:
// its point is brought to the scene's edge. One at the scene's origin is parked: not used.
const foeAt = (foe, scene) => recordAt(bookOf(foe), scene);
// A Journal entry's enemy in a scene: the first carrying its record there, else what names it.
const recordAt = (e, scene) => {
  const host = hostOf(scene);   // a boss scene's room (toMap)
  const size = P.sizes[host];
  const hits = ((e && P.records[e.key]) || []).filter(([sc, , , x, y]) => lower(sc) === lower(scene) && typeof x === 'number' && (Math.abs(x) > 0.5 || Math.abs(y) > 0.5));
  const first = (l) => l.find(([, comp]) => /^EnemyDeathEffects/.test(comp)) || l[0];
  const hit = first(hits.filter(([, , , x, y]) => inScene(host, x, y))) || first(hits);
  if (!hit || !size) return null;
  const clamp = (v, n) => Math.min(Math.max(v, 1), n - 1);
  return toMap(host, clamp(hit[3], size[0]), clamp(hit[4], size[1]));
};
// What a wish gives: at the Wishwall it's on, else at who offers it.
const wishAt = (quest, scene) => {
  const f = Q.FROM[quest] || {};
  if (f.board && lower(f.board) === lower(scene)) return XY['board:' + lower(f.board)] || null;
  const n = (f.npc || []).find((x) => lower(x) === lower(scene));
  return n ? (GIVER_QUEST[quest] ? personAt(GIVER_QUEST[quest], n) : giverAt(n)) : null;
};
// A thing's point by the way its room came from (WAY_OF).
const wayAt = (key, scene) => {
  const w = WAY_OF[key];
  if (!w || !scene) return null;
  if (w.kind === 'shop') return whoAt(w.vendor, w.vendor === 'shakra' ? 'Belltown' : scene);
  if (w.kind === 'wish') return wishAt(w.quest, scene);
  if (w.kind === 'boss') return foeAt(w.foe, scene);
  if (['npc', 'challenge', 'fleas'].includes(w.kind)) return XY['person:' + w.npc] && lower(PEOPLE[w.npc]) === lower(scene) ? XY['person:' + w.npc] : whoAt(w.npc, scene);
  return null;
};
// A flag's script in a room (pickups.json fields).
const fieldAt = (flag, scene) => entryAt(P.fields[flag], scene);
// Kratt, strung up in Greymoor_24: no script there names his flag, he stands there himself; and
// Mooshka at the Blasted Steps, who gives his Spool Fragment there.
const PIECE_WHO = { CaravanLechReturnedToCaravan: 'FLEA_LECH', MetCaravanTroupeLeaderJudge: 'FLEAMASTER' };
// A room's lost flea: the flea itself (in its cage, barrel, branches, asleep…), else what wakes it.
const fleaIn = (scene) => {
  const all = (P.fleas[lower(scene)] || []).filter((f) => f[1] || f[2]);
  return all.find((f) => !/ (Activation|Scene)$/.test(f[0])) || all[0] || null;
};
// The people of PEOPLE with no object of theirs placed (PEOPLE_ROOM's, or none there).
for (const id of Object.keys(PEOPLE)) if (!XY['person:' + id] && WHO[id]) put2('person:' + id, whoAt(id, PEOPLE[id]));
// The vendors, Shakra and who offers a wish.
for (const [v, scenes] of Object.entries(VENDORS)) scenes.forEach((sc, i) => put2((v === 'shakra' ? 'shakra:' : 'shop:' + v + ':') + i, whoAt(v, sc)));
// A thing's other room when a vendor sells it there (ALSO): at the vendor, as what it sells there already.
for (const [key, also] of Object.entries(ALSO)) if (also[2] && also[2].kind === 'shop') put2(alsoKey(key, also), whoAt(also[2].vendor, also[0]) || fail(`${key}: no point for ${also[2].vendor} in ${also[0]}`));
for (const n of Object.keys(GIVER)) put2('giver:' + lower(n), giverAt(n));
/* Who offers the wishes of each room, by name, and the mark that stands for them there already, if
   any (Albert's choice, 15-Oct-2026: each person once in a room): a person of PEOPLE, a vendor of
   VENDORS, or one of the traders js/people.js adds to the shops (tools/gen-people.js TRADERS, the
   first of their spots). The Map lists the wishes on that mark instead of drawing another. */
const TRADER = { COURIERS_SHOP: 'couriers', MOSSCREEP: 'druid', HH_BARTENDER: 'creige' };
const sameRoom = (a, b) => !!(a && b) && lower((R.roomOf(a) || {}).scene || a) === lower((R.roomOf(b) || {}).scene || b);
const GIVERS = {};
for (const [scene, key] of Object.entries(GIVER)) {
  if (!key) { GIVERS[scene] = null; continue; }
  const ks = [key + '_SUPER', key + '_MAIN', key + '_SUB'].filter((k) => k in N.EN || k in N.ES);
  const id = Object.keys(WHO).find((x) => WHO[x] === key);
  const shop = id && (VENDORS[id] || []).findIndex((sc) => sameRoom(sc, scene));
  const mark = id && sameRoom(PEOPLE[id], scene) ? 'person:' + id : id && shop >= 0 ? (id === 'shakra' ? 'shakra:' : 'shop:' + id + ':') + shop
    : TRADER[key] ? 'shop:' + TRADER[key] + ':0' : null;
  GIVERS[scene] = [key, ks.length ? N.text(ks.join('+')) : fail(`no name for ${key} (GIVER)`), mark];
}
// GIVER_QUEST's, under 'room:who' (QUEST_GIVER: the wish → that id), with their own mark and point.
const QUEST_GIVER = {};
for (const [quest, key] of Object.entries(GIVER_QUEST)) {
  const scene = ((Q.FROM[quest] || {}).npc || [])[0] || fail(`${quest} isn't offered by anyone (GIVER_QUEST)`);
  const id = scene + ':' + lower(key), ks = [key + '_SUPER', key + '_MAIN', key + '_SUB'].filter((k) => k in N.EN || k in N.ES);
  QUEST_GIVER[quest] = id;
  GIVERS[id] = [key, ks.length ? N.text(ks.join('+')) : fail(`no name for ${key} (GIVER_QUEST)`), null];
  put2('giver:' + lower(id), personAt(key, scene));
}
// The 100% with no point of its own: by its way, the flea, or the script setting its flag.
CO.PIECES.forEach((p, i) => {
  const key = 'piece:' + i, scene = AT.pieces[i];
  if (XY[key] || !scene) return;
  const flea = p[2][0] === 'flag' && /^SavedFlea_/.test(p[2][1]) ? fleaIn(scene) : null;
  put2(key, flea ? toMap(scene, flea[1], flea[2]) : HAND_PIECE[p[2][1]] ? fieldAt(p[2][1], scene) || (PIECE_WHO[p[2][1]] && personAt(PIECE_WHO[p[2][1]], scene))
    : wayAt(key, scene));
});
for (const cat of ['tools', 'crests', 'skills', 'arts']) for (const [id, scene] of Object.entries(AT[cat])) if (!XY[cat + ':' + id]) put2(cat + ':' + id, wayAt(cat + ':' + id, scene));
put2('everbloom', wayAt('everbloom', AT.everbloom));
// The extras whose flag has no room (HAND_EXTRA), and the relics an NPC hands over (RELIC_ROOM: Jubilana, Grindle).
const RELIC_WHO = { 'Seal Chit City Merchant': 'jubilana', 'Psalm Cylinder Grindle': 'grindle' };
/* A Void Mass kept by the flag an arena sets once won (Dust_11's two, silkFarmAbyssCoresCleared): at
   the middle of the Void Masses its waves hold (pickups.json battles' cores), where the game draws
   them, not at the script that names the flag (Styx). It has to have them, or the generator stops. */
const coresOf = (flag, scene) => {
  const b = (P.battles[lower(scene)] || []).find((x) => x[3] === flag);
  return b && b[4] && b[4].length ? b[4] : null;
};
EXTRAS.forEach((x, i) => {
  const c = x[2];
  if (XY['extra:' + i]) return;
  const core = x[0] === 'spawn' && x[4] && x[4].key === 'NAME_BLACK_THREAD_CORE';
  if (core && c[0] === 'flag') {
    const cores = coresOf(c[1], x[3]) || fail(`the Void Mass of ${c[1]} (${x[3]}): no arena that sets it holds Void Masses (pickups.json battles)`);
    const mid = (k) => cores.reduce((t, p) => t + p[k], 0) / cores.length;
    put2('extra:' + i, toMap(x[3], mid(0), mid(1)));
  } else if (c[0] === 'flag' && HAND_EXTRA[c[1]]) put2('extra:' + i, fieldAt(c[1], x[3]));
  else if (c[0] === 'relic' && RELIC_WHO[c[1]]) put2('extra:' + i, whoAt(RELIC_WHO[c[1]], x[3]));
});
// The bosses in their arenas, the gauntlets at theirs, the key doors at their lock.
for (const [foe, scene] of BOSSES) put2('boss:' + foe, foeAt(foe, scene));
// The Journal's entries (the Map's layer of those still missing): where the enemy is in the first
// room the Map gives the entry (js/app-map.js, its first room on the map).
for (const e of J.BOOK) {
  const scene = ((SS.journalRooms[e.key] || []).map(([s]) => s)).find(onMap);
  if (scene) put2('journal:' + e.id, recordAt(e, scene));
}
const flat = (c) => (c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(flat) : [c]);
for (const g of SS.gauntlets.GAUNTLETS) {
  const all = P.battles[lower(g.scene)] || [];
  const named = flat(g.done).map((c) => all.find((b) => (c[0] === 'bool' && lower(c[1]) === lower(g.scene) && b[0] === c[2]) || (c[0] === 'flag' && b[3] === c[1]))).find(Boolean);
  const b = named || (all.length === 1 ? all[0] : null);
  put2('gaunt:' + g.id, b && inScene(g.scene, b[1], b[2]) ? toMap(g.scene, b[1], b[2]) : null);
}
console.log(`${Object.keys(XY).length} things with their own point in their room`);

/* ── The wishes and the main objectives (TASKS), from kb/data/game/wishes.json ──
   (tools/extract-wishes.py, the game's own files; design/03-redesign.md, step 6, Albert's choice)
     qitem  what a wish asks for, where it lies (a pickup, the flower that gives it, the Flintbeetle
            that drops it, the spots the Silver Bells drop at) or who gives it: done once its
            sceneData flag is set, it's held (when it lies in one spot only), or its wish is done
            (a drop spot: its wish only)
     wspot  where a wish is done: the map's own pins for the deliveries and the Steel Sentinel's
            spots (the save chooses three of six, SteelQuestSpots), the Herald's seven spots
            (MushroomQuestFound<n>), and the one room where the game ends a wish that isn't where
            it's taken (a rescue, a fight, the Roach Guts delivered)
     goal   the main objectives where the map's own pins put them, but the Bellshrines' (a layer of
            their own) and the Old Hearts' and Melodies' (pieces of the 100%); done once complete or
            a later step is (LATER: Pale Monarch stays incomplete when Act 3 opens through the Soul
            Snare, as the author's 100% save shows) */
const WI = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'wishes.json'), 'utf8'));
// The Twisted Bud no target names: the Wood Witch takes it for Rite of Rebirth (her FSM ends that wish).
const WISH_OF = { 'Wood Witch Item': 'Wood Witch Curse' };
const LATER = { 'Citadel Ascent Silk Defeat': ['Black Thread Pt0'] };
/* The playerData bool that says which of its places an enemy is in, → what it stands for in the
   Map's card (js/app-map.js ALT_BY): bone03_openedTrapdoorForRockRoller, the shortcut whose lever
   in Bone_03 opens the trapdoor after the Bell Beast (its flag bone03_openedTrapdoor; the two are
   equal in each of the author's 87 saves). */
const PICKED_BY = { bone03_openedTrapdoorForRockRoller: 'shortcut' };
const TASKS = [], HUNTS = {};
{
  // The scenes as the game names them (a sceneData flag is kept under that name); one nobody enters
  // by a door keeps the bundle's lower case (js/rooms.js finds its room either way), and no flag.
  const PROPER = new Map();
  for (const [k, v] of Object.entries(SS.graph)) for (const s of [k, ...v]) PROPER.set(s.toLowerCase(), s);
  for (const s of Object.keys(M.ROOMS)) PROPER.set(s.toLowerCase(), s);
  const proper = (s) => PROPER.get(s.toLowerCase()) || null;
  const isWish = (q) => CO.WISHES.some((w) => w[2][0] === 'quest' && w[2][1] === q);
  const art = (n) => { if (!fs.existsSync(path.join(__dirname, '..', 'assets', 'map', n + '.webp'))) fail(`assets/map/${n}.webp is missing`); return n; };
  const steel = (q) => (WI.quests[q] || {}).type === 'Steel Sentinel' ? 'steel' : null;
  const task = (kind, quest, check, scene, x, y, icon, name, pick, alt) => {
    if (!onMap(scene)) { unplaced.push(`${kind} ${quest} ${scene}`); return; }
    const i = TASKS.length;
    // What the game swaps out when Act 3 begins (its pickup under the room's «Normal World»): 'act3'.
    const bs = savedOf(check), gone = bs.length && bs.every(([, s, id]) => gateOf(s, id).world === 'normal') ? 'act3' : null;
    TASKS.push([kind, quest, check, proper(scene) || scene, icon, name || null, steel(quest), pick || null, gone, ...(alt ? [alt] : [])]);
    const p = x == null ? null : Array.isArray(x) ? x : toMap(scene, x, y);
    if (p) XY['task:' + i] = p;
  };
  // What a wish asks for.
  const wants = (save) => WISH_OF[save] ? [WISH_OF[save]] : Object.keys(WI.quests).filter((q) => !WI.quests[q].main && WI.quests[q].targets.includes(save));
  for (const [save, at] of Object.entries(WI.items)) {
    const q = wants(save).find(isWish) || fail(`no wish asks for ${save}`);
    const name = N.text(WI.names[save] || fail(`no name for ${save}`)), icon = art('icons/' + WI.icons[save]);
    const seen = new Set();
    /* One enemy in two places (tools/extract-wishes.py's { dead, needs }: the Flintbeetle whose
       death sets rockRollerDefeated_bone06 is in Bone_04 while the shortcut's trapdoor in Bone_03 is
       shut, bone03_openedTrapdoorForRockRoller false, and in Bone_06 once it's open): its places by
       that bool. */
    const sameFoe = new Map();
    for (const x of at) if (x[6] && x[6].dead) sameFoe.set(x[6].dead, [...(sameFoe.get(x[6].dead) || []), x]);
    // Held says which spot only when there's one: one Pollip Heart held isn't the six flowers, nor
    // one Flintgem the three Flintbeetles (each spot keeps its own flag).
    const spots = new Set(at.map(([scene, , obj, flag, , , foe]) => (foe && foe.dead) || scene + (flag || obj))).size;
    const own = (scene, flag) => (flag && proper(scene) ? [['bool', proper(scene), flag]] : []);
    for (const [scene, comp, obj, flag, x, y, foe] of at) {
      const one = scene + (flag || obj);
      if (seen.has(one)) continue;   // the Crown Fragment lies twice in its room, under one flag
      seen.add(one);
      const pair = foe && foe.dead && sameFoe.get(foe.dead).length > 1 ? sameFoe.get(foe.dead) : null;
      /* A spot where it drops by chance (the Silver Bells'): done with its wish, a bell held says
         nothing of the other spots. One enemy's places share one check (either place's drop picked
         up, else its wish done) and so count once, each with the check that it's the place this
         game has it in (alt.at): its drop picked up here, else not there and this place's bools as
         the save has them; alt.by and alt.open name what picks, alt.foe the enemy by its Journal
         name (NAME_ and its object's: NAME_ROCK_ROLLER), for the Map's card (js/app-map.js). */
      const check = comp === 'QuestDropper' ? ['quest', q]
        : ['any', ...(pair ? pair.flatMap(([s, , , f]) => own(s, f)) : own(scene, flag)), ...(spots === 1 ? [['held', save]] : []), ['quest', q]];
      let alt = null;
      if (pair) {
        const others = pair.filter((p) => p[0] !== scene), by = Object.entries(foe.needs).filter(([f, v]) => others.every((p) => p[6].needs[f] === !v));
        if (by.length !== 1 || !PICKED_BY[by[0][0]]) fail(`${save} in ${scene}: its places should part by one known bool (PICKED_BY), not ${JSON.stringify(by)}`);
        const [f, v] = by[0];
        alt = { at: ['any', ...own(scene, flag), ['all', ...others.flatMap(([s, , , fl]) => own(s, fl)).map((c) => ['not', c]), v ? ['flag', f] : ['not', ['flag', f]]]],
          by: PICKED_BY[f], open: v, foe: N.text('NAME_' + obj.toUpperCase().replace(/\W+/g, '_')) };
      }
      task('qitem', q, check, scene, x, y, icon, name, null, alt);
    }
  }
  // The map's own pins, on the map by its bench pins (their median offset; the bench pins are the
  // game's, so they agree to the pixel).
  const off = [];
  for (const pin of M.PINS) {
    const b = pin[0] === 'bench' && WI.benches[pin[3].toLowerCase()];
    if (b) off.push([b[0] - pin[1] / M.PPU, b[1] + pin[2] / M.PPU]);
  }
  const med = (a) => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];
  const ox = med(off.map((o) => o[0])), oy = med(off.map((o) => o[1]));
  const bad = off.filter((o) => Math.hypot(o[0] - ox, o[1] - oy) * M.PPU > 2).length;
  if (off.length < 40 || bad > off.length / 10) fail(`the map's quest pins don't line up by its bench pins (${off.length} benches, ${bad} off)`);
  // The room a pin falls in: the smallest box holding it, as the scene it's a part of (Bellway_Aqueduct_top
  // is Bellway_Aqueduct's: a part is no scene, and which part holds a pin can turn on a hair).
  const isScene = (s) => !!P.sizes[lower(s)];
  const sceneOfPart = (s) => { let x = s; while (!isScene(x) && x.lastIndexOf('_') > 0) x = x.slice(0, x.lastIndexOf('_')); return isScene(x) && M.ROOMS[x] ? x : s; };
  const inRoom = ([px, py]) => Object.entries(M.ROOMS).filter(([, r]) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3])
    .sort(([, a], [, b]) => a[2] * a[3] - b[2] * b[3]).map(([s]) => sceneOfPart(s))[0];
  const byItem = (save) => Object.keys(WI.quests).find((q) => WI.quests[q].targets.includes(save));
  const pinned = new Set();
  /* The Bellbeast's pins (Beast in the Bells), one per Bellway station: the game shows one only
     while the beast waits at that station (each pin's DeactivatePlayerDataTest turns it off when
     FastTravelNPCLocation isn't its station's). One whose room has no station never shows: the
     Waterwheel's, FastTravelNPCLocation 7, a value the game's FastTravelLocations doesn't have (a
     station cut from the game), under Greymoor_17 in the black. Each of the others carries its
     station's value (alt.at, as a Flintbeetle's places): a save with the wish taken and not done
     shows only the one the beast is at; before it's taken, once it's done and in Free mode, all
     twelve (one check, so one thing on the layer's count). */
  const stations = new Set(M.PINS.filter((x) => x[0] === 'bellway').map((x) => sceneOfPart(x[3])));
  let unstationed = 0;
  const STATION = 'FastTravelNPCLocation';
  const stationOf = (off, name) => {
    const [g] = off || [];
    // Off while the field isn't its value: one test, an enum (Type 3), NotEqual (NumType 1).
    if (!off || off.length !== 1 || g.length !== 1 || g[0][0] !== STATION || g[0][1] !== 3 || g[0][2] !== 1) fail(`${name}: a Bellbeast pin switched off by something else than ${STATION} (${JSON.stringify(off)})`);
    return g[0][3];
  };
  for (const [pinName, sprite, quest, item, target, wx, wy, off] of WI.pins) {
    const q = quest || byItem(item);
    const info = WI.quests[q];
    if (!info) continue;   // a step of a main objective (an Old Heart, a Melody): a piece of the 100%
    const p = [Math.round((wx - ox) * M.PPU * 10) / 10, Math.round((oy - wy) * M.PPU * 10) / 10];
    const scene = target || inRoom(p);
    if (!scene) { unplaced.push(`pin ${q}`); continue; }
    if (sprite === 'quest_map_icon_bellbeast' && !stations.has(scene)) { unstationed++; continue; }
    if (info.main) {
      if (sprite === 'quest_map_icon_songshrines') continue;   // the Bellshrines' layer
      const later = [...(LATER[q] || [])];
      for (let grow = true; grow;) {   // every main objective that comes after it
        grow = false;
        for (const [n, c] of Object.entries(Q.CHAIN)) if (c.main && (c.prev === q || later.includes(c.prev)) && !later.includes(n)) { later.push(n); grow = true; }
      }
      /* The objective's wish (js/collectibles.js WISHES, by the quest's name) when the save says it
         another way: Last Dive's quest is never completed, not even after the Act 3 ending (both of
         the author's finished games), and its wish is had by Lost Lace in the Journal (design/03-
         redesign.md, step 6, the save checks, 7 A). */
      const wish = CO.WISHES.find((w) => w[0] === 'main-objectives' && w[4] && w[4].key === (Q.CHAIN[q] || {}).name?.key);
      // Only a check of another kind than a quest (a step's name is often its objective's: Pharloom's Crown's three).
      const own = wish && wish[2][0] !== 'quest' ? [wish[2]] : [];
      const check = ['any', ['quest', q], ...later.map((n) => ['quest', n]), ...own];
      let alt = null;
      if (sprite === 'quest_map_icon_bellbeast') {
        const v = stationOf(off, pinName);
        // Its station's: not taken yet, done, or the beast waits there (the value, as 'min' reads an int).
        alt = { at: ['any', ['not', ['accepted', q]], check, ['all', ['min', STATION, v], ['not', ['min', STATION, v + 1]]]] };
      }
      task('goal', q, check, scene, p, null, art('pins/' + sprite), null, null, alt);
    } else {
      if (!isWish(q) && !isWish(Object.keys(Q.CHAIN).find((n) => Q.CHAIN[n].prev === q))) continue;
      pinned.add(q);
      const spot = target && (proper(target) || fail(`no scene named ${target}`));
      const check = spot ? ['any', ['steel', spot], ['quest', q]] : ['quest', q];
      // The Courier's Rasher is a delivery the Great Gourmand's wish asks for: the couriers' emblem.
      const emblem = sprite === 'quest_map_icon_courier' ? Object.values(WI.quests).find((x) => x.type === 'Courier').emblem : info.emblem;
      task('wspot', q, check, scene, p, null, art('icons/' + emblem), null, spot);
    }
  }
  // The Herald's spots, each its own flag.
  for (const [field, at] of Object.entries(WI.fields)) {
    const [scene, , x, y] = at.find((e) => /NPC/.test(e[1])) || at[0];
    task('wspot', 'Mr Mushroom', ['any', ['flag', field], ['quest', 'Mr Mushroom']], scene, x, y, art('icons/' + WI.quests['Mr Mushroom'].emblem));
  }
  // The one room where the game ends a wish, when it isn't where the wish is taken.
  for (const [q, at] of Object.entries(WI.ends)) {
    if (!isWish(q) || WI.quests[q].main || pinned.has(q) || WI.quests[q].type === 'Herald') continue;
    const scenes = [...new Set(at.map((e) => e[0]))].filter(onMap);
    const from = Q.FROM[q] || {}, taken = [from.board, ...(from.npc || [])].filter(Boolean).map((s) => s.toLowerCase());
    if (scenes.length !== 1 || taken.includes(scenes[0])) continue;
    const [scene, , x, y] = at.find((e) => e[0] === scenes[0]);
    task('wspot', q, ['quest', q], scene, x, y, art('icons/' + WI.quests[q].emblem));
  }
  // More than the Waterwheel's: a station's pin no longer falls in its station's room.
  if (unstationed > 1) fail(`${unstationed} Bellbeast pins in no Bellway station's room`);
  const n = (k) => TASKS.filter((x) => x[0] === k).length;
  console.log(`tasks: ${n('qitem')} wish items, ${n('wspot')} places where a wish is done, ${n('goal')} objective pins (${unstationed} Bellbeast pin off any station left out)`);
  /* The hunts (design/03-redesign.md, the wishes on the Map, design/103, 1 A): a hunt or gather wish
     whose thing only enemies give while it's on (kb/data/game/hunts.json, tools/extract-hunts.py)
     has no mark: the Map's «Where to hunt» focuses the Journal's rooms of those enemies. One the
     Map marks already (a Flintbeetle's drop: qitem) is left out, and so are the wishes of other
     kinds whose boss's corpse names them (Garmond's, the Second Sentinel's). */
  const HU = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'hunts.json'), 'utf8'));
  for (const [q, es] of Object.entries(HU)) {
    const w = CO.WISHES.find((x) => x[2][0] === 'quest' && x[2][1] === q);
    if (!w || !['hunt', 'gather'].includes(w[0]) || TASKS.some((x) => x[0] === 'qitem' && x[1] === q)) continue;
    const ask = ((Q.CHAIN[q] || {}).asks || []).find((a) => a.kind === 'item') || fail(`the hunt ${q} asks for no item in js/quests.js`);
    const at = [];
    for (const [key, scenes] of Object.entries(es)) {
      if (!J.BOOK.some((e) => e.key === key)) fail(`the hunt ${q}: no Journal entry ${key}`);
      const rooms = new Map((SS.journalRooms[key] || []).map(([s]) => [lower(s), s]));
      for (const [s, [count]] of Object.entries(scenes)) {
        if (!rooms.has(s)) fail(`the hunt ${q}: ${key} in ${s}, which js/journal-rooms.js doesn't have: run tools/extract-journal-rooms.py again`);
        if (onMap(rooms.get(s))) at.push([key, rooms.get(s), count]);
      }
    }
    if (!at.length) fail(`the hunt ${q} has no room on the map`);
    HUNTS[q] = [ask.save, at.sort((a, b) => b[2] - a[2] || a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))];
  }
  console.log(`hunts: ${Object.entries(HUNTS).map(([q, [, at]]) => `${q} ${new Set(at.map((x) => x[1])).size} rooms`).join(', ')}`);
}
// The caches that only hold an item (HELD, above): that item has a mark of its own in that room, by
// its pickup's bool (a piece of the 100%, a rosary item, a wish's item) or as a Tool's other room.
for (const [save, scene, name] of HELD) {
  const bids = new Set(P.lying[save].filter(([s]) => lower(s) === lower(scene)).map(([, b]) => b));
  const names = (c) => boolsOf(c).some(([, s, b]) => lower(s) === lower(scene) && bids.has(b));
  const own = CO.PIECES.some((p) => names(p[2])) || EXTRAS.some((x) => names(x[2])) || TASKS.some((x) => names(x[2]))
    || Object.entries(ALSO).some(([k, [s, , way]]) => !way && lower(s) === lower(scene) && k.startsWith('tools:') && CO.TOOLS[k.slice(6)].includes(save));
  if (!own) fail(`${name} holds ${save}, which has no mark of its own in ${scene}`);
}
console.log(`caches that only hold an item, left out: ${HELD.map(([save, scene]) => scene + ' ' + save).join(', ')}`);
/* What only Act 3 has lying in a room (gating.json world 'act3', a CollectableItemPickup of
   pickups.json items) is a mark's: its check names that bool, or a mark of that item is in that
   room (its check names the item or its map's flag, or a Tool's save names do). One that isn't is a
   thing Act 3 moves there (MOVED, above: the Memory Locket of «Volatile Flintbeetles» was one,
   before its check took Bone_10's bool), or a new one: read its scene. A move with no bool of its
   own (Mossberry no. 3's Aknid) can't be told this way: a sweep of the scenes found it. */
{
  const named = new Set(savedOf(['any', ...CO.PIECES.map((p) => p[2]), ...EXTRAS.map((x) => x[2]), ...TASKS.map((x) => x[2])]).map((b) => lower(b[1] + '|' + b[2])));
  const room = (s) => lower((R.roomOf(s) || {}).scene || s);
  const marked = (scene, item) => {
    const r = room(scene), names = [item, ...((P.maps[item] || []).slice(0, 1))].map((n) => JSON.stringify(n));
    const of = (c) => names.some((n) => JSON.stringify(c).includes(n));
    return CO.PIECES.some((p, i) => room(AT.pieces[i]) === r && of(p[2])) || EXTRAS.some((x) => room(x[3]) === r && of(x[2]))
      || TASKS.some((x) => room(x[3]) === r && of(x[2])) || Object.entries(AT.tools).some(([id, s]) => room(s) === r && (CO.TOOLS[id] || []).includes(item));
  };
  let n = 0;
  for (const [item, it] of Object.entries(P.items)) {
    for (const e of it.at) {
      if (e[1] !== 'CollectableItemPickup' || gateOf(e[0], e[2]).world !== 'act3') continue;
      n++;
      if (!named.has(lower(e[0] + '|' + e[2])) && !marked(e[0], item)) fail(`${item} lies in ${e[0]} (${e[2]}) only in Act 3 and no mark has it there: a thing Act 3 moves (MOVED)?`);
    }
  }
  console.log(`only in Act 3, lying: ${n} pickups, each a mark's; moved there: ${MOVED.map((x) => x.kind + ' to ' + x.scene).join(', ')}`);
}

// The Map admin's fixes keyed by an index of these lists follow their marks (stops the run if one can't).
require('./follow-fixes.js').run('spots', { EXTRAS, TASKS, VENDORS, XY });

const size = write(OUT, `js/spots.js — where the Map draws each thing, and what it shows beyond the 100%.
   GENERATED by tools/gen-spots.js from the site's data, kb/data/completionist/ and
   kb/data/game/pickups.json, wishes.json and hunts.json (tools/extract-pickups.py,
   tools/extract-wishes.py, tools/extract-hunts.py, the game's own files): not edited by hand.
   Change the generator and run npm run data. Scenes as the game names them (js/rooms.js places
   them in either case).

     AT       { pieces: { PIECES index: scene }, tools: { COUNTED group's first id, and the six
              outside the 100%: scene }, crests, skills, arts: { id: scene }, everbloom: scene,
              act: { key: Act } for what's outside the 100% and js/collectibles.js WHERE lacks }:
              where each thing of the 100% is had (its pickup, its vendor, its Wishwall, its
              boss's arena, its giver)
     ALSO     a thing's key ('tools:<id>', 'piece:<i>', 'extra:<i>') → [scene, check, way?]: its other
              room, and the check that says the game has it there. A Tool sold that lies there once
              its seller is gone (the Curveclaw once the Mottled Skarr dies, the Weighted Belt once
              Mort does; its point XY '<key>:found'); with way { kind: 'shop', vendor, price, act: 3,
              from }, what a vendor sells only in Act 3 once from (who had it before) is gone
              (Grindle's: Pebb's, Mort's and Lumble's wares; its point XY '<key>:<vendor>'); with way
              { kind: 'moved', act: 3, foe | wish }, what Act 3 moves to another room (MOVED:
              Mossberry no. 3, the Memory Locket of «Volatile Flintbeetles»; its point XY
              '<key>:found'); check as EXTRAS', plus ['tool', name] (that Tool unlocked) and
              ['not', check]
     VARIANTS a thing's key ('tools:silkshot') → { item, at: [[variant, save name, scene, act]] }:
              the places one of its variants is had (the Silkshot's three repairs: the rune desk in
              Mount Fay, the Twelfth Architect, the Forge Daughter), each the js/data.js attack id,
              the save's name for it, its room (its point: XY key in the thing's own AT room, else
              key + ':' + variant) and the first Act it can be done in there; item the EXTRAS index of what each repair takes (the
              Ruined Tool)
     LEFT     a vendor the game takes away for good → the check that says it has (the Twelfth
              Architect, ArchitectLeft): its shop and what it repairs go
     EXTRAS   [kind, act, check, scene, name?, more?]: what doesn't count (relics by kind, mossberry,
              silkeater, memento, bellhome, spawn, rosary-cache, shard-cache, wall, then lever,
              plate, gate, lock, shortcut, silkwall from the game's scenes, then map, rosaries,
              shards, the doors a key opens no mark had yet); act null when the thing has no Act of
              its own; more { shop, price } for a map Shakra sells, { machine, price } for one a
              map machine sells, { found } for one found, { item } for a rosary or shard item
              ({ item, fight } for one an arena drops: that gauntlet's id), { gone: 'act3' }
              for what the game takes away when Act 3 begins, { lost: check, person } for what the game takes away with someone once that check holds
              (Grindle's cell door), { mode: 'steel' or 'normal' } for what only that mode has,
              { was } the check it had before the save checks and { wasKind } the kind it had
              before (a slot kept before has its marks by those, js/savefile.js gameOf: had then
              is had now, as the new check takes in the old); check as
              js/collectibles.js's, plus ['relic', name], ['memento', name], ['int', scene, id,
              value] (['int', scene, id, value, 'min']: at least value), ['geo', scene, id] and
              ['accepted', quest] (the wish taken, done or not)
     BOSSES   [foe id, scene, check, act]: each boss fight's arena, whether it's beaten and the
              first Act it can be fought in; check also ['kills', Journal name, n] (at least n of
              it beaten)
     VENDORS  vendor id → the rooms it sells in; PEOPLE  npc id → its room
     BELLS    [playerData field, scene (, name)]: the six Bellshrines (the Grand Gate asks for five)
     KEYS     a lock's key (js/quests.js LOCKS) → its name
     MAPS     a map's flag (Has<X>Map, without Has and Map) → the area it draws
     TASKS    [kind, quest, check, scene, picture, name?, mode?, steel?, gone?, alt?]: the wishes and the main
              objectives (kind 'qitem' what a wish asks for, 'wspot' where a wish is done, 'goal' a
              main objective's pin), quest its save name (js/quests.js), check as EXTRAS' plus
              ['held', collectable] and ['steel', scene] (a Steel Sentinel spot seen), picture
              under assets/map/, name the thing's (a wish's and an objective's are the quest's),
              mode 'steel' when only Steel Soul has it, steel the spot's scene when the save
              chooses it (SteelQuestSpots), gone 'act3' when the game takes it away as Act 3 begins,
              alt { at, by, open, foe } for one of the places one thing may be in (a Flintbeetle's
              two, the Bellbeast's twelve stations): at the check that it's this one in this game,
              by what picks ('shortcut'), open whether it's this one once that's open, foe the
              enemy's name (the Bellbeast's have at alone)
     HUNTS    a hunt or gather wish whose thing only enemies give while it's on → [the thing's save
              name (its js/quests.js CHAIN asks), [[Journal entry key, scene, how many], ...]]: the
              rooms on the map where those enemies are, the most first (the Map's «Where to hunt»)
     XY       a thing's key ('piece:<i>', 'tools:<id>', '<key>:found', '<key>:<vendor>', 'tools:<id>:<variant>', 'arts:<id>', 'extra:<i>'…, 'person:<id>',
              'board:<scene>', 'bell:<field>', 'task:<i>', 'shakra:<i>', 'shop:<vendor>:<i>', 'giver:<scene>', 'boss:<foe>', 'journal:<entry>', 'gaunt:<id>',
              'everbloom') → its point on the map, in the image's pixels: where
              the game has it in its room (the object's place in the scene, or whoever stands for it,
              placed as the game places a point: js/rooms.js mapPoint)
     SEATS    scene (lower case) → { respawn marker's name → its point on the map }: where the game
              wakes Hornet when a save names that marker (respawnScene, respawnMarkerName: a bench's
              RestBench, a room's Death Respawn Marker), her feet on the ground under it (a bench's
              own foot, the terrain under a marker), in the image's pixels; js/rooms.js restPoint
     GIVER    scene a wish is offered in (js/quests.js FROM) → [the person who stands for it there
              (their key in people.json), their name (the game's), the key of the mark that is them
              in that room already, or null], or null, nobody: the Map names the mark by them or
              lists the wishes on theirs; tools/gen-people.js doesn't draw them again. 'room:who'
              for a wish someone else offers in that room
     QUEST_GIVER  such a wish → its 'room:who'`,
'spots', [['AT', AT], ['ALSO', ALSO], ['VARIANTS', VARIANTS], ['LEFT', LEFT], ['EXTRAS', EXTRAS], ['BOSSES', BOSSES], ['VENDORS', VENDORS], ['PEOPLE', PEOPLE], ['BELLS', BELLS], ['KEYS', KEYS], ['MAPS', MAPS], ['TASKS', TASKS], ['HUNTS', HUNTS], ['XY', XY], ['SEATS', SEATS], ['GIVER', GIVERS], ['QUEST_GIVER', QUEST_GIVER]]);
const kinds = {};
for (const x of EXTRAS) kinds[x[0]] = (kinds[x[0]] || 0) + 1;
console.log(`js/spots.js  ${placed.length} things of the 100% placed, ${EXTRAS.length} extras (${Object.entries(kinds).map(([k, n]) => n + ' ' + k).join(', ')}), `
  + `${BOSSES.length} bosses  (${size} bytes)`);
if (unplaced.length) console.log(`not placed (${unplaced.length}): ${unplaced.join('; ')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
