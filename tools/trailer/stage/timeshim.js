/* timeshim.js: a virtual clock for frame-by-frame capture. Injected before any page script (and
   into every frame), it replaces the page's clocks and timers, and holds every CSS and Web
   Animation paused, seeking it to the virtual time on each step. window.__vt.advance(ms) moves
   time on: due timers run in order, animation frames run once per step. */
(function () {
  if (window.__vt) return;
  const realNow = performance.now.bind(performance), RealDate = Date, realSetTimeout = setTimeout;
  const base = RealDate.now();
  let now = 0, seq = 0, rafs = new Map(), timers = new Map();
  const vt = (window.__vt = { get now() { return now; }, realSetTimeout, on: true });
  performance.now = () => now;
  function VDate(...a) { return a.length ? new RealDate(...a) : new RealDate(base + now); }
  VDate.prototype = RealDate.prototype; VDate.now = () => base + now; VDate.parse = RealDate.parse; VDate.UTC = RealDate.UTC;
  window.Date = VDate;
  window.setTimeout = (fn, ms = 0, ...args) => { const id = ++seq; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, args, every: 0 }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const id = ++seq; const e = Math.max(1, +ms || 0); timers.set(id, { at: now + e, fn, args, every: e }); return id; };
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => { const id = ++seq; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => rafs.delete(id);

  const started = new WeakMap();   // animation -> virtual time at which it was first seen
  function seekAnimations() {
    let list = [];
    try { list = document.getAnimations(); } catch (e) {}
    for (const a of list) {
      if (!started.has(a)) { started.set(a, now - (a.currentTime || 0)); try { a.pause(); } catch (e) {} }
      try { a.currentTime = now - started.get(a); } catch (e) {}
    }
  }
  vt.advance = (ms) => {
    const end = now + ms;
    for (let guard = 0; guard < 10000; guard++) {
      let next = null;
      for (const [id, t] of timers) if (t.at <= end && (!next || t.at < next[1].at || (t.at === next[1].at && id < next[0]))) next = [id, t];
      if (!next) break;
      const [id, t] = next;
      now = Math.max(now, t.at);
      if (t.every) t.at += t.every; else timers.delete(id);
      try { typeof t.fn === 'function' ? t.fn(...t.args) : eval(t.fn); } catch (e) { console.error(e); }
    }
    now = end;
    const cbs = [...rafs.values()]; rafs.clear();
    for (const fn of cbs) { try { fn(now); } catch (e) { console.error(e); } }
    seekAnimations();
  };
  vt.seek = seekAnimations;
})();
