/* test/sim.test.js — the Combat screen's fight played out (js/sim.js): damage, silk, uses, the
   Bind, undo and the end. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const S = require('../js/sim.js');

const KIT = {
  hp: 100, masks: 5, spool: 10, bind: { cost: 9, heals: 3 },
  moves: { slash: { dmg: 22, gain: 1 }, skill: { dmg: 40, cost: 4 }, pin: { dmg: 14, ammo: 2 } },
  hits: { lunge: 1, riposte: 2 },
  phases: [{ n: 2, at: 50 }],
};
const play = (ids, s = S.start(KIT)) => ids.reduce((x, id) => S.act(KIT, x, id), s);

test('slashes take its health, and the fight ends when it falls', () => {
  const s = play(['slash', 'slash', 'slash', 'slash', 'slash']);
  assert.equal(s.hp, 0);
  assert.equal(s.over, 'win');
  assert.deepEqual(s.log.at(-1), { k: 'win', n: 5 });
  assert.equal(S.act(KIT, s, 'slash'), s, 'nothing acts once it is over');
});

test('crossing a phase threshold says so', () => {
  const s = play(['slash', 'slash', 'slash']);
  assert.ok(s.log.some((e) => e.k === 'phase' && e.n === 2));
});

test('a Skill needs its silk, and a landed slash gives one back up to the spool', () => {
  let s = play(['skill', 'skill'], { ...S.start(KIT), hp: 1000 });
  assert.equal(s.silk, 2);
  assert.equal(S.can(KIT, s, 'skill'), false);
  s = play(['slash', 'slash'], s);
  assert.equal(s.silk, 4);
  assert.equal(S.can(KIT, s, 'skill'), true);
  assert.equal(play(['slash']).silk, 10, 'the spool starts full and holds no more');
});

test('a Tool runs out of uses', () => {
  const s = play(['pin', 'pin']);
  assert.equal(s.ammo.pin, 0);
  assert.equal(S.can(KIT, s, 'pin'), false);
});

test('its hits take masks; a Bind spends its silk and heals up to the max', () => {
  let s = play(['riposte']);
  assert.equal(s.masks, 3);
  s = play(['bind'], s);
  assert.equal(s.masks, 5);
  assert.equal(s.silk, 1);
  assert.equal(S.can(KIT, play(['lunge']), 'bind'), true);
  assert.equal(S.can(KIT, S.start(KIT), 'bind'), false, 'no Bind at full masks');
  assert.equal(play(['riposte', 'riposte', 'lunge']).over, 'lose');
});

test('undo steps back one move', () => {
  const a = play(['slash', 'pin']);
  const b = S.undo(a);
  assert.equal(b.hp, 78);
  assert.equal(b.ammo.pin, 2);
  assert.equal(S.undo(S.start(KIT)).hp, 100);
});
