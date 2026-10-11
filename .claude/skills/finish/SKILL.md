---
name: finish
description: Close a piece of work on this repo - regenerate data if needed, run the tests and audits, update the docs and plan status, open the branch and PR, and suggest keeping anything learned (skills, memories, rules). Use when the work is done, before handing back, or when asked to wrap up.
---

# Finishing

CLAUDE.md, "When you finish", is the source; this is it in order. Look at what changed first:
`git status` and `git diff --stat` (Albert commits between turns, so don't trust memory).

1. **Generated data.** If `tools/gen-*.js` or `kb/` changed: `npm run data`, then read the diff
   of `js/data.js`, `js/enemies.js`, `js/journal.js` and the rest; explain anything unexpected.
2. **Tests.** `npm test`. If game names or visible strings changed: `npm run text -- --audit`.
   If `js/savefile.js` or `js/completion.js` changed: `npm run check-pack -- <folder>` (ask
   Albert for the folder of real saves if it isn't known).
3. **Docs.** If the page changed, `docs/guide.md` (both what it says and how). Plan status in
   `design/00-study.md` §9 if a phase moved, and in `design/03-redesign.md` if a review step did.
4. **Style pass on the diff.** No "—" anywhere (code, docs, strings). Repo text in English; only
   the `es` side of the pairs in Spanish. No loose colours or sizes outside `css/tokens.css`.
5. **Branch, commit and PR.** Run `git status` and `git log -1` to see what is actually
   pending. Branch from the most suitable base (normally `dev`) with the conventional prefix that
   fits (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `perf/`, `test/`...), one commit with a
   brief message of the same type (lowercase, a few words, about 50 characters), push, and
   `gh pr create --base dev` with an English body that carries the detail. Only Albert appears:
   no `Co-Authored-By` line, no "Generated with Claude Code" (the `commit-msg` hook rejects the
   first). Don't commit design variants pages; delete them once their step is built.
6. **Keep what was learned.** Look back over the conversation: a correction Albert had to repeat,
   a routine done by hand more than once, a rule that wasn't written down. If something is worth
   keeping for good, propose it with the option selector (AskUserQuestion, not plan mode): a new
   or changed skill in `.claude/skills/`, a memory, a CLAUDE.md rule, a hook. If there's nothing,
   skip this step without mentioning it.
