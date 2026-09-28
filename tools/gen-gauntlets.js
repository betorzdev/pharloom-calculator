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
   what triggers the next) isn't taken.

   Whether a save has cleared each one (DONE, below) isn't on the wiki: it's the game's. Its arenas
   are BattleScene components in the scenes' bundles (tools/extract-battles.py lists the 59 with
   their waves and what each saves), paired by hand to the wiki's by area and waves, and each
   condition checked on the author's 92 saves (design/00-study.md §9, phase 7). */
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
/* How a save says each gauntlet is cleared, in js/collectibles.js's conditions (js/savefile.js
   reads them): the arena's own flag when it has one, 'bool' (sceneData, the component's object
   name) or 'flag' (playerData, its setPDBoolOnEnd). A few aren't a BattleScene, or save nothing:
   those take what the fight leaves behind, the boss defeated or the reward's pickup. */
const DONE = {
  groal: ['flag', 'DefeatedSwampShaman'],
  'bone-bottom': ['bool', 'Chapel_Wanderer', 'Battle Scene'],
  'choral-chambers': ['flag', 'song_04_battleCompleted'],
  'cogwork-core-1': ['bool', 'Cog_05', 'Battle Scene'],
  'cogwork-core-2': ['flag', 'completedCog10_abyssBattle'],
  'cogwork-core-3': ['bool', 'Cog_07', 'Battle Scene'],
  'deep-docks-1': ['bool', 'Room_Forge', 'Battle Scene'],
  'deep-docks-2': ['bool', 'Dock_08', 'Battle Scene'],
  'deep-docks-3': ['bool', 'Dock_03c', 'Battle Scene'],
  'far-fields-1': ['flag', 'completedLavaChallenge'],   // Bone_East_LavaChallenge's arena saves nothing
  karmelita: ['flag', 'defeatedAntQueen'],              // her gauntlet is a memory (Memory_Ant_Queen)
  'far-fields-2': ['bool', 'Bone_East_25', 'Battle Scene'],
  'greymoor-1': ['flag', 'greymoor_04_battleCompleted'],
  'greymoor-2': ['bool', 'Greymoor_04', 'Black Thread Battle Scene'],
  'greymoor-3': ['bool', 'Room_CrowCourt', 'Battle Scene'],
  crawfather: ['flag', 'defeatedCrowCourt'],
  // Ant_08's arena saves nothing; picking the Vintage Nectar up starts it (checked with GourmandGivenNectar).
  'greymoor-4': ['bool', 'Ant_08', 'Collectable Item Pickup'],
  'greymoor-5': ['bool', 'Greymoor_20c', 'Battle Scene'],
  'high-halls-1': ['flag', 'hang04Battle'],
  'high-halls-2': ['bool', 'Hang_04', 'Battle Scene Act3'],
  'hunters-march-1': ['bool', 'Ant_02', 'Battle Scene'],
  'hunters-march-2': ['flag', 'ant04_battleCompleted'],
  'hunters-march-3': ['bool', 'Ant_05b', 'Battle Scene'],
  'hunters-march-4': ['flag', 'ant21_InitBattleCompleted'],
  'hunters-march-5': ['bool', 'Ant_21', 'Battle Scene Extra'],
  'hunters-march-6': ['bool', 'Ant_04_mid', 'Battle Scene Black Thread'],
  'the-marrow-1': ['bool', 'Bone_01', 'Battle Scene'],
  'the-marrow-2': ['bool', 'Bone_18', 'Battle Scene'],   // its Act 3 arena saves under the same name
  memorium: ['bool', 'Arborium_07', 'Battle Scene'],
  // The Coral Tower is a memory (Memory_Coral_Tower) whose four floors save nothing: Khann ends it.
  'coral-tower-1': ['flag', 'defeatedCoralKing'],
  'coral-tower-2': ['flag', 'defeatedCoralKing'],
  'coral-tower-3': ['flag', 'defeatedCoralKing'],
  khann: ['flag', 'defeatedCoralKing'],
  'shellwood-1': ['bool', 'Shellwood_01b', 'Battle Scene'],
  'shellwood-2': ['flag', 'savedPlinney'],
  // Not a BattleScene: the Roachkeeper in Dust_06 drops the Simple Key (none of the 92 saves has it yet).
  'sinners-road-1': ['bool', 'Dust_06', 'Collectable Item SimpleKey'],
  lugoli: ['flag', 'defeatedRoachkeeperChef'],
  'the-slab-1': ['bool', 'Slab_23', 'Battle Scene'],
  /* Slab_16 has two arenas, and both set slab_cloak_battle_completed: its FSM picks one on the
     way in by whether Hornet wears the Cloakless Crest, that is, whether a Wardenfly caught her.
     The Cloaked one's own sceneData flag isn't in any of the 92 saves, so what tells them apart
     is Slab_03's door_slabCaged (set in 3 of the author's 4 games that did it). */
  'the-slab-2': ['all', ['flag', 'slab_cloak_battle_completed'], ['bool', 'Slab_03', 'door_slabCaged']],
  'the-slab-3': ['all', ['flag', 'slab_cloak_battle_completed'], ['not', ['bool', 'Slab_03', 'door_slabCaged']]],
  broodmother: ['flag', 'defeatedBroodMother'],
  'underworks-1': ['flag', 'under07_battleCompleted'],
  'underworks-2': ['bool', 'Under_10', 'Battle Scene'],
  'underworks-3': ['bool', 'Under_18', 'Battle Scene'],
  verdania: ['flag', 'aspid06_battleComplete'],
  'whispering-vaults-1': ['flag', 'completedLibraryEntryBattle'],
  'whispering-vaults-2': ['flag', 'completedLibraryAcolyteBattle'],
  'whiteward-1': ['quest', 'Save Sherma'],   // Ward_09's arena saves nothing; it's Sherma's wish
  unravelled: ['flag', 'wardBossDefeated'],
};
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
      reward: reward || undefined, waves, done: DONE[W.slug(sub)] || fail(`${sub}: no condition in DONE`),
    });
  }
  if (out.length !== 49) fail(`${out.length} gauntlets, the wiki says 49`);
  for (const id of Object.keys(DONE)) if (!out.some((g) => g.id === id)) fail(`DONE has "${id}", the wiki doesn't`);
  const size = write(OUT, `js/gauntlets.js — the enemy gauntlets: an arena's waves, each an enemy and how many.
   GENERATED by tools/gen-gauntlets.js from kb/data/raw/ (hollowknight.wiki's "Enemy Gauntlets
   (Silksong)" and its subpages) and the game's text: not edited by hand. Change the generator and
   run npm run data.

     id        the wiki's subpage, as a slug          area    js/collectibles.js's AREAS id
     place     the game's name for where it is, when the wiki names one
     reward    the game's name for what it gives, when it gives something
     waves     [[enemy id (js/enemies.js FOES), how many], …] per wave, in order
     done      how a save says it's cleared, as js/collectibles.js's conditions (js/savefile.js)`,
  'gauntlets', [['GAUNTLETS', out]]);
  const foes = out.reduce((a, g) => a + g.waves.reduce((b, w) => b + w.reduce((c, x) => c + x[1], 0), 0), 0);
  console.log(`js/gauntlets.js: ${out.length} gauntlets, ${out.reduce((a, g) => a + g.waves.length, 0)} waves, ${foes} enemies (${size} bytes)`);
})().catch((e) => { console.error(e.message); process.exit(1); });
