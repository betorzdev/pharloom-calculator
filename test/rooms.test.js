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
