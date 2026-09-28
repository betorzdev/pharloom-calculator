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

test("the Crests' own slashes: the Architect's drills and the Witch's whip, each hit rounded on its own", () => {
  // Architect, Pale Steel (21): 0.9x + 0.1x + 0.1x = 18.9 → 19, 2.1 → 2, 2 → 23 in all.
  const a = E.compute({ crest: 'architect', needle: 4 }).needle.attacks;
  assert.deepEqual(a.find((x) => x.id === 'slash').each, [19, 2, 2]);
  // Its down-slash: 0.55x + 0.5x = 11.55 → 12, 10.5 → 10 (half to even); held, two more of 0.5x.
  const down = a.find((x) => x.id === 'down');
  assert.deepEqual([down.each, down.charged], [[12, 10], 20]);
  // The Witch's run-slash: 1x + 0.5x, and 0.5x more when it lands.
  const run = E.compute({ crest: 'witch', needle: 4 }).needle.attacks.find((x) => x.id === 'run');
  assert.deepEqual([run.each, run.onHit], [[21, 10], 10]);
  // Everyone else slashes once at the Needle's damage.
  assert.deepEqual(E.compute({ crest: 'reaper', needle: 4 }).needle.attacks.map((x) => x.total), [21, 21, 21]);
});

test("against an enemy: the wiki's two worked examples, and uses to kill", () => {
  // "One Needle upgrade, Barbed Bracelet, an enemy whose level 1 modifier is 0.8": 9 × 0.8 × 1.25 = 9.
  const foe = { id: 'x', hp: 100, mods: [1, 0.8, 1, 1, 1] };
  assert.equal(E.compute({ needle: 1, tools: ['barbed-bracelet'] }, { foe }).needle.slash, 9);
  // "Fully evolved Hunter, focus, all upgrades, Bracelet, Flintslate, a Challenge; a Needle Strike
  // against a level 4 modifier of 1": the first hit 29 × 2.75 = 79.75 → 80, the second 29 × 2.25 = 65.25 → 65.
  const full = { crest: 'hunter', hunterStage: 3, focus: true, needle: 4, tools: ['barbed-bracelet', 'flintslate'], flint: true, challenge: true };
  const s = E.compute(full, { foe: { id: 'y', hp: 1000, mods: [1, 1, 1, 1, 1] } }).strike;
  assert.deepEqual(s.each, [80, 65]);
  // Uses to kill 1000: the first Strike 145, then 130 each (no Challenge left): 1 + ceil(855 / 130) = 8.
  assert.deepEqual([s.total, s.rest, s.uses], [145, 130, 8]);
});

test("a real enemy's modifier at the level of what hits: Lace in the Cradle", () => {
  require('../js/enemies.js');
  const lace = globalThis.SS.enemies.FOES.find((f) => f.id === 'lace-the-cradle');   // 800, mods 1.75/1.2/1/0.85/0.85
  const c = E.compute({ needle: 4, kit: 0, tools: ['straight-pin'] }, { foe: lace });
  // Pale Steel (21) × 0.85 = 17.85 → 18; 800 / 18 → 45 slashes. A pin at Kit 0: 5 × 1.75 = 8.75 → 9.
  assert.equal(c.needle.slash, 18);
  assert.equal(c.needle.attacks[0].uses, 45);
  assert.equal(c.tools[0].attacks[0].total, 9);
  assert.equal(c.foe.hp, 800);
});

test('the fight as a whole: loads first, then the fewest slashes with the Skills silk pays for', () => {
  const foe = { id: 'z', hp: 300, mods: [1, 1, 1, 1, 1] };
  // Needle 0 (5), Silkspear 15 for 4 silk, a spool of 9 to start; no Tools.
  const r = E.compute({ needle: 0, skill: 'silkspear' }, { foe });
  // s slashes pay floor((9+s)/4) casts: 30 give 39 silk, 9 casts, 150 + 135 = 285, short; 31 give
  // 40 silk, 10 casts: 155 + 150 = 305.
  assert.deepEqual(E.plan(r, 300), { slashes: 31, casts: 10, throws: [], dealt: 305 });
  // With Straight Pins (12 × 5 = 60 at Kit 0, Pouch 0) spent first: 240 left → 24 slashes + 8 casts.
  const r2 = E.compute({ needle: 0, skill: 'silkspear', tools: ['straight-pin'] }, { foe });
  assert.deepEqual(E.plan(r2, 300), { slashes: 24, casts: 8, throws: [{ id: 'straight-pin', n: 12 }], dealt: 300 });
  // A small enemy the pins alone kill: only the throws it takes.
  assert.deepEqual(E.plan(r2, 23), { slashes: 0, casts: 0, throws: [{ id: 'straight-pin', n: 5 }], dealt: 25 });
  assert.equal(E.plan(r2, null), null);
});

test('how fast: each Crest\'s slash interval from the game\'s own timings, fury, Flea Brew, the seconds to kill', () => {
  const H = require('../js/hero.js');
  const every = (crest, x = {}) => E.compute({ crest, needle: 4, ...x }).needle.speed.interval;
  // The game's figures (tools/extract-hero.py): max(cooldown, duration).
  assert.deepEqual(['hunter', 'wanderer', 'beast', 'witch', 'architect', 'reaper', 'shaman'].map((c) => every(c)), [0.41, 0.3, 0.39, 0.45, 0.45, 0.5, 0.5]);
  assert.strictEqual(every('beast', { fury: true }), 0.32);
  assert.strictEqual(every('hunter', { hunterStage: 3 }), 0.41, 'the evolved Hunter slashes as fast');
  // Flea Brew halves the cooldown, but a slash never outpaces its own duration: 0.35 s, not 0.205.
  const brew = E.compute({ crest: 'hunter', needle: 4, tools: ['flea-brew'] }).needle.speed.brew;
  assert.deepEqual([brew.interval, brew.lasts], [0.35, H.QUICKENING]);
  assert.strictEqual(E.compute({ crest: 'hunter', needle: 4 }).needle.speed.brew, null, 'no Flea Brew worn');
  // DPS is the slash over its interval; the kill lands at (uses − 1) intervals: Lace, 12 slashes of 21.
  const lace = require('../js/enemies.js').FOES.find((f) => f.id === 'lace');
  const s = E.compute({ crest: 'hunter', needle: 4 }, { foe: lace }).needle.speed;
  assert.strictEqual(Math.round(s.dps * 100) / 100, Math.round((21 / 0.41) * 100) / 100);
  assert.strictEqual(s.seconds, 4.51);
});
