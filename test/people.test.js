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
    for (const [, , scene] of x.at || []) assert.ok(x.spots.some((s) => s[0] === scene), `${x.id}: ${scene} isn't a spot of theirs`);
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
