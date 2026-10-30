/* test/journal-acts.test.js: the Map's Journal by Act, the cocoon off the map, what opens a fight,
   how an extra is had and an objective's steps on one point (design/00-study.md, 21 Oct 2026:
   Albert's D25, D27, D28, D29, D16, D32). The data is tools/extract-journal-rooms.py's
   (js/journal-rooms.js journalWhen, sceneHosts) and tools/gen-spots.js's (js/spots.js JOURNAL,
   JOURNAL_ACT3, OPENS, STEPS, GOAL_ACT, EXTRAS more), read from the game's scenes. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const JR = require('../js/journal-rooms.js');
const SP = require('../js/spots.js');
const J = require('../js/journal.js');
const Q = require('../js/quests.js');
const G = require('../js/gauntlets.js');
const F = require('../js/savefile.js');
const SS = globalThis.SS;
const key = (id) => J.BOOK.find((e) => e.id === id).key;

test('each Journal room says when its enemies are there, from the game\'s switches', () => {
  // The Snitchflies of Bone Bottom are under its Black Thread World; Song_24's under its Normal World.
  assert.deepEqual(SP.JOURNAL[key('snitchfly')].Bonetown, [0, 1]);
  assert.deepEqual(SP.JOURNAL[key('snitchfly')].Song_24, [1, 0]);
  // Greymoor_04's Dreg Catchers only come in its gauntlets' waves: Greymoor 1 before Act 3, Greymoor 2 in it.
  assert.deepEqual(SP.JOURNAL[key('dreg-catcher')].Greymoor_04, [['greymoor-1'], ['greymoor-2']]);
  // The Wormways' Gromlings turn Plasmified in Act 3 (Crawl_09), but Crawl_01 keeps them.
  assert.deepEqual(SP.JOURNAL[key('gromling')].Crawl_09, [1, 0]);
  assert.ok(!SP.JOURNAL[key('gromling')].Crawl_01);
  // Every gauntlet named is one of the 49; the Act 3 only entries have no room before it.
  const ids = new Set(G.GAUNTLETS.map((g) => g.id));
  for (const rooms of Object.values(SP.JOURNAL)) {
    for (const side of Object.values(rooms).flat()) if (Array.isArray(side)) for (const id of side) assert.ok(id === '' || ids.has(id), id);
  }
  for (const k of SP.JOURNAL_ACT3) {
    for (const [scene] of JR[k]) assert.strictEqual(((SP.JOURNAL[k] || {})[scene] || [1, 1])[0], 0, `${k} ${scene}`);
  }
  for (const id of ['plasmified-grub', 'kai', 'wingmould', 'skrill']) {
    const e = J.BOOK.find((x) => x.id === id);
    if (e) assert.ok(SP.JOURNAL_ACT3.includes(e.key), id);
  }
  assert.ok(!SP.JOURNAL_ACT3.includes(key('dreg-catcher')));
  // A room the Map may give an entry other than its first has the enemy's point there.
  assert.ok(SP.XY['journal:snitchfly:shadow_28']);
});

test('the Wingmoulds and a cocoon off the map go to the room that loads their scene', () => {
  assert.deepEqual(JR.NAME_WHITE_PALACE_FLY.map(([s]) => s), ['Tut_04']);
  assert.deepEqual(SS.sceneHosts.memory_red, ['Tut_04']);
  assert.deepEqual(SS.sceneHosts.abyss_cocoon, ['Abyss_05']);
  assert.ok(SS.sceneHosts.bellway_centipede_arena.includes('Belltown_basement'));
  // The rosaries it holds, from the save, kept in a slot.
  const pd = { HeroCorpseScene: 'Song_Tower_01', HeroCorpseMoneyPool: 463, HeroDeathScenePos: { x: 64.7, y: 102.6 }, HeroDeathSceneSize: { x: 130, y: 140 } };
  const g = F.game(pd);
  assert.strictEqual(g.cocoonRosaries, 463);
  assert.strictEqual(F.gameOf(F.toSnapshot(pd)).cocoonRosaries, 463);
  assert.strictEqual(F.game({ HeroCorpseScene: '', HeroCorpseMoneyPool: 50 }).cocoonRosaries, 0);
});

test('a fight the game puts there only once something holds says what, and the save says whether', () => {
  const want = { 'boss:broodmother': 'Broodmother Hunt', 'boss:savage-beastfly-far-fields': 'Beastfly Hunt', 'boss:gurr-the-outcast': 'Ant Trapper',
    'boss:lost-garmond': 'Garmond Black Threaded', 'boss:tormented-trobbio': 'Tormented Trobbio', 'boss:second-sentinel': 'Song Knight',
    // Atop Mount Fay only once Fatal Resolve is taken at the note in her home (Peak_07's «Pinstress Control»).
    'boss:pinstress': 'Pinstress Battle' };
  for (const [k, q] of Object.entries(want)) assert.deepEqual(SP.OPENS[k].check, ['accepted', q], k);
  assert.deepEqual(SP.OPENS['boss:shakra'].check, ['quest', 'Shakra Final Quest']);
  assert.deepEqual(SP.OPENS['boss:fourth-chorus'].check, ['flag', 'hasBrolly']);
  assert.deepEqual(SP.OPENS['gaunt:whispering-vaults-2'].check, ['flag', 'scholarAcolytesReleased']);
  for (const k of Object.keys(SP.OPENS)) {
    const [kind, id] = k.split(':');
    assert.ok(kind === 'boss' ? SP.BOSSES.some((b) => b[0] === id) : G.GAUNTLETS.some((x) => x.id === id), k);
  }
  const g = F.game({ hasBrolly: true, scholarAcolytesReleased: false });
  assert.ok(g.opens.includes('boss:fourth-chorus') && !g.opens.includes('gaunt:whispering-vaults-2') && g.opensRead);
  // A slot kept before says nothing of it.
  assert.strictEqual(F.gameOf({}).opensRead, false);
});

test('an extra\'s card says how it\'s had: who sells it, the fight, the person or the challenge', () => {
  const extra = (thing) => SP.EXTRAS.find((x) => x[2] && x[2][1] === thing);
  assert.deepEqual(extra('Seal Chit City Merchant')[5], { shop: 'jubilana', price: 180, after: ['Save City Merchant Bridge'] });
  assert.deepEqual(extra('Psalm Cylinder Grindle')[5], { shop: 'grindle', price: 240 });
  for (const [flag, price] of [['BelltownFurnishingDesk', 380], ['BelltownFurnishingFairyLights', 320], ['BelltownHousePaintComplete', 520],
    ['BelltownFurnishingSpa', 1100], ['BelltownFurnishingGramaphone', 490]]) {
    assert.strictEqual(extra(flag)[5].shop, 'frey', flag);
    assert.strictEqual(extra(flag)[5].price, price, flag);
  }
  assert.deepEqual(extra('BelltownFurnishingGramaphone')[5].needs, ['BelltownHouseVisited', 'LibrarianCollectionComplete', 'BelltownFurnishingDesk']);
  assert.deepEqual(extra('Grey Memento')[5].how, { kind: 'boss', foe: 'watcher-at-the-edge' });
  assert.deepEqual(extra('Memento Garmond')[5].how, { kind: 'boss', foe: 'lost-garmond' });
  assert.deepEqual(extra('Crowman Memento')[5].how, { kind: 'boss', foe: 'crawfather' });
  assert.strictEqual(extra('Hunter Memento')[5].how.who.key, 'HUNTER_FAN_MAIN');
  assert.strictEqual(extra('Weaver Record Sprint_Challenge')[5].how.kind, 'speed');
  assert.strictEqual(Q.CHAIN[extra('Weaver Totem Witch')[5].how.wish].name.key, 'QUEST_WITCH_CURSE_TITLE');
  // The keys a vendor also sells aren't touched: the Roachkeeper's Simple Key is another one.
  assert.ok(!extra('CollectedDustCageKey')[5].shop);
});

test('an objective\'s steps pinned on one point are one mark, in order, with their Act', () => {
  const quests = SP.STEPS.map((st) => st.map((i) => SP.TASKS[i][1]));
  assert.deepEqual(quests, [['Black Thread Pt1 Shamans', 'Black Thread Pt4 Return', 'Black Thread Pt5 Heart'], ['Black Thread Pt2 Abyss', 'Black Thread Pt6 Flower'],
    ['Citadel Ascent', 'Citadel Ascent Melodies'], ['Diving Bell Pt1 Inspect', 'Diving Bell Pt3 Descend']]);
  for (const st of SP.STEPS) for (const i of st) assert.strictEqual(SP.GOAL_ACT[i], SP.TASKS[i][1].startsWith('Citadel') ? 2 : 3, SP.TASKS[i][1]);
});
