/* test/room-acts.test.js: each room's first Act (js/spots.js ROOM_ACT, tools/gen-spots.js ACT2_DOORS),
   which the Map's Act filter gives the marks with no Act of their own (design/03-redesign.md, step 6,
   the Act filter). The Citadel and what the Clawline or the Faydown Cloak opens are Act 2's, what
   only Act 3 has Act 3's, the rest Act 1's; and no thing's own Act is earlier than its room's. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
const G = require('../js/graph.js');
const CO = require('../js/collectibles.js');
require('../js/gauntlets.js');
const SP = require('../js/spots.js');
const R = require('../js/rooms.js');
const GA = globalThis.SS.gauntlets;

const low = (s) => String(s).toLowerCase();
const roomAct = (scene) => SP.ROOM_ACT[low(scene)] || SP.ROOM_ACT[low((R.roomOf(scene) || {}).scene)] || 1;
const scenes = [...new Set(Object.entries(G).flatMap(([a, bs]) => [a, ...bs]))];

test('ROOM_ACT says 2 or 3, of rooms the doors know or the map\'s Act 3 pieces; AREA_ACT of areas all that late', () => {
  const known = new Set(scenes.map(low)), late = new Set(globalThis.SS.map.PIECES.filter((e) => e.act3).map((e) => low(e.s)));
  for (const [s, v] of Object.entries(SP.ROOM_ACT)) {
    assert.ok(v === 2 || v === 3, s);
    assert.ok(known.has(s) || (late.has(s) && v === 3), s);
  }
  for (const [a, v] of Object.entries(SP.AREA_ACT)) for (const s of scenes) if (R.areaOf(s) === a) assert.ok(roomAct(s) >= v, `${s} in ${a}`);
});

test('the Citadel and what an ability of Act 2 opens are Act 2; the Abyss and Verdania Act 3; the first room Act 1', () => {
  // The wiki's seven areas of the Citadel but the Grand Gate (its gate room is Act 1's), the Underworks,
  // the Songclave and the Cradle; Mount Fay and the Sands of Karak (the Clawline), Wisp Thicket (the
  // Faydown Cloak), the Putrified Ducts (from the Memorium).
  const two = ['HALLS', 'COGWORK_CORE', 'HANG', 'ARBORIUM', 'LIBRARY', 'WARD', 'UNDERSTORE', 'ENCLAVE', 'CRADLE', 'MOUNTAIN', 'CORAL_RIVER', 'WISP', 'AQUEDUCTS'];
  for (const s of scenes) {
    const a = R.areaOf(s);
    if (two.includes(a)) assert.ok(roomAct(s) >= 2, `${s} (${a}) is Act ${roomAct(s)}`);
    if (['ABYSS', 'GROVE'].includes(a)) assert.equal(roomAct(s), 3, s);
  }
  for (const s of ['Tut_01', 'Bonetown', 'Coral_10', 'Coral_Judge_Arena', 'Belltown', 'Slab_16', 'Organ_01', 'Greymoor_06', 'Peak_01']) assert.equal(roomAct(s), 1, s);
  for (const s of ['Song_19_entrance', 'Library_12', 'Peak_02', 'Coral_25', 'Wisp_04', 'Aqueduct_04']) assert.equal(roomAct(s), 2, s);
  for (const s of ['Cradle_03_Destroyed', 'Abandoned_town', 'Abyss_05']) assert.equal(roomAct(s), 3, s);
});

test('no thing\'s own Act is earlier than its room\'s', () => {
  const check = (what, act, scene) => { if (act && scene) assert.ok(act >= roomAct(scene), `${what} is Act ${act} in ${scene}, a room of Act ${roomAct(scene)}`); };
  CO.PIECES.forEach((p, i) => check(`piece ${i} ${p[0]}`, p[1], SP.AT.pieces[i]));
  for (const cat of ['tools', 'crests', 'skills', 'arts']) for (const [id, w] of Object.entries(CO.WHERE[cat])) check(`${cat} ${id}`, w[0], SP.AT[cat][id]);
  for (const [foe, scene, , act] of SP.BOSSES) check(`boss ${foe}`, act, scene);
  for (const g of GA.GAUNTLETS) check(`gauntlet ${g.id}`, g.act, g.scene);
  SP.EXTRAS.forEach((x, i) => check(`extra:${i} ${x[0]}`, x[1], x[3]));
});
