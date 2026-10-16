/* tools/map-point.js: a point of a scene on the map, for the generators (tools/gen-spots.js,
   tools/gen-people.js: one rule for both, 16-Oct-2026). As the game places a point of a scene on
   its map (GameMap.GetMapPosition, js/rooms.js mapPoint): x / width across its room's box and
   y / height up it, the scene's size its tk2dTileMap's (kb/data/game/pickups.json sizes).
     · A scene loaded over its room (greymoor_08_boss, aqueduct_05_caravan) has no size of its
       own and the room's coordinates: its point is the room's (hostOf).
     · A scene with a size of its own but no room on the map (an interior: Bellway_01, the
       houses of Bellhart) has no point: its coordinates aren't its door room's, and the Map
       puts it at that room's point as the rest of the interior.
     · A point well outside its room's box is something parked off the scene: none. One just
       outside (a foot under the scene's floor, a walker leaving by the edge) is brought in to it. */
'use strict';
require('../js/map.js');
const R = require('../js/rooms.js');
const M = globalThis.SS.map;

const ROOM_OF = new Map(Object.entries(M.ROOMS).map(([k, r]) => [k.toLowerCase(), r]));

module.exports = (sizes) => {
  const hostOf = (scene) => {
    let host = String(scene).toLowerCase();
    if (!sizes[host]) while (host.includes('_') && !(sizes[host] && ROOM_OF.get(host))) host = host.slice(0, host.lastIndexOf('_'));
    return host;
  };
  function toMap(scene, x, y) {
    const host = hostOf(scene);
    const r = ROOM_OF.get(host), size = sizes[host];
    const p = r && size && x != null && y != null ? R.mapPoint(host, x, y, size[0], size[1]) : null;
    if (!p) return null;
    const out = Math.max(r[0] - p.x, p.x - r[0] - r[2], 0) + Math.max(r[1] - p.y, p.y - r[1] - r[3], 0);
    if (out > 12) return null;
    const px = Math.min(Math.max(p.x, r[0]), r[0] + r[2]), py = Math.min(Math.max(p.y, r[1]), r[1] + r[3]);
    return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
  }
  return { hostOf, toMap, ROOM_OF };
};
