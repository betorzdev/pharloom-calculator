---
name: design-round
description: Run one step of the site's UI review (design/03-redesign.md) - look at the screen as it is and at the sibling's, draw the options in a design/NN-*-variants.html page, and let Albert pick with the option selector. Use when asked to redesign, rethink or retouch a screen or a piece of the page, or to "draw options".
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
4. **Draw the options** in `design/NN-<step>-variants.html`, NN the next free number (with
   parallel agents, the orchestrator hands out the numbers). Copy the frame of the latest
   variants page (`<base href="../">`, `css/tokens.css` + `css/app.css`). Real data from a save,
   not invented; every value from the tokens. The bottom bar (`.mk-bar`):
   - one numbered row per open decision (1, 2, 3...), one lettered button per option (A, B,
     C...), the recommended one marked ★, every decision switchable live, not only the layout;
   - rows that only change the preview (save, width, tab) carry no number or letter;
   - the choice in the URL (`?v=b&w=390`).
   Screenshot every option at 1440 and 390 and fix what's broken before reporting.
5. **Propose with the option selector**, never plan mode (it blocks every running agent, and
   leaving it asks Albert for permission). Open the page in the browser (`xdg-open <path>`), name
   its file in the question, and start each question with one line on what is being chosen.
   Options keep the page's letters, recommended first. If Albert likes none, draw a second round
   (`NNb`) with what he did pick fixed in place. Every design decision goes through a page, even a
   "fix" that changes a look; only purely technical choices may be asked without one.
6. **Build what was decided.** Then record in `design/03-redesign.md`: the step's table row
   (status, date) and its section (options, decision, date). Don't commit the variants page;
   delete it once the step is built. Close with `/finish`.
