#!/usr/bin/env node
/* tools/gen-requires.js: generates js/requires.js: what each Map mark still asks of the player
   before its thing can be had (or its person met, its boss fought), and what it takes to enter
   each area, as data, no prose.
     node tools/gen-requires.js     (npm run data runs it last, after gen-spots and gen-people)
   Offline. Albert's design (31-Oct-2026): every mark's card lists what's still missing, each
   requirement a chip that is a button to the mark where it's had; with a save only the missing
   ones (js/savefile.js game() evaluates CHECKS, needs), in Free mode all. A card adds its area's
   requirements (AREAS) to its own (MARKS); a giver's or a Wishwall's card shows WISHES for each wish
   still open there (a wish's requirements are the wish's, not its giver's: Greyroot has two).

   The sources, best first (the repo's rule: the game's own data wins, then the English wiki's item
   and area pages; the completionist's prereqs only as a hint):
     1. the game's files, through the site's generated data: each wish's playerData test (js/quests.js
        CHAIN when), the wishes and groups it waits for (needs, groups, prev), the wish a reward waits
        on (js/how.js HOW after), the keys and abilities a thing lies behind (js/how.js NEEDS), a
        reward's own way (HOW: a wish, a boss, a shop's after and needs, Mooshka's fleas, Plinney's
        Pale Oil, Cardinius' Sacred Cylinder), what a fight or a room waits for (js/spots.js OPENS),
        each wish's place taken (TASKS: what a wish asks for and where it's done shows while it's
        on), a main objective's step before (CHAIN prev), and the Acts (each mark's own Act against
        its area's, js/spots.js AREA_ACT and ROOM_ACT, tools/mark-keys.js);
     2. the wiki (kb/data/raw/, npm run kb): the areas' "How to Access" (AREAS below), the wishes'
        infobox prerequisite (HAND_WISH), the location tables and "How to Acquire" of the things
        (HAND), each row with its page cited;
     3. HAND: what no parseable source says, read in those pages one by one (the Map requirements
        audit of 31-Oct-2026, five groups: pieces, Tools, bosses, wishes, people), each row with its
        source in a comment. A row the audit rated low (one weak source, or only the completionist)
        isn't kept (design/00-study.md §4.10 lists them). What has no save check (a lever, a shortcut,
        a talk no flag records), a price (rosaries, Craftmetal, a toll), a condition against (before
        Act 3, not bought, the other mode), a count no check can say (Crest slots, wish points) and
        what the game picks at random isn't a requirement either.
   An area requirement is had by every mark in it, so a mark doesn't repeat it (the generator
   drops it from MARKS), nor a requirement pointing at the mark itself.

   What it writes:
     AREAS   { area id (js/rooms.js areaOf, js/collectibles.js AREAS): [req] }: to enter it, only
             what every way in asks (the Citadel's areas their Act; Sands of Karak the Clawline)
     MARKS   { Map mark key (tools/mark-keys.js): [req] }: the thing's own (its room, its route)
     WISHES  { quest save name (js/quests.js CHAIN): [req] }: before the game offers that wish (a
             board's Pre and the stage after it share one wish: the stage has the Pre's too)
     CHECKS  [save check]: every distinct check, by index, in js/savefile.js has()'s forms (plus
             ['count', n, check…]: at least n of those hold)
     req = { kind, name: { es, en, key }, to, check, alt, n? }
       kind   'wish' (done, or taken: its check says), 'item' (to bring or hold, or a count: n),
              'key', 'ability' (needed to reach it, never "recommended"), 'boss' (a boss or an
              enemy gauntlet beaten), 'event' (something else that happened: a person met, a station
              opened, the caravan moved), 'act' (from that Act on)
       name   the game's name for it, with its key (CLAUDE.md "Translations"): a person, a place,
              a boss, a wish, a thing; npm run text -- --audit checks every one
       to     the Map mark where it's had or done, several comma-separated when it's had in more
              than one place (a Simple Key, a Psalm Cylinder), or null (the Act, a count of many)
       check  an index into CHECKS (null: the save can't say)
       alt    null: always needed; 'a' / 'b': either every 'a' or every 'b' of that list
       n      how many (Lost Fleas, Pale Oil) */
'use strict';
const path = require('path');
const { names } = require('./names.js');
const { write } = require('./emit.js');
const W = require('./wiki.js');
const { markKeys } = require('./mark-keys.js');

const fail = (m) => { console.error('gen-requires: ' + m); process.exit(1); };
const lower = (s) => String(s || '').toLowerCase();

require('../js/data.js');
require('../js/map.js');
require('../js/graph.js');
const R = require('../js/rooms.js');
const D = require('../js/data.js');
const CO = require('../js/collectibles.js');
const QU = require('../js/quests.js');
const HW = require('../js/how.js');
const SP = require('../js/spots.js');
const PE = require('../js/people.js');
const GA = require('../js/gauntlets.js');
const E = require('../js/enemies.js');
const MAP = require('../js/map.js');
const F = require('../js/savefile.js');

/* ── Requirements by ref ────────────────────────────────────────────────────
   Every requirement is written as a ref, 'type:arg', with '*n' for a count and '|a' or '|b' for an
   alternative: 'art:clawline', 'wish:Shell Flowers' (done), 'took:Shell Flowers' (taken),
   'boss:widow', 'gaunt:deep-docks-1', 'key:white', 'act:2', 'item:Wood Witch Item' (held, by its
   save name), 'tool:claw-mirror', 'piece:118', 'extra:19', 'everbloom', 'map' (any area map),
   'needle:2', 'fleas:22', 'bell:bellShrineWilds', 'ev:<EVENTS id>'. resolve() turns one into
   { kind, name, to, check, n }. */

/* EVENTS: what else has to have happened, each by the person, place or thing it's about (its game
   name), the mark where it happens and the save's flag. [name, to, check], name one of 'pe:<js/people.js
   id>', 'npc:<js/how.js NPCS id>', 'area:<area id>', 'foe:<js/enemies.js id>', 'text:<key>',
   'tool:<id>', 'wish:<quest>'. Read in the wiki pages each cites and js/savefile.js, js/people.js,
   js/app-progress.js (the posting rules, read in the game's quest assets on 31-Oct-2026). */
const EVENTS = {
  // Styx's first grub grown, so a Silkeater can be bought (Queen's Egg's test; Styx.wiki).
  'styx-grub': ['pe:grubfarmer', 'npc:grubfarmer:dust_11', ['flag', 'farmer_grewFirstGrub']],
  // A relic sold to Scrounge (Restoration of Bellhart's test, BelltownRelicDealerGaveRelic).
  'scrounge-relic': ['text:BELLHART_RELICDEALER_MAIN', 'person:scrounge', ['flag', 'BelltownRelicDealerGaveRelic']],
  // Every Psalm Cylinder given to Cardinius (Vaultkeeper_Cardinius.wiki).
  'cardinius-done': ['pe:librarian-relic', 'npc:librarian-relic:library_08', ['flag', 'LibrarianCollectionComplete']],
  // The Ventrica stations (js/map.js PINS, their flags; Ventrica.wiki).
  'tube-song': ['text:KEY_TUBE', 'pin:93', ['flag', 'UnlockedSongTube']],
  'tube-enclave': ['text:KEY_TUBE', 'pin:94', ['flag', 'UnlockedEnclaveTube']],
  'tube-city': ['text:KEY_TUBE', 'pin:91', ['flag', 'UnlockedCityBellwayTube']],
  'tube-hang': ['text:KEY_TUBE', 'pin:92', ['flag', 'UnlockedHangTube']],
  'tube-arborium': ['text:KEY_TUBE', 'pin:90', ['flag', 'UnlockedArboriumTube']],
  'tube-under': ['text:KEY_TUBE', 'pin:97', ['flag', 'UnlockedUnderTube']],
  // Songclave founded (its Bellshrine rung, then a rest away) and grown (enclaveLevel; Songclave.wiki).
  'songclave-1': ['area:ENCLAVE', 'bell:bellShrineEnclave', ['min', 'enclaveLevel', 1]],
  'songclave-2': ['area:ENCLAVE', 'board:song_enclave', ['min', 'enclaveLevel', 2]],
  'songclave-3': ['area:ENCLAVE', 'board:song_enclave', ['min', 'enclaveLevel', 3]],
  // Four of Songclave's wishes, then a rest away (Strengthening Songclave's test; js/app-progress.js STEPS).
  'clave-board': ['area:ENCLAVE', 'board:song_enclave', ['flag', 'enclaveDonation2_Available']],
  'creige-met': ['text:HH_BARTENDER_MAIN', 'shop:creige:0', ['flag', 'HalfwayPatronsCanVisit']],
  // The Flea Caravan's stops (CaravanTroupeLocation 1 Greymoor, 2 the Blasted Steps, 3 Fleatopia; js/acts.js LEGS), by Mooshka.
  'caravan-1': ['text:FLEAMASTER_MAIN', 'pin:105', ['min', 'CaravanTroupeLocation', 1]],
  'caravan-2': ['text:FLEAMASTER_MAIN', 'pin:106', ['min', 'CaravanTroupeLocation', 2]],
  'caravan-3': ['text:FLEAMASTER_MAIN', 'pin:107', ['min', 'CaravanTroupeLocation', 3]],
  'garmond-met': ['pe:garmond', 'npc:garmond:greymoor_05', ['flag', 'metGarmond']],
  // Hero's Call's test (Garmond met three times in Act 3, or the Everbloom: Hero's_Call.wiki).
  'garmond-ready': ['pe:garmond', null, ['flag', 'garmondFinalQuestReady']],
  // Where Gilly waits next (js/people.js here: gillyLocation, gillyLocationAct3; Gilly.wiki).
  'gilly-1': ['pe:gilly', 'npc:gilly:ant_05c', ['is', 'gillyLocation', 1]],
  'gilly-3a': ['pe:gilly', 'npc:gilly:bone_east_18', ['is', 'gillyLocationAct3', 1]],
  'gilly-3b': ['pe:gilly', 'npc:gilly:bone_east_24', ['is', 'gillyLocationAct3', 3]],
  // The Green Prince's cell opened (js/spots.js EXTRAS lock of Dust_02, UnlockedDustCage; Green_Prince.wiki).
  'prince-freed': ['pe:green-prince', 'npc:green-prince:dust_02', ['flag', 'UnlockedDustCage']],
  // Eva's first gift: the Hunter Crest evolved (js/spots.js EXTRAS eva).
  'hunter-v2': ['text:CREST_UPG_SHRINE_MAIN', 'extra:1391', ['crest', 'Hunter_v2']],
  // Vog met at her camp above the Putrified Ducts' Bellway, so she joins the caravan (MetTroupeHunterWild; Vog.wiki).
  'vog-met': ['pe:flea-tracker', 'npc:flea-tracker:bellway_aqueduct', ['flag', 'MetTroupeHunterWild']],
  'kratt-freed': ['pe:flea-lech', 'npc:flea-lech:greymoor_24', ['flag', 'CaravanLechReturnedToCaravan']],
  // Lace met in the Choral Chambers (laceMeetCitadel; Lace.wiki).
  'lace-citadel': ['foe:lace', null, ['flag', 'laceMeetCitadel']],
  'caretaker-met': ['pe:caretaker', 'npc:caretaker:song_enclave', ['flag', 'metCaretaker']],
  // Mister Mushroom at each spot before (Passing of the Age, MushroomQuestFound1..6; js/spots.js TASKS).
  'mushroom-1': ['pe:mr-mushroom', 'task:90', ['flag', 'MushroomQuestFound1']],
  'mushroom-2': ['pe:mr-mushroom', 'task:91', ['flag', 'MushroomQuestFound2']],
  'mushroom-3': ['pe:mr-mushroom', 'task:92', ['flag', 'MushroomQuestFound3']],
  'mushroom-4': ['pe:mr-mushroom', 'task:93', ['flag', 'MushroomQuestFound4']],
  'mushroom-5': ['pe:mr-mushroom', 'task:94', ['flag', 'MushroomQuestFound5']],
  'mushroom-6': ['pe:mr-mushroom', 'task:95', ['flag', 'MushroomQuestFound6']],
  // Moorwing seen, so Garmond talks of it (garmondMoorwingConvoReady; Garmond_and_Zaza.wiki).
  'moorwing-seen': ['foe:moorwing', 'boss:moorwing', ['flag', 'garmondMoorwingConvoReady']],
  'skarr-dead': ['npc:mottled-skarr', 'shop:mottled-skarr:0', ['flag', 'antMerchantKilled']],
  'nuu-met': ['pe:hunter-fan', 'giver:halfway_01:hunter_fan', ['flag', 'MetHalfwayHunterFan']],
  // Pebb and Pilby gone on their pilgrimages (js/people.js here; Pebb.wiki, Pilby.wiki).
  'pebb-gone': ['npc:pebb', 'shop:pebb:0', ['flag', 'bonetownPilgrimHornedActive']],
  'pilby-gone': ['pe:little-pilgrim-n', 'npc:little-pilgrim-n:bonetown', ['flag', 'bonetownPilgrimRoundActive']],
  'pilby-met': ['pe:little-pilgrim-n', 'npc:little-pilgrim-n:bonetown', ['flag', 'pilbyMeetConvo']],
  // The second Skull Tyrant on its way to Bone Bottom (js/spots.js BOSSES more.coming).
  'tyrant-invades': ['foe:skull-tyrant', 'boss:skull-tyrant-bone-bottom', ['any', ['flag', 'skullKingWillInvade'], ['flag', 'skullKingInvaded']]],
  'seth-met': ['pe:seth-npc', 'npc:seth-npc:greymoor_02', ['flag', 'MetSethNPC']],
  // Areas visited (the wishes' tests: Volatile Flintbeetles, A Lifesaving Bridge, Balm for the Wounded…).
  'visited-shellwood': ['area:SHELLWOOD', null, ['flag', 'visitedShellwood']],
  'visited-greymoor': ['area:GREYMOOR', null, ['flag', 'visitedGreymoor']],
  'visited-enclave': ['area:ENCLAVE', 'bell:bellShrineEnclave', ['flag', 'visitedEnclave']],
  'visited-ward': ['area:WARD', 'extra:1042', ['flag', 'visitedWard']],
  'chapel-maid-met': ['pe:churchkeeper', 'npc:churchkeeper:tut_03', ['flag', 'churchKeeperIntro']],
  // Ballow gone to the diving bell (The Dark Below) and to the sauna (js/people.js here; Ballow.wiki).
  'ballow-bell': ['pe:ballow', 'task:77', ['flag', 'BallowMovedToDivingBell']],
  'ballow-sauna': ['pe:ballow', 'npc:ballow:dock_10', ['flag', 'BallowInSauna']],
  // The Second Sentinel woken with the three Cogheart Pieces, and its wish posted (js/app-progress.js knightPosts).
  'sentinel-woken': ['pe:song-knight', 'npc:song-knight:cog_10', ['flag', 'wokeSongChevalier']],
  'sentinel-ready': ['pe:song-knight', null, ['flag', 'songChevalierQuestReady']],
  // The Threefold Melody played at the Cogwork Core's statues: the lift to the Cradle (The_Cradle.wiki).
  'melody-lift': ['wish:Citadel Ascent Melodies', 'task:63', ['flag', 'UnlockedMelodyLift']],
  // The Vaultborn freed, so the Whispering Vaults' second gauntlet is on (js/spots.js OPENS freed).
  'vaultborn-freed': ['text:NAME_SCHOLAR', null, ['flag', 'scholarAcolytesReleased']],
  // Eva's Vesticrest and its second slot (js/spots.js EXTRAS eva).
  'vest-yellow': ['text:UI_MSG_TITLE_EXTRASLOT_NAME', 'extra:1392', ['flag', 'UnlockedExtraYellowSlot']],
  'vest-blue': ['text:UI_MSG_TITLE_EXTRASLOT_NAME', 'extra:1393', ['flag', 'UnlockedExtraBlueSlot']],
  // The Soul Snare built (soulSnareReady; Silk_and_Soul.wiki).
  'snare-ready': ['wish:Silk Defeat Snare', 'giver:song_enclave', ['flag', 'soulSnareReady']],
  'pavo-met': ['pe:bellhart-greeter', 'npc:bellhart-greeter:belltown', ['flag', 'BelltownGreeterMetTimePassed']],
  'sherma-met': ['pe:sherma', 'npc:sherma:song_enclave', ['flag', 'metShermaEnclave']],
  // Shakra's maps bought and Groal beaten or two melodies learnt, then a rest (Trail's End's test; Trail's_End.wiki).
  'shakra-ready': ['npc:shakra', 'shakra:0', ['flag', 'ShakraFinalQuestAppear']],
  // Jubilana ready to leave for the Memorium (The Lost Merchant's test; The_Lost_Merchant.wiki).
  'jubilana-bridge': ['npc:jubilana', 'shop:jubilana:2', ['flag', 'cityMerchantCanLeaveForBridge']],
  // The Egg of Flealia had and the Putrified Ducts left (Ecstasy of the End's test; Ecstasy_of_the_End.wiki).
  'flea-games': ['tool:egg-of-flealia', 'tools:egg-of-flealia', ['flag', 'FleaGamesCanStart']],
  // Skarrsinger Karmelita met in the Far Fields (The Hidden Hunter's test; The_Hidden_Hunter.wiki).
  'karmelita-met': ['foe:skarrsinger-karmelita', null, ['flag', 'metAntQueenNPC']],
  // Another Ventrica station opened, which lights the Terminus (js/map.js PINS; Ventrica.wiki).
  'tube-any': ['text:KEY_TUBE', null, ['any', ...['Arborium', 'CityBellway', 'Hang', 'Song', 'Enclave', 'Under'].map((t) => ['flag', 'Unlocked' + t + 'Tube'])]],
  // A Psalm Cylinder to give Cardinius (Vaultkeeper_Cardinius.wiki; js/spots.js EXTRAS psalm-cylinder).
  'psalm-any': ['text:INV_NAME_R_PSALM_CYL', SP.EXTRAS.map((x, i) => (x[0] === 'psalm-cylinder' && x[2][0] === 'relic' && !/Melody/.test(x[2][1]) ? 'extra:' + i : null)).filter(Boolean).join(','), ['any', ...SP.EXTRAS.filter((x) => x[0] === 'psalm-cylinder' && x[2][0] === 'relic' && !/Melody/.test(x[2][1])).map((x) => x[2])], 'item'],
  // Halfway up the Citadel: the Cogwork Dancers beaten, the Clawline or Songclave entered (citadelHalfwayComplete; Bellhart's_Glory.wiki).
  'citadel-halfway': ['foe:cogwork-dancers', 'boss:cogwork-dancers', ['flag', 'citadelHalfwayComplete']],
  // Caught by a Wardenfly and taken to the Slab (Slab_03's caged door; The_Slab.wiki "Capture by Wardenfly").
  wardenfly: ['foe:wardenfly', null, ['bool', 'Slab_03', 'door_slabCaged']],
  // The Slab's Cloakless fight won (The Wailing Mother's test; js/gauntlets.js the-slab-2 and -3 done).
  'slab-cloak': ['gaunt:the-slab-3', 'gaunt:the-slab-3', ['flag', 'slab_cloak_battle_completed']],
};

/* WHEN: a wish's playerData test (js/quests.js CHAIN when) → refs, for the fields no rule below
   reads: the has* flags are abilities (js/savefile.js ART_PD, SKILL_PD), a boss's or a gauntlet's
   flag is that fight, act2Started and blackThreadWorld the Acts. A field a test only wants false
   (blackThreadWorld false, soulSnareReady false) is a condition against, not kept; one not here
   and not read by those rules stops the generator. Each read in the wiki page of its wish. */
const WHEN = {
  'nailUpgrades>0': ['needle:1'],
  BelltownRelicDealerGaveRelic: ['ev:scrounge-relic'],
  BelltownGreeterMetTimePassed: ['ev:pavo-met'],
  // Restoration of Bellhart done, then a rest outside Bellhart: its wish (needs) says it.
  'BelltownHouseState==1': [],
  // The Cogwork Dancers beaten, the Clawline or Songclave entered (Bellhart's_Glory.wiki).
  citadelHalfwayComplete: ['ev:citadel-halfway'],
  visitedGreymoor: ['ev:visited-greymoor'],
  visitedShellwood: ['ev:visited-shellwood'],
  visitedEnclave: ['ev:visited-enclave'],
  // The Citadel entered (An_Icon_of_Hope.wiki "Enter the Citadel").
  citadelWoken: ['act:2'],
  // A Lifesaving Bridge done (its wish, needs).
  fixerBridgeConstructed: ['wish:Building Materials (Bridge)'],
  farmer_grewFirstGrub: ['ev:styx-grub'],
  'CaravanTroupeLocation==3': ['ev:caravan-3'],
  UnlockedMelodyLift: ['ev:melody-lift'],
  SlaveDeliveryQuestCompleted: ['wish:Courier Delivery Dustpens Slave'],
  'enclaveLevel>0': ['ev:songclave-1'],
  'enclaveLevel>1': ['ev:songclave-2'],
  'enclaveLevel>2': ['ev:songclave-3'],
  FleaGamesCanStart: ['ev:flea-games'],
  garmondFinalQuestReady: ['ev:garmond-ready'],
  // The Needle Strike learnt (Fatal_Resolve.wiki).
  pinstressQuestReady: ['art:needle-strike'],
  cityMerchantCanLeaveForBridge: ['ev:jubilana-bridge'],
  GourmandQuestAccepted: ['took:Great Gourmand'],
  // Sherma met in Songclave and the Whiteward visited, then a rest away (js/app-progress.js STEPS).
  shermaQuestActive: ['ev:sherma-met', 'ev:visited-ward'],
  songChevalierQuestReady: ['ev:sentinel-woken', 'ev:sentinel-ready'],
  ShakraFinalQuestAppear: ['ev:shakra-ready'],
  enclaveDonation2_Available: ['ev:clave-board'],
  metAntQueenNPC: ['ev:karmelita-met'],
  slab_cloak_battle_completed: ['ev:slab-cloak'],
  // A shop's needs (js/how.js HOW): the Ruined Tool shown to the Forge Daughter or the Twelfth Architect (Silkshot.wiki).
  ForgeDaughterMentionedWebShot: ['extra:1047'],
  ArchitectMentionedWebShot: ['extra:1047'],
  // The four Soul Snare tests (js/quests.js GROUPS): the Bellhome's key from Pavo.
  BelltownGreeterHouseFullDlg: ['key:bellhome'],
};

/* HAND_WISH: what a wish's wiki infobox asks besides the game's test, where the game's data has
   nothing against it (CHAIN has no test for the wish, or the wiki names what the game checks in
   the giver's own script). Where the two disagree the game wins, and the wiki's is noted here:
     The Hidden Hunter   the wiki adds the Silk Soar; the game asks only metAntQueenNPC
     Liquid Lacquer      the wiki (its item page) adds a talk with the Mask Maker; not in the test
     Queen's Egg         the wiki adds another delivery done; the game asks only farmer_grewFirstGrub
     Bone Bottom Supplies  the wiki asks the Bell Beast; the game only "not Act 3" (and My Missing Brother, below)
     Silk and Soul       the wiki lists the Bellhome Key; the game's group asks Bellhart's Glory and the
                         key's flag (BelltownGreeterHouseFullDlg), both kept */
const HAND_WISH = {
  // Rite_of_Rebirth.wiki prerequisite: Rite of the Pollip done and the Twisted Bud held (Greyroot's
  // talk takes it; "speak to Greyroot while in possession of the Twisted Bud").
  'Wood Witch Curse': ['wish:Shell Flowers', 'item:Wood Witch Item'],
  // Advanced_Alchemy.wiki: Alchemist's Assistant done, Act 3.
  'Extractor Blue Worms': ['wish:Extractor Blue', 'act:3'],
  // Runtfeast.wiki: Act 3 (js/how.js HOW longclaw's Runt way, act 3).
  'Huntress Quest Runt': ['act:3'],
  // A_Vassal_Lost.wiki: any map.
  'Steel Sentinel': ['map'],
  // Passing_of_the_Age_(Wish).wiki: Act 3 and the Silk Soar (the Mr Mushroom Tablet; CHAIN has no test).
  'Mr Mushroom': ['act:3', 'art:silk-soar'],
  // The_Lost_Merchant.wiki: Strengthening Songclave among the five, the Faydown Cloak.
  'Save City Merchant Bridge': ['wish:Songclave Donation 2', 'art:faydown-cloak'],
};
// Delivery_Wishes.wiki: My Missing Brother "Unlocks Delivery Wishes" (the Couriers' own).
for (const q of Object.keys(QU.CHAIN)) if (q.startsWith('Courier Delivery ')) (HAND_WISH[q] = HAND_WISH[q] || []).push('wish:Save Courier Tall');

/* AREAS: to enter each area, what every way in asks (each area page's "How to Access", read
   31-Oct-2026), plus js/spots.js AREA_ACT's Act (every room of it from that Act). Areas with several
   ways in that ask different things (Greymoor, Bellhart, Shellwood, the Wormways, Bilewater, the
   Underworks, the Far Fields from Greymoor's side) get none: their marks keep their own. */
const AREA_HAND = {
  CORAL_STEPS: ['art:cling-grip'],        // Blasted_Steps.wiki: "The Cling Grip is required to enter the area."
  DUSTPENS: ['art:cling-grip'],           // Sinner's_Road.wiki: "can only be accessed after obtaining the Cling Grip"
  CORAL_RIVER: ['art:clawline'],          // Sands_of_Karak.wiki: the Clawline rings, "the only entry point"
  HANG: ['art:clawline'],                 // High_Halls.wiki: "The Clawline ability is required to access"
  MOUNTAIN: ['art:clawline'],             // Mount_Fay.wiki: "The Clawline is needed to access it."
  ARBORIUM: ['art:faydown-cloak'],        // Memorium.wiki: "The Faydown Cloak is required for access."
  WISP: ['art:faydown-cloak'],            // Wisp_Thicket.wiki: "The Faydown Cloak is required to enter this area."
  WEAVE_PRIME: ['art:needolin'],          // Weavenest_Atla.wiki: a Needolin door, every time
  WARD: ['key:white'],                    // Whiteward.wiki: its lift "must be unlocked with the White Key"
  ABYSS: ['key:diving-bell'],             // The_Abyss_(Silksong).wiki: the diving bell, its key from Ballow
  // Putrified_Ducts.wiki: the Memorium's hidden ceiling (found in The Lost Merchant) or past Bilehaven's arena, both with the Faydown Cloak.
  AQUEDUCTS: ['art:faydown-cloak', 'took:Save City Merchant Bridge|a', 'boss:groal-the-great|b'],
  DOCKS: ['skill:silkspear', 'boss:bell-beast'], // Deep_Docks.wiki: "inaccessible until Hornet acquires the Silkspear and frees the Bell Beast"
  GRANDGATE: ['boss:last-judge|a', 'boss:phantom|b'], // Grand_Gate.wiki: past the Last Judge, or from the Choral Chambers (the Exhaust Organ's way)
  HALLS: ['boss:last-judge|a', 'boss:phantom|b'],     // Choral_Chambers.wiki: three ways, the Grand Gate's two and Phantom's lift
};


/* ── Resolving ── */
let N;
const FOE = new Map(E.FOES.map((f) => [f.id, f]));
const PEOPLE = new Map(PE.PEOPLE.map((x) => [x.id, x]));
const ART_OF = new Map(Object.entries(F.ART_PD).map(([id, f]) => [f, id]));
const SKILL_OF = new Map(Object.entries(F.SKILL_PD).map(([id, f]) => [f, id]));
const BOSS_FLAG = new Map(SP.BOSSES.filter((b) => b[2][0] === 'flag').map((b) => [b[2][1], b[0]]));
const GAUNT_FLAG = new Map(GA.GAUNTLETS.filter((x) => x.done[0] === 'flag' && !SP.BOSSES.some((b) => b[2][0] === 'flag' && b[2][1] === x.done[1])).map((x) => [x.done[1], x.id]));
const lowerScene = (s) => lower((R.roomOf(s) || {}).scene || s);
// Where a wish is taken: its board, or who offers it (js/app-map.js wishFrom, giverMark), the first stage's.
function wishMark(q) {
  let at = q;
  while (!QU.FROM[at] && QU.CHAIN[at] && QU.CHAIN[at].prev) at = QU.CHAIN[at].prev;
  const f = QU.FROM[at];
  if (!f) {
    // A main objective: its pin (js/spots.js TASKS goal), the first the Map draws.
    const i = SP.TASKS.findIndex((x) => x[0] === 'goal' && x[1] === q);
    return i >= 0 && MARKS_ALL.has('task:' + i) ? 'task:' + i : null;
  }
  if (f.board) return 'board:' + lower(f.board);
  const n = (f.npc || [])[0], gid = (SP.QUEST_GIVER || {})[at] || n;
  return ((SP.GIVER || {})[gid] || [])[2] || 'giver:' + lower(gid);
}
const nameOf = (src) => {
  const [t, ...rest] = src.split(':'), a = rest.join(':');
  if (t === 'pe') return (PEOPLE.get(a) || fail(`no person ${a}`)).name;
  if (t === 'npc') return HW.NPCS[a] || fail(`no NPCS ${a}`);
  if (t === 'area') return CO.AREAS[a] || fail(`no area ${a}`);
  if (t === 'foe') return (FOE.get(a) || fail(`no foe ${a}`)).name;
  if (t === 'text') return N.text(a);
  if (t === 'tool') return (D.TOOLS.find((x) => x.id === a) || fail(`no tool ${a}`)).name;
  if (t === 'wish') return (QU.CHAIN[a] || fail(`no quest ${a}`)).name;
  if (t === 'gaunt') { const x = GA.GAUNTLETS.find((y) => y.id === a) || fail(`no gauntlet ${a}`); return x.place || CO.AREAS[x.area]; }
  return fail(`a name from ${src}?`);
};
// The quest items by save name: what wishes ask for (CHAIN asks), the Soul Snare's, the wish items' marks.
const ITEM_NAME = new Map();
for (const e of Object.values(QU.CHAIN)) for (const a of e.asks || []) if (a.save && a.name) ITEM_NAME.set(a.save, a.name);
for (const s of QU.SNARE) ITEM_NAME.set(s.save, s.name);
const heldIn = (c, save) => JSON.stringify(c).includes(JSON.stringify(['held', save]));
SP.TASKS.forEach((x) => { if (x[5] && x[0] === 'qitem') { const m = /\["held","([^"]+)"\]/.exec(JSON.stringify(x[2])); if (m && !ITEM_NAME.has(m[1])) ITEM_NAME.set(m[1], x[5]); } });
const KEY_MARKS = (nameKey) => SP.EXTRAS.map((x, i) => (x[0] === 'key' && x[4] && x[4].key === nameKey ? 'extra:' + i : null)).filter(Boolean).join(',');
const KEY_MARK = (nameKey) => { const i = SP.EXTRAS.findIndex((x) => x[0] === 'key' && x[4] && x[4].key === nameKey); return i >= 0 ? 'extra:' + i : null; };
const ITEM = (id) => D.ITEMS.find((x) => x.id === id) || fail(`no item ${id}`);
const KEY_REFS = {
  // Sold by Pebb, found in the Blasted Steps' Bellshrine and in Sinner's Road (a `to` of several marks: the card opens them as one focus).
  simple: () => ({ name: HW.KEYS.simple.name, to: ['shop:pebb:0', KEY_MARKS('INV_NAME_TOKEN_FAITH')].join(','), check: ['held', 'Simple Key'] }),
  architect: () => ({ name: HW.KEYS.architect.name, to: 'shop:twelfth-architect:0', check: ITEM('architects-key').had }),
  // On a Surgeon in Songclave, or sold by Jubilana there after The Wandering Merchant (Whiteward.wiki).
  white: () => ({ name: HW.KEYS.white.name, to: [KEY_MARK('INV_NAME_WARD_KEY'), 'shop:jubilana:2'].join(','), check: ITEM('white-key').had }),
  surgeon: () => ({ name: HW.KEYS.surgeon.name, to: KEY_MARK('INV_NAME_WARD_BOSS_KEY'), check: ITEM('surgeons-key').had }),
  indolent: () => ({ name: HW.KEYS.indolent.name, to: KEY_MARK('INV_NAME_SLAB_KEY_A'), check: ['flag', 'HasSlabKeyA'] }),
  heretic: () => ({ name: HW.KEYS.heretic.name, to: KEY_MARK('INV_NAME_SLAB_KEY_B'), check: ['flag', 'HasSlabKeyB'] }),
  apostate: () => ({ name: HW.KEYS.apostate.name, to: KEY_MARK('INV_NAME_SLAB_KEY_C'), check: ['flag', 'HasSlabKeyC'] }),
  'diving-bell': () => ({ name: ITEM('diving-bell-key').name, to: KEY_MARK('INV_NAME_DOCK_KEY'), check: ITEM('diving-bell-key').had }),
  bellhome: () => ({ name: ITEM('bellhome-key').name, to: KEY_MARK('INV_NAME_BELL_HOUSE_KEY'), check: ITEM('bellhome-key').had }),
  'craw-summons': () => ({ name: ITEM('craw-summons').name, to: null, check: ITEM('craw-summons').had }),
};
// A Simple Key's door (js/quests.js LOCKS, js/spots.js EXTRAS lock): the one in a thing's area, open or a key held.
const SIMPLE_DOOR = new Map(QU.LOCKS['Simple Key'].map((sc) => [R.areaOf(sc), SP.EXTRAS.find((x) => x[0] === 'lock' && lower(x[3]) === lower(sc))]));
const FLEAS = CO.PIECES.filter((p) => p[0] === 'flea').map((p) => p[2]);
const PALE_OIL = CO.PIECES.filter((p) => p[0] === 'pale-oil').map((p) => p[2]);
let MARKS_ALL;

function resolve(ref, where, area = null) {
  const m = /^([a-z]+)(?::([^*|]+))?(?:\*(\d+))?(?:\|([ab]))?$/.exec(ref);
  if (!m) fail(`${where}: ${ref} isn't a ref`);
  const [, type, arg, count] = m, n = count ? Number(count) : undefined;
  const out = (kind, name, to, check, extra = {}) => { const k = n || extra.n; return { kind, name, to: to || null, check: check || null, ...(k > 1 ? { n: k } : {}) }; };
  switch (type) {
    case 'art': { const x = D.ARTS.find((y) => y.id === arg) || fail(`${where}: no art ${arg}`); return out('ability', x.name, 'arts:' + arg, ['flag', F.ART_PD[arg]]); }
    case 'skill': { const x = D.SKILLS.find((y) => y.id === arg) || fail(`${where}: no skill ${arg}`); return out('ability', x.name, 'skills:' + arg, ['flag', F.SKILL_PD[arg]]); }
    case 'wish': case 'took': {
      const e = QU.CHAIN[arg] || fail(`${where}: no quest ${arg}`);
      return out('wish', e.name, wishMark(arg), [type === 'wish' ? 'quest' : 'accepted', arg]);
    }
    case 'boss': {
      const b = SP.BOSSES.find((x) => x[0] === arg) || fail(`${where}: no boss ${arg}`);
      const f = FOE.get(arg) || FOE.get((b[4] || {}).of) || fail(`${where}: no foe for ${arg}`);
      return out('boss', f.name, 'boss:' + arg, b[2]);
    }
    // A gauntlet by its place, or its area (the Map adds its number: «Deep Docks 1»; the chip's mark is that one).
    case 'gaunt': { const x = GA.GAUNTLETS.find((y) => y.id === arg) || fail(`${where}: no gauntlet ${arg}`); return out('boss', x.place || CO.AREAS[x.area], 'gaunt:' + arg, x.done); }
    case 'key': {
      // A Simple Key: one held, or its door open (the one in the thing's area, else any of them).
      const [k, at] = arg.split('@');
      const r = (KEY_REFS[k] || fail(`${where}: no key ${k}`))();
      if (k !== 'simple') return out('key', r.name, r.to, r.check);
      const door = SIMPLE_DOOR.get(at || area);
      return out('key', r.name, r.to, ['any', ['held', 'Simple Key'], ...(door ? [door[2]] : [...SIMPLE_DOOR.values()].filter(Boolean).map((x) => x[2]))]);
    }
    case 'act': return out('act', N.text('ACT_' + arg + '_SUPER'), null, arg === '2' ? ['flag', 'act2Started'] : ['flag', 'blackThreadWorld']);
    case 'item': {
      const name = ITEM_NAME.get(arg) || fail(`${where}: no name for the item ${arg}`);
      const t = SP.TASKS.findIndex((x, i) => x[0] === 'qitem' && heldIn(x[2], arg) && MARKS_ALL.has('task:' + i));
      if (arg === 'Pale_Oil') return out('item', name, 'piece:' + CO.PIECES.findIndex((p) => p[0] === 'pale-oil'), ['count', n || 1, ...PALE_OIL]);
      /* Had: what its wish-item mark checks (picked up, held or handed over: js/spots.js TASKS), else held or
         given to the wish that asks it (a thing given is gone from the save's Collectables). */
      const takers = Object.entries(QU.CHAIN).filter(([, e]) => (e.asks || []).some((a) => a.save === arg)).map(([q]) => ['quest', q]);
      return out('item', name, t >= 0 ? 'task:' + t : null, t >= 0 ? SP.TASKS[t][2] : takers.length ? ['any', ['held', arg], ...takers] : ['held', arg]);
    }
    case 'tool': { const x = D.TOOLS.find((y) => y.id === arg) || fail(`${where}: no tool ${arg}`); return out('item', x.name, 'tools:' + arg, ['tool', CO.TOOLS[arg][0]]); }
    case 'piece': { const p = CO.PIECES[arg] || fail(`${where}: no piece ${arg}`); return out('item', p[4] || fail(`${where}: piece ${arg} has no name`), 'piece:' + arg, p[2]); }
    case 'extra': {
      const x = SP.EXTRAS[arg] || fail(`${where}: no extra ${arg}`);
      return out('item', x[4] || (D.ITEMS.find((y) => y.id === x[0]) || fail(`${where}: extra ${arg} has no name`)).name, 'extra:' + arg, x[2]);
    }
    case 'everbloom': return out('item', ITEM('everbloom').name, 'everbloom', ['held', 'White Flower']);
    case 'map': return out('item', N.text('INV_NAME_MAP'), null, ['any', ...Object.keys(SP.MAPS).map((k) => ['flag', 'Has' + k + 'Map'])]);
    case 'needle': {
      const i = CO.PIECES.findIndex((p) => p[0] === 'needle' && p[2][0] === 'min' && p[2][2] === Number(arg));
      return out('item', D.NEEDLES[arg].name, i >= 0 ? 'piece:' + i : null, ['min', 'nailUpgrades', Number(arg)]);
    }
    case 'fleas': return out('item', N.text('KEY_FLEA'), null, ['count', Number(arg), ...FLEAS], { n: Number(arg) });
    case 'bell': { if (!SP.BELLS.some((b) => b[0] === arg)) fail(`${where}: no Bellshrine ${arg}`); return out('event', N.text('BELLSHRINE'), 'bell:' + arg, ['flag', arg]); }
    case 'ev': { const e = EVENTS[arg] || fail(`${where}: no event ${arg}`); return out(e[3] || 'event', nameOf(e[0]), e[1], e[2]); }
    default: return fail(`${where}: ${ref}: unknown type ${type}`);
  }
}

/* ── Deriving ── */
// A wish's test → refs (WHEN, the abilities, the bosses' and gauntlets' flags, the Acts); a test
// wanting a flag false is a condition against.
function whenRefs(tests, where) {
  const one = (t) => {
    const k1 = t.field + t.op + t.value, f = t.field;
    if (WHEN[k1]) return WHEN[k1];
    if (t.op === '==' && t.value === false) return [];
    if (t.op === '==' && t.value === 0) return [];
    if (WHEN[f] && t.op === '==' && t.value === true) return WHEN[f];
    if (t.op === '==' && t.value === true) {
      if (ART_OF.has(f)) return ['art:' + ART_OF.get(f)];
      if (SKILL_OF.has(f)) return ['skill:' + SKILL_OF.get(f)];
      if (BOSS_FLAG.has(f)) return ['boss:' + BOSS_FLAG.get(f)];
      if (GAUNT_FLAG.has(f)) return ['gaunt:' + GAUNT_FLAG.get(f)];
      if (f === 'act2Started') return ['act:2'];
      if (f === 'blackThreadWorld') return ['act:3'];
    }
    return fail(`${where}: the test ${k1} has no requirement (WHEN)`);
  };
  if (!tests || !tests.length) return [];
  // Several groups: either one (two at most, 'a' and 'b'; a group whose refs already have alts stays whole).
  const groups = tests.map((g) => g.flatMap(one));
  if (groups.length === 1) return groups[0];
  if (groups.length > 2) fail(`${where}: ${groups.length} ways to its test`);
  return groups.flatMap((g, i) => g.map((r) => r.replace(/\|[ab]$/, '') + '|' + 'ab'[i]));
}
const wishOfIndex = (i) => { const c = CO.WISHES[i][2]; return c[0] === 'quest' ? c[1] : c[0] === 'any' ? (c.slice(1).find((x) => x[0] === 'quest') || [])[1] : null; };

function deriveWishes() {
  const out = {};
  const add = (q, refs, why) => { for (const r of refs) (out[q] = out[q] || []).push({ ref: r, why }); };
  for (const [q, e] of Object.entries(QU.CHAIN)) {
    add(q, whenRefs(e.when, q), 'js/quests.js CHAIN when');
    for (const n of e.needs || []) add(q, ['wish:' + n], 'js/quests.js CHAIN needs');
    for (const g of e.groups || []) {
      const G = QU.GROUPS[g] || fail(`${q}: no group ${g}`);
      add(q, G.quests.filter((x) => x.required).map((x) => 'wish:' + x.quest), 'js/quests.js GROUPS required');
      add(q, (G.tests || []).length === 1 ? whenRefs(G.tests, q + ' group') : [], 'js/quests.js GROUPS tests');
    }
    // The stage before: a Pre of the same wish shares its requirements; another wish's is a wish.
    if (e.prev) {
      const p = QU.CHAIN[e.prev];
      if (p && p.name.key === e.name.key && (QU.FROM[e.prev] || {}).board) add(q, ['=' + e.prev], 'js/quests.js CHAIN prev (its Pre)');
      else add(q, ['wish:' + e.prev], 'js/quests.js CHAIN prev');
    }
  }
  // A reward's wish waits for another (js/how.js HOW after: Infestation Operation for Rite of Rebirth).
  for (const ways of Object.values(HW.HOW).flatMap((m) => (Array.isArray(m) ? [m] : Object.values(m)))) {
    for (const w of ways) if (w.kind === 'wish' && w.after) add(w.quest, w.after.map((i) => 'wish:' + wishOfIndex(i)), 'js/how.js HOW after');
  }
  for (const [q, refs] of Object.entries(HAND_WISH)) { if (!QU.CHAIN[q]) fail(`HAND_WISH: no quest ${q}`); add(q, refs, 'HAND_WISH'); }
  // The Pre's, copied in.
  for (const [q, list] of Object.entries(out)) {
    const pre = list.find((x) => x.ref.startsWith('='));
    if (pre) out[q] = [...list.filter((x) => x !== pre), ...(out[pre.ref.slice(1)] || [])];
  }
  return out;
}

function deriveMarks() {
  const out = {};
  const add = (key, refs, why) => { for (const r of refs) (out[key] = out[key] || []).push({ ref: r, why }); };
  // The 100%: a thing's own way (its first: the others are its other marks', js/spots.js ALSO) and what it lies behind.
  const things = [];
  for (const [cat, m] of Object.entries(HW.HOW)) {
    if (Array.isArray(m)) { things.push([cat, m, null]); continue; }
    for (const [id, ways] of Object.entries(m)) things.push([cat === 'pieces' ? 'piece:' + id : cat + ':' + id, ways, ((HW.NEEDS[cat] || {})[id]) || null]);
  }
  for (const [key, ways, need] of things) {
    const w = ways[0], refs = [];
    if (w.kind === 'wish') refs.push('wish:' + w.quest);
    if (w.kind === 'boss' && SP.BOSSES.some((b) => b[0] === w.foe)) refs.push('boss:' + w.foe);
    if (w.kind === 'shop') {
      for (const i of w.after || []) refs.push('wish:' + wishOfIndex(i));
      for (const f of w.needs || []) refs.push(...whenRefs([[{ field: f, op: '==', value: true }]], key));
      if (w.paleOil) refs.push('item:Pale_Oil*' + (PALE_OIL_N.get(key) || 1));
    }
    if (w.kind === 'fleas') refs.push('fleas:' + (w.fleas === 'all' ? FLEAS.length : w.fleas));
    if (w.kind === 'npc' && w.bring) {
      const i = SP.EXTRAS.findIndex((x) => x[4] && x[4].key === w.bring.name.key);
      if (i >= 0) refs.push('extra:' + i);
    }
    if (need) {
      const alt = need.or ? '|a' : '';
      const scene = (MARKS_ALL.get(key) || {}).scene;
      for (const k of need.keys) refs.push('key:' + k + (k === 'simple' && scene ? '@' + R.areaOf(scene) : '') + alt);
      for (const a of need.arts || []) refs.push('art:' + a + alt);
      if (need.or) refs.push('art:' + need.or + '|b');
    }
    add(key === 'everbloom' ? 'everbloom' : key, refs, 'js/how.js HOW, NEEDS');
  }
  // What a fight or a room waits for (js/spots.js OPENS).
  for (const [key, o] of Object.entries(SP.OPENS || {})) {
    const refs = o.wish ? ['took:' + o.wish] : o.after ? ['wish:' + o.after] : o.art ? ['art:' + o.art] : o.freed === 'NAME_SCHOLAR' ? ['ev:vaultborn-freed'] : fail(`OPENS ${key}: what?`);
    add(key, refs, 'js/spots.js OPENS');
  }
  // What a wish asks for and where it's done show while it's taken; a main objective's pin after its step before.
  SP.TASKS.forEach((x, i) => {
    const key = 'task:' + i;
    if (!MARKS_ALL.has(key)) return;
    const e = QU.CHAIN[x[1]];
    if (x[0] === 'goal') { if (e && e.prev) add(key, ['wish:' + e.prev], 'js/quests.js CHAIN prev'); return; }
    if (e && !e.main) add(key, ['took:' + x[1]], 'js/spots.js TASKS (shown while its wish is on)');
  });
  for (const [key, refs] of Object.entries(HAND)) { if (!MARKS_ALL.has(key)) fail(`HAND: ${key} isn't a Map mark`); add(key, refs, 'HAND'); }
  return out;
}
// Plinney's upgrades: the n-th Pale Oil for the n-th one that asks it (js/how.js HOW pieces paleOil).
const PALE_OIL_N = new Map(Object.entries(HW.HOW.pieces).filter(([, ws]) => ws[0].paleOil).map(([i], n) => ['piece:' + i, n + 1]));

/* ── The marks' Acts against their areas' (an Act requirement only where the mark's is later) ── */
function areaReqs(area) {
  const refs = [...(AREA_HAND[area] || [])];
  const act = (SP.AREA_ACT || {})[area];
  if (act) refs.unshift('act:' + act);
  return refs;
}

(async () => {
  N = await names();
  MARKS_ALL = markKeys();
  for (const [area] of Object.entries(AREA_HAND)) if (!CO.AREAS[area]) fail(`AREA_HAND: no area ${area}`);
  // Every page a source cites is in kb/data/raw.
  const src = require('fs').readFileSync(__filename, 'utf8');
  for (const m of src.matchAll(/([A-Z][\w'(),&.-]*?)\.wiki/g)) { try { W.page(m[1]); } catch (e) { fail(`${m[1]}.wiki, cited, isn't in kb/data/raw (npm run kb)`); } }

  const CHECKS = [], CHECK_AT = new Map();
  const checkIndex = (c) => {
    if (!c) return null;
    const k = JSON.stringify(c);
    if (!CHECK_AT.has(k)) { CHECK_AT.set(k, CHECKS.length); CHECKS.push(c); }
    return CHECK_AT.get(k);
  };
  const build = (list, where, drop = new Set(), self = null, area = null) => {
    const seen = new Set(), out = [];
    for (const { ref } of list) {
      const alt = (/\|([ab])$/.exec(ref) || [])[1] || null, bare = ref.replace(/\|[ab]$/, '');
      const r = resolve(bare, where, area);
      if (!r.name || !r.name.es || !r.name.en || !r.name.key) fail(`${where}: ${ref} has no game name with its key`);
      const id = r.kind + '|' + JSON.stringify(r.check) + '|' + r.to + '|' + (r.n || '');
      if (drop.has(id) || (self && (r.to || '').split(',').includes(self)) || seen.has(id + alt)) continue;
      seen.add(id + alt);
      for (const k of (r.to || '').split(',').filter(Boolean)) if (!MARKS_ALL.has(k)) fail(`${where}: ${ref} points to ${k}, which isn't a Map mark`);
      out.push({ kind: r.kind, name: r.name, to: r.to, check: checkIndex(r.check), alt, ...(r.n ? { n: r.n } : {}), _id: id });
    }
    // A requirement also given as an alternative is that alternative (the generator's own and HAND's: Longclaw's two feasts).
    for (const x of out.slice()) if (x.alt === null && out.some((y) => y !== x && y._id === x._id && y.alt)) out.splice(out.indexOf(x), 1);
    // An alternative standing alone isn't one: either every 'a' or every 'b', so each side needs a member.
    for (const a of ['a', 'b']) if (out.some((x) => x.alt === a) && !out.some((x) => x.alt === 'ab'.replace(a, ''))) out.forEach((x) => { if (x.alt === a) x.alt = null; });
    return out;
  };
  const strip = (list) => list.map(({ _id, ...x }) => x);

  const AREAS = {};
  const areaIds = new Map();
  for (const area of Object.keys(CO.AREAS)) {
    const list = build(areaReqs(area).map((ref) => ({ ref })), 'AREAS.' + area);
    areaIds.set(area, new Set(list.map((x) => x._id)));
    if (list.length) AREAS[area] = strip(list);
  }
  const WISHES = {}, wishIds = {};
  for (const [q, list] of Object.entries(deriveWishes())) {
    const out = build(list, 'WISHES.' + q);
    wishIds[q] = new Set(out.map((x) => x._id));
    if (out.length) WISHES[q] = strip(out);
  }
  const MARKS = {};
  const derived = deriveMarks();
  // node tools/gen-requires.js --derived: what's derived per mark and wish, to read HAND against.
  if (process.argv[2] === '--derived') { console.log(JSON.stringify({ marks: derived, wishes: deriveWishes() })); return; }
  // Each mark's own Act, when it's later than its area's (tools/mark-keys.js, js/spots.js AREA_ACT, ROOM_ACT).
  for (const [key, m] of MARKS_ALL) {
    const area = m.scene ? R.areaOf(m.scene) : null;
    const act = m.act || (m.scene && (SP.ROOM_ACT || {})[lowerScene(m.scene)]) || 1;
    if (act > (((SP.AREA_ACT || {})[area]) || 1)) (derived[key] = derived[key] || []).unshift({ ref: 'act:' + act, why: 'its Act' });
  }
  let dropped = 0;
  for (const [key, list] of Object.entries(derived)) {
    const m = MARKS_ALL.get(key), area = m && m.scene ? R.areaOf(m.scene) : null;
    // What a wish asks for, or where it's done, shows while the wish is taken: what the wish waited for is the wish's.
    const task = /^task:(\d+)$/.exec(key), t = task && SP.TASKS[task[1]];
    const drop = new Set([...(areaIds.get(area) || []), ...(t && t[0] !== 'goal' ? wishIds[t[1]] || [] : [])]);
    const out = build(list, 'MARKS.' + key, drop, key, area);
    dropped += list.length - out.length;
    if (out.length) MARKS[key] = strip(out);
  }

  const header = `js/requires.js: what each Map mark still asks before its thing can be had (or its
   person met, its boss fought), what it takes to enter each area, and what each wish waits for, as
   data, no prose.
   GENERATED by tools/gen-requires.js from the game's data the site carries (js/quests.js CHAIN,
   GROUPS; js/how.js HOW, NEEDS; js/spots.js OPENS, TASKS, AREA_ACT, ROOM_ACT), the wiki's pages
   (kb/data/raw: the areas' "How to Access", the wishes' prerequisites, the things' locations) and
   the generator's hand tables, each row with its source: not edited by hand. Change the generator
   and run npm run data.

     AREAS   area id (js/rooms.js areaOf) → [req]: to enter it, only what every way in asks
     MARKS   Map mark key → [req]: the thing's own (its room, its route); a card adds its area's
     WISHES  quest save name (js/quests.js CHAIN) → [req]: before the game offers that wish (a
             giver's or a Wishwall's card shows it for each wish still open there)
     CHECKS  [save check]: every distinct check, by index; js/savefile.js game() keeps those met
             (needs, needsRead)
     req = { kind, name: { es, en, key }, to, check, alt, n? }
       kind   'wish' (done or taken: its check says), 'item' (to bring or hold; n how many), 'key',
              'ability' (needed to reach it), 'boss' (a boss or an enemy gauntlet), 'event' (a
              person met, a station opened, the caravan moved…), 'act' (from that Act on)
       name   the game's name for it (the person, place, boss, wish or thing), with its key
       to     the Map mark where it's had or done (a chip's button), several comma-separated when
              it's had in more than one place (a Simple Key), or null
       check  an index into CHECKS, or null (the save can't say)
       alt    null: needed; 'a' / 'b': either all the 'a' of that list or all the 'b'
       n      how many (Lost Fleas, Pale Oil)`;
  const size = write(path.join(__dirname, '..', 'js', 'requires.js'), header, 'requires',
    [['AREAS', AREAS], ['MARKS', MARKS], ['WISHES', WISHES], ['CHECKS', CHECKS]]);
  const n = (o) => Object.values(o).reduce((s, l) => s + l.length, 0);
  console.log(`js/requires.js: ${Object.keys(AREAS).length} areas (${n(AREAS)}), ${Object.keys(MARKS).length} marks (${n(MARKS)}), `
    + `${Object.keys(WISHES).length} wishes (${n(WISHES)}), ${CHECKS.length} checks; ${dropped} repeated or their area's, dropped; ${(size / 1024).toFixed(0)} KB`);
})().catch((e) => fail(e.stack || e.message));

/* HAND: each mark's own requirements no structured source gives (its room past an ability, a fight
   first, a key's door), from the Map requirements audit (31-Oct-2026), one row per mark with its
   sources in a comment (kb/data/raw/ pages, js/ files, kb/data/game/ files). */
const HAND = {
  // Mask Shard: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak)
  'piece:0:grindle': ['art:faydown-cloak'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:83; kb/data/completionist/maskShards.ts:33
  'piece:2': ['art:drifters-cloak'],
  // Mask Shard: Enemy_Gauntlets_(Silksong)_Deep_Docks_2.wiki (reward: Mask Shard); js/gauntlets.js deep-docks-2
  'piece:4': ['gaunt:deep-docks-2'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:93; kb/data/completionist/maskShards.ts:59
  'piece:5': ['art:needolin'],
  // Mask Shard: Enemy_Gauntlets_(Silksong)_Cogwork_Core_1.wiki (reward: Mask Shard); Mask_Shard_(Silksong).wiki:105; js/gauntlets.js cogwork-core-1
  'piece:7': ['gaunt:cogwork-core-1'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:120; Enemy_Gauntlets_(Silksong)_Far_Fields_1.wiki (reward: Mask Shard); js/gauntlets.js far-fields-1
  'piece:10': ['art:clawline', 'art:drifters-cloak', 'gaunt:far-fields-1'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:130; Mask_Shard_(Silksong).wiki:130 ("challenge can be skipped with Silk Soar")
  'piece:11': ['art:faydown-cloak|a', 'art:silk-soar|b'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:125; kb/data/completionist/maskShards.ts:120
  'piece:12': ['art:faydown-cloak'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:140; kb/data/completionist/maskShards.ts:130
  'piece:13': ['art:faydown-cloak'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:100; js/people.js HERE.jubilana.song_enclave (quest Save City Merchant); js/quests.js CHAIN["Save City Merchant"], FROM
  'piece:14': ['wish:Save City Merchant'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:145; Mask_Shard_(Silksong).wiki:145 ("challenge can be skipped with Silk Soar")
  'piece:15': ['art:clawline|a', 'art:faydown-cloak|a', 'art:silk-soar|b'],
  // Mask Shard: Mask_Shard_(Silksong).wiki:152; kb/data/completionist/maskShards.ts
  'piece:19': ['art:silk-soar'],
  // Spool Fragment: Spool_Fragment.wiki:66; kb/data/completionist/spoolFragments.ts; Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki (reward: the balloon lever, "required for ... a Spool Fragment"); Spool_Fragment.wiki:63 (location: pull the lever, bounce off the balloons); js/gauntlets.js greymoor-3
  'piece:22': ['art:cling-grip', 'gaunt:greymoor-3'],
  // Spool Fragment: Spool_Fragment.wiki:81; The_Slab.wiki:41 (the front door: the Key of Apostate is the only other way into the Slab)
  'piece:23': ['art:cling-grip', 'ev:wardenfly|a', 'key:apostate|b'],
  // Spool Fragment: Spool_Fragment.wiki:76; kb/data/completionist/spoolFragments.ts
  'piece:24': ['art:needolin'],
  // Spool Fragment: Spool_Fragment.wiki:98; Fleas.wiki:34 (the caravan moves to the Grand Gate only once the Last Judge is beaten); js/spots.js BOSSES last-judge; Fleas.wiki:34; tools/gen-how.js:99
  'piece:26': ['boss:last-judge', 'ev:caravan-2'],
  // Spool Fragment: Spool_Fragment.wiki:88-93 (row 8: "fight through the enemy gauntlet"); Enemy_Gauntlets_(Silksong)_Underworks_2.wiki (reward: Spool Fragment); js/gauntlets.js underworks-2
  'piece:30': ['gaunt:underworks-2'],
  // Spool Fragment: Enemy_Gauntlets_(Silksong)_Whiteward_1.wiki ("requires Balm for the Wounded to be promised"; reward: Spool Fragment); js/gauntlets.js whiteward-1
  'piece:32': ['gaunt:whiteward-1'],
  // Spool Fragment: Spool_Fragment.wiki:128
  'piece:33': ['art:clawline', 'art:cling-grip'],
  // Spool Fragment: Spool_Fragment.wiki:133; Spool_Fragment.wiki:133 ("the challenge can be skipped with the Silk Soar")
  'piece:34': ['art:faydown-cloak|a', 'art:clawline|a', 'art:silk-soar|b'],
  // Spool Fragment: Spool_Fragment.wiki:138
  'piece:35': ['art:faydown-cloak', 'art:clawline'],
  // Spool Fragment: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak); Spool_Fragment.wiki:143
  'piece:36': ['art:faydown-cloak', 'art:cling-grip'],
  // Memory Locket: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak)
  'piece:38:grindle': ['art:faydown-cloak'],
  // Memory Locket: Hunter's_March.wiki:44 ("the rest of Hunter's March can only be accessed through the Marrow entrance ... guarded by a Skarrgard"); Enemy_Gauntlets_(Silksong)_Hunter's_March_1.wiki (reward: access to Hunter's March); js/gauntlets.js hunters-march-1
  'piece:39': ['gaunt:hunters-march-1'],
  // Memory Locket: Memory_Locket.wiki:156; kb/data/completionist/memoryLockets.ts:35
  'piece:41': ['art:faydown-cloak'],
  // Memory Locket: Memory_Locket.wiki:107 (Complete SAVE: The Threadspun Town = defeat Widow, Acts.wiki:22); js/people.js HERE.frey (flag spinnerDefeated); js/spots.js BOSSES widow
  'piece:42': ['boss:widow'],
  // Memory Locket: Memory_Locket.wiki:180; kb/data/completionist/memoryLockets.ts
  'piece:43': ['art:silk-soar'],
  // Memory Locket: Memory_Locket.wiki:83; js/collectibles.js PIECES[44] (quest Rock Rollers); js/quests.js CHAIN["Rock Rollers"], FROM
  'piece:44': ['wish:Rock Rollers'],
  // Memory Locket: Memory_Locket.wiki:94; kb/data/completionist/memoryLockets.ts:65; Enemy_Gauntlets_(Silksong)_The_Marrow_2.wiki (reward: Memory Locket); kb/data/game/gating.json items["Bone_18|Collectable Item Pickup"] inside Battle Scene; js/gauntlets.js the-marrow-2
  'piece:45': ['art:cling-grip', 'gaunt:the-marrow-2'],
  // Memory Locket: Memory_Locket.wiki:125 ("Defeat Phantom or Trobbio"); js/spots.js BOSSES phantom; Memory_Locket.wiki:125; js/spots.js BOSSES trobbio
  'piece:46': ['boss:phantom|a', 'boss:trobbio|b'],
  // Memory Locket: Memory_Locket.wiki:100; js/quests.js LOCKS["Simple Key"] Crawl_02; Memory_Locket.wiki:100
  'piece:47': ['key:simple', 'art:cling-grip'],
  // Memory Locket: Memory_Locket.wiki:113
  'piece:48': ['art:cling-grip'],
  // Memory Locket: Memory_Locket.wiki:137; Memory_Locket.wiki:137; js/spots.js BOSSES forebrothers-signis-and-gron
  'piece:52': ['art:clawline', 'boss:forebrothers-signis-and-gron'],
  // Memory Locket: Memory_Locket.wiki:174
  'piece:53': ['art:faydown-cloak'],
  // Memory Locket: Memory_Locket.wiki:168
  'piece:54': ['key:apostate', 'art:faydown-cloak'],
  // Memory Locket: Memory_Locket.wiki:162
  'piece:55': ['art:faydown-cloak'],
  // Memory Locket: Memory_Locket.wiki:186; Memory_Locket.wiki:186 ("defeat the black-threaded Skarrgard"); Enemy_Gauntlets_(Silksong)_Far_Fields_2.wiki (reward: Memory Locket); js/gauntlets.js far-fields-2
  'piece:56': ['art:silk-soar', 'gaunt:far-fields-2'],
  // Memory Locket: Memory_Locket.wiki:150
  'piece:57': ['art:clawline'],
  // Craftmetal: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak)
  'piece:58:grindle': ['art:faydown-cloak'],
  // Craftmetal: Craftmetal.wiki:149
  'piece:64': ['art:faydown-cloak'],
  // Craftmetal: Craftmetal.wiki:143; js/shop.js SHOP "City Merchant Tool Metal" after; js/quests.js CHAIN["Save City Merchant Bridge"], FROM
  'piece:65': ['wish:Save City Merchant Bridge'],
  // Pale Oil: Pale_Oil.wiki:60
  'piece:66': ['art:cling-grip'],
  // Pale Oil: Pale_Oil.wiki:65; js/collectibles.js PIECES[67] (quest Great Gourmand); js/quests.js CHAIN["Great Gourmand"], FROM
  'piece:67': ['wish:Great Gourmand'],
  // Pale Oil: Pale_Oil.wiki:70; js/collectibles.js PIECES[68] (quest Flea Games); js/quests.js CHAIN["Flea Games"], FROM
  'piece:68': ['wish:Flea Games'],
  // Lost Flea: Fleas.wiki:52 (row 1); js/spots.js BOSSES bell-beast; Fleas.wiki:52 ("activate the bellshrine")
  'piece:69': ['boss:bell-beast', 'bell:bellShrineBoneForest'],
  // Lost Flea: Fleas.wiki:64; kb/data/completionist/fleas.ts:27
  'piece:71': ['art:swift-step'],
  // Lost Flea: Fleas.wiki:76 ("Defeat the Skarrgard at the entrance of Hunter's March"); js/gauntlets.js hunters-march-1
  'piece:73': ['gaunt:hunters-march-1'],
  // Lost Flea: Fleas.wiki:100 ("Defeat the enemy gauntlet in Craw Lake"); Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki (balloon lever); js/gauntlets.js greymoor-3
  'piece:74': ['gaunt:greymoor-3'],
  // Lost Flea: Fleas.wiki:106
  'piece:75': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:88; kb/data/completionist/fleas.ts:70
  'piece:77': ['art:drifters-cloak', 'art:cling-grip'],
  // Lost Flea: Fleas.wiki:132; kb/data/completionist/fleas.ts:78
  'piece:78': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:120; kb/data/completionist/fleas.ts:103
  'piece:81': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:69-70; kb/data/completionist/fleas.ts:133; Fleas.wiki:69 ("guarded behind an enemy gauntlet"); Enemy_Gauntlets_(Silksong)_Deep_Docks_3.wiki (reward: Flea); js/gauntlets.js deep-docks-3
  'piece:85': ['art:clawline', 'gaunt:deep-docks-3'],
  // Lost Flea: Fleas.wiki:162
  'piece:86': ['art:cling-grip', 'art:faydown-cloak'],
  // Lost Flea: Fleas.wiki:156 (row 18)
  'piece:87': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:207; kb/data/completionist/fleas.ts:170
  'piece:90': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:229 (row 29); kb/data/completionist/fleas.ts:178; Fleas.wiki:229
  'piece:91': ['art:clawline', 'art:cling-grip'],
  // Lost Flea: Fleas.wiki:235 (row 30)
  'piece:93': ['art:cling-grip'],
  // Lost Flea: Fleas.wiki:201; kb/data/completionist/fleas.ts:210
  'piece:95': ['art:faydown-cloak'],
  // Lost Flea: Fleas.wiki:189; kb/data/completionist/fleas.ts:218
  'piece:96': ['art:faydown-cloak'],
  // Lost Flea: Fleas.wiki:114 (row 11, Kratt); kb/data/completionist/fleas.ts:226
  'piece:97': ['art:cling-grip'],
  // Sharpened Needle: kb/data/completionist/upgrades.ts (Sharpened Needle: "speak to Plinney after defeating Widow"); Bellhart.wiki:32 (the shops open once Widow is beaten); js/spots.js BOSSES widow
  'piece:99': ['boss:widow'],
  // Sharpened Needle: Enemy_Gauntlets_(Silksong)_Shellwood_2.wiki ("required to rescue Pinmaster Plinney and return him to Bellhart"); js/gauntlets.js shellwood-2
  'piece:99:found': ['gaunt:shellwood-2'],
  // Shining Needle: js/collectibles.js PIECES[99..102] (nailUpgrades 1..4); Needle.wiki:27; js/how.js HOW.pieces[100] paleOil 1
  'piece:100': ['needle:1', 'item:Pale_Oil'],
  // Shining Needle: Enemy_Gauntlets_(Silksong)_Shellwood_2.wiki ("required to rescue Pinmaster Plinney and return him to Bellhart"); js/gauntlets.js shellwood-2; js/collectibles.js PIECES[99..102] (nailUpgrades 1..4); Needle.wiki:27; js/how.js HOW.pieces[100] paleOil 1
  'piece:100:found': ['gaunt:shellwood-2', 'needle:1', 'item:Pale_Oil'],
  // Hivesteel Needle: js/collectibles.js PIECES
  'piece:101': ['needle:2'],
  // Hivesteel Needle: Enemy_Gauntlets_(Silksong)_Shellwood_2.wiki ("required to rescue Pinmaster Plinney and return him to Bellhart"); js/gauntlets.js shellwood-2; js/collectibles.js PIECES; Needle.wiki:36; js/how.js HOW.pieces[101] paleOil 1
  'piece:101:found': ['gaunt:shellwood-2', 'needle:2', 'item:Pale_Oil*2'],
  // Pale Steel Needle: js/collectibles.js PIECES
  'piece:102': ['needle:3'],
  // Pale Steel Needle: Enemy_Gauntlets_(Silksong)_Shellwood_2.wiki ("required to rescue Pinmaster Plinney and return him to Bellhart"); js/gauntlets.js shellwood-2; js/collectibles.js PIECES; Needle.wiki:45; js/how.js HOW.pieces[102] paleOil 1
  'piece:102:found': ['gaunt:shellwood-2', 'needle:3', 'item:Pale_Oil*3'],
  // Tool Pouch: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak)
  'piece:103:grindle': ['art:faydown-cloak'],
  // Tool Pouch: Tool_Pouch_&_Crafting_Kit.wiki:497 (Loddie's challenge: Complete SAVE: The Threadspun Town); js/spots.js BOSSES widow
  'piece:104': ['boss:widow|a'],
  // Tool Pouch: Fleas.wiki:34-35; js/people.js (CaravanTroupeLocation 2 coral_judge_arena)
  'piece:106': ['ev:caravan-2'],
  // Crafting Kit: Blasted_Steps.wiki:39 (Grindle's settlement needs the Faydown Cloak)
  'piece:109': ['art:faydown-cloak'],
  // Crafting Kit: Tool_Pouch_&_Crafting_Kit.wiki:527
  'piece:110': ['art:clawline'],
  // Pollen Heart: Pollen_Heart.wiki (How to Acquire); js/spots.js BOSSES nyleth
  'piece:114': ['boss:nyleth'],
  // Encrusted Heart: Encrusted_Heart.wiki (How to Acquire); js/spots.js BOSSES crust-king-khann
  'piece:115': ['boss:crust-king-khann'],
  // Hunter's Heart: Hunter's_Heart.wiki (How to Acquire); js/spots.js BOSSES skarrsinger-karmelita
  'piece:116': ['boss:skarrsinger-karmelita'],
  // Conjoined Heart: Conjoined_Heart.wiki (How to Acquire); js/spots.js BOSSES clover-dancers
  'piece:117': ['boss:clover-dancers'],
  // Architect's Melody: Cogwork_Core.wiki:31 ("Entrance to the Cogwork Core is accessed by defeating the Cogwork Dancers"); Threefold_Melody.wiki:60; js/spots.js BOSSES cogwork-dancers
  'piece:118': ['boss:cogwork-dancers'],
  // Conductor's Melody: Threefold_Melody.wiki:52; Enemy_Gauntlets_(Silksong)_High_Halls_1.wiki (reward: Conductor's Melody); js/gauntlets.js high-halls-1
  'piece:120': ['gaunt:high-halls-1'],
  // Threefold Pin: Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki:13 (its lever inflates the balloons, required for the Threefold Pin)
  'tools:threefold-pin': ['gaunt:greymoor-3'],
  // Sting Shard: Enemy_Gauntlets_(Silksong)_Deep_Docks_1.wiki:13 (reward: access to the Forge Daughter)
  'tools:sting-shard': ['gaunt:deep-docks-1'],
  // Tacks: Sinner's_Road.wiki:41 (Sinner's Road only with Cling Grip)
  'tools:tacks': ['art:cling-grip'],
  // Curveclaw: Hunter's_March.wiki:30 (wind shaft that needs the Drifter's Cloak, leading to the Mottled Skarr)
  'tools:curveclaw': ['art:drifters-cloak'],
  // Curveclaw: js/how.js HOW.tools curveclaw found act 2 (line 86); Tools.wiki:74 (note: he dies after the Cogwork Dancers, the First Shrine bell, or the Clawline); Tools.wiki:74; Enemy_Gauntlets_(Silksong)_Hunter's_March_5.wiki:8; Enemy_Gauntlets_(Silksong)_Hunter's_March_4.wiki:13; Tools.wiki:74 ("found locked behind a gauntlet")
  'tools:curveclaw:found': ['ev:skarr-dead', 'gaunt:hunters-march-5'],
  // Conchcutter: Sands_of_Karak.wiki:36 (Clawline required for the only entry)
  'tools:conchcutter': ['art:clawline'],
  // Silkshot (Forge Daughter): Enemy_Gauntlets_(Silksong)_Deep_Docks_1.wiki:13 (access to the Forge Daughter)
  'tools:silkshot': ['gaunt:deep-docks-1'],
  // Silkshot (Twelfth Architect): Silkshot.wiki:77,93; js/spots.js VARIANTS tools:silkshot; Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Whispering_Vaults.wiki:44
  'tools:silkshot:architect': ['extra:1047', 'key:white|a', 'boss:trobbio|b'],
  // Silkshot (Original): Silkshot.wiki:77,87; js/spots.js VARIANTS tools:silkshot (Peak_12); Mount_Fay.wiki:31,59 (Clawline to enter; Clawline and Drifter's Cloak to traverse)
  'tools:silkshot:original': ['extra:1047', 'art:clawline', 'art:drifters-cloak'],
  // Cogwork Wheel: Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Whispering_Vaults.wiki:44
  'tools:cogwork-wheel': ['key:white|a', 'boss:trobbio|b'],
  // Cogfly: High_Halls.wiki:45 (Clawline required to access)
  'tools:cogfly': ['art:clawline'],
  // Rosary Cannon: High_Halls.wiki:45 (Clawline required to access)
  'tools:rosary-cannon': ['art:clawline'],
  // Voltvessels: Memorium.wiki:51 (Faydown Cloak required); kb/data/game/gating.json Arborium_07|Collectable Item Pickup Battle inside "Battle Scene"; kb/data/game/pickups.json lying "Lightning Rod" (Voltvessels); Voltvessels.wiki:49 (guarded by 2 Memoria)
  'tools:voltvessels': ['art:faydown-cloak', 'gaunt:memorium'],
  // Flintslate: Far_Fields.wiki:51 (the Simple Key door also needs a Swift Step jump)
  'tools:flintslate': ['art:swift-step|a'],
  // Flea Brew: js/shop.js REWARDS "Save the Fleas" flea-brew (line 141); Greymoor.wiki:113; js/quests.js FROM (Pre on Bone Bottom's board, then Mooshka, giver:bone_10); Fleas.wiki:33; Flea_Brew.wiki:59
  'tools:flea-brew': ['wish:Save the Fleas', 'fleas:5'],
  // Flea Brew: js/shop.js REWARDS "Save the Fleas"; js/spots.js PLACES tools:flea-brew; Fleas.wiki:34; Blasted_Steps.wiki:41; Fleas.wiki:34; js/spots.js PLACES check CaravanTroupeLocation 2
  'tools:flea-brew:coral_judge_arena': ['wish:Save the Fleas', 'boss:last-judge', 'fleas:12'],
  // Flea Brew: js/shop.js REWARDS "Save the Fleas"; js/spots.js PLACES tools:flea-brew; Fleas.wiki:35; js/spots.js PLACES check CaravanTroupeLocation 3
  'tools:flea-brew:aqueduct_05_caravan': ['wish:Save the Fleas', 'fleas:22'],
  // Plasmium Phial: Wormways.wiki:48 (the Simple Key door cannot be bypassed); js/quests.js LOCKS Simple Key Crawl_02; js/graph.js (Crawl_08, Crawl_05 lie past Crawl_02)
  'tools:plasmium-phial': ['key:simple'],
  // Magma Bell: Enemy_Gauntlets_(Silksong)_Deep_Docks_1.wiki:13 (access to the Forge Daughter)
  'tools:magma-bell': ['gaunt:deep-docks-1'],
  // Warding Bell: Far_Fields.wiki:49,51 (Swift Step for the lava gap past the gate, and for the Simple Key way round Lace)
  'tools:warding-bell': ['art:swift-step'],
  // Fractured Mask: Hunter's_March.wiki:30 (wind shaft that needs the Drifter's Cloak, leading to the Mottled Skarr)
  'tools:fractured-mask': ['art:drifters-cloak'],
  // Multibinder: js/people.js HERE frey belltown ["flag","spinnerDefeated"] (line 1105)
  'tools:multibinder': ['boss:widow'],
  // Weavelight: Weavenest_Atla.wiki:47 (Needolin door)
  'tools:weavelight': ['art:needolin'],
  // Sawtooth Circlet: Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Whispering_Vaults.wiki:44
  'tools:sawtooth-circlet': ['key:white|a', 'boss:trobbio|b'],
  // Spool Extender: Spool_Extender.wiki:23; js/people.js HERE jubilana song_enclave ["quest","Save City Merchant"] (line 1080)
  'tools:spool-extender': ['wish:Save City Merchant'],
  // Reserve Bind: Reserve_Bind.wiki:27; High_Halls.wiki:45 (Clawline required to access)
  'tools:reserve-bind': ['boss:second-sentinel', 'art:clawline'],
  // Memory Crystal: Mount_Fay.wiki:31,59 (Clawline to enter; Clawline and Drifter's Cloak to traverse)
  'tools:memory-crystal': ['art:clawline'],
  // Snitch Pick: Blasted_Steps.wiki:39 (Grindle's Snitchfly settlement requires the Faydown Cloak)
  'tools:snitch-pick': ['art:faydown-cloak'],
  // Volt Filament: Sands_of_Karak.wiki:36 (Clawline required for the only entry); Sands_of_Karak.wiki:90; Sands_of_Karak.wiki:90 (Voltnest: Faydown Cloak and Clawline in Act 2); Sands_of_Karak.wiki:90 (Silk Soar in Act 3)
  'tools:volt-filament': ['art:clawline', 'art:faydown-cloak|a', 'art:silk-soar|b'],
  // Quick Sling: Bilewater.wiki:44 (entered from Sinner's Road); Sinner's_Road.wiki:41 (Cling Grip)
  'tools:quick-sling': ['art:cling-grip'],
  // Wreath of Purity: Putrified_Ducts.wiki:38,40 (both entries, Memorium and Bilehaven, need the Faydown Cloak: Memorium.wiki:51, Bilewater.wiki:130)
  'tools:wreath-of-purity': ['art:faydown-cloak'],
  // Longclaw: js/how.js HOW.tools longclaw act 3; Longclaw.wiki:23; Putrified_Ducts.wiki:38,40 (both entries, Memorium and Bilehaven, need the Faydown Cloak: Memorium.wiki:51, Bilewater.wiki:130) (the Bilehaven way leads next to the Huntress)
  'tools:longclaw': ['wish:Huntress Quest|a', 'wish:Huntress Quest Runt|b', 'art:faydown-cloak'],
  // Wispfire Lantern: Wisp_Thicket.wiki:38 (Faydown Cloak required, invisible wall)
  'tools:wispfire-lantern': ['art:faydown-cloak'],
  // Egg of Flealia: Fleas.wiki:35 (22 Fleas and the Pale Lake visited)
  'tools:egg-of-flealia': ['ev:caravan-3'],
  // Pin Badge: Mount_Fay.wiki:84; Mount_Fay.wiki:31,59 (Clawline to enter; Clawline and Drifter's Cloak to traverse)
  'tools:pin-badge': ['boss:pinstress', 'art:clawline'],
  // Magnetite Brooch: Blasted_Steps.wiki:39 (Grindle's Snitchfly settlement requires the Faydown Cloak)
  'tools:magnetite-brooch:grindle': ['art:faydown-cloak'],
  // Weighted Belt: Far_Fields.wiki:49,51 (Swift Step for the lava gap past the gate, and for the Simple Key way round Lace)
  'tools:weighted-belt': ['art:swift-step'],
  // Barbed Bracelet: Sinner's_Road.wiki:41 (Sinner's Road only with Cling Grip)
  'tools:barbed-bracelet': ['art:cling-grip'],
  // Magnetite Dice: Blasted_Steps.wiki:68 (Cling Grip required to enter)
  'tools:magnetite-dice': ['art:cling-grip'],
  // Magnetite Dice: Blasted_Steps.wiki:39 (Grindle's Snitchfly settlement requires the Faydown Cloak)
  'tools:magnetite-dice:grindle': ['art:faydown-cloak'],
  // Scuttlebrace: Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Whispering_Vaults.wiki:44
  'tools:scuttlebrace': ['key:white|a', 'boss:trobbio|b'],
  // Ascendant's Grip: js/people.js HERE jubilana song_enclave ["quest","Save City Merchant"] (line 1080); Ascendant's_Grip.wiki:23
  'tools:ascendants-grip': ['wish:Save City Merchant'],
  // Silkspeed Anklets: Far_Fields.wiki:201 (Weavenest Cindril behind a Needolin door); kb/data/completionist/tools.ts prereqs; Silkspeed_Anklets.wiki:25 (run the pressure plates with Swift Step); kb/data/completionist/tools.ts prereqs
  'tools:silkspeed-anklets': ['art:needolin', 'art:swift-step'],
  // Thief's Mark: Blasted_Steps.wiki:39 (Grindle's Snitchfly settlement requires the Faydown Cloak)
  'tools:thiefs-mark': ['art:faydown-cloak'],
  // Curvesickle: Curveclaw.wiki:55
  'tools:curvesickle': ['tool:curveclaw'],
  // Needle Phial: Needle_Phial.wiki:30; Wormways.wiki:48 (the Simple Key door cannot be bypassed); js/quests.js LOCKS Simple Key Crawl_02; js/graph.js (Crawl_08, Crawl_05 lie past Crawl_02)
  'tools:needle-phial': ['took:Extractor Blue', 'key:simple'],
  // Snare Setter: Snare_Setter.wiki:37; Weavenest_Atla.wiki:37; Weavenest_Atla.wiki:47 (Needolin door)
  'tools:snare-setter': ['art:faydown-cloak', 'art:needolin'],
  // Druid's Eyes: Druid's_Eye.wiki:41
  'tools:druids-eyes': ['wish:Mossberry Collection 1'],
  // Claw Mirrors: Claw_Mirror.wiki:36; Claw_Mirror.wiki:36 (the Dark Mirror combines with the Claw Mirror)
  'tools:claw-mirrors': ['boss:tormented-trobbio', 'tool:claw-mirror'],
  // Reaper: Reaper_Crest.wiki:71 ("past a platforming section and a battle"); Enemy_Gauntlets_(Silksong)_Greymoor_5.wiki:8
  'crests:reaper': ['gaunt:greymoor-5'],
  // Wanderer: Enemy_Gauntlets_(Silksong)_Bone_Bottom.wiki:8 (in the centre of the Chapel of the Wanderer)
  'crests:wanderer': ['gaunt:bone-bottom'],
  // Beast: Hunter's_March.wiki:90 (the Chapel of the Beast requires the Drifter's Cloak)
  'crests:beast': ['art:drifters-cloak'],
  // Shaman: Shaman_Crest.wiki:78; Moss_Grotto.wiki:82; kb/data/completionist/crests.ts
  'crests:shaman': ['art:silk-soar'],
  // Thread Storm: Thread_Storm.wiki:23; Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki:13; Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki:8 (the gauntlet requires it)
  'skills:thread-storm': ['gaunt:greymoor-3', 'art:drifters-cloak'],
  // Cross Stitch: Bilewater.wiki:44 (entered from Sinner's Road); Sinner's_Road.wiki:41 (Cling Grip); Bilewater.wiki:96 (Exhaust Organ past the Mist)
  'skills:cross-stitch': ['art:cling-grip'],
  // Sharpdart: Sharpdart.wiki:25; Wormways.wiki:114; Wormways.wiki:48 (the Simple Key door cannot be bypassed); js/quests.js LOCKS Simple Key Crawl_02; js/graph.js (Crawl_08, Crawl_05 lie past Crawl_02); Wormways.wiki:114 ("requires the Clawline to reach"); Sharpdart.wiki:25 (possible with just Drifter's Cloak and Swift Step, video ref); Sharpdart.wiki:25
  'skills:sharpdart': ['art:needolin', 'key:simple', 'art:clawline|a', 'art:drifters-cloak|b', 'art:swift-step|b'],
  // Pale Nails: Pale_Nails.wiki:23; The_Cradle.wiki:37; kb/data/completionist/abilities.ts prereqs
  'skills:pale-nails': ['art:silk-soar'],
  // Drifter's Cloak: Drifter's_Cloak.wiki:30; js/quests.js FROM Brolly Get (the Seamstress); Far_Fields.wiki:49,51 (Swift Step for the lava gap past the gate, and for the Simple Key way round Lace)
  'arts:drifters-cloak': ['wish:Brolly Get', 'art:swift-step'],
  // Faydown Cloak: Faydown_Cloak.wiki:26; Mount_Fay.wiki:79; kb/data/completionist/abilities.ts prereqs; Faydown_Cloak.wiki:26; Mount_Fay.wiki:31,59 (Clawline to enter; Clawline and Drifter's Cloak to traverse); Mount_Fay.wiki:31,59 (Clawline to enter; Clawline and Drifter's Cloak to traverse)
  'arts:faydown-cloak': ['art:needolin', 'art:clawline', 'art:drifters-cloak'],
  // Swift Step: Enemy_Gauntlets_(Silksong)_Hunter's_March_3.wiki:13 (reward: access to Swift Step); Hunter's_March.wiki:37
  'arts:swift-step': ['gaunt:hunters-march-3'],
  // Clawline: Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Underworks.wiki:45,106 (the Cauldron: from Whiteward or by the lift Trobbio's defeat opens); js/graph.js Under_17 doors (Ward_06, Library_11b); Whispering_Vaults.wiki:44
  'arts:clawline': ['key:white|a', 'boss:trobbio|b'],
  // Sylphsong: Weavenest_Atla.wiki:47 (Needolin door); Sylphsong.wiki:17,19,22; kb/data/completionist/abilities.ts
  'arts:sylphsong': ['art:needolin'],
  // Silk Soar: The_Abyss_(Silksong).wiki:42 (the Abyss via the diving bell, key from Ballow); Silk_Soar.wiki:31; The_Abyss_(Silksong).wiki:88
  'arts:silk-soar': ['key:diving-bell', 'art:needolin'],
  // Needle Strike: Blasted_Steps.wiki:68 (Cling Grip required to enter); Blasted_Steps.wiki:37 (Pinstress lives past the Great Conchflies); js/graph.js Coral_11 > Coral_11b > Coral_34 > Room_Pinstress
  'arts:needle-strike': ['art:cling-grip', 'boss:great-conchfly'],
  // Beastling Call: Beastling_Call.wiki:37
  'arts:beastling-call': ['boss:bell-eater'],
  // Elegy of the Deep: Elegy_of_the_Deep.wiki:69; The_Abyss_(Silksong).wiki:42,90 (Silk Soar is needed to leave the Abyss); Elegy_of_the_Deep.wiki:69; js/quests.js CHAIN Black Thread Pt3 Escape
  'arts:elegy-of-the-deep': ['art:silk-soar', 'wish:Black Thread Pt2 Abyss'],
  // Ruined Tool: Ruined_Tool.wiki:49; Bilewater.wiki:159 (Weavenest Murglin); Ruined_Tool.wiki:49 (Bilewater by the breakable wall from Sinner's Road); Sinner's_Road.wiki:41 (Sinner's Road only with Cling Grip)
  'extra:1047': ['art:needolin', 'art:cling-grip'],
  // Cogwork Core 3: Enemy_Gauntlets_(Silksong)_Cogwork_Core_3.wiki (by using Silk Soar)
  'gaunt:cogwork-core-3': ['art:silk-soar'],
  // Deep Docks 2: Enemy_Gauntlets_(Silksong)_Deep_Docks_2.wiki (accessed from the Marrow using Cling Grip)
  'gaunt:deep-docks-2': ['art:cling-grip'],
  // Deep Docks 3: Enemy_Gauntlets_(Silksong)_Deep_Docks_3.wiki (Clawline required)
  'gaunt:deep-docks-3': ['art:clawline'],
  // Far Fields 1: Enemy_Gauntlets_(Silksong)_Far_Fields_1.wiki (Requires Clawline); Far_Fields.wiki:220
  'gaunt:far-fields-1': ['art:clawline'],
  // Far Fields 3: Enemy_Gauntlets_(Silksong)_Far_Fields_2.wiki (requires Silk Soar)
  'gaunt:far-fields-2': ['art:silk-soar'],
  // Craw Lake 1: Enemy_Gauntlets_(Silksong)_Greymoor_3.wiki (Requires Drifter's Cloak)
  'gaunt:greymoor-3': ['art:drifters-cloak'],
  // Halfway Home: Enemy_Gauntlets_(Silksong)_Greymoor_4.wiki (only after promising Great Taste of Pharloom); Enemy_Gauntlets_(Silksong)_Greymoor_4.wiki; Vintage_Nectar.wiki:24
  'gaunt:greymoor-4': ['took:Great Gourmand', 'item:Vintage Nectar'],
  // The Forum 1: High_Halls.wiki:45 (Clawline required to access)
  'gaunt:high-halls-1': ['art:clawline'],
  // The Forum 2: High_Halls.wiki:45 (Clawline required to access)
  'gaunt:high-halls-2': ['art:clawline'],
  // Hunter's March 4: Enemy_Gauntlets_(Silksong)_Hunter's_March_4.wiki (The Cling Grip is required for access)
  'gaunt:hunters-march-4': ['art:cling-grip'],
  // Hunter's March 5: Enemy_Gauntlets_(Silksong)_Hunter's_March_5.wiki (Mottled Skarr killed after the previous gauntlet); Enemy_Gauntlets_(Silksong)_Hunter's_March_5.wiki; js/how.js HOW.tools.curveclaw found when antMerchantKilled
  'gaunt:hunters-march-5': ['gaunt:hunters-march-4', 'ev:skarr-dead'],
  // The Marrow 2: Enemy_Gauntlets_(Silksong)_The_Marrow_2.wiki (Requires Cling Grip)
  'gaunt:the-marrow-2': ['art:cling-grip'],
  // Sinner's Road 1: Sinner's_Road.wiki:41 (Sinner's Road only after Cling Grip)
  'gaunt:sinners-road-1': ['art:cling-grip'],
  // The Slab 1: Enemy_Gauntlets_(Silksong)_The_Slab_1.wiki (The Key of Indolent is required for access)
  'gaunt:the-slab-1': ['key:indolent'],
  // The Slab 2: Enemy_Gauntlets_(Silksong)_The_Slab_2.wiki (Key of Indolent required)
  'gaunt:the-slab-2': ['ev:wardenfly', 'key:indolent'],
  // The Slab 3: Enemy_Gauntlets_(Silksong)_The_Slab_3.wiki (Key of Indolent required)
  'gaunt:the-slab-3': ['key:indolent'],
  // The Cauldron: Enemy_Gauntlets_(Silksong)_Underworks_3.wiki (initiated by using the Clawline on the ring)
  'gaunt:underworks-3': ['art:clawline'],
  // Lost Verdania: Verdania.wiki:59 (Elegy of the Deep by the Green Prince opens Lost Verdania)
  'gaunt:verdania': ['art:elegy-of-the-deep'],
  // Whispering Vaults 2: Enemy_Gauntlets_(Silksong)_Whispering_Vaults_2.wiki (reuses the previous arena); Vaultborn.wiki Location (available once the previous gauntlet is cleared)
  'gaunt:whispering-vaults-2': ['gaunt:whispering-vaults-1'],
  // Whiteward 1: Enemy_Gauntlets_(Silksong)_Whiteward_1.wiki (requires Balm for the Wounded promised); kb/data/game/gating.json doors ward_03|door1: Save Sherma accepted
  'gaunt:whiteward-1': ['took:Save Sherma'],
  // Bell Beast: Bell_Beast.wiki:34 (freed with the Silkspear); Silkspear.wiki:20; kb/data/completionist/abilities.ts Silk Heart #1 prereqs Silkspear
  'boss:bell-beast': ['skill:silkspear'],
  // Lace: Lace.wiki:55 (first encountered in Deep Docks after acquiring Swift Step)
  'boss:lace': ['art:swift-step'],
  // Savage Beastfly: Savage_Beastfly.wiki:63 (soar the Chapel of the Beast's updrafts with the Drifter's Cloak)
  'boss:savage-beastfly-chapel-of-the-beast': ['art:drifters-cloak'],
  // Widow: Widow.wiki:138 (reached through the upper bellveins from upper-right Shellwood)
  'boss:widow': ['art:cling-grip'],
  // Last Judge: js/quests.js BELLSHRINES (the five the Grand Gate asks for); Last_Judge.wiki Location (all five Bellshrines first)
  'boss:last-judge': ['bell:bellShrineBoneForest', 'bell:bellShrineWilds', 'bell:bellShrineGreymoor', 'bell:bellShrineBellhart', 'bell:bellShrineShellwood'],
  // Phantom: Sinner's_Road.wiki:41 (Sinner's Road only after Cling Grip)
  'boss:phantom': ['art:cling-grip'],
  // Forebrothers Signis & Gron: Forebrothers_Signis_&_Gron.wiki Location (locked door opened from the Clawline hook)
  'boss:forebrothers-signis-and-gron': ['art:clawline'],
  // The Unravelled: The_Unravelled.wiki Location; js/quests.js LOCKS Ward Boss Key: Ward_02; js/how.js NEEDS.pieces.112 white+surgeon; Enemy_Gauntlets_(Silksong)_Unravelled.wiki
  'boss:the-unravelled': ['key:surgeon'],
  // Disgraced Chef Lugoli: Disgraced_Chef_Lugoli.wiki (arena only accessible with Faydown Cloak); Enemy_Gauntlets_(Silksong)_Lugoli.wiki; completionist bosses.ts prereqs Faydown Cloak
  'boss:disgraced-chef-lugoli': ['art:faydown-cloak'],
  // Groal the Great: Bilewater.wiki:130 (Faydown Cloak required to reach Bilehaven)
  'boss:groal-the-great': ['art:faydown-cloak'],
  // Voltvyrm: Sands_of_Karak.wiki:36 (Clawline required to enter); Sands_of_Karak.wiki:90 (Voltnest: in Act 2 the Faydown Cloak and Clawline reach the entrance; in Act 3 Silk Soar); Sands_of_Karak.wiki:90
  'boss:voltvyrm': ['art:clawline', 'art:faydown-cloak|a', 'art:silk-soar|b'],
  // Great Conchfly: Sands_of_Karak.wiki:36 (Clawline required to enter)
  'boss:raging-conchfly': ['art:clawline'],
  // First Sinner: First_Sinner.wiki Location (lower Slab, after the Key of Apostate); The_Slab.wiki (Key of Apostate opens the room with the hidden tunnels to her cell); First_Sinner.wiki Location (locked door opened with the Key of Heretic); js/how.js NEEDS.skills.rune-rage: indolent, heretic, apostate
  'boss:first-sinner': ['key:apostate', 'key:heretic'],
  // Grand Mother Silk: Grand_Mother_Silk.wiki Location (top of the Cradle, unlocked after Lace's second fight)
  'boss:grand-mother-silk': ['boss:lace-the-cradle'],
  // Crawfather: Crawfather.wiki Location; Craw_Summons.wiki How To Acquire (Act 3, Awaiting the End done, Craw house lever, then a bench roll)
  'boss:crawfather': ['key:craw-summons'],
  // Watcher at the Edge: Watcher_at_the_Edge.wiki Location; Grey_Memento.wiki; completionist prereqs Silk Soar; Watcher_at_the_Edge.wiki Location (Needolin wakes them); completionist prereqs Needolin
  'boss:watcher-at-the-edge': ['art:silk-soar', 'art:needolin'],
  // Palestag: Verdania.wiki:59 (Elegy of the Deep by the Green Prince opens Lost Verdania)
  'boss:palestag': ['art:elegy-of-the-deep'],
  // Clover Dancers: Verdania.wiki:59 (Elegy of the Deep by the Green Prince opens Lost Verdania)
  'boss:clover-dancers': ['art:elegy-of-the-deep'],
  // Nyleth: Nyleth.wiki Location (Hornet must defeat Shrine Guardian Seth); Nyleth.wiki In-game Events (play the Elegy of the Deep at her shrine)
  'boss:nyleth': ['boss:shrine-guardian-seth', 'art:elegy-of-the-deep'],
  // Skarrsinger Karmelita: Enemy_Gauntlets_(Silksong)_Hunter's_March_6.wiki (blocks the only path to Karmelita); Skarrsinger_Karmelita.wiki Location (hidden passage from her statue in Hunter's March needs Silk Soar); Far_Fields.wiki:36; completionist prereqs; Skarrsinger_Karmelita.wiki In-game Events; Enemy_Gauntlets_(Silksong)_Karmelita.wiki; completionist prereqs
  'boss:skarrsinger-karmelita': ['gaunt:hunters-march-6', 'art:silk-soar', 'art:elegy-of-the-deep'],
  // Crust King Khann: Raging_Conchfly.wiki Location (blocks the path to the Coral Tower); Crust_King_Khann.wiki Location (Elegy of the Deep on his dormant body); completionist prereqs; Sands_of_Karak.wiki:137 (after the tower's waves, Silk Soar to ascend into Khann's arena)
  'boss:crust-king-khann': ['boss:raging-conchfly', 'art:elegy-of-the-deep', 'art:silk-soar'],
  // Summoned Saviour: Summoned_Saviour.wiki Location (appears at the conclusion of A Vassal Lost); js/quests.js FROM Steel Sentinel Pt2: Bone_Steel_Servant; kb/data/game/gating.json doors bonegrave|left1: Steel Sentinel completable
  'boss:summoned-saviour': ['took:Steel Sentinel Pt2'],
  // Lost Lace: Lost_Lace.wiki Location (the Everbloom is required); The_Abyss_(Silksong).wiki:42 (via the diving bell, Diving Bell Key); Lost_Lace.wiki Location (Hornet cannot be Cursed)
  'boss:lost-lace': ['everbloom', 'key:diving-bell'],
  // Lace: Lace.wiki:64
  'boss:lace-the-cradle': ['piece:119', 'piece:120'],
  // Moss Mother: Weavenest_Atla.wiki:47 (Needolin door, every time)
  'boss:moss-mother-weavenest-atla': ['art:needolin'],
  // Skull Tyrant: Skull_Tyrant.wiki:105; js/spots.js BOSSES more.of skull-tyrant; Skull_Tyrant.wiki:105; js/spots.js BOSSES more.coming skullKingWillInvade|skullKingInvaded
  'boss:skull-tyrant-bone-bottom': ['boss:skull-tyrant', 'ev:tyrant-invades'],
  // Bone Scroll: Bone_Scroll.wiki row 1 (up a tall wind current); completionist relics.ts prereqs Drifter's Cloak
  'extra:1': ['art:drifters-cloak'],
  // Weaver Effigy: Weaver_Effigy.wiki row 2 (after completing Rite of Rebirth); js/spots.js EXTRAS[5] more.how { kind: chapel, wish: Wood Witch Curse }; Shellwood.wiki Chapel of the Witch
  'extra:5': ['wish:Wood Witch Curse'],
  // Weaver Effigy: Weaver_Effigy.wiki row 3 (requires Key of Apostate); tools/gen-spots.js EXTRA_ACT note
  'extra:6': ['key:apostate'],
  // Choral Commandment: Choral_Commandment.wiki row 4 (Silk Soar or a precise jump with Faydown Cloak); tools/gen-spots.js EXTRA_ACT; Choral_Commandment.wiki row 4
  'extra:9': ['art:silk-soar|a', 'art:faydown-cloak|b'],
  // Choral Commandment: js/spots.js EXTRAS[10] more { shop: jubilana, price 180, after: Save City Merchant Bridge }; Choral_Commandment.wiki row 3
  'extra:10': ['wish:Save City Merchant Bridge'],
  // Rune Harp: Rune_Harp.wiki row 1 (requires Needolin)
  'extra:11': ['art:needolin'],
  // Rune Harp: Rune_Harp.wiki row 2; Rune_Harp.wiki row 2; Far_Fields.wiki:212; completionist relics.ts; Rune_Harp.wiki row 2; completionist relics.ts (Silkspeed Anklets with Flea Brew)
  'extra:12': ['art:needolin', 'tool:silkspeed-anklets', 'tool:flea-brew'],
  // Rune Harp: Enemy_Gauntlets_(Silksong)_High_Halls_2.wiki (Reward: Rune Harp); Rune_Harp.wiki row 3 (Act 3 only)
  'extra:13': ['gaunt:high-halls-2'],
  // Psalm Cylinder: Blasted_Steps.wiki:39 (Grindle's Snitchfly settlement requires the Faydown Cloak)
  'extra:14': ['art:faydown-cloak'],
  // Psalm Cylinder: High_Halls.wiki:45 (Clawline required to access)
  'extra:17': ['art:clawline'],
  // Sacred Cylinder: Psalm_Cylinder.wiki (lower Whispering Vaults accessible via the Underworks after beating Trobbio)
  'extra:19': ['boss:trobbio'],
  // Arcane Egg: The_Abyss_(Silksong).wiki:42 (via the diving bell, Diving Bell Key)
  'extra:20': ['key:diving-bell'],
  // Mossberry: Weavenest_Atla.wiki:47 (Needolin door, every time)
  'extra:26': ['art:needolin'],
  // Silkeater: Sinner's_Road.wiki:41 (Sinner's Road only after Cling Grip)
  'extra:31': ['art:cling-grip'],
  // Grey Memento: Grey_Memento.wiki; js/spots.js EXTRAS[37] more.how boss
  'extra:37': ['boss:watcher-at-the-edge'],
  // Hero's Memento: Hero's_Memento.wiki; js/spots.js EXTRAS[38] more.how boss
  'extra:38': ['boss:lost-garmond'],
  // Surface Memento: Surface_Memento.wiki (play the Needolin in a decaying house in the Nameless Town)
  'extra:39': ['art:needolin'],
  // Craw Memento: Craw_Memento.wiki; js/spots.js EXTRAS[41] more.how boss
  'extra:41': ['boss:crawfather'],
  // Sprintmaster Memento: Sprintmaster_Memento.wiki (beat him four times); Sprintmaster_Memento.wiki (the fourth race only after the Everbloom)
  'extra:42': ['wish:Sprintmaster Race', 'everbloom'],
  // Guardian's Memento: Shrine_Guardian_Seth.wiki (at Fleatopia once Ecstasy of the End is completed); Guardian's_Memento.wiki
  'extra:43': ['wish:Flea Games'],
  // Desk: js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS; js/spots.js EXTRAS[44] needs IsAnyRelicsDeposited
  'extra:44': ['key:bellhome', 'ev:scrounge-relic'],
  // Gleamlights: js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:45': ['key:bellhome'],
  // Bell Lacquer: js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:46': ['key:bellhome'],
  // Personal Spa: js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:47': ['key:bellhome'],
  // Gramophone: js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS; js/spots.js EXTRAS[48] needs LibrarianCollectionComplete; js/spots.js EXTRAS[48] needs BelltownFurnishingDesk
  'extra:48': ['key:bellhome', 'ev:cardinius-done', 'extra:44'],
  // Materium: Materium.wiki (constructed in the Bellhome); js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:49': ['extra:1049', 'key:bellhome'],
  // Crawbell: Crawbell.wiki; completionist bellhome.ts; js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:50': ['extra:1397', 'key:bellhome'],
  // Farsight: Farsight.wiki (must be constructed in the Bellhome); js/spots.js EXTRAS needs BelltownHouseVisited; js/app-map.js NEED_WORDS
  'extra:51': ['extra:1048', 'key:bellhome'],
  // Abyss Map: The_Abyss_(Silksong).wiki:42 (via the diving bell, Diving Bell Key)
  'extra:963': ['key:diving-bell'],
  // High Halls Map: High_Halls.wiki:45 (Clawline required to access)
  'extra:964': ['art:clawline'],
  // Cradle Map: Lace.wiki:64 (Lace at the top of the Cradle lift); js/graph.js Song_Tower_01 to Tube_Hub to Cradle_01 to Cradle_02
  'extra:971': ['boss:lace-the-cradle'],
  // Weavenest Atla Map: Weavenest_Atla.wiki:47 (Needolin door, every time)
  'extra:975': ['art:needolin'],
  // Simple Key: Sands_of_Karak.wiki:36 (Clawline required to enter)
  'extra:1036': ['art:clawline'],
  // Simple Key: Simple_Key_(Silksong).wiki row 2 (dropped by a Roachkeeper); js/gauntlets.js sinners-road-1 reward Simple Key
  'extra:1037': ['gaunt:sinners-road-1'],
  // Key of Indolent: The_Slab.wiki Through the Front Door (only the Key of Apostate opens the rest of the Slab)
  'extra:1038': ['ev:wardenfly|a', 'key:apostate|b'],
  // Key of Heretic: Slab_Keys.wiki (dropped by the last enemy of the northwest gauntlet); js/gauntlets.js reward Key of Heretic; Slab_Keys.wiki
  'extra:1039': ['gaunt:the-slab-2|a', 'gaunt:the-slab-3|b'],
  // Surgeon's Key: Surgeon's_Key.wiki (Clawline used to open a shaft)
  'extra:1043': ['art:clawline'],
  // Farsight: The_Abyss_(Silksong).wiki:42 (via the diving bell, Diving Bell Key)
  'extra:1048': ['key:diving-bell'],
  // Silk cocoon: Sinner's_Road.wiki:41 (Sinner's Road only after Cling Grip)
  'extra:1157': ['art:cling-grip'],
  // Silk cocoon: Sinner's_Road.wiki:41 (Sinner's Road only after Cling Grip)
  'extra:1158': ['art:cling-grip'],
  // Silk cocoon: js/how.js KEYS.architect locks Under_17 (Architect Shrine Door, the way into Under_20); NEEDS.crests.architect; Architect's_Key.wiki (sold by the Twelfth Architect, 110, after 25 Tools)
  'extra:1162': ['key:architect'],
  // Silk cocoon: js/how.js KEYS.architect locks Under_17 (Architect Shrine Door, the way into Under_20); NEEDS.crests.architect; Architect's_Key.wiki (sold by the Twelfth Architect, 110, after 25 Tools)
  'extra:1163': ['key:architect'],
  // Silk cocoon: js/how.js KEYS.architect locks Under_17 (Architect Shrine Door, the way into Under_20); NEEDS.crests.architect; Architect's_Key.wiki (sold by the Twelfth Architect, 110, after 25 Tools)
  'extra:1164': ['key:architect'],
  // Bellhome Key: js/quests.js GROUPS['Belltown House Key'] (with Bellhart's Glory); Bellhome_Key.wiki
  'extra:1396': ['wish:Belltown House Mid'],
  // Crawbell: Crawbell.wiki (after beating the Court of Craws)
  'extra:1397': ['boss:crawfather'],
  // Silkeater: js/how.js KEYS.architect locks Under_17 (Architect Shrine Door, the way into Under_20); NEEDS.crests.architect; Architect's_Key.wiki (sold by the Twelfth Architect, 110, after 25 Tools)
  'extra:1404': ['key:architect'],
  // Shakra: js/people.js HERE.shakra.belltown; Shakra.wiki In-game Events
  'shakra:2': ['boss:widow|a'],
  // Shakra: js/people.js HERE.shakra.bonetown; Shakra.wiki ("After the Bell Beast is defeated, she resides on a ledge on the eastern side of Bone Bottom")
  'shakra:6': ['boss:bell-beast'],
  // Wishwall: Wishwall.wiki Location table; Silver_Bells.wiki prerequisite; My_Missing_Courier.wiki How to Start
  'board:belltown': ['boss:widow'],
  // Wishwall: Wishwall.wiki Location table; js/people.js PEOPLE caretaker.here.song_enclave; Wishwall.wiki Location table ("returning after meeting the Caretaker")
  'board:song_enclave': ['ev:songclave-1'],
  // Wishwall: Wishwall.wiki Location table ("after defeating the Bell Beast and returning to Bone Bottom")
  'board:bonetown': ['boss:bell-beast'],
  // Grass Doll (The Hidden Hunter): Grass_Doll.wiki ("picked up after defeating Gurr the Outcast"); kb/data/game/gating.json Bone_East_18b|Collectable Item Pickup inside ant_item_string
  'task:0': ['boss:gurr-the-outcast'],
  // Horn Fragment (Savage Beastfly): Horn_Fragment.wiki
  'task:1': ['boss:savage-beastfly-far-fields'],
  // Broodmother's Eye (The Wailing Mother): Broodmother's_Eye.wiki
  'task:2': ['boss:broodmother'],
  // Courier's Rasher (Great Taste of Pharloom): Courier's_Rasher.wiki How to Acquire ("After unlocking delivery wishes through Tipp & Pill"); js/people.js HERE.couriers (both couriers saved)
  'task:4': ['wish:Save Courier Tall'],
  // Pickled Muckmaggot (Great Taste of Pharloom): Pickled_Muckmaggot.wiki ("dropped by Disgraced Chef Lugoli"); kb/data/game/gating.json Dust_Chef|Return Pickup inside Battle Scene
  'task:7': ['boss:disgraced-chef-lugoli'],
  // Plasmium (Alchemist's Assistant): Plasmium.wiki How to Acquire; js/spots.js ASKS["Extractor Blue"]; Alchemist's_Assistant.wiki ("He gives her his Needle Phial")
  'task:8': ['tool:needle-phial'],
  // Plasmium (Alchemist's Assistant): Plasmium.wiki How to Acquire; js/spots.js ASKS["Extractor Blue"]; Alchemist's_Assistant.wiki ("He gives her his Needle Phial")
  'task:9': ['tool:needle-phial'],
  // Plasmium (Alchemist's Assistant): Plasmium.wiki How to Acquire; js/spots.js ASKS["Extractor Blue"]; Alchemist's_Assistant.wiki ("He gives her his Needle Phial")
  'task:10': ['tool:needle-phial'],
  // Crown Fragment (The Terrible Tyrant): Crown_Fragment.wiki How to Acquire ("dropped after slaying the Skull Tyrant in the Marrow before Act 3"); Skull_Tyrant.wiki
  'task:35': ['boss:skull-tyrant'],
  // Seeker's Soul (Silk and Soul): Seeker's_Soul.wiki ("found at Bilehaven ... after defeating Groal the Great")
  'task:38': ['boss:groal-the-great'],
  // Grand Gate: js/quests.js BELLSHRINES; Acts.wiki Grand Gate ("Journey to the five Bellshrines")
  'task:56': ['bell:bellShrineBoneForest', 'bell:bellShrineWilds', 'bell:bellShrineGreymoor', 'bell:bellShrineBellhart', 'bell:bellShrineShellwood'],
  // The Great Citadel: Acts.wiki Act 1 ("Hornet acquires her first objective after speaking to the Chapel Maid")
  'task:67': ['ev:chapel-maid-met'],
  // Bone Bottom Supplies (task:68): the wiki's Bell Beast isn't the game's test (only "not Act 3"), not kept.
  // Queen's Egg: js/quests.js CHAIN["Courier Delivery Dustpens Slave"].when; Queen's_Egg_(Wish).wiki prerequisite
  'task:69': ['ev:styx-grub'],
  // Fleatopia Supplies: js/quests.js CHAIN["Courier Delivery Fleatopia"].when; Fleatopia_Supplies.wiki prerequisite
  'task:71': ['ev:caravan-3'],
  // Great Taste of Pharloom: js/spots.js TASKS[72] (GourmandGivenMeat); Courier's_Rasher.wiki
  'task:72': ['item:Courier Supplies Gourmand'],
  // Liquid Lacquer: js/quests.js CHAIN["Courier Delivery Mask Maker"].when hasDoubleJump; Liquid_Lacquer_(Wish).wiki prerequisite; js/quests.js CHAIN["Courier Delivery Mask Maker"].when UnlockedMelodyLift; Liquid_Lacquer_(Wish).wiki ("Play the Threefold Melody"); js/quests.js CHAIN["Courier Delivery Mask Maker"].when SlaveDeliveryQuestCompleted
  'task:73': ['art:faydown-cloak', 'ev:melody-lift', 'wish:Courier Delivery Dustpens Slave'],
  // Pilgrim's Rest Supplies: Pilgrim's_Rest_Supplies.wiki prerequisite
  'task:74': ['wish:Save Courier Tall'],
  // The Threadspun Town: Bellhart.wiki ("accessible through Greymoor's western entrance after defeating Moorwing"); Bellhart.wiki ("or by saving five Fleas and travelling with the Flea Caravan")
  'task:79': ['boss:moorwing|a', 'fleas:5|b'],
  // Soul Snare: Acts.wiki ("Accessible after completing Silk and Soul"); js/quests.js GROUPS ("Soul Snare opens the wish Silk and Soul"); Acts.wiki ("Defeat Grand Mother Silk with the Needolin")
  'task:81': ['wish:Soul Snare', 'art:needolin'],
  // A Vassal Lost: js/quests.js CHAIN["Steel Sentinel Pt2"].prev Steel Sentinel; A_Vassal_Lost.wiki Reward
  'task:88': ['boss:summoned-saviour'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom")
  'task:90': ['art:needolin'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[91] alt.at (MushroomQuestFound1..1); the wiki ("visit in order")
  'task:91': ['art:needolin', 'ev:mushroom-1'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[92] alt.at (MushroomQuestFound1..2); the wiki ("visit in order")
  'task:92': ['art:needolin', 'ev:mushroom-2'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[93] alt.at (MushroomQuestFound1..3); the wiki ("visit in order")
  'task:93': ['art:needolin', 'ev:mushroom-3'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[94] alt.at (MushroomQuestFound1..4); the wiki ("visit in order")
  'task:94': ['art:needolin', 'ev:mushroom-4'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[95] alt.at (MushroomQuestFound1..5); the wiki ("visit in order")
  'task:95': ['art:needolin', 'ev:mushroom-5'],
  // Passing of the Age: Passing_of_the_Age_(Wish).wiki ("playing the Needolin summons Mister Mushroom"); js/spots.js TASKS[96] alt.at (MushroomQuestFound1..6); the wiki ("visit in order")
  'task:96': ['art:needolin', 'ev:mushroom-6'],
  // The Lost Merchant: The_Lost_Merchant.wiki prerequisite
  'task:100': ['art:faydown-cloak'],
  // Balm for the Wounded: Whiteward.wiki ("the path down to the main area is blocked by a lift that requires the White Key"); js/quests.js LOCKS["Ward Key"] Ward_01
  'task:103': ['key:white'],
  // Trail's End: Trail's_End.wiki ("requires Hornet to play the Needolin")
  'task:104': ['art:needolin'],
  // Eva: Eva.wiki ("found in Weavenest Atla after Hornet obtains the Needolin"); Weavenest_Atla.wiki ("accessed through a Needolin door in the east of Moss Grotto")
  'person:eva': ['art:needolin'],
  // Loddie: Loddie.wiki In-game Events ("After defeating Widow, Loddie ... takes up residence in the prison in the Marrow")
  'person:loddie': ['boss:widow'],
  // Mooshka: Fleamaster_Mooshka.wiki Location ("After finding at least 22 Fleas, they move to the easternmost room in Putrified Ducts"); FSM Caravan Troupe Leader Judge NPC; Fleamaster_Mooshka.wiki In-game Events
  'person:mooshka': ['fleas:22', 'ev:caravan-3'],
  // Plinney: Pinmaster_Plinney.wiki Location ("After Widow is defeated ... found in his bellhome")
  'person:plinney': ['boss:widow'],
  // Alchemist Zylotol: Alchemist_Zylotol.wiki In-game Events ("a makeshift lab accessible with Cling Grip")
  'giver:crawl_08': ['art:cling-grip'],
  // Crull And Benjin: Sinner's_Road.wiki ("can only be accessed after obtaining the Cling Grip")
  'giver:dust_shack': ['art:cling-grip'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:0': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:1': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:2': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:3': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:4': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:5': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:6': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:7': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:8': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:9': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:10': ['boss:bell-beast'],
  // Bellway: js/map.js PINS (lit rule); Bellway.wiki Locations and Prices
  'pin:11': ['boss:bell-beast'],
  // Terminus: js/map.js PINS (lit rule); Ventrica.wiki (redirects to Fast Travel) Ventrica table (Terminus footnote)
  'pin:96': ['ev:tube-any'],
  // Flea Caravan: js/acts.js LEGS (Mooshka's FSM at each stop, game data); js/map.js PINS (CaravanTroupeLocation); Flea_Caravan.wiki Locations
  'pin:105': ['fleas:5', 'ev:caravan-1'],
  // Flea Caravan: js/acts.js LEGS (Mooshka's FSM at each stop, game data); js/map.js PINS (CaravanTroupeLocation); Flea_Caravan.wiki Locations; js/acts.js LEGS (Mooshka's FSM at each stop, game data); js/map.js PINS (CaravanTroupeLocation); Flea_Caravan.wiki Locations (CaravanTroupeLeaderCanLeaveGreymoor)
  'pin:106': ['fleas:12', 'boss:last-judge', 'ev:caravan-2'],
  // Flea Caravan: js/acts.js LEGS (Mooshka's FSM at each stop, game data); js/map.js PINS (CaravanTroupeLocation); Flea_Caravan.wiki Locations; js/acts.js LEGS (Mooshka's FSM at each stop, game data); js/map.js PINS (CaravanTroupeLocation); Flea_Caravan.wiki Locations (SeenFleatopiaEmpty, CaravanTroupeLeaderCanLeaveJudge)
  'pin:107': ['fleas:22', 'ev:caravan-3'],
  // Bellhart Bellshrine: js/spots.js BELLS; Bellshrine.wiki Bellshrines; js/spots.js BOSSES widow (Belltown_Shrine)
  'bell:bellShrineBellhart': ['boss:widow'],
  // Forge Daughter: Forge_Daughter.wiki Location
  'shop:forge-daughter:0': ['gaunt:deep-docks-1'],
  // Frey: js/people.js HERE frey.belltown; Frey.wiki
  'shop:frey:0': ['boss:widow'],
  // Grindle: Grindle.wiki Location
  'shop:grindle:0': ['art:faydown-cloak'],
  // Jubilana: js/people.js HERE jubilana; Jubilana.wiki; js/people.js HERE jubilana; Jubilana.wiki (hang04Battle)
  'shop:jubilana:0': ['wish:Save City Merchant', 'gaunt:high-halls-1'],
  // Jubilana: js/people.js HERE jubilana; Jubilana.wiki
  'shop:jubilana:1': ['wish:Save City Merchant'],
  // Jubilana: js/people.js HERE jubilana; Jubilana.wiki; js/people.js HERE jubilana; Jubilana.wiki (enclaveLevel 1)
  'shop:jubilana:2': ['wish:Save City Merchant', 'ev:songclave-1'],
  // Mottled Skarr: Mottled_Skarr.wiki Location
  'shop:mottled-skarr:0': ['art:swift-step'],
  // Twelfth Architect: Twelfth_Architect.wiki Location
  'shop:twelfth-architect:0': ['art:clawline|a', 'art:faydown-cloak|b'],
  // Couriers Tipp & Pill: js/people.js HERE couriers.belltown; js/quests.js FROM
  'shop:couriers:0': ['wish:Save Courier Short', 'wish:Save Courier Tall'],
  // Moss Druid: Moss_Druid.wiki Location
  'shop:druid:0': ['skill:silkspear'],
  // Scrounge: Relic_Seeker_Scrounge.wiki In-game Events
  'person:scrounge': ['boss:widow'],
  // Ballow: js/people.js PEOPLE ballow here.dock_10; Ballow.wiki
  'npc:ballow:dock_10': ['ev:ballow-sauna'],
  // Ballow: js/people.js PEOPLE ballow here.dock_12; Ballow.wiki; js/quests.js CHAIN Diving Bell Pt2 Ballow
  'npc:ballow:dock_12': ['ev:ballow-bell'],
  // Horned Pilgrim: js/people.js PEOPLE bb-pilgrim-horned here.bonetown; Horned_Pilgrim.wiki
  'npc:bb-pilgrim-horned:bonetown': ['ev:pebb-gone'],
  // Quiet Pilgrim: js/people.js PEOPLE bb-pilgrim-round here.bonetown; Quiet_Pilgrim.wiki
  'npc:bb-pilgrim-round:bonetown': ['ev:pilby-gone'],
  // Pavo: js/people.js PEOPLE bellhart-greeter here.belltown; Pavo.wiki
  'npc:bellhart-greeter:belltown': ['boss:widow'],
  // Solemn Pilgrim: js/people.js PEOPLE bonetown-funeral-leader here.bonetown; Solemn_Pilgrim.wiki
  'npc:bonetown-funeral-leader:bonetown': ['boss:skull-tyrant-bone-bottom'],
  // Caretaker: js/people.js PEOPLE caretaker here.cradle_03; js/quests.js CHAIN Soul Snare
  'npc:caretaker:cradle_03': ['ev:snare-ready'],
  // Caretaker: js/people.js PEOPLE caretaker here.song_enclave; Caretaker.wiki
  'npc:caretaker:song_enclave': ['bell:bellShrineEnclave'],
  // Chapel Maid: js/people.js PEOPLE churchkeeper here.tut_03; Chapel_Maid.wiki
  'npc:churchkeeper:tut_03': ['boss:widow'],
  // Scared Pilgrim: js/people.js (enclaveLevel)
  'npc:enclave-pilgrim:song_enclave': ['ev:songclave-1'],
  // Humble Pilgrim: js/people.js PEOPLE enclave-pilgrim-act2 here.song_enclave; Humble_Pilgrim.wiki; Humble_Pilgrim.wiki
  'npc:enclave-pilgrim-act2:song_enclave': ['ev:songclave-2'],
  // Pilgrim Preacher: js/people.js (enclaveLevel); Pilgrim_Preacher.wiki
  'npc:enclave-pilgrim-act2-large:song_enclave': ['ev:songclave-1', 'boss:lace-the-cradle'],
  // Worried Pilgrim: Worried_Pilgrim.wiki
  'npc:enclave-pilgrim-large-act3:song_enclave': ['art:silk-soar', 'ev:sentinel-woken'],
  // Pondcatcher Reed: Pondcatcher_Reed.wiki; js/people.js PEOPLE fisher-npc
  'npc:fisher-npc:belltown': ['boss:widow'],
  // Pondcatcher Reed: Pondcatcher_Reed.wiki; js/people.js PEOPLE fisher-npc
  'npc:fisher-npc:belltown_07': ['boss:widow'],
  // Pondcatcher Reed: Pondcatcher_Reed.wiki; js/people.js PEOPLE fisher-npc
  'npc:fisher-npc:shellwood_01': ['boss:widow'],
  // Flick The Fixer: js/people.js PEOPLE fixer here.bonetown
  'npc:fixer:bonetown': ['boss:bell-beast|a', 'ev:visited-shellwood|b'],
  // Grishkin: js/people.js at (CaravanTroupeLocation)
  'npc:fleamember-short:aqueduct_05_caravan': ['ev:caravan-3'],
  // Grishkin: js/people.js at (CaravanTroupeLocation)
  'npc:fleamember-short:coral_judge_arena': ['ev:caravan-2'],
  // Grishkin: js/people.js at (CaravanTroupeLocation)
  'npc:fleamember-short:greymoor_08_caravan': ['ev:caravan-1'],
  // Varga: js/people.js at (CaravanTroupeLocation)
  'npc:fleamember-tall:aqueduct_05_caravan': ['ev:caravan-3'],
  // Kratt: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-lech at; Kratt.wiki; js/acts.js
  'npc:flea-lech:aqueduct_05_caravan': ['ev:caravan-3', 'ev:kratt-freed'],
  // Kratt: js/quests.js CHAIN/FROM Flea Games Pre (Bellhart board), Flea Games; Kratt.wiki
  'npc:flea-lech:aqueduct_05_festival': ['took:Flea Games Pre', 'ev:kratt-freed'],
  // Kratt: js/people.js PEOPLE flea-lech at; Kratt.wiki; js/acts.js
  'npc:flea-lech:bone_10': ['ev:kratt-freed'],
  // Kratt: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-lech at; Kratt.wiki; js/acts.js
  'npc:flea-lech:coral_judge_arena': ['ev:caravan-2', 'ev:kratt-freed'],
  // Kratt: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-lech at; Kratt.wiki; js/acts.js
  'npc:flea-lech:greymoor_08_caravan': ['ev:caravan-1', 'ev:kratt-freed'],
  // Vog: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-tracker at; Vog.wiki
  'npc:flea-tracker:aqueduct_05_caravan': ['ev:caravan-3', 'ev:vog-met'],
  // Vog: js/quests.js CHAIN/FROM Flea Games Pre (Bellhart board), Flea Games; Vog.wiki
  'npc:flea-tracker:aqueduct_05_festival': ['took:Flea Games Pre', 'ev:vog-met'],
  // Vog: js/people.js PEOPLE flea-tracker at; Vog.wiki
  'npc:flea-tracker:bone_10': ['ev:vog-met'],
  // Vog: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-tracker at; Vog.wiki
  'npc:flea-tracker:coral_judge_arena': ['ev:caravan-2', 'ev:vog-met'],
  // Vog: js/people.js at (CaravanTroupeLocation); js/people.js PEOPLE flea-tracker at; Vog.wiki
  'npc:flea-tracker:greymoor_08_caravan': ['ev:caravan-1', 'ev:vog-met'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:greymoor_08_boss': ['ev:garmond-met', 'ev:moorwing-seen'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:hang_04_boss': ['boss:garmond-and-zaza'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:hang_06': ['boss:garmond-and-zaza'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:song_01': ['ev:citadel-halfway'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:song_02': ['ev:citadel-halfway'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:song_13': ['ev:citadel-halfway'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki
  'npc:garmond:song_17': ['ev:citadel-halfway'],
  // Garmond And Zaza: Garmond_and_Zaza.wiki; Garmond_and_Zaza.wiki; js/quests.js FROM Fine Pins
  'npc:garmond:song_enclave': ['piece:118', 'piece:119', 'piece:120', 'wish:Fine Pins'],
  // Gilly: js/people.js PEOPLE gilly here.ant_17; Gilly.wiki
  'npc:gilly:ant_17': ['ev:gilly-1'],
  // Gilly: Gilly.wiki; js/people.js PEOPLE gilly here.ant_queen; Gilly.wiki
  'npc:gilly:ant_queen': ['piece:116', 'ev:gilly-3b'],
  // Gilly: Gilly.wiki
  'npc:gilly:bone_east_04c': ['art:cling-grip'],
  // Gilly: js/people.js PEOPLE gilly here.bone_east_24; Gilly.wiki
  'npc:gilly:bone_east_24': ['ev:gilly-3a'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:clover_01b': ['art:elegy-of-the-deep'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:clover_04b': ['art:elegy-of-the-deep'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:clover_06': ['art:elegy-of-the-deep'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:clover_18': ['art:elegy-of-the-deep'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:cog_dancers': ['boss:cogwork-dancers'],
  // Green Prince: Green_Prince.wiki; Green_Prince.wiki; Pebb.wiki
  'npc:green-prince:dust_02': ['key:simple@DUSTPENS'],
  // Green Prince: Green_Prince.wiki
  'npc:green-prince:song_04': ['ev:prince-freed', 'gaunt:choral-chambers'],
  // Aged Pilgrim: js/people.js (HalfwayPatronsCanVisit); Aged_Pilgrim.wiki; js/people.js PEOPLE hh-patron-left here.halfway_01; Aged_Pilgrim.wiki
  'npc:hh-patron-left:halfway_01': ['ev:creige-met', 'ev:lace-citadel'],
  // Exhausted Pilgrim: js/people.js (HalfwayPatronsCanVisit); Aged_Pilgrim.wiki; js/people.js PEOPLE hh-patron-right here.halfway_01; Exhausted_Pilgrim.wiki
  'npc:hh-patron-right:halfway_01': ['ev:creige-met', 'boss:widow'],
  // Nuu: Nuu.wiki; js/people.js PEOPLE hunter-fan here.bone_15; Nuu.wiki
  'npc:hunter-fan:bone_15': ['ev:nuu-met', 'boss:skull-tyrant'],
  // Nuu: Nuu.wiki; js/people.js PEOPLE hunter-fan here.coral_11; Nuu.wiki
  'npc:hunter-fan:coral_11': ['ev:nuu-met', 'boss:great-conchfly'],
  // Nuu: Nuu.wiki; js/people.js PEOPLE hunter-fan here.coral_29; Nuu.wiki
  'npc:hunter-fan:coral_29': ['ev:nuu-met', 'boss:voltvyrm'],
  // Nuu: Nuu.wiki; js/people.js PEOPLE hunter-fan here.shellwood_18; Nuu.wiki
  'npc:hunter-fan:shellwood_18': ['ev:nuu-met', 'boss:sister-splinter'],
  // Conductor Ballador: Conductor_Ballador.wiki
  'npc:last-conductor:hang_12': ['gaunt:high-halls-1'],
  // Vaultkeeper Cardinius: Vaultkeeper_Cardinius.wiki
  'npc:librarian-relic:library_08': ['ev:psalm-any'],
  // Pilby: Pilby.wiki
  'npc:little-pilgrim-n:bone_east_10': ['ev:pilby-met', 'ev:melody-lift|a', 'art:faydown-cloak|b'],
  // Pilby: Pilby.wiki
  'npc:little-pilgrim-n:bone_east_10_room': ['ev:pilby-met', 'ev:melody-lift|a', 'art:faydown-cloak|b'],
  // Mask Maker: Mask_Maker_(Silksong).wiki Location
  'npc:mask-maker:peak_mask_maker': ['art:faydown-cloak'],
  // Mister Mushroom: js/quests.js FROM Mr Mushroom (Aqueduct_05); Mister_Mushroom_(Silksong).wiki; js/spots.js TASKS 90-96; Mister_Mushroom_(Silksong).wiki
  'npc:mr-mushroom:cradle_destroyed_challenge_01': ['took:Mr Mushroom', 'ev:mushroom-6'],
  // Seth: Shrine_Guardian_Seth.wiki; js/people.js at SethJoinedFleatopia
  'npc:seth-npc:aqueduct_05_festival': ['wish:Flea Games'],
  // Seth: Shrine_Guardian_Seth.wiki
  'npc:seth-npc:greymoor_02': ['boss:nyleth'],
  // Seth: Shrine_Guardian_Seth.wiki
  'npc:seth-npc:shellwood_20': ['ev:seth-met'],
  // Sherma: js/people.js PEOPLE sherma here.belltown; Sherma.wiki
  'npc:sherma:belltown': ['boss:widow'],
  // Sherma: Sherma.wiki; Sherma.wiki (GameManager.TimePasses shermaAtSteps)
  'npc:sherma:bellway_08': ['boss:widow', 'boss:last-judge|a', 'boss:great-conchfly|b'],
  // Sherma: Sherma.wiki (FSM Pilgrim NPC Scene Control)
  'npc:sherma:bone_east_10': ['art:drifters-cloak'],
  // Sherma: Sherma.wiki
  'npc:sherma:coral_10': ['boss:last-judge', 'ev:lace-citadel'],
  // Sherma: js/people.js PEOPLE sherma here.song_enclave; Sherma.wiki
  'npc:sherma:song_enclave': ['ev:songclave-2'],
  // Sherma: js/people.js PEOPLE sherma here.ward_09; Sherma.wiki
  'npc:sherma:ward_09': ['took:Save Sherma'],
  // Second Sentinel: Second_Sentinel.wiki
  'npc:song-knight:hang_02': ['ev:sentinel-woken', 'art:clawline'],
  // Second Sentinel: Second_Sentinel.wiki
  'npc:song-knight:hang_07': ['ev:sentinel-woken'],
  // Second Sentinel: Second_Sentinel.wiki; js/people.js HERE jubilana; Jubilana.wiki
  'npc:song-knight:song_07': ['ev:sentinel-woken', 'wish:Save City Merchant'],
  // Second Sentinel: Second_Sentinel.wiki
  'npc:song-knight:song_24': ['ev:sentinel-woken'],
  // Second Sentinel: Second_Sentinel.wiki; js/people.js DORMANT (Cog Heart Pieces)
  'npc:song-knight:cog_10': ['ev:sentinel-woken'],
  // Hunter, evolution 2: Eva.wiki Location
  'extra:1391': ['art:needolin'],
  // Vesticrest: yellow slot: Eva.wiki Location; Eva.wiki; js/spots.js EXTRAS (more.slots)
  'extra:1392': ['art:needolin', 'ev:hunter-v2'],
  // Vesticrest: blue slot: Eva.wiki Location; Eva.wiki; js/spots.js EXTRAS (more.slots)
  'extra:1393': ['art:needolin', 'ev:vest-yellow'],
  // Hunter, evolution 3: Eva.wiki Location; Eva.wiki; js/spots.js EXTRAS (more.slots)
  'extra:1394': ['art:needolin', 'ev:vest-blue'],
};
