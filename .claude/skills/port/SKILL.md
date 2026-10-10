---
name: port
description: Carry a fix or feature between this repo and its sibling hollownest-calculator (../hollownest-calculator/), in either direction, adapting it to each site's rules. Use when asked to port, bring over, copy from or match the sibling / the Hollow Knight site.
---

# Porting between the sibling sites

The two repos started from the same skeleton and diverge freely; a port is a hand adaptation,
never a blind copy.

1. **Find the change** in the source repo: `git -C <repo> log`, `git -C <repo> show <sha>`, or
   the code by grep. Read the target repo's equivalent code before touching it: the structure may
   have drifted.
2. **Adapt it:**
   - Storage: `pharloom.*` keys and the `pharloom-live` IndexedDB here, `hollow.*` there. Never
     read or write the other site's keys (they share the origin).
   - Strings: each `{ es, en }` comes from its own game's sources (here, `/game-text`); never
     carry a Hollow Knight name or translation into Silksong.
   - Game rules differ (damage model, completion, Journal): check `design/00-study.md`.
   - The target's own tokens and visual language, not the source's values.
3. **Footworn parity.** `track()` events are the same set in both sites: grep `track(` in both
   `js/` folders. A new event goes in both or neither.
4. **Note the origin** in the commit summary (and in the design doc if it's a design decision).
5. Close with `/finish` in the repo that changed.
