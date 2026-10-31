/* tools/mark-keys.js: the Map's mark keys, worked out from the site's data in Node, as js/app-map.js
   things() builds them in the browser (Free mode, every mark): each key → { scene, act } (act its
   own, or null). tools/gen-requires.js names the marks a requirement points to by these, and
   test/requires.test.js checks every one is here. It follows app-map's rules key family by key
   family; checked against the live list (npm run drive -- --view map --eval
   "SS.app.mapApi.list().map((m) => m.key)") on 31-Oct-2026: every key a requirement uses is in both.
   A family app-map adds and this doesn't know is no harm (no requirement can point to it); one it
   knows that app-map drops (a folded task) is listed in FOLDED below. */
'use strict';
const SS = globalThis.SS || (globalThis.SS = {});
const CO = SS.collectibles || require('../js/collectibles.js');
const SP = SS.spots || require('../js/spots.js');
const QU = SS.quests || require('../js/quests.js');
const PE = SS.people || require('../js/people.js');
const GA = SS.gauntlets || require('../js/gauntlets.js');
const MAP = SS.map || require('../js/map.js');
const HW = SS.how || require('../js/how.js');
require('../js/data.js');
require('../js/graph.js');
const R = SS.rooms || require('../js/rooms.js');

const lower = (s) => String(s || '').toLowerCase();
/* The wish places that are a boss's own fight, on that boss's card (js/app-map.js WISH_FIGHT), and a
   main objective's later steps on its first step's pin (js/spots.js STEPS): no mark of their own. */
const WISH_FIGHT = { 'Pinstress Battle': 'pinstress', 'Steel Sentinel': 'summoned-saviour', 'Tormented Trobbio': 'tormented-trobbio',
  'Song Knight': 'second-sentinel', 'Garmond Black Threaded': 'lost-garmond' };

function markKeys() {
  const out = new Map();
  // Only what's in a room the map draws (app-map add()).
  const put = (key, scene, act) => { if (!out.has(key) && (!scene || R.roomOf(scene))) out.set(key, { scene: scene || null, act: act || null }); };
  // A thing's other places (js/spots.js ALSO, PLACES, VARIANTS): app-map withAlso.
  const also = (key, scene, act) => {
    put(key, scene, act);
    const a = (SP.ALSO || {})[key];
    if (a) {
      // There from the Act its seller dies in (js/how.js, its 'found' way's), or the vendor's.
      const [cat, id] = key.split(':'), ways = cat === 'piece' ? (HW.HOW.pieces || {})[id] : (HW.HOW[cat] || {})[id];
      const w = a[2] || (ways || []).find((x) => x.kind === 'found') || {};
      put(key + ':' + (a[2] && a[2].kind === 'shop' ? a[2].vendor : 'found'), a[0], w.act || act);
    }
    const p = (SP.PLACES || {})[key];
    // The other places only where they're a guide's (the Flea Brew's stops, not the Bell Eater's Bellways).
    if (p && p.guide) for (const [sc, , ac] of p.at) put(key + ':' + lower(sc), sc, ac || act);
    const v = (SP.VARIANTS || {})[key];
    if (v) for (const [variant, , sc, ac] of v.at) if (lower(sc) !== lower(scene)) put(key + ':' + variant, sc, ac || act);
  };
  CO.PIECES.forEach((p, i) => also('piece:' + i, SP.AT.pieces[i], p[1]));
  for (const cat of ['tools', 'crests', 'skills', 'arts']) {
    for (const [id, scene] of Object.entries(SP.AT[cat] || {})) {
      const w = (CO.WHERE[cat] || {})[id];
      also(cat + ':' + id, scene, (w && w[0]) || (SP.AT.act || {})[cat + ':' + id]);
    }
  }
  put('everbloom', SP.AT.everbloom, (CO.WHERE.everbloom || [])[0]);
  R.pinsOn(null).forEach((p) => put('pin:' + MAP.PINS.indexOf(p), p[3], null));
  // A gauntlet won by beating its boss is that boss's fight, on its card.
  const bossCheck = new Set(SP.BOSSES.map((b) => JSON.stringify(b[2])));
  for (const x of GA.GAUNTLETS) if (!bossCheck.has(JSON.stringify(x.done))) put('gaunt:' + x.id, x.scene, x.act);
  for (const b of SP.BOSSES) also('boss:' + b[0], b[1], b[3]);
  for (const [field, scene] of SP.BELLS) put('bell:' + field, scene, null);
  for (const [v, scenes] of Object.entries(SP.VENDORS)) scenes.forEach((sc, i) => put((v === 'shakra' ? 'shakra:' : 'shop:' + v + ':') + i, sc, null));
  for (const x of PE.TRADE || []) x.spots.forEach(([sc], i) => put('shop:' + x.id + ':' + i, sc, null));
  // The Wishwalls and the givers (app-map: FROM's boards, and who offers a wish where nobody stands for it already).
  // A wish's quest: its check's, or the first of an 'any' (app-progress wishQuest).
  const questOf = (c) => (c[0] === 'quest' ? c[1] : c[0] === 'any' ? (c.slice(1).find((x) => x[0] === 'quest') || [])[1] : null);
  // A quest no WISHES row checks is its next stage's (app-map wishOf: Steel Sentinel's is Pt2's).
  const act = (q) => {
    const w = CO.WISHES.find((x) => questOf(x[2]) === q);
    if (w) return w[1];
    const next = Object.keys(QU.CHAIN).find((n) => QU.CHAIN[n].prev === q);
    return next ? act(next) : null;
  };
  const boards = new Map();
  for (const [q, f] of Object.entries(QU.FROM)) if (f.board) boards.set(lower(f.board), [...(boards.get(lower(f.board)) || []), q]);
  for (const [b, qs] of boards) put('board:' + b, QU.FROM[qs[0]].board, Math.min(...qs.map((q) => act(q) || 1)));
  for (const [q, f] of Object.entries(QU.FROM)) {
    for (const n of f.npc || []) {
      const gid = (SP.QUEST_GIVER || {})[q] || n, g = (SP.GIVER || {})[gid];
      if (!(g && g[2])) put('giver:' + lower(gid), n, act(q));
    }
  }
  // The wishes' places and the objectives' pins, but those on a boss's card or a first step's pin.
  const steps = new Set((SP.STEPS || []).flatMap((st) => st.slice(1)));
  const bossAt = new Set(SP.BOSSES.map((b) => lower(b[1]) + '|' + b[0]));
  SP.TASKS.forEach((x, i) => {
    if (steps.has(i)) return;
    if (x[0] === 'wspot' && WISH_FIGHT[x[1]] && bossAt.has(lower(x[3]) + '|' + WISH_FIGHT[x[1]])) return;
    put('task:' + i, x[3], x[0] === 'goal' ? (SP.GOAL_ACT || {})[i] : act(x[1]));
  });
  const sameRoom = (a, b) => lower(a) === lower(b);
  for (const [id, scene] of Object.entries(SP.PEOPLE)) {
    if ((SP.VENDORS[id] || []).some((sc) => sameRoom(sc, scene))) continue;
    also('person:' + id, scene, null);
  }
  for (const x of PE.PEOPLE) for (const [scene] of x.spots) put('npc:' + x.id + ':' + lower(scene), scene, (x.act3 || []).includes(scene) ? 3 : null);
  // The extras, but the maps Shakra sells (on her card) and the unique enemies other than the Void
  // Masses (found from their Journal entry).
  SP.EXTRAS.forEach((x, i) => {
    if (x[0] === 'map' && x[5] && x[5].shop === 'shakra') return;
    if (x[0] === 'spawn' && !(x[4] && x[4].key === 'NAME_BLACK_THREAD_CORE')) return;
    also('extra:' + i, x[3], x[1]);
  });
  return out;
}

module.exports = { markKeys, WISH_FIGHT };
