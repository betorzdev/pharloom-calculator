'use strict';
/* js/map-fixes.js, the Map's corrections by hand (its admin mode, saved by tools/admin.js): the
   file keeps the shape the server rewrites, every fix is sound, and none has gone stale (a key
   the map no longer has, or one that now names a thing in another room). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const MF = require('../js/map-fixes.js');
const { places, check, withFixes } = require('../tools/admin.js');
const FF = require('../tools/follow-fixes.js');
const SP = require('../js/spots.js');
const CO = require('../js/collectibles.js');
const PE = require('../js/people.js');
const M = require('../js/map.js');

// The mark an index key names now, to say which one a stale fix is looking at.
const OWN = { collectibles: CO, spots: SP, people: PE, map: M };
function nowAt(key) {
  for (const [owner, O] of Object.entries(FF.OWNERS)) {
    for (const l of O.lists(OWN[owner])) {
      const i = key.startsWith(l.prefix) && /^\d+$/.test(key.slice(l.prefix.length)) ? Number(key.slice(l.prefix.length)) : -1;
      if (i >= 0) return `${key} is now ${JSON.stringify(l.items[i]).slice(0, 160)}`;
    }
  }
  return `${key} names no mark`;
}

test('the fixes file is what the admin server would write', () => {
  const text = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-fixes.js'), 'utf8');
  assert.equal(withFixes(text, MF.FIXES), text);
  assert.equal(check(MF.FIXES), '');
});

test('every fix names a mark the map has, in the room it was fixed in', () => {
  const at = places();
  assert.ok(at.size > 500, 'places() knows the map: ' + at.size);
  const why = (k, was) => `${k}: stale, fixed in ${was}, now ${at.get(k)}: ${nowAt(k)}. A list that shifted is followed by \`npm run data\` (tools/follow-fixes.js); otherwise redo the fix`;
  for (const [k, p] of Object.entries(MF.FIXES.moved)) assert.equal(at.get(k), p[2], 'moved ' + why(k, p[2]));
  for (const [k, s] of Object.entries(MF.FIXES.hidden)) assert.equal(at.get(k), s, 'hidden ' + why(k, s));
});

test('the server checks what it writes, and writes it sorted', () => {
  const ok = { moved: { 'piece:1': [100, 200, 'Crawl_02'] }, hidden: { 'extra:3': 'Bone_05' } };
  assert.equal(check(ok), '');
  assert.equal(check({}), '');
  assert.notEqual(check([]), '');
  assert.notEqual(check({ moved: { a: [99999, 0, 'X'] } }), '');
  assert.notEqual(check({ moved: { a: [1, 2] } }), '');
  // Nothing is added by hand: a mark the data doesn't have couldn't follow the save.
  assert.notEqual(check({ added: [{ id: 'add:1', layer: 'wall', x: 1, y: 1, scene: 'X' }] }), '');
  const text = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-fixes.js'), 'utf8');
  const out = withFixes(text, { moved: { 'z:1': [1.26, -2, 'A'], 'a:1': [0, 0, 'B'] }, hidden: {} });
  assert.ok(out.includes('      "a:1": [0.0, 0.0, "B"],\n      "z:1": [1.3, -2.0, "A"],\n    },'), out);
  assert.ok(out.startsWith(text.slice(0, text.indexOf('  const FIXES'))));
  assert.ok(out.endsWith(text.slice(text.indexOf('\n  };') + 5)));
});

test('the admin flag travels in the hash apart from the build', () => {
  // js/app.js splitHash, read from its source (it needs the page): admin=1 never joins the build.
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  assert.ok(/pair === 'admin=1'\) admin = true/.test(src));
  assert.ok(/App\.admin \? '&admin=1' : ''/.test(src));
});

/* tools/follow-fixes.js: the fixes keyed by a list index follow their marks when a generator shifts the list. */
const list = (prefix, items) => ({ prefix, items, scene: (x) => x[1], tiers: [{ id: (x) => [x[0], x[1]] }, { id: (x) => [x[1]], loose: true }] });
const A = [['a', 'R1'], ['b', 'R2'], ['c', 'R3']];

test('follow: an entry inserted mid-list moves the keys after it', () => {
  const fixes = { moved: { 'e:0': [1, 2, 'R1'], 'e:2': [3, 4, 'R3'], 'p:9': [5, 6, 'X'] }, hidden: { 'e:1': 'R2' } };
  const { fixes: out, changes } = FF.follow(fixes, [list('e:', A)], [list('e:', [A[0], ['new', 'R9'], A[1], A[2]])]);
  assert.deepEqual(out, { moved: { 'e:0': [1, 2, 'R1'], 'e:3': [3, 4, 'R3'], 'p:9': [5, 6, 'X'] }, hidden: { 'e:2': 'R2' } });
  assert.deepEqual(changes.map((c) => c.from + '>' + c.to), ['e:2>e:3', 'e:1>e:2']);
});

test('follow: identical entries pair in order, told apart by their own point when they have one', () => {
  const dup = (p) => ({ prefix: 'e:', items: [['w', 'R1'], ['w', 'R1'], ['z', 'R2']], scene: (x) => x[1],
    tiers: [{ id: (x, i) => [x, p[i]] }, { id: (x) => [x] }] });
  // The point tells which wall is which, even when one is inserted before them.
  const o = dup([[1, 1], [2, 2], [9, 9]]);
  const n = { ...dup([[0, 0], [2, 2], [1, 1], [9, 9]]), items: [['w', 'R1'], ['w', 'R1'], ['w', 'R1'], ['z', 'R2']] };
  const r = FF.follow({ moved: { 'e:0': [1, 1, 'R1'], 'e:1': [2, 2, 'R1'] }, hidden: {} }, [o], [n]);
  assert.deepEqual(Object.keys(r.fixes.moved).sort(), ['e:1', 'e:2']);
});

test('follow: a loose match is reported, a mark that vanished or changed room stops it', () => {
  const edit = FF.follow({ moved: { 'e:1': [1, 1, 'R2'] }, hidden: {} }, [list('e:', A)], [list('e:', [A[0], ['b2', 'R2'], A[2]])]);
  assert.equal(edit.changes.length, 1);
  assert.equal(edit.changes[0].loose, true);
  // The mark is gone.
  assert.throws(() => FF.follow({ moved: { 'e:1': [1, 1, 'R2'] }, hidden: {} }, [list('e:', A)], [list('e:', [A[0], A[2]])]),
    /moved e:1: the mark is gone or ambiguous[\s\S]*\["b","R2"\]/);
  // Two candidates, no telling which.
  assert.throws(() => FF.follow({ moved: { 'e:1': [1, 1, 'R2'] }, hidden: {} }, [list('e:', A)], [list('e:', [A[0], ['x', 'R2'], ['y', 'R2'], A[2]])]), /ambiguous/);
  // It moved to another room: the fix was made for the old one.
  const byName = (items) => ({ ...list('e:', items), tiers: [{ id: (x) => [x[0]] }] });
  assert.throws(() => FF.follow({ moved: {}, hidden: { 'e:1': 'R2' } }, [byName(A)], [byName([A[0], ['b', 'R7'], A[2]])]), /another room now \(R7, the fix was made in R2\)/);
  // A fix already past the end of the previous list was stale before.
  assert.throws(() => FF.follow({ moved: { 'e:7': [1, 1, 'R2'] }, hidden: {} }, [list('e:', A)], [list('e:', A)]), /stale already/);
});

test('follow: every generator\'s lists follow the fixes onto themselves (nothing moves on today\'s data)', () => {
  for (const [owner, O] of Object.entries(FF.OWNERS)) {
    const r = FF.follow(MF.FIXES, O.lists(OWN[owner]), O.lists(OWN[owner]));
    assert.deepEqual(r.fixes, MF.FIXES, owner);
    assert.deepEqual(r.changes, [], owner);
  }
});

test('follow: run() rekeys the fixes file for a regenerated list and leaves the rest of it alone', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'follow-fixes-'));
  const file = path.join(dir, 'map-fixes.js');
  const text = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-fixes.js'), 'utf8');
  fs.writeFileSync(file, text);
  const was = JSON.parse(JSON.stringify(SP));
  const fixed = Object.keys(MF.FIXES.moved).filter((k) => k.startsWith('extra:')).map((k) => Number(k.slice(6)));
  const first = Math.min(...fixed);
  const neu = JSON.parse(JSON.stringify(was));
  neu.EXTRAS.splice(first, 0, ['wall', 0, ['bool', 'Fake_01', 'x'], 'Fake_01']);
  neu.XY = Object.fromEntries(Object.entries(was.XY).map(([k, v]) => [/^extra:\d+$/.test(k) && Number(k.slice(6)) >= first ? 'extra:' + (Number(k.slice(6)) + 1) : k, v]));
  const log = console.log; console.log = () => {};
  try { FF.run('spots', neu, { fixesFile: file }); } finally { console.log = log; }
  const out = require(file);
  delete require.cache[file];
  assert.equal(Object.keys(out.FIXES.moved).length, Object.keys(MF.FIXES.moved).length);
  assert.deepEqual(out.FIXES.moved['extra:' + (first + 1)], MF.FIXES.moved['extra:' + first]);
  assert.ok(!('extra:' + first in out.FIXES.moved));
  assert.equal(fs.readFileSync(file, 'utf8').split('  const FIXES')[0], text.split('  const FIXES')[0]);
  // A fix whose mark was removed stops the run and leaves the file as it was.
  const gone = JSON.parse(JSON.stringify(was));
  gone.EXTRAS.splice(first, 1);
  fs.writeFileSync(file, text);
  const before = text;
  assert.throws(() => FF.run('spots', gone, { fixesFile: file }), /extra:\d+: the mark is gone/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  fs.rmSync(dir, { recursive: true });
});
