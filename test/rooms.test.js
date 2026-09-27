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

test('every loose piece on the floor has its room but one (the lava challenge\'s)', () => {
  const CO = require('../js/collectibles.js');
  const lost = CO.PIECES.filter((p) => p[2][0] === 'bool' && !R.roomOf(p[2][1])).map((p) => p[2][1]);
  assert.deepEqual(lost, ['Bone_East_LavaChallenge']);
});
