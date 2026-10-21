/* tools/map-point.js: a point of a scene on the map, for the generators (tools/gen-spots.js,
   tools/gen-people.js: one rule for both, 16-Oct-2026). As the game places a point of a scene on
   its map (GameMap.GetMapPosition, js/rooms.js mapPoint): x / width across its room's box and
   y / height up it, the scene's size its tk2dTileMap's (kb/data/game/pickups.json sizes).
     · A scene loaded over its room (greymoor_08_boss, aqueduct_05_caravan, the Flea Games'
       aqueduct_05_festival) has no size of its own and the room's coordinates: its point is the
       room's (hostOf).
     · A scene with a size of its own but no room on the map (an interior: Plinney's house, the
       Bellhome, the Skull Cave) is at the door it's entered by (Albert's choice, 21-Oct-2026, from
       the Map's audit; it was its door room's middle): the TransitionPoint into it
       (kb/data/game/entrances.json, tools/extract-entrances.py) in the room the Map files it under
       (js/rooms.js roomOf: the scene named without its last part, or ENTRANCE), placed as any point
       of that room (doorAt). Its own coordinates aren't its door room's, so everything inside it
       goes to that one point. With no such door (the Doctor's house, whose only door in the game's
       files is Wisp_03's), none: the Map puts it at that room's point as before.
     · A point well outside its room's box is something parked off the scene: none. One just
       outside (a foot under the scene's floor, a walker leaving by the edge) is brought in to it.
   toRoom places a point in its own room only (no door): the benches against the map's pins and
   where Hornet wakes, which are the game's own pins in an interior. */
'use strict';
const fs = require('fs');
const path = require('path');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const M = globalThis.SS.map;

const ROOM_OF = new Map(Object.entries(M.ROOMS).map(([k, r]) => [k.toLowerCase(), r]));
const ENTRANCES = path.join(__dirname, '..', 'kb', 'data', 'game', 'entrances.json');

module.exports = (sizes, patch) => {
  if (!fs.existsSync(ENTRANCES)) throw new Error('map-point: kb/data/game/entrances.json is missing: run tools/extract-entrances.py');
  const E = JSON.parse(fs.readFileSync(ENTRANCES, 'utf8'));
  if (patch && E.patch !== patch) throw new Error(`map-point: entrances.json is of patch ${E.patch}, pickups.json of ${patch}: run tools/extract-entrances.py again`);
  const hostOf = (scene) => {
    let host = String(scene).toLowerCase();
    if (!sizes[host]) while (host.includes('_') && !(sizes[host] && ROOM_OF.get(host))) host = host.slice(0, host.lastIndexOf('_'));
    return host;
  };
  function toRoom(scene, x, y) {
    const host = hostOf(scene);
    const r = ROOM_OF.get(host), size = sizes[host];
    const p = r && size && x != null && y != null ? R.mapPoint(host, x, y, size[0], size[1]) : null;
    if (!p) return null;
    const out = Math.max(r[0] - p.x, p.x - r[0] - r[2], 0) + Math.max(r[1] - p.y, p.y - r[1] - r[3], 0);
    if (out > 12) return null;
    const px = Math.min(Math.max(p.x, r[0]), r[0] + r[2]), py = Math.min(Math.max(p.y, r[1]), r[1] + r[3]);
    return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
  }
  // An interior: a scene with a tilemap of its own and no room on the map.
  const interior = (scene) => { const host = hostOf(scene); return !!sizes[host] && !ROOM_OF.get(host); };
  // An interior's door in the room the Map files it under, as a point of that room; null for anything else.
  function doorAt(scene) {
    if (!interior(scene)) return null;
    const room = R.roomOf(scene);
    if (!room) return null;
    const door = (E.doors[hostOf(scene)] || []).find(([s]) => ROOM_OF.get(s) && (R.roomOf(s) || {}).scene === room.scene);
    return door ? toRoom(door[0], door[2], door[3]) : null;
  }
  const toMap = (scene, x, y) => (interior(scene) ? doorAt(scene) : toRoom(scene, x, y));
  return { hostOf, toMap, toRoom, doorAt, interior, ROOM_OF };
};
