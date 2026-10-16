/* scenes.js: the video, beat by beat. window.__frame(t) brings the stage to time t (seconds);
   the renderer calls it for every frame, in order, and captures the page after it. */
(function () {
  const V = window.VID;
  V.HORNET_ROOT = '/cache/hornet/';
  const TOTAL = 36.0;
  // Beat n after the first hit (n = 0 at 0.80 s), fractions between beats.
  const B = (n) => { const i = Math.floor(n), f = n - i; const a = BEATS[3 + i], b = BEATS[4 + i]; return a + f * (b - a); };
  const $ = (id) => document.getElementById(id);
  const E = {
    stage: $('stage'), cam: $('cam'), site: $('site'), cv: $('cv'), title: $('title'), crown: $('crown'), tag: $('tag'),
    pip: $('pip'), pipcv: $('pipcv'), file: $('file'), cursor: $('cursor'), cap: $('cap'), stat: $('stat'), end: $('end'),
    fx: $('fx'), flash: $('flash'), black: $('black'), mapcv: $('mapcv'), left: $('left'),
  };
  E.mapctx = E.mapcv.getContext('2d'); E.leftN = E.left.querySelector('b');
  E.ctx = E.cv.getContext('2d'); E.fxctx = E.fx.getContext('2d'); E.pipctx = E.pipcv.getContext('2d');
  E.crown.innerHTML = V.CROWN; E.crown.querySelectorAll('path').forEach((p) => p.setAttribute('pathLength', '1'));
  document.querySelector('.end-crown').innerHTML = V.CROWN;
  const capK = E.cap.querySelector('.cap-k'), capT = E.cap.querySelector('.cap-t'), capS = E.cap.querySelector('.cap-s');
  const realWait = (ms) => new Promise((r) => (window.__vt ? __vt.realSetTimeout : setTimeout)(r, ms));
  const BENCH = 'bone-bottom';

  /* ── The site, in its frame ─────────────────────────────────────────── */
  let loads = 0;
  const site = (window.SITE = {
    win: null, doc: null,
    async load(seed, hash) {
      try { localStorage.clear(); for (const [k, v] of Object.entries(SEEDS[seed])) localStorage.setItem(k, v); } catch (e) {}
      await new Promise((r) => { const q = indexedDB.deleteDatabase('pharloom-live'); q.onsuccess = q.onerror = q.onblocked = r; });
      const loaded = new Promise((r) => E.site.addEventListener('load', r, { once: true }));
      E.site.src = '/index.html?r=' + (++loads) + '#' + hash;
      await loaded;
      this.win = E.site.contentWindow; this.doc = this.win.document;
      await this.settle();
    },
    async settle(ms = 350) {
      try { await this.doc.fonts.ready; } catch (e) {}
      for (let i = 0; i < 60; i++) { if (![...this.doc.images].some((im) => !im.complete)) break; await realWait(50); }
      this.tick(40);
      await realWait(ms);
      this.tick(20);
    },
    tick(ms) { const vt = this.win && this.win.__vt; if (!vt) return; for (let left = ms; left > 0; left -= 1000 / 60) vt.advance(Math.min(left, 1000 / 60)); },
    q(sel) { return this.doc && this.doc.querySelector(sel); },
    click(sel) { const el = typeof sel === 'string' ? this.q(sel) : sel; if (!el) { console.error('no element: ' + sel); return; } el.click(); },
    rect(sel) { const el = typeof sel === 'string' ? this.q(sel) : sel; return el ? el.getBoundingClientRect() : null; },
    scroll(y) { if (this.win) this.win.scrollTo(0, y); },
    // A point of an element (0..1 of its box) in the page's coordinates (scrolled).
    pt(sel, fx = 0.5, fy = 0.5) { const r = this.rect(sel); return r ? { x: r.left + r.width * fx, y: r.top + r.height * fy + this.win.scrollY } : null; },
  });

  /* ── The camera: the site's point (x, y) at the middle of the frame, z times its size ── */
  let camNow = { x: 960, y: 540, z: 1 };
  function applyCam(c, scrollY) {
    // The page scrolls to keep the point in view; the transform does the rest.
    const z = c.z, wantTop = Math.max(0, c.y - 540 / z);
    const maxScroll = site.doc ? site.doc.documentElement.scrollHeight - 1080 : 0;
    const sy = scrollY != null ? scrollY : Math.min(Math.max(0, maxScroll), wantTop);
    site.scroll(sy);
    const real = site.win ? site.win.scrollY : 0;
    E.cam.style.transform = `translate(${960 - c.x * z}px, ${540 - (c.y - real) * z}px) scale(${z})`;
    camNow = { ...c, sy: real };
  }
  const ease = V.easeInOut;
  const camLerp = (a, b, k) => ({ x: V.lerp(a.x, b.x, k), y: V.lerp(a.y, b.y, k), z: V.lerp(a.z, b.z, k) });
  // A site point to screen.
  const toScreen = (p) => ({ x: 960 + (p.x - camNow.x) * camNow.z, y: 540 + (p.y - camNow.y) * camNow.z });

  /* ── Timeline ──────────────────────────────────────────────────────── */
  const cues = [];      // { at, fn }: what's done to the site, once, in order
  const shots = [];     // { from, to, kind, cam(t) }: what's on screen
  const caps = [];      // { from, to, k, t, s, top }
  const cuts = [];      // times of the needle-slash transitions
  const cue = (at, fn) => cues.push({ at, fn });
  const shot = (from, to, kind, cam) => shots.push({ from, to, kind, cam });
  const cap = (from, to, t, o = {}) => caps.push({ from, to, t, k: o.k || '', s: o.s || '', top: !!o.top, sAt: o.sAt || from + 0.15 });
  // Keyframed camera: [[t, {x,y,z}], ...], eased between.
  const keys = (list) => (t) => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) if (t <= list[i][0]) { const [t0, a] = list[i - 1], [t1, b] = list[i]; return camLerp(a, b, ease(V.prog(t, t0, t1))); }
    return list[list.length - 1][1];
  };
  const P = {};   // points measured on the site once it's there

  // 1 · Hornet arrives, the title (0 → b8).
  shot(0, B(8), 'intro');

  // 2 · Drop in your save (b8 → b16): Free mode's invitation; the file flies in and drops on the hit.
  cue(B(7), async () => {
    await site.load('free', 'view=home');
    P.invite = site.pt('.hm-invite');
  });
  cuts.push(B(8));
  shot(B(8), B(12), 'site', (t) => keys([[B(8), { x: P.invite.x, y: P.invite.y + 40, z: 1.42 }], [B(12), { x: P.invite.x, y: P.invite.y + 50, z: 1.52 }]])(t));
  cap(B(8.2), B(15.8), 'Drop in your save', { s: 'Read in your browser: your game, as the game has it', sAt: B(12.1) });
  cap(B(16.2), B(18.4), 'Keep playing', { s: 'Rest at a bench, and the game saves…' });
  cue(B(11.4), async () => {
    const dt = new site.win.DataTransfer();
    dt.items.add(new site.win.File([new Uint8Array(8)], 'user1.dat', { type: 'application/octet-stream' }));
    site.q('.hm-invite').dispatchEvent(new site.win.DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  // Dropped: the site is your game at once (the same snapshot its import writes, tools/drive.js).
  cue(B(12), async () => {
    P.dropAt = toScreen(P.invite);
    await site.load('before', 'view=home');
  });
  shot(B(12), B(16), 'site', (t) => keys([[B(12), { x: 960, y: 520, z: 1.5 }], [B(16), { x: 960, y: 560, z: 1.38 }]])(t));

  // 3 · Keep playing: Hornet rests at a bench, and the site catches up (b16 → b24).
  shot(B(16), B(18.5), 'site', (t) => keys([[B(16), { x: 960, y: 560, z: 1.36 }], [B(18.5), { x: 960, y: 570, z: 1.42 }]])(t));
  cue(B(18.5), async () => {
    await site.load('after', 'view=home');
    P.since = site.pt('.hm-since') || site.pt('.hm-gains') || { x: 960, y: 900 };
  });
  cuts.push(B(18.5));
  shot(B(18.5), B(24), 'site', (t) => keys([[B(18.5), { x: 960, y: 560, z: 1.36 }], [B(20), { x: 960, y: 580, z: 1.38 }], [B(22.5), { x: 960, y: P.since.y + 40, z: 1.55 }], [B(24), { x: 960, y: P.since.y + 70, z: 1.6 }]])(t));
  cap(B(18.7), B(23.8), '…and it catches up', { s: 'Every new save shows up on its own, live in Chrome and Edge' });

  // 4 · The Map (b24 → b43): the game's own map, every mark; then only what's missing.
  async function mapAt(seed) {
    await site.load(seed, 'view=map');
    site.click('[data-act="mapFull"]');
    await site.settle(600);
    const v = site.q('.mp-view');
    for (let i = 0; i < 4; i++) v.dispatchEvent(new site.win.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, clientX: 900, clientY: 470 }));
    await site.settle(900);
  }
  /* Your map with everything on it, then what you have leaves it, pin by pin (as Hallownest
     Calculator's trailer, tools/trailer-v3): the free map is captured with its pins; on the save's
     map, each pin the save has is drawn back from that capture, and goes: it swells and fades,
     with a ring and motes. A few go one by one while it's quiet, the rest sweep west to east on the hit. */
  cue(B(24), async () => {
    await mapAt('free');
    const pins = [...site.doc.querySelectorAll('.mp-mk[data-mk]')].filter((el) => !el.classList.contains('is-away')).map((el) => {
      const r = el.getBoundingClientRect();
      return { key: el.dataset.mk, x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    }).filter((p) => p.r > 2 && p.x > -20 && p.x < 1940 && p.y > -20 && p.y < 1100);
    MAP.all = await window.__snap();
    await mapAt('after');
    const left = new Set([...site.doc.querySelectorAll('.mp-mk[data-mk]')].map((el) => el.dataset.mk));
    const R = V.rand(11), got = pins.filter((p) => !left.has(p.key));
    const early = got.filter(() => R() < 0.1).sort((a, b) => a.x - b.x), sweep = got.filter((p) => !early.includes(p)).sort((a, b) => a.x - b.x);
    early.forEach((p, k) => { p.at = B(25) + (B(27.6) - B(25)) * k / Math.max(1, early.length); });
    sweep.forEach((p, k) => { p.at = B(28) + 1.4 * k / Math.max(1, sweep.length - 1) + (R() - 0.5) * 0.12; });
    for (const p of got) p.motes = Array.from({ length: 7 }, () => ({ a: R() * 6.283, d: 1.8 + R() * 2.2, s: 0.6 + R() * 0.8 }));
    MAP.got = got; MAP.total = pins.length;
  });
  cuts.push(B(24));
  shot(B(24), B(33), 'site', (t) => keys([[B(24), { x: 960, y: 540, z: 1.0 }], [B(30.5), { x: 960, y: 540, z: 1.03 }], [B(33), { x: 960, y: 520, z: 1.3 }]])(t));
  cap(B(24.2), B(27.9), "The game's own map", { s: 'Every Tool, Mask Shard, flea, bench and boss on it' });
  cap(B(28.1), B(32.8), 'Only what you’re missing', { s: 'Everything your save has leaves the map' });
  // Two marks close up, each with its card: the Map's own «on the map».
  async function closeUp(test) {
    const mk = [...site.doc.querySelectorAll('.mp-mk[data-mk]')].map((el) => el.dataset.mk);
    site.win.SS.app.mapShow(mk.find(test) || mk[0]);
    await site.settle(700);
    const card = site.pt('.mp-card') || { x: 960, y: 540 };
    P.close = { x: (card.x + 960) / 2, y: (card.y + 540) / 2 };
  }
  cue(B(33), () => closeUp((k) => k.startsWith('piece:')));
  cuts.push(B(33));
  shot(B(33), B(38), 'site', (t) => keys([[B(33), { x: P.close.x, y: P.close.y, z: 1.35 }], [B(38), { x: P.close.x, y: P.close.y, z: 1.45 }]])(t));
  cap(B(33.3), B(42.8), 'Find each one', { s: 'Where it is, and how the game gives it to you' });
  cue(B(38), () => closeUp((k) => k.startsWith('tools:')));
  shot(B(38), B(43), 'site', (t) => keys([[B(38), { x: P.close.x, y: P.close.y, z: 1.35 }], [B(43), { x: P.close.x, y: P.close.y, z: 1.45 }]])(t));

  // 5 · Progress (b43 → b59): the road to the next Act, the 100%, the tasks.
  cue(B(43), async () => {
    await site.load('after', 'view=progress');
    P.acts = site.pt('.pg-acts') || { x: 960, y: 330 };
    P.road = site.pt('.pg-steps') || { x: 960, y: 600 };
  });
  cuts.push(B(43));
  shot(B(43), B(51), 'site', (t) => keys([[B(43), { x: 960, y: 470, z: 1.6 }], [B(46), { x: 960, y: 520, z: 1.6 }], [B(49), { x: 960, y: 900, z: 1.5 }], [B(51), { x: 960, y: 960, z: 1.5 }]])(t));
  cap(B(43.3), B(50.8), 'What opens the next Act', { s: 'Every step, and what each one still needs', top: false });
  cue(B(51), async () => { site.click('[data-act="pgTab"][data-value="100"]'); await site.settle(150); });
  shot(B(51), B(55), 'site', (t) => keys([[B(51), { x: 960, y: 700, z: 1.5 }], [B(55), { x: 960, y: 820, z: 1.55 }]])(t));
  cap(B(51.2), B(54.8), 'Every point of your 100%');
  cue(B(55), async () => { site.click('[data-act="pgTab"][data-value="tasks"]'); await site.settle(150); });
  shot(B(55), B(59), 'site', (t) => keys([[B(55), { x: 960, y: 700, z: 1.5 }], [B(59), { x: 960, y: 820, z: 1.55 }]])(t));
  cap(B(55.2), B(58.8), 'Every task');

  // 6 · Montage (b59 → b79): Journal, Inventory, the 100% stat on the peak, Crest, Spanish.
  cue(B(59), async () => { site.click('#nav [data-act="view"][data-value="journal"]'); await site.settle(150); site.scroll(0); });
  cuts.push(B(59));
  shot(B(59), B(62), 'site', (t) => keys([[B(59), { x: 960, y: 470, z: 1.65 }], [B(62), { x: 960, y: 480, z: 1.75 }]])(t));
  cap(B(59.1), B(61.9), "Hunter's Journal", { k: '' });
  cue(B(62), async () => { site.click('#nav [data-act="view"][data-value="game"]'); await site.settle(150); site.scroll(0); });
  shot(B(62), B(64), 'site', (t) => keys([[B(62), { x: 700, y: 560, z: 1.7 }], [B(64), { x: 700, y: 590, z: 1.8 }]])(t));
  cap(B(62.1), B(63.9), 'Inventory');
  shot(B(64), B(69), 'stat');
  cue(B(66), async () => { await site.load('free', 'view=tools'); });
  shot(B(69), B(74), 'site', (t) => keys([[B(69), { x: 960, y: 640, z: 1.4 }], [B(74), { x: 960, y: 660, z: 1.46 }]])(t));
  for (const n of [70, 71, 72, 73]) cue(B(n), async () => { site.click('[data-act="ctCrest"][aria-label="Next Crest"]'); await site.settle(60); });
  cap(B(69.1), B(73.9), 'Try any build', { s: 'Every Tool, Crest and upgrade, with the numbers' });
  cue(B(74), async () => { await site.load('after', 'view=home&lang=es'); });
  cuts.push(B(74));
  shot(B(74), B(79), 'site', (t) => keys([[B(74), { x: 960, y: 560, z: 1.36 }], [B(79), { x: 960, y: 580, z: 1.46 }]])(t));
  cap(B(74.2), B(78.8), 'In English and Spanish', { s: 'Every name as the game writes it' });

  // 7 · The end card (b79 → end).
  cuts.push(B(79));
  shot(B(79), TOTAL, 'end');

  /* ── Drawing ───────────────────────────────────────────────────────── */
  function drawSlash(ctx, t, t0) {
    const k = (t - (t0 - 0.07)) / 0.2; if (k < 0 || k > 1) return;
    const a = { x: -300, y: 1250 }, b = { x: 2220, y: -170 };
    const head = V.easeOut(V.clamp(k * 1.6)), tail = V.easeIn(V.clamp(k * 1.2));
    const hx = V.lerp(a.x, b.x, head), hy = V.lerp(a.y, b.y, head), tx = V.lerp(a.x, b.x, tail), ty = V.lerp(a.y, b.y, tail);
    ctx.save();
    const g = ctx.createLinearGradient(tx, ty, hx, hy);
    g.addColorStop(0, 'rgba(255,250,245,0)'); g.addColorStop(0.7, 'rgba(255,250,245,.85)'); g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(255,235,220,.9)'; ctx.shadowBlur = 30;
    ctx.lineWidth = 34 * (1 - k * 0.6); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.restore();
  }
  function drawCaption(t) {
    const c = caps.find((x) => t >= x.from - 0.01 && t < x.to);
    if (!c) { E.cap.style.opacity = 0; return; }
    if (capT.textContent !== c.t) { capT.textContent = c.t; capK.textContent = c.k; capS.textContent = c.s; }
    E.cap.classList.toggle('is-top', c.top);
    const kin = V.easeOut(V.prog(t, c.from, c.from + 0.22)), kout = V.prog(t, c.to - 0.12, c.to);
    E.cap.style.opacity = Math.min(kin, 1 - kout);
    capT.style.transform = `translateY(${(1 - kin) * 40}px)`;
    capT.style.filter = `blur(${(1 - kin) * 10}px)`;
    const ks = V.easeOut(V.prog(t, c.sAt, c.sAt + 0.3));
    capS.style.opacity = ks; capS.style.transform = `translateY(${(1 - ks) * 20}px)`;
  }
  // The game, in a pane: Hornet runs in and sits at a bench (b16 → b18.5).
  function drawPip(t) {
    const from = B(16), to = B(18.5);
    const on = t >= from - 0.01 && t < to;
    E.pip.style.visibility = on ? 'visible' : 'hidden';
    if (!on) return;
    const kin = V.easeOut(V.prog(t, from, from + 0.25));
    E.pip.style.opacity = kin; E.pip.style.transform = `translateY(${(1 - kin) * -30}px)`;
    const c = E.pipctx, W = 560, H = 340, floor = 300;
    c.clearRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H, 20, W / 2, H, 420); g.addColorStop(0, '#3a2a24'); g.addColorStop(1, '#050303');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const bs = 0.95, [, bh, seat] = V.BENCH[BENCH], top = floor - bh * bs, seatY = top + seat * bs;
    const sit = B(17.6), stand = seatY + 41 * bs;   // standing, her origin where it is once she sits
    c.fillStyle = '#0b0807'; c.fillRect(0, stand - bs, W, H);   // the ground she runs on; the bench's feet stand in front of it
    if (t < sit - 0.25) {
      V.drawSeated(c, BENCH, W / 2, top, bs, null, { alpha: 0 });
      const k = V.prog(t, from, sit - 0.25), x = V.lerp(W + 60, W / 2 + 6.5 * bs, k);
      V.drawHornet(c, 'Run', V.frameAt('Run', t - from, 'tail'), x, stand, bs);
    } else if (t < sit) {
      V.drawSeated(c, BENCH, W / 2, top, bs, null, { alpha: 0 });
      V.drawHornet(c, 'Run To Idle', V.frameAt('Run To Idle', t - (sit - 0.25)), W / 2 + 6.5 * bs, stand, bs);
    } else {
      V.drawSeated(c, BENCH, W / 2, top, bs, t - sit);
      // The save: a white ring from the bench.
      const k = V.prog(t, sit + 0.1, sit + 0.6);
      if (k > 0 && k < 1) { c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, seatY - 40, 30 + k * 160, 0, 7); c.stroke(); }
    }
  }
  // The save file and the pointer that drags it (b10 → b12).
  function drawFile(t) {
    const t0 = B(9.6), t1 = B(12);
    if (!P.invite || t < t0 || t > t1 + 0.25) E.file.style.opacity = 0;
    if (P.invite && t >= t0 && t <= t1 + 0.25) {
      const k = V.easeInOut(V.prog(t, t0, t1)), end = toScreen(P.invite);
      const x = V.lerp(1980, end.x, k), y = V.lerp(1120, end.y, k) - Math.sin(k * Math.PI) * 120;
      const drop = V.prog(t, t1, t1 + 0.25);
      E.file.style.opacity = 1 - drop;
      E.file.style.transform = `translate(${x - 75}px, ${y - 60}px) rotate(${(1 - k) * 12 - 4}deg) scale(${1 - drop * 0.5})`;
      E.cursor.style.opacity = 1 - drop;
      E.cursor.style.transform = `translate(${x + 10}px, ${y + 20}px)`;
      return;
    }
    E.cursor.style.opacity = 0;
  }
  function drawStat(t, s) {
    const lt = t - s.from;
    E.stat.style.opacity = 1;
    const k = V.easeOut(V.prog(lt, 0.05, 0.75));
    E.stat.querySelector('.stat-ring').style.setProperty('--k', k);
    E.stat.querySelector('.stat-n').firstChild.textContent = String(Math.round(k * 100));
    const kr = V.easeOutBack(V.prog(lt, 0, 0.3));
    E.stat.querySelector('.stat-ring').style.transform = `scale(${V.lerp(0.6, 1, kr)})`;
    const kt = V.easeOut(V.prog(lt, B(65) - s.from, B(65) - s.from + 0.3));
    const st = E.stat.querySelector('.stat-t'); st.style.opacity = kt; st.style.transform = `translateY(${(1 - kt) * 30}px)`;
    const ks = V.easeOut(V.prog(lt, B(66) - s.from, B(66) - s.from + 0.3));
    const ss = E.stat.querySelector('.stat-s'); ss.style.opacity = ks; ss.style.transform = `translateY(${(1 - ks) * 20}px)`;
    V.embers(E.ctx, t, { n: 50 });
  }
  function drawEnd(t, s) {
    const lt = t - s.from, ctx = E.ctx;
    V.embers(ctx, t);
    // Hornet on Bone Bottom's bench, under the address.
    const bs = 1.55, top = 985 - V.BENCH[BENCH][1] * bs;
    V.drawSeated(ctx, BENCH, 960, top, bs, lt);
    const k = V.easeOut(V.prog(lt, 0.05, 0.4));
    $('endf').style.opacity = V.easeOut(V.prog(lt, 0.5, 0.9)) * 0.9;
    E.end.style.opacity = k; E.end.style.transform = `translateY(${(1 - k) * 30}px)`;
    E.end.querySelector('.end-crown').style.setProperty('--draw', V.easeOut(V.prog(lt, 0.1, 1.1)));
  }

  const MAP = { got: [], total: 0, all: null };
  function drawMap(t) {
    const g = E.mapctx, on = MAP.all && t >= B(24) && t < B(33);
    g.clearRect(0, 0, 1920, 1080);
    E.left.style.opacity = 0;
    if (!on) return;
    let gone = 0;
    for (const p of MAP.got) {
      const r = p.r * 1.18, v = V.prog(t, p.at, p.at + 0.28);
      if (v >= 0.5) gone++;
      if (v < 1) {
        const z = 1 + 0.45 * V.easeOut(v);
        g.save(); g.globalAlpha = 1 - v;
        g.beginPath(); g.arc(p.x, p.y, r * z, 0, 6.283); g.clip();
        g.translate(p.x, p.y); g.scale(z, z); g.drawImage(MAP.all, -p.x, -p.y);
        g.restore();
      }
      const m = V.prog(t, p.at, p.at + 0.7);
      if (m > 0 && m < 1) {
        g.strokeStyle = `rgba(246,246,246,${(1 - m) * 0.9})`; g.lineWidth = r * 0.12;
        g.beginPath(); g.arc(p.x, p.y, r * (1 + V.easeOut(m) * 1.6), 0, 6.283); g.stroke();
        for (const d of p.motes) {
          const q = V.easeOut(m), mx = p.x + Math.cos(d.a) * d.d * r * q, my = p.y + Math.sin(d.a) * d.d * r * q - m * r * 0.8;
          g.fillStyle = `rgba(246,246,246,${(1 - m) * 0.35})`; g.beginPath(); g.arc(mx, my, r * 0.32 * d.s, 0, 6.283); g.fill();
          g.fillStyle = `rgba(246,246,246,${1 - m})`; g.beginPath(); g.arc(mx, my, r * 0.13 * d.s, 0, 6.283); g.fill();
        }
      }
    }
    // What's left, on a plate in the corner.
    E.leftN.textContent = String(MAP.total - gone);
    E.left.style.opacity = V.easeOut(V.prog(t, B(24.5), B(25.2))) * (1 - V.prog(t, B(32.6), B(33)));
    const pk = Math.max(0, 1 - Math.abs(t - (B(28) + 0.7)) / 0.7);
    E.left.style.transform = `scale(${1 + 0.06 * pk * pk})`;
  }
  // The drop: a white ring where the file lands.
  function drawDrop(t) {
    if (!P.dropAt) return;
    const k = V.prog(t, B(12), B(12) + 0.6); if (k <= 0 || k >= 1) return;
    const c = E.fxctx; c.save(); c.strokeStyle = `rgba(255,250,245,${(1 - k) * 0.9})`; c.lineWidth = 6 * (1 - k) + 1;
    c.shadowColor = 'rgba(255,240,230,.9)'; c.shadowBlur = 20;
    c.beginPath(); c.arc(P.dropAt.x, P.dropAt.y, 30 + V.easeOut(k) * 520, 0, 7); c.stroke(); c.restore();
  }

  /* ── One frame ─────────────────────────────────────────────────────── */
  let last = 0, cueAt = 0;
  window.__frame = async (t) => {
    while (cueAt < cues.length && cues[cueAt].at <= t + 1e-6) { await cues[cueAt].fn(); cueAt++; }
    site.tick(Math.max(0, (t - last) * 1000)); last = t;
    const s = shots.find((x) => t >= x.from - 1e-6 && t < x.to) || shots[shots.length - 1];
    E.ctx.clearRect(0, 0, 1920, 1080); E.fxctx.clearRect(0, 0, 1920, 1080);
    E.cam.style.visibility = s.kind === 'site' ? 'visible' : 'hidden';
    E.title.style.visibility = s.kind === 'intro' ? 'visible' : 'hidden';
    E.stat.style.visibility = s.kind === 'stat' ? 'visible' : 'hidden';
    E.end.style.visibility = $('endf').style.visibility = s.kind === 'end' ? 'visible' : 'hidden';
    let flash = 0;
    if (s.kind === 'intro') flash = V.intro(t, E);
    if (s.kind === 'site' && s.cam) applyCam(s.cam(t));
    if (s.kind === 'stat') drawStat(t, s);
    if (s.kind === 'end') drawEnd(t, s);
    drawMap(t);
    drawDrop(t);
    drawCaption(t);
    drawPip(t);
    drawFile(t);
    for (const c of cuts) { drawSlash(E.fxctx, t, c); flash = Math.max(flash, V.flash(t, c, 0.14, 0.45)); }
    flash = Math.max(flash, V.flash(t, B(12), 0.16, 0.5));
    E.flash.style.opacity = flash;
    E.black.style.opacity = V.prog(t, TOTAL - 1.0, TOTAL - 0.1);
    return s.kind;
  };
  window.__snap = async () => {
    const kids = [...E.stage.children], vis = kids.map((k) => k.style.visibility), tf = E.cam.style.transform;
    kids.forEach((k) => (k.style.visibility = k === E.cam ? 'visible' : 'hidden'));
    E.mapcv.style.visibility = 'hidden'; E.cam.style.transform = 'none';
    const im = await new Promise((r) => { window.__snapDone = r; window.__snapReq(''); });
    kids.forEach((k, i) => (k.style.visibility = vis[i])); E.mapcv.style.visibility = ''; E.cam.style.transform = tf;
    return im;
  };
  window.__snapShow = (url) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = url; });
  window.__TOTAL = TOTAL;
  window.ready = Promise.all([V.load(), V.loadBenches('/assets/benches/', [BENCH])]).then(() => document.fonts.ready);
})();
