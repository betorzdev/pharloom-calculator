/* test/guide-not-lore.test.js: the Map's cards and Progress's rows say only what helps play
   (design/118-guide-not-lore, all A; Albert, 30-Oct-2026: «lo que busca es una guía, no lore»):
   what it is, where, what to do, the game's prompt when it names the action, what's missing, the
   save's state as a count, a way to the next step; never flavour text (the Wishwalls' pleas, item
   and Journal descriptions, NPC lines) nor a state that doesn't help (whether you've met someone,
   in how many places they turn up). The screens' code is read as text, as test/spots.test.js does:
   the cards are drawn in a browser (checked there with tools/drive.js). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
globalThis.SS = globalThis.SS || {};
const STR = require('../js/i18n.js').UI;
const PE = require('../js/people.js');
const MAP = read('js/app-map.js');
const PG = read('js/app-progress.js');
// cardHtml's body (js/app-map.js): every Map card is drawn there.
const CARD = (() => { const i = MAP.indexOf('function cardHtml(key)'), j = MAP.indexOf('const cardShell', i); assert.ok(i > 0 && j > i); return MAP.slice(i, j); })();
// One branch of it, from its test to the next «} else if (kind».
const branch = (head) => { const i = CARD.indexOf(head); assert.ok(i > 0, head); const j = CARD.indexOf('} else if (kind', i + head.length); return CARD.slice(i, j > 0 ? j : undefined); };

test('no Map card says whether you have met someone, nor in how many places they turn up', () => {
  for (const k of ['mapMet', 'mapNpcSpots', 'mapNpcUnsure']) {
    assert.ok(!(k in STR), `${k} is gone from js/i18n.js`);
    assert.ok(!CARD.includes(`'${k}'`), `cardHtml draws ${k}`);
  }
  // «Not met yet» stays only as the Flea Caravan's pin while Mooshka isn't met: a place shut, not a person's state.
  assert.ok(!CARD.includes("'mapNotMet'"), 'no card says «Not met yet»');
  assert.ok(!/s\.met\b/.test(branch("} else if (kind === 'npc')")), "the npc branch doesn't read the met state");
});

test("the game's own prompt is the only line of the game's on a person's card, and it's quoted", () => {
  for (const p of PE.PEOPLE) for (const [scene, lines] of Object.entries(p.notes || {})) {
    for (const l of lines) assert.match(l.key, /_PROMPT$/, `${p.id} in ${scene}: ${l.key} isn't a prompt`);
  }
  assert.match(branch("} else if (kind === 'npc')"), /t\('mapPrompt', \{ text: pick\(l\) \}\)/);
  assert.strictEqual(STR.mapPrompt.en, '"{text}"');
  assert.strictEqual(STR.mapPrompt.es, '«{text}»');
});

test("a Wishwall's card says each wish's next step from App.wishNext, never what posts it in full", () => {
  assert.ok(!MAP.includes('App.wishPosts'), 'js/app-map.js reads App.wishPosts');
  const board = branch("} else if (kind === 'board' || kind === 'giver')");
  assert.match(board, /steps = wishSteps\(m\.quests\)/);
  const steps = CARD.slice(CARD.indexOf('const wishSteps'), CARD.indexOf('const wavesNote'));
  assert.match(steps, /App\.wishNext\(q, own \|\| null\)/);
  assert.match(steps, /stepLine\(n\.steps\[k\]/);
  // What a wish waits for is the Needs' (design/119), but a Wishwall's step lines say it: its card leaves it out.
  assert.match(MAP, /if \(App\.wishWaits && m\.layer !== 'wishwall'\)/);
});

test('a count reads «what n/m» in the state row, as the Progress meters', () => {
  for (const k of ['mapKills', 'mapEvaHave', 'mapHuntHave']) assert.ok(!(k in STR), `${k} is gone`);
  assert.match(CARD, /const count = \(what, n, of\) => `\$\{what\} \$\{num\(Math\.min\(n, of\)\)\}\/\$\{num\(of\)\}`/);
  assert.match(CARD, /count\(t\('mapDefeated'\), k, e\.kills\)/);
  assert.match(CARD, /count\(t\('mapEvaOpen'\), own\.evaSlots \|\| 0, m\.eva\.slots\)/);
});

test("an area's card leaves out a count of zero", () => {
  const area = CARD.slice(CARD.indexOf("if (key.startsWith('area:'))"), CARD.indexOf('const m = list.find'));
  for (const [n, k] of [['hundred', 'mapAreaHundred'], ['journal', 'mapAreaJournal'], ['gauntlets', 'mapAreaGauntlets']]) {
    assert.ok(area.includes(`${n} ? t('${k}'`), `${k} is drawn only when ${n} isn't 0`);
  }
});

test('a place with nothing left for you says so once, as a state', () => {
  for (const k of ['mapSellsNone', 'mapWishesNone', 'mapShakraAll']) assert.ok(!(k in STR), `${k} is gone`);
  assert.ok(STR.mapNothingLeft);
  assert.match(branch("} else if (kind === 'shop' || kind === 'person' || kind === 'shakra')"), /state\(t\('mapNothingLeft'\)\)/);
  assert.match(branch("} else if (kind === 'board' || kind === 'giver')"), /state\(t\('mapNothingLeft'\)\)/);
});

test("the lines that said nothing are gone: «Had in this room.», Creige's drinks, «Makes a wish» under a giver's name", () => {
  for (const k of ['mapMapFound', 'mapTrade_creige']) assert.ok(!(k in STR), `${k} is gone`);
  assert.ok(!MAP.includes("'mapMapFound'"));
  assert.match(CARD, /kind === 'giver' \|\|[^?]*\? '' : m\.sub/);
  // Outside the 100%, a state as the layer's switch names it, not a sentence.
  assert.ok(!('mapArtOut' in STR));
  for (const k of ['mapToolUpgrade', 'mapToolLent', 'mapToolGivenUp']) assert.ok(!/100/.test(STR[k].en + STR[k].es), `${k} still speaks of the 100%`);
  assert.match(CARD, /if \(m\.out\) card\.states \+= state\(t\('mapToolsOut'\)\)/);
});

test("a boss's card names its wish once, and gives one way to it", () => {
  const boss = branch("} else if (kind === 'boss')");
  // Its wish named in how it's had unless what brings the fight is that wish (OPENS: the Needs' chip says it).
  assert.match(boss, /!\(said && m\.quests\.every\(\(q\) => wishOf\(q\) === wishOf\(said\)\)\) \? wishItems\(m\.quests, true\)/);
  // One way to it (wishTo): the step the save shows (the Sentinel to wake) before where it's taken.
  const to = MAP.slice(MAP.indexOf('function wishTo'), MAP.indexOf('const keyMarks'));
  assert.ok(to.indexOf('PE.STEP') >= 0 && to.indexOf('PE.STEP') < to.indexOf('App.wishFrom'));
});

test('Progress quotes «Tareas» alone: never a Wishwall, a description, the Journal or the Caretaker', () => {
  const says = PG.slice(PG.indexOf('function wishSays'), PG.indexOf('/* Lace atop'));
  assert.ok(!/\.wall\b/.test(says), 'wishSays reads the Wishwall');
  assert.ok(!/says\('(wall|inv|journal|caretaker)'/.test(PG), 'a quote tagged as other than «Tareas»');
  assert.ok(!/ALT_SAYS|journalSays|SNARE_SAYS/.test(PG));
  for (const k of ['roadKeyDesc', 'roadSays_churchkeeper', 'roadSays_hermit', 'roadSays_swamp', 'roadSays_snare']) assert.ok(!(k in STR), `${k} is gone`);
});

test("a wish not posted yet, on the road, leads with its next step from wishNext, as on Tasks", () => {
  const row = PG.slice(PG.indexOf('function wishRow'), PG.indexOf('function groupRows'));
  assert.match(row, /wishNext\(x\.quest, g, App\.game\(\), onMapNow\(\)\)/);
  assert.match(row, /row\.lead = stepHtml\(n\.steps\[n\.next\]/);
  assert.match(PG, /foldHtml\(x\.how, x\.more, x\.says, x\.lead\)/);
});
