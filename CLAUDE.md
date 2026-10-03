# Pharloom Calculator — project instructions

A site for seeing **how each of Hornet's stats changes with each Tool, Crest and upgrade** in
*Hollow Knight: Silksong*, and for following your real game from its save. Spanish and English.
It's the sibling of [hallownest-calculator](https://github.com/betorzdev/hallownest-calculator):
started from its skeleton, with the same rules, and the two repositories diverge freely (what's
fixed in one is ported by hand to the other when it matters).
`README.md` is the short tour; `docs/guide.md` explains everything on the page (keep it up to
date when the page changes); these are the rules for working on it.

## Where the knowledge is

Before touching anything, check whether it's already solved:

- **`design/`** — design. **`design/00-study.md` is the entry point**: what Silksong has for each
  piece of the site, the damage model, every data source checked from here, what carries over
  from the Hollow Knight site, the risks, and **the plan by value and cost, with its status**.
  Next to it, web best practices (`01-web.md`) and the game's visual language, measured
  (`02-silksong.md`). **Read the study before any change.**
- **`kb/`** — the wiki's wikitext (`kb/data/raw/`, `npm run kb`) that the site's data is generated
  from (`kb/README.md`).

Neither folder is part of the page: `index.html` doesn't load them.

## Hard constraints

- **No framework and no build.** `index.html` loads classic scripts, not modules. The page is
  `js/app.js` (the core) and one script per screen (`js/app-*.js`), sharing the `SS.app` object,
  and `js/app-boot.js` starts it; the rules for sharing are in `js/app.js`'s header. Plus
  Footworn's (`async`, external, `data-site="pharloom"`), the visit counter: the site has to
  work the same without it, so its events go through `track()` in `js/app.js`, which does
  nothing if it's missing.
- **The site has to work over `file://`** (opening `index.html` with a double click). Everything
  else follows from that: ES modules and `fetch()` are blocked by the opaque origin, so **data
  travels in `.js` files with an assignment, never in `.json`**.
- **`localStorage` always wrapped in `try/catch`**: over `file://` its behaviour is undefined and
  access can throw.
- **Every storage key starts with `pharloom.`**, and the IndexedDB database is `pharloom-live`.
  This site and the Hollow Knight one share the `betorzdev.github.io` origin, so they share
  `localStorage`: `hollow.*` is the other site's, never read or written here.
- **Every colour, typeface and spacing value comes from `css/tokens.css`.** No loose values.
  The HUD and the slot colours are measured (`design/02-silksong.md`); the surfaces, the accent
  and the frames were decided on them (its §5, and the tokens' header). The page is the
  main menu (its red light and embers), the screens the pause menu (black, framed and titled in white
  filigree). Each screen's frame, corners, plaque and a light from its top take the colour of its
  tab's place in the game (`--tab-*`, from the area tokens; design/03-redesign.md, step 1, third
  round, Albert's choice): only the frame's light, never the accent, a figure or text. The
  red is atmosphere only, never the accent, a figure or text.
- **`js/data.js`, `js/enemies.js` and `js/journal.js` are generated** (`npm run data`, from
  `kb/data/raw/` and the dump, offline): change `tools/gen-*.js`, never the output. Every game
  text in them carries its key, `{ es, en, key }`, and `--audit` checks each one against it.
- **Every visible string carries its `{ es, en }` pair**, and the engine, when it exists,
  receives the language: `compute(state, lang)`. The maths never depends on the language.
- **The numbers come from `hollowknight.wiki`**, with the game's rounding (half to the even
  integer, with the exceptions the wiki names on its damage page). The odd cases are noted
  where they're used.
- **The repo is written in English**: code, identifiers, comments, tests, docs (`design/`,
  `kb/`) and commit messages. Only the site's Spanish side is Spanish: the `es` of each
  `{ es, en }` pair and the Spanish texts the tests check.

## Translations

**Nothing is translated by hand.** Every visible string carries `{ es, en }` and comes from a
source, in this order. `npm run text -- "Straight Pin"` searches the first one; `--key CREST_`
lists by key; `--audit` cross-checks every game name the site carries against its text.
An element that shows only a game name carries `${NT}` (`translate="no"`), so a browser
translator leaves it as the game says it.

1. **The game's text**: the dump of its TextAssets, `kb/data/all_text.json` (downloaded the
   first time, pinned to patch 1.0.30000, from stradivari96/silksong-translator; 11 languages).
   Tools `<TOOL>_NAME` and `_DESC` (`STRAIGHT_PIN_NAME`; `BARBED_WIRE_NAME` is Barbed Bracelet,
   «Cilicio»), Crests `CREST_<X>_NAME` (`CREST_PILGRIM` is Wanderer «Errante», `CREST_WARRIOR`
   Beast «Bestia», `CREST_SPELL` Shaman «Chamana», `CREST_TOOLMASTER` Architect «Arquitecta»),
   Needles `INV_NAME_NAIL1..5`, Skills and Arts `INV_NAME_SKILL_*`, items `INV_NAME_*`, Journal
   entries `NAME_X` / `DESC_X` / `NOTE_X`, area and boss titles `<X>_SUPER` + `<X>_MAIN`, the
   pause menu `PANE_*` («Inventario», «Blasón», «Diario», «Mapa», «Tareas»), prompts `BUTTON_*`
   and `PROMPT_*`, modes `MODE_*`, achievements `ALL_*`, the kingdom `Pharloom` → «Telalejana».
   **It's copied as is**: its capitalisation and its typos. Curly quotes become straight.
   **Leave the key in a comment next to the string** (`// PANE_JOURNAL`): `--audit` checks those.
2. **The English wiki**, the `ESname` in the page's `{{Localisation}}` block
   (`https://hollowknight.wiki/w/<Page>?action=raw`), for what the game doesn't name anywhere.
   The block also carries `CODEname`, the game's own key, which joins a wiki page to the dump.
   Where the wiki and the game disagree (Moss Mother: the wiki says «Madre Musgo», the game
   «Madremusgo»), **the game wins**.
3. **With no source**, it stays in English and that's noted in the comment. The bosses' attack
   names are the English wiki's fan names; the Spanish Fandom wiki has nothing usable for Silksong.

What the site says and the game doesn't **is written for the context**, not word for word:
the two languages say the same thing in their own way. A label that copies an element of the
game carries its text («Blasón», «Enlazar», «Finalización»); in prose the plain word will do. A
game name inside a sentence goes as in the game. Numbers: Spanish «50 %» and «0,25 s»; English
"50%" and "0.25 s". The `{x}` placeholders are the same in both languages. `npm test` catches
Spanish accents or words in the English and mismatched placeholders; `npm run text -- --audit`,
a game name that doesn't say what the game says.

## When you finish

- If you've touched `tools/gen-*.js` or re-fetched `kb/`, `npm run data` and look at the diff.
- `npm test` — `node --test`, no dependencies. `test/i18n.test.js` fails if a Spanish accent
  slips into the English or a string is left untranslated. If you've touched game names,
  `npm run text -- --audit`.
- If you've touched `js/savefile.js` or `js/completion.js` and have a folder of real saves,
  `npm run check-pack -- <folder>` (phase 2): the site's 100% must equal the game's in every one.
- Update the plan's status in `design/00-study.md` §9 when a phase moves.

## Things that are easy to get wrong without checking

From the study (`design/00-study.md`) and the wiki's damage page:

- **Damage is `weapon[level] × enemy_modifier[level] × (1 + Σ modifiers)`**, rounded half to
  even. Every enemy carries five modifiers, one per level, so "hits to kill" is per enemy.
- **Tools scale with the Crafting Kit's level, not the Needle's** (+60% per level, rounded
  before anything else); the Needle, Needle Strike, Silk Skills and Clawline use the Needle's.
  Ammo scales with the Tool Pouch.
- **Player modifiers add, they don't multiply**: 1 + 0.3 (Hunter focus) + 0.25 (Barbed Bracelet)
  + 0.5 (Flintslate)… The Wanderer's ×3 critical applies after the bracket.
- **The Needle is 5/9/13/17/21** (3 with the Cloakless Crest). Masks go from 5 to 10 (20 shards,
  4 each); the spool from 9 to 18 (18 fragments, 2 each), 21 with the Spool Extender.
- **Completion is 100%, half of it Tools** (51), and 7 points are Act 3's: 93% is the most a
  game shows before it. The Journal, bosses and Wishes don't count.
- **The Journal has 236 entries (237 in Steel Soul), and Nuu's reward needs 230 (231)**: six are
  optional. The save stores kills per entry directly.
- **There is no Godhome**: no boss rush, no rematches. The Elegy memories close once won.
- **The wiki disagrees with itself in places** (Silk Heart timing, Longclaw's range, the Witch's
  Needle Strike hits): take the damage page's number and note the other.
- **Pharloom is «Telalejana»** in the game, and the Tools screen is «Blasón» (`PANE_TOOLS`).
- **The Barbed Bracelet («Cilicio») is a yellow Tool**, not blue, though it's a combat one.
- **A slash waits max(cooldown, duration)**, each Crest's own (`js/hero.js`, from the game's
  files): 0.41 s for the Hunter. Flea Brew only shortens the cooldown, so the Hunter's 0.35 s is
  its floor: +17%, not the wiki's +50%.
- **The Map is drawn piece by piece with the game's own rules** (`tools/extract-map.py`'s header,
  `js/rooms.js mapView`): a room is two or three pieces mapped one by one, by `scenesMapped`
  (not `scenesVisited`: it trails it), and an area shows only once its map is bought. The site
  being a guide, what the game doesn't draw yet is there faint by default («Only what the game
  shows» hides it). Never cut a room out by its box: its pieces share it. The pieces are composed
  on a canvas (`js/map-paint.js`), never a window each: the browser smooths each window's edge
  and lets a hairline through where two pieces meet.
- **Six wiki pages carry a `CODEname` that isn't their Journal key** (`CORAL_GOOMBA` for
  `NAME_CORAL_GOOMBAS`); `tools/names.js` falls back to the title.
- **The game selects with white on grey, with no selection hue**: don't invent one from
  Hornet's red (`design/02-silksong.md` §3).
- **Silksong is still patched, and Sea of Sorrow (a free expansion) is due in 2026**: every
  generated file has to be regenerable in one command.
