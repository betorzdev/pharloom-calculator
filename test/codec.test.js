/* test/codec.test.js — a build in the URL: it goes and comes back the same, writes only what
   differs from the base, and a damaged or partial link gives what it can. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
const E = require('../js/engine.js');
const C = require('../js/codec.js');

test('a build goes into the URL and comes back the same', () => {
  const st = E.normalize({ crest: 'architect', needle: 4, kit: 3, pouch: 2, masks: 5, spools: 9, hearts: 3,
    tools: ['straight-pin', 'compass'], skill: null, vest: { yellow: true, blue: false } });
  const text = C.encode(st);
  assert.equal(text, 'v=1&crest=architect&needle=4&kit=3&pouch=2&masks=5&spools=9&hearts=3&tools=straight-pin,compass&vest=y');
  assert.deepEqual(C.decode(text), st);
  const h = E.normalize({ hunterStage: 3, skill: 'silkspear' });
  assert.equal(C.encode(h), 'v=1&stage=3&skill=silkspear');
  assert.deepEqual(C.decode('#' + C.encode(h)), h);
});

test("the base writes nothing but the version; a damaged link keeps what it can read", () => {
  assert.equal(C.encode({}), 'v=1');
  assert.equal(C.decode('crest=beast'), null);   // no version: not a build
  const d = C.decode('v=1&crest=nope&needle=9&tools=straight-pin,nothing&skill=x');
  assert.deepEqual([d.crest, d.needle, d.tools, d.skill], ['hunter', 4, ['straight-pin'], null]);
});
