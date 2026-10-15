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
/* An id the completionist writes otherwise than the game (read in the author's saves, 12-Oct-2026):
   Song_10's second breakable wall has two spaces. */
const ID_FIX = { 'Song_10/Breakable Wall second': 'Breakable Wall  second' };
function check(p, fail) {
  if (Array.isArray(p)) return ['any', ...p.map((x) => check(x, fail))];
  const id = Array.isArray(p.internalId) && ID_FIX[p.internalId.slice(0, 2).join('/')]
    ? [p.internalId[0], ID_FIX[p.internalId.slice(0, 2).join('/')], ...p.internalId.slice(2)] : p.internalId;
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

/* Where the completionist is wrong about a piece, by its check (as check() gives it): the game's
   own check and the piece's area (an AREAS id). tools/gen-collectibles.js puts them in PIECES,
   tools/gen-how.js follows them when it sets the completionist's prices against the pieces.
   Mooshka's Spool Fragment isn't given in Greymoor (the completionist's "Fleamaster reward in
   Greymoor, after rescuing 14 Fleas", checked by CaravanTroupeLocation 2): the caravan leaves
   Greymoor at 12 fleas, and Mooshka gives it the first time Hornet speaks to him at its next stop,
   the Last Judge's arena on the Blasted Steps (the game's files, read on 15-Oct-2026: Coral_Judge_Arena's
   Troupe Leader Dialogue FSM, Met? → Meet → "Award Spool Piece", which sets
   MetCaravanTroupeLeaderJudge; Greymoor_08_caravan's has no spool). The wiki says the same
   (Spool Fragment: "upon their ascent to the Grand Gate", its mapshot the caravan there; the
   Blasted Steps page lists it among its loot). MetCaravanTroupeLeaderJudge and CaravanTroupeLocation
   ≥ 2 agree on all 73 of the author's saves; the flag is the gift itself, not the move before it. */
const PIECE_FIX = { '["min","CaravanTroupeLocation",2]': [['flag', 'MetCaravanTroupeLeaderJudge'], 'CORAL_STEPS'] };

module.exports = { SRC, sections, load, check, PIECE_FIX };
