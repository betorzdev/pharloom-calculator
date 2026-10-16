# The UI and UX review: plan and status

A review of the whole site's look and behaviour, started on 28 September 2026 at Albert's
request. It goes **from the most global to each tab**, one step at a time, and every step is
decided by Albert between options, never assumed. This file is the thread: any agent picking
the work up reads it first, then the step it's on.

## How each step goes

`/design-round` (`.claude/skills/design-round/`) runs these steps as a checklist.

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
   (`<base href="../">`, `css/tokens.css`, `css/app.css`), real data from a save, and a bar at the
   bottom where every open decision is a numbered row (1, 2, 3...) and every option a lettered
   button (A, B, C...), the recommended one marked ★, switching live, plus the width; the choice in
   the URL (`?v=b&w=390`). Every option checked by screenshot at both widths. Not part of the site:
   `index.html` doesn't load it, as `kb/` and the rest of `design/`. The page is a working tool:
   it isn't committed, and it's deleted once the step is built (pages 04 to 25 predate this).
5. **Propose with the option selector** (AskUserQuestion, not plan mode): open the page in the
   browser, name its file, say in one line what each decision is about, the recommended option
   first. Albert decides.
6. **Build what was decided**, update `docs/guide.md` if the page changed, `npm test`, and mark
   the step here (status, decision and date). Then a branch and a PR (`/finish`).

## The steps

| # | Step | Status | Variants |
|---|---|---|---|
| 1 | **The shell**: header, screen bar (desktop and phone), the screen's frame and title, footer and About, the atmosphere | **Built** (28 Sep) | [`04-shell-variants.html`](04-shell-variants.html) |
| 2 | **The components**: the four buttons, choose-one, on/off, search, lists and rows, tags, notices, empty states, the toast | **Built** (28 Sep) | [`05-components-variants.html`](05-components-variants.html) |
| 3 | Your game (`home`) and Saves (`saves`) | **Built** (28 Sep; the lists, 11 Oct; the calm round, its light and its map, 14 Oct; the summary, 16 Oct) | [`06-home-variants.html`](06-home-variants.html), `26-game-lists-variants.html`, `71-your-game-variants.html`, `73-your-game-light-variants.html`, `76-your-game-map-variants.html`, `89-your-game-summary-variants.html` |
| 4 | Inventory (`game`) | **Built** (28 Sep; purse, masks and silk 11 Oct; Free mode's start 13 Oct; third round 13 Oct; the materials and the lent Tools 14 Oct; the review's round 14 Oct) | [`07-inventory-variants.html`](07-inventory-variants.html), `29-inventory-variants.html`, `42-free-mode-start-variants.html`, `43-inventory-round3-variants.html`, `49-inventory-materials-variants.html`, `51-lent-tools-variants.html`, `62-inventory-variants.html` |
| 5 | Progress (`progress`) | **Built** (28 Sep; two tabs 11 Oct; at first sight, the leftovers and the steps in the game's words 13 Oct; the 100%'s look and a Tasks tab 14 Oct; the task's picture on the road, Tasks' pins to the Map and the main objectives' head 15 Oct; each wish's state from the save 15 Oct; the road's one list 15 Oct; the road to Act 2 as the whole route 16 Oct; Act 3's too 16 Oct; the guide's too 16 Oct; the bar's second round open) | [`10-progress-variants.html`](10-progress-variants.html), `75-progress-100-variants.html`, `78-task-pins-variants.html`, `79-road-task-variants.html`, `80-main-objectives-emblem-variants.html`, `81-task-states-variants.html`, `82-road-list-variants.html`, `83-road-route-variants.html`, `84-road-route-act3-variants.html` |
| 6 | Map (`map`) | **Built** (28 Sep; the selector 11 Oct; Passages, the wishes and objectives 11 Oct; the groups 12 Oct; its ground 14 Oct; counts, names and the card 14 Oct; the marks' size 14 Oct; a room's parts not mapped 14 Oct; what you already have 15 Oct; the Journal's enemies, every room 16 Oct) | [`12-map-variants.html`](12-map-variants.html), `50-map-ground-variants.html`, `64-map-variants.html`, `70-mark-size-variants.html`, `74-map-parts-variants.html`, `77-map-had-variants.html` |
| 7 | Journal (`journal`) | **Built** (28 Sep, three rounds; the controls 13 Oct; the pin to the Map 14 Oct; every room of an entry 16 Oct) | [`15-journal-variants.html`](15-journal-variants.html), `48-journal-controls-variants.html`, `69-map-button-variants.html` |
| 8 | Crest (`tools`) | **Built** (28 Sep; the slots as the game draws them, 13 Oct; middle widths 14 Oct) | [`18-crest-variants.html`](18-crest-variants.html), `43-crest-review-variants.html`, `52-crest-hud-variants.html` (kept out of the repo) |
| 9 | Combat (`fight`) | **Built** (28 Sep) | [`21-combat-variants.html`](21-combat-variants.html) |
| 10 | **Built** (28 Sep) · The static pages (`tools/pages*.js`: `bosses/`, `es/jefes/`, the landing folders): they inherit steps 1 and 2; only what's theirs | To do | |
| 6c | The Map's people: everyone in the world and every place that sells | **Built** (11 Oct) | `30-map-people-variants.html` (kept out of the repo) |
| 6b | The Map's admin mode (`#view=map&admin=1`): the panel, adding, the save check, hide and delete, the marks | **Built** (11 Oct) | `30-map-admin-variants.html` (kept out of the repo) |
| 1c | The site's icon: the favicon, the home-screen icon | **Built** (14 Oct) | `72-site-icon-variants.html` (kept out of the repo) |

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

### Retouch: the lists (11 October 2026)

Albert: the lists under the card should look much better. They were plain text. *Since the
previous save* was up to 29 bulleted names (Save 3 against its 1.0.28891 backup), with the +12% as
a small figure. *Closest to your bench* had tiny marks. *By part* was ten rows of "Tools 31/51"
with no picture and no gauge. The sibling gives each change its picture, closes the list with
the completion on a bar (its design/34 A) and fades the rows in. Four looks were drawn in
`26-game-lists-variants.html` (Save 3's changes and nearest things, Save 4's parts):

- **A · clean rows**: Progress's list rows on all three.
- **B · ledger and mosaic**: the parts as Progress's ledger, what you gained as pictures.
- **C · three plates**: each list on its own framed plate, lit by the screen it leads to.
- **D · the board**: the parts as ring tiles across the top, the other two below.

The page also had two switches: how a long *since* list shows (capped, everything, folded by
kind) and whether *closest* shows the distance in rooms.

Albert chose **A**, the since list **capped at 8 with «Show all n»**, **no distance**, and the
rows **fading in one by one** (none with reduced motion). Built (`js/app-home.js`, `.hm-*`):

- Every row is `.hm-row`: `.hm-art` (`--hm-art`), the name in Cinzel and its area under it.
- A Tool sits on its slot's diamond. Pieces, wishes and gauntlets use the Map's own marks
  (`App.mapMark` in `js/app-map.js`, which replaces `App.nearRow`).
- *Since* opens with the completion's gain on a gauge (`.hm-gain`, `.hm-bar`). Its rows are
  grouped by kind with `.hm-kind` heads; the new heads are `homeKindUpgrades` and
  `homeKindPieces`, and the rest reuse existing strings. The Journal shows as portraits.
  `homeSinceAll` / `homeSinceFewer` toggle the cap; a list of at most ten rows isn't capped.
- *By part* gives each part a picture, a count and a gauge; a full part lights its diamond.
- The rows fade in (`.hm.is-enter`, `--dur-step` apart) when the screen is arrived at or
  another save shows, not on a plain repaint.

### The calm round (14 October 2026)

Albert: «haz algunos diseños para enfocar la pantalla YOUR GAME de otras maneras». A first round in
`71-your-game-variants.html` drew five whole-screen approaches over the real screen and six saves
(0%, 15%, 55% at a respawn point, Steel Soul 100%, 100%, Free mode): A · what next (the road's step
leading), B · the pause menu (the area map as the scene, the HUD, the panes), C · a journey (the
Acts as a road, the bosses beaten), D · a dashboard (every count as a tile), E · calm (the card,
one call to action, the rest folded). Albert: «en la mayoría veo exceso de cosas. tiene que ser un
sitio agradable y tranquilo. Y no es muy conveniente poner demasiada información que ya la tenemos
en otras tabs». The second round, in the same page, started from less (only what this screen
alone says) with four options: A · the scene (the area's name in its light, its map faint
behind, Hornet at her bench, Act and time, the 100% as one figure; under it what changed, short),
B · the bench and one sentence (no map, what changed as one line by kind), C · the postcard (the
area's name between the game's filigree, what changed as a row of pictures), D · what changed
(the card beside the list); and a second row: no next step here, or one quiet line to Progress.

Albert chose **A, without the line «Coincide con el {n} % que muestra el juego»**, and **no next
step**. Free mode keeps the ghost bench. Built:

- `js/app-home.js`: the save's card is the scene (`.hm-scene`): «Resting at» or «Your respawn
  point», the area, Act and time, Hornet, and the 100% as one figure (`.hm-pct`) into Progress,
  «What's missing for 100%» (`homeGoProgress`), «Everything in Progress» (`homeAllParts`) at 100.
  Under it, *Since the previous save* alone, capped at five rows (`CAP`) with «Show all n».
- Gone from the screen, each to the tab that owns it: the parts of the 100% and the road line
  (Progress), the Journal's count (the Journal and the bar), masks and rosaries (the Inventory),
  *Closest to your bench* (the Map), the four ways on (the tab bar), and the matching line.
  The check itself stays in `npm run check-pack`; Progress still says when a save's own figure
  differs (`homeDiffers`), and no other screen showed the matching line.
- `js/app-map.js`: `App.mapAreaHtml` is a bare picture now (no marks, no Hornet, not a link,
  `aria-hidden`), set faint behind the scene; `App.nearList` is gone, and so is
  `App.roadNow` (`js/app-progress.js`), which only fed Your game's line. The strings only these
  used went with them (`homeMatches`, `homeParts`, `homeGoLabel`, `homeGoMap`, `homeGoJournal*`,
  `homeGoCrest`, `homeRoad*`, `homeNearMap`, `homeMapLabel`, `mapNear*`).
- The README's screenshots of Your game were taken again.

### Retouch: one light (14 October 2026)

Albert: «se mezclan dos difuminados y no queda del todo bien», the screen's own (the frame's red
light from the top, `.screen .frame-line`, `--tab-home`) and the bench area's (`.hm-card::before`,
`--area-<id>-fill`). Both lit the top half: the area's oval was cut by two red crescents at the
corners and the blend went muddy (brown over Deep Docks, mauve over The Cradle), with the lower
third black. Drawn in `73-your-game-light-variants.html` (kept out of the repo), the
real screen captured from seven saves (Deep Docks, Bellhart, The Cradle, Mount Fay, The Abyss,
Hunter's March, Bone Bottom) and Free mode, with the area switchable: A · one light, the area's
(the frame, corners, plaque and the light from the top in the area's colour, no glow of the
scene's own); B · two zones (the red only along the top edge, the area's low behind Hornet);
C · the frame red, one light inside in the area's colour; D · the red kept, the area only in its
name.

Albert chose **A** (14 October 2026). Built: `js/app-home.js` sets `--area-line` / `--area-fill`
on `.hm` instead of the card, so the frame inside it reads them; `css/app.css`
`.screen .hm:has(.hm-scene)` sets `--tab` to the area's line mixed into its fill as every tab's is
(`--tab-area`, 55%, `css/tokens.css`), and `.screen .hm .frame-line` lights it from the top a
little taller (90% × 78%), down to her bench. `.hm-card::before` is gone, and the ghost bench's
glow with it: Free mode keeps the red, one light. Seen on the way: on a phone a tall area's map
(The Abyss) ran about 120 px past the card and the frame, the grid row as tall as the map; the
map's figure is now a size container and the map fits it both ways (`100cqw`, `100cqh × --r`).

### Retouch: the map seen (14 October 2026)

Albert, on Save 4 (Deep Docks, 5%): «el mapa dibujado de fondo prácticamente no se ve». It had
been that faint since the calm round, not since the one light. The causes, together: what the game
doesn't draw yet was faded twice (to `--map-faint` inside the canvas, then the whole figure to
`--map-faint` × 0.7, about 0.14 in all, and 43 of Deep Docks' 46 pieces are that guide in Save 4;
Save 2 hasn't bought The Cradle's map, so all of it is); `--map-tone` darkened pieces that are dark
already (the game's fill, a median of 57/255); the one light from the top leaves the lower half
black, and up top the map's fill is the very colour the light is mixed from; and the whole area
fitted in the card drew a tall one (Deep Docks, 559 × 995 map pixels) at about half its size, its
middle under the title and Hornet, its edges in the mask. Drawn in `76-your-game-map-variants.html`
(kept out of the repo), the real screen over seven saves (Deep Docks, The Cradle, Mount Fay at a
respawn point, Bilewater, The Slab, The Abyss, Bellhart) and Free mode, two rows: 1, how it's
drawn (A as now, B stronger with the same look, C in the area's light, the map traced in its line
colour, D what she has walked lit and the guide grey); 2, its size and place (A as now, B the
whole area as large as the frame, C around her bench, filling the frame).

Albert chose **1 B** and **2 C** (14 October 2026). Built: the figure at `--hm-map-opacity`
(`css/tokens.css`, the guide's strength × 1.4, twice what it was), the Map's own tone kept; it
fills the scene (`.hmB-map`, no more `.hmB-view` or `--r`), its mask strongest round her and fading
to the sides, the foot and under the title; `js/app-map.js` (`areaCut`, inside `areaPaint`) cuts
the frame's shape from the area's box, as wide (or tall) as the area but never smaller than the
map's own size (on a phone, the rooms round her), with her bench's room right under Hornet
(`.hm-rest`), kept inside the area. Free mode, with no map, is as it was.

### The summary round (16 October 2026)

Albert: «quizás un poco de resumen de tu partida pero muy visual (nada sobrecargado), cosas como
las máscaras, tu carrete, el blasón con los items, el acto en el que estás». Drawn in
`89-your-game-summary-variants.html` over two real saves (Act 3 at 100%, Act 1 early), four rows:
1, where it goes (A the corners, the HUD where the game puts it; B one shelf under her bench; C
either side of her); 2, the Crest (A drawn with its Tools in their slots, B its emblem and the
worn as slot diamonds, C none); 3, the Act (A in the line as before, B three pips, C the game's act
card); 4, anything more (A nothing, B the Needle, C the Needle and the Silk Hearts).

Albert chose **1 C, 2 A, 3 C, 4 A**. Built:

- `js/app-home.js` (`worn`): Hornet between `.hm-self` (the act card, `saveAct` over
  `pgActName<n>`, from ACT_<n>_SUPER and ACT_<n>_NAME; the masks and the spool as the HUD) and
  `.hm-worn`, the Crest, a link to the Crest tab. The Act left the line under the area.
- `js/app-tools.js`: `App.wornNow()` gives the worn Crest as the Crest screen draws it, still
  (`crestHtml(…, still)`: the slots are spans, no arrows), and the masks and silk from the engine.
- `css/tokens.css`: `--hm-crest-k` (24 px, 19 on a phone) and `--hm-mask` (26 px, 20).

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
- **Retouch, the purse, Farsight, the Journal, the Relics and the Mementos** (11 October 2026):
  Albert asked what else the game's own pane holds. Drawn in
  `29-inventory-variants.html` over Save 4 and Save 1: **A · the
  purse above Items**, B · a strip across the top, C · with Hornet, D · a ledger. Albert chose
  **A**, the Growstone always shown (dimmed until you hold one), the five rosary strings, the
  Relics one cell per kind, and in Free mode a typed figure for the two currencies and − N + for
  the rest. Built: a «Monedero» section with Rosaries (`geo`) and Shell Shards (`ShellShards`,
  against the Pouch's 400 to 800), under each the strings, bundles and shards that break into it
  (the Collectables' `Amount`, `js/collectibles.js` PURSE) and the sum if you broke them all; the
  Farsight and the Hunter's Journal as cells of Items; the Relics (N of each kind) and the
  Mementos on shelves of their own, read from the Map's EXTRAS. Free mode keeps them in
  `pharloom.progress`. The Rosary_Set_* save names are the game's own item assets (checked
  against `kb/data/game/pickups.json`).
- **Retouch, the masks** (11 October 2026): ten equal columns across the field left each mask
  small at the left of its own, far apart, the row short of the count. Drawn in
  `26-inventory-masks-variants.html` (kept out of the repo): **A · together, as the HUD**, B ·
  edge to edge, C · together and large, D · two fives. Albert chose **A**: a tight row from the
  left, the masks a step larger (`--sp-8`), as the HUD and the save slots draw them.
- **Retouch, the silk** (11 October 2026): under the masks drawn together, the beads spread
  across the field looked loose. Drawn in `26-inventory-silk-variants.html` (kept out of the
  repo): **A · beads together**, B · the HUD's spool, C · nine and nine. Albert chose **A**: the
  same beads on their thread, strung tight from the left, the thread drawn bead by bead.

### Free mode's start (13 October 2026)

Found in the Progress review: in Free mode the Inventory started every ladder at the top («Everything
maxed»), so a first-time player who marked four Tools read 40% on Progress (the Act 2 save's own
marks are 15%; the masks, silk, Silk Hearts, Needle, Kit and Pouch at the top made up the rest). The
ladders were the Crest screen's build (`pharloom.build`, `FREE_START`), so trying builds and keeping
your game by hand shared them. The sibling does the same, and worse: its Free mode opens at 65% with
nothing marked (the Knight maxed and every charm had).

The options (`42-free-mode-start-variants.html`, the real page over a first visit, an older visit
with marks and a game marked by hand, kept out of the repo): 1 where Free mode starts (**A** a New
Game, B everything maxed as it was, C ask once); 2 the Crest screen (**A** a «Try with: Everything ·
What I have» switch, B always everything, C the Inventory's marks as it was, which with a New Game
leaves an empty Hunter); 3 Progress (**A** counts from the start, 0% with its boxes, B the guide
until something is marked); 4 an older visit's marks (**A** the levels left at the top go to a New
Game's, those moved by hand stay, with a notice; B kept as they were).

**Decision: A in all four** (13 October 2026), built:
- Free mode's marks are your game and start as a New Game (`App.freeGame`, `js/app-saves.js`): the
  Hunter Crest and nothing else. The ladders and the Hunter's evolution are the marks', in
  `pharloom.progress` as a save keeps them (`needle`, `kit`, `pouch`, `masks`, `spools`, `hearts`,
  `build.hunterStage`); the Inventory sets them (`invLevel`), Progress and the Map read them.
- The Crest screen's build is apart. «Probar con: Todo · Lo que tengo» (`prefs.ctTry`): Everything
  is the build as it was, every Tool at hand; What I have takes your levels and evolution, the
  Vesticrest Eva would give for the Crests and Memory Lockets marked (`engine.vestOf`), and only what's
  marked, and its level steppers set your game. A link with another build opens on Everything.
- Progress counts in Free mode from the start (0% on a New Game), its boxes always there.
- `saves.migrateFree` moves an older visit's marks once, on load, wherever Free mode's slot is (the
  live keys or its copy while a save is active; a save's keys are never touched). The notice
  («Novedad», `pharloom.freeNote`) showed on the Inventory and Progress until «Entendido»; removed on
  13 October 2026 at Albert's request (no «New» notices), the migration now silent.
- Plain fixes: «Todo al máximo» marks everything (100%) instead of clearing the marks; «Partida nueva»
  (`PROFILE_NEW_GAME`) instead of «Hornet al empezar», and a New Game's Hunter is at evolution 1 with no
  Vesticrest; Progress lets you mark without going to the Inventory first; the Map's first mark no longer
  starts from «everything but the pieces»; on a phone «Empezar desde» takes its own line; the Crest screen
  on «Lo que tengo» with no Tool marked says so, with the way to the Inventory.

### Third round: the whole screen, off and on (13 October 2026)

Albert asked how to reorganise the Inventory now that all its content is in, and how each part
should look when it's off (not had yet) and on. Looked at over Free mode (a New Game, everything
marked) and three real saves (an Act 1 restore point at 10%, an Act 2 one at 55%, user1 at 100%),
at 1440 and 390, and against the sibling's sheet with a save and in Free mode. What was weak:

1. A 100% save showed six grey Tools: the base of the three upgraded ones, Shell Satchel's twin,
   and Snare Setter and Needle Phial, which a wish lends and takes back. Fifty-seven cells for 51
   points.
2. Items was a bag of unnamed icons (loose shards, materials, key items, Old Hearts, melodies,
   fleas): «0/4» under a faint picture says nothing until you tap it.
3. The right column ran about 350 px past the left; on a phone the screen was about 5,500 px.
4. On a New Game the Tools were 57 identical grey diamonds (the locked slot): the three colours
   gone.
5. The colour rows and Items had no maximum; the Crests said 0/6 with the Hunter Crest lit.

The options (`43-inventory-round3-variants.html`, the real shell and data over the five states,
kept out of the repo): 1 the order (**A** each thing beside what it feeds, two columns and a band
under both; B as it was; C three tabs, Hornet · Blasón · Objetos); 2 the heads (**A** n/max
everywhere and the rule as a gauge; B the count only; C a figure at the end); 3 a Tool you lack
(**A** the slot hollow in its colour; B the grey locked slot as it was; C a dark silhouette
rimmed in the colour); 4 the Tools that aren't a point (**A** one slot per point, the lent two
apart; B 57 as it was; C 51 without the lent two); 5 the things (**A** plates with their name; B
icons as they were; C rows); 6 what you lack in a save (**A** faint, as it was; B folded when a
shelf is empty; C only what you have, with a switch).

**Decision: A in all six** (13 October 2026), built in `js/app-game.js` and `css/app.css`:
- Left, Hornet: the Needle with the Pale Oil under it; the masks with the loose Mask Shards under
  them and the silk with the loose Spool Fragments (the game's piece lit up to what you hold, «four
  make a mask», «two make a spool»); the Silk Hearts; the Silk Skills; the abilities. Right, her
  equipment: the Crests with the Memory Lockets, then the Tools with the Kit, the Pouch and the
  Craftmetal on top. Under both (`.inv-bag`): the purse and the items, then the Relics and the
  Mementos. A material shows as a small picture with its count (`mat`), − N + in Free mode.
- Every head counts n/max and its rule is a gauge in bone (`.inv-h.is-gauge`, `--f`); complete,
  the rule glows and its diamond fills. The colour rows say n/max of their points; Items counts
  the Everbloom, Farsight, Journal, Old Hearts and melodies (the fleas have their own count); the
  Crests count the Hunter Crest too (of 7), since it's drawn lit (the 100% counts 6: Progress
  still does).
- A Tool you lack: its slot hollow in its own colour, the picture faint grey (it was design/09's
  grey locked slot).
- One slot per point (`CO.COUNTED`): a Tool and its upgrade share one, showing the one you have
  with two pips (had, upgraded); Shell Satchel shows in Dead Bug's Purse's slot. In Free mode a
  tap on a shared slot goes none, had, upgraded (`invTwin`), as a save keeps them. Snare Setter
  and Needle Phial sit after the colours under «No cuentan para el 100 %».
- The Crests, the items, what's in the purse, the Relics and the Mementos are plates as the Silk
  Skills': picture, pip, name, then the count or «Sin conseguir» (`invNotFound`).
- «All · None» on Items now touches only its shelf (it marked every piece of the game before).

### Retouch: the materials (14 October 2026)

Albert: the Memory Lockets and the Pale Oil «no se ven bien puestos». The third round's `mat` (a
small picture with its name and count beside it) sat badly in both places: under the Needle the
block was centred with the picture to one side, so the name fell off the caption's axis; under
the Crests the locket hung small against the grid's last row. The Craftmetal, the same piece,
looked out of step with the Kit and the Pouch above it.

The options (`49-inventory-materials-variants.html`, the real sections the site renders, in Free
mode, an Act 2 restore point and user1; kept out of the repo): 1 the Pale Oil (**A** a row of the
game's flask lit up to what you hold, as the loose shards, centred under the Needle's name; B a
centred plate; C a row as the Kit's); 2 the Memory Lockets (**A** a row as the Kit's, apart from
the Crests by a rule; B one more plate after the Crests; C one compact line); 3 the Craftmetal
(**A** a third row under the Kit and the Pouch; B as it was).

**Decision: A in all three** (14 October 2026): the Pale Oil goes through `loose` (`is-centre`),
and `mat` draws the Kit's row (picture `--sp-12`, name, count or − N + under it), the Memory
Lockets with a rule above (`is-rule`), the Craftmetal inside `.inv-levels`.

### Retouch: the lent Tools (14 October 2026)

Albert didn't like Snare Setter and Needle Phial, the two reds a wish lends and takes back, set
apart under the three colours («No cuentan para el 100 %»).

The options (`51-lent-tools-variants.html`, the real site with the variant over it; kept out of
the repo): **A** among the reds where the game lists them (Snare Setter after Flintslate, Needle
Phial last), their slot dashed, a line under the row saying why, the count still n/18; B the same
at the end of the reds; C hidden unless the save holds them right now, never in Free mode.

**Decision: A** (14 October 2026): the red row takes them in `D.TOOLS` order, out of the count
(`li.is-lent`, a dashed slot), and `.inv-lent` under the row explains the dashed diamond.

### Retouch: the whole-site review (14 October 2026)

Three things the review of the Inventory found: the abilities' head said n/7 over eleven plates,
with nothing saying which four the 100% leaves out; in Free mode the Memory Lockets, the Craftmetal
and every other − N + showed a figure with no maximum, where a save shows «15/20»; and an evolved
Hunter Crest kept the base Crest's picture, where the game draws the evolved one.

The options (`62-inventory-variants.html`, the site's own render of an Act 3 restore point and of
Free mode marked part way; kept out of the repo): 1 the abilities (**A** the four outside the 100%
under their own sub-head, «Otras habilidades n/4», as the Tools' colour rows; B the head counts all
eleven; C as it was); 2 the maxima (**A** every − N + of a material, the purse, the Relics and the
fleas carries its maximum, «− 6/20 +»; B only the lockets and the Craftmetal, the figure as a
save's beside − +; C as it was); 3 the evolved Hunter (**A** the evolved Crest's own picture; B as
it was).

**Decision: A in all three** (14 October 2026): the abilities split by `completion.ARTS`, the four
under an `.inv-sub` named with Progress's `pgOtherArts` (the game has no name for them); `stepper(x,
true)` adds the maximum in the materials and the plates (the loose shards and fragments keep theirs
in the row beside); the Hunter Crest's art is `assets/crests/hunter-<stage>.webp` from stage 2 (the
wiki's «Hunter Crest Inventory 2/3», the Crest screen's art), its stage from Eva's rewards.

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

### Retouch: inside the categories (28 September 2026)

Albert: the inside of the drop-downs is awful (a squeezed «See on the map» link breaking each
row, plain small text, no pictures). `25-progress-lists-variants.html`, over Save 4's rows:
A cards, **B clean rows** (chosen), C by area. Built: each row the thing's picture, its name in
Cinzel (a Tool with its slot's diamond) and how to get it under it, how far large with the area
under it on the right, and a round pin button to the Map (`mapShow`); the Acts as small heads
over their rows (`listHtml`), the Act beside the area when sorted by nearest. On a phone the place
goes under the name and the pin stays on the right.

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

### The restructure: two tabs (11 October 2026)

Albert: organise the whole screen better; what players value most is what's left for the next
Act. Should the Acts and the 100% be two subtabs? Two rounds, over three real saves (Act 2 at
55%, Act 1 at 10%, Act 3 at 63%).

Round 1 (`27-progress-variants.html`): A two subtabs, B one page with the next Act first, C
three subtabs, D two columns; and how what's left reads, which tab opens, Act 3, Tasks, the ring
and the road on a phone. Albert: two subtabs, but the plaque's tab names wouldn't be noticed;
what's left was too much text; the tab used last opens (the Act's the first time); in Act 3
«Tu partida»; the wishes the next Act requires go in its tab, the rest stay in Tasks; the ring
only on the 100% tab; every step of the road named on a phone.

Round 2 (`27b-progress-variants.html`): the tabs as A the pause menu's bar with L/R arrows, B two
plaques, C a segmented control with figures, **D two cards with a picture** (chosen); what's left
as A medallions, B the road drawn, **C rings** (chosen), D the HUD's masks and silk.

Built (`js/app-progress.js`, `css/app.css`):
- `.pg-tabs`: two cards, `role="tab"`, the open one white on the picked grey. The road's shows the
  step you're on (its picture, «11/15 · paso 1 de 5»); the 100%'s a small ring and what's left. The
  tab is `prefs.pgTab` (`pharloom.prefs`).
- The road's tab: the journey (no title: the card says it), the step with its picture, one ring per
  part of it (`rings()`: required wishes, wish points, the other conditions; the Bellshrines; the
  snare's pieces) with the game's picture inside, the figure under it and only the missing as
  medallions (`medal()`: picture, name, the Map's pin when it has the thing); the points show the
  nearest four wishes, «½» on a delivery. The later steps dim. «El camino entero» still opens the
  full road. (The bridge to the 100%, a count of what you could already get and «Ver el 100 %»,
  was taken out: Albert didn't want it.)
- In Act 3, «Tu partida»: the game's thread, a ring of the endings and one of what only Act 3 holds.
- The wishes' pictures are the game's: each type's large emblem and the Wishes tab, read from its
  files by `tools/extract-wish-icons.py` (QuestType `largeIcon` in `wish.spriteatlas`). The steps'
  are the map's quest medallions, the Journal's portraits and the benches.
- Tasks leaves out the ten wishes Act 3 requires while they're in the road's tab.

Round 3, the rings (`33-road-rings-variants.html`, 11 October 2026). Albert: the rings are pretty
but don't read: what each counts, and what's missing for the next Act. Over Save 2 (Act 2 at 15%,
Silk and Soul): A the rings explained (a line that all three are needed, a + between them, each
one's goal in a sentence), B a list with bars, C what's missing first (a sentence of the three
counts as switches), D rings counting down («9 · faltan»). Albert, then E: the rings on top, and
below as the 100% tab. **Decision: E** (11 October 2026), built:
- `parts()` gives the step's parts, each its ring and its rows; on top `.pg-rings.is-sum`, the rings
  small side by side (`--pg-tab-art` × 2, × 1.5 on a phone), and for Silk and Soul `.pg-lead`, that
  all three are needed. The third ring is «Cuatro condiciones» with a fixed picture (the Bellhome).
- Under them each part is the 100% tab's `group()` with its rows (`row()`): every row, the done
  ones ticked; open at first and folded as left (`prefs.pgShut`); its goal and what's left as the
  group's note. The medallions under the rings are gone (they stay for the later steps and Act 3).
- The road card counts as the rings do (3/31 here, not the step's 2/15, which counted all the points
  as one thing). The Lace check was checked: `defeatedLaceTower` is set only in Song_Tower_01, the
  Cradle's tower, so «Derrota a Lace en la Cuna» is right (Save 2 has the three melodies).

### At first sight (13 October 2026)

Albert: a first-time player must understand the tab at once; people look for guides on getting from
Act 2 to Act 3. Looked at over five real saves (none, Act 1 at 7%, Act 2 at 15% and at 61% just
before Act 3, Act 3 at 72%, 100%) and the sibling's ledger. What a newcomer didn't get: nothing said
what the tab is, nor that the game has three Acts; «Desbloquea el deseo «Seda y alma»» opened it with
no word that this wish opens Act 3; at 61% the three things left sat among 42 ticked rows, three
screens long; the thread's steps were bare nouns («Muro de deseos», «Cuidador»); nothing said how the
100% splits (the Tools are half); without a save the 100% card was an empty ring with a lone «%», and
the guide a long flat list with no word about importing; at 100%, «0 cosas… que ya puedes conseguir».

The options (`40-progress-clarity-variants.html`, the real page over the five saves, each decision
switchable): 1 the top (A the three Acts and a sentence, B the sentence, C as it was); 2 the step
(A «Lo siguiente», only what's missing, numbered, the whole list folded; B the lists without the
done rows; C as it was); 3 the thread (A steps named as actions, B a numbered list down the page, C
as it was); 4 the 100% (A a bar of the split with its legend, B a sentence and «n % to go» per row,
C as it was); 5 no save (A the invitation, the card's figure and both roads with their threads and
lists folded, B the invitation and the card, C as it was).

**Decision: A in all five** (13 October 2026), built (`js/app-progress.js`, `css/app.css`):
- `actsTop()`: `.pg-acts` over the tabs, the three Acts on the journey's thread with `ACT_n_NAME`
  under each, yours marked «Estás aquí», and `.pg-here`: the step and what's left of it in the
  rings' units, or the 100% in Act 3, or what the tab is without a save.
- Steps are read by id (`TITLE`, `SHORT`, from `js/acts.js` next()), so a step the road gains keeps
  its words; the thread shows «n · what to do», the later medallions the same.
- `todoHtml()`: «Lo siguiente» from the parts' own rows, the done left out; the wish points short as
  one line with the four nearest wishes (`byNear`, rooms from the bench); «Talk to Pavo» once the key
  is ready. The parts' groups fold under «Ver la lista entera» (`prefs.pgList`).
- Act 3 keeps only the endings on its thread (`journeyEnds`), the thread unlit: they aren't a
  sequence. The bridge to the 100% is gone when nothing's left to get.
- The 100% tab: `.pg-split`, a bar of a hundred by category, its legend and «La cifra de cada fila
  es cuánto tienes de lo que vale, en puntos del 100 %» (not «each thing is 1%»: masks and spools
  count whole), and a «Tienes / vale (%)» head over the rows.
- No save: `.pg-invite` with «Importar del juego» over either tab, the card «100 % en 10
  categorías», each road with its thread (`journey(r, true)`) and every list under «Ver los n».

### The leftovers (13 October 2026)

What the three Progress PRs of the day left open, looked at over the real saves (none, Act 2 at 15%
and 61%, Act 3 at 76% in Steel Soul with Twisted Child closed, 100%, 100% in Steel Soul with an
ending closed, Free mode with marks) in `41-progress-leftovers-variants.html` (kept out of the repo):
1 the endings ring with one closed (**A** count the ones still within reach, B all four with the
closed share dim, C as it was); 2 long how lines on a phone (A two lines and «more», **B** the
lead and «+n more», C a part a line, D as it was); 3 the step thread on a phone (A names taking
turns above and below, B numbers and only the current step named, **C** down the page, D as it
was); 4 rows that only say their area (**A** a line, «Found in the area», B the area under the
name, C a note in the group, D as it was); 5 Your game's road line (**A** one line with the step's
name, B a small card, C as it was); 6 Free mode with marks (**A** the top says what it counts and
the ladders' groups where they're set, B only the top, C as it was).

**Decision: 1 A, 2 B, 3 C, 4 A, 5 A, 6 A** (13 October 2026), built (`js/app-progress.js`,
`js/app-home.js`, `css/app.css`):
- `endsOf()`: in Act 3 an Act 2 ending never seen is closed; the thread crosses it out with
  «cerrado», the ring is «Finales a tu alcance» over the open ones with a line naming the closed,
  and the tab's card says «n de m finales a tu alcance».
- `howParts()` and the wish rows give each how line its lead (who asks and what it asks, the shop
  and its price, the caravan's stop) and what it waits for (what posts it, the wish first, the Act,
  the keys); `howHtml()` folds the second behind «+n más» (`pgMore`) at 640 px and under.
- `.pg-journey.is-road`: on a phone the road's thread runs down the page, a step a line.
- `isFound()`: a missing thing of the 100% whose way is `found` says «Se encuentra en la zona: el
  alfiler marca dónde» (without the pin's half when the Map has no mark for it).
- `App.roadNow` carries the step's short name; Your game's line reads «Camino al Acto 3 · paso 1 de
  5: Desbloquea «Seda y alma» · 28 de 31».
- Free mode with marks: «Modo libre.» and what it counts over the tabs; the masks', silk's,
  upgrades', Needle's and Silk Hearts' groups say «Esto se fija en el Inventario» with the way there.
- Plain fixes: no «·» head (Act heads only when a list spans two Acts), «Te falta 1», the bridge's
  figure centred on a phone, the tab card's name balanced (no lone «3»).

### Each step in the game's words, and on the Map (13 October 2026)

Albert: clicking a step of the road could explain it (only with the game's own texts and
translations), or put a pin for the Map. Looked at over real saves (Act 1 at 7% and at 10% by the
Phantom, Act 2 at 15%, 42% and 61%, the later steps simulated from them, Free mode) and the sibling's
Map focus. The game has an objective text for every step but two (unlocking Silk and Soul, and the
Last Judge, who has her Journal line), and its own map pins for the Grand Gate, the Citadel and the
Soul Snare. `28-progress-steps-variants.html` (kept out of the repo): 1 the step you're on (**A** its
card under the heading, B folded, C as it was); 2 the other steps (**A** the thread and the medallions
open their card, B a tooltip, C as it was); 3 the Map (**A** all that's left of the step at once, the
sibling's focus, B the nearest mark, C the rows only); 4 each row (**A** «What the game says» folded,
B always, two lines, C as it was); 5 the steps with no objective (**A** the Judge's Journal line, B
none).

**Decision: A in all five** (13 October 2026), built (`js/app-progress.js`, `js/app-map.js`,
`css/app.css`, `tools/extract-quests.py`):
- `stepCard()` under `.pg-now` and under each step of the whole road and the guide: the tag of where
  the game says it («Tareas», «Diario»), the objective's name and line, its description for the
  state the save is in (`STEP_SAYS`: CHAIN `desc`, or `ready` once its targets are met), and
  «Ver los n en el mapa».
- The thread's steps are buttons (`.pg-jstep`), the later medallions too (`.pg-md-peek`):
  `peekHtml()` opens the step's card where it was clicked, one at a time; the step you're on goes
  to its heading.
- `stepMarks()`: the Bellshrines not rung, the objectives' pins by their quest (`goal()`), the Judge
  and the Phantom, the Caretaker and Bellhart's Wishwall, what's next of a step of several things;
  the nearest to the bench first. `App.mapFocus(keys, name)` shows only those, fitted, with a line
  in the search's place (‹ i of n ›, ×); any switch ends it.
- `saysRow()` under the rows: `wishSays()` (the Wishwall's text until the save says it's taken,
  then «Tareas»'s), the Caretaker's directions per piece, the Inventory's lines, `laceSays()`.
  The shrines', Lace's and the key's rows have their pins.

### The 100%'s look, and Tasks (14 October 2026)

Albert, on «For 100%»: the bar split in pieces could be much prettier; the line on what each row's
figure means goes; opening a section shows no intro text (then: nor under a part's title, as «Other
collectibles»); an open section's things should take the whole width; is TASKS the wishes? (Yes:
«Tareas» is the pause menu's pane, PANE_QUESTS, the 21 main objectives and the wishes by type, none
of which counts for completion; it sat in the 100% tab only as the tab of lists.) Could the Tasks have
pictures, if the game has them? (It has, for every one: design/00-study.md §9, «The pane «Tareas»'s
own pictures».) `75-progress-100-variants.html` (kept out of the repo), the real page over six games
(5%, 15%, 55%, 77%, 100%, Free mode), the texts already gone in every option: 1 the bar (**A** one
line in a filigree frame with diamond ends, a notch per category and a taller one where the Tools'
half ends, B a hundred diamonds, C two halves, D finer segments); 2 an open section (A rows to the
full width, **B** one line per thing on a computer, C B to the frame's width); 3 Tasks (**A** a tab of
its own, B where it was, C under the road); 4 its pictures (**A** the pane's, B and the reward's, C
none); 5 the «For 100%» title repeated under the bar (**A** gone, B as it was); 6 the parts' titles
(**B** with the masthead's filigree, A as they were); 7 the Tasks groups' heads (**B** with the type's
emblem, A as they were).

**Decision: 1 A, 2 B, 3 A, 4 A, 5 A, 6 B, 7 B** (14 October 2026), and Free mode's «This is set in the
Inventory» stays (it isn't an intro: it says why those rows have no box). Albert likes the bar as one
line in pieces but wants more designs of it: a second round of the bar alone is open on the same page.
Built (`js/app-progress.js`, `css/app.css`, `tools/extract-wish-icons.py`):
- `splitBar()` and its `.pg-split` block, self-contained so another design can take its place.
- No line under the split, a part's title or an open group (`pgSplit`, `pgBeyondNote`,
  `pgTasksNote*`, the groups' notes `pgWholeNote`, `pgSpoolNote`, `pgToolsTrap`, `pgNote_*` gone; the
  road's notes stay). What they said is in docs/guide.md.
- `.pg-groups.is-wide` (the 100% and Tasks): an open group's rows from the left edge; from 700 px
  each thing one line (picture, name, how, where, pin).
- Three tabs (`TABS`, `prefs.pgTab` 'tasks'): Tasks' card the pause menu's Wishes tab and how many
  are done; on a phone a card keeps its figure and drops the words after it (`.pg-tab-x`).
- `taskIcon()`: the pane's picture by each task (`assets/icons/tasks/`), and each type's group its
  Wishwall emblem (`.pg-emb`; `pips` keeps the head's pips, as its pictures repeat).
- «Other collectibles» under `App.crown()`, the masthead's filigree.

### Retouch: the task's picture on the road (15 October 2026)

Albert: each Act's road can have a task at its top (the card under the step's heading, «Tasks ·
Grand Gate · Pharloom»); its picture would make it prettier. The picture is the one the Tasks tab
draws by it (`taskIcon`): Act 1's steps 1 and 2 the Grand Gate, step 4 The Great Citadel (step 3 is
the Last Judge's Journal entry, not a task); Act 2's steps 2 to 4 Silk and Soul (a Wayfarer wish:
its type's emblem), step 5 Soul Snare, and step 1 (unlocking the wish) none. Act 3 has no road.
`79-road-task-variants.html` (kept out of the repo), the real screen captured from saves in Act 1
(steps 1 and 4) and Act 2 (step 1, with step 5 opened): 1 where (**A** beside the card's words, B
above them, C in place of the step heading's picture); 2 its size (**A** 48, B 64, C 32); 3 a frame
(**A** none, as the Tasks tab, B a medallion, C a diamond); 4 the step with no task (**A** the wish it
opens, Silk and Soul, its picture dim and its name and place, B nothing); 5 which cards (**A** every
task's: the head, a step opened and the whole road, those at 32; B the head only; C also the
Journal's portrait).

**Decision: 1 A, 2 A, 3 A, 4 A, 5 A** (15 October 2026). Built (`js/app-progress.js`, `css/app.css`):
`questSays()` carries the quest's picture (`questIcon()`, through `taskIcon()`), `saysHtml()` puts it
beside the words (`.pg-says-task`, `.pg-says-art`), and `STEP_SAYS.unlock` is the wish Silk and Soul,
dim, with no tag and no line (a step opened still says the game has no text for it).

### Tasks' pins to the Map (15 October 2026)

Albert: pins in Tasks, to go to the Map? The tab's rows had none (no `mark`: the empty slot). Every
task has a place on the Map: who gives it (`board:` or `giver:`, js/quests.js FROM, the Pre first),
54 of the 74, and what it asks for (js/spots.js TASKS by its quest or a stage before it no other
task names; the melodies' and Old Hearts' pieces), every main objective. `78-task-pins-variants.html`
(kept out of the repo), the real tab captured over Save 4 (Act 1), Save 2 (Act 2), Save 1 (Act 3) and
Free mode, each pin opening what the Map would show: 1 the pin (**A** the lists' round pin, B with
how many marks, C the Map's own mark in the circle); 2 where it goes (**A** where the task stands:
not taken, who gives it; taken, what's left of it, then back to who gives it; an objective its pin,
B who gives it and what it asks together, C who gives it only, D two pins); 3 a task with no place
(**A** the empty slot, B a dim pin, C a line «No mark on the map»); 4 a task done (**A** no pin, B a
faint one).

**Decision: A in all four** (15 October 2026), built (`js/app-progress.js`): `taskPin()` gives each
row not done a `focus` key, kept in `FOCUS` as the road's steps are; `row()` sends it to `pgFocus`
(`App.mapFocus`: one mark is `App.mapShow`'s, several the Map on them alone, the nearest to the
bench first). `taskStages()` and `taskTargets()` find the marks; test/spots.test.js checks every task
has a place. Over the 73 saves of Albert's folder and Free mode, every task not done had its pin
(2,898 rows, none left with the empty slot).

### The main objectives' head (15 October 2026)

Albert: in Tasks every type's group has its emblem by its name, but «Main objectives» had an empty
slot, and its row looked gapped. The game has no emblem for them: each MainQuest of
`mainquests.bundle` has a `typeLargeIcon`, empty in every one, and the pause menu's pane
(`_GameCameras/.../Inventory/Quests/Quest List`) puts them on top with no heading, then its «Current
Heading», only a filigree (`completed_quests_spacer`), then the wishes. The Hornet mask that opens
the `QI_Main_*` series in `inventory.spriteatlas` (`QI_Main_0000_1`, and `_weave`) is in no other
bundle: the game never draws it. `80-main-objectives-emblem-variants.html` (kept out of the repo),
the real tab captured over Save 2 (Act 2, 7/21), closed and open: 1 the slot (A the Hornet mask, B
no slot, C the current objective's own picture, D the pane's icon, as on the tab's card, E as the
game: no slot and the pane's filigree between the objectives and the wishes, F the mask with its
weave).

**Decision: 1 E** (15 October 2026), built: `tools/extract-wish-icons.py` also writes the filigree
(`assets/icons/tasks/spacer.webp`, whole and lossless); `tasks()` (`js/app-progress.js`) gives the
main objectives' group no slot and puts `.pg-spacer` between it and the wishes, only when both are
drawn; `css/app.css` centres it in a row's height (`--filigree-art` in the tokens, the plaque's
share).

### Each wish's state from the save (15 October 2026)

Albert: the game's wishes have states (promised, under way with part of it done, done), and Tasks
showed only done or not. The save has them: `QuestCompletionData` keeps `IsAccepted` and
`IsCompleted` for each quest (the site already read the first as `taken`), and what a wish asks to
be brought is a `Collectable` held (its `Amount`; the Needle Phial a Tool unlocked): over the 73
saves, a hunt's `CompletedCount` while open always equals that amount, so the amount is the count.
The game's pane says «Wish Promised» (`WISH_PROMISED`) and, once the targets are met, each quest's
`_DESC_READY` line (js/quests.js CHAIN `ready`). `81-task-states-variants.html` (kept out of the
repo), the real tab's HTML for `Restore_Points3/restoreData22.dat` (nine wishes promised) and
`user1.dat` (a delivery carried), the states read from the same files: 1 the row (A in the how
line: what it asks with what's carried, «Ragpelt 7/25»; B the count in large numerals where the
area was; C a thin bar per thing asked), 2 the order (A first in their group under «Promised»; B a
group of their own on top; C by Act as before), 3 the group's pips (A a promised one half lit; B
as before).

**Decision: 1 A, 2 A, 3 A** (15 October 2026), built: `js/savefile.js` keeps `carried` (every
thing a wish asks for, by its save name, only the held); `wishState()` and `wishLine()` in
`js/app-progress.js` give a promised wish's row its mark (`.pg-promise`, filled when ready), its
line and «Deseo prometido» for a screen reader; `listHtml()` puts the promised first under
«Prometidos» and then always heads the rest; `strip()` lights their pips halfway
(`.pg-pips i.is-promised`). The ten wishes Act 3 requires are the road's, which doesn't count them
yet; the main objectives too.

### The road's one list (15 October 2026)

Albert, over Save 4 (Act 1, the Bellshrines): «Lo siguiente» and the folded «Ver la lista entera, con
lo hecho» repeated the same missing rows; in Act 2 (Save 2, «Seda y alma») the whole list only added
what's done and the 23 wishes for points past the nearest four. `82-road-list-variants.html` (kept
out of the repo), the real panel of both saves: 1 the list (A one list: «Lo siguiente» is the step's
whole list, the done rows ticked and dimmed, the 100% tab's «Lo que falta · Todo» toggle, «y 23 más»
unfolding the rest of the wishes; B by parts, the rings' parts as groups, every wish for points in
full; C «Lo siguiente» as it was and only what's done folded under it); 2 where the done rows go (A
in place, B at the end under «Hecho»); 3 the toggle (A «Lo que falta» first, shared with the 100%
tab's; B its own; C «Todo» first).

**Decision: 1 A, 2 A, 3 A** (15 October 2026), built (`js/app-progress.js`, `css/app.css`):
`todoHtml()` carries the toggle (`prefs.pgAll`, the 100% tab's own) under its title; with «Todo»,
`todo()` keeps each part's done rows in their place, the number's diamond ticked (`.pg-num.is-done`),
and the wishes that gave points as dashed chips among the options. Every wish for points is in the
line, the ones past the nearest four folded under «y n más» (`pgOpts`). The folded groups
(`prefs.pgList`, `prefs.pgShut`) and the parts' goal sentences are gone.

### The road to Act 2 as the whole route (16 October 2026)

Albert, over Save 4 (Act 1, step 1): could the road be «the whole route», with the step you're on
open? The road tab said its four steps up to five times (the sentence on top, the card, the thread,
the dim medallions of the steps to come, and «The whole road» folded under them), the ring under the
step repeated the card's 3/5, and a step of one thing (walking into the Citadel) listed its own title
again as «What's next». The sibling has no road (Hollow Knight has no Acts); its ledger's rows that
open are the 100% tab's. `83-road-route-variants.html` (kept out of the repo), the real screen
captured over Save 4 (step 1) and `Restore_Points2/restoreData8.dat` (step 4, the first two steps
skipped by the Phantom's way): 1 the shape (**A** the route: the thread down the page, a station per
step, yours open; B the ledger: each step a row of the 100% tab's; C the thread on top as an index
and the ledger under it; D as it was); 2 the step open (**A** the game's words and the list, its
count on its line, no ring; B with the ring; C the list first, the words folded); 3 the other steps
(**A** they open too; B their game line always under the name; C only the name); 4 the end (**A**
the Act it opens as the last station; B none).

**Decision: A in all four** (16 October 2026), built for the road to Act 2 only (`js/app-progress.js`
`routeHtml()`, `css/app.css` `.pg-rt`); the road to Act 3 is next. Each station's button
(`pgRoute`) opens or shuts it, kept while the page is (`routeOpen`), the one you're on open at
first: a step done shows the game's words without the Map, a step to come its card
(`stepCard()`), yours its card and `todoHtml()`, unless its one part has no rows. The route ends at
«You reach · Act 2 · CITADEL OF SONG» (`saveAct`, `pgActName2`). The thread, the step's heading,
the ring, the medallions and «The whole road» are gone from it; Albert also asked that design pages
be drawn in English from now on.

### The road to Act 3 as the whole route (16 October 2026)

Albert, after the road to Act 2: show me the road to Act 3, and propose what's worth changing. It
repeated its five steps as the Act 2 road did, and its first step, unlocking Silk and Soul, has three
parts needed at once (the ten required wishes, 17 wish points, four conditions): three large rings
over the list, half a screen even at 30/31 with one row left. `84-road-route-act3-variants.html`
(kept out of the repo, the first page drawn in English), the real screen rendered by the site's own
code over Save 2 (3/31) and `Restore_Points3/restoreData24.dat` (30/31): 1 the shape (**A** the route,
as Act 2; B as it was); 2 the step's parts (**A** one line, each part its picture, name and count,
ticked when met; B the rings inside the station; C the list split under the parts' heads).

**Decision: 1 A, 2 A** (16 October 2026), built: `actHtml()` is the route for both roads;
`routeParts()` gives the step you're on its lead line (`roadAllThree`, the offer's note, the Needolin's)
and, with several parts, `.pg-rt-parts`; the station's count is the parts' sum, as the tab's card's
(3/31). Gone with the old layout: `partsHtml()`, the later medallions' peek, «The whole road»
(`pgRoad`, `roadWhole`, `roadLess`), `.pg-now`, `.pg-later`, `.pg-whole`, `.pg-rings.is-sum`. The
rings stay in Act 3's «Your game»; the guide without a save keeps its thread and the full road.

### The guide as the route (16 October 2026)

Albert: now Free mode, deciding without options or a page. Without a save (and in Free mode, whose
road is the guide), the tab still drew both roads the old way: a thread across and the full road in
numbered steps, every list folded under «See all n». Built (`js/app-progress.js`, `css/app.css`):
`roadHtml()` is each road under its title and note, as `routeHtml(r, null)`: no step yours, no ticks,
each station with what it asks («5», «31», «4»: its parts' sum) and shut at first (its state kept
apart, `guide:`); opened, its card, its parts (`routeParts()` with the targets only) and its whole list
(`todoHtml(…, false)`: no title, no «What's missing · Everything»; each list its own ids). Gone with the
old guide: `journey()` for the road, the step peek (`pgPeek`, `peekHtml()`), the folds (`pgFold`,
`list()`), `toAct2()`, `toAct3()`, `step()`, `subHead()`, their CSS (`.pg-steps`, `.pg-step*`, `.pg-sub`,
`.pg-fold`, `.pg-jstep`, `.pg-peek-*`, `.pg-says.is-step`, `.pg-says.is-peek`, the phone's
`.pg-journey.is-road`) and strings. The Bellhome Key's rule (Bellhart's Glory and 2 of Pavo's wishes)
is now only its row's line: the whole road listed those wishes under it.

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
and `pin_tube_station`, the rest are for the map's own work, outside this review); in `js/app-map.js` `mark()` draws a piece as
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

### The selector under the map (11 October 2026)

Albert: improve the whole selector under the map, its sections, and replace the pictures that look
cheap; look at the sibling. What there was: three styles of control in one row (the Acts, two
diamond checks, a loose «Aa»), five groups whose «All · None» sat at the far edge, 33 layers each
the map's 22 px disc with the art shrunk inside (muddy; off, all of it at 30 %), nine hand-drawn
glyphs (padlock, folded map, notice board, figures, house, star, book…), counts of what's
missing only, the six relics as six layers, and a long closing note. The sibling's filter
(hallownest js/app-map.js filterHtml, its design/16 and /24): a head with the title and show all ·
hide all, groups that fold whose title is their switch, the bare art at 28 px greyed when off,
had/total, sets that open. Options drawn over Save 4 and Free mode (a variants page not kept in
the repo): 1 · layout A like the sibling, B columns, C tabs; 2 · pictures A bare with every glyph
replaced from the game's files, B only what the repo had, C the disc; 3 · groups A new, B as
they were; 4 · counts A had/total, B missing; 5 · the note A gone, B one line.

Albert chose **all the A's**. Built (`js/app-map.js` GROUPS, SETS, legendArt and the selector in
the screen; `css/app.css` .mp-legend to .mp-inside):

- The head: «What the map shows», «Show all · Hide all», the Acts and the three choices as the
  step 2 on/off (`.check`).
- Seven groups: Towards 100% (Hornet's upgrades, her gear, then the materials and the rest), Places,
  Fights (gauntlets, bosses, unique enemies), People, Collectibles (the relics one set, its caret
  opening the six), Secrets (caches and walls), Your game. Each folds (`prefs.mapOpen`; all open at
  first, on a phone only the 100%); its title switches all of it.
- Each layer's switch is the game's art, bare, in grey when off (`--missing-art`). The glyphs went:
  Shakra's Journal portrait, Lace's for bosses, a Rhinogrund for unique enemies, the Bellhome's
  bench pin, and five sprites from the game's atlases into `assets/map/icons/`
  (`tools/extract-map-icons.py`, one command): a key (`I_slab_key`) for locked doors, the Wishes and
  Journal tabs of the pause menu, a wish's emblem for who asks for one and the herald's for who
  gives a thing of the 100%. The map's own marks take the same pictures. Only the breakable walls
  keep the bricks: the game's walls (`break_wall`) are tall dark rock that doesn't read that small.
- The counts: had of total in a save (complete in `--good`), a plain count for what isn't had
  (benches, shops, people), the total in Free mode.
- The closing note is gone (`mapNote`, with `mapAll` and `mapNone`).

### Passages: levers, gates, doors, shortcuts (11 October 2026)

Albert, setting the Map beside mapgenie's: things are missing (its Locked Door 89, Lever 58,
Shortcut 26, Needolin Door 5, Silk Wall 2). His rule: only what the save records, so each mark goes
had when the save says it's open. The game's 590 scenes, read with UnityPy, give 87 levers, 16
pressure plates, 37 gates, 25 doors a key opens, 44 shortcuts (31 of them the one-way walls already
among the breakable walls) and 2 silk walls, each an object with a `PersistentBoolItem` of its own
(checked against his two 100% saves). The Needolin's doors keep nothing in the save. Options drawn
in a variants page (not kept in the repo), over the real map
and selector: 1 · where (A a new group, B a set in Places, C in Secrets); 2 · the one-way walls (A
to Shortcuts, B left with the walls); 3 · the plates (A with the levers, B out); 4 · the locked
doors (A grown, with the save's check, B as they were); 5 · the icons (A the game's art where it
reads, a glyph where it doesn't, B glyphs, C all art); 6 · on at first (A none, B levers and gates,
C all).

Albert chose **all the A's**. Built: `tools/extract-pickups.py` writes them (`doors`, with each
scene's own name from `aa/catalog.bin`), `tools/gen-spots.js` appends them to EXTRAS as
`['bool', Scene, id]`, and `js/app-map.js` draws a new group after Places, «Passages» (Levers, Gates, Locked
doors, Shortcuts, Silk walls), off at first; the lever and plate icons come from the game's atlases
(`tools/extract-map-icons.py`), gates, shortcuts and silk walls take glyphs.

### The wishes and the main objectives (11 October 2026)

Albert, setting the Map beside mapgenie's: things are missing. Its Quests group has Quest Item
(66), Objective (21) and Wish (48, each where it's done), and Other has Lore (80) and Point of
Interest (11); the Map had only the Wishwalls and who asks for a wish. His rule: everything added
has to follow the save. Read from the game's files (`tools/extract-wishes.py`): 22 things a wish
asks for, each with its flag, held or its wish granted; 30 places where a wish is done (the map's
own pins for the deliveries and the Steel Sentinel, whose save keeps the three spots it chose and
which were seen; the Herald's seven flags; the room where the game ends a rescue or a fight); the
map's own pins for 19 of the 20 main objectives. The 57 inscriptions keep nothing in the save;
nothing was found for mapgenie's points of interest. Options drawn over the real map, Free mode
and Save 1 (`31-map-quests-variants.html`, not kept in the repo): 1 · the selector A a group
«Tareas» (`PANE_QUESTS`), B inside People, C one set with a caret; 2 · the marks A each thing's own
art (its inventory picture, its wish type's emblem, the map's objective pin), B the map's pins, C
an emblem per layer; 3 · the link to the Wishwall A a button in the card, B and a thread on the
map, C the name only; 4 · the things A only what a wish asks for, B and the key items (Cogheart
Pieces, Pristine Cores, the Ruined Tool, the Crawbell, the Craw Summons); 5 · the inscriptions A
left out, B as places with no state.

Albert chose **all the A's**, with a later step counting an objective done. Built (`js/spots.js`
TASKS, `js/app-map.js` the group «Tasks» and the card, `js/savefile.js` the checks `held` and
`steel`): People keeps Shakra and who gives a thing of the 100%.

### The people (11 October 2026)

Albert, setting the Map against mapgenie's (146 NPC marks, 23 vendors): «faltan cosas». The site
had 7 people (who gives a thing of the 100%, and Scrounge), the wish givers, 10 shop rooms and
Shakra. Read from the game's scenes: 79 title keys on talkers (an NpcDialogueTitle, or the title
a talker's own FSM shows), named by the dump's `<KEY>_SUPER/_MAIN/_SUB`; their figures from their
own tk2d sprites; and for each, the playerData their scripts read. The game's ShopOwners are
exactly js/shop.js's nine vendors; outside them only the Couriers' wish shop, the Moss Druid
(Mossberries for rosaries) and Creige (drinks) trade. Options drawn over three of Albert's saves
(Acts 1, 2 and 3): 1 · the selector (A one more switch «Everyone else», B one switch for all, C by
role); 2 · the mark (A the herald, B their own figure, head and shoulders, C the whole figure with
no disc); 3 · met (A not met yet dimmed, B met dimmed, C met hidden); 4 · who moves (A only where
the save says now, B every spot with the current one lit); 5 · crowded rooms (A each at their own
point, B a count from afar); 6 · vendors (A in Places with the shop pin, B in People).

Albert chose **all the A's**. Built: `tools/extract-people.py` (kb/data/game/people.json and
assets/map/people/), `tools/gen-people.js` (js/people.js, in npm run data: a hand table of met
flags, departures and where-now rules that stops when a field isn't one the person's scripts read
or a room isn't theirs), `js/savefile.js` keeps those fields (`peopleVars`), and js/app-map.js
draws «Everyone else» (54 people) and the three traders. The 29 with no met flag are places with
no state. Garmond is always «comes and goes» (his garmondIn<Room> flags stay set after he moves
on); Sherma, Gilly, the Green Prince, Ballow, Mister Mushroom, Flick, Reed and the Caretaker show
every spot: their numbers or flags aren't tied to rooms yet. Styx and Crull and Benjin were
checked and don't trade, so the vendors are 13 (Scrounge's in People), not the 15 first counted.

### The groups, without «Towards 100%» (12 October 2026)

Albert, setting the Map beside mapgenie's (its 56 Tools against the site's 51): grouping by what
counts for the 100% is the wrong axis; redistribute it. The game has 57 Tools: 51 count, four are
upgrades that replace one that counts (Curvesickle, Druid's Eyes, Claw Mirrors, the Shell
Satchel), and a wish lends two and takes them back (the Snare Setter, the Needle Phial). First
round (a variants page not kept in the repo): 1 · groups A like the Inventory, B like mapgenie
(Equipment, Collectibles, Items), C only an Equipment group; 2 · the six A a layer of their own, B
inside the Tools, C left out; 3 · the 100% in one tap A a button, B nothing. Albert liked B
but not a copy of mapgenie's, so a second round made it ours: 1 · the Tools A in the game's
«Blasón» (PANE_TOOLS), by slot colour, B one layer under «Equipment»; 2 · the upgrades A a group of
their own, B spread as mapgenie does; 2b · its name A «Mejoras», B «Salud, seda y aguja», C «Lo
que te hace crecer» («Hornet» read as confusing); 3 · the six A in their colour, apart, B a layer,
C out; 4 · the 100% A a diamond on each layer that counts and the button, B the button, C nothing.

Albert chose **«Mejoras»**, the **«Blasón» by colour**, the six as a **sub-layer that unfolds**
(as the sibling's sets do), and **only the button**. Built (`js/app-map.js` GROUPS, SETS, HUNDRED,
OTHER_TOOLS; `tools/gen-spots.js` places the six where each lies, Druid's Eyes with the Moss Druid,
the Needle Phial with Zylotol): Upgrades (Mask Shards, Spool Fragments, Silk Hearts, Needle, Pouch,
Kit, abilities), Crest (the Tools, one switch whose caret opens Red, Blue, Yellow and Outside the
100%; Crests; Silk Skills), Collectibles (Lockets, Fleas, Old Hearts, Melodies, Everbloom, the
relics, Mementos, the Bellhome, silk cocoons, Eva's), Items (Craftmetal, Pale Oil, Mossberries,
Silkeaters, maps, key items, rosaries, shell shards), then Places to Secrets as they were. «Only the
100%» beside «Show all · Hide all» turns on just the layers that count. A save's earlier `tools`
layer reads as the three colours.

### Retouch: the map's ground (14 October 2026)

Albert: the map «parece un bloque negro pegado en un fondo difuminado». The stage and the view
painted the scene's black edge to edge of the frame, over the screen's light from the top, so the
Map was the one screen with no light and a hard black rectangle in the frame.

The options (`50-map-ground-variants.html`, the real site with the variant over it; kept out of
the repo): **A** no ground of its own, the screen's light behind the map and, closer up, its edges
fading into the frame; B a window inside the plate's padding, a hairline in the tab's colour and a
soft light inside (narrower on a phone); C no ground, edge to edge, cut where it ends.

**Decision: A** (14 October 2026): `.mp-stage` and `.mp-view` lose their background and
`.mp-canvas` takes a mask that fades its four edges; the large map and full screen, which leave the
frame, keep the black.

### Retouch: counts, names and the card (14 October 2026)

Found in the whole-site review (the Map, agent 4): the «Your game» group's title showed a bare
number (what it shows: the Journal's missing entries plus the cocoon) beside its Journal's own
«233/235»; from afar, area names drew over one another (Cogwork Core over the High Halls, the
Whispering Vaults over the Coral Chambers, Wormways and Moss Grotto by Bone Bottom); and a card
opened on a mark near the top went over the search and the zoom.

The options (`64-map-variants.html`, the real Map of an Act 2 restore point; kept out of the repo):
1 the group's count, **A** had of total as its Journal, B none, C as it was; 2 the names, **A** never
over one another, the larger area's (by its rooms) staying and the rest with the zoom, B over the
marks, C both, D only zoomed in as on a phone, E as they were; 3 the card, **A** below its mark when
above it would cover the search or the zoom, B always at the map's foot, C as it was.

**Decision: 1 A, 2 A, 3 A** (Albert, 14 October 2026). `js/app-map.js`: a group's count leaves the
cocoon out (it's never had, nor many), so «Your game» counts as its Journal; `unclutter()` hides,
from afar (zoom up to 1.5), a name whose box meets a larger area's (`.mp-name.is-crowded`), worked
out again when the map, its size or the zoom changes and once the typeface is in; `paintCard()`
flips the card below its mark when above it would meet `.mp-find` or `.mp-tools`. On a phone the
names already waited for the zoom.

### Retouch: the marks' size (14 October 2026)

Albert: «revisar el tamaño de todos los items en el mapa para que tengan todos un tamaño similar».
Measured over Free mode and his four saves (562 different pictures, alpha over 40): every mark is
one disc (22 px on the whole map, 18 on a phone, up to ×1.25 close up; bosses, places and the fine
layers alike), its picture's canvas in a 0.92 box. Most art already filled 0.85 to 0.92 of the disc;
the outliers were the Mask Shard at 0.50 (its file has a fifth of margin all round, tiny in the
selector too), the Journal's portraits at 0.73 (bosses, gauntlets, unique enemies, Shakra, the
Journal: 323 pictures), the place pins at 0.79, and up to a tenth of a picture past the rim (the
people's busts, keys, levers, Longpin, the Plasmium Phial; the Needle at 1.06). By weight (opaque
area) they go from 0.06 of the disc (Clawline) to 0.96 (a pilgrim's head).

The options (`70-mark-size-variants.html`, the real site on its Map with a sampler of every layer;
kept out of the repo): 1 how to even them, **A** the same visible box, B by visual weight, C as
they were; 2 the disc, **A** one size for all, B by role (bosses ×1.25, places ×1.1, fine ×0.8), C
only the fine ones smaller; 3 the rim, **A** each picture whole inside the disc, B cut by it, C as
it was; 4 **A** the selector and the lists measured the same way, B the map only.

**Decision: 1 A, 2 A, 3 A, 4 A** (Albert, 14 October 2026). `tools/fit-marks.py` (`npm run
mark-fit`) measures every picture a mark can show and writes `js/mark-fit.js` (its canvas, its
opaque box's centre and longest side, its farthest opaque pixel; the Needle's box once turned;
Eva's slot signs from js/crest-slots.js); `test/mark-fit.test.js` fails when a picture has no
measure or a measure no picture. `js/app-map.js` `fitOf()` places each one: its opaque box centred,
its longest side 0.80 of the disc, shrunk just enough that nothing crosses r 0.45 (the plate is
0.47); `artOf()` draws the Map's and Your game's area map's marks from it, and `img()` the HTML
discs (Your game's lists, the card) and the selector's bare pictures (0.86 of their square, no rim)
through `.mp-fit` (css). The glyphs stay as they were: white strokes on black already weigh as much
as a picture.

### Retouch: a room's parts not mapped (14 October 2026)

Albert, on a new game: «veo que está descubierto, pero en el juego no lo he descubierto», a part of
the Marrow (Bone_16_top) in colour with «Whole map», which the game doesn't draw. It came from the
rule that made a room whole in colour once any part of it was mapped (design/00-study.md, «Colour
only where the game draws»). His choice: in colour only what the game draws, piece by piece, and
everything else faint, a room's parts not mapped too.

The options for how those parts look beside the mapped ones (`74-map-parts-variants.html`, the
Map's own composition over three real saves; kept out of the repo): **A** faint as the rest of the
map, B a stronger faint (0.7), C the outline only, D faint with a soft edge at the cut.

**Decision: A** (Albert, 14 October 2026). `js/rooms.js mapView` lost the whole-room rule; nothing
new is drawn, and the game's straight cut shows as a change of tone.

### What you already have (15 October 2026)

Albert: «En Map, añadir botón para ver también lo que ya tienes». In a save (and Free mode's
marks) the Map leaves out what's had, with no way to bring it back; the sibling has «Also show what
you have» among its map's choices, its marks at 0.4. The game has its own switch for the same job
on its Wishes pane: «Show Completed» / «Hide Completed» (`INV_TOGGLE_COMPLETED_ON`, `_OFF`).

The options (`77-map-had-variants.html`, the real site on its Map over three saves, 15 %, 45 % and
79 %, and Free mode; kept out of the repo): 1 where, **A** a `.check` beside «Whole map» and «Area
names», B a text button beside «Show all · Hide all · Only the 100%» flipping its label as the game's
prompt, C a button with the tick on the map's zoom bar; 2 the words, **A** «Mostrar completados» /
"Show Completed" (the game's), B «Ver también lo conseguido» / "Also show what you have" (the
sibling's), C «Completados» / "Completed" (`COMPLETED`); 3 the look, **A** dimmed with a tick in
`--good` on its corner, B dimmed only (the closed benches are already at 0.4), C the tick only, D an
empty ring; 4 Free mode, **A** too, with what's marked, B only with a save.

**Decision: 1 A, 2 A, 3 A, 4 A** (Albert, 15 October 2026). `js/app-map.js`: `prefs.mapHad`
(`mapHad`, off at first) lets `layout()` place what's had too, `is-had` with its tick
(`HAD_TICK`), out of the fine layers' counts per room; the search finds it, and like every switch it
ends a focus. `css/app.css` `.mp-mk.is-had`, `.mp-tick` (`--mp-had-dim` 0.42); whole again on hover
or picked. The counts don't change: had of total as before.

### The Journal's enemies, every room (16 October 2026)

Albert, on the Map's selector: the Void Masses apart from the other unique enemies (their own
switch, «Masa de vacío» / "Void Mass", `NAME_BLACK_THREAD_CORE`), and then «Enemigos únicos» read as
nothing a player would know before turning it on, and only served the Journal: 3 Rhinogrunds (2
asked), 3 Covetous Pilgrims (2), 6 Shardillards (3). His idea: the Journal on the Map instead.
`js/journal-rooms.js` already has every room each of the 237 entries is in and how many (1150 rows,
402 rooms, up to 15 entries in one): too many for a switch. A first page,
`83-unique-enemies-variants.html` (kept out of the repo), split «Enemigos únicos» (A one switch per
enemy, B one with the sets' caret, C one renamed); the idea above replaced it.

The options (`84-journal-map-variants.html`, the real site in Free mode: the entry, the Map's search
and the focus on the Shardillard's 7 rooms; kept out of the repo): **A** from the Journal, the
entry's pin opens the Map's focus on every room, B from the Map, its search finds each entry and
opens the same focus, C both. In all three «Enemigos únicos» leaves the selector.

**Decision: A** (Albert, 16 October 2026), the Void Mass's switch kept. `js/app-map.js`: a 'beast'
mark per entry and room (no switch, never in the search), `App.mapBeast(id)` the focus on them, its
card «{n} en esta sala» / "{n} in this room" with the kills and «Ver en el Diario»; the other
spawns' marks are gone. `js/app-journal.js`: the pin opens it, with a save or without, complete or
not.

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

### Fourth round: the controls in words (13 October 2026)

Albert: «in the Journal, there are 4 buttons at the top right that can't be understood». They
were the second round's two icon toggles (`.seg.hj-tog`): a dashed circle «What's missing» and a
dotted one «Everything» (only with a save; Free mode had the other two alone), three lines «By
area» and a grid «Journal order». Their words lived only in `title` and `aria-label`, so a phone
never showed them; the glyphs said nothing of filtering or ordering; the step 2 pip under each was
the only sign of which was chosen and, with no word over it, read as ornament (the same diamond
marks the optional entries and the area heads); and the two pairs were told apart only by a gap.
The game's Journal has no filter or order (its pane only counts `ENCOUNTERED` and `COMPLETED`), so
the words are the site's own, the ones Progress already uses. The sibling's Journal labels its
state tabs in words with counts.

`48-journal-controls-variants.html`, the site itself over three real saves (0, 55 and 100%) and
Free mode:

- **1 · How they read**: A · each pair in words with its pips, under a label («Show», «Order»), as
  the Crest screen's «Try with»; B · words with pips and no label, as Progress, a hairline between
  the pairs; C · the glyphs with their word beside them; D · one text button with what's chosen,
  opening a list like the language's.
- **2 · Where**: A · on the search's row, at its right (under it on a phone); B · a row of their
  own under the search; C · above the search, centred.
- **3 · Which**: A · the four, in two pairs; B · «What's missing» as one on/off, «Only what's
  missing»; C · no «Journal order», by area always.

Decision: **1 A, 2 A, 3 A**, built. `.hj-ctl` holds two `.hj-pair`s, each a `.lbl` (`pgShow`,
`hjOrder`) and a `.seg.sm` of words (`pgMissing` / `pgAll`, `hjByArea` / `hjByBook`), the group
named by its label (`aria-labelledby`); Free mode keeps the order pair alone. The icons are gone.

### Retouch: the pin to the Map (14 October 2026)

Albert: change the entry's «See on the map» to the pin symbol, so the look is the same everywhere.
The sheet had the only text-only way onto the Map (`.text-btn.hj-onmap`, under the name);
Your game's and Progress's rows carry the round pin (`.pg-onmap`), Progress's cards the pin with
its words. Neither «Ver en el mapa» nor the Map card's «Ver en el Diario» is game text: both are the
site's (`mapOnMap`, `mapToJournal`). `69-map-button-variants.html` (kept out of the repo), the site
over save 2, Craw's entry and the Map cards of Craw and Sister Splinter:

- **1 · The sheet's button**: A · the lists' round pin, the words in `aria-label` and `title`;
  B · pin and words, as Progress's cards; C · as it was.
- **2 · Where**: A · at the end of the «Nearest» line, where the sheet says where it is; B · under
  the name, as it was; C · in the corner, beside the ×.
- **3 · The Map card's «See in the Journal»**: A · words, as it is (every action of the card is
  words); B · the game's Hunter's Journal picture and the words; C · round, the picture alone.

Decision: **1 A, 2 A, 3 A**, built. `whereHtml()` ends the «Nearest» line with the `.pg-onmap`
pin (`mapOnMap: <name>` as its label); with no bench, the areas' line; with neither, the pin
alone. The pin's circle is the lists' rule, now taking `.hj-sheet` too; `.hj-onmap` is gone. The
Map card is unchanged.

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


### Third round: the slots as the game draws them (13 October 2026)

Albert: check that every Crest, Tool and slot looks as in the game, with Tools on too. Read from the
game's files: a full slot's EmptyToFull animation (animations_assets_shared) ends on
`UI_tool_slot_attack0004`, a thin ring, notched up or down for a red or Silk Skill slot fired with
Tool + up or down (each slot's AttackBinding in crestitems.bundle); the empty signs per button
(`Tool_slot_attack_up0000`, `UI_tool_slot_weave_down`...); the Vesticrest's slots in the pane's
"Floating Slots", between white brackets (`UI_tool_slot_extra_sockets`). `43-crest-review-variants.html`
drew five decisions over real saves and full Free-mode builds:

1. A Tool in its slot: **A the game's ring**, the Tool large inside (1.43 and 1.15 units, over the
   art as in the game); B the sign behind a small icon (as it was); C the ring smaller.
2. An empty slot: **A its sign by its button** (up, alone, down); B one sign per colour.
3. A locked slot: **A its sign in grey with the lock ring** (the wiki's Red Tools Icon Locked); B the
   game's small locked dot, a grey ring.
4. The Vesticrest: **A beside the Crest, in its brackets**; B a row under it.
5. A save made while cursed: **A the Cursed Crest** (its art, no slots, a line on the curse, the
   wiki's name in English: the game gives it none); B the Hunter, empty (as it was).

Decision: A in all five, built. `tools/extract-crests.py` writes the buttons into
`SS.crestSlots` (a fifth field), the sprites at their sizes into `SS.crestSprites`, the floating
column into `SS.crestFloat` and the curse's art. Albert, on the page: the Crest's name stays under the
Crest alone, not under the Crest and the Vesticrest's column. The review also fixed what wasn't a
choice: Pale Nails' description (`INV_DESC_SILKBOSS_NEEDLE`), Silkshot as the variant the save holds
(its picture, words, damage and uses), and the Shaman's three Silk Skills.

Reviewing PR #44, Albert saw the lock rings off centre on the signs. Read from the game (13 October
2026), decision 3 A wasn't what the pane draws: the wiki's Red Tools Icon Locked is a composite.
Each slot draws its sign on one renderer, and its Locked animation swaps the sign for
`Tool_slot_lock_ring`, centred, scaled to 0.8, in the slot colour's grey, the slot at half opacity
(`tools/extract-crests.py`'s header). The site now draws that: the ring alone, where the sign was.

Then Albert asked whether the worn Tools weren't too big, against real pictures of the game. Two
screenshots of the Tools pane with Tools on (the Reaper with Straight Pin, Warding Bell and Compass:
deltiasgaming.com's `20250906185754_1.jpg` and Nintendo Life's `equipment-menu.large.jpg`) and the
game's files say the opposite: the slot's "Item Icon" draws the Tool's inventory sprite at its own
size (scale 1, kept by its Icon Idle animation; 100 px to the unit), 1.04 to 1.58 units across,
about the ring's 1.43, so a Tool fills its ring. The site drew every one in a 1.15-unit box, about
80% of the game's (the Warding Bell 1.15 units tall against 1.41). Each now goes at its own size and
centre (`SS.crestIcons`, from `tools/extract-crests.py`); the Crest's box still holds the largest
in every slot (the Barbed Bracelet on the third Hunter, 3.395 of 3.4 units across).

On that comparison Albert asked for the two other things the screenshots show. The Crest's lines are
a dim grey, not white with a glow: `InventoryToolCrest.UpdateListDisplay` colours the Crest by the
pane's state, `DeselectedColor` (0.5, 0.5, 0.5) while you browse it (`EquipStates.None`), 0.3 grey
while placing a Tool, white only for the Crest picked while switching; its "Crest Glow" only plays
when a Crest is put on. The lines in both screenshots peak at 128 of 255; the site's are now
`--crest-tint` (brightness 0.5, the same 129 to 134) with no glow. And a Silk Skill in its slot is
its solid white inventory sprite (`S_needle_throw`...), the same in the pane's list and its
description, where the site had the wiki's line art (the prompt when you get one,
`prompt_hornet_needle_throw`). `tools/extract-crests.py` writes the six into `assets/icons/skills-inv/`;
the slot, the list under the Crest and the Inventory use them, and the Map, Progress, Home and
Combat keep the line art.

### Retouch: middle widths (14 October 2026)

Albert, with the window narrowed: the masks spill out of the screen, and not only the masks.
Measured (every element past the frame, 390 to 1300 px, a 100% save and Free mode): from about
960 px down to 600 the band's one row doesn't fit, so the ten masks run past the frame; at 600 to
640 the whole band does, the Needle on the left too; at 600 the Vesticrest's column beside the
Crest touches the frame. Under 600 the phone's stack already holds.

The options (`52-crest-hud-variants.html`, the real site in a frame of the width chosen; kept out
of the repo): **A** from 1060 px down, Hornet's HUD (masks, silk, Bind) on a row of its own under
the Needle and the figures, centred after a rule, and under 720 px the figures on their own row
too; B the phone's stack from 1060 px down.

**Decision: A** (14 October 2026), in `css/app.css` (two media queries before the phone's): and in
both, under 720 px the Crest with the Vesticrest's column takes `--crest-k-sm`.

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

Then (29 September; Albert: «the fights work much better on the sibling: bring the whole engine,
minding the differences»; decided in plan mode: the engine and the arena, every Silksong mechanic
family, the stagger read from the game), **the sibling's arena, made Silksong's**. `js/sim.js`
gave way to `js/fight.js`, the sibling's reducer (`apply(f, kit, action, ctx)` → events) with a
clock, and the screen to its arena: HUD animations, the hit's figure and trail, dust, a phase
announced, several bars with a target, an undo stack with Ctrl+Z, a nine-line log in three voices,
the end titled with the fight in figures, the sticky band. What changes from Hollow Knight: Focus
is the Bind (a hit in its window loses the heal and the spool; the Warding Bell), the charms are
Tools and Crests (the Hunter's focus, the Beast's fury, the Reaper's silk, Flea Brew, Flintslate,
the Plasmium Phial, the Fractured Mask, Druid's Eye, the Memory Crystal, the Claw Mirror, the
Wispfire Lantern, Silk Hearts), the combat numbers from the game's files (`js/hero.js` COMBAT), and
the stagger from each boss's Stun Control FSM (`tools/extract-stagger.py` → `js/stagger.js`: a
maximum, a combo within 1 s, 2 s down less 0.25 s a hit, each of Hornet's hits its own stun), not
the wiki's "75 damage, no combos".

Then (Albert: «enemy gauntlets should change, shouldn't they?»; decided in plan mode: played as one
fight), **the gauntlets played**: a wave a phase, an enemy a bar (up to 11, the target list), a kit
per enemy (its own modifiers), its attacks grouped by enemy; masks, silk, uses and the clock carry
over. The waves' list folds under «How it's worked out».

## Step 10 · The static pages

### What there is (28 September 2026)

The 116 generated pages (`tools/pages.js`: the landing folders and one per boss, in each
language) are `index.html` again, opened on their screen; steps 1 to 9 reach them as they are.
What's theirs is the block under the screens (`.about`): the text a search engine reads, on the
page's red with no frame, the boss's facts repeated in long paragraphs, the questions open, the
other pages as underlined links and, on Combat's pages, the 50 bosses as a wrapped row of
underlined names. The sibling has the same block, unchanged.

### The options (`22-static-pages-variants.html`, Lace's page)

The text stays in the page (it's what the search engine reads); only how it shows changes.

- **A · a screen of its own**: the block in the screens' black frame with its plaque title, the
  boss's facts as a card beside the text, the questions folded, the bosses as ringed portraits,
  the other pages as buttons.
- **B · editorial**: on the page's red in two columns (the text at a reading measure; the
  questions folded and the pages as buttons), the bosses as portraits under them.
- **C · folded**: the title, the first line and «Read more»; the pages as buttons and the bosses
  as a strip of small portraits, named on hover.

### Second round (28 September 2026)

Albert: none of the three; more attractive alternatives (another black box isn't it).
`23-static-pages-round2.html`, Lace's page again:

- **D · the boss's page**: a guide page on the main menu's red, no box: its drawing large with
  the title over it and the Journal's quote, a «Try it with your build» button up to the
  calculator, its figures in a row between filigree, its attacks with masks, the phases on a
  bar, the questions folded, every boss as portraits, the other pages with their icon.
- **E · as the Journal**: laid out as the game's Journal entry (the drawing on its light, the
  name under the filigree, the text), the questions as the Hunter's notes under her symbol.
- **F · lit cards**: each part a card of dark glass over the red, in a grid.

Decision: **D · the boss's page**, built. `tools/pages-bosses.js` adds `guide` (the Journal's
drawing and words, the figures, each attack with its masks, each fight's phase marks, the reward,
the portrait); `tools/pages-text.js` gives each landing page `art`, `icon` and `cta`;
`tools/pages.js` `about()` writes the hero (`.about-hero`: art on `--journal-light`, the h1 as
`.about-name` + `.about-sub`, the colon kept in the text but hidden, never split inside «Hollow
Knight: Silksong»), `.about-figs`, `.about-two` (attacks, phase bars, reward), the rest folded in
`.about-details` on boss pages (shown on the others), the questions as `<details>`, every boss as
a ringed portrait, the other pages with their icon, crown flourishes between. The button is
`data-act="aboutUp"` (`js/app.js`: scrolls to the screens; with no script, the top). The body,
questions, one h1 and JSON-LD are unchanged for search engines.

## Step 1, second round · The screens' box

### What there is (28 September 2026)

Albert: every tab has the same shape, the main menu's red and on it a black box with frames
(step 1's pause-menu screen, `.frame-line` and the `.bk` corners), so the tabs look alike and
only what's inside changes.

### The ideas (`24-shell-round2-variants.html`: the real site with each laid over it)

- **A · no box**: the screens straight on the red; the plaque title stays, a filigree line under it.
- **B · an atmosphere per tab**: no box, and the page's light takes the colour of each tab's
  place (the area tokens: the Journal Mount Fay's blue, the Map Greymoor, Progress Bone Bottom's
  green, Crest Bellhart's gold, Inventory the Whispering Vaults, Combat Deep Docks; Your game red).
- **C · the box only on the game's panes**: Inventory, Journal and Crest keep it; Your game,
  Progress, the Map and Combat go on the red.
- **D · a light box**: the box stays, translucent and blurred, the red through it, the frame fainter.

### Round 3: with a box (28 September 2026)

Albert: none of the ones without a box; styles with a box, or close to one. The same page, the
bar now switches in place (the site rewrites the address on boot and dropped `?sv=`, so the idea
is kept in `sessionStorage`):

- **D · a light box** (kept from round 2).
- **E · the box lit in its tab's colour**: the black stays; the frame, the corners, the plaque
  and a light from the top inside take the colour of each tab's place (the area tokens).
- **F · the game's panel**: a double frame (an inner line inset), the top of the black lit as the
  pause menu's header, larger corners.
- **G · a lit plate**: a warm near-black lit from above, lifted off the red by a deep shadow and
  a faint red glow, the frame fading to the sides.
- **H · a window with its light**: D and E together (translucent, doubled frame, the tab's colour).

### Decision (28 September 2026)

**E · the box lit in its tab's colour**, built. `css/tokens.css` `--tab-home … --tab-fight` (each
area's line mixed 55% into its fill; Your game and Saves the red, `#b0463b`), `--tab-light`
(38%) and `--tab-frame` (70%); `css/app.css` gives each `.screen[data-view]` its `--tab` and
tints `.frame-line` (a radial light from the top, the border, a soft glow), its top-edge halves,
the `.bk` corners and the `.screen-plaque`. `CLAUDE.md`'s rule ("no colour per section") now
says the frame's light takes the tab's colour, and only that.

## Step 6b · The Map's admin mode

### What there is (11 October 2026)

Nothing: the sibling's admin mode (hallownest-calculator, `#view=map&admin=1`) only moves pins, in
a panel over the map's top left, where this site has its search. Albert asked for it here, able
to add marks too.

### The options (`30-map-admin-variants.html`, the real Map in Free mode over Shellwood)

Six choices, each A, B or C: 1 the panel (a band under the map · floating over it · a column
beside it); 2 adding (the legend's marks in a grid · a list of names · a menu on the map); 3 the
save check (one line · kind, room and id · the id only); 4 hide and delete (in the panel · on the
mark's card · the keyboard); 5 on the map (a way, a strike and a "+" · the way only · a dashed
rim); 6 the list (by kind · one list · the counts).

### Decision (11 October 2026)

All A: a band between the map and the legend, which covers nothing and stays below in
fullscreen; the legend's marks in a grid, each tap dropping one until Escape; one line for the
check, the room filled in and checked as it's typed; Restore, Hide, Show and Delete in the panel;
the way from the data's point (in the accent while unsaved), the hidden mark faint and struck
through, the added one with a "+"; the fixes listed by kind. Built in `js/app-map-admin.js`.

## The whole-site review · Three things a phone didn't fit

### What there was (14 October 2026)

At 390 px the Spanish title took three lines («Calculadora / de / Telalejana») with any save loaded,
and at 360 px «Beta» sat over «Partida 1». Your game's four figures showed three and one alone. The
Import view's title was cut to «Importar a la …» / "Import into …", losing the save's number.

### The options (`61-phone-header-variants.html`, the site's own HTML for Save 1 in Spanish)

1. The header: A, the language and Share on the second row, right of «Hollow Knight ↗»; B, Share as
   an icon; C, the title a step smaller; D, as it was.
2. The figures: A, two by two; B, as they were.
3. The Import title: A, two lines inside its plaque; B, the plaque says «Importar»; C, as it was.

### Decision (14 October 2026)

All A, phone widths only (≤599 px). Built in `css/app.css`; the header's order in the page is now
the sister's link, the language and Share, the title, the save (`js/app.js`), so the keyboard walks
the desktop header left to right and the phone's second row in its own order.

## Step 1c · The site's icon

### What there was (14 October 2026)

The HUD's mask on the page's plain background (`tools/site-icons.py`). Clean, but at 16 px in a
browser tab it's a white drop that could as well be Hollow Knight's.

### The options

`72-site-icon-variants.html` drew each one where it's seen (a browser tab, dark and light; a
search result; a phone's home screen, square and round; each size alone). 1 · the figure: **A**
Hornet's head with its red collar (`assets/hornet/resting.png`, cut above the cloak), B the mask
(as it was), C the Hunter's Crest (its thin lines vanish at 16 px), D the Straight Pin (clear, but
says little of the site). 2 · the ground: **A** the page's background with the main menu's red light
from below (`--ember-glow`, the same gradient), B plain (as it was), C transparent.

### Decision (14 October 2026)

A and A. `tools/site-icons.py` cuts the head from the sprite and draws `--ember-glow` over `--bg`,
both read from `css/tokens.css`; `npm run site-icons` writes the four files.
