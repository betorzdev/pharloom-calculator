#!/usr/bin/env node
/* tools/fetch-art.js — the game's sprites the page shows, downloaded from hollowknight.wiki into
   assets/ (npm run art). © Team Cherry, shown as a fan project (the colophon says so). Committed:
   the page works offline and over file://, so it can't fetch them itself.
   Each entry is [the wiki's file name, where it goes under assets/]. Re-run after a patch
   changes a sprite; the page's paths are js/app.js's ART. */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ART = [
  // The HUD: a mask, the spool full and empty (design/02-silksong.md §2 measured them).
  ['SS Mask.png', 'hud/mask.png'],
  ['Silk Spool HUD Complete Filled.png', 'hud/spool.png'],
  ['Silk Spool HUD Complete.png', 'hud/spool-empty.png'],
  // Hornet: at a bench (the header's save selector), standing (the import) and fallen (a file
  // that can't be read, as the Knight's shade on the Hollow Knight site).
  ['Hornet Resting.png', 'hornet/resting.png'],
  ['Hornet Idle.png', 'hornet/idle.png'],
  ['Hornet Corpse.png', 'hornet/corpse.png'],
  // The five Needles, as the inventory draws them (80 × 600).
  ...[1, 2, 3, 4, 5].map((n) => [`Needle ${n} ${['Needle', 'Sharpened Needle', 'Shining Needle', 'Hivesteel Needle', 'Pale Steel Needle'][n - 1]}.png`, `needles/${n - 1}.png`]),
];

const OUT = path.join(__dirname, '..', 'assets');
const UA = { 'User-Agent': 'pharloom-calculator/1.0 (personal project; tools/fetch-art.js)' };

function get(url, hops = 5) {
  return new Promise((ok, ko) => {
    https.get(url, { headers: UA }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && hops) {
        res.resume();
        ok(get(new URL(res.headers.location, url).href, hops - 1));
        return;
      }
      if (res.statusCode !== 200) { res.resume(); ko(new Error(`${res.statusCode} ${url}`)); return; }
      const parts = [];
      res.on('data', (c) => parts.push(c));
      res.on('end', () => ok(Buffer.concat(parts)));
    }).on('error', ko);
  });
}

(async () => {
  for (const [file, dest] of ART) {
    const buf = await get('https://hollowknight.wiki/w/Special:FilePath/' + encodeURIComponent(file.replace(/ /g, '_')));
    const to = path.join(OUT, dest);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, buf);
    console.log(`${String(buf.length).padStart(7)}  assets/${dest}  ← ${file}`);
    await new Promise((r) => setTimeout(r, 300));
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
