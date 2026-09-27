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
