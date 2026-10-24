/* js/map-paint.js — the Map's drawing on a canvas. The pieces a game shows (js/rooms.js mapView)
   are composed once, each copied from assets/map/pieces.webp at its place, one to one, in the
   game's order (the faint ones first); the view then draws that one image, scaled. Drawn as a
   window each (an SVG <svg> per piece), the browser smoothed every window's edge, and where two
   pieces met a hairline of the black under them showed through (3-Oct-2026): composed first, the
   pieces meet as they do in the game. Used by js/app-map.js and tools/map-debug.html. Pure but for
   the canvases it's handed.
   Three things keep it even at every zoom (11-Oct-2026, each had drawn a blur, a line or a lighter
   patch somewhere): the faint pieces are composed among themselves at full strength and faded as
   one layer, so where two of them overlap (a room's parts along their cut, two rooms' soft edges)
   it isn't twice as strong; the view is drawn from the level of detail nearest above what the
   screen needs (twice as fine, the map's own pixels, a half, a quarter), so no draw shrinks it more
   than twice, which smooths alike in every browser and at every zoom; and close up, the tiles reach
   a few pixels into each other, so the smoothing at their edges finds the same pixels either way. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const M = SS.map || require('./map.js');

  // How far, in its own pixels, each tile's canvas reaches past its share of the map: more than
  // any smoothing reads beyond a pixel's edge.
  const PAD = 8;

  /* The composed map at `scale` (1: pieces.webp, the map's own pixels; 2: pieces-hd.webp), from
     `sheet` (the loaded image), with the faint pieces at `faint` opacity. `make(w, h)` gives a
     canvas. At scale 2 the map is cut into scale × scale tiles of about the map's own size, so
     that no canvas is larger than one at scale 1 (Safari refuses one above 16.7 million pixels).
     Returns { scale, tiles: [{ x, y, w, h (its share, in the map's pixels), pad (how far its
     canvas reaches past it, in the canvas's pixels), canvas }] }.
     With `clip` ({ x, y, w, h } in the map's pixels), only that part, as one tile on whole map
     pixels: Your game's area (js/app-map.js areaPaint), whose largest box is a few million canvas
     pixels at scale 2, where the whole map took four canvases of six million and a second to
     compose on a phone (22-Oct-2026). */
  function compose(view, sheet, scale, faint, make, clip) {
    const tw = M.W / scale, th = M.H / scale;
    const faints = view.pieces.filter((p) => p.faint), wholes = view.pieces.filter((p) => !p.faint);
    const cut = clip && (() => {
      const x = Math.max(0, Math.floor(clip.x)), y = Math.max(0, Math.floor(clip.y));
      return { x, y, w: Math.min(M.W, Math.ceil(clip.x + clip.w)) - x, h: Math.min(M.H, Math.ceil(clip.y + clip.h)) - y };
    })();
    // A tile's canvas: its share (tw × scale) and the reach.
    const cw = cut ? cut.w * scale + 2 * PAD : M.W + 2 * PAD, ch = cut ? cut.h * scale + 2 * PAD : M.H + 2 * PAD;
    const layer = faints.length ? make(cw, ch) : null;
    const tiles = [];
    for (let r = 0; r < (cut ? 1 : scale); r++) {
      for (let c = 0; c < (cut ? 1 : scale); c++) {
        const t = cut ? { ...cut, pad: PAD, canvas: make(cw, ch) } : { x: c * tw, y: r * th, w: tw, h: th, pad: PAD, canvas: make(cw, ch) };
        const ctx = t.canvas.getContext('2d');
        if (layer) {
          // The faint pieces as the game would draw them, then faded as one.
          const lx = layer.getContext('2d');
          lx.setTransform(1, 0, 0, 1, 0, 0);
          lx.clearRect(0, 0, cw, ch);
          draw(lx, t, faints, sheet, scale, view.zones);
          ctx.globalAlpha = faint;
          ctx.drawImage(layer, 0, 0);
          ctx.globalAlpha = 1;
        }
        draw(ctx, t, wholes, sheet, scale, view.zones);
        tiles.push(t);
      }
    }
    if (layer) layer.width = layer.height = 0;   // its memory, back now
    return { scale, tiles };
  }
  // Pieces onto a tile's canvas, one to one from the sheet.
  function draw(ctx, t, pieces, sheet, scale, zones) {
    const reach = t.pad / scale;
    for (const p of pieces) {
      const [x, y, w, h, sx, sy] = M.CELLS[p.cell];
      const z = zones[p.e.a];
      // A piece off this tile (its area's move aside, which can only shift it a little).
      if (!z && (x + w < t.x - reach || y + h < t.y - reach || x > t.x + t.w + reach || y > t.y + t.h + reach)) continue;
      ctx.setTransform(1, 0, 0, 1, t.pad - t.x * scale, t.pad - t.y * scale);
      if (z && z.sx === 1 && z.sy === 1) {
        // Moved, not scaled: by whole pixels, or every piece of the area is smoothed over.
        ctx.translate(Math.round(z.dx * scale), Math.round(z.dy * scale));
      } else if (z) {
        ctx.translate((z.at[0] + z.dx) * scale, (z.at[1] + z.dy) * scale);
        ctx.scale(z.sx, z.sy);
        ctx.translate(-z.at[0] * scale, -z.at[1] * scale);
      }
      ctx.drawImage(sheet, sx * scale, sy * scale, w * scale, h * scale, x * scale, y * scale, w * scale, h * scale);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* The levels of detail below a composed map at scale 1: a half and a quarter, each the one
     above shrunk to exactly half (every pixel the mean of four). With them no draw of the view
     shrinks an image more than twice: shrunk more, a browser that samples without averaging
     (Firefox does) skips pixels, and the map's one-pixel outlines break and shimmer as it moves.
     Returns [the quarter, the half, the map], each as compose returns it. */
  function levels(comp, make) {
    const out = [comp];
    let src = comp;
    for (const scale of [0.5, 0.25]) {
      const from = src.tiles[0].canvas, w = from.width / 2, h = from.height / 2;
      const canvas = make(Math.ceil(w), Math.ceil(h));
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(from, 0, 0, w, h);
      src = { scale, tiles: [{ x: 0, y: 0, w: M.W, h: M.H, pad: src.tiles[0].pad / 2, canvas }] };
      out.unshift(src);
    }
    return out;
  }

  /* Of the composed maps at hand (`comps`, any scales), the one to draw a view at `k` canvas
     pixels a map pixel: the coarsest at least as fine as that, so that it's shrunk at most
     twice; when none is as fine (close up, before the fine one is ready), the finest. */
  function pick(comps, k) {
    const list = comps.filter(Boolean).sort((a, b) => a.scale - b.scale);
    return list.find((c) => c.scale >= k * 0.999) || list[list.length - 1] || null;
  }

  /* The view `vb` (in the map's pixels) of the composed maps `comps`, on a canvas `cw` × `ch`
     pixels, smoothed at `quality`: 'high' at rest; 'low' (plain bilinear, no mipmaps made again
     for every draw) while the view moves (js/app-map.js paintMap). */
  function paint(ctx, comps, vb, cw, ch, quality = 'high') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const kx = cw / vb.w, ky = ch / vb.h;
    const comp = pick(Array.isArray(comps) ? comps : [comps], Math.max(kx, ky));
    if (!comp) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = quality;
    const s = comp.scale;
    for (const t of comp.tiles) {
      const x0 = Math.max(vb.x, t.x), y0 = Math.max(vb.y, t.y);
      const x1 = Math.min(vb.x + vb.w, t.x + t.w), y1 = Math.min(vb.y + vb.h, t.y + t.h);
      if (x1 <= x0 || y1 <= y0) continue;
      // On whole pixels of the view, so that two tiles meet on the same line, with no seam.
      const dx0 = Math.round((x0 - vb.x) * kx), dy0 = Math.round((y0 - vb.y) * ky);
      const dx1 = Math.round((x1 - vb.x) * kx), dy1 = Math.round((y1 - vb.y) * ky);
      if (dx1 <= dx0 || dy1 <= dy0) continue;
      // The canvas's own pixels: its share starts `pad` in.
      const mx = (d) => (d / kx + vb.x - t.x) * s + t.pad, my = (d) => (d / ky + vb.y - t.y) * s + t.pad;
      ctx.drawImage(t.canvas, mx(dx0), my(dy0), mx(dx1) - mx(dx0), my(dy1) - my(dy0), dx0, dy0, dx1 - dx0, dy1 - dy0);
    }
  }

  // What a composed map depends on: its cells, which are faint, and the areas' moves.
  const keyOf = (view, scale) => scale + '|' + view.pieces.map((p) => (p.faint ? '~' : '') + p.cell).join(',') + '|' + JSON.stringify(view.zones);

  SS.mapPaint = { compose, levels, pick, paint, keyOf, PAD };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.mapPaint;
})();
