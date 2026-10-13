---
name: merge-prs
description: Review and merge the open PRs against dev one at a time - bring dev into each branch, resolve conflicts, check it, open the site on the screen it changes, explain it to Albert, and squash-merge only on his green light. Use when asked to merge, review or go through the pending PRs ("vamos a mergear las PRs").
---

# Merging the pending PRs

Albert reviews each PR in the browser and says "luz verde" or what to change. Nothing is merged
without his green light for that PR.

## Order

`gh pr list --state open` first (he may have merged some). Those that touch nothing shared go
first; those that touch the same files (the Map's: `js/app-map.js`, `css/app.css`) go in the
order that leaves the least to rebase, the deepest change first. Say the order once, at the start.

## Each PR

1. **Switch**: `git checkout <branch> && git pull`. Read the PR's body and files
   (`gh pr view N --json body,files`).
2. **Bring dev in**: if `git merge-tree --write-tree dev HEAD` reports a conflict, or the branch
   is behind what was just merged, `git merge --no-edit dev`, so what Albert sees is what will
   land. Resolve each conflict by keeping both sides' intent: when one side moved code into a
   function and the other changed the old copy, port the change into the function. Look for what
   merges clean but breaks: a name, glyph or helper the other PR removed (`node --check`, grep).
3. **Check**: `npm test`; `npm run text -- --audit` if strings changed; `npm run data` and an
   empty diff if generators changed; the changed screens loaded headless with no console errors:
   `google-chrome --headless=new --allow-file-access-from-files --enable-logging=stderr --v=0 --virtual-time-budget=4000 --dump-dom "file://$PWD/index.html#view=<v>"`,
   or with a real save and a count of console errors: `npm run drive -- --save <user#.dat> --view <v>` (`tools/drive.js`).
   Commit the merge (`--no-edit`) and push.
4. **Show it**: open the screen it changes,
   `xdg-open "file://$PWD/index.html#view=<v>"` (`home` Your game, `game` Inventory, `progress`,
   `map`, `#view=map&admin=1` for the Map's admin; never `#<v>`, which lands on the last screen).
5. **Explain it in Spanish**: what it changes in plain words (not the code's terms: a "layer" is a
   kind of mark on the map), the conflicts resolved and how, what was checked and what wasn't, and
   where to look. End with "¿Luz verde o cambio algo?".
6. **On his answer**:
   - green light: `gh pr merge N --squash --delete-branch`, `git checkout dev && git pull`, next PR;
   - a bug he points at: find its cause (it may be older than the PR), fix it on the PR's
     branch with a test that fails without the fix, push, show it again;
   - "doesn't read" or a design doubt: ask what part with the option selector, then a design
     round (`/design-round`) whose result goes into the same PR.

At the end, `gh pr list --state open` should be empty; update or delete any memory that tracked
the pending PRs.
