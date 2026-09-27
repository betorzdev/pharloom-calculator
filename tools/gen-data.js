#!/usr/bin/env node
/* tools/gen-data.js — generates js/data.js: Hornet's side of the game (the Needle, the Crests,
   the Tools, the Silk Skills and the other abilities, the damage modifiers, the items).
     node tools/gen-data.js          (npm run data runs it with the other generators)
   Offline: it reads kb/data/raw/ (npm run kb downloads it) and the game's text dump
   (kb/data/all_text.json, downloaded by tools/game-text.js the first time).

   Where each thing comes from:
     · names and descriptions   the game's text, by key (CLAUDE.md, "Translations"). Each Tool's key
                                is its page's {{Localisation}} CODEname + _NAME / _DESC, so the join
                                is the game's own, not a guess by name.
     · the Tools                the Tools page (colour and order), each Tool's {{SS Infobox Tool}}
                                (ammo per Tool Pouch level, refill cost), and the damage page's
                                Tools table (damage per Crafting Kit level).
     · the Crests               each Crest's {{SS Infobox Crest}} (slots) and the damage page's
                                Needle Strike table; the Vesticrest's thresholds from Eva's page.
     · the Needle, Silk Skills  the damage page's tables; the modifiers from its Modifiers table.
   The damage cells are the wiki's shorthand ("4+2+1 / 7", "2×2×4 / 16", "5 + 3×6 / 23"). They're
   read into hits, [damage, times], and the wiki's total is checked against their sum. A row whose
   shape isn't the plain one is declared in SHAPES below: a new row after a patch stops the generator
   instead of slipping in wrong. */
'use strict';
const path = require('path');
const W = require('./wiki.js');
const { names } = require('./names.js');
const { write } = require('./emit.js');

const OUT = path.join(__dirname, '..', 'js', 'data.js');
const DAMAGE = 'Damage Values and Enemy Health (Silksong)';

function fail(msg) { throw new Error('gen-data: ' + msg); }

/* ── The game's text ──────────────────────────────────────────────────── */
let N;   // tools/names.js
const text = (key, optional) => N.text(key, optional);

/* ── Damage cells ─────────────────────────────────────────────────────── */
const num = (s) => { const n = Number(String(s).trim()); if (!Number.isFinite(n)) fail(`not a number: "${s}"`); return n; };
/* "5 + 3×6" → [[5, 1], [3, 6]]; "2×2×4" → [[2, 8]]. */
function terms(s) {
  return String(s).split('+').map((t) => {
    const f = t.trim().split(/\s*[×x]\s*/).map(num);
    return [f[0], f.slice(1).reduce((a, b) => a * b, 1)];
  });
}
const sum = (hits) => hits.reduce((a, [d, n]) => a + d * n, 0);
// The Needle Strike table's "(14)" totals are checked apart (buildCrests).
const parts = (cell) => W.plain(cell).replace(/\(\d+(?:-\d+)?\)/g, '').split('/').map((s) => s.trim()).filter(Boolean);

/* The plain shapes: "17", "8+1", or "a+b… / total" with the total checked. */
function plainHits(cell, where) {
  const p = parts(cell);
  const hits = terms(p[0]);
  if (p.length === 2 && sum(hits) !== num(p[1])) fail(`${where}: "${cell}" doesn't add up to its total`);
  if (p.length > 2) fail(`${where}: "${cell}" needs a declared shape (SHAPES)`);
  return hits;
}

/* Rows that aren't the plain shape, by the row's label as the wiki writes it (its plain text).
   modes: the cell's "/" separates alternatives, one attack each, not a total.
   each: the cell is "per hit / total" and the hit count is in the label. */
const MODE_NAMES = {
  spike:  { es: 'una púa', en: 'one spike' },
  full:   { es: 'golpe completo', en: 'full hit' },
  high:   { es: 'rosario alto', en: 'high rosary' },
  low:    { es: 'rosario bajo', en: 'low rosary' },
  direct: { es: 'impacto directo', en: 'direct hit' },
  snare:  { es: 'trampa', en: 'snare' },
};
const SHAPES = {
  'Sting Shard (one spike/full hit)': { modes: ['spike', 'full'] },
  'Rosary Cannon (High/Low)': { modes: ['high', 'low'] },   // each rosary deals one of the two, at random
  'Snare Setter (direct hit/snare)': { modes: ['direct', 'snare'] },
  'Cross Stitch (per hit, 4 hits / Total)': { each: 4 },
  'Pale Nails (per hit, 3 hits / Total)': { each: 3 },
  // "per first 4 hits / 5th hit / total"
  'Thread Storm (per first 4 hits / 5th hit / Total)': {
    read: (p) => { const h = [[num(p[0]), 4], [num(p[1]), 1]]; return [h, num(p[2])]; },
  },
  // "per extra hit, max 6 hits / total", the total including the base Thread Storm's.
  'Thread Storm (Extended) (per extra hit, max 6 hits / Total)': {
    read: (p, lv, rows) => { const base = rows['Thread Storm'].hits[lv]; const h = base.concat([[num(p[0]), 6]]); return [h, num(p[1])]; },
  },
};

/* A damage table's rows as { label, target, hits: [level 0..4], modes? }. */
function damageRows(heading, levelCells = 5) {
  const out = {};
  for (const r of W.table(W.page(DAMAGE), heading)) {
    const cells = r.slice(-levelCells);
    const labelCell = r[r.length - levelCells - 1];
    if (!labelCell || !/\[\[/.test(labelCell) || cells.some((c) => !/\d/.test(c) || /^Lvl\./.test(c))) continue;
    const target = W.linkTarget(labelCell);
    const label = W.plain(labelCell);
    const shape = SHAPES[label];
    const where = `${heading} "${label}"`;
    const row = { label, target, scale: /uses Needle upgrade/i.test(label) ? 'needle' : undefined };
    if (shape && shape.modes) {
      row.modes = shape.modes.map((m, i) => ({ id: m, hits: cells.map((c) => { const p = parts(c); if (p.length !== shape.modes.length) fail(`${where}: "${c}"`); return terms(p[i]); }) }));
    } else if (shape && shape.each) {
      row.hits = cells.map((c) => { const p = parts(c); const h = [[num(p[0]), shape.each]]; if (sum(h) !== num(p[1])) fail(`${where}: "${c}"`); return h; });
    } else if (shape && shape.read) {
      row.hits = cells.map((c, lv) => { const [h, total] = shape.read(parts(c), lv, out); if (sum(h) !== total) fail(`${where}: "${c}" adds up to ${sum(h)}`); return h; });
    } else {
      row.hits = cells.map((c) => plainHits(c, where));
    }
    // A link to a section ("[[Thread Storm| Thread Storm (Extended)]]") is keyed by its label.
    const key = out[target] ? label : target;
    out[key] = row;
  }
  return out;
}

/* ── The Tools ────────────────────────────────────────────────────────── */
/* Attacks a Tool's damage rows describe that aren't the Tool's only attack, and how they're told
   apart. The names are the site's words for them; where the game has the words, they're its. */
const VARIANTS = {
  // Silkshot has no _DESC: each variant has its own.
  'Silkshot (Original)': { id: 'original', name: { es: 'Original', en: 'Original' }, desc: 'SILKSHOT_DESC_WEAVER' },   // "forma original"
  'Silkshot (Twelfth Architect) (1st+2nd+3rd hit)': { id: 'architect', name: 'ARCHITECT_SHOP_TITLE', desc: 'SILKSHOT_DESC_ARCHITECT', roundDown: true },
  'Silkshot (Forge Daughter)': { id: 'forge', name: { es: 'Hija de la Forja', en: 'Forge Daughter' }, desc: 'SILKSHOT_DESC_FORGE' },   // the Spanish is the desc's
  'Voltvessels (Spear) (needle + zap, 6 zaps / total) (Attack uses Needle upgrade)': { id: 'spear', name: { es: 'Lanza', en: 'Spear' } },   // LIGHTNING_ROD_DESC
  'Voltvessels (Bola) (orb + zap, 4 zaps / total)': { id: 'bola', name: { es: 'Boleadora', en: 'Bola' } },   // LIGHTNING_ROD_DESC
};
/* The wiki's rounding exceptions (the damage page, "Rounding"): the follow-up hits round down. */
const ROUND_DOWN = new Set(['Threefold Pin']);
/* Damage that doesn't scale with modifiers or the enemy's (the damage page, "Bonus Damage"). */
const BONUS = new Set(['Flintslate', 'Pollip Pouch']);
/* Upgraded twins and replacements: completion counts each pair once (design/00-study.md §2.4). */
const TWINS = { 'Curveclaw': 'Curvesickle', "Druid's Eye": "Druid's Eyes", 'Claw Mirror': 'Claw Mirrors' };
const STEEL = { 'Shell Satchel': "Dead Bug's Purse" };   // replaces it in Steel Soul
const LOST = new Set(['Snare Setter', 'Needle Phial']);   // taken away by Wishes (the Tools page)

function toolList() {
  // The Tools page, in its order, split by colour.
  const t = W.page('Tools');
  const out = [];
  for (const color of ['Red', 'Blue', 'Yellow']) {
    const from = t.indexOf(`== ${color} Tools ==`);
    const to = t.indexOf('\n== ', from + 5);
    const sect = t.slice(from, to);
    for (const m of sect.matchAll(/\[\[File:[^\]|]+\|link=([^\]|]+)\|72x72px\]\]/g)) {
      // Silkshot's three variants are three rows of one Tool.
      if (!out.some((x) => x.title === m[1].trim())) out.push({ title: m[1].trim(), color: color.toLowerCase() });
    }
  }
  return out;
}

/* One Tool's infobox block (a twin is its page's second block, with `2` on each field). */
function infobox(title) {
  const direct = Object.values(TWINS).includes(title) ? Object.keys(TWINS).find((k) => TWINS[k] === title) : title;
  const f = W.fields(W.templates(W.page(direct), 'SS Infobox Tool')[0]);
  const suffix = direct === title ? '' : '2';
  const get = (k) => f[k + suffix];
  const locs = W.localisations(W.page(direct));
  const loc = direct === title ? locs[0] : locs[locs.length - 1];
  return { get, code: loc.code };
}

const perLevel = (s) => {
  const p = W.plain(s).split('/').map((x) => x.trim());
  if (p.length === 5 && p.every((x) => /^\d+$/.test(x))) return p.map(Number);
  const one = /^(\d+)\b/.exec(W.plain(s));
  if (one && /No Changes/i.test(s)) return Array(5).fill(Number(one[1]));
  return null;
};

function refill(s) {
  const raw = String(s || '');
  const shards = /\{\{[Ss]\|([\d.]+)\}\}/.exec(raw);
  const rosaries = /\{\{[Rr]\|([\d.]+)\}\}/.exec(raw);
  const reserve = /File:Icon SS ([^|\]]+?) Reserve/.exec(raw);
  const r = {};
  if (shards) r.shards = Number(shards[1]);
  if (rosaries) r.rosaries = Number(rosaries[1]);
  if (reserve) r.reserve = true;   // Flea Brew and Plasmium Phial draw on their own reserve first
  return Object.keys(r).length ? r : null;
}

function buildTools(rows) {
  const tools = toolList();
  const titles = new Set(tools.map((t) => t.title));
  const used = new Set();
  const out = tools.map(({ title, color }) => {
    const box = infobox(title);
    const boxColor = W.plain(box.get('type')).toLowerCase();
    if (boxColor !== color) fail(`${title}: the Tools page says ${color}, its infobox ${boxColor}`);
    const tool = {
      id: W.slug(title), key: box.code, color,
      name: text(box.code + '_NAME'),
      desc: text(box.code + '_DESC', true) || undefined,
    };
    if (color === 'red') {
      const max = W.plain(box.get('max'));
      tool.ammo = /infinite/i.test(max) ? null : perLevel(box.get('max'));
      if (tool.ammo === undefined || (tool.ammo === null && !/infinite/i.test(max))) fail(`${title}: ammo "${box.get('max')}"`);
      tool.refill = refill(box.get('refill'));
    }
    // Its damage rows: the row for the Tool, or one per variant.
    const attacks = [];
    for (const [key, row] of Object.entries(rows)) {
      if (row.target !== title) continue;
      used.add(key);
      const v = VARIANTS[row.label];
      const base = {
        id: v ? v.id : undefined,
        name: v ? (typeof v.name === 'string' ? text(v.name) : v.name) : undefined,
        desc: v && v.desc ? text(v.desc) : undefined,
        scale: row.scale || (color === 'red' || color === 'blue' ? 'kit' : undefined),
        bonus: BONUS.has(title) || undefined,
        roundDown: (v && v.roundDown) || ROUND_DOWN.has(title) || undefined,
      };
      if (row.modes) for (const m of row.modes) attacks.push({ ...base, id: m.id, name: MODE_NAMES[m.id], hits: m.hits });
      else attacks.push({ ...base, hits: row.hits });
    }
    // Flintslate's row is its burn; its own effect is a modifier (MODIFIERS).
    if (title === 'Flintslate') attacks.forEach((a) => { a.id = 'burn'; a.scale = 'needle'; });
    if (attacks.length) tool.attacks = attacks;
    if (TWINS[title]) tool.upgrade = W.slug(TWINS[title]);
    const of = Object.keys(TWINS).find((k) => TWINS[k] === title);
    if (of) tool.upgradeOf = W.slug(of);
    if (STEEL[title]) { tool.steel = true; tool.replaces = W.slug(STEEL[title]); }
    if (LOST.has(title)) tool.lost = true;
    return tool;
  });
  for (const key of Object.keys(rows)) if (!used.has(key)) fail(`the damage page's Tools row "${key}" has no Tool on the Tools page`);
  const count = (c) => out.filter((t) => t.color === c).length;
  // 20 red + Curvesickle, 21 blue + Druid's Eyes and Claw Mirrors, 12 yellow + the Steel Soul
  // Shell Satchel (the Tools page).
  if (count('red') !== 21 || count('blue') !== 23 || count('yellow') !== 13) fail(`Tools per colour: ${count('red')} / ${count('blue')} / ${count('yellow')}`);
  if (titles.size !== out.length) fail('a Tool is listed twice');
  return out;
}

/* ── The Crests ───────────────────────────────────────────────────────── */
const CRESTS = ['Hunter', 'Reaper', 'Wanderer', 'Beast', 'Witch', 'Architect', 'Shaman'];

function buildCrests(strikes) {
  const out = CRESTS.map((c) => {
    const title = c + ' Crest';
    const t = W.page(title);
    const f = W.fields(W.templates(t, 'SS Infobox Crest')[0]);
    const n = (k) => Number(W.plain(f[k] || '0')) || 0;
    const code = W.localisations(t)[0].code;
    const row = strikes[title];
    if (!row) fail(`no Needle Strike row for ${title}`);
    // "7 (14)": the hit's damage and the total; the count is in the label, "(2 hits)" or "(2-4 hits)".
    const count = /\((\d+)(?:-(\d+))? hits\)/.exec(row.label);
    const hits = row.hits.map((h) => { if (h.length !== 1) fail(`${title}'s Needle Strike`); return [[h[0][0], count ? Number(count[2] || count[1]) : 1]]; });
    const crest = {
      id: W.slug(c), key: code,
      name: text(code + '_NAME'),
      desc: text(code + '_DESC'),
      slots: {
        skill: n('skill'),
        red: [n('red'), n('redlock')],
        blue: [n('blue'), n('bluelock')],
        yellow: [n('yellow'), n('yellowlock')],
      },
      strike: { hits, minHits: count && count[2] ? Number(count[1]) : undefined },
    };
    if (c === 'Hunter') crest.evolved = text('CREST_HUNTER_UPGRADED_DESC');
    return crest;
  });
  // The totals in the Needle Strike table, "7 (14)", are checked against hits × count.
  for (const r of W.table(W.page(DAMAGE), '=== Needle Strike ===')) {
    const crest = out.find((c) => r[0] && W.linkTarget(r[0]) === c.name.en + ' Crest');
    if (!crest) continue;
    r.slice(1).forEach((cell, lv) => {
      const total = /\(([\d]+)(?:-(\d+))?\)/.exec(cell);
      if (total && sum(crest.strike.hits[lv]) !== Number(total[2] || total[1])) fail(`${crest.name.en}'s Needle Strike total at level ${lv}`);
    });
  }
  return out;
}

/* The states that aren't Crests you pick: no game name for either, so they stay in English
   (CLAUDE.md, "Translations", rule 3; neither wiki page has a {{Localisation}} block). */
const OTHER_CRESTS = [
  { id: 'cloakless', name: { es: 'Cloakless Crest', en: 'Cloakless Crest' }, needle: 3 },   // no Needle: 3 flat, no Strike
  { id: 'cursed', name: { es: 'Cursed Crest', en: 'Cursed Crest' }, silkCap: 3 },          // silk capped at 3, Bind fails
];

function buildVesticrest() {
  const at = {};
  for (const r of W.tableWith(W.page('Eva'), 'Unlock 12 slots')) {
    const m = /Unlock (\d+) slots/.exec(r[0] || '');
    if (!m) continue;
    const what = r[1] || '';
    if (/Vesticrest/.test(what) && /Yellow/.test(what)) at.yellow = Number(m[1]);
    else if (/Vesticrest/.test(what) && /Blue/.test(what)) at.blue = Number(m[1]);
    else if (/Hunter Crest/.test(what)) at.hunter3 = Number(m[1]);
    else if (/Sylphsong/.test(what)) at.sylphsong = Number(m[1]);
  }
  if (!(at.yellow && at.blue && at.hunter3 && at.sylphsong)) fail(`Eva's thresholds: ${JSON.stringify(at)}`);
  // Slots unlocked on Crests other than the Hunter's (Eva's page).
  return { id: 'vesticrest', key: 'UI_MSG_TITLE_EXTRASLOT', name: text('UI_MSG_TITLE_EXTRASLOT_NAME'), at };
}

/* ── The Needle, Silk Skills and abilities ────────────────────────────── */
function buildNeedles() {
  const rows = W.table(W.page(DAMAGE), '=== Needle ===').filter((r) => /^\d$/.test(W.plain(r[0])));
  if (rows.length !== 5) fail('the Needle table has ' + rows.length + ' levels');
  return rows.map((r, i) => {
    const name = text('INV_NAME_NAIL' + (i + 1));
    if (W.plain(r[1]) !== name.en) fail(`Needle level ${i}: wiki "${W.plain(r[1])}", game "${name.en}"`);
    return { level: i, name, desc: text('INV_DESC_NAIL' + (i + 1)), damage: num(W.plain(r[2])) };
  });
}

const SKILLS = [
  ['silkspear', 'THROW'], ['thread-storm', 'SPHERE'], ['cross-stitch', 'PARRY'],
  ['sharpdart', 'SILKDASH'], ['rune-rage', 'SILKBOMB'], ['pale-nails', 'SILKBOSS_NEEDLE'],
];
function buildSkills(rows) {
  return SKILLS.map(([id, k]) => {
    const name = text('INV_NAME_SKILL_' + k);
    const row = rows[name.en];
    if (!row) fail(`no damage row for ${name.en}`);
    const attacks = [{ scale: 'needle', hits: row.hits }];
    if (id === 'thread-storm') attacks.push({ id: 'extended', name: { es: 'prolongada', en: 'extended' }, scale: 'needle', hits: rows['Thread Storm (Extended) (per extra hit, max 6 hits / Total)'].hits });
    // Rune Rage: the nth rune of a cast on the same enemy deals 1/n (the damage page's note).
    // Pale Nails has no INV_DESC_ key in the dump.
    return { id, key: 'INV_NAME_SKILL_' + k, name, desc: text('INV_DESC_SKILL_' + k, true) || undefined, silk: 4, attacks };
  });
}

/* The abilities: the seven that count for completion, then the rest (design/00-study.md §2.5). */
const ARTS = [
  ['needle-strike', 'INV_NAME_SKILL_CHARGESLASH', 1], ['swift-step', 'INV_NAME_SKILL_SPRINT', 1],
  ['cling-grip', 'INV_NAME_WALLJUMP', 1], ['clawline', 'INV_NAME_SKILL_HARPOON', 1],
  ['silk-soar', 'INV_NAME_SKILL_ASCENT', 1], ['sylphsong', 'INV_NAME_SKILL_EVAHEAL', 1],
  ['needolin', 'INV_NAME_SKILL_NEEDOLIN', 1],
  ['drifters-cloak', 'INV_NAME_DRESS_BROLLY', 0], ['faydown-cloak', 'INV_NAME_DRESS_DJ', 0],
  ['beastling-call', 'INV_NAME_SKILL_BELLBEAST_MELODY', 0], ['elegy-of-the-deep', 'INV_NAME_SKILL_MEMORY_MELODY', 0],
];
const buildArts = () => ARTS.map(([id, key, completion]) => {
  const desc = text(key.replace('INV_NAME_', 'INV_DESC_'), true);
  return { id, key, name: text(key), desc: desc || undefined, completion: completion ? 1 : undefined };
});

/* ── Modifiers ────────────────────────────────────────────────────────── */
/* The damage page's Modifiers table, joined to what grants each. `add` goes into the sum of
   (1 + Σ); `mul` multiplies after it (the Wanderer's critical, the page's note). */
function buildModifiers() {
  const out = [];
  let to = 'needle';
  for (const r of W.table(W.page(DAMAGE), '=== Modifiers ===')) {
    const head = W.plain(r[0]);
    if (r.length === 1) { to = /Silk Skills/.test(head) ? 'skill' : 'needle'; continue; }
    if (head === 'Source') continue;
    const target = W.linkTarget(r[0]);
    const v = W.plain(r[1]);
    const add = /^\+(\d+)%$/.exec(v), mul = /^x\s*(\d+(?:\.\d+)?)/.exec(v);
    if (!add && !mul) fail(`modifier "${head}": "${v}"`);
    const m = { to, add: add ? Number(add[1]) / 100 : undefined, mul: mul ? Number(mul[1]) : undefined };
    if (target === 'Challenge') Object.assign(m, { id: 'challenge', from: 'BUTTON_TAUNT', name: text('BUTTON_TAUNT'), firstHit: true });
    else if (/Crest$/.test(target)) {
      const crest = W.slug(target.replace(/ Crest$/, ''));
      const stage = /lvl (\d)/.exec(head);
      const id = crest + (stage ? '-focus-' + stage[1] : /Critical/.test(head) ? '-critical' : /fury/.test(head) ? '-fury' : '');
      Object.assign(m, { id, crest, stage: stage ? Number(stage[1]) : undefined });
    } else Object.assign(m, { id: W.slug(target), tool: W.slug(target) });
    out.push(m);
  }
  return out;
}

/* ── Items and counts ─────────────────────────────────────────────────── */
/* The completion items and upgrades, by the game's name for them. */
const ITEMS = [
  ['mask-shard', 'INV_NAME_HEART_PIECE_1'], ['spool-fragment', 'INV_NAME_SPOOL_PIECE_HALF'],
  ['memory-locket', 'INV_NAME_CREST_SOCKET'], ['tool-pouch', 'INV_NAME_TOOLPOUCH'],
  ['crafting-kit', 'INV_MSG_TOOLKIT'], ['pale-oil', 'INV_NAME_PLINNEY_TOOLS'],
  ['craftmetal', 'INV_NAME_TOOL_METAL'], ['everbloom', 'INV_NAME_WHITE_FLOWER'],
  ['farsight', 'INV_NAME_FARSIGHT'], ['hunters-journal', 'INV_NAME_JOURNAL'],
];
/* Their description, the inventory's: INV_DESC_ for INV_NAME_; the Crafting Kit has none of its
   own, and shares the Tool Pouch's pane text (INV_DESC_POUCHANDTOOLKIT); the Journal has none. */
const ITEM_DESC = { 'crafting-kit': 'INV_DESC_POUCHANDTOOLKIT' };
const buildItems = () => ITEMS.map(([id, key]) => ({ id, key, name: text(key),
  desc: (ITEM_DESC[id] ? text(ITEM_DESC[id], true) : text(key.replace('INV_NAME_', 'INV_DESC_'), true)) || undefined }));

/* Hornet's numbers (design/00-study.md §1, §2.6, from the wiki's Mask Shard, Spool Fragment,
   Silk, Bind and Tool Pouch & Crafting Kit pages). */
const HORNET = {
  masks: { base: 5, shards: 20, perMask: 4 },                  // 5 → 10
  silk: { base: 9, fragments: 18, perSpool: 2, extender: 3, bind: 9, skill: 4 },   // 9 → 18, 21 with the Spool Extender
  bind: { heals: 3, seconds: 1.37 },
  kit: { levels: 4, boost: 0.6 },                              // +60% per level, rounded before anything else
  pouch: { levels: 4 },
};

(async () => {
  N = await names();
  const tools = buildTools(damageRows('=== Tools ==='));
  const skills = buildSkills(damageRows('=== Silk Skills ==='));
  const crests = buildCrests(damageRows('=== Needle Strike ==='));
  const parts = [
    ['NEEDLES', buildNeedles()],
    ['CRESTS', crests],
    ['OTHER_CRESTS', OTHER_CRESTS],
    ['VESTICREST', buildVesticrest()],
    ['TOOLS', tools],
    ['SKILLS', skills],
    ['ARTS', buildArts()],
    ['MODIFIERS', buildModifiers()],
    ['ITEMS', buildItems()],
    ['HORNET', HORNET],
  ];
  const header = `js/data.js — Hornet's side of the game: the Needle, the Crests, the Tools, the Silk Skills
   and the other abilities, the damage modifiers and the items.
   GENERATED by tools/gen-data.js from kb/data/raw/ (hollowknight.wiki, fetched with npm run kb)
   and the game's text (patch 1.0.30000): not edited by hand. Change the generator and run npm run data.

     name, desc   { es, en } from the game's text; key = its key in the dump (CLAUDE.md, "Translations").
     hits         per level (0..4), a list of [damage, times]: "4+2+1" is [[4,1],[2,1],[1,1]], a Cogwork
                  Wheel is [[2,7]]. Damage per hit before the enemy's modifier and Hornet's (1 + Σ);
                  each hit is rounded on its own, half to even (the wiki's damage page).
     scale        which level applies, to the attack and to the enemy's modifier: 'kit' (the Crafting
                  Kit, for Tools) or 'needle' (the Needle, for Strikes, Silk Skills, Voltvessels'
                  spear and Flintslate's burn).
     bonus        bonus damage: ignores every modifier (Flintslate's burn, Pollip Pouch's venom).
     roundDown    the follow-up hits round down (Threefold Pin, the Twelfth Architect's Silkshot).
     ammo         per Tool Pouch level (0..4); null = no limit. refill: shards per use at a bench,
                  rosaries per shot, reserve = a reserve is spent first.
     slots        a Crest's [open, locked] per colour; locked ones open with Memory Lockets.
     strike       the Crest's Needle Strike; minHits = the Witch's hits when not all land.
     MODIFIERS    add = into (1 + Σ), mul = after it; to = 'needle' or 'skill'.`;
  const size = write(OUT, header, 'data', parts);
  console.log(`js/data.js: ${crests.length} Crests, ${tools.length} Tools, ${skills.length} Silk Skills (${(size / 1024).toFixed(1)} KB)`);
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
