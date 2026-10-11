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
const R = require('../js/rooms.js');

test('the fixes file is what the admin server would write', () => {
  const text = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-fixes.js'), 'utf8');
  assert.equal(withFixes(text, MF.FIXES), text);
  assert.equal(check(MF.FIXES), '');
});

test('every fix names a mark the map has, in the room it was fixed in', () => {
  const at = places();
  assert.ok(at.size > 500, 'places() knows the map: ' + at.size);
  for (const [k, p] of Object.entries(MF.FIXES.moved)) assert.equal(at.get(k), p[2], `moved ${k}: stale`);
  for (const [k, s] of Object.entries(MF.FIXES.hidden)) assert.equal(at.get(k), s, `hidden ${k}: stale`);
  for (const a of MF.FIXES.added) assert.ok(R.roomOf(a.scene), `added ${a.id}: ${a.scene} isn't on the map`);
});

test('the server checks what it writes, and writes it sorted', () => {
  const ok = { moved: { 'piece:1': [100, 200, 'Crawl_02'] }, hidden: { 'extra:3': 'Bone_05' },
    added: [{ id: 'add:1', layer: 'wall', x: 10, y: 20, scene: 'Bone_05', act: 2, check: ['bool', 'Bone_05', 'Breakable Wall'] }] };
  assert.equal(check(ok), '');
  assert.equal(check({}), '');
  assert.notEqual(check([]), '');
  assert.notEqual(check({ moved: { a: [99999, 0, 'X'] } }), '');
  assert.notEqual(check({ moved: { a: [1, 2] } }), '');
  assert.notEqual(check({ added: [{ id: 'add:1', layer: 'mask-shard', x: 1, y: 1, scene: 'X' }] }), '');
  assert.notEqual(check({ added: [{ id: 'add:1', layer: 'wall', x: 1, y: 1, scene: 'X', check: ['nope'] }] }), '');
  assert.notEqual(check({ added: [{ id: 'add:1', layer: 'wall', x: 1, y: 1, scene: 'X' }, { id: 'add:1', layer: 'wall', x: 1, y: 1, scene: 'X' }] }), '');
  const text = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-fixes.js'), 'utf8');
  const out = withFixes(text, { moved: { 'z:1': [1.26, -2, 'A'], 'a:1': [0, 0, 'B'] }, hidden: {}, added: [] });
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
