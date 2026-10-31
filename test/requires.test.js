/* test/requires.test.js: what each Map mark still asks (js/requires.js, tools/gen-requires.js): every
   requirement points at a real mark and a real check and carries the game's name; an area's
   requirement isn't repeated on its marks; the Witch Crest's chain is as the game and the wiki give
   it; and the save keeps the checks met (js/savefile.js needs). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const RQ = require('../js/requires.js');
const F = require('../js/savefile.js');
const { markKeys } = require('../tools/mark-keys.js');

const MARKS = markKeys();
const lists = () => [...Object.entries(RQ.AREAS).map(([k, l]) => ['AREAS.' + k, l]), ...Object.entries(RQ.MARKS).map(([k, l]) => ['MARKS.' + k, l]),
  ...Object.entries(RQ.WISHES).map(([k, l]) => ['WISHES.' + k, l])];
const FORMS = new Set(['flag', 'min', 'is', 'quest', 'accepted', 'bool', 'visited', 'journal', 'kills', 'relic', 'memento', 'held', 'crest', 'tool', 'steel', 'int', 'geo', 'any', 'all', 'not', 'count']);

test('every requirement points at a Map mark, a check and the game\'s name', () => {
  const KINDS = new Set(['wish', 'item', 'key', 'ability', 'boss', 'event', 'act']);
  for (const [where, list] of lists()) {
    assert.ok(Array.isArray(list) && list.length, `${where} is empty`);
    for (const r of list) {
      assert.ok(KINDS.has(r.kind), `${where}: kind ${r.kind}`);
      assert.ok(r.name && typeof r.name.es === 'string' && r.name.es && typeof r.name.en === 'string' && r.name.en && typeof r.name.key === 'string' && r.name.key,
        `${where}: ${JSON.stringify(r.name)} has no es, en and key`);
      for (const k of r.to === null ? [] : r.to.split(',')) assert.ok(MARKS.has(k), `${where}: ${r.name.en} points to ${k}, which isn't a Map mark`);
      assert.ok(r.check === null || (Number.isInteger(r.check) && r.check >= 0 && r.check < RQ.CHECKS.length), `${where}: ${r.name.en}'s check ${r.check}`);
      assert.ok(r.alt === null || r.alt === 'a' || r.alt === 'b', `${where}: alt ${r.alt}`);
      assert.ok(r.n === undefined || (Number.isInteger(r.n) && r.n > 1), `${where}: n ${r.n}`);
    }
    // An alternative has its other side.
    for (const a of ['a', 'b']) if (list.some((r) => r.alt === a)) assert.ok(list.some((r) => r.alt === (a === 'a' ? 'b' : 'a')), `${where}: an '${a}' with no other side`);
  }
  for (const key of Object.keys(RQ.MARKS)) assert.ok(MARKS.has(key), `MARKS.${key} isn't a Map mark`);
});

test('every check is one js/savefile.js reads, and each is used', () => {
  const walk = (c) => { assert.ok(Array.isArray(c) && FORMS.has(c[0]), `the check ${JSON.stringify(c)}`); if (['any', 'all'].includes(c[0])) c.slice(1).forEach(walk); if (c[0] === 'not') walk(c[1]); if (c[0] === 'count') { assert.ok(Number.isInteger(c[1])); c.slice(2).forEach(walk); } };
  RQ.CHECKS.forEach(walk);
  const used = new Set(lists().flatMap(([, l]) => l.map((r) => r.check)));
  RQ.CHECKS.forEach((c, i) => assert.ok(used.has(i), `CHECKS[${i}] is never used`));
  assert.strictEqual(new Set(RQ.CHECKS.map((c) => JSON.stringify(c))).size, RQ.CHECKS.length, 'a check twice');
});

test('an area\'s requirement isn\'t repeated on its marks, nor a mark\'s on itself', () => {
  const id = (r) => [r.kind, r.check, r.to, r.n].join('|');
  for (const [key, list] of Object.entries(RQ.MARKS)) {
    const m = MARKS.get(key), area = m && m.scene ? R.areaOf(m.scene) : null;
    const of = new Set((RQ.AREAS[area] || []).map(id));
    for (const r of list) {
      assert.ok(!of.has(id(r)), `MARKS.${key} repeats its area's (${area}) ${r.name.en}`);
      assert.ok(!(r.to || '').split(',').includes(key), `MARKS.${key} asks for itself`);
    }
    assert.strictEqual(new Set(list.map((r) => id(r) + r.alt)).size, list.length, `MARKS.${key} has one twice`);
  }
});

test('the Witch Crest: Infestation Operation at Yarnaby, after Rite of Rebirth (the Twisted Bud, Widow, Rite of the Pollip)', () => {
  const has = (list, kind, check) => (list || []).find((r) => r.kind === kind && JSON.stringify(RQ.CHECKS[r.check]) === JSON.stringify(check));
  const op = has(RQ.MARKS['crests:witch'], 'wish', ['quest', 'Doctor Curse Cure']);
  assert.ok(op, 'the Witch Crest asks Infestation Operation done');
  assert.strictEqual(op.name.en, 'Infestation Operation');
  assert.strictEqual(op.to, 'giver:belltown_room_doctor', 'taken from Yarnaby, in Bellhart');
  assert.strictEqual(require('../js/spots.js').GIVER.Belltown_Room_doctor[1].en, 'Yarnaby');
  assert.ok(has(RQ.WISHES['Doctor Curse Cure'], 'wish', ['quest', 'Wood Witch Curse']), 'Infestation Operation waits for Rite of Rebirth');
  const rite = RQ.WISHES['Wood Witch Curse'];
  const bud = (rite || []).find((r) => r.kind === 'item' && r.name.en === 'Twisted Bud');
  assert.ok(bud && bud.to === 'task:40' && JSON.stringify(RQ.CHECKS[bud.check]).includes('"Wood Witch Item"'), 'Rite of Rebirth asks the Twisted Bud, where it lies');
  assert.ok(has(rite, 'boss', ['flag', 'spinnerDefeated']), 'and Widow beaten');
  const pollip = has(rite, 'wish', ['quest', 'Shell Flowers']);
  assert.ok(pollip && pollip.to === 'giver:room_witch', 'and Rite of the Pollip done, at Greyroot');
  // Greyroot's card is her two wishes' (WISHES), not hers: Rite of the Pollip asks nothing.
  assert.ok(!RQ.MARKS['giver:room_witch'], 'Greyroot herself asks nothing');
  assert.ok(!RQ.WISHES['Shell Flowers'], 'Rite of the Pollip asks nothing');
});

test('the save keeps the checks met (needs), and a slot kept before shows them all', () => {
  const at = (c) => RQ.CHECKS.findIndex((x) => JSON.stringify(x) === JSON.stringify(c));
  const widow = at(['flag', 'spinnerDefeated']), clawline = at(['flag', 'hasHarpoonDash']);
  assert.ok(widow >= 0 && clawline >= 0);
  const g = F.game({ silk: 0, spinnerDefeated: true });
  assert.strictEqual(g.needsRead, true);
  assert.ok(g.needs.includes(widow) && !g.needs.includes(clawline));
  const back = F.gameOf(F.toSnapshot({ silk: 0, spinnerDefeated: true }));
  assert.strictEqual(back.needsRead, true);
  assert.deepStrictEqual(back.needs, g.needs);
  // A slot from before: no needs, needsRead false.
  const snap = F.toSnapshot({ silk: 0, spinnerDefeated: true });
  const p = JSON.parse(snap['pharloom.progress']);
  delete p.needs; delete p.needsRead;
  const old = F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify(p) });
  assert.strictEqual(old.needsRead, false);
  assert.deepStrictEqual(old.needs, []);
  // A count: at least n of its checks (the Lost Fleas).
  const fleas = RQ.CHECKS.findIndex((c) => c[0] === 'count' && c[1] === 5);
  assert.ok(fleas >= 0);
  const five = Object.fromEntries(RQ.CHECKS[fleas].slice(2, 7).map((c) => [c[1], true]));
  assert.ok(F.game({ silk: 0, ...five }).needs.includes(fleas));
  const four = Object.fromEntries(RQ.CHECKS[fleas].slice(2, 6).map((c) => [c[1], true]));
  assert.ok(!F.game({ silk: 0, ...four }).needs.includes(fleas));
});
