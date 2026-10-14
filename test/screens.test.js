/* test/screens.test.js: changing screens never leaves a modal behind. A <dialog> opened with
   showModal() makes the rest of the page inert; the screens change through the history API (no
   hashchange), so js/app.js setView has to close any open dialog outside the screen it goes to,
   or a link inside the modal (the Journal entry's «See on the map») lands on a screen that takes
   no clicks. setView runs here on a stub DOM: the Journal's sheet open, then the Map. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// setView's body, lifted out of js/app.js and run with the few names it uses.
function setViewOf(src) {
  const m = /function setView\(v\) \{([\s\S]*?)\n  \}/.exec(src);
  assert.ok(m, 'js/app.js has setView');
  return new Function('prefs', 'VIEWS', 'TOOLS', 'App', 'savePrefs', 'document', `return function setView(v) {${m[1]}\n};`);
}

test('leaving a screen closes the modal it left open', () => {
  const sheet = { open: true, view: 'journal', closed: 0, close() { this.open = false; this.closed++; },
    closest(sel) { const v = /data-view="(\w+)"/.exec(sel); return v && v[1] === this.view ? {} : null; } };
  const document = { querySelectorAll: (sel) => (sel === 'dialog[open]' && sheet.open ? [sheet] : []) };
  const prefs = { view: 'journal' };
  const setView = setViewOf(read('js/app.js'))(prefs, ['home', 'map', 'journal'], ['tools'], {}, () => {}, document);
  setView('journal');
  assert.strictEqual(sheet.open, true, 'staying on the screen keeps it open');
  setView('map');
  assert.strictEqual(prefs.view, 'map');
  assert.strictEqual(sheet.open, false, 'the Journal entry closes when the Map opens');
  assert.strictEqual(sheet.closed, 1);
});

test('every modal in the site is a <dialog> setView can find', () => {
  for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /^app.*\.js$/.test(f))) {
    const src = read('js/' + f);
    if (src.includes('showModal(')) assert.match(src, /<dialog\b/, `${f} opens a modal that isn't a <dialog>`);
  }
});

test("the Journal draws its entry only on its own screen", () => {
  const src = read('js/app-journal.js');
  const i = src.indexOf('const current = picked');
  assert.ok(i > 0);
  assert.match(src.slice(Math.max(0, i - 400), i), /if \(prefs\.view !== 'journal'\) picked = null;/,
    'rendered while another screen shows, the Journal would open its modal there again');
});
