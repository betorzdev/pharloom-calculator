# Pharloom Calculator — the full guide

*Phase 0: the skeleton. This guide grows with the page (CLAUDE.md: keep it up to date).*

## What's on the page

Nothing yet but the shell: the header with the language, the screen bar with the screens the
plan brings (Your game, Inventory, Progress, Map, Journal; Crest, Combat) and, on each, which
phase of the plan builds it. The study and the plan are in `design/00-study.md`.

## Where the numbers come from

From the community wiki (`hollowknight.wiki`), page by page, with the game's rounding (half to
the even integer, and the exceptions the wiki names on its damage page). The Spanish names are
those of the game's official translation.

## Languages

Until someone chooses, the site starts in the browser's language: the first of
`navigator.languages` that it speaks, and English if none. The language saved in
`pharloom.prefs` only counts if it was chosen. All text goes through `js/i18n.js` or through a
`{ es, en }` in the data. Nothing is translated by hand: the game names are copied from its own
texts (`npm run text`), and the rules are in `CLAUDE.md`, "Translations".

## Credits and licences

**Unofficial fan project**, free and non-commercial, not affiliated with or endorsed by
[Team Cherry](https://www.teamcherry.com.au/). *Hollow Knight: Silksong*, its artwork, sprites,
texts and names are © Team Cherry; they're used here only to show the game's own information.

- **Numbers and data**: [hollowknight.wiki](https://hollowknight.wiki/), under
  [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). What's taken or adapted from
  it keeps that licence. Thanks to its editors.
- **The game's texts**: its official Spanish and English names come from the dump of its
  TextAssets in [stradivari96/silksong-translator](https://github.com/stradivari96/silksong-translator).
  The dump isn't in this repo: `npm run text` downloads it to `kb/data/all_text.json`.
- **Save files**: the format was read in [Br3zzly/silksong-completionist](https://github.com/Br3zzly/silksong-completionist)
  (MIT) and [apocalyptech/silksong-save-decrypt](https://github.com/apocalyptech/silksong-save-decrypt);
  only the facts (the header, the key, the field names) are taken.
- **Fonts**: Cinzel, Spectral and Patrick Hand SC, under the
  [SIL Open Font License 1.1](../assets/fonts/OFL.txt).
- **Code**: MIT ([`LICENSE`](../LICENSE)). It covers only the code, not any of the above.

If you hold rights over something here and want it removed, open an issue or write to
[betorzdev@gmail.com](mailto:betorzdev@gmail.com).

## Contact

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)).
