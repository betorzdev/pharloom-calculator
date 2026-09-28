/* test/rooms.test.js — a scene's place on the map (js/map.js, extracted from the game's files):
   its room's middle, or the scene without its last part when the map doesn't draw it. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const M = require('../js/map.js');
const R = require('../js/rooms.js');

test('a scene the map draws is its room; one it does not, the room without its last part; else nothing', () => {
  assert.ok(M.W > 1000 && M.H > 1000 && Object.keys(M.ROOMS).length > 700);
  const r = M.ROOMS.Bellway_City;
  assert.deepEqual(R.roomOf('Bellway_City'), { scene: 'Bellway_City', x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, area: r[4], exact: true });
  const doc = R.roomOf('Belltown_Room_doctor');   // a bench's interior, not on the map
  assert.equal(doc.scene, 'Belltown');
  assert.equal(doc.exact, false);
  assert.equal(R.roomOf('Nowhere'), null);
  assert.equal(R.roomOf(''), null);
});

test('every loose piece on the floor has its room, the fleas by the room their flag names', () => {
  const CO = require('../js/collectibles.js');
  const lost = CO.PIECES.filter((p) => R.sceneOf(p[2]) && !R.roomOf(R.sceneOf(p[2]))).map((p) => R.sceneOf(p[2]));
  assert.deepEqual(lost, []);
  // The fleas saved where they're found; three aren't (the giant one, Lech, the troupe's hunt).
  const fleas = CO.PIECES.filter((p) => p[0] === 'flea');
  assert.deepEqual(fleas.filter((p) => !R.sceneOf(p[2])).map((p) => p[2][1]), ['tamedGiantFlea', 'CaravanLechReturnedToCaravan', 'MetTroupeHunterWild']);
  assert.ok(fleas.length > 20);
  assert.equal(R.sceneOf(['flag', 'SavedFlea_Bone_East_10_Church']), 'Bone_East_10_Church');
  assert.equal(R.sceneOf(['quest', 'Save Sherma']), null);
});

test('an interior the map does not draw goes where its door is; every gauntlet and pin has its room', () => {
  for (const [inside, door] of Object.entries(R.ENTRANCE)) {
    assert.ok(M.ROOMS[door], `${inside}: its door ${door} is not on the map`);
    assert.deepEqual(R.roomOf(inside), { ...R.roomOf(door), exact: false });
  }
  const G = require('../js/gauntlets.js').GAUNTLETS;
  assert.deepEqual(G.filter((g) => !R.roomOf(g.scene)).map((g) => g.id), []);
  const kinds = {};
  for (const [kind, x, y, scene] of M.PINS) {
    kinds[kind] = (kinds[kind] || 0) + 1;
    assert.ok(x >= 0 && x <= M.W && y >= 0 && y <= M.H && R.roomOf(scene), `${kind} in ${scene}`);
  }
  assert.deepEqual(kinds, { bench: 76, bellway: 12, ventrica: 7 });
});

test('getting around: the game\'s doors, and the stations a save has opened; every piece can be reached', () => {
  const G = require('../js/graph.js');
  const CO = require('../js/collectibles.js');
  assert.ok(Object.keys(G).length > 500, 'the graph has the scenes');
  // A map piece of a room walks as its room; an interior as its door.
  assert.strictEqual(R.graphScene('Bone_05_right'), 'Bone_05');
  assert.strictEqual(R.graphScene('Nowhere'), null);
  // From the first room, on foot, every loose piece's room can be reached.
  const w = R.walk('Tut_01', []);
  const pieces = [...new Set(CO.PIECES.map((p) => R.sceneOf(p[2])).filter(Boolean))];
  assert.deepEqual(pieces.filter((s) => !w.has(R.graphScene(s))), []);
  // The path starts and ends where asked and each step is a door or a ride; stations shorten it.
  const lit = M.PINS.filter((p) => p[4] && p[0] !== 'bench').map((p) => p[0] + ' ' + p[3]);
  const foot = R.steps('Tut_01', 'Bellway_City', []), ride = R.steps('Tut_01', 'Bellway_City', lit);
  assert.ok(foot > ride && ride >= 1, `${foot} on foot, ${ride} riding`);
  const way = R.path('Tut_01', 'Bellway_City', []);
  assert.deepEqual([way[0], way[way.length - 1], way.length - 1], ['Tut_01', 'Bellway_City', foot]);
  for (let i = 1; i < way.length; i++) assert.ok((G[way[i - 1]] || []).includes(way[i]), `${way[i - 1]} → ${way[i]}`);
  assert.strictEqual(R.steps('Tut_01', 'Tut_01', []), 0);
});

test('where each Journal entry is: the game\'s own placements, each scene in one of the game\'s areas', () => {
  const JR = require('../js/journal-rooms.js');
  const J = require('../js/journal.js');
  const CO = require('../js/collectibles.js');
  const keys = new Set(J.BOOK.map((e) => e.key));
  assert.ok(Object.keys(JR).length >= 200, `${Object.keys(JR).length} entries placed`);
  for (const k of Object.keys(JR)) assert.ok(keys.has(k), `${k} isn't a Journal entry`);
  /* Every placement's scene is named by an area the game names, but the map's Surface (it has no
     area of its own) and the Red Memory (not on the map); a boss's arena or a memory by its lower
     case name, as the bundles have it. */
  const scenes = [...new Set(Object.values(JR).flat().map(([s]) => s))];
  const noArea = scenes.filter((s) => !CO.AREAS[R.areaOf(s)]);
  assert.ok(noArea.every((s) => s === 'memory_red' || (R.roomOf(s) || {}).area === 'Surface'), `no area: ${noArea.join(' ')}`);
  assert.strictEqual(R.roomOf('bone_05_boss').scene, 'Bone_05');
  assert.strictEqual(R.areaOf('Greymoor_04'), 'GREYMOOR');
  assert.strictEqual(R.areaOf('Tut_01'), 'MOSSCAVE');
});

test('every Journal entry has a place, the 29 the game makes at run time too, and a way there', () => {
  const JR = require('../js/journal-rooms.js');
  const J = require('../js/journal.js');
  const CO = require('../js/collectibles.js');
  const HOW = globalThis.SS.journalHow, LOADS = globalThis.SS.journalLoads;
  // All 237: 208 placed, 29 by what names or spawns them (tools/extract-journal-rooms.py RUNTIME).
  assert.deepEqual(J.BOOK.filter((e) => !(JR[e.key] || []).length).map((e) => e.key), []);
  assert.strictEqual(Object.keys(HOW).length, 29);
  for (const [k, how] of Object.entries(HOW)) assert.ok(['record', 'spawn', 'duel'].includes(how), `${k}: ${how}`);
  // Every one is reached from the first room with every station open, so "nearest" has an answer.
  const lit = M.PINS.filter((p) => p[4] && p[0] !== 'bench').map((p) => p[0] + ' ' + p[3]);
  const w = R.walk('Tut_01', lit);
  const off = Object.keys(HOW).filter((k) => !JR[k].some(([s]) => w.has(R.graphScene(s))));
  assert.deepEqual(off, []);
  const areas = (k) => new Set(JR[k].map(([s]) => R.areaOf(s)).filter(Boolean));
  // Checked against the wiki (kb/data/raw/): the Muckmaggots only where their waters are on
  // (Sinner's Road, Bilewater, Putrified Ducts, Wisp Thicket), the Sandcarvers in the sand.
  assert.deepEqual([...areas('NAME_MAGGOTS')].sort(), ['AQUEDUCTS', 'DUSTPENS', 'SHADOW', 'WISP']);
  assert.deepEqual([...areas('NAME_SAND_CENTIPEDE')].sort(), ['CORAL_RIVER', 'CORAL_STEPS']);
  assert.deepEqual([...areas('NAME_SHELLWOOD_GNAT')].sort(), ['ARBORIUM', 'SHELLWOOD']);
  assert.deepEqual([...areas('NAME_LIFEBLOOD_FLY')].sort(), ['BONEBOTTOM', 'CRAWL']);
  assert.deepEqual([...areas('NAME_GLOOMFLY')], ['ABYSS']);
  // A duel only where it's fought; the Void Mass not on the Wishes' board or in the title screen.
  assert.deepEqual(JR.NAME_SHAKRA.map(([s]) => s), ['greymoor_08_mapper']);
  assert.deepEqual(JR.NAME_GARMOND_ZAZA.map(([s]) => s), ['Library_09']);
  assert.ok(!JR.NAME_BLACK_THREAD_CORE.some(([s]) => /^(Belltown|Menu_Title)$/i.test(s)));
  // A boss in its arena; the two arenas off the map by the scenes that load them.
  assert.deepEqual(JR.NAME_SPINNER_BOSS, [['Belltown_Shrine', 1]]);
  assert.deepEqual(LOADS, { NAME_GIANT_CENTIPEDE: 'bellway_centipede_arena', NAME_LOST_LACE: 'abyss_cocoon' });
  assert.deepEqual(JR.NAME_LOST_LACE.map(([s]) => s), ['Abyss_05']);
  const stations = M.PINS.filter((p) => p[0] === 'bellway').length;
  assert.strictEqual(JR.NAME_GIANT_CENTIPEDE.length, stations);
  // The Garpids are in the Border Caves, which the site's areas don't name (js/app-journal.js does).
  assert.deepEqual(JR.NAME_CENTIPEDE_TRAP.map(([s]) => s), ['Cradle_Destroyed_Challenge_01']);
  assert.strictEqual(R.areaOf('Cradle_Destroyed_Challenge_01'), null);
  assert.ok(Object.keys(CO.AREAS).length > 30);
});
