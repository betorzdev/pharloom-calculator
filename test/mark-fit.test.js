/* test/mark-fit.test.js: the measure of every picture a Map mark can show (js/mark-fit.js, written
   by tools/fit-marks.py): one line per picture in the tool's folders and none for a picture gone, so
   a new or changed picture can't go without its fit (npm run mark-fit), and each line a measure
   that places it (an opaque box inside its canvas). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const FIT = require('../js/mark-fit.js');

const ROOT = path.join(__dirname, '..');
const tool = fs.readFileSync(path.join(ROOT, 'tools/fit-marks.py'), 'utf8');
const FOLDERS = JSON.parse(/FOLDERS = (\[[^\]]+\])/.exec(tool)[1].replace(/'/g, '"').replace(/\s+/g, ' '));

test('every picture in the folders has its measure, and every measure its picture', () => {
  const files = FOLDERS.flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.webp')).map((f) => d + '/' + f));
  const missing = files.filter((f) => !FIT[f]);
  assert.deepStrictEqual(missing, [], 'run npm run mark-fit');
  const stale = Object.keys(FIT).filter((k) => !k.startsWith('crest:') && !fs.existsSync(path.join(ROOT, k)));
  assert.deepStrictEqual(stale, [], 'run npm run mark-fit');
  for (const k of ['red', 'blue', 'yellow', 'skill']) assert.ok(FIT['crest:' + k], 'crest:' + k);
});

test('each measure places its picture: an opaque box inside the canvas', () => {
  for (const [k, [W, H, cx, cy, L, R, turned]] of Object.entries(FIT)) {
    assert.ok(W > 0 && H > 0, k);
    assert.ok(cx >= 0 && cx <= W && cy >= 0 && cy <= H, k + ': centre');
    assert.ok(L > 0 && L <= Math.max(W, H), k + ': longest side');
    assert.ok(R >= L / 2 - 1 && R <= Math.hypot(W, H), k + ': farthest pixel');
    if (turned !== undefined) assert.ok(turned > 0, k + ': turned');
  }
  // The Mask Shard, the one that drew at half the disc: a margin all round.
  const [W, , , , L] = FIT['assets/icons/items/mask-shard.webp'];
  assert.ok(L < 0.6 * Math.max(W, 112));
});
