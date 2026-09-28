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
  const pages = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory() && !/^(\.|node_modules|kb|design|tools|test|assets|js|css)/.test(e.name)) walk(rel);
      else if (e.name === 'index.html') pages.push(rel);
    }
  };
  walk('.');
  assert.ok(pages.length > 100);
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
