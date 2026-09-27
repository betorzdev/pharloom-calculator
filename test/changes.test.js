/* test/changes.test.js — "Since last time": what a game gained between two saves, only gains.
   Checked while writing it on the author's restore points (each one's event, GAINED_BEAST…,
   is among what's new against the one before); here, on made-up games. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const CO = require('../js/collectibles.js');
const F = require('../js/savefile.js');
const CH = require('../js/changes.js');

const empty = () => F.gameOf({});
const shard = CO.PIECES.findIndex((p) => p[0] === 'mask-shard');
const needle1 = CO.PIECES.findIndex((p) => p[0] === 'needle');

test('what a game gained, in the order it is told, and the completion it went up by', () => {
  const a = { ...empty(), tools: ['straight-pin'], journal: { mossgrub: 3, 'moss-mother': 0 } };
  const b = { ...a, act: 2, crests: ['hunter', 'beast'], tools: ['straight-pin', 'curvesickle'], needle: 1, pieces: [shard, needle1],
    journal: { mossgrub: 30, 'moss-mother': 0, 'bell-beast': 1 } };
  const c = CH.diff(a, b);
  assert.deepEqual(c.map((x) => x.kind), ['act', 'crest', 'crest', 'tool', 'upgrade', 'piece', 'journal', 'journal', 'pct']);
  assert.deepEqual(c.find((x) => x.kind === 'upgrade'), { kind: 'upgrade', id: 'needle', to: 1 });
  // The Needle's upgrade is told once, as an upgrade, not again as a piece.
  assert.deepEqual(c.filter((x) => x.kind === 'piece'), [{ kind: 'piece', i: shard }]);
  assert.deepEqual(c.filter((x) => x.kind === 'journal'), [
    { kind: 'journal', id: 'mossgrub', done: true, was: true }, { kind: 'journal', id: 'bell-beast', done: true }]);
  assert.deepEqual(c.at(-1), { kind: 'pct', from: 1, to: 4 });
});

test('losses are not told, and the same game twice is nothing', () => {
  const a = { ...empty(), tools: ['straight-pin'], masks: 2 };
  assert.deepEqual(CH.diff(a, { ...a, tools: [], masks: 1 }), []);
  assert.deepEqual(CH.diff(a, a), []);
  assert.deepEqual(CH.diff(null, a), []);
});
