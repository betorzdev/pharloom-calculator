# Pharloom Calculator — the full guide

*Every screen of the plan is built. This guide grows with the page (CLAUDE.md: keep it up to date).*

## What's on the page

The header has the title under a filigree crown (it leads back to Your game), the language on
the left and, on the right, the save you're in (Hornet at a bench): it opens **Saves**. The
screen bar has the screens, in two groups: your game (Your game, Inventory, Progress, Map,
Journal) and, after a thin rule, the tools (Crest, Combat). With a save loaded, Progress carries
your completion and Journal the entries Nuu counts (`63%`, `120/230`); in Free mode the bar only
has the names. On a phone the seven don't fit in a row, so they fold: Crest and Combat into one
tab, **Build**, which opens the last one you used, and Inventory under Your game; while you're
in either pair, a second row under the bar switches between its two.

Every screen is framed as the game's pause menu frames its panes: a thin filigree line all
round with a curl at each corner, and the screen's name on its top edge in a small plaque with
pointed ends, where the line stops. The study and the plan are in `design/00-study.md`; the UI and UX review, step by
step, in `design/03-redesign.md`.

On a computer, Hornet sits on the screen bar under the tab you're on: she is its mark, where a
phone's width draws a rule instead. When you change screens she gets up and runs along the bar to
the new one, at a steady pace, with her own frames from the game (the Run clip, 15 a second).
She's decoration: hidden from screen readers and out of the tab order. With reduced motion she
only sits, placed straight under the tab. Click her and she binds.

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
reload the browser asks for permission again, and a notice above the screen says so. Not on
Linux: Chrome's picker refuses `~/.config` («it contains system files»), where the game keeps its
saves, so there the file is read once through the plain file dialog and isn't followed. **Clear**
asks the game's own question («Clear Profile?») and only clears the site's copy.

### Your game

In Free mode, the card a save shows, unlit: «Resting at Pharloom», Hornet in silhouette on
Bone Bottom's bench (the first one) and the four figures waiting, with Import. Drag your save's file onto it and it goes into the first
empty save.

In a save, the game's area title card: **Resting at** the area of the bench Hornet sits at, lit by
that area's own colour on the game's map, the room's area under it when it's another (Coral
Tower in the Sands of Karak), the Act and the time played; Hornet sitting on that very bench (each room's bench is read
from the game's files; one it doesn't know shows Bone Bottom's); and four
figures: **your 100%**, the Journal, the masks and the rosaries. Under it, the road to the next
Act when there is one, then three columns: what changed since the previous save (below), what's
missing **closest to your bench** (the first five, in rooms: each door and each ride between the stations you've opened counts one), and your 100% split into
the wiki's ten categories (Tools, Silk Spools, the Crafting Kit and Tool Pouch, abilities, Silk Skills, Crests,
masks, the Needle, Silk Hearts, the Everbloom), with the figure the game itself shows under it:
they're the same. The site counts as the game does, checked on 92 real saves (0% to 100%, four
patches, Steel Soul): whole masks and spools, not loose shards and fragments (two shards are
still 0%), and a Tool and its upgrade (Curveclaw and Curvesickle) are one point. And the
Journal: the required entries with their kills done, out of 230 (231 in Steel Soul). Each
category opens Progress. At the foot, the ways on: Progress, the Map, the Journal (with the
entries still to go) and the Crest screen. With a save loaded, the text about the site under
the screen folds into «About this site».

When the save follows the game's file, each new save the game writes to it (the restore points
go to their own folder and aren't followed) brings a block **Since
the previous save**: the new Act, Crests, Tools, Silk Skills and abilities by name, the upgrades
with their new value, each piece found with its area, the Journal entries new or completed as a
count, and what the completion went up by. The notice at the top says the same in one line.

### Inventory

A sheet in two columns. On the left, what Hornet is: **the Needle**, the five upright with their
damage, the one she carries taller and lit; then **Hornet**: the masks (5 to 10) as the game's
masks, the silk (9 to 18) as beads on one thread, the Silk Hearts, and the Crafting Kit and Tool
Pouch with their level; then the **Silk Skills** with what each deals at this build, and the
**abilities** (Needle Strike with its damage). On the right, what she carries: the **Tools** by
colour, each on its slot's diamond (dashed and grey while you lack it), the **Crests** and the
**items** with their counts (the loose Mask Shards and Spool Fragments, the Memory Lockets,
Craftmetal, Pale Oil, the Everbloom, the Old Hearts, the melodies and the fleas). The heads count
as the 100% does (Tools of 51). Tap anything to read the game's own text under its shelf.

In **Free mode** everything on it is yours to set. On the left, tap a Needle, a mask, a bead of
silk, a Silk Heart or a level (tap the last one lit to take it back). On the right, tap a Tool,
Crest, Silk Skill, ability, the Everbloom, an Old Heart or a melody to mark it had or not (its
text opens under the shelf); each shelf has «All · None», and what comes in numbers (loose Mask
Shards and Spool Fragments, Memory Lockets, Craftmetal, Pale Oil, fleas) has − N +. «Base
Hornet» starts from nothing but the Hunter Crest; «Everything maxed» from everything. Until you
mark something, Free mode has everything. What you mark reaches the Crest screen: only what you
have can be put on, the rest shows as a silhouette, and taking a mark off something Hornet
wears takes it off her. Combat fights with that build; the other screens stay Free mode's. In a
save the Inventory shows what the game saved, and changes only as you play.

### Crest

The game's Crest screen («Blasón»), laid out as the game's pane. On top, the figures as the game's
HUD: the Needle at its level with the slash large beside it (each attack, for the Crests that
split them); damage per second, the Wanderer's critical hit and the Needle Strike; and Hornet as
the HUD shows her, her masks drawn, the spool with her silk, and what a Bind heals. Pointing at a
figure shows how it's made. Under them the levels as the game's upgrade pips, − and + either side
(a pip sets it): the Needle, the Crafting Kit, the Tool Pouch and the Hunter's evolution; and
beside them what depends on the moment: the Hunter's focus, the Beast's fury, Flintslate's buff,
the hit after a Challenge.

Below, the Crest drawn as the game draws it, with its slots where the game puts them (read from
its files, per Crest and per evolution of the Hunter), each the game's frame in its colour and
holding the Tool or Silk Skill worn; a slot a Memory Locket opens, left empty, shows the game's
locked frame, and the Vesticrest's slots sit in the corner of the Crest's box. ‹ › change the Crest. Beside it,
the Tools and Silk Skills you have (as the game lists them; in Free mode, what the Inventory's
marks say, or all of them), by colour, each on its slot as the Inventory draws it, the
slot filled and lit when it's worn: a tap puts one on or takes it off,
and pointing at one (or at a slot) describes it underneath with the game's words and its numbers
(damage per hit, uses at the Pouch's level, a full load, the shell shards to refill it; a Silk
Skill's damage and silk), as if it were worn when it isn't.

The damage is the wiki's model: the weapon's damage at its level times (1 + the player's
modifiers, which add) rounded half to even, per hit; Tools scale with the Crafting Kit, the rest
with the Needle; no player modifier reaches a Tool. In a save, the build is what Hornet wears in
the game, at its levels, and it's read, not changed (the moment can still be switched): to try
builds, Free mode, where the build is kept in this browser.

The Architect and the Witch split their slashes (the Architect drills: 0.9× + 0.1× + 0.1× the
Needle; both have their own down- and run-slashes), and the band shows all three attacks; the
others slash once at the Needle's damage. On a narrow screen a strip on the bottom edge keeps the
main figures in view while you pick: the slash, your Silk Skill and your first Tool that hurts
(by their icons), masks and silk.

**Damage per second**: the slash's damage over the time between two slashes,
which is each Crest's own, read from the game's files: 0.41 s for the Hunter, 0.30 s for the
Wanderer, 0.39 s for the Beast (0.32 s in fury), 0.45 s for the Witch and the Architect, 0.50 s
for the Reaper and the Shaman. With Flea Brew worn, what it gives for its 10 seconds: it halves
the wait, but a slash never comes faster than the slash itself lasts (0.35 s for the Hunter).
Combat says how long slashing nonstop takes to kill the enemy.

**Share** copies a link that opens the build on screen as it is (yours from a save too). The
link is readable (`#v=1&crest=architect&needle=4&tools=straight-pin,compass…`) and carries only
what differs from a Hunter with nothing: in Free mode the address always says the build. A link
with a build opens it in Free mode; if you were in a save, the page goes to Free mode and says so.

### Journal

The Hunter's Journal. On top, the count for Nuu's Hunter's Memento as a ring (230 required, 231
in Steel Soul; the bright arc is what's complete, the dim one what you've seen), and beside it the
four entries you're missing closest to your bench, with how many rooms away and how many kills to
go. Under it, the 236 portraits (237 in Steel Soul) **by area**, the areas with the most missing
first and each with its count (6/20), or **in the Journal's order**; entries with no place go last,
under "Elsewhere". Two small toggles switch that and "What's missing / Everything", and a search
beside them finds entries by name or by area, in either language and with or without accents; while
it has text it looks through the whole Journal, what's complete included. Each portrait
sits in a ring that fills with its kills and lights up once complete; one not seen yet is in
shadow in a dashed ring («???»), and the six optional ones carry a small diamond. Tapping one
opens its page as the game's Journal shows it (from the foot on a phone; Esc or a tap outside
closes it): the whole drawing, from the game's files, on a soft light and at the size the game
draws it (a Mossgrub small, the Bell Beast filling it), so you know the bug when you meet it; one
not seen yet is in shadow. Beside it the name, the kills, its areas and the nearest from your
bench, the description, and under the Hunter's symbol the Hunter's note once complete, or the
game's «Defeat 11 more to complete the hunter's notes.». An entry is complete when the save lists it
with its kills done: the game writes them even for the entries it completes another way, and on
the saves where Nuu has given the Memento the site counts all 230. In Free mode, the whole
Journal.

**Where**: each entry says the places it's found, the most first, from the game's own files: for
208 of the 237, the areas its enemies are placed in; for the other 29, which the game makes as you
play, the rooms of what makes them: a boss's arena, the waters where the Muckmaggots are on, each
Sandcarver's pit, the cocoons and corpses that let Gloomsacs, Winged Lifeseeds and Shellwood Gnats
out, the Void Mass's cores, and for Shakra and Garmond & Zaza the room of their duel. Lost Lace's
arena and the Bell Eater's aren't on the map, so they count as the rooms that take you there: the
Abyss's dive, and every Bellway station. In a save, also the nearest one from your bench, in rooms,
and with no entry picked the pane lists what's missing closest, with the kills each still needs;
tap one to read it. The rooms are counted by the game's doors and the stations you've opened.
Verdania, the Cradle, the Mist and the caravan's insides are reached some other way (a memory, a
lift, the maze), so their entries say where, not how far.

### Combat

Your build against one enemy, as a duel: Hornet and the enemy face to face, each on the
Journal's light (the enemy as the Journal draws it whole), between them the slashes that win and
the fewest of its hits that take you down, under Hornet her masks and under the enemy its health
as a bar, with a tick where each phase starts; then the quickest way in one line, your attacks as
cards (the one that needs fewest framed; pointing at one shows how its damage is made) and its
attacks with their masks drawn. The enemy is picked in a dropdown over the duel (search in either
language, accents optional; bosses first). Everything else is folded under «How it's worked out».

The fight can be played out, as on the Hollow Knight site: tap one of your attacks and its damage
comes off the enemy's bar; tap one of its attacks and its masks come off yours. Silk counts as
the game counts it for the quickest way: the spool starts full, a slash that lands adds one, your
Silk Skill spends its cost, and the Bind button spends its silk and heals. Each Tool has its uses
at your Pouch's level. A move that can't be made (no silk, no uses, the fight over) is greyed
out. The log under the duel says what each move did, when a phase starts and who falls; Undo
steps back one move and Start over begins again. A different enemy or build starts it over.

Every enemy has five damage modifiers, one per level of what
hits it (Moorwing takes ×2 from a level-0 weapon and ×0.85 from a level-4 one), so how many hits
kill it is a question per enemy. The folded part shows its five modifiers with the level your
Needle hits at and your Crafting Kit's marked, the hits that stagger it, and a boss's phases (read from the
game's own files: where each one starts, as a health or a share of it, or after how much damage
when each phase has a bar of its own, as Grand Mother Silk's six; and the slashes of yours that
get there from full health; where the game moves on only below its number, not at it (a strict
"less than": the Bell Eater's, the Fourth Chorus's…), the figure is already one under, and the
note says so; and the few that go otherwise: Father of the Flame's lanterns and core, each broken
at 0 or after so many counted hits, where a hit counts only once the piece has been still a
while after recovering from the last (1 s after 0.55 s for a lantern, 0.5 s after 0.1 s for the
core), so at your slash's pace the card says how many count (against a lantern, only the first)
and whether damage or the count breaks it first, and how few hits would do spaced out; the
Forebrothers' heal when one falls, Signis's
phases as shares of his own health, and the health Phantom goes back to if the finishing prompt
is missed). Beside it, what you do to it: each
of your attacks (the slash, with its product: Needle × your modifiers × its modifier; the
Crest's own attacks; the Needle Strike; the Silk Skill equipped; each Tool that deals damage,
with what share of its health a full load takes) and how many uses kill it, counting every hit
landing; after a Challenge, only the first hit takes it. And what it does to you: for a boss,
each of its attacks (the wiki's names, the game doesn't name them); for any other enemy, read
from the game's own files, its body on contact (two values when the game places it with both)
and its strongest attack when that takes more, what it throws at run time included (spit,
bombs, the burst its corpse leaves; not what only a black-threaded one throws), and
black-threaded every hit is 2 masks (the game makes them all void; it doesn't double them). An
enemy it summons with a Journal entry of its own isn't counted as its attack. For each, how many masks it takes (the Barbed Bracelet multiplies them by the game's
own figure, 2) and how many kill you, then how many kill you if you Bind during the quickest
fight: the hits come spread evenly over it (it ends with its last slash), and its silk comes in
order. The spool starts full and never holds more than it holds, as in the game: a slash that
lands with it full gives nothing. The Skill casts spend theirs as soon as it's there; a Bind
comes as soon as it heals in full or the next hit would kill you; the Reserve Bind's free one
counts, and Druid's Eye's silk too (a strand every second hit taken below a full spool; the
hits at full don't count). Silk Hearts' regeneration counts too, over the seconds your slash
takes to kill it (the figure on the slash's row), as the game's code has it: silk only comes
back up to one strand per Silk Heart (Weavelight: one more), one strand after 3.9 s in which
your silk doesn't change (1.45 s from an empty spool; Weavelight, ×0.65), every slash that
lands restarts that count, and a Bind stops it while it lasts. Starting with a full spool and
slashing nonstop, it adds nothing, and the note under the list says so. The build is the Crest
screen's.

The list is the wiki's, plus two Journal entries it gives no health, read from the game's files:
the Wisp and the Winged Lifeseed have no health or modifiers there and die to the first hit, and
their card says so. The Muckmaggots, the Sandcarver and the Void Tendrils can't be hit that way
(the water, the sand pits and a tablet), so they aren't in it.

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

The map fills the screen. Drag it to move it; the wheel, a pinch or a double click zoom where you
point, + and − at the middle, and ⤢ opens it large, the window's whole width (⤡ back). Close up
it swaps to twice the resolution. On it: a search at the top left (an area or an enemy gauntlet
by name: pick one and the map goes there, with a ring where it is) and the zoom at the top
right. Under it the legend in two rows (what's missing, the places): each layer's own mark is its
switch, dimmed when off, with its count, and the last one turns the area names on or off; the
benches start off (there are 76). Tap any mark for its card: what it is, where, how it's had (in
Free mode, «Mark as had»), and for a gauntlet its waves, its reward and «Fight it in Combat». On a
phone the names show only zoomed in. In Free mode with things marked in the Inventory, the map
shows what those marks say is missing.

Pharloom as the game's own map screen draws it, taken from the game's files (every room in its
area's tint, the full drawing, as once the area's map is bought), and on it Hornet at the bench
you rest at and a dot for each loose piece you're missing, in its room: Mask Shards, Spool
Fragments, Memory Lockets, Craftmetal, Pale Oil and fleas, each kind switched on or off. The
pieces a wish or a purchase gives have no room in the save and aren't marked (Progress lists
them). Below, the places, each with a glyph of its own and switched on or off too: the benches,
the Bellway stations and the Ventrica stations where the game puts its own pins, dimmed while
your game hasn't opened them (a station not unlocked, a toll bench not paid; the counter says how
many are open), and the enemy gauntlets you haven't cleared, in their arena's room. Hornet sits
on her bench's pin, as the game draws her sitting. The map shows the whole world explored, in your
game's state, by the game's own conditions: in Act 3 the Cradle, Cogwork Core and the Ventrica
hub are drawn destroyed, as the game redraws them then (with their benches and station), and the
Abyss's diving bell is broken, gone or mended with the Everbloom, as your save has it. In Free
mode it's the world before Act 3. Verdania and Whiteward are always as they are once their
bosses are beaten.

When your previous save rested at another bench, a dashed thread draws Hornet's way from it to
this one, and the first time the map comes into view she runs it, room by room, from the old
bench to the new one (two to eight seconds; the view follows her when it's enlarged), and sits.
She runs each way once; with reduced motion she's simply at her bench. Progress says the same for each missing piece that sits in a room. "Whole" fits it to the page; ×1,5 and ×2,5 enlarge it, and it scrolls to your bench. In
Free mode, every piece.

### Progress

A ledger. At the top, **your 100%** in a ring that fills with it, as the Journal's Memento, with
the game's word, «Finalización» (a line under it only if the game's own figure is another). In Act 3, the whole game at a glance: Act 1, Act 2 and Act 3 on one thread, then the four
endings, lit the ones your save has seen (the game keeps them: Weaver Queen, Snared Silk, Twisted
Child, Sister of the Void), and «Act 3 · n of 4 endings». Before Act 3,
**the road to the next Act** at a glance: its steps as diamonds on one thread, the ones done lit
and the one you're on larger, named with the game's words, and that step's title with how far
into it («2 of 15»); «The whole road» opens it in full. Then each category is a row: its name,
its things as the game's pictures (what you lack dimmed) or as pips, its count and a ring that
opens its list; the rows you open stay open. «What's missing · Everything» and «By Act ·
Nearest first» sit just above the rows.

In **Free mode** with things marked in the Inventory, Progress counts from those marks and
each missing row has a box to mark it here too; masks, silk, the Silk Hearts, the Needle, the
Kit and the Pouch follow what the Inventory sets. With nothing marked, it's the whole list as a
guide, and both roads behind «The roads to Acts 2 and 3».

The whole road, as the game's own rules have it (read from its files, not from a guide), in
numbered steps, each with its count or a tick:

- **To Act 2**: ring the five Bellshrines, open the Grand Gate, defeat the Last Judge, and walk into
  the Citadel. Defeating the Phantom opens another way in, and the first two steps then say
  they're no longer needed.
- **To Act 3**:
  1. Unlock the wish Silk and Soul:
     - its 10 required wishes (guides give six: the ones before them count too);
     - 17 of its 25 wish points (a delivery is worth half a point, the first time only);
     - four conditions: the Flea Caravan at Fleatopia, the Faydown Cloak, Lace defeated in the
       Cradle (with the three melodies that lead there), and the Bellhome Key. Pavo gives the key
       after Bellhart's Glory and 2 wishes of his list, and the step lists them until then.
  2. Take the wish.
  3. Gather the snare's four pieces.
  4. Bring them to the Caretaker.
  5. Snare Grand Mother Silk with the Needolin.

Each missing wish shows its Act, its area, the rooms from your bench to where it's taken, and the
wish to do before it when there is one. Where it's taken is the game's: the Wishwall that lists it
(Bellhart's, Bone Bottom's or Songclave's), or the NPC who offers it; a wish that comes after
another on a board (Crawbug Clearing, Berry Picking…) counts the board until that one is done, and
the NPC after. A part
already met hides its rows under "What's missing". On Your game, one line says which step you're
on and links here. A slot saved before the site read the wishes asks to be imported again.

Then what's missing for 100%, in the wiki's ten categories: the Tools (with their slot colour),
Crests, Silk Skills and abilities by name, and the Mask Shards, Spool Fragments, Crafting Kit
and Tool Pouch upgrades, Needle upgrades and Silk Hearts one by one. Each thing says its Act and
the area it's in, with the game's names; what belongs to a later Act than yours is dimmed. What's
missing also says **how to get it**, from the game's shops and the wishes' rewards (and the
wiki's boss drops):
- the vendor and the price in rosaries;
- the Pale Oil or Craftmetal it takes;
- the wish, the boss, the challenge, or the fleas rescued;
- the keys it lies behind, by the names the inventory gives them: the Architect's Key for the
  Architect Crest, a Simple Key for the Rosary Cannon (and the Flintslate, unless you go round
  with the Clawline), the White Key for the Whiteward (and the Surgeon's Key for its Silk Heart),
  the Slab's keys for its Mask Shard and Rune Rage.

Under the heading, what the missing purchases cost against the rosaries you carry. The Tools'
note warns of the two traps: the Curveclaw handed over to a Skarr loses its point until the
Curvesickle, and the Silkshot's first repair closes the other two versions.

"Nearest first" orders the missing things by rooms from your bench, the ones with no room after;
the wishes, in the road and in Tasks, by the rooms to where they're taken.

Then **other collectibles**, which don't count for completion, each group saying what it's for:
- Memory Lockets (Crest slots);
- Craftmetal (crafted Tools);
- Pale Oil (the Needle's upgrades);
- the Lost Fleas (the caravan's rewards, and Fleatopia for Act 3);
- the four Old Hearts (Act 3's ending);
- the three melodies (the way to the Cradle);
- the abilities outside the 100%;
- the 49 enemy gauntlets, named as Combat names them.

Last, **Tasks** («Tareas», the game's pane): the main objectives and the wishes on the boards by
type (Wayfarer, Gather, Donate, Hunt, Grand Hunt, Delivery…), 74 in all, each with the game's own
name, its Act and where. The one only Steel Soul has, and the one only Classic has, show only in a
game of that mode. A task done also shows in "Since the previous save".
In a save it shows what's missing, or everything with a tick where you have it; without a save,
the whole list, as a guide. Which piece you have is read from the save one by one, and on the
92 real saves it agrees with the game's own counters (masks, spools, the three upgrade ladders,
the Silk Hearts).

### Pages

The site is one page, and each search it answers has an address of its own, in each language:
the save analyzer, the 100% checklist, the map, the Hunter's Journal, the Tools and Crests
calculator and the damage calculator (`save-analyzer/`, `es/analizador-partida/`…). Each is the
whole site opened on its screen, with its own title, description and a short text with
questions, and `sitemap.xml` lists them. `npm run pages` writes them from `index.html` and
`tools/pages-text.js`; `npm test` fails if one falls behind.

And one page per boss, 51 in each language (`bosses/lace/`, `es/jefes/lace/`): the site opened on
Combat with that boss picked, and a text written from the data, so a patch changes it with
`npm run data && npm run pages`. Its health in each fight (and black-threaded), how many slashes
kill it with the Needle alone at each upgrade (the engine, through the boss's own modifiers),
its attacks with the masks they take, its staggers, where it's fought and what it gives (the
wiki's infobox, by the game's names) and the Journal's description. The damage calculator's
page and every boss page list them all (`tools/pages-bosses.js`).

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
- **Hornet's frames**: running, sitting and standing, extracted from the installed game's own
  sprites by `tools/extract-hornet.py` (`assets/hornet/run.png`, `sit.png`, `stand.png`), shown
  as the rest of the sprites, as a fan project.
- **The benches**: which bench each room has, read from the installed game's files by
  `tools/extract-benches.py` (`js/benches.js`); their pictures are the wiki's
  (`assets/benches/`, `npm run art`).
- **Sprites and icons**: Hornet, the masks, the spool, the five Needles, the benches (`npm run art`) and the
  inventory icons of the Tools, Crests, Silk Skills, abilities and items and the Journal's 237
  portraits (`npm run icons`, fitted into 256 px as WebP) are the game's, downloaded from the wiki and shown as a fan project.
- **The map**: the rooms of the game's own map screen, extracted from the installed game's files
  by `tools/extract-map.py` (`assets/map/rooms.webp`, the rooms that change with the game in `assets/map/states.webp`,
  `js/map.js`), shown as the Hollow Knight
  site shows its map, as a fan project.
- **Fonts**: Cinzel, Spectral and Patrick Hand SC, under the
  [SIL Open Font License 1.1](../assets/fonts/OFL.txt).
- **Code**: MIT ([`LICENSE`](../LICENSE)). It covers only the code, not any of the above.

If you hold rights over something here and want it removed, open an issue or write to
[betorzdev@gmail.com](mailto:betorzdev@gmail.com).

## Contact

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)).
