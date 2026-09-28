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

The design system itself (the black page, one card, filigree only in the corners, figures in a
sans with tabular figures, the accent only on what's interactive, tints from the game's map
screen, four kinds of button) is hallownest-calculator's `design/00-system.md` and
`11-components.md`; it carries over as it is, and `css/tokens.css` says which values are
placeholders until Silksong's are measured.
