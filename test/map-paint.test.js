/* test/map-paint.test.js — the Map's canvas (js/map-paint.js): the pieces composed in the game's
   order, one to one from the sheet, the faint ones among themselves and faded as one layer under
   the rest; the levels of detail; and the view drawn on whole pixels from the right one. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const M = require('../js/map.js');
const R = require('../js/rooms.js');
const P = require('../js/map-paint.js');

// A canvas that writes down what's drawn on it.
function fake(w, h) {
  const calls = [], moves = [];
  const ctx = {
    calls, moves, globalAlpha: 1,
    setTransform() {}, translate(x, y) { moves.push([x, y]); }, scale() {}, clearRect() {},
    drawImage(img, ...a) { calls.push({ img, a, alpha: this.globalAlpha }); },
  };
  return { width: w, height: h, getContext: () => ctx, ctx };
}
const made = () => { const all = []; const make = (w, h) => { const c = fake(w, h); all.push(c); return c; }; return { all, make }; };
const game = { mapVars: { ...M.FREE }, mapped: ['Greymoor_02'], mappedRead: true, quill: true, maps: ['Greymoor'], visited: [] };

test('the pieces are composed one to one, the faint ones as one layer under the rest', () => {
  const view = R.mapView(game, { all: true });
  const faint = view.pieces.filter((p) => p.faint).length, whole = view.pieces.length - faint;
  assert.ok(faint > 0 && whole > 0);
  const sheet = { name: 'sheet' }, { all, make } = made();
  const comp = P.compose(view, sheet, 1, 0.45, make);
  assert.equal(comp.tiles.length, 1);
  const t = comp.tiles[0], layer = all.find((c) => c !== t.canvas);
  // The faint ones on a layer of their own, whole (so that two of them overlapping aren't
  // stronger there), one to one.
  const onLayer = layer.ctx.calls;
  assert.equal(onLayer.length, faint);
  for (const c of onLayer) assert.ok(c.img === sheet && c.alpha === 1 && c.a[2] === c.a[6] && c.a[3] === c.a[7]);
  // On the map: that layer, faded, then the rest whole, one to one.
  const calls = t.canvas.ctx.calls;
  assert.equal(calls.length, 1 + whole);
  assert.ok(calls[0].img === layer && calls[0].alpha === 0.45);
  for (const c of calls.slice(1)) assert.ok(c.img === sheet && c.alpha === 1 && c.a[2] === c.a[6] && c.a[3] === c.a[7]);
  // With nothing faint, no layer.
  const plain = made();
  P.compose(R.mapView(game), sheet, 1, 0.45, plain.make);
  assert.equal(plain.all.length, 1);
  // Twice as fine: four tiles of the map's own size, each reaching a little past its share.
  const hd = P.compose(view, sheet, 2, 0.45, make);
  assert.equal(hd.tiles.length, 4);
  assert.ok(hd.tiles.every((x) => x.canvas.width === M.W + 2 * x.pad && x.canvas.height === M.H + 2 * x.pad && x.pad > 0));
});

test('an area moved without scaling moves by whole pixels', () => {
  const view = R.mapView(null);
  const e = view.pieces[0].e;
  const moved = { ...view, pieces: view.pieces.filter((p) => p.e.a === e.a), zones: { [e.a]: { at: [100.3, 200.7], dx: 168, dy: -44.64, sx: 1, sy: 1 } } };
  for (const scale of [1, 2]) {
    const { all, make } = made();
    P.compose(moved, {}, scale, 0.45, make);
    const moves = all.flatMap((c) => c.ctx.moves);
    assert.ok(moves.length && moves.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y)), JSON.stringify(moves.slice(0, 3)));
  }
});

test('the levels of detail: a half and a quarter of the map, and the view never shrinks one more than twice', () => {
  const view = R.mapView(null), { make } = made();
  const lv = P.levels(P.compose(view, {}, 1, 0.45, make), make);
  assert.deepEqual(lv.map((c) => c.scale), [0.25, 0.5, 1]);
  const [q, h, one] = lv.map((c) => c.tiles[0]);
  assert.ok(h.canvas.width === Math.ceil(one.canvas.width / 2) && q.canvas.width === Math.ceil(h.canvas.width / 2));
  assert.ok(h.pad === one.pad / 2 && q.pad === one.pad / 4);
  const hd = P.compose(view, {}, 2, 0.45, make);
  const all = [...lv, hd];
  for (const [k, want] of [[0.1, 0.25], [0.25, 0.25], [0.3, 0.5], [0.74, 1], [1, 1], [1.2, 2], [3, 2]]) assert.equal(P.pick(all, k).scale, want, `at ${k}`);
  // Close up before the fine one is ready: the finest at hand.
  assert.equal(P.pick([...lv, null], 3).scale, 1);
});

test('the view is drawn on whole pixels, the tiles meeting on one line', () => {
  const view = R.mapView(null);
  const comp = P.compose(view, {}, 2, 0.45, made().make);
  const out = fake(1000, 800);
  P.paint(out.ctx, [comp], { x: 1200.3, y: 900.7, w: 500.2, h: 400.16 }, 1000, 800);
  assert.equal(out.ctx.calls.length, 4);
  for (const c of out.ctx.calls) for (const v of c.a.slice(4)) assert.ok(Number.isInteger(v), v);
  // Side by side, one tile ends where the next begins.
  const [a, b] = out.ctx.calls;
  assert.equal(a.a[4] + a.a[6], b.a[4]);
  // Each reads its own share of its canvas, past its reach only by the rounding.
  for (const c of out.ctx.calls) assert.ok(c.a[0] >= 0 && c.a[1] >= 0 && c.a[0] + c.a[2] <= c.img.width && c.a[1] + c.a[3] <= c.img.height);
});
