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

test("the Shaman's three Silk Skills travel in one field, and an older link's one skill still reads", () => {
  const link = C.encode({ crest: 'shaman', skills: ['silkspear', 'rune-rage', 'pale-nails'] });
  assert.match(link, /&skill=silkspear,rune-rage,pale-nails/);
  assert.deepEqual(C.decode(link).skills, ['silkspear', 'rune-rage', 'pale-nails']);
  assert.deepEqual(C.decode('v=1&skill=sharpdart').skills, ['sharpdart']);
});

test('the Silkshot held travels in the link, and only when it is not the Original', () => {
  assert.ok(!/shot=/.test(C.encode({ tools: ['silkshot'] })));
  const link = C.encode({ tools: ['silkshot'], silkshot: 'architect' });
  assert.match(link, /&shot=architect/);
  assert.equal(C.decode(link).silkshot, 'architect');
});

test("Free mode's build kept with every Crest's loadout and the Vesticrest's: the link carries only the build worn, and reads back exact", () => {
  const hunter = { crest: 'hunter', hunterStage: 3, needle: 4, vest: { yellow: true, blue: true }, tools: ['barbed-bracelet', 'straight-pin', 'compass'], skills: ['silkspear'] };
  const w = E.wearCrest(hunter, { reaper: { tools: ['tacks'], skills: ['rune-rage'] } }, { yellow: 'compass', blue: null }, 'witch');
  const stored = E.keep(w.st, w.loads, w.vesti);
  assert.deepEqual(Object.keys(stored.loadouts).sort(), ['hunter', 'reaper']);
  const link = C.encode(E.fit(E.kept(stored).st));
  assert.ok(!/tacks|rune-rage|barbed|loadouts|vesti/.test(link), 'the other Crests stay out of the link');
  assert.equal(C.encode(C.decode(link)), link);
  const d = C.decode(link);
  assert.deepEqual([d.crest, d.tools, d.skills], ['witch', ['straight-pin', 'compass'], ['silkspear']]);
  assert.deepEqual(E.seat(d).vest, { yellow: 'compass', blue: null }, "a link's Compass sits on the Vesticrest");
  // A link from before the loadouts reads as it did.
  const old = 'v=1&crest=architect&needle=4&kit=3&tools=straight-pin,compass&vest=y';
  assert.equal(C.encode(C.decode(old)), old);
});
