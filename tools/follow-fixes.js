#!/usr/bin/env node
/* tools/follow-fixes.js: makes the Map admin's fixes (js/map-fixes.js) follow their marks when a
   generator rewrites a list they are keyed by.
   Some fixes name a mark by its place in a list ('extra:120' is js/spots.js EXTRAS[120], 'task:16'
   TASKS[16], 'piece:3' js/collectibles.js PIECES[3], 'pin:7' js/map.js PINS[7], 'shakra:2' and
   'shop:<vendor>:0' a VENDORS room, 'shop:<trader>:0' js/people.js TRADE). When a patch inserts or
   removes an entry mid-list every later index shifts, and the fix would name another mark.
   So each generator, just before it writes its file, calls follow(owner, newLists): it reads the
   file as it is now (the previous run), pairs every old entry with its new one by what it is, not
   where it is, and rewrites the fixes with the new keys, through the fixes file's own format().
   The pairing goes by tiers, from the strictest identity to the loosest (an entry's kind + check +
   room, then kind + room…): identical entries pair in order; a looser tier pairs only a lone
   leftover on each side, and says so. A fix whose mark vanished, whose pairing is ambiguous or
   whose mark changed room (the fix says where it was made) stops the run with the list of them
   and nothing written: remove or redo that fix in js/map-fixes.js (the admin mode) and run again.
   Wired in: tools/gen-collectibles.js (piece), gen-spots.js (extra, task, vendors), gen-people.js
   (traders) and, for the pins, tools/extract-map.py (node tools/follow-fixes.js map <new map.js>).
   Run by hand: node tools/follow-fixes.js <owner> <new file>   (owner: collectibles, spots, people, map) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXES_FILE = path.join(ROOT, 'js', 'map-fixes.js');
const low = (s) => (typeof s === 'string' ? s.toLowerCase() : s);

/* Who owns which lists. A list: prefix (the key without its index), items, scene(item) (the room
   the Map puts it in, for a fix to be checked against; none: not checked) and tiers:
   { id(item, index): what identifies it, loose? }, strictest first (each list's closure reads its own
   file's XY, so the old and the new side are built apart). */
const xy = (m, k) => JSON.stringify((m.XY || {})[k] || null);
const OWNERS = {
  collectibles: { file: 'js/collectibles.js', lists: (m) => [
    { prefix: 'piece:', items: m.PIECES, tiers: [{ id: (x) => [x[0], x[2]] }, { id: (x) => [x[0], x[3]], loose: true }] }] },
  spots: { file: 'js/spots.js', lists: (m) => [
    // Identical entries (the 7 Silver Bells) differ by the point the game has them at (XY).
    { prefix: 'extra:', items: m.EXTRAS, scene: (x) => x[3], tiers: [
      { id: (x, i) => [x[0], x[2], low(x[3]), xy(m, 'extra:' + i)] }, { id: (x) => [x[0], x[2], low(x[3])] }, { id: (x) => [x[0], low(x[3])], loose: true }] },
    { prefix: 'task:', items: m.TASKS, scene: (x) => x[3], tiers: [
      { id: (x, i) => [x[0], x[1], x[2], low(x[3]), xy(m, 'task:' + i)] }, { id: (x) => [x[0], x[1], x[2], low(x[3])] }, { id: (x) => [x[0], x[1], low(x[3])], loose: true }] },
    ...Object.entries(m.VENDORS).map(([v, scenes]) => ({
      prefix: v === 'shakra' ? 'shakra:' : 'shop:' + v + ':', items: scenes, scene: (s) => s, tiers: [{ id: (s) => [low(s)] }] }))] },
  people: { file: 'js/people.js', lists: (m) => m.TRADE.map((x) => ({
    prefix: 'shop:' + x.id + ':', items: x.spots, scene: (s) => s[0], tiers: [{ id: (s) => [low(s[0])] }] })) },
  map: { file: 'js/map.js', lists: (m) => [
    { prefix: 'pin:', items: m.PINS, scene: (p) => p[3], tiers: [{ id: (p) => [p[0], low(p[3]), p[1], p[2]] }, { id: (p) => [p[0], low(p[3])], loose: true }] }] },
};

/* Old index → new index, tier by tier (a tier: { id(item, index) → what identifies it, loose? }).
   Entries with the same identity on both sides pair in order when there are as many of them; a
   loose tier pairs only a lone leftover each side, and its pairs are reported. → { to, how } */
function pair(oldList, newList) {
  const oldItems = oldList.items, newItems = newList.items;
  const to = new Map(), how = new Map(), usedN = new Set();
  newList.tiers.forEach((tier, t) => {
    const groups = new Map();
    const at = (k) => groups.get(k) || groups.set(k, { o: [], n: [] }).get(k);
    oldItems.forEach((x, i) => { if (!to.has(i)) at(JSON.stringify(oldList.tiers[t].id(x, i))).o.push(i); });
    newItems.forEach((x, j) => { if (!usedN.has(j)) at(JSON.stringify(tier.id(x, j))).n.push(j); });
    for (const g of groups.values()) {
      if (g.o.length !== g.n.length || (tier.loose && g.o.length !== 1)) continue;
      g.o.forEach((i, k) => { to.set(i, g.n[k]); usedN.add(g.n[k]); how.set(i, { loose: !!tier.loose, of: g.o.length }); });
    }
  });
  return { to, how };
}

const brief = (x) => JSON.stringify(x).slice(0, 150);

/* The fixes ({ moved, hidden }) rekeyed from the old lists to the new ones (both: the owner's
   lists(), each { prefix, items, scene?, tiers }). → { fixes, changes: [{ part, from, to, loose, of }] };
   throws, listing every fix that can't follow. Keys of no list here are left as they are. */
function follow(fixes, oldLists, newLists) {
  const out = { moved: {}, hidden: {} }, changes = [], problems = [];
  const keyOf = (key) => {
    for (const l of oldLists) {
      if (!key.startsWith(l.prefix)) continue;
      const rest = key.slice(l.prefix.length);
      if (/^\d+$/.test(rest)) return { list: l, i: Number(rest) };
    }
    return null;
  };
  const pairs = new Map();   // prefix → pair()
  for (const part of ['moved', 'hidden']) {
    for (const [key, val] of Object.entries(fixes[part] || {})) {
      const k = keyOf(key);
      if (!k) { out[part][key] = val; continue; }
      const { list, i } = k;
      const old = list.items[i];
      const fail = (why, extra) => problems.push(`${part} ${key}: ${why}${old === undefined ? '' : '\n      was ' + brief(old)}${extra ? '\n      ' + extra : ''}`);
      if (old === undefined) { fail(`the previous list has no entry ${i} (${list.items.length} entries): the fix was stale already`); continue; }
      const now = newLists.find((l) => l.prefix === list.prefix);
      if (!now) { fail('the list is gone'); continue; }
      if (!pairs.has(list.prefix)) pairs.set(list.prefix, pair(list, now));
      const { to, how } = pairs.get(list.prefix);
      if (!to.has(i)) {
        const sc = now.scene && now.scene(old);
        const near = sc === undefined ? [] : now.items.map((x, j) => [x, j]).filter(([x]) => low(now.scene(x)) === low(sc)).slice(0, 4).map(([x, j]) => `${list.prefix}${j} ${brief(x)}`);
        fail('the mark is gone or ambiguous (no entry, or several, is the same thing now)', near.length ? 'in the same room now: ' + near.join(' | ') : '');
        continue;
      }
      const j = to.get(i), neu = now.items[j];
      const fixed = part === 'moved' ? val[2] : val;
      if (now.scene && now.scene(neu) !== fixed) { fail(`the mark is in another room now (${now.scene(neu)}, the fix was made in ${fixed})`, `now ${list.prefix}${j} ${brief(neu)}`); continue; }
      const nk = list.prefix + j;
      if (nk in out[part]) { fail(`two fixes follow to ${nk}`); continue; }
      out[part][nk] = val;
      const h = how.get(i);
      if (j !== i || h.loose) changes.push({ part, from: key, to: nk, loose: h.loose, of: h.of, old, neu });
    }
  }
  if (problems.length) {
    throw new Error(`js/map-fixes.js: ${problems.length} fix${problems.length === 1 ? '' : 'es'} can't follow the regenerated lists, nothing written.\n`
      + problems.map((p) => '  ' + p).join('\n')
      + '\n  Remove or redo them in js/map-fixes.js (the Map admin mode, #view=map&admin=1), then run it again.');
  }
  return { fixes: out, changes };
}

// A file's exports, read fresh and with a SS of its own, so the page's modules never mix with the generator's.
function load(file) {
  const abs = path.resolve(file), prev = globalThis.SS;
  globalThis.SS = {};
  try { delete require.cache[abs]; return require(abs); } finally { delete require.cache[abs]; globalThis.SS = prev; }
}
const plain = (v) => JSON.parse(JSON.stringify(v));

// The fixes file's new text: FIXES as format() writes it, the rest (the header, format itself) as it is.
function withFixes(text, fixes, MF) {
  const open = text.indexOf('  const FIXES = {'), close = text.indexOf('\n  };', open);
  if (open < 0 || close < 0) throw new Error('js/map-fixes.js has lost its shape');
  return text.slice(0, open) + MF.format(fixes) + text.slice(close + '\n  };'.length);
}

/* What a generator calls right before it writes its file: `newMod` holds what it is about to write
   (the owner's names: EXTRAS, TASKS, VENDORS / PIECES / TRADE / PINS). The previous file is still
   on disk. Prints what it rekeyed. */
function run(owner, newMod, { fixesFile = FIXES_FILE, oldMod } = {}) {
  const O = OWNERS[owner];
  if (!O) throw new Error(`follow-fixes: unknown owner ${owner}`);
  const MF = load(fixesFile);
  const before = oldMod || (fs.existsSync(path.join(ROOT, O.file)) ? load(path.join(ROOT, O.file)) : null);
  if (!before) return { changes: [] };
  const { fixes, changes } = follow(MF.FIXES, O.lists(plain(before)), O.lists(plain(newMod)));
  const text = fs.readFileSync(fixesFile, 'utf8'), next = withFixes(text, fixes, MF);
  if (next !== text) fs.writeFileSync(fixesFile, next);
  if (changes.length) {
    console.log(`js/map-fixes.js  ${changes.length} fix${changes.length === 1 ? '' : 'es'} followed their marks (${O.file}):`);
    for (const c of changes) console.log(`  ${c.from} -> ${c.to}${c.loose ? '   WARNING: matched only by a looser identity, its check or details changed: ' + brief(c.old) + ' => ' + brief(c.neu) : c.of > 1 ? `   (one of ${c.of} identical, by order)` : ''}`);
  }
  return { changes };
}

module.exports = { follow, pair, run, withFixes, OWNERS };

// node tools/follow-fixes.js <owner> <the new file>: for the generators that aren't JavaScript.
if (require.main === module) {
  const [owner, file] = process.argv.slice(2);
  if (!OWNERS[owner] || !file) { console.error('usage: node tools/follow-fixes.js <collectibles|spots|people|map> <new file>'); process.exit(2); }
  try { run(owner, load(file)); } catch (e) { console.error(e.message); process.exit(1); }
}
