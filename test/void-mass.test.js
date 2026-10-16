/* test/void-mass.test.js: the Void Masses on the Map (Albert's choice, 16-Oct-2026: the game's own
   points, not mapgenie's). Each mark is its core object (Black_Thread_Core…, pickups.json) placed as
   the game places a point; one kept by a flag is at the middle of the cores of the arena that sets
   it. Against mapgenie's 46 pins, 12 were 10 to 28 px off in every direction (and some filed under
   another room); read in the scenes, the mass's sprites all lie within two units of the core. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const SP = require('../js/spots.js');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'pickups.json'), 'utf8'));
const { toMap } = require('../tools/map-point.js')(P.sizes);

const masses = SP.EXTRAS.map((x, i) => [x, i]).filter(([x]) => x[0] === 'spawn' && x[4] && x[4].key === 'NAME_BLACK_THREAD_CORE');
const near = (p, q, d, what) => assert.ok(p && q && Math.hypot(p[0] - q[0], p[1] - q[1]) <= d, `${what}: ${JSON.stringify(p)} isn't by ${JSON.stringify(q)}`);

test('every Void Mass is its core object, where the game places it', () => {
  assert.strictEqual(masses.length, 46);
  let checked = 0;
  for (const [x, i] of masses) {
    // Its own bool (the core's PersistentBoolItem), alone or among the ways the save keeps it.
    const c = [x[2], ...(x[2][0] === 'any' ? x[2].slice(1) : [])].find((y) => y[0] === 'bool');
    if (!c) continue;   // kept by a flag: the next test but one
    const o = (P.objects[c[1].toLowerCase()] || {})[c[2]];
    assert.ok(o, `${c[1]} ${c[2]} isn't in pickups.json`);
    near(SP.XY['extra:' + i], toMap(c[1], o[0], o[1]), 0.15, `${c[1]}'s Void Mass`);
    checked++;
  }
  assert.strictEqual(checked, 45);
});

test('the core is where its sprites are drawn: Greymoor_16 and Under_27, the two mapgenie has 28 px off', () => {
  // The sprites read from the scenes (16-Oct-2026): each core's Core and Threads children
  // (Black_Thread_Core__0000/0001/0002_under1, Thread A, Thread B). mapgenie's pins are 35 units
  // to the left in both, where neither scene has anything of the mass.
  const sprites = { greymoor_16: [[115.94, 35.49], [116.3, 34.74], [115.2, 35.18], [117.55, 36.21], [114.05, 36.42]],
    under_27: [[40.76, 47.94], [39.93, 46.81], [42.76, 47.64], [41.53, 46.76], [44.31, 49.6], [38.02, 48.99]] };
  for (const [scene, list] of Object.entries(sprites)) {
    const o = P.objects[scene].Black_Thread_Core;
    for (const s of list) assert.ok(Math.hypot(s[0] - o[0], s[1] - o[1]) < 4, `${scene}: a sprite at ${s} is far from the core at ${o}`);
  }
});

test('a Void Mass kept by a flag is at the middle of the cores of the arena that sets it: Dust_11', () => {
  const [x, i] = masses.find(([m]) => m[2][0] === 'flag' && m[2][1] === 'silkFarmAbyssCoresCleared');
  const arena = P.battles.dust_11.find((b) => b[3] === 'silkFarmAbyssCoresCleared');
  assert.strictEqual(arena[4].length, 2);
  const [a, b] = arena[4].map(([cx, cy]) => toMap(x[3], cx, cy));
  near(SP.XY['extra:' + i], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 0.3, 'Dust_11\'s Void Mass');
});
