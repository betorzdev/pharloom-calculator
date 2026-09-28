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
| 6 | Map (`map`) | **Next** | |
| 7 | Journal (`journal`) | To do | |
| 8 | Crest (`tools`) | To do | |
| 9 | Combat (`fight`) | To do | |
| 10 | The static pages (`tools/pages*.js`: `bosses/`, `es/jefes/`, the landing folders): they inherit steps 1 and 2; only what's theirs | To do | |

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

