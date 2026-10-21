/* test/positions.test.js: where in its room the Map draws who stands there (js/spots.js XY,
   js/people.js spots), read against the game's own scenes and mapgenie's map (16-Oct-2026). Each
   test is a rule of the generators:
     · a place counts its parents' turns (tools/scene_place.py): what an Act 3 variant holds, turned
       and turned back, isn't under the floor or above the room;
     · one rule for a point in the generators (tools/map-point.js): an interior's own coordinates
       aren't its door room's;
     · one who walks between scenes is where their path ends on the ground;
     · a wish nobody offers in person is where the object that offers it is. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const SP = require('../js/spots.js');
const PE = require('../js/people.js');
const CO = require('../js/collectibles.js');
const M = globalThis.SS.map;

const near = (p, [x, y], d, what) => assert.ok(p && Math.hypot(p[0] - x, p[1] - y) <= d, `${what}: ${JSON.stringify(p)}, not by ${x}, ${y}`);
const inBox = (p, scene, what) => {
  const r = M.ROOMS[R.roomOf(scene).scene];
  assert.ok(p && p[0] >= r[0] && p[0] <= r[0] + r[2] && p[1] >= r[1] && p[1] <= r[1] + r[3], `${what}: ${JSON.stringify(p)} isn't inside ${scene}`);
};
const spot = (id, scene) => ((PE.PEOPLE.find((x) => x.id === id) || { spots: [] }).spots.find(([s]) => s.toLowerCase() === scene) || []).slice(1);

test('a place counts its parents\' turns: Shakra on guard in Greymoor_08, Garmond in Greymoor_07, the Pilgrim\'s Rest', () => {
  // Shakra (Mapper StandGuard NPC) on Greymoor_08's floor, not under it at the box's edge: where
  // mapgenie has her spar (1306, 1234).
  const g8 = SP.XY['shakra:' + SP.VENDORS.shakra.indexOf('greymoor_08')];
  inBox(g8, 'Greymoor_08', 'Shakra in Greymoor_08');
  near(g8, [1311, 1241], 2, 'Shakra in Greymoor_08');
  // Garmond waiting to help against Moorwing, inside Greymoor_07 (mapgenie 1383, 1210).
  const g7 = spot('garmond', 'greymoor_07');
  inBox(g7, 'Greymoor_07', 'Garmond in Greymoor_07');
  near(g7, [1382, 1210], 3, 'Garmond in Greymoor_07');
  // Sherma, the pilgrim and Pilby at the Pilgrim's Rest, on its floor, not at the room's middle
  // (mapgenie's Sherma 1908, 1385).
  for (const id of ['sherma', 'sherma-pilgrim', 'little-pilgrim-n']) {
    const p = spot(id, 'bone_east_10');
    inBox(p, 'Bone_East_10', id);
    near(p, [1908, 1388], 4, id + ' at the Pilgrim\'s Rest');
  }
});

test('an interior is at the door it\'s entered by: the Bellway Pilgrim, Plinney, the Skull Cave', () => {
  // Bellway_01 is a scene of its own, entered from Bone Bottom: its own coordinates aren't Bonetown's
  // (they drew it at Bone Bottom's far west, by the Chapel Maid), so everything in it is at its door,
  // Bonetown's door1 at the town's east end, by the Bellway (Albert's choice, 21-Oct-2026).
  const pilgrim = PE.PEOPLE.find((x) => x.id === 'bellway-pilgrim');
  assert.strictEqual(pilgrim.spots.length, 1);
  inBox(pilgrim.spots[0].slice(1), 'Bonetown', 'the Bellway Pilgrim');
  near(pilgrim.spots[0].slice(1), [675.9, 1469.6], 1, 'the Bellway Pilgrim at Bellway_01\'s door');
  // Plinney's house (Belltown_Room_pinsmith), his Needle upgrades with him: its door3 in Bellhart.
  const needle = CO.PIECES.map((p, i) => i).filter((i) => CO.PIECES[i][0] === 'needle');
  for (const k of ['person:plinney', ...needle.map((i) => 'piece:' + i)]) near(SP.XY[k], [1196.3, 1216.1], 1, k);
  // The Skull Cave's Mask Shard (Bone_East_LavaChallenge), at its door in Bone_East_14b.
  const cave = CO.PIECES.findIndex((p) => JSON.stringify(p[2]).includes('Bone_East_LavaChallenge'));
  near(SP.XY['piece:' + cave], [2208.8, 1528.2], 1, 'the Skull Cave\'s Mask Shard');
});

test('one who walks between scenes is where their path ends on the ground: Pondcatcher Reed', () => {
  // Bellhart: by the pond at the town's west end (mapgenie 1145, 1236), not at the room's middle.
  near(spot('fisher-npc', 'belltown'), [1140, 1238], 3, 'Pondcatcher Reed in Bellhart');
  // Every spot of hers has a point in its room now (she was parked under the scenes); in
  // Belltown_07 at its west edge, where she walks on to Shellwood.
  for (const [scene, x, y] of PE.PEOPLE.find((p) => p.id === 'fisher-npc').spots) inBox([x, y], scene, 'Pondcatcher Reed in ' + scene);
});

test('a wish nobody offers in person is where it\'s taken: the Mr Mushroom Tablet in Fleatopia', () => {
  assert.strictEqual(SP.GIVER.Aqueduct_05, null);
  // Not the room's middle (2352, 543, in the black): the tablet, where mapgenie has the wish too
  // (2410, 506, its pins drawn by hand a few pixels off).
  near(SP.XY['giver:aqueduct_05'], [2410, 515], 2, 'the Mr Mushroom Tablet');
});
