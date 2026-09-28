# Pharloom Calculator

**Your real Hollow Knight: Silksong game, followed live, and every Tool's and Crest's effect on
Hornet. In English and Spanish.**

The sibling of [Hallownest Calculator](https://github.com/betorzdev/hallownest-calculator), built
from its skeleton: import your save and the site will show it as the game does, the 100% item by
item, the game's own map with what you're missing, the Hunter's Journal; keep playing, and every
time you sit on a bench it catches up. Then try builds (a Crest, its Tools, the Needle's level)
and take them into a fight where the answer is different for each enemy.

**Status (27 September 2026): the plan's eight phases are built**, ready to publish: your game
from its save (the 100% equal to the game's on 92 real saves), the Inventory, Progress with the
Tasks, the game's own map, the Hunter's Journal, the Crest screen with the build engine, and
Combat against every enemy and gauntlet; one page per search in each language, and one per
boss. The study and
the plan are in [`design/00-study.md`](design/00-study.md); the rules for working on it, in
[`CLAUDE.md`](CLAUDE.md); what's on the page, in the [guide](docs/guide.md).

## Run it

No framework, no build, no install. Double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 8000    # then http://localhost:8000
npm test                       # node --test, no dependencies
npm run text -- "Straight Pin" # the game's own text, in every language it ships
npm run kb                     # downloads the wiki's wikitext into kb/data/raw/
npm run data                   # regenerates js/data.js, enemies, journal, collectibles, gauntlets
npm run collectibles           # the completionist's dictionary, pinned (the save's fields)
npm run art                    # the game's sprites from the wiki; npm run icons, its icons
npm run pages                  # one page per search and per boss, in each language, and sitemap.xml
npm run check-pack -- <folder> # the site against a folder of real saves: the 100% must match
```

The map is extracted from the installed game: `tools/extract-map.py` (see its header); and the
game's arenas, which say how a save marks each gauntlet cleared, are listed by
`tools/extract-battles.py`; each Crest's slash timings, into `js/hero.js`, by
`tools/extract-hero.py`; and how the rooms connect, into `js/graph.js`, by `tools/extract-graph.py`.

## Credits

**Unofficial fan project**, free and non-commercial, not affiliated with or endorsed by
[Team Cherry](https://www.teamcherry.com.au/). *Hollow Knight: Silksong*, its artwork, texts and
names are © Team Cherry.

Data from [hollowknight.wiki](https://hollowknight.wiki/) (CC BY-SA 3.0); game texts from
[stradivari96/silksong-translator](https://github.com/stradivari96/silksong-translator);
fonts under the [SIL OFL 1.1](assets/fonts/OFL.txt). The code is [MIT](LICENSE). The details
are in the [guide](docs/guide.md#credits-and-licences).

Made by **Albert** ([@betorzdev](https://github.com/betorzdev)) ·
[betorzdev@gmail.com](mailto:betorzdev@gmail.com)
