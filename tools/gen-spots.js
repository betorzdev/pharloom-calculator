#!/usr/bin/env node
/* tools/gen-spots.js — generates js/spots.js: where the Map draws each thing (npm run data runs it
   after tools/gen-how.js). Offline: it reads the site's generated data (js/collectibles.js,
   js/how.js, js/shop.js, js/quests.js, js/journal-rooms.js, js/enemies.js), kb/data/completionist/
   and kb/data/game/pickups.json and wishes.json (tools/extract-pickups.py, tools/extract-wishes.py,
   from the game's own files).

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
              rosaries and shell shards lying in a room (rosaries, shards: pickups.json lying).
     BOSSES   [foe id, scene, check, act]: each boss of the completionist's list, its arena and whether
              it's beaten (a playerData flag, or its Journal entry listed), then the second fights
              it folds into one entry (BOSS_MORE), each with what the save keeps of it; act the
              first Act it can be fought in (the completionist's whichAct, BOSS_MORE's own).
     VENDORS  vendor id → its rooms (js/shop.js), Shakra's among them
     PEOPLE   npc id → its room: the people who give something of the 100%, and Scrounge, who
              buys the relics
     BELLS    [playerData field, scene]: the five Bellshrines
     KEYS     a key's save name (js/quests.js LOCKS) → its name, the game's */
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
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const SS = globalThis.SS;
const D = SS.data, J = SS.journal, E = SS.enemies, CO = SS.collectibles, SH = SS.shop, Q = SS.quests, H = SS.how;

const OUT = path.join(__dirname, '..', 'js', 'spots.js');
const PICKUPS = path.join(__dirname, '..', 'kb', 'data', 'game', 'pickups.json');
function fail(msg) { throw new Error('gen-spots: ' + msg); }
const P = JSON.parse(fs.readFileSync(PICKUPS, 'utf8'));
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
    // Abyss, the Drifter's Cloak from the Seamstress, the Faydown Cloak atop Mount Fay.
    'swift-step': ['hasDash', 'bone_east_05'], clawline: ['hasHarpoonDash', 'under_18'],
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
// is a flag with no room: each placed where the completionist's own sentence says it is.
const BOSS_ALIAS = { 'great conchflies': 'great-conchfly', 'raging conchfly': 'raging-conchfly' };
const HAND_EXTRA = {
  bonetownAspidBerryCollected: 'Bonetown', mosstownAspidBerryCollected: 'Mosstown_01',
  bonegraveAspidBerryCollected: 'Bonegrave', churchRhinoKilled: 'Bone_East_10_Church', silkFarmAbyssCoresCleared: 'Dust_11',
};
/* The pieces with no way of their own (js/how.js HOW lists those of the 100%'s counters), by the
   check's flag or wish: where the scene that sets it is (read in the game's scenes on
   28-Sep-2026: the cage of the Huge Flea, Kratt strung up in Greymoor, the wild troupe hunter by
   the Putrified Ducts' Bellway, the Architect's cylinder puzzle, the Last Conductor, the Flea
   Games at Fleatopia's festival, the Snail Shamans who take the Old Hearts). */
const HAND_PIECE = {
  tamedGiantFlea: 'Arborium_08', CaravanLechReturnedToCaravan: 'Greymoor_24', MetTroupeHunterWild: 'Bellway_Aqueduct',
  HasMelodyArchitect: 'Cog_09', HasMelodyConductor: 'Hang_12', 'Flea Games': 'Aqueduct_05_festival',
};
const EVERBLOOM = 'Tut_04';
// Bosses whose Journal entry is another's (the Raging Conchfly is the Great Conchfly fought alone),
// and the fights that aren't in their entry's first room: the first Moss Mother in Tut_03 (its
// Battle Scene; Tut_02 holds the Act 3 one, in the lower Moss Grotto), the Moss Mothers' pair in
// Weavenest Atla (where the Weavelight lies), Lace's second fight atop the Cradle's tower, the
// Savage Beastfly of the wish in the Far Fields (its boss scene's room).
const BOSS_ROOM = { 'raging-conchfly': 'Coral_27', 'moss-mother-ruined-chapel': 'Tut_03', 'lace-the-cradle': 'Song_Tower_01', 'moss-mother-weavenest-atla': 'Weave_03',
  'moss-mother-act-3-moss-grotto': 'Tut_02', 'savage-beastfly-far-fields': 'Bone_East_08' };
/* The fights the completionist folds into its boss's entry (its check is the first fight's), each
   with what the save keeps once it's won, read in the scene that fights it (11-Oct-2026): the
   flag Song_Tower_01's boss scene tests, Weave_03's Boss Scene bool, the Act 3 Moss Mother's own
   PersistentBoolItem (no ID: the game saves it by the object's name), the flag the Far Fields
   Beastfly's death sets. Then the first Act it can be fought in, from its wiki page: Lace atop
   the Cradle closes Act 2, the pair in Weavenest Atla guards the Weavelight (Act 1), the Far
   Fields Beastfly is its Act 2 wish's (the completionist's tasks.ts). */
const BOSS_MORE = [
  ['lace-the-cradle', ['flag', 'defeatedLaceTower'], 2],
  ['moss-mother-weavenest-atla', ['bool', 'Weave_03', 'Boss Scene'], 1],
  ['moss-mother-act-3-moss-grotto', ['bool', 'Tut_02', 'Mossbone Mother Ambient'], 3],
  ['savage-beastfly-far-fields', ['flag', 'defeatedBoneFlyerGiantGolemScene'], 2],
];
// Relics an NPC hands over: Jubilana's Choral Commandment, Grindle's Psalm Cylinder.
const RELIC_ROOM = { 'Seal Chit City Merchant': 'song_enclave', 'Psalm Cylinder Grindle': 'coral_42' };
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
const arena = (foe) => {
  if (BOSS_ROOM[foe]) return BOSS_ROOM[foe];
  const e = bookBy.get(foe) || bookBy.get(foe.replace(/-(the-cradle|far-fields|chapel-of-the-beast|weavenest-atla|coral-tower)$/, ''))
    || (foeOf.has(foe) && bookN.get(foeOf.get(foe).hj));
  const rooms = e && SS.journalRooms[e.key];
  return rooms ? (rooms.map(([s]) => s).find(onMap) || null) : null;
};
const BOSSES = [];
for (const it of C.load('bosses.ts')) {
  const foe = BOSS_ALIAS[norm(it.name)] || foeBy.get(norm(it.name)) || fail(`no foe named ${it.name}`);
  const scene = arena(foe);
  if (!scene) { unplaced.push('boss ' + foe); continue; }
  BOSSES.push([foe, scene, C.check(it.parsingInfo, fail), it.whichAct || fail(`${it.name} has no Act`)]);
}
for (const [foe, check, act] of BOSS_MORE) {
  if (!foeOf.has(foe) || BOSSES.some((b) => b[0] === foe)) fail(`BOSS_MORE: ${foe} isn't a foe of its own`);
  if (!onMap(arena(foe))) fail(`BOSS_MORE: ${foe}'s arena isn't on the map`);
  BOSSES.push([foe, arena(foe), check, act]);
}

/* ── The 100%: each thing's room, by its ways ── */
const quests = Q.FROM;
const wishScene = (quest) => { const f = quests[quest]; return f ? (f.board && onMap(f.board) ? f.board : (f.npc || []).find(onMap)) || null : null; };
function byWays(ways, found) {
  for (const w of ways || []) {
    let s = null;
    if (w.kind === 'found' || w.kind === 'craft') s = found();
    else if (w.kind === 'shop') s = w.vendor === 'shakra' ? 'Belltown' : personScene(w.vendor);   // Shakra: where she rests
    else if (w.kind === 'wish') s = wishScene(w.quest);
    else if (w.kind === 'boss') s = arena(w.foe);
    else if (['npc', 'challenge', 'fleas'].includes(w.kind)) s = personScene(w.npc);
    if (s && onMap(s)) return s;
  }
  return null;
}
const AT = { pieces: {}, tools: {}, crests: {}, skills: {}, arts: {} };
const put = (cat, id, scene, what) => { if (scene) { AT[cat][id] = scene; placed.push(what); } else unplaced.push(what); };
// Pieces: the room the check names first (what lies there), then the ways.
const OLD_HEARTS = { CollectedHeartFlower: 'Flower Heart', CollectedHeartCoral: 'Coral Heart', CollectedHeartHunter: 'Hunter Heart',
  CollectedHeartClover: 'Clover Heart', HasMelodyLibrarian: 'Librarian Melody Cylinder' };
CO.PIECES.forEach((p, i) => {
  const own = R.sceneOf(p[2]);
  // A piece sold with no counter of its own (js/shop.js SHOP gives it), from the vendor of the
  // earliest Act; one a wish gives (REWARDS), where the wish is taken.
  const sold = SH.SHOP.filter((x) => x.piece === i).sort((a, b) => (a.act || 0) - (b.act || 0)).map((x) => personScene(x.vendor)).find(onMap);
  const reward = Object.entries(SH.REWARDS).filter(([, r]) => [].concat(r).some((x) => x.piece === i)).map(([q]) => wishScene(q)).find(onMap);
  const s = onMap(own) ? own
    : HAND_PIECE[p[2][1]] ? HAND_PIECE[p[2][1]]
      : OLD_HEARTS[p[2][1]] ? lying(OLD_HEARTS[p[2][1]])[0] || null
        : byWays(H.HOW.pieces[i], () => null) || sold || reward || null;
  put('pieces', i, s, `piece ${i} ${p[0]} ${JSON.stringify(p[2])}`);
});
for (const ids of CO.COUNTED) {
  const id = ids[0], hand = HAND.tools[id];
  const s = hand ? chosen(hand[1], given(hand[0]), 'tool ' + id)
    : byWays(H.HOW.tools[id], () => ids.flatMap((x) => CO.TOOLS[x]).map((n) => lying(n)[0]).find(Boolean) || null);
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
  put('tools', id, s, 'tool ' + id);
}
for (const cat of ['crests', 'skills', 'arts']) {
  for (const id of Object.keys(CO.WHERE[cat])) {
    const hand = HAND[cat][id];
    const from = hand ? (cat === 'arts' ? (P.fields[hand[0]] || []).map(([s]) => s) : given(hand[0])) : [];
    const s = hand ? chosen(hand[1], from, cat + ' ' + id) : byWays(H.HOW[cat][id], () => null);
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
AT.everbloom = byWays(H.HOW.everbloom, () => null) || EVERBLOOM;
(AT.everbloom ? placed : unplaced).push('everbloom');

/* NEEDS: what a thing asks of Hornet first (the completionist's prereqs), as the abilities and
   Silk Skills the save tells (js/savefile.js ART_PD, SKILL_PD): key (the Map's: 'piece:<i>',
   'tools:<id>', 'extra:<i>'…) → [ability or skill id]. A prereq that isn't one (a key) is left out. */
const NEEDS = {};
const abilityBy = new Map([...D.ARTS, ...D.SKILLS].map((x) => [norm(x.name.en), x.id]));
const needs = (key, it) => {
  const ids = (it.prereqs || []).map((n) => abilityBy.get(norm(n))).filter(Boolean);
  if (ids.length) NEEDS[key] = ids;
};
/* The 100%'s prereqs: a piece by its check, a Tool by its name. */
const pieceAt = new Map(CO.PIECES.map((p, i) => [JSON.stringify(p[2]), i]));
for (const f of ['maskShards.ts', 'spoolFragments.ts', 'memoryLockets.ts', 'craftmetals.ts', 'paleOil.ts', 'fleas.ts', 'upgrades.ts', 'abilities.ts', 'tools.ts', 'crests.ts']) {
  for (const it of C.load(f)) {
    if (!it.prereqs) continue;
    const i = it.parsingInfo && pieceAt.get(JSON.stringify(C.check(it.parsingInfo, () => null)));
    const tool = D.TOOLS.find((x) => norm(x.name.en) === norm(it.name.split(' / ')[0]));
    const art = abilityBy.get(norm(it.name.replace(/\s*\(.*\)$/, '')));
    const key = i != null ? 'piece:' + i : tool ? 'tools:' + (CO.COUNTED.find((g) => g.includes(tool.id)) || [tool.id])[0]
      : art ? (D.ARTS.some((x) => x.id === art) ? 'arts:' : 'skills:') + art : null;
    if (key) needs(key, it);
  }
}

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
  if (c[0] === 'relic' || c[0] === 'memento') return RELIC_ROOM[c[1]] || lying(c[1])[0] || given(c[1]).find(onMap) || null;
  if (c[0] === 'any') for (const x of c.slice(1)) { const r = roomOfCheck(x); if (r) return r; }
  return null;
};
const extra = (kind, it, name) => {
  const c = C.check(it.parsingInfo, fail);
  /* A shell shard cache's int is its hits left (1 to 3 on the author's saves, 0 once broken, never
     -1): the completionist, whose caches are still a work in progress, gives it the rosary
     strings' -1 (emptied). */
  if (kind === 'shard-cache' && c[0] === 'int' && c[3] === -1) c[3] = 0;
  const s = kind === 'bellhome' ? BELLHOME : roomOfCheck(c);
  if (!s || !onMap(s)) { unplaced.push(`${kind} ${it.name}`); return; }
  needs('extra:' + EXTRAS.length, it);
  EXTRAS.push([kind, it.whichAct || 0, c, s, name]);
};
for (const sec of C.sections('relics.ts')) for (const it of sec.items) extra(RELIC_KIND[sec.name] || fail(`relic kind ${sec.name}`), it);
for (const it of C.load('mossberries.ts')) extra('mossberry', it);
for (const it of C.load('silkeaters.ts')) extra('silkeater', it);
for (const it of C.load('mementos.ts')) extra('memento', it, N.gameName(it.name) || undefined);
for (const it of C.load('bellhome.ts')) extra('bellhome', it, N.gameName(it.name) || { es: it.name, en: it.name, key: undefined });
for (const sec of C.sections('uniqueSpawns.ts')) for (const it of sec.items) extra('spawn', it, N.text(SPAWN_KIND[sec.name] || fail(`spawn kind ${sec.name}`)));
for (const sec of C.sections('cachesAndSecrets.ts')) for (const it of sec.items) extra(CACHE_KIND[sec.name] || fail(`cache kind ${sec.name}`), it);

/* What opens a way and stays open (pickups.json doors, from the game's scenes): levers and
   pressure plates, gates, doors a key opens, shortcuts and silk walls, each by the bool the save
   keeps once it's opened, after the completionist's (whose order js/map-fixes.js keys by). One
   already there under the same check (a one-way wall among the breakable walls) isn't twice. */
const DOOR_KINDS = ['lever', 'plate', 'gate', 'lock', 'shortcut', 'silkwall'];
const SCENE_AT = new Map();
{
  const doors = P.doors || fail('pickups.json has no doors: run tools/extract-pickups.py again');
  const had = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
  for (const kind of DOOR_KINDS) {
    for (const [scene, id, x, y] of doors[kind] || fail(`pickups.json has no ${kind}`)) {
      const c = ['bool', scene, id], k = JSON.stringify(c).toLowerCase();
      if (had.has(k)) continue;
      if (!onMap(scene)) { unplaced.push(`${kind} ${scene} ${id}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      EXTRAS.push([kind, 0, c, scene]);
    }
  }
}

/* The area maps, after the doors: each of the 28 Has<Area>Map flags (MAPS) where it's had, with no
   Act of its own (null). Shakra sells 14 (js/shop.js SHOP: its price, the game's name for it),
   each marked at her spot in that map's area whose scripts set a SeenMapper<Area> flag (her stock
   opens with them; Shellwood_01's and Greymoor_08's set none); the Mosslands have no spot of hers,
   and their map is sold from the start: where she's first met, in the Marrow (MAP_SHAKRA). The
   other 14 are had in a room (pickups.json maps: a fake collectable that sets the flag, its words
   the name the game shows on getting it), marked where the game gives it: a map lying there or on
   a sign (CollectableItemPickup), or a Citadel map machine (its FSM); the Choral Chambers' and the
   Cradle's in two rooms each (two machines; the Cradle's machine and Ventrica's Terminus), so a
   mark in each. Each
   ['map', null, ['flag', Has<Area>Map], scene, name, { shop: 'shakra', price } or { found: true }]. */
const MAP_SHAKRA = { MossGrotto: 'bone_04' };
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
      for (const scene of scenes) {
        LATE_XY.set(EXTRAS.length, () => entryAt((P.items[f.item] || {}).at, scene));
        EXTRAS.push(['map', null, ['flag', flag], scene, N.text(f.key || fail(`${f.item} has no words`)), { found: true }]);
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
{
  const had = new Set(EXTRAS.map((x) => JSON.stringify(x[2]).toLowerCase()));
  for (const [id, save, cur] of CO.PURSE) {
    const item = D.ITEMS.find((x) => x.id === id) || fail(`no item ${id}`);
    for (const [scene, bid, x, y] of (P.lying || fail('pickups.json has no lying: run tools/extract-pickups.py again'))[save] || []) {
      const c = ['bool', scene, bid], k = JSON.stringify(c).toLowerCase();
      if (had.has(k) || PRIZE.test(bid)) continue;
      if (!onMap(scene)) { unplaced.push(`${id} ${scene} ${bid}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      EXTRAS.push([cur === 'rosaries' ? 'rosaries' : 'shards', null, c, scene, item.name, { item: id }]);
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
              again as she leaves), the glow rims and the sound regions aren't a hidden place.
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
      if (had.has(k)) continue;
      if (!onMap(scene)) { unplaced.push(`${kind} ${scene} ${id}`); continue; }
      had.add(k);
      if (typeof x === 'number') SCENE_AT.set(EXTRAS.length, [x, y]);
      EXTRAS.push([as, null, c, scene]);
    }
  }
  const rooms = new Map();
  for (const [scene, id, type, x, y] of kept.hidden || fail('pickups.json has no hidden')) {
    if (type !== 'bool' || NOT_HIDDEN.test(id) || !onMap(scene)) continue;
    if (!rooms.has(scene)) rooms.set(scene, []);
    if (!rooms.get(scene).some((r) => r[0] === id)) rooms.get(scene).push([id, x, y]);
  }
  for (const [scene, list] of rooms) {
    const pts = list.filter((r) => typeof r[1] === 'number');
    if (pts.length) SCENE_AT.set(EXTRAS.length, [pts.reduce((a, r) => a + r[1], 0) / pts.length, pts.reduce((a, r) => a + r[2], 0) / pts.length]);
    const bools = list.map(([id]) => ['bool', scene, id]);
    EXTRAS.push(['masked', null, bools.length > 1 ? ['all', ...bools] : bools[0], scene]);
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

/* ── The Bellshrines and the keys ── */
/* Each Bellshrine's room: the two whose flag a scene names (Far Fields' in Bellshrine_05, Bellhart's
   in Widow's arena, where its bell is rung), and the other three by their area (js/map.js). */
const BELL_HAND = { bellShrineBoneForest: 'Bellshrine', bellShrineWilds: 'Bellshrine_05', bellShrineGreymoor: 'Bellshrine_02',
  bellShrineBellhart: 'Belltown_Shrine', bellShrineShellwood: 'Bellshrine_03' };
const BELLS = Q.BELLSHRINES.map((b) => {
  const s = BELL_HAND[b.field] || fail(`no room for ${b.field}`);
  const named = (P.fields[b.field] || []).map(([x]) => x);
  if (named.length && !named.includes(s.toLowerCase())) fail(`${b.field} is named in ${named.join(', ')}, not ${s}`);
  if (!onMap(s)) fail(`${s} isn't on the map`);
  return [b.field, s];
});
const KEY_TEXT = { 'Simple Key': 'INV_NAME_TOKEN_FAITH', 'Belltown House Key': 'INV_NAME_BELL_HOUSE_KEY', 'Dock Key': 'INV_NAME_DOCK_KEY',
  'Ward Key': 'INV_NAME_WARD_KEY', 'Ward Boss Key': 'INV_NAME_WARD_BOSS_KEY', 'Dock Demo Key': 'INV_NAME_DOCK_DEMO_KEY',
  'Architect Key': 'INV_NAME_ARCHITECT_KEY' };
const KEYS = {};
for (const k of Object.keys(Q.LOCKS)) KEYS[k] = N.text(KEY_TEXT[k] || fail(`no text for the key ${k}`));

/* ── Where in its room: each thing's point on the map ──
   The game places a point of a scene on its room's drawing by the scene's size (its tk2dTileMap,
   pickups.json sizes): x / width across the drawing, y / height up it. Checked on the benches:
   each RestBench, placed so, has to fall by the bench pin the map itself draws (js/map.js PINS). */
const M = SS.map;
const ROOM_OF = new Map(Object.entries(M.ROOMS).map(([k, r]) => [k.toLowerCase(), r]));
function toMap(scene, x, y) {
  const r = ROOM_OF.get(String(scene).toLowerCase()), size = P.sizes[String(scene).toLowerCase()];
  if (!r || !r[2] || !size || x == null || y == null) return null;
  const px = r[0] + (x / size[0]) * r[2], py = r[1] + (1 - y / size[1]) * r[3];
  // A point well outside its room's drawing is something parked off the scene: not used.
  const out = Math.max(r[0] - px, px - r[0] - r[2], 0) + Math.max(r[1] - py, py - r[1] - r[3], 0);
  return out > 12 ? null : [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
}
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
const itemAt = (save, scene) => entryAt((P.items[save] || {}).at, scene, (e) => LYING.test(e[1])) || entryAt((P.items[save] || {}).at, scene);
const objectAt = (c) => {
  if (!Array.isArray(c)) return null;
  if (c[0] === 'any') { for (const x of c.slice(1)) { const p = objectAt(x); if (p) return p; } return null; }
  if (!['bool', 'int', 'geo'].includes(c[0])) return null;
  const o = (P.objects[lower(c[1])] || {})[c[2]];
  return o && o.length ? toMap(c[1], o[0], o[1]) : null;
};
const XY = {};
const put2 = (key, p) => { if (p) XY[key] = p; };
CO.PIECES.forEach((p, i) => {
  const scene = AT.pieces[i];
  put2('piece:' + i, objectAt(p[2]) || (OLD_HEARTS[p[2][1]] ? itemAt(OLD_HEARTS[p[2][1]], scene) : null));
});
for (const ids of CO.COUNTED) {
  const id = ids[0], scene = AT.tools[id], hand = HAND.tools[id];
  put2('tools:' + id, hand ? entryAt((P.items[hand[0]] || {}).at, scene) : ids.flatMap((x) => CO.TOOLS[x]).map((n) => itemAt(n, scene)).find(Boolean));
}
for (const id of OTHER_TOOLS) {
  const scene = AT.tools[id], hand = OTHER_HAND[id];
  put2('tools:' + id, hand ? entryAt((P.items[hand[0]] || {}).at, scene) : CO.TOOLS[id].map((n) => itemAt(n, scene)).find(Boolean));
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
for (const [id, obj] of Object.entries(PEOPLE_OBJ)) put2('person:' + id, entryAt(P.npcs[obj], PEOPLE[id]));
for (const [field, scene] of BELLS) { const b = P.benches[lower(scene)]; put2('bell:' + field, b && toMap(scene, b[0], b[1])); }
for (const [quest, f] of Object.entries(Q.FROM)) {
  if (f.board) put2('board:' + lower(f.board), entryAt(P.npcs['Quest Board Pivot'], f.board));
}
console.log(`${Object.keys(XY).length} things with their own point in their room`);

/* ── The wishes and the main objectives (TASKS), from kb/data/game/wishes.json ──
   (tools/extract-wishes.py, the game's own files; design/03-redesign.md, step 6, Albert's choice)
     qitem  what a wish asks for, where it lies (a pickup, the flower that gives it, the Flintbeetle
            that drops it, the spots the Silver Bells drop at) or who gives it: done once its
            sceneData flag is set, it's held, or its wish is done (a drop spot: its wish only)
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
const TASKS = [];
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
  const task = (kind, quest, check, scene, x, y, icon, name, pick) => {
    if (!onMap(scene)) { unplaced.push(`${kind} ${quest} ${scene}`); return; }
    const i = TASKS.length;
    TASKS.push([kind, quest, check, proper(scene) || scene, icon, name || null, steel(quest), pick || null]);
    const p = x == null ? null : Array.isArray(x) ? x : toMap(scene, x, y);
    if (p) XY['task:' + i] = p;
  };
  // What a wish asks for.
  const wants = (save) => WISH_OF[save] ? [WISH_OF[save]] : Object.keys(WI.quests).filter((q) => !WI.quests[q].main && WI.quests[q].targets.includes(save));
  for (const [save, at] of Object.entries(WI.items)) {
    const q = wants(save).find(isWish) || fail(`no wish asks for ${save}`);
    const name = N.text(WI.names[save] || fail(`no name for ${save}`)), icon = art('icons/' + WI.icons[save]);
    const seen = new Set();
    for (const [scene, comp, obj, flag, x, y] of at) {
      const one = scene + (flag || obj);
      if (seen.has(one)) continue;   // the Crown Fragment lies twice in its room, under one flag
      seen.add(one);
      // A spot where it drops by chance (the Silver Bells'): done with its wish, a bell held says
      // nothing of the other spots.
      const check = comp === 'QuestDropper' ? ['quest', q]
        : ['any', ...(flag && proper(scene) ? [['bool', proper(scene), flag]] : []), ['held', save], ['quest', q]];
      task('qitem', q, check, scene, x, y, icon, name);
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
  const inRoom = ([px, py]) => Object.entries(M.ROOMS).filter(([, r]) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3])
    .sort(([, a], [, b]) => a[2] * a[3] - b[2] * b[3]).map(([s]) => s)[0];
  const byItem = (save) => Object.keys(WI.quests).find((q) => WI.quests[q].targets.includes(save));
  const pinned = new Set();
  for (const [, sprite, quest, item, target, wx, wy] of WI.pins) {
    const q = quest || byItem(item);
    const info = WI.quests[q];
    if (!info) continue;   // a step of a main objective (an Old Heart, a Melody): a piece of the 100%
    const p = [Math.round((wx - ox) * M.PPU * 10) / 10, Math.round((oy - wy) * M.PPU * 10) / 10];
    const scene = target || inRoom(p);
    if (!scene) { unplaced.push(`pin ${q}`); continue; }
    if (info.main) {
      if (sprite === 'quest_map_icon_songshrines') continue;   // the Bellshrines' layer
      const later = [...(LATER[q] || [])];
      for (let grow = true; grow;) {   // every main objective that comes after it
        grow = false;
        for (const [n, c] of Object.entries(Q.CHAIN)) if (c.main && (c.prev === q || later.includes(c.prev)) && !later.includes(n)) { later.push(n); grow = true; }
      }
      task('goal', q, ['any', ['quest', q], ...later.map((n) => ['quest', n])], scene, p, null, art('pins/' + sprite));
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
  const n = (k) => TASKS.filter((x) => x[0] === k).length;
  console.log(`tasks: ${n('qitem')} wish items, ${n('wspot')} places where a wish is done, ${n('goal')} objective pins`);
}

const size = write(OUT, `js/spots.js — where the Map draws each thing, and what it shows beyond the 100%.
   GENERATED by tools/gen-spots.js from the site's data, kb/data/completionist/ and
   kb/data/game/pickups.json and wishes.json (tools/extract-pickups.py, tools/extract-wishes.py,
   the game's own files): not edited by hand.
   Change the generator and run npm run data. Scenes as the game names them (js/rooms.js places
   them in either case).

     AT       { pieces: { PIECES index: scene }, tools: { COUNTED group's first id, and the six
              outside the 100%: scene }, crests, skills, arts: { id: scene }, everbloom: scene,
              act: { key: Act } for what's outside the 100% and js/collectibles.js WHERE lacks }:
              where each thing of the 100% is had (its pickup, its vendor, its Wishwall, its
              boss's arena, its giver)
     EXTRAS   [kind, act, check, scene, name?, more?]: what doesn't count (relics by kind, mossberry,
              silkeater, memento, bellhome, spawn, rosary-cache, shard-cache, wall, then lever,
              plate, gate, lock, shortcut, silkwall from the game's scenes, then map, rosaries,
              shards); act null when the thing has no Act of its own; more { shop, price } for a
              map Shakra sells, { found } for one found, { item } for what lies; check as
              js/collectibles.js's, plus ['relic', name], ['memento', name], ['int', scene, id,
              value] and ['geo', scene, id]
     BOSSES   [foe id, scene, check, act]: each boss fight's arena, whether it's beaten and the
              first Act it can be fought in
     VENDORS  vendor id → the rooms it sells in; PEOPLE  npc id → its room
     BELLS    [playerData field, scene]: the five Bellshrines
     KEYS     a lock's key (js/quests.js LOCKS) → its name
     MAPS     a map's flag (Has<X>Map, without Has and Map) → the area it draws
     NEEDS    a thing's key ('piece:<i>', 'tools:<id>', 'arts:<id>', 'extra:<i>'…) → the abilities
              and Silk Skills it asks for first (the completionist's prereqs)
     TASKS    [kind, quest, check, scene, picture, name?, mode?, steel?]: the wishes and the main
              objectives (kind 'qitem' what a wish asks for, 'wspot' where a wish is done, 'goal' a
              main objective's pin), quest its save name (js/quests.js), check as EXTRAS' plus
              ['held', collectable] and ['steel', scene] (a Steel Sentinel spot seen), picture
              under assets/map/, name the thing's (a wish's and an objective's are the quest's),
              mode 'steel' when only Steel Soul has it, steel the spot's scene when the save
              chooses it (SteelQuestSpots)
     XY       a thing's key (as NEEDS, and 'person:<id>', 'board:<scene>', 'bell:<field>', 'task:<i>') → its
              point on the map, in the image's pixels: where the game has it in its room (the
              object's place in the scene, over the scene's size, on the room's drawing)`,
'spots', [['AT', AT], ['EXTRAS', EXTRAS], ['BOSSES', BOSSES], ['VENDORS', VENDORS], ['PEOPLE', PEOPLE], ['BELLS', BELLS], ['KEYS', KEYS], ['MAPS', MAPS], ['NEEDS', NEEDS], ['TASKS', TASKS], ['XY', XY]]);
const kinds = {};
for (const x of EXTRAS) kinds[x[0]] = (kinds[x[0]] || 0) + 1;
console.log(`js/spots.js  ${placed.length} things of the 100% placed, ${EXTRAS.length} extras (${Object.entries(kinds).map(([k, n]) => n + ' ' + k).join(', ')}), `
  + `${BOSSES.length} bosses, ${Object.keys(NEEDS).length} with prereqs  (${size} bytes)`);
if (unplaced.length) console.log(`not placed (${unplaced.length}): ${unplaced.join('; ')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
