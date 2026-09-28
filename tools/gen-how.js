#!/usr/bin/env node
/* tools/gen-how.js: generates js/how.js: how to get each thing of the 100%, as data, no prose.
     node tools/gen-how.js     (npm run data runs it with the other generators)
   Offline. The things are the Progress screen's (js/app-progress.js things()): the 51 counted
   Tools (js/collectibles.js COUNTED, by each group's first id), the Crests, Silk Skills and
   abilities of js/completion.js, the pieces of js/collectibles.js PIECES that count (Mask
   Shards, Spool Fragments, Crafting Kit, Tool Pouch, Needle, Silk Hearts) and the Everbloom.

   Each gets its ways, best source first:
     1. the game's files (js/shop.js, tools/extract-shops.py): what a vendor sells, and what a
        wish gives by itself (a Quest's rewardItem);
     2. the save's own checks (js/collectibles.js PIECES, from the completionist): a piece checked
        by a wish is that wish's; by a Purchased… flag, the SHOP item that sets it; by a room's
        persistent bool (Heart Piece, Silk Spool), lying in that room;
     3. the wiki: the bosses' infobox drops (js/enemies.js BOSSES) and the Wishes page's rewards
        ({{TaskEntry}} reward =), joined by the game's names;
     4. HAND, below: what no structured source says (a Weaver spire's Silk Skill is "found", a
        craft table's Tool is "craft"), each read from the wiki's "How to Acquire" or its Tools
        table and the completionist, and noted.
   The sources are set against each other: the completionist's prices ("Sold by X for N
   Rosaries") against the game's, the wiki's wish rewards against the game's, the wiki's Needle
   prices against costs.bundle. A disagreement is printed; a name that doesn't join stops it.

   What it writes (all ids are the site's):
     NPCS    npc id → the game's name { es, en, key } (the vendors and the NPCs who give things)
     HOW     { tools, crests, skills, arts: { id: [way…] }, pieces: { PIECES index: [way…] },
             everbloom: [way…] }, the ways in the order to show them, each one of:
               { kind: 'shop', vendor, price, item, craftmetal?, paleOil?, act?, after?, needs? }
                 price in rosaries; item the game's ShopItem (js/shop.js SHOP); craftmetal and
                 paleOil what it also takes; act 3 when sold only then; after: the wishes (WISHES
                 indices) to be done first; needs: playerData flags for it to show
               { kind: 'wish', wish, quest, act? }  wish a js/collectibles.js WISHES index, quest
                 its save name (Broodfeast has two: the Runt's is Act 3's)
               { kind: 'boss', foe }  a js/enemies.js FOES id
               { kind: 'found', act? }  lying in a room (from that Act on, when act is given)
               { kind: 'craft', craftmetal }  made at a craft table
               { kind: 'npc', npc }  given by an NPC, for nothing
               { kind: 'challenge', npc }  won from an NPC (Loddie's pins, Lumble's dice)
               { kind: 'fleas', npc, fleas }  Mooshka's reward for that many Lost Fleas
     TRAPS   the three ways to lose a point or a wish, with the save's state that shows each */
'use strict';
const fs = require('fs');
const path = require('path');
const { write } = require('./emit.js');
const { names } = require('./names.js');
const W = require('./wiki.js');
const D = require('../js/data.js');
const E = require('../js/enemies.js');
const CO = require('../js/collectibles.js');
const CP = require('../js/completion.js');
const S = require('../js/shop.js');

const OUT = path.join(__dirname, '..', 'js', 'how.js');
const SRC = path.join(__dirname, '..', 'kb', 'data', 'completionist');
function fail(msg) { throw new Error('gen-how: ' + msg); }
const warnings = [];
const warn = (m) => warnings.push(m);

/* The NPCs, by the key of the name the game shows over their dialogue. Two have a title split in
   <X>_SUPER + <X>_MAIN whose Spanish half is missing from the dump (the Spanish only calls her
   «Hija de la Forja» inside sentences): they stay in English, CLAUDE.md rule 3. */
const NPC_KEYS = {
  grindle: 'GRINDLE_MAIN', pebb: 'BB_SHOPKEEP_MAIN', frey: 'BELLHART_SHOPKEEP_MAIN', mort: 'PILGRIM_REST_SHOP_MAIN',
  'twelfth-architect': 'ARCHITECT_SHOP_TITLE', jubilana: 'CITY_MERCHANT_MAIN', shakra: 'MAPPER_MAIN',
  plinney: 'PINSMITH_MAIN', eva: 'CREST_UPG_SHRINE_MAIN', pinstress: 'PINSTRESS_MAIN', loddie: 'LADYBUG_LARGE_MAIN',
  lumble: 'DICE_PILGRIM_MAIN', mooshka: 'FLEAMASTER_MAIN',
};
const NPC_ENGLISH = { 'forge-daughter': 'Forge Daughter', 'mottled-skarr': 'Mottled Skarr' };

/* A boss page with several fights (js/enemies.js FOES of one page): the one that gives it. */
const FIGHT = {
  lace: 'lace-the-cradle', 'savage-beastfly': 'savage-beastfly-chapel-of-the-beast', 'moss-mother': 'moss-mother-weavenest-atla',
};
/* The Silk Hearts' memory scenes (PIECES ['visited', scene]) → the boss page that opens each
   (the completionist's "Defeat X", checked against BOSSES: each drops a Silk Heart). */
const HEART = { Memory_Silk_Heart_BellBeast: 'bell-beast', Memory_Silk_Heart_WardBoss: 'the-unravelled', Memory_Silk_Heart_LaceTower: 'lace' };
/* A PIECES bool that isn't a pickup lying in the room: what it is. */
const BOOL = {
  'Aqueduct_05 Caravan Troupe Leader Fleatopia NPC': { kind: 'fleas', npc: 'mooshka', fleas: 20 },  // completionist: 20 Lost Fleas
  'Bone_12 Ladybug Craft Pickup': { kind: 'found', act: 3 },  // wiki Tools: left on the ground in Act 3
};
const PICKUP = /^(Heart Piece|Silk Spool)( \(\d+\))?$/;
/* The rest, by hand (the wiki's "How to Acquire" and its Tools table's per-Act lines; the
   completionist where the wiki is silent). Added after the ways the sources give. */
const HAND = {
  tools: {
    'straight-pin': [{ kind: 'found' }], 'threefold-pin': [{ kind: 'found' }], longpin: [{ kind: 'found' }],
    curveclaw: [{ kind: 'found', act: 2 }],  // Tools: behind a gauntlet once the Mottled Skarr dies
    pimpillo: [{ kind: 'craft', craftmetal: 1 }],  // Pimpillo: a crafting bench above Yarnaby's home
    silkshot: [{ kind: 'craft', craftmetal: 1 }],  // Silkshot: the Weaver variant, repaired at Mount Fay's table
    'delvers-drill': [{ kind: 'found' }], cogfly: [{ kind: 'craft', craftmetal: 1 }], 'rosary-cannon': [{ kind: 'found' }],
    voltvessels: [{ kind: 'found' }], flintslate: [{ kind: 'found' }], 'warding-bell': [{ kind: 'found' }],
    'fractured-mask': [{ kind: 'found', act: 2 }],  // Tools: beside the Mottled Skarr's corpse
    'injector-band': [{ kind: 'found' }], 'memory-crystal': [{ kind: 'found' }], 'quick-sling': [{ kind: 'found' }],
    'wreath-of-purity': [{ kind: 'found' }], 'egg-of-flealia': [{ kind: 'fleas', npc: 'mooshka', fleas: 'all' }],
    'shard-pendant': [{ kind: 'found' }], 'weighted-belt': [{ kind: 'found', act: 3 }],  // Tools: next to Mort's body
    'barbed-bracelet': [{ kind: 'found' }], 'dead-bugs-purse': [{ kind: 'found' }], 'silkspeed-anklets': [{ kind: 'found' }],
    'magnetite-dice': [{ kind: 'challenge', npc: 'lumble' }, { kind: 'found', act: 2 }],  // Tools: 5 wins; then by his corpse
    tacks: [{ kind: 'found', act: 3 }],  // completionist: on the hut's floor in Act 3
  },
  crests: {
    reaper: [{ kind: 'found' }], wanderer: [{ kind: 'found' }], architect: [{ kind: 'found' }], shaman: [{ kind: 'found' }],
  },
  skills: {
    silkspear: [{ kind: 'found' }], 'thread-storm': [{ kind: 'found' }], sharpdart: [{ kind: 'found' }], 'pale-nails': [{ kind: 'found' }],
  },
  arts: {
    'swift-step': [{ kind: 'found' }], clawline: [{ kind: 'found' }], 'silk-soar': [{ kind: 'found' }],
    sylphsong: [{ kind: 'npc', npc: 'eva' }], 'needle-strike': [{ kind: 'npc', npc: 'pinstress' }],
  },
};
/* The Everbloom: the White Lady gives it in the Red Memory, at the end of The Old Hearts. */
const EVERBLOOM_QUEST = 'Black Thread Pt5 Heart';

// The completionist's categories (as tools/gen-collectibles.js reads them): only to cross-check.
function load(file) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
    .replace(/^import .*$/mg, '').replace(/export const \w+: \w+ =/, 'module.exports =');
  const m = { exports: {} };
  new Function('module', src)(m);
  return m.exports.sections.flatMap((s) => s.items);
}

(async () => {
const N = await names();
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").trim();

/* ── NPCs ── */
const NPCS = {};
for (const [id, key] of Object.entries(NPC_KEYS)) NPCS[id] = N.text(key);
for (const [id, en] of Object.entries(NPC_ENGLISH)) NPCS[id] = { es: en, en };
for (const v of Object.keys(S.VENDORS)) if (!NPCS[v]) fail(`the vendor ${v} has no name`);

/* ── Joins ── */
const wishOf = new Map();  // quest save name → WISHES index
CO.WISHES.forEach((w, i) => {
  const qs = w[2][0] === 'quest' ? [w[2][1]] : w[2][0] === 'any' ? w[2].slice(1).filter((c) => c[0] === 'quest').map((c) => c[1]) : [];
  qs.forEach((q) => wishOf.set(q, i));
});
const wish = (quest, act) => {
  if (!wishOf.has(quest)) fail(`the wish ${quest} isn't in js/collectibles.js WISHES`);
  return { kind: 'wish', wish: wishOf.get(quest), quest, ...(act ? { act } : {}) };
};
const wishByTitle = new Map(CO.WISHES.map((w, i) => [norm(w[4].en), i]));
const foe = (page) => {
  const fights = E.FOES.filter((f) => f.boss && (f.page === page || f.id === page));
  if (FIGHT[page]) { if (!fights.some((f) => f.id === FIGHT[page])) fail(`${FIGHT[page]} isn't a fight of ${page}`); return FIGHT[page]; }
  if (fights.length !== 1) fail(`the boss page ${page} has ${fights.length} fights: say which in FIGHT`);
  return fights[0].id;
};
const shopWay = (x) => {
  const w = { kind: 'shop', vendor: x.vendor, price: x.price, item: x.item };
  if (x.craftmetal) w.craftmetal = x.craftmetal;
  if (x.act) w.act = x.act;
  if (x.after) w.after = x.after.map((q) => wish(q).wish);
  if (x.needs) w.needs = x.needs;
  return w;
};
const byAct = (a, b) => (a.act || 0) - (b.act || 0);

// What each site thing is called, to join the wiki's and the bosses' names and keys.
const tool = (id) => D.TOOLS.find((t) => t.id === id);
const things = {
  tools: CO.COUNTED.map((g) => g[0]),
  crests: [...CP.CRESTS], skills: [...CP.SKILLS], arts: [...CP.ARTS],
};
const list = { tools: D.TOOLS, crests: D.CRESTS, skills: D.SKILLS, arts: D.ARTS };
const byName = new Map(), byKey = new Map();
for (const [cat, ids] of Object.entries(things)) {
  for (const id of ids) {
    const x = list[cat].find((y) => y.id === id) || fail(`no ${cat} ${id} in js/data.js`);
    const en = norm(x.name.en), bare = norm(x.name.en.replace(/ Crest$/, ''));
    for (const k of [en, bare, norm(x.name.en + ' Crest')]) byName.set(k, [cat, id]);
    byKey.set(x.name.key, [cat, id]);
  }
}
// A group's other ids (Curvesickle, Druid's Eyes…) point to the group's first.
CO.COUNTED.forEach((g) => g.slice(1).forEach((id) => { const t = tool(id); byName.set(norm(t.name.en), ['up', id]); byKey.set(t.name.key, ['up', id]); }));

const HOW = { tools: {}, crests: {}, skills: {}, arts: {}, pieces: {}, everbloom: [] };
for (const [cat, ids] of Object.entries(things)) ids.forEach((id) => { HOW[cat][id] = []; });
const add = (cat, id, way) => {
  const ways = HOW[cat][id];
  const same = ways.find((w) => JSON.stringify(w) === JSON.stringify(way));
  if (!same) ways.push(way);
};

/* 1. The game: SHOP and REWARDS. */
for (const x of S.SHOP) if (x.tool) {
  const cat = things.tools.includes(x.tool) ? 'tools' : null;
  if (cat) add('tools', x.tool, shopWay(x));
}
for (const [q, r] of Object.entries(S.REWARDS)) if (r.tool && things.tools.includes(r.tool)) {
  add('tools', r.tool, wish(q, /Runt$/.test(q) ? 3 : undefined));
}

/* 3. The wiki: the bosses' drops, and the wishes' rewards. */
for (const [page, b] of Object.entries(E.BOSSES)) {
  for (const d of b.drops || []) {
    const at = byKey.get(d.key) || byName.get(norm(d.en));
    if (!at || at[0] === 'up') continue;
    add(at[0], at[1], { kind: 'boss', foe: foe(page) });
  }
}
const rewardOf = new Map();  // the wiki's: WISHES index → the thing
for (const b of W.templates(W.page('Wishes'), 'TaskEntry')) {
  const f = W.fields(b);
  const i = wishByTitle.get(norm(f.id || ''));
  const target = W.linkTarget((f.reward || '').split('<br>')[0]);
  const at = byName.get(norm(target));
  if (i === undefined || !at || at[0] === 'up') continue;
  rewardOf.set(i, at);
  const quest = CO.WISHES[i][2][0] === 'quest' ? CO.WISHES[i][2][1] : null;
  if (!quest) continue;  // Broodfeast's two: the game's REWARDS already gave them
  const game = S.REWARDS[quest];
  if (game && !(game.tool === at[1])) warn(`${f.id}: the wiki's reward is ${at[1]}, the game's ${JSON.stringify(game)}`);
  add(at[0], at[1], wish(quest));
}

/* 4. By hand. */
for (const [cat, m] of Object.entries(HAND)) {
  for (const [id, ways] of Object.entries(m)) {
    if (!HOW[cat][id]) fail(`HAND.${cat}.${id} isn't a thing of the 100%`);
    ways.forEach((w) => add(cat, id, w));
  }
}
for (const cat of Object.keys(things)) for (const id of things[cat]) HOW[cat][id].sort(byAct);

/* 2. The pieces, by their save check. */
const COUNTS = new Set(['mask-shard', 'spool-fragment', 'crafting-kit', 'tool-pouch', 'needle', 'silk-heart']);
const needle = D.NEEDLES;
const needleWays = {
  1: [{ kind: 'npc', npc: 'plinney' }],
  2: [{ kind: 'shop', vendor: 'plinney', price: 0, item: 'Nail Upgrade', paleOil: 1 }],
  3: [{ kind: 'shop', vendor: 'plinney', price: S.NEEDLE.further, item: 'Nail Upgrade Further Cost', paleOil: 1 }],
  4: [{ kind: 'shop', vendor: 'plinney', price: S.NEEDLE.final, item: 'Nail Upgrade Final Cost', paleOil: 1 }],
};
function pieceWays(i, check) {
  const [t, a, b] = check;
  if (t === 'any') return check.slice(1).flatMap((c) => pieceWays(i, c));
  if (t === 'quest') return [wish(a)];
  if (t === 'flag') {
    const sold = S.SHOP.filter((x) => x.piece === i);
    if (!sold.length) fail(`PIECES[${i}] (${a}) is bought, and no SHOP item sets it`);
    sold.forEach((x) => { if (x.flag !== a) fail(`SHOP ${x.item} sets ${x.flag}, PIECES[${i}] checks ${a}`); });
    return sold.map(shopWay).sort(byAct);
  }
  if (t === 'bool') {
    if (PICKUP.test(b)) return [{ kind: 'found' }];
    const w = BOOL[a + ' ' + b];
    return w ? [w] : fail(`PIECES[${i}]: what is the bool ${a} ${b}? (BOOL)`);
  }
  if (t === 'visited' && HEART[a]) {
    const page = HEART[a];
    if (!(E.BOSSES[page].drops || []).some((d) => d.key === 'MEMORY_MSG_TITLE_SILKHEART')) fail(`${page} drops no Silk Heart`);
    return [{ kind: 'boss', foe: foe(page) }];
  }
  if (t === 'min' && a === 'nailUpgrades') return needleWays[b] || fail(`no Needle upgrade ${b}`);
  if (t === 'min' && a === 'CaravanTroupeLocation') return [{ kind: 'fleas', npc: 'mooshka', fleas: 14 }];  // completionist: 14
  if (t === 'min' && a === 'pinGalleriesCompleted') return [{ kind: 'challenge', npc: 'loddie' }];  // Loddie's first pin gallery
  return fail(`PIECES[${i}]: no way for the check ${JSON.stringify(check)}`);
}
CO.PIECES.forEach((p, i) => { if (COUNTS.has(p[0])) HOW.pieces[i] = pieceWays(i, p[2]); });
if (needle.length !== 5) fail('js/data.js NEEDLES is not five');

/* The Everbloom. */
HOW.everbloom = [wish(EVERBLOOM_QUEST)];

/* Every thing has a way; every npc a name; every foe is a fight. */
const allWays = [];
for (const cat of ['tools', 'crests', 'skills', 'arts', 'pieces']) {
  for (const [id, ways] of Object.entries(HOW[cat])) {
    if (!ways.length) fail(`${cat}.${id}: no way to get it`);
    ways.forEach((w) => allWays.push([cat + '.' + id, w]));
  }
}
HOW.everbloom.forEach((w) => allWays.push(['everbloom', w]));
for (const [where, w] of allWays) {
  if ((w.vendor && !NPCS[w.vendor]) || (w.npc && !NPCS[w.npc])) fail(`${where}: no NPC ${w.vendor || w.npc}`);
  if (w.foe && !E.FOES.some((f) => f.id === w.foe)) fail(`${where}: no foe ${w.foe}`);
}

/* The traps. The save's states are read on the 92 real saves (npm run check-pack's) and the
   game's code: the 100% counts a Tool unlocked and not hidden (ToolItemManager.GetCount over
   GetUnlockedTools, IsUnlockedNotHidden), once per CountKey. */
const TRAPS = [
  {
    // Curveclaw: hitting every target in the Far Fields room in Act 3 hands it to the Unnamed
    // Skarr; the Curvesickle is on the ground there after a bench. In between, 'Curve Claws' is
    // hidden and 'Curve Claws Upgraded' not unlocked: no Tool of the pair counts. Every
    // upgraded save shows Curve Claws { IsUnlocked, IsHidden } beside the Upgraded one.
    id: 'curveclaw', thing: ['tools', 'curveclaw'], act: 3,
    lost: { hidden: 'Curve Claws', locked: 'Curve Claws Upgraded' },
    back: { tool: 'curvesickle', way: { kind: 'found', act: 3 } },
  },
  {
    // Silkshot: the Ruined Tool is repaired once, by one of three; the other two are gone.
    id: 'silkshot', thing: ['tools', 'silkshot'],
    variants: [
      { save: 'WebShot Forge', way: HOW.tools.silkshot.find((w) => w.vendor === 'forge-daughter') },
      { save: 'WebShot Architect', way: HOW.tools.silkshot.find((w) => w.vendor === 'twelfth-architect') },
      { save: 'WebShot Weaver', way: { kind: 'craft', craftmetal: 1 } },
    ],
  },
  {
    // Broodfeast done as the Runt's (Act 3's Runtfeast): Longclaw all the same, but the wish
    // the Act 3 rule counts is 'Huntress Quest', and this is 'Huntress Quest Runt'.
    id: 'broodfeast-runt', thing: ['tools', 'longclaw'], wish: wishOf.get('Huntress Quest'),
    counts: 'Huntress Quest', instead: 'Huntress Quest Runt',
  },
];
for (const t of TRAPS) {
  if (!HOW[t.thing[0]][t.thing[1]]) fail(`the trap ${t.id} is on no thing`);
  (t.variants || []).forEach((v) => { if (!v.way) fail(`${t.id}: ${v.save} has no way`); if (!CO.TOOLS.silkshot.includes(v.save)) fail(`${v.save} isn't Silkshot's`); });
}
if (!CO.TOOLS.curveclaw.includes(TRAPS[0].lost.hidden) || !CO.TOOLS.curvesickle.includes(TRAPS[0].lost.locked)) fail('Curveclaw\'s save names moved');

/* ── Cross-checks against the completionist ── */
const vendorEn = new Map(Object.entries(NPCS).map(([id, n]) => [norm(n.en), id]));
vendorEn.set('forge daughter', 'forge-daughter'); vendorEn.set('twelfth architect', 'twelfth-architect');
const sold = (txt) => [...String(txt).matchAll(/(?:[Ss]old by|bought from|purchased from) +([A-Z][\w' ]*?)(?: \([^)]*\))? +(?:in ACT 3 )?for (\d+) Rosaries(?:,? and (\d+) Craftmetal)?/g)]
  .map((m) => ({ vendor: vendorEn.get(norm(m[1])), price: +m[2], craftmetal: m[3] ? +m[3] : undefined }));
let checked = 0;
const checkPrices = (where, txt, ways) => {
  for (const s of sold(txt)) {
    checked += 1;
    if (!s.vendor) { warn(`${where}: the completionist names a vendor the site doesn't know`); continue; }
    const w = ways.find((x) => x.kind === 'shop' && x.vendor === s.vendor);
    if (!w) warn(`${where}: the completionist says ${s.vendor} sells it, the game's stock doesn't`);
    else if (s.craftmetal && w.craftmetal !== s.craftmetal) warn(`${where}: ${s.vendor} takes ${w.craftmetal || 0} Craftmetal in the game, ${s.craftmetal} in the completionist`);
    else if (w.price !== s.price) warn(`${where}: ${s.vendor} ${w.price} rosaries in the game, ${s.price} in the completionist`);
  }
};
const toolIdOf = new Map(Object.entries(CO.TOOLS).flatMap(([id, ns]) => ns.map((n) => [n, id])));
for (const it of load('tools.ts')) {
  const id = toolIdOf.get(it.parsingInfo.internalId[0]);
  if (HOW.tools[id]) checkPrices('tools.' + id, it.completionDetails, HOW.tools[id]);
}
const pieceByCheck = new Map(CO.PIECES.map((p, i) => [JSON.stringify(p[2]), i]));
for (const f of ['maskShards.ts', 'spoolFragments.ts', 'upgrades.ts']) {
  for (const it of load(f)) {
    const pi = it.parsingInfo;
    const one = (x) => (x.type === 'flag' ? ['flag', x.internalId] : x.type === 'quest' ? ['quest', x.internalId]
      : x.type === 'flagMin' ? ['min', ...x.internalId] : x.type === 'sceneDataBool' ? ['bool', ...x.internalId] : null);
    const check = Array.isArray(pi) ? ['any', ...pi.map(one)] : one(pi);
    const i = pieceByCheck.get(JSON.stringify(check));
    if (i === undefined) fail(`${f} ${it.name}: no PIECES entry checks ${JSON.stringify(check)}`);
    checkPrices(`pieces.${i} (${it.name})`, it.completionDetails, HOW.pieces[i]);
  }
}
// The wiki's Needle prices against costs.bundle.
const nf = W.fields(W.templates(W.page('Needle'), 'SS Infobox Item')[0]);
for (const lvl of [2, 3, 4, 5]) {
  const buy = nf['buy' + lvl] || '';
  const r = /\{\{[Rr]\|(\d+)/.exec(buy);
  const w = needleWays[lvl - 1][0];
  const price = r ? +r[1] : 0;
  if (w.kind === 'shop' && w.price !== price) warn(`Needle ${lvl - 1}: ${w.price} rosaries in the game, ${price} on the wiki`);
  if (w.kind === 'shop' && !/Pale Oil/.test(buy)) warn(`Needle ${lvl - 1}: the wiki takes no Pale Oil`);
}

write(OUT, `js/how.js: how to get each thing of the 100%, as data (no prose): its ways, best first.
   GENERATED by tools/gen-how.js from js/shop.js (the game's shops and wish rewards), the save's
   checks (js/collectibles.js PIECES), the wiki's boss drops (js/enemies.js BOSSES) and wish
   rewards (kb/data/raw/Wishes.wiki), and a short table by hand (the generator's HAND): not
   edited by hand. Change the generator and run npm run data.

     NPCS    npc id → the game's name (the vendors and the NPCs who give things)
     HOW     { tools, crests, skills, arts: { site id: [way…] }, pieces: { PIECES index: [way…] },
             everbloom: [way…] }. The Tools by their COUNTED group's first id; the pieces those
             that count (Mask Shards, Spool Fragments, Crafting Kit, Tool Pouch, Needle, Silk
             Hearts). A way is one of:
               { kind: 'shop', vendor, price, item, craftmetal?, paleOil?, act?, after?, needs? }
                 price in rosaries; item the ShopItem in js/shop.js SHOP (Plinney's Needle: its
                 cost's name); craftmetal, paleOil what it also takes; act 3 sold only then;
                 after the WISHES indices to be done first; needs the playerData flags it waits on
               { kind: 'wish', wish, quest, act? }  wish a WISHES index, quest its save name
               { kind: 'boss', foe }  a js/enemies.js FOES id
               { kind: 'found', act? }  lying in a room (from that Act on)
               { kind: 'craft', craftmetal }  made at a craft table
               { kind: 'npc', npc }  given for nothing
               { kind: 'challenge', npc }  won from the NPC
               { kind: 'fleas', npc, fleas }  Mooshka's, for that many Lost Fleas ('all')
     TRAPS   the ways to lose a point or a wish: curveclaw (lost: the save names hidden and
             locked while it's gone; back: how it returns), silkshot (variants: the save's name
             and way of each; the first repaired locks the others), broodfeast-runt (the wish
             done as counts or as instead: only counts is Act 3's)`, 'how', [['NPCS', NPCS], ['HOW', HOW], ['TRAPS', TRAPS]]);

const n = Object.values(HOW).reduce((a, m) => a + (Array.isArray(m) ? 1 : Object.keys(m).length), 0);
console.log(`${n} things with their ways → js/how.js (${checked} of the completionist's prices checked against the game's)`);
warnings.forEach((w) => console.log('  ! ' + w));
})().catch((e) => { console.error(e.message); process.exit(1); });
