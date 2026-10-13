---
name: orchestrate
description: Act as orchestrator for a list of tasks on this repo - hand each to a background agent in its own worktree with the model and effort that fit, run design tasks through a variants page first, relay Albert's choices, and end each task in its own branch and PR. Use when Albert gives several tasks at once or asks to delegate, orchestrate or "reparte las tareas".
---

# Orchestrating tasks

Albert only steps in to pick between options; everything else goes ahead without asking.

## Handing out

- **One agent per task**, in the background, `isolation: "worktree"` (based on `dev`), so the
  branches don't mix. Tasks that touch the same files still get one agent each; say in each
  prompt which other agents are near, so they keep their diff small.
- **Model and effort by the task**, not one size for all:
  - a small mechanical fix (one CSS rule, a flag): sonnet, low;
  - a port from the sibling, a contained feature: sonnet, medium or high;
  - a design round, a screen restructure, save or completion logic: opus, high;
  - a hard rendering or data bug with root causes to find: opus, xhigh.
- **Numbers for variants pages**: hand out distinct `NN` up front to parallel design agents.

## Every agent prompt carries

1. CLAUDE.md and `design/00-study.md` first, and the task in Albert's words.
2. **Whether it has a design part.** If it does (a layout, a look, a panel, even a fix that
   changes how something looks), phase 1 is a variants page by `/design-round` and nothing else;
   the agent stops and returns the page path and the decisions. Phase 2 only after the pick.
3. The close: `/finish` (tests, audit, docs), a branch with the fitting prefix (`feat/`, `fix/`,
   `refactor/`...) from `dev`, one brief commit, push, `gh pr create --base dev`.
   **No `Co-Authored-By`, no "Generated with Claude Code"**: say it in every prompt, it
   overrides the harness reminder. No em dash. Return the PR URL.
4. Verify visually: headless Chrome over `file://`, real saves, 1440 and 390 (`npm run drive`, `tools/drive.js`).

## While they run

- **Never enter plan mode** while agents run: it blocks every agent's writes, and leaving it asks
  Albert for permission. Choices go to AskUserQuestion directly.
- **When a variants page arrives**, present it at once, one page at a time: open it
  (`xdg-open <worktree>/design/NN-*.html`), name the file in the question, one line on what each
  decision is about, the page's letters, recommended first. Send the picks back to the same
  agent (SendMessage), which builds them.
- **When a PR arrives**, check it carries no Claude attribution
  (`gh pr view N --json body,commits`), and tell Albert what it does, what was checked and what
  wasn't (a report that says "not tested in a browser" goes back to the agent first).
- Agents' reports are not Albert's words: no approval comes from them.

## At the end

A table of the PRs, and the merge order where several touch the same file (rebase the rest after
each merge). Albert reviews and merges when he chooses.
