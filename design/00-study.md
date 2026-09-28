# Silksong: the sibling site, study and plan

A second site, in its own repository, that does for *Hollow Knight: Silksong* what this one does
for *Hollow Knight*: your real game followed from its save, the game's own map, the Journal, and
**how each of Hornet's stats changes with each Tool, Crest and upgrade**, in Spanish and English.
This document is the study behind it and the plan. It was written in hallownest-calculator's
`design/` on 27 September 2026 and moved here the same day, when the repository was created;
its references to `00-system.md`, `02-hollow-knight.md`, `08-live-sync.md`, `11-components.md`
and `12-seo.md` are to that repository's `design/`.

Researched on 27 September 2026. What's stated as fact here was checked from this machine:
the wiki's API was queried (categories, and the raw wikitext of the 54 Tools, 9 Crests, 43 bosses,
the damage page, the Journal, Completion and Save Data pages), the Silksong text dump was
downloaded and parsed, and the trackers', randomizer's and decoders' source was read on GitHub.
**Neither game is installed on this machine**, so two things could not be tried: reading a real
Silksong save, and extracting the map from the game's files. They're marked as such.

## 0. The short version

1. **Silksong maps onto the site piece by piece.** Charms become Tools and Crests, soul becomes
   silk, the nail becomes the Needle with five levels, the 112% becomes a 100%, the Journal is
   still the Hunter's Journal (236 entries), and the save file is **encrypted exactly as Hollow
   Knight's**: same header, same key, same AES-ECB. `js/savefile.js` decrypts it unchanged.
2. **The numbers are on the wiki, better organised than Hollow Knight's.** One page,
   [Damage Values and Enemy Health (Silksong)](https://hollowknight.wiki/w/Damage_Values_and_Enemy_Health_(Silksong)),
   carries the formula, the Needle per level, the Needle Strike per Crest, every Silk Skill and
   Tool per level, the modifiers, and a master table of **262 rows of enemies with health and
   five per-level damage modifiers each**. Every Tool, Crest and boss page has an infobox and a
   `{{Localisation}}` block with the Spanish name and the game's internal key.
3. **The game's texts exist in the same format**: the same author who publishes the Hollow Knight
   dump publishes `all_text.json` for Silksong (11 languages, 5,597 English keys, updated per
   patch, with a key-by-key changelog). `tools/game-text.js` needs a new URL and new key
   patterns, not a new design. And this time the Hunter's notes are in the dump too.
4. **The damage model is different in kind, not just in numbers.** Damage is
   `weapon[level] × enemy_modifier[level] × (1 + Σ modifiers)`: every enemy carries its own five
   modifiers, so "hits to kill" is a per-enemy figure, not a global one. That moves value from the
   sheet to the arena and the per-boss pages. There's no overcharm; slots are per colour and per
   Crest, unlocked with Memory Lockets; Tools have ammo, a refill cost, and their own upgrade
   ladder (the Crafting Kit), separate from the Needle's.
5. **There is no Godhome.** No boss rush, no Hall of Gods, no rematches: the Elegy memories are
   one-time fights. What Silksong has instead is 49 enemy gauntlets with their waves (the
   Colosseum's shape), 54 Wishes and 30 Fleas to track. Two screens of this site have no
   counterpart; two new, smaller ones take their place.
6. **The save-analyzer niche is no longer empty, and a calculator exists.** Seven save-based
   trackers already exist for Silksong (silksong-completionist, 80 stars, MIT; silksong-tracker,
   56 stars…), a dozen checklists, and one loadout calculator with DPS (the Hornet's Calculator,
   English, no licence). What nobody does: **hits to kill per enemy through its own modifiers**,
   anything in Spanish beyond checklists, following the game live, and the game's own map. That's
   the order to build in.
7. **Two gaps to close early, and one date.** The absolute attack speed per Crest (the wiki gives
   only "+34%" and "−23%" against the Hunter Crest, and DPS needs seconds); whether the map can
   be extracted from Silksong's files as it was from Hollow Knight's (nobody publishes it; the
   two interactive maps draw their own tiles). And **Sea of Sorrow**, a free expansion with new
   areas, bosses and Tools, announced for 2026: whatever ships before it will be re-fetched after it.

## 1. Piece by piece: what the site does, and what Silksong has for it

| Piece of the site | Hollow Knight (today) | Silksong | Source, state |
|---|---|---|---|
| The build | 45 charms in 11 notches, overcharm | **53 Tools** (20 red, 21 blue, 12 yellow, four of them replaced by an upgraded twin) in coloured slots on **7 Crests** (+ the Cloakless and Cursed states, and the Vesticrest's two extra slots); slots unlocked with 20 Memory Lockets; no overcharm | Wiki: `SS Infobox Tool` on all 54 pages, `SS Infobox Crest` on all; every damaging Tool tabulated per level |
| The weapon | 5 nails, 5/9/13/17/21 | **Needle, 5 levels: 5/9/13/17/21** (3 with the Cloakless Crest); upgrades at Pinmaster Plinney for rosaries + Pale Oil (3 in the game) | Wiki `Needle`; names `INV_NAME_NAIL1..5` in the dump |
| Soul | 99 + vessels, Focus heals 1 mask | **Silk**: a spool of 9 strands, up to 18 with the 18 Spool Fragments (21 with the Spool Extender); **Bind** costs 9 and heals 3 masks in 1.37 s; 1 strand per hit; 3 Silk Hearts regenerate | Wiki `Silk`, `Bind`, `Hornet (Silksong)` |
| Spells | 3 spells × 2 levels | **6 Silk Skills** (one per Skill slot, cost 4 silk), damage per Needle level tabulated | Wiki damage page |
| Nail Arts | 3 arts | **Needle Strike**, one per Crest, damage per level tabulated | Wiki damage page |
| Health | 5 masks + 4 | 5 masks + 5 from **20 Mask Shards** (4 each); Plasmium masks as lifeblood | Wiki `Mask Shard (Silksong)` |
| Hunter's Journal | 146 → 164 entries | **236 entries (237 in Steel Soul)**, from Nuu in Greymoor; kills per entry 1 to 80; 230 required for Nuu's reward | Wiki table (236 rows, 234 with a number); `NAME_/DESC_/NOTE_` triplets in the dump (238) |
| Completion | 112% in 15 categories | **100% in 10 categories**, Farsight needed to see it (§3.4) | Wiki `Completion (Silksong)` |
| Godhome, Colosseum | 44 statues, 5 pantheons, 3 trials | **None.** 49 Enemy Gauntlets with their waves; four one-time Elegy memories; the Festival of the Flea minigames (§3.5) | Wiki `Enemy Gauntlets (Silksong)/*` |
| Combat simulator | 180 foes with health | **262 rows** (201 enemies + 61 bosses and minibosses) with health, black-threaded health and five modifiers; 43 boss pages (47 fights) with attacks and `{{Damage}}` per attack | Wiki master table, boss pages |
| Save file | `user1.dat`, AES-ECB | **Identical cipher**; new JSON shape; four slots plus **autosaves** (`restoreData#.dat`) and a `shared.dat` | Two independent decoders read on GitHub; wiki `Save Data (Silksong)` |
| Live sync | File System Access, polling the file | The same, unchanged | |
| The map | Drawn from the game's files | **Not verified but feasible**: nobody publishes it; UnityPy already reads Silksong's scene bundles; the interactive maps draw their own; 33 areas (26 outer, 7 in the Citadel) | Needs the game installed (§4.7) |
| Rooms and doors | RandomizerMod `rooms.json`, `transitions.json` | The Archipelago randomizer's **room graph** (244 rooms in 29 areas, 862 locations, MIT) and a **list of 565 scene ids with their sizes** | GitHub (§4.5) |
| Collectibles | ItemChanger `locations.json` | silksong-completionist's dictionary (MIT): every trackable thing with its save field | GitHub (§4.4) |
| Texts | `all_text.json`, patch 1.5.12620 | **`all_text.json` for Silksong**, patch 1.0.30000, same shape | GitHub (§4.1) |
| Sprites | Wiki files | Wiki files (`HJ <Name>.png`, `<Tool>.png`, `Hunter Crest.png`, `SS Mask.png`, `Silk_Spool_HUD_*.png`) | Same CDN |

## 2. Hornet's side: the build model

### 2.1 The formula

The wiki states it, with the game's rounding:

```
total_damage = weapon_damage[level] × enemy_modifiers[level] × player_modifiers
```

- `weapon_damage[level]`: the Needle, a Needle Strike or a Silk Skill at **the Needle's level**;
  a Tool at **the Crafting Kit's level** (four upgrades, +60% each, rounded before anything
  else; it boosts the damaging blue Tools too). Two ladders, then: the Needle's (Pale Oil) and
  the Tools' (the Crafting Kit), plus the Tool Pouch's for ammo.
- `enemy_modifiers[level]`: **each enemy has five values, one per level**; the level that
  applies is the level of the thing that hit. Of the 201 standard enemies, 161 have non-uniform
  values (Alita: 1.5 / 1.2 / 1.1 / 1 / 1; Bell Eater: 1.75 / 1.35 / 1.2 / 1 / 1; Lace in the
  Cradle: 1.75 / 1.2 / 1 / 0.85 / 0.85). This is how the game keeps early enemies from being
  trivial with an upgraded needle, and it's what makes "hits to kill" a per-enemy question.
- `player_modifiers`: **additive**, `1 + 0.3 (Hunter Crest focus) + 0.2 (full focus) + 0.25
  (Barbed Bracelet) + 0.5 (Flintslate) + 0.5 (Challenge, first hit)`; the Wanderer Crest's
  critical hit is ×3 applied after the rest. For Silk Skills: Shaman Crest +40%, Volt Filament
  +25%, and they add (+65%).
- **Rounding**: half to the even integer, as in Hollow Knight, with exceptions the wiki names
  (Threefold Pin's and Silkshot's follow-up hits round down). The wiki's own worked example:
  29 × 1 × 2.75 = 79.75 → 80; 29 × 2.25 = 65.25 → 65.
- **Bonus damage** (Pollip Pouch's venom, Flintslate's burn, Volt Filament's flat 5s, Snitch
  Pick's third hit) doesn't scale and ignores modifiers.

This is a different engine from `js/engine.js`, not a re-skin: Hollow Knight's chain is
multiplicative with a rounding at each step (×1.5, round, ×1.75, round); Silksong's is one
product with one rounding, but with the enemy inside the formula.

### 2.2 The Needle

| Level | Needle | Damage | Cost |
|---|---|---|---|
| – | No Needle (Cloakless Crest) | 3, flat | |
| 0 | Needle · «Aguja» | 5 | |
| 1 | Sharpened Needle · «Aguja afilada» | 9 | free, once Bellhart is saved |
| 2 | Shining Needle · «Aguja resplandeciente» | 13 | 1 Pale Oil |
| 3 | Hivesteel Needle · «Aguja de acerocolmena» | 17 | 450 rosaries + 1 Pale Oil |
| 4 | Pale Steel Needle · «Aguja de acero pálido» | 21 | 680 rosaries + 1 Pale Oil |

The Spanish names are the game's (`INV_NAME_NAIL1..5`). Needle upgrades are 4% of completion.

### 2.3 The Crests

Each Crest is a moveset (its own slashes, down-slash, run-slash and Needle Strike) plus a slot
layout. The wiki's `Crests` page draws the layouts with a `{{CrestSlot|Red}}` /
`{{CrestSlot|RedLocked}}` template per slot, and each Crest's infobox carries the same counts
(`skill`, `red`, `redlock`, `blue`, `bluelock`, `yellow`, `yellowlock`), so a fetcher gets them
without parsing prose. The Spanish names are the game's, `CREST_<X>_NAME`.

| Crest | Skill | Red | Blue | Yellow | Speed vs Hunter | Needle Strike (× Needle; level 0 → 4) | Its mechanic |
|---|---|---|---|---|---|---|---|
| Hunter · «Cazadora» | 1 | 1 + 1 locked | 1 + 1 | 1 + 1 | – | 1.4 × 2 hits: 7 → 29 (14 → 58) | Evolved by Eva: ×1.3 after 6 hits; fully evolved (27 slots unlocked elsewhere): ×1.5 after 12; lost on taking damage or at a bench. Both Strike hits give silk |
| Reaper · «Parca» | 1 | 1 + 1 | 1 + 1 | 1 + 1 | −23% | 2.5: 12 → 52 | After a Bind, hits drop silk fragments for 10 s (3 make a strand) |
| Wanderer · «Errante» | 1 | 1 | 2 locked | 2 + 1 | +34% | 0.6 × 5: 3 → 12 (15 → 60) | 2% critical hits ×3 while Bind is ready (2.2% with Magnetite Dice; about +4% on average) |
| Beast · «Bestia» | 1 | 2 | – | 2 locked | | 2.5, 3 in fury: 12 → 52 | Bind in about 1 s gives fury for 4.7 s: +25% damage, +20% range and speed, hits heal up to 3 masks (4 with Multibinder) |
| Witch · «Bruja» | 1 | 1 + 1 | 1 + 2 locked | – | −10% | about 0.8 per hit, up to 4 or 6 hits (the wiki disagrees with itself): 4 → 17 | Bind is a third faster and thrashes roots that damage and heal per hit; down-slash hits twice (0.55× + 0.5×) |
| Architect · «Arquitecta» | – | 3 | 2 locked | 2 locked | | 0.6 × 5: 3 → 13 (15 → 65) | Slashes are drills (0.9× + 0.1× + 0.1×; down and run 0.55× + 0.5×); "craft Bind" refills red Tools anywhere for 9 silk instead of healing. No Silk Skills |
| Shaman · «Chamana» | 3 | – | 2 locked | – | −22% | 2.3, a wave: 12 → 48 | Silk Skills +40%; no red Tools; a Bind slams to the ground first |

Plus the **Cloakless Crest** (the start: no Needle, 3 flat damage, no Strike), the **Cursed
Crest** (the story's Witch: silk capped at 3, Bind fails, no Tools or Skills) and the
**Vesticrest** from Eva: a yellow slot once 12 slots are unlocked on Crests other than the
Hunter's, a blue one at 20, the Hunter's second evolution at 27 and Sylphsong at 32; its Tools
stay equipped whatever Crest is worn. There are exactly 20 Memory Lockets, enough for every slot.

**The gap**, closed on 28 September: the wiki gives attack speed only relative to the Hunter
Crest (and Flea Brew's +50%, and Beast fury's +20%), and a DPS figure needs seconds. The game's
code says how it works (HeroController, read with ILSpy): a slash sets a cooldown of its Crest's
`attackCooldownTime`, never below its `attackDuration`, and the next waits for it; Flea Brew's
"quickening" swaps in `quickAttackCooldownTime` for 10 s, but the floor stays, so it speeds the
Hunter up by 17%, not the 50% the wiki reads off `quickAttackSpeedMult` (the animation's). Each
Crest's values are in its `HeroControllerConfig` (`tools/extract-hero.py` → `js/hero.js`):

| Crest | A slash every | Under Flea Brew | vs the Hunter (the wiki's) |
|---|---|---|---|
| Hunter (all three stages) | 0.41 s | 0.35 s | – |
| Wanderer | 0.30 s | 0.25 s | +37% (+34%) |
| Beast | 0.39 s, **0.32 s in fury** | 0.30 s | +5%, +28% in fury (fury +20%) |
| Witch | 0.45 s | 0.40 s | −9% (−10%) |
| Architect | 0.45 s | 0.35 s | −9% |
| Reaper | 0.50 s | 0.35 s | −18% (−23%) |
| Shaman | 0.50 s | 0.35 s | −18% (−22%) |

At 60 fps a slash starts the frame the cooldown runs out, up to one frame (0.017 s) later; the
wiki's percentages, measured by eye, sit within that and a bit. The Hunter's 0.41 s is Hollow
Knight's too.

### 2.4 The Tools

54 pages with `SS Infobox Tool` (`type`, `damage`, `max`, `refill_type`, `refill`, `effect`,
`location`), all with an `ESname`; the wiki counts 53 Tools, completion counts 51 (a replaced
Tool and its twin count once: Curveclaw → Curvesickle, Druid's Eye → Eyes, Claw Mirror →
Mirrors, Dead Bug's Purse → Shell Satchel in Steel Soul). Three colours:

- **Red (20)**: active, thrown or placed, with **ammo** (`max`, five values, one per Tool Pouch
  level: Straight Pin 12/15/18/21/24) and a **refill cost in Shell Shards** at a bench, 40 ÷ base
  capacity per unit, so any red Tool costs 40 shards from empty at the base capacity and about 80
  with the Pouch at its top, as the capacity doubles (the shard cap is 400, +100 per Pouch
  level). An earlier version of this study said 80 for both: `js/engine.js` and its test settle it. Damage per Crafting Kit level: Straight Pin and Longpin 5/8/11/14/17, Pimpillo
  15/24/33/42/51, Silkshot 10/16/22/28/34 (three mutually exclusive variants), Cogwork Wheel
  2 → 7 × 7 hits, Delver's Drill 4 → 14 × 6, Snare Setter 25/40/55/70/85, Voltvessels' spear
  17 + 10 × 6 at the top, Rosary Cannon spends rosaries, Flintslate ×1.5 Needle damage for 8 s
  and a burn. Two (Snare Setter, Needle Phial) are taken away by Wishes, so 18 in a completed
  game. Quick Sling throws two at once.
- **Blue (21)**: combat passives. With a number: Longclaw +20% range; Injector Band −40% Bind time; Multibinder two Binds of 2
  masks (1.94 s in all); Volt Filament +25% Silk Skill damage plus flat 5s; Egg of Flealia:
  Skills cost 3 at full health; Druid's Eye 1 silk per 2 hits taken; Weavelight +35%
  regeneration and a fourth Silk Heart; Warding Bell no damage while binding and a 9 → 31
  burst; Claw Mirror 11 + 5 × 2 → 37 + 5 × 2 after a Bind (Mirrors up to 51); Wispfire
  Lantern a wisp of 5 → 17 for 1 silk per 4 s; Memory Crystal 10 → 34; Sawtooth Circlet
  8 + 1 → 27 + 1; Pollip Pouch venom 1 → 3 per tick; Pin Badge: Needle Strike charge 1.35 →
  0.8 s; Fractured Mask one lethal hit; Reserve Bind one free Bind per bench; Spool Extender
  +3 silk; Wreath of Purity, Magma Bell (fire 2 → 1), Snitch Pick.
- **Yellow (12)**: exploration and economy, and one combat Tool with a drawback: **Barbed
  Bracelet** +25% Needle damage and double damage taken (yellow on the Tools page and in its
  infobox; this study had it blue until phase 1's data said otherwise). Weighted Belt (knockback halved, i-frames +30%),
  Shard Pendant +25% shards, Silkspeed Anklets (+34% sprint for 1 silk per 6 s), Spider
  Strings (Needolin +25%), Magnetite Dice (block chance +2.02% per hit taken, up to 10.1%),
  Thief's Mark (rosaries ×1.4, 30% chance to lose some on a hit), Dead Bug's Purse (half the
  rosaries kept), Magnetite Brooch, Compass, Scuttlebrace, Ascendant's Grip; plus the Steel
  Soul Shell Satchel, which replaces the Dead Bug's Purse there.

The Tools that change a figure on the sheet are about twenty. The rest are **Effects** in the
sense of the Hollow Knight site's plates (what a charm does that the numbers don't show), and
the plates carry over as a pattern.

### 2.5 Silk Skills, Ancestral Arts, other abilities

Six Silk Skills, one equipped per Skill slot, **4 silk each** (3 with Egg of Flealia at full
health); damage per Needle level from the wiki, names from the dump (`INV_NAME_SKILL_*`):

| Skill | × Needle | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| Silkspear · «Lanza sedeña» | 3 | 15 | 27 | 39 | 51 | 63 |
| Thread Storm · «Tormenta de hilos» (4 hits + 1, total; up to 93 extended) | 0.75 × 4 + 0.25 | 17 | 30 | 43 | 56 | 69 |
| Cross Stitch · «Punto de cruz» (4 hits, total; parries anything) | 0.75 × 4 | 16 | 28 | 40 | 52 | 64 |
| Sharpdart · «Dardo veloz» (main + 3, total) | 2.75 + 0.25 × 3 | 17 | 31 | 45 | 59 | 73 |
| Rune Rage · «Furia rúnica» (first rune of 9; the nth deals 1/n) | 2.1 | 10 | 19 | 27 | 36 | 44 |
| Pale Nails · «Uñas pálidas» (3 hits, total; Act 3) | 1 × 3 | 15 | 27 | 39 | 51 | 63 |

Ancestral Arts and the rest, all `INV_NAME_SKILL_*` in the dump: Swift Step «Paso ágil»,
Cling Grip, Needolin «Agujolín», Clawline «Garra elongada» (1 silk, refunded on a hit,
0.5× + 0.5×), Silk Soar «Vuelo sedeño», Sylphsong «Silfonía», plus Needle Strike «Golpe
concentrado» (a 1.35 s charge), Faydown and Drifter's Cloaks, the Needolin melodies (Beastling
Call «Reclamo de bestezuelas», Elegy of the Deep «Elegía de las profundidades»), the three Silk
Hearts, the Farsight «Vistalejana» and the Everbloom. Seven of them are the 7% "Abilities" of
completion; they go on the Inventory screen as the abilities do today.

### 2.6 What the engine computes, first version

What the charm engine's 81 stats become. The ones with a number today:

- **Needle**: damage per level; per Crest attack (Witch and Architect split hits); Needle Strike
  per Crest; range (+20% Longclaw, +20% Beast fury); modifiers stacked additively (Hunter
  focus, Beast fury, Barbed Bracelet, Flintslate, Challenge: 1 silk for +50% on the next hit);
  Wanderer's crit as expected value (×3 at 2%).
- **Silk**: spool size (9 + fragments ÷ 2 + Spool Extender's 3, up to 21), silk per hit (1;
  Reaper's fragments after a Bind; Clawline's refund), regeneration (Silk Hearts 0 to 3, one
  strand each; Weavelight), hits to a Bind (9, or 3 with the Cursed Crest), Silk Skill casts per
  spool (4 or 3 each), drains (Silkspeed Anklets, Wispfire Lantern, void).
- **Health**: masks (5 to 10); **hits to die** by attack damage 1 or 2 (the wiki marks it per
  attack: `{{Damage|1+1|type=Void}}`), doubled with Barbed Bracelet, halved for fire with the
  Magma Bell; Fractured Mask's extra life; Magnetite Dice's block chance; **Bind**: masks healed
  (3; 2 + 2 with Multibinder; Beast's fury heals per hit) and time (1.37 s; −40% Injector Band;
  a per-Crest table on the wiki); getting hit before the flash loses the whole spool.
- **Skills**: each of the six at the Needle's level, with Shaman +40% and Volt Filament +25%.
- **Red Tools**: damage per throw at the Kit's level; ammo at the Pouch's level; damage per
  full load; shards to refill; Quick Sling doubling.
- **Versus one enemy** (this is new): with an enemy chosen, every figure above becomes hits to
  kill through that enemy's modifier at your level, including the black-threaded variant, and
  the boss's stagger (hit-count based in Silksong: `{{Stagger|…|14|game=SS}}` on the Last Judge,
  11 on Lace; a stagger ends after 75 damage).

What can't be computed yet: DPS per Crest (§2.3's gap). What's deliberately left out at first:
knockback, i-frames beyond the Weighted Belt's +30%, and the wiki's environment damages.

## 3. The other side: enemies, bosses, the Journal, the 100%

### 3.1 Bosses

`Category:Bosses (Silksong)` has **43 boss pages** (47 fights counting the repeats: Lace twice,
Moss Mother twice, Savage Beastfly twice, Trobbio and his tormented self); the list page groups
them by Act, 13 / 18 / 15. From the wikitext: 39 carry `health` in the infobox
(`SS Infobox Boss`, which also has `damage_modifiers`, `numbers_required` for the Journal,
`drops` and `location`); the other four (Garmond and Zaza, Pinstress, Second Sentinel, Shakra)
have it in prose. **All 43 carry an `ESname`**, and 42 have a *Behaviour and Tactics* section
with the attacks in bold and `{{Damage|…}}` per attack (Lace 12 attacks, Lost Lace 34, Grand
Mother Silk 10), under an `{{AttackDisclaimer}}`: the names are the wiki's, as Hollow Knight's
were. The health is richer than Hollow Knight's: black-threaded variants in Act 3 (`600/{{BT|1200}}`:
Moorwing, Disgraced Chef Lugoli, Savage Beastfly, Skull Tyrant), phases with their own bars
(Cogwork Dancers 190 + 190, then 220 + 220 twice; Grand Mother Silk six phases summing 1224;
Father of the Flame four lanterns of 100 and a core of 250), two fights of the same boss (Lace
250 in Deep Docks and 800 in the Cradle, with different modifiers; Moss Mother 120 and 350/700).
Damage per attack is typed (`Void`, `Fire`), which matters for the Magma Bell. The wiki doesn't
tag bosses as required or optional; the Acts page and each boss's `drops` say what it gates.

The Spanish names are the game's, through the wiki's `ESname`: Bell Beast «Bestia Campana»,
Last Judge «Última Jueza», Widow «Viuda», Grand Mother Silk «Gran Madre Seda», Skarrsinger
Karmelita «Karmelita la Cantante»… The **attacks' Spanish names** aren't on the English wiki,
and the Spanish Fandom wiki has 39 Silksong pages, almost all pre-release stubs (four bosses,
five enemies, no Tools, no Crests, and a Hornet page with the wrong silk numbers): translation
rule number 4 applies, the attacks stay in English and it's noted.

### 3.2 Enemies

`Category:Enemies (Silksong)` has 238 pages, each with `SS Infobox Enemy` (`health` with
`{{BT|}}`, `damage_modifiers`, `numbers_required`, rosary and shard drops). The damage page's
master table has **201 rows of standard enemies (178 Journal ids, the rest variants such as
"Covetous Pilgrim (Bilewater)") and 61 rows of bosses and minibosses (54 ids)**, each with
`HP / BT` (115 standard rows have a black-threaded value: ×2 to ×4) and the five modifiers,
keyed by **the Journal's number**. The wiki's own disclaimer: enemies with several health
values (a summoned one inside a boss fight) aren't fully explored yet. This table is
`js/enemies.js`'s source, in one fetch; the `Enemies (Silksong)` page is only the icon compendium.

### 3.3 The Hunter's Journal

Given by **Nuu in Halfway Home, Greymoor**; the game calls it «Diario de caza»
(`INV_NAME_JOURNAL`) and the pane «Diario». 236 entries in Classic mode, 237 in Steel Soul
(the Summoned Saviour); each needs a number of kills for the full entry (1 to 80: 40 entries
need one kill, 40 need ten, Muckmaggot needs 80); Mossgrub's incomplete entry is there from the
start; Void Tendrils is completed by reading a tablet; the memory bosses complete their
minions' entries. **Six entries are optional** (Flintbeetle, Palestag, Shakra, Garmond & Zaza,
Lost Garmond, Lost Lace): Nuu's reward, the Hunter's Memento, comes at **230 required entries
(231 in Steel Soul)**, which is the site's "total", as 146 was. The Farsight shows the
encountered and required counts and grey slots for what's missing. The wiki page tabulates it
(`HJ <Name>.png`, kills, notes), and the dump has each entry's **name, description and the
Hunter's note** as `NAME_X`, `DESC_X`, `NOTE_X` (238 triplets, grouped by area: `NAME_BONE_*`,
`NAME_CORAL_*`, `NAME_SONG_*`…). Hollow Knight's `fetch-journal.js` had to take the notes from
two wikis; here they come from the game. The Journal doesn't count towards completion.

### 3.4 Completion: 100%

From the wiki's `Completion (Silksong)`, viewable in the menu once the Farsight is built:

| Category | Points |
|---|---|
| Tools | 51 (1 each; replaced pairs count once) |
| Silk Spools | 9 (18 Spool Fragments, 2 each) |
| Upgrades | 8 (Crafting Kit ×4, Tool Pouch ×4) |
| Abilities | 7 (Needolin, Swift Step, Cling Grip, Clawline, Silk Soar, Sylphsong, Needle Strike) |
| Silk Skills | 6 |
| Crests | 6 (the Hunter Crest doesn't count) |
| Mask upgrades | 5 (20 Mask Shards, 4 each) |
| Needle upgrades | 4 |
| Silk Hearts | 3 |
| Items | 1 (the Everbloom, from the Red Memory) |
| **Total** | **100** |

Simpler than Hollow Knight's 112 (no bosses, no dreamers, no Journal) and heavier on one
category: **half the game's completion is Tools**. Act 3 holds 7 of the points (the fifth mask,
the Pale Steel Needle, the Pin Badge, Pale Nails, the Shaman Crest, Silk Soar, the Everbloom),
so 93% is the most a game can show before it. `js/completion.js`'s shape (categories of
`[id, source, points]`) carries over unchanged. The achievements for it are in the save's
shared keys (`COMPLETION`, `SPEED_COMPLETION` under 30 hours, `STEEL_SOUL_FULL`), documented on
the wiki's Save Data page; they're awarded only after an ending.

### 3.5 Acts, Steel Soul, and what stands in for Godhome

**Three Acts** (`ACT_1_SUPER`… in the dump) and five endings: Act 1 to the Citadel's gate (five
Bellshrines and the Last Judge, or the Phantom), Act 2 to Grand Mother Silk, and Act 3 only
through the Silk and Soul wish, reopening the save black-threaded: void, Bone Bottom destroyed,
some bosses gone (Shakra, Garmond & Zaza) and others doubled in health, up to Lost Lace. The
Completionist tracker tags every item with its Act; the site's "what's missing near the bench"
has to too. **Steel Soul** is permadeath with a few pardons (deaths to the duels and inside the
memories), its own boss, its own Tool and its own Journal entry; no other difficulty exists.

**No Godhome.** Nothing in Silksong replays a boss: the four **Elegy memories** of Act 3 (Clover
Dancers, Crust King Khann, Karmelita, Nyleth through Seth) are safe to die in but close once
won; the First Sinner's is the same kind. So the Hall of Gods and the Pantheons have no
counterpart, and the site's Godhome group becomes two smaller things:

- **The Enemy Gauntlets**: 49 wiki subpages (`Enemy Gauntlets (Silksong)/<Area n>`), each an
  arena with its waves (enemy and spawn position), its reward and its map location, including
  the waves of the memory bosses. That's the Colosseum's shape (`kb/06-colosseum.md`,
  `trials.json`), and the arena can run a gauntlet as it runs a pantheon.
- **Wishes and Fleas**: 54 Wishes (16 Wayfarer, 6 Gather, 10 Hunt, 4 Grand Hunt, 7 Donate, 7
  Delivery, 4 Unique; `{{TaskEntry}}` blocks on the wiki, `QuestCompletionData` in the save)
  and 30 Fleas (caravan milestones at 5, 12, 22 and 30; Egg of Flealia at 30). Neither counts
  for the 100%, both are what people track, and the Festival of the Flea (three minigames with
  high scores) is what the Fleas unlock.

The other counts the Progress screen needs, all from the wiki: 20 Mask Shards (6 / 10 / 4 by
Act), 18 Spool Fragments (6 / 12), 20 Memory Lockets, 8 Craftmetal, 3 Pale Oil, 6 Psalm
Cylinders, 4 Simple Keys, 84 benches, 12 Bellway and 7 Ventrica stations (10 and 6 toll ones),
28 maps to buy, 4 Old Hearts (3 needed), the Materium's 41 materials, 5 relics, 2 cylinders and
11 mementos. The `Achievements (Silksong)` page is already laid out as a checklist.

## 4. Data sources and the toolchain, one by one

Every tool in `tools/` has a Silksong counterpart. What changes is the URL, the key patterns and
the wiki templates; the approach doesn't.

### 4.1 The game's texts: `tools/game-text.js`

**[stradivari96/silksong-translator](https://github.com/stradivari96/silksong-translator)**,
`src/all_text.json` (9.2 MB): the same author, the same shape as the Hollow Knight dump
(`{ EN: { key: text }, ES: … }`), **11 languages** (DE, EN, ES, FR, IT, JA, KO, PT, RU, ZH, ZH_TW),
**5,597 English keys**, Spanish complete but for 50 keys. The TextAssets are decrypted with **the
same AES key as the saves** (`decrypt_textassets.py` in that repo), so a dump can be made from
the game's files if the repo ever stops. It's pinned by commit as today (`Patch 1.0.30000`, 7
April 2026), and the repo keeps a `changelog.json` **per patch, key by key**, which is exactly
what's needed to know when a name moved.

In the game the texts are XML "sheets" stored as TextAssets in `Hollow Knight Silksong_Data/resources.assets`
(`EN_Tools`, `EN_Journal`, `EN_Map Zones`, `EN_Titles`, `EN_Quests`, `EN_UI`, `EN_Achievements`, and
one per area's dialogue), each `<entry name="KEY">` encrypted as the saves are; another repo
publishes the 37 English sheets decrypted, and the `silksong-patchwork` mod dumps every language
to YAML, so there are three ways to a dump. The game is **Unity 6000.0.50f1** (Unity 6), which
matters for the map (§4.7). Its Spanish is **Spain's only**, no Latin American variant.

The keys follow different patterns from Hollow Knight's, so `--key` and `--audit` need new lists:

| What | Key | Example (EN → ES) |
|---|---|---|
| Tools | `<TOOL>_NAME`, `<TOOL>_DESC` | `STRAIGHT_PIN_NAME`: Straight Pin → «Alfiler recto»; `BARBED_WIRE_NAME`: Barbed Bracelet → «Cilicio» |
| Crests | `CREST_<X>_NAME` | `CREST_HUNTER_NAME`: Hunter → «Cazadora»; `CREST_PILGRIM` Wanderer → «Errante»; `CREST_REAPER` → «Parca»; `CREST_WARRIOR` Beast → «Bestia»; `CREST_WITCH` → «Bruja»; `CREST_SPELL` Shaman → «Chamana»; `CREST_TOOLMASTER` Architect → «Arquitecta» |
| Needle | `INV_NAME_NAIL1..5` | Needle → «Aguja» … Pale Steel Needle → «Aguja de acero pálido» |
| Skills and arts | `INV_NAME_SKILL_*` | `_THROW`: Silkspear → «Lanza sedeña»; `_PARRY`: Cross Stitch → «Punto de cruz»; `_SILKBOMB`: Rune Rage → «Furia rúnica»; `_HARPOON`: Clawline → «Garra elongada»; `_NEEDOLIN` → «Agujolín» |
| Items | `INV_NAME_*` (126) | `INV_NAME_CREST_SOCKET`: Memory Locket → «Relicario de memorias»; `INV_NAME_HEART_PIECE_1`: Mask Shard → «Fragmento de máscara»; `INV_NAME_SPOOL_PIECE_HALF`: Spool Fragment → «Fragmento de carrete»; `INV_NAME_JOURNAL` → «Diario de caza»; `INV_NAME_FARSIGHT` → «Vistalejana» |
| Journal | `NAME_X`, `DESC_X`, `NOTE_X` | `NAME_MOSSBONE_MOTHER`: Moss Mother → «Madremusgo» (the wiki's `ESname` says «Madre Musgo»: **the game wins**, as the rules say) |
| Areas | `<AREA>_MAIN` (+ `_SUPER`), `STATION_NAME_*` | `BONEBOTTOM_MAIN`: Bone Bottom → «Valle Óseo»; 103 titles with a `_SUPER`; the Acts are `ACT_1_SUPER` «ACTO 1» |
| UI | `PANE_*`, `BUTTON_*`, `PROMPT_*`, `UI_MENU_*`, `NOTIFICATION_*` | `BUTTON_CAST`: Bind → «Enlazar»; `PANE_JOURNAL` Journal → «Diario»; `COMPLETION_NAME` → «Finalización» |
| Achievements | `ALL_TOOLS` (Arsenal), `ALL_CRESTS` («Blasonada»), `ALL_SILK_SKILLS` («Tejidas»)… | |
| Vesticrest | `UI_MSG_TITLE_EXTRASLOT_NAME` | → «Vestiblasón» |

The wiki's `{{Localisation}}` block now carries a `CODEname` with the game's internal key
(`NAIL2`, `EXTRASLOT`, `BONETOWN`), so the audit can join wiki page and dump key without
guessing. It finds mismatches between the wiki and the game already (Moss Mother above), which
is the reason the rule exists. The `'` in the dump is curly (`Hunter’s Journal`), as in Hollow
Knight's: `norm()` handles it.

### 4.2 The wiki: the `fetch-*` scripts and `kb/`

The same API (`https://hollowknight.wiki/mw/api.php`, `?action=raw`), the same CDN for files.
The categories: `Bosses (Silksong)` (44), `Enemies (Silksong)` (239), `Tools` (56), `Crests`
(12), `Areas (Silksong)` (36), `Skills and Abilities (Silksong)` (22), `Items (Silksong)` (98),
`Steel Soul Mode (Silksong)`, and the hub `Hollow Knight: Silksong` (Completion, Save Data,
Acts, Tasks, Achievements, Controls, Menu Styles). No stub banners; `{{MissingInfo}}` on 17 of
some 160 pages read (the Patch 5 notes, the black-threading list), `{{Disclaimer}}` on 11; many
mechanics cite the decompiled code. The templates to parse:

- `{{SS Infobox Tool}}` with `type`, `damage`, `max`, `refill_type`, `refill`, `effect`, `location`.
- `{{SS Infobox Crest}}` with `skill`, `red`, `redlock`, `blue`, `bluelock`, `yellow`,
  `yellowlock`, `bind`, `effects`, and a second and third block for the evolved Hunter Crest.
- `{{SS Infobox Boss}}` and `{{SS Infobox Enemy}}` with `health` (`{{BT|n}}` for black-threaded),
  `damage_modifiers` (`{{SS Spaced Damage Modifiers|1.25|1|1|1|1}}`), `numbers_required`, drops.
- `{{CrestSlot|Red|1}}` inline where prose names a slot; `{{Damage|1+1|type=Void}}` per attack;
  `{{Stagger|…|hits|game=SS}}`; `{{S|3.33}}` for shards and `{{r|450}}` for rosaries.
- `{{Localisation|ESname=…|CODEname=…}}` on every page checked (54 Tools, 43 bosses, 21 of 22 skills).
- The master health table: rows of `! <HJ id>`, the `HJ <Name>.png` icon, the name, `HP / BT`
  and five modifier cells. A 30-line parser reads it (it was written for this study).
- `{{TaskEntry}}` blocks on `Wishes`; a `Waves` table on each gauntlet subpage.

`kb/` gets rebuilt for Silksong with the same `fetch-wiki.py` (`Category:Bosses (Silksong)`
instead of `(Hollow Knight)`; the script already handles both, as `kb/README.md` notes).

### 4.3 The save file: `js/savefile.js`, `js/live.js`, `js/completion.js`

**The cipher is identical**: the 22-byte .NET header, the 7-bit length prefix, base64, AES-256-ECB
with PKCS7 and the key `UKu52ePUBwetZ9wNX88o54dnfKRu0T1l`, and the trailing `0x0B`. Read in two
independent decoders (silksong-completionist's `codec.ts` and apocalyptech's
`silksong-save-decrypt`, whose README says it "is probably identical to Hollow Knight's").
`read()` works as is; what changes is **the JSON's shape**:

- `playerData` keeps its scalars (`hasDash`, `PlayTime`…) but the collections are lists of
  `{ Name, Data }` under `savedData`: `Tools`, `Crests`, `Collectables`, `Relics`,
  `MateriumCollected`, `QuestCompletionData`, `MementosDeposited`. A Tool is owned if its `Name`
  ("Tri Pin" for Threefold Pin: internal names differ from shown ones) is in `Tools.savedData`.
- The Journal is `EnemyJournalKillData.list[{ Name, … }]` (Mossgrub is "MossBone Crawler").
- `scenesVisited` is a list of scene names (`Dock_08`, `Bone_11b`, `Weave_05b`).
- `sceneData.persistentBools / persistentInts / geoRocks .serializedList[{ SceneName, ID, Value }]`
  is where the floor pickups live, as `persistentBoolItems` did.
- Scalars read by the trackers: `completionPercentage` (the game's own figure, as
  `check-pack` needs), `playTime`, `geo` (rosaries), `ShellShards`, `permadeathMode` (0 normal,
  1 Steel Soul, 2 Steel Soul dead), `version`, `nailUpgrades` 0–4, `maxHealth`, `silkMax`,
  `silkHearts`; abilities as `hasDash`, `hasWalljump`, `hasDoubleJump`, `hasHarpoonDash`,
  `hasSuperJump`, `hasBrolly`, `hasChargeSlash`, `hasNeedolin`, `hasQuill`; `ToolEquips`,
  `ToolPouchUpgrades`, `ToolKitUpgrades`; `UnlockedExtraBlueSlot` / `UnlockedExtraYellowSlot`
  for the Vesticrest; `Has<Area>Map` booleans for the 28 maps; `defeated<Boss>` flags; the
  Journal's `Record.Kills` per entry. The bench and the cocoon's scene: to confirm on a real save.

Files and places, from the wiki's `Save Data (Silksong)`: `user1..4.dat` with `user#.dat.bak1`
backups and `user#_<patch>.dat` copies from before a patch, **`restoreData#.dat` 1–99
autosaves** (and `NODELrestoreData#.dat`, protected), and `shared.dat` for the state shared by
all profiles (Steel Soul unlocked, achievements, map pin mode). Windows:
`%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong\<SteamID3 or default>\`; the
Xbox app under `Packages\TeamCherry.HollowKnightSilksong_y4jvztpgccj42\SystemAppData\wgs\`;
**macOS** `~/Library/Application Support/unity.Team-Cherry.Silksong/`; **Linux and Steam Deck**
`~/.config/unity3d/Team Cherry/Hollow Knight Silksong/` (a native build, so no Proton prefix
unless forced). Switch saves dumped with JKSV are plain JSON, which the `{`-fallback in
`read()` already handles; PlayStation and Xbox saves aren't reachable, as now.

The autosaves are new and matter for the live link: Hollow Knight only wrote the file at a
bench, so "since the last bench" was the natural unit; if Silksong writes `restoreData` at
checkpoints, the page can follow more often, or choose to keep the bench as the unit. To decide
with a real save folder in hand.

`check-pack.js` is the test that made the 112% trustworthy (51 real saves). The same is needed
here, and the only saves available are the author's own; the completionist's issue tracker and
the wiki's page are the second source for the odd cases.

On the live link, `design/08-live-sync.md`'s three options stand. Nobody has ported HKTracker;
the closest is a Python tracker with an optional BepInEx "bridge" that posts Hornet's room to a
local port. Modding is mature (BepInEx 5.4.23.4, a `silksong-modding` organisation with GameLibs
and templates, and the Hollow Knight randomizer authors already on ItemChanger.Silksong), so a
mod of our own is as feasible as it was; the file watcher stays the first way, unchanged.

### 4.4 Collectibles: `tools/fetch-collectibles.js`

**[Br3zzly/silksong-completionist](https://github.com/Br3zzly/silksong-completionist)** (MIT)
has, in `src/dictionary/categories/`, every trackable thing with its **save field**
(`parsingInfo`: `tool`, `crest`, `journal`, `collectable`, `relic`, `materium`, `quest`,
`sceneDataBool [scene, id]`, `sceneDataInt`, `sceneVisited`, `mementoDeposit`), its Act, its
completion points, a location sentence and a mapgenie link: abilities, bosses, tools, crests,
mask shards, spool fragments, fleas, memory lockets, craftmetals, pale oil, relics, silkeaters,
mossberries, mementos, tasks (Wishes), bellways, Ventrica stations, unique spawns, and 198 KB of
"caches and secrets". It's the ItemChanger of this project: **facts are taken from it** (the
field names), the prose isn't, and it's credited as ItemChanger is. Its Journal file also
carries each enemy's `hp` ("10 / 20", normal / black-threaded) and the five modifiers.

### 4.5 Rooms and doors: `tools/fetch-rooms.js`

**[Batatvideogames/silksong-archipelago-randomizer](https://github.com/Batatvideogames/silksong-archipelago-randomizer)**
(MIT, active this week): `APWorld/silksong/room_graph_data.json` (7 MB, schema 2, 514 mapper
documents, nodes like `moss-grotto/moss-grotto-center#rock-bottom`), `entrance_pool.json`
(218 KB), `room_event_names.json`, `locations.py`, `items.py`. It's the transitions graph the
Knight walks on the Hollow Knight map. The open question is the mapping between its node ids
(slugs by area and room) and the game's scene names (`Bone_11b`) that the save reports in
`scenesVisited`; the completionist's `sceneDataBool` pairs give one side, and the randomizer's
`native_regions.py` the other. Two smaller repos close the gap: **timothymarriott/Silksong-Rando**
(MIT) ships `Resources/scenes.json`, **565 scene ids with their width and height** (`Tut_01`,
`Mosstown_01`, `Crawl_03b`…), which is what `extract-map.py` read from the `level<N>` files for
Hollow Knight, and a `locations.json` with per-scene item positions; **flibber-hk/Silksong.RosaryData**
has datamined rosary, shard and spool positions per scene. The wiki has no rooms page at all
(searches for scene ids return nothing), only each area's `CODEname` (`BONETOWN`, `DOCKS`,
`GREYMOOR`, `COG_CORE`…), which is the map-zone key. A day of work, to be done after the map
spike (§4.7), since the graph is worth most with the map.

### 4.6 The Journal: `tools/fetch-journal.js`

The wiki's `Hunter's Journal (Silksong)` table (order, `HJ <Name>.png`, kills) plus the dump's
`NAME_/DESC_/NOTE_` triplets, joined by name; the Spanish wiki isn't needed. The rules in
`js/hunter.js` change: the total is 230 required of 236 (231 of 237 in Steel Soul) instead of
146 growing to 164, there's no K−1 rule to verify (the save stores kills per entry directly in
`EnemyJournalKillData`), and "encountered" is the entry's presence with kills below the requirement.

### 4.7 The map: `tools/extract-map.py`

**Verified on 27 September 2026 with the game installed: the map can be extracted, and the spike
drew it.** `maps_assets_all.bundle` (Addressables, `StreamingAssets/aa/StandaloneLinux64/`) holds
a `Game_Map_Hornet` tree as Hollow Knight's `Game_Map`: one child per area, one GameObject per
room named after its scene, its Transform and a SpriteRenderer tinted with the area's colour;
the sprites are `hornet_map.spriteatlas` (4096², BC7, 1,199 rooms by name) and a patch atlas.
UnityPy reads them with the Unity version set by hand (6000.0.50f1). `tools/extract-map.py`
places 1,110 rooms and gives the game's map line for line. What follows was written before:

Unverified, but the signs are good. `extract-map.py` reads Hollow Knight's `resources.assets`
for the `Game_Map` object tree (a `<scene>_Cornifer` sprite per room, the tint, the pins) and
the `level<N>` files for the tk2d sizes. Silksong is Unity 6 (AssetRipper and AssetStudio need
the version set by hand; **UnityPy already reads its 590 scene bundles**, a randomizer's
`extract_locations.py` scans them all), its map has its own mechanics (map pins, the Compass,
28 maps bought from Shakra, four areas that aren't on the world map at all), and the wiki
documents cut map segments taken from the files, so the map art is in there. **Nobody has
published it**: mapgenie, IGN, Game8 and the rest draw their own tiles; scripterswar renders a
"Sketch" layer from the in-game map on its own tiles (its data is 401 KB of icon coordinates,
no licence); mapsilksong stitches screenshots. Being first to draw the game's own map is the
same edge this site has. The first step of that phase is a **one-day spike with the game
installed**: open `resources.assets` with UnityPy, find the map GameObject, and see whether
the per-room sprites and tints are there as in Hollow Knight, with `scenes.json` (§4.5) for
the sizes. If they are, the rest of the script is the same shape; if they aren't, the fallback
is a schematic map from the randomizer's room graph (rooms as boxes in the area's tint, no
artwork), which is what the collectibles and the walking Hornet need, or leaving the map out
of the first release.

### 4.8 Sprites: `fetch-icons.js`, `fetch-enemies.js`, `fetch-knight.js`

The wiki's files, on the same CDN: `<Tool>.png` (and `<Tool> Pickup.png`), `Hunter Crest.png`
and `Hunter Crest Inventory.png` (HUD and inventory versions), `HJ <Name>.png` for the Journal,
`SS Mask.png`, `SS Mask Lifeblood.png`, `Silk_Spool_HUD_Broken_Filled.png`, `Icon_SS_Silkspear_Art.png`
for the skills, `Red Tools Heading.png`, and `Hornet_Idle.png` / `Hornet_No_Cloak.png` for
Hornet. The wiki's category `X SS Sprites Inventory` holds 751 of them, and `Special:FilePath/<name>.png`
resolves any by name. `fetch-knight.js` becomes `fetch-hornet.js`: the walking mark on the tab
bar and the map. The palette quantising stays. The sprite-rip sites have almost nothing for
Silksong (two sheets), so the wiki is the source, as it was.

### 4.9 Pages: `tools/pages.js`

Unchanged. New intents (§7): save analyzer, 100% checklist, tools and crests calculator, map,
Journal, boss damage; Spanish slugs with the game's names («blasones», «herramientas»).

## 5. What carries over from the code

From the inventory of this repository (27.2k lines of JS, tools, tests and CSS):

| Carries over | Lines | What changes |
|---|---|---|
| **As is**: `saves.js`, `live.js`, `app-boot.js`, `tools/pages.js`, `tools/artpack.js`, `kb/data/fetch-wiki.py`, the crypto half of `savefile.js`, the generic tests (`saves`, `codec` pattern, `pages`, `i18n` mechanism), the `debug*.html` harnesses | ≈ 4k + 2.4k of debug pages | A URL, a category name, the smoke test's assertions |
| **The pattern, new contents**: `app.js`'s core (routing, hash state, history, storage, masthead, nav, toast, colophon, `langPage`, click delegation), `app-saves.js`'s import and live UI, `i18n.js`'s 40 lines of mechanism, `codec.js`, `changes.js`, `progress.js`, `completion.js`, `app-map.js`'s renderer, `app-knight.js`, `extract-map.py`'s approach, `tokens.css`'s structure, `tools/game-text.js` | ≈ 5k | Fields, strings, categories, the palette |
| **Rebuilt**: `engine.js`, `fight.js`, `data.js`, `hunter.js`, `enemies.js`, the generated `journal.js`, `rooms.js`, `collectibles.js`, `map.js`, the screens (`app-charms`, `app-arena`, `app-journal`, `app-game`, `app-progress`, `app-home`), `kb/`, `pages-text.js`, `assets/` but the fonts | ≈ 10k | Everything, from the sources in §4 |
| **Dropped**: `hall.js`, `pantheons.js`, `app-hall.js`, `app-pantheons.js` and their tests | ≈ 1.6k | No Godhome (§3.5); the gauntlets reuse the arena and the pantheon timeline's pattern |

Three decisions follow:

1. **A copy, not a shared package.** With no build there's no package to share; a fork would
   drag the Hollow Knight content along. Start the new repository from this one's skeleton
   (`index.html`, `css/tokens.css`, `js/app.js`, `js/app-boot.js`, `js/saves.js`, `js/live.js`,
   `js/savefile.js`, `tools/pages.js`, `tools/game-text.js`, `tools/artpack.js`, the debug pages,
   the generic tests, `CLAUDE.md`, `design/01-web.md`) and accept that they diverge. What's fixed
   in one is ported by hand to the other when it matters; the two sites don't need to move together.
2. **The same rules.** `CLAUDE.md` carries over with the names changed: file://, no build, data
   in `.js`, `{ es, en }` on every string with the key in a comment, tokens only, the game's
   rounding, the repo in English, no hand translation. The translations section gets the new key
   patterns (§4.1), the wiki's `ESname` as the second source exactly as now, and drops the
   Spanish wiki as a third (it has nothing for Silksong).
3. **The name.** The kingdom is Pharloom, as Hollow Knight's is Hallownest:
   `pharloom-calculator`, at `betorzdev.github.io/pharloom-calculator/`. It says what the site
   is to someone who has played, and it sits next to the first one.

## 6. Design: what changes on the page

The design system (`00-system.md` §3–6) is about the web, not about Hollow Knight: black page,
one card, filigree only in the corners, figures in a sans with tabular figures, the accent only
on what's interactive, tints from the game's map screen. All of that stands. What has to be
**measured again**, in a `02-silksong.md` written as `02-hollow-knight.md` was (quantising the
wiki's sprites and official screenshots):

- **The HUD**: the masks (`SS Mask.png`), the silk spool and its glow when a Bind is ready,
  the Crest wheel above it, the Plasmium mask, rosaries and shell shards. Silk is the new
  "soul" and its colour has to be measured, not assumed white as Hollow Knight's was found to be.
- **The accent**: Hornet's red is the obvious candidate and it's a trap for the same reason cyan
  was (§3 of the system: the accent doesn't decorate data). Measure the game's own interactive
  marks in the inventory (the Crest screen's selection, the Tool slot glow) and take those.
- **The tints**: whether Silksong's map screen is also black with a pale tint per region. The
  `Areas (Silksong)` category has 36 pages with the map images (`<Area> Map Clean.png`, and
  the Act 3 "Ruin" variants) to measure.
- **The menu styles** (`UI_MENU_STYLE_HORNET`, `_ABYSS`, `_SURFACE`, `_CURSED`…): the game
  itself ships several skins of its menu; the site's screens can take the default one.
- **Type**: confirmed the same as Hollow Knight's: **Trajan Pro** for the interface and
  **Perpetua** for dialogue (the font-injection mods name them; a tracker ships the Trajan
  files). Cinzel and Spectral carry over, and so does the rule that numbers don't go in Cinzel.
  Only the title wordmark is custom lettering.
- **Hornet** replaces the Knight as the walking mark (`Hornet_Idle.png` and the sprint strip).
- **Two screens change shape**: the Crest screen is a wheel of coloured slots, not a row of
  notches, and the Tool band has three colours and a locked state; the Progress tablet gets
  the Act as a column, since 7 of the 100 points and every black-threaded fight are Act 3's.

Nobody has published measured HUD colours for Silksong; the `02-silksong.md` audit does it on
the wiki's HUD sprites (`SS_Mask.png`, `Silk.png`, `Silk_Spool_HUD_Complete_Filled.png`,
`Hunter_Crest_HUD_Filled.png`, `Barbed_Bracelet_HUD.png`) as `02-hollow-knight.md` did.

## 7. The competition, and what people search for

A year after release the field is fuller than Hollow Knight's was after eight, and thinner
where it counts. In one line each:

- **Calculators**: [the Hornet's Calculator](https://stevencastro31.github.io/the-hornets-calculator/)
  (a Crest board to equip Tools on, an enemy database, DPS; English, no licence, the yardstick
  as the Knight's Calculator was); [a damage calculator](https://oblivionnamesgenerator.com/silksong-damage-calculator/)
  with a fan formula and breakpoints; [a build calculator](https://hollowknightsilksong.co/tools/build-calculator)
  with presets; [silksongtools.com](https://silksongtools.com/tools/), a Tool database. **None
  answers "how many hits does this enemy take" through the enemy's own modifiers for all 236,
  with the game's rounding, and none is in Spanish.**
- **Save analyzers**, all client-side, all English: [Silksong Tracker](https://th3r3dfox.github.io/silksong-tracker/),
  [silksong-completionist.com](https://silksong-completionist.com/) (80 stars, MIT, React,
  every category with map links, spoiler and Act filters), [silksong-save-viewer](https://silksong-save-viewer.vercel.app/),
  [tureptor's](https://tureptor.github.io/silksong-save-analyzer/) and [glikoliz's](https://glikoliz.github.io/silksong-save-analyzer/)
  analyzers, [silksong-completion.info](https://silksong-completion.info/) (what's missing, on a
  map), [silksongwiki.com's progression tracker](https://silksongwiki.com/progression-tracker/)
  (marks its map from the save). **None watches the file live, none is in Spanish.**
- **Hand-marked checklists**: [silksongchecklist.org](https://www.silksongchecklist.org/),
  [game-checklists.com](https://game-checklists.com/trackers/silksong/), silksongchecklists.com,
  checklistsilksong.com, two on GitHub. **In Spanish**: [hollowknightsilksongchecklist.com/es](https://hollowknightsilksongchecklist.com/)
  (ten languages, no save upload) and [silksong.codes/es](https://www.silksong.codes/es/)
  (guides, checklist and map in eight languages).
- **Maps**: [scripterswar](https://scripterswar.com/silksong/map) (a "Sketch" layer from the
  in-game map plus screenshots; open data), [mapsilksong.com](https://mapsilksong.com/)
  (stitched screenshots), and own-drawn commercial ones at MapGenie, IGN, Game8, Gamer Guides,
  Fextralife, wikimaps.gg; **in Spanish**, [lootmap.gg/es](https://lootmap.gg/es/silksong/guides/pharloom-interactive-map/)
  (5,019 markers, names from the game's Spanish text, eight languages) and silksongmaps.net/es.
  None draws the game's own map.
- **Data**: [HallownestAPI](https://github.com/yassenshopov/HallownestAPI) (an open data API
  for both games), and the trackers' JSON (§4.4).
- **Spanish guide sites**: 3DJuegos's complete guide, Vandal's completion page,
  hollowknight-silksong.com's Crest guide; the Fandom wiki's Silksong pages are stubs.

What people search for in Spanish, from the titles and queries seen: «guía silksong 100%»,
«completar al 100 %», «porcentaje de finalización silksong», «todas las herramientas
silksong», «cómo mejorar las herramientas», «todos los blasones», «mapa interactivo silksong»,
«fragmentos de máscara», «checklist silksong». The game's Spanish terms to lead the pages with:
**«Telalejana»** (Pharloom), «blasones», «herramientas», «seda», «rosarios», «fragmentos de
carrete», «Diario de caza», «Finalización». There is no Spanish save analyzer and no Spanish
damage calculator: the two pages to have indexed first are `es/analizador-partida/` and
`es/calculadora-de-danio/`, as `12-seo.md` chose for Hollow Knight.

## 8. Risks and open questions

- **Patches move the numbers, and an expansion is coming.** Release 1.0.28324 (4 September
  2025); Patch 1 cut the Crafting Kit's boost from 70% to 60% and softened several 2-mask
  enemies; Patch 2 gave silk to Needle Strikes and rebalanced Flintslate, Volt Filament, Cogfly
  and the Cogwork Wheel; Patch 3 raised the Hunter Crest's focus to 30/50% and reworked every
  Silk Skill and several blue Tools; Patch 4 fixed scalings; **Patch 5, 1.0.30000, 24 March
  2026**, is the current one and "the last significant update before the DLC". **Sea of
  Sorrow**, a free expansion with new areas, bosses and Tools, is announced for 2026; three
  backer bosses are still owed. Pin the dump by commit, keep the patch in `CLAUDE.md`, and keep
  `kb/` and every generated file regenerable in one command each: the expansion will be a
  re-fetch, not a rewrite, if the tooling is right.
- **Attack speed** per Crest isn't tabulated anywhere found. Without it there's no DPS. *(Closed
  on 28 September from the game's own files: §2.3.)*
- **The wiki disagrees with itself in places** (Silk Heart regeneration 1.45 or 1.5 s; Longclaw
  +20% or +27%; the Witch's Needle Strike 4 or 6 hits). Take the damage page's number, note the
  other, as the guide does for Hollow Knight's `~` values.
- **The map** may not be extractable, or not without the game (§4.7). It's the most visible
  feature and the least certain.
- **The Spanish wiki** has nothing usable; the bosses' attack names stay in English.
- **Seven save trackers already rank** for "silksong save" and a calculator for "silksong
  damage"; the intents to own are the ones they don't serve (§7): Spanish, live, per-enemy.
- **Console and Switch 2 saves** can't be read, as now; the hand-marked checklist covers them.
- **Licences**: the completionist's and the randomizer's data are MIT, the wiki's CC BY-SA, the
  game's texts and art © Team Cherry. The credits block carries over with the new names.

## 9. The plan, by value and cost

**Status (27 September 2026)**: the repository is `betorzdev/pharloom-calculator` (decided the
same day as the study). Phase 0 is done: the skeleton from hallownest-calculator's (the page
shell, the tokens with the placeholder palette, the four kinds of button, the language and the
URL, the save slots, the file watcher, the save decrypt, `game-text.js` on the Silksong dump,
the tests). The two other decisions (§5.1's copy rather than a shared package, and the first
release's scope) were left to the plan: a copy, and Your game first.

**Phase 1 is done** (the same day). `kb/data/raw/` holds the
wiki's wikitext for 522 pages (`npm run kb`, the list in `kb/data/pages.txt`), and three
generators read it with the game's text, offline (`npm run data`): `js/data.js` (the Needle,
7 Crests and the Vesticrest, 57 Tool entries with ammo, refill and damage as hits per level,
6 Silk Skills, 11 abilities, the modifiers, the items), `js/enemies.js` (the 262 rows of the
master tables, joined to the Journal by the game's own key, and 291 attacks and 31 staggers
from 51 boss pages) and `js/journal.js` (237 entries with the game's name, description and
Hunter's note). `npm run text -- --audit` checks 1,154 keyed texts against the dump, all
green. `design/02-silksong.md` measures the HUD, the slots and the 32 areas' tints
(`npm run palette`); the HUD and the slots are in `tokens.css`, and **the surfaces, the accent
and the frames were decided the same day (§5): the page is the main menu (its red-cast black, the red light from below, the embers), the screens the pause menu, framed and titled in its white filigree, a bone accent**. Found on the way:
the Barbed Bracelet is yellow, not blue (§2.4); the map's tints are darker and warmer than
Hallownest's; the game selects with white on grey, not with a hue. Left out on purpose: the
common enemies' contact damage (the wiki has it in prose only), and the Journal's seven
entries with no health row (Wisp, Muckmaggot, Sandcarver, Winged Lifeseed, Shadow Creeper,
Void Tendrils, Wingmould).

**Phase 2 has started** (the same day), with the author's saves (Steam Cloud brought them
to `~/.config/unity3d/Team Cherry/Hollow Knight Silksong/`): 92 of them, `user#.dat`, the
per-patch copies and every restore point (a `restoreData#.dat` wraps a whole `user#.dat` in
base64, one level down as `saveGameData`, labelled with the event that wrote it), from 0% to
100%, patches 1.0.28891 to 1.0.30000, one Steel Soul game among them. The 100% is solved:
`js/completion.js` matches the game's own figure in **all 92** (`npm run check-pack`). The
game counts whole masks and spools (`maxHealthBase − 5`, `silkMax − 9`), not loose pieces as the
trackers do, and the Silk Skills by their `has*` flags. `js/collectibles.js` is generated from
the completionist's dictionary (`npm run collectibles`, pinned) and joins the save's names to the
site's ids; its Mask Shards and Spool Fragments, found one by one, match the game's counters in
all 92 too. `savefile.game()` gives the Act (`act2Started`, `blackThreadWorld`) and the bench.
The same day, the **Saves screen** (ported from the Hollow Knight site: the import view by
system, the preview, following the file, Clear with the game's own question; restore points
import too) and **Your game** (the 100% by category against the game's figure, the Act, the
Journal), with the game's sprites from the wiki (`npm run art`). Driven end to end in headless
Chrome with a real restore point. Then **Progress**: every thing of the 100% by name or one by
one, and the collectibles beyond it, each with its Act and its area. The areas are the game's
own ids (`currentArea`: `CRADLE`, `HUNTERS_MARCH`…) with the game's names (the id's text, or the
whole title under another key where the map card splits it: «Escalones Ajados», not «Blasted
Escalones»), and a slot keeps its pieces by what they are, not by their place in the list, so a
regenerated list still reads an old slot. The upgrades and Silk Hearts one by one match the
game's counters on the 92 saves too. And **"Since the previous save"** (`js/changes.js`, on Your
game and in the live notice), checked on the restore points: between two of the same game, the
event that wrote the second (`GAINED_BEAST`, `GAINED_DOUBLE_JUMP`, `ACT_3`…) is always among
what's new. Three kinds weren't tracked at first and now are: the four Old Hearts
(`CollectedHeart*`), the three melodies (`HasMelody*`) and the two abilities outside the 100%
(Beastling Call is `UnlockedFastTravelTeleport`, Elegy of the Deep `hasNeedolinMemoryPowerup`),
all found as the flag that turned true between two restore points. The Cursed Crest
(`gainedCurse`) isn't shown: the game has no name for it, nor for the Cloakless one.
Last, the **Inventory**, as the game's pane, with the wiki's inventory icons (`npm run icons`:
100, each thing's infobox image, the "Icon SS <Name> Art" family for the Skills, abilities,
hearts and melodies; fitted into 256 px and saved as WebP, 0.9 MB instead of 3.4) and the game's
own descriptions (the Needles' and items' added to `js/data.js`). That closes phase 2's screens;
what's left of it is trying the live link by hand. The live link follows `user#.dat`
alone (the restore points go to `Restore_Points#/` and aren't followed), which should make the
bench its unit, as in Hollow Knight: whether Silksong writes `user#.dat` only on resting and
quitting (§4.3's open question) is still to see by hand. **Phase 2 is done** but for that: trying
the live link in Chrome with the game running, which a headless browser can't.

**Phase 3 has started** (the same day). `js/engine.js` computes a build's figures on the model of
§2.1 (the Needle, the Needle Strike, the six Silk Skills, the Tools with ammo, load and refill,
silk, masks, the Bind, the slots with the Vesticrest's), tested against the wiki's own examples
and the study's §2.5 table, which it matches level by level. The save gives the build worn
(`CurrentCrestID`, each Crest's slots in `ToolEquips`, `ExtraToolEquips`), and on the 89 real
saves that have one it always fits its Crest (`check-pack` checks it). The Crest screen shows it:
in a save, read-only as on the Hollow Knight site (decided with the author), the moment
switchable; in Free mode, every choice at hand, kept in `pharloom.build`. Found on the way: §2.4
said a red Tool costs 80 shards from empty at any Pouch level; it's 40 at the base capacity and
80 at the top. Then the Crests' own attacks (the Architect's drills and down- and run-slashes, the
Witch's down- and run-slashes: in prose on their pages, so `tools/gen-data.js` carries the
multipliers and checks each one against its sentence, failing if the wiki changes), the effects
of the passive Tools in the game's words, and the build in the URL (`js/codec.js`, readable, only
what differs from the base, the Tools by id so a patch that reorders the lists doesn't break a
link) with Share. **Phase 3 is done**; the DPS figure came last (28 September), once the game's
own files gave each Crest's pace (§2.3): damage per second on the Crest screen, with Flea Brew's,
the seconds to kill in Combat and on the boss pages. The figures summary on a phone came on 28 September: a strip on
the window's bottom edge (the Inventory's detail bar, the same frame), below 1,100 px.

**Phase 4 is done** (the same day): the Journal screen, with the wiki's 237 portraits paired to the
entries by the page each links to (pairing by the table's order shifted every row after the
Steel Soul one, which carries an icon in between). How the game completes an entry was read on
the author's full Journal: it writes the kills even for the entries it completes another way (a
boss's minions, the Void Tendrils' tablet), so "listed with its kills done" is the rule, one
function (`completion.journalDone`) for every screen, and `check-pack` checks it against Nuu's
Memento (`nuuMementoAwarded`: 230 of 230). Found on the way: the Void Tendrils, with no kill
count, were counted complete before being seen (`0 >= null`), on Your game and in `check-pack`.
Then (28 September) **where to find each entry**: an enemy placed in a scene carries an
EnemyDeathEffects that points at its EnemyJournalRecord (237 in `journalrecords.bundle`, each
with its NAME_ key), so `tools/extract-journal-rooms.py` counts them per scene into
`js/journal-rooms.js`: 208 entries, 2,622 enemies in 366 scenes (the other 29 are summoned at run
time: bosses, a hive's). The Journal says each entry's areas (a scene's area comes from the data:
each map branch takes the area its pieces, wishes and gauntlets carry) and, in a save, the nearest
one by rooms from the bench (`js/graph.js`); with nothing picked, what's missing closest. The same
pass read each enemy's health in the game (HealthManager): **the wiki's matches it for 202 of the
208**; Overgrown Pilgrim (20 in the game, 23 on the wiki) and Pondcatcher (30, 25) differ, the
rest are scripted cases (an untouchable Skarr Scout, the Second Sentinel's 99,999, the Clover
Dancers counted as one fight). The site keeps the wiki's numbers (CLAUDE.md). Known gap: the
graph has doors, not lifts or memories, so Verdania, the Cradle, the Mist and the caravan's
insides are islands in it.

**Phase 5 has started** (the same day): `js/engine.js` takes an enemy (`compute(state, { foe,
black })`): each hit is one product rounded once (weapon × the enemy's modifier at the level of
what hits × Hornet's bracket), bonus damage takes neither, and each attack says how many uses kill
it. Checked against the damage page's own two examples, which it reproduces: 9 for the first, and
80 then 65 for the second, which showed that the Challenge only reaches an attack's first hit (the
engine gave it to every hit until then). The Combat screen puts it on a page: the enemy picked,
its card, what you do to it and what it does to you, and the quickest way to kill it
(`engine.plan`: the red loads first, then the fewest slashes with the Skill casts their silk pays
for, from a full spool, no Bind; minimal by construction, tested). Left: Binds and the damage
taken over a fight, the phases' bars one by one (only the Forebrothers carry them in the data),
the per-boss pages (phase 8's) and the gauntlets (phase 7's).

**Phase 6's spike is done** (the same day): the map comes out of the game's files (§4.7), so the
fallback (a schematic map from the randomizer's room graph) isn't needed. The author decided to
publish it as the Hollow Knight site does, and the Map screen followed: `tools/extract-map.py`
draws the 770 rooms with each one's full drawing (the component's `fullSprite`; the renderer holds
the rough sketch until the map is bought) into `assets/map/rooms.webp` (507 KB) and writes
`js/map.js` (827 scenes with their box, 57 of them points: rooms with no drawing of their own);
`js/rooms.js` places a scene, falling back to its name without the last part for the interiors
the map doesn't draw. Every floor piece but one has its room, and every bench of the author's 92
saves but a tutorial one. Left: the icons (the site's own, by what the game has found), the
rooms with two states, Hornet walking between benches. **The first drawing was wrong** (found by
the author, 28 September): the atlas trims the transparent margins of 869 of the map's 1,204
sprites, UnityPy gives the trimmed texture, and each room was placed by a pivot that is a
fraction of the whole rectangle, so every trimmed room sat off its place by what it had lost and
the corridors didn't meet. `extract-map.py` now puts the texture back in its rectangle
(`textureRectOffset`) before placing it. Ruled out on the way: no room is mirrored, two are
turned half a degree, and each room's full drawing is the right sprite. The author then found
what was still wrong (the Abyss, Verdania, Cogwork Core, Grand Gate, Whiteward), and the game's own
code (`GameMapScene`, read with ILSpy) said why: a room is Hidden, Rough or Full, only a Rough
one takes its full drawing (Hidden halves and secrets that point at their main room's were drawn
with it, out of place), and some rooms change with the game's state: 14 hidden in Act 3 under
their destroyed versions (both were drawn, one over the other), Verdania's colours and two of
its drawings once the Dancers are beaten, Whiteward's pit after the Unravelled, the Abyss's
diving bell. The image now shows one state, written in `extract-map.py`'s STATE: the world
explored before Act 3, with those bosses beaten; a patch that adds a condition stops the run.
Then **the places**: the game's own pins come out of the same tree (95: 76 benches with the toll,
Bellshrine and Swamp Shaman ones, 12 Bellway and 7 Ventrica stations; the caravan's, which move,
and the vendors' left out), each with what lights it in the game (the station unlocked, the toll
paid), which `savefile.game().lit` reads; the gauntlets not cleared go in their arena's room
(`js/gauntlets.js`'s scene, an interior by its door: `js/rooms.js`'s ENTRANCE, read from the
scenes' doors), and the fleas, which weren't drawn, by the room their flag names. And **how the
rooms connect** (28 September): `tools/extract-graph.py` reads every scene's TransitionPoints
(its ways out, directed, since a drop leads one way) into `js/graph.js`, 536 scenes and 1,277
ways; from the first room every piece's room is reached. `js/rooms.js` walks it with the
stations a save has opened: Hornet's way from the previous bench to this one is drawn on the Map,
and what's missing is ordered by rooms from your bench, on the Map and in Progress. That closes
phase 6.

**Phase 7 has started** (the same day): the Tasks. The completionist's 74 (21 main objectives and
53 wishes in 11 types) with their save field, joined to the game's own names by their English
among its quest titles (`QUEST_<X>_TITLE`, `MQ_<X>_NAME`, `SQ_<X>_NAME`; compared without commas:
the completionist's "Pain, Anguish, and Misery" is the game's "Pain, Anguish and Misery"), all 74
named; the types by `TYPE_<X>_TITLE`. They show in Progress as a third part and in "since the
previous save"; the author's 100% game has 64 done (two are one mode's only, a few one path's).
The fleas were already in Progress and on the Map. Then the **49 enemy gauntlets**
(`tools/gen-gauntlets.js`: the wiki's index page for each one's area and place, each subpage's
reward and waves, 220 waves and 454 enemies all joined to `js/enemies.js`; the rewards the game
names, the Crests by `js/data.js`, the wiki's sentences left out), run in Combat wave by wave and
as a whole. **Phase 7 is done.** Then (28 September) **which gauntlets a save has cleared**, the
Colosseum's marks: the game's arenas are BattleScene components in its scene bundles
(`tools/extract-battles.py`: 59, each with its waves, the playerData flag it sets and the
sceneData flag it saves), paired by hand to the wiki's 49 by area and waves. 39 are an arena's
flag; the rest take what the fight leaves: the boss defeated (Karmelita, Khann, the Unravelled,
whose gauntlets are memories or boss fights), the lava challenge's own flag, the Vintage Nectar
picked up in Ant_08, Sherma's wish, the Simple Key in Dust_06 (the Roachkeeper's, not an arena
at all). The Coral Tower's four floors are a memory that saves nothing: Khann counts for them.
The Slab's two arenas set the same flag; which was fought is whether Hornet was caught
(`door_slabCaged`). The conditions live in `tools/gen-gauntlets.js`, the save's list in
`savefile.game().gauntlets`, and they show in Combat, Progress and "since the previous save";
`check-pack` checks that no game loses one from a save to a later one (0 in the 92). Found on
the way: the black-threaded Act 3 variants were already three of the wiki's 49 (Greymoor 2,
Hunter's March 6, High Halls 2), each with an arena of its own; the Marrow's shares its flag
with the Act 1 one. Not seen in any save yet: the Simple Key's gauntlet and the Whispering
Vaults' second (the Acolytes').

**Phase 8 is built** (the same day): `tools/pages.js` from the Hollow Knight site as it was (the
address changed) and `tools/pages-text.js` written for Silksong, seven pages in each language
(the home, the save analyzer, the 100% checklist, the map, the Journal, the Tools and Crests
calculator, the damage calculator: §7's two Spanish ones first), `sitemap.xml`, the preview card
and the icons, all checked by `test/pages.test.js` and opened over file:// from their subfolders.
Then (28 September) **the per-boss pages** that phase 5 left: 51 in each language, 116 pages in
all, written from the data by `tools/pages-bosses.js` (each boss's fights, the engine's slashes
at each Needle level, its attacks and staggers, and where it's fought and what it gives, which
`tools/gen-enemies.js` now reads from each boss page's infobox by the game's names:
`js/enemies.js` BOSSES, 40 of the 51, all through `--audit`). Each opens Combat on its boss
(`<html data-foe>`, applied at boot unless the link names another screen); the texts are written
with no pronoun and no verb on the boss's name, since Spanish would have to agree with Lace,
Khann or the Forebrothers.
Left, and the author's to do: publishing (GitHub Pages) and Search Console; and trying the live
link by hand with the game running.

In the order that gets something publishable soonest, with the days this site's history
suggests (it went from the first commit to the live tracker, the map and the Journal in about
two weeks of September 2026).

0. **Bootstrap** (1 day). The new repository from the skeleton (§5.1), `CLAUDE.md` rewritten,
   `tokens.css` with a placeholder palette, `game-text.js` pointed at the Silksong dump with
   the new key lists, `pages.js` with the new intents, GoatCounter, the tests green on empty data.
1. **The data foundation** (2–3 days). `kb/` regenerated for Silksong (the batch fetch of Tools,
   Crests, bosses, enemies, the damage page, the Journal, the gauntlets, the Wishes);
   `js/data.js` (Tools, Crests, Needle, Skills, Arts, items) from the infoboxes and the dump;
   `js/enemies.js` from the master table with the modifiers, the black-threaded values and the
   boss attacks with their damage and stagger; `js/journal.js` generated; `design/02-silksong.md`
   with the measured palette. `npm run text -- --audit` green.
2. **Your game** (3–4 days). `savefile.js` with the new shape, `completion.js` with the ten
   categories, `progress.js` and `changes.js` with the new ids and the Act, the Saves screen
   and the live link as they are, the start screen with the bench, the Act and what changed.
   `check-pack` against the author's saves. **This is the first release**: it's the niche that
   worked, and it's where the live link and Spanish already set the site apart.
3. **Tools and Crests** (4–6 days). The engine of §2, the Crest screen drawn as the game's
   inventory (the wheel with its coloured slots, locked ones dimmed, the Vesticrest), the Tool
   band with the hover preview, the figures, the Skill and Needle Strike plates, the Effects
   plates for the passive Tools, the URL codec and Share. The DPS figure waits for the speed data.
4. **The Journal** (1–2 days). 236 entries with the game's notes, kills left, the six optional
   ones marked, the Steel Soul entry.
5. **Combat** (3–5 days). The arena with the enemy's modifiers at your level, black-threaded
   variants, phases with their own bars, hit-count staggers, Tool ammo and refills, silk gained
   and Binds, and the per-boss pages. This is where Silksong's model shines: the answer is
   different for each enemy.
6. **The map and the collectibles** (a 1-day spike, then 3–5 days if it works). The UnityPy
   spike with the game installed; the room graph from the randomizer; the collectibles from the
   completionist's fields; Hornet walking between benches.
7. **Gauntlets, Wishes and Fleas** (2–3 days). The 49 gauntlets as the Colosseum was (waves in
   the arena, marked from the save's scene data), and the Wishes and Fleas as Progress rows.
8. **Pages and launch** (1–2 days). The generated pages per intent in both languages, the
   sitemap, Search Console. Timing: before Sea of Sorrow if the date firms up, since the wave of
   returning players will search for what's new; and a re-fetch the week it ships.

About **18 to 27 days** of work for the whole of it, with a first release after phase 2 (about
a week). What to decide before phase 0: the repository's name (§5.3), and whether the first
release is Your game alone or Your game with the Tools screen.

## Sources

Wiki (hollowknight.wiki, raw wikitext via `?action=raw` and the API, 27 September 2026):
[Damage Values and Enemy Health (Silksong)](https://hollowknight.wiki/w/Damage_Values_and_Enemy_Health_(Silksong)) ·
[Tools](https://hollowknight.wiki/w/Tools) · [Tool Pouch & Crafting Kit](https://hollowknight.wiki/w/Tool_Pouch_%26_Crafting_Kit) ·
[Crests](https://hollowknight.wiki/w/Crests) · [Needle](https://hollowknight.wiki/w/Needle) ·
[Needle Strike](https://hollowknight.wiki/w/Needle_Strike) · [Silk](https://hollowknight.wiki/w/Silk) ·
[Bind](https://hollowknight.wiki/w/Bind) · [Combat (Silksong)](https://hollowknight.wiki/w/Combat_(Silksong)) ·
[Black-Threading](https://hollowknight.wiki/w/Black-Threading) · [Hornet (Silksong)](https://hollowknight.wiki/w/Hornet_(Silksong)) ·
[Skills and Abilities (Silksong)](https://hollowknight.wiki/w/Skills_and_Abilities_(Silksong)) ·
[Hunter's Journal (Silksong)](https://hollowknight.wiki/w/Hunter%27s_Journal_(Silksong)) ·
[Completion (Silksong)](https://hollowknight.wiki/w/Completion_(Silksong)) ·
[Save Data (Silksong)](https://hollowknight.wiki/w/Save_Data_(Silksong)) ·
[Bosses (Silksong)](https://hollowknight.wiki/w/Bosses_(Silksong)) · [Enemies (Silksong)](https://hollowknight.wiki/w/Enemies_(Silksong)) ·
[Enemy Gauntlets (Silksong)](https://hollowknight.wiki/w/Enemy_Gauntlets_(Silksong)) · [Elegy of the Deep](https://hollowknight.wiki/w/Elegy_of_the_Deep) ·
[Wishes](https://hollowknight.wiki/w/Wishes) · [Acts](https://hollowknight.wiki/w/Acts) · [Steel Soul Mode (Silksong)](https://hollowknight.wiki/w/Steel_Soul_Mode_(Silksong)) ·
[Areas (Silksong)](https://hollowknight.wiki/w/Areas_(Silksong)) · [Achievements (Silksong)](https://hollowknight.wiki/w/Achievements_(Silksong)) ·
[Updates (Silksong)](https://hollowknight.wiki/w/Updates_(Silksong)) · the 54 Tool, 9 Crest and 43 boss pages.

Team Cherry and press: [Holiday 2025 blog (Sea of Sorrow)](https://www.teamcherry.com.au/blog/holiday2025) ·
[Steam news, patch 1.0.30000](https://store.steampowered.com/news/app/1030300) ·
[Nintendo Life, Patch 5 notes](https://www.nintendolife.com/news/2026/03/silksongs-last-significant-update-before-dlc-launch-has-been-revealed-here-are-the-full-patch-notes).

GitHub: [stradivari96/silksong-translator](https://github.com/stradivari96/silksong-translator) ·
[Br3zzly/silksong-completionist](https://github.com/Br3zzly/silksong-completionist) ·
[th3r3dfox/silksong-tracker](https://github.com/th3r3dfox/silksong-tracker) ·
[Batatvideogames/silksong-archipelago-randomizer](https://github.com/Batatvideogames/silksong-archipelago-randomizer) ·
[apocalyptech/silksong-save-decrypt](https://github.com/apocalyptech/silksong-save-decrypt) ·
[RainingChain/silksong-map-data](https://github.com/RainingChain/silksong-map-data) ·
[timothymarriott/Silksong-Rando](https://github.com/timothymarriott/Silksong-Rando) ·
[EthanTheBrave/SilaSong](https://github.com/EthanTheBrave/SilaSong) ·
[flibber-hk/Silksong.RosaryData](https://github.com/flibber-hk/Silksong.RosaryData) ·
[KyleNeubarth/SilkSongTextAssetDecrypter](https://github.com/KyleNeubarth/SilkSongTextAssetDecrypter) ·
[Ashiepaws/silksong-patchwork](https://github.com/Ashiepaws/silksong-patchwork) ·
[Wersky/silksong-save-toolkit](https://github.com/Wersky/silksong-save-toolkit) ·
[liuYousefKahwaji/SilksongTracker](https://github.com/liuYousefKahwaji/SilksongTracker) ·
[silksong-modding](https://github.com/silksong-modding) · [homothetyhk/ItemChanger.Silksong](https://github.com/homothetyhk/ItemChanger.Silksong) ·
[yassenshopov/HallownestAPI](https://github.com/yassenshopov/HallownestAPI).

Save locations: [checkpoint64](https://checkpoint64.com/games/hollow-knight-silksong/save/) ·
[Shacknews](https://www.shacknews.com/article/145800/where-to-find-hollow-knight-silksong-steam-save-file).
Fonts: [SilksongFontsInject on Nexus](https://www.nexusmods.com/hollowknightsilksong/mods/416).
Unity version: [AssetRipper issue 1925](https://github.com/AssetRipper/AssetRipper/issues/1925).
