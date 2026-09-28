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
  const wiki = E.FOES.filter((f) => f.src !== 'game');
  assert.equal(wiki.filter((f) => !f.boss).length, 201);
  assert.equal(wiki.filter((f) => f.boss).length, 61);
  for (const f of wiki) assert.equal(f.mods.length, 5, f.id);
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

test('the enemies the tables lack, from the game: Wisp and Winged Lifeseed, one hit, no modifiers', () => {
  const game = E.FOES.filter((f) => f.src === 'game');
  assert.deepEqual(game.map((f) => f.key), ['NAME_WISP', 'NAME_LIFEBLOOD_FLY']);
  for (const f of game) {
    assert.equal(f.hp, 1, f.id);
    assert.equal(f.oneHit, true, f.id);
    assert.equal(f.mods, undefined, f.id);
    assert.equal(f.boss, undefined, f.id);
  }
  // The engine takes a foe with no modifiers as ×1: one slash kills it.
  require('../js/hero.js');
  const EG = require('../js/engine.js');
  assert.equal(EG.compute({ needle: 0 }, { foe: game[0] }).needle.attacks[0].uses, 1);
  // Every Journal entry has a row but those with no health in the game: the Muckmaggots, the
  // Sandcarver and the Void Tendrils.
  const rows = new Set(E.FOES.map((f) => f.key));
  assert.deepEqual(J.BOOK.filter((e) => !rows.has(e.key)).map((e) => e.key), ['NAME_MAGGOTS', 'NAME_SAND_CENTIPEDE', 'NAME_ABYSS_TENDRIL']);
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
  // page: [wiki, game]. The game changes more than the wiki names a phase: a rage (Gurr's, Lace's,
  // the Bell Beast's), a last stagger, a pace that quickens, a summons (Signis calls workers at
  // 90% and 70% before Gron at 50%), or a fight the wiki doesn't split.
  const MORE = {
    'bell-beast': [1, 3], 'bell-eater': [2, 3], 'forebrothers-signis-and-gron': [2, 4], 'clover-dancers': [1, 2], 'cogwork-dancers': [0, 4], 'crust-king-khann': [2, 3],
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
    const want = MORE[page];
    if (want) assert.deepEqual(got, want, page);
    else { assert.equal(got[1], got[0], `${page}: ${got[0]} phases on the wiki, ${got[1]} from the game`); if (wiki) same++; }
  }
  assert.equal(same, 15);   // with Father of the Flame's two bars and Phantom's rage
  // Every boss in js/phases.js is one of js/enemies.js, and every page MORE names is one the loop
  // above reads (a page renamed away would leave its line unchecked).
  for (const id of Object.keys(P)) assert.ok(E.FOES.some((f) => f.id === id && f.boss), id);
  for (const page of Object.keys(MORE)) assert.ok(E.ATTACKS[page], `${page} isn't a page with attacks`);
  // A boss with phases whose page has no attack list can't be set against the wiki: known ones only.
  const unchecked = [...new Set(Object.keys(P).map((id) => E.FOES.find((f) => f.id === id).page))].filter((pg) => !E.ATTACKS[pg]).sort();
  assert.deepEqual(unchecked, []);
});

test('what enemies do to Hornet (js/enemy-damage.js, the game\'s files): its shape, and the wiki\'s {{damage}} for the same enemies', () => {
  const DMG = require('../js/enemy-damage.js');
  const fs = require('fs');
  const path = require('path');
  const W = require('../tools/wiki.js');
  const keys = Object.keys(DMG.BY_KEY);
  assert.equal(keys.length, 220);
  assert.equal(DMG.BARBED, 2);   // the Gameplay settings' barbedWireDamageTakenMultiplier
  const journal = new Set(J.BOOK.map((e) => e.key));
  const masks = (l) => Array.isArray(l) && l.length && l.every((m, i) => Number.isInteger(m) && m >= 1 && m <= 4 && (!i || m > l[i - 1]));
  for (const k of keys) {
    const d = DMG.BY_KEY[k];
    assert.ok(journal.has(k), `${k} is no Journal entry`);
    assert.ok(d.body || d.attacks, k);
    if (d.body) assert.ok(masks(d.body), `${k} body`);
    for (const [g, v] of Object.entries(d.attacks || {})) assert.ok(masks(v), `${k} ${g}`);
    for (const [g, v] of Object.entries(d.types || {})) {
      assert.ok(['fire', 'void'].includes(v) && d.attacks[g], `${k} ${g}`);
      assert.ok(d.attacks[g].every((m) => m === 2), `${k} ${g}: fire and void hits are 2 masks`);
    }
    // What it spawns at run time and what only a black-threaded one does: attacks of its own.
    for (const g of [...(d.spawned || []), ...(d.threaded || [])]) assert.ok(d.attacks[g], `${k} ${g}`);
  }
  assert.equal(keys.filter((k) => DMG.BY_KEY[k].body).length, 215);
  assert.equal(keys.filter((k) => Math.max(...(DMG.BY_KEY[k].body || [0])) === 2).length, 56);
  assert.equal(keys.filter((k) => DMG.BY_KEY[k].spawned).length, 64);
  assert.deepEqual(keys.filter((k) => DMG.BY_KEY[k].threaded).sort(), ['NAME_BLOAT_ROACH', 'NAME_CORAL_CONCH_SHOOTER_HEAVY',
    'NAME_PILGRIM_MOSS_SPITTER', 'NAME_SWAMP_MOSQUITO_SKINNY', 'NAME_TAR_SLUG', 'NAME_TAR_SLUG_HUGE']);

  /* Against the wiki: each enemy page's {{damage|n}} before its Act 3 section (a void hit left
     out when there's another), the highest per hit against the highest the game has (what only
     a black-threaded one does left out too), and the one nearest each "contact" against the
     body. The disagreements are pinned: hitboxes the wiki doesn't give, enemies placed with two
     values, and bosses whose contact changes with the phase. */
  const files = new Map(fs.readdirSync(W.RAW).map((f) => [W.slug(f.replace(/\.wiki$/, '').replace(/_/g, ' ')), f]));
  const perHit = (x) => Math.max(...x.split('+').map(Number).filter((n) => n > 0));
  const DAMAGE = /\{\{damage\|([^}|]*)(\|[^}]*)?\}\}/gi;
  const agree = { max: 0, contact: 0 }, differ = { max: [], contact: [] }, missing = [];
  const seen = new Set();
  for (const f of E.FOES) {
    if (seen.has(f.key) || !files.has(f.page)) continue;
    const txt = fs.readFileSync(path.join(W.RAW, files.get(f.page)), 'utf8');
    const cut = txt.search(/^===?\s*(Act 3|Black[- ]Thread)/mi);
    const body = cut > 0 ? txt.slice(0, cut) : txt;
    const all = [...body.matchAll(DAMAGE)].map((m) => ({ v: perHit(m[1]), void: /void/i.test(m[2] || '') }));
    if (!all.length) continue;   // this row's page gives none: the key's next row's page may
    seen.add(f.key);
    const g = DMG.BY_KEY[f.key];
    if (!g) { missing.push(f.key); continue; }
    const plain = all.filter((d) => !d.void);
    const wikiMax = Math.max(...(plain.length ? plain : all).map((d) => d.v));
    const gameMax = Math.max(...(g.body || []), ...Object.entries(g.attacks || {}).filter(([a]) => !(g.threaded || []).includes(a)).map(([, v]) => v).flat());
    if (wikiMax === gameMax) agree.max++; else differ.max.push(f.key);
    const contact = new Set();
    for (const s of body.split(/(?<=[.!?])\s+|\n|[,;]|\bwhile\b|\bbut\b/)) {
      if (/black[- ]thread|act 3/i.test(s)) continue;
      const ds = [...s.matchAll(DAMAGE)].filter((d) => !/void/i.test(d[0]));
      if (!ds.length) continue;
      for (const c of s.matchAll(/contact/gi)) {
        contact.add(perHit(ds.reduce((a, d) => (Math.abs(d.index - c.index) < Math.abs(a.index - c.index) ? d : a))[1]));
      }
    }
    if (contact.size) {
      if ([...contact].every((c) => (g.body || []).includes(c))) agree.contact++; else differ.contact.push(f.key);
    }
  }
  // Before what's spawned was read (28 September): 143 of 154. The spit, bombs and bursts made at
  // run time closed Bone Spitter, Dock Bomber, Swamp Goomba, Swamp Mosquito, Slab Fly Small Fresh
  // and Second Sentinel, and opened Lightbearer; the enemies the game makes at run time (named by
  // their fight, a prefab or their corpse) added 18, all agreeing. Of the 45 bosses, 43 agree.
  assert.equal(agree.max, 166);
  assert.deepEqual(differ.max.sort(), [
    'NAME_BONE_CIRCLER_VICIOUS',        // wiki 1, game 2: its Attack Circle (the summoned one's)
    'NAME_CORAL_CONCH_DRILLER_GIANT',   // boss: wiki 1, game 2 (its body and drill)
    'NAME_LIGHTBEARER',                 // wiki 1, game 2: its globe's Pop Damager
    'NAME_MOSSBONE_MOTHER',             // boss: wiki 2, game 1 (only the ambient one is placed)
    'NAME_SLAB_FLY_MID',                // wiki 1, game 1 and 2 (placed with both)
    'NAME_SONG_THREADED_HUSK',          // wiki 1, game 2
  ]);
  assert.equal(agree.contact, 105);
  // Bosses whose wiki gives 1 and 2 on contact (by phase); the game places them at 2. First Sinner
  // and Widow: a {{damage|2}} in the same sentence as "contact" is another attack's (the wiki
  // says contact is 1; Widow's debris "on contact").
  assert.deepEqual(differ.contact.sort(), ['NAME_BONE_FLYER_GIANT', 'NAME_FIRST_WEAVER', 'NAME_FLOWER_QUEEN', 'NAME_SPINNER_BOSS', 'NAME_SPLINTER_QUEEN']);
  // With a {{damage}} on the wiki and nothing here: Garpid, the Bell Eater, the Cogwork Dancers,
  // Father of the Flame, Lost Lace (no hitbox the game places or spawns is read for them) and
  // Fourth Chorus (its record is on its head, with no hitbox under it); and the Wisp, whose row is
  // the game's (js/enemies.js src) and whose fireball a lantern lets out, not an enemy.
  assert.equal(missing.length, 7);
});

test('the shops, from the game: nine vendors, prices in rosaries, every piece bought joined to its flag', () => {
  const S = require('../js/shop.js');
  assert.deepEqual(Object.keys(S.VENDORS).sort(), ['forge-daughter', 'frey', 'grindle', 'jubilana', 'mort', 'mottled-skarr', 'pebb', 'shakra', 'twelfth-architect']);
  assert.deepEqual(S.UNSOLD, ['Belltown Tool Pouch', 'Forge Tacks Tool', 'Grindle Reserve Bind']);
  for (const x of S.SHOP) {
    assert.ok(S.VENDORS[x.vendor], x.item);
    assert.ok(Number.isInteger(x.price) && x.price > 0, `${x.item}: price ${x.price}`);
    assert.ok(x.craftmetal === undefined || Number.isInteger(x.craftmetal), x.item);
    if (x.tool) assert.ok(CO.TOOLS[x.tool], `${x.item}: no Tool ${x.tool}`);
    if (x.piece !== undefined) assert.deepEqual(CO.PIECES[x.piece][2], ['flag', x.flag], x.item);
  }
  // The Multibinder's price is its CostReference's (880), not its cost field (120).
  const price = (item) => S.SHOP.find((x) => x.item === item).price;
  assert.equal(price('Bellhart Multibind'), 880);
  assert.equal(price('Forge Sting Shard Tool'), 140);
  assert.deepEqual([S.NEEDLE.further, S.NEEDLE.final], [450, 680]);
});

test('how to get each thing of the 100%: every one has a way, and every way joins', () => {
  const H = require('../js/how.js');
  const CP = require('../js/completion.js');
  const KINDS = new Set(['shop', 'wish', 'boss', 'found', 'craft', 'npc', 'challenge', 'fleas']);
  const COUNTS = new Set(['mask-shard', 'spool-fragment', 'crafting-kit', 'tool-pouch', 'needle', 'silk-heart']);
  const want = {
    tools: CO.COUNTED.map((g) => g[0]), crests: CP.CRESTS, skills: CP.SKILLS, arts: CP.ARTS,
    pieces: CO.PIECES.map((p, i) => (COUNTS.has(p[0]) ? String(i) : null)).filter((i) => i !== null),
  };
  const ways = [];
  for (const [cat, ids] of Object.entries(want)) {
    assert.deepEqual(Object.keys(H.HOW[cat]).sort(), [...ids].sort(), cat);
    for (const id of ids) {
      assert.ok(H.HOW[cat][id].length, `${cat}.${id} has no way`);
      H.HOW[cat][id].forEach((w) => ways.push([`${cat}.${id}`, w]));
    }
  }
  // 51 Tools, 6 Crests, 6 Silk Skills, 7 abilities; 20 + 18 + 4 + 4 + 4 + 3 pieces.
  assert.deepEqual(Object.values(want).map((l) => l.length), [51, 6, 6, 7, 53]);
  assert.ok(H.HOW.everbloom.length);
  H.HOW.everbloom.forEach((w) => ways.push(['everbloom', w]));
  for (const [where, w] of ways) {
    assert.ok(KINDS.has(w.kind), `${where}: kind ${w.kind}`);
    for (const k of ['price', 'craftmetal', 'paleOil', 'act']) {
      if (w[k] !== undefined) assert.ok(Number.isInteger(w[k]) && w[k] >= 0, `${where}: ${k} ${w[k]}`);
    }
    if (w.kind === 'shop') assert.ok(Number.isInteger(w.price), `${where}: no price`);
    if (w.vendor || w.npc) assert.ok(H.NPCS[w.vendor || w.npc], `${where}: no NPC ${w.vendor || w.npc}`);
    if (w.kind === 'boss') assert.ok(E.FOES.some((f) => f.id === w.foe && f.boss), `${where}: no boss ${w.foe}`);
    if (w.kind === 'wish') {
      const c = JSON.stringify(CO.WISHES[w.wish][2]);
      assert.ok(c.includes(JSON.stringify(['quest', w.quest])), `${where}: WISHES[${w.wish}] isn't ${w.quest}`);
    }
    (w.after || []).forEach((i) => assert.ok(CO.WISHES[i], `${where}: after ${i}`));
    if (w.kind === 'fleas') assert.ok(w.fleas === 'all' || Number.isInteger(w.fleas), where);
  }
  for (const [id, n] of Object.entries(H.NPCS)) assert.ok(n.es && n.en, id);
  // The Crafting Kit's four, in PIECES order.
  const kit = CO.PIECES.map((p, i) => [p, i]).filter(([p]) => p[0] === 'crafting-kit').map(([, i]) => H.HOW.pieces[i][0]);
  assert.deepEqual(kit.map((w) => [w.kind, w.vendor || w.quest, w.price]),
    [['shop', 'forge-daughter', 180], ['wish', 'Crow Feathers', undefined], ['shop', 'grindle', 700], ['shop', 'twelfth-architect', 450]]);
});

test('the traps: Curveclaw handed over, Silkshot\'s three repairs, Broodfeast done as the Runt\'s', () => {
  const H = require('../js/how.js');
  assert.deepEqual(H.TRAPS.map((t) => t.id), ['curveclaw', 'silkshot', 'broodfeast-runt']);
  const [curve, silk, runt] = H.TRAPS;
  assert.deepEqual(curve.lost, { hidden: 'Curve Claws', locked: 'Curve Claws Upgraded' });
  assert.deepEqual(silk.variants.map((v) => v.save), CO.TOOLS.silkshot);
  assert.deepEqual(silk.variants.map((v) => v.way.kind), ['shop', 'shop', 'craft']);
  assert.ok(JSON.stringify(CO.WISHES[runt.wish][2]).includes(runt.instead));
  assert.ok(H.HOW.tools.longclaw.some((w) => w.quest === runt.instead && w.act === 3));
});

test('the keys a thing of the 100% lies behind, and the two NPCs whose names the game splits', () => {
  const H = require('../js/how.js');
  const Q = require('../js/quests.js');
  const CP = require('../js/completion.js');
  for (const [id, k] of Object.entries(H.KEYS)) {
    assert.ok(k.name.es && k.name.en && /^INV_NAME_/.test(k.name.key), id);
    // Every key with an ItemReceptacle in the game carries its doors, as js/quests.js LOCKS reads them.
    assert.deepEqual(k.locks, Q.LOCKS[k.save], id);
  }
  // The game's four Simple Key doors are the wiki's four: the Wormways, the Green Prince's cell,
  // the Rosary Bank, the lower Deep Docks.
  assert.deepEqual(H.KEYS.simple.locks, ['Crawl_02', 'Dust_02', 'Hang_06', 'Room_Forge']);
  assert.deepEqual(H.KEYS.architect.locks, ['Under_17']);
  const needs = [];
  for (const [cat, m] of Object.entries(H.NEEDS)) {
    for (const [id, n] of Object.entries(m)) {
      assert.ok(H.HOW[cat][id], `${cat}.${id} isn't a thing of the 100%`);
      n.keys.forEach((k) => assert.ok(H.KEYS[k], `${cat}.${id}: no key ${k}`));
      if (n.or) assert.ok(D.ARTS.some((x) => x.id === n.or), `${cat}.${id}: no ability ${n.or}`);
      needs.push(`${cat}.${id}`);
    }
  }
  assert.deepEqual(H.NEEDS.crests.architect, { keys: ['architect'] });
  assert.deepEqual(H.NEEDS.tools['rosary-cannon'], { keys: ['simple'] });
  assert.ok(CP.SKILLS.includes('rune-rage') && H.NEEDS.skills['rune-rage'].keys.length === 3);
  const heart = CO.PIECES.findIndex((p) => JSON.stringify(p[2]) === JSON.stringify(['visited', 'Memory_Silk_Heart_WardBoss']));
  assert.deepEqual(H.NEEDS.pieces[heart].keys, ['white', 'surgeon']);
  assert.equal(needs.length, 9);
  // The Spanish puts the title's other half under _SUB: «Hija de la Forja», «Skarr Moteado».
  assert.deepEqual([H.NPCS['forge-daughter'].es, H.NPCS['forge-daughter'].en], ['Hija de la Forja', 'Forge Daughter']);
  assert.deepEqual([H.NPCS['mottled-skarr'].es, H.NPCS['mottled-skarr'].en], ['Skarr Moteado', 'Mottled Skarr']);
  assert.equal(CO.AREAS.GROVE.es, 'Verdania Perdida');
});

// The Crests as the game's pane draws them (js/crest-slots.js, tools/extract-crests.py): each
// Crest's slots, per colour open and locked, are the wiki's (js/data.js), and its art is there.
test('each Crest\'s slots from the game match js/data.js, and each has its art', () => {
  require('../js/crest-slots.js');
  const { crestSlots, crestArt } = globalThis.SS;
  const fs = require('node:fs'), path = require('node:path');
  const TYPE = ['red', 'blue', 'yellow', 'skill'];
  for (const c of D.CRESTS) {
    const rows = c.id === 'hunter' ? crestSlots.hunter : [crestSlots[c.id]];
    assert.ok(rows && rows.every(Boolean), c.id);
    rows.forEach((row, i) => {
      const n = (t, lk) => row.filter((s) => TYPE[s[2]] === t && s[3] === lk).length;
      for (const t of ['red', 'blue', 'yellow']) assert.deepEqual([n(t, 0), n(t, 1)], c.slots[t], `${c.id} ${t}`);
      assert.equal(n('skill', 0) + n('skill', 1), c.slots.skill, `${c.id} skill`);
      const art = c.id === 'hunter' ? `hunter-${i + 1}` : c.id;
      assert.ok(crestArt[art] && fs.existsSync(path.join(__dirname, '..', 'assets', 'crests', art + '.webp')), art);
    });
  }
});
