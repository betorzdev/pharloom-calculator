# Pharloom Calculator — the full guide

*Phase 2 under way: your game from its save. This guide grows with the page (CLAUDE.md: keep it up to date).*

## What's on the page

The header has the language and, on the right, the save you're in (Hornet at a bench): it opens
**Saves**. The screen bar has the screens the plan brings (Your game, Inventory, Progress, Map,
Journal; Crest, Combat); the ones not built yet say which phase of the plan builds them. The
study and the plan are in `design/00-study.md`.

### Saves

Four saves, as the game's profile screen, and **Free mode** (nobody's game: where the site
starts). A save only comes from the game's file: **Import from the game** opens a view that
says where each system keeps its saves (the folder to copy and how to paste it into the file
picker) and takes the file by dragging it in or with the picker. It shows what it read (masks,
Needle, time, completion, rosaries, the Act, the Journal, the Tools) before anything is written.
Any of the game's files works: `user1.dat` to `user4.dat`, the copies from before a patch
(`user1_1.0.29242.dat`) and the **restore points** in `Restore_Points#/restoreData#.dat`, which
are earlier moments of the same game (the preview says the day). The file is read in the browser
and isn't sent anywhere.

Where the browser can (Chrome and Edge: File System Access), an imported save can **follow the
game**: the site keeps a link to the file and catches up each time the game writes it. After a
reload the browser asks for permission again, and a notice above the screen says so. **Clear**
asks the game's own question («Clear Profile?») and only clears the site's copy.

### Your game

In Free mode, an invitation: drag your save's file there and it goes into the first empty save.
In a save: the Act, the time played, the rosaries and **your 100%**, split into the wiki's ten
categories (Tools, Silk Spools, the Crafting Kit and Tool Pouch, abilities, Silk Skills, Crests,
masks, the Needle, Silk Hearts, the Everbloom), with the figure the game itself shows under it:
they're the same. The site counts as the game does, checked on 92 real saves (0% to 100%, four
patches, Steel Soul): whole masks and spools, not loose shards and fragments (two shards are
still 0%), and a Tool and its upgrade (Curveclaw and Curvesickle) are one point. And the
Journal: the required entries with their kills done, out of 230 (231 in Steel Soul).

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
  only the facts (the header, the key, the field names) are taken. Where each Tool, Crest,
  Journal entry and loose piece lives in the save comes from the completionist's dictionary,
  pinned in `kb/data/completionist/` with its licence (`npm run collectibles`).
- **Sprites**: Hornet, the masks, the spool and the five Needles are the game's, downloaded
  from the wiki (`npm run art`) and shown as a fan project.
- **Fonts**: Cinzel, Spectral and Patrick Hand SC, under the
  [SIL Open Font License 1.1](../assets/fonts/OFL.txt).
- **Code**: MIT ([`LICENSE`](../LICENSE)). It covers only the code, not any of the above.

If you hold rights over something here and want it removed, open an issue or write to
[betorzdev@gmail.com](mailto:betorzdev@gmail.com).

## Contact

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)).
