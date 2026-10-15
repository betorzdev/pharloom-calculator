/* test/completion.test.js — the 100%: the wiki's ten categories, and the way the game counts
   them (found on 92 real saves, which don't go in the repo: npm run check-pack runs on them). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

require('../js/data.js');
const CO = require('../js/collectibles.js');
const CP = require('../js/completion.js');
const F = require('../js/savefile.js');

// The wiki's table ("Completion (Silksong)", design/00-study.md §3.4), in its order.
const WIKI = { tools: 51, spools: 9, upgrades: 8, arts: 7, skills: 6, crests: 6, masks: 5, needle: 4, hearts: 3, items: 1 };
const cat = (r, id) => r.categories.find((c) => c.id === id);

test("the categories are the wiki's, and they add up to 100", () => {
  const r = CP.count({});
  assert.deepEqual(Object.fromEntries(r.categories.map((c) => [c.id, c.max])), WIKI);
  assert.equal(r.categories.reduce((a, c) => a + c.max, 0), 100);
  assert.equal(r.total, 0);
});

test('everything is 100%, and nothing counts twice or past its maximum', () => {
  const all = {
    tools: Object.keys(CO.TOOLS), crests: ['hunter', ...CP.CRESTS], skills: CP.SKILLS.slice(),
    arts: [...CP.ARTS, 'drifters-cloak', 'faydown-cloak'], masks: 5, spools: 9, hearts: 3, needle: 4, kit: 4, pouch: 4, everbloom: true,
  };
  assert.equal(CP.count(all).total, 100);
  assert.equal(CP.count({ ...all, masks: 9, spools: 12, needle: 7 }).total, 100);
});

test('a Tool and its upgrade are one point; the Hunter Crest and the cloaks are none', () => {
  assert.equal(cat(CP.count({ tools: ['curveclaw', 'curvesickle'] }), 'tools').got, 1);
  assert.equal(cat(CP.count({ tools: ['curvesickle'] }), 'tools').got, 1);
  assert.equal(cat(CP.count({ tools: ['snare-setter', 'needle-phial'] }), 'tools').got, 0);
  assert.equal(cat(CP.count({ crests: ['hunter'] }), 'crests').got, 0);
  assert.equal(cat(CP.count({ arts: ['drifters-cloak', 'faydown-cloak'] }), 'arts').got, 0);
});

// Hornet as a save carries her: the scalars, and the collections as { savedData: [{ Name, Data }] }.
const saved = (entries) => ({ savedData: entries.map(([Name, Data]) => ({ Name, Data })) });
const PD = {
  silk: 0, maxHealthBase: 6, silkMax: 10, silkRegenMax: 1, nailUpgrades: 1, ToolKitUpgrades: 1, ToolPouchUpgrades: 0,
  heartPieces: 2, silkSpoolParts: 1, hasNeedleThrow: true, hasDash: true, hasBrolly: true, act2Started: true,
  respawnScene: 'Bellway_City', currentArea: 'GRANDGATE',
  Tools: saved([['Tri Pin', { IsUnlocked: true }], ['Curve Claws Upgraded', { IsUnlocked: true }], ['Compass', { IsUnlocked: false }]]),
  ToolEquips: saved([['Hunter', { IsUnlocked: true }], ['Warrior', { IsUnlocked: true }]]),
  Collectables: saved([['White Flower', { Amount: 0 }]]),
  QuestCompletionData: saved([['Beastfly Hunt', { IsCompleted: true }]]),
  EnemyJournalKillData: { list: [{ Name: 'MossBone Crawler', Record: { Kills: 29 } }] },
};
const SD = { persistentBools: { serializedList: [{ SceneName: 'Crawl_02', ID: 'Heart Piece', Value: true }] } };

test("a save in the site's ids: Tools and Crests by their save names, whole masks and spools", () => {
  const g = F.game(PD, SD);
  assert.deepEqual(g.tools, ['threefold-pin', 'curvesickle']);
  assert.deepEqual(g.crests, ['hunter', 'beast']);
  assert.deepEqual(g.skills, ['silkspear']);
  assert.deepEqual(g.arts, ['swift-step', 'drifters-cloak']);
  assert.deepEqual([g.masks, g.spools, g.hearts, g.needle, g.kit, g.pouch], [1, 1, 1, 1, 1, 0]);
  assert.equal(g.everbloom, false);
  assert.deepEqual(g.journal, { mossgrub: 29 });
  assert.deepEqual([g.act, g.bench, g.area], [2, 'Bellway_City', 'GRANDGATE']);
  // Three pieces found: the shard on the floor in Crawl_02, the one from the Beastfly Hunt wish
  // and the first Needle upgrade (nailUpgrades 1).
  assert.deepEqual(g.pieces.map((i) => CO.PIECES[i][0]), ['mask-shard', 'mask-shard', 'needle']);
  // The loose pieces (2 shards, 1 fragment) don't count: only the whole mask and spool do.
  assert.equal(CP.count(g).total, 2 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1);
});

test('the Act: 1, then act2Started, then the black-threaded world', () => {
  assert.equal(F.game({ silk: 0 }).act, 1);
  assert.equal(F.game({ silk: 0, act2Started: true, blackThreadWorld: true }).act, 3);
});

test('a Journal entry is complete when listed with its kills; one with no count (a tablet) once listed', () => {
  const J = require('../js/journal.js');
  const vt = J.BOOK.find((e) => e.id === 'void-tendrils');
  const mg = J.BOOK.find((e) => e.id === 'mossgrub');
  assert.equal(vt.kills, null);
  assert.equal(CP.journalDone(vt, {}), false);   // not seen: not complete (0 >= null is true in JS)
  assert.equal(CP.journalDone(vt, { 'void-tendrils': 0 }), true);
  assert.equal(CP.journalDone(mg, { mossgrub: 24 }), false);
  assert.equal(CP.journalDone(mg, { mossgrub: 25 }), true);
});

test('93% is the most before Act 3: its 7 points, as the wiki names them', () => {
  // Every thing of the 100% whose Act is 1 or 2, counted as the game counts it.
  const upTo2 = (ids, where) => ids.filter((id) => where[id] && where[id][0] <= 2);
  const pieces = (kind) => CO.PIECES.filter((p) => p[0] === kind && p[1] <= 2).length;
  const g = {
    tools: upTo2(CO.COUNTED.map((ids) => ids[0]), CO.WHERE.tools), crests: upTo2(CP.CRESTS, CO.WHERE.crests),
    skills: upTo2(CP.SKILLS, CO.WHERE.skills), arts: upTo2(CP.ARTS, CO.WHERE.arts),
    masks: Math.floor(pieces('mask-shard') / 4), spools: Math.floor(pieces('spool-fragment') / 2), hearts: pieces('silk-heart'),
    needle: pieces('needle'), kit: pieces('crafting-kit'), pouch: pieces('tool-pouch'), everbloom: CO.WHERE.everbloom[0] <= 2,
  };
  assert.equal(CP.count(g).total, 93);
  // A mask, the Pale Steel Needle, the Pin Badge, Pale Nails, the Shaman Crest, Silk Soar and the Everbloom.
  assert.deepEqual([g.masks, g.needle, g.tools.includes('pin-badge'), g.skills.includes('pale-nails'), g.crests.includes('shaman'),
    g.arts.includes('silk-soar'), g.everbloom], [4, 3, false, false, false, false, false]);
});

test("every thing of the 100% says the area it is in (the Everbloom is a wish's)", () => {
  // Details that are the area alone ("Deep Docks", "Memorium (Top-right)") once gave none.
  for (const k of ['tools', 'crests', 'skills', 'arts']) for (const [id, w] of Object.entries(CO.WHERE[k])) assert.ok(CO.AREAS[w[1]], `${k} ${id}`);
  for (const [i, p] of CO.PIECES.entries()) if (!['old-heart', 'melody'].includes(p[0])) assert.ok(CO.AREAS[p[3]], `PIECES[${i}] ${p[0]}`);
  assert.deepEqual([CO.WHERE.tools.voltvessels[1], CO.WHERE.arts['swift-step'][1], CO.WHERE.skills.silkspear[1]], ['ARBORIUM', 'DOCKS', 'MOSSCAVE']);
});

test('every thing the 100% tab groups by Act has one of the three, split as the wiki splits it', () => {
  // The Progress tab heads each list by Act (js/app-progress.js things()): none may be missing or 0.
  const isAct = (a) => [1, 2, 3].includes(a);
  for (const ids of CO.COUNTED) assert.ok(CO.WHERE.tools[ids[0]] && isAct(CO.WHERE.tools[ids[0]][0]), `tools ${ids[0]}`);
  for (const [k, ids] of [['crests', CP.CRESTS], ['skills', CP.SKILLS], ['arts', CP.ARTS]]) {
    for (const id of ids) assert.ok(CO.WHERE[k][id] && isAct(CO.WHERE[k][id][0]), `${k} ${id}`);
  }
  assert.ok(CO.WHERE.everbloom && isAct(CO.WHERE.everbloom[0]), 'everbloom');
  // Every piece (the 100%'s and the ones beyond it: Memory Lockets, Craftmetal, fleas…) and every wish.
  for (const [i, p] of CO.PIECES.entries()) assert.ok(isAct(p[1]), `PIECES[${i}] ${p[0]}`);
  for (const [i, w] of CO.WISHES.entries()) assert.ok(isAct(w[1]), `WISHES[${i}] ${w[4].en}`);
  // The wiki's own split, where it gives one per thing (tools/gen-collectibles.js actsAgainstWiki).
  const byAct = (kind) => [1, 2, 3].map((a) => CO.PIECES.filter((p) => p[0] === kind && p[1] === a).length);
  assert.deepEqual(byAct('mask-shard'), [6, 10, 4]);
  assert.deepEqual(byAct('spool-fragment'), [6, 12, 0]);
  // The Silk Hearts: the Bell Beast's (Act 1), the Unravelled's and Lace's at the Cradle (Act 2).
  assert.deepEqual(byAct('silk-heart'), [1, 2, 0]);
  // A piece a wish gives comes in that wish's Act, never before it.
  const quests = (c) => (c[0] === 'quest' ? [c[1]] : c[0] === 'any' ? c.slice(1).flatMap(quests) : []);
  for (const [i, p] of CO.PIECES.entries()) {
    for (const q of quests(p[2])) {
      const w = CO.WISHES.find((x) => quests(x[2]).includes(q));
      if (w) assert.ok(p[1] >= w[1], `PIECES[${i}] ${p[0]} is Act ${p[1]}, its wish ${w[4].en} Act ${w[1]}`);
    }
  }
});

test('how to get it: the way a game has reached, and what a shop still waits on', () => {
  const H = require('../js/how.js');
  const way = (ways, g) => CP.wayOf(ways, g, F.ART_PD);
  const game = (o) => ({ act: 1, wishes: [], arts: [], ...o });
  // No game: the first way. A game: the last way its Act has reached (Pebb, then Grindle in Act 3).
  const brooch = H.HOW.tools['magnetite-brooch'];
  assert.equal(way(brooch, null).way.vendor, 'pebb');
  assert.equal(way(brooch, game({ act: 2 })).way.vendor, 'pebb');
  assert.equal(way(brooch, game({ act: 3 })).way.vendor, 'grindle');
  assert.equal(way(H.HOW.tools.curveclaw, game({ act: 2 })).way.kind, 'found');
  // Frey's Multibinder waits for My Missing Courier; Grindle's Snitch Pick for the Clawline.
  const multi = H.HOW.tools.multibinder;
  assert.equal(way(multi, null).first.length, 1);
  assert.deepEqual(way(multi, game({ wishes: multi[0].after })).first, []);
  assert.deepEqual(way(H.HOW.tools['snitch-pick'], game()).arts, ['clawline']);
  assert.deepEqual(way(H.HOW.tools['snitch-pick'], game({ arts: ['clawline'] })).arts, []);
  assert.deepEqual(CP.wayOf(undefined, null), { way: null, first: [], arts: [] });
});

test("the flea caravan's rewards wait for the game's counts: 12 fleas in Greymoor, 22 in the Blasted Steps", () => {
  // The Troupe Leader's FSM (tools/gen-how.js FLEAS), as the wiki's Fleas page says; the completionist's 14 and 20 were wrong.
  const H = require('../js/how.js');
  const at = (kind, text) => CO.PIECES.findIndex((p) => p[0] === kind && JSON.stringify(p[2]).includes(text));
  assert.deepEqual(H.HOW.pieces[at('spool-fragment', 'MetCaravanTroupeLeaderJudge')], [{ kind: 'fleas', npc: 'mooshka', fleas: 12 }]);
  assert.deepEqual(H.HOW.pieces[at('tool-pouch', 'Fleatopia')], [{ kind: 'fleas', npc: 'mooshka', fleas: 22 }]);
});

test("Mooshka's Spool Fragment is given at the caravan's Blasted Steps camp, not in Greymoor", () => {
  // The Judge arena's Troupe Leader FSM ("Award Spool Piece", setting MetCaravanTroupeLeaderJudge;
  // tools/completionist.js PIECE_FIX): its check, its area and its Map room are that camp's.
  const S = require('../js/spots.js');
  const i = CO.PIECES.findIndex((p) => p[0] === 'spool-fragment' && p[2][1] === 'MetCaravanTroupeLeaderJudge');
  assert.ok(i >= 0);
  assert.deepEqual(CO.PIECES[i].slice(1, 4), [2, ['flag', 'MetCaravanTroupeLeaderJudge'], 'CORAL_STEPS']);
  assert.equal(S.AT.pieces[i], 'Coral_Judge_Arena');
  assert.ok(!CO.PIECES.some((p) => p[2][1] === 'CaravanTroupeLocation'));
});
