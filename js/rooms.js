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
    Memory_Ant_Queen: 'Ant_Queen', Memory_Coral_Tower: 'Coral_Tower_01', Room_Witch: 'Shellwood_Witch',
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

  /* ── The map as the game draws it ─────────────────────────────────────
     Piece by piece (js/map.js PIECES), with the game's own rules (GameMap.SetupMap and
     GameMapScene, read in its code on 3-Oct-2026; tools/extract-map.py's header has them):
     an area shows while its map is bought (ZONES' bool) or mapAllRooms is set; a piece is mapped
     when its scene is in scenesMapped, or every scene of its ifAll is, or its parent is mapped;
     mapped (or Full from the start), and with the Quill, it shows its whole drawing, else a Rough
     one its sketch and a Hidden one nothing. The rules read a few playerData fields (VARS).
     With no game (Free mode): every area, every piece mapped but those of Act 3, FREE's values. */

  // A game's values for the rules (savefile's mapVars). A slot kept before the site read them
  // has its mapFlags, or nothing: in Act 3 its map is taken as fallen (the game sets
  // act3MapUpdated soon after blackThreadWorld, at its first map update), with the bell as its
  // Everbloom says; the rest as with no game.
  function mapVars(g) {
    const v = { ...M.FREE };
    if (!g) return v;
    if (g.mapVars && typeof g.mapVars === 'object' && Object.keys(g.mapVars).length) {
      for (const k of M.VARS) if (k in g.mapVars) v[k] = g.mapVars[k];
      return v;
    }
    const f = Array.isArray(g.mapFlags) ? g.mapFlags : [];
    const fallen = f.length ? f : g.act === 3 && !g.mapRead ? ['act3MapUpdated', ...(g.everbloom ? ['HasWhiteFlower'] : [])] : [];
    for (const k of ['act3MapUpdated', 'HasWhiteFlower', 'SeenDivingBellGoneAbyss']) v[k] = fallen.includes(k);
    return v;
  }
  // A rule (tools/extract-map.py's form) against those values.
  function rule(c, v) {
    if (c === true || c == null) return true;
    if (c === false) return false;
    switch (c[0]) {
      case 'flag': return v[c[1]] === true;
      case 'is': return v[c[1]] === c[2];
      case 'has': return String(v[c[1]] == null ? '' : v[c[1]]).includes(c[2]);
      case 'lt': return Number(v[c[1]]) < c[2];
      case 'gt': return Number(v[c[1]]) > c[2];
      case 'not': return !rule(c[1], v);
      case 'all': return c.slice(1).every((x) => rule(x, v));
      case 'any': return c.slice(1).some((x) => rule(x, v));
      default: return false;
    }
  }
  const PIECE = new Map(M.PIECES.map((e) => [e.s, e]));
  // A piece's whole drawing: the first sprite and the first tint whose rule holds.
  function whole(e, v) {
    const si = (e.ws || []).findIndex((c) => rule(c, v)), ci = (e.wc || []).findIndex((c) => rule(c, v));
    const row = e.w[si < 0 ? e.w.length - 1 : si];
    return row[ci < 0 ? row.length - 1 : ci];
  }
  /* The room a piece is a part of: its own scene, or, for a part (Greymoor_02_top, Library_05_3:
     named after another piece and not a scene of the game, js/graph.js), the room it's a part of.
     A destroyed piece stands for its room rather than being part of it. */
  const SCENE = new Set(Object.keys(G).map((k) => k.toLowerCase()));
  const ROOM_OF = new Map();
  function roomPiece(s) {
    if (ROOM_OF.has(s)) return ROOM_OF.get(s);
    let r = s;
    if (!/_Destroyed/.test(s) && !SCENE.has(s.toLowerCase())) {
      for (let i = s.lastIndexOf('_'); i > 0; i = s.lastIndexOf('_', i - 1)) {
        const b = s.slice(0, i);
        if (PIECE.has(b) && !/_Destroyed/.test(b)) { r = roomPiece(b); break; }
      }
    }
    ROOM_OF.set(s, r);
    return r;
  }
  /* What the map shows for a game (null: Free mode). `all`: what the game doesn't draw (an area
     whose map isn't bought, a room not mapped yet) is there too, faint (faint: true), as a
     guide. Each piece: { e, cell (a CELLS index), faint }; zones: area → its move, when it has
     one that holds ({ at, dx, dy, sx, sy }); off: the scenes a rule takes off the map (their pins
     go with them). */
  function mapView(g, opts) {
    const all = !!(opts && opts.all), v = mapVars(g);
    const own = !!g, mapAll = own && g.mapAll === true;
    // A slot kept before the site read scenesMapped: what it visited, with the Quill.
    const known = own && Array.isArray(g.mapped) && (g.mapped.length || g.mappedRead);
    const set = new Set(own ? (known ? g.mapped : g.visited || []) : []);
    const quill = !own || g.quill !== false || !known;
    const bought = new Set(own ? g.maps || [] : []);
    const zoneOn = (a) => !own || mapAll || (!!(M.ZONES[a] || {}).bool && bought.has(M.ZONES[a].bool.slice(3, -3)));
    const memo = new Map();
    const mapped = (e) => {
      if (!e) return false;
      if (memo.has(e.s)) return memo.get(e.s);
      memo.set(e.s, false);
      const m = !own ? !e.act3 : mapAll || set.has(e.s) || (!!e.ifAll && e.ifAll.every((s) => set.has(s))) || (!!e.parent && mapped(PIECE.get(e.parent)));
      memo.set(e.s, m);
      return m;
    };
    const pieces = [], off = new Set();
    for (const e of M.PIECES) {
      // Off the map: a rule takes it off, or it's of Act 3 while the Cradle stands (with no game,
      // always: Free mode is the world before Act 3).
      const gone = e.dark || rule(e.off || false, v) || rule(e.hide || false, v) || (e.act3 && (!own || !v.act3MapUpdated));
      if (gone) { off.add(e.s); continue; }
      const isMapped = mapped(e), set1 = (e.st === 2 || isMapped) && quill;
      let cell = -1;
      if (set1) cell = whole(e, v);
      else if (!e.asleep) cell = e.st === 1 ? (e.r == null ? -1 : e.r) : e.st === 2 ? whole(e, v) : -1;
      const shown = zoneOn(e.a) && cell >= 0;
      if (shown && (set1 || !all)) { pieces.push({ e, cell, faint: false }); continue; }
      // As a guide: the whole drawing, faint, of what the game doesn't draw whole.
      if (all) { const w = whole(e, v); if (w >= 0) pieces.push({ e, cell: w, faint: true }); }
    }
    /* As a guide, a room is whole or not as a whole: once the game draws any part of it in colour,
       its other parts are in colour too. The game cuts rooms into parts with straight lines, and a
       part faint beside one in colour showed a change of tone in the middle of a room. */
    if (all) {
      const lit = new Set(pieces.filter((p) => !p.faint).map((p) => roomPiece(p.e.s)));
      for (const p of pieces) if (p.faint && lit.has(roomPiece(p.e.s))) p.faint = false;
    }
    const zones = {};
    for (const [a, z] of Object.entries(M.ZONES)) {
      const mv = (z.moves || []).find((m) => rule(m[0], v));
      if (mv && (mv[1] || mv[2] || mv[3] !== 1 || mv[4] !== 1)) zones[a] = { at: z.at, dx: mv[1], dy: mv[2], sx: mv[3], sy: mv[4] };
    }
    return { pieces, zones, off, zoneOn };
  }
  // The pins drawn for a game: those whose piece a rule hasn't taken off the map.
  const pinsOn = (g) => { const off = mapView(g).off; return M.PINS.filter((p) => !off.has(p[3])); };

  SS.rooms = { ENTRANCE, roomOf, sceneOf, graphScene, walk, steps, path, areaOf, mapVars, rule, mapView, pinsOn };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.rooms;
})();
