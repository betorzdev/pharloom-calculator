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
  // A door that goes with someone isn't opened by the flag that takes it away (Bone_12's second cell).
  const cell = SP.EXTRAS.find((x) => x[3] === 'Bone_12' && JSON.stringify(x[2]).includes('jail_door (2)'));
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

test('a slot kept before the save checks still has what it had: its marks under their old checks', () => {
  // As the code before kept them: each extra by its kind and its old check (js/savefile.js pieceKey).
  const old = (i) => SP.EXTRAS[i][0] + ' ' + JSON.stringify(SP.EXTRAS[i][5].was);
  const lock = extraOf('lock', 'Slab_14', 'Slab Lock L'), vine = extraOf('silkwall', 'Mosstown_02', 'Thick Silk Vines (1)');
  const room = SP.EXTRAS.findIndex((x) => x[0] === 'masked' && x[3] === 'Chapel_Wanderer');
  for (const i of [lock, vine, room]) assert.ok(SP.EXTRAS[i][5] && SP.EXTRAS[i][5].was, `extra:${i} keeps its old check`);
  assert.deepEqual(SP.EXTRAS[lock][5].was, ['bool', 'Slab_14', 'Slab Lock L']);
  const back = F.gameOf({ 'pharloom.progress': JSON.stringify({ extras: [old(lock), old(vine), old(room)] }) });
  for (const i of [lock, vine, room]) assert.ok(back.extras.includes(i), `extra:${i} had before, had now`);
  // Today's keys go on as before.
  const now = F.gameOf(F.toSnapshot({ ...base }, bools(['Slab_14', 'Slab Lock R'])));
  assert.ok(now.extras.includes(lock) && now.extras.includes(extraOf('lock', 'Slab_14', 'Slab Lock R')));
  // And what the old slot itself says of the rest: the other lock of the door, the vines once the
  // Bell Beast is beaten, Last Dive by Lost Lace in the Journal; nothing it can't say.
  const r = extraOf('lock', 'Slab_14', 'Slab Lock R'), vine0 = extraOf('silkwall', 'Mosstown_02', 'Thick Silk Vines');
  const dive = SP.TASKS.findIndex((x) => x[0] === 'goal' && x[1] === 'Black Thread Pt6 Flower');
  const said = F.gameOf({ 'pharloom.progress': JSON.stringify({ extras: [old(lock)], bosses: ['bell-beast'], tasks: [] }),
    'pharloom.journal': JSON.stringify({ 'lost-lace': 1 }) });
  assert.ok(said.extras.includes(r) && said.extras.includes(vine0) && said.extras.includes(vine), 'the other lock, both vines');
  assert.ok(said.tasks.includes(dive), 'Last Dive');
  assert.ok(!said.extras.includes(extraOf('lever', 'Ant_17', 'ant_lever_persistent')), 'a flag the slot never kept says nothing');
});

test('npm run data stops unless pickups.json and gating.json were read from the same patch', () => {
  const G = require('../tools/gating.js');
  assert.equal(G.load('test', { gating: { patch: '1.0.30000', items: {} }, pickups: { patch: '1.0.30000' } }).patch, '1.0.30000');
  assert.throws(() => G.load('test', { gating: { patch: '1.0.30000' }, pickups: { patch: '1.0.40000' } }), /patch 1\.0\.30000 and pickups\.json from 1\.0\.40000/);
  assert.throws(() => G.load('test', { gating: { patch: '1.0.30000' }, pickups: {} }), /pickups\.json says no patch/);
  // The files in the repo agree.
  assert.ok(G.load('test').patch);
});

/* The four the save checks left (design/03-redesign.md, step 6, the leftovers; design/89-map-leftovers, Albert's
   picks: A in all four). */
const G = require('../tools/gating.js').load('test');
const gate = (scene, id) => G.items[scene + '|' + id] || {};
const accepted = (name) => ({ QuestCompletionData: { savedData: [{ Name: name, Data: { IsAccepted: true } }] } });

test('leftovers 1 A: Slab_16\'s jail gate is a gate, open by its bool, its own flag or the Broodmother\'s hunt', () => {
  const i = extraOf('gate', 'Slab_16', 'Jail Gate Door - Persistent');
  assert.ok(i >= 0 && extraOf('lock', 'Slab_16', 'Jail Gate Door - Persistent') < 0, 'a gate, not a lock');
  assert.deepEqual(gate('Slab_16', 'Jail Gate Door - Persistent').flags, ['slab_cloak_gate_reopened'], 'the flag its own FSM sets');
  assert.ok(done({}, bools(['Slab_16', 'Jail Gate Door - Persistent']), i) && done({ slab_cloak_gate_reopened: true }, null, i));
  assert.ok(done(accepted('Broodmother Hunt'), null, i), 'the hunt taken: the room keeps no gate');
  assert.ok(!done({ slab_cloak_battle_completed: true }, null, i), 'the fight won: shut');
  // A slot kept while it was a lock still has it.
  const old = 'lock ' + JSON.stringify(['bool', 'Slab_16', 'Jail Gate Door - Persistent']);
  assert.ok(F.gameOf({ 'pharloom.progress': JSON.stringify({ extras: [old] }) }).extras.includes(i));
});

test('leftovers 2 A: the Acolytes\' arena drops the Heavy Rosary Necklace, and the necklace\'s card says so', () => {
  const vaults = GA.GAUNTLETS.find((g) => g.id === 'whispering-vaults-2');
  assert.equal(vaults.reward && vaults.reward.key, 'INV_NAME_COIN_SET_M2', 'the game\'s reward, where the wiki says none');
  const neck = SP.EXTRAS.find((x) => x[0] === 'rosaries' && x[3] === 'Library_02');
  assert.ok(neck && neck[5].fight === 'whispering-vaults-2');
  assert.deepEqual(neck[2], ['bool', 'Library_02', 'Collectable Item Pickup'], 'had by its own pickup');
  // Every arena a pickup is dropped by is a gauntlet with that very reward or one the wiki names.
  for (const x of SP.EXTRAS) if (x[5] && x[5].fight) assert.ok((GA.GAUNTLETS.find((g) => g.id === x[5].fight) || {}).reward, x[5].fight);
});

test('leftovers 3 A: Bone_12\'s cell doors are struck open, and Grindle\'s goes with him', () => {
  const one = extraOf('wall', 'Bone_12', 'jail_door (1)'), two = extraOf('wall', 'Bone_12', 'jail_door (2)');
  assert.ok(one >= 0 && two >= 0 && !SP.EXTRAS.some((x) => x[0] === 'lock' && x[3] === 'Bone_12'), 'breakable walls, not locks');
  assert.equal(gate('Bone_12', 'jail_door (2)').withPerson, 'GRINDLE');
  assert.equal(SP.EXTRAS[two][5].person, 'GRINDLE');
  // Gone, not opened, once Shellwood is reached with the door unbroken; opened by its bool.
  const away = F.game({ ...base, visitedShellwood: true });
  assert.ok(!away.extras.includes(two) && away.lostExtras.includes(two), 'gone with Grindle');
  const broken = F.game({ ...base, visitedShellwood: true }, bools(['Bone_12', 'jail_door (2)']));
  assert.ok(broken.extras.includes(two) && !broken.lostExtras.includes(two), 'broken first: had');
  assert.deepEqual(F.gameOf(F.toSnapshot({ ...base, visitedShellwood: true })).lostExtras, away.lostExtras, 'the slot keeps it');
  assert.ok(!F.game({ ...base }).lostExtras.includes(two), 'still there');
  // Only Grindle's: another way that goes with someone needs its own words on the card.
  assert.deepEqual([...new Set(SP.EXTRAS.filter((x) => x[5] && x[5].person).map((x) => x[5].person))], ['GRINDLE']);
  // A slot kept while they were locks still has them.
  const old = 'lock ' + JSON.stringify(['bool', 'Bone_12', 'jail_door (1)']);
  assert.ok(F.gameOf({ 'pharloom.progress': JSON.stringify({ extras: [old] }) }).extras.includes(one));
});

test('leftovers 4 A: Coral_41\'s chained crust walls are each a mark by its own bool', () => {
  const chain = ['Coral Crust Wall Tall (6)', 'Coral Crust Wall Mid (20)', 'Coral Crust Wall Mid (21)'];
  assert.equal(gate('Coral_41', chain[0]).breaks, chain[1]);
  assert.equal(gate('Coral_41', chain[1]).breaks, chain[2]);
  // Each break, struck or passed on, sets that wall's own bool: each its own mark.
  for (const id of chain) {
    const x = SP.EXTRAS.find((e) => e[0] === 'wall' && e[3] === 'Coral_41' && JSON.stringify(e[2]) === JSON.stringify(['bool', 'Coral_41', id]));
    assert.ok(x, id);
  }
});

/* The Map's checks and small fixes of 21-Oct-2026 (the Map audit, W3): a pickup's own removedBy
   flag says it was had, a delivery its delivered flag, the game's caches and Silkeater the
   completionist lacks, the keys' and their doors' Acts, the Skull Tyrant's return. */
test('the Pickled Muckmaggot is had once gotPickledRoachEgg is set, the Rasher once delivered', () => {
  const egg = SP.TASKS.findIndex((x) => x[0] === 'qitem' && x[3] === 'Dust_Chef');
  assert.ok(egg >= 0);
  assert.ok(F.game({ ...base, gotPickledRoachEgg: true }).tasks.includes(egg));
  assert.ok(!F.game(base).tasks.includes(egg));
  const rasher = SP.TASKS.findIndex((x) => x[0] === 'wspot' && x[1] === 'Great Gourmand');
  assert.ok(F.game({ ...base, GourmandGivenMeat: true }).tasks.includes(rasher));
  assert.ok(!F.game(base).tasks.includes(rasher));
});

test('Dock_01\'s two rosary strings and Under_20\'s Silkeater are marks, emptied and broken by their own save', () => {
  const ints = (...xs) => ({ persistentInts: { serializedList: xs.map(([SceneName, ID, Value]) => ({ SceneName, ID, Value })) } });
  const med = SP.EXTRAS.findIndex((x) => x[0] === 'rosary-cache' && x[3] === 'Dock_01' && JSON.stringify(x[2]).includes('rosary_string_medium'));
  const half = SP.EXTRAS.findIndex((x) => x[0] === 'rosary-cache' && x[3] === 'Dock_01' && JSON.stringify(x[2]).includes('rosary_string_small_half'));
  assert.ok(med > 0 && half > 0 && SP.XY['extra:' + med] && SP.XY['extra:' + half], 'each at its point in Dock_01');
  // Emptied at 3 and 2 in every 1.0.30000 save of the author's that entered Dock_01; below, it still pays.
  const both = ints(['Dock_01', 'rosary_string_medium', 3], ['Dock_01', 'rosary_string_small_half', 2]);
  assert.ok(F.game(base, both).extras.includes(med) && F.game(base, both).extras.includes(half));
  assert.ok(!F.game(base, ints(['Dock_01', 'rosary_string_medium', 1])).extras.includes(med));
  const eater = SP.EXTRAS.findIndex((x) => x[0] === 'silkeater' && x[3] === 'Under_20');
  assert.equal(SP.EXTRAS.filter((x) => x[0] === 'silkeater').length, 10);
  assert.equal(SP.EXTRAS[eater][1], 2, 'the Chapel of the Architect: Act 2');
  assert.ok(done({}, bools(['Under_20', 'Silk Grub Large Cocoon']), eater));
});

test('the Diving Bell Key and its door are Act 3\'s, the Ruined Tool Act 1\'s', () => {
  const key = SP.EXTRAS.find((x) => x[0] === 'key' && x[4] && x[4].key === 'INV_NAME_DOCK_KEY');
  const door = SP.EXTRAS.find((x) => x[0] === 'lock' && x[3] === 'Dock_12');
  const ruined = SP.EXTRAS.find((x) => x[0] === 'keyitem' && x[4] && x[4].key === 'INV_NAME_BROKEN_SILKSHOT');
  assert.equal(key[1], 3);
  assert.equal(door[1], 3, 'a door takes its key\'s Act');
  assert.equal(ruined[1], 1);
  // The doors whose keys have no Act of their own keep none.
  for (const sc of Q.LOCKS['Simple Key']) {
    const x = SP.EXTRAS.find((y) => y[0] === 'lock' && y[3].toLowerCase() === sc.toLowerCase());
    if (x) assert.ok(!x[1], sc);
  }
});

test('the Skull Tyrant\'s return to Bone Bottom: coming, beaten, and its own mark outside the completionist\'s list', () => {
  const b = SP.BOSSES.find((x) => x[0] === 'skull-tyrant-bone-bottom');
  assert.ok(b && b[4] && b[4].of === 'skull-tyrant' && b[4].gone === 'act3' && b[3] === 2);
  assert.ok(SP.XY['boss:skull-tyrant-bone-bottom'], 'where the game has it in bonetown_boss');
  const g = (pd) => F.game({ ...base, ...pd });
  assert.deepEqual(g({}).coming, []);
  assert.deepEqual(g({ skullKingWillInvade: true }).coming, ['skull-tyrant-bone-bottom']);
  assert.deepEqual(g({ skullKingInvaded: true }).coming, ['skull-tyrant-bone-bottom']);
  assert.ok(g({ skullKingKilled: true }).bosses.includes('skull-tyrant-bone-bottom'));
  assert.ok(!g({ skullKingKilled: true }).bosses.includes('skull-tyrant'), 'the first fight is its own flag');
  const back = F.gameOf(F.toSnapshot({ ...base, skullKingWillInvade: true }));
  assert.deepEqual(back.coming, ['skull-tyrant-bone-bottom']);
  assert.equal(back.comingRead, true);
  assert.equal(F.gameOf({}).comingRead, false, 'a slot kept before says nothing');
});
