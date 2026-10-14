/* test/hornet.test.js: the Hornet who walks the page (js/app-hornet.js, css .hn). Her strips
   (tools/extract-hornet.py) have the cells the CSS steps through, every page loads her before the
   boot, she stays decorative, and her Map walk has a way to follow (js/rooms.js). The motion
   itself is checked in a browser (App.hornet.state()). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// A PNG's width and height, from its IHDR.
const size = (rel) => { const b = fs.readFileSync(path.join(ROOT, rel)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('her strips are cells of 120 × 120: ten for the run, one to sit, one to stand', () => {
  assert.deepEqual(size('assets/hornet/run.png'), [1200, 120]);
  assert.deepEqual(size('assets/hornet/sit.png'), [120, 120]);
  assert.deepEqual(size('assets/hornet/stand.png'), [120, 120]);
  const css = read('css/app.css');
  assert.match(css, /\.hn\.is-run \{[^}]*--n: 10;/);
  // The Map anchors her feet and middle where the extractor puts them.
  const py = read('tools/extract-hornet.py');
  assert.match(py, /CELL = \(120, 120\)/);
  assert.match(py, /FLOOR = 116/);
  assert.match(py, /CX = 62/);
  assert.match(css, /62 \/ 120\) calc\(-1 \* var\(--hn-map\) \* 116 \/ 120\)/);
});

test('her timings and sizes are tokens', () => {
  const tokens = read('css/tokens.css');
  for (const name of ['--dur-step', '--dur-run', '--hn-bar', '--hn-map', '--dur-flash', '--focus-glow']) {
    assert.match(tokens, new RegExp(`${name}:`), name);
  }
});

test('every page loads her after the Map and before the boot', () => {
  const P = require('../tools/pages.js');
  const pages = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory() && !/^(\..*|node_modules|kb|design|tools|test|assets|js|css)$/.test(e.name)) walk(rel);
      else if (e.name === 'index.html') pages.push(rel);
    }
  };
  walk('.');
  assert.strictEqual(pages.length, P.PAGES.length * P.LANGS.length);   // every page tools/pages.js writes, and no stale one
  for (const p of pages) {
    const html = read(p);
    const map = html.indexOf('js/app-map.js'), hn = html.indexOf('js/app-hornet.js'), boot = html.indexOf('js/app-boot.js');
    assert.ok(map > 0 && map < hn && hn < boot, p);
  }
});

test('she is decorative: hidden from screen readers and out of the tab order', () => {
  const js = read('js/app-hornet.js');
  assert.match(js, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js, /tabIndex = -1/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js, /localStorage|hollow\./);   // her one memory is prefs.walked
});

test('the Map walk has a way between two benches, through the rooms between', () => {
  const R = require('../js/rooms.js');
  const M = require('../js/map.js');
  const benches = M.PINS.filter((p) => p[0] === 'bench').map((p) => p[3]).filter((s) => R.roomOf(s));
  assert.ok(benches.length > 10);
  // Some pair of benches the doors join, without any station opened.
  let found = null;
  for (const a of benches) {
    for (const b of benches) {
      if (a === b) continue;
      const way = R.path(a, b, []);
      if (way && way.length > 2) { found = way; break; }
    }
    if (found) break;
  }
  assert.ok(found, 'no way between two benches');
  assert.ok(found.slice(1, -1).every((s) => typeof s === 'string'));
});

test('on the Map she is where the game wakes her, her feet on the ground under it, not on a pin set by hand', () => {
  const R = require('../js/rooms.js');
  const M = require('../js/map.js');
  const B = require('../js/benches.js');
  const P = JSON.parse(read('kb/data/game/pickups.json'));
  const near = (a, b) => !!a && !!b && Math.abs(a.x - b.x) < 0.11 && Math.abs(a.y - b.y) < 0.11;
  // A scene's point on its own room's box, or on its host's for an additive scene (the Flea Caravan's).
  const hostOf = (s) => { let h = s; if (!P.sizes[s]) while (h.includes('_') && !P.sizes[h]) h = h.slice(0, h.lastIndexOf('_')); return h; };
  const onMap = (s, x, y) => { const h = hostOf(s), z = P.sizes[h]; return z ? R.mapPoint(h, x, y, z[0], z[1]) : null; };
  // Every bench the card knows and every bench pin's room: sitting on her bench's own foot, just
  // under its RestBench (two units for a toll bench), inside her room's box; where the map draws no
  // room for it (an interior), on the game's own pin for it, or the point the game has for the room.
  const benches = new Set([...Object.keys(B.scenes), ...M.PINS.filter((p) => p[0] === 'bench').map((p) => R.roomPiece(p[3]).toLowerCase())]);
  let seated = 0;
  for (const s of benches) {
    const marks = P.respawns[s] || {};
    const name = Object.keys(marks).find((n) => /^RestBench/.test(n));
    if (!name || !R.roomOf(s)) continue;
    const [x, y, feet] = marks[name];
    const at = R.restPoint({ bench: s, rested: true, marker: name }, M.PINS);
    const want = onMap(s, x, feet);
    if (!want) {
      const r = M.ROOMS[R.roomOf(s).scene];
      assert.ok(M.PINS.some((p) => p[0] === 'bench' && p[1] === at.x && p[2] === at.y) || (!r[2] && at.x === r[0] && at.y === r[1]), `${s}: not on its pin`);
      continue;
    }
    seated++;
    assert.ok(feet <= y && feet >= y - 2.1, `${s}: its foot ${feet} is not just under its RestBench ${y}`);
    assert.ok(near(at, want), `${s}: at ${JSON.stringify(at)}, its bench's foot at ${JSON.stringify(want)}`);
    const r = M.ROOMS[R.roomOf(hostOf(s)).scene];
    assert.ok(at.x >= r[0] && at.x <= r[0] + r[2] && at.y >= r[1] && at.y <= r[1] + r[3], `${s}: outside its room`);
    // A slot kept before the marker was read sits on the same bench.
    assert.ok(near(R.restPoint({ bench: s, rested: true }, M.PINS), at), `${s}: a slot from before`);
  }
  assert.ok(seated >= 60, `${seated} benches seated`);
  // Albert's two (14-Oct-2026): Bone Bottom's pin is 24 px above its bench, in mid-air, and one of
  // Mount Fay's (Peak_02) 7 px under it, in the rock; she sits on the bench's foot in both.
  const pinOf = (s) => M.PINS.find((p) => p[0] === 'bench' && p[3] === s);
  assert.ok(R.restPoint({ bench: 'Bonetown', rested: true, marker: 'RestBench' }, M.PINS).y - pinOf('Bonetown')[2] > 20, 'Bone Bottom: on its pin');
  assert.ok(pinOf('Peak_02')[2] - R.restPoint({ bench: 'Peak_02', rested: true, marker: 'RestBench' }, M.PINS).y > 5, 'Mount Fay: on its pin');
  // Woken at a room's own marker (a restore point after a boss, an ability, an Act): standing on
  // the ground under it, not in the room's middle.
  let stood = 0;
  for (const [s, marks] of Object.entries(P.respawns)) {
    const m = marks['Death Respawn Marker'];
    if (!m || !R.roomOf(s) || !onMap(s, m[0], m[1])) continue;
    stood++;
    assert.ok(m[2] !== null && m[2] <= m[1] && m[2] >= m[1] - 5, `${s}: the ground ${m[2]} under its marker ${m[1]}`);
    assert.ok(near(R.restPoint({ bench: s, rested: false, marker: 'Death Respawn Marker' }, M.PINS), onMap(s, m[0], m[2])), `${s}: not on its ground`);
  }
  assert.ok(stood >= 25, `${stood} markers stood at`);
});
