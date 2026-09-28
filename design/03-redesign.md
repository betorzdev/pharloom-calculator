# The UI and UX review: plan and status

A review of the whole site's look and behaviour, started on 28 September 2026 at Albert's
request. It goes **from the most global to each tab**, one step at a time, and every step is
decided by Albert between options, never assumed. This file is the thread: any agent picking
the work up reads it first, then the step it's on.

## How each step goes

1. **Look at the site as it is.** Screenshots of the step's screens at 1440 px and 390 px
   (headless Chrome over `file://`: `google-chrome --headless=new --window-size=1440,2200
   --screenshot=… "file://…/index.html#view=<v>"`), and the code behind them (`css/app.css`,
   `js/app*.js`).
2. **Think the redesign through**: what's wrong or weak, against `01-web.md` (the rules) and
   `02-silksong.md` (the game's measured visual language), and what the game itself does on the
   equivalent screen.
3. **Look at the sibling**, hallownest-calculator (`../hollownest-calculator/`, live at
   betorzdev.github.io/hallownest-calculator/): what it solved on the same piece, and whether it's
   worth bringing over. Its `design/` has the earlier rounds (`10-restructure.md`,
   `11-components.md` and the `*-variants.html`).
4. **Draw the options** in `design/NN-<step>-variants.html`: the site's real CSS
   (`<base href="../">`, `css/tokens.css`, `css/app.css`) plus the mockup's own rules, a bar at the
   bottom to switch between options and widths, and the choice in the URL (`?header=b&w=390`).
   Not part of the site: `index.html` doesn't load it, as `kb/` and the rest of `design/`.
5. **Propose in plan mode**, with the options and a recommendation, and pointing at the variants
   page. Albert decides.
6. **Build what was decided**, update `docs/guide.md` if the page changed, `npm test`, and mark
   the step here (status, decision and date). Albert commits.

## The steps

| # | Step | Status | Variants |
|---|---|---|---|
| 1 | **The shell**: header, screen bar (desktop and phone), the screen's frame and title, footer and About, the atmosphere | **Built** (28 Sep) | [`04-shell-variants.html`](04-shell-variants.html) |
| 2 | **The components**: the four buttons, choose-one, on/off, search, lists and rows, tags, notices, empty states, the toast | **Built** (28 Sep) | [`05-components-variants.html`](05-components-variants.html) |
| 3 | Your game (`home`) and Saves (`saves`) | **Built** (28 Sep) | [`06-home-variants.html`](06-home-variants.html) |
| 4 | Inventory (`game`) | **Built** (28 Sep) | [`07-inventory-variants.html`](07-inventory-variants.html) |
| 5 | Progress (`progress`) | **Built** (28 Sep) | [`10-progress-variants.html`](10-progress-variants.html) |
| 6 | Map (`map`) | **Built** (28 Sep) | [`12-map-variants.html`](12-map-variants.html) |
| 7 | Journal (`journal`) | **Built** (28 Sep, three rounds) | [`15-journal-variants.html`](15-journal-variants.html) |
| 8 | Crest (`tools`) | **Built** (28 Sep) | [`18-crest-variants.html`](18-crest-variants.html) |
| 9 | Combat (`fight`) | **Built** (28 Sep) | [`21-combat-variants.html`](21-combat-variants.html) |
| 10 | **Next** · The static pages (`tools/pages*.js`: `bosses/`, `es/jefes/`, the landing folders): they inherit steps 1 and 2; only what's theirs | To do | |
| 11 | **Everything on the map**: each Tool, Crest, Silk Skill, ability, boss, NPC, vendor, wish and Journal enemy in its room (data from the game's files or the wiki; today only the loose pieces, the stations and the gauntlets have a room), new layers grouped as mapgenie's, the rest of the game's pins. After the tabs (Albert, 28 Sep) | To do | |

## Step 1 · The shell

### What there is (28 September 2026)

- **Header**: the language on the left (EN ES), the title centred in Cinzel 900, the save
  selector on the right (Hornet at a bench and «Select save»). Nothing above the title. About
  150 px of header and bar before any content.
- **Screen bar**: seven tabs in Spectral, lowercase, `Your game · Inventory · Progress · Map ·
  Journal | Crest · Combat`, sticky, Hornet walking to the current one. No figures on it.
- **The screen**: a black plate (`--inv-bg`) with four L-shaped corner brackets, and the tab's
  own name repeated as its title (Cinzel caps over the rule with the diamond): about 90 px on
  every screen that the bar already says.
- **Footer**: three centred lines under a hairline. **About** (only on the page's own screen
  and language): the SEO text, the FAQ and the links to the landing pages.
- **Atmosphere**: the main menu's red light from the bottom, the vignette, 40 embers, the grain.
- **Phone (390 px)**: the title on the left, Hornet with «Saves» and the language on the right;
  the seven tabs wrap into two rows and **Combat is left alone on the second one**
  (`css/app.css` already says the fold into one tab "waits for the screens to exist": they
  exist now).

### What the sibling has that this doesn't

- A **filigree over the title** (the Hall of Gods tablet's header, the game's own art) that
  lights up on hover: the header has a crown and the title reads as the way home.
- **Share** next to the language, in the header, instead of inside one screen.
- **Figures on the bar**: `Progress 65%`, `Journal 2/146`, when a save is loaded.
- **On a phone, the tools fold into one tab** with a second row for its screens (and Your game
  / Inventory the same way), so the bar is always one row.

### What's weak

1. The header spends a lot of height and says little; the title has no ornament where every
   screen below is framed in filigree.
2. The screen's title repeats the tab. The frame's L brackets are the generic ones; the game's
   pause menu frame is a filigree, not a bracket.
3. The phone bar wraps; one tab alone on a second row reads as a bug.
4. The bar doesn't tell you anything about your game (the sibling's figures).

### The options (drawn in `04-shell-variants.html`)

- **Header**: A · as now, tighter, with a drawn filigree over the title (the sibling's crown in
  the pause menu's white); B · one row, the title small on the left, the tabs, the language and
  the save on the right: one sticky bar of 64 px; C · the pause menu: the tabs as the game's
  pane names, in Cinzel capitals, centred, the current one lit between the menu's pointers.
- **The screen's frame and title**: A · as now; B · no repeated title (the bar says it): the
  frame keeps its corners and the head only holds the screen's own controls; C · a drawn
  filigree frame with the title set into its top edge, as the pause menu's.
- **The phone's bar**: A · wrap (as now); B · the tools folded into one tab with a second row
  (the sibling); C · a bar at the bottom with the game's icons, in reach of the thumb;
  D · one row that scrolls sideways, faded at the edges.
- **Figures on the bar** (the sibling's): on or off.

### Decision (28 September 2026)

Albert chose **header A**, **frame C**, **phone bar B** and **figures on**. Built:

- **Header**: the drawn crown (`CROWN` in `js/app.js`, `.mh-crown`) over the title, in two rows
  as the sibling's (the brand spans both, subgrid); it lights up on hover and hides on a phone.
- **Frame**: `App.brackets` is now the inset filigree line (`.frame-line`) and the curl at each
  corner (`.bk`, one drawing mirrored with `scale`); `App.screenHead` sets the title on the line
  between two diamonds, and what went under the title (notes, choices, Share) opens the screen in
  `.screen-lead`. Tokens: `--lamp-frame`, `--frame-inset`, `--frame-corner`. Saves draws its own
  plate, so its `.screen` has no padding.
- **Phone bar**: the sibling's fold, ported (`index.html`, `renderNav`): `#nav-tools` («Build»:
  "Tools" would be the game's Tools; the site already says «build» in both languages),
  `#nav-sub` and `#nav-sub-game`, `--sticky-h` by `:has()` while a second row shows.
- **Figures**: `paintNavNums` in `js/app.js`, from `SS.completion.count` and `App.bookDone` /
  `App.bookTotal`; empty (and hidden) in Free mode.

Left for later steps: the footer and the About block weren't touched (step 3, Your game, is
where the About shows); the gap between the header and the bar could still shrink.

### Retouch, the screen's title (28 September 2026)

Albert likes the title on the frame's line, but it reads as sitting on a black rectangle: its
knock-out box (the plate's black, to cut the line) shows its upper half on the page's red, and
the plate itself runs a few pixels past the line, a black band above it. Drawn in
[`11-title-variants.html`](11-title-variants.html), all with the plate only inside the line:
A · the line cut, no box; B · inside the plate, under the whole line; C · a cartouche (the title
in its own small filigree frame); D · the soft cut (the box fading out); E · on the page, above
the frame, with its rule.

Albert liked A but wants it with a frame of its own; a second round on A's base, in the same page:
A1 · the needle's ends (the cut line ends in the button's filled diamonds); A2 · the curls (a
small filigree curl either side, the crown's); A3 · the plaque (a thin double outline with
pointed ends, the line meeting its points); A4 · the arch (the line rises over the title and
back down); A5 · the pointers (the game's menu fleurs either side).

Albert chose **A3 · the plaque**. Built: `App.screenHead` carries the plaque (an inline SVG, two
hexagon outlines stretched to the title); the plate's black is drawn by `.frame-line` itself, so
nothing black shows past the line; the top line is two halves stopping at the plaque's points,
`--title-half` measured per shown screen by `sizeTitles()` in `js/app.js` (on render, resize and
font load). Saves' own plate (`.saves-body`) works the same way.

## Step 2 · The components

### What there is (28 September 2026)

The component system came over from the sibling as it was (its `design/11-components.md`, six
rounds): four buttons (`.btn`, `.text-btn`, `.icon-btn`, `.disc-btn`), choose one (`.seg`),
on/off (`.check`), search (`.search`), tag (`.tag`), notice (`.banner`), empty (`.empty`) and the
toast. The tokens hold: no loose colour, tracking or font size in `css/app.css`. In use:
`.btn` 15 times, `.check` 11, `.text-btn` 10, `.seg` 8; `.icon-btn`, `.disc-btn` and `.chip`
never.

### What's weak

1. **Choose one, small**: the Crest screen's levels (0 1 2 3 4, five of them in a column) and the
   Map's zoom are words over four-pixel marks: they barely read as controls and are small to hit.
2. **On/off in a row**: the Map's ten layers are ten filled bone squares, the brightest thing
   above the map.
3. **The menu button** is Hollow Knight's box with its corner brackets. Silksong's menus are
   unboxed capitals between pointers (the site already does it for the save selector and the
   slots) and its frames end in diamonds.
4. **Section heads**: the block title (`.ct-h`) is used on every screen, and the label over a
   control has two classes that say the same (`.lbl` at `--track-label`, `.ct-k` at
   `--track-caps`).

### The options (drawn in `05-components-variants.html`)

- **Choose one**: A · as now; B · the game's selection, white on a bone plate; C · the upgrade
  pips, a hollow diamond under each, filled and lit on the chosen one.
- **On/off**: A · as now; B · the diamond, hollow off and lit on; C · a quiet tick, the square
  unfilled.
- **Menu button**: A · as now; B · the game's menu item (no box, the pointers); C · the needle's
  frame (two rules closed by a diamond at each end).
- **Section heads**: A · as now; B · led by the diamond, the rule fading out; C · centred between
  two short rules.

Whatever is chosen, two fixes go with it: `.ct-k` becomes `.lbl` (one label class, one tracking),
and the small choose-one gets a `--ctl-sm` wide hit area.

### Decision (28 September 2026)

Albert chose **choose one C**, **on/off B**, **menu button C** and **section heads B**. Built,
all in `css/app.css` on the existing classes:

- **`.seg`**: the pip is each button's `::after` (`--diamond` on the accent's line), filled with
  `--accent` and `--glow` on the chosen one; `min-width: var(--ctl-sm)` for the hit area. The
  header's language (`.langsel`) keeps the plain underline.
- **`.check`**: `.check-box` is the diamond (12 px, rotated), no tick (its `svg` is hidden), filled
  and lit when on.
- **`.btn`**: rules above and below only; `::before` / `::after` are the end diamonds on `--bk`,
  filled on `.btn-primary` and under the finger. The corner brackets (`--bk-len`) are gone.
- **`.ct-h`**: the hollow diamond in front and the rule fading out (`::before`, `::after`).
- **One label class**: the Crest screen's `.ct-k` is `.lbl` now.

Seen after building: with every Map layer on, the ten lit diamonds are still the brightest thing
over the map, though smaller than the squares were; step 6 (the Map) can decide whether the
layers' row wants less glow.

## Step 3 · Your game and Saves

### What there is (28 September 2026)

Seen with the author's four real saves loaded (15% to 100%, one Steel Soul) and in Free mode.

- **Your game, with a save**: a line with the Act, the time and the rosaries; the 100% large,
  checked against the game's own figure; the ten categories as bars; the Journal count; "Since
  the previous save" when the followed file brought a new one; the road to the next Act as a
  link. Under the screen, the About block (the page's SEO text) always shows on this screen.
- **Your game, Free mode**: Hornet resting, «Bring your game», Import and Saves.
- **Saves**: the game's profile screen, four slots and Free mode; each slot with its masks, Act,
  completion, Journal, Needle and its two actions. It reads well and follows the game.

### What the sibling has

The start screen was rebuilt around the save (`design/10-restructure.md`, variant C, "the
bench"): the area's title card ("Resting at City of Tears") on the area's own light, the Knight
at the bench, four figures, *Since last time*, the shade, *missing near your bench*, and cards
into the other screens; with no game, the invitation beside an example of what a save shows.

### What's weak

1. With a save the screen is only figures: no Hornet, no place, no way on. The data is there
   (`g.bench`, `g.area`, `SS.rooms.areaOf`, the Map's *missing near you*, `CO.AREAS` for the
   names, the area lines measured in `02-silksong.md` §4) and unused here.
2. The ten categories are bars that lead nowhere and don't say what's missing.
3. The About block (long SEO text) sits under your own game every visit.
4. Free mode says what to do but not what you'll get, nor what works without a save.

### The options (drawn in `06-home-variants.html`, sample figures from Save 4)

- **With a save**: A · the profile, refined (the categories as ways into Progress with what
  each lacks; *since last time*, *near your bench* and the Journal beside); B · the bench (the
  sibling's: the area's title card on its map light, Hornet, four figures, then three columns);
  C · the HUD (the Crest wheel, masks and spool as the game draws them, the 100% as ten tiles
  with the game's pictures and pips).
- **Without a save**: A · as now; B · the invitation in three steps beside an example (the
  sibling's); C · the invitation and the four ways in that need no save.
- **Where next** (cards into Progress, Map, Journal, Crest): on or off.
- **About**: always open, or folded behind a disclosure when a save is loaded.

### Decision (28 September 2026)

Albert chose **with a save B · the bench**, **where next on** and **About folded with a save**.
For Free mode none of the three: «Bring your game» is too much text and not attractive, so a
second round was drawn (below). Saves reads well and stays as it is.

Built (with a save):

- **Area light**: `--area-<id>-fill` / `--area-<id>-line` in `css/tokens.css` for the save's area
  ids, from `02-silksong.md` §4; Coral Tower takes the Sands of Karak's; Songclave, the Exhaust
  Organ, the Red Memory and Wisp Thicket's line (not measured) fall back to the spotlight.
- **`js/app-home.js`**: the card («Resting at», the area of the bench by `SS.rooms.areaOf`, the
  room's own area under it when it differs, the Act, the time, Hornet, four figures and the
  game's own figure checked), the road to the next Act, then three columns (*since the
  previous save*, *closest to your bench*, *your 100% by part*, each part a link to Progress)
  and the four ways on. The Map's list is shared: `App.nearList` / `App.nearRow` in
  `js/app-map.js`. A lone column keeps a list's measure.
- **About**: folded behind a `.disc-btn` («About this site») while a save is loaded
  (`renderAbout` in `js/app.js`); open without one, as search engines see it.
- Seen: Save 2 (The Cradle) gets no *closest to your bench*: its bench (`Tube_Hub`) finds
  nothing on the room graph. For step 6 (the Map).

### Free mode, second round (in `06-home-variants.html`, D to F)

- **D · the empty slot**: the game's profile slot with nothing in it: Hornet, «Drop your save
  here», the file names, Import; the whole slot takes the file.
- **E · the ghost bench**: the bench card unlit, «Resting at Pharloom», Hornet in silhouette,
  the four figures waiting, «Your game goes here» and Import.
- **F · behind glass**: a sample game's bench screen under a veil, «This could be your game».

Albert chose **E · the ghost bench**. Built: `invite()` in `js/app-home.js` is the bench card
with `.is-ghost` («Resting at» over «Pharloom», the game's `MQ_BELLSHRINES_LOC`, «Telalejana» in
Spanish; Hornet as a silhouette; the four figures as «?»; «Your game goes here», Import and
Saves). It keeps `.hm-invite`, so the dropped file still lights it. The long invitation line is
gone.

### Retouch, Hornet's bench (28 September 2026)

The card said «Resting at» and Hornet sat on nothing (`resting.png` has no bench). Every
Silksong bench the wiki draws was put under her in `18-bench-variants.html`; Albert asked for
**the very bench the save rests at**, only on Your game (the header's selector stays as it is).
It can be known: each bench room in the game's files has a `RestBench` whose sprite names its
style. Built: `tools/extract-benches.py` reads them into `js/benches.js` (the room → the wiki's
picture in `assets/benches/`, with the row of its seat), `rest()` in `js/app-home.js` sits her hem
on that seat (`.hm-rest`, `--hn-rest`); a room it doesn't know, and Free mode, get Bone Bottom's,
the first bench. The bench's states (broken in Act 3, under cloth, snowed) aren't told apart.

## Step 4 · Inventory

### What there is (28 September 2026)

Three columns, as the game's pane: the Needle, the masks and the spool on the left; the icons in
grids in the middle (Tools, Crests, Silk Skills beside the abilities, items); the description of
what you point at on the right (under 1100 px, stuck to the bottom of the window). What you
lack is a dimmed silhouette; each Tool carries its slot colour as a thin rule.

### What the sibling has

Its Inventory ("Your Knight") is a sheet, not a pane: the nail's five levels with their
damage, spells and arts with their levels, masks, vessels and notches as rows of figures, the
charms found with All · None, and the items by name with "Not found" or a stepper.

### What's weak

1. The section heads (`.inv-h`) are the old full hairline, not step 2's diamond heads, and say
   no count: nowhere does it say 31 of 51 Tools.
2. The Tools are one grid of 57 sorted by colour, told apart only by the thin rule.
3. The abilities' icons fill their cells and look twice the size of the rest.
4. The items' counts sit over the icons.
5. The description column stays empty until you point at something: a quarter of the width
   says «Point at something…».

### The options (drawn in `07-inventory-variants.html`, over Save 4's real inventory)

- **A · tidy**: today's three columns with step 2's heads and their counts, the Tools in three
  labelled rows by slot colour (red 12/21, blue 10/23, yellow 9/13), the items' counts under
  them, the abilities at the size of the rest.
- **B · the game's pane**: the HUD as a strip on top, one section at a time behind the pips
  (Tools · Crests · Silk Skills · Abilities · Items), larger icons, the description as large as
  the game's beside them.
- **C · shelves**: no fixed description column; the sections full width, and what you tap opens
  under its own shelf.

The mockup counts the 57 Tools in the data; the site would count as the 100% does (51).

### Second round (28 September 2026)

Albert chose none of the three and raised two things: each Tool's colour rule isn't aligned (the
cells grow with their picture, so the rules sit at different heights), and **the sibling's
Inventory in Free mode is editable and very well done**: bring that. The sibling's
`renderGear` (its `js/app-game.js`): «Start from» Base Knight · Everything maxed; the nail as the
focal point (five upright with their damage, the one carried taller and lit, its name under the
row); plates with the art, the name and what each gives; the body as rows of the game's pieces
you tap to set («Masks 9/9 · from 5 to 9»); levels with their own art; what you just got lights
up. In a save the same screen, read-only.

Pharloom's free build (`pharloom.build`) already carries the Needle, the Kit, the Pouch, the
masks, the spools and the Silk Hearts, so all of those can be set from the Inventory. Marking
which Tools, Crests, Skills and abilities you own would need the Crest screen to respect an owned
list: not in this step.

`07-inventory-variants.html` was redrawn with it: Free mode editable (start from Base Hornet or
everything maxed, the five Needles, masks 5 to 10, silk 9 to 18, Silk Hearts, Kit and Pouch as
pips, the Silk Skills with their damage from `js/engine.js`), the same read-only over Save 4;
every cell one fixed square; and a switch for the Tool slot:

- **1 · the aligned rule**: the slot colour at the bottom of one fixed square.
- **2 · the diamond**: each Tool on its slot outlined in the slot colour, as the Crest screen
  draws its slots; what you lack, the locked grey, dashed.
- **3 · the round well**: a medal with a rim in the slot colour.
- **4 · by row**: plain cells, the colour in the row's label and a rule down its side.

The layouts: **A · the sibling's sheet** (what Hornet is on the left, what she carries on the
right), **B · the game's pane** (the Needle and the body on top, one section at a time below),
**C · shelves** (the Needle and the body in a narrow column, every shelf beside it). What you
tap opens its description under its own shelf.

### Decision, and the silk round (28 September 2026)

Albert chose **layout A · the sibling's sheet**, **Tool slot 2 · the diamond** and the editable
Free mode. The silk row as plain white rectangles didn't work for him, so four ways were added
to `07-inventory-variants.html` (the "Silk" switch):

- **1 · the spool**: the HUD's spool, as long as the silk it holds, the rest of the way to 18 a
  dashed outline; tap along it. The sprite stretched shows its own lit and grey halves.
- **2 · beads on a thread**: one silk thread across with eighteen diamonds, lit up to your silk.
- **3 · the Spool Fragments**: the nine fixed as «9 +», the upgrades as the game's Spool
  Fragment pictures.
- **4 · skeins**: a small wound skein per silk, empty ones faint.

Albert chose **silk 2 · beads on a thread**. Built:

- **`js/app-game.js`**: the sheet. Left: the five Needles, Hornet's rows (masks as the game's
  masks, silk as beads on one thread, Silk Hearts, Kit and Pouch as pips), the Silk Skills with
  their totals from `SS.engine.compute` and the abilities (Needle Strike's figure). Right: the
  Tools by colour on the diamond slot, the Crests, the items. The heads count as the 100%
  (`SS.completion.count`). What you tap opens under its shelf (`.inv-open`); the old side pane and
  its hover are gone.
- **Editable in Free mode** through the Crest screen's own `ctLevel` (`js/app-tools.js`), so the
  Crest screen and Combat follow; «Start from» sets every ladder at once (`ctPreset`). In a save
  the controls are still, at full light. `App.currentBuild` gives the build on screen.
- **Follow-up, the same day**: Albert: the Inventory is where you see and set what you've got,
  so in Free mode **everything** is editable, and what you mark reaches the Crest screen. Built:
  Free mode's marks live in slot 0's own `pharloom.owned` and `pharloom.progress` (the shape a save
  uses, `App.freeGame` / `App.setFreeGame` in `js/app-saves.js`; no marks = everything). A tap on
  a Tool, Crest, Skill, ability, the Everbloom, an Old Heart or a melody marks it and opens its
  text; «All · None» per shelf; − N + for what comes in numbers; «Base Hornet» keeps only the
  Hunter Crest, «Everything maxed» clears the marks. The Crest screen shows what you lack as a
  silhouette, disabled, and a mark taken off something worn takes it off the build
  (`App.editFree`). `App.game()` stays null, so Your game, Progress, the Map and the Journal
  stay Free mode's.
- **Retouch, had and missing**: what you lacked (`--missing-art`, 40% light) lost its shape, and on
  the pale pictures had and missing looked alike. Compared in
  [`08-missing-variants.html`](08-missing-variants.html); Albert chose **A + C, light and pip**:
  what you lack a lighter grey at half opacity (`--missing-soft`, `--missing-soft-opacity`), what
  you have in the spotlight's glow, and the game's diamond under every picture, lit had, hollow
  missing.
- **Retouch, the Tools you lack and the click**: the white square on the Tool you tapped is gone
  (the text open under the shelf says which one). A Tool you lack sits on **the game's locked
  slot** (solid grey with its pale rim, `design/02-silksong.md` §3), its picture grey on it; chosen
  from [`09-locked-tool-variants.html`](09-locked-tool-variants.html) (B).

## Step 5 · Progress

### What there is (28 September 2026)

One long column: the road to the next Act (every step with its full lists of wishes, points and
conditions), then the ten categories of the 100% as lists of every piece with its Act, area and
how to get it (three columns on a computer), then the other collectibles and the gauntlets.
With a save, «What's missing · Everything» and «By Act · Nearest first»; without one, the whole
list as a guide. There's no total on the screen, and nothing says at a glance which category is
closest to done: with Save 2 the road alone is two screens before the first category.

### What the sibling has

Its Progress is a ledger: the completion large («65% / 112»), then one row per category with
its pieces as small pictures (or pips), the count and the disclosure's ring; a row opens its
list, where you mark what you get (in Free mode).

### The options (drawn in `10-progress-variants.html`, over Save 2's real 100%)

- **A · the ledger** (the sibling's): the total, the road to the next Act short (its steps and
  counts, «The whole road» opens it), then a row per category with its pictures or pips, its
  count and the disclosure; a row opens its list.
- **B · the board**: the total and the road, then the ten as cards (picture, count, pips and the
  next three missing); a card opens its whole list under the grid.
- **C · three tabs**: the road, the 100% (today's lists in two columns) and the other
  collectibles, one at a time.

### Decision, and the road round (28 September 2026)

Albert likes **A · the ledger**, but not its road summary (the numbered list in a veiled box).
In Free mode, Progress uses the Inventory's marks and lets you mark from its lists too. Three
road summaries were added to `10-progress-variants.html` (the "Road (A)" switch):

- **1 · the journey**: the five steps as diamonds on one thread, the current one larger and lit,
  their names under them, and the current step with its count («2 of 15»).
- **2 · the quest card**: as the game's Tasks pane: «The road to Act 3 · step 1 of 5», the step as
  a headline, its pips and count, and the next step.
- **3 · a ledger row**: the road as the ledger's first row, opening to the whole road.

Albert chose **road 1 · the journey**. Built (`js/app-progress.js`, `css/app.css`):

- The total with the game's check, the journey (`journey()`: step names from the game's text,
  `roadBellshrine`, `roadCitadelName`, `roadSnare`, the wish's and the foes' names; the current
  step's full title with «n of m»), «The whole road» toggling today's full road (`prefs.pgRoad`).
- Every category, the other collectibles and the Tasks as ledger rows (`group()`): the strip of
  the game's pictures (twelve or fewer) or pips, the count, the disclosure; open rows kept in
  `prefs.pgOpen`. The show and order choices sit just above the rows.
- Free mode with the Inventory's marks counts from them (`App.freeGame`), its ladders (masks,
  silk, Silk Hearts, Needle, Kit, Pouch) from the free build so lists and counts agree
  (`freeView`), and a missing row's box marks it (`pgOwn` through `App.freeMark`); ladder pieces
  are set in the Inventory, not here.

### Retouch: the completion figure (28 September 2026)

Albert: the percentage could be more attractive. Today it's a plain system-font figure with
«Your game» under it. `20-progress-total-variants.html`, at 63 % and 100 %, all in the game's face
(Cinzel) and labelled «Finalización» (`COMPLETION`, the game's word):

- **A · the ring**: inside a large ring that fills with it, as the Journal's Memento.
- **B · engraved**: large and lit between the header's two crown flourishes, as a plaque.
- **C · the spool**: over the HUD's silk spool, filled as far as the game is done.

Decision: **A · the ring**, built: `.pg-ring` (`--pg-ring` 220 px, 180 on a phone), the
Journal's Memento arc (`--ring`, `--ring-track`, `--ring-mask`) doubled, a thin filigree circle
inside, the figure in Cinzel with a soft halo, `pgCompletion` («Finalización», `COMPLETION`) under it.

## Step 6 · Map

### What there is (28 September 2026)

The game's map with every missing piece in its room, the benches, Bellways, Ventrica stations and
gauntlets as the game's pins, Hornet at the bench and her way from the previous one; above it two
rows of switches (the step 2 diamond, then the kind's dot or glyph, its name and count) and the
zoom as a choose-one (Whole · ×1.5 · ×2.5); under it a long note and *Closest to your bench*.
On a phone the switches take a screen before a small map. With the 76 benches on, the map is
covered in rings. No search, no area names.

### What the sibling has

A search above the map; the zoom as a boxed toolbar floating on the map (+ − full screen); the
area names on the map; the layers under it in groups (Collectibles, Towards 112%, Places, Your
game) with «Show all · Hide all» and «Always show the whole map», «Also show what you have»,
«Show the area names».

### The options (drawn in `12-map-variants.html`, the real map and pins)

In all three the layer's own picture is the switch (off, it dims) instead of a box beside it,
the area names can be on, and the benches start off.

- **A · the sibling's**: the search above, the map with its floating zoom and the area names,
  the layers grouped under it, then what's closest.
- **B · side panel**: the map wide on the left; on the right the search, the layers one per line
  and what's closest.
- **C · the map first**: the map fills the plate, the layers a compact legend floating on its
  corner, the search and zoom on its top edge; the list under it.

### Decision (28 September 2026)

Albert chose **C · the map first**, **area names on, with a switch**, and **Free mode's marks** on
the Map too. Built (`js/app-map.js`, `css/app.css`):

- `.mp-stage`: the view bleeds to the frame's inner edge; whole it's the map's own height, closer
  (`.is-zoomed`, ×1.5 · ×2.5 · ×4) a window that scrolls. On it the search (`.mp-find`), the zoom
  toolbar (`.mp-tools`: +, −, full screen through `requestFullscreen`) and the legend
  (`.mp-legend`, folds, `prefs.mapLegendOff`), whose switches are each layer's own mark
  (`.mp-sw`, `aria-pressed`). Benches start off (`PLACES_ON`).
- Area names (`AREA_NAMES()`: each area's name at the middle of its drawn rooms, those with more
  than three), `prefs.mapNames`; on a phone only when zoomed.
- The search matches areas and gauntlets (accents folded); a result zooms to ×2.5, scrolls there
  and pulses `.mp-ping`.
- Free mode: `App.freeView()` (js/app-progress.js) says what's missing; Hornet, her way and the
  lit pins only with a real save.

### The symbols (28 September 2026)

Albert: the sibling draws each thing as the game does, and mapgenie.io's Silksong map is
attractive (teardrop pins, a colour per group, a white glyph; seen 28 Sep: groups Points of
Interest, Collectibles, Items, Equipment, Enemies, Quests, Other, some 50 categories). The game's
own map pins were read from its files (`hornet_map.spriteatlas.bundle`: `pin_bench`,
`pin_stag_station`, `pin_tube_station`, `pin_flea`, `pin_shop`, `pin_steel_servant`, the quest
icons, the markers), kept for the mockup in `design/map-pins/`. Drawn in
[`13-map-symbols-variants.html`](13-map-symbols-variants.html) on the real map zoomed in: A · as
the game draws it (each piece its own picture, the places the game's pins: the sibling's way);
B · mapgenie's pins; C · the game's round badge (a dark disc with a rim in the kind's colour, the
picture inside).

Albert also noted many things are missing from the map (Tools, Crests, bosses, NPCs, vendors,
wishes…). He chose **C · the game's round badge**, and the missing content as **a step of its
own (11), after the tabs**. Built: the game's own map pins in `assets/map/pins/`
(`tools/extract-map-pins.py`, 24 of them: the three places use `pin_bench`, `pin_stag_station`
and `pin_tube_station`, the rest wait for step 11); in `js/app-map.js` `mark()` draws a piece as
the badge (`--badge`, the kind's colour as its rim, the item's own picture inside) and
`placeMark()` a place as the game's pin, a gauntlet as the badge with its needles; the legend
and the closest list use the same marks. `--mp-s` sets their size (22 px whole, 28 zoomed, 14 on a
phone whole).

### Moving around, the intros, the gauntlets' mark (28 September 2026)

Albert: the map was a still picture; it should move as the sibling's does. Built: the map and its
marks are one layer moved and scaled by a transform (`applyView`, `zoomAt` in `js/app-map.js`):
drag, the wheel and a pinch zoom at the pointer, a double click zooms in, + and − at the middle,
and ⤢ the large map (the window's width and height, `prefs.mapBig`, the sibling's). Marks and
names keep their size on screen (`--k`). Close up the images swap to twice the resolution
(`rooms-hd.webp`, `states-hd.webp`, 5488 × 4369, written by `tools/extract-map.py` at 96 px a
unit; the game draws at 100), and the layer has no `will-change`, which blurred it. Hornet's walk
keeps her in view (`App.mapKeep`).

He also asked to drop the screens' introductory lines («The game's map, with Hornet at your
bench…»): gone from the Map, Saves, Inventory, Progress and the Journal (their keys too). Kept:
the lines that say something about your state or lead somewhere (the Crest screen's note on a
save's build with its Free mode link, Combat's build line, the gauntlets cleared, the import's
steps).

The gauntlets' mark (two strokes crossed, read as an «x»: «queda horroroso»): options in
[`14-gauntlet-mark-variants.html`](14-gauntlet-mark-variants.html): A · the arena's champion (the
Journal's portrait of its last wave's enemy on the red badge), B · the needles drawn, C · a
challenge shield. Albert chose **A · the arena's champion**: built (`placeMark` in
`js/app-map.js`, `champion()`: every one of the 49 has its portrait).

The marks are tappable, as the sibling's (Albert asked): a tap opens a card over the map
(`cardHtml`, `paintCard` in `js/app-map.js`) with the mark's picture, its name, its area and Act,
the rooms from your bench and how it's had (`App.howPiece`, js/app-progress.js); in Free mode a
piece's card marks it had (`mapMark`, the Inventory's marks); a gauntlet's card gives its waves, its
reward and «Fight it in Combat» (`mapFight`: Combat's gauntlets, that one chosen). The card follows
its mark as the map moves; ×, Escape or a tap on the empty map close it; a drag isn't a tap.
The floating legend was in the way (Albert): it's under the map now, in two rows, no fold.

### Progress, retouched (28 September 2026)

Albert missed the timeline: it only showed before Act 3. In Act 3 now the whole game at a glance
(`journeyAll` in `js/app-progress.js`): Act 1, Act 2, Act 3, then the four endings, lit the ones
the save has seen. The save keeps them in `playerData.CompletedEndings`, the game's
`CompletionState` flags (read from `Assembly-CSharp.dll`: Act2Regular 1 = Weaver Queen,
Act2Cursed 2 = Twisted Child, Act2SoulSnare 4 = Snared Silk, Act3Ending 8 = Sister of the Void;
the wiki's Endings page agrees; ENDING_B «Strung to Serve» is cut), read as `g.endings`
(`js/savefile.js` ENDINGS). He also found dull, and so removed: the «Your 100%» label, «It matches
the 63% the game shows» (the line stays only when the figures differ) and the purchase-cost line.

## Step 7 · Journal

### What there is (28 September 2026)

A grid of every portrait with its kills under it as «10/20», and a side pane that says «Point at
an entry» until you do, with *what's missing closest to your bench*. The entries not seen are
empty dark discs (the silhouette too dark to read); the portraits look alike, and nothing says
at a glance which are complete.

### What the sibling has

A list (search, filters by state with counts, a row per entry with portrait and name) beside a
large entry pane (the portrait on its light, the name, where, the state as a choose-one, and in
Free mode you mark each entry).

### The options (`15-journal-variants.html`, over Save 4's real Journal)

In all three: the kills as a ring round the portrait (lit bone when complete), the entries not
seen as grey silhouettes, the Hunter's note in his hand once complete.

- **A · the game's pane**: the grid with rings, the entry large and always shown beside it.
- **B · the sibling's list**: search, filters, a row per entry (portrait, name, area, kills), the
  entry beside it.
- **C · by area**: a ledger row per area (its portraits and count, as Progress); open, its
  entries and the one picked.

### Decision (28 September 2026)

**A's style, grouped by area** (Albert: A's look, but seeing it by area is very useful). Built:

- Each portrait in a ring that fills with its kills (`--f` = kills / needed, a conic arc of the
  silk's white over `--ring-track`), lit bone with `--glow` once complete. Not seen: the portrait
  in shadow (`--unseen-art`, `grayscale(1) brightness(0.32)`: the portraits are drawn on a dark
  disc, so the flat silhouette of the variants page read as a blank disc) in a dashed ring,
  «???» as its name. No «10/20» under each: the kills are in the entry.
- A choose-one **By area · Journal order** (`prefs.hjBy`, by area by default) beside «What's
  missing · Everything». By area: a `.ct-h` head per area with its count (6/20), the areas with
  the most missing first, «Elsewhere» last for entries with no place. An entry's area is the first
  of its places (`whereOf`, from `js/journal-rooms.js`).
- The entry always shown: the one picked or pointed at, else the first missing in the grid's
  order. The portrait large in its ring, name, its areas, the nearest from your bench, kills,
  description, and the Hunter's note once complete (a quiet line saying so before). *What's
  missing closest to your bench* goes under it. On desktop the pane is sticky (scrolls inside
  when taller than the screen); in one column it sits above the grid with only the three closest,
  and a tap scrolls it into view.
- Free mode unchanged: the whole Journal, complete, with the order choice only.

### Second round: the first view (28 September 2026)

Albert: what you see first on opening the Journal is unattractive and too much text (the count in
words, four word buttons, the entry's long pane, ten closest in text with a paragraph under
them). `16-journal-top-variants.html`, over Save 4:

- **A · quiet**: one figure over a three-length bar (complete, seen, not seen) with a dot legend;
  the switches as two small icon toggles; the entry lean (ring with the kills on it, name, area,
  description); the five closest as portraits with their rooms.
- **B · next hunts**: the Memento as a large ring beside the four closest missing as cards; the
  grid full width, the entry only on a tap.
- **C · areas at a glance**: the Memento and every area as a tile with its ring and count; a tap
  goes to that area; the lean entry beside the grid.

Decision: **B · next hunts**, built. The Memento ring (`.hj-memento`: complete in bone, seen
dimmer) beside the four closest missing (`.hj-hunt`, from `nearest()`); the toggles as icons with
the step 2 pips (`.seg.hj-tog`, the words in `title` and `aria-label`); the grid full width; the
entry in a modal `<dialog>` (`.hj-sheet`: in the top layer, so over the sticky header, which the
screen's `isolation` would otherwise put it under), closed by its ×, Esc, a tap on the dim, or
leaving the screen. Gone: the «of 236 seen» line (in the ring's `aria-label`), the ten-row list
and its paragraph, «Defeated», the «note appears once complete» line. With no bench or nothing
missing, the ring alone, centred.

### Third round: the whole drawing (28 September 2026)

Albert: on tapping an entry, see its whole drawing, to know the bug when you meet it.

**How the game shows an entry** (read from its files): each `EnemyJournalRecord`
(`journalrecords.bundle`) carries an `iconSprite` (the round portrait the site already has) and an
`enemySprite`, the whole drawing, in the `journal_enemy_images` sprite atlas: 237 of them, one per
entry and all matched to the site's keys, transparent, all at 64 px to the unit, from 32 px to
787 px (a Mossgrub 125 × 103, a Pilgrim Guide 257 × 238, the Bell Beast 507 × 352), 2.9 MB as WebP
in all. The pane (`coremanagers_assets__gamecameras.bundle`, "Journal", `PANE_BESTIARY`) is three
columns: the scrolling list of round icons (a frame for complete, `bestiary_icon__0000_frame_full`,
another for not, `__0001_frame_empty`); the drawing as it is (no scaling) on a soft light
(`light_effect_v02`, grey 0.81); then the name, a divider (`Inv_0017_divider`), the description,
and the notes under `hunter_symbol` (Hornet's mask between two filigree strokes), or, until
complete, `NOTES_DEFEAT` «Defeat {0} more to complete the hunter's notes.» / «Derrota {0} más para
completar las notas de caza.». Two counts over the pane: `ENCOUNTERED` and `COMPLETED`, each
amount / total.

`17-journal-entry-variants.html`, seven real drawings inlined, Save 4's kills:

- **A · the game's page**: a wide sheet in the middle, the drawing on its light at the game's
  size (capped), beside it name, divider, kills, description, the notes under the symbol or
  `NOTES_DEFEAT`. On a phone, drawing above text.
- **B · drawing in the sheet**: the side sheet, the drawing in place of the round portrait, every
  drawing fitted to one box; the kills as a thin bar.
- **C · full screen on a tap**: the sheet as it is; a tap on its portrait opens the drawing large.

Decision: **A · the game's page**, built. `tools/extract-journal-art.py` writes the 237 drawings
to `assets/journal/art/<name_key>.webp` (3.4 MB, one loaded per tap) and `hunter_symbol` to
`assets/journal/hunter-symbol.webp`. The sheet (`.hj-sheet`, still the modal `<dialog>`) is wide
and centred: the drawing at its own pixels (capped at 440 px) on `--journal-light`, the text
beside it; on a phone from the foot, drawing above. Not seen yet: the drawing in shadow
(`--unseen-art`), so its shape can be learnt. `hjNotesDefeat` is `NOTES_DEFEAT` with its `{0}`.


## Step 8 · Crest

### What there is (28 September 2026)

Three columns. On the left, the Crest's icon, name and description, and its slots as rows of
diamonds by colour. In the middle, every control as a list of small-caps labels over pip rows:
Crests, evolution, Needle, Kit, Pouch, «Right now», and in Free mode the 60 Tools and six Silk
Skills in one mass. On the right, a long text column of figures with their formulas (17 × 1.3,
13 + 13 + 13…) and «What the others do», every other Tool's description in full. In a save, an
intro line («What you wear in Save 4…», «To try builds: Free mode») opens it. On a phone it runs
to five screens.

### What the sibling has

A hero band of big figures (the Nail drawn large with its damage, then DPS, range, strongest
attack, hits until you die, soul per hit, healing), the equipped charms and the notches, the charm
grid («one tap equips or removes»), spells and Nail Arts as large art with their damage, effects
as cards, and «See every stat» folded.

### How the game shows it (read from its files)

Each `ToolCrest` in `dataassets/tools/crestitems.bundle` lists its slots: a position in units from
the Crest's centre, a type (0 red, 1 blue, 2 yellow, 3 Silk Skill) and `IsLocked` (a Memory
Locket opens it). The Hunter has three versions (`Hunter`, `Hunter_v2`, `Hunter_v3`, one per
evolution, the slots moving out a little). The art is each Crest's `crestSprite`
(`crest.spriteatlas`: white line art, 430 to 610 px at 100 px to the unit), and the slots are the
game's own frames (`inventory.spriteatlas`: `UI_tool_slot_attack` / `defend` / `explore` /
`weave`, and `UI_tool_slot_locked_fill`), white, tinted by colour. The pane
(`coremanagers_assets__gamecameras.bundle`, «Tools»): the Crest with its slots on the left, the
Vesticrest's extra slots floating beside it, the Crest list and ‹ › to change it, the Tool list
scrolling on the right by colour, and the pointed Tool's description.

### The options (`18-crest-variants.html`, Save 4's build)

In all three: the Crest drawn as the game draws it, its slots where the game puts them; figures as
big numbers without formulas; no intro text; the levels as compact steppers.

- **A · the game's pane**: figures and levels on top; the Crest with its slots, and beside it the
  Tool list by colour with the pointed Tool described under it.
- **B · the sibling's**: a hero band with the Needle large, the Crest and the Tools to tap, the
  Silk Skills as large art with their damage, the rest under «Every figure».
- **C · slot first**: the Crest large; tap a slot and only its colour's Tools open to choose from;
  figures in a column beside it.

### Decision (28 September 2026)

**A · the game's pane**, built. `tools/extract-crests.py` writes each Crest's art to
`assets/crests/<id>.webp` (the Hunter's per evolution, `hunter-1/2/3`) and `js/crest-slots.js`:
the slots (`SS.crestSlots`), each art's size in units (`SS.crestArt`) and the five slot frames
inline (`SS.crestFrames`: a CSS mask won't take an image file over `file://`, it needs CORS). It
stops if a Crest's slots disagree with `js/data.js`, and `test/data.test.js` checks the same.

- The band (`.ct-band`): big numbers, their make-up in the `title`; the levels (`.ct-lv`) as
  − N + steppers, their buttons hidden in a save; the moment's switches beside them.
- The Crest (`.ct-crest`, `--crest-k` 64 px to the unit, 48 on a phone): slots placed at their
  (x, y), each colour's Tools in the game's slot order (open, then locked), a locked slot left
  empty with the locked frame, the Vesticrest's in `.ct-float`, in the box's bottom-right corner
  (no Crest's slots reach it) so the art stays centred over its name; ‹ › cycle the Crests you have.
- The list (`.ct-tools`) by colour and the Silk Skills, each on the Inventory's slot cell
  (`.inv-cell.is-slot`, Albert), only the diamond (no pip), filled and lit when worn; shown in a save too (read); the
  description (`.ct-desc`) of the one pointed at or tapped, else the first worn, with its numbers
  (a Tool not worn computed as if worn).
- Only the Tools and Silk Skills you have in the list (Albert), as the game's pane: a save's,
  or Free mode's marks (all without them); a colour with none is left out.
- Gone: the intro line (`ctLocked`), the formulas, «What the others do», the Silk Skills table.

### Second round: the figures on top (28 September 2026)

Albert: the band of numbers on top looks ugly (six loose figures left-aligned across the width,
tiny labels, steppers of uneven widths under them). `19-crest-figures-variants.html`:

- **A · the game's HUD**: the Needle drawn with the slash large beside it, damage a second and the
  Needle Strike, and Hornet as the HUD shows her (masks as masks, the spool with its silk).
- **B · centred ledger**: one centred row, the slash large in the middle, thin filigree rules.
- **C · under the Crest**: the top keeps only the levels; the figures as a 3 × 2 table under
  the Crest's name.

In all three, the levels as the game's upgrade pips with − and + either side.

Decision: **A · the game's HUD**, built (a second pass, Albert: "badly integrated": the three groups had been pushed to the edges with a hole between, the needle tilted into the figure; now one centred block on one baseline, the Needle upright, thin filigree rules between the groups). `.ct-band` is three groups: `.ct-slash` (the Needle's
art at its level, tilted, the slash at 1.7 × `--fs-2xl`), `.ct-mid` (the split Crests' other
attacks, damage a second, the critical, the Needle Strike) and `.ct-hud` (`assets/hud/mask.png`
per mask, the spool with the silk, «a Bind heals n»). The levels are `.ct-pips`, a pip a level
(Free mode: a pip sets it, the lit top one steps down), − and + only in Free mode.


## Step 9 · Combat

### What there is (28 September 2026)

A choose-one (one enemy · enemy gauntlets), a line about your build, a search and then the list of
every enemy, 1,300 px tall, before any fight shows. Under it, the enemy's card (portrait, health,
damage by level, stagger, phases) and three text blocks: the quickest way, what you do to it
(a row per attack with its make-up and the uses to kill), what it does to you (a row per attack,
«7 kill you · 10 if you Bind»), and two long paragraphs of how it's worked out. On a desktop the
card is sticky over the lists and covers them (a layout bug: `.ft-body`'s three columns collapse).

### What the sibling has

The duel: the Knight and the enemy face to face, each on its light (the enemy's Journal art), the
hits to win large in the middle and the hits to fall under it, the enemy's health as a bar; the
enemy in a picker; «your attacks» as cards with their art and damage, tappable to play the fight
out (a log, undo); «its attacks» with masks.

### The options (`21-combat-variants.html`, Save 4 against Lace)

In all three: the enemy in a picker with a search (not the long list), Hornet's own frame and the
enemy's whole drawing from the Journal, figures without formulas, the long notes folded.

- **A · the duel**: Hornet and the enemy face to face, slashes to win and its hits you take in
  the middle, the quickest way in one line, your attacks as cards (the quickest marked), its
  attacks with masks.
- **B · the enemy's page**: its drawing large on the Journal's light, beside it its name, health,
  stagger, phases, and your attacks as bars of hits to kill; what it does to you under it.
- **C · choose, then fight**: every enemy as a ringed portrait by area (as the Journal); a tap
  opens the duel in a sheet.

### Decision (28 September 2026)

**A · the duel**, built. The enemy in a dropdown (`<details class="ft-choose">`: the list hangs
from a zero-height relative wrapper, since Chrome doesn't give a `<details>`' content its box as
the containing block); the duel (`.ft-duel`: Hornet's
`ART.idle` and the enemy's `assets/journal/art/<key>.webp` on `--journal-light`, the slash's uses
and the fewest of its hits in the middle, the health bar with a tick per phase from `E.phases`,
the black-thread switch under it); the plan in one line (`.ft-plan`); your attacks as cards
(`.ft-cards`, the fewest uses framed, the make-up in `title`) and its with masks drawn
(`.ft-hits`); the damage-by-level, stagger, phases and every note folded (`.ft-how`). The
gauntlets use the same frame (the dropdown of arenas, a centred summary, the plan, the waves).
The sticky card and the three columns that covered the lists are gone.

Then (Albert: «it should be clickable to simulate the fight, as the sibling»), the basic fight:
`js/sim.js`, pure and tested (`test/sim.test.js`), plays moves on a kit the screen builds from
`E.compute`: damage per use (`rest`), masks, silk (full spool, +1 a landed slash, the Skill's cost,
the Bind's cost and heal), each Tool's uses, the phase thresholds; the cards, its rows and a Bind
button act (`ftAct`), greyed when they can't; a four-line log under the duel with Undo and Start
over. No clock and no stagger, unlike the sibling's arena. Gauntlets aren't played.

