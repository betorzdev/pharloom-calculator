---
name: design-round
description: Run one step of the site's UI review (design/03-redesign.md) - look at the screen as it is and at the sibling's, draw the options in a design/NN-*-variants.html page, and let Albert pick in plan mode. Use when asked to redesign, rethink or retouch a screen or a piece of the page, or to "draw options".
---

# A design round

The method is `design/03-redesign.md`, "How each step goes": read it first, and the step's own
section if it already has one. This is that method as a checklist.

1. **Look at the site as it is.** Screenshots at 1440 and 390 px, headless Chrome over `file://`:
   `google-chrome --headless=new --window-size=1440,2200 --screenshot=<scratchpad>/x.png "file://$PWD/index.html#view=<v>"`
   (and `--window-size=390,2200`). Read the code behind it (`css/app.css`, `js/app-<screen>.js`).
2. **Think it through** against `design/01-web.md` (the rules) and `design/02-silksong.md` (the
   game's measured visual language), and what the game does on the equivalent screen. The game
   selects with white on grey, no hue; the red is atmosphere only.
3. **Look at the sibling**, `../hollownest-calculator/`, in **both states**: with a save loaded
   and in Free mode (its screens are editable there, and that look counts). Screenshots and its
   render code, plus its `design/` rounds.
4. **Draw the options** in `design/NN-<step>-variants.html`, NN the next free number. Copy the
   frame of the latest variants page (`<base href="../">`, `css/tokens.css` + `css/app.css`, the
   `.mk-bar` to switch option and width, the choice in the URL: `?v=b&w=390`). Real data from a
   save, not invented. Every value from the tokens.
5. **Propose in plan mode.** Every open choice (design, scope, order) goes through
   AskUserQuestion, recommended option first, pointing at the variants page. The plan file holds
   only what Albert picked. Don't split the work into batches unless asked.
6. **Build what was decided.** Then record in `design/03-redesign.md`: the step's table row
   (status, date) and its section (options, decision, date). Close with `/finish`.
