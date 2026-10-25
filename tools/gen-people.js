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
     here   { scene: check }: a spot shown only while its check holds (js/savefile.js has(): flag,
            is, min, not, all, any, accepted, quest), the switches the game turns that object on
            and off by (its Deactivate/ActivateIfPlayerdata*, TestGameObjectActivator,
            PlayerDataTestResponse and their parents'). A spot with none is always shown; one an
            FSM alone switches keeps what the components say. js/savefile.js peopleHere says it
            per save; Free mode shows every spot.
   Left out on purpose: a met flag the save has but none of the person's own scripts read
   (MetBelltownDoctor, MetFisherHome*, SeenHalfwayPatron*, MetEnclaveScaredPilgrim,
   bonetownPilgrim*Seen, pilbyKilled): the check can't tie it to them, so they stay with no state.
   And what only a person's FSM decides (Sherma's shermaPos at the Bell Beast, Gilly's Act 3
   emergings, the Green Prince caged, Mister Mushroom): that spot keeps what its components say.
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
const QU = require('../js/quests.js');
const HW = require('../js/how.js');
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

// A here's checks (js/savefile.js has()), and the fields and quests one reads.
const flag = (f) => ['flag', f], not = (c) => ['not', c], all = (...c) => ['all', ...c], any = (...c) => ['any', ...c];
const is = (f, v) => ['is', f, v], min = (f, n) => ['min', f, n];
const ACT3 = flag('blackThreadWorld');
const fieldsIn = (c) => (['flag', 'is', 'min'].includes(c[0]) ? [c[1]] : ['not', 'all', 'any'].includes(c[0]) ? c.slice(1).flatMap(fieldsIn) : []);
const questsIn = (c) => (['accepted', 'quest'].includes(c[0]) ? [c[1]] : ['not', 'all', 'any'].includes(c[0]) ? c.slice(1).flatMap(questsIn) : []);

/* HAND: per person (their key), what the save says. The rest are in the list with no state.
   Checked over the 77 files of the author's saves (16-Oct-2026, design/03-redesign.md, step 6, the
   save checks, 10 A): the Second Sentinel's resting talk (songChevalierRestingMet) is set in none,
   though both finished games fought him (encounteredSongChevalierBoss; songChevalierEncounters 1
   and 2), both read by his scripts, so those say he's met too. Garmond is gone once Lost Garmond is
   beaten, when his spots kept showing: goneBoss names the boss a person becomes, whose own save
   check (js/spots.js BOSSES, a flag: garmondBlackThreadDefeated) says it, though their own
   scripts don't read it.
   Where they are (gone, here), read 24-Oct-2026 in each spot's object and its parents (the sweep
   after Shakra's): Act 3's "Normal World" switched off by blackThreadWorld, a crowd by its number
   (belltownCrowd), the Songclave's by enclaveLevel (Enclave States' State Setup turns Level n on
   from enclaveLevel n up), the pilgrims who leave. Where an FSM alone switches a spot (Sherma's
   shermaPos at the Bell Beast, Gilly's Act 3 moves, Seth, the Green Prince caged), its components'
   checks are kept and the rest is left shown. */
const NOT_ACT3 = not(ACT3);
const ENCLAVE = (n) => all(NOT_ACT3, min('enclaveLevel', n));
const taken = (q) => all(['accepted', q], not(['quest', q]));
// Nuu outside a boss's room: visiting it, not met there yet (Hunter Fan Outside's switches).
const nuu = (boss) => all(flag('nuuVisiting_' + boss), not(flag('nuuEncountered_' + boss)), NOT_ACT3);
// Ballow resting in the Deep Docks' sauna (Forge_Friend), not at the forge.
const SAUNA = all(flag('BallowInSauna'), not(flag('BallowLeftSauna')), NOT_ACT3);
// The Second Sentinel resting in a room (Song Knight Control): sent there, not met there yet.
const knight = (room) => all(flag('songChevalierActiveIn' + room), not(flag('songChevalierSeenIn' + room)),
  not(flag('songChevalierEncounterCooldown')), not(flag('songChevalierQuestReady')));
const HAND = {
  ANT_ENTRY_PILGRIM: { here: { bone_08: all(flag('ant02GuardDefeated'), not(flag('hasDash'))) } },
  BALLOW: { here: { dock_10: SAUNA, dock_12: flag('BallowMovedToDivingBell'), room_forge: all(not(SAUNA), not(flag('BallowMovedToDivingBell'))) } },
  BB_PILGRIM_HORNED: { here: { bonetown: all(NOT_ACT3, flag('bonetownPilgrimHornedActive'), not(flag('skullKingInvaded')), min('bonetownPilgrimHornedCount', 1)) } },
  BB_PILGRIM_ROUND: { here: { belltown: any(ACT3, all(flag('belltownCrowdsReady'), is('belltownCrowd', 1))),
    bone_08: all(flag('ant02GuardDefeated'), not(flag('hasDash'))),
    bonetown: all(NOT_ACT3, flag('bonetownPilgrimRoundActive'), not(flag('skullKingInvaded')), not(flag('skullKingWillInvade')), min('bonetownPilgrimRoundCount', 1)) } },
  BELLWAY_PILGRIM: { gone: ['blackThreadWorld', 'BonebottomBellwayPilgrimLeft'] },
  BLUE_SCIENTIST: { met: ['BlueScientistMet', 'BlueScientistInfectedMet'], gone: ['BlueScientistDead'] },
  BONETOWN_FUNERAL_LEADER: { here: { bonetown: all(NOT_ACT3, flag('boneBottomFuneral'), not(flag('boneBottomFuneralComplete'))) } },
  CARETAKER: { met: ['metCaretaker'], here: { cradle_03: all(flag('soulSnareReady'), not(flag('caretakerSoulSnareConvo'))),
    song_enclave: all(NOT_ACT3, flag('bellShrineEnclave'), not(min('enclaveLevel', 1))) } },
  /* Bone Bottom's (Churchkeeper Intro Scene's Control: gone while the Skull Tyrant's coming, and from
     the Widow's fall till she's left the basement), the basement's (its DeactivatePlayerDataTest). */
  CHURCHKEEPER: { met: ['churchKeeperIntro'], here: {
    bonetown: all(not(flag('soulSnareReady')), NOT_ACT3, not(all(flag('skullKingWillInvade'), not(flag('skullKingKilled')))),
      any(not(flag('churchKeeperIntro')), flag('ChurchKeeperLeftBasement'), not(flag('spinnerDefeated')))),
    tut_03: all(not(flag('soulSnareReady')), flag('spinnerDefeated'), not(flag('ChurchKeeperLeftBasement')), NOT_ACT3) } },
  BELLHART_GREETER: { met: ['BelltownGreeterConvo'], here: { belltown: all(flag('spinnerDefeated'), NOT_ACT3) } },
  ENCLAVE_PILGRIM: { here: { song_enclave: ENCLAVE(1) } },
  ENCLAVE_PILGRIM_ACT2: { here: { song_enclave: ENCLAVE(2) } },
  ENCLAVE_PILGRIM_ACT2_LARGE: { here: { song_enclave: ENCLAVE(1) } },
  // Their Act 3 figure is the one people.json keeps; the Level's is under Enclave States (reads: its FSM's).
  ENCLAVE_PILGRIM_ACT3: { here: { song_enclave: any(ACT3, ENCLAVE(3)) }, reads: ['enclaveLevel'] },
  ENCLAVE_PILGRIM_LARGE_ACT3: { here: { song_enclave: any(ACT3, ENCLAVE(2)) }, reads: ['enclaveLevel'] },
  FISHER_NPC: { gone: ['blackThreadWorld'] },
  FIXER: { here: { bone_10: ACT3, bonetown: all(NOT_ACT3, any(flag('defeatedBellBeast'), flag('visitedShellwood')), not(flag('skullKingInvaded')),
    not(all(flag('skullKingKilled'), not(flag('skullKingBenchMended')))), not(all(flag('boneBottomFuneral'), not(flag('boneBottomFuneralComplete'))))) } },
  SHERMA: { met: ['metSherma'], here: {
    belltown: all(flag('spinnerDefeated'), flag('shermaInBellhart'), not(flag('shermaSeenInBellhart')), not(flag('shermaSeenInSteps')), NOT_ACT3,
      not(flag('visitedCitadel')), not(all(flag('shermaAtSteps'), flag('UnlockedCoralTowerStation')))),
    bellway_08: all(flag('shermaAtSteps'), not(flag('visitedCitadel'))),
    bone_01: not(flag('metMapper')),
    bone_east_10: NOT_ACT3,
    coral_10: all(not(flag('shermaCitadelSpa_Seen')), not(flag('shermaInEnclave'))),
    song_10: not(flag('shermaInEnclave')),
    song_enclave: all(ENCLAVE(2), not(flag('shermaQuestActive'))),
    ward_09: taken('Save Sherma') } },
  SHERMA_PILGRIM: { here: { belltown: any(ACT3, all(flag('belltownCrowdsReady'), is('belltownCrowd', 6))), bone_10: ACT3,
    bone_east_10: NOT_ACT3, bonetown: NOT_ACT3, halfway_01: NOT_ACT3 } },
  GARMOND: { met: ['metGarmond'], goneBoss: 'lost-garmond', unsure: 'always' },
  SEAMSTRESS: { met: ['MetSeamstress'] },
  STEEL_SENTINEL: { met: ['SteelSentinelMet'] },
  JUDGE_GATE_PILGRIM: { met: ['metGatePilgrim'], gone: ['blackThreadWorld'] },
  // Steel Soul States: the Grub Farmer in a game of the usual mode, his mimic in Steel Soul (permadeathMode).
  GRUBFARMER: { met: ['metGrubFarmer'], here: { dust_11: is('permadeathMode', 0) } },
  GRUBFARMER_MIMIC: { met: ['MetGrubFarmerMimic'], here: { dust_11: not(is('permadeathMode', 0)) } },
  GREEN_PRINCE: { here: { clover_01: not(flag('defeatedCloverDancers')), clover_01b: all(not(flag('fullyEnteredVerdania')), not(flag('defeatedWhiteCloverstag'))),
    clover_06: not(flag('defeatedWhiteCloverstag')), clover_18: not(flag('summonedLakeOrbs')), song_04: all(is('GreenPrinceLocation', 1), NOT_ACT3) } },
  HUNTER_FAN: { met: ['MetHalfwayHunterFan'], at: [['nuuIsHome', true, 'halfway_01']],
    here: { bone_15: nuu('skullKing'), coral_11: nuu('coralDrillers'), coral_29: nuu('zapNest'), shellwood_18: all(nuu('splinterQueen'), flag('defeatedSplinterQueen')) } },
  HUNTRESS_RUNT: { here: { room_huntress: all(ACT3, flag('HuntressRuntAppeared')) } },
  // Song Reed Scene's PlayerDataTestResponse puts him in Hang_07 at songChevalierPosition 1.
  SONG_KNIGHT: { met: ['songChevalierRestingMet', 'encounteredSongChevalierBoss', 'songChevalierEncounters'],
    here: { hang_02: knight('Hang_02'), song_07: knight('Song_07'), song_24: knight('Song_24'), hang_07: all(is('songChevalierPosition', 1), NOT_ACT3) } },
  HH_PATRON_LEFT: { gone: ['HalfwayPatronLeftGone'], here: { halfway_01: all(flag('laceMeetCitadel'), flag('HalfwayPatronsCanVisit'), NOT_ACT3) } },
  HH_PATRON_RIGHT: { gone: ['HalfwayPatronRightGone'], here: { halfway_01: all(flag('spinnerDefeated'), not(flag('laceMeetCitadel')), flag('HalfwayPatronsCanVisit'), NOT_ACT3) } },
  MASK_MAKER: { met: ['MetMaskMaker'] },
  SHELLWOOD_WITCH: { met: ['MetWoodWitch'] },
  GOURMAND_SERVANT: { met: ['MetGourmandServant'] },
  /* Gilly by gillyLocation before Act 3 (0 Ant_05c, 1 Ant_17 once the Citadel's reached), and by
     gillyLocationAct3 after (0 Bone_East_18, 1 Bone_East_24, 3 Ant_Queen), not while her wish (Ant
     Trapper) is taken; her FSM (Behaviour's statue checks) decides the rest. */
  GILLY: { met: ['gillyMet'], here: {
    ant_05c: all(NOT_ACT3, is('gillyLocation', 0)), ant_17: all(NOT_ACT3, is('gillyLocation', 1), flag('visitedCitadel')),
    ant_queen: all(is('gillyLocationAct3', 3), not(taken('Ant Trapper'))),
    bone_east_04c: all(NOT_ACT3, not(flag('visitedHuntersTrail')), not(all(flag('hasWalljump'), not(flag('boneEastJailerClearedOut')),
      not(flag('slab_cloak_battle_completed')), not(flag('visitedUpperSlab'))))),
    bone_east_14b: not(flag('visitedCitadel')),
    bone_east_18: all(is('gillyLocationAct3', 0), not(taken('Ant Trapper'))), bone_east_24: all(is('gillyLocationAct3', 1), not(taken('Ant Trapper'))) } },
  BELL_HERMIT: { met: ['BelltownHermitMet'], gone: ['soulSnareReady', 'blackThreadWorld'] },
  LARGE_COG_WORK: { gone: ['blackThreadWorld'] },
  LAST_CONDUCTOR: { gone: ['blackThreadWorld'] },
  // Pilby: Bone Bottom's until the Skull Tyrant or the Citadel; at the Pilgrim's Rest, outside or in.
  LITTLE_PILGRIM_N: { met: ['pilbyMeetConvo'], here: {
    bone_east_10: all(NOT_ACT3, flag('pilbyAtPilgrimsRest'), not(flag('pilbyInsidePilgrimsRest')), not(flag('pilbyLeftPilgrimsRest'))),
    bone_east_10_room: all(NOT_ACT3, flag('pilbyAtPilgrimsRest'), flag('pilbyInsidePilgrimsRest'), not(flag('pilbyLeftPilgrimsRest'))),
    bonetown: all(NOT_ACT3, not(flag('skullKingInvaded')), not(flag('skullKingKilled')), not(flag('visitedCitadel'))) } },
  OLD_STATUE: { met: ['libraryStatueWoken'] },
  SNAIL_SHAMANS: { here: { tut_04: not(flag('CompletedRedMemory')) } },
  FLEA_LECH: { met: ['CaravanLechMet'], at: [['CaravanLechReturnedToCaravan', false, 'greymoor_24'], ...CAMP], here: { greymoor_24: NOT_ACT3 } },
  FLEA_TRACKER: { met: ['MetTroupeHunterWild'], at: [['MetTroupeHunterWild', false, 'bellway_aqueduct'], ...CAMP] },
  FLEAMEMBER_SHORT: { met: ['MetCaravanTroupeLeader'], at: CAMP },
  // Varga stays in the caravan at the other two camps, and stands in Fleatopia in Act 3 only.
  FLEAMEMBER_TALL: { met: ['MetCaravanTroupeLeader'], at: [CAMP[0], CAMP[3]], here: { aqueduct_05_caravan: ACT3 } },
  SETH_NPC: { met: ['MetSethNPC'], at: [['SethJoinedFleatopia', true, 'aqueduct_05_festival']] },
};

/* Shakra (MAPPER, her own layer, js/spots.js VENDORS.shakra: the 17 rooms she sells in): where she
   is now, spot by spot, as the game decides it (read 24-Oct-2026, patch 1.0.30000, in the scenes,
   the FSM template mapper_evaluate_location of fsmtemplates_assets_mapper.bundle and
   Assembly-CSharp). Every spot but the two Act 3 guard posts runs that template with its area's
   Seen bool (SeenMapper<Area>, the spot's own Dialogue FSM):
     · she's gone from an area once MapperLeft<Area> is set (SceneTravelerTempEval). The game sets
       it for every area she's been seen in (SeenMapper) but the one Hornet sees her in now
       (GameManager.MapperLeavePreviousLocations), and for all of them once her last maps are
       bought (ShakraFinalQuestAppear, PlayerData.MapperLeaveAll);
     · and once Hornet's past the area: the template's "Set Left" states set it on entering any of
       her spots (PASSED below), so a save can lag it, and the rule says it too;
     · Bellhart and Bone Bottom are her rests, never left that way, and Mount Fay's spot keeps her
       while Hornet hasn't the Faydown Cloak (hasDoubleJump), whatever its flag says;
     · nowhere while Trail's End (Shakra Final Quest) is taken and not done (each Dialogue's
       "Quest?" state): she waits at its fight.
   Not one of the 17: the Mapper Master in Shadow_24 who offers Trail's End (the wish's giver mark)
   and its fight in Greymoor_08 (her boss mark). */
const TRAILS_END = 'Shakra Final Quest';
const AT_TRAILS_END = all(['accepted', TRAILS_END], not(['quest', TRAILS_END]));
// The template's "Set Left <Area>": Hornet's past it (Dustpens has none).
const PASSED = {
  BoneForest: flag('defeatedBellBeast'), Docks: any(flag('bellShrineWilds'), flag('spinnerDefeated')),
  Wilds: any(flag('hasBrolly'), flag('spinnerDefeated'), flag('visitedCitadel')),
  Greymoor: all(flag('hasThreadSphere'), not(is('respawnScene', 'Greymoor_02'))),   // not while she rests at its bench
  Shellwood: any(flag('hasWalljump'), flag('spinnerDefeated')), HuntersNest: flag('visitedCitadel'), Crawl: flag('visitedCitadel'),
  Shadow: flag('DefeatedSwampShaman'), CoralCaverns: flag('defeatedCoralDrillerSolo'), JudgeSteps: flag('defeatedLastJudge'),
};
const walks = (area) => all(not(AT_TRAILS_END), not(flag('MapperLeft' + area)), ...(PASSED[area] ? [not(PASSED[area])] : []));
const SHAKRA = {
  // Hunter's March: the battle in Ant_04_mid (its Normal World, its Placement Control: there during
  // the fight, ant04_battleCompleted, and after it once met there) or, not met there, Ant_20 (Mapper States).
  ant_04_mid: all(not(ACT3), any(not(flag('ant04_battleCompleted')), flag('mapperMetInAnt04')), walks('HuntersNest')),
  ant_20: all(not(flag('mapperMetInAnt04')), walks('HuntersNest')),
  /* Bellhart's Mapper Control: in Act 3 her rest while mapperLocationAct3 is 2 (GameManager.TimePasses
     draws it, 1 to 3, once seen in Act 3); before, once the Widow's beaten (spinnerDefeated), but not
     while her last maps are bought and Trail's End isn't done. */
  belltown: any(all(ACT3, is('mapperLocationAct3', 2)),
    all(not(ACT3), flag('spinnerDefeated'), not(AT_TRAILS_END), not(all(flag('ShakraFinalQuestAppear'), not(['quest', TRAILS_END]))))),
  bone_04: walks('BoneForest'),
  bone_east_01: walks('Docks'),
  bone_east_21: walks('Wilds'),
  // Bone Bottom's Mapper Control: from the Bell Beast's fall to the Widow's, unless the Skull Tyrant comes.
  bonetown: all(flag('defeatedBellBeast'), not(ACT3), not(flag('spinnerDefeated')), not(flag('skullKingInvaded')),
    not(flag('skullKingWillInvade')), not(AT_TRAILS_END)),
  coral_12: walks('JudgeSteps'),
  coral_40: walks('CoralCaverns'),
  crawl_01: walks('Crawl'),
  dust_10: walks('Dustpens'),
  greymoor_02: walks('Greymoor'),
  // Act 3's guard posts (Shakra Guard Scene): off at mapperLocationAct3 1 or 2, or with the caravan in
  // Greymoor (CaravanInGreymoor: CaravanTroupeLocation 1); Shellwood's at 2 or 3. At 0, not met yet: both.
  greymoor_08: all(ACT3, not(is('mapperLocationAct3', 1)), not(is('mapperLocationAct3', 2)), not(is('CaravanTroupeLocation', 1))),
  peak_02: all(not(AT_TRAILS_END), not(flag('hasDoubleJump'))),
  shadow_23: walks('Shadow'),
  shellwood_01: all(ACT3, not(is('mapperLocationAct3', 2)), not(is('mapperLocationAct3', 3))),
  shellwood_16: walks('Shellwood'),
};
// The fields Shakra's rules read that her scenes' objects don't (the template's, and the property
// CaravanInGreymoor): tools/extract-people.py reads only the scenes.
const SHAKRA_READS = new Set(['blackThreadWorld', 'CaravanTroupeLocation', 'hasDoubleJump', 'MapperLeftDustpens',
  ...Object.keys(PASSED).map((a) => 'MapperLeft' + a), ...Object.values(PASSED).flatMap(fieldsIn)]);

// A point of a scene where the game places it on its map, as tools/gen-spots.js places the rest
// (tools/map-point.js: an interior's own coordinates aren't its door room's).
const { toMap } = require('./map-point.js')(SIZES);
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
      const at = toMap(scene, x, y);
      // Off their scene in a room the map draws: parked, a turn missed or a walker's path not read
      // (tools/extract-people.py). Since 16-Oct-2026 nobody is; only interiors and points go without.
      const room = R.roomOf(scene), box = room.exact && M.ROOMS[room.scene];
      if (!at && box && box[2]) fail(`${key} in ${scene} is off the scene (${x}, ${y}): read them again`);
      seen.set(scene, at ? [scene, ...at] : [scene]);
    }
    return [...seen.values()];
  };
  const check = (key, h) => {
    const fs1 = fieldsOf(key), rooms = new Set(spotsOf(key).map((s) => s[0]));
    for (const f of [...(h.met || []), ...(h.gone || []), ...(h.at || []).map((a) => a[0])]) {
      if (!fs1.has(f) && !(f === 'blackThreadWorld' && (h.gone || []).includes(f))) fail(`${key}: ${f} isn't read by any of their scripts: HAND needs reading again`);
    }
    for (const [, , scene] of h.at || []) if (!rooms.has(scene)) fail(`${key}: ${scene} isn't one of their rooms (${[...rooms].join(', ')})`);
    for (const [scene, c] of Object.entries(h.here || {})) {
      if (!rooms.has(scene)) fail(`${key}: here ${scene} isn't one of their rooms (${[...rooms].join(', ')})`);
      // blackThreadWorld: Act 3's switch, on a scene's Black Thread States, not always among a person's objects' tests.
      for (const f of fieldsIn(c)) if (!fs1.has(f) && f !== 'blackThreadWorld' && ![...(h.reads || [])].includes(f)) fail(`${key}: here ${scene} reads ${f}, which none of their objects tests: HAND needs reading again`);
      for (const q of questsIn(c)) if (!QU.CHAIN[q]) fail(`${key}: here ${scene} names the quest ${q}, which js/quests.js hasn't`);
    }
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
  // A 'room:who' giver (js/spots.js QUEST_GIVER) stands in its room.
  for (const [id, g] of Object.entries(SP.GIVER)) if (g && !ELSEWHERE[g[0]] && !merged.has(g[0])) absorb(g[0], id.split(':')[0], 'giver:' + id.toLowerCase());
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
    const followed = (key) => [key, ...(SAME[key] || [])].some((k) => [...((HAND[k] || {}).at || []).map((a) => a[2]),
      ...Object.keys((HAND[k] || {}).here || {})].some((sc) => roomKey(sc) === room));
    if (near.length && !(near[1] && near[1][1] - near[0][1] < 0.5) && !followed(near[0][0])) absorb(near[0][0], x[3], 'task:' + i);
  });
  const PEOPLE = [], VARS = new Set();
  // Gone also once the boss they become is beaten (HAND goneBoss): that boss's own check, a flag.
  const bossFlag = (foe) => {
    const b = SP.BOSSES.find((x) => x[0] === foe) || fail(`goneBoss: no boss ${foe} in js/spots.js`);
    return b[2][0] === 'flag' ? b[2][1] : fail(`goneBoss: ${foe}'s check isn't a flag`);
  };
  const goneOf = (h) => [...(h.gone || []), ...(h.goneBoss ? [bossFlag(h.goneBoss)] : [])];
  const used = (h) => { for (const f of [...(h.met || []), ...goneOf(h), ...(h.at || []).map((a) => a[0])]) VARS.add(f); };
  for (const key of keys) {
    if (ELSEWHERE[key]) continue;
    const spots = place(key).filter((sp) => !(absorbed.get(key) || new Set()).has(roomKey(sp[0])));
    if (!spots.length) { console.log(`  ${key}: no spot on the map (${spotsOf(key).map((s) => s[0]).join(', ')})`); continue; }
    const h = HAND[key] || {};
    check(key, h);
    used(h);
    const id = idOf(key);
    const art = fs.existsSync(path.join(FIGS, id + '.webp')) ? 'people/' + id : PORTRAIT[key] ? 'journal/' + PORTRAIT[key] : null;
    const here = Object.entries(h.here || {}).filter(([sc]) => spots.some((sp) => sp[0] === sc));
    PEOPLE.push({ id, name: titleOf(key), art, spots, met: h.met, gone: goneOf(h).length ? goneOf(h) : undefined, at: h.at, unsure: h.unsure,
      here: here.length ? Object.fromEntries(here) : undefined });
  }
  // Shakra's spots (js/spots.js VENDORS.shakra), each with its rule: every one, and only those.
  const SH = SP.VENDORS.shakra.map((sc) => sc.toLowerCase());
  for (const sc of SH) if (!SHAKRA[sc]) fail(`Shakra's ${sc} has no rule: SHAKRA needs reading again`);
  for (const sc of Object.keys(SHAKRA)) if (!SH.includes(sc)) fail(`SHAKRA: ${sc} isn't one of her spots (js/spots.js VENDORS.shakra)`);
  check('MAPPER', { here: SHAKRA, reads: SHAKRA_READS });
  const HERE = { shakra: SHAKRA };
  const TRADE = [];
  for (const [id, t] of Object.entries(TRADERS)) {
    const key = t.keys[0], h = HAND[key] || {};
    check(key, h);
    used(h);
    const spots = t.keys.flatMap((k) => place(k));
    if (!spots.length) fail(`${id}: no room on the map`);
    TRADE.push({ id, name: titleOf(key), note: t.note, spots: spots.slice(0, 1) });
  }
  /* Who gives a thing of the 100% (js/spots.js PEOPLE, ELSEWHERE 'person'), by their npc id: their
     figure, which the Map draws with the herald on it (design/03-redesign.md, step 6, round 108, C);
     null, none (Eva): the herald alone. */
  const GIVERS = {};
  for (const id of Object.keys(SP.PEOPLE)) {
    const key = ((HW.NPCS[id] || {}).key || '').replace(/_MAIN$/, '');
    if (ELSEWHERE[key] !== 'person') continue;
    GIVERS[id] = fs.existsSync(path.join(FIGS, idOf(key) + '.webp')) ? 'people/' + idOf(key) : null;
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
             unsure 'always', no saying where; here, { scene: check }, a spot shown only while its
             check holds (js/savefile.js has(), peopleHere)
     TRADE   [{ id, name, note, spots }]: who buys or sells outside the game's ShopOwners
     HERE    { layer id: { scene: check } }: the same for who's drawn under another layer
             (shakra: her 17 spots, js/spots.js VENDORS.shakra)
     GIVERS  { npc id: 'people/<id>' | null }: the figure of who gives a thing of the 100%
             (js/spots.js PEOPLE), drawn with the herald on it; null: the herald alone
     VARS    the playerData fields those rules read (js/savefile.js keeps them, peopleVars)`,
  'people', [['PEOPLE', PEOPLE], ['TRADE', TRADE], ['HERE', HERE], ['GIVERS', GIVERS], ['VARS', [...VARS].sort()]]);
  const moving = PEOPLE.filter((p) => p.spots.length > 1);
  console.log(`js/people.js  ${PEOPLE.length} people in ${PEOPLE.reduce((n, p) => n + p.spots.length, 0)} spots, `
    + `${PEOPLE.filter((p) => p.met).length} with a met flag, ${moving.filter((p) => p.at || p.here).length} of ${moving.length} in more than one place with a rule, ${PEOPLE.filter((p) => p.here).length} with spots by the save (here), `
    + `${PEOPLE.filter((p) => !p.art).length} with no figure, ${TRADE.length} traders  (${size} bytes)`);
  console.log(`  in more than one place, every spot shown: ${moving.filter((p) => !p.at && !p.here).map((p) => p.id).join(', ')}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
