/* test/map-paint.test.js — the Map's canvas (js/map-paint.js): the pieces composed in the game's
   order with the faint ones first, one to one from the sheet, and the view drawn on whole pixels. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const M = require('../js/map.js');
const R = require('../js/rooms.js');
const P = require('../js/map-paint.js');

// A canvas that writes down what's drawn on it.
function fake(w, h) {
  const calls = [];
  const ctx = {
    calls, globalAlpha: 1,
    setTransform() {}, translate() {}, scale() {}, clearRect() {},
    drawImage(img, ...a) { calls.push({ img, a, alpha: this.globalAlpha }); },
  };
  return { width: w, height: h, getContext: () => ctx, ctx };
}

test('the pieces are composed one to one, the faint ones under the rest', () => {
  const view = R.mapView({ mapVars: { ...M.FREE }, mapped: ['Greymoor_02'], mappedRead: true, quill: true,
    maps: ['Greymoor'], visited: [] }, { all: true });
  const sheet = { name: 'sheet' };
  const comp = P.compose(view, sheet, 1, 0.45, fake);
  assert.equal(comp.tiles.length, 1);
  const calls = comp.tiles[0].canvas.ctx.calls;
  assert.equal(calls.length, view.pieces.length);
  // One to one: the source and the place are the same size.
  for (const c of calls) assert.ok(c.a[2] === c.a[6] && c.a[3] === c.a[7]);
  // The faint ones first, at the faint opacity; then the rest, whole.
  const firstWhole = calls.findIndex((c) => c.alpha === 1);
  assert.ok(firstWhole > 0 && calls.slice(0, firstWhole).every((c) => c.alpha === 0.45) && calls.slice(firstWhole).every((c) => c.alpha === 1));
  // Twice as fine: four tiles of the map's own size.
  const hd = P.compose(view, sheet, 2, 0.45, fake);
  assert.equal(hd.tiles.length, 4);
  assert.ok(hd.tiles.every((t) => t.canvas.width === M.W && t.canvas.height === M.H));
});

test('the view is drawn on whole pixels, the tiles meeting on one line', () => {
  const view = R.mapView(null);
  const comp = P.compose(view, {}, 2, 0.45, fake);
  const out = fake(1000, 800);
  P.paint(out.ctx, comp, { x: 100.3, y: 50.7, w: 2500.2, h: 2000.1 }, 1000, 800);
  assert.equal(out.ctx.calls.length, 4);
  for (const c of out.ctx.calls) for (const v of c.a.slice(4)) assert.ok(Number.isInteger(v), v);
  // Side by side, one tile ends where the next begins.
  const [a, b] = out.ctx.calls;
  assert.equal(a.a[4] + a.a[6], b.a[4]);
});
