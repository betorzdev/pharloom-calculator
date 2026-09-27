#!/usr/bin/env node
/* tools/gen-gauntlets.js — generates js/gauntlets.js: the 49 enemy gauntlets, each with its area,
   its place, its reward and its waves.
     node tools/gen-gauntlets.js       (npm run data runs it with the other generators)
   Offline: it reads kb/data/raw/ (npm run kb) and the game's text dump.

   Where each thing comes from: the wiki's "Enemy Gauntlets (Silksong)" page lists them in order,
   under each area's heading (== [[Bilewater]] ==) and, for some, a place's (=== [[Bilehaven]]
   ===), each transcluded from a subpage; the subpage's table has the reward and one row per wave,
   its enemies as links (with "x2" when there are several). The enemies are joined to
   js/enemies.js by the game's Journal name; the names of places and rewards are the game's
   (tools/names.js), and the area's is js/collectibles.js's. The prose (where each one spawns,
   what triggers the next) isn't taken. */
'use strict';
const path = require('path');
const W = require('./wiki.js');
const { names } = require('./names.js');
const { write } = require('./emit.js');
require('../js/enemies.js');
require('../js/collectibles.js');
const EN = globalThis.SS.enemies;
const CO = globalThis.SS.collectibles;

const OUT = path.join(__dirname, '..', 'js', 'gauntlets.js');
const INDEX = 'Enemy Gauntlets (Silksong)';
function fail(msg) { throw new Error('gen-gauntlets: ' + msg); }
const norm = (x) => String(x).toLowerCase().replace(/[’']/g, "'").replace(/ \(silksong\)$/, '').trim();

(async () => {
  const N = await names();
  // An enemy by the name its link carries: the plain row (no circumstance), else the first.
  const foeByName = new Map();
  for (const f of EN.FOES) {
    const k = norm(f.name.en);
    if (!foeByName.has(k) || (foeByName.get(k).variant && !f.variant)) foeByName.set(k, f);
  }
  const areaByEn = new Map(Object.entries(CO.AREAS).map(([id, a]) => [norm(a.en), id]));
  areaByEn.set('verdania', 'GROVE');   // the map calls it Lost Verdania
  require('../js/data.js');
  const D = globalThis.SS.data;
  const { EN: TEN, ES: TES } = N;
  /* A reward's name, the game's: a Crest by js/data.js ("Wanderer Crest" is «Errante»), a flea as
     the game names a Lost Flea, else the game's name for it, but never a title glued from two
     halves the Spanish lacks («Forge Hija»): then the whole title under another key, or English. */
  function rewardName(en) {
    const c = D.CRESTS.find((x) => norm(x.name.en + ' Crest') === norm(en));
    if (c) return c.name;
    if (/^fleas?$/i.test(en)) return N.text('KEY_FLEA');
    const g = N.gameName(en);
    if (!g || !g.key.includes('+')) return g;
    const whole = Object.keys(TEN).find((k) => !k.includes('+') && norm(TEN[k]) === norm(en) && TES[k] != null);
    return whole ? N.text(whole) : { es: en, en };
  }

  let area = null, place = null;
  const out = [];
  for (const line of W.page(INDEX).split('\n')) {
    const h2 = /^==\s*\[\[([^\]|]+)/.exec(line), h3 = /^===\s*\[\[([^\]|]+)/.exec(line);
    if (h3) { place = h3[1]; continue; }
    if (h2) { area = h2[1]; place = null; continue; }
    const inc = /^\{\{:Enemy Gauntlets \(Silksong\)\/([^}]+)\}\}/.exec(line);
    if (!inc) continue;
    const sub = inc[1];
    const text = W.page(`${INDEX}/${sub}`);
    const rows = text.split(/\n\|-\s*\n/);
    // The reward: the row after the "! Reward" header, its first cell.
    const ri = rows.findIndex((r) => /^!\s*Reward/m.test(r));
    const rewardCell = ri >= 0 ? rows[ri + 1].split('\n').find((l) => l.startsWith('|')) : '';
    const rewardText = W.plain((rewardCell || '').replace(/^\|\s*/, '').replace(/<\/?center>/g, '')).trim();
    const rewardLink = /\[\[([^\]|]+)/.exec(rewardCell || '');
    /* What it gives, when it's a thing the game names (an item, a Tool, a Crest, an area); a
       sentence ("Access to the east half of Hunter's March") is the wiki's prose: none. */
    const reward = !rewardText || /^nothing$/i.test(rewardText) ? null
      : (rewardLink && rewardName(rewardLink[1].replace(/ \(Silksong\)$/, ''))) || rewardName(rewardText) || null;
    // The waves: every row after the reward's with enemies linked in it.
    const waves = [];
    for (const r of rows.slice(ri + 2)) {
      const foes = [...r.matchAll(/link=([^\]|]+)\]\]\s*(?:\[\[[^\]]+\]\]|[^,<\n]*?)(?:\s*x(\d+))?[,<\n]/g)];
      if (!foes.length) continue;
      const wave = [];
      for (const m of foes) {
        const f = foeByName.get(norm(m[1]));
        if (!f) fail(`${sub}: no enemy named "${m[1]}" in js/enemies.js`);
        const n = Number(m[2]) || 1;
        const same = wave.find((x) => x[0] === f.id);
        if (same) same[1] += n; else wave.push([f.id, n]);
      }
      waves.push(wave);
    }
    if (!waves.length) fail(`${sub}: no waves`);
    const areaId = areaByEn.get(norm(area));
    out.push({
      id: W.slug(sub), area: areaId || undefined,
      place: place ? (N.gameName(place) || { es: place, en: place }) : undefined,
      reward: reward || undefined, waves,
    });
  }
  if (out.length !== 49) fail(`${out.length} gauntlets, the wiki says 49`);
  const size = write(OUT, `js/gauntlets.js — the enemy gauntlets: an arena's waves, each an enemy and how many.
   GENERATED by tools/gen-gauntlets.js from kb/data/raw/ (hollowknight.wiki's "Enemy Gauntlets
   (Silksong)" and its subpages) and the game's text: not edited by hand. Change the generator and
   run npm run data.

     id        the wiki's subpage, as a slug          area    js/collectibles.js's AREAS id
     place     the game's name for where it is, when the wiki names one
     reward    the game's name for what it gives, when it gives something
     waves     [[enemy id (js/enemies.js FOES), how many], …] per wave, in order`,
  'gauntlets', [['GAUNTLETS', out]]);
  const foes = out.reduce((a, g) => a + g.waves.reduce((b, w) => b + w.reduce((c, x) => c + x[1], 0), 0), 0);
  console.log(`js/gauntlets.js: ${out.length} gauntlets, ${out.reduce((a, g) => a + g.waves.length, 0)} waves, ${foes} enemies (${size} bytes)`);
})().catch((e) => { console.error(e.message); process.exit(1); });
