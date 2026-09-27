#!/usr/bin/env node
/* tools/fetch-collectibles.js — downloads Br3zzly/silksong-completionist's dictionary (MIT) into
   kb/data/completionist/, at a pinned commit, with its licence.
     npm run collectibles            (then npm run data regenerates js/collectibles.js)
   What's taken from it are facts: each trackable thing's save field (a Tool's internal name,
   a scene and a persistent id, a quest, a flag), its Act and whether it counts for the 100%.
   Its prose (the location sentences, the names like "Mask Shard #7") isn't shown on the site:
   the names come from the game's text (CLAUDE.md, "Translations"). It's credited as the
   Hollow Knight site credits ItemChanger (design/00-study.md §4.4).
   Committed like kb/data/raw/, so the generators run offline and a new pin shows up as a diff.
   To move the pin: change COMMIT, run this, run npm run data, and read both diffs. */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = 'Br3zzly/silksong-completionist';
const COMMIT = 'c9e7a8158e2e89198933415c4ef4a6d23f067be0';   // 10 September 2026
const OUT = path.join(__dirname, '..', 'kb', 'data', 'completionist');
// The dictionary's categories that are plain object literals (.ts); the .tsx ones carry JSX
// descriptions and aren't read yet (keys, mapping supplies, the Materium).
const FILES = ['LICENSE', ...['abilities', 'bellhome', 'bellways', 'bosses', 'cachesAndSecrets', 'craftmetals',
  'crests', 'fleas', 'huntersJournal', 'maskShards', 'mementos', 'memoryLockets', 'mossberries', 'paleOil',
  'relics', 'silkeaters', 'spoolFragments', 'stats', 'tasks', 'tools', 'uniqueSpawns', 'upgrades',
  'ventricaStations'].map((f) => `src/dictionary/categories/${f}.ts`)];

const get = (url) => new Promise((ok, ko) => {
  https.get(url, { headers: { 'User-Agent': 'pharloom-calculator/1.0 (tools/fetch-collectibles.js)' } }, (res) => {
    if (res.statusCode !== 200) { res.resume(); ko(new Error(`${res.statusCode} ${url}`)); return; }
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (c) => { body += c; });
    res.on('end', () => ok(body));
  }).on('error', ko);
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of FILES) {
    const body = await get(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${f}`);
    fs.writeFileSync(path.join(OUT, path.basename(f)), body);
    console.log(`${String(body.length).padStart(7)}  ${path.basename(f)}`);
  }
  fs.writeFileSync(path.join(OUT, 'SOURCE'), `https://github.com/${REPO}/tree/${COMMIT}\n`);
})().catch((e) => { console.error(e.message); process.exit(1); });
