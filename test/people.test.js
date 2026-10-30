/* test/people.test.js: the Map's people (js/people.js): every one has a room on the map and a
   picture, the save keeps the fields their rules read, through a slot too. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const PE = require('../js/people.js');
const F = require('../js/savefile.js');

test('every person and trader has a room on the map and a picture', () => {
  assert.ok(PE.PEOPLE.length > 40);
  const ids = new Set();
  for (const x of [...PE.PEOPLE, ...PE.TRADE]) {
    assert.ok(!ids.has(x.id), `${x.id} twice`);
    ids.add(x.id);
    assert.ok(x.name && x.name.es && x.name.en, `${x.id} has no name`);
    assert.ok(x.spots.length, `${x.id} has no spot`);
    for (const [scene] of x.spots) assert.ok(R.roomOf(scene), `${x.id}: ${scene} isn't on the map`);
    if (x.art) {
      const file = path.join(__dirname, '..', 'assets', x.art.startsWith('journal/') ? 'icons' : 'map', x.art + '.webp');
      assert.ok(fs.existsSync(file), `${x.id}: ${file} is missing`);
    }
    // A room where another mark stands for them (who makes a wish there: Nuu at home) isn't a spot.
    const standsIn = (scene) => Object.entries(require('../js/spots.js').GIVER).some(([id, g]) => g && id.split(':')[0].toLowerCase() === scene && x.name.key.startsWith(g[0] + '_'));
    for (const [, , scene] of x.at || []) assert.ok(x.spots.some((s) => s[0] === scene) || standsIn(scene), `${x.id}: ${scene} isn't a spot of theirs`);
    for (const f of [...(x.met || []), ...(x.gone || []), ...(x.at || []).map((a) => a[0])]) assert.ok(PE.VARS.includes(f), `${x.id}: ${f} isn't in VARS`);
  }
});

test('a save keeps the fields the people\'s rules read, and a slot gives them back', () => {
  const f = PE.VARS[0], g = F.game({ silk: 0, [f]: true, notAPeopleField: true });
  assert.strictEqual(g.peopleVars[f], true);
  assert.ok(!('notAPeopleField' in g.peopleVars));
  const back = F.gameOf(F.toSnapshot({ silk: 0, [f]: true }));
  assert.strictEqual(back.peopleVars[f], true);
  assert.deepStrictEqual(F.gameOf({}).peopleVars, {});
});

test('each person once in a room: not again where who asks for a wish, a boss or the Herald stands for them', () => {
  const SP = require('../js/spots.js');
  const room = (s) => ((R.roomOf(s) || {}).scene || s).toLowerCase();
  const spotsOf = (id) => (PE.PEOPLE.find((x) => x.id === id) || { spots: [] }).spots.map(([s]) => room(s));
  // Who asks for a wish is named, the game's words, and isn't in Everyone else in that room.
  const [key, name] = SP.GIVER.Room_Huntress;
  assert.strictEqual(key, 'HUNTRESS');
  assert.deepStrictEqual([name.es, name.en], ['Cazadora', 'Huntress']);
  assert.ok(!spotsOf('huntress').includes(room('Room_Huntress')));
  // One with a mark of theirs there already has the wishes on it: Plinney, the Couriers' shop.
  assert.strictEqual(SP.GIVER.Belltown_Room_pinsmith[2], 'person:plinney');
  assert.strictEqual(SP.GIVER.Belltown[2], 'shop:couriers:0');
  // The Second Sentinel is its boss in its arena, but still stands in Song_07, where the save follows it.
  assert.ok(!spotsOf('song-knight').includes(room('Hang_17b')));
  assert.ok(spotsOf('song-knight').includes(room('Song_07')));
  // Mister Mushroom is the Herald's spot where the wish's mark is.
  assert.ok(!spotsOf('mr-mushroom').includes(room('Peak_08b')));
});

/* Where they are now (js/people.js here, HERE): the game's own switches, read in its scenes and its
   FSM templates (tools/gen-people.js), and the save says which hold (js/savefile.js peopleHere). */
const here = (pd, id) => Object.fromEntries(Object.entries(F.game({ silk: 0, ...pd }).peopleHere)
  .filter(([k]) => k.startsWith(id + ':')).map(([k, v]) => [k.slice(id.length + 1), v]));
const taken = (name, done) => ({ QuestCompletionData: { savedData: [{ Name: name, Data: { IsAccepted: true, IsCompleted: done } }] } });

test('Shakra: a rule for each of her 17 spots, and a save shows her only where she is now', () => {
  const SP = require('../js/spots.js');
  assert.deepStrictEqual(Object.keys(PE.HERE.shakra).sort(), SP.VENDORS.shakra.map((s) => s.toLowerCase()).sort());
  // A new game: ahead of Hornet in every area she maps, not yet at her rests, not in Act 3's posts.
  let at = here({}, 'shakra');
  assert.ok(at.bone_04 && at.bone_east_01 && at.shellwood_16 && at.peak_02 && at.dust_10);
  assert.ok(!at.belltown && !at.bonetown && !at.greymoor_08 && !at.shellwood_01);
  // Seen elsewhere (MapperLeft<Area>), or Hornet's past the area (the Bell Beast beaten): gone from the Marrow.
  assert.strictEqual(here({ MapperLeftBoneForest: true }, 'shakra').bone_04, false);
  at = here({ defeatedBellBeast: true }, 'shakra');
  assert.ok(!at.bone_04 && at.bonetown);
  // Greymoor's stays while Hornet rests at its bench.
  assert.strictEqual(here({ hasThreadSphere: true }, 'shakra').greymoor_02, false);
  assert.strictEqual(here({ hasThreadSphere: true, respawnScene: 'Greymoor_02' }, 'shakra').greymoor_02, true);
  // Mount Fay's keeps her until the Faydown Cloak, whatever its flag says.
  assert.strictEqual(here({ MapperLeftPeak: true }, 'shakra').peak_02, true);
  assert.strictEqual(here({ hasDoubleJump: true }, 'shakra').peak_02, false);
  // Bellhart from the Widow's fall, not while her last maps are bought and Trail's End isn't done.
  assert.strictEqual(here({ spinnerDefeated: true }, 'shakra').belltown, true);
  assert.strictEqual(here({ spinnerDefeated: true, ShakraFinalQuestAppear: true }, 'shakra').belltown, false);
  assert.strictEqual(here({ spinnerDefeated: true, ShakraFinalQuestAppear: true, ...taken('Shakra Final Quest', true) }, 'shakra').belltown, true);
  // Trail's End taken and not done: nowhere among her shops.
  assert.ok(Object.values(here({ spinnerDefeated: true, ...taken('Shakra Final Quest', false) }, 'shakra')).every((v) => !v));
  // Act 3, by mapperLocationAct3: both guard posts before she's met (0), Shellwood's at 1, Bellhart at 2, Greymoor's at 3.
  const act3 = (n, more) => Object.entries(here({ blackThreadWorld: true, mapperLocationAct3: n, ...more }, 'shakra'))
    .filter(([k, v]) => v && ['belltown', 'greymoor_08', 'shellwood_01'].includes(k)).map(([k]) => k).sort();
  assert.deepStrictEqual(act3(0), ['greymoor_08', 'shellwood_01']);
  assert.deepStrictEqual(act3(1), ['shellwood_01']);
  assert.deepStrictEqual(act3(2), ['belltown']);
  assert.deepStrictEqual(act3(3), ['greymoor_08']);
  assert.deepStrictEqual(act3(3, { CaravanTroupeLocation: 1 }), []);   // the caravan camps in Greymoor
  // A slot keeps it; one kept before says nothing (every spot shown).
  const back = F.gameOf(F.toSnapshot({ silk: 0, MapperLeftBoneForest: true }));
  assert.strictEqual(back.peopleHere['shakra:bone_04'], false);
  assert.deepStrictEqual(F.gameOf({}).peopleHere, {});
});

test('Jubilana: a rule for each of her 3 shops, her Act 3 stall in the Songclave\'s east corner', () => {
  const SP = require('../js/spots.js');
  assert.deepStrictEqual(Object.keys(PE.HERE.jubilana).sort(), SP.VENDORS.jubilana.map((s) => s.toLowerCase()).sort());
  const quests = (...q) => ({ QuestCompletionData: { savedData: q.map(([Name, IsAccepted, IsCompleted]) => ({ Name, Data: { IsAccepted, IsCompleted } })) } });
  const WM = 'Save City Merchant', LM = 'Save City Merchant Bridge';
  const shown = (pd) => Object.entries(here(pd, 'jubilana')).filter(([, v]) => v).map(([k]) => k).sort();
  // Not rescued yet (The Wandering Merchant taken: she's in Song_07, the wish's place): none of her shops.
  assert.deepStrictEqual(shown({ enclaveLevel: 1, ...quests([WM, true, false]) }), []);
  // Rescued: the Songclave; once met there, out scavenging too (the Forum after its battle).
  const met = { enclaveLevel: 2, cityMerchantInGrandForum: true, cityMerchantInLibrary03: true };
  assert.deepStrictEqual(shown({ enclaveLevel: 2, hang04Battle: true, ...quests([WM, true, true]) }), ['song_enclave']);
  assert.deepStrictEqual(shown({ ...met, ...quests([WM, true, true]) }), ['library_03', 'song_enclave']);
  assert.deepStrictEqual(shown({ ...met, hang04Battle: true, cityMerchantInLibrary03Left: true, ...quests([WM, true, true]) }), ['hang_04', 'song_enclave']);
  // The Lost Merchant posted (cityMerchantCanLeaveForBridge) and not done: gone from the Songclave; taken, from her scavenging spots too.
  assert.deepStrictEqual(shown({ ...met, cityMerchantCanLeaveForBridge: true, ...quests([WM, true, true]) }), ['library_03']);
  assert.deepStrictEqual(shown({ ...met, cityMerchantCanLeaveForBridge: true, ...quests([WM, true, true], [LM, true, false]) }), []);
  assert.deepStrictEqual(shown({ ...met, cityMerchantCanLeaveForBridge: true, ...quests([WM, true, true], [LM, true, true]) }), ['library_03', 'song_enclave']);
  // Act 3: only the Songclave, at the room's east corner (its Black Thread World stall).
  assert.deepStrictEqual(shown({ ...met, blackThreadWorld: true, hang04Battle: true, cityMerchantCanLeaveForBridge: true, ...quests([WM, true, true], [LM, true, true]) }), ['song_enclave']);
  const i = SP.VENDORS.jubilana.indexOf('song_enclave'), [x2, y2] = SP.XY['shop:jubilana:' + i], [x3, y3] = SP.XY['shop:jubilana:' + i + ':act3'];
  assert.ok(x3 - x2 > 10 && Math.abs(y3 - y2) < 2, `the Act 3 stall (${x3}, ${y3}) east of the Act 2 one (${x2}, ${y2})`);
});

test('the people the game moves or takes away: each spot by its own switches', () => {
  for (const x of PE.PEOPLE) for (const sc of Object.keys(x.here || {})) assert.ok(x.spots.some(([s]) => s === sc), `${x.id}: ${sc} isn't a spot of theirs`);
  // Ballow: the forge, the Deep Docks' sauna, then the diving bell.
  assert.deepStrictEqual(here({}, 'ballow'), { dock_10: false, dock_12: false, room_forge: true });
  assert.deepStrictEqual(here({ BallowInSauna: true }, 'ballow'), { dock_10: true, dock_12: false, room_forge: false });
  assert.deepStrictEqual(here({ BallowMovedToDivingBell: true }, 'ballow'), { dock_10: false, dock_12: true, room_forge: false });
  // Pilby: Bone Bottom, then the Pilgrim's Rest, outside or in; none of it in Act 3.
  assert.deepStrictEqual(here({}, 'little-pilgrim-n'), { bone_east_10: false, bone_east_10_room: false, bonetown: true });
  assert.deepStrictEqual(here({ skullKingKilled: true, pilbyAtPilgrimsRest: true, pilbyInsidePilgrimsRest: true }, 'little-pilgrim-n'),
    { bone_east_10: false, bone_east_10_room: true, bonetown: false });
  assert.ok(Object.values(here({ blackThreadWorld: true, pilbyAtPilgrimsRest: true }, 'little-pilgrim-n')).every((v) => !v));
  // The Second Sentinel rests where he's sent until he's met there.
  assert.strictEqual(here({ songChevalierActiveInSong_07: true }, 'song-knight').song_07, true);
  assert.strictEqual(here({ songChevalierActiveInSong_07: true, songChevalierSeenInSong_07: true }, 'song-knight').song_07, false);
  // Sherma's rescue only while Save Sherma is taken.
  assert.strictEqual(here(taken('Save Sherma', false), 'sherma').ward_09, true);
  assert.strictEqual(here(taken('Save Sherma', true), 'sherma').ward_09, false);
  // Act 3 takes some away for good (gone).
  for (const id of ['bell-hermit', 'last-conductor', 'fisher-npc']) assert.ok(PE.PEOPLE.find((x) => x.id === id).gone.includes('blackThreadWorld'), id);
});
