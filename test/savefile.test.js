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
  assert.deepEqual(m, { version: '1.0.30000', time: 3661.5, completion: 93, rosaries: 2100, shards: 350, steel: true });
  assert.deepEqual(F.meta({}), { version: '', time: 0, completion: 0, rosaries: 0, shards: 0, steel: false });
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
