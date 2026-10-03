/* js/map-paint.js — the Map's drawing on a canvas. The pieces a game shows (js/rooms.js mapView)
   are composed once, each copied from assets/map/pieces.webp at its place, one to one, in the
   game's order (the faint ones first); the view then draws that one image, scaled. Drawn as a
   window each (an SVG <svg> per piece), the browser smoothed every window's edge, and where two
   pieces met a hairline of the black under them showed through (3-Oct-2026): composed first, the
   pieces meet as they do in the game. Used by js/app-map.js and tools/map-debug.html. Pure but for
   the canvases it's handed. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const M = SS.map || require('./map.js');

  /* The composed map at `scale` (1: pieces.webp, the map's own pixels; 2: pieces-hd.webp), from
     `sheet` (the loaded image), with the faint pieces at `faint` opacity. `make(w, h)` gives a
     canvas. At scale 2 the map is cut into scale × scale tiles of the map's own size, so that no
     canvas is larger than one at scale 1 (Safari refuses one above 16.7 million pixels).
     Returns { scale, tiles: [{ x, y, w, h (in the map's pixels), canvas }] }. */
  function compose(view, sheet, scale, faint, make) {
    const tw = M.W / scale, th = M.H / scale;
    const order = [...view.pieces].sort((a, b) => b.faint - a.faint);
    const tiles = [];
    for (let r = 0; r < scale; r++) {
      for (let c = 0; c < scale; c++) {
        const t = { x: c * tw, y: r * th, w: tw, h: th, canvas: make(M.W, M.H) };
        const ctx = t.canvas.getContext('2d');
        for (const p of order) {
          const [x, y, w, h, sx, sy] = M.CELLS[p.cell];
          const z = view.zones[p.e.a];
          // A piece off this tile (its area's move aside, which can only shift it a little).
          if (!z && (x + w < t.x || y + h < t.y || x > t.x + tw || y > t.y + th)) continue;
          ctx.setTransform(1, 0, 0, 1, -t.x * scale, -t.y * scale);
          if (z) {
            ctx.translate((z.at[0] + z.dx) * scale, (z.at[1] + z.dy) * scale);
            ctx.scale(z.sx, z.sy);
            ctx.translate(-z.at[0] * scale, -z.at[1] * scale);
          }
          ctx.globalAlpha = p.faint ? faint : 1;
          ctx.drawImage(sheet, sx * scale, sy * scale, w * scale, h * scale, x * scale, y * scale, w * scale, h * scale);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        tiles.push(t);
      }
    }
    return { scale, tiles };
  }

  /* The view `vb` (in the map's pixels) of a composed map, on a canvas `cw` × `ch` pixels. */
  function paint(ctx, comp, vb, cw, ch) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    if (!comp) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const k = cw / vb.w;
    for (const t of comp.tiles) {
      const x0 = Math.max(vb.x, t.x), y0 = Math.max(vb.y, t.y);
      const x1 = Math.min(vb.x + vb.w, t.x + t.w), y1 = Math.min(vb.y + vb.h, t.y + t.h);
      if (x1 <= x0 || y1 <= y0) continue;
      // On whole pixels of the view, so that two tiles meet on the same line, with no seam.
      const dx0 = Math.round((x0 - vb.x) * k), dy0 = Math.round((y0 - vb.y) * k);
      const dx1 = Math.round((x1 - vb.x) * k), dy1 = Math.round((y1 - vb.y) * k);
      if (dx1 <= dx0 || dy1 <= dy0) continue;
      const s = comp.scale, mx = (d) => (d / k + vb.x - t.x) * s, my = (d) => (d / k + vb.y - t.y) * s;
      ctx.drawImage(t.canvas, mx(dx0), my(dy0), mx(dx1) - mx(dx0), my(dy1) - my(dy0), dx0, dy0, dx1 - dx0, dy1 - dy0);
    }
  }

  // What a composed map depends on: its cells, which are faint, and the areas' moves.
  const keyOf = (view, scale) => scale + '|' + view.pieces.map((p) => (p.faint ? '~' : '') + p.cell).join(',') + '|' + JSON.stringify(view.zones);

  SS.mapPaint = { compose, paint, keyOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.mapPaint;
})();
