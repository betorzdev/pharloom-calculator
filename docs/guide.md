# Pharloom Calculator — the full guide

*Every screen of the plan is built. This guide grows with the page (CLAUDE.md: keep it up to date).*

## What's on the page

The header has the language and, on the right, the save you're in (Hornet at a bench): it opens
**Saves**. The screen bar has the screens the plan brings (Your game, Inventory, Progress, Map,
Journal; Crest, Combat); the ones not built yet say which phase of the plan builds them. The
study and the plan are in `design/00-study.md`.

### Saves

Four saves, as the game's profile screen, and **Free mode** (nobody's game: where the site
starts). A save only comes from the game's file: **Import from the game** opens a view that
says where each system keeps its saves (the folder to copy and how to paste it into the file
picker) and takes the file by dragging it in or with the picker. It shows what it read (masks,
Needle, time, completion, rosaries, the Act, the Journal, the Tools) before anything is written.
Any of the game's files works: `user1.dat` to `user4.dat`, the copies from before a patch
(`user1_1.0.29242.dat`) and the **restore points** in `Restore_Points#/restoreData#.dat`, which
are earlier moments of the same game (the preview says the day). The file is read in the browser
and isn't sent anywhere.

Where the browser can (Chrome and Edge: File System Access), an imported save can **follow the
game**: the site keeps a link to the file and catches up each time the game writes it. After a
reload the browser asks for permission again, and a notice above the screen says so. **Clear**
asks the game's own question («Clear Profile?») and only clears the site's copy.

### Your game

In Free mode, an invitation: drag your save's file there and it goes into the first empty save.
In a save: the Act, the time played, the rosaries and **your 100%**, split into the wiki's ten
categories (Tools, Silk Spools, the Crafting Kit and Tool Pouch, abilities, Silk Skills, Crests,
masks, the Needle, Silk Hearts, the Everbloom), with the figure the game itself shows under it:
they're the same. The site counts as the game does, checked on 92 real saves (0% to 100%, four
patches, Steel Soul): whole masks and spools, not loose shards and fragments (two shards are
still 0%), and a Tool and its upgrade (Curveclaw and Curvesickle) are one point. And the
Journal: the required entries with their kills done, out of 230 (231 in Steel Soul).

When the save follows the game's file, each new save the game writes to it (the restore points
go to their own folder and aren't followed) brings a block **Since
the previous save**: the new Act, Crests, Tools, Silk Skills and abilities by name, the upgrades
with their new value, each piece found with its area, the Journal entries new or completed as a
count, and what the completion went up by. The notice at the top says the same in one line.

### Inventory

The game's own pane: the Needle with its damage, the masks and the silk on the left; in the
middle the game's icons in grids, the Tools by colour (a thin rule in their slot's colour), the
Crests, the Silk Skills, the abilities and the items (the Crafting Kit and Tool Pouch with their
level, the loose Mask Shards and Spool Fragments, the Memory Lockets, Craftmetal, Pale Oil, the
Everbloom, the Silk Hearts, the Old Hearts, the melodies and the fleas); on the right the name
and the game's own text of what you point at or tap. What you don't have yet is a dimmed
silhouette; in Free mode everything is there. On a phone the description sits on the bottom
edge while you go through the grids.

### Crest

The game's Crest screen («Blasón»): the Crest with its text and its slots, each in its colour,
filled with the Tools and the Silk Skill (a dashed slot is one a Memory Locket opens; the
Vesticrest adds a yellow and a blue one); what makes the build (the Crest, the Hunter's
evolution, the Needle, Crafting Kit and Tool Pouch levels, the Tools and the Skill); and the
figures: the Needle's slash with the modifiers that apply now, the Wanderer's critical hit, the
Needle Strike, each Tool equipped that deals damage (per hit, uses at the Pouch's level, a full
load, the shell shards to refill it), the six Silk Skills, masks, silk and the Bind. "Right now"
switches what depends on the moment: the Hunter's focus, the Beast's fury, Flintslate's buff, the
hit after a Challenge.

The damage is the wiki's model: the weapon's damage at its level times (1 + the player's
modifiers, which add) rounded half to even, per hit; Tools scale with the Crafting Kit, the rest
with the Needle; no player modifier reaches a Tool. In a save, the build is what Hornet wears in
the game, at its levels, and it's read, not changed (the moment can still be switched): to try
builds, Free mode, where the build is kept in this browser.

The Architect and the Witch split their slashes (the Architect drills: 0.9× + 0.1× + 0.1× the
Needle; both have their own down- and run-slashes), and the screen shows all three attacks with
their hits, what holding adds and what a landed hit adds; the others slash once at the Needle's
damage. The Tools equipped that deal no damage are listed with the game's text of what they do.
On a narrow screen, where the figures go below the controls, a strip on the bottom edge keeps
the main ones in view while you pick: the slash, your Silk Skill and your first Tool that hurts
(by their icons), masks and silk.

**Share** copies a link that opens the build on screen as it is (yours from a save too). The
link is readable (`#v=1&crest=architect&needle=4&tools=straight-pin,compass…`) and carries only
what differs from a Hunter with nothing: in Free mode the address always says the build. A link
with a build opens it in Free mode; if you were in a save, the page goes to Free mode and says so.

### Journal

The Hunter's Journal as the game's pane: the 236 portraits (237 in Steel Soul) in its order, and
beside them the one you point at or tap, with its portrait, name, description, the kills against
what the full entry needs and, once complete, the Hunter's note. A complete entry is at full
light, one seen and not complete half-lit with its kills (12/25), one not seen a grey silhouette,
and the six optional ones carry a small diamond. On top, the count for Nuu's Hunter's Memento
(230 required, 231 in Steel Soul) and how many you've seen; "What's missing" hides the complete
ones. An entry is complete when the save lists it with its kills done: the game writes them even
for the entries it completes another way, and on the saves where Nuu has given the Memento the
site counts all 230. In Free mode, the whole Journal.

### Combat

Your build against one enemy. Every enemy has five damage modifiers, one per level of what
hits it (Moorwing takes ×2 from a level-0 weapon and ×0.85 from a level-4 one), so how many hits
kill it is a question per enemy. Pick it from the list (search in either language, accents
optional; bosses first, with their Journal portrait); its card shows its health, the
black-threaded one when it has it (Act 3), its five modifiers with the level your Needle hits at
and your Crafting Kit's marked, and the hits that stagger it. Beside it, what you do to it: each
of your attacks (the slash, with its product: Needle × your modifiers × its modifier; the
Crest's own attacks; the Needle Strike; the Silk Skill equipped; each Tool that deals damage,
with what share of its health a full load takes) and how many uses kill it, counting every hit
landing; after a Challenge, only the first hit takes it. And what it does to you: each of its
attacks (the wiki's names, the game doesn't name them), how many masks it takes (the Barbed
Bracelet doubles them) and how many kill you. The build is the Crest screen's.

**Enemy gauntlets**: the other half of the screen, the game's 49 arenas of waves, each named by
its place or its area, with its reward (the game's name for it, when it gives something the game
names). For each wave, its enemies with their health, your slash's damage against each and how
many kill it; for the whole arena, its health and the quickest way through, silk and loads
carried from wave to wave (an estimate: each enemy's damage at your Needle's level). In a save,
a tick on each one you've cleared and how many of the 49; a gauntlet cleared also shows in
"Since the previous save". Most are read from the arena's own flag in the save; the bosses'
from the boss defeated, and a few that save nothing from what the fight leaves (the lava
challenge's flag, the Vintage Nectar picked up, Sherma's wish). The four Coral Tower floors
count as cleared once Crust King Khann is: the tower is a memory and doesn't save its floors.

On top, **the quickest way**: your red Tools' full loads first, then the fewest slashes with the
casts of your Silk Skill that their silk pays for (a strand per slash, starting with the spool
full, as leaving a bench, and no Bind): "7 × Cogfly" against Lace, "12 × Straight Pin, 24 slashes
and 8 × Silkspear" against something bigger.

### Map

Pharloom as the game's own map screen draws it, taken from the game's files (every room in its
area's tint, the full drawing, as once the area's map is bought), and on it Hornet at the bench
you rest at and a dot for each loose piece you're missing, in its room: Mask Shards, Spool
Fragments, Memory Lockets, Craftmetal, Pale Oil and fleas, each kind switched on or off. The
pieces a wish or a purchase gives have no room in the save and aren't marked (Progress lists
them). Below, the places, each with a glyph of its own and switched on or off too: the benches,
the Bellway stations and the Ventrica stations where the game puts its own pins, dimmed while
your game hasn't opened them (a station not unlocked, a toll bench not paid; the counter says how
many are open), and the enemy gauntlets you haven't cleared, in their arena's room. Hornet sits
on her bench's pin. The map shows the world explored before Act 3, with Verdania and Whiteward
as they are once their bosses are beaten. "Whole" fits it to the page; ×1,5 and ×2,5 enlarge it, and it scrolls to your bench. In
Free mode, every piece.

### Progress

What's missing for 100%, in the wiki's ten categories: the Tools (with their slot colour),
Crests, Silk Skills and abilities by name, and the Mask Shards, Spool Fragments, Crafting Kit
and Tool Pouch upgrades, Needle upgrades and Silk Hearts one by one. Each thing says its Act and
the area it's in, with the game's names; what belongs to a later Act than yours is dimmed. Then
what doesn't count but opens things: Memory Lockets, Craftmetal, Pale Oil, the Lost Fleas, the
four Old Hearts (the Red Memory), the three melodies (the Cradle) and the abilities outside the
100% (the two cloaks, Beastling Call, Elegy of the Deep), and the 49 enemy gauntlets, named as
Combat names them.

Last, **Tasks** («Tareas», the game's pane): the main objectives and the wishes on the boards by
type (Wayfarer, Gather, Donate, Hunt, Grand Hunt, Delivery…), 74 in all, each with the game's own
name, its Act and where. The one only Steel Soul has, and the one only Classic has, show only in a
game of that mode. A task done also shows in "Since the previous save".
In a save it shows what's missing, or everything with a tick where you have it; without a save,
the whole list, as a guide. Which piece you have is read from the save one by one, and on the
92 real saves it agrees with the game's own counters (masks, spools, the three upgrade ladders,
the Silk Hearts). The exact room comes with the map (phase 6).

### Pages

The site is one page, and each search it answers has an address of its own, in each language:
the save analyzer, the 100% checklist, the map, the Hunter's Journal, the Tools and Crests
calculator and the damage calculator (`save-analyzer/`, `es/analizador-partida/`…). Each is the
whole site opened on its screen, with its own title, description and a short text with
questions, and `sitemap.xml` lists them. `npm run pages` writes them from `index.html` and
`tools/pages-text.js`; `npm test` fails if one falls behind.

## Where the numbers come from

From the community wiki (`hollowknight.wiki`), page by page, with the game's rounding (half to
the even integer, and the exceptions the wiki names on its damage page). The Spanish names are
those of the game's official translation.

## Languages

Until someone chooses, the site starts in the browser's language: the first of
`navigator.languages` that it speaks, and English if none. The language saved in
`pharloom.prefs` only counts if it was chosen. All text goes through `js/i18n.js` or through a
`{ es, en }` in the data. Nothing is translated by hand: the game names are copied from its own
texts (`npm run text`), and the rules are in `CLAUDE.md`, "Translations".

## Credits and licences

**Unofficial fan project**, free and non-commercial, not affiliated with or endorsed by
[Team Cherry](https://www.teamcherry.com.au/). *Hollow Knight: Silksong*, its artwork, sprites,
texts and names are © Team Cherry; they're used here only to show the game's own information.

- **Numbers and data**: [hollowknight.wiki](https://hollowknight.wiki/), under
  [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). What's taken or adapted from
  it keeps that licence. Thanks to its editors.
- **The game's texts**: its official Spanish and English names come from the dump of its
  TextAssets in [stradivari96/silksong-translator](https://github.com/stradivari96/silksong-translator).
  The dump isn't in this repo: `npm run text` downloads it to `kb/data/all_text.json`.
- **Save files**: the format was read in [Br3zzly/silksong-completionist](https://github.com/Br3zzly/silksong-completionist)
  (MIT) and [apocalyptech/silksong-save-decrypt](https://github.com/apocalyptech/silksong-save-decrypt);
  only the facts (the header, the key, the field names) are taken. Where each Tool, Crest,
  Journal entry and loose piece lives in the save comes from the completionist's dictionary,
  pinned in `kb/data/completionist/` with its licence (`npm run collectibles`).
- **Sprites and icons**: Hornet, the masks, the spool, the five Needles (`npm run art`) and the
  inventory icons of the Tools, Crests, Silk Skills, abilities and items and the Journal's 237
  portraits (`npm run icons`, fitted into 256 px as WebP) are the game's, downloaded from the wiki and shown as a fan project.
- **The map**: the rooms of the game's own map screen, extracted from the installed game's files
  by `tools/extract-map.py` (`assets/map/rooms.webp`, `js/map.js`), shown as the Hollow Knight
  site shows its map, as a fan project.
- **Fonts**: Cinzel, Spectral and Patrick Hand SC, under the
  [SIL Open Font License 1.1](../assets/fonts/OFL.txt).
- **Code**: MIT ([`LICENSE`](../LICENSE)). It covers only the code, not any of the above.

If you hold rights over something here and want it removed, open an issue or write to
[betorzdev@gmail.com](mailto:betorzdev@gmail.com).

## Contact

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)).
