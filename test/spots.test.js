/* test/spots.test.js — the Map's places (js/spots.js): every thing of the 100% has a room on the
   map, every extra and boss too, and a save reads what the Map shows of it (the rooms visited,
   the maps bought, the cocoon, the extras had and the bosses beaten), kept through a slot. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const CO = require('../js/collectibles.js');
const SP = require('../js/spots.js');
const R = require('../js/rooms.js');
const Q = require('../js/quests.js');
const F = require('../js/savefile.js');
const D = globalThis.SS.data;

const onMap = (scene) => !!(scene && R.roomOf(scene));

test('every piece, Tool, Crest, Silk Skill, ability and the Everbloom has a room on the map', () => {
  CO.PIECES.forEach((p, i) => assert.ok(onMap(SP.AT.pieces[i]), `piece ${i} (${p[0]}) has no room`));
  for (const ids of CO.COUNTED) assert.ok(onMap(SP.AT.tools[ids[0]]), `Tool ${ids[0]} has no room`);
  for (const cat of ['crests', 'skills', 'arts']) for (const id of Object.keys(CO.WHERE[cat])) assert.ok(onMap(SP.AT[cat][id]), `${cat} ${id} has no room`);
  assert.ok(onMap(SP.AT.everbloom));
});

test('the extras, bosses, people and Bellshrines are all on the map, with a check the save reads', () => {
  const kinds = new Set(['bone-scroll', 'weaver-effigy', 'choral-commandment', 'rune-harp', 'psalm-cylinder', 'arcane-egg', 'mossberry', 'silkeater',
    'memento', 'bellhome', 'spawn', 'rosary-cache', 'shard-cache', 'wall', 'lever', 'plate', 'gate', 'lock', 'shortcut', 'silkwall', 'map', 'rosaries', 'shards',
    'key', 'keyitem', 'bead', 'silk-cocoon', 'lift', 'masked', 'eva']);
  const checks = new Set(['bool', 'flag', 'min', 'quest', 'visited', 'journal', 'relic', 'memento', 'int', 'geo', 'any', 'all', 'crest', 'accepted']);
  for (const [kind, , check, scene] of SP.EXTRAS) {
    assert.ok(kinds.has(kind), kind);
    assert.ok(checks.has(check[0]), check[0]);
    assert.ok(onMap(scene), `${kind} ${JSON.stringify(check)}: ${scene} isn't on the map`);
  }
  for (const [foe, scene] of SP.BOSSES) assert.ok(onMap(scene), `boss ${foe}`);
  for (const scene of Object.values(SP.PEOPLE)) assert.ok(onMap(scene), scene);
  assert.equal(SP.BELLS.length, Q.BELLSHRINES.length + 1);   // the Songclave's sixth is the Map's only
  for (const [, scene] of SP.BELLS) assert.ok(onMap(scene), scene);
  for (const k of Object.keys(Q.LOCKS)) assert.ok(SP.KEYS[k] && SP.KEYS[k].es && SP.KEYS[k].en, k);
  assert.equal(Object.keys(SP.MAPS).length, 28);
  for (const area of Object.values(SP.MAPS)) assert.ok(CO.AREAS[area], area);
});

test('each boss fight is a mark of its own: the first fight by its name, the second ones in their arenas', () => {
  const ids = SP.BOSSES.map((b) => b[0]);
  assert.equal(new Set(ids).size, ids.length);
  const at = Object.fromEntries(SP.BOSSES.map((b) => [b[0], b[1]]));
  // The completionist's entry is the first fight (its check: defeatedMossMother, defeatedLace1).
  assert.equal(at['moss-mother-ruined-chapel'], 'Tut_03');
  assert.equal(at.lace, 'Bone_East_12');
  assert.equal(at['savage-beastfly-chapel-of-the-beast'], 'Ant_19');
  assert.deepEqual(['lace-the-cradle', 'moss-mother-weavenest-atla', 'moss-mother-act-3-moss-grotto', 'savage-beastfly-far-fields'].map((f) => at[f]),
    ['Song_Tower_01', 'Weave_03', 'Tut_02', 'Bone_East_08']);
  // What a second fight gives is had in its arena: the Weavelight, the Silk Heart Lace leaves.
  assert.equal(SP.AT.tools.weavelight.toLowerCase(), 'weave_03');
  // What a boss only opens the way to is where the game has it, not in the arena: Cling Grip's
  // shrine is the room past Sister Splinter's, the Conchcutter lies inside the Coral Tower.
  assert.equal(SP.AT.arts['cling-grip'].toLowerCase(), 'shellwood_10');
  assert.equal(SP.AT.tools.conchcutter.toLowerCase(), 'coral_tower_01');
  // A boss in several rooms is in the one it's fought in: Moorwing at Bellhart's east entrance (not
  // its Act 2 rematch by the Bellway), the Second Sentinel in its High Halls arena, where the
  // Reserve Bind it gives lies (not at the Wishwall of its wish).
  assert.equal(at.moorwing, 'greymoor_08_boss');
  assert.equal(at['second-sentinel'], 'Hang_17b');
  assert.equal(SP.AT.tools['reserve-bind'].toLowerCase(), 'hang_17b');
  // A boss scene loaded over its room has the boss's own point in it.
  for (const f of ['moorwing', 'bell-beast', 'fourth-chorus', 'the-unravelled']) assert.ok(SP.XY['boss:' + f], f);
  // A Memento the game has in several rooms is with who gives it: Lost Garmond's arena, Seth's festival.
  const memento = (n) => SP.EXTRAS.find((x) => x[2][0] === 'memento' && x[2][1] === n)[3];
  assert.equal(memento('Memento Garmond'), 'coral_33');
  assert.equal(memento('Memento Seth'), 'aqueduct_05_festival');
  // The Journal's entries where the enemy is, and Shakra on guard inside her room, not under it.
  assert.ok(Object.keys(SP.XY).filter((k) => k.startsWith('journal:')).length > 150);
  const g8 = SS.map.ROOMS.Greymoor_08, [sx, sy] = SP.XY[`shakra:${SP.VENDORS.shakra.indexOf('greymoor_08')}`];
  assert.ok(sx >= g8[0] && sx <= g8[0] + g8[2] && sy >= g8[1] && sy <= g8[1] + g8[3]);
  const heart = CO.PIECES.findIndex((p, i) => p[0] === 'silk-heart' && SP.AT.pieces[i] === 'Song_Tower_01');
  assert.ok(heart >= 0);
  // The Summoned Saviour is fought in Act 2 (its wish, Steel Sentinel Pt2, is an Act 2 wish), not
  // in the completionist's Act 3: the author's Steel Soul game beat it before the world was threaded.
  const actOf = Object.fromEntries(SP.BOSSES.map((b) => [b[0], b[3]]));
  assert.equal(actOf['summoned-saviour'], 2);
  assert.equal(CO.WISHES.find((w) => JSON.stringify(w[2]) === '["quest","Steel Sentinel Pt2"]')[1], 2);
});

test('what opens a way comes after the completionist\'s extras, each a bool of its own the save keeps', () => {
  const DOORS = new Set(['lever', 'plate', 'gate', 'lock', 'shortcut', 'silkwall']);
  // Bone_12's two cell doors, struck open (pickups.json doors breakable), are breakable walls among them.
  const door = (x) => DOORS.has(x[0]) || (x[0] === 'wall' && /^jail_door/.test(x[2][2] || ''));
  const first = SP.EXTRAS.findIndex(door), after = SP.EXTRAS.findIndex((x, i) => i > first && !door(x));
  assert.ok(first > 0 && after > first && SP.EXTRAS.slice(first, after).every(door), 'appended, never among the others (js/map-fixes.js keys by place)');
  assert.equal(SP.EXTRAS.slice(first, after).filter((x) => x[0] === 'wall').length, 2, 'the two cell doors');
  const LATER = new Set(['map', 'rosaries', 'shards', 'key', 'keyitem', 'bead', 'silk-cocoon', 'lift', 'masked', 'eva']);
  // After them, only the maps and what came after them, the ways kept in playerData (a flag each) and,
  // the doors a key opens no mark had (kb/data/game/gating.json receptacles: Ward_01's) and, last of
  // all, what the completionist's list lacks of the game's own: Dock_01's two rosary strings, Under_20's Silkeater.
  const tail = SP.EXTRAS.length - SP.EXTRAS.slice().reverse().findIndex((x) => !['rosary-cache', 'silkeater'].includes(x[0]));
  const ids = (c) => (c[0] === 'any' ? ids(c[1]) : c[1] + ' ' + c[2]);
  assert.deepEqual(SP.EXTRAS.slice(tail).map((x) => x[0] + ' ' + ids(x[2])),
    ['rosary-cache Dock_01 rosary_string_medium', 'rosary-cache Dock_01 rosary_string_small_half', 'silkeater Under_20 Silk Grub Large Cocoon']);
  const last = tail - SP.EXTRAS.slice(0, tail).reverse().findIndex((x) => !(x[0] === 'lock'));
  assert.ok(SP.EXTRAS.slice(after, last).every((x) => LATER.has(x[0]) || (DOORS.has(x[0]) && x[2][0] === 'flag')), 'only the maps and what came after them');
  // What opens a way that the save keeps in playerData: a flag each, once.
  const pd = SP.EXTRAS.slice(after, last).filter((x) => DOORS.has(x[0]));
  assert.ok(pd.length > 10, 'the playerData ways');
  assert.equal(new Set(pd.map((x) => x[2][1])).size, pd.length);
  const seen = new Set();
  for (const [kind, , check] of SP.EXTRAS.slice(first, after)) {
    // Its own bool, or that bool and what the save keeps instead (test/save-checks.test.js, 2 A).
    assert.ok(check[0] === 'bool' || (check[0] === 'any' && check[1][0] === 'bool'), kind);
    const k = JSON.stringify(check[0] === 'bool' ? check : check[1]).toLowerCase();
    assert.ok(!seen.has(k), `${kind} ${JSON.stringify(check)} twice`);
    seen.add(k);
  }
  const n = (kind) => SP.EXTRAS.filter((x) => x[0] === kind).length;
  assert.ok(n('lever') > 50 && n('gate') > 20 && n('lock') > 10 && n('silkwall') >= 2, 'the scenes gave fewer than they did');
});

test('each area map is a mark where it\'s had, by its flag: Shakra\'s spot in its area, or where it lies', () => {
  const maps = SP.EXTRAS.filter((x) => x[0] === 'map');
  assert.deepEqual([...new Set(maps.map((x) => x[2][1]))].sort(), Object.keys(SP.MAPS).map((a) => 'Has' + a + 'Map').sort());
  for (const [, act, check, scene, name, how] of maps) {
    assert.equal(check[0], 'flag');
    // No Act of its own but the Cradle's two, and the two lying where only Act 3 goes (the Abyss's, Verdania's).
    assert.equal(act, check[1] === 'HasCradleMap' ? (how.found ? 3 : 2) : ['HasAbyssMap', 'HasCloverMap'].includes(check[1]) ? 3 : null, check[1]);
    assert.ok(name && name.es && name.en && name.key, check[1]);
    assert.ok(how.found || ((how.shop === 'shakra' || how.machine) && how.price > 0), check[1]);
    // Bought where Shakra sits in the map's own area (the Mosslands' from her first spot, in the Marrow).
    if (how.shop) assert.ok(SP.VENDORS.shakra.includes(scene) && (R.areaOf(scene) === SP.MAPS[check[1].slice(3, -3)] || check[1] === 'HasMossGrottoMap'), `${check[1]} at ${scene}`);
  }
  assert.equal(new Set(maps.filter((x) => x[5].found || x[5].machine).map((x) => x[2][1])).size, 14);
  // The Citadel's map machines sell theirs (70 rosaries, the Grand Gate's 40): not found.
  const sold = (flag) => maps.filter((x) => x[2][1] === flag).map((x) => x[5].machine && x[5].price);
  assert.deepEqual(sold('HasHallsMap'), [70, 70]);
  assert.deepEqual(sold('HasSongGateMap'), [40]);
  // Albert's case: the Cradle Map, bought from its machine in Act 2 (gone once Act 3 begins), then
  // found free in Tube_Hub, by the broken machine, only in Act 3.
  const cradle = maps.filter((x) => x[2][1] === 'HasCradleMap').map((x) => [x[1], x[3], x[5]]);
  assert.deepEqual(cradle, [[2, 'cradle_02', { machine: true, price: 70, gone: 'act3' }], [3, 'tube_hub', { found: true }]]);
  assert.equal(new Set(maps.filter((x) => x[5].shop).map((x) => x[2][1])).size, 14);
  // Albert's case: the Weavenest Atla Map lies in Weavenest Atla.
  const weave = maps.find((x) => x[2][1] === 'HasWeavehomeMap');
  assert.ok(weave[5].found && R.areaOf(weave[3]) === 'WEAVE_PRIME' && weave[4].en === 'Weavenest Atla Map', JSON.stringify(weave));
  // A map had in two rooms is a mark in each: the save's flag has both, and a slot keeps both.
  const halls = SP.EXTRAS.map((x, i) => (x[0] === 'map' && x[2][1] === 'HasHallsMap' ? i : -1)).filter((i) => i >= 0);
  assert.equal(halls.length, 2);
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, HasHallsMap: true };
  assert.deepEqual(F.game(pd).extras, halls);
  assert.deepEqual(F.gameOf(F.toSnapshot(pd)).extras, halls);
  // The rosaries and shards lying in a room: their pickup's bool, and the item they are; the ones
  // given (the Fixer's Statuette, the Sprintmaster's two prizes) by the playerData field the giving sets.
  const purse = new Map(CO.PURSE.map((p) => [p[0], p[2]]));
  const lying = SP.EXTRAS.filter((x) => x[0] === 'rosaries' || x[0] === 'shards');
  assert.ok(lying.length > 40, 'the scenes gave fewer than they did');
  const given = [];
  for (const [kind, , check, scene, , how] of lying) {
    assert.equal(purse.get(how.item), kind, how.item);
    if (check[0] !== 'bool') given.push([how.item, scene, check]);
  }
  assert.deepEqual(given, [
    ['hornet-statuette', 'Bonetown', ['flag', 'fixerStatueConvo']],
    ['rosary-necklace', 'Sprintmaster_Cave', ['min', 'SprintMasterCurrentRace', 1]],
    ['beast-shard', 'Sprintmaster_Cave', ['min', 'SprintMasterCurrentRace', 2]],
  ]);
  const at = (c) => SP.EXTRAS.findIndex((x) => JSON.stringify(x[2]) === JSON.stringify(c));
  assert.deepEqual(F.game({ silk: 0, silkMax: 9, maxHealth: 5, SprintMasterCurrentRace: 1 }).extras, [at(given[1][2])]);
  // Coral_36's Beast Shard lies there (the completionist lists it among the caches): a shard, not a cache.
  const coral = SP.EXTRAS.filter((x) => x[3] === 'Coral_36' && x[2][2] === 'Shell Shard Collectable Item Pickup Instant');
  assert.deepEqual(coral.map((x) => [x[0], x[5] && x[5].item]), [['shards', 'beast-shard']]);
});

test('the keys, key items, loose rosaries, cocoons, lifts, hidden corners and Eva\'s rewards, each by what the save keeps', () => {
  const of = (k) => SP.EXTRAS.filter((x) => x[0] === k);
  assert.ok(of('key').length >= 7 && of('keyitem').length >= 6 && of('bead').length > 90 && of('silk-cocoon').length > 10 && of('lift').length >= 6);
  for (const x of [...of('key'), ...of('keyitem')]) assert.ok(x[4] && x[4].key && x[5].icon, JSON.stringify(x));
  // A room's hidden corners are one mark, had once every one of them is uncovered.
  const masked = of('masked');
  assert.equal(new Set(masked.map((x) => x[3])).size, masked.length);
  // Each mask by its bool, or that and the way it sits in or the flag that takes it away (5 A).
  const leaf = (c) => c[0] === 'bool' || (c[0] === 'any' && c[1][0] === 'bool');
  for (const x of masked) assert.ok(leaf(x[2]) || (x[2][0] === 'all' && x[2].length > 2 && x[2].slice(1).every(leaf)), JSON.stringify(x[2]));
  // Eva's four, in her room, by the slots the wiki gives; the save's slot count, every Crest but the Hunter.
  const eva = of('eva');
  assert.deepEqual(eva.map((x) => x[5].slots), [0, 12, 20, 27]);
  assert.ok(eva.every((x) => x[3] === SP.PEOPLE.eva));
  const slots = (n) => ({ IsUnlocked: true, Slots: Array.from({ length: n }, () => ({ IsUnlocked: true })) });
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, UnlockedExtraYellowSlot: true, ToolEquips: { savedData: [
    { Name: 'Hunter', Data: slots(7) }, { Name: 'Hunter_v2', Data: slots(7) }, { Name: 'Reaper', Data: slots(7) }, { Name: 'Witch', Data: slots(6) }] } };
  const g = F.game(pd);
  assert.equal(g.evaSlots, 13);
  const had = eva.map((x) => g.extras.includes(SP.EXTRAS.indexOf(x)));
  assert.deepEqual(had, [true, true, false, false]);
  assert.equal(F.gameOf(F.toSnapshot(pd)).evaSlots, 13);
});

test('a rosary or shell shard cache kept as an int is done at its emptied values, not the untouched -1', () => {
  const P = require('../kb/data/game/pickups.json');
  const at = new Map(P.caches.map(([s, id, , from, to]) => [s + '|' + id, [from, to]]));
  const ints = (c) => (c[0] === 'any' ? c.slice(1) : [c]);
  for (const [kind, , c] of SP.EXTRAS) {
    if (!['rosary-cache', 'shard-cache'].includes(kind) || !ints(c).every((x) => x[0] === 'int')) continue;
    const [, scene, id] = ints(c)[0];
    const x = at.get(scene + '|' + id);
    if (!x) { assert.equal(ints(c)[0][2], 'Hero Treadmill Rosaries Paid', JSON.stringify(c)); continue; }
    assert.deepEqual(ints(c).map((y) => y[3]), Array.from({ length: x[1] - x[0] + 1 }, (_, i) => x[0] + i), JSON.stringify(c));
  }
  // The Covetous Pilgrims' int is the rosaries they carry: their bool is the cache, and the int isn't one.
  assert.ok(!SP.EXTRAS.some((x) => x[2][0] === 'int' && x[2][2] === 'Rosary Pilgrim'));
});

test('the Hero Treadmill is spent once its needle has paid its 50 spits, not at the completionist\'s -1', () => {
  const i = SP.EXTRAS.findIndex((x) => x[2][0] === 'int' && x[2][2] === 'Hero Treadmill Rosaries Paid');
  assert.ok(i >= 0);
  const at = (v) => F.game({}, { persistentInts: { serializedList: [{ SceneName: 'Under_03d', ID: 'Hero Treadmill Rosaries Paid', Value: v }] } }).extras.includes(i);
  assert.deepEqual([-1, 0, 49, 50, 73].map(at), [false, false, false, true, true]);
});

test('a pin lights by fields the save keeps, not one the game works out (UnlockedAnyTube)', () => {
  const M = require('../js/map.js');
  const flags = (c) => (!Array.isArray(c) ? [] : c[0] === 'flag' ? [c[1]] : c.slice(1).flatMap(flags));
  assert.ok(!M.PINS.some((p) => flags(p[4]).includes('UnlockedAnyTube')));
  assert.ok(M.PINS.some((p) => flags(p[4]).includes('UnlockedUnderTube') && p[3] === 'Tube_Hub_Destroyed'));
});

test('a save gives the Map its rooms visited, maps, cocoon, extras and bosses, and a slot keeps them', () => {
  const i = SP.EXTRAS.findIndex((x) => x[2][0] === 'int');
  const [, , c] = SP.EXTRAS[i];
  const rosary = SP.EXTRAS.findIndex((x) => x[0] === 'rosary-cache' && x[2][0] === 'int');
  const boss = SP.BOSSES.find((b) => b[2][0] === 'flag');
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, scenesVisited: ['Bone_01', 'Tut_01'], HasGreymoorMap: true, HasWildsMap: false,
    HeroCorpseScene: 'Bone_04', HeroDeathScenePos: { x: 12.5, y: 30 }, HeroDeathSceneSize: { x: 120, y: 60 }, [boss[2][1]]: true };
  const sd = { persistentInts: { serializedList: [{ SceneName: c[1], ID: c[2], Value: c[3] },
    { SceneName: SP.EXTRAS[rosary][2][1], ID: SP.EXTRAS[rosary][2][2], Value: 3 }] } };
  const g = F.game(pd, sd);
  assert.deepEqual(g.visited, ['Bone_01', 'Tut_01']);
  assert.deepEqual(g.maps, ['Greymoor']);
  assert.equal(g.cocoon, 'Bone_04');
  assert.deepEqual(g.cocoonAt, [12.5, 30, 120, 60]);   // where in it, as the game's map marks it (js/rooms.js mapPoint)
  assert.deepEqual(F.game({ ...pd, HeroDeathSceneSize: { x: 0, y: 60 } }, sd).cocoonAt, []);
  assert.deepEqual(F.game({ ...pd, HeroCorpseScene: '' }, sd).cocoonAt, []);
  assert.ok(g.extras.includes(i));
  assert.ok(!g.extras.includes(rosary) || SP.EXTRAS[rosary][2][3] === 3);
  assert.deepEqual(g.bosses, [boss[0]]);
  const back = F.gameOf(F.toSnapshot(pd, sd));
  for (const k of ['visited', 'maps', 'cocoon', 'cocoonAt', 'extras', 'bosses']) assert.deepEqual(back[k], g[k], k);
});

test('each thing with a point of its own sits in (or at the edge of) its room\'s drawing', () => {
  const M = globalThis.SS.map;
  const boxes = Object.values(M.ROOMS).filter((r) => r[2]);
  assert.ok(Object.keys(SP.XY).length > 300, 'most things have their point');
  for (const [key, [x, y]] of Object.entries(SP.XY)) {
    assert.ok(boxes.some((r) => x >= r[0] - 12 && x <= r[0] + r[2] + 12 && y >= r[1] - 12 && y <= r[1] + r[3] + 12), `${key} at ${x},${y} is in no room`);
  }
});

test('the wishes and the main objectives (TASKS) sit on the map, each with its picture and a check the save reads', () => {
  const fs = require('fs');
  const path = require('path');
  const checks = new Set(['bool', 'flag', 'quest', 'held', 'steel', 'any', 'journal']);   // journal: Last Dive's, as its wish (save checks, 7 A)
  const walk = (c) => { assert.ok(checks.has(c[0]), c[0]); if (c[0] === 'any') c.slice(1).forEach(walk); };
  const n = { qitem: 0, wspot: 0, goal: 0 };
  for (const [kind, quest, check, scene, art] of SP.TASKS) {
    assert.ok(kind in n, kind);
    n[kind]++;
    assert.ok(Q.CHAIN[quest], quest);
    assert.equal(Q.CHAIN[quest].main, kind === 'goal', `${quest}: a main objective is a goal, a wish isn't`);
    walk(check);
    assert.ok(onMap(scene), `${kind} ${quest}: ${scene}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'map', art + '.webp')), art);
  }
  assert.ok(n.qitem >= 20 && n.wspot >= 25 && n.goal >= 25, JSON.stringify(n));
});

test('a wish done by a boss\'s fight has its place in that boss\'s arena, which the boss\'s card stands for', () => {
  /* js/app-map.js WISH_FIGHT folds the place into the boss's card: Pain, Anguish and Misery, Final
     Audience and Hero's Call are ended by their boss's corpse (tools/extract-wishes.py 'corpse'),
     Hero's Call in Coral_33 although Zaza's Memento Pickups could end it in three more rooms, and
     Final Audience in the Hang_17b arena, not the Act 3 resting place that shares the prefab. */
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'app-map.js'), 'utf8');
  const FIGHT = Function(`return ${/const WISH_FIGHT = (\{[^;]*\});/.exec(src)[1]}`)();
  for (const q of ['Pinstress Battle', 'Steel Sentinel', 'Tormented Trobbio', 'Song Knight', 'Garmond Black Threaded']) assert.ok(FIGHT[q], q);
  for (const [q, foe] of Object.entries(FIGHT)) {
    const arena = SP.BOSSES.find((b) => b[0] === foe);
    assert.ok(arena, foe);
    const at = SP.TASKS.filter((x) => x[0] === 'wspot' && x[1] === q);
    assert.ok(at.some((x) => x[3].toLowerCase() === arena[1].toLowerCase()), `${q}: a place in ${arena[1]} (${at.map((x) => x[3])})`);
  }
  for (const q of ['Tormented Trobbio', 'Song Knight', 'Garmond Black Threaded']) {
    const at = SP.TASKS.filter((x) => x[1] === q);
    assert.deepEqual(at.map((x) => [x[0], x[3], x[2]]), [['wspot', SP.BOSSES.find((b) => b[0] === FIGHT[q])[1], ['quest', q]]], q);
  }
});

test('every task of «Tareas» has a place on the Map: who gives it, or what it asks for', () => {
  /* js/app-progress.js taskPin (design/78): its Wishwall or who asks (js/quests.js FROM, of the
     quest or a stage before it), else its marks: TASKS by the quest or a stage before it, or the
     piece of its flag (the melodies, the old hearts). A check that's no quest takes the objective
     app-progress's TASK_QUEST names for it. */
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'app-progress.js'), 'utf8');
  const TASK_QUEST = Function(`return ${/const TASK_QUEST = (\{[^;]*\});/.exec(src)[1]}`)();
  const questOf = (c) => (c[0] === 'quest' ? c[1] : c[0] === 'any' ? (c.slice(1).find((x) => x[0] === 'quest') || [])[1] : TASK_QUEST[c[1]]);
  const stages = (q) => { const out = []; for (let x = q; x && Q.CHAIN[x]; x = Q.CHAIN[x].prev) out.push(x); return out; };
  const missing = [];
  CO.WISHES.forEach((w, i) => {
    const q = questOf(w[2]);
    const piece = w[2][0] === 'flag' ? CO.PIECES.findIndex((p) => p[2][0] === 'flag' && p[2][1] === w[2][1]) : -1;
    const from = (q ? stages(q) : []).map((s) => Q.FROM[s]).filter(Boolean)
      .some((f) => onMap(f.board) || (f.npc || []).some(onMap));
    const targets = (q ? stages(q) : []).some((s) => SP.TASKS.some((k) => k[1] === s && onMap(k[3])))
      || (w[0] === 'main-objectives' && SP.TASKS.some((k) => k[0] === 'goal' && onMap(k[3]) && JSON.stringify(k[2]).includes(JSON.stringify(['quest', q]))));
    if (!(piece >= 0 && onMap(SP.AT.pieces[piece])) && !from && !targets) missing.push(`${i} ${w[4].en}`);
  });
  assert.deepEqual(missing, []);
});

test('a save says which wish items, places and objectives are done, the Steel Sentinel\'s spots, and a slot keeps them', () => {
  const flower = SP.TASKS.findIndex((x) => x[0] === 'qitem' && x[1] === 'Shell Flowers');
  const spot = SP.TASKS.findIndex((x) => x[7]);
  const monarch = SP.TASKS.findIndex((x) => x[1] === 'Citadel Ascent Silk Defeat');
  const [, , [, [, scene, id]]] = SP.TASKS[flower];
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, SteelQuestSpots: [{ SceneName: SP.TASKS[spot][7], IsSeen: true }, { SceneName: 'Hang_08', IsSeen: false }],
    QuestCompletionData: { savedData: [{ Name: 'Black Thread Pt0', Data: { IsCompleted: true } }, { Name: 'Citadel Ascent Silk Defeat', Data: { IsCompleted: false } }] } };
  const sd = { persistentBools: { serializedList: [{ SceneName: scene, ID: id, Value: true }] } };
  const g = F.game(pd, sd);
  assert.ok(g.tasks.includes(flower), 'a Pollip Heart picked up');
  assert.ok(g.tasks.includes(spot), 'a Steel Sentinel spot seen');
  assert.ok(g.tasks.includes(monarch), 'Pale Monarch, passed by a later step');
  assert.deepEqual(g.steelSpots, [...new Set(['Hang_08', SP.TASKS[spot][7]])].sort());
  const back = F.gameOf(F.toSnapshot(pd, sd));
  assert.deepEqual(back.tasks, g.tasks);
  assert.deepEqual(back.steelSpots, g.steelSpots);
});

test('a thing held marks one spot only: one Pollip Heart picked up, the wish not taken, isn\'t the six flowers', () => {
  // Held says nothing of where, so no held check may stand for marks in two rooms.
  const where = new Map();
  for (const [list, name] of [[SP.TASKS, 'task'], [SP.EXTRAS, 'extra']]) {
    list.forEach((x, i) => {
      for (const m of JSON.stringify(x[2]).matchAll(/\["(?:held|memento)","[^"]+"\]/g)) {
        if (!where.has(m[0])) where.set(m[0], new Set());
        where.get(m[0]).add(`${String(x[3]).toLowerCase()} (${name}:${i})`);
      }
    });
  }
  for (const [k, v] of where) assert.ok(new Set([...v].map((s) => s.split(' ')[0])).size === 1, `${k} marks ${[...v].join(', ')}`);
  const flowers = SP.TASKS.map((x, i) => (x[0] === 'qitem' && x[1] === 'Shell Flowers' ? i : -1)).filter((i) => i >= 0);
  assert.equal(flowers.length, 6);
  const [, , [, [, scene, id]]] = SP.TASKS[flowers[0]];
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, Collectables: { savedData: [{ Name: 'Shell Flower', Data: { Amount: 1 } }] } };
  const sd = { persistentBools: { serializedList: [{ SceneName: scene, ID: id, Value: true }] } };
  const g = F.game(pd, sd);
  assert.deepEqual(flowers.filter((i) => g.tasks.includes(i)), [flowers[0]]);
  assert.deepEqual(F.gameOf(F.toSnapshot(pd, sd)).tasks, g.tasks);
  // The wish granted: all six.
  const done = F.game({ ...pd, QuestCompletionData: { savedData: [{ Name: 'Shell Flowers', Data: { IsCompleted: true } }] } });
  assert.deepEqual(flowers.filter((i) => done.tasks.includes(i)), flowers);
});

test('the Flintgems are three Flintbeetles in four places: Bone_04 or Bone_06 by the shortcut, one check, and a save shows the one it has', () => {
  const gems = SP.TASKS.map((x, i) => (x[0] === 'qitem' && x[1] === 'Rock Rollers' ? i : -1)).filter((i) => i >= 0);
  const at = (s) => gems.find((i) => SP.TASKS[i][3] === s);
  assert.deepEqual(gems.map((i) => SP.TASKS[i][3]), ['Bone_01', 'Bone_04', 'Bone_06', 'Bone_07']);
  assert.equal(new Set(gems.map((i) => JSON.stringify(SP.TASKS[i][2]))).size, 3, 'the pair shares one check, so it counts once');
  assert.deepEqual(gems.filter((i) => SP.TASKS[i][9]).map((i) => [SP.TASKS[i][3], SP.TASKS[i][9].by, SP.TASKS[i][9].open]),
    [['Bone_04', 'shortcut', false], ['Bone_06', 'shortcut', true]]);
  const bool = (s) => ({ SceneName: s, ID: 'Rock Roller_item_Rock Rollers', Value: true });
  const quest = (done) => ({ QuestCompletionData: { savedData: [{ Name: 'Rock Rollers', Data: { IsAccepted: true, IsCompleted: done } }] } });
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  // Taken, the shortcut shut: Bone_04's, none picked up yet.
  let g = F.game({ ...base, ...quest(false), bone03_openedTrapdoorForRockRoller: false });
  assert.deepEqual(g.elsewhere, [at('Bone_06')]);
  assert.deepEqual(g.tasks, []);
  // The shortcut open, Bone_01's picked up: Bone_06's, and only Bone_01 had.
  const sd = { persistentBools: { serializedList: [bool('Bone_01')] } };
  g = F.game({ ...base, ...quest(false), bone03_openedTrapdoorForRockRoller: true }, sd);
  assert.deepEqual(g.elsewhere, [at('Bone_04')]);
  assert.deepEqual(g.tasks, [at('Bone_01')]);
  // Picked up in Bone_04, the shortcut opened after: still Bone_04's, had.
  g = F.game({ ...base, ...quest(false), bone03_openedTrapdoorForRockRoller: true }, { persistentBools: { serializedList: [bool('Bone_04')] } });
  assert.deepEqual(g.elsewhere, [at('Bone_06')]);
  assert.deepEqual(g.tasks, [at('Bone_04'), at('Bone_06')]);
  // A slot keeps it; one kept before it has none, and the Map shows both.
  const pd = { ...base, ...quest(true), bone03_openedTrapdoorForRockRoller: true };
  const back = F.gameOf(F.toSnapshot(pd, sd));
  assert.deepEqual(back.elsewhere, [at('Bone_04')]);
  assert.deepEqual(back.tasks, gems, 'the wish granted: all four marks');
  const snap = F.toSnapshot(pd, sd), old = JSON.parse(snap['pharloom.progress']);
  delete old.elsewhere;
  assert.deepEqual(F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify(old) }).elsewhere, []);
});

test("Alchemist's Assistant's three Plasmium buds, each had by its own bool, none by the Plasmium held", () => {
  // As restoreData19 of the author's folder: the wish taken, one Plasmium extracted in Crawl_03.
  const buds = SP.TASKS.map((x, i) => (x[0] === 'qitem' && x[1] === 'Extractor Blue' ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(buds.map((i) => SP.TASKS[i][3]), ['Crawl_03', 'Crawl_07', 'Crawl_09']);
  assert.ok(buds.every((i) => SP.XY['task:' + i]), 'each at the bud in its room');
  assert.ok(buds.every((i) => !JSON.stringify(SP.TASKS[i][2]).includes('held')));
  const base = { silk: 0, silkMax: 9, maxHealth: 5, Collectables: { savedData: [{ Name: 'Plasmium', Data: { Amount: 1 } }] },
    QuestCompletionData: { savedData: [{ Name: 'Extractor Blue', Data: { IsAccepted: true, IsCompleted: false } }] } };
  const sd = { persistentBools: { serializedList: [{ SceneName: 'Crawl_03', ID: 'pustule_set_small (1)', Value: true }] } };
  assert.deepEqual(buds.filter((i) => F.game(base, sd).tasks.includes(i)), [buds[0]]);
  const done = F.game({ ...base, QuestCompletionData: { savedData: [{ Name: 'Extractor Blue', Data: { IsCompleted: true } }] } });
  assert.deepEqual(buds.filter((i) => done.tasks.includes(i)), buds, 'the wish granted: all three');
});

test("the Bellbeast's twelve stations are one check, and a save with its wish on shows the one the beast is at", () => {
  const pins = SP.TASKS.map((x, i) => (x[1] === 'Bellbeast Rescue' ? i : -1)).filter((i) => i >= 0);
  assert.equal(pins.length, 12);
  assert.equal(new Set(pins.map((i) => JSON.stringify(SP.TASKS[i][2]))).size, 1, 'one check, so one thing on the count');
  // Each station's value (GlobalEnums.FastTravelLocations: 1-6, 9, 11-15) is one mark's.
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  const quest = (done) => ({ QuestCompletionData: { savedData: [{ Name: 'Bellbeast Rescue', Data: { IsAccepted: true, IsCompleted: done } }] } });
  const shown = (g) => pins.filter((i) => !g.elsewhere.includes(i));
  for (const v of [1, 2, 3, 4, 5, 6, 9, 11, 12, 13, 14, 15]) assert.equal(shown(F.game({ ...base, ...quest(false), FastTravelNPCLocation: v })).length, 1, `station ${v}`);
  // On, the beast at the Grand Bellway (9): only Bellway_City's.
  const pd = { ...base, ...quest(false), FastTravelNPCLocation: 9 };
  const g = F.game(pd);
  assert.deepEqual(shown(g).map((i) => SP.TASKS[i][3]), ['Bellway_City']);
  // Not taken yet (the field follows the beast all game) and done: all twelve.
  assert.deepEqual(shown(F.game({ ...base, FastTravelNPCLocation: 9 })), pins);
  const done = F.game({ ...base, ...quest(true), FastTravelNPCLocation: 2 });
  assert.deepEqual(shown(done), pins);
  assert.ok(pins.every((i) => done.tasks.includes(i)));
  // A slot keeps it; one kept before it has none, and the Map shows all twelve.
  const snap = F.toSnapshot(pd);
  assert.deepEqual(shown(F.gameOf(snap)), shown(g));
  const old = JSON.parse(snap['pharloom.progress']);
  delete old.elsewhere;
  assert.deepEqual(shown(F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify(old) })), pins);
});

test('each extra once: no two of a kind with the same check in the same scene, and no Heart Memento', () => {
  const seen = new Set();
  SP.EXTRAS.forEach((x, i) => {
    const k = JSON.stringify([x[0], x[2], String(x[3]).toLowerCase()]);
    assert.ok(!seen.has(k), `extra:${i} (${x[0]} in ${x[3]}) is there twice`);
    seen.add(k);
  });
  // It isn't found anywhere: whichever Old Heart The Old Hearts doesn't take (design/03-redesign.md, step 6, 11 A).
  assert.ok(!SP.EXTRAS.some((x) => x[0] === 'memento' && x[2][0] === 'all'), 'the Heart Memento has no mark');
});

test('a Tool sold that lies elsewhere once its seller is gone has that room too, and the save says which', () => {
  const found = Object.entries(SP.ALSO).filter(([, a]) => !a[2]);
  assert.deepEqual(found.map(([k]) => k).sort(), ['tools:curveclaw', 'tools:weighted-belt']);
  for (const [key, [scene]] of found) {
    assert.ok(onMap(scene), `${key}: ${scene}`);
    assert.notEqual(R.roomOf(scene).scene, R.roomOf(SP.AT.tools[key.slice(6)]).scene, `${key} is in its seller's room`);
    assert.ok(SP.XY[key + ':found'], `${key} has no point in ${scene}`);
  }
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  const curve = (pd, broken) => F.game({ ...base, ...pd },
    broken ? { persistentBools: { serializedList: [{ SceneName: 'Ant_21', ID: 'ant_item_string', Value: true }] } } : null).foundNow.filter((k) => k === 'tools:curveclaw');
  const unlocked = { Tools: { savedData: [{ Name: 'Curve Claws', Data: { IsUnlocked: true } }] } };
  // The Mottled Skarr alive: his. Dead, not bought: Ant_21. Bought before he died: his. Found there: Ant_21.
  assert.deepEqual(curve({}), []);
  assert.deepEqual(curve({ antMerchantKilled: true }), ['tools:curveclaw']);
  assert.deepEqual(curve({ antMerchantKilled: true, ...unlocked }), []);
  assert.deepEqual(curve({ antMerchantKilled: true, ...unlocked }, true), ['tools:curveclaw']);
  // Handed to the Skarr Scout (hidden) after it was bought: still bought.
  assert.deepEqual(curve({ antMerchantKilled: true, Tools: { savedData: [{ Name: 'Curve Claws', Data: { IsUnlocked: true, IsHidden: true } }] } }), []);
  const pd = { ...base, mortKeptWeightedAnklet: true };
  assert.deepEqual(F.game(pd).foundNow, ['tools:weighted-belt']);
  assert.deepEqual(F.gameOf(F.toSnapshot(pd)).foundNow, ['tools:weighted-belt']);
  assert.deepEqual(F.gameOf({}).foundNow, []);
  assert.equal(F.gameOf({}).foundRead, false);
  assert.equal(F.gameOf(F.toSnapshot(pd)).foundRead, true);
});

test('what Act 3 moves has its Act 3 room too, and the save says which: Mossberry no. 3 and the Volatile Flintbeetles\' locket', () => {
  // What Act 3 moves of itself (a foe that carries it, a wish's pickup); who moves it is another test's.
  const moved = Object.entries(SP.ALSO).filter(([, a]) => a[2] && a[2].kind === 'moved' && !a[2].npc && !a[2].skipped);
  const berry = SP.EXTRAS.findIndex((x) => x[0] === 'mossberry' && x[2][1] === 'bonetownAspidBerryCollected');
  const locket = CO.PIECES.findIndex((p) => p[0] === 'memory-locket' && JSON.stringify(p[2]).includes('"Rock Rollers"'));
  const both = ['extra:' + berry, 'piece:' + locket].sort();
  assert.deepEqual(moved.map(([k]) => k).sort(), both);
  // Each first where it was (the Aknid above the town, the Wishwall), then in Act 3 one room east,
  // and Survivor's Camp, with its point there and Act 3 on its card.
  assert.equal(SP.EXTRAS[berry][3], 'Bonetown');
  assert.equal(SP.AT.pieces[locket], 'Bonetown');
  assert.deepEqual([SP.ALSO['extra:' + berry][0], SP.ALSO['piece:' + locket][0]], ['Bone_01b', 'Bone_10']);
  for (const [key, [scene, , more]] of moved) {
    assert.ok(onMap(scene), `${key}: ${scene}`);
    assert.notEqual(R.roomOf(scene).scene, R.roomOf('Bonetown').scene, `${key} stays in its room`);
    assert.ok(SP.XY[key + ':found'], `${key} has no point in ${scene}`);
    assert.equal(more.act, 3);
  }
  assert.deepEqual(SP.ALSO['extra:' + berry][2].foe, { es: 'Aknid', en: 'Aknid', key: 'NAME_ASPID_COLLECTOR' });
  assert.equal(SP.ALSO['piece:' + locket][2].wish, 'Rock Rollers');
  // The locket picked up in Bone_10 is had: its check takes that bool.
  assert.deepEqual(CO.PIECES[locket][2], ['any', ['quest', 'Rock Rollers'], ['bool', 'Bone_10', 'Collectable Item Pickup Locket']]);
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  const quest = (done) => ({ QuestCompletionData: { savedData: [{ Name: 'Rock Rollers', Data: { IsAccepted: true, IsCompleted: done } }] } });
  const picked = { persistentBools: { serializedList: [{ SceneName: 'Bone_10', ID: 'Collectable Item Pickup Locket', Value: true }] } };
  const mine = (l) => l.filter((k) => both.includes(k)).sort();
  const now = (pd, sd) => mine(F.game({ ...base, ...pd }, sd).foundNow);
  // Before Act 3, had or not: their first rooms.
  assert.deepEqual(now({}), []);
  assert.deepEqual(now({ bonetownAspidBerryCollected: true, ...quest(true) }), []);
  // Act 3, neither had: both in their Act 3 rooms.
  assert.deepEqual(now({ blackThreadWorld: true, ...quest(false) }), both);
  // Act 3, the berry had (no bool says where: Bonetown) and the wish granted: their first rooms.
  assert.deepEqual(now({ blackThreadWorld: true, bonetownAspidBerryCollected: true, ...quest(true) }), []);
  // Act 3, the locket picked up in Bone_10: had, and there.
  const g = F.game({ ...base, blackThreadWorld: true, bonetownAspidBerryCollected: true }, picked);
  assert.ok(g.pieces.includes(locket));
  assert.deepEqual(mine(g.foundNow), ['piece:' + locket]);
  // Kept in a slot by what they are, not by their place in the lists.
  const snap = F.toSnapshot({ ...base, blackThreadWorld: true });
  assert.ok(!JSON.parse(snap['pharloom.progress']).foundNow.some((k) => /^(piece|extra):\d/.test(k)));
  assert.deepEqual(mine(F.gameOf(snap).foundNow), both);
  // A slot kept before the locket's check took in Bone_10 still has it, by its old check.
  const done = F.toSnapshot({ ...base, ...quest(true) }), old = JSON.parse(done['pharloom.progress']);
  old.pieces = old.pieces.map((k) => (k.startsWith('memory-locket ["any"') ? 'memory-locket ["quest","Rock Rollers"]' : k));
  assert.ok(old.pieces.includes('memory-locket ["quest","Rock Rollers"]'));
  assert.ok(F.gameOf({ ...done, 'pharloom.progress': JSON.stringify(old) }).pieces.includes(locket));
});

test('no cache is only the holder of an item that has its own mark (an ant_item_string, Dock_03\'s chest)', () => {
  const P = require('../kb/data/game/pickups.json');
  SP.EXTRAS.forEach((x, i) => {
    if (!/-cache$/.test(x[0])) return;
    const c = x[2][0] === 'any' ? x[2][1] : x[2];
    const o = (P.objects[String(c[1]).toLowerCase()] || {})[c[2]];
    if (!o) return;
    for (const [save, at] of Object.entries(P.lying)) {
      assert.ok(!at.some(([s, , ex, ey]) => s.toLowerCase() === c[1].toLowerCase() && Math.abs(ex - o[0]) < 0.1 && Math.abs(ey - o[1]) < 0.1),
        `extra:${i} (${x[0]} ${c[1]} ${c[2]}) only holds ${save}`);
    }
  });
});

test('what Grindle sells only in Act 3, had elsewhere before, has his room too: Pebb\'s, Mort\'s and Lumble\'s wares', () => {
  const SH = require('../js/shop.js');
  const sold = Object.entries(SP.ALSO).filter(([, a]) => a[2] && a[2].kind === 'shop');
  assert.deepEqual(sold.map(([k]) => k).sort(),
    ['piece:0', 'piece:103', 'piece:38', 'piece:58', 'tools:magnetite-brooch', 'tools:magnetite-dice']);
  const room = (s) => R.roomOf(s).scene;
  for (const [key, [scene, check, way]] of sold) {
    const [cat, id] = key.split(':'), at = cat === 'piece' ? SP.AT.pieces[id] : SP.AT.tools[id];
    const ware = SH.SHOP.find((x) => x.vendor === 'grindle' && x.act === 3 && (cat === 'piece' ? x.piece === Number(id) : x.tool === id));
    assert.ok(ware, `${key} isn't among Grindle's Act 3 stock`);
    assert.equal(scene, 'coral_42');
    assert.deepEqual(check, ['flag', 'blackThreadWorld'], `${key}: there in Act 3`);
    assert.deepEqual(way, { kind: 'shop', vendor: 'grindle', price: ware.price, act: 3, from: way.from });
    // Who had it before, in the room where the Map had it, is gone in Act 3 (the game's «Normal World»).
    assert.ok(['pebb', 'mort', 'lumble'].includes(way.from), `${key} from ${way.from}`);
    assert.notEqual(room(at), room(scene), `${key} is in Grindle's room already`);
    assert.deepEqual(SP.XY[key + ':grindle'], SP.XY['shop:grindle:0'], `${key} isn't at Grindle`);
  }
  assert.equal(SP.ALSO['piece:0'][2].from, 'pebb');
  assert.equal(SP.ALSO['piece:103'][2].from, 'mort');
  assert.equal(SP.ALSO['tools:magnetite-dice'][2].from, 'lumble');
  // Every Act 3 ware of a vendor that's a thing with a mark elsewhere has one: none left out.
  for (const x of SH.SHOP) {
    if (x.act !== 3 || !(x.tool || x.piece != null)) continue;
    const key = x.tool ? 'tools:' + x.tool : 'piece:' + x.piece, at = x.tool ? SP.AT.tools[x.tool] : SP.AT.pieces[x.piece];
    if (room(at) !== room(SH.VENDORS[x.vendor][0])) assert.ok(SP.ALSO[key], `${key}: ${x.item} has no mark at ${x.vendor}`);
  }
  // The check is the save's Act 3: what the Map reads (game().act) says the same.
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  assert.equal(F.game({ ...base, act2Started: true }).act, 2);
  assert.equal(F.game({ ...base, act2Started: true, blackThreadWorld: true }).act, 3);
  assert.equal(F.gameOf(F.toSnapshot({ ...base, act2Started: true, blackThreadWorld: true })).act, 3);
});

test('the Silkshot has its three repairs, each where the game takes the Ruined Tool, and the save says which and what is closed', () => {
  const P = require('../kb/data/game/pickups.json');
  const H = require('../js/how.js');
  assert.deepEqual(Object.keys(SP.VARIANTS), ['tools:silkshot']);
  const v = SP.VARIANTS['tools:silkshot'], home = R.roomOf(SP.AT.tools.silkshot).scene;
  // Its three, as js/how.js TRAPS lists them, by js/data.js's variant ids and the save's names.
  const trap = H.TRAPS.find((x) => x.id === 'silkshot');
  assert.deepEqual(v.at.map(([, save]) => save), trap.variants.map((x) => x.save));
  assert.deepEqual(v.at.map(([id]) => id).sort(), D.TOOLS.find((x) => x.id === 'silkshot').attacks.filter((a) => a.variant).map((a) => a.id).sort());
  assert.deepEqual(v.at.map(([, , s]) => s), ['Room_Forge', 'Under_17', 'Peak_12']);
  // From the Act each can be done in there: the Forge Daughter's Act 1, the Architect's and Mount Fay's Act 2.
  assert.deepEqual(v.at.map(([, , , a]) => a), [1, 2, 2]);
  // Each where something takes the Ruined Tool (the rune desk's FSM, the Forge Daughter, the Architect), on its own point.
  const takers = new Set(P.items['Broken SilkShot'].at.filter(([, c]) => c === 'PlayMakerFSM').map(([s]) => s.toLowerCase()));
  for (const [id, , scene] of v.at) {
    assert.ok(onMap(scene) && takers.has(scene.toLowerCase()), `${id}: ${scene}`);
    assert.ok(SP.XY[R.roomOf(scene).scene === home ? 'tools:silkshot' : 'tools:silkshot:' + id], `${id} has no point`);
  }
  assert.equal(v.at.filter(([, , s]) => R.roomOf(s).scene === home).length, 1, 'one of them is the Tool\'s own room');
  // What the three repair: the Ruined Tool, where it lies.
  const x = SP.EXTRAS[v.item];
  assert.equal(x[0], 'keyitem');
  assert.equal(x[4].key, 'INV_NAME_BROKEN_SILKSHOT');
  assert.equal(x[3], 'Shadow_Weavehome');
  // The Twelfth Architect goes for good (ArchitectLeft): the save says so, kept through a slot.
  assert.deepEqual(SP.LEFT, { 'twelfth-architect': ['flag', 'ArchitectLeft'] });
  const base = { silk: 0, silkMax: 9, maxHealth: 5 };
  assert.deepEqual(F.game(base).left, []);
  assert.deepEqual(F.game({ ...base, ArchitectLeft: true }).left, ['twelfth-architect']);
  assert.deepEqual(F.gameOf(F.toSnapshot({ ...base, ArchitectLeft: true })).left, ['twelfth-architect']);
  assert.equal(F.gameOf(F.toSnapshot(base)).leftRead, true);
  assert.equal(F.gameOf({}).leftRead, false);
  // The variant repaired, by its ToolItem (WebShot Weaver is the Original).
  const tools = (n) => ({ Tools: { savedData: [{ Name: n, Data: { IsUnlocked: true } }] } });
  assert.equal(F.game({ ...base, ...tools('WebShot Weaver') }).silkshot, 'original');
  assert.equal(F.game({ ...base, ...tools('WebShot Architect') }).silkshot, 'architect');
  assert.equal(F.game({ ...base, ...tools('WebShot Forge') }).silkshot, 'forge');
  assert.equal(F.game(base).silkshot, '');
});

test('the hunt wishes whose thing only enemies give: their Journal rooms on the map, and the save says how many', () => {
  require('../js/journal.js');
  require('../js/journal-rooms.js');
  const J = globalThis.SS.journal, JR = globalThis.SS.journalRooms;
  // The seven the game's files give (tools/extract-hunts.py); Broodfeast's organs come from any enemy a Tool kills: none.
  assert.deepEqual(Object.keys(SP.HUNTS).sort(), ['Brolly Get', 'Crow Feathers', 'Extractor Blue Worms', 'Fine Pins', 'Pilgrim Rags', 'Roach Killing', 'Song Pilgrim Cloaks']);
  for (const [q, [item, at]] of Object.entries(SP.HUNTS)) {
    const w = CO.WISHES.find((x) => x[2][0] === 'quest' && x[2][1] === q);
    assert.ok(w && ['hunt', 'gather'].includes(w[0]), `${q} is a hunt or gather wish`);
    assert.ok(Q.CHAIN[q].asks.some((a) => a.kind === 'item' && a.save === item), `${q} asks for ${item}`);
    // No mark of its own: the Map focuses the enemies' rooms, which the Journal has.
    assert.ok(!SP.TASKS.some((x) => x[0] === 'qitem' && x[1] === q), `${q} has no item marks`);
    for (const [key, scene, n] of at) {
      assert.ok(J.BOOK.some((e) => e.key === key), key);
      assert.ok(onMap(scene), `${q}: ${scene}`);
      assert.ok((JR[key] || []).some(([s]) => s === scene), `${key} isn't in ${scene} for the Journal`);
      assert.ok(n > 0);
    }
  }
  // The pilgrims' twelve entries in 29 rooms; the Hokers' two rooms of the Far Fields.
  assert.equal(new Set(SP.HUNTS['Pilgrim Rags'][1].map(([k]) => k)).size, 12);
  assert.equal(new Set(SP.HUNTS['Pilgrim Rags'][1].map(([, s]) => s)).size, 29);
  assert.deepEqual([...new Set(SP.HUNTS['Brolly Get'][1].map(([, s]) => s))].sort(), ['Bone_East_14', 'Bone_East_14b']);
  // How many Hornet has: the thing held (the quest's CompletedCount is the same in every open hunt
  // of the author's 88 saves), kept through a slot.
  const base = { silk: 0, silkMax: 9, maxHealth: 5,
    QuestCompletionData: { savedData: [{ Name: 'Pilgrim Rags', Data: { IsAccepted: true, IsCompleted: false, CompletedCount: 7 } }] },
    Collectables: { savedData: [{ Name: 'Pilgrim Rag', Data: { Amount: 7 } }] } };
  const g = F.gameOf(F.toSnapshot(base));
  assert.deepEqual(g.taken, ['Pilgrim Rags']);
  assert.equal(g.carried['Pilgrim Rag'], 7);
});

test('each objective pin is filed under the room it falls in, within 3 px of its box (Last Dive\'s is Abyss_05)', () => {
  const M = globalThis.SS.map;
  SP.TASKS.forEach((x, i) => {
    if (x[0] !== 'goal') return;
    const p = SP.XY['task:' + i], r = M.ROOMS[x[3]];
    assert.ok(p && r, `task:${i} ${x[3]}`);
    assert.ok(p[0] >= r[0] - 3 && p[0] <= r[0] + r[2] + 3 && p[1] >= r[1] - 3 && p[1] <= r[1] + r[3] + 3, `task:${i} ${x[1]} isn't by ${x[3]}`);
  });
  assert.equal(SP.TASKS.find((x) => x[0] === 'goal' && x[1] === 'Black Thread Pt6 Flower')[3], 'Abyss_05');
});

test('the Sacred Cylinder is a mark of its own, named and drawn as the game does, pointing at the melody it teaches', () => {
  const fs = require('fs');
  const path = require('path');
  const x = SP.EXTRAS.find((y) => y[2][0] === 'relic' && y[2][1] === 'Librarian Melody Cylinder');
  assert.ok(x, 'the Sacred Cylinder has a mark');
  assert.equal(x[3], 'library_10');
  // Its own name, not the Psalm Cylinders' (INV_NAME_R_PSALM_CYL_MELODY), and its own icon (the white one).
  assert.equal(x[4].key, 'INV_NAME_R_PSALM_CYL_MELODY');
  assert.equal(x[4].en, 'Sacred Cylinder');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'map', 'icons', x[5].icon + '.webp')), x[5].icon);
  // The melody Cardinius plays once he has it: another mark, in another room.
  const m = CO.PIECES[x[5].melody];
  assert.ok(m && m[0] === 'melody' && m[2][1] === 'HasMelodyLibrarian');
});
