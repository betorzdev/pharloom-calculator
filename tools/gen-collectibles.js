#!/usr/bin/env node
/* tools/gen-collectibles.js — generates js/collectibles.js: where each thing lives in the save.
     node tools/gen-collectibles.js     (npm run data runs it with the other generators)
   Offline: it reads kb/data/completionist/ (npm run collectibles) and the site's own js/data.js
   and js/journal.js, and joins them by the game's English name, which both carry.

   What it writes, all facts about the save (the completionist's prose isn't taken):
     TOOLS      the site's Tool id → the names the save gives it in playerData.Tools (Threefold
                Pin is "Tri Pin"; Silkshot has three, one per maker)
     COUNTED    the 51 Tools that count for the 100%, as groups of site ids: a Tool and its
                upgrade (Curveclaw and Curvesickle) are one point
     CRESTS     the site's Crest id → its name in playerData.ToolEquips (the Beast is "Warrior")
     JOURNAL    the site's Journal id → its name in playerData.EnemyJournalKillData
     PIECES     each loose piece with its Act and its check: [kind, act, check], the check being
                ['bool', scene, id] (sceneData.persistentBools), ['flag', name], ['min', name, n],
                ['quest', name] (QuestCompletionData completed), ['any', check…]
   The 100% itself isn't counted from PIECES: the game counts whole masks and spools, and its
   counters (js/completion.js, checked on 92 real saves). The pieces say which one is missing. */
'use strict';
const fs = require('fs');
const path = require('path');
const { write } = require('./emit.js');
require('../js/data.js');
require('../js/journal.js');
const D = globalThis.SS.data;
const J = globalThis.SS.journal;

const SRC = path.join(__dirname, '..', 'kb', 'data', 'completionist');
const OUT = path.join(__dirname, '..', 'js', 'collectibles.js');
function fail(msg) { throw new Error('gen-collectibles: ' + msg); }

// A category file is one object literal after its type import: read it as such.
function load(file) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
    .replace(/^import .*$/mg, '')
    .replace(/export const \w+: \w+ =/, 'module.exports =');
  const m = { exports: {} };
  new Function('module', src)(m);
  return m.exports.sections.flatMap((s) => s.items);
}

// The completionist's typos in names, against the game's own (its "Wispfire Latern").
const ALIAS = { 'wispfire latern': 'wispfire lantern' };
const norm = (s) => { const n = s.toLowerCase().replace(/[’']/g, "'").trim(); return ALIAS[n] || n; };

/* ── Tools ── */
const toolByName = new Map(D.TOOLS.map((t) => [norm(t.name.en), t.id]));
const TOOLS = {}, COUNTED = [];
for (const it of load('tools.ts')) {
  const names = it.name.split(' / ');
  const ids = names.map((n) => toolByName.get(norm(n)) || fail(`no Tool named ${n}`));
  const save = it.parsingInfo.internalId;
  // Pairs: the save names go with the site ids in order (Curve Claws, Curve Claws Upgraded).
  if (ids.length > 1) {
    if (save.length !== ids.length) fail(`${it.name}: ${ids.length} ids, ${save.length} save names`);
    ids.forEach((id, i) => { TOOLS[id] = [save[i]]; });
  } else TOOLS[ids[0]] = save.slice();
  if (it.completionPercent) COUNTED.push(ids);
}
if (COUNTED.length !== 51) fail(`${COUNTED.length} Tools count for the 100%, not 51`);

/* ── Crests ── */
const crestByName = new Map(D.CRESTS.map((c) => [norm(c.name.en.replace(/ Crest$/, '')), c.id]));
const CRESTS = {};
for (const it of load('crests.ts')) {
  if (it.parsingInfo.type !== 'crest' || /_v\d$/.test(it.parsingInfo.internalId)) continue;
  const id = crestByName.get(norm(it.name.replace(/ Crest$/, ''))) || fail(`no Crest named ${it.name}`);
  CRESTS[id] = it.parsingInfo.internalId;
}
if (Object.keys(CRESTS).length !== 7) fail(`${Object.keys(CRESTS).length} Crests, not 7`);

/* ── The Journal ── */
const bookByName = new Map(J.BOOK.map((e) => [norm(e.name.en), e.id]));
const JOURNAL = {};
for (const it of load('huntersJournal.ts')) {
  const id = bookByName.get(norm(it.name)) || fail(`no Journal entry named ${it.name}`);
  JOURNAL[id] = it.parsingInfo.internalId;
}
const lost = J.BOOK.filter((e) => !JOURNAL[e.id]).map((e) => e.id);
if (lost.length) fail(`Journal entries with no save name: ${lost.join(', ')}`);

/* ── Loose pieces ── */
function check(p) {
  if (Array.isArray(p)) return ['any', ...p.map(check)];
  const id = p.internalId;
  switch (p.type) {
    case 'flag': return ['flag', id];
    case 'flagMin': return ['min', id[0], id[1]];
    case 'quest': return ['quest', id];
    case 'sceneDataBool': return ['bool', id[0], id[1]];
    default: return fail(`check type ${p.type} not read yet`);
  }
}
const KINDS = [
  ['mask-shard', 'maskShards.ts'], ['spool-fragment', 'spoolFragments.ts'],
  ['memory-locket', 'memoryLockets.ts'], ['craftmetal', 'craftmetals.ts'], ['pale-oil', 'paleOil.ts'],
  ['flea', 'fleas.ts'],
];
const PIECES = [];
for (const [kind, file] of KINDS) for (const it of load(file)) PIECES.push([kind, it.whichAct, check(it.parsingInfo)]);
const n = (k) => PIECES.filter((p) => p[0] === k).length;
// The wiki's counts (design/00-study.md §3.5).
for (const [k, want] of [['mask-shard', 20], ['spool-fragment', 18], ['memory-locket', 20], ['craftmetal', 8], ['pale-oil', 3], ['flea', 30]]) {
  if (n(k) !== want) fail(`${n(k)} ${k}, the wiki says ${want}`);
}

const src = fs.readFileSync(path.join(SRC, 'SOURCE'), 'utf8').trim();
const size = write(OUT, `js/collectibles.js — where each thing lives in Silksong's save.
   GENERATED by tools/gen-collectibles.js from kb/data/completionist/ (${src},
   MIT) joined to js/data.js and js/journal.js by the game's English name: not edited by hand.
   Change the generator and run npm run data.

     TOOLS     site Tool id → its names in playerData.Tools.savedData (owned when IsUnlocked)
     COUNTED   the 51 Tools of the 100%, as groups of site ids (a Tool and its upgrade: one point)
     CRESTS    site Crest id → its name in playerData.ToolEquips.savedData (owned when IsUnlocked)
     JOURNAL   site Journal id → its name in playerData.EnemyJournalKillData.list
     PIECES    [kind, act, check]: check is ['bool', scene, id] (sceneData.persistentBools),
               ['flag', name], ['min', name, n], ['quest', name] (QuestCompletionData
               IsCompleted) or ['any', check…]. Act 0 = there from the start.`,
'collectibles', [['TOOLS', TOOLS], ['COUNTED', COUNTED], ['CRESTS', CRESTS], ['JOURNAL', JOURNAL], ['PIECES', PIECES]]);
console.log(`js/collectibles.js  ${Object.keys(TOOLS).length} Tools (${COUNTED.length} counted), ${Object.keys(CRESTS).length} Crests, `
  + `${Object.keys(JOURNAL).length} Journal entries, ${PIECES.length} pieces  (${size} bytes)`);
