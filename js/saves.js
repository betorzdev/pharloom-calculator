/* js/saves.js — the save slots: four, like the game's profile screen, and free mode.
   Pure over a Storage-like object (getItem, setItem, removeItem): no DOM and no language.
   A slot is everything that describes one game —the build, what you own, the Hunter's
   Journal, the rest of the 100% (js/completion.js, phase 2), a run in progress and the pinned
   build—; the preferences (language, screen) belong to whoever plays, not to the game, and
   aren't in it. Carried over from hallownest-calculator's js/saves.js unchanged but for the
   keys; the list of keys grows with each phase.
   Free mode (slot 0, FREE) is what shows while no save has been selected: a game marked by hand
   from a New Game, and the Crest screen's build to try, which is nobody's game. It's where the
   site starts. It can be entered
   and left like a save, but not cleared.
   A save only comes from the game's file (importTo): an empty slot isn't entered, since a save
   is read on the site and never made or changed by hand.
   The live keys (the ones every screen already reads and writes) always hold the ACTIVE slot,
   so nothing else has to know that slots exist. The inactive ones wait in SAVES_KEY as copies
   of those keys, raw strings copied as they were:
     { active: 2, slots: { "0": { "pharloom.build": "v=1&needle=4…" }, "3": { "pharloom.owned": "[…]" } } } */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

  const COUNT = 4;
  const FREE = 0;
  const SAVES_KEY = 'pharloom.saves';
  const KEYS = Object.freeze(['pharloom.build', 'pharloom.owned', 'pharloom.journal', 'pharloom.progress',
    'pharloom.run', 'pharloom.baseline', 'pharloom.meta', 'pharloom.prev']);
  const SLOT_IDS = Array.from({ length: COUNT }, (_, i) => i + 1);
  const ALL_IDS = [FREE, ...SLOT_IDS];

  const get = (store, k) => { try { return store.getItem(k); } catch (e) { return null; } };
  const put = (store, k, v) => { try { if (v == null) store.removeItem(k); else store.setItem(k, v); } catch (e) { /* no storage */ } };

  // Any value → a snapshot: only the slot's keys, only strings.
  function cleanSnap(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const k of KEYS) if (typeof raw[k] === 'string') out[k] = raw[k];
    return out;
  }

  // What's saved, valid: the active slot between 0 (free mode) and 4, and no copy of the active one.
  function read(store) {
    let raw = null;
    try { raw = JSON.parse(get(store, SAVES_KEY) || 'null'); } catch (e) { raw = null; }
    const active = raw && ALL_IDS.includes(raw.active) ? raw.active : FREE;
    const slots = {};
    const from = raw && raw.slots && typeof raw.slots === 'object' ? raw.slots : {};
    for (const n of ALL_IDS) if (n !== active && from[n]) slots[n] = cleanSnap(from[n]);
    return { active, slots };
  }
  const write = (store, saves) => put(store, SAVES_KEY,
    saves.active === FREE && !Object.keys(saves.slots).length ? null : JSON.stringify(saves));

  // The live keys, as a snapshot.
  function snapshot(store) {
    const out = {};
    for (const k of KEYS) { const v = get(store, k); if (v != null) out[k] = v; }
    return out;
  }
  // The live keys take the snapshot's values; those it doesn't carry are removed.
  function restore(store, snap) {
    for (const k of KEYS) put(store, k, Object.prototype.hasOwnProperty.call(snap, k) ? snap[k] : null);
  }

  /* Free mode and the four slots, each with its snapshot (the active one read from the live
     keys), or null if it's empty. Free mode is never empty: with no copy, it's the defaults. */
  function list(store) {
    const saves = read(store);
    return ALL_IDS.map((n) => ({ n, active: n === saves.active,
      snap: n === saves.active ? snapshot(store) : saves.slots[n] || (n === FREE ? {} : null) }));
  }

  /* Changes the active slot. The one you leave is copied out, the one you enter is copied in;
     free mode with nothing saved comes in with the defaults (a New Game). An empty slot
     isn't entered: a save only comes from the game's file (importTo). Returns whether anything
     changed. */
  function select(store, n) {
    const saves = read(store);
    if (!ALL_IDS.includes(n) || n === saves.active) return false;
    if (n !== FREE && !saves.slots[n]) return false;
    const next = saves.slots[n] || {};
    saves.slots[saves.active] = snapshot(store);
    delete saves.slots[n];
    saves.active = n;
    restore(store, next);
    write(store, saves);
    return true;
  }

  /* Clear Save, as in the game: the slot is left empty. The active one can't be empty, because
     it's the one the site is showing, so clearing it leaves you in free mode (with what free mode
     had). Free mode isn't a game: it's not cleared (Your game's two starting points already
     reset it). */
  function clear(store, n) {
    const saves = read(store);
    if (!SLOT_IDS.includes(n)) return false;
    if (n === saves.active) {
      restore(store, saves.slots[FREE] || {});
      delete saves.slots[FREE];
      saves.active = FREE;
    } else {
      if (!saves.slots[n]) return false;
      delete saves.slots[n];
    }
    write(store, saves);
    return true;
  }

  /* A game imported from the real one (js/savefile.js) goes into a slot, replacing whatever it
     held: into the live keys if it's the active one, into its copy if not. Not into free mode,
     which is nobody's game. */
  function importTo(store, n, snap) {
    if (!SLOT_IDS.includes(n)) return false;
    const saves = read(store);
    if (n === saves.active) restore(store, cleanSnap(snap));
    else { saves.slots[n] = cleanSnap(snap); write(store, saves); }
    return true;
  }

  /* The same game, read again because the real one saved (js/live.js): it replaces what the slot
     holds but the site's own keys, which a real save doesn't carry (a run in progress and the
     pinned build). When the game itself changed, what it was is kept in pharloom.prev (the game's
     keys and when that save was made, from pharloom.meta), for "Since last time"
     (js/changes.js); a save that only moved the clock (a bench sat at with nothing new) keeps the
     previous one. Returns 'game' when the game changed, 'meta' when only the time, the geo or the
     save's moment did, and false when nothing did. */
  const SITE_ONLY = Object.freeze(['pharloom.run', 'pharloom.baseline']);
  const OWN = Object.freeze(['pharloom.meta', 'pharloom.prev']);
  const GAME = Object.freeze(KEYS.filter((k) => !SITE_ONLY.includes(k) && !OWN.includes(k)));
  const same = (a, b, k) => (a[k] == null ? null : a[k]) === (b[k] == null ? null : b[k]);
  function prevOf(was) {
    const snap = {};
    for (const k of GAME) if (was[k] != null) snap[k] = was[k];
    let saved = null;
    try { saved = (JSON.parse(was['pharloom.meta'] || 'null') || {}).saved || null; } catch (e) { saved = null; }
    return JSON.stringify({ snap, saved });
  }
  function sync(store, n, snap) {
    if (!SLOT_IDS.includes(n)) return false;
    const saves = read(store);
    const was = n === saves.active ? snapshot(store) : saves.slots[n] || {};
    const next = cleanSnap(snap);
    for (const k of SITE_ONLY) { if (was[k] != null) next[k] = was[k]; else delete next[k]; }
    const game = !GAME.every((k) => same(was, next, k));
    if (!game && same(was, next, 'pharloom.meta')) return false;
    if (game) next['pharloom.prev'] = prevOf(was);
    else if (was['pharloom.prev'] != null) next['pharloom.prev'] = was['pharloom.prev'];
    else delete next['pharloom.prev'];
    if (n === saves.active) restore(store, next);
    else { saves.slots[n] = next; write(store, saves); }
    return game ? 'game' : 'meta';
  }

  /* The same save read again by today's code, from the copy the slot keeps (js/live.js games):
     a mark, a check or a count the site learned after the import shows as the game has it. Not a
     new save, so nothing is "since last time": the game's keys and pharloom.meta are replaced, the
     site's own are kept, and pharloom.prev is replaced only by its own save read again (prevSnap,
     the same moment as the one kept), else kept as it was. Only when the copy is the save the slot
     holds (the same moment and play time in pharloom.meta). Returns whether anything changed. */
  const momentOf = (v) => { const m = parseObj(v) || {}; return JSON.stringify([m.saved ?? null, m.time ?? null]); };
  const prevMoment = (v) => { const p = parseObj(v) || {}; return p.saved ?? null; };
  function refresh(store, n, snap, prevSnap = null) {
    if (!SLOT_IDS.includes(n)) return false;
    const saves = read(store);
    const was = n === saves.active ? snapshot(store) : saves.slots[n];
    const next = cleanSnap(snap);
    if (!was || !was['pharloom.meta'] || momentOf(was['pharloom.meta']) !== momentOf(next['pharloom.meta'])) return false;
    for (const k of SITE_ONLY) { if (was[k] != null) next[k] = was[k]; else delete next[k]; }
    delete next['pharloom.prev'];
    if (was['pharloom.prev'] != null) {
      const again = prevSnap ? prevOf(cleanSnap(prevSnap)) : null;
      next['pharloom.prev'] = again && prevMoment(again) != null && prevMoment(again) === prevMoment(was['pharloom.prev']) ? again : was['pharloom.prev'];
    }
    if (KEYS.every((k) => same(was, next, k))) return false;
    if (n === saves.active) restore(store, next);
    else { saves.slots[n] = next; write(store, saves); }
    return true;
  }

  /* Free mode's marks from before its ladders were marks (design/03-redesign.md, step 4, Free
     mode's start). The Needle, the Kit, the Pouch, the masks, the silk, the Silk Hearts and the
     Hunter's evolution used to be the free build's (pharloom.build), which started at the top, so
     a game marked by hand counted them all. They're the marks' now, in pharloom.progress as a save
     keeps them: a level moved by hand comes across, one still at the top goes to a New Game's
     (it was never set). Only Free mode's slot, and only marks kept the old way (pharloom.owned
     with no ladders): a real save always has them. Returns the snapshot migrated, or null. */
  const LADDER_TOP = Object.freeze({ needle: 4, kit: 4, pouch: 4, masks: 5, spools: 9, hearts: 3 });
  const STAGE_TOP = 3;
  const parseObj = (v) => { try { const x = JSON.parse(v || 'null'); return x && typeof x === 'object' && !Array.isArray(x) ? x : null; } catch (e) { return null; } };
  function freeLadders(snap) {
    if (!snap || typeof snap['pharloom.owned'] !== 'string') return null;
    const prog = parseObj(snap['pharloom.progress']) || {};
    if (Object.keys(LADDER_TOP).every((k) => Number.isInteger(prog[k]))) return null;
    const b = parseObj(snap['pharloom.build']) || {};
    const kept = (v, lo, top) => (Number.isInteger(v) && v >= lo && v < top ? v : null);
    const ladders = Object.fromEntries(Object.entries(LADDER_TOP).map(([k, top]) => [k, kept(b[k], 0, top) ?? 0]));
    const hunterStage = kept(b.hunterStage, 1, STAGE_TOP) ?? 1;
    return { ...snap, 'pharloom.progress': JSON.stringify({ ...prog, ...ladders, build: { hunterStage } }) };
  }
  // The same over the store, wherever Free mode's slot is (the live keys, or its copy). Whether it moved.
  function migrateFree(store) {
    const saves = read(store);
    if (saves.active === FREE) {
      const next = freeLadders(snapshot(store));
      if (next) put(store, 'pharloom.progress', next['pharloom.progress']);
      return !!next;
    }
    const next = freeLadders(saves.slots[FREE]);
    if (next) { saves.slots[FREE] = next; write(store, saves); }
    return !!next;
  }

  SS.saves = { COUNT, FREE, SAVES_KEY, KEYS, SITE_ONLY, GAME, SLOT_IDS, ALL_IDS, LADDER_TOP, read, snapshot, list, select, clear, importTo, sync, refresh, freeLadders, migrateFree };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.saves;
})();
