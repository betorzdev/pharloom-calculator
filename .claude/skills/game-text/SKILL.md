---
name: game-text
description: Add or change a visible string on the site - find its Spanish and English from the game's own text, then the wiki, never translating by hand, and check it with the audit. Use whenever a game name (Tool, Crest, item, enemy, area, menu label) or any new { es, en } pair goes into the page.
---

# Visible text

CLAUDE.md, "Translations", is the source. Nothing is translated by hand.

1. **The game's text first**: `npm run text -- "<English name>"`, or `npm run text -- --key <PREFIX_>`
   (`CREST_`, `INV_NAME_`, `PANE_`, `NAME_`…). Copy it as is, capitals and typos included; curly
   quotes become straight. Put the key in a comment next to the string (`// PANE_JOURNAL`).
2. **Then the English wiki**: `https://hollowknight.wiki/w/<Page>?action=raw`, the `ESname` in its
   `{{Localisation}}` block (its `CODEname` joins it to the dump). If the wiki and the game
   disagree, the game wins.
3. **No source**: keep it in English and say so in the comment.
4. **Site's own text** (what the game doesn't say): written for the context in each language, not
   word for word. Labels copying a game element carry its text. Numbers: «50 %», «0,25 s» in
   Spanish; "50%", "0.25 s" in English. Same `{x}` placeholders in both.
5. An element showing only a game name carries `${NT}` (`translate="no"`).
6. Generated files (`js/data.js`, `js/enemies.js`, `js/journal.js`): change `tools/gen-*.js`, each
   text as `{ es, en, key }`, then `npm run data`.
7. Check: `npm test` (accents or Spanish in the English, placeholders) and `npm run text -- --audit`.
