/* test/mark-acts.test.js: the Act a Map mark says (its card and title) is the first one its thing
   can be had in, there (the Map's Acts, checked one by one on 18-Oct-2026: tools/gen-spots.js, «What
   only Act 3 has», BOSS_ACT, EXTRA_ACT; tools/gen-collectibles.js WHERE_ACT; tools/gen-gauntlets.js
   ACT). What only Act 3 has says Act 3; what Act 3 takes away keeps its earlier Act; and the Acts
   read by hand stay as read. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

require('../js/data.js');
require('../js/map.js');
const G = require('../js/graph.js');
const CO = require('../js/collectibles.js');
require('../js/gauntlets.js');
const SP = require('../js/spots.js');
const R = require('../js/rooms.js');
const SS = globalThis.SS, M = SS.map, GA = SS.gauntlets;

const low = (s) => String(s).toLowerCase();
const gating = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'gating.json'), 'utf8'));
const GATE = new Map(Object.entries(gating.items).map(([k, v]) => [low(k), v]));
const savedOf = (c) => (['bool', 'int', 'geo'].includes(c[0]) ? [c] : c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(savedOf) : []);
const world = (c) => { const s = savedOf(c); return s.length ? s.map(([, sc, id]) => (GATE.get(low(sc + '|' + id)) || {}).world || '') : []; };

/* The rooms only Act 3 has: the map's Act 3 pieces (the Cradle, Cogwork Core and Ventrica hub
   destroyed), the rooms the game's doors reach only through them, from Tut_01, and the two areas
   the game opens only in Act 3, the Abyss and Lost Verdania. */
const late = new Set(M.PIECES.filter((e) => e.act3).map((e) => low(e.s)));
const roomOf = (s) => low((R.roomOf(s) || {}).scene || s);
const adj = new Map();
const link = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
for (const [a, bs] of Object.entries(G)) for (const b of bs) { link(low(a), low(b)); link(low(b), low(a)); }
const reached = new Set(['tut_01']), todo = ['tut_01'];
while (todo.length) for (const n of adj.get(todo.pop()) || []) if (!reached.has(n) && !late.has(roomOf(n)) && !/_destroyed/.test(n)) { reached.add(n); todo.push(n); }
const only3 = (scene) => !!scene && (late.has(roomOf(scene)) || /_destroyed/.test(low(scene)) || (adj.has(low(scene)) && !reached.has(low(scene)))
  || ['ABYSS', 'GROVE'].includes(R.areaOf(scene)));

test('the rooms only Act 3 has are the destroyed ones, the Border Caves and the Nameless Town, the Abyss and Verdania', () => {
  const beyond = [...adj.keys()].filter((s) => !reached.has(s) && !late.has(roomOf(s)) && !/_destroyed/.test(s)).sort();
  // Past the destroyed rooms (the Border Caves are Cradle_Destroyed_Challenge_*), only the Nameless Town.
  assert.deepEqual(beyond, ['abandoned_town']);
  for (const s of ['Cradle_03_Destroyed', 'Cog_10_Destroyed', 'Cradle_Destroyed_Challenge_01', 'Abandoned_town', 'Abyss_05', 'Clover_18']) assert.ok(only3(s), s);
  for (const s of ['Tube_Hub', 'Cradle_03', 'Bonetown', 'Greymoor_15b', 'Dock_06_Church']) assert.ok(!only3(s), s);
});

test('what only Act 3 has says Act 3: in its rooms, or under its rooms\' «Black Thread World»', () => {
  let n = 0;
  SP.EXTRAS.forEach((x, i) => {
    const w = world(x[2]);
    if (!only3(x[3]) && !(w.length && w.every((v) => v === 'act3'))) return;
    n++;
    assert.equal(x[1], 3, `extra:${i} ${x[0]} ${x[3]} ${JSON.stringify(x[2])}`);
  });
  assert.ok(n >= 60, `${n} extras only Act 3 has`);
  // Albert's kind of case: the rosary beads in Mort's room, there once he's gone, and the Abyss's caches.
  const at = (kind, scene) => SP.EXTRAS.filter((x) => x[0] === kind && low(x[3]) === low(scene));
  assert.ok(at('bead', 'Bone_East_10_Room').length >= 3 && at('bead', 'Bone_East_10_Room').every((x) => x[1] === 3));
  assert.ok(at('shard-cache', 'Abyss_05').every((x) => x[1] === 3));
  // Nothing of the 100%, no boss, gauntlet or wish there says an earlier Act.
  CO.PIECES.forEach((p, i) => { if (only3(SP.AT.pieces[i])) assert.equal(p[1], 3, `piece ${i}`); });
  for (const cat of ['tools', 'crests', 'skills', 'arts']) for (const [id, w] of Object.entries(CO.WHERE[cat])) if (only3(SP.AT[cat][id])) assert.equal(w[0], 3, `${cat} ${id}`);
  for (const [foe, scene, , act] of SP.BOSSES) if (only3(scene)) assert.equal(act, 3, foe);
  for (const x of GA.GAUNTLETS) if (only3(x.scene)) assert.equal(x.act, 3, x.id);
  SP.TASKS.forEach((x, i) => {
    const w = CO.WISHES.find((v) => JSON.stringify(v[2]).includes(JSON.stringify(x[1])));
    if (x[0] !== 'goal' && w && only3(x[3])) assert.equal(w[1], 3, `task:${i}`);
  });
});

test('a piece only Act 3 has says Act 3; one Act 3 moves keeps its Act, and its Act 3 room says Act 3', () => {
  // Every way of its check under Black Thread World (an 'any' only if all its ways are).
  const only3By = (c) => (['bool', 'int', 'geo'].includes(c[0]) ? (GATE.get(low(c[1] + '|' + c[2])) || {}).world === 'act3'
    : c[0] === 'any' ? c.slice(1).every(only3By) : c[0] === 'all' ? c.slice(1).some(only3By) : false);
  CO.PIECES.forEach((p, i) => { if (only3By(p[2])) assert.equal(p[1], 3, `piece ${i} ${p[0]} ${JSON.stringify(p[2])}`); });
  // The Memory Locket of «Volatile Flintbeetles»: its quest, or Bone_10's pickup under Black Thread World.
  const i = CO.PIECES.findIndex((p) => p[0] === 'memory-locket' && JSON.stringify(p[2]).includes('"Rock Rollers"'));
  const b = savedOf(CO.PIECES[i][2]);
  assert.deepEqual(world(CO.PIECES[i][2]), ['act3'], 'its only saved way is Act 3\'s');
  assert.equal(CO.PIECES[i][1], 1, 'the piece keeps Act 1 (the wish)');
  const [scene, , way] = SP.ALSO['piece:' + i];
  assert.equal(low(scene), low(b[0][1]));
  assert.deepEqual([way.kind, way.act], ['moved', 3], 'its Bone_10 spot says Act 3');
  // Every way a thing Act 3 moves takes there is Act 3's.
  for (const [k, [s, check, w]] of Object.entries(SP.ALSO)) {
    if (!w || w.kind !== 'moved') continue;
    assert.equal(w.act, 3, k);
    for (const c of savedOf(check)) if (low(c[1]) === low(s)) assert.equal((GATE.get(low(c[1] + '|' + c[2])) || {}).world, 'act3', `${k} ${c[2]}`);
  }
});

test('what Act 3 takes away keeps its earlier Act', () => {
  SP.EXTRAS.forEach((x, i) => {
    const gone = x[5] && x[5].gone === 'act3';
    if (gone) assert.notEqual(x[1], 3, `extra:${i} ${x[0]} ${x[3]}`);
  });
  for (const x of GA.GAUNTLETS) if (x.gone === 'act3') assert.ok(x.act < 3, x.id);
});

test('the Acts read by hand stay as read: upgrades after their Tool, the completionist\'s slips', () => {
  const T = CO.WHERE.tools;
  // An upgrade isn't had before its Tool.
  for (const [base, up] of [['curveclaw', 'curvesickle'], ['claw-mirror', 'claw-mirrors'], ['druids-eye', 'druids-eyes']]) assert.ok(T[up][0] >= T[base][0], up);
  assert.equal(T.curvesickle[0], 3);   // the Far Fields targets, in Act 3 only
  assert.equal(T['claw-mirrors'][0], 3);   // Tormented Trobbio's Dark Mirror
  // The Moss Druid's second wants every Mossberry: the last one's Act.
  const berries = SP.EXTRAS.filter((x) => x[0] === 'mossberry');
  assert.equal(berries.length, 7);
  assert.equal(T['druids-eyes'][0], Math.max(...berries.map((x) => x[1])));
  assert.equal(T.silkshot[0], 1);   // the Ruined Tool, Bilewater's in Act 1, to the Forge Daughter
  assert.equal(CO.WHERE.skills.sharpdart[0], 1);   // Weavenest Karn with the Drifter's Cloak and Swift Step
  assert.equal(SP.BOSSES.find((b) => b[0] === 'craggler')[3], 1);   // the Wormways' lower entrance, from the start
  const relic = (name) => SP.EXTRAS.find((x) => x[2][0] === 'relic' && x[2][1] === name)[1];
  assert.equal(relic('Weaver Totem Slab_Bottom'), 2);   // behind the Key of Apostate's door
  assert.equal(relic('Seal Chit Silk Siphon'), 2);   // a Faydown Cloak jump will do
  assert.equal(GA.GAUNTLETS.find((x) => x.id === 'hunters-march-5').act, 2);   // once the Mottled Skarr is dead
});
