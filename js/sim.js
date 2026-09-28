/* js/sim.js — the Combat screen's fight, played out by taps (design/03-redesign.md, step 9): the
   sibling's arena, kept to what the engine already computes (js/engine.js), with no clock and no
   stagger. The screen describes the fight as a kit; this plays moves on a state. Pure: no DOM,
   no language, no storage.
     kit    { hp, masks, spool, bind: { cost, heals },
              moves: { id: { dmg, gain, cost, ammo } },   what Hornet can do: its damage, the silk a
                                                          landed hit gives, the silk it costs, its uses
              hits: { id: masks },                         what the enemy can do to her
              phases: [{ n, at }] }                        where each phase starts, in health left
     start(kit)          → the state: full health both sides, the spool full (the engine's own
                           assumption), every Tool's uses
     act(kit, s, id)     → a new state with the move played, or s itself when it can't be
     can(kit, s, id)     → whether it can: not over, silk for it, uses left
     undo(s)             → the state before the last move
   The state's log is a list of events, newest last: { k: 'you', id, dmg, hp }, { k: 'hit', id,
   m, masks }, { k: 'bind', h, masks }, { k: 'phase', n }, { k: 'win', n } (n: your moves),
   { k: 'lose' }. js/app-fight.js turns them into lines with t(). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

  function start(kit) {
    const ammo = {};
    for (const [id, m] of Object.entries(kit.moves)) if (m.ammo != null) ammo[id] = m.ammo;
    return { hp: kit.hp, masks: kit.masks, silk: kit.spool, ammo, moves: 0, over: null, log: [], past: null };
  }

  function can(kit, s, id) {
    if (s.over) return false;
    if (id === 'bind') return s.silk >= kit.bind.cost && s.masks < kit.masks;
    if (kit.hits[id] != null) return true;
    const m = kit.moves[id];
    if (!m) return false;
    if (m.cost && s.silk < m.cost) return false;
    if (m.ammo != null && !s.ammo[id]) return false;
    return true;
  }

  function act(kit, s, id) {
    if (!can(kit, s, id)) return s;
    // Each move keeps the state before it, so undo is one step back.
    const n = { ...s, ammo: { ...s.ammo }, log: s.log.slice(), past: s };
    if (id === 'bind') {
      const h = Math.min(kit.bind.heals, kit.masks - s.masks);
      n.silk -= kit.bind.cost;
      n.masks += h;
      n.log.push({ k: 'bind', h, masks: n.masks });
      return n;
    }
    if (kit.hits[id] != null) {
      const m = kit.hits[id];
      n.masks = Math.max(0, s.masks - m);
      n.log.push({ k: 'hit', id, m, masks: n.masks });
      if (!n.masks) { n.over = 'lose'; n.log.push({ k: 'lose' }); }
      return n;
    }
    const m = kit.moves[id];
    n.silk = Math.min(kit.spool, s.silk - (m.cost || 0) + (m.gain || 0));
    if (m.ammo != null) n.ammo[id] -= 1;
    n.hp = Math.max(0, s.hp - m.dmg);
    n.moves = s.moves + 1;
    n.log.push({ k: 'you', id, dmg: m.dmg, hp: n.hp });
    for (const p of kit.phases || []) if (s.hp > p.at && n.hp <= p.at && n.hp > 0) n.log.push({ k: 'phase', n: p.n });
    if (!n.hp) { n.over = 'win'; n.log.push({ k: 'win', n: n.moves }); }
    return n;
  }

  const undo = (s) => s.past || s;

  SS.sim = { start, can, act, undo };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.sim;
})();
