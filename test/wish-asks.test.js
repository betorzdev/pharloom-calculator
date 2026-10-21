/* test/wish-asks.test.js — every wish's targets on the Map (the wishes' audit, 21-Oct-2026): what a
   wish asks for that another layer marks is on its pin (js/spots.js ASKS), Ecstasy of the End's
   three Flea Games are marks of their own, done by the game's own test, and The Lost Fleas is done
   with its quest, not before. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const CO = require('../js/collectibles.js');
const SP = require('../js/spots.js');
const F = require('../js/savefile.js');

const keyOk = (k) => {
  const [cat, id] = k.split(':');
  if (cat === 'piece') return !!CO.PIECES[+id];
  if (cat === 'extra') return !!SP.EXTRAS[+id];
  if (cat === 'tools') return !!SP.AT.tools[id];
  return false;
};

test('what a wish asks for that another layer marks is on its pin (ASKS)', () => {
  for (const [q, asks] of Object.entries(SP.ASKS)) {
    for (const a of asks) {
      assert.ok(a.n > 0 && a.keys.length, `${q} ${a.save}`);
      for (const k of a.keys) assert.ok(keyOk(k), `${q}: ${k}`);
    }
  }
  const of = (q, save) => (SP.ASKS[q] || []).find((a) => a.save === save) || {};
  const pieces = (kind) => CO.PIECES.flatMap((p, i) => (p[0] === kind ? ['piece:' + i] : []));
  // Pinmaster's Oil: any of the three Pale Oils, met once one is held.
  assert.deepEqual(of('A Pinsmiths Tools', 'Pale_Oil'), { save: 'Pale_Oil', n: 1, keys: pieces('pale-oil'), held: true });
  // Berry Picking: three of the Mossberries, held.
  const berries = SP.EXTRAS.flatMap((x, i) => (x[0] === 'mossberry' ? ['extra:' + i] : []));
  assert.deepEqual(of('Mossberry Collection 1', 'Mossberry'), { save: 'Mossberry', n: 3, keys: berries, held: true });
  // The Lost Fleas: five of the thirty fleas saved.
  assert.deepEqual(of('Save the Fleas', 'FleasCollected Target'), { save: 'FleasCollected Target', n: 5, keys: pieces('flea'), held: false });
  assert.equal(pieces('flea').length, 30);
  // Dark Hearts: twelve of the Void Masses, every one of them.
  const cores = SP.EXTRAS.flatMap((x, i) => (x[4] && x[4].key === 'NAME_BLACK_THREAD_CORE' ? ['extra:' + i] : []));
  assert.ok(cores.length >= 45);
  assert.deepEqual(of('Destroy Thread Cores', 'Black Thread Core'), { save: 'Black Thread Core', n: 12, keys: cores, held: false });
  // Silk and Soul's Snare Setter, beside its three souls (TASKS qitems).
  assert.deepEqual(of('Soul Snare', 'Silk Snare'), { save: 'Silk Snare', n: 1, keys: ['tools:snare-setter'], held: true });
  assert.equal(SP.TASKS.filter((x) => x[0] === 'qitem' && x[1] === 'Soul Snare').length, 3);
});

test('Ecstasy of the End\'s three Flea Games are marked at their hosts, each done past its champion\'s highscore', () => {
  const games = SP.TASKS.filter((x) => x[0] === 'qitem' && x[1] === 'Flea Games');
  assert.deepEqual(games.map((x) => x[2]), [
    ['any', ['min', 'fleaGames_juggling_highscore', 31], ['quest', 'Flea Games']],
    ['any', ['min', 'fleaGames_dodging_highscore', 66], ['quest', 'Flea Games']],
    ['any', ['min', 'fleaGames_bouncing_highscore', 43], ['quest', 'Flea Games']],
  ]);
  for (const x of games) assert.equal(x[3].toLowerCase(), 'aqueduct_05_festival');
  assert.deepEqual(games.map((x) => x[5].key), ['FESTIVAL_BOARD_TITLE_JUGGLE', 'FESTIVAL_BOARD_TITLE_DODGE', 'FESTIVAL_BOARD_TITLE_BOUNCE']);
  const at = (pd) => SP.TASKS.map((x, i) => i).filter((i) => SP.TASKS[i][1] === 'Flea Games' && F.game({ silk: 0, silkMax: 9, ...pd }).tasks.includes(i)).length;
  const taken = { QuestCompletionData: { savedData: [{ Name: 'Flea Games', Data: { IsAccepted: true, IsCompleted: false } }] } };
  assert.equal(at({ ...taken, fleaGames_juggling_highscore: 30 }), 0);
  assert.equal(at({ ...taken, fleaGames_juggling_highscore: 31, fleaGames_dodging_highscore: 66 }), 2);
});

test('The Lost Fleas is done once Save the Fleas is, not its Wishwall step before it', () => {
  const w = CO.WISHES.find((x) => x[4].key === 'QUEST_FLEAS_TITLE');
  assert.deepEqual(w[2], ['quest', 'Save the Fleas']);
  const done = (data) => F.game({ silk: 0, silkMax: 9, QuestCompletionData: { savedData: data } }).wishes.includes(CO.WISHES.indexOf(w));
  assert.equal(done([{ Name: 'Save the Fleas Pre', Data: { IsAccepted: true, IsCompleted: true } }, { Name: 'Save the Fleas', Data: { IsAccepted: true, IsCompleted: false } }]), false);
  assert.equal(done([{ Name: 'Save the Fleas Pre', Data: { IsAccepted: true, IsCompleted: true } }, { Name: 'Save the Fleas', Data: { IsAccepted: true, IsCompleted: true } }]), true);
});
