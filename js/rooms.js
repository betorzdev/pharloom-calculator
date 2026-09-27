/* js/rooms.js — where a scene is on the map (js/map.js): the point to draw it at. Pure.
   A scene the game's map draws is its room's middle. Some aren't drawn (an interior, a bench's own
   small room: Belltown_Room_doctor, Cog_Bench): the scene named without its last part is tried
   next (Belltown_Room_doctor → Belltown_Room → Belltown), down to the area's own name; without
   any, null (the site doesn't place it rather than place it wrong). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const M = SS.map || require('./map.js');

  function roomOf(scene) {
    if (typeof scene !== 'string' || !scene) return null;
    let s = scene;
    for (;;) {
      const r = M.ROOMS[s];
      if (r) return { scene: s, x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, area: r[4], exact: s === scene };
      const cut = s.lastIndexOf('_');
      if (cut <= 0) return null;
      s = s.slice(0, cut);
    }
  }

  SS.rooms = { roomOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.rooms;
})();
