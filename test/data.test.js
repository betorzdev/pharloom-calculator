/* test/data.test.js — the generated data (js/data.js, js/enemies.js, js/journal.js): every visible
   text carries both languages with no stray Spanish in the English, and the counts and numbers
   the study relies on (design/00-study.md) hold. They're regenerated with npm run data; a patch
   or Sea of Sorrow that moves a count fails here first. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const D = require('../js/data.js');
const E = require('../js/enemies.js');
const J = require('../js/journal.js');
const CO = require('../js/collectibles.js');

/* Every { es, en } in a module, with where it is. */
function pairs(v, where, out = []) {
  if (!v || typeof v !== 'object') return out;
  if (typeof v.es === 'string' || typeof v.en === 'string') { out.push([where, v]); return out; }
  for (const [k, x] of Object.entries(v)) pairs(x, where + '.' + k, out);
  return out;
}
const SPANISH_CHARS = /[áéíóúñ¿¡]/i;

test('every text in the data has both languages, and the English carries no Spanish letter', () => {
  const all = [...pairs(D, 'data'), ...pairs(E, 'enemies'), ...pairs(J, 'journal'), ...pairs(CO.AREAS, 'areas')];
  assert.ok(all.length > 1000);
  for (const [where, v] of all) {
    assert.equal(typeof v.es, 'string', `${where} has no Spanish`);
    assert.equal(typeof v.en, 'string', `${where} has no English`);
    assert.ok(v.es.trim() && v.en.trim(), `${where} is empty`);
    assert.ok(!SPANISH_CHARS.test(v.en), `${where}: Spanish letter in the English "${v.en}"`);
  }
});

test('the Needle is 5/9/13/17/21, with the game\'s names', () => {
  assert.deepEqual(D.NEEDLES.map((n) => n.damage), [5, 9, 13, 17, 21]);
  assert.equal(D.NEEDLES[4].name.es, 'Aguja de acero pálido');
});

test('the Tools: 20 red, 21 blue and 12 yellow, plus the upgraded twins and the Steel Soul one', () => {
  const base = (c) => D.TOOLS.filter((t) => t.color === c && !t.upgradeOf && !t.steel).length;
  assert.deepEqual([base('red'), base('blue'), base('yellow')], [20, 21, 12]);
  assert.deepEqual(D.TOOLS.filter((t) => t.upgradeOf).map((t) => t.id).sort(), ['claw-mirrors', 'curvesickle', 'druids-eyes']);
  assert.equal(D.TOOLS.find((t) => t.steel).replaces, 'dead-bugs-purse');
  // «Cilicio» is yellow (the Tools page and its infobox), not blue.
  const barbed = D.TOOLS.find((t) => t.id === 'barbed-bracelet');
  assert.equal(barbed.color, 'yellow');
  assert.equal(barbed.name.es, 'Cilicio');
  // Every red Tool has ammo per Tool Pouch level, but the Needle Phial, which has no limit.
  for (const t of D.TOOLS.filter((x) => x.color === 'red')) {
    if (t.id === 'needle-phial') assert.equal(t.ammo, null);
    else assert.equal(t.ammo.length, 5, t.id);
  }
});

test('Tool damage is read into hits that add up to the wiki\'s totals', () => {
  const tool = (id) => D.TOOLS.find((t) => t.id === id);
  const total = (hits) => hits.reduce((a, [d, n]) => a + d * n, 0);
  assert.deepEqual(tool('straight-pin').attacks[0].hits.map(total), [5, 8, 11, 14, 17]);
  assert.deepEqual(tool('threefold-pin').attacks[0].hits[4], [[14, 1], [7, 1], [4, 1]]);
  assert.deepEqual(tool('tacks').attacks[0].hits.map(total), [16, 24, 32, 48, 56]);
  assert.deepEqual(tool('cogwork-wheel').attacks[0].hits[0], [[2, 7]]);
  const spear = tool('voltvessels').attacks.find((a) => a.id === 'spear');
  assert.equal(spear.scale, 'needle');
  assert.deepEqual(spear.hits.map(total), [23, 38, 53, 62, 77]);
  assert.deepEqual(tool('silkshot').attacks.map((a) => a.id).sort(), ['architect', 'forge', 'original']);
  assert.ok(tool('flintslate').attacks[0].bonus && tool('pollip-pouch').attacks[0].bonus);
  const storm = D.SKILLS.find((s) => s.id === 'thread-storm');
  assert.deepEqual(storm.attacks.map((a) => a.hits.map(total)), [[17, 30, 43, 56, 69], [23, 36, 55, 74, 93]]);
});

test('the Crests: seven, with every locked slot opened by the 20 Memory Lockets', () => {
  assert.deepEqual(D.CRESTS.map((c) => c.id), ['hunter', 'reaper', 'wanderer', 'beast', 'witch', 'architect', 'shaman']);
  const locked = D.CRESTS.reduce((a, c) => a + c.slots.red[1] + c.slots.blue[1] + c.slots.yellow[1], 0);
  assert.equal(locked, 20);
  const hunter = D.CRESTS[0];
  assert.deepEqual(hunter.strike.hits[4], [[29, 2]]);   // 29 × 2 at the Pale Steel Needle
  assert.equal(D.CRESTS.find((c) => c.id === 'witch').strike.minHits, 2);
  assert.equal(D.CRESTS.find((c) => c.id === 'wanderer').name.es, 'Errante');
  assert.deepEqual(D.VESTICREST.at, { yellow: 12, blue: 20, hunter3: 27, sylphsong: 32 });
});

test('the modifiers add, and the Wanderer\'s critical multiplies after them', () => {
  const m = (id) => D.MODIFIERS.find((x) => x.id === id);
  assert.equal(m('barbed-bracelet').add, 0.25);
  assert.equal(m('flintslate').add, 0.5);
  assert.equal(m('challenge').firstHit, true);
  assert.equal(m('challenge').name.es, 'Desafiar');
  assert.equal(m('wanderer-critical').mul, 3);
  assert.equal(m('shaman').to, 'skill');
  // The wiki's worked example: 29 × 1 × (1 + 0.3 + 0.2 + 0.25 + 0.5 + 0.5) = 79.75 → 80.
  const sum = 1 + ['hunter-focus-2', 'hunter-focus-3', 'barbed-bracelet', 'flintslate', 'challenge'].reduce((a, id) => a + m(id).add, 0);
  assert.equal(29 * sum, 79.75);
});

test('the enemies: 201 standard rows and 61 boss rows, five modifiers each, joined to the Journal', () => {
  assert.equal(E.FOES.filter((f) => !f.boss).length, 201);
  assert.equal(E.FOES.filter((f) => f.boss).length, 61);
  for (const f of E.FOES) assert.equal(f.mods.length, 5, f.id);
  const alita = E.FOES.find((f) => f.id === 'alita');
  assert.deepEqual(alita.mods, [1.5, 1.2, 1.1, 1, 1]);
  const lace = E.FOES.filter((f) => f.page === 'lace');
  assert.deepEqual(lace.map((f) => f.hp), [250, 800]);
  assert.equal(lace[1].variant.es, 'La Cuna');
  // Moss Mother: the game says «Madremusgo», where the wiki's ESname says «Madre Musgo».
  assert.equal(E.FOES.find((f) => f.page === 'moss-mother').name.es, 'Madremusgo');
  // Every row's Journal number is its entry's place in the Journal.
  const byId = new Map(J.BOOK.map((e) => [e.id, e.n]));
  for (const f of E.FOES) if (byId.has(f.page)) assert.equal(f.hj, byId.get(f.page), f.id);
  assert.deepEqual(E.ATTACKS.lace.staggers, [11, 16]);
});

test('the Journal: 236 entries (237 in Steel Soul), 230 needed for Nuu\'s reward, six optional', () => {
  assert.equal(J.BOOK.filter((e) => !e.steel).length, 236);
  assert.equal(J.BOOK.length, 237);
  assert.deepEqual(J.REQUIRED, { classic: 230, steel: 231 });
  assert.deepEqual(J.BOOK.filter((e) => e.optional).map((e) => e.id),
    ['flintbeetle', 'palestag', 'shakra', 'garmond-and-zaza', 'lost-garmond', 'lost-lace']);
  assert.equal(J.BOOK[0].id, 'mossgrub');
  assert.ok(J.BOOK[0].start);
  assert.ok(J.BOOK.every((e) => e.desc && e.note), 'every entry has the game\'s description and the Hunter\'s note');
});

test("the save's pieces and areas: every piece's area is one of the game's, and the save's zones all have a name", () => {
  for (const p of CO.PIECES) assert.ok(p[3] === null || CO.AREAS[p[3]], `piece ${p[0]} in an unknown area ${p[3]}`);
  // The currentArea values seen on the author's 92 saves.
  for (const z of ['ABYSS', 'BELLHART', 'BONEBOTTOM', 'COGWORK_CORE', 'CORAL_TOWER', 'CRADLE', 'CRAWL', 'DOCKS', 'GRANDGATE',
    'GREYMOOR', 'GROVE', 'HALLS', 'HANG', 'HUNTERS_MARCH', 'LIBRARY', 'MEMORY_RED', 'MISTMAZE', 'MOSSCAVE', 'MOSSTOWN',
    'MOUNTAIN', 'SHELLWOOD', 'SLAB', 'UNDERSTORE', 'WILDS']) assert.ok(CO.AREAS[z], `no name for ${z}`);
  assert.equal(CO.AREAS.CORAL_STEPS.es, 'Escalones Ajados');
});

test('the 49 enemy gauntlets: every wave\'s enemies are in js/enemies.js, every area is the game\'s, each says how it\'s cleared', () => {
  const G = require('../js/gauntlets.js').GAUNTLETS;
  const CO = require('../js/collectibles.js');
  assert.equal(G.length, 49);
  const ids = new Set(E.FOES.map((f) => f.id));
  for (const g of G) {
    assert.ok(g.waves.length > 0, g.id);
    for (const w of g.waves) for (const [id, n] of w) assert.ok(ids.has(id) && n >= 1, `${g.id}: ${id}`);
    assert.ok(CO.AREAS[g.area], `${g.id}: area ${g.area}`);
    // How a save says it's cleared: one of js/savefile.js's conditions, with what it names.
    const ok = (c) => ({ flag: () => typeof c[1] === 'string', bool: () => c.length === 3 && c.slice(1).every((x) => typeof x === 'string'),
      quest: () => typeof c[1] === 'string', all: () => c.length > 2 && c.slice(1).every(ok), not: () => ok(c[1]) }[c[0]] || (() => false))();
    assert.ok(ok(g.done), `${g.id}: done ${JSON.stringify(g.done)}`);
  }
});

/* The phases (js/phases.js, from the game's FSMs) against the wiki's own labels (each boss page's
   attacks, "Phase 1", "Phase 2"…), by page: the most phases any of its fights has. A patch that
   moves a phase, or a wiki edit that labels one, fails here and is looked at. */
test('each boss\'s phases, from the game, against the wiki\'s phase labels', () => {
  const P = require('../js/phases.js');
  const game = {};
  for (const f of E.FOES.filter((x) => x.boss)) {
    const p = P[f.id];
    game[f.page] = Math.max(game[f.page] || 0, p ? (p.bars ? p.bars.length : p.at.length + 1) : 0);
  }
  // page: [wiki, game]. Not in the game's files yet (another entity's health, or past 0).
  const MISSING = {
    'bell-eater': [2, 0],               // the head's and the rear's health added
    'father-of-the-flame': [2, 0],      // four lanterns, then the core
    'forebrothers-signis-and-gron': [2, 0], // two brothers, each upgraded at 350
    'phantom': [2, 0],                  // the Cross Stitch once at 0
  };
  // The game changes more than the wiki names a phase: a rage (Gurr's, Lace's, the Bell Beast's),
  // a last stagger, a pace that quickens, or a fight the wiki doesn't split.
  const MORE = {
    'bell-beast': [1, 3], 'clover-dancers': [1, 2], 'cogwork-dancers': [0, 4], 'crust-king-khann': [2, 3],
    'grand-mother-silk': [5, 6], 'gurr-the-outcast': [2, 3], 'lace': [2, 3], 'last-judge': [2, 3],
    'lost-lace': [0, 4], 'moss-mother': [0, 2], 'palestag': [0, 2], 'pinstress': [0, 2],
    'plasmified-zango': [0, 5], 'savage-beastfly': [2, 3], 'second-sentinel': [0, 2],
    'shrine-guardian-seth': [2, 3], 'sister-splinter': [2, 3], 'skarrsinger-karmelita': [2, 3],
    'summoned-saviour': [0, 3], 'voltvyrm': [0, 3],
  };
  let same = 0;
  for (const [page, a] of Object.entries(E.ATTACKS)) {
    const labels = a.attacks.map((x) => /^Phase (\d+)/.exec((x.where && x.where.en) || '')).filter(Boolean);
    const wiki = labels.length ? Math.max(...labels.map((m) => +m[1])) : 0;
    const got = [wiki, game[page] || 0];
    const want = MISSING[page] || MORE[page];
    if (want) assert.deepEqual(got, want, page);
    else { assert.equal(got[1], got[0], `${page}: ${got[0]} phases on the wiki, ${got[1]} from the game`); if (wiki) same++; }
  }
  assert.equal(same, 13);
  // Every boss in js/phases.js is one of js/enemies.js.
  for (const id of Object.keys(P)) assert.ok(E.FOES.some((f) => f.id === id && f.boss), id);
});
