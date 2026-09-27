#!/usr/bin/env node
/* tools/gen-enemies.js — generates js/enemies.js: every enemy and boss with its health, its
   black-threaded health and its five damage modifiers, and the bosses' attacks and staggers.
     node tools/gen-enemies.js          (npm run data runs it with the other generators)
   Offline: it reads kb/data/raw/ (npm run kb) and the game's text dump.

   Where each thing comes from:
     · health, modifiers   the damage page's two master tables ("Standard Enemies", "Bosses and
                           Minibosses"), one row per appearance with a Hunter's Journal number.
                           The wiki's disclaimer applies: enemies with several values (a summon
                           inside a boss fight) aren't fully explored yet.
     · names               the game's Journal names, NAME_<CODE>, by the CODEname on the row's
                           wiki page ({{Localisation}}), so the join is the game's own key.
                           A row's circumstance ("(Fighting Shakra)", "(Greymoor Arena)") is
                           written from the game's names for the place or the boss it names.
     · attacks, staggers   each boss page's "Behaviour and Tactics": the bold attack names
                           (the wiki's, in English: the game doesn't name attacks), the masks
                           from {{Damage|…}} (1 when the wiki gives none) and {{Stagger|…|hits}}. */
'use strict';
const path = require('path');
const W = require('./wiki.js');
const { names } = require('./names.js');
const { write } = require('./emit.js');

const OUT = path.join(__dirname, '..', 'js', 'enemies.js');
const DAMAGE = 'Damage Values and Enemy Health (Silksong)';

function fail(msg) { throw new Error('gen-enemies: ' + msg); }

/* ── The game's names ─────────────────────────────────────────────────── */
let N;   // tools/names.js
const gameName = (en) => N.gameName(en);

/* The words around a place or a boss in a row's circumstance. {x} is the game's name. */
const CIRCUMSTANCE = [
  [/^Fighting (.+)$/, { es: 'contra {x}', en: 'fighting {x}' }],
  [/^(.+) Arena$/, { es: 'arena de {x}', en: '{x} arena' }],
  [/^Act 3 (.+)$/, { es: '{x}, acto 3', en: '{x}, Act 3' }],
  [/^Cutscene$/, { es: 'escena', en: 'cutscene' }],
  [/^First Room$/, { es: 'primera sala', en: 'first room' }],
  [/^Pair$/, { es: 'pareja', en: 'pair' }],
  [/^In Cage$/, { es: 'enjaulada', en: 'caged' }],          // a Muckroach trapped in a cage
  [/^With Cage$/, { es: 'con jaula', en: 'with its cage' }],   // the Wardenfly that cages Hornet
  [/^Hive$/, { es: 'colmena', en: 'hive' }],
  [/^Inner$/, { es: 'sin coraza', en: 'without its shell' }],  // the Shellwood Gnat once its shell breaks
  [/^(.+)$/, { es: '{x}', en: '{x}' }],
];
function circumstance(s) {
  for (const [re, words] of CIRCUMSTANCE) {
    const m = re.exec(s);
    if (!m) continue;
    if (!m[1]) return { ...words };
    const x = gameName(m[1]);
    if (!x) fail(`"${m[1]}" (in "${s}") isn't in the game's text`);
    return { es: words.es.replace('{x}', x.es), en: words.en.replace('{x}', x.en) };
  }
  return null;
}

/* ── The master tables ────────────────────────────────────────────────── */
/* Health as the table writes it: "15 / 60" (normal / black-threaded), "- / 74" (only
   black-threaded, in Act 3), "720 + 520" (two bars at once), "650<ref…>". */
function health(cell, where) {
  const s = W.plain(cell);
  let m;
  if ((m = /^(\d+)$/.exec(s))) return { hp: Number(m[1]) };
  if ((m = /^(\d+|-) \/ (\d+)$/.exec(s))) return { hp: m[1] === '-' ? null : Number(m[1]), bt: Number(m[2]) };
  if ((m = /^(\d+) \+ (\d+)$/.exec(s))) return { hp: Number(m[1]) + Number(m[2]), bars: [Number(m[1]), Number(m[2])] };
  if (/^999999 \(1\)$/.test(s)) return { hp: null };   // Garpid: damage can't finish them; Heavy Damage does (its page)
  fail(`${where}: health "${s}"`);
}

function masterRows(heading, boss) {
  const rows = W.table(W.page(DAMAGE), heading).filter((r) => /^\d+$/.test(W.plain(r[0])));
  return rows.map((r) => {
    if (r.length !== 9) fail(`${heading}: a row with ${r.length} cells: ${r[2]}`);
    const labelCell = r[2];
    const page = W.linkTarget(labelCell);
    const label = W.plain(labelCell);
    // The circumstance: what the link's label adds to the page's name ("Wood Wasp Hive", "Lace 2"),
    // then the parenthesis after the link ("(Fighting Shakra)").
    const name = page.replace(/ \(Silksong\)$/, '');
    const shown = W.plain(labelCell.match(/\[\[[^\]]+\]\]/)[0]);
    const added = shown.startsWith(name) ? shown.slice(name.length).trim() : shown;
    const after = label.slice(shown.length).replace(/^\s*\(|\)\s*$/g, '').trim();
    // "Lace 2" is her second fight, the Cradle's (her infobox).
    const extra = [added === '2' && name === 'Lace' ? 'The Cradle' : added, after].filter(Boolean).join(' ');
    const mods = r.slice(4).map((c) => Number(W.plain(c)));
    if (mods.some((x) => !Number.isFinite(x))) fail(`${label}: modifiers ${r.slice(4)}`);
    return { hj: Number(W.plain(r[0])), page, name, label, extra, boss, ...health(r[3], label), mods };
  });
}

/* ── Boss pages: attacks and staggers ─────────────────────────────────── */
/* The masks of {{Damage|1+1|type=Void}}: [1, 1] and 'void'. */
function damage(tpl) {
  const f = tpl.split('|').map((s) => s.trim());
  const masks = f[1].split('+').map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const type = (f.find((s) => /^type\s*=/.test(s)) || '').replace(/^type\s*=\s*/, '').toLowerCase() || undefined;
  return { masks, type };
}

/* The section a bullet sits under, as the site shows it: a place or a boss by the game's name,
   "Phase n" in the site's words, anything else in the wiki's English. */
function section(h) {
  const s = W.plain(h);
  const phase = /^Phase (\d+)(?: \((.+)\))?$/.exec(s);
  if (phase) {
    const who = phase[2] ? gameName(phase[2]) || fail(`"${phase[2]}" isn't in the game's text`) : null;
    return who ? { es: `Fase ${phase[1]} (${who.es})`, en: `Phase ${phase[1]} (${who.en})` } : { es: 'Fase ' + phase[1], en: 'Phase ' + phase[1] };
  }
  const g = gameName(s);
  return g ? { es: g.es, en: g.en } : { es: s, en: s };
}

function tactics(title) {
  const t = W.page(title);
  const from = t.search(/^==\s*Behaviou?r and Tactics\s*==/m);
  if (from < 0) return null;
  const rest = t.slice(from + 5);
  const end = rest.search(/^==[^=]/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const attacks = [], staggers = [];
  let where = null;
  for (const line of body.split('\n')) {
    const h = /^={3,}\s*(.+?)\s*={3,}\s*$/.exec(line);
    if (h) {
      // Past the attacks: a tactics section's bold bullets are advice on the same attacks.
      if (/^(Tactics|Strategy|Strategies|Tips)$/i.test(W.plain(h[1]))) break;
      where = section(h[1]);
      continue;
    }
    const b = /^\*\s*<b>([^<]+)<\/b>\s*:?(.*)$/.exec(line);
    if (b) {
      const name = W.plain(b[1]).replace(/:$/, '');
      // An attack whose bullet names no damage takes 1 mask; a bullet with several {{Damage}}
      // (one per variant of the move) keeps the highest.
      const dmg = [...b[2].matchAll(/\{\{Damage\|([^}]*)\}\}/g)].map((m) => damage('Damage|' + m[1]));
      const top = dmg.sort((a, c) => c.masks.reduce((x, y) => x + y, 0) - a.masks.reduce((x, y) => x + y, 0))[0];
      if (attacks.some((a) => a.name.en === name && (a.where || {}).en === (where || {}).en)) continue;
      attacks.push({ name: { es: name, en: name }, masks: top ? top.masks : undefined, type: top ? top.type : undefined, where: where || undefined });
    }
  }
  for (const tpl of W.templates(body, 'Stagger')) {
    const f = tpl.split('|').map((s) => s.trim()).filter(Boolean);
    const hits = f.map(Number).find((n) => Number.isInteger(n) && n > 0);
    if (hits) staggers.push(hits);
  }
  return { attacks, staggers };
}

(async () => {
  N = await names();

  const rows = masterRows('=== Standard Enemies ===', false).concat(masterRows('=== Bosses and Minibosses ===', true));
  const ids = new Set();
  const foes = rows.map((r) => {
    const key = N.journalKey(r.page);
    const variant = r.extra ? circumstance(r.extra) : undefined;
    const id = W.slug(r.name + (r.extra ? ' ' + r.extra : ''));
    if (ids.has(id)) fail(`two rows make the id ${id}`);
    ids.add(id);
    return {
      id, hj: r.hj, key, name: N.text(key), variant,
      boss: r.boss || undefined, page: W.slug(r.page),
      hp: r.hp, bt: r.bt, bars: r.bars, mods: r.mods,
    };
  });

  // The attacks, per boss page (a page can have several rows: Lace's two fights, Moss Mother's three).
  const ATTACKS = {};
  for (const page of [...new Set(rows.filter((r) => r.boss).map((r) => r.page))].sort()) {
    const t = tactics(page);
    if (t && (t.attacks.length || t.staggers.length)) ATTACKS[W.slug(page)] = t;
  }

  const std = foes.filter((f) => !f.boss).length;
  const header = `js/enemies.js — every enemy and boss: health, black-threaded health, the five damage
   modifiers, and the bosses' attacks and staggers.
   GENERATED by tools/gen-enemies.js from kb/data/raw/ (hollowknight.wiki's damage page and boss
   pages, fetched with npm run kb) and the game's text (patch 1.0.30000): not edited by hand.

     FOES      one entry per row of the wiki's master tables: an enemy can appear more than once
               (Moss Mother's three fights, a summon inside a boss fight), told apart by variant.
       hj        its number in the Hunter's Journal.
       name      the game's Journal name { es, en, key }; variant = the circumstance, written from
                 the game's names for the place or the boss.
       hp / bt   health, and black-threaded health (Act 3); hp null = only met black-threaded, or
                 (Garpid) damage can't finish it. bars = bars fought at once, when there are several.
       mods      the five damage modifiers, by the level of what hits (Needle or Crafting Kit, 0..4):
                 damage = weapon[level] × mods[level] × (1 + Σ Hornet's), rounded half to even.
       page      the wiki page, the key into ATTACKS.
     ATTACKS   per boss page: attacks (name in the wiki's English, the game doesn't name attacks;
               masks = [1] per hit when the wiki gives none, [1, 1] is two masks; type = 'void',
               'fire'…; where = the fight or phase) and staggers (hits to stagger, in page order).`;
  const size = write(OUT, header, 'enemies', [['FOES', foes], ['ATTACKS', ATTACKS]]);
  console.log(`js/enemies.js: ${std} enemy rows, ${foes.length - std} boss rows, ${Object.keys(ATTACKS).length} boss pages with attacks (${(size / 1024).toFixed(1)} KB)`);
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
