#!/usr/bin/env node
/* tools/fetch-icons.js — the inventory icons of what js/data.js lists, downloaded from
   hollowknight.wiki into assets/icons/<list>/<id>.webp (npm run icons). © Team Cherry, shown as a
   fan project; committed, since the page works offline and over file://.
   Which file: each thing's page in kb/data/raw/ (npm run kb) by its English name ("X", "X
   Crest", "X (Silksong)"), its infobox's image: the gallery's line marked Inventory, or else its
   first. A Tool's upgrade (Curvesickle) is its twin's page's second block (image2). A few have no
   page of their own or a picture that isn't the inventory's: FILE names the wiki file directly. */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const W = require('./wiki.js');
require('../js/data.js');
const D = globalThis.SS.data;

const OUT = path.join(__dirname, '..', 'assets', 'icons');
const UA = { 'User-Agent': 'pharloom-calculator/1.0 (personal project; tools/fetch-icons.js)' };
const TWINS = { curvesickle: 'Curveclaw', 'druids-eyes': "Druid's Eye", 'claw-mirrors': 'Claw Mirror' };
// Things whose picture isn't on a page of their own, or whose infobox shows something else.
const FILE = {
  'items/tool-pouch': 'Tool Pouch.png', 'items/crafting-kit': 'Crafting Kit.png',
  'items/mask-shard': 'Mask Shard.png', 'items/spool-fragment': 'Spool Fragment.png',
  'extras/rosary-cache': 'Rosaries large.png', 'extras/shard-cache': 'Shell Shards large.png',
  'extras/arcane-egg': 'Arcane Egg Silksong.png', 'items/needle': 'Needle 1 Needle.png',
};
/* The Map's things beyond the 100% (js/spots.js EXTRAS), by their wiki pages: the relics, the
   Mossberry, the Silkeater, each Memento, and the caches' currencies. */
const EXTRAS = [['bone-scroll', 'Bone Scroll'], ['weaver-effigy', 'Weaver Effigy'], ['choral-commandment', 'Choral Commandment'],
  ['rune-harp', 'Rune Harp'], ['psalm-cylinder', 'Psalm Cylinder'], ['arcane-egg', 'Arcane Egg'], ['mossberry', 'Mossberry'],
  ['silkeater', 'Silkeater'], ['rosary-cache', 'Rosaries'], ['shard-cache', 'Shell Shards'],
  ['grey-memento', 'Grey Memento'], ['heros-memento', "Hero's Memento"], ['surface-memento', 'Surface Memento'],
  ['hunters-memento', "Hunter's Memento"], ['craw-memento', 'Craw Memento'], ['sprintmaster-memento', 'Sprintmaster Memento'],
  ['guardians-memento', "Guardian's Memento"]];
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);

const has = (t) => fs.existsSync(path.join(W.RAW, t.replace(/[/ ]/g, '_') + '.wiki'));
const titleOf = (en, extra = []) => [en, ...extra.map((x) => x.replace('%', en)), en + ' (Silksong)'].find(has);

/* The infobox's image: "X.png", or a gallery's "X.png|Inventory" line (or its first); a Crest's
   infobox numbers it (image1). An infobox with no image field shows the file named as its page,
   as the wiki's template does: "Magma Bell.png". */
function imageOf(text, suffix = '', title = null) {
  const m = new RegExp(`\\|\\s*image${suffix || '1?'}\\s*=\\s*([\\s\\S]*?)\\n\\s*\\|`).exec(text);
  if (!m) return title ? title.replace(/ \(Silksong\)$/, '') + '.png' : null;
  const v = m[1].trim();
  if (!/<gallery>/.test(v)) return v.replace(/^\[\[(File:)?|\]\]$/g, '').split('|')[0].trim() || null;
  const lines = v.replace(/<\/?gallery>/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const inv = lines.find((l) => /\|\s*Inventory\s*$/i.test(l)) || lines[0];
  return inv ? inv.split('|')[0].trim() : null;
}

function get(url, hops = 5) {
  return new Promise((ok, ko) => {
    https.get(url, { headers: UA }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && hops) { res.resume(); ok(get(new URL(res.headers.location, url).href, hops - 1)); return; }
      if (res.statusCode !== 200) { res.resume(); ko(new Error(`${res.statusCode} ${url}`)); return; }
      const parts = []; res.on('data', (c) => parts.push(c)); res.on('end', () => ok(Buffer.concat(parts)));
    }).on('error', ko);
  });
}

(async () => {
  const jobs = [];
  const add = (list, id, en, extra) => {
    const key = `${list}/${id}`;
    if (FILE[key]) { jobs.push([key, FILE[key]]); return; }
    if (TWINS[id]) { jobs.push([key, imageOf(W.page(TWINS[id]), '2')]); return; }
    const t = titleOf(en, extra);
    jobs.push([key, t ? imageOf(W.page(t), '', t) : null]);
  };
  for (const [id, en] of EXTRAS) add('extras', id, en);
  jobs.push(['items/needle', FILE['items/needle']]);
  for (const x of D.TOOLS) add('tools', x.id, x.name.en);
  for (const x of D.CRESTS) add('crests', x.id, x.name.en, ['% Crest']);
  /* The Silk Skills and abilities: the inventory's art, one family on the wiki, "Icon SS <Name>
     Art.png" (white on black, as the pause menu draws them), not their pages' small HUD icon. */
  for (const x of D.SKILLS) jobs.push([`skills/${x.id}`, `Icon SS ${x.name.en} Art.png`]);
  for (const x of D.ARTS) jobs.push([`arts/${x.id}`, `Icon SS ${x.name.en} Art.png`]);
  // The pieces that have a picture of their own (js/collectibles.js's kinds), in the same family.
  for (const [id, file] of [['silk-heart', 'Icon SS Silk Heart Art.png'], ['flea', 'Icon SS Flea.png'],
    ['heart-bloom', 'Icon SS Pollen Heart Art.png'], ['heart-coral', 'Icon SS Encrusted Heart Art.png'],
    ['heart-hunter', "Icon SS Hunter's Heart Art.png"], ['heart-clover', 'Icon SS Conjoined Heart Art.png'],
    ['melody-architect', "Icon SS Architect's Melody Art.png"], ['melody-librarian', "Icon SS Vaultkeeper's Melody Art.png"],
    ['melody-conductor', "Icon SS Conductor's Melody Art.png"]]) jobs.push([`pieces/${id}`, file]);
  for (const x of D.ITEMS) add('items', x.id, x.name.en, ["%'s Journal (Silksong)"]);
  /* The Hunter's Journal's portraits: the wiki's table names each row's file with the page it
     links to ("[[File:HJ Mossgrub.png|60px|link=Mossgrub]]"); they're paired with js/journal.js's
     entries by that page's name, not by order (the Steel Soul row carries an icon between the two,
     and an order-pairing shifts every row after it). An entry with no portrait stops the run. */
  require('../js/journal.js');
  const J = globalThis.SS.journal;
  const norm = (x) => x.toLowerCase().replace(/ \(silksong\)$/, '').replace(/[’']/g, "'").trim();
  const portrait = new Map([...W.page("Hunter's Journal (Silksong)").matchAll(/\[\[File:(HJ [^|\]]+)\|[^\]]*?link=([^\]|]+)\]\]/g)]
    .map((m) => [norm(m[2]), m[1]]));
  const lost = J.BOOK.filter((e) => !portrait.has(norm(e.name.en))).map((e) => e.name.en);
  if (lost.length) throw new Error('no Journal portrait for ' + lost.join(', '));
  for (const e of J.BOOK) jobs.push([`journal/${e.id}`, portrait.get(norm(e.name.en))]);
  const missing = jobs.filter(([, f]) => !f).map(([k]) => k);
  if (missing.length) console.log('no picture found for:', missing.join(', '));
  let n = 0;
  for (const [key, file] of jobs) {
    if (!file || (ONLY.length && !ONLY.includes(key.split('/')[0]) && !ONLY.includes(key))) continue;
    try {
      const buf = await get('https://hollowknight.wiki/w/Special:FilePath/' + encodeURIComponent(file.replace(/ /g, '_')));
      const to = path.join(OUT, key + '.png');
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.writeFileSync(to, buf);
      n++;
    } catch (e) { console.log(`${key}: ${file}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`${n} of ${jobs.length} icons into assets/icons/`);
  /* The wiki's art is up to 976 px across (Clawline) and the page shows it at 96 or less: each
     one is fitted into 256 px, the shape kept, and saved as WebP at quality 90 (transparency
     kept; every current browser reads it, over file:// too), with Pillow (as npm run palette
     uses it). The 100 files: 3.4 MB as downloaded, 2 MB as 256 px PNG, 0.85 MB as WebP. */
  const { execFileSync } = require('child_process');
  execFileSync('python3', ['-c', `
import glob, os
from PIL import Image
for f in glob.glob(${JSON.stringify(OUT + '/*/*.png')}):
    im = Image.open(f)
    if max(im.size) > 256:
        im.thumbnail((256, 256), Image.LANCZOS)
    im.save(f[:-4] + '.webp', 'WEBP', quality=90, method=4)
    os.remove(f)
`], { stdio: 'inherit' });
})().catch((e) => { console.error(e.message); process.exit(1); });
