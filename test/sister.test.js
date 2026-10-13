/* test/sister.test.js: the sister site's link and its Knight (js/app-sister.js, ported from the
   sibling's, where Hornet stands on «Silksong ↗»): every move he plays drawn (js/knight-moves.js,
   tools/extract-knight.py) with a strip of its cells, his strings in both languages, and every page
   loading the moves and the script after Hornet and before the boot. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// A PNG's width and height, from its IHDR.
const size = (rel) => { const b = fs.readFileSync(path.join(ROOT, rel)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const src = read('js/app-sister.js');
require('../js/knight-moves.js');
const { KNIGHT } = globalThis.SS;

test('every move he plays is in js/knight-moves.js, with its strip of n cells', () => {
  const names = new Set([...src.matchAll(/\b(?:play|loop|show)\('([\w-]+)'/g)].map((m) => m[1]));
  assert.ok(names.size >= 8, 'found his moves in the script');
  for (const n of names) {
    const m = KNIGHT.MOVES[n];
    assert.ok(m, `${n} is in js/knight-moves.js`);
    assert.ok(m.n > 0 && m.fps > 0, `${n} has frames`);
    assert.deepEqual(size(`assets/knight/${n}.png`), [m.n * m.w, m.h], `assets/knight/${n}.png`);
  }
  assert.ok(KNIGHT.FLOOR > 0);
});

test('the link goes to the sister site, in your language, and its strings come in both', () => {
  assert.match(src, /const HOME = 'https:\/\/hallownestcalculator\.com\/';/);
  assert.match(src, /prefs\.lang === 'es' \? 'es\/' : ''/);
  const I = require('../js/i18n.js');
  for (const k of ['sister', 'sisterHint']) {
    const s = I.UI[k];
    assert.ok(s && s.es && s.en, k);
  }
});

test('he is decorative: hidden from screen readers, and still with reduced motion', () => {
  assert.match(src, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(src, /prefers-reduced-motion: reduce/);
  assert.match(read('css/app.css'), /\.sis-lay \{[^}]*pointer-events: none;/);
});

test('every page loads the moves and the script, after Hornet and before the boot', () => {
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
  assert.strictEqual(pages.length, P.PAGES.length * P.LANGS.length);
  for (const p of pages) {
    const html = read(p);
    const at = (f) => html.indexOf(`js/${f}`);
    assert.ok(at('app-hornet.js') > 0 && at('app-hornet.js') < at('knight-moves.js') && at('knight-moves.js') < at('app-sister.js') && at('app-sister.js') < at('app-boot.js'), p);
  }
});
