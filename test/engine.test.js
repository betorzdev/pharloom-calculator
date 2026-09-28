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
  // The Bind FSM's times: two Binds of 0.8 × 0.6 = 0.48 s, each with its 0.17 s burst: 1.3 s, the
  // Bind page's table (not 1.37 × 0.6). Alone: 1.2 + 0.17, 2 × (0.8 + 0.17), 1.2 × 0.6 + 0.17.
  assert.deepEqual(c.health.bind, { heals: 4, parts: [2, 2], seconds: 1.3 });
  assert.deepEqual([[], ['multibinder'], ['injector-band']].map((tools) => E.compute({ tools }).health.bind.seconds), [1.37, 1.94, 0.89]);
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

test('the Binds in a fight: its silk in order, capped by the spool, and the hits they let you take', () => {
  const foe = { id: 'z', hp: 300, mods: [1, 1, 1, 1, 1] };
  const r = E.compute({ needle: 0, skill: 'silkspear' }, { foe });
  // 31 slashes and 10 casts of 4: 9 + 31 = 40 silk, all of it cast (as soon as it's there, so the
  // spool is never full and nothing is lost), none left for a Bind: 5 hits of 1 kill.
  const p = E.plan(r, 300);
  const { hearts: h0, ...b0 } = E.binds(r, p);
  assert.deepEqual(b0, { spool: 9, slashes: 31, casts: 10, skill: 4, reserve: 0 });
  assert.equal(h0.strands, 0);
  assert.deepEqual(E.endure(r, 1, E.binds(r, p)), { hits: 5, binds: 0 });
  // The spool's cap, by hand: 10 slashes, a spool of 9 full to start, hits of 2 on 5 masks.
  // 3 hits come after 1, 5 and 8 slashes: the first slash is lost (full); 5 → 3; 3 → 1, Bind
  // (9 → 0 silk) to 4; 3 slashes, 3 silk, 4 → 2, no Bind: she lives. 4 hits, after 1, 3, 6 and
  // 8: 3; 1, Bind to 4; 2 with 3 silk; 0 with 5. The lump sum (9 + 10 = 19) paid two.
  const r2 = E.compute({ needle: 0 }, { foe });
  const ten = { spool: 9, slashes: 10, casts: 0, skill: 0, reserve: 0 };
  assert.deepEqual(E.endure(r2, 2, ten), { hits: 4, binds: 1 });
  // No Skill, the plan's 60 slashes (as the model gives them, the cases above are by hand): 21
  // hits of 1 kill (26 with the old lump sum of 69 silk), 8 of 2 (13).
  const b2 = E.binds(r2, E.plan(r2, 300));
  assert.deepEqual([b2.spool, b2.slashes, b2.casts], [9, 60, 0]);
  assert.deepEqual(E.endure(r2, 1, b2), { hits: 21, binds: 3 });
  assert.deepEqual(E.endure(r2, 2, b2), { hits: 8, binds: 1 });
  // No slash at all: every hit at once, on the spool. The Reserve Bind: one more when the silk
  // isn't there. 5 → 2, Bind (9 → 0); 5 → 2, the Reserve's; 5 → 0: 11 hits.
  const none = { spool: 9, slashes: 0, casts: 0, skill: 0, reserve: 1 };
  assert.deepEqual(E.endure(E.compute({ tools: ['reserve-bind'] }), 1, none), { hits: 11, binds: 2 });
  // Druid's Eye: a hit at a full spool doesn't count. 5 → 2 at full, Bind (0 silk); then every
  // second hit a strand: 2 by the eighth, which kills.
  assert.deepEqual(E.endure(E.compute({ tools: ['druids-eye'] }), 1, { ...none, reserve: 0 }), { hits: 8, binds: 1 });
  // A hit that takes every mask: Binds don't help.
  assert.deepEqual(E.endure(r2, 5, b2), { hits: 1, binds: 0 });
});

test("Silk Hearts' regeneration: below their cap, and only while the silk doesn't change", () => {
  // The Hero prefab's times: 0.65 + 0.8 = 1.45 s from an empty spool (the Silk page's 1.45, not the
  // Silk Heart page's 1.5), 2.0 + 1.9 = 3.9 s otherwise (not 4.25).
  const r = E.compute({ hearts: 3 });
  // A quiet 10 s from empty: 1.45, 5.35, 9.25: three strands, the cap. In 9 s, two.
  assert.deepEqual(E.regen(r, 10, 0, 0), { cap: 3, first: 1.45, next: 3.9, strands: 3 });
  assert.equal(E.regen(r, 9, 0, 0).strands, 2);
  // At the cap or above, nothing: the spool full, or no Heart at all.
  assert.equal(E.regen(r, 60, 0, 3).strands, 0);
  assert.deepEqual(E.regen(E.compute({}), 60, 0, 0), { cap: 0, first: 1.45, next: 3.9, strands: 0 });
  // Weavelight: +1 to the cap and ×0.65 the times, 0.9425 and 2.535 s; alone, one strand.
  const w = E.compute({ tools: ['weavelight'] });
  assert.deepEqual(E.regen(w, 5, 0, 0), { cap: 1, first: 0.9425, next: 2.535, strands: 1 });
  // A slash every 5 s from empty: the first makes it 1; 3.9 s later a strand (2); the slash at 5
  // makes it 3, the cap: one strand in 10 s.
  assert.equal(E.regen(r, 10, 5, 0).strands, 1);
  // Slashing nonstop (the Hunter's 0.41 s), even from empty: every strand that lands restarts
  // the timer, which never runs out.
  assert.equal(E.regen(r, 20, 0.41, 0).strands, 0);
  // So the fight's Binds don't change: the spool full to start, a slash every 0.41 s for the
  // 24.19 s the Needle takes to kill 300 (60 slashes of 5, 59 intervals).
  const foe = { id: 'z', hp: 300, mods: [1, 1, 1, 1, 1] };
  const r2 = E.compute({ needle: 0, hearts: 3, tools: ['weavelight'] }, { foe });
  const b = E.binds(r2, E.plan(r2, 300));
  assert.deepEqual(b.hearts, { cap: 4, first: 0.9425, next: 2.535, strands: 0, seconds: 24.19 });
});

test('a boss\'s phases: a share of its health or a number, or bars of their own, or pieces', () => {
  const h = { total: 21, rest: 21 };
  // Lace in the Cradle: 800, phases at 75% and 40% → 600 and 320 left, 200 and 480 dealt.
  assert.deepEqual(E.phases({ at: [0.75, 0.4] }, 800, h), [
    { n: 2, left: 600, share: 0.75, below: false, dealt: 200, of: null, uses: 10 }, { n: 3, left: 320, share: 0.4, below: false, dealt: 480, of: null, uses: 23 }]);
  // Widow: 70% of 360 and a plain 150.
  assert.deepEqual(E.phases({ at: [0.7, 150] }, 360).map((x) => x.left), [252, 150]);
  // Grand Mother Silk's six bars, 1224 in all: each phase after the ones before.
  const gms = { bars: [100, 192, 240, 110, 242, 340] };
  assert.deepEqual(E.phases(gms, 1224).map((x) => x.dealt), [100, 292, 532, 642, 884]);
  // With another health the bars don't add up: none.
  assert.deepEqual(E.phases(gms, 2448), []);
  assert.deepEqual(E.phases(null, 800), []);
  // The file itself: Lace's second fight, the game's own shares.
  assert.deepEqual(require('../js/phases.js')['lace-the-cradle'], { at: [0.75, 0.4] });
  // A share is truncated, as the game's MultiplyIntByFloat: 45% of 550 is 247 (the wiki's 248),
  // of 650 is 292; Phantom's rage, 70% then half of 650, 227.
  assert.deepEqual(E.phases({ at: [0.8, 0.45] }, 550).map((x) => x.left), [440, 247]);
  assert.deepEqual(E.phases({ at: [0.8, 0.45] }, 650).map((x) => x.left), [520, 292]);
  assert.deepEqual(E.phases({ at: [0.35] }, 650).map((x) => x.left), [227]);
  // Of one of the fight's bars: Signis's 720 of the Forebrothers' 1240, the damage to him.
  assert.deepEqual(E.phases({ at: [0.9, 0.7, 0.5], of: 720 }, 1240, h).map((x) => [x.left, x.dealt, x.of, x.uses]),
    [[648, 72, 720, 4], [504, 216, 720, 11], [360, 360, 720, 18]]);
  // Bars in pieces: Father of the Flame's four lanterns of 100, then its core; damage past a
  // lantern's 0 is lost, so the slashes are each lantern's (5 of 21 each, 20).
  const fof = { bars: [400, 250], pieces: [4, 1], hits: [12, 30] };
  assert.deepEqual(E.phases(fof, 650, h), [{ n: 2, left: 250, share: null, below: false, dealt: 400, of: null, uses: 20 }]);
});

test('a strict "<": the game moves on below the threshold, not at it', () => {
  const P = require('../js/phases.js');
  // The Bell Eater's IntCompare: head + rear below 75% and 40% of 800, so at 599 and 319.
  assert.deepEqual(P['bell-eater'], { at: [0.75, 0.4], below: [0.75, 0.4] });
  assert.deepEqual(E.phases(P['bell-eater'], 800, { total: 21, rest: 21 }).map((x) => [x.left, x.below, x.dealt, x.uses]),
    [[599, true, 201, 10], [319, true, 481, 23]]);
  // The Fourth Chorus's CompareHP below 451, 326 and 201: at 450, 325 and 200.
  assert.deepEqual(E.phases(P['fourth-chorus'], 500).map((x) => x.left), [450, 325, 200]);
  // Gurr: his rage below 40% (399), but 60% at or below, as his throws already change at 600.
  assert.deepEqual(E.phases(P['gurr-the-outcast'], 1000).map((x) => x.left), [600, 399]);
  // Lace in the Cradle compares at or below: unchanged.
  assert.deepEqual(E.phases(P['lace-the-cradle'], 800).map((x) => x.left), [600, 320]);
});

test('Father of the Flame\'s pieces: by damage or by counted hits, with the cooldown run while still', () => {
  const P = require('../js/phases.js')['father-of-the-flame'];
  // From the game's FSMs: a lantern's hit counts after 1 s still, past its 0.55 s recovery; the core's 0.5 s past 0.1 s.
  assert.deepEqual([P.cooldown, P.recover, P.hits], [[1, 0.5], [0.55, 0.1], [12, 30]]);
  const low = { total: 5, rest: 5 };
  // At the Hunter's 0.41 s, a lantern never gets still (only the first counts) and the core
  // counts one hit in 2: damage breaks both (20 and 50 slashes), though 12 and 30 hits spaced
  // 1.55 s and 0.6 s apart would.
  const at = (t) => E.pieces(P, low, t).map((p) => [p.each, p.uses, p.by, p.spaced, p.gap]);
  assert.deepEqual(at(0.41), [[null, 20, 'damage', 12, 1.55], [2, 50, 'damage', 30, 0.6]]);
  // The Wanderer's 0.3 s: the core, one in 3.
  assert.equal(E.pieces(P, low, 0.3)[1].each, 3);
  // Slower than the recovery plus the cooldown, every hit counts, and the count comes first.
  assert.deepEqual(at(2), [[1, 12, 'hits', 12, 1.55], [1, 30, 'hits', 30, 0.6]]);
  // With 0.6 s between slashes the core counts every one: 30 before 50.
  assert.deepEqual(at(0.6)[1], [1, 30, 'hits', 30, 0.6]);
  // A strong Needle: damage first whatever the pace (5 of 21 a lantern, 12 for the core), no spacing helps.
  assert.deepEqual(E.pieces(P, { total: 21, rest: 21 }, 2).map((p) => [p.uses, p.by, p.spaced]), [[5, 'damage', null], [12, 'damage', null]]);
  // The phase: the four lanterns' slashes at that pace, 4 × 12 when the count breaks them.
  assert.equal(E.phases(P, 650, low, 2)[0].uses, 48);
  assert.equal(E.phases(P, 650, low, 0.41)[0].uses, 80);
  assert.deepEqual(E.pieces(null), []);
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
