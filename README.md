# Pharloom Calculator

**Your real Hollow Knight: Silksong game, followed live, and every Tool's and Crest's effect on
Hornet. In English and Spanish.**

The sibling of [Hallownest Calculator](https://github.com/betorzdev/hallownest-calculator), built
from its skeleton: import your save and the site will show it as the game does, the 100% item by
item, the game's own map with what you're missing, the Hunter's Journal; keep playing, and every
time you sit on a bench it catches up. Then try builds (a Crest, its Tools, the Needle's level)
and take them into a fight where the answer is different for each enemy.

**Status (27 September 2026): phase 0 of the plan, the skeleton.** Nothing is published yet.
The study of the game and the plan by value and cost are in
[`design/00-study.md`](design/00-study.md); the rules for working on it, in
[`CLAUDE.md`](CLAUDE.md).

## Run it

No framework, no build, no install. Double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 8000    # then http://localhost:8000
npm test                       # node --test, no dependencies
npm run text -- "Straight Pin" # the game's own text, in every language it ships
```

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
