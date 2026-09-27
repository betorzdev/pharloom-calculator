# Web design: what's a rule and what's taste

Researched in September 2026. Browser support is checked against the **live Baseline API**
(`api.webstatus.dev`), not from memory; the contrasts are calculated with the WCAG luminance
formula, not estimated.

Two categories, and it's worth not confusing them:

- **Hard rule** — accessibility, performance, support. Not negotiable against taste.
- **Taste** — marked as such. It can be argued, but it's chosen **once** and then respected.

## 1. Typography, rhythm and space

**Type scale** *(taste, but bounded)*. One ratio and that's it. For dense data, a **short** ratio
(1.2); the minor third is already aggressive with eight steps. Anchored at 16 px:

| Token | px | For what |
|---|---|---|
| `--fs-2xs` | 12 | units, notes, micro-labels |
| `--fs-xs` | 13 | dense cells (only if it reaches 4.5:1) |
| `--fs-sm` | 14 | secondary interface, chips |
| `--fs-md` | **16** | body and cells ← base |
| `--fs-lg` | 18 | reading paragraphs |
| `--fs-xl` | 22 | card titles, h3 |
| `--fs-2xl` | 28 | h2 |
| `--fs-3xl` | 36 | h1 |

GOV.UK spreads **seven steps** (16/19/24/27/36/48/80) and requires every line height to be a
multiple of 5 px. What matters isn't the numbers: it's that there are few of them.
The discipline is the design. *(Our CSS has 23 sizes today, with half-pixel steps.)*

**Line height.** Body 1.5; titles 1.15–1.25; cells 1.35–1.4. WCAG 1.4.12 requires the design to
**survive** 1.5 line spacing, double spacing between paragraphs, 0.12em between letters and
0.16em between words: the simplest thing is to design with those values from the start.

**Measure.** 50–75 characters per line, 66 the ideal. `max-width: 66ch` on prose. Tables are
exempt, but an "effect" column has to be capped (`max-width: 46ch`) or it becomes illegible.

**Spacing** *(rule)*. A 4 px base and a **non-linear** scale: a linear 4/8/12/16/20/24 scale gives
adjacent values that can't be told apart, and you spend decisions on nothing.

```
--sp-1:4  --sp-2:8  --sp-3:12  --sp-4:16  --sp-6:24  --sp-8:32  --sp-12:48  --sp-16:64
```

Once one is chosen, **a px is never written by hand again**. *(Ours —4, 8, 12, 16, 22, 26, 34—
breaks the rhythm right where it shows the most: 22 and 26 can't be told apart.)*

**Hierarchy** *(taste, high impact)*. Refactoring UI's most reused finding: almost every ugly
interface is a failure of hierarchy, and it's fixed by **taking weight off what's secondary**,
not by shouting what's primary. Three text colours per surface, two weights, one accent.
Importance isn't signalled with size: with weight + colour + space.

**Density.** Don't guess one: offer **compact 40 px / normal 48 px / comfortable 56 px** row
heights, and remember it. It's the lever that separates "tool" from "blog".

**Layout.** One page `grid` and `subgrid` so the inside of the cards aligns across them. And
**container queries** before media queries in the components: a charm card in the sidebar and
the same card in a three-column grid should decide on their own.

## 2. Colour: a dark palette that survives an audit

**Hard rules.** Contrast is symmetrical: dark mode has **exactly the same requirements**. 4.5:1
for normal text, 3:1 for large text (≥24 px, or ≥18.66 px bold), **3:1 for control borders and
graphics that mean something** (1.4.11).

APCA is **not** yet the WCAG 3 algorithm: visual contrast was withdrawn from the draft in July
2023 and in April 2026 it's still "to be determined"; WCAG 3 won't be a recommendation before
~2029. **Design against WCAG 2.2**; APCA only as a tie-breaker.

**Dark-theme traps:**

- **Neither `#000` nor `#fff`.** Material settled on `#121212` so it could express elevation with
  lighter tones. Pure white on near-black gives 18–21:1 and produces **halation** (the text
  "bleeds"), worse still with astigmatism, which one in three people have. Main text aims for
  **12–15:1**, not 21:1.
- **Desaturate the accents.** Saturated tones vibrate on dark: lower saturation by 20–30% and
  raise lightness.
- **Shadows barely work on dark.** Elevation is said with a **lighter tone** and a 1 px line, not
  with `box-shadow`.

**Calculated minimums** — the darkest grey that reaches each threshold on each background:

| Background | 3:1 | 4.5:1 | 7:1 |
|---|---|---|---|
| `#0B0E11` | `#5D5F63` | `#787A7E` | `#9A9CA0` |
| `#14171A` | `#626468` | `#7E8084` | `#A0A2A6` |
| `#1E2227` | `#6A6C70` | `#86888C` | `#AAACB0` |

**Accent fills carry dark text, always.** On `#C9A227`: dark text 8.00:1, white **2.42:1
(fails)**. Red is the classic trap: `#E5484D` gives 4.94:1 with dark text and 3.91:1 with white —
neither comfortable. "Negative" is painted as a **tinted surface + light red text**, never as a
red fill.

**Semantic tokens in three layers** (reference → semantic → component) and named **by
function, never by value**: `--color-bg-fill-critical`, not `--red-500`. Polaris, Atlassian and
Primer agree; naming by value turns every theme change into a migration.

**Derive instead of picking by hand.** `color-mix()` and `oklch()` have been Baseline *widely
available* since 2025-11:

```css
--s-2: color-mix(in oklab, var(--s-1) 88%, white);              /* elevation */
--row-hover: color-mix(in oklab, var(--s-1) 94%, var(--accent));
--accent-hover: oklch(from var(--accent) calc(l + .06) c h);    /* relative colours */
```

`contrast-color()` is Baseline *newly available* (10 April 2026): use it with a fallback, never
as a structural load.

## 3. Dense data: how the ones who do it well present numbers

**Tables.** Eight rules that are worth almost the whole result:

1. **Numbers on the right, text on the left**, and the header aligned with its column. Numbers
   are compared digit by digit from the right.
2. **`font-variant-numeric: tabular-nums`** on every numeric cell. Without it, the figures dance.
3. **Fixed decimals per column**: `1.5 / 2.0 / 15.0`, never `1.5 / 2 / 15`.
4. **Rules, not zebra stripes.** 1 px at most, in a colour that blends with the background. Zebra
   stripes fight with hover and selection. One or the other, never both.
5. **Sticky header and first column.** `position: sticky` on the `th`s, with
   `border-collapse: separate; border-spacing: 0` and borders per cell: with collapsed borders
   the rules come loose when scrolling.
6. **The first column is the readable name**, not an identifier.
7. **Vertical alignment**: centred up to 3 lines, top from there on.
8. Every table, inside the accessible region of §5.

**Cards or tables.** Nielsen Norman is categorical: the table wins on space efficiency and
pattern detection; the card only wins when the piece is **visual** and is looked at one at a
time. For us: **the charm grid is cards** (the artwork rules), **the per-charm impact is a
table**. Don't turn the numbers into cards.

**Comparing.** For the per-charm impact the good pattern isn't a chart: it's a table with **bars
inside the cell**, with no JS or library.

```css
td.bar { --v: 0; position: relative; }
td.bar::before {
  content: ""; position: absolute; inset-block: 4px; inset-inline-start: 0;
  inline-size: calc(var(--v) * 100%);
  background: color-mix(in oklab, var(--accent) 28%, transparent);
  border-inline-start: 2px solid var(--accent);
}
```

With `<td class="bar" style="--v:.62">15.0</td>`. For **small differences** (15 versus 16 damage)
a chart misleads: a table with an explicit `Δ` column, or a bar bounded from a common base. Real
charts are kept for shapes with many points (a DPS curve, health per phase).

**Filter, sort, search.** Filters visible by default on desktop and with their own surface on
mobile; what's applied always as removable chips, with a "clear all"; a live count; **and never
a dead-end zero**: the empty state says which filter to loosen. Sorting: a chevron per header and
`aria-sort`. Search: a single field, 120–150 ms debounce, that **searches in Spanish and in
English**, and highlights what matches.

**Progressive disclosure.** An expandable row for what's secondary and a **side panel** for the
full entry: NN/g advises against the modal for a record's detail, because it covers precisely
the data you were comparing it with. `details-name` gives mutually exclusive accordions with zero JS.

## 4. Modern CSS: what can be used today

Baseline: *newly available* = already in all the major browsers; *widely available* = 30 months
after that.

**Without fear (widely available):** custom properties · `clamp()`/`min()`/`max()` ·
`@layer` (2024-09) · `aspect-ratio` (2024-03) · **subgrid** (2026-03) · **container queries**
(2025-08) · **`:has()`** (2026-06) · **nesting** (2026-06) · `color-mix()` and `oklch()`
(2025-11) · `<dialog>`, `inert`, `:focus-visible` (2024-09) · `loading="lazy"` and **AVIF**
(2026-06/07) · `dvh`, `sticky`, `font-variant-numeric`, `size-adjust`.

**As progressive enhancement (newly available):** `light-dark()` · `@property` ·
`@starting-style` and `transition-behavior: allow-discrete` · `text-wrap: balance` · relative
colours · `backdrop-filter` · `details-name` · **popover** (2025-01) · `content-visibility`
(2025-09) · same-document **view transitions** (2025-10) · `contrast-color()` (2026-04) ·
`field-sizing` (2026-06).

**Don't lean on yet (limited support, Sept. 2026):** **CSS anchor positioning** (Firefox only
partial) · **scroll-driven animations** (no Firefox) · `text-wrap: pretty` (no Firefox) ·
cross-document view transitions · `interpolate-size` and the customisable `<select>` (Chromium
only) · `text-box-trim`. All of that can go in behind an `@supports`, but **none of it holds up
layout or legibility**.

**Fluid type without breaking zoom.** `clamp()` with viewport units can fail WCAG 1.4.4 (text at
200%): when zooming in, the viewport shrinks and cancels the growth. A small `vw` coefficient,
let the `rem` rule, and **test it at 200% and at 400%**.

```css
:root { font-size: 100%; }                 /* never px on :root */
h1   { font-size: clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem); text-wrap: balance; }
body { font-size: clamp(1rem, 0.97rem + 0.15vw, 1.125rem); }
```

**Architecture with `@layer`**, which ends the specificity wars without a preprocessor:

```css
@layer reset, tokens, base, layout, components, utilities;
```

**What no longer needs JS:** modals (`<dialog>`), tooltips and filter panels (`popover` +
`popovertarget`), accordions (`<details>`), "is there a filter applied?" (`:has()`), theme
switching (`light-dark()` + `color-scheme`), animated entry and exit (`@starting-style`), the
cost of long lists (`content-visibility: auto` + `contain-intrinsic-size`).

## 5. JavaScript without a build

**Our case is already solved, and it's worth knowing why.** `index.html` loads **five classic
scripts**, not modules. That isn't a shortcoming: it's the only way for the site to work over
`file://`.

- **ES modules don't load over `file://`.** MDN says so: it gives a CORS error because of the
  modules' security rules; a server is needed.
- **`fetch()` of a local JSON fails**: a `file://` document has an **opaque origin**, which can
  never match `Access-Control-Allow-Origin`.
- Import attributes (`import d from "./x.json" with {type:"json"}`) are also blocked over `file://`.

Hence the rule we already follow and have to **keep**: **data travels in `.js`, never in
`.json`**. If `kb/data/hp.json` ever goes into the site, it goes in as `js/enemies.js` with an
assignment (`HK.enemies = [...]`), not with a `fetch`.

**State.** A plain object and a fifteen-line pub/sub; each view is a pure function of the state;
mutations go through a `set()` that notifies **once per frame**.

**Rendering**, three tools and three jobs:

- **Template literals + `innerHTML`** to rebuild a set of rows. An `esc()` on every interpolation
  is mandatory: the wiki's names carry `&`, `'` and `<`.
- **`<template>` + `cloneNode(true)`** when repainting a lot and you prefer to touch `textContent`.
- **Direct DOM** for the surgical bits: sorting is reordering the `<tr>`s that already exist with
  `append()` (which **moves** them), not rebuilding them.

**Event delegation**: one `addEventListener` per region, not per row.

**State in the URL** is the biggest "this is serious" signal on a reference site. In the
**hash**, not the query: `history.pushState` with a path change is unreliable over `file://`,
the hash isn't. *(We already do it; it applies to filters, sorting and search too.)*

**`localStorage`** only for preferences (language, density, collapsed sections). Over `file://`
its behaviour **isn't defined by the standard** and access can **throw an exception**, so it's
always wrapped:

```js
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
};
```

**INP.** A long task is **more than 50 ms**. Filtering 45 charms is nothing; sorting and
repainting 2,000 rows is. Chunk and yield:

```js
const yieldToMain = () => (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0)));
```

`scheduler.yield()` and `requestIdleCallback` still lack Safari: they're detected, not assumed.

## 6. Performance

**Hard targets**, at the 75th percentile of real users: **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1**.

**Typefaces.** WOFF2, **self-hosted** and **subsetted**. For Spanish and English, Latin plus
`áéíóúüñ ¿ ¡ « »` is enough: a tenth of the glyphs. A variable font beats four static ones if you
use three weights or more. `font-display: swap` for the display face. Preload **only** the one
seen at the top, and declare the `@font-face` in the `<head>`. The font swap jump is killed with a
metric-compatible fallback:

```css
@font-face { font-family: "Fallback"; src: local("Georgia");
  size-adjust: 96%; ascent-override: 90%; descent-override: 22%; line-gap-override: 0%; }
```

**Images.** AVIF is now Baseline *widely available* (July 2026) and it's the right format for
painted artwork with alpha. With `width` and `height` **always**: missing dimensions are the
number one cause of CLS.

```html
<picture>
  <source type="image/avif" srcset="charm-80.avif 1x, charm-160.avif 2x">
  <source type="image/webp" srcset="charm-80.webp 1x, charm-160.webp 2x">
  <img src="charm-160.png" alt="" width="80" height="80" loading="lazy" decoding="async">
</picture>
```

`1x/2x` descriptors for fixed-size icons and `w` + `sizes` for fluid artwork; **never mix
`sizes` with `x` descriptors**.

**Long lists.** `content-visibility: auto` with `contain-intrinsic-size` gave a **7×**
improvement in initial render in web.dev's example. Without `contain-intrinsic-size`, the
scrollbar jumps.

**Sprite atlases.** With 45 icons and one request each you're fine over HTTP/2 and over `file://`
(zero latency). For the monochrome glyphs —masks, notches, soul— an **inline SVG sprite** with
`<use href="#mask">` is better: it inherits `currentColor`, scales and costs one request.

## 7. Accessibility (all hard rules)

- **Visible focus** that meets **3:1 against what's next to it** (1.4.11):
  `outline: 2px solid var(--accent); outline-offset: 2px`. Never a bare `outline: none`.
- **Focus not obscured (2.4.11, new in 2.2).** A sticky header **is going to cover** the focused
  row. It's fixed with `:where(tr,th,td,a,button) { scroll-margin-block-start: var(--sticky-h) }`.
- **Tables:** `<caption>` (it's their accessible name), `<th scope="col">` and `scope="row"`,
  `aria-sort` on the active header, and the filtered count announced in an `aria-live="polite"` region.
- **Roselli's scrollable region** — four attributes and six lines, and it meets 2.1.1, 4.1.2 and 1.4.10:

```html
<div role="region" aria-labelledby="cap-charms" tabindex="0">
  <table><caption id="cap-charms">Impact per charm</caption>…</table>
</div>
```

  **Don't** turn a `<table>` into cards with `display: block`: it wrecks the semantics.
- **ARIA only where needed.** `<dialog>`, `<details>`, `<button>` and `popover` already carry
  semantics. The most repeated failure on fan sites is the `<div onclick>` with `role="button"`
  and no keyboard.
- **Numbers and screen readers:** `tabular-nums` only helps sighted users. The unit, in the header
  and also hidden in the cell when it's ambiguous. **Never a bare `—`** for "no data" (it's read
  as "dash"): `<span class="vh">no data</span>`. And deltas with a sign —`+2`, `−3` with the real
  minus (U+2212)— because colour **can't be the only signal**.
- **Motion:** a `prefers-reduced-motion` block *(we already have it)*, and view transitions behind
  it too.
- **Zoom:** usable at 200% (1.4.4) and at a 320 px equivalent without two-axis scrolling (1.4.10).

## 8. Mobile

- **By default, the wide table scrolls horizontally** inside its region, with a sticky header and
  first column. It keeps the semantics and the comparison. A gradient on the edge so you notice
  there's more.
- **Second option: fewer columns, not smaller text.** A column picker beats shrinking to 11 px.
- **Third: a real list of cards**, generated from the same data, chosen with `@container` and not
  with patches on the table.
- **Touch targets:** 24 × 24 px is the WCAG 2.2 floor; Apple asks for 44 and Material 48.
  **44 px** for everything you tap, enlarging the area with `padding`, not the glyph.
- **Safe areas:** `viewport-fit=cover` *(already there)* plus
  `padding-inline: max(var(--sp-4), env(safe-area-inset-left))`, and `env(safe-area-inset-bottom)`
  on any sticky bottom bar.
- `dvh` instead of `vh`.

## 9. Two languages without a framework

- **One dictionary per language, flat keys by meaning** (`table.header.cost`), loaded as an
  assignment so it works without `fetch`.
- **Never concatenate.** Placeholders and a three-line formatter; it's the only thing that lets
  Spanish order things differently:
  ```js
  const t = (k, v = {}) => (dict[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? "");
  ```
- **Plurals with `Intl.PluralRules`**: Spanish and English have `one`/`other`, but coding it
  properly costs six lines.
- **Numbers with `Intl.NumberFormat`**, non-negotiable in Spanish because of the decimal comma.
  One formatter **per language, reused**: building them is expensive and here there's one cell
  after another.
- **`lang` is functional, not decorative.** Update `document.documentElement.lang` on change: it
  governs hyphenation, `:lang()`, the choice of fallback font and the screen reader's voice.
- **Plan for 15–30% expansion** from English to Spanish (short labels can double). No fixed widths
  on text: `min-width`. And test with **the longest string**, not the average.
- **Proper names, in both languages inside the data**, and the search looks at both: whoever plays
  in Spanish searches for «Fuerza frágil» as much as "Fragile Strength".
- **The language selector, with the name in its own language** (`Español` / `English`), **never
  flags**. Persisted in the URL and in `localStorage`, and on the first visit initialised from
  `navigator.languages`.

## 10. What gives a fan site away, and what makes it look expensive

**The twelve giveaways** (all cheap to fix):

1. A table with the browser's default style and proportional figures.
2. Mixed number formats on the same page (`1.5` and `1,5`), **with no unit or patch version**.
3. A `#000` background, `#fff` text and a pure-hue accent (`#00FF88`).
4. Grey-on-grey secondary text at 13–14 px and ~3:1. **The trade's most common accessibility failure.**
5. Prose at the window's width (120 characters) or centred paragraphs.
6. The game's display typeface used for the body and for the cells.
7. Images without dimensions (reflow on every load) and full-size PNGs for 64 px icons.
8. Filters that reload the page, lose the state and can't be linked.
9. Twenty columns with no sticky header and page-level horizontal scroll on mobile.
10. Tooltips as the **only** place a key number lives: invisible to touch and keyboard.
11. Ads that break the layout.
12. Inconsistent spacing (every margin by hand), six font sizes on one screen, shadows on a dark theme.

**What reads as expensive:** restraint (one accent, two families, one scale); numbers that really
align; **linkable state** (any filter, sort or search reproducible from the URL); instant,
jump-free interaction; an empty state that says how to get out of it; keyboard shortcuts (`/` to
search, `Esc` to clear); a **data provenance line** ("Data: community wiki · patch 1.5.78.11 ·
checked in September 2026"); a remembered density; and calm, consistent motion (150–200 ms).

## 11. The ten cheapest improvements for this site

1. **The tokens file first** (checked colours, a 4 px scale, seven font sizes) and then loose
   values forbidden. An hour, and it changes everything that comes after.
2. **`tabular-nums` + numbers on the right + fixed decimals** with a single `Intl.NumberFormat`.
   Half an hour, and it's the biggest "this looks professional" jump there is.
3. **Fix three text colours with a checked ratio** and delete every grey below 4.5:1.
4. **Every table inside the accessible region** and sticky `th`s with `border-collapse: separate`.
5. **State in the hash** for filters, sorting and search too: shareable, and the "back" button
   becomes a free undo.
6. **`max-width: 66ch` on all prose** and `text-wrap: balance` on the titles.
7. **A `:focus-visible` rule** + `scroll-margin-block-start` so the sticky bar doesn't cover the focus.
8. **Images with `width`/`height`, AVIF + WebP + PNG, `loading="lazy"` and `decoding="async"`**
   below the fold. It kills CLS and removes 60% to 80% of the bytes.
9. **Bars inside the cell with a custom property** for the per-charm impact: the comparison we
   want, with no library and no JS.
10. **Wrap `localStorage` in `try/catch`** and keep the "data in `.js`, never in `.json`" rule,
    which is what lets us open the site with a double click.

**Deliberately postponed** (limited support): CSS anchor positioning, scroll-driven animations,
`text-wrap: pretty`, cross-document transitions, `field-sizing`, `contrast-color()`. All of it can
go in as an enhancement behind an `@supports`; none of it can hold up the layout.

## Sources

Baseline API (live, Sept. 2026) · [web.dev/baseline](https://web.dev/baseline) ·
[Core Web Vitals](https://web.dev/articles/vitals) · [LCP](https://web.dev/articles/optimize-lcp) ·
[CLS](https://web.dev/articles/optimize-cls) · [long tasks](https://web.dev/articles/optimize-long-tasks) ·
[content-visibility](https://web.dev/articles/content-visibility) ·
[typefaces](https://web.dev/articles/font-best-practices) ·
[WCAG 2.2 contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) ·
[WCAG 2.2 text spacing](https://www.w3.org/TR/WCAG22/#text-spacing) ·
[accessible tables (W3C)](https://www.w3.org/WAI/tutorials/tables/) ·
[Roselli: responsive tables](https://adrianroselli.com/2020/11/under-engineered-responsive-tables.html) ·
[Roselli: fluid type and zoom](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html) ·
[Roselli: WCAG 3 in 2026](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html) ·
[NN/g: data tables](https://www.nngroup.com/articles/data-tables/) ·
[Pencil & Paper: tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) ·
[GOV.UK: type scale](https://design-system.service.gov.uk/styles/type-scale/) ·
[Material: elevation](https://m3.material.io/styles/elevation/applying-elevation) ·
[Material: dark theme](https://design.google/library/material-design-dark-theme) ·
[Polaris: colour tokens](https://polaris-react.shopify.com/design/colors/color-tokens) ·
[Refactoring UI](https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886) ·
[Baymard: line length](https://baymard.com/blog/line-length-readability) ·
[CSS-Tricks: sticky and table headers](https://css-tricks.com/position-sticky-and-table-headers/) ·
MDN (modules, `localStorage`, non-HTTP CORS, responsive images, `Intl.PluralRules`, `size-adjust`)

*Unconfirmed:* the `lh`/`rlh` units are listed as "widely available" in the 2026 Baseline
bulletins, but this wasn't checked against the API. Treat them as an enhancement, not a base.
