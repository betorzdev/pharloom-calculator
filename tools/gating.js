/* tools/gating.js: kb/data/game/gating.json (tools/extract-gating.py), for the generators that read
   it (tools/gen-gauntlets.js, tools/gen-spots.js), and the check that it and kb/data/game/pickups.json
   (tools/extract-pickups.py) were read from the same patch of the game. A patch moves things in both
   files at once: npm run data stops until both extractors have run on it (kb/README.md), rather
   than join one patch's checks to another's places. Each extractor writes the game's own version
   ("1.0.30000", its PlayerSettings) as `patch`. npm run data runs this file first, so it stops
   before any generator reads either file; each generator that reads gating.json checks again. */
'use strict';
const fs = require('fs');
const path = require('path');

const GAME = path.join(__dirname, '..', 'kb', 'data', 'game');
const read = (f) => JSON.parse(fs.readFileSync(path.join(GAME, f), 'utf8'));

// given: { gating, pickups } instead of the files (test/save-checks.test.js), which throws; on the
// files it says why and stops the run.
function load(who, given = null) {
  const stop = (msg) => {
    if (given) throw new Error(`${who}: ${msg}`);
    console.error(`${who}: ${msg}`);
    process.exit(1);
  };
  if (!given && !fs.existsSync(path.join(GAME, 'gating.json'))) stop('kb/data/game/gating.json is missing: run tools/extract-gating.py');
  const gating = given ? given.gating : read('gating.json'), pickups = given ? given.pickups : read('pickups.json');
  const g = gating.patch, p = pickups.patch;
  if (!p) stop('kb/data/game/pickups.json says no patch: it was read before the extractors wrote one. Run tools/extract-pickups.py and tools/extract-gating.py again (kb/README.md)');
  if (!g) stop('kb/data/game/gating.json says no patch: run tools/extract-gating.py again (kb/README.md)');
  if (g !== p) stop(`kb/data/game/gating.json was read from patch ${g} and pickups.json from ${p}: after a patch run both tools/extract-pickups.py and tools/extract-gating.py (kb/README.md)`);
  return gating;
}

module.exports = { load };

if (require.main === module) load('npm run data');
