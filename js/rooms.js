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
    Bellway_01: 'Bonetown', Bone_East_LavaChallenge: 'Bone_East_14b', Room_CrowCourt: 'Greymoor_15b', Room_CrowCourt_02: 'Greymoor_15b',
    Memory_Ant_Queen: 'Ant_Queen', Memory_Coral_Tower: 'Coral_Tower_01',
  };

  /* Scene names by their lower case too: a scene nobody enters by a door (a boss's arena, a memory)
     keeps the bundle's lower-case name in js/graph.js and js/journal-rooms.js, as Unity doesn't care. */
  const LOWER = new Map(Object.keys(M.ROOMS).map((k) => [k.toLowerCase(), k]));
  const ENTRANCE_LOWER = new Map(Object.entries(ENTRANCE).map(([k, v]) => [k.toLowerCase(), v]));
  function roomOf(scene) {
    if (typeof scene !== 'string' || !scene) return null;
    const door = ENTRANCE[scene] || ENTRANCE_LOWER.get(scene.toLowerCase());
    if (door) { const r = roomOf(door); return r && { ...r, exact: false }; }
    let s = scene;
    for (;;) {
      const key = M.ROOMS[s] ? s : LOWER.get(s.toLowerCase());
      const r = key && M.ROOMS[key];
      if (r) return { scene: key, x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, area: r[4], exact: s === scene };
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
    if (c[0] === 'bool' || c[0] === 'int' || c[0] === 'geo') return c[1];
    if (c[0] === 'flag' && /^SavedFlea_/.test(c[1])) return c[1].slice(10);
    if (c[0] === 'any') for (const x of c.slice(1)) { const s = sceneOf(x); if (s) return s; }
    return null;
  }

  /* ── Getting around: js/graph.js, the game's doors ──────────────────────
     A scene as the graph knows it: itself, or the map's piece of a room named after it
     (Bone_05_right is Bone_05), or an interior by its door (ENTRANCE). The map spells some
     differently: another capital (Abandoned_Town), a letter more (Arborium_07b), a space. */
  const IN_GRAPH = new Set([...Object.keys(G), ...Object.values(G).flat()]);
  const GRAPH_LOWER = new Map([...IN_GRAPH].map((k) => [k.toLowerCase(), k]));
  function graphScene(scene) {
    if (typeof scene !== 'string' || !scene) return null;
    scene = scene.replace(/\s+/g, '');
    if (IN_GRAPH.has(scene)) return scene;
    if (GRAPH_LOWER.has(scene.toLowerCase())) return GRAPH_LOWER.get(scene.toLowerCase());
    if (ENTRANCE[scene]) return graphScene(ENTRANCE[scene]);
    if (/_\d+[a-z]$/.test(scene) && IN_GRAPH.has(scene.slice(0, -1))) return scene.slice(0, -1);
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

  /* A scene's area as the game names it (js/collectibles.js AREAS, the save's currentArea ids).
     The map's branches (Bone, Crawl…) aren't those ids; the join comes from the data: every piece,
     wish and gauntlet has its scene and its area, and each branch takes the area most of its own
     carry. Four branches carry none and are named here; Surface has no area of its own. */
  const AREA_FALLBACK = { Abyss: 'ABYSS', Cradle: 'CRADLE', 'Dust Maze': 'MISTMAZE', Tut: 'MOSSCAVE' };
  let AREA_OF = null;
  function areaOf(scene) {
    if (!AREA_OF) {
      const CO = SS.collectibles || require('./collectibles.js');
      const GA = SS.gauntlets || require('./gauntlets.js');
      const vote = {};
      const add = (sc, area) => { const r = sc && area && roomOf(sc); if (r) (vote[r.area] = vote[r.area] || {})[area] = (vote[r.area][area] || 0) + 1; };
      for (const p of [...CO.PIECES, ...CO.WISHES]) add(sceneOf(p[2]), p[3]);
      for (const g of GA.GAUNTLETS) add(g.scene, g.area);
      AREA_OF = { ...AREA_FALLBACK };
      for (const [branch, v] of Object.entries(vote)) AREA_OF[branch] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
    }
    const r = roomOf(scene);
    return r ? AREA_OF[r.area] || null : null;
  }

  /* ── The map's state: the rooms a game has there ──────────────────────
     Some rooms change with the game (js/map.js LAYERS, each with the game's own condition over a
     few playerData flags): the Cradle, Cogwork Core and the Ventrica hub fall in Act 3
     (act3MapUpdated) and their destroyed rooms take their place; the Abyss's diving bell is broken,
     then gone (SeenDivingBellGoneAbyss), then mended with the Everbloom (HasWhiteFlower). A game
     carries the flags its save has set (savefile's mapFlags). One kept before the site read them
     has none: in Act 3 its map is taken as fallen (the game sets act3MapUpdated soon after
     blackThreadWorld, at its first map update), with the bell as its Everbloom says.
     With no game (Free mode), FREE: the world before Act 3. */
  function mapFlags(g) {
    if (!g) return M.FREE.slice();
    const f = Array.isArray(g.mapFlags) ? g.mapFlags.filter((x) => M.VARY.includes(x)) : [];
    // A slot kept before the site read the flags: its Act 3 taken as the fallen Cradle's. A game
    // just in Act 3 whose map the game hasn't updated yet has mapRead and no flag: as it is.
    if (g.act === 3 && !g.mapRead && !f.length) return ['act3MapUpdated', ...(g.everbloom ? ['HasWhiteFlower'] : [])];
    return f;
  }
  function holds(c, flags) {
    switch (c[0]) {
      case 'flag': return flags.includes(c[1]);
      case 'not': return !holds(c[1], flags);
      case 'all': return c.slice(1).every((x) => holds(x, flags));
      case 'any': return c.slice(1).some((x) => holds(x, flags));
      default: return false;
    }
  }
  /* The layers drawn for these flags, and the scenes of those that aren't (their rooms, and the
     pins in them, aren't there). */
  const layersOn = (flags) => M.LAYERS.filter((l) => holds(l[0], flags));
  const scenesOff = (flags) => new Set(M.LAYERS.filter((l) => !holds(l[0], flags)).flatMap((l) => l[6]));
  const pinsOn = (flags) => { const off = scenesOff(flags); return M.PINS.filter((p) => !off.has(p[3])); };

  SS.rooms = { ENTRANCE, roomOf, sceneOf, graphScene, walk, steps, path, areaOf, mapFlags, layersOn, scenesOff, pinsOn };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.rooms;
})();
