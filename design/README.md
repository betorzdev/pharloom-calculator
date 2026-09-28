# Design

Reference material for deciding how this site looks and behaves. It isn't part of the page
(`index.html` doesn't load it), just like `kb/`.

| File | What it contains |
|---|---|
| [`00-study.md`](00-study.md) | **Start here.** The study behind the site and the plan: what Silksong has for each piece of the Hollow Knight site, the damage model (`weapon × enemy modifier × (1 + modifiers)`), every data source checked (the wiki's infoboxes, the game's text dump, the identical save cipher, the randomizer's room graph, the trackers' data), what carries over from the code, the design, the competition, the risks and **the plan by value and cost, with its status** |
| [`01-web.md`](01-web.md) | Web best practices: what's a hard rule and what's taste. Contrasts calculated and browser support checked against Baseline. Copied from hallownest-calculator as is |
| [`02-silksong.md`](02-silksong.md) | The game's visual language, measured on the wiki's sprites (`npm run palette`): the HUD (bone, and silk is white), the three slot colours, the Crest screen (it selects with white on grey, not a hue), the 32 areas' map tints; and what's still to decide for `tokens.css` |
| [`03-redesign.md`](03-redesign.md) | **The UI and UX review, step by step** (from 28 September 2026): how each step goes, the steps with their status, and each one's analysis, options and decision. Resume the review from here |
| [`04-shell-variants.html`](04-shell-variants.html) | Step 1's options drawn with the site's real CSS: the header, the frame and title of a screen, the phone's bar, the figures on the bar |
| [`05-components-variants.html`](05-components-variants.html) | Step 2's options: the shared controls (choose one, on/off, the menu button, section heads), today's next to two alternatives each, with the site's real CSS |
| [`06-home-variants.html`](06-home-variants.html) | Step 3's options: Your game with a save (profile, bench, HUD) and without (as now, with an example, with the ways in), the cards into other screens and the About block |
| [`07-inventory-variants.html`](07-inventory-variants.html) | Step 4's options: the Inventory tidied, as the game's pane (one section at a time) or as shelves, over a real save's inventory |
| [`08-missing-variants.html`](08-missing-variants.html) | Step 4's retouch: four ways to tell what you have from what you lack in the Inventory, over a real save |
| [`09-locked-tool-variants.html`](09-locked-tool-variants.html) | Step 4's retouch: five ways to draw a Tool you don't have yet on its slot |
| [`10-progress-variants.html`](10-progress-variants.html) | Step 5's options: Progress as the sibling's ledger, as a board of cards, or in three tabs, over a real save |
| [`11-title-variants.html`](11-title-variants.html) | Step 1's retouch: five ways to set the screen's title on its frame without the black box behind it |
| [`12-map-variants.html`](12-map-variants.html) | Step 6's options: the Map as the sibling's, with a side panel, or the map first with a floating legend, over the real map |
| [`13-map-symbols-variants.html`](13-map-symbols-variants.html) | Step 6's symbols: the map's marks as the game draws them, as mapgenie's pins, or as the game's round badges (`map-pins/`: the game's own map pins, for the mockup) |
| [`14-gauntlet-mark-variants.html`](14-gauntlet-mark-variants.html) | Step 6: three marks for the enemy gauntlets on the Map, instead of the «x» |
| [`15-journal-variants.html`](15-journal-variants.html) | Step 7's options: the Journal as the game's pane, the sibling's list, or by area, over a real save |
| [`16-journal-top-variants.html`](16-journal-top-variants.html) | Step 7, second round: what the Journal shows first, with less text: quiet, next hunts, or areas at a glance |
| [`17-journal-entry-variants.html`](17-journal-entry-variants.html) | Step 7, third round: an entry's whole drawing, from the game's files: the game's page, the drawing in the sheet, or full screen on a tap |

The design system itself (the black page, one card, filigree only in the corners, figures in a
sans with tabular figures, the accent only on what's interactive, tints from the game's map
screen, four kinds of button) is hallownest-calculator's `design/00-system.md` and
`11-components.md`; it carries over as it is, and `css/tokens.css` says which values are
placeholders until Silksong's are measured.
