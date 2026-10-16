#!/usr/bin/env node
/* tools/gen-people.js: generates js/people.js: everyone the Map shows in «Everyone else», and the
   traders it adds to the shops (npm run data runs it after tools/gen-spots.js). Offline: it reads
   kb/data/game/people.json (tools/extract-people.py, the game's own scenes), the map's rooms
   (js/map.js) and kb/data/game/pickups.json for the scenes' sizes.

   Each person is a title key of the game (its NpcDialogueTitle, or the one its FSM shows), named
   by the dump's <KEY>_SUPER + _MAIN + _SUB. Every key the scenes give is either in PEOPLE or in
   ELSEWHERE (on the Map under another layer), or the generator stops: a patch that adds someone
   is seen. What the save says of each one is HAND below, read on Albert's saves and the scenes'
   scripts (11-Oct-2026), and every field it names has to be one the person's own scripts read
   (people.json fields), and every room one of their spots, or the generator stops too:
     met    playerData fields, any of them set (true, or a number above 0): you've met. A person
            with none is a place with no state: never dimmed by guess.
     gone   fields that, set, mean they've left or died: hidden in a save.
     at     [field, value, scene]…, the first that holds says where they are now; with none
            holding, the spots no rule names. Free mode shows every spot.
     unsure 'always': the save can't say where (Garmond: his garmondIn<Room> flags stay set after he
            moves on, and in Act 3 his encounters wait on a cooldown): every spot, and the card
            says so.
   Left out on purpose: a met flag the save has but none of the person's own scripts read
   (MetBelltownDoctor, MetFisherHome*, SeenHalfwayPatron*, MetEnclaveScaredPilgrim,
   bonetownPilgrim*Seen, pilbyKilled): the check can't tie it to them, so they stay with no state.
   And places no field says (Sherma's shermaPos, gillyLocation, GreenPrinceLocation, Ballow's
   diving bell): their numbers aren't mapped to rooms in the game's data read so far, so every spot.
   The spots are each scene's object, one per scene, at its point in its room (where the game
   places it on its map, js/rooms.js mapPoint, as tools/gen-spots.js places the rest). */
'use strict';
const fs = require('fs');
const path = require('path');
const { write } = require('./emit.js');
const { names } = require('./names.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const SP = require('../js/spots.js');
const M = globalThis.SS.map;

const OUT = path.join(__dirname, '..', 'js', 'people.js');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'people.json'), 'utf8'));
const SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kb', 'data', 'game', 'pickups.json'), 'utf8')).sizes;
const FIGS = path.join(__dirname, '..', 'assets', 'map', 'people');
function fail(msg) { throw new Error('gen-people: ' + msg); }

/* On the Map already, under another layer: Shakra hers; who gives a thing of the 100% (js/spots.js
   PEOPLE); the vendors of js/shop.js (Places, Shops); the Couriers, a shop of wishes in Bellhart
   (TRADERS). Each person in one switch only. */
const ELSEWHERE = {
  MAPPER: 'shakra', CREST_UPG_SHRINE: 'person', PINSTRESS: 'person', LADYBUG_LARGE: 'person', DICE_PILGRIM: 'person',
  DICE_PILGRIM_DEFEATED: 'person', FLEAMASTER: 'person', BELLHART_RELICDEALER: 'person', PINSMITH: 'person',
  BB_SHOPKEEP: 'shop', BELLHART_SHOPKEEP: 'shop', PILGRIM_REST_SHOP: 'shop', FORGEDAUGHTER: 'shop', GRINDLE: 'shop',
  CITY_MERCHANT: 'shop', ANT_MERCHANT: 'shop', ARCHITECT: 'shop',
  COURIERS_SHOP: 'trader', COURIER_SHORT: 'trader', COURIER_TALL: 'trader', MOSSCREEP: 'trader', HH_BARTENDER: 'trader',
};
/* Who buys or sells outside the game's ShopOwners, on the Map as shops: the Couriers' wishes (a
   SimpleQuestsShopOwner, in Bellhart only), the Moss Druid (Mossberries for rosaries,
   MOSSCREEP_TRADE_BERRY) and Creige (HH_BARTENDER_DRINK_PROMPT, «¿Comprar una bebida?»). Styx
   and Crull and Benjin were looked at and aren't: Styx grows morsels for Hornet, and nothing in
   the dump has the Dust Traders sell. Scrounge buys the relics and keeps her layer. */
const TRADERS = { couriers: { keys: ['COURIERS_SHOP'], note: 'couriers' }, druid: { keys: ['MOSSCREEP'], note: 'druid' },
  creige: { keys: ['HH_BARTENDER'], note: 'creige' } };
// The troupe's camp, by CaravanTroupeLocation (js/rooms.js pinsOn follows it for the camp's bench).
const CAMP = [['CaravanTroupeLocation', 0, 'bone_10'], ['CaravanTroupeLocation', 1, 'greymoor_08_caravan'],
  ['CaravanTroupeLocation', 2, 'coral_judge_arena'], ['CaravanTroupeLocation', 3, 'aqueduct_05_caravan']];
// The figures that aren't the person on their first sprite (tools/extract-people.py NO_FIGURE): their Journal portrait.
const PORTRAIT = { GARMOND: 'garmond-and-zaza', SETH_NPC: 'shrine-guardian-seth', SONG_KNIGHT: 'second-sentinel',
  WICKER_BUG: 'father-of-the-flame', CROWFATHER: 'crawfather' };
// One person under several keys: the first is theirs.
const SAME = { SETH_NPC: ['SETH_NPC_BC'], LITTLE_PILGRIM_N: ['LITTLE_PILGRIM'], DUST_TRADERS_1: ['DUST_TRADERS_2'] };

/* HAND: per person (their key), what the save says. The rest are in the list with no state. */
const HAND = {
  BLUE_SCIENTIST: { met: ['BlueScientistMet', 'BlueScientistInfectedMet'], gone: ['BlueScientistDead'] },
  CARETAKER: { met: ['metCaretaker'] },
  CHURCHKEEPER: { met: ['churchKeeperIntro'], at: [['ChurchKeeperLeftBasement', false, 'tut_03']] },
  BELLHART_GREETER: { met: ['BelltownGreeterConvo'] },
  SHERMA: { met: ['metSherma'] },
  GARMOND: { met: ['metGarmond'], unsure: 'always' },
  SEAMSTRESS: { met: ['MetSeamstress'] },
  STEEL_SENTINEL: { met: ['SteelSentinelMet'] },
  JUDGE_GATE_PILGRIM: { met: ['metGatePilgrim'] },
  GRUBFARMER: { met: ['metGrubFarmer'] },
  GRUBFARMER_MIMIC: { met: ['MetGrubFarmerMimic'] },
  HUNTER_FAN: { met: ['MetHalfwayHunterFan'], at: [['nuuIsHome', true, 'halfway_01']] },
  SONG_KNIGHT: { met: ['songChevalierRestingMet'], at: [['songChevalierActiveInHang_02', true, 'hang_02'],
    ['songChevalierActiveInSong_07', true, 'song_07'], ['songChevalierActiveInSong_24', true, 'song_24']] },
  HH_PATRON_LEFT: { gone: ['HalfwayPatronLeftGone'] },
  HH_PATRON_RIGHT: { gone: ['HalfwayPatronRightGone'] },
  MASK_MAKER: { met: ['MetMaskMaker'] },
  SHELLWOOD_WITCH: { met: ['MetWoodWitch'] },
  GOURMAND_SERVANT: { met: ['MetGourmandServant'] },
  GILLY: { met: ['gillyMet'] },
  BELL_HERMIT: { met: ['BelltownHermitMet'] },
  LITTLE_PILGRIM_N: { met: ['pilbyMeetConvo'],
    at: [['pilbyInsidePilgrimsRest', true, 'bone_east_10_room'], ['pilbyAtPilgrimsRest', true, 'bone_east_10']] },
  OLD_STATUE: { met: ['libraryStatueWoken'] },
  FLEA_LECH: { met: ['CaravanLechMet'], at: [['CaravanLechReturnedToCaravan', false, 'greymoor_24'], ...CAMP] },
  FLEA_TRACKER: { met: ['MetTroupeHunterWild'], at: [['MetTroupeHunterWild', false, 'bellway_aqueduct'], ...CAMP] },
  FLEAMEMBER_SHORT: { met: ['MetCaravanTroupeLeader'], at: CAMP },
  FLEAMEMBER_TALL: { met: ['MetCaravanTroupeLeader'], at: [CAMP[0], CAMP[3]] },   // Varga stays in the caravan at the other two camps
  SETH_NPC: { met: ['MetSethNPC'], at: [['SethJoinedFleatopia', true, 'aqueduct_05_festival']] },
};

const ROOM_OF = new Map(Object.entries(M.ROOMS).map(([k, r]) => [k.toLowerCase(), r]));
// A point of a scene where the game places it on its map (js/rooms.js mapPoint, as tools/gen-spots.js).
function toMap(scene, x, y) {
  const r = ROOM_OF.get(scene.toLowerCase()), size = SIZES[scene.toLowerCase()];
  const p = r && size && x != null && y != null ? R.mapPoint(scene, x, y, size[0], size[1]) : null;
  if (!p) return null;
  const out = Math.max(r[0] - p.x, p.x - r[0] - r[2], 0) + Math.max(r[1] - p.y, p.y - r[1] - r[3], 0);
  return out > 12 ? null : [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
}
const idOf = (key) => key.toLowerCase().replace(/_/g, '-');

(async () => {
  const N = await names();
  const titleOf = (key) => N.text([key + '_SUPER', key + '_MAIN', key + '_SUB'].filter((k) => k in N.EN || k in N.ES).join('+'));
  const merged = new Set(Object.values(SAME).flat());
  const keys = Object.keys(P.people).filter((k) => !merged.has(k));
  const spotsOf = (key) => [key, ...(SAME[key] || [])].flatMap((k) => (P.people[k] || { spots: [] }).spots);
  const fieldsOf = (key) => new Set([key, ...(SAME[key] || [])].flatMap((k) => (P.people[k] || { fields: [] }).fields));
  const place = (key) => {
    const seen = new Map();
    for (const [scene, , x, y] of spotsOf(key)) {
      if (seen.has(scene) || !R.roomOf(scene)) continue;
      const at = toMap(R.roomOf(scene).scene, x, y) || toMap(scene, x, y);
      seen.set(scene, at ? [scene, ...at] : [scene]);
    }
    return [...seen.values()];
  };
  const check = (key, h) => {
    const fs1 = fieldsOf(key), rooms = new Set(spotsOf(key).map((s) => s[0]));
    for (const f of [...(h.met || []), ...(h.gone || []), ...(h.at || []).map((a) => a[0])]) {
      if (!fs1.has(f)) fail(`${key}: ${f} isn't read by any of their scripts: HAND needs reading again`);
    }
    for (const [, , scene] of h.at || []) if (!rooms.has(scene)) fail(`${key}: ${scene} isn't one of their rooms (${[...rooms].join(', ')})`);
  };
  for (const k of Object.keys(HAND)) if (!P.people[k]) fail(`${k} isn't in the scenes any more`);

  /* Each person once in a room, by the mark that says what they're there for (Albert's choice,
     15-Oct-2026): not drawn again where js/spots.js has them already as who offers a wish (GIVER),
     as a boss (their Journal portrait is the boss's: the Second Sentinel in its arena), or under a
     place where a wish is done, which names nobody: the nearest person within 3 px of it in its
     room, when only one is and the save doesn't follow them there (Mister Mushroom at the Herald's spots). */
  const roomKey = (s) => ((R.roomOf(s) || {}).scene || s).toLowerCase();
  const absorbed = new Map();   // person key → the room keys where another mark stands for them
  const absorb = (key, scene, why) => {
    if (!absorbed.has(key)) absorbed.set(key, new Set());
    absorbed.get(key).add(roomKey(scene));
    console.log(`  ${key} in ${scene}: ${why} stands for them`);
  };
  for (const [scene, g] of Object.entries(SP.GIVER)) if (g && !ELSEWHERE[g[0]] && !merged.has(g[0])) absorb(g[0], scene, 'giver:' + scene.toLowerCase());
  for (const [foe, scene] of SP.BOSSES) {
    const key = Object.keys(PORTRAIT).find((k) => PORTRAIT[k] === foe);
    if (key && place(key).some((sp) => roomKey(sp[0]) === roomKey(scene))) absorb(key, scene, 'boss:' + foe);
  }
  SP.TASKS.forEach((x, i) => {
    if (x[0] !== 'wspot' || !SP.XY['task:' + i]) return;
    const [mx, my] = SP.XY['task:' + i], room = roomKey(x[3]);
    const near = keys.filter((key) => !ELSEWHERE[key]).flatMap((key) => place(key).filter((sp) => roomKey(sp[0]) === room && sp.length === 3)
      .map((sp) => [key, Math.hypot(sp[1] - mx, sp[2] - my)])).filter(([, d]) => d <= 3).sort((p, q) => p[1] - q[1]);
    // Not where the save follows them (HAND at): there they outlast the wish (the Second Sentinel in Song_07).
    const followed = (key) => [key, ...(SAME[key] || [])].some((k) => ((HAND[k] || {}).at || []).some(([, , sc]) => roomKey(sc) === room));
    if (near.length && !(near[1] && near[1][1] - near[0][1] < 0.5) && !followed(near[0][0])) absorb(near[0][0], x[3], 'task:' + i);
  });
  const PEOPLE = [], VARS = new Set();
  const used = (h) => { for (const f of [...(h.met || []), ...(h.gone || []), ...(h.at || []).map((a) => a[0])]) VARS.add(f); };
  for (const key of keys) {
    if (ELSEWHERE[key]) continue;
    const spots = place(key).filter((sp) => !(absorbed.get(key) || new Set()).has(roomKey(sp[0])));
    if (!spots.length) { console.log(`  ${key}: no spot on the map (${spotsOf(key).map((s) => s[0]).join(', ')})`); continue; }
    const h = HAND[key] || {};
    check(key, h);
    used(h);
    const id = idOf(key);
    const art = fs.existsSync(path.join(FIGS, id + '.webp')) ? 'people/' + id : PORTRAIT[key] ? 'journal/' + PORTRAIT[key] : null;
    PEOPLE.push({ id, name: titleOf(key), art, spots, met: h.met, gone: h.gone, at: h.at, unsure: h.unsure });
  }
  const TRADE = [];
  for (const [id, t] of Object.entries(TRADERS)) {
    const key = t.keys[0], h = HAND[key] || {};
    check(key, h);
    used(h);
    const spots = t.keys.flatMap((k) => place(k));
    if (!spots.length) fail(`${id}: no room on the map`);
    TRADE.push({ id, name: titleOf(key), note: t.note, spots: spots.slice(0, 1) });
  }
  // Every key is someone's.
  for (const k of keys) if (!ELSEWHERE[k] && !PEOPLE.some((p) => p.id === idOf(k)) && place(k).some((sp) => !(absorbed.get(k) || new Set()).has(roomKey(sp[0])))) fail(`${k} is nobody's`);
  for (const k of Object.keys(ELSEWHERE)) if (!P.people[k]) fail(`${k} (ELSEWHERE) isn't in the scenes any more`);

  // The Map admin's fixes keyed by a trader's spot follow their marks (stops the run if one can't).
  require('./follow-fixes.js').run('people', { TRADE });

  const size = write(OUT, `js/people.js: everyone the Map shows in «Everyone else», and the traders it adds to the shops.
   GENERATED by tools/gen-people.js from kb/data/game/people.json (tools/extract-people.py, the
   game's own scenes): not edited by hand. Change the generator and run npm run data.

     PEOPLE  [{ id, name: { es, en, key } (the game's title), art ('people/<id>': their figure in
             assets/map/, 'journal/<id>': a Journal portrait, null: the herald), spots: [[scene,
             x?, y?]] (their point in the map's pixels), met?, gone?, at?, unsure? }]: the save's
             rules (tools/gen-people.js HAND): met, any of these playerData fields set; gone, left
             or dead; at, [field, value, scene]…, the first that holds says where they are now;
             unsure 'always', no saying where
     TRADE   [{ id, name, note, spots }]: who buys or sells outside the game's ShopOwners
     VARS    the playerData fields those rules read (js/savefile.js keeps them, peopleVars)`,
  'people', [['PEOPLE', PEOPLE], ['TRADE', TRADE], ['VARS', [...VARS].sort()]]);
  const moving = PEOPLE.filter((p) => p.spots.length > 1);
  console.log(`js/people.js  ${PEOPLE.length} people in ${PEOPLE.reduce((n, p) => n + p.spots.length, 0)} spots, `
    + `${PEOPLE.filter((p) => p.met).length} with a met flag, ${moving.filter((p) => p.at).length} of ${moving.length} in more than one place with a rule, `
    + `${PEOPLE.filter((p) => !p.art).length} with no figure, ${TRADE.length} traders  (${size} bytes)`);
  console.log(`  in more than one place, every spot shown: ${moving.filter((p) => !p.at).map((p) => p.id).join(', ')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
