# Pharloom Calculator — the full guide

*Every screen of the plan is built. This guide grows with the page (CLAUDE.md: keep it up to date).*

## What's on the page

The header has the title under a filigree crown (it leads back to Your game), on the left the
language and **Share**, and on the right the profile you're in (Hornet at a bench; «Select Profile» in Free mode): it opens
**Profiles**. The language is a dropdown, as the sibling's: the one chosen and a chevron (its name,
its code on a phone) open a list of the site's languages, each in its own name; Esc closes it
and the arrows walk it. **Share** copies the site's address, nothing more: no screen, build or
language. The screen bar has six screens in a row, in the order the site matters: Your game, Map,
Progress, Journal, Inventory and Crest.
With a profile loaded, Progress carries your completion and Journal the entries Nuu counts
(`63%`, `120/230`); in Free mode the bar only has the names. On a phone the six don't fit, so
Inventory folds under Your game: while you're in either, a second row under the bar switches
between the two.

**Combat is hidden for now**: the site is about following your game, and it may come back. Its
tab, its pages (the damage calculator and the bosses') and the Map's «Fight it in Combat» are
gone, and a link to it opens Your game. Its section below says what it does when it's on.

Every screen is framed as the game's pause menu frames its panes: a thin filigree line all
round with a curl at each corner, and the screen's name on its top edge in a small plaque with
pointed ends, where the line stops. The frame is lit in the colour of the tab's place in the
game (the Journal Mount Fay's blue, Progress Bone Bottom's green, Crest Bellhart's gold, the Map
Greymoor, the Inventory the Whispering Vaults, Combat Deep Docks, Your game the red, or with a
save the area where Hornet rests), with a
light from its top, so each tab reads at a glance; inside, the black and the white stay. The study and the plan are in `design/00-study.md`; the UI and UX review, step by
step, in `design/03-redesign.md`.

On a computer, Hornet sits on the screen bar under the tab you're on: she is its mark, where a
phone's width draws a rule instead. When you change screens she gets up and runs along the bar to
the new one, at a steady pace, with her own frames from the game (the Run clip, 15 a second).
She's decoration: hidden from screen readers and out of the tab order. With reduced motion she
only sits, placed straight under the tab. Click her and she binds.

Above the language and Share, on the crown's row, **«Hollow Knight ↗»** goes to the sister site,
[Hallownest Calculator](https://hallownestcalculator.com/) (`../hollownest-calculator`), in your
language and in a new tab; on a phone it's on its own line under the title, with the language and
Share at its right (the title's row keeps the title and the save alone). The Knight stands on
the word (`js/app-sister.js`, css `.mh-sister`, `.sis-*`), as Hornet stands on «Silksong ↗» there:
no arrival, he's simply there (Albert, 13 Oct 2026), breathing (the game's Idle at a third of its
speed, there and back). Every 15–25 s (header in view, tab visible) his cloak stirs in the wind, he
looks up, reads his map or focuses soul in a white light; he turns to the mouse over the header and
looks up while it's on the link. A click counts as `sister` with `to: 'hallownest'` (the sister's Footworn id, which its dashboard draws as a villager crossing to that quarter), as on the sibling, and he stays on the word through it, while
the new tab is open and when you come back (his moves' strips are fetched as the page starts, so none
leaves him blank while it comes). With reduced motion he only stands. He's decoration: hidden from screen readers, never under the pointer.

### Profiles

Four profiles, as the game's profile screen («Select Profile»), and **Free mode** (nobody's game: where the site
starts, a New Game you mark by hand, and builds to try). The site speaks the game's words here: a slot is a profile, a playthrough a game, the file a
save file. A profile only comes from the game's save file: **Import Save Data** opens a view that
says where each system keeps its save files (the folder to copy and how to paste it into the file
picker) and takes the file by dragging it in or with the picker. It shows what it read (masks,
Needle, time, completion, rosaries, the Act, the Journal, the Tools) before anything is written.
Any of the game's files works: `user1.dat` to `user4.dat`, the copies from before a patch
(`user1_1.0.29242.dat`) and the game's **auto saves** in `Restore_Points#/restoreData#.dat`, which
are earlier moments of the same game (the preview says the day: «Auto save of …»). The file is read in the browser
and isn't sent anywhere. The site keeps what it read (and, when the game saves while it's followed,
the save before it) in the browser's IndexedDB, and reads it again on each visit
(`js/app-saves.js refreshSlots`, `js/saves.js refresh`): a mark, a check or a count the site
learns after the import (a new kind of mark on the Map, say) shows as the game has it, with no
need to import the file again. Only a profile imported before that copy existed (October 2026) has to
be imported once more. A slot that keeps no copy still has its bought maps' marks: they come from
the `Has<Area>Map` flags it always kept.

Where the browser can (Chrome and Edge: File System Access), an imported profile can **follow the
game**: the site keeps a link to the file and catches up each time the game writes it. After a
reload the browser asks for permission again, and a notice above the screen says so. Not on
Linux: Chrome's picker refuses `~/.config` («it contains system files»), where the game keeps its
saves, so there the file is read once through the plain file dialog and isn't followed. **Clear**
asks the game's own question («Clear Profile?») and only clears the site's copy.

### Your game

In Free mode, the card a profile shows, unlit: «Resting at Pharloom», Hornet in silhouette on
Bone Bottom's bench (the first one) and the four figures waiting, with Import Save Data. Drag your save file onto it and it goes into the first
empty profile.

In a save, a calm scene that says only what no other tab says: **Resting at** the area of the
bench Hornet sits at, the whole screen lit by that area's own colour on the game's map (its
frame too, one light from the top), with **the map of that area** behind it, filling the scene
around her bench, its room right under her (drawn as the Map screen draws it, «Only what the
game shows» included, never smaller than the map's own size, so a phone shows the rooms round
her, and fading out to the scene's edges: a picture, with no marks; the Map tab is where you look
things up); the room's area under the name when it's another (Coral Tower in the
Sands of Karak) and the time played; Hornet sitting on that very bench (each room's
bench is read from the game's files; one it doesn't know shows Bone Bottom's). When the save was
written where the game wakes her at a room's own respawn point instead (a restore point after a
boss or an ability), it says **Your respawn point** over that area and shows her standing with no
bench. On her left, what she is: the Act as the game titles it («ACT 3» over «ABYSS»), and her
masks and silk as the game's HUD draws them (the masks in a row, the spool with its count). On her
right, the Crest she wears with its Tools and Silk Skill in their slots (and the Vesticrest's
beside it), drawn as the Crest tab draws it, smaller: a tap opens the Crest tab. On a phone they go
under her, the Crest last. Under her, **your 100%** as one figure, which opens Progress («What's missing for 100%»;
«Everything in Progress» once it's 100). The site counts as the game does, checked on 92 real
saves (0% to 100%, four patches, Steel Soul): whole masks and spools, not loose shards and
fragments (two shards are still 0%), and a Tool and its upgrade (Curveclaw and Curvesickle) are
one point; if a save's own figure ever differed, Progress says so. With a save loaded, the text
about the site under the screen folds into «About this site».

What the other tabs show isn't repeated here: the parts of the 100% and the road to the next Act
are in Progress, the Journal's count in the Journal (and on the bar), the shards, fragments and
rosaries in the Inventory, the Crest's figures in the Crest tab, and what's missing nearby on the
Map.

When the profile follows the game's save file, each new save the game writes to it (the auto saves
go to their own folder and aren't followed) brings a block **Since
the previous save** under the scene: first what the completion went up by, from and to on one
gauge, and when the save before was made; then everything new grouped by kind under small heads
(Crests, Silk Skills, abilities, Tools, upgrades with their new value, pieces found with their
area, tasks done, gauntlets cleared), each as a row with its picture (a Tool on its slot's
diamond, a piece or a gauntlet with its mark on the Map), its name in the game's lettering and its
area under it, and the Journal entries new or completed as their portraits. A long list shows its
first five rows and «Show all n» opens the rest. The notice at the top says the same in one line.
When you arrive at the screen, or the followed file brings a new save, the rows fade in one after
another (not with reduced motion).

### Inventory

A sheet in two columns, each thing beside what it feeds, and a band under both. Each shelf with
things on the Map (Crests, Tools, Silk Skills, abilities, items, Relics, Mementos) ends its head's
rule in a small round pin, and so do the loose pieces (Mask Shards, Spool Fragments, Memory
Lockets, Craftmetal, Pale Oil) after their count: the Map with only what's missing of it, nearest
to your bench first. On the left, what
Hornet is: **the Needle**, the five upright with their damage, the one she carries taller and lit,
and the Pale Oil under it (the game's flask three times, lit up to how many you've found, spent or not); then **Hornet**: the masks (5 to 10) as the game's masks, in a
row as the HUD draws them, with the loose Mask Shards under them (four make a mask), the silk (9 to
18) as beads on one thread with the loose Spool Fragments (two make a spool), and the Silk Hearts;
then the **Silk Skills** with what each deals at this build, and the **abilities** (Needle Strike
with its damage): the seven of the 100% under the head's count, then the four that aren't (the two
cloaks, Beastling Call and Elegy of the Deep) under «Other abilities» with their own. On the right,
her equipment: the **Crests** (an evolved Hunter Crest drawn as its evolved stage), with the Memory
Lockets that open their slots under them, and the **Tools**: the Crafting Kit and Tool Pouch with their level and the
Craftmetal, three rows alike, then the Tools by colour, each on its slot's diamond (hollow in its colour while you
lack it). There's one slot per point of the 100%: a Tool and its upgrade (Curveclaw and
Curvesickle, Druid's Eye and Eyes, Claw Mirror and Mirrors) share one, showing the one you have,
with two pips under it (had, upgraded), and Shell Satchel shows in Dead Bug's Purse's slot in Steel
Soul. Snare Setter and Needle Phial, which a wish lends and takes back, sit among the reds where
the game lists them, their slot dashed: they don't count, and a line under the row says so. Once
handed back they still show found (here and on the Map: the save keeps them, hidden). Under both columns, what she carries: the **Purse** (Rosaries and
Shell Shards as big figures, the shards out of what your Tool Pouch holds, 400 to 800, with a bar,
and under each what breaks into it, counted, with the sum you would get from breaking it all: the
five Rosary strings and necklaces under the rosaries; the Beast Shards, Shard Bundles, Pristine
Cores, Hornet Statuettes and the Growstone under the shards, the last only in a Steel Soul game or Free mode; and under
both, the **Silkeaters** you hold, up to ten, the grubs you consume to bring your cocoon back); the **items** (the
Everbloom, the Plasmium Gland, the Bellhome's Farsight, Materium and Crawbell, the Hunter's Journal,
the keys, the Old Hearts, the melodies and the fleas: a key stays found once spent at its door, the
Simple Keys count of 4 and the Slab's of 3); the
**Relics** (how many you hold of each kind) and the **Mementos**. Crests, items, what's in the
purse, Relics and Mementos are plates with their name, and under it their count or «Not found
yet». Every head says how many of how many, and its rule lights up that far (complete, its diamond
fills): the Tools count as the 100% does (of 51), the Crests with the Hunter Crest you start with
(of 7); the Relics and Mementos aren't part of the 100%. Tap anything to read the game's own text
under its shelf (the Hunter Crest's is the evolved one's once Eva has evolved it).

In **Free mode** it's your game, marked by hand, and it starts as the game does: a New Game,
with the base Needle, five masks, nine silk and the Hunter Crest, nothing else. A line under the
title says so. On the left, tap a Needle, a mask, a bead of
silk, a Silk Heart or a level (tap the last one lit to take it back). Tap a Tool,
Crest, Silk Skill, ability, an item or key, an Old Heart, a melody or a
Memento to mark it had or not (its text opens under the shelf); a slot a Tool shares with its
upgrade goes none, had, upgraded with each tap. Each shelf has «All · None», and what comes in numbers (loose Mask
Shards and Spool Fragments, Memory Lockets, Craftmetal, Pale Oil, the Simple and Slab keys, fleas, what's in the purse, the
Silkeaters, the Relics of each kind) has − N +, its maximum beside the figure («− 6/20 +»): the loose shards and fragments stop at what the masks and silk
left unfilled. The Rosaries and Shell Shards are typed: Enter or leaving the field
takes the figure, and the shards stop at what your Pouch holds. With the keyboard, the focus stays
where it was through each mark. «Start from»: «New Game» (the
game's own words) takes it all back to the start; «Everything maxed» marks everything, every level
at the top (a game at 100%). Progress counts what you mark, the Map leaves out what you have (unless «Show Completed» is on), and
the Crest screen tries it on «What I have». A visit from before this (when the levels belonged to
the Crest screen's build and started at the top) keeps the levels you moved and puts the ones still
at the top back to a New Game's, without a notice.
In a save the Inventory shows what the game saved, and changes only as you play.

### Crest

The game's Crest screen («Blasón»), laid out as the game's pane. On top, the figures as the game's
HUD: the Needle at its level with the slash large beside it (each attack, for the Crests that
split them); damage per second, the Wanderer's critical hit and the Needle Strike; and Hornet as
the HUD shows her, her masks drawn, the spool with her silk, and what a Bind heals (in a window
too narrow for one row, she goes on a row of her own under the rest). Pointing at a figure shows
how it's made. Under them the levels as the game's upgrade pips, − and + either side
(a pip sets it): the Needle, the Crafting Kit, the Tool Pouch and the Hunter's evolution; and
beside them what depends on the moment: the Hunter's focus, the Beast's fury, Flintslate's buff,
the hit after a Challenge.

Below, the Crest drawn as the game draws it, with its slots where the game puts them (read from
its files, per Crest and per evolution of the Hunter), every piece the game's own sprite at its
size, the Crest's lines in the half grey the game's pane gives them while you browse it. An empty slot shows its sign in its colour; a red or Silk Skill slot's sign says the button
that fires it (a spike up for Tool + up, plain, or down for Tool + down). A slot holding a Tool or
Silk Skill (from a save, in the slot the game has it in) is the game's ring in its colour with the
Tool inside at the game's own size, about the ring's (a Silk Skill as the game's pane shows it,
solid white, here, in the list under the Crest and in the Inventory). A slot no Memory Locket has opened yet shows the game's small grey lock ring in
place of its sign (from a save, as the save says; in Free mode every slot is open). The Vesticrest's slots float
beside the Crest between the game's white brackets, and the Crest's name sits under the Crest. The
Shaman wears a Silk Skill in each of its three slots. A save made while cursed (the Witch's curse,
for a while in the story) shows the Cursed Crest: no slots, a line on what the curse does, and the
figures with silk stopped at 3 and no Bind. In Free mode a
tap on a worn one there takes it off, and the others stay in their slots. ‹ › change the Crest,
and each Crest keeps the Tools and Silk Skills in its own slots, as the game does: back on one, it's
as you left it (the Hunter's three evolutions share one). The Vesticrest's two Tools are shared by
every Crest, as in the game, and stay put when the Crest changes. A Crest not worn yet starts with
what fits of the one you left. A Tool is never worn twice, nor with its twin, across the Crest's
slots and the Vesticrest's. Only what has a slot counts (on «What I have» without the Vesticrest,
its Tools are left out until it's there). From a save, what the
Crest's own slots don't hold is on the Vesticrest's, where the game has it. Beside it,
the Tools and Silk Skills you have (as the game lists them; in Free mode, all of them, or on «What
I have» what the Inventory's marks say, with a line to the Inventory while no Tool is marked), by colour, each on its slot as the Inventory draws it, the
slot filled and lit when it's worn: a tap puts one on or takes it off,
and pointing at one (or at a slot) describes it underneath with the game's words and its numbers
(damage per hit, uses at the Pouch's level, a full load, the shell shards to refill it; a Silk
Skill's damage and silk), as if it were worn when it isn't. A Tool and its upgraded twin (Claw
Mirror and Claw Mirrors…) are never worn together, as in the game: putting one on swaps the other, on the Crest or the Vesticrest. Silkshot is the one the game repaired
(the Original, the Twelfth Architect's or the Forge Daughter's: a save says which), with its own
picture, words, damage and uses.

The damage is the wiki's model: the weapon's damage at its level times (1 + the player's
modifiers, which add) rounded half to even, per hit; Tools scale with the Crafting Kit, the rest
with the Needle; no player modifier reaches a Tool. In a save, the build is what Hornet wears in
the game, at its levels, and it's read, not changed (the moment can still be switched): to try
builds, Free mode, where the build is kept in this browser. There «Try with» picks what it's tried
with: **Everything** (every Tool, Crest and Silk Skill at hand, and the build's own levels, at the
top to start with) or **What I have** (your game as marked in the Inventory: its levels, the
Hunter's evolution, the Vesticrest's slots Eva would have given it for the Crests and Memory Lockets
marked, and only the Tools, Crests and Skills you have). On «What I have» the levels set here are
your game's, and Combat fights with that. A link with a build always opens on «Everything». The
moment's switches (focus, fury, Flintslate, a Challenge) aren't in the link, but a reload keeps them;
the Hunter's focus starts on, as it does with a save.

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

The address bar carries the build: copied, it opens the build on screen as it is. The
link is readable (`#v=1&crest=architect&needle=4&tools=straight-pin,compass…`) and carries only
what differs from a Hunter with nothing: in Free mode the address always says the build, the Crest
worn's (the other Crests' Tools stay in this browser). A link
with a build opens it in Free mode; if you were in a save, the page goes to Free mode and says so.

### Journal

The Hunter's Journal. On top, the count for Nuu's Hunter's Memento as a ring (230 required, 231
in Steel Soul; the bright arc is what's complete, the dim one what you've seen), and beside it the
four entries you're missing closest to your bench, with how many kills to
go. Under it, the 236 portraits (237 in Steel Soul) **by area**, the areas with the most missing
first and each with its count (6/20) and a small round pin, which opens the Map on the rooms of
that area where its entries not yet complete are met, or **in the Journal's order**; entries with no
place go last, under "Elsewhere". Beside the search, two choices in words under their labels: **Show** "What's
missing / Everything" (with a save; Free mode shows everything) and **Order** "By area / Journal
order". The search finds entries by name (in either language) or by area (in the page's), with or without accents; while
it has text it looks through the whole Journal, what's complete included. Each portrait
sits in a ring that fills with its kills and lights up once complete; one not seen yet is in
shadow in a dashed ring («???»), and the six optional ones carry a small diamond. Tapping one
opens its page as the game's Journal shows it (from the foot on a phone; Esc or a tap outside
closes it): the whole drawing, from the game's files, on a soft light and at the size the game
draws it (a Mossgrub small, the Bell Beast filling it), so you know the bug when you meet it; one
not seen yet is in shadow. Beside it the name, the kills, its areas and the nearest from your
bench (with the pin the lists carry, which opens the Map on every room its enemies are in, how
many in each, with ‹ › to go through them, with a save or without, complete or not; a room
your game's Act doesn't have them in, or where only a gauntlet's waves brought them and it's won,
is dimmed, and each room's card says when it has them: Act 3 only, gone when Act 3 begins, or
only in a gauntlet's waves), the description, and under the Hunter's symbol the Hunter's note once complete, or the
game's «Defeat 11 more to complete the hunter's notes.» (the Void Tendrils has no kills: it says «Completed by inspecting its rune-scroll.» instead). An entry is complete when the save lists it
with its kills done: the game writes them even for the entries it completes another way, and on
the saves where Nuu has given the Memento the site counts all 230. In Free mode, the whole
Journal.

**Where**: each entry says the places it's found, the most first, from the game's own files: for
208 of the 237, the areas its enemies are placed in; for the other 29, which the game makes as you
play, the rooms of what makes them: a boss's arena, the waters where the Muckmaggots are on, each
Sandcarver's pit, the cocoons and corpses that let Gloomsacs, Winged Lifeseeds and Shellwood Gnats
out, the Void Mass's cores, and for Shakra and Garmond & Zaza the room of their duel. Lost Lace's
arena and the Bell Eater's aren't on the map, so they count as the rooms that take you there: the
Abyss's dive, and every Bellway station. In a save, also the nearest one from your bench,
and with no entry picked the pane lists what's missing closest, with the kills each still needs;
tap one to read it. Nearness goes by the game's doors, the Cogwork Core's lift to the Cradle and
the stations you've opened; Verdania, the Mist and the caravan by the ways the game decides as you
go, and a memory (the Coral Tower's, the Hunter Queen's) from the room you enter it from. Only the
Red Memory, which isn't on the map, has no place and no distance.

### Combat

*Hidden for now (see above): what follows is the screen as it is when it's on.*

Your build against one enemy, as a duel: Hornet and the enemy face to face, each on the
Journal's light (the enemy as the Journal draws it whole), between them the slashes that win and
the fewest of its hits that take you down, under Hornet her masks and under the enemy its health
as a bar, with a tick where each phase starts; then the quickest way in one line, your attacks as
cards (the one that needs fewest framed; pointing at one shows how its damage is made) and its
attacks with their masks drawn. The enemy is picked in a dropdown over the duel (search in either
language, accents optional; bosses first). Everything else is folded under «How it's worked out».

The fight can be played out, as on the Hollow Knight site's arena: tap one of your moves and its
damage comes off the enemy's bar; tap one of its attacks and its masks come off yours. Your moves
come in groups: the Needle (the slash, the Crest's down- and run-slashes, the Needle Strike, the
Challenge, which arms the next slash with +50% if there's a strand to swirl), silk (your Skill),
the Tools (their uses at your Pouch's level; Flea Brew, Flintslate and the Plasmium Phial work for
their seconds or add a mask) and Wait, which only shows when something will happen and jumps to
it. With the Wanderer, a Critical button beside the slash: you decide when it comes.

A clock counts what your moves take: a slash at your Crest's pace (faster under Flea Brew), the
Needle Strike its charge, a Bind its time; Skills, Tools and the Challenge count 0 s. On it run
Silk Hearts' silk, the Wispfire Lantern's wisps and what wears off. The Bind opens a window until
your next move (or «Done»): a hit inside it loses the heal and every strand on the spool, as in
the game; the Warding Bell stops that hit and strikes, but the heal is still lost. The Claw
Mirror strikes when a Bind ends; the Reserve Bind pays one; the Beast's Bind is fury (a mask back
per slash) and the Reaper's makes your slashes drop silk. The Hunter's focus builds with 6 slashes
(and 6 more evolved) and goes when you're hit. A hit takes the Plasmium masks first; the Fractured
Mask leaves you one mask once; Druid's Eye gives silk; the Memory Crystal strikes back.

Bosses stagger as the game's own files say: each hit adds its stun (a slash 1, the Wanderer's 0.8,
a Tool's often less), and it goes down at the hit after its maximum or after a combo of hits each
under a second apart; down for its seconds (usually 2), each hit shortening it, and its attacks
can't be played meanwhile. Its bar counts towards both. A boss of two (the Forebrothers) shows
both bars and you pick who you hit; when one falls the other may heal. Father of the Flame is four
lanterns, then its core; the Dancers and Grand Mother Silk a bar per phase. The log, under your moves and
its attacks, tells the fight in three voices (you, it, the fight); Undo (or Ctrl+Z) steps back, Start over begins again, and
the end is titled with the fight in figures (time, damage per second, moves, masks lost, silk
spent, Binds). When the duel scrolls away, a band keeps it in sight under the bar. A different
enemy or build starts it over.

The enemy gauntlets are played the same way, as one fight: each wave comes after the last, each
enemy of it a bar (you pick who you hit; each takes your damage with its own modifiers) and its
attacks grouped by enemy, while your masks, silk, Tool uses and the clock carry from wave to wave.
Above the duel, the arena's name, area, health and reward (and, with a save, whether you've cleared
it); its waves one by one fold under «How it's worked out».

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
(the water, the sand pits and an entry completed from a rune-scroll), so they aren't in it.

**Enemy gauntlets**: the other half of the screen, the game's 49 arenas of waves, each named by
its place or its area, with its reward (the game's name for it, when it gives something the game
names; when the wiki says none but the arena drops a pickup once won, that one: the Whispering
Vaults' second, the Acolytes', drops a Heavy Rosary Necklace). For each wave, its enemies with their health, your slash's damage against each and how
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
it swaps to twice the resolution. The last button, the four corners, takes it to full screen (Esc or
the same button leave it; where the browser can't, it fills the window). On it: a search at the top left and the zoom at the top right.
The search finds any area and anything on the map by name (a piece, a Tool, a boss, a shop, an
NPC, a Journal entry), each with its layer and area under it: pick one and the map shows only
that thing, as a focus of one (its name and area in the search's place, «Return to the map» back
to the whole map, with its layer switched on), centred on its mark as drawn, its card open and a ring pulsing on it
three times. An area's name centres the map on it with its ring. With the whole map in view, an
area name that would fall on another waits for the zoom (the larger area's stays, by its rooms);
on a phone the area names show only zoomed in.

Under the map, **What the map shows**, as the Hollow Knight site has it: «Show all · Hide all» on
its right, and «Only the 100%», which turns on just the layers that count for completion (the ten
categories the game counts: Mask Shards, Spool Fragments, Silk Hearts, the Needle, Tool Pouch and
Crafting Kit, the seven abilities, the 51 Tools, the Crests, the Silk Skills and the Everbloom), then
«Up to · Act 1 · Act 2 · Act 3» (on a phone, a line of its own), the three Acts on a thread lit up to
the one picked, your game's Act ringed («You are here» on hover): up to an Act, the map shows only
what can be had by then, nothing of a later Act; up to Act 3 is everything. A mark goes by its own Act (the one its card
says) or its room's, the later: a room's is the first Act it can be entered in, worked out on the
game's doors (the Citadel and what the Clawline or the Faydown Cloak opens, Mount Fay, the Sands of
Karak, Wisp Thicket and the Putrified Ducts, are Act 2's; the Abyss, Verdania, the destroyed Cradle
and Cogwork Core Act 3's), so a bench or a cache with no Act of its own goes by its room. A main
objective's pins take its Act in «Tareas» (Beast in the Bells, at any Bellway station: Act 3), a
Wishwall or someone who offers wishes their first wish's, and someone in a room only Act 3 has them
in, Act 3 (Gilly's Act 3 rooms, Ballow at the Diving Bell). With a save
the Map opens on its Act; Free mode on Act 3. What you pick is kept for that profile while its game
stays in that Act, and once the save reaches the next Act the Map follows it there. A layer with
nothing up to the Act picked is greyed, its count 0. Then «Whole map» with a save, on at first (see
below), the area names on or off, and «Show Completed» (the game's own words for the switch on its
Wishes pane), off at first: on, what you already have comes back to the map too, each mark
dimmed with a green tick on its corner, whole again under the pointer or once picked, its card
saying how it was had; the search finds it too. In Free mode it brings back what you've marked.
What the game has taken away from your game goes with it, dimmed the same with a grey cross where
the tick goes, its card saying «No longer there» and why: what the game swaps out when Act 3
begins (rosary strings, shard caches, walls and doors of a room's «before» state) in an Act 3
game that didn't get it, the other arena of the Slab's pair once you've fought one, and Grindle's
cell door in the Marrow once he's left it by himself (Shellwood or Far Fields reached, or Widow
beaten, before it was broken). What only
one mode has (a silkeater outside Steel Soul, a wall only in it) isn't on the other mode's map.
Then eleven groups, each a row that folds (its caret; all open
at first, only the first two on a phone, then as you left them) whose title is the switch for the
whole group, in ink when all of it is on, dimmer when part, dimmest when none. Inside, each layer's
switch is the game's own picture of it, grey and faded when off, its name dimmed too. Beside each, how many: in a save, had of
the total (a layer complete in green); for places and people, which aren't had, how many there
are; in Free mode, the total. They count things, not marks: the marks that share one save check
(the two places one map or key may be found in, a Flintbeetle's two, the Silver Bells of one wish, the Bell Beast's
spots) are one. A group's title counts its layers the same way, all but your cocoon, so «Your game»
counts as its Journal does.

What counts for the 100% is in the first two groups and the Everbloom, each thing in the room where
it's had: lying there, at the shop that sells it, with whoever hands over a wish's reward (Shakra
in Bilewater for Trail's End's Throwing Ring, the Pinstress atop Mount Fay, Sherma in the Whiteward:
the card says who gives it and where the wish is taken), else at the Wishwall or with whoever gives
the wish, in its boss's arena, with the person who gives it. All of it on at first, and what leads to it too
(Memory Lockets, Lost Fleas, Old Hearts, Melodies, Craftmetal, Pale Oil), though «Only the 100%»
leaves those off.

- **Upgrades**: Mask Shards, Spool Fragments, Silk Hearts, the Needle, Tool Pouch and Crafting Kit
  upgrades (each Needle upgrade a mark of its own, named by the Needle it gives: the Sharpened Needle, the
  Shining, the Hivesteel and the Pale Steel Needle; in Act 3 Plinney leaves Bellhart, and until you
  rescue him in Shellgrave, he and the upgrades you lack are there, their card saying so; with no
  save, both places), and the **Abilities**, one switch whose round caret opens the seven of the 100% and,
  apart, the four **outside the 100%** (on at first too): Drifter's Cloak and Faydown Cloak, and the
  two Needolin melodies of Act 3 (the Beastling Call, under Bellhart once the Bell Eater is beaten;
  the Elegy of the Deep, from the Snail Shamans), each card saying it doesn't count.
- **Crest** (the game's pane where they're equipped): the **Tools**, one switch whose round caret
  opens them by the colour of their slot (red, blue, yellow) and, apart, the five **outside the
  100%** (off at first): the upgrades of three Tools (Curvesickle, Druid's Eyes, Claw Mirrors),
  which add nothing to it on their own, the Needle Phial a wish lends and takes back, and the Snare
  Setter, found in Weavenest Atla and given up for Silk and Soul, both found once had even after
  handing them over. The Dead Bug's Purse is the Shell Satchel in a Steel Soul game (the game lays
  one or the other in the Wormways): one mark, named and drawn as your mode's, the purse's card in
  Free mode saying Steel Soul has the satchel there. A card says what a thing waits on that your game
  lacks: a key, or an ability (the Threefold Pin lies where the Needolin's memory in Greymoor
  brings it). A card's area is the one its mark's room is in. Two Tools a
  shop sells lie in another room once the seller dies before you buy them: the Curveclaw in the
  room above the Mottled Skarr's corpse, past its gauntlet, and the Weighted Belt by Mort's corpse
  in Act 3. With a save the mark is where your game has it (the shop while the seller lives or
  once you bought it there); with none, at both, counted once. So does what Grindle sells only in
  Act 3 and you could have had elsewhere before, each in its own layer (Pebb's Mask Shard,
  Craftmetal and Magnetite Brooch, Mort's Memory Locket and Tool Pouch, Lumble's Magnetite Dice):
  Act 3 empties those three rooms, so it also has a mark at Grindle's in the Blasted Steps. With a
  save in Act 3 it's there alone while you don't have it; before Act 3, or once had, where it was;
  with none, at both, counted once, Grindle's saying Act 3 and his price. The Silkshot is repaired
  from the Ruined Tool at one of three places, and the first repair closes the other two: the rune
  in Mount Fay (the Original), the Twelfth Architect and the Forge Daughter, each a mark with its
  version's picture and its own way, and the Ruined Tool itself where it lies in Bilewater, its
  card naming the three («See the three»), all counted as one Tool. With a save that repaired it,
  only the place it was repaired at, had; before that, every place, the Architect's crossed once
  he has left for good (and his shop with him); with none, all four. The Flea Brew is Grishkin's,
  the troupe's, given at the Flea Caravan's stops after the Marrow: with a save, at the stop your
  caravan is at (Greymoor while it's still in the Marrow); with none, at the three, counted once.
  Then the
  Crests, **What Eva gives** besides Sylphsong (off at first): the Hunter Crest's two evolutions and
  the Vesticrest's yellow and blue slots, each with the slots it needs across your Crests (the
  Hunter's aside) and, with a save, how many you have open; and the Silk Skills.
- **Collectibles**: Memory Lockets, Lost Fleas, the Old Hearts, the Melodies and the Everbloom
  (on at first), then, off at first, the relics, one switch for the six (Bone Scrolls, Weaver
  Effigies, Choral Commandments, Rune Harps, Psalm Cylinders, the Arcane Egg) whose round caret
  opens them one by one, Mementos (the seven found somewhere: the Heart Memento is whichever Old
  Heart The Old Hearts doesn't take, so it has no mark) and the Bellhome's furnishings (the five
  bought at Frey, and the Materium, Farsight and Crawbell built there once found, at the
  Bellhome's door: their Key items marks are where each lies). Their cards say how each is had: who
  sells it and for how much, and what the shop waits for (Jubilana's Choral Commandment after The
  Lost Merchant, Grindle's Psalm Cylinder, Frey's furnishings: the Bellhome entered, a relic sold
  to Scrounge, the Vaultkeeper's collection, the Desk), the fight that drops it (the Grey, Hero's
  and Craw Mementos), who gives it (Nuu, the Hunter's), the challenge that awards it (Seth's,
  Sprintmaster Swift's, the Far Fields Rune Harp's speed challenge), and the Shellwood Weaver
  Effigy, through the Chapel of the Witch after Rite of Rebirth. The Vaultkeeper's Melody is with
  Cardinius, who plays it once you bring him the Sacred Cylinder of the Whispering Vaults; the
  cylinder has its own mark where it lies, among the Psalm Cylinders, with its own name and icon,
  and each card has a button to the other. Two
  things move in Act 3 if you don't have them yet, and have a second
  mark there saying Act 3 and why: the Memory Locket of «Volatile Flintbeetles» lies in Survivor's
  Camp while the wish isn't granted, and the Aknid carrying Mossberry no. 3 moves one room east.
  With a save the mark is where your game has it (the Act 3 room in Act 3 while not had, or once
  the locket was picked up there; the first room otherwise); with none, at both, counted once.
- **Items**: Craftmetal and Pale Oil (on at first), then, off at first, Mossberries, Silkeaters (each drawn as the item), the
  **Maps**: the fourteen area maps had in a room, found lying there (the Weavenest Atla Map, the
  Slab's…) or sold by one of the Citadel's map machines (its card says for how many rosaries), each
  gone once your save has it. The Cradle's has two marks, one per Act: its machine in Act 2 (crossed
  out in an Act 3 game, which can't reach it), and in Act 3 the map found free by the broken
  machine by Ventrica's Terminus. The fourteen Shakra sells have no mark of their own
  (they'd sit on her), her card says which you lack. And the **Rosaries** and **Shell Shards** lying in a
  room (strings, necklaces, Shard Bundles, Great Shards, Pristine Cores), each by its own pickup
  (one an arena drops once won says which: the Whispering Vaults' Heavy Rosary Necklace, the
  Cogwork Core's Pristine Core), and the ones given: the Fixer's Hornet Statuette in Bone Bottom and the Sprintmaster's two race
  prizes (a Rosary Necklace and a Beast Shard).
  And the **Key items** lying in a room (the Cogheart Pieces, Farsight, the Materium, and the
  Crawbell, after the Court of Craws; the Ruined Tool goes with the Silkshot, among the Tools).
- **Places**: benches (off at first: there are 82, the game's own bench pins, the Songclave's, the Bellhome's (dimmed until the house is unlocked) and the Border Caves' (dimmed until Act 3),
  which its map doesn't pin; the Flea Caravan's two of its own, in Greymoor and the Blasted Steps,
  only while your caravan is there), Bellway and Ventrica stations (dimmed while
  your game hasn't opened them: a station not unlocked, a toll not paid), the **Flea Caravan**
  itself (the game's own pin for it, on at first): with a save, one mark at the stop your caravan
  is at (the Marrow, Greymoor, the Blasted Steps or Fleatopia), dimmed until you've seen it; with
  none, at its four stops, as a guide. The six Bellshrines (the Grand Gate asks for five of them;
  the Songclave's is the sixth), the Vendors (the game's map key) and **Shakra**'s spots, she
  being one of the game's shops too, her card saying which of her maps you lack. She moves on as
  Hornet does: with a save, only the spots she's still at show, by the game's own rules (gone from
  an area once she's been seen in another, or once Hornet's past it; her rests in Bone Bottom and
  Bellhart; in Act 3 the guard post or rest the save names; none while Trail's End is taken). In
  Free mode, all seventeen. The shops are the
  game's own (its ShopOwners: Pebb, Frey, Mort, the Forge Daughter, Grindle, Jubilana, the
  Mottled Skarr, the Twelfth Architect, Shakra) and those who trade outside them: the Couriers' delivery
  wishes in Bellhart, the Moss Druid, who buys Mossberries, Creige's drinks and Scrounge, who buys
  the relics.
  The switches are named as the game's own map legend names them, one thing each (Bench, Bellway,
  Vendor, Ventrica, Bellshrine), and a Ventrica station by its name in the game (First Shrine,
  Terminus, Choral Chambers…) with «Ventrica» under it.
- **Passages**, off at first: what opens a way and stays open, each read from the game's own
  scenes with the bool your save keeps once it's open, so with a save only what's still shut
  shows. Levers (with the pressure plates and Clawline's pull switch), gates (opened by a lever,
  from one side, or pulled open with Clawline; the Slab's jail gate, struck open from above after
  the Cloakless fight, is open too once the Broodmother's hunt is taken, the room then having no
  gate at all), the doors a key opens (with the key each takes;
  the Slab's locks and cells among them), shortcuts (the one-way walls, planks, ladders and floors
  that break from one side) and the two silk walls Silkspear cuts in Mosshome. The doors the
  Needolin opens aren't there: they open each time and the save keeps nothing of them, and neither
  are the gates a battle shuts and opens again, or what the game never switches on. Some
  levers, gates and walls the save keeps by a flag of its own rather than per room (the Bellhome's
  door among them): they're there too. A way is open by whatever your save keeps of it: its own
  bool, the flag its lever or plate sets instead, the other lock of the same cell door (only the
  side you use saves), or the flag that takes it away (Mosshome's two silk walls go once the Bell
  Beast is beaten, whichever you cut, and the walls of a shortcut that opens from either end go
  with it). **Keys**: the Simple Keys, the Slab's three and the
  Whiteward's two, where each lies, and the two an NPC gives: the Diving Bell Key (Ballow, in the
  Deep Docks) and the Bellhome Key (Pavo, in Bellhart). And the **Lifts**, gone once your game has
  called each.
- **Fights**: the enemy gauntlets and bosses not beaten yet, each fight its own mark (Lace atop the
  Cradle, the two Moss Mothers of Weavenest Atla, the Act 3 Moss Mother and the Savage Beastfly
  of the Far Fields too), each boss where it's fought (Moorwing at Bellhart's east entrance, the
  Second Sentinel in its High Halls arena), and the Skull Tyrant's return to Bone Bottom, which the
  game may send in Act 2: with a save, only once it's on its way or beaten, and crossed («No longer
  there») in Act 3 if you didn't beat it; in Free mode its card says it may come back. A gauntlet won by beating its boss (Lugoli's, Groal's,
  the Coral Tower's four that end in Khann…) is that boss's mark, its waves and reward on the
  boss's card. And the Void Masses' cores (the two in the Dustpens' Act 3 arena only in a normal
  game: Steel Soul has none there). The other enemies that don't come back (Rhinogrunds,
  Covetous Pilgrims, Shardillards) are found from their Journal entry, whose pin shows every room
  they're in. A wish done by a boss's fight (Fatal Resolve, the Pinstress on Mount Fay; the end of
  A Vassal Lost, the Summoned Saviour; Pain, Anguish and Misery, Tormented Trobbio; Final Audience,
  the Second Sentinel; Hero's Call, Lost Garmond) is on that boss's card, not a mark of its own,
  with the way to where the wish is taken while it's open. Fatal Resolve is taken at the note the
  Pinstress leaves in her home in the Blasted Steps (Bellhart's Wishwall, once you have Silk Soar,
  only sends you there): with its Wishwall part taken, the way goes to her home. Moorwing, if
  you enter Bellhart without beating it, waits by the Greymoor Bellway from Act 2: with a save that
  says so, its mark is there; with none, at both. The Bell Eater is beaten when you win its fight
  (the Beastling Call), not when it first shows; while it waits for you, its mark is at the Bellway
  your save names. A fight the game only puts there once something holds says so on its card, and
  with a save whether yours has it: the wish that brings it (the Broodmother, the Far Fields Savage
  Beastfly, Gurr, Lost Garmond, Tormented Trobbio, the Second Sentinel, the Pinstress atop Mount
  Fay), the wish granted first
  (Shakra's duel, after Trail's End), the Drifter's Cloak (the Fourth Chorus), the Vaultkeepers
  freed (the Whispering Vaults' second gauntlet).
- **People**: who gives something of the 100% (Plinney, Eva, Pinstress,
  Loddie, Lumble, Mooshka), each with their own figure and a small herald on its lower right, so
  the mark still says they give a thing of the 100% (Eva, with no figure, is the herald alone). **Everyone else** (off at first): every
  other person the game's scenes place, 44 of them, each in one switch only, with their own figure
  from the game's sprites (tools/extract-people.py; the Last Conductor, whom the game draws only as
  a black shadow, keeps the herald), named as their title card names them. With a
  save, those you haven't met yet are dimmed, but only when the save has a flag for it: the ones it
  says nothing about are never dimmed by guess. Who moves shows only where the save says they are
  now, each spot by the switches the game turns it on with (the flea troupe at its camp, Kratt
  strung up in Greymoor until he's back, Nuu outside a boss's room or at home, the Second Sentinel
  resting where he's sent until you meet him there, Pilby, the Chapel Maid, Ballow from the forge to
  the sauna and the diving bell, Gilly, Sherma, the Songclave's pilgrims by its level, Seth at the
  Flea Festival); who has left, died or isn't there in Act 3 is gone. Where only a script of theirs
  decides, the spot stays (Garmond comes and goes, and his card says so; Mister Mushroom, Seth's
  other rooms, the Green Prince caged). In Free mode, everyone everywhere.
  Each person once in a room: where another mark already stands for them (who makes a wish, a
  boss, the Herald's spots), Everyone else doesn't draw them again; Jubilana is her shop.
- **Tasks**, as the game's pause menu calls its wishes and objectives: the Wishwalls and who makes
  a wish, by name (with a save, only while one is still open there; who already has a mark
  there, a shop or who gives something of the 100%, has the wishes on that card instead, and who
  offers a wish in someone else's room has a mark of their own: Nuu in Creige's Halfway House); where a wish is granted (the
  deliveries and the Steel Sentinel's spots where the game's own map pins them, of the Sentinel's
  six only the three your game chose, and only in Steel Soul; the Herald's seven, only the next one
while the wish is on, as the game shows him one at a time; the rescues and
  fights, in the room where the game ends the wish); what a wish asks for (the 30 things lying in a
  room, given or played there: the Pollip Hearts, the Flintgems, the Grand Hunts' trophies, the
  Gourmand's five delicacies (the Mossberry Stew where the Moss Druid hands it over, the Courier's
  Rasher where Tipp & Pill sell it, each done once given to his servant), the three souls, the Twisted Bud, the Steel Spines, the three Plasmium
  buds of Alchemist's Assistant in the lower Wormways, each done once the Needle Phial has drawn
  its Plasmium, as the save keeps it; Ecstasy of the End's three Flea Games at their hosts in the
  festival, each done once your score is past the champion's, as the game reads it from the
  highscore it saves; and the fourteen
  spots above and below Bellhart where a Silver Bell may drop, gone once their wish is granted); and the main
  objectives, where the game's map pins them (an objective's steps the game pins on one spot are
  one mark, with the Act of its first step, its card listing the steps in order, with a save which
  are complete and the one you're on; the Bellshrines, Old Hearts and Melodies are already
  layers of their own; Beast in the Bells has one pin per Bellway station, and the game's
  thirteenth, under Greymoor for a station cut from the game, is left out, as the game never
  shows it; with a save where that wish is taken and not yet granted, only the station the Bell
  Beast waits at shows, as in the game, all twelve before it's taken and in Free
  mode, and none once it's granted, though it still counts as had: one thing on the count). Each is done as your save says: the wish granted, the objective complete
  or a later step of it (Pale Monarch stays incomplete when Act 3 opens through the Soul Snare), a
  thing picked up, held (when it lies in one place only: each Pollip Heart and Flintgem goes by
  its own spot) or its wish granted. The three Flintgems drop from three Flintbeetles, and one of
  them has two places, one mark each, counted once: in Bone_04 while the Marrow's trapdoor
  shortcut is shut, in Bone_06 once it's open (the game reads it when the beetle appears); its
  card says so, and with a save only the place your game has it in shows (where its gem was picked
  up, else by the shortcut), both in Free mode. Off at first.
  The hunts whose things only enemies give while the wish is taken (Garb of the Pilgrims,
  Flexile Spines, Crawbug Clearing, Roach Guts, Fine Pins, Cloaks of the Choir and Advanced
  Alchemy) have no marks: the card of their Wishwall or of whoever asks has «Where to hunt: …»
  for each one still open, which shows only the rooms where those enemies are, one Journal
  portrait per room, the room with the most first, stepped with ‹ ›. Each room's card says what
  the enemy gives there and for which wish, and with the wish taken how many you have of how many
  («You have 7 of 12»). In Progress, a hunt taken and still short has its pin open those rooms,
  the nearest first. Broodfeast's organs come from any enemy a Tool kills, so it has none.
- **Secrets**, off at first: the rosary and shell shard caches (not the four ant strings and the
  Deep Docks chest that only hold an item: that item has its own mark), the breakable walls (the
  one-way ones are among the shortcuts; Bone_12's two cell doors, struck open with no key, among
  them; each wall its own mark, even where breaking one breaks the next, as three in the Sands of
  Karak do), the loose rosaries (one bead, cut from the game's picture of
  the Rosaries, so they don't look like the caches) and the **Hidden corners** (what
  covers part of a room until you walk in, one mark per room, gone once all of it is uncovered: a
  cover inside a breakable wall counts once the wall is broken, one the game takes away once it's
  gone, and one only the other mode has isn't asked for), so many
  that they're drawn one by one only close up; from afar, one mark per room and kind, with how
  many in its corner. Marks that would cover each other step a little apart, more the closer you zoom.
  And the **Silk cocoons**, the small ones beside the Silkeaters, which give a little silk when struck.
- **Your game**, with a save: your cocoon, where you last fell, at the spot the game's own map
  marks it (on at first; one in an arena the map has no room for, the Bell Eater's or Lost Lace's,
  goes to the room that leads there), its card saying how many rosaries it holds, and the Journal's
  entries still missing, where the enemy is in the room where each is found in your game's Act:
  where it roams then first, else a gauntlet not yet won whose waves bring it, else the first room
  it's in (the game keeps some enemies to the world before Act 3 and others to Act 3's; a gauntlet's
  waves come once). An entry no room has before Act 3 says Act 3. A boss's entry is its boss's mark
  already, and the Void Mass's its own switch's, not drawn again; they're counted as the Journal
  counts them: every entry. The Wingmoulds, in the Red Memory the map has no room for, are at the
  room that takes you there.

Each mark is the thing's own picture on a dark disc with a thin rim, as the Hollow Knight site
draws them, over a pale plate so a dark portrait reads, about the same size at any zoom, a little
bigger close up. Every picture shows at the same visible size, whatever margin its file carries: its
opaque part is measured (tools/fit-marks.py, js/mark-fit.js), centred and drawn at 0.8 of the disc,
or smaller where it would cross the plate; the selector under the map and Your game's lists measure
them the same way. What has no picture of its own takes one of the game's: Shakra's Journal portrait, a key of the
inventory for the keys, the pause menu's Wishes tab for a Wishwall, a wish's emblem for who
asks for one, the herald's emblem for who gives a thing of the 100% with no figure (Eva; on the others' figures it sits small), the game's Bellhome bench pin
for its furnishings, the Citadel's brass lever for the levers and a Docks plate for the pressure
plates (tools/extract-map-icons.py takes them from the game's files). The breakable walls keep a
drawn sign, bricks: the game's walls are tall dark rock that doesn't read that small; so do the
gates (bars), the locked doors (a padlock: the game has none, and the Slab's key is the Key of Indolent's), the shortcuts (an arrow through a wall) and the silk walls (threads). It sits where the game
has the thing in its room: the pickup lying there, the NPC, the shrine, the cache (the object's
place in its scene, put on the map by the game's own rule for Hornet's compass and her cocoon;
checked against the benches, which fall by the game's own bench pins). What has no object of its
own sits where whoever stands for it is: Shakra and the vendors where they stand, and what they
sell with them; a wish's reward with whoever hands it over, else at its Wishwall or at who offers it; a boss where
it waits in its arena, and what it drops there (one the game makes there with no record of its own
on the arena it shares with another boss, Tormented Trobbio on Trobbio's stage; one fought in a
place the map can't draw at the game's pin for the objective it ends, Lost Lace at the dive in the
Abyss); a gauntlet at its arena; a lost flea in its cage.
What's inside a room the map doesn't draw (an interior: Plinney's house, the Bellhome, the Skull
Cave) sits at the door it's entered by, the game's own door in the room around it; one with no such
door, or a room drawn as a point (a bench's own room), stays at that room's point, as on the game's
map. Things on one point gather in a small grid around it. The map is drawn in SVG, so it
stays sharp as you zoom.

With a save the map shows only what you're missing; in Free mode, what your marks say is missing
(everything, as a guide, on a New Game). Tap any mark for its card (above the mark, or below it
when above it would cover the search or the zoom): what
it is, where (its area, and the first Act it can be had in there; what only Act 3 has says Act 3:
the Abyss, Verdania, the destroyed Cradle and Cogwork Core, the Border Caves and the Nameless Town,
and what lies only in a room's Act 3 state, as the rosaries in Mort's room once he's gone; a cache,
a wall or a door with no Act of its own says none), how it's had, and what it says of your game. A
shop's says what of the 100% it still has for you (and the wishes it asks, if it does), Shakra's which maps you lack, a Wishwall's or a
wish giver's the wishes still open, a wish's place or thing which wish it's for, whether it's done
and a button to its Wishwall or to who asks for it, a boss's whether it's beaten, with «Fight it in Combat» and
«See in the Journal» (and its gauntlet's waves and reward, if its fight is one); a gauntlet's its waves and reward; a Journal entry's its kills. In Free mode
a piece's card marks it had; a Mask Shard, Spool Fragment, Silk Heart or upgrade of the Needle, Kit
or Pouch follows the Inventory's levels instead, as on Progress, and its card leads there. Tap an area's name for its card: the rooms of it you've visited,
and what's left there of the 100%, the Journal and the gauntlets. The map names the areas of
more than three rooms, and a smaller one that holds something of the 100% (the Songclave), so the
cards' «For 100%» add up to what «Only the 100%» shows.

Other screens open the map on a thing: «See on the map» on each missing row of Progress and on a
Journal entry, and the buttons on a card that go to someone else's mark. One thing is shown alone,
as the search does: only its mark, whatever the switches and «Show completed» say (what you have
dimmed and ticked as always), centred on it, its card open and a ring pulsing on it, and a line in
the search's place with its name and area and a «Return to the map» button back to the whole map
(on a phone the line takes the whole width, the name beside the zoom's buttons and never cut: it
wraps, the area under it, and the button on a row below). A step of Progress's road
opens it on all that's left of the step at once («See the 2 on the map»: the Bellshrines still to
ring, the snare's pieces, what's next for Silk and Soul, each wish where it stands now as its own
pin has it: its giver, its step's targets once taken, or its hunting grounds), and so do a Journal entry's rooms and a
wish's hunting grounds: the map shows only those marks, whatever its switches say, framed to fit
them, each with the ring, and the line names the step, with ‹ › to go from one to the next (the
nearest to your bench first, «1 of 2», each centred with its card and its ring) and the same
«Return to the map» (on a phone, one row with the ‹ ›). Esc ends it too (once no card or full screen is open: those close first), as do
the Map's tab and any switch below; Back returns to Progress.

Pharloom as the game's own map screen draws it for your game, piece by piece and by its own
rules, taken from its files and its code, in a dim tone, with Hornet sitting at her bench, her feet
where the bench's own feet are in the game's files (not on the game's bench pin, which it sets by
hand a little above the bench, and in a few rooms far off it); when the save was written where the
game wakes her at a room's own respawn point, as a restore point after a boss or an ability is, she
stands on the ground under that point: «Your respawn point». A bench in a room the map doesn't
draw (an interior, the Pilgrim's Rest, the Sprintmaster's cave) has her on its pin. The benches'
marks are on that same ground: each rests on its bench's feet, its bottom on the floor, so she sits
over her bench's mark; a bench the map draws no room for keeps the game's pin. Each room is drawn by its parts, as the game maps them (most rooms have two or three:
Greymoor_02, its top, its middle), and what your game's map draws is in colour: the parts the
game has mapped, in the areas whose map you've bought from Shakra. The site being a guide, the
rest of the map is there too, faint: the areas whose map you haven't bought (their names struck
through) and the rooms not mapped yet, so that what's missing there has a map under it. In colour
is only what the game draws, part by part: a part of a room you haven't been in yet stays faint
beside the parts in colour, its tone changing along the game's own straight cut between them (the
game maps each part only once you've been in it: a corner behind a breakable wall, a hidden room).
Turning
«Whole map» off draws your game's map exactly: no area without its map, nor its name, and a
part not mapped shows the dotted rough sketch the bought map gives it, or nothing when it's a
secret or a room's hidden half. What's mapped is what your save says the game has mapped
(`scenesMapped`), which can trail what you've walked until you sit at a bench, and without the
Quill the game draws nothing it has mapped. The game's state changes it too: in Act 3 the Cradle,
Cogwork Core and the Ventrica hub are drawn destroyed, as the game redraws them then (with their
benches and station); the Abyss's diving bell is broken, gone or mended with the Everbloom;
Verdania takes its colours once its Dancers are beaten; Whiteward's pit opens after the
Unravelled; and with the Cloakless crest the Slab moves, as the game moves it. In Free mode it's
the whole map, the world before Act 3. Where each thing is comes from
the game's files too: the pickups lying in each room, the vendors, the Wishwalls and their
givers, the bosses' arenas, the scripts that give an ability.

**For the maintainer, the admin mode** (`#view=map&admin=1`, nothing a visitor sees). A band
under the map, above the legend, corrects what the game's files place wrong: a mark is dragged
where it really goes, or nudged with the arrow keys (a pixel of the image; Shift, five); one that
shouldn't be there is hidden (faint and struck through while in the mode). Nothing is added by
hand: a mark the game's files don't have couldn't follow the save. A dashed way joins a mark
moved and not saved yet to the data's point, and the band lists the fixes by kind
(the moved ones only while unsaved), a tap going to it. Changes wait through a reload (`sessionStorage`) and Undo steps back. *Save*
sends them to `npm run admin` (`tools/admin.js`: the site on `http://localhost:8788` with a way
to write), which writes `js/map-fixes.js`; with no server (`file://`, the published site) the
button reads *Copy* and puts the new `FIXES` on the clipboard, to paste over the file's. That
file isn't generated, but `npm run data` keeps it in step: some fixes name a mark by its place in
a list (`extra:120`, `task:16`, `piece:3`, `pin:7`, `shakra:2`, `shop:pebb:0`), so when a patch
inserts or removes an entry the generator (`tools/follow-fixes.js`) pairs each old entry with its
new one by what it is and rewrites the keys, printing what it moved. A fix whose mark vanished,
whose pairing is ambiguous or whose mark changed room stops the run with the list, nothing
written; redo it in the admin mode and run again. Every fix stores its mark's room, and `npm test`
says, with the mark now at that key, when one names a mark the data no longer has there. The file
holds no fix since 13 October 2026: Albert dropped them all once the marks followed the game's
own placement.

### Progress

At the top, **where you are**: the three Acts on one thread as the game titles them (Act 1
Pharloom, Act 2 Citadel of Song, Act 3 Abyss), yours marked «You are here», and one sentence:
which Act you're in and what opening the next takes («Step 1 of 5 to Act 3: 3 things left»), in
Act 3 what the end takes («Step 4 of 8 to the end: 2 things left»), and past it what's left of the
100%, at 100% that you have it all.
Without a save it says what the tab is: the guide to the three Acts and to the 100%.

Then three tabs, as three cards, each with its own picture of how far you are; the one you used last
opens, the road's the first time. On a phone a card keeps its figure and leaves out the words after
it («step 1 of 5», «85% to go»). From the keyboard, Tab reaches the one selected and the arrows,
Home and End move to another and open it.

**The road to the next Act is the whole route** (its card: the picture of the step you're on, how
far into it, counted in its parts' units, and «step 1 of 5»). The road's thread runs down the page,
a station per step with the game's diamonds: the steps done lit and ticked, the one you're on larger
with «You are here» and its count («3/5», «3/31»), the ones to come dim. Each station is a row with
its picture, «Step 1» and its title, and opens: a step done shows what the game says of it, a step to
come that and its way onto the Map, and the one you're on, open from the start, its card, its parts
and its **What's next** list. The route ends at the Act it opens («You reach · Act 2 · CITADEL OF
SONG», «Act 3 · ABYSS»). What's open is kept while the page is.

The road to Act 2 has **two ways in**, drawn as two threads that part at its start («Two ways in ·
From Pharloom to the Citadel») and meet again at the Citadel. The Phantom's way runs beside the
Bellshrines and the Grand Gate to its own framed station, «Instead of steps 1 and 2 · Defeat
Phantom», with an «or» between the threads and what it needs (the Needolin and the Cling Grip, ticked
when held). Its thread is dotted until you hold both, dashed once it's open and lit once Phantom is
defeated; the steps it skipped are then crossed out on a dotted thread and say «No longer needed:
you defeated Phantom». Under its title, «Opens once you have both», or «Open now».

**What the game says of a step**: the objective as the game's pause menu «Tasks» titles it, with the
picture the Tasks tab draws by it, its line («Grand Gate · Pharloom») and its description as the game
words it in that state («Awaken the old bells throughout the lands.» while Bellshrines are left,
«Return to the Grand Gate and open the way to the Citadel.» once they're rung; for the snare,
«Acquire the necessary components…», then «Give the collected components to the Caretaker of
Songclave.»). The Last Judge has no objective of her own, so her Journal entry speaks («Final arbiter
of the Blasted Steps…», tagged «Journal»); unlocking Silk and Soul has no text in the game, so it shows
the wish it opens, its picture dim and its name and place («Silk and Soul · Caretaker of Songclave»)
on one line with its way onto the Map. Under the words, or beside a card with none, «See on the map» or «See the n on the map» (the Bellshrines not rung, the Grand Gate's and
the Citadel's objective pins as the game's own map places them, the Last Judge and the Phantom, the
Caretaker and Bellhart's Wishwall, the snare's pieces, the Cradle's top).

**Its parts**: for Silk and Soul a line says that all three are needed, and the list goes under the
three as heads, each its picture, its name and its count on the right, ticked when met (the wishes
it requires, its wish points, its four conditions); a part met is its head alone. For the offer, how it comes (or that you turned it down); for the last step,
that the Needolin, not a Bind, is what snares her.

**What's next**: the step's one list. What it still lacks, numbered, each with its picture,
its area and the Map's pin when it has the thing: each required wish (under its head just its name,
«Balm for the Wounded», with who asks for it in the game's words and what it asks),
the wish points short («Get 1 more wish point») with the four wishes nearest your bench that would
give it («and n more» unfolds the rest; tapping one opens its card under the row, drawn as a
required wish's: who asks and what it asks, «More», its area and its pin to where it stands now,
one open at a time), each condition not met (the Flea Caravan, the Faydown Cloak,
Lace, the Bellhome Key, or «Talk to Pavo for the Bellhome Key» once he has it for you), each Bellshrine not rung, each
piece of the snare. A step of one thing (walking into the Citadel) doesn't repeat itself as a list.
Each row is its name and one short line, how to get it, the number or the thing first («Pavo of
Bellhart · 250 rosaries», «9 of 12 fleas rescued; then talk to Mooshka at Greymoor»), ended by
«More» when there's more to say: it unfolds what the thing waits for (what posts the wish, when it shows up, the wish to do first) and
what the game says
of it: a wish as the game shows it now (what its Wishwall says until you take it, what «Tasks» says
once you have: the save's own record of each wish taken), the Caretaker's directions to each soul
and the Snare Setter, the Inventory's line for the Faydown Cloak and the Bellhome Key, and for Lace
the objective that leads to her (learn the Threefold Melody, then play it at the Citadel's heart, then
rise above the Citadel). The Flea Caravan has no game text. Lace's row and the key's (Pavo) have
their pin too, as the Bellshrines' do. «What's missing · Everything» on the right over the list (the
100% tab's same toggle, kept as you leave it) shows what's done too: each done row in its place, its number's
diamond ticked and dimmed, and the wishes that already gave points ticked among the options.

How to get each thing leads with what it is and what it costs (who asks for a wish and what it asks
to be brought, the shop and its price), then what it waits for (what posts the wish, the wish to do
first, the Act it comes in, the keys or abilities it needs). On the road «More» holds the rest; in the
100% tab's lists it follows the lead, and on a phone «+n more» opens it.

In Act 3 the tab is **«The road to the end»**, drawn as the roads to the Acts: a station per main
objective as «Tasks» titles them, in the game's order (After the Fall, Awaiting the End, Beast in the
Bells, The Dark Below, Return to Pharloom, Spell Seeker, The Old Hearts, Last Dive), each with what
«Tasks» says of the stage you're on and its pins on the Map (the Bell Eater's at every Bellway). The
Dark Below counts its four stages (the diving bell found, Ballow, the descent, the Abyss reached);
the Old Hearts lists the four hearts (any three, each with its pin) and then the Snail Shamans; Last
Dive, the Everbloom and Lost Lace. The route ends at «The ending · Sister of the Void», lit once your
save has seen it; its card then says so.

**Without a save**, a notice over every tab invites you to import yours (what it would show, and
the button), the 100% card says «100% in 10 categories», and the road tab is the three roads as a guide (to Act 2, to Act 3 and to the end),
each under its title and what it is, as the route with no step yours: each station says how much it
asks («5», «31») and opens, shut at first, on what the game says of it, its parts and the whole of
its list, with no «What's missing · Everything».

**For 100%** (its card: a small ring and what's left). At the top, **your 100%** in a ring that
fills with it, as the Journal's Memento, with the game's word, «Finalización» (a line under it
only if the game's own figure is another). Under it, how the 100% splits: one line of a hundred in
a thin filigree frame with a diamond at each end, a stretch per category as wide as it's worth, lit
as far as you have it, a hairline notch where each category ends and a taller one, with its
diamonds, where the Tools' half ends; and its legend with what each category is worth. Then each
category is a row, under a «Got / worth (%)» head: its name, its things as the game's pictures
(what you lack dimmed; past twelve, smaller and over two lines; a gauntlet as its champion), its
count, a ring that opens its list and, while anything of it is left, the lists' round pin: the Map
with only what's missing of it (all the Tools you lack, say), ‹ 1 of n › to go through them, the
nearest to your bench first. The rows you open stay open. «What's missing · Everything» and «By Act
· Nearest first» sit just above the rows.

Opened, a category goes straight to its things, with no line over them, by Act and across the
whole width: each with its picture, its name (a Tool with its slot's colour; in a Steel Soul save,
the Shell Satchel where Classic has the Dead Bug's Purse), how to get it, its area and a pin that
shows it on the Map; on a computer each thing is one line, on a phone how and where go under the
name. A thing just lying in a room says so («Found in the area: the pin shows where»).

In **Free mode** Progress counts what you mark, from a New Game (0% until you mark something),
and each missing row has a box to mark it here too (on a Tool marked with its upgrade,
such as the Curvesickle, the box unmarks both); masks, silk, the Silk Hearts, the Needle, the
Kit and the Pouch follow what the Inventory sets, and their groups say so, with the way there. The
line on top says it's Free mode, counting your marks from a New Game, and that the road is the
guide; the road tab is «The roads to Acts 2 and 3, and to the end».

The whole road, as the game's own rules have it (read from its files, not from a guide), step by
step, each with what the game says of it and its way onto the Map, as above:

- **To Act 2**: ring the five Bellshrines, open the Grand Gate (the Needolin played at its door calls
  the Last Judge, and the Gate opens once she's defeated: one step), and walk into the Citadel. Or,
  from the start, defeat the Phantom (it needs the Needolin, to cross the Mist, and the Cling Grip,
  to reach Sinner's Road): it takes the place of the first two steps, which then say they're no
  longer needed (the Bellshrines left unrung aren't listed as to do).
- **To Act 3**:
  1. Unlock the wish Silk and Soul:
     - its 10 required wishes (guides give six: the ones before them count too);
     - 17 of its 25 wish points (a delivery is worth half a point, the first time only);
     - four conditions: the Flea Caravan at Fleatopia, the Faydown Cloak, Lace defeated in the
       Cradle (with the three melodies that lead there), and the Bellhome Key. Pavo gives the key
       after Bellhart's Glory and 2 wishes of his list, once you've rested at a bench outside
       Bellhart, and its row says so until then. The caravan moves three times, each when you
       talk to Mooshka at its stop with enough fleas rescued: 5 to leave the Marrow, 12 to leave
       Greymoor (with the Last Judge beaten and the Grand Gate open, even on the Phantom's way)
       and 22 to leave the Blasted Steps (with the empty Pale Lake seen); in Greymoor and the
       Blasted Steps, also after a rest at a bench away from the stop once you've met him there.
       With a save, its row gives the fleas of its next move and only what that move still asks;
       once the fleas are there, what it still asks leads («first visit the empty Pale Lake, in
       the Putrified Ducts · then talk to Mooshka at Blasted Steps»), and «More» doesn't repeat it.
  2. Accept the wish from the Caretaker in Songclave (Bellhart's Wishwall posts it too, and sends
     you to him). Offered and turned down isn't taken: the step says to talk to him again.
  3. Gather the snare's four pieces: the Chapel Maid's and the Bell Hermit's souls, given once the
     wish is accepted (the Hermit sits below Bellhart's Bellway: through the hidden wall on its
     right and down, to the left; a wall you walk through, not one you break; if you'd never
     talked to him, he gives it the second time); the Seeker's Soul,
     past Groal the Great; the Snare Setter, which needs the Faydown Cloak. Each with a pin to the
     Map.
  4. Bring them to the Caretaker in Songclave.
  5. Snare Grand Mother Silk with the Needolin.
- **To the end**, Act 3's main objectives: escape the Cradle; reach the Ruined Chapel; defeat the Bell
  Eater; find the diving bell in Deep Docks, get Ballow's help, descend and reach the Abyss's heart;
  escape the Abyss; return to the Snail Shamans; bring them three of the four Old Hearts (Crust King
  Khann's, Nyleth's, Skarrsinger Karmelita's, the Clover Dancers'); then the Everbloom, from the Red
  Memory, and Lost Lace: Sister of the Void.

While Hornet is cursed (the Cursed Crest, until the wish Infestation Operation cures her), the step
you're on says that the curse blocks the road: Pavo won't give the key, Couriers Tipp & Pill hand
out no deliveries, and defeating Grand Mother Silk gives the Twisted Child ending instead. The key's
row says so («not while you're cursed») in place of «Talk to Pavo».

Each missing wish shows its Act, its area, who asks for it in the game's own words («Creige of
the Halfway Home»), what it asks to be brought, read from the game's files (the four required
donations: 250 and 400 rosaries for Pavo, 300 and 500 for the Caretaker, 1,450 in all; Flick's
shell shards, 200, 300 and 440; the Journal's 100 entries for Nuu; 25 Ragpelts, 12 Fine Pins, the
Great Gourmand's five dishes…), a pin to the Map on where it stands now (the Wishes tab's own pin for it: who
gives it before you take it, then what is left of its step), and the wish to do before it
when there is one. «What's next» says the same under each wish it lists. The required wishes the game posts later say what posts them (Trail's End: all of Shakra's
maps, counted, the Faydown Cloak, and two of the three melodies or Groal the Great defeated; Balm
for the Wounded: Sherma met and the Whiteward visited; Strengthening Songclave, Restoration of
Bellhart; Bellhart's Glory: the Cogwork Dancers, the Clawline or Songclave entered) and that each
shows up after a rest at a bench («then rest at a bench outside Bellhart»: outside Bellhart,
outside Songclave, or in another area, as the game has it), and Pinmaster's Oil that
Plinney's second Needle upgrade counts for it too. Where it's taken is the game's: the Wishwall that lists it
(Bellhart's, Bone Bottom's or Songclave's), or the NPC who offers it; a wish that comes after
another on a board (Crawbug Clearing, Berry Picking…) counts the board until that one is done, and
the NPC after. A part
already met hides its rows under "What's missing". A slot saved before the site read the wishes asks to be imported again.

Then what's missing for 100%, in the wiki's ten categories: the Tools (with their slot colour),
Crests, Silk Skills and abilities by name, and the Mask Shards, Spool Fragments, Crafting Kit
and Tool Pouch upgrades, Needle upgrades and Silk Hearts one by one. Each thing says its Act and
the area it's in, with the game's names; what belongs to a later Act than yours is dimmed. What's
missing also says **how to get it**, from the game's shops and the wishes' rewards (and the
wiki's boss drops):
- the vendor and the price in rosaries, and what the shop still waits for: the wish to do first
  (Frey's after My Missing Courier) or an ability (Grindle's Snitch Pick, the Clawline);
- the Pale Oil or Craftmetal it takes;
- the wish, the boss, the challenge, or the fleas rescued;
- the keys it lies behind, by the names the inventory gives them: the Architect's Key for the
  Architect Crest, a Simple Key for the Rosary Cannon (and the Flintslate, unless you go round
  with the Clawline), the White Key for the Whiteward (and the Surgeon's Key for its Silk Heart),
  the Slab's keys for its Mask Shard and Rune Rage.

The way shown is the one your Act has reached: in Act 3 Pebb's and Mort's wares are Grindle's,
and in Act 2 the Fractured Mask lies by the Mottled Skarr. Three things go by what your save says
rather than by the Act, as they lie by someone's corpse only once that someone is dead: the
Curveclaw (the Mottled Skarr's while he lives, above his corpse after), the Magnetite Dice
(Lumble's challenge, then by his body, Grindle's in Act 3) and the Weighted Belt (Mort's, by his
corpse in Act 3 if you didn't buy it). With no save (Free mode), the Act decides. The Silkshot says
what to do first, find the Ruined Tool in Bilewater (or, once you carry it, repair it), then each
place that repairs it with its price, the Twelfth Architect's gone once he has left; its area is where
to go now, and its pin shows all its marks on the Map, the Ruined Tool first while you lack it. A trap
the page doesn't spell out: the Curveclaw handed over to a Skarr loses its point until the
Curvesickle; and the Silkshot's first repair closes the other two versions. Masks and spools count whole: four
shards or two fragments are 1%.

"Nearest first" orders the missing things by rooms from your bench, the ones with no room after;
the wishes, in the road and in Tasks, by the rooms to where they're taken.

Then **other collectibles**, under a title with the masthead's filigree. They don't count for
completion, and what each is for is here, not on the page:
- Memory Lockets (Crest slots);
- Craftmetal (crafted Tools);
- Pale Oil (the Needle's upgrades);
- the Lost Fleas (the caravan's rewards, and Fleatopia for Act 3);
- the four Old Hearts (Act 3's ending) and the three melodies (the way to the Cradle), each in the
  area the wiki gives it;
- the abilities outside the 100% (Beastling Call and Elegy of the Deep under Act 3, where the Map
  has them);
- the 49 enemy gauntlets, named as Combat names them.

**Tasks** («Tareas», the game's pane), the third tab (its card: the pause menu's Wishes tab and how
many are done): the 21 main objectives and the 53 wishes, 74 in all, laid out as where you take
them. They don't count for completion. Each section is headed as the game's pane heads its own: a
title over its filigree, with how many are done.
- **Main objectives**: the one you're on (those of your Act still open, two at most; in Free mode
  the first not marked), large, with its picture, its Act, the pane's line for it and its pin; under
  it all 21 on a line by Act, as the Acts' track at the top of Progress, the done ones lit and the
  one you're on ringed.
- **Wishwalls**: the game's three, side by side (one under another on a narrower screen): Bone
  Bottom's, Bellhart's and the Songclave's, each headed by its figure as it stands in its town, lit
  by its area's colour, with the town's name and its count. On each, the wishes it posts (33: Bone
  Bottom 8, Bellhart 15, the Songclave 10; a wish a board sends you on to someone else counts as the
  board's, and the Lost Fleas are on Bone Bottom's though Mooshka offers them too).
- **Who makes a wish**: the 20 wishes asked for in person, one row for each person who asks, in the
  order you meet them (the Couriers' seven deliveries, the Alchemist's two, Mister Mushroom's at his
  tablet…): their figure (as the game draws them at rest) on a pool of their area's light, their
  name, their area and how many of theirs are done; then their wishes left, two side by side on a
  wide screen, and what comes later or is done as small pictures at the end of the row. A hairline
  fading at both ends parts the people. Whoever has nothing for you to take now leaves the rows for
  a strip at the end, their figure and their pictures under «Later» (faded) or «Completed».
On each wall and in each person's row, what's left as lines: the picture the game's pane draws by
it (a wish its type's emblem), the game's own name, who asks for it (the line the pane writes under
its title: «Frey of Bellhart»; in a person's row it goes when it only names that person and their
area) and the lists' round pin to the Map. A wish you've promised has the game's hollow diamond by
it, with no box behind. On a wall, what comes in a later Act than yours, faded, and what's done
(«Completed», as the pane says) follow, each as a row of pictures (a picture's name shows on
hovering it). Every wish is on its wall, the ten Act 3 requires too, though
the road's tab lists them as well. The one only Steel Soul has, and the one only Classic has, show
only in a save of that mode, and both in Free mode, as the Journal and the Map show them. A task done
also shows in "Since the previous save".
Each task not done carries the lists' round pin to the Map, to where it stands now: before you take
it, who gives it (its Wishwall, or whoever asks: Plinney, the Couriers, Creige, the Moss Druid,
Mooshka and the Pinstress on the mark that is them already); once taken, what's still to do of it
(what it asks you to bring, where it's done), and when nothing is, back to whoever gives it. A
Wishwall part that sends you to someone (Crawbug Clearing's to Creige, Fatal Resolve's to the
Pinstress's home, Berry Picking's to the Moss Druid, The Lost Fleas' to Mooshka…), once taken,
points to them until they hand you the rest of the wish. What a
wish asks for that another layer of the Map marks is on its pin too, until you have enough of it:
Pinmaster's Oil's Pale Oil (any of the three), Berry Picking's Mossberries (three held), The Lost
Fleas' fleas (five saved), Dark Hearts' Void Masses (twelve destroyed), Silk and Soul's Snare
Setter. The Lost Fleas is done once Mooshka has the five fleas, not when its Wishwall sends you to
the caravan. A main objective goes
to the game's own pin for it (the melodies and the Old Hearts to where each lies). Without a save
the pin goes to who gives it, or else to its marks. One mark opens the Map on it; several open the
Map with only them (‹ 1 of n ›, the nearest to your bench first).
In a save, a wish you've promised (the game's «Wish Promised») goes first on its wall or under its
person, lit faintly, its mark the hollow diamond. In place of who asks, what it asks with how much
of each you carry, counted as the game's pane counts it: «Fine Pin 10/12» over a dot each when it
asks for twelve or fewer, else over the pane's slim bar (the rosaries, the shell shards or the
Journal's entries for a donation or Nuu's); a single thing asked has its count alone. Once you have
it all, the diamond fills and the line is the game's own for handing it in («Turn in the Fine Pins
to Songclave's wishwall…»). A delivery is ready as soon as you take it: you carry it. A wish whose
first step you've taken (a board's notice that sends you to someone) is promised with nothing
counted yet, and a promised wish is never «later», whatever its Act.

The 100% tab, in a save, shows what's missing, or everything with a tick where you have it; without a save,
the whole list, as a guide. Which piece you have is read from the save one by one, and on the
92 real saves it agrees with the game's own counters (masks, spools, the three upgrade ladders,
the Silk Hearts).

### Pages

The site is one page, and each search it answers has an address of its own, in each language:
the save analyzer, the 100% checklist, the map, the Hunter's Journal, the Tools and Crests
calculator (`save-analyzer/`, `es/analizador-partida/`…). Each is the
whole site opened on its screen, with its own title, description and a short text with
questions, and `sitemap.xml` lists them. `npm run pages` writes them from `index.html` and
`tools/pages-text.js`, with `robots.txt` and `CNAME` (the site lives at `pharloomcalculator.com`:
`SITE` there); `npm test` fails if one falls behind. The homes also carry the site's
`WebSite` and `WebApplication` data (the name a search result gives it), and each language its
own preview card (`assets/site/og.jpg`, `og-es.jpg`). The icons and `favicon.ico` are Hornet's head
on the main menu's red light, drawn with `npm run site-icons` (`tools/site-icons.py`).

With Combat on, also the damage calculator and one page per boss, 51 in each language
(`bosses/lace/`, `es/jefes/lace/`); while it's hidden they aren't written. A boss's page is the site opened on
Combat with that boss picked, and a text written from the data, so a patch changes it with
`npm run data && npm run pages`. Its health in each fight (and black-threaded), how many slashes
kill it with the Needle alone at each upgrade (the engine, through the boss's own modifiers),
its attacks with the masks they take, its staggers, where it's fought and what it gives (the
wiki's infobox, by the game's names) and the Journal's description. The damage calculator's
page and every boss page list them all (`tools/pages-bosses.js`).

Under the screen, each page's text reads as a guide page on the main menu's red: at the top its
art on a soft light (a boss's whole Journal drawing; Hornet, the Farsight, the Crest… for the
others), the heading with the name large, the Journal's words for a boss, the first paragraph
and a button up to the screen. A boss's page then shows its figures in a row (health per fight,
slashes with the Needle alone, staggers), its attacks with their masks drawn, its phases as
marks on a health bar and its reward, with the rest of the text folded under «Every detail».
The questions fold, every boss shows as a portrait on Combat's pages, and the other pages come
with their icon. With a save loaded the whole block folds, as before.

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

**Unofficial fan project**, free, not affiliated with or endorsed by
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
- **The Knight's frames** (on the sister site's link): ten moves (idle, wind, look up, map, focus…)
  extracted from Hollow Knight's own sprites by `tools/extract-knight.py` (`assets/knight/`,
  `js/knight-moves.js`; the game's MonoBehaviours carry no type trees, so it reads them through
  its `Managed/*.dll` with TypeTreeGeneratorAPI), shown as a fan project.
- **The benches**: which bench each room has, read from the installed game's files by
  `tools/extract-benches.py` (`js/benches.js`); their pictures are the wiki's
  (`assets/benches/`, `npm run art`).
- **Sprites and icons**: Hornet, the masks, the spool, the five Needles, the benches (`npm run art`) and the
  inventory icons of the Tools, Crests, Silk Skills, abilities and items and the Journal's 237
  portraits (`npm run icons`, fitted into 256 px as WebP) are the game's, downloaded from the wiki and shown as a fan project.
- **The map**: the pieces of the game's own map screen and their rules, extracted from the
  installed game's files by `tools/extract-map.py` (`assets/map/pieces.webp`, `pieces-hd.webp`,
  `js/map.js`), shown as the Hollow Knight site shows its map, as a fan project.
- **The wishes' emblems**: the large emblem of each type of wish and the pause menu's Wishes tab,
  extracted from the installed game's files by `tools/extract-wish-icons.py`
  (`assets/icons/wishes/`), for the road to the next Act in Progress; and with them the pictures
  the pause menu's «Tasks» draws by each wish and main objective, its filigree and how it counts
  what a wish asks for (its slim bar and its dots, `assets/icons/tasks/`), and the three Wishwalls
  as they stand in Bone Bottom, Bellhart and the Songclave (`assets/icons/wishes/wall-*.webp`), for
  the Tasks tab.
- **Fonts**: Cinzel, Spectral and Patrick Hand SC, under the
  [SIL Open Font License 1.1](../assets/fonts/OFL.txt).
- **Code**: MIT ([`LICENSE`](../LICENSE)). It covers only the code, not any of the above.

If you hold rights over something here and want it removed, open an issue or write to
[betorzdev@gmail.com](mailto:betorzdev@gmail.com).

## Privacy

The footer carries a folded **Privacy** notice. The site sets **no cookies**, so it shows no
cookie banner: what it keeps on the device is strictly necessary for the service the visitor asks
for (LSSI art. 22.2, ePrivacy art. 5.3), and never leaves it:

- `localStorage`: the `pharloom.*` keys (saves, Tools and Crests, journal, progress, preferences).
- `sessionStorage`: `pharloom.cleared` and `pharloom.entered`, for the screen transitions.
- IndexedDB: `pharloom-live`, a copy of each imported save (so a slot is read again when the
  site learns something new) and, only after "Follow the game", the save-file handle (`js/live.js`).
- Save files are read in the browser; nothing is uploaded.
- **Donations**: a plain link to [Ko-fi](https://ko-fi.com/betorzdev), "Support the site" in the
  header after Share ("Ko-fi" alone on a phone), a line in the footer and the end of the About
  block's "Is it free?" answer (`KOFI` in `js/app.js`, `tools/pages-text.js`; design/94b). A flea
  from the caravan (the game's own picture) perches on the header's link, as the Knight on the
  sister's, and on every screen's frame by its top-right corner, a link to Ko-fi too: it hops once
  when the page opens (the header's) or a screen is arrived at (the frame's) and on hover, never
  with reduced motion; on hover the frame's shows the link's name beside it, on the frame's line
  (`renderPerch` in `js/app.js`; design/99). Never Ko-fi's widget: it loads third-party scripts,
  and the privacy notice says there are none.

The visit counter is [Footworn](https://github.com/betorzdev/footworn) (`track()` in `js/app.js`;
`404.html` loads it too, to see which broken addresses people land on), Albert's own, on a
Cloudflare Worker in Western Europe. It sets no cookies, keeps no IP, and stores one row per visit
with nothing that names you: the page, referrer host, browser and system families, screen width,
language, country and the site's events (`screen` with `view` and `lang`, `lang`, `error` with
`part`, `msg` (the first 64 characters of what went wrong) and `at` (the script and line), `sister` with `to` (the other site's id), `support` with `at` (which donation link was clicked: `header`, `frame` (the flea on the screen's frame), `footer`, `about` (the About block's answer) or `other`), and the plain ones: `share`, `save-import`, `save-sync`...). With a real save loaded (never in Free mode) every event also carries `pct` (the completion as the game shows it, a whole number) and `act` (the save's Act, 1 to 3). The owner sees them as daily
counts and, for today only, one by one, rounded (the minute, phone/tablet/desktop); its own
record of what it stores is at footworn.betorzdev.workers.dev/privacy. That fits the AEPD's exemption for audience measurement ("Guía uso de
cookies para herramientas de medición de audiencia", January 2024), whose one condition that
falls on the site is to **inform** visitors: that's what the notice is for. GitHub Pages, the
host, keeps technical logs (GDPR art. 13), which the notice also says. Since it takes donations (Ko-fi,
"Credits and licences"), the footer also carries a folded **legal notice** (LSSI art. 10): who
runs the site (`OWNER` in `js/app.js`), Spain, the contact address, and that donations are
voluntary and unlock nothing. If the site ever adds ads or a counter that stores something, this
changes again: for ads, a consent banner.

## Contact

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)).
