---
name: finish
description: Close a piece of work on this repo - regenerate data if needed, run the tests and audits, update the docs and plan status, propose the one commit message, and suggest keeping anything learned (skills, memories, rules). Use when the work is done, before handing back, or when asked to wrap up.
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
5. **Commit message.** Never commit or push. Run `git status` and `git log -1`, then give ONE
   message for the whole uncommitted block: `feat:` / `fix:` / `docs:` / `chore:`, lowercase,
   a few words, about 50 characters. The detail goes in the summary, not the message.
6. **Keep what was learned.** Look back over the conversation: a correction Albert had to repeat,
   a routine done by hand more than once, a rule that wasn't written down. If something is worth
   keeping for good, propose it in plan mode with options (AskUserQuestion): a new or changed
   skill in `.claude/skills/`, a memory, a CLAUDE.md rule, a hook. If there's nothing, skip this
   step without mentioning it.
