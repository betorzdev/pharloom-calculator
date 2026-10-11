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
    'memento', 'bellhome', 'spawn', 'rosary-cache', 'shard-cache', 'wall']);
  const checks = new Set(['bool', 'flag', 'min', 'quest', 'visited', 'journal', 'relic', 'memento', 'int', 'geo', 'any']);
  for (const [kind, , check, scene] of SP.EXTRAS) {
    assert.ok(kinds.has(kind), kind);
    assert.ok(checks.has(check[0]), check[0]);
    assert.ok(onMap(scene), `${kind} ${JSON.stringify(check)}: ${scene} isn't on the map`);
  }
  for (const [foe, scene] of SP.BOSSES) assert.ok(onMap(scene), `boss ${foe}`);
  for (const scene of Object.values(SP.PEOPLE)) assert.ok(onMap(scene), scene);
  assert.equal(SP.BELLS.length, Q.BELLSHRINES.length);
  for (const [, scene] of SP.BELLS) assert.ok(onMap(scene), scene);
  for (const k of Object.keys(Q.LOCKS)) assert.ok(SP.KEYS[k] && SP.KEYS[k].es && SP.KEYS[k].en, k);
  assert.equal(Object.keys(SP.MAPS).length, 28);
  for (const area of Object.values(SP.MAPS)) assert.ok(CO.AREAS[area], area);
});

test('a thing\'s prereqs are abilities or Silk Skills the save tells', () => {
  const ids = new Set([...D.ARTS, ...D.SKILLS].map((x) => x.id));
  for (const [key, needs] of Object.entries(SP.NEEDS)) for (const id of needs) assert.ok(ids.has(id), `${key}: ${id}`);
});

test('a save gives the Map its rooms visited, maps, cocoon, extras and bosses, and a slot keeps them', () => {
  const i = SP.EXTRAS.findIndex((x) => x[2][0] === 'int');
  const [, , c] = SP.EXTRAS[i];
  const rosary = SP.EXTRAS.findIndex((x) => x[0] === 'rosary-cache' && x[2][0] === 'int');
  const boss = SP.BOSSES.find((b) => b[2][0] === 'flag');
  const pd = { silk: 0, silkMax: 9, maxHealth: 5, scenesVisited: ['Bone_01', 'Tut_01'], HasGreymoorMap: true, HasWildsMap: false,
    HeroCorpseScene: 'Bone_04', [boss[2][1]]: true };
  const sd = { persistentInts: { serializedList: [{ SceneName: c[1], ID: c[2], Value: c[3] },
    { SceneName: SP.EXTRAS[rosary][2][1], ID: SP.EXTRAS[rosary][2][2], Value: 3 }] } };
  const g = F.game(pd, sd);
  assert.deepEqual(g.visited, ['Bone_01', 'Tut_01']);
  assert.deepEqual(g.maps, ['Greymoor']);
  assert.equal(g.cocoon, 'Bone_04');
  assert.ok(g.extras.includes(i));
  assert.ok(!g.extras.includes(rosary) || SP.EXTRAS[rosary][2][3] === 3);
  assert.deepEqual(g.bosses, [boss[0]]);
  const back = F.gameOf(F.toSnapshot(pd, sd));
  for (const k of ['visited', 'maps', 'cocoon', 'extras', 'bosses']) assert.deepEqual(back[k], g[k], k);
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
  const checks = new Set(['bool', 'flag', 'quest', 'held', 'steel', 'any']);
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
