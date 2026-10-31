/* test/map-card.test.js: the Map's card as design/119 drew it (all A; Albert, 31-Oct-2026): the
   head with the picture, its area's light and the tick once had; how it's had as pictures and
   names; one «Needs» block gathered by needsOf from the data the site has (js/how.js, js/spots.js
   OPENS, EXTRAS, VARIANTS, the wishes' waits) and js/requires.js when the build carries it; the
   actions a picture and a word. The screens' code is read as text, as test/guide-not-lore.test.js
   does: the cards are drawn in a browser (checked there with tools/drive.js). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
globalThis.SS = globalThis.SS || {};
const STR = require('../js/i18n.js').UI;
const MAP = read('js/app-map.js');
const CSS = read('css/app.css');
const NEEDS = (() => { const i = MAP.indexOf('function needsOf(key'), j = MAP.indexOf('function reqIcon', i); assert.ok(i > 0 && j > i); return MAP.slice(i, j); })();

test("the loose buttons are gone: each requirement is a Needs chip", () => {
  for (const k of ['mapToFirst', 'mapToWake', 'mapToCylinder', 'mapToMelody', 'mapToWall', 'mapToGiver', 'mapShotSee', 'mapShotNeeds',
    'mapOpensWish', 'mapOpensAfter', 'mapOpensFreed', 'mapOpensRoom', 'mapOpenYes', 'mapOpenNo', 'mapTaskFor', 'mapCylinderFor', 'mapRewardOf']) {
    assert.ok(!(k in STR), `${k} is gone from js/i18n.js`);
    assert.ok(!MAP.includes(`t('${k}'`), `js/app-map.js still draws ${k}`);
  }
  for (const f of ['opensBtn', 'stepBtn', 'opensNote', 'takenAt', 'soldNote', 'NEED_WORDS']) assert.ok(!new RegExp(`\\b${f}\\b`).test(MAP), `${f} is still there`);
});

test('needsOf gathers every source the site has, and reads js/requires.js only when it is there', () => {
  for (const src of ['SS.completion.wayOf', 'HW.NEEDS', 'SP.OPENS', 'SP.VARIANTS', 'more.after', 'more.needs', 'm.lockKey', 'App.wishWaits', 'm.alsoWay']) {
    assert.ok(NEEDS.includes(src), `needsOf reads ${src}`);
  }
  // js/requires.js is another branch's: absent today, so guarded, and its four tables read as the spec says.
  assert.match(NEEDS, /const RQ = SS\.requires;\s*\n\s*if \(RQ\)/);
  for (const t of ['RQ.AREAS', 'RQ.MARKS', 'RQ.WISHES', 'RQ.ASKS']) assert.ok(NEEDS.includes(t), `needsOf reads ${t}`);
  assert.match(NEEDS, /own\.needsRead && r\.check != null && \(own\.needs \|\| \[\]\)\.includes\(r\.check\)/);
  // Each once, and nothing for a thing had or taken away.
  assert.match(NEEDS, /if \(seen\.has\(id\)\) return;/);
  assert.match(NEEDS, /if \(!m \|\| \(g && m\.got\) \|\| \(own && m\.lost\)\) return \[\];/);
  assert.match(MAP, /App\.mapApi = \{[^}]*needsOf/);
});

test('with a save the block lists only what is missing; an «or» one of whose ways is met is met', () => {
  const block = MAP.slice(MAP.indexOf('function needsHtml'), MAP.indexOf('const questOf'));
  assert.match(block, /const shown = own \? ns\.filter/);
  assert.match(block, /if \(!shown\.length\) return '';/);
  assert.match(MAP, /const groupMet = \(xs\) =>/);
  assert.match(block, /<i>\$\{esc\(t\('mapOr'\)\)\}<\/i>/);
  assert.ok(STR.mapNeeds && STR.mapOr && STR.mapNeedTake && STR.mapNeedBring && STR.mapNeedFree);
});

test('a chip with no mark is dashed and still; one with a mark is a button to it', () => {
  const chip = MAP.slice(MAP.indexOf('function chipHtml'), MAP.indexOf('const groupMet'));
  assert.match(chip, /n\.to \? `<button type="button" class="mp-chip"/);
  assert.match(chip, /<span class="mp-chip is-plain">/);
  assert.match(CSS, /\.mp-chip\.is-plain \{ border-style: dashed;/);
});

test('the actions are a picture and one word, the full words their accessible name and tooltip', () => {
  assert.match(MAP, /const ab = \(icon, word, long, act, value, more = ''\) => `<button type="button" class="mp-ab"[^`]*aria-label="\$\{esc\(long\)\}" title="\$\{esc\(long\)\}"/);
  for (const k of ['mapFightShort', 'mapHuntShort', 'mapSetInInv']) assert.ok(STR[k], k);
});

test('had is a white tick on the picture, the state in words for a screen reader', () => {
  assert.match(MAP, /const seal = c\.had \? `<span class="mp-card-seal" aria-hidden="true">/);
  assert.match(MAP, /<span class="sr-only">, \$\{esc\(c\.sr\)\}<\/span>/);
  // No selection hue: the tick is the ink's.
  assert.match(CSS, /\.mp-card-seal \{[^}]*border: 1px solid var\(--ink-strong\); color: var\(--ink-strong\);/);
});

test('on a phone the card lies along the map, scrolling inside, never past its box', () => {
  assert.match(MAP, /const SHEET = \(\) => matchMedia\('\(max-width: 599px\)'\)\.matches;/);
  assert.match(MAP, /--card-max/);
  assert.match(CSS, /max-height: var\(--card-max, none\); overflow-y: auto;/);
  assert.match(CSS, /\.mp-card-wrap\.is-sheet \{ left: var\(--sp-2\); right: var\(--sp-2\); transform: none; \}/);
});
