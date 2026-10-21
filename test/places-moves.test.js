/* test/places-moves.test.js: where the Map puts what the game hands over, moves or keeps at a
   place a value of the save names (Albert's choices, 21-Oct-2026, from the Map's audit): a wish's
   reward where the game ends the wish in person, the Vaultkeeper's Melody at Cardinius, Plinney
   and his Needle upgrades in Shellgrave in Act 3, Moorwing at the Greymoor Bellway, the Flea Brew
   at the caravan's stop, the Bell Eater beaten by its fight and at its Bellway, the Herald one spot
   at a time, Frey's furnishings at Frey. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const CO = require('../js/collectibles.js');
const SP = require('../js/spots.js');
const H = require('../js/how.js');
const R = require('../js/rooms.js');
const F = require('../js/savefile.js');

const room = (s) => (R.roomOf(s) || {}).scene;
const near = (p, [x, y], d, what) => assert.ok(p && Math.hypot(p[0] - x, p[1] - y) <= d, `${what}: ${JSON.stringify(p)}, not by ${x}, ${y}`);
const base = { silk: 0, silkMax: 9, maxHealth: 5 };
const game = (pd, sd) => F.game({ ...base, ...pd }, sd);
const piece = (f) => CO.PIECES.findIndex(f);

test('a wish\'s reward handed over in person elsewhere is drawn there: Shakra, the Pinstress, Sherma', () => {
  assert.strictEqual(room(SP.AT.tools['throwing-ring']), 'Shadow_24');
  assert.strictEqual(room(SP.AT.tools['pin-badge']), 'Peak_07');
  const sherma = piece((p) => JSON.stringify(p[2]) === '["quest","Save Sherma"]');
  assert.strictEqual(room(SP.AT.pieces[sherma]), 'Ward_09');
  // At who hands it over (kb/data/game/wishes.json ends), not the room's middle.
  assert.ok(SP.XY['tools:throwing-ring'] && SP.XY['tools:pin-badge']);
  // Those taken and ended in the same room stay (Nuu's Tool Pouch, Creige's Crafting Kit).
  const nuu = piece((p) => JSON.stringify(p[2]) === '["quest","Journal"]');
  assert.strictEqual(room(SP.AT.pieces[nuu]), 'Halfway_01');
});

test('the Vaultkeeper\'s Melody is Cardinius\'s, in Library_08, the cylinder brought from library_10', () => {
  const i = piece((p) => p[0] === 'melody' && p[2][1] === 'HasMelodyLibrarian');
  assert.strictEqual(room(SP.AT.pieces[i]), 'Library_08');
  near(SP.XY['piece:' + i], [1736.8, 627.6], 1, 'Cardinius');
  assert.deepStrictEqual(H.HOW.pieces[i].map((w) => [w.kind, w.npc, w.bring.scene, w.bring.name.key]), [['npc', 'cardinius', 'library_10', 'INV_NAME_R_PSALM_CYL_MELODY']]);
});

test('in Act 3 Plinney waits in Shellgrave until rescued, with the Needle upgrades not had', () => {
  const needle = CO.PIECES.map((p, i) => i).filter((i) => CO.PIECES[i][0] === 'needle');
  assert.strictEqual(needle.length, 4);
  for (const k of ['person:plinney', ...needle.map((i) => 'piece:' + i)]) {
    const [scene, , way] = SP.ALSO[k];
    assert.strictEqual(room(scene), 'Shellgrave', k);
    assert.deepStrictEqual([way.kind, way.act, way.npc], ['moved', 3, 'plinney'], k);
    near(SP.XY[k + ':found'], [751.7, 1195.3], 1, k + ' at Plinney Outside');
  }
  const mine = (g) => g.foundNow.filter((k) => /plinney|^piece:/.test(k) && (k === 'person:plinney' || needle.includes(+k.slice(6)))).sort();
  // Act 2: at Bellhart. Act 3, not rescued, two upgrades had: him and the other two in Shellgrave.
  assert.deepStrictEqual(mine(game({ nailUpgrades: 2 })), []);
  assert.deepStrictEqual(mine(game({ blackThreadWorld: true, nailUpgrades: 2 })), ['person:plinney', 'piece:' + needle[2], 'piece:' + needle[3]].sort());
  // Rescued: back at Bellhart.
  assert.deepStrictEqual(mine(game({ blackThreadWorld: true, savedPlinney: true, nailUpgrades: 2 })), []);
});

test('Moorwing waits at the Greymoor Bellway once Bellhart is entered unbeaten', () => {
  const [scene, check, way] = SP.ALSO['boss:moorwing'];
  assert.strictEqual(room(scene), 'Greymoor_05');
  assert.deepStrictEqual([way.kind, way.act, way.skipped], ['moved', 2, 'BELLHART']);
  assert.ok(SP.XY['boss:moorwing:found']);
  assert.ok(game({ visitedBellhart: true }).foundNow.includes('boss:moorwing'));
  assert.ok(!game({ visitedBellhart: true, defeatedVampireGnatBoss: true }).foundNow.includes('boss:moorwing'));
  assert.ok(!game({}).foundNow.includes('boss:moorwing'));
  assert.ok(check);
});

test('the Flea Brew is Grishkin\'s, at the caravan\'s stop CaravanTroupeLocation names', () => {
  assert.strictEqual(room(SP.AT.tools['flea-brew']), 'Greymoor_08');
  const p = SP.PLACES['tools:flea-brew'];
  assert.deepStrictEqual(p.at.map(([s]) => room(s)), ['Coral_Judge_Arena', 'Aqueduct_05']);
  assert.ok(p.guide);
  for (const [s] of p.at) assert.ok(SP.XY['tools:flea-brew:' + s.toLowerCase()], s);
  const now = (v) => game({ CaravanTroupeLocation: v }).placesNow.filter((k) => k.startsWith('tools:flea-brew@'));
  assert.deepStrictEqual([0, 1, 2, 3].map(now), [[], [], ['tools:flea-brew@0'], ['tools:flea-brew@1']]);
  // Kept in a slot.
  const snap = F.toSnapshot({ ...base, CaravanTroupeLocation: 3 });
  assert.ok(F.gameOf(snap).placesNow.includes('tools:flea-brew@1'));
  assert.ok(F.gameOf(snap).placesRead);
});

test('the Bell Eater is beaten by its fight, not its first sight, and waits at a Bellway till then', () => {
  const b = SP.BOSSES.find((x) => x[0] === 'bell-eater');
  assert.deepStrictEqual(b[2], ['any', ['flag', 'UnlockedFastTravelTeleport'], ['kills', 'Giant Centipede', 1]]);
  assert.ok(!game({ bellCentipedeAppeared: true }).bosses.includes('bell-eater'));
  assert.ok(game({ bellCentipedeAppeared: true, UnlockedFastTravelTeleport: true }).bosses.includes('bell-eater'));
  const p = SP.PLACES['boss:bell-eater'];
  assert.ok(!p.guide && p.at.length >= 10);
  const bellhart = p.at.findIndex(([s]) => room(s) === 'Belltown');
  assert.ok(bellhart >= 0);
  const now = (pd) => game(pd).placesNow.filter((k) => k.startsWith('boss:bell-eater@'));
  assert.deepStrictEqual(now({ FastTravelNPCLocation: 5 }), []);
  assert.deepStrictEqual(now({ bellCentipedeAppeared: true, FastTravelNPCLocation: 5 }), ['boss:bell-eater@' + bellhart]);
  assert.deepStrictEqual(now({ bellCentipedeAppeared: true, UnlockedFastTravelTeleport: true, FastTravelNPCLocation: 5 }), []);
});

test('the Herald\'s spots: only the next one while the wish is on', () => {
  const spots = SP.TASKS.map((x, i) => [x, i]).filter(([x]) => x[1] === 'Mr Mushroom' && x[0] === 'wspot');
  assert.strictEqual(spots.length, 7);
  const quest = (acc, done) => ({ QuestCompletionData: { savedData: [{ Name: 'Mr Mushroom', Data: { IsAccepted: acc, IsCompleted: done } }] } });
  const shown = (pd) => { const g = game(pd); return spots.filter(([, i]) => !g.elsewhere.includes(i)).map(([x]) => room(x[3])); };
  assert.strictEqual(shown({}).length, 7);
  assert.deepStrictEqual(shown(quest(true, false)), ['Tut_03']);
  assert.deepStrictEqual(shown({ ...quest(true, false), MushroomQuestFound1: true, MushroomQuestFound2: true }), ['Bone_East_14b']);
  assert.strictEqual(shown(quest(true, true)).length, 7);
});

test('Frey\'s furnishings are at Frey, with their price; the installed ones at the Bellhome\'s door', () => {
  const home = SP.EXTRAS.map((x, i) => [x, i]).filter(([x]) => x[0] === 'bellhome');
  const sold = home.filter(([x]) => x[5] && x[5].vendor === 'frey');
  assert.strictEqual(sold.length, 5);
  for (const [x, i] of sold) {
    assert.strictEqual(room(x[3]), 'Belltown');
    assert.ok(Number.isInteger(x[5].price) && x[5].price > 0);
    assert.deepStrictEqual(SP.XY['extra:' + i], SP.XY['shop:frey:0']);
  }
  for (const [x, i] of home.filter(([y]) => !y[5])) near(SP.XY['extra:' + i], [1178.5, 1211.7], 1, x[4].en + ' at the Bellhome\'s door');
});
