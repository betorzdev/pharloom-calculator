/* test/acts.test.js: the road to the next Act (js/acts.js) and the game's rules it reads
   (js/quests.js, extracted from the game's files). The real saves don't go in the repo:
   npm run check-pack runs the road on them. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const Q = require('../js/quests.js');
const A = require('../js/acts.js');
const CO = require('../js/collectibles.js');
const F = require('../js/savefile.js');

const snare = Q.GROUPS['Soul Snare'];
const REQUIRED = snare.quests.filter((q) => q.required).map((q) => q.quest);
const step = (road, id) => road.steps.find((s) => s.id === id);

test("the rule for Act 3 is the game's: 10 required wishes, 17 of 25 points, four checks", () => {
  assert.equal(REQUIRED.length, 10);
  assert.equal(snare.quests.reduce((a, q) => a + q.value, 0), 25);
  assert.equal(snare.quests.filter((q) => q.value === 0.5).length, 6);
  assert.equal(snare.target, 17);
  assert.equal(snare.tests.length, 1);
  assert.deepEqual(snare.tests[0].map((t) => [t.field, t.op, t.value]), [
    ['CaravanTroupeLocation', '==', 3], ['hasDoubleJump', '==', true], ['defeatedLaceTower', '==', true], ['BelltownGreeterHouseFullDlg', '==', true]]);
  // Pavo's key: 2 of the group's wishes (the game's asset lists five, one of them empty).
  const key = Q.GROUPS['Belltown House Key'];
  assert.equal(key.target, 2);
  assert.equal(key.quests.length, 4);
  assert.deepEqual(Q.BELLSHRINES.length, 5);
  assert.deepEqual(Q.SNARE.map((x) => x.kind), ['collectable', 'collectable', 'collectable', 'tool']);
});

test('every field a rule tests is one the site reads, and every wish in a rule joins the pane «Tareas»', () => {
  for (const g of Object.values(Q.GROUPS)) {
    for (const t of g.tests.flat()) assert.ok(A.FIELDS[t.field], t.field);
    for (const q of g.quests) {
      assert.ok(Q.CHAIN[q.quest] && Q.CHAIN[q.quest].name, q.quest);
      assert.ok(A.missing(q.quest, new Set()).wish >= 0, q.quest);
    }
  }
  for (const b of Q.BELLSHRINES) assert.ok(CO.AREAS[b.field.replace(/^bellShrine/, '').toUpperCase()], b.field);
});

test('a new game has the road to Act 2 ahead, and none in Act 3', () => {
  const road = A.next(F.game({ silk: 0 }));
  assert.deepEqual([road.act, road.done, road.total], [2, 0, 4]);
  assert.deepEqual(road.steps.map((s) => s.id), ['bellshrines', 'grand-gate', 'judge', 'citadel']);
  assert.deepEqual(step(road, 'bellshrines').shrines.map((b) => b.area), ['BONEFOREST', 'WILDS', 'GREYMOOR', 'BELLHART', 'SHELLWOOD']);
  assert.equal(A.next({ act: 3 }), null);
  assert.equal(A.next(F.game({ silk: 0, blackThreadWorld: true })), null);
});

test('Act 1: the Bellshrines, the Grand Gate and the Last Judge; the Phantom goes round them', () => {
  const pd = { silk: 0, bellShrineWilds: true, bellShrineGreymoor: true, bellShrineEnclave: true };
  let road = A.next(F.game(pd));
  assert.deepEqual([step(road, 'bellshrines').done, step(road, 'bellshrines').total], [2, 5], "the Songclave's shrine isn't one of them");
  road = A.next(F.game({ ...pd, bellShrineBoneForest: true, bellShrineBellhart: true, bellShrineShellwood: true, defeatedLastJudge: true,
    QuestCompletionData: { savedData: [{ Name: 'Grand Gate Bellshrines', Data: { IsCompleted: true } }] } }));
  assert.deepEqual([road.done, road.total], [3, 4]);
  road = A.next(F.game({ ...pd, defeatedPhantom: true }));
  assert.deepEqual(road.steps.map((s) => [s.id, s.ok, !!s.bypassed]), [['bellshrines', false, true], ['grand-gate', false, true], ['judge', true, false], ['citadel', false, false]]);
  assert.equal(road.done, 3);
});

// Restore_Points3/restoreData25 of the author's Steel Soul game (1.0.28891): Act 2, everything
// for Act 3 but Pavo's talk. Its fields as game() reads them.
const RP25 = {
  act: 2, caravan: 3, doubleJump: true, laceTower: true, bellhomeKey: false, snareOffered: false, snareReady: false,
  snarePieces: ['Snare Soul Swamp Bug'], bellshrines: Q.BELLSHRINES.map((b) => b.field), grandGate: true, lastJudge: true, phantom: true,
  quests: ['A Pinsmiths Tools', 'Beastfly Hunt', 'Belltown House Mid', 'Belltown House Start', 'Brolly Get', 'Broodmother Hunt',
    'Building Materials', 'Building Materials (Bridge)', 'Building Materials (Statue)', 'Citadel Ascent', 'Citadel Ascent Lift',
    'Citadel Ascent Melodies', 'Citadel Investigate', 'Citadel Seeker', 'Crow Feathers', 'Crow Feathers Pre', 'Doctor Curse Cure',
    'Extractor Blue', 'Fine Pins', 'Grand Gate Bellshrines', 'Great Gourmand', 'Huntress Quest', 'Journal', 'Mossberry Collection 1',
    'Mossberry Collection Pre', 'Pilgrim Rags', 'Roach Killing', 'Rock Rollers', 'Save City Merchant', 'Save City Merchant Bridge',
    'Save Courier Short', 'Save Courier Tall', 'Save Sherma', 'Save the Fleas', 'Save the Fleas Pre', 'Shakra Final Quest', 'Shell Flowers',
    'Shiny Bell Goomba', 'Skull King', 'Song Pilgrim Cloaks', 'Songclave Donation 1', 'Songclave Donation 2', 'Steel Sentinel',
    'Steel Sentinel Pt2', 'The Threadspun Town', 'Wood Witch Curse'],
};

test("a real Act 2 save with all but Pavo's talk: the key is the one check left, and it's ready", () => {
  const road = A.next(RP25);
  assert.deepEqual([road.act, road.done, road.total], [3, 0, 5]);
  assert.deepEqual(road.steps.map((s) => s.id), ['unlock', 'offer', 'pieces', 'ready', 'silk']);
  const u = step(road, 'unlock');
  assert.deepEqual([u.ok, u.done, u.total], [false, 14, 15]);
  assert.deepEqual([u.required.done, u.required.total, u.points.got, u.points.need, u.points.max], [10, 10, 21, 17, 25]);
  assert.deepEqual(u.tests.map((t) => [t.id, t.ok]), [['caravan', true], ['doubleJump', true], ['laceTower', true], ['bellhomeKey', false]]);
  const key = u.tests[3].key;
  assert.deepEqual([key.glory, key.got, key.need, key.ready], [true, 4, 2, true]);
  assert.deepEqual(step(road, 'pieces').pieces.map((p) => p.ok), [false, false, true, false]);
  // Once Pavo talks, the rule holds: the step is done, though the wish isn't offered yet.
  const after = A.next({ ...RP25, bellhomeKey: true });
  assert.equal(step(after, 'unlock').ok, true);
  assert.equal(A.group('Soul Snare', { ...RP25, bellhomeKey: true }).ok, true);
  assert.deepEqual([after.done, step(after, 'offer').ok], [1, false]);
});

test('a missing wish says what comes first; Broodfeast done the Runt way gives no point', () => {
  const road = A.next({ act: 2, quests: [] });
  const u = step(road, 'unlock');
  assert.equal(u.required.missing.length, 10);
  const statue = u.points.missing.find((m) => m.quest === 'Building Materials (Statue)');
  assert.deepEqual(statue.before, ['Building Materials', 'Building Materials (Bridge)']);
  assert.equal(CO.WISHES[statue.wish][2][1], 'Building Materials (Statue)');
  // Crawbug Clearing's first stage (Crow Feathers Pre) has its own title: it's the same wish.
  assert.deepEqual(u.required.missing.find((m) => m.quest === 'Crow Feathers').before, []);
  const runt = A.group('Soul Snare', { quests: ['Huntress Quest Runt'] });
  const broodfeast = A.group('Soul Snare', { quests: ['Huntress Quest'] });
  assert.deepEqual([runt.points.got, broodfeast.points.got], [0, 1]);
});

test('Act 2 to 3: the offer, the pieces (held, or given), the snare; a delivery is worth half a point', () => {
  const base = { ...RP25, bellhomeKey: true, snareOffered: true };
  let road = A.next(base);
  assert.deepEqual(road.steps.map((s) => s.ok), [true, true, false, false, false]);
  road = A.next({ ...base, snarePieces: Q.SNARE.map((x) => x.save) });
  assert.equal(step(road, 'pieces').ok, true);
  road = A.next({ ...base, snarePieces: [], snareReady: true, quests: [...base.quests, 'Soul Snare Pre', 'Soul Snare'] });
  assert.deepEqual([road.done, road.total], [4, 5]);
  const half = A.group('Soul Snare', { quests: ['Courier Delivery Songclave'] });
  assert.equal(half.points.got, 0.5);
});

test('game() reads the fields of the road, and a slot keeps them', () => {
  const pd = { silk: 0, CaravanTroupeLocation: 3, hasDoubleJump: true, defeatedLaceTower: true, BelltownGreeterHouseFullDlg: true,
    CaretakerOfferedSnareQuest: true, soulSnareReady: false, bellShrineWilds: true, visitedGrandGate: true, defeatedPhantom: true,
    Collectables: { savedData: [{ Name: 'Snare Soul Churchkeeper', Data: { Amount: 1 } }, { Name: 'Snare Soul Bell Hermit', Data: { Amount: 0 } }] },
    Tools: { savedData: [{ Name: 'Silk Snare', Data: { IsUnlocked: true } }] },
    QuestCompletionData: { savedData: [{ Name: 'Journal', Data: { IsCompleted: true } }, { Name: 'Skull King', Data: { IsAccepted: true } }] } };
  const g = F.game(pd);
  assert.deepEqual([g.caravan, g.doubleJump, g.laceTower, g.bellhomeKey, g.snareOffered, g.snareReady, g.grandGate, g.phantom, g.lastJudge],
    [3, true, true, true, true, false, true, true, false]);
  assert.deepEqual(g.snarePieces, ['Snare Soul Churchkeeper', 'Silk Snare']);
  assert.deepEqual(g.bellshrines, ['bellShrineWilds']);
  assert.deepEqual(g.quests, ['Journal']);
  assert.deepEqual(F.gameOf(F.toSnapshot(pd)), g);
});
