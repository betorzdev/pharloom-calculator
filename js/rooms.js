/* js/rooms.js — where a scene is on the map (js/map.js): the point to draw it at. Pure.
   A scene the game's map draws is its room's middle. Some aren't drawn (an interior, a bench's own
   small room: Belltown_Room_doctor, Cog_Bench): the scene named without its last part is tried
   next (Belltown_Room_doctor → Belltown_Room → Belltown), down to the area's own name; without
   any, null (the site doesn't place it rather than place it wrong). An interior with another name
   goes where its door is (ENTRANCE: the room its door leads to, read from the scene's own doors,
   their targetScene, in the game's files on 28-Sep-2026). And how to get from one room to another:
   js/graph.js's doors, and the stations a save has opened (walk, steps, path). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const M = SS.map || require('./map.js');
  const G = SS.graph || require('./graph.js');

  const ENTRANCE = {
    Bone_East_LavaChallenge: 'Bone_East_14b', Room_CrowCourt: 'Greymoor_15b', Room_CrowCourt_02: 'Greymoor_15b',
    Memory_Ant_Queen: 'Ant_Queen', Memory_Coral_Tower: 'Coral_Tower_01',
  };

  function roomOf(scene) {
    if (typeof scene !== 'string' || !scene) return null;
    if (ENTRANCE[scene]) { const r = roomOf(ENTRANCE[scene]); return r && { ...r, exact: false }; }
    let s = scene;
    for (;;) {
      const r = M.ROOMS[s];
      if (r) return { scene: s, x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, area: r[4], exact: s === scene };
      const cut = s.lastIndexOf('_');
      if (cut <= 0) return null;
      s = s.slice(0, cut);
    }
  }

  /* The scene a piece is in, from its condition (js/collectibles.js): a floor flag's scene, the
     first one among alternatives, or a flea's, which the game names after its room
     (SavedFlea_Bone_East_10_Church). A piece a wish or a shop gives has none. */
  function sceneOf(c) {
    if (!Array.isArray(c)) return null;
    if (c[0] === 'bool') return c[1];
    if (c[0] === 'flag' && /^SavedFlea_/.test(c[1])) return c[1].slice(10);
    if (c[0] === 'any') for (const x of c.slice(1)) { const s = sceneOf(x); if (s) return s; }
    return null;
  }

  /* ── Getting around: js/graph.js, the game's doors ──────────────────────
     A scene as the graph knows it: itself, or the map's piece of a room named after it
     (Bone_05_right is Bone_05), or an interior by its door (ENTRANCE). */
  const IN_GRAPH = new Set([...Object.keys(G), ...Object.values(G).flat()]);
  function graphScene(scene) {
    if (typeof scene !== 'string' || !scene) return null;
    if (IN_GRAPH.has(scene)) return scene;
    if (ENTRANCE[scene]) return graphScene(ENTRANCE[scene]);
    const cut = scene.lastIndexOf('_');
    return cut > 0 ? graphScene(scene.slice(0, cut)) : null;
  }
  /* The ways out of a scene: its doors, and from a station a save has opened (lit: the map's
     pins by savefile.pinKey, "bellway Bellway_02"), every other open station of its kind. */
  function stationsOf(lit) {
    const by = { bellway: [], ventrica: [] };
    for (const p of M.PINS) {
      if (!by[p[0]] || (p[4] && !(lit || []).includes(p[0] + ' ' + p[3]))) continue;
      const g = graphScene(p[3]);
      if (g && !by[p[0]].includes(g)) by[p[0]].push(g);
    }
    return by;
  }
  /* Breadth first from a scene: every scene reached, with how many rooms away and the one before
     it on the way. One room per door or per station ride, whatever its size: a count of rooms, not
     a distance. */
  function walk(from, lit) {
    const start = graphScene(from);
    const seen = new Map();
    if (!start) return seen;
    const st = stationsOf(lit);
    const ride = new Map();
    for (const list of Object.values(st)) for (const a of list) ride.set(a, [...(ride.get(a) || []), ...list.filter((b) => b !== a)]);
    seen.set(start, { steps: 0, prev: null });
    const q = [start];
    while (q.length) {
      const x = q.shift(), d = seen.get(x).steps;
      for (const y of [...(G[x] || []), ...(ride.get(x) || [])]) {
        if (!seen.has(y)) { seen.set(y, { steps: d + 1, prev: x }); q.push(y); }
      }
    }
    return seen;
  }
  // How many rooms from one scene to another (null: no way there), and the scenes in between.
  function steps(from, to, lit, w = walk(from, lit)) {
    const t = w.get(graphScene(to));
    return t ? t.steps : null;
  }
  function path(from, to, lit, w = walk(from, lit)) {
    let x = graphScene(to);
    if (!w.has(x)) return null;
    const out = [];
    for (; x; x = w.get(x).prev) out.unshift(x);
    return out;
  }

  SS.rooms = { ENTRANCE, roomOf, sceneOf, graphScene, walk, steps, path };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.rooms;
})();
