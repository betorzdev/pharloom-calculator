/* js/rooms.js — where a scene is on the map (js/map.js): the point to draw it at. Pure.
   A scene the game's map draws is its room's middle. Some aren't drawn (an interior, a bench's own
   small room: Belltown_Room_doctor, Cog_Bench): the scene named without its last part is tried
   next (Belltown_Room_doctor → Belltown_Room → Belltown), down to the area's own name; without
   any, null (the site doesn't place it rather than place it wrong). An interior with another name
   goes where its door is (ENTRANCE: the room its door leads to, read from the scene's own doors,
   their targetScene, in the game's files on 28-Sep-2026). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const M = SS.map || require('./map.js');

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

  SS.rooms = { ENTRANCE, roomOf, sceneOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.rooms;
})();
