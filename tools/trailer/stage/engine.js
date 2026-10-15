/* engine.js: the video's drawing kit. Everything is a pure function of t (seconds), so the same
   code plays live in a preview page and renders frame by frame for the final video. */
(function () {
  const V = (window.VID = {});
  V.W = 1920; V.H = 1080;
  V.BEAT = 0.39446;            // Lace's battle theme, 152.1 bpm
  V.BAR = V.BEAT * 4;
  V.HORNET_ROOT = 'hornet/';   // set by the page

  /* --- maths --- */
  V.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  V.lerp = (a, b, k) => a + (b - a) * k;
  V.prog = (t, t0, t1) => V.clamp((t - t0) / (t1 - t0));
  V.easeOut = (k) => 1 - Math.pow(1 - k, 3);
  V.easeIn = (k) => k * k * k;
  V.easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  V.easeOutBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  V.rand = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  /* --- Hornet's frames --- */
  const imgs = {};
  V.load = () => {
    const all = [];
    for (const [name, c] of Object.entries(window.CLIPS)) {
      imgs[name] = c.frames.map((f) => {
        if (!f) return null;
        const im = new Image();
        im.src = V.HORNET_ROOT + encodeURIComponent(name) + '/' + f.file;
        all.push(im.decode().catch(() => {}));
        return im;
      });
    }
    return Promise.all(all);
  };
  /* The frame index of a clip, lt seconds into it. mode: 'once' holds the last frame,
     'loop' loops the whole clip, 'tail' loops from its loopStart. */
  V.frameAt = (name, lt, mode = 'once') => {
    const c = window.CLIPS[name], n = c.frames.length;
    let i = Math.floor(Math.max(0, lt) * c.fps);
    if (mode === 'loop') i %= n;
    else if (mode === 'tail' && i >= n) { const s = c.loopStart || 0; i = s + ((i - s) % (n - s)); }
    else i = Math.min(i, n - 1);
    return i;
  };
  V.clipDur = (name) => window.CLIPS[name].frames.length / window.CLIPS[name].fps;
  /* Draw a frame with her origin at (x, floorY): the game's origin is ~100 texels above her feet. */
  V.drawHornet = (ctx, name, i, x, floorY, scale, o = {}) => {
    const f = window.CLIPS[name].frames[i], im = imgs[name] && imgs[name][i];
    if (!f || !im || !im.complete) return;
    const oy = floorY - 100 * scale;          // her origin
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.filter) ctx.filter = o.filter;
    ctx.translate(x, oy);
    if (o.flip) ctx.scale(-1, 1);
    if (o.rot) ctx.rotate(o.rot);
    ctx.drawImage(im, f.left * scale, -f.top * scale, f.w * scale, f.h * scale);
    ctx.restore();
  };

  /* --- atmosphere --- */
  /* The main menu's embers, drifting up; deterministic in t. */
  V.embers = (ctx, t, o = {}) => {
    const n = o.n || 70, r = V.rand(o.seed || 7);
    ctx.save();
    for (let k = 0; k < n; k++) {
      const x0 = r() * V.W, speed = 40 + r() * 90, size = 1.2 + r() * 2.6, ph = r() * 50, sway = 10 + r() * 40, life = (V.H + 200) / speed;
      const lt = ((t + ph) % life + life) % life;
      const y = V.H + 100 - lt * speed, x = x0 + Math.sin((t + ph) * 0.9) * sway;
      const a = Math.sin(Math.PI * lt / life) * (o.alpha || 0.85);
      ctx.fillStyle = `rgba(241,139,69,${a.toFixed(3)})`;
      ctx.shadowColor = 'rgba(241,139,69,0.9)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x, y, size, 0, 7); ctx.fill();
    }
    ctx.restore();
  };
  /* A burst of dust from (x, y) at time t0. */
  V.dust = (ctx, t, t0, x, y, o = {}) => {
    const lt = t - t0; if (lt < 0 || lt > 1.2) return;
    const r = V.rand(o.seed || 3), n = o.n || 46;
    ctx.save();
    for (let k = 0; k < n; k++) {
      const dir = r() < 0.5 ? -1 : 1, vx = dir * (200 + r() * 900) * (o.spread || 1), vy = -(60 + r() * 420), s = 3 + r() * 9, life = 0.5 + r() * 0.7;
      if (lt > life) continue;
      const k2 = lt / life, px = x + vx * lt * (1 - k2 * 0.5), py = y + vy * lt + 900 * lt * lt;
      ctx.fillStyle = `rgba(${o.rgb || '230,220,210'},${((1 - k2) * 0.7).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(px, Math.min(py, y + 6), s * (1 - k2 * 0.4), 0, 7); ctx.fill();
    }
    ctx.restore();
  };
  /* A flat shockwave ring on the floor. */
  V.shock = (ctx, t, t0, x, y, o = {}) => {
    const lt = t - t0, dur = o.dur || 0.55; if (lt < 0 || lt > dur) return;
    const k = lt / dur, R = 30 + V.easeOut(k) * (o.r || 1100);
    ctx.save();
    ctx.strokeStyle = `rgba(255,245,235,${(1 - k) * 0.9})`; ctx.lineWidth = 10 * (1 - k) + 1;
    ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.12, 0, 0, 7); ctx.stroke();
    ctx.restore();
  };
  V.shake = (t, t0, amp = 16) => {
    const lt = t - t0; if (lt < 0 || lt > 0.6) return [0, 0];
    const d = Math.exp(-lt * 9) * amp;
    return [Math.sin(lt * 97) * d, Math.cos(lt * 71) * d * 0.7];
  };
  V.flash = (t, t0, dur = 0.18, peak = 0.9) => { const lt = t - t0; return lt < 0 || lt > dur ? 0 : peak * (1 - lt / dur); };
  /* The filigree crown over the site's title (js/app.js CROWN), drawn as an SVG string. */
  const HALF = '<path d="M93 14 C84 14 78 7 69 7 C61 7 58 13 62 16.5 C65 19 69.5 16.5 68 13.5"/><path d="M62 16.5 C50 22 30 21 10 14"/><path d="M10 14 C6 12 5.5 8.5 9 8 C11.5 7.8 12 10.5 10.5 11.5"/><path d="M78 9 C74 3 66 1.5 58 3.5"/>';
  V.CROWN = `<svg viewBox="0 0 200 28" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" aria-hidden="true">${HALF}<g transform="translate(200 0) scale(-1 1)">${HALF}</g><path d="M100 5 L105 14 L100 23 L95 14 Z"/><path d="M100 1 V5 M100 23 V27"/></svg>`;
})();

/* Hornet seated on a bench, as the site seats her (js/app-home.js rest()): her hem (row 154 of the
   Sit Idle frame, the same drawing as the site's resting.png, at the bench pictures' scale) on the
   bench's seat row (js/benches.js art: [width, height, seat]). (cx, top): the bench's middle and top. */
(function () {
  const V = window.VID;
  V.BENCH = (window.SS && SS.benches && SS.benches.art) || {};
  V.benchImg = {};
  V.loadBenches = (root, ids) => Promise.all(ids.map((id) => { const im = new Image(); im.src = root + id + '.png'; V.benchImg[id] = im; return im.decode().catch(() => {}); }));
  // lt: seconds since she sat down (the Sit clip, then Sit Idle); null: Sit Idle from its start.
  V.drawSeated = (ctx, id, cx, top, s, lt, o = {}) => {
    const [w, h, seat] = V.BENCH[id], im = V.benchImg[id];
    if (im && im.complete) ctx.drawImage(im, cx - w * s / 2, top, w * s, h * s);
    const seatY = top + seat * s, floorY = seatY + 41 * s, x = cx + 6.5 * s;
    const d = V.clipDur('Sit');
    if (lt != null && lt < d) V.drawHornet(ctx, 'Sit', V.frameAt('Sit', lt), x, floorY, s, o);
    else V.drawHornet(ctx, 'Sit Idle', V.frameAt('Sit Idle', lt == null ? 0 : lt - d, 'tail'), x, floorY, s, o);
    return { seatY, bottom: top + h * s };
  };
})();
