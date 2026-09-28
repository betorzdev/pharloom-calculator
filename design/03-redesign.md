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
| 4 | Inventory (`game`) | **Next** | |
| 5 | Progress (`progress`) | To do | |
| 6 | Map (`map`) | To do | |
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
Spanish; Hornet as a silhouette; the four figures as dashes; «Your game goes here», Import and
Saves). It keeps `.hm-invite`, so the dropped file still lights it. The long invitation line is
gone.

