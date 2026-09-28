/* js/savefile.js — a real game, imported: the game's save file turned into what the site keeps.
   Pure: bytes in, the save's JSON out, no DOM and no language. The interface picks the error's
   words. read() opens the file, meta() says what the game's profile screen says, and game()
   sums up the save in the site's own ids (js/collectibles.js has the save's names).

   The file. Silksong saves each profile as user1.dat … user4.dat, exactly as Hollow Knight
   does: a .NET BinaryFormatter header (22 bytes), the string's length (7 bits per byte), the
   string in base64, and a last byte 0x0B. The base64 is the save's JSON encrypted with AES-256
   in ECB mode and PKCS7 padding, with the same fixed key as Hollow Knight's (checked on
   27-Sep-2026 in two independent readers: silksong-completionist's codec.ts and apocalyptech's
   silksong-save-decrypt; see design/00-study.md §4.3). AES is written here, not taken from
   crypto.subtle: that one doesn't do ECB and isn't there over file://. A save that is already
   JSON (a Switch dump, or one decrypted with an editor) is read as it is. Beside user#.dat the
   game keeps user#.dat.bak1, user#_<patch>.dat (the save as it was before a patch), shared.dat
   and, in Restore_Points#/, restoreData#.dat: a restore point wraps a whole user#.dat (below).

   The JSON is { playerData, sceneData }. playerData's scalars (playTime, completionPercentage,
   geo —the rosaries—, ShellShards, permadeathMode, silk, maxHealth, silkMax, nailUpgrades) sit
   at the top; the collections are lists of { Name, Data } under savedData (Tools, ToolEquips,
   Collectables, Relics, MateriumCollected, QuestCompletionData, MementosDeposited); the Journal
   is EnemyJournalKillData.list[{ Name, Record: { Kills } }]; scenesVisited lists scene names;
   sceneData.persistentBools / persistentInts / geoRocks .serializedList[{ SceneName, ID, Value }]
   hold the rooms' state. All of it checked on 92 real saves (the author's, 0% to 100%, patches
   1.0.28891 to 1.0.30000, Steel Soul among them): npm run check-pack. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const CO = SS.collectibles || require('./collectibles.js');
  const GA = SS.gauntlets || require('./gauntlets.js');

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
  function read(bytes, depth = 0) {
    const text = unwrap(bytes);
    let json = null;
    try { json = text && JSON.parse(text); } catch (e) { json = null; }
    if (!json || typeof json !== 'object') return { ok: false, error: 'unreadable' };
    /* A restore point (restoreData#.dat) wraps a whole user#.dat: { data, date, version, number,
       identifier }, data being that file's bytes in base64 and identifier the event that wrote
       it (GAINED_MELODY_CONDUCTOR…). Seen on real saves, 27-Sep-2026. */
    if (typeof json.data === 'string' && !json.playerData && depth === 0) {
      const inner = base64(json.data);
      if (!inner) return { ok: false, error: 'unreadable' };
      const r = read(inner, 1);
      return r.ok ? { ...r, restore: restoreOf(json) } : r;
    }
    // Inside a restore point the save comes one level down, as { saveGameData: { playerData, sceneData } }.
    if (json.saveGameData && typeof json.saveGameData === 'object' && !json.playerData) json = json.saveGameData;
    const pd = json.playerData;
    if (!pd || typeof pd !== 'object' || typeof pd.silk !== 'number') return { ok: false, error: 'notSave' };
    // The rooms' state (what's been picked up, broken, opened): the collectibles are read from it.
    const sd = json.sceneData && typeof json.sceneData === 'object' ? json.sceneData : null;
    return { ok: true, pd, sd };
  }

  // A restore point's label: its number, the day it was written (yyyy/mm/dd) and the event.
  const restoreOf = (j) => ({
    number: Number.isInteger(j.number) ? j.number : null,
    date: typeof j.date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(j.date) ? j.date : '',
    event: typeof j.identifier === 'string' && /^[A-Z0-9_]{1,64}$/.test(j.identifier) ? j.identifier : '',
  });

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
    dead: int(pd.permadeathMode) === 2,   // a Steel Soul game lost: the profile says «Derrota»
  });

  /* ── The save in the site's ids ────────────────────────────────────────── */
  // The flags the game keeps per Silk Skill and per ability (playerData.has*), by the site's ids
  // (js/data.js). The Silk Skills are counted by these and not by the Tools list, which a
  // restore point can write a moment before the Skill is in it.
  const SKILL_PD = { silkspear: 'hasNeedleThrow', 'thread-storm': 'hasThreadSphere', 'cross-stitch': 'hasParry',
    sharpdart: 'hasSilkCharge', 'rune-rage': 'hasSilkBomb', 'pale-nails': 'hasSilkBossNeedle' };
  const ART_PD = { 'needle-strike': 'hasChargeSlash', 'swift-step': 'hasDash', 'cling-grip': 'hasWalljump',
    clawline: 'hasHarpoonDash', 'silk-soar': 'hasSuperJump', sylphsong: 'HasBoundCrestUpgrader', needolin: 'hasNeedolin',
    'drifters-cloak': 'hasBrolly', 'faydown-cloak': 'hasDoubleJump',
    // Found on the restore points GAINED_MELODY_BEAST and GAINED_MELODY_DEEP (27-Sep-2026).
    'beastling-call': 'UnlockedFastTravelTeleport', 'elegy-of-the-deep': 'hasNeedolinMemoryPowerup' };

  /* The Silk Skills by their names in the save's Tools and Crest slots (the completionist's
     abilities: "Thread Sphere" is Thread Storm), for the build equipped. */
  const SKILL_SAVE = { 'Silk Spear': 'silkspear', 'Thread Sphere': 'thread-storm', Parry: 'cross-stitch',
    'Silk Charge': 'sharpdart', 'Silk Bomb': 'rune-rage', 'Silk Boss Needle': 'pale-nails' };
  const TOOL_OF = new Map();
  for (const [id, names] of Object.entries(CO.TOOLS)) for (const n of names) TOOL_OF.set(n, id);
  const CREST_OF = new Map(Object.entries(CO.CRESTS).map(([id, n]) => [n, id]));

  /* What Hornet wears now: playerData.CurrentCrestID ("Hunter_v2": the Hunter at its second
     stage), that Crest's slots in ToolEquips (each { EquippedTool, IsUnlocked }; the Tools and
     the Silk Skill in them) and the Vesticrest's (ExtraToolEquips). Checked on the author's
     saves, 27-Sep-2026. */
  function buildOf(pd) {
    const cur = typeof pd.CurrentCrestID === 'string' ? pd.CurrentCrestID : '';
    const m = /^(.*?)(?:_v(\d))?$/.exec(cur);
    const crest = CREST_OF.get(m[1]) || null;
    if (!crest) return null;
    const slots = (list(pd.ToolEquips).find((e) => e.Name === cur) || { Data: {} }).Data.Slots;
    const worn = [...(Array.isArray(slots) ? slots : []), ...list(pd.ExtraToolEquips).map((e) => e.Data || {})]
      .map((x) => (x && typeof x.EquippedTool === 'string' ? x.EquippedTool : '')).filter(Boolean);
    return {
      crest, hunterStage: crest === 'hunter' ? Number(m[2]) || 1 : 1,
      tools: [...new Set(worn.map((n) => TOOL_OF.get(n)).filter(Boolean))],
      skill: worn.map((n) => SKILL_SAVE[n]).find(Boolean) || null,
      vest: { yellow: pd.UnlockedExtraYellowSlot === true, blue: pd.UnlockedExtraBlueSlot === true },
    };
  }

  const list = (v) => (v && Array.isArray(v.savedData) ? v.savedData : []);
  const named = (v) => { const m = new Map(); for (const e of list(v)) if (e && !m.has(e.Name)) m.set(e.Name, e.Data || {}); return m; };

  /* playerData and sceneData → what the site keeps of a game, in its own ids:
       tools, crests      owned (IsUnlocked), by js/collectibles.js's names
       skills, arts       the has* flags above
       masks, spools      whole ones gained (maxHealthBase − 5, silkMax − 9), as the game counts them
       hearts             Silk Hearts (silkRegenMax); needle, kit, pouch: the three upgrade ladders
       everbloom          the White Flower in Collectables
       pieces             the indices of js/collectibles.js's PIECES found
       wishes             the indices of its WISHES done (the pane «Tareas»)
       gauntlets          the ids of js/gauntlets.js's enemy gauntlets cleared (each one's done)
       journal            { entry id: kills } for every entry the save lists
       act                1, 2 from act2Started, 3 once the world is black-threaded (blackThreadWorld)
       bench, area        where Hornet rests (respawnScene) and the area she's in (currentArea)
       build              what she wears (buildOf): { crest, hunterStage, tools, skill, vest }, or null */
  function game(pd, sd = null) {
    const tools = named(pd.Tools), crests = named(pd.ToolEquips), quests = named(pd.QuestCompletionData);
    const bools = new Map();
    for (const e of (sd && sd.persistentBools && Array.isArray(sd.persistentBools.serializedList) ? sd.persistentBools.serializedList : [])) {
      const k = e.SceneName + '\u0000' + e.ID;
      if (!bools.has(k)) bools.set(k, e.Value);
    }
    const visited = new Set(Array.isArray(pd.scenesVisited) ? pd.scenesVisited : []);
    const kills = new Map((pd.EnemyJournalKillData && Array.isArray(pd.EnemyJournalKillData.list) ? pd.EnemyJournalKillData.list : [])
      .map((e) => [e.Name, e.Record ? int(e.Record.Kills) : 0]));
    const has = (c) => {
      switch (c[0]) {
        case 'flag': return !!pd[c[1]];
        case 'min': return (Number(pd[c[1]]) || 0) >= c[2];
        case 'quest': return !!(quests.get(c[1]) || {}).IsCompleted;
        case 'bool': return !!bools.get(c[1] + '\u0000' + c[2]);
        case 'visited': return visited.has(c[1]);
        case 'journal': return kills.has(c[1]);   // the entry is listed (seen)
        case 'any': return c.slice(1).some(has);
        case 'all': return c.slice(1).every(has);
        case 'not': return !has(c[1]);
        default: return false;
      }
    };
    const whole = (v, base) => Math.max(0, int(v) - base);
    const journal = {};
    for (const [id, name] of Object.entries(CO.JOURNAL)) if (kills.has(name)) journal[id] = Math.max(0, kills.get(name));
    const flower = (named(pd.Collectables).get('White Flower') || {}).Amount;
    return {
      tools: Object.keys(CO.TOOLS).filter((id) => CO.TOOLS[id].some((n) => (tools.get(n) || {}).IsUnlocked)),
      crests: Object.keys(CO.CRESTS).filter((id) => (crests.get(CO.CRESTS[id]) || {}).IsUnlocked),
      skills: Object.keys(SKILL_PD).filter((id) => pd[SKILL_PD[id]] === true),
      arts: Object.keys(ART_PD).filter((id) => pd[ART_PD[id]] === true),
      masks: whole(pd.maxHealthBase, 5), spools: whole(pd.silkMax, 9), hearts: whole(pd.silkRegenMax, 0),
      needle: Math.min(4, whole(pd.nailUpgrades, 0)), kit: Math.min(4, whole(pd.ToolKitUpgrades, 0)),
      pouch: Math.min(4, whole(pd.ToolPouchUpgrades, 0)),
      everbloom: int(flower) > 0,
      pieces: CO.PIECES.map((p, i) => (has(p[2]) ? i : -1)).filter((i) => i >= 0),
      wishes: CO.WISHES.map((w, i) => (has(w[2]) ? i : -1)).filter((i) => i >= 0),
      gauntlets: GA.GAUNTLETS.filter((x) => has(x.done)).map((x) => x.id),
      journal,
      act: pd.blackThreadWorld === true ? 3 : pd.act2Started === true ? 2 : 1,
      bench: typeof pd.respawnScene === 'string' && /^[\w ()-]{1,64}$/.test(pd.respawnScene) ? pd.respawnScene : '',
      area: typeof pd.currentArea === 'string' && /^[A-Z_]{1,32}$/.test(pd.currentArea) ? pd.currentArea : '',
      build: buildOf(pd) || {},
    };
  }

  /* ── A slot's keys (js/saves.js) ──────────────────────────────────────
     A game is kept in four keys, the ones js/saves.js moves between slots:
       pharloom.owned     { tools, crests, skills, arts }: what the Crest screen can equip
       pharloom.journal   { entry id: kills }
       pharloom.progress  the rest of game(): masks, spools, hearts, needle, kit, pouch,
                          everbloom, pieces, wishes, gauntlets, act, bench, area
       pharloom.meta      what the profile screen shows (meta()) and when the file was saved
     toSnapshot() writes them; gameOf() reads them back into one game, with the same defaults as
     an empty game for anything missing or damaged. */
  const OWNED = ['tools', 'crests', 'skills', 'arts'];
  /* The pieces go into a slot by a key that says what they are (the kind and where the save
     keeps them), not by their place in js/collectibles.js: a list regenerated after a patch
     (new pieces, another order) still finds the ones a slot saved before it. */
  const pieceKey = (p) => p[0] + ' ' + JSON.stringify(p[2]);
  const KEY_AT = new Map(CO.PIECES.map((p, i) => [pieceKey(p), i]));
  const WISH_AT = new Map(CO.WISHES.map((w, i) => [pieceKey(w), i]));
  function toSnapshot(pd, sd = null, saved = null) {
    const g = game(pd, sd);
    const progress = { ...g, pieces: g.pieces.map((i) => pieceKey(CO.PIECES[i])), wishes: g.wishes.map((i) => pieceKey(CO.WISHES[i])) };
    for (const k of [...OWNED, 'journal']) delete progress[k];
    const m = meta(pd);
    return {
      'pharloom.owned': JSON.stringify(Object.fromEntries(OWNED.map((k) => [k, g[k]]))),
      'pharloom.journal': JSON.stringify(g.journal),
      'pharloom.progress': JSON.stringify(progress),
      'pharloom.meta': JSON.stringify({ ...m, saved: Number.isFinite(saved) && saved > 0 ? saved : null }),
    };
  }
  const EMPTY = Object.freeze({ tools: [], crests: [], skills: [], arts: [], journal: {}, masks: 0, spools: 0, hearts: 0,
    needle: 0, kit: 0, pouch: 0, everbloom: false, pieces: [], wishes: [], gauntlets: [], act: 1, bench: '', area: '', build: {} });
  const parse = (v) => { try { const x = JSON.parse(v); return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; } catch (e) { return {}; } };
  // Each field only if it has the type an empty game gives it.
  function gameOf(snap) {
    const s = snap || {};
    const src = { ...parse(s['pharloom.owned']), ...parse(s['pharloom.progress']), journal: parse(s['pharloom.journal']) };
    const out = {};
    for (const [k, def] of Object.entries(EMPTY)) {
      const v = src[k];
      const ok = Array.isArray(def) ? Array.isArray(v) : typeof v === typeof def && v !== null;
      out[k] = ok ? v : (Array.isArray(def) ? [] : typeof def === 'object' ? {} : def);
    }
    // The pieces by their keys → today's places in the list; a key the list no longer has is dropped.
    out.pieces = out.pieces.map((k) => KEY_AT.get(k)).filter((i) => i !== undefined);
    out.wishes = out.wishes.map((k) => WISH_AT.get(k)).filter((i) => i !== undefined);
    // The gauntlets go by their ids, the wiki's subpages: one the list no longer has is dropped.
    out.gauntlets = out.gauntlets.filter((id) => GA.GAUNTLETS.some((x) => x.id === id));
    return out;
  }
  const metaOf = (snap) => ({ version: '', time: 0, completion: 0, rosaries: 0, shards: 0, steel: false, dead: false, saved: null,
    ...parse((snap || {})['pharloom.meta']) });

  SS.savefile = { SKILL_PD, ART_PD, decrypt, unwrap, read, meta, game, toSnapshot, gameOf, metaOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.savefile;
})();
