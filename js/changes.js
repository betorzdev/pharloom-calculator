/* js/changes.js — what your game gained between two saves: the "Since last time" block of Your
   game and the notice when the game saves while the site follows its file. Pure: no DOM and no
   language; the interface names each thing. Carried over from hallownest-calculator's.

   A game is js/savefile.js's gameOf() of a slot. diff(before, after) → what's new, only gains,
   in the order they're told:
     { kind: 'act', to }              a new Act
     { kind: 'tool' | 'crest' | 'skill' | 'art', id }   one gained (the site's id)
     { kind: 'upgrade', id, to }      masks, spools, hearts, needle, kit, pouch went up (to: the new value)
     { kind: 'everbloom' }
     { kind: 'piece', i }             a loose piece found (js/collectibles.js's PIECES index): a
                                      shard, a fragment, a locket, Craftmetal, Pale Oil, a flea.
                                      Not the upgrades and Silk Hearts one by one: 'upgrade' says those
     { kind: 'journal', id, done }    a Journal entry: new (done if already complete), or
                                      completed now (done: true, was: true)
     { kind: 'pct', from, to }        the completion went up (js/completion.js)
   Losses (rosaries spent, a Tool broken) aren't told: the block is about what you got. The
   check: between two restore points of the same game, the event that wrote the second
   (GAINED_BEAST…) is among what's new (test/changes.test.js on made-up games; on the author's
   real restore points while writing it). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const CO = SS.collectibles || require('./collectibles.js');
  const CP = SS.completion || require('./completion.js');
  const J = SS.journal || require('./journal.js');

  const UPGRADES = ['masks', 'spools', 'hearts', 'needle', 'kit', 'pouch'];
  // The pieces 'upgrade' already tells.
  const BY_UPGRADE = new Set(['needle', 'tool-pouch', 'crafting-kit', 'silk-heart']);
  const NEED = new Map(J.BOOK.map((e) => [e.id, e.kills]));

  function diff(a, b) {
    const out = [];
    if (!a || !b) return out;
    if (b.act > a.act) out.push({ kind: 'act', to: b.act });
    for (const [kind, key] of [['crest', 'crests'], ['skill', 'skills'], ['art', 'arts'], ['tool', 'tools']]) {
      for (const id of b[key]) if (!a[key].includes(id)) out.push({ kind, id });
    }
    for (const id of UPGRADES) if (b[id] > a[id]) out.push({ kind: 'upgrade', id, to: b[id] });
    if (b.everbloom && !a.everbloom) out.push({ kind: 'everbloom' });
    for (const i of b.pieces) if (!a.pieces.includes(i) && !BY_UPGRADE.has(CO.PIECES[i][0])) out.push({ kind: 'piece', i });
    // The Journal, in its own order: an entry the save didn't list, or one completed now.
    for (const e of J.BOOK) {
      const was = a.journal[e.id], now = b.journal[e.id];
      if (now === undefined) continue;
      const need = NEED.get(e.id) || 1;
      if (was === undefined) out.push({ kind: 'journal', id: e.id, done: now >= need });
      else if (now >= need && was < need) out.push({ kind: 'journal', id: e.id, done: true, was: true });
    }
    const from = CP.count(a).total, to = CP.count(b).total;
    if (to > from) out.push({ kind: 'pct', from, to });
    return out;
  }

  SS.changes = { diff };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.changes;
})();
