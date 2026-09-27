/* js/live.js — a save slot kept in step with the real game (hallownest-calculator's
   design/08-live-sync.md; carried over unchanged but for the database's name).
   The page keeps a handle to the game's save file (File System Access) and reads it again each
   time the game writes it, which is on resting at a bench and on quitting: "at each bench", not
   real time. No DOM and no language: js/app-saves.js paints what this says.
   Three pieces:
     canLive()             whether this browser can do it here (the picker, IndexedDB, not inside
                           a cross-origin iframe, which can't open the picker)
     links                 the handles, one per slot, in IndexedDB (a handle can't go in
                           localStorage), each with the file's stamp when it was last taken in
     watch(opts)           a generic watcher: asks opts.read() every 2 s, also while the tab is hidden
                           (playing full screen hides it: the site is up to date when you come back)
                           (and at once on coming back to it) and reports what it finds. The file
                           is the first source (fileSource); our own mod's socket will be a second
                           one with the same shape.
   The permission to read the file doesn't survive a reload (checked on Windows, Chrome 154:
   'prompt' after a reload, 'granted' after a click): the watcher starts paused, and resume()
   asks again, which only works from a click. Nor does the picker's grant reach the copy read
   back from IndexedDB, even on the same page: whoever stores a handle asks on the stored copy,
   in the click, and hands that copy to the watcher (js/app-saves.js, link()). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

  const MS = 2000;
  const DB = 'pharloom-live', STORE = 'links';

  function topLevel() {
    try { return window.top === window || !!window.top.location.href; } catch (e) { return false; }
  }
  function canLive() {
    try { return 'showOpenFilePicker' in window && 'indexedDB' in window && topLevel(); } catch (e) { return false; }
  }

  /* ── The handles, in IndexedDB ────────────────────────────────────────
     links.get(n) → { handle, name, stamp } or null; stamp = { lastModified, size } of the file
     the slot last took in. Every failure resolves to nothing: without IndexedDB there's no link. */
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((ok, ko) => {
        let r;
        try { r = indexedDB.open(DB, 1); } catch (e) { ko(e); return; }
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ko(r.error);
      });
      dbp.catch(() => { dbp = null; });
    }
    return dbp;
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((ok, ko) => {
      const tx = d.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => ok(req && req.result);
      tx.onerror = () => ko(tx.error);
      tx.onabort = () => ko(tx.error);
    });
  }
  const safe = (p, def) => p.then((v) => v, () => def);
  const links = {
    get: (n) => safe(idb('readonly', (s) => s.get(n)), null).then((v) => v || null),
    put: (n, rec) => safe(idb('readwrite', (s) => s.put(rec, n)).then(() => true), false),
    drop: (n) => safe(idb('readwrite', (s) => s.delete(n)).then(() => true), false),
    // The slots that are linked, as { n: name }.
    all: () => safe(new Promise((ok, ko) => {
      db().then((d) => {
        const out = {};
        const tx = d.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (!c) return;
          out[c.key] = (c.value && c.value.name) || '';
          c.continue();
        };
        tx.oncomplete = () => ok(out);
        tx.onerror = () => ko(tx.error);
      }, ko);
    }), {}),
  };

  const stampOf = (file) => ({ lastModified: file.lastModified, size: file.size });
  const sameStamp = (a, b) => !!a && !!b && a.lastModified === b.lastModified && a.size === b.size;

  /* ── The file as a source ─────────────────────────────────────────────
     read(since) → { state: 'live' } when nothing changed since that stamp; { state: 'live', stamp,
     data } when it did and parse() took it; { state: 'paused' } without permission; { state: 'lost' }
     when the file is gone. A file that can't be read or that parse() refuses (caught mid-write)
     counts as unchanged: the next tick tries again. */
  function fileSource(handle, parse) {
    return {
      name: handle.name,
      async permission() {
        try { return await handle.queryPermission({ mode: 'read' }); } catch (e) { return 'denied'; }
      },
      async request() {
        try { return await handle.requestPermission({ mode: 'read' }); } catch (e) { return 'denied'; }
      },
      async read(since) {
        let file;
        // Gone, or no permission; anything else (the game holding the file while it writes) is tried again.
        try { file = await handle.getFile(); } catch (e) {
          const why = e && e.name;
          return { state: why === 'NotFoundError' ? 'lost' : why === 'NotAllowedError' || why === 'SecurityError' ? 'paused' : 'live' };
        }
        const stamp = stampOf(file);
        if (sameStamp(stamp, since)) return { state: 'live' };
        let data = null;
        try { data = parse(new Uint8Array(await file.arrayBuffer())); } catch (e) { data = null; }
        return data == null ? { state: 'live' } : { state: 'live', stamp, data };
      },
    };
  }

  /* ── The watcher ──────────────────────────────────────────────────────
     watch({ source, since, onData(data, stamp), onState(state) }) → { resume(), stop(), check() }.
     state: 'live' | 'paused' | 'lost'. onData is awaited before the next check, and whatever it
     does with the stamp is its business: the watcher only remembers it to compare. */
  function watch({ source, since = null, onData, onState }) {
    let state = '', timer = 0, busy = false, stopped = false;
    const set = (s) => {
      if (s === state) return;
      state = s;
      if (s !== 'live') { clearInterval(timer); timer = 0; }
      try { onState(s); } catch (e) { /* the page's problem */ }
    };
    async function check() {
      if (stopped || busy || state !== 'live') return;
      busy = true;
      try {
        const r = await source.read(since);
        if (stopped) return;
        if (r.state !== 'live') { set(r.state); return; }
        if (r.stamp) {
          since = r.stamp;
          try { await onData(r.data, r.stamp); } catch (e) { /* the next change will try again */ }
        }
      } finally { busy = false; }
    }
    function run() {
      set('live');
      clearInterval(timer);
      timer = setInterval(check, MS);
      check();
    }
    const wake = () => { if (state === 'live') check(); };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    source.permission().then((p) => { if (!stopped) { if (p === 'granted') run(); else set('paused'); } });
    return {
      // From a click: the browser asks, and on yes it watches again (and reads at once).
      async resume() {
        if (stopped) return false;
        const p = await source.request();
        if (p === 'granted') { run(); return true; }
        return false;
      },
      stop() {
        stopped = true;
        clearInterval(timer);
        document.removeEventListener('visibilitychange', wake);
        window.removeEventListener('focus', wake);
      },
      check,
      get state() { return state; },
    };
  }

  SS.live = { MS, canLive, links, fileSource, watch, stampOf, sameStamp };
})();
