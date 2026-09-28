#!/usr/bin/env node
/* tools/spots-wanted.js — the objects whose place in their room the Map wants, for
   tools/extract-pickups.py: every check that names a scene's object (a sceneData bool, int or
   Geo Rock: its id is the object's name, "Heart Piece", "Silk Grub Large Cocoon", "Geo Rock 1"),
   from js/collectibles.js's pieces and wishes and kb/data/completionist/, into
   kb/data/game/wanted.json: { scene (lower case): [object name…] }.
     node tools/spots-wanted.js     (before the extractor; offline) */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./completionist.js');
const CO = require('../js/collectibles.js');

const OUT = path.join(__dirname, '..', 'kb', 'data', 'game', 'wanted.json');
const want = {};
function add(c) {
  if (!Array.isArray(c)) return;
  if (c[0] === 'any' || c[0] === 'all') { c.slice(1).forEach(add); return; }
  if (!['bool', 'int', 'geo'].includes(c[0])) return;
  const s = c[1].toLowerCase();
  (want[s] || (want[s] = new Set())).add(c[2]);
}
for (const p of [...CO.PIECES, ...CO.WISHES]) add(p[2]);
for (const f of fs.readdirSync(C.SRC).filter((x) => x.endsWith('.ts'))) {
  let items;
  try { items = C.load(f); } catch (e) { continue; }   // types.ts and the like: no sections
  for (const it of items) if (it.parsingInfo) add(C.check(it.parsingInfo, () => null));
}
const out = Object.fromEntries(Object.keys(want).sort().map((s) => [s, [...want[s]].sort()]));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`${Object.values(out).reduce((a, v) => a + v.length, 0)} objects in ${Object.keys(out).length} scenes → ${path.relative(process.cwd(), OUT)}`);
