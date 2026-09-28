/* tools/completionist.js — kb/data/completionist/ read as data, for the generators
   (tools/gen-collectibles.js, tools/gen-spots.js). A category file is one object literal after
   its type import; check() turns an item's parsingInfo into the site's check (js/savefile.js
   has()), the shapes js/collectibles.js's header lists. */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'kb', 'data', 'completionist');

function sections(file) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
    .replace(/^import .*$/mg, '')
    .replace(/export const \w+: \w+ =/, 'module.exports =');
  const m = { exports: {} };
  new Function('module', src)(m);
  return m.exports.sections;
}
const load = (file) => sections(file).flatMap((s) => s.items);

/* The completionist's checks (its src/dictionary/parsers.ts at the pinned commit), as the site's:
   sceneDataInt holds when the room's int is the value given; a rosary cache's when it's -1
   (emptied); a Geo Rock's when the room keeps it at 0 hits left (the completionist also counts
   a rock the save doesn't list, which is a room never entered: here that's not had). */
function check(p, fail) {
  if (Array.isArray(p)) return ['any', ...p.map((x) => check(x, fail))];
  const id = p.internalId;
  switch (p.type) {
    case 'flag': return ['flag', id];
    case 'flagMin': return ['min', id[0], id[1]];
    case 'quest': return ['quest', id];
    case 'sceneDataBool': return ['bool', id[0], id[1]];
    case 'sceneVisited': return ['visited', id];
    case 'journal': return ['journal', id];
    case 'relic': return ['relic', id];
    case 'mementoDeposit': return ['memento', id];
    case 'sceneDataInt': return ['int', id[0], id[1], id[2]];
    case 'sceneDataIntRosaries': return ['int', id[0], id[1], -1];
    case 'sceneDataGeo': return ['geo', id[0], id[1]];
    default: return fail(`check type ${p.type} not read yet`);
  }
}

module.exports = { SRC, sections, load, check };
