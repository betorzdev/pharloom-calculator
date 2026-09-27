/* js/saves.js — the save slots: four, like the game's profile screen, and free mode.
   Pure over a Storage-like object (getItem, setItem, removeItem): no DOM and no language.
   A slot is everything that describes one game —the build, what you own, the Hunter's
   Journal, the rest of the 100% (js/completion.js, phase 2), a run in progress and the pinned
   build—; the preferences (language, screen) belong to whoever plays, not to the game, and
   aren't in it. Carried over from hallownest-calculator's js/saves.js unchanged but for the
   keys; the list of keys grows with each phase.
   Free mode (slot 0, FREE) is what shows while no save has been selected: the everything-unlocked
   sheet, to try builds, which is nobody's game. It's where the site starts. It can be entered
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
     free mode with nothing saved comes in with the defaults (everything unlocked). An empty slot
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

  SS.saves = { COUNT, FREE, SAVES_KEY, KEYS, SITE_ONLY, GAME, SLOT_IDS, ALL_IDS, read, snapshot, list, select, clear, importTo, sync };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.saves;
})();
