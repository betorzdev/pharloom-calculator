/* test/fight.test.js — Combat's fight played out (js/fight.js): the clock, silk, the Bind and its
   window, stagger as the Stun Control FSM runs it, the Crests' states and the Tools that answer a
   hit. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const F = require('../js/fight.js');

const kit = (over = {}) => ({
  masks: 5, spool: 12, regen: null, brew: 10, flint: 8, fury: { secs: 5, hurt: 2.5 }, reaper: { secs: 10 },
  bind: { cost: 9, heals: 3, seconds: 1.37, crest: null, warding: 0, mirror: 0, reserve: 0 },
  moves: {
    slash: { kind: 'needle', dmg: { '0000': 10, '1000': 13, '2000': 15, '0010': 15, '0001': 15, '0100': 12 }, stun: 1, silk: 1, dur: 0.41, quick: 0.35 },
    skill: { kind: 'skill', dmg: 40, stun: 1, cost: 4 },
    pin: { kind: 'tool', dmg: 8, stun: 0.25, ammo: 2 },
    brew: { kind: 'tool', effect: 'brew', ammo: 3 },
    phial: { kind: 'tool', effect: 'plasm', ammo: 3 },
    taunt: { kind: 'challenge', dmg: 2, stun: 0.5, silk: 1 },
  },
  ...over,
});
const foe = (hp = 1000) => ({ hp, max: hp, name: 'X' });
function play(k, acts, s = F.reset(k), tg = foe(), stun = null) {
  const ctx = { target: tg, stun, parts: [tg] };
  const evs = [];
  for (const a of acts) evs.push(...F.apply(s, k, typeof a === 'string' ? { type: 'move', id: a } : a, ctx));
  return { s, tg, evs };
}
const hit = (masks) => ({ type: 'foeHit', masks, label: 'x' });

test('a slash takes health, gives a strand up to the spool and takes the Crest\'s pace', () => {
  const k = kit();
  const { s, tg } = play(k, ['slash', 'slash']);
  assert.equal(tg.hp, 980);
  assert.equal(s.silk, 12, 'the spool starts full and holds no more');
  assert.equal(Math.round(s.clock * 100) / 100, 0.82);
  const b = play(k, ['skill', 'slash']);
  assert.equal(b.s.silk, 9);
});

test('Flea Brew: the quick pace while it lasts', () => {
  const { s } = play(kit(), ['brew', 'slash', 'slash']);
  assert.equal(Math.round(s.clock * 100) / 100, 0.7);
  assert.ok(s.brewUntil > s.clock);
});

test('the Bind heals when its window stays closed; a hit inside loses the heal and the spool', () => {
  const k = kit();
  let r = play(k, [hit(3), { type: 'bind' }, 'slash']);
  assert.equal(r.s.masks, 5);
  assert.equal(r.s.silk, 4, 'the Bind spent 9; the slash gave one back');
  r = play(k, [hit(3), { type: 'bind' }, hit(1)]);
  assert.equal(r.s.masks, 1, 'the heal is undone and the hit lands');
  assert.equal(r.s.silk, 0, 'every strand lost');
  assert.ok(r.evs.some((e) => e.kind === 'bindLost'));
});

test('the Warding Bell: no damage and a strike, but the Bind is still lost', () => {
  const k = kit({ bind: { cost: 9, heals: 3, seconds: 1.37, crest: null, warding: 9, mirror: 0, reserve: 0 } });
  const r = play(k, [hit(3), { type: 'bind' }, hit(2)]);
  assert.equal(r.s.masks, 2);
  assert.equal(r.s.silk, 3, 'the silk past the cost is kept');
  assert.equal(r.tg.hp, 991);
});

test('the Reserve Bind pays one Bind the silk can\'t', () => {
  const k = kit({ spool: 9, bind: { cost: 9, heals: 3, seconds: 1.37, crest: null, warding: 0, mirror: 0, reserve: 1 } });
  const r = play(k, ['skill', hit(3)]);
  assert.equal(F.why(r.s, k, 'bind', { target: r.tg }), '');
  play(k, [{ type: 'bind' }, { type: 'done' }], r.s, r.tg);
  assert.equal(r.s.masks, 5);
  assert.equal(r.s.reserve, 0);
  assert.equal(F.why(r.s, k, 'bind', { target: r.tg }), 'full');
});

test('the Hunter\'s focus builds with hits and is lost with one taken', () => {
  const k = kit({ hunter: [6, 12] });
  const r = play(k, Array(6).fill('slash'));
  assert.equal(F.focusLevel(r.s, k), 1);
  play(k, ['slash'], r.s, r.tg);
  assert.equal(r.tg.hp, 1000 - 60 - 13);
  play(k, [hit(1)], r.s, r.tg);
  assert.equal(F.focusLevel(r.s, k), 0);
});

test('the Beast\'s Bind is fury: a mask back per needle hit, up to its heal', () => {
  const k = kit({ bind: { cost: 9, heals: 3, seconds: 1, crest: 'beast', warding: 0, mirror: 0, reserve: 0 } });
  const r = play(k, [hit(4), { type: 'bind' }, 'slash', 'slash', 'slash', 'slash']);
  assert.equal(r.s.masks, 4, '1 left, three back');
  assert.equal(r.tg.hp, 1000 - 48);
});

test('the Challenge arms the next needle hit only with a strand to swirl', () => {
  const k = kit();
  const r = play(k, ['taunt', 'slash', 'slash']);
  assert.equal(r.tg.hp, 1000 - 2 - 15 - 10);
});

test('Plasmium masks go first, and the Fractured Mask leaves one', () => {
  const k = kit({ fractured: true });
  const r = play(k, ['phial', hit(1)]);
  assert.equal(r.s.masks, 5);
  play(k, [hit(9)], r.s, r.tg);
  assert.equal(r.s.masks, 1);
  assert.equal(r.s.fractured, false);
  play(k, [hit(1)], r.s, r.tg);
  assert.equal(F.alive(r.s), false);
});

test('Druid\'s Eye: a strand every second hit below a full spool', () => {
  const k = kit({ eye: 1 });
  const r = play(k, ['skill', hit(1), hit(1)]);
  assert.equal(r.s.silk, 9);
});

test('stagger: the combo, then the total, then down for its seconds less each hit', () => {
  const cfg = { max: 10, combo: 8, window: 1, secs: 2, shave: 0.25 };
  const k = kit();
  let r = play(k, Array(8).fill('slash'), undefined, foe(), cfg);
  assert.ok(r.evs.some((e) => e.kind === 'stagger' && e.combo), 'eight in a row');
  assert.ok(r.tg.stag.down);
  const until = r.tg.stag.until;
  play(k, ['pin'], r.s, r.tg, cfg);
  assert.equal(Math.round((until - r.tg.stag.until) * 100) / 100, 0.25);
  // Spaced out past the window, only the total: the hit after it reaches 10.
  r = { s: F.reset(k), tg: foe() };
  const ctx = { target: r.tg, stun: cfg, parts: [r.tg] };
  let n = 0;
  while (!(r.tg.stag && r.tg.stag.down) && n < 20) {
    F.apply(r.s, k, { type: 'move', id: 'slash' }, ctx);
    r.s.clock += 1.5;   // past the combo window
    n++;
  }
  assert.equal(n, 11);
});

test('Silk Hearts: a strand below their cap after the silk stays still', () => {
  const k = kit({ spool: 9, regen: { cap: 3, first: 1.45, next: 3.9 } });
  const r = play(k, ['skill', 'skill']);
  assert.equal(r.s.silk, 1);
  const tk = F.nextTick(r.s, k, { target: r.tg });
  assert.equal(tk.what, 'hearts');
  play(k, [{ type: 'wait' }], r.s, r.tg);
  assert.equal(r.s.silk, 2);
});
