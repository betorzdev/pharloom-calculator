/* test/savefile.test.js — importing a real game: the .dat read back (a file made here the way
   the game makes it, with Node's own AES), the JSON fallback, and the profile's figures. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

const F = require('../js/savefile.js');

const KEY = 'UKu52ePUBwetZ9wNX88o54dnfKRu0T1l';
const HEADER = [0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0];

// A userN.dat as the game writes it: header, length in 7-bit bytes, base64 of AES-256-ECB, 0x0B.
function datOf(json) {
  const c = crypto.createCipheriv('aes-256-ecb', Buffer.from(KEY, 'latin1'), null);
  const b64 = Buffer.from(Buffer.concat([c.update(JSON.stringify(json), 'utf8'), c.final()]).toString('base64'), 'ascii');
  const len = [];
  for (let n = b64.length; ; n >>= 7) { if (n < 0x80) { len.push(n); break; } len.push((n & 0x7f) | 0x80); }
  return new Uint8Array(Buffer.concat([Buffer.from(HEADER), Buffer.from(len), b64, Buffer.from([11])]));
}

// Hornet at the start, as playerData carries her (the field names from the trackers' source).
const BASE = { silk: 0, silkMax: 9, maxHealth: 5, nailUpgrades: 0, playTime: 0, completionPercentage: 0, geo: 0, ShellShards: 0, permadeathMode: 0 };

test('a .dat made like the game makes it is decrypted back to its playerData', () => {
  // Long enough for many blocks and a length of three 7-bit bytes, with accents in it.
  const pd = { ...BASE, geo: 1234, note: 'Telalejana '.repeat(3000) };
  const r = F.read(datOf({ playerData: pd, sceneData: {} }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.pd, pd);
  assert.deepEqual(r.sd, {});
});

test('a save that is already JSON is read as it is; anything else is refused', () => {
  const json = new TextEncoder().encode('﻿' + JSON.stringify({ playerData: BASE }));
  assert.equal(F.read(json).ok, true);
  assert.deepEqual(F.read(new TextEncoder().encode('hello')), { ok: false, error: 'unreadable' });
  assert.deepEqual(F.read(new TextEncoder().encode('{"playerData":{"geo":3}}')), { ok: false, error: 'notSave' });
  const broken = datOf({ playerData: BASE });
  broken[40] ^= 0xff;
  assert.equal(F.read(broken).ok, false);
});

test("the profile's figures: time, completion, rosaries, shards, Steel Soul and the version", () => {
  const m = F.meta({ ...BASE, version: '1.0.30000', playTime: 3661.5, completionPercentage: 93, geo: 2100, ShellShards: 350, permadeathMode: 2 });
  assert.deepEqual(m, { version: '1.0.30000', time: 3661.5, completion: 93, rosaries: 2100, shards: 350, steel: true, dead: true });
  assert.deepEqual(F.meta({}), { version: '', time: 0, completion: 0, rosaries: 0, shards: 0, steel: false, dead: false });
});

test('a restore point wraps a whole .dat, with the save one level down, and says when and why', () => {
  const inner = datOf({ saveGameData: { playerData: { ...BASE, geo: 77 }, sceneData: { persistentBools: { serializedList: [] } } } });
  const wrap = datOf({ data: Buffer.from(inner).toString('base64'), date: '2025/10/18', version: '1.0.28891',
    number: 16, identifier: 'GAINED_MELODY_CONDUCTOR' });
  const r = F.read(wrap);
  assert.equal(r.ok, true);
  assert.equal(r.pd.geo, 77);
  assert.deepEqual(r.sd, { persistentBools: { serializedList: [] } });
  assert.deepEqual(r.restore, { number: 16, date: '2025/10/18', event: 'GAINED_MELODY_CONDUCTOR' });
  assert.equal(F.read(datOf({ data: 'not base64!' })).ok, false);
});

test("a game goes into a slot's four keys and comes back whole; a damaged key falls back to empty", () => {
  const pd = { ...BASE, maxHealthBase: 7, geo: 5, playTime: 60, blackThreadWorld: true };
  const snap = F.toSnapshot(pd, null, 1700000000000);
  assert.deepEqual(Object.keys(snap).sort(), ['pharloom.journal', 'pharloom.meta', 'pharloom.owned', 'pharloom.progress']);
  const g = F.gameOf(snap);
  assert.deepEqual(g, F.game(pd, null));
  assert.equal(F.metaOf(snap).saved, 1700000000000);
  const hurt = F.gameOf({ ...snap, 'pharloom.owned': '{"tools":"nope"}', 'pharloom.progress': 'not json' });
  assert.deepEqual([hurt.tools, hurt.masks, hurt.act], [[], 0, 1]);
  assert.deepEqual(F.gameOf(null).journal, {});
});

test("a slot keeps its pieces by what they are, so a regenerated list still finds them", () => {
  const CO = require('../js/collectibles.js');
  const i = CO.PIECES.findIndex((p) => p[2][0] === 'bool' && p[2][1] === 'Crawl_02');
  const snap = F.toSnapshot({ ...BASE }, { persistentBools: { serializedList: [{ SceneName: 'Crawl_02', ID: 'Heart Piece', Value: true }] } });
  const kept = JSON.parse(snap['pharloom.progress']).pieces;
  assert.deepEqual(kept, ['mask-shard ["bool","Crawl_02","Heart Piece"]']);
  assert.deepEqual(F.gameOf(snap).pieces, [i]);
  const gone = { ...snap, 'pharloom.progress': JSON.stringify({ pieces: ['flea ["flag","NoSuchFlea"]', kept[0]] }) };
  assert.deepEqual(F.gameOf(gone).pieces, [i]);
});

test('the gauntlets cleared: the arena\'s flag in sceneData or playerData, or what the fight leaves', () => {
  const bools = (...l) => ({ persistentBools: { serializedList: l.map(([s, id, v]) => ({ SceneName: s, ID: id, Value: v })) } });
  const pd = { ...BASE, song_04_battleCompleted: true, slab_cloak_battle_completed: true,
    QuestCompletionData: { savedData: [{ Name: 'Save Sherma', Data: { IsCompleted: true } }] } };
  const g = F.game(pd, bools(['Bone_01', 'Battle Scene', true], ['Cog_05', 'Battle Scene', false]));
  // Slab_16's two arenas set the same flag: not caged is the Choral Chambers way in.
  assert.deepEqual(g.gauntlets.sort(), ['choral-chambers', 'the-marrow-1', 'the-slab-3', 'whiteward-1']);
  const caged = F.game(pd, bools(['Slab_03', 'door_slabCaged', true]));
  assert.ok(caged.gauntlets.includes('the-slab-2') && !caged.gauntlets.includes('the-slab-3'));
  // Into a slot by id and back; an id the list no longer has is dropped, an old slot has none.
  const snap = F.toSnapshot(pd, null);
  assert.deepEqual(F.gameOf(snap).gauntlets, F.game(pd, null).gauntlets);
  const old = JSON.parse(snap['pharloom.progress']);
  assert.deepEqual(F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify({ ...old, gauntlets: ['gone', 'groal'] }) }).gauntlets, ['groal']);
  delete old.gauntlets;
  assert.deepEqual(F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify(old) }).gauntlets, []);
});

test('the map\'s pins lit: a Bellway station unlocked, a toll bench paid; kept in the slot by what they are', () => {
  const pd = { ...BASE, UnlockedFastTravel: true, UnlockedDocksStation: true };
  const sd = { persistentBools: { serializedList: [{ SceneName: 'Dock_01', ID: 'bell_toll_machine', Value: true }] } };
  const g = F.game(pd, sd);
  assert.ok(g.lit.includes('bellway Bellway_02'), 'the Deep Docks station');
  assert.ok(g.lit.includes('bench Dock_01'), 'the toll paid');
  assert.ok(!g.lit.includes('bellway Bellway_City'), 'a station not unlocked');
  assert.ok(g.lit.includes('bellway Bonetown'), 'Bone Bottom\'s needs only the Bellways');
  const snap = F.toSnapshot(pd, sd);
  assert.deepEqual(F.gameOf(snap).lit, g.lit);
  const old = JSON.parse(snap['pharloom.progress']);
  assert.deepEqual(F.gameOf({ ...snap, 'pharloom.progress': JSON.stringify({ ...old, lit: ['bellway Nowhere', 'bench Dock_01'] }) }).lit, ['bench Dock_01']);
});

test('Free mode\'s marks (the Inventory) read back through the same keys a save uses', () => {
  const CO = require('../js/collectibles.js');
  const i = CO.PIECES.findIndex((p) => p[0] === 'memory-locket');
  const g = F.gameOf({
    'pharloom.owned': JSON.stringify({ tools: ['straight-pin'], crests: ['hunter'], skills: [], arts: ['needle-strike'] }),
    'pharloom.progress': JSON.stringify({ everbloom: true, pieces: [F.pieceKey(CO.PIECES[i])] }),
  });
  assert.deepEqual(g.tools, ['straight-pin']);
  assert.deepEqual(g.arts, ['needle-strike']);
  assert.equal(g.everbloom, true);
  assert.deepEqual(g.pieces, [i]);
  assert.equal(g.masks, 0, 'the ladders stay the free build\'s, not the marks\'');
});

test('the endings seen: CompletedEndings, a bit each (the game\'s CompletionState flags)', () => {
  const g = F.game({ ...BASE, CompletedEndings: 5 });
  assert.deepEqual(g.endings, ['weaver-queen', 'snared-silk']);
  assert.deepEqual(F.game({ ...BASE, CompletedEndings: 15 }).endings.length, 4);
  assert.deepEqual(F.gameOf(F.toSnapshot({ ...BASE, CompletedEndings: 8 })).endings, ['sister-of-the-void']);
});
