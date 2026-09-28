#!/usr/bin/env node
/* tools/gen-spots.js — generates js/spots.js: where the Map draws each thing (npm run data runs it
   after tools/gen-how.js). Offline: it reads the site's generated data (js/collectibles.js,
   js/how.js, js/shop.js, js/quests.js, js/journal-rooms.js, js/enemies.js), kb/data/completionist/
   and kb/data/game/pickups.json (tools/extract-pickups.py, from the game's own files).

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
              the check names, or the pickup's (relics, Mementos), or HAND_EXTRA's.
     BOSSES   [foe id, scene, check]: each boss of the completionist's list, its arena and whether
              it's beaten (a playerData flag, or its Journal entry listed).
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
  },
  tools: {
    // The craft pickups (Craft Pickup).
    cogfly: ['Cogwork Flier', 'hang_09'], pimpillo: ['Pimpilo', 'wisp_06'],
  },
};
/* The people (by js/how.js NPCS id, and Scrounge) and the object that stands for them in the
   game's scenes (pickups.json npcs); Plinney's has no name of its own there, so his room is the
   one his wish is offered in (js/quests.js FROM, A Pinsmith's Tools). */
const PEOPLE_OBJ = {
  eva: 'Crest Upgrade Shrine', pinstress: 'Pinstress Interior NPC', loddie: 'Ladybug Craft Pickup', lumble: 'Dice Pilgrim',
  mooshka: 'Caravan Troupe Leader Fleatopia NPC', scrounge: 'Relic Dealer NPC',
};
const PEOPLE_ROOM = { plinney: 'Belltown_Room_pinsmith' };
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
// Bosses whose Journal entry is another's (the Raging Conchfly is the Great Conchfly fought alone).
const BOSS_ROOM = { 'raging-conchfly': 'Coral_27' };
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
const foeBy = new Map(E.FOES.map((f) => [norm(f.name.en), f.id]));
const bookBy = new Map(J.BOOK.map((e) => [e.id, e]));
const arena = (foe) => {
  if (BOSS_ROOM[foe]) return BOSS_ROOM[foe];
  const e = bookBy.get(foe) || bookBy.get(foe.replace(/-(the-cradle|far-fields|chapel-of-the-beast|weavenest-atla|coral-tower)$/, ''));
  const rooms = e && SS.journalRooms[e.key];
  return rooms ? (rooms.map(([s]) => s).find(onMap) || null) : null;
};
const BOSSES = [];
for (const it of C.load('bosses.ts')) {
  const foe = BOSS_ALIAS[norm(it.name)] || foeBy.get(norm(it.name)) || fail(`no foe named ${it.name}`);
  const scene = arena(foe);
  if (!scene) { unplaced.push('boss ' + foe); continue; }
  BOSSES.push([foe, scene, C.check(it.parsingInfo, fail)]);
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
for (const cat of ['crests', 'skills', 'arts']) {
  for (const id of Object.keys(CO.WHERE[cat])) {
    const hand = HAND[cat][id];
    const from = hand ? (cat === 'arts' ? (P.fields[hand[0]] || []).map(([s]) => s) : given(hand[0])) : [];
    const s = hand ? chosen(hand[1], from, cat + ' ' + id) : byWays(H.HOW[cat][id], () => null);
    put(cat, id, s, cat + ' ' + id);
  }
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

const size = write(OUT, `js/spots.js — where the Map draws each thing, and what it shows beyond the 100%.
   GENERATED by tools/gen-spots.js from the site's data, kb/data/completionist/ and
   kb/data/game/pickups.json (tools/extract-pickups.py, the game's own files): not edited by hand.
   Change the generator and run npm run data. Scenes as the game names them (js/rooms.js places
   them in either case).

     AT       { pieces: { PIECES index: scene }, tools: { COUNTED group's first id: scene },
              crests, skills, arts: { id: scene }, everbloom: scene }: where each thing of the
              100% is had (its pickup, its vendor, its Wishwall, its boss's arena, its giver)
     EXTRAS   [kind, act, check, scene, name?]: what doesn't count (relics by kind, mossberry,
              silkeater, memento, bellhome, spawn, rosary-cache, shard-cache, wall); check as
              js/collectibles.js's, plus ['relic', name], ['memento', name], ['int', scene, id,
              value] and ['geo', scene, id]
     BOSSES   [foe id, scene, check]: each boss's arena and whether it's beaten
     VENDORS  vendor id → the rooms it sells in; PEOPLE  npc id → its room
     BELLS    [playerData field, scene]: the five Bellshrines
     KEYS     a lock's key (js/quests.js LOCKS) → its name
     MAPS     a map's flag (Has<X>Map, without Has and Map) → the area it draws
     NEEDS    a thing's key ('piece:<i>', 'tools:<id>', 'arts:<id>', 'extra:<i>'…) → the abilities
              and Silk Skills it asks for first (the completionist's prereqs)`,
'spots', [['AT', AT], ['EXTRAS', EXTRAS], ['BOSSES', BOSSES], ['VENDORS', VENDORS], ['PEOPLE', PEOPLE], ['BELLS', BELLS], ['KEYS', KEYS], ['MAPS', MAPS], ['NEEDS', NEEDS]]);
const kinds = {};
for (const x of EXTRAS) kinds[x[0]] = (kinds[x[0]] || 0) + 1;
console.log(`js/spots.js  ${placed.length} things of the 100% placed, ${EXTRAS.length} extras (${Object.entries(kinds).map(([k, n]) => n + ' ' + k).join(', ')}), `
  + `${BOSSES.length} bosses, ${Object.keys(NEEDS).length} with prereqs  (${size} bytes)`);
if (unplaced.length) console.log(`not placed (${unplaced.length}): ${unplaced.join('; ')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
