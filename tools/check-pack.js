#!/usr/bin/env node
/* tools/check-pack.js — the site against the game, on a folder of real saves.
     npm run check-pack -- <folder>
   Every save under it, at any depth (user#.dat, user#_<patch>.dat and the restore points,
   restoreData#.dat), is read as the site reads it (js/savefile.js → game()), and what the site
   counts is set against what the game itself saved:
     completion  js/completion.js vs playerData.completionPercentage (must match: exit code 1 if not)
     pieces      the pieces js/collectibles.js finds one by one vs the game's own counters: the
                 Mask Shards (4 per whole mask plus heartPieces), the Spool Fragments (2 per
                 whole spool plus silkSpoolParts), the Needle, Tool Pouch and Crafting Kit
                 upgrades and the Silk Hearts (must match: exit code 1 if not)
   On Linux the game's folder is ~/.config/unity3d/Team Cherry/Hollow Knight Silksong/<id>/.
   The saves stay where they are: they're somebody's games and don't go in the repo. */
'use strict';
const fs = require('fs');
const path = require('path');
const CO = require('../js/collectibles.js');
const F = require('../js/savefile.js');
const CP = require('../js/completion.js');

const root = process.argv[2];
if (!root || !fs.existsSync(root)) {
  console.error('usage: npm run check-pack -- <folder with Silksong saves>');
  process.exit(2);
}

const SAVE = /^(user\d+(_[\d.]+)?|(NODEL)?restoreData\d+)\.dat$/;
function saves(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...saves(p));
    else if (SAVE.test(e.name)) out.push(p);
  }
  return out;
}
const files = saves(root).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

function pieceDiffs(pd, g) {
  const n = (kind) => g.pieces.filter((i) => CO.PIECES[i][0] === kind).length;
  const want = {
    'mask-shard': 4 * g.masks + (Number(pd.heartPieces) || 0),
    'spool-fragment': 2 * g.spools + (Number(pd.silkSpoolParts) || 0),
    needle: g.needle, 'tool-pouch': g.pouch, 'crafting-kit': g.kit, 'silk-heart': g.hearts,
  };
  return Object.entries(want).filter(([k, v]) => n(k) !== v).map(([k, v]) => `${k} ${n(k)}≠${v}`);
}

let bad = 0, badP = 0, unreadable = 0;
for (const file of files) {
  const name = path.relative(root, file);
  const r = F.read(fs.readFileSync(file));
  if (!r.ok) { unreadable++; console.log(`??  ${name}: ${r.error}`); continue; }
  const g = F.game(r.pd, r.sd);
  const c = CP.count(g);
  const game = Math.round(Number(r.pd.completionPercentage) || 0);
  const ok = c.total === game;
  const pd = pieceDiffs(r.pd, g);
  if (!ok) bad++;
  if (pd.length) badP++;
  const parts = ok ? '' : '  ' + c.categories.map((k) => `${k.id} ${k.got}/${k.max}`).join(', ');
  const at = r.restore ? `  (${r.restore.date} ${r.restore.event})` : '';
  console.log(`${ok ? 'ok' : 'XX'}  ${String(c.total).padStart(3)}% (game ${String(game).padStart(3)}%)  act ${g.act}  `
    + `${name}  v${r.pd.version || '?'}${F.meta(r.pd).steel ? ' Steel Soul' : ''}${at}${parts}${pd.length ? '  pieces: ' + pd.join(', ') : ''}`);
}
console.log(`\n${files.length} saves · completion: ${files.length - bad - unreadable} match, ${bad} differ`
  + ` · pieces: ${badP} differ · ${unreadable} unreadable`);
process.exit(bad || badP || unreadable ? 1 : 0);
