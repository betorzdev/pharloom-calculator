/* js/app-sister.js: the way to the sister site, the Hollow Knight one (../hollownest-calculator,
   «Calculadora de Hallownest»), and the Knight who stands on it. Ported from the sibling's
   js/app-sister.js, where Hornet points the way here; Albert asked for it "the same or close" (13 Oct
   2026), and with no arrival: the Knight is simply there.
   The link is a loose word in the masthead, «Hollow Knight ↗», above the language and Share, left of
   the crown (js/app.js, renderMasthead, asks linkHtml; Albert's choice, 13 Oct 2026: after Share the
   title no longer fitted on one line); on a phone, on its own line under the title, the language and
   Share at its right.
   The Knight stands on the word, breathing (the game's Idle at a third of its speed, there and back,
   as Hornet's there): every 15–25 s (masthead in view, tab visible) his cloak stirs in the wind, he
   looks up, reads his map or focuses soul; he watches the mouse over the masthead, and looks up
   while it's on the link. His moves are the game's own (js/knight-moves.js, assets/knight/, by
   tools/extract-knight.py). With reduced motion he only stands.
   Decorative: hidden from screen readers and never in the way of a click; the link is the control.
   Shares SS.app (see js/app.js): App.sister.linkHtml() for the masthead, App.sister.sync() after
   every render, App.sister.start() once, from js/app-boot.js. */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const App = SS.app;
  const { el, t, esc, NT, track, prefs } = App;
  const KN = SS.KNIGHT, M = KN.MOVES;

  const HOME = 'https://hallownestcalculator.com/';
  const K = 0.5;                 // the strips are at 0.6 of the game's size; he's shown at half that
  const FLOOR = KN.FLOOR * K;    // his feet below his pivot, standing

  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The link, for the masthead: in its row (css: above the language and Share; on a phone, a line of
     its own under the title). The sister's page in your language. */
  function linkHtml() {
    return `<div class="mh-sister-row"><a class="mh-sister" href="${HOME}${prefs.lang === 'es' ? 'es/' : ''}" target="_blank" rel="noopener" title="${esc(t('sisterHint'))}"><span${NT}>${esc(t('sister'))}</span> <span class="mh-sister-arr" aria-hidden="true">↗</span></a></div>`;
  }

  /* ── The clock: one-shot clips step on animation frames, only while there are any ── */
  const tasks = new Set();
  let ticking = false;
  function tick(now) {
    for (const f of [...tasks]) f(now);
    ticking = tasks.size > 0;
    if (ticking) requestAnimationFrame(tick);
  }
  const addTask = (f) => { tasks.add(f); if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ── His layer, in .page: over the masthead's letters, under the screen bar when it sticks ── */
  let front = null;
  const box = (node) => {
    const r = node.getBoundingClientRect(), p = el.page.getBoundingClientRect();
    return { l: r.left - p.left, t: r.top - p.top, w: r.width, cx: r.left - p.left + r.width / 2 };
  };

  /* ── The Knight: one element, his move's strip as its background; placed by his pivot ── */
  const kn = {
    el: null, x: 0, y: 0, dir: 1, name: '', i: 0, anim: null, done: null, state: '',
    make() {
      front = Object.assign(document.createElement('div'), { className: 'sis-lay' });
      front.setAttribute('aria-hidden', 'true');
      this.el = Object.assign(document.createElement('div'), { className: 'sis-knight' });
      front.append(this.el);
      el.page.append(front);
    },
    at(x, y) { this.x = x; this.y = y; this.place(); },
    feet(x, f) { this.at(x, f - FLOOR); },
    face(d) { this.dir = d; this.place(); },
    place() {
      const m = M[this.name]; if (!m || !this.el) return;
      this.el.style.transform = `translate(${this.x - m.px * K}px, ${this.y - m.py * K}px)` + (this.dir > 0 ? ' scaleX(-1)' : '');
      this.el.style.transformOrigin = `${m.px * K}px ${m.py * K}px`;
    },
    show(name, i) {
      const m = M[name], s = this.el.style;
      if (name !== this.name) {
        this.name = name;
        Object.assign(s, { width: m.w * K + 'px', height: m.h * K + 'px', backgroundImage: `url(assets/knight/${name}.png)`, backgroundSize: `${m.w * K * m.n}px ${m.h * K}px` });
        s.setProperty('--cell', m.w * K + 'px'); s.setProperty('--n', m.n);
        this.place();
      }
      this.i = i; s.backgroundPosition = `${-i * m.w * K}px 0`;
    },
    stop() {
      if (this.anim) { tasks.delete(this.anim); this.anim = null; }
      if (this.done) { const d = this.done; this.done = null; d(); }
      this.el.classList.remove('is-loop', 'is-calm'); this.el.style.animationDuration = '';
    },
    /* A clip once, held on its last frame; resolves there. */
    play(name) {
      this.stop();
      const m = M[name];
      this.show(name, 0);
      if (still()) return Promise.resolve();
      return new Promise((res) => {
        const t0 = performance.now();
        const f = (now) => {
          let i = Math.floor((now - t0) / 1000 * m.fps);
          if (i >= m.n - 1) { i = m.n - 1; tasks.delete(f); this.anim = null; this.done = null; res(); }
          if (i !== this.i || name !== this.name) this.show(name, i);
        };
        this.anim = f; this.done = res; addTask(f);
      });
    },
    /* A clip over and over: a CSS animation (css: .sis-knight.is-loop), no frames to step. `calm`:
       at a third of its speed, there and back (.is-calm), a breath rather than a step. */
    loop(name, calm = false) {
      this.stop();
      this.show(name, 0);
      if (still()) return;
      this.el.style.animationDuration = M[name].n / M[name].fps * (calm ? 3 : 1) + 's';
      this.el.classList.toggle('is-calm', calm);
      this.el.classList.add('is-loop');
    },
    idle() { this.state = 'idle'; this.loop('idle', true); },
  };

  /* ── While he waits ── */
  const LIFE = [
    async () => { await kn.play('wind'); await kn.play('wind'); },
    async () => { await kn.play('look-up'); await wait(1500); await kn.play('look-up-end'); },
    async () => { await kn.play('map-open'); kn.loop('map'); await wait(4000); await kn.play('map-away'); },
    async () => {
      kn.el.classList.add('is-focus');
      await kn.play('focus'); await kn.play('focus-get'); await kn.play('focus-end');
      kn.el.classList.remove('is-focus');
    },
  ];
  let lifeTimer = 0, inView = true;
  function life() {
    clearTimeout(lifeTimer);
    if (still()) return;
    lifeTimer = setTimeout(async () => {
      if (kn.state !== 'idle' || !inView || document.hidden) return life();
      kn.state = 'busy';
      await LIFE[Math.floor(Math.random() * LIFE.length)]();
      if (kn.state === 'busy') kn.idle();
      life();
    }, 15000 + Math.random() * 10000);
  }

  /* ── The link he stands on: the one shown (the masthead's, or the phone's line) ── */
  const link = () => [...el.masthead.querySelectorAll('.mh-sister')].find((a) => a.offsetParent) || null;
  /* His feet on the word's letters: the name's box, less the line's leading above them. */
  const spot = (a) => {
    const w = a.firstElementChild, L = box(w), lead = (w.getBoundingClientRect().height - parseFloat(getComputedStyle(w).fontSize)) / 2;
    return { x: L.cx, f: L.t + lead + 4 };
  };

  /* ── Wiring ── */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    kn.make();
    // The masthead in view: his life pauses without it.
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { inView = es[0].isIntersecting; }).observe(el.masthead);
    addEventListener('resize', () => sync());
    el.masthead.addEventListener('click', (e) => { if (e.target.closest('.mh-sister')) track('sister', { to: 'hallownest' }); });   // `to`: the sister's Footworn id, drawn as a crossing
    el.masthead.addEventListener('mousemove', (e) => {
      if (kn.state !== 'idle' && kn.state !== 'look') return;
      const x = e.clientX - el.page.getBoundingClientRect().left;
      if (Math.abs(x - kn.x) > 12) kn.face(x > kn.x ? 1 : -1);
    });
    el.masthead.addEventListener('mouseover', (e) => {
      if (!e.target.closest('.mh-sister') || kn.state !== 'idle' || still()) return;
      kn.state = 'look'; kn.play('look-up');
    });
    el.masthead.addEventListener('mouseout', async (e) => {
      if (!e.target.closest('.mh-sister') || (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mh-sister'))) return;
      if (kn.state !== 'look') return;
      kn.state = 'busy';
      await kn.play('look-up-end');
      if (kn.state === 'busy') kn.idle();
    });
    kn.show('idle', 0);
    sync();
    kn.idle(); life();
  }

  /* After every render the masthead is new: his place follows the link. */
  function sync() {
    if (!started) return;
    const a = link();
    kn.el.hidden = !a;
    if (a) { const s = spot(a); kn.feet(s.x, s.f); }
  }

  App.sister = { start, sync, linkHtml };
})();
