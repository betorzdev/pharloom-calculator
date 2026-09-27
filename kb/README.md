# Combat knowledge base — Hollow Knight: Silksong

For answering combat questions without going back to the wiki. It isn't part of the site
(`index.html` doesn't load it); it's reference material. **Empty until phase 1** of the plan
(`design/00-study.md` §9): the batch fetch of the Tools, Crests, bosses, enemies, the damage
page, the Journal, the gauntlets and the Wishes, as `hallownest-calculator/kb/` was built.

## `data/`

| File | What it is |
|---|---|
| `fetch-wiki.py` | Downloads raw wikitext into `raw/`: `python3 fetch-wiki.py "Page name" list.txt`. Same API as for Hollow Knight (`https://hollowknight.wiki/mw/api.php`); the Silksong categories are `Bosses (Silksong)`, `Enemies (Silksong)`, `Tools`, `Crests`, `Skills and Abilities (Silksong)`, `Areas (Silksong)`, `Items (Silksong)` |
| `all_text.json` | The game's text dump, downloaded by `npm run text` (not committed; `.gitignore`) |

## Source and reliability

Everything will come from **`hollowknight.wiki`** as raw wikitext, patch 1.0.30000 (the wiki
disagrees with itself in a few places: `design/00-study.md` §8 lists them). The Spanish names
are the game's own (`npm run text`), not the wiki's, where they differ.
