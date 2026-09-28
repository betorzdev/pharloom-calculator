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
     PIECES     each loose piece with its Act, its check and its area: [kind, act, check, area], the
                check being ['bool', scene, id] (sceneData.persistentBools), ['flag', name],
                ['min', name, n], ['quest', name] (QuestCompletionData completed), ['any', check…]
     AREAS      the game's areas by their own ids (playerData.currentArea: CRADLE, HUNTERS_MARCH…)
                with the game's name: the id's text, or its title split in <X>_SUPER + <X>_MAIN
                ("Hunter's" + "March"). A piece's area is the one its entry is filed under in the
                completionist ("Wormways (Bottom-right): …"), joined by that name: only the area is
                taken, not the sentence.
   The 100% itself isn't counted from PIECES: the game counts whole masks and spools, and its
   counters (js/completion.js, checked on 92 real saves). The pieces say which one is missing. */
'use strict';
const fs = require('fs');
const path = require('path');
const { write } = require('./emit.js');
require('../js/data.js');
require('../js/journal.js');
const { names } = require('./names.js');
const { load: loadText } = require('./game-text.js');
const D = globalThis.SS.data;
const J = globalThis.SS.journal;

const C = require('./completionist.js');
const SRC = C.SRC;
const OUT = path.join(__dirname, '..', 'js', 'collectibles.js');
function fail(msg) { throw new Error('gen-collectibles: ' + msg); }
const { sections, load } = C;

// The completionist's typos in names, against the game's own (its "Wispfire Latern").
const ALIAS = { 'wispfire latern': 'wispfire lantern' };
const norm = (s) => { const n = s.toLowerCase().replace(/[’']/g, "'").trim(); return ALIAS[n] || n; };

(async () => {
const N = await names();
const { EN } = await loadText();
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

/* ── Areas ── */
// The ids the save uses (currentArea), and every title the game splits for an area card.
const ZONES = new Set(['ABYSS', 'BELLHART', 'BONEBOTTOM', 'COGWORK_CORE', 'CORAL_TOWER', 'CRADLE', 'CRAWL', 'DOCKS',
  'GRANDGATE', 'GREYMOOR', 'GROVE', 'HALLS', 'HANG', 'HUNTERS_MARCH', 'LIBRARY', 'MEMORY_RED', 'MISTMAZE', 'MOSSCAVE',
  'MOSSTOWN', 'MOUNTAIN', 'SHELLWOOD', 'SLAB', 'UNDERSTORE', 'WILDS']);
for (const k of Object.keys(EN)) { const m = /^([A-Z][A-Z_]*)_MAIN$/.exec(k); if (m) ZONES.add(m[1]); }
/* An area's name, the game's own: the id's text; or else, for a title the map card splits in
   <X>_SUPER + <X>_MAIN, the whole title under another key that says the same in English (the
   Spanish dump lacks many _SUPER halves, and the halves go the other way round in Spanish:
   "Blasted" + "Steps" is «Escalones Ajados», JUDGE_STEPS); plain keys before the ones of a
   station, a courier or a quest. Only if the game has none, the title's own halves, each
   language's (tools/names.js text(): Lost Verdania is GROVE_SUPER + GROVE_MAIN in English and
   GROVE_MAIN + GROVE_SUB in Spanish, «Verdania Perdida»). */
const { ES } = N;
const PREFIXED = /^(STATION_NAME_|QUEST_|THUNTER_|SQ_|MQ_|TUBE_NAME_)/;
function zoneText(z) {
  if (EN[z] != null && !/\n/.test(EN[z])) return N.text(z);
  if (EN[z + '_MAIN'] == null) return null;
  if (EN[z + '_SUPER'] == null) return N.text(z + '_MAIN');
  const whole = norm(EN[z + '_SUPER'] + ' ' + EN[z + '_MAIN']);
  const same = Object.keys(EN).filter((k) => norm(EN[k]) === whole && ES[k] != null)
    .sort((a, b) => PREFIXED.test(a) - PREFIXED.test(b) || a.localeCompare(b));
  if (same.length) return N.text(same[0]);
  const sub = EN[z + '_SUB'] != null || ES[z + '_SUB'] != null;
  return N.text(z + '_SUPER+' + z + '_MAIN' + (sub ? '+' + z + '_SUB' : ''));
}
const zoneByEn = new Map();
for (const z of [...ZONES].sort()) {
  const x = zoneText(z);
  if (!x) continue;
  const en = norm(x.en);
  // The save's own ids first: CRADLE before a map card that says the same.
  if (!zoneByEn.has(en) || ['ABYSS', 'BELLHART', 'BONEBOTTOM', 'CRADLE', 'CRAWL', 'DOCKS', 'GRANDGATE', 'GREYMOOR', 'HANG',
    'HUNTERS_MARCH', 'LIBRARY', 'MOSSCAVE', 'MOSSTOWN', 'MOUNTAIN', 'SHELLWOOD', 'SLAB', 'UNDERSTORE', 'WILDS'].includes(z)) zoneByEn.set(en, z);
}
// The completionist's spellings that aren't the game's.
const AREA_ALIAS = { 'weavnest atla': 'weavenest atla' };
const AREAS = {};
/* strict: a piece's heading must be an area (the generator stops otherwise); a wish's may name a
   place that isn't one ("Grand Bellway"), and then it has no area. */
function areaOf(details, strict = true) {
  const head = /^([^:]{2,60}):/.exec(details || '');
  if (!head) return null;
  let en = norm(head[1].split(' (')[0].split(' / ')[0]);
  en = AREA_ALIAS[en] || en;
  const z = zoneByEn.get(en);
  if (!z && !strict) return null;
  if (!z) fail(`no area of the game named "${head[1]}"`);
  AREAS[z] = zoneText(z);
  return z;
}

/* ── Loose pieces ── */
const check = (p) => C.check(p, fail);
const KINDS = [
  ['mask-shard', 'maskShards.ts'], ['spool-fragment', 'spoolFragments.ts'],
  ['memory-locket', 'memoryLockets.ts'], ['craftmetal', 'craftmetals.ts'], ['pale-oil', 'paleOil.ts'],
  ['flea', 'fleas.ts'],
];
const PIECES = [];
for (const [kind, file] of KINDS) for (const it of load(file)) PIECES.push([kind, it.whichAct, check(it.parsingInfo), areaOf(it.completionDetails)]);
// The upgrades one by one, and the Silk Hearts: their sections of the dictionary.
const SECTION_KINDS = [['upgrades.ts', 'Needle Upgrades', 'needle'], ['upgrades.ts', 'Tool Pouch Upgrades', 'tool-pouch'],
  ['upgrades.ts', 'Crafting Kit Upgrades', 'crafting-kit'], ['abilities.ts', 'Silk Hearts', 'silk-heart']];
for (const [file, name, kind] of SECTION_KINDS) {
  const sec = sections(file).find((x) => x.name === name) || fail(`no section ${name} in ${file}`);
  for (const it of sec.items) PIECES.push([kind, it.whichAct, check(it.parsingInfo), areaOf(it.completionDetails)]);
}

/* The pieces the completionist doesn't list and the save keeps as flags, each with its own name:
   the four Old Hearts that open the Red Memory (the Everbloom) and the three melodies that open
   the Cradle. Their flags and Acts were found on the author's restore points (GAINED_HEART_*,
   GAINED_MELODY_*: the flag that turned true, in the Act the event happened); no area: nothing
   says where, and the flag isn't a place. */
for (const [flag, key, kind, act] of [
  ['CollectedHeartFlower', 'INV_NAME_HEART_BLOOM', 'old-heart', 3], ['CollectedHeartCoral', 'INV_NAME_HEART_CORAL', 'old-heart', 3],
  ['CollectedHeartHunter', 'INV_NAME_HEART_HUNTER', 'old-heart', 3], ['CollectedHeartClover', 'INV_NAME_HEART_CLOVER', 'old-heart', 3],
  ['HasMelodyArchitect', 'SQ_MELODY_ARCHITECT_NAME', 'melody', 2], ['HasMelodyLibrarian', 'SQ_MELODY_LIBRARIAN_NAME', 'melody', 2],
  ['HasMelodyConductor', 'SQ_MELODY_CONDUCTOR_NAME', 'melody', 2],
]) {
  // Their description, the game's: the heart's inventory text, or the melody's wish ("Search the…").
  const desc = N.text(key.startsWith('INV_NAME_') ? key.replace('INV_NAME_', 'INV_DESC_') : key.replace(/_NAME$/, '_DESC'));
  PIECES.push([kind, act, ['flag', flag], null, N.text(key), desc]);
}

/* ── The Wishes (the pane «Tareas»): the main objectives and the wishes by type, as the
   completionist lists them, each with the game's own name. The name is looked up by its English
   among the game's quest titles (QUEST_<X>_TITLE, MQ_<X>_NAME, SQ_<X>_NAME…); a type's among its
   TYPE_<X>_TITLE. "Broodfeast / Runtfeast (ACT 3)" is one wish with two names: the first. ── */
const QUEST_KEY = /^(QUEST_.*_TITLE|MQ_.*_NAME(_\w+)?|SQ_.*_NAME)$/;
const questByEn = new Map();
// Compared without commas: the completionist's "Pain, Anguish, and Misery" is the game's "Pain, Anguish and Misery".
const qnorm = (x) => norm(x).replace(/,/g, '');
for (const k of Object.keys(EN).sort()) if (QUEST_KEY.test(k)) { const n = qnorm(EN[k]); if (!questByEn.has(n)) questByEn.set(n, k); }
const WISH_TYPE_KEY = { 'Main Objectives': null, Wayfarer: 'TYPE_WAYFARER_1_TITLE', Gather: 'TYPE_GATHER_1_TITLE', Donate: 'TYPE_DONATE_1_TITLE',
  Hunt: 'TYPE_HUNT_1_TITLE', 'Grand Hunt': 'TYPE_HUNT_2_TITLE', Delivery: 'TYPE_COURIER_TITLE', Learn: 'TYPE_JOURNAL_TITLE',
  Collect: null, Sprint: 'TYPE_SPRINT_TITLE', Witness: 'TYPE_HERALD_TITLE', Steel: 'TYPE_STEELSENTINEL_TITLE' };
const WISH_TYPES = [], WISHES = [];
for (const sec of sections('tasks.ts')) {
  const type = sec.name.replace(/^Wishes · /, '');
  if (!(type in WISH_TYPE_KEY)) fail(`a wish type the generator doesn't know: ${type}`);
  const id = type.toLowerCase().replace(/[^a-z]+/g, '-');
  WISH_TYPES.push({ id, name: WISH_TYPE_KEY[type] ? N.text(WISH_TYPE_KEY[type]) : undefined });
  for (const it of sec.items) {
    const en = it.name.split(' / ')[0].replace(/\s*\(ACT \d\)$/i, '');
    const key = questByEn.get(qnorm(en));
    // With no quest title of the game's (a few main objectives), the game's own name elsewhere.
    const name = key ? N.text(key) : N.gameName(en) || { es: en, en, key: undefined };
    const mode = it.onlyFoundInSteelSoulMode ? 'steel' : it.onlyFoundInClassicMode ? 'classic' : undefined;
    WISHES.push([id, it.whichAct, check(it.parsingInfo), areaOf(it.completionDetails, false), name, mode]);
  }
}
const unnamed = WISHES.filter((w) => !w[4].key).map((w) => w[4].en);

/* ── Where the rest of the 100% is: Tools, Crests, Silk Skills, abilities, the Everbloom ──
   site id → [act, area], by the game's English name ("Swift Step (Dash / Sprint)" is Swift
   Step; "Curveclaw / Curvesickle" both). */
const bare = (x) => norm(x.replace(/\s*\(.*\)$/, '').replace(/ Crest$/, ''));
const WHERE = { tools: {}, crests: {}, skills: {}, arts: {} };
for (const it of load('tools.ts')) for (const n of it.name.split(' / ')) WHERE.tools[toolByName.get(norm(n))] = [it.whichAct, areaOf(it.completionDetails)];
const byName = (list) => new Map(list.map((x) => [bare(x.name.en), x.id]));
const skillBy = byName(D.SKILLS), artBy = byName(D.ARTS);
for (const it of load('crests.ts')) { const id = crestByName.get(bare(it.name)); if (id && it.completionPercent) WHERE.crests[id] = [it.whichAct, areaOf(it.completionDetails)]; }
for (const it of load('abilities.ts')) {
  const k = bare(it.name);
  if (skillBy.has(k)) WHERE.skills[skillBy.get(k)] = [it.whichAct, areaOf(it.completionDetails)];
  else if (artBy.has(k)) WHERE.arts[artBy.get(k)] = [it.whichAct, areaOf(it.completionDetails)];
  else if (k === 'everbloom') WHERE.everbloom = [it.whichAct, areaOf(it.completionDetails)];
}
for (const [k, want] of [['tools', Object.keys(TOOLS).length], ['crests', 6], ['skills', 6], ['arts', 9]]) {
  const got = Object.keys(WHERE[k]).length;
  if (got < want) fail(`WHERE.${k}: ${got} of ${want} (${(k === 'tools' ? Object.keys(TOOLS) : []).filter((id) => !WHERE.tools[id]).join(', ')})`);
}
const n = (k) => PIECES.filter((p) => p[0] === k).length;
// The wiki's counts (design/00-study.md §3.5).
for (const [k, want] of [['mask-shard', 20], ['spool-fragment', 18], ['memory-locket', 20], ['craftmetal', 8], ['pale-oil', 3], ['flea', 30],
  ['needle', 4], ['tool-pouch', 4], ['crafting-kit', 4], ['silk-heart', 3]]) {
  if (n(k) !== want) fail(`${n(k)} ${k}, the wiki says ${want}`);
}

for (const z of ['ABYSS', 'BELLHART', 'BONEBOTTOM', 'COGWORK_CORE', 'CORAL_TOWER', 'CRADLE', 'CRAWL', 'DOCKS', 'GRANDGATE',
  'GREYMOOR', 'GROVE', 'HALLS', 'HANG', 'HUNTERS_MARCH', 'LIBRARY', 'MEMORY_RED', 'MISTMAZE', 'MOSSCAVE', 'MOSSTOWN',
  'MOUNTAIN', 'SHELLWOOD', 'SLAB', 'UNDERSTORE', 'WILDS']) if (!AREAS[z]) AREAS[z] = zoneText(z) || fail(`no name for the area ${z}`);

const src = fs.readFileSync(path.join(SRC, 'SOURCE'), 'utf8').trim();
const size = write(OUT, `js/collectibles.js — where each thing lives in Silksong's save.
   GENERATED by tools/gen-collectibles.js from kb/data/completionist/ (${src},
   MIT) joined to js/data.js and js/journal.js by the game's English name: not edited by hand.
   Change the generator and run npm run data.

     TOOLS     site Tool id → its names in playerData.Tools.savedData (owned when IsUnlocked)
     COUNTED   the 51 Tools of the 100%, as groups of site ids (a Tool and its upgrade: one point)
     CRESTS    site Crest id → its name in playerData.ToolEquips.savedData (owned when IsUnlocked)
     JOURNAL   site Journal id → its name in playerData.EnemyJournalKillData.list
     AREAS     the game's area ids (playerData.currentArea) → the game's name for them
     WHERE     { tools, crests, skills, arts: { site id: [act, area] }, everbloom: [act, area] }
     WISH_TYPES the pane «Tareas»'s groups: { id, name } (the main objectives, then each wish type)
     WISHES    [type id, act, check, area, name, mode?]: check as a piece's (a quest, a flag, or
               ['journal', entry] listed in the Journal); mode 'steel' or 'classic' when only one has it
     PIECES    [kind, act, check, area, name?, desc?]: a piece's own name and text (an Old Heart,
               a melody); area
               an AREAS id (or null); check is ['bool', scene, id] (sceneData.persistentBools),
               ['flag', name], ['min', name, n], ['quest', name] (QuestCompletionData
               IsCompleted), ['visited', scene] (playerData.scenesVisited) or ['any', check…].
               Act 0 = there from the start.`,
'collectibles', [['TOOLS', TOOLS], ['COUNTED', COUNTED], ['CRESTS', CRESTS], ['JOURNAL', JOURNAL], ['AREAS', AREAS], ['WHERE', WHERE], ['PIECES', PIECES], ['WISH_TYPES', WISH_TYPES], ['WISHES', WISHES]]);
console.log(`js/collectibles.js  ${Object.keys(TOOLS).length} Tools (${COUNTED.length} counted), ${Object.keys(CRESTS).length} Crests, `
  + `${Object.keys(JOURNAL).length} Journal entries, ${Object.keys(AREAS).length} areas, ${PIECES.length} pieces, ${WISHES.length} wishes`
  + ` (${unnamed.length} with no game name: ${unnamed.join(', ') || 'none'})  (${size} bytes)`);
})().catch((e) => { console.error(e.message); process.exit(1); });
