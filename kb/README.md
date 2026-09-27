# Combat knowledge base — Hollow Knight: Silksong

The wiki's knowledge, kept here so the site's data can be regenerated without going back to the
wiki by hand. It isn't part of the site (`index.html` doesn't load it). Built in phase 1 of the
plan (`design/00-study.md` §9).

## `data/`

| File | What it is |
|---|---|
| `pages.txt` | The pages `kb/` is built from: the Silksong categories (Tools, Crests, bosses, enemies, skills, areas, items), the gauntlets' subpages, the damage page, the Journal, Completion, Save Data and the rest. `Category:` and `Prefix:` lines expand |
| `fetch-wiki.py` | Downloads the raw wikitext into `raw/`: `npm run kb` (every page in `pages.txt`), or `python3 kb/data/fetch-wiki.py "Page name"`. Redirects are saved under the title asked for |
| `raw/` | 522 pages of wikitext, `<Title>.wiki` with `/` and spaces as `_`. Committed, so the generators run offline and a re-fetch after a patch shows up as a diff |
| `completionist/` | Br3zzly/silksong-completionist's dictionary (MIT, its `LICENSE` beside it), at the commit in `SOURCE`: `npm run collectibles`. Only its facts are used (each thing's save field and Act), not its prose |
| `all_text.json` | The game's text dump, downloaded by `npm run text` (not committed; `.gitignore`) |
| `art/` | The sprites `npm run palette` measures for `design/02-silksong.md` (not committed: Team Cherry's art) |

## From here to the site

`npm run data` runs the four generators in `tools/`, which read `raw/` and the dump and write
the site's data files. None is edited by hand:

| Generator | Writes | From |
|---|---|---|
| `tools/gen-data.js` | `js/data.js` | The Tools page and each Tool's infobox, each Crest's infobox, Eva's page, the damage page's Needle, Needle Strike, Tools, Silk Skills and Modifiers tables |
| `tools/gen-enemies.js` | `js/enemies.js` | The damage page's two master tables (health, black-threaded health, five modifiers per row) and each boss page's *Behaviour and Tactics* (attacks, `{{Damage}}`, `{{Stagger}}`) |
| `tools/gen-journal.js` | `js/journal.js` | The *Hunter's Journal (Silksong)* table (order, kills, notes) and the game's `NAME_`, `DESC_`, `NOTE_` texts |
| `tools/gen-collectibles.js` | `js/collectibles.js` | `completionist/`, joined to `js/data.js` and `js/journal.js` by the game's English name: the save's names for the Tools, Crests and Journal entries, and the loose pieces with their checks |

Shared by them: `tools/wiki.js` (pages, templates, `{{Localisation}}`, tables with rowspans),
`tools/names.js` (the game's names by key, by English, and a page's Journal key) and
`tools/emit.js` (the output files).

## Source and reliability

Everything comes from **`hollowknight.wiki`** as raw wikitext, fetched on 27 September 2026 for
patch 1.0.30000. The wiki disagrees with itself in a few places (`design/00-study.md` §8): the
generators take the damage page's numbers. Its own disclaimer applies to the master tables:
enemies with several health values (a summon inside a boss fight) aren't fully explored. The
Spanish names are the game's own, by key, not the wiki's `ESname` where they differ (Moss
Mother: «Madremusgo», not «Madre Musgo»).
