/* js/savefile.js — a real game, imported: the game's save file turned into what the site keeps.
   Pure: bytes in, the save's JSON out, no DOM and no language. The interface picks the error's
   words. The mapping from playerData to a slot's snapshot (toSnapshot) arrives in phase 2,
   with js/completion.js and js/progress.js; for now read() and meta().

   The file. Silksong saves each profile as user1.dat … user4.dat, exactly as Hollow Knight
   does: a .NET BinaryFormatter header (22 bytes), the string's length (7 bits per byte), the
   string in base64, and a last byte 0x0B. The base64 is the save's JSON encrypted with AES-256
   in ECB mode and PKCS7 padding, with the same fixed key as Hollow Knight's (checked on
   27-Sep-2026 in two independent readers: silksong-completionist's codec.ts and apocalyptech's
   silksong-save-decrypt; see design/00-study.md §4.3). AES is written here, not taken from
   crypto.subtle: that one doesn't do ECB and isn't there over file://. A save that is already
   JSON (a Switch dump, or one decrypted with an editor) is read as it is. Beside user#.dat the
   game keeps user#.dat.bak1, restoreData#.dat autosaves and shared.dat; all four read the same.

   The JSON is { playerData, sceneData }. playerData's scalars (playTime, completionPercentage,
   geo —the rosaries—, ShellShards, permadeathMode, silk, maxHealth, silkMax, nailUpgrades) sit
   at the top; the collections are lists of { Name, Data } under savedData (Tools, ToolEquips,
   Collectables, Relics, MateriumCollected, QuestCompletionData, MementosDeposited); the Journal
   is EnemyJournalKillData.list[{ Name, Record: { Kills } }]; scenesVisited lists scene names;
   sceneData.persistentBools / persistentInts / geoRocks .serializedList[{ SceneName, ID, Value }]
   hold the rooms' state. The field names come from the trackers' source (th3r3dfox's
   save-data.ts, Br3zzly's saveValidation.ts), not from a real save yet: check-pack (phase 2)
   confirms them against the game's own figures. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

  const KEY = 'UKu52ePUBwetZ9wNX88o54dnfKRu0T1l';
  const HEADER = [0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0];

  /* ── AES-256, decryption only (FIPS-197) ─────────────────────────────── */
  const SBOX = new Uint8Array(256), INV = new Uint8Array(256);
  const xt = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;
  const mul = (a, b) => { let r = 0; for (; b; b >>= 1, a = xt(a)) if (b & 1) r ^= a; return r; };
  (() => {
    // The S-box from the multiplicative inverse in GF(2^8) and the affine transform.
    for (let i = 0; i < 256; i++) {
      let inv = 0;
      if (i) for (let j = 1; j < 256; j++) if (mul(i, j) === 1) { inv = j; break; }
      let s = inv;
      for (let k = 1; k < 5; k++) s ^= ((inv << k) | (inv >> (8 - k))) & 0xff;
      SBOX[i] = s ^ 0x63;
      INV[SBOX[i]] = i;
    }
  })();
  const M9 = new Uint8Array(256), M11 = new Uint8Array(256), M13 = new Uint8Array(256), M14 = new Uint8Array(256);
  for (let i = 0; i < 256; i++) { M9[i] = mul(i, 9); M11[i] = mul(i, 11); M13[i] = mul(i, 13); M14[i] = mul(i, 14); }

  // The 15 round keys of a 32-byte key, as 240 bytes.
  function expandKey(key) {
    const w = new Uint8Array(240);
    w.set(key);
    let rcon = 1;
    for (let i = 32; i < 240; i += 4) {
      let t = w.slice(i - 4, i);
      if (i % 32 === 0) {
        t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
        rcon = xt(rcon);
      } else if (i % 32 === 16) t = t.map((b) => SBOX[b]);
      for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
    }
    return w;
  }

  function decryptBlock(rk, src, off, out) {
    const s = src.slice(off, off + 16);
    const add = (r) => { for (let i = 0; i < 16; i++) s[i] ^= rk[r * 16 + i]; };
    const invShiftSub = () => {
      const t = s.slice();
      // Column-major state: row r of column c is s[4c + r]; row r moves r columns to the right.
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[4 * ((c + r) % 4) + r] = INV[t[4 * c + r]];
    };
    add(14);
    for (let r = 13; r >= 1; r--) {
      invShiftSub();
      add(r);
      for (let c = 0; c < 16; c += 4) {
        const a = s[c], b = s[c + 1], d = s[c + 2], e = s[c + 3];
        s[c] = M14[a] ^ M11[b] ^ M13[d] ^ M9[e];
        s[c + 1] = M9[a] ^ M14[b] ^ M11[d] ^ M13[e];
        s[c + 2] = M13[a] ^ M9[b] ^ M14[d] ^ M11[e];
        s[c + 3] = M11[a] ^ M13[b] ^ M9[d] ^ M14[e];
      }
    }
    invShiftSub();
    add(0);
    out.set(s, off);
  }

  const bytesOf = (str) => Uint8Array.from(str, (ch) => ch.charCodeAt(0) & 0xff);
  const ROUND_KEYS = expandKey(bytesOf(KEY));

  // AES-256-ECB and PKCS7 → the plain bytes, or null if the padding doesn't check out.
  function decrypt(bytes) {
    if (!bytes.length || bytes.length % 16) return null;
    const out = new Uint8Array(bytes.length);
    for (let off = 0; off < bytes.length; off += 16) decryptBlock(ROUND_KEYS, bytes, off, out);
    const pad = out[out.length - 1];
    if (pad < 1 || pad > 16) return null;
    for (let i = out.length - pad; i < out.length; i++) if (out[i] !== pad) return null;
    return out.subarray(0, out.length - pad);
  }

  function base64(str) {
    const clean = str.replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return null;
    try { return bytesOf(atob(clean)); } catch (e) { return null; }
  }

  const utf8 = (bytes) => new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');

  /* The file's bytes → its JSON text, or null. First as the PC's .dat; if the header isn't
     there, as JSON as it is. */
  function unwrap(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (HEADER.every((x, i) => b[i] === x)) {
      let len = 0, shift = 0, i = HEADER.length;
      for (; i < b.length && i < HEADER.length + 5; i++, shift += 7) {
        len |= (b[i] & 0x7f) << shift;
        if (!(b[i] & 0x80)) { i++; break; }
      }
      const raw = base64(utf8(b.subarray(i, i + len)));
      const plain = raw && decrypt(raw);
      return plain ? utf8(plain) : null;
    }
    const text = utf8(b).trim();
    return text.startsWith('{') ? text : null;
  }

  /* The file → { ok: true, pd, sd } or { ok: false, error }, error being 'unreadable' (not a save
     from the game: it can't be decrypted or isn't JSON) or 'notSave' (JSON, but without a
     playerData that looks like Hornet's: silk is the one number every Silksong save carries). */
  function read(bytes) {
    const text = unwrap(bytes);
    let json = null;
    try { json = text && JSON.parse(text); } catch (e) { json = null; }
    if (!json || typeof json !== 'object') return { ok: false, error: 'unreadable' };
    const pd = json.playerData;
    if (!pd || typeof pd !== 'object' || typeof pd.silk !== 'number') return { ok: false, error: 'notSave' };
    // The rooms' state (what's been picked up, broken, opened): the collectibles are read from it.
    const sd = json.sceneData && typeof json.sceneData === 'object' ? json.sceneData : null;
    return { ok: true, pd, sd };
  }

  const int = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);
  /* What the game's own profile screen shows of a save: the time played (playTime, in seconds),
     the completion (completionPercentage, the game's own figure, which check-pack compares
     against), the rosaries (geo, as the code still calls them), the shell shards, whether it's
     Steel Soul (permadeathMode 1, or 2 once Hornet has died in it) and the game's version. */
  const meta = (pd) => ({
    version: typeof pd.version === 'string' && /^[0-9.]{1,24}$/.test(pd.version) ? pd.version : '',
    time: Math.max(0, Number(pd.playTime) || 0),
    completion: Math.max(0, Number(pd.completionPercentage) || 0),
    rosaries: Math.max(0, int(pd.geo)),
    shards: Math.max(0, int(pd.ShellShards)),
    steel: int(pd.permadeathMode) > 0,
  });

  SS.savefile = { decrypt, unwrap, read, meta };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.savefile;
})();
