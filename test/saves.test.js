/* test/saves.test.js — free mode and the four save slots over a fake storage: what goes in a
   slot, what stays out, and that switching, importing and clearing never mix two games.
   Carried over from hallownest-calculator with the keys renamed. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const S = require('../js/saves.js');

function fakeStore(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}
// The build's share of a slot is a string the codec (phase 3) will write; here, any string will do.
const FRESH_BUILD = 'v=1&needle=0';

test('with nothing saved, the site is in free mode and the four slots are empty', () => {
  const s = fakeStore();
  assert.deepEqual(S.read(s), { active: S.FREE, slots: {} });
  assert.deepEqual(S.list(s).map((x) => [x.n, x.active, x.snap && Object.keys(x.snap).length]),
    [[0, true, 0], [1, false, null], [2, false, null], [3, false, null], [4, false, null]]);
});

test('data from before slots existed stays in free mode, untouched', () => {
  const s = fakeStore({ 'pharloom.build': 'v=1&nail=3', 'pharloom.journal': '{"MossBone Crawler":0}', 'pharloom.prefs': '{"lang":"es"}' });
  const free = S.list(s)[0];
  assert.equal(free.n, S.FREE);
  assert.equal(free.active, true);
  assert.deepEqual(free.snap, { 'pharloom.build': 'v=1&nail=3', 'pharloom.journal': '{"MossBone Crawler":0}' });
});

test('free mode with nothing saved comes back with the defaults', () => {
  const s = fakeStore();
  S.importTo(s, 1, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 1);
  assert.equal(s.getItem('pharloom.build'), FRESH_BUILD);
  S.select(s, S.FREE);
  assert.equal(s.getItem('pharloom.build'), null, 'no build: everything unlocked (App.loadState)');
  assert.equal(s.getItem('pharloom.owned'), null, 'no list: everything owned (App.loadOwned)');
  assert.equal(S.clear(s, S.FREE), false, 'free mode is not cleared');
});

test('an empty slot is not entered: a save only comes from the game\'s file', () => {
  const s = fakeStore({ 'pharloom.build': 'v=1&nail=3', 'pharloom.progress': '{"found":["mask-1"]}', 'pharloom.prefs': '{"lang":"es"}' });
  assert.equal(S.select(s, 2), false);
  assert.deepEqual(s.dump(), { 'pharloom.build': 'v=1&nail=3', 'pharloom.progress': '{"found":["mask-1"]}', 'pharloom.prefs': '{"lang":"es"}' }, 'nothing moved');
  assert.deepEqual(S.read(s), { active: S.FREE, slots: {} });
  // Imported, it is entered, and the game you leave is kept aside.
  assert.equal(S.importTo(s, 2, { 'pharloom.build': 'v=1&nail=1', 'pharloom.owned': '[]' }), true);
  assert.equal(S.select(s, 2), true);
  const d = s.dump();
  assert.equal(d['pharloom.build'], 'v=1&nail=1');
  assert.equal(d['pharloom.owned'], '[]');
  assert.equal(d['pharloom.progress'], undefined, 'the progress is the other game\'s');
  assert.equal(d['pharloom.prefs'], '{"lang":"es"}', 'the preferences are not in a slot');
  assert.deepEqual(S.read(s), { active: 2, slots: { 0: { 'pharloom.build': 'v=1&nail=3', 'pharloom.progress': '{"found":["mask-1"]}' } } });
});

test('going back restores each game as it was', () => {
  const s = fakeStore({ 'pharloom.build': 'v=1&nail=3' });
  S.importTo(s, 3, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 3);
  s.setItem('pharloom.journal', '{"MossBone Crawler":0}');
  S.select(s, S.FREE);
  assert.equal(s.getItem('pharloom.build'), 'v=1&nail=3');
  assert.equal(s.getItem('pharloom.journal'), null, "slot 3's Journal stays in slot 3");
  S.select(s, 3);
  assert.equal(s.getItem('pharloom.journal'), '{"MossBone Crawler":0}');
  assert.equal(s.getItem('pharloom.build'), FRESH_BUILD);
  assert.equal(S.select(s, 3), false, 'the active slot is already entered');
  assert.equal(S.select(s, 5), false, 'there are four');
});

test('clearing a slot empties it; clearing the active one also drops you into free mode', () => {
  const s = fakeStore();
  S.importTo(s, 1, { 'pharloom.build': FRESH_BUILD });
  S.importTo(s, 2, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 1);
  s.setItem('pharloom.run', '{}');
  S.select(s, 2);
  assert.equal(S.clear(s, 1), true);
  assert.deepEqual(Object.keys(S.read(s).slots), ['0']);
  assert.equal(S.clear(s, 1), false, 'already empty');
  s.setItem('pharloom.run', '{"gauntlet":"marrow-1"}');
  assert.equal(S.clear(s, 2), true);
  assert.equal(s.getItem('pharloom.run'), null);
  assert.equal(s.getItem('pharloom.build'), null, "free mode's own build: none saved, the defaults");
  assert.deepEqual(S.read(s), { active: S.FREE, slots: {} });
  assert.equal(S.list(s)[2].snap, null, 'the slot is empty');
});

test('corrupt or foreign data is ignored', () => {
  const s = fakeStore({ 'pharloom.saves': '{"active":9,"slots":{"0":{"pharloom.build":"x"},"2":{"pharloom.prefs":"{}","pharloom.build":4}}}' });
  assert.deepEqual(S.read(s), { active: S.FREE, slots: { 2: {} } });
  assert.deepEqual(S.read(fakeStore({ 'pharloom.saves': 'not json' })), { active: S.FREE, slots: {} });
});

test('a storage that throws leaves the site in free mode and no crash', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  assert.deepEqual(S.read(bad), { active: S.FREE, slots: {} });
  assert.doesNotThrow(() => S.select(bad, 2));
});

test('an imported game replaces a slot: the live keys if it is active, its copy if not, never free mode', () => {
  const s = fakeStore();
  S.importTo(s, 1, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 1);
  s.setItem('pharloom.run', '{}');
  const game = { 'pharloom.build': 'v=1&nail=4', 'pharloom.owned': '[]', 'pharloom.prefs': '{}' };
  assert.equal(S.importTo(s, 1, game), true);
  assert.equal(s.getItem('pharloom.build'), 'v=1&nail=4');
  assert.equal(s.getItem('pharloom.run'), null, 'the old run in progress goes with the old game');
  assert.equal(s.getItem('pharloom.prefs'), null, 'only the slot keys come in');
  assert.equal(S.importTo(s, 3, game), true);
  assert.deepEqual(S.read(s).slots[3], { 'pharloom.build': 'v=1&nail=4', 'pharloom.owned': '[]' });
  assert.equal(S.importTo(s, S.FREE, game), false);
});

test('a synced game replaces the slot but keeps the site-only keys, and says whether anything changed', () => {
  const s = fakeStore();
  S.importTo(s, 1, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 1);
  s.setItem('pharloom.build', 'v=1&nail=1');
  s.setItem('pharloom.journal', '{"MossBone Crawler":1}');
  s.setItem('pharloom.run', '{"gauntlet":"g1"}');
  s.setItem('pharloom.baseline', 'v=1&nail=0');
  const game = { 'pharloom.build': 'v=1&nail=4', 'pharloom.owned': '[]', 'pharloom.run': '{"x":1}' };
  assert.equal(S.sync(s, 1, game), 'game');
  assert.equal(s.getItem('pharloom.build'), 'v=1&nail=4');
  assert.equal(s.getItem('pharloom.journal'), null, 'what the save doesn\'t carry is the game\'s: gone');
  assert.equal(s.getItem('pharloom.run'), '{"gauntlet":"g1"}', 'the run in progress stays, not the file\'s');
  assert.equal(s.getItem('pharloom.baseline'), 'v=1&nail=0', 'the pinned build stays');
  assert.equal(S.sync(s, 1, game), false, 'the same game again changes nothing');
  // An inactive slot, in its copy.
  S.importTo(s, 2, { 'pharloom.build': FRESH_BUILD });
  S.select(s, 2);
  assert.equal(S.sync(s, 1, { 'pharloom.build': 'v=1&nail=3' }), 'game');
  const kept = S.read(s).slots[1];
  assert.deepEqual({ ...kept, 'pharloom.prev': undefined }, { 'pharloom.build': 'v=1&nail=3', 'pharloom.run': '{"gauntlet":"g1"}', 'pharloom.baseline': 'v=1&nail=0', 'pharloom.prev': undefined });
  assert.equal(S.sync(s, S.FREE, game), false, 'free mode is nobody\'s game');
});

test('a sync keeps what the game was before it changed, for "Since last time"', () => {
  const s = fakeStore();
  const at = (nail, saved) => ({ 'pharloom.build': 'v=1&nail=' + nail, 'pharloom.owned': '[]', 'pharloom.meta': JSON.stringify({ time: saved, saved }) });
  S.importTo(s, 1, at(1, 100));
  S.select(s, 1);
  assert.equal(s.getItem('pharloom.prev'), null, 'an import has nothing before it');
  assert.equal(S.sync(s, 1, at(2, 200)), 'game');
  const prev = JSON.parse(s.getItem('pharloom.prev'));
  assert.deepEqual(prev, { snap: { 'pharloom.build': 'v=1&nail=1', 'pharloom.owned': '[]' }, saved: 100 });
  // A bench sat at with nothing new: the clock moves, the previous game stays.
  assert.equal(S.sync(s, 1, at(2, 300)), 'meta');
  assert.deepEqual(JSON.parse(s.getItem('pharloom.prev')), prev);
  assert.equal(JSON.parse(s.getItem('pharloom.meta')).saved, 300);
  assert.equal(S.sync(s, 1, at(2, 300)), false);
  // The next change keeps the game as it was at that last save.
  assert.equal(S.sync(s, 1, at(3, 400)), 'game');
  assert.deepEqual(JSON.parse(s.getItem('pharloom.prev')), { snap: { 'pharloom.build': 'v=1&nail=2', 'pharloom.owned': '[]' }, saved: 300 });
});
