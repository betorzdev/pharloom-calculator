/* test/save-checks.test.js: the Map's marks follow what the save really keeps (design/03-redesign.md,
   step 6, the save checks; the rules come from kb/data/game/gating.json, tools/extract-gating.py):
   one test per rule Albert picked on design/86 and the review's list. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const SP = require('../js/spots.js');
const Q = require('../js/quests.js');
const GA = require('../js/gauntlets.js');
const PE = require('../js/people.js');
const F = require('../js/savefile.js');

const base = { silk: 0, silkMax: 9, maxHealth: 5 };
const bools = (...xs) => ({ persistentBools: { serializedList: xs.map(([SceneName, ID]) => ({ SceneName, ID, Value: true })) } });
const extraOf = (kind, scene, id) => SP.EXTRAS.findIndex((x) => x[0] === kind && x[3].toLowerCase() === scene.toLowerCase()
  && JSON.stringify(x[2]).includes(JSON.stringify(id)));
const done = (pd, sd, i) => F.game({ ...base, ...pd }, sd).extras.includes(i);

test('1 A: a slot keeps every Silver Bell spot of a room, though they share one key', () => {
  const bells = SP.TASKS.map((x, i) => (x[1] === 'Shiny Bell Goomba' ? i : -1)).filter((i) => i >= 0);
  assert.ok(bells.length >= 14, 'the drop spots');
  const pd = { ...base, QuestCompletionData: { savedData: [{ Name: 'Shiny Bell Goomba', Data: { IsCompleted: true } }] } };
  const g = F.game(pd), back = F.gameOf(F.toSnapshot(pd));
  for (const i of bells) assert.ok(g.tasks.includes(i) && back.tasks.includes(i), `task:${i}`);
  assert.deepEqual(back.tasks, g.tasks);
});

test('2 A: a way is open by what the save keeps instead of its own bool', () => {
  // A Lever with a playerDataBool never writes its own bool.
  const ant = extraOf('lever', 'Ant_17', 'ant_lever_persistent');
  assert.ok(ant >= 0 && done({ antBenchTrapDefused: true }, null, ant));
  const crow = extraOf('lever', 'Room_CrowCourt', 'greymoor_lever_simple');
  assert.ok(crow >= 0 && done({ hitCrowCourtSwitch: true }, null, crow));
  assert.ok(done({ BonePlazaOpened: true }, null, extraOf('plate', 'Bone_11b', 'Plate')), 'a pressure plate\'s flag');
  // The other lock of a cell's door: only the side used saves.
  const l = extraOf('lock', 'Slab_14', 'Slab Lock L'), r = extraOf('lock', 'Slab_14', 'Slab Lock R');
  assert.ok(done({}, bools(['Slab_14', 'Slab Lock L']), r) && done({}, bools(['Slab_14', 'Slab Lock L']), l));
  // A lock whose FSM keeps a flag (the far side of Slab_05's gate), a key door's receptacle flag.
  assert.ok(done({ slab_05_gateOpen: true }, null, extraOf('lock', 'Slab_03', 'Slab Lock (2)')));
  assert.ok(done({ openedSongGateDocks: true }, null, extraOf('lock', 'Room_Forge', 'dock_sealed_gate')));
  // Mosshome's silk vines go with the Bell Beast: a game cuts one, the other or neither.
  const vines = [extraOf('silkwall', 'Mosstown_02', 'Thick Silk Vines'), extraOf('silkwall', 'Mosstown_02', 'Thick Silk Vines (1)')];
  for (const v of vines) assert.ok(v >= 0 && done({ defeatedBellBeast: true }, null, v) && !done({}, null, v));
  // One wall seen from three rooms, by the flag the far side's script sets.
  assert.ok(done({ openedDocksBackEntrance: true }, null, extraOf('wall', 'Dock_03', 'Breakable Wall_Silhouette')));
  // A door a key opens isn't opened by a flag that only takes it away (Bone_12's second cell).
  const cell = SP.EXTRAS.find((x) => x[0] === 'lock' && x[3] === 'Bone_12' && JSON.stringify(x[2]).includes('jail_door (2)'));
  assert.ok(cell && !JSON.stringify(cell[2]).includes('IsPinGallerySetup'));
});

test('3 A: what the game takes away is marked so: Act 3\'s swaps, the other arena of a pair', () => {
  for (const id of ['rosary_string_small (1)', 'City Shard Chest']) {
    const x = SP.EXTRAS.find((e) => e[3] === 'Dock_06_Church' && JSON.stringify(e[2]).includes(JSON.stringify(id)));
    assert.ok(x && x[5] && x[5].gone === 'act3', id);
  }
  const slab = (id) => GA.GAUNTLETS.find((x) => x.id === id);
  assert.deepEqual(slab('the-slab-2').gone, { gauntlet: 'the-slab-3' });
  assert.deepEqual(slab('the-slab-3').gone, { gauntlet: 'the-slab-2' });
  assert.ok(SP.EXTRAS.filter((x) => x[5] && x[5].gone === 'act3').length > 30, 'the rooms\' «Normal World»');
  assert.ok(SP.TASKS.every((x) => x[8] === null || x[8] === 'act3'));
});

test('4 A: what only one mode has says which', () => {
  const coral = SP.EXTRAS.find((x) => x[0] === 'silkeater' && x[3] === 'Coral_37');
  assert.equal(coral[5].mode, 'normal');
  const wall = SP.EXTRAS.find((x) => x[3] === 'Dust_11' && x[2][0] === 'bool' && x[2][2] === 'Breakable Wall');
  assert.equal(wall && wall[5].mode, 'steel');
});

test('5 A: a hidden corner is uncovered by its own bool, the way it sits in, or the flag that takes it away', () => {
  const room = (scene) => SP.EXTRAS.findIndex((x) => x[0] === 'masked' && x[3] === scene);
  const bone = room('Bone_01');
  const other = SP.EXTRAS[bone][2][0] === 'all' ? SP.EXTRAS[bone][2].slice(1).map((c) => (c[0] === 'any' ? c[1] : c)).filter((c) => c[2] !== 'Secret Mask') : [];
  assert.ok(done({ greatBoneGateOpened: true }, bools(...other.map((c) => [c[1], c[2]])), bone), 'Bone_01 with its gate opened');
  // A mask only Steel Soul has isn't asked for in the room's check.
  const coral = SP.EXTRAS[room('Coral_37')];
  assert.ok(!coral || !JSON.stringify(coral[2]).includes('"Remasker New"]'));
  // A mask in a one-way wall: the wall's bool says it too.
  const chapel = SP.EXTRAS[room('Chapel_Wanderer')];
  assert.ok(JSON.stringify(chapel[2]).includes('["bool","Chapel_Wanderer","One Way Wall"]'));
});

test('6 A: the Act 3 Moss Mother is beaten once the Journal\'s kills pass the other fights\'', () => {
  assert.ok(SP.BOSSES.some((b) => b[0] === 'moss-mother-act-3-moss-grotto'));
  const beaten = (kills, weave) => F.game({ ...base, EnemyJournalKillData: { list: [{ Name: 'Mossbone Mother', Record: { Kills: kills } }] } },
    weave ? bools(['Weave_03', 'Boss Scene']) : null).bosses.includes('moss-mother-act-3-moss-grotto');
  assert.ok(!beaten(3, true) && beaten(4, true), 'after the Chapel\'s one and Weavenest Atla\'s two');
  assert.ok(!beaten(1, false) && beaten(2, false), 'after the Chapel\'s one');
});

test('7 A: Last Dive\'s pin is done as its wish is, by Lost Lace in the Journal', () => {
  const i = SP.TASKS.findIndex((x) => x[0] === 'goal' && x[1] === 'Black Thread Pt6 Flower');
  assert.ok(i >= 0);
  const g = F.game({ ...base, EnemyJournalKillData: { list: [{ Name: 'Lost Lace', Record: { Kills: 1 } }] } });
  assert.ok(g.tasks.includes(i));
});

test('8 A: Sinner\'s Road\'s first gauntlet is cleared once the cage\'s key is taken', () => {
  const x = GA.GAUNTLETS.find((g) => g.id === 'sinners-road-1');
  assert.ok(F.game({ ...base, CollectedDustCageKey: true }).gauntlets.includes(x.id));
});

test('9 A: every door a key opens is a mark with a check, and the demo\'s isn\'t', () => {
  const locks = SP.EXTRAS.filter((x) => x[0] === 'lock');
  for (const [k, scenes] of Object.entries(Q.LOCKS)) for (const sc of scenes) {
    if (k === 'Dock Demo Key') { assert.ok(!locks.some((x) => x[3].toLowerCase() === sc.toLowerCase()), 'the demo\'s door'); continue; }
    assert.ok(locks.some((x) => x[3].toLowerCase() === sc.toLowerCase()), `${k}'s door in ${sc}`);
  }
  const ward = locks.find((x) => x[3] === 'Ward_01');
  assert.deepEqual(ward[2], ['bool', 'Ward_01', 'under_lift_large'], 'the White Key machine writes the lift\'s bool');
});

test('10 A: the Second Sentinel is met once fought, and Garmond gone once Lost Garmond is beaten', () => {
  const p = (id) => PE.PEOPLE.find((x) => x.id === id);
  assert.ok(p('song-knight').met.includes('encounteredSongChevalierBoss') && p('song-knight').met.includes('songChevalierEncounters'));
  assert.deepEqual(p('garmond').gone, ['garmondBlackThreadDefeated']);
});

test('11 A: what the game never switches on and the demo\'s aren\'t marks', () => {
  const has = (scene, id) => SP.EXTRAS.some((x) => x[3].toLowerCase() === scene.toLowerCase() && JSON.stringify(x[2]).includes(JSON.stringify(id)));
  assert.ok(!has('Ward_01', 'Breakable Wall (1)') && !has('Tube_Hub', 'Breakable Floor_basic') && !has('Slab_Cell_Quiet', 'One Way Wall'));
  assert.ok(!has('Bone_East_01', 'Collectable Item Pickup'), 'the demo gate\'s Shard Bundle');
  assert.ok(!has('Clover_04b', 'Clover Gate') && !has('Clover_04b', 'Clover Gate (1)'), 'Verdania\'s two gates, worked by a plate nothing switches on');
});
