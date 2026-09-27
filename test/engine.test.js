/* test/engine.test.js — Hornet's figures against the wiki's: its rounding example, the Needle per
   level, the Needle Strike, the six Silk Skills per level (design/00-study.md §2.5's table, from
   the damage page), the Tools, silk, the Bind and the slots. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
const E = require('../js/engine.js');

const levels = (f) => [0, 1, 2, 3, 4].map((needle) => f(E.compute({ needle, kit: needle })));

test("half to the even integer, the wiki's worked examples among them", () => {
  assert.deepEqual([0.5, 1.5, 2.5, 3.5, 79.75, 65.25, 4.4999].map(E.roundHalfEven), [0, 2, 2, 4, 80, 65, 4]);
  assert.equal(E.roundHalfEven(29 * 2.75), 80);   // the damage page: 29 × 1 × 2.75 = 79.75 → 80
  assert.equal(E.roundHalfEven(29 * 2.25), 65);   // 65.25 → 65
});

test('the Needle is 5/9/13/17/21, and its modifiers add inside one bracket', () => {
  assert.deepEqual(levels((c) => c.needle.slash), [5, 9, 13, 17, 21]);
  // Barbed Bracelet: 21 × 1.25 = 26.25 → 26.
  assert.equal(E.compute({ needle: 4, tools: ['barbed-bracelet'] }).needle.slash, 26);
  // The evolved Hunter's full focus (+0.3 +0.2) and the Bracelet add: 21 × 1.75 = 36.75 → 37.
  const c = E.compute({ needle: 4, crest: 'hunter', hunterStage: 3, focus: true, tools: ['barbed-bracelet'] });
  assert.equal(c.needle.bracket, 1.75);
  assert.equal(c.needle.slash, 37);
  // Focus needs an evolved Crest; the Beast's fury needs the Beast.
  assert.equal(E.compute({ needle: 4, focus: true }).needle.slash, 21);
  assert.equal(E.compute({ needle: 4, crest: 'beast', fury: true }).needle.slash, 26);
  assert.equal(E.compute({ needle: 4, fury: true }).needle.slash, 21);
});

test("the Wanderer's critical hit is ×3 after the bracket, 2% of hits (2.2% with Magnetite Dice)", () => {
  const w = E.compute({ needle: 2, crest: 'wanderer' });
  assert.deepEqual(w.needle.crit, { damage: 39, chance: 0.02 });
  assert.equal(E.compute({ needle: 2, crest: 'wanderer', tools: ['magnetite-dice'] }).needle.crit.chance, 0.022);
  assert.equal(E.compute({ needle: 2 }).needle.crit, null);
});

test('the Needle Strike per Crest: the Hunter\'s two hits, 14 → 58', () => {
  assert.deepEqual(levels((c) => c.strike.total), [14, 26, 36, 48, 58]);
  assert.equal(E.compute({ crest: 'witch' }).strike.minHits, 2);
});

test("the six Silk Skills per Needle level, as the study's table", () => {
  const want = {
    silkspear: [15, 27, 39, 51, 63], 'thread-storm': [17, 30, 43, 56, 69], 'cross-stitch': [16, 28, 40, 52, 64],
    sharpdart: [17, 31, 45, 59, 73], 'rune-rage': [10, 19, 27, 36, 44], 'pale-nails': [15, 27, 39, 51, 63],
  };
  for (const [id, row] of Object.entries(want)) assert.deepEqual(levels((c) => c.skills.find((s) => s.id === id).total), row, id);
  // Shaman and Volt Filament add: 63 × 1.65 = 103.95 → 104.
  const s = E.compute({ needle: 4, crest: 'shaman', tools: ['volt-filament'] }).skills.find((x) => x.id === 'silkspear');
  assert.equal(s.total, 104);
});

test('a Tool at the Kit\'s level, its ammo at the Pouch\'s, a full load and its refill; follow-ups round down', () => {
  const pin = E.compute({ kit: 0, pouch: 0, tools: ['straight-pin'] }).tools[0];
  assert.deepEqual([pin.attacks[0].total, pin.ammo, pin.load, pin.refill], [5, 12, 60, 40]);
  // The cost is per unit (3.33): 40 shards from empty at the base capacity, 80 with the Pouch at its top.
  const top = E.compute({ kit: 4, pouch: 4, tools: ['straight-pin'] }).tools[0];
  assert.deepEqual([top.ammo, top.refill], [24, 80]);
  // Threefold Pin at level 0: 4 + 2 + 1.
  assert.deepEqual(E.compute({ kit: 0, tools: ['threefold-pin'] }).tools[0].attacks[0].each, [4, 2, 1]);
  // No player modifier reaches a Tool: the Bracelet leaves the pin as it is.
  assert.equal(E.compute({ kit: 4, tools: ['straight-pin', 'barbed-bracelet'] }).tools[0].attacks[0].total, 17);
});

test('silk, the Bind and the slots', () => {
  const c = E.compute({ spools: 9, masks: 5, hearts: 3, tools: ['spool-extender', 'egg-of-flealia', 'multibinder', 'injector-band'] });
  assert.deepEqual([c.silk.spool, c.silk.skill, c.silk.casts, c.health.masks], [21, 3, 7, 10]);
  assert.deepEqual(c.health.bind, { heals: 4, parts: [2, 2], seconds: 0.82 });
  // The Hunter: one red open and one locked; three reds is one too many.
  const h = E.compute({ tools: ['straight-pin', 'threefold-pin', 'tacks'] });
  assert.deepEqual(h.slots.red, { open: 1, locked: 1, extra: 0, used: 3, over: 1 });
  // The Vesticrest's yellow slot: three yellows fit the Hunter with it (a real save, 27-Sep-2026).
  const y = ['magnetite-dice', 'magnetite-brooch', 'compass'];
  assert.equal(E.compute({ tools: y }).slots.yellow.over, 1);
  assert.equal(E.compute({ tools: y, vest: { yellow: true } }).slots.yellow.over, 0);
});
