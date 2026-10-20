# 7 Wonders Lab — chat log

## 2026-10-20 — first build (builder agent from the manager chat)
- **Asked:** build 7 Wonders per the common + phase-2 game briefs: exact base game (1st/2nd edition), real-table score calculator, odds and theory, measured computers, online seats, original art. Tim: "add … 7 wonders … to the list of games."
- **Decided:** 1st edition default; Lighthouse counts itself; Duel and 2-player variant skipped (docs/ideas.md); Hard = tuned weights (tools/tune.js).
- **Built:** js/cards.js, engine.js, bots.js, online-game.js, art.js, app.js, draft-data.js; index.html; tests; tools (measure-levels, tune, draft-stats, mutate, crosscheck); docs/rules-check.md, docs/ideas.md.
- **Verified:** 29 engine + 4 online node tests; mutation check (27 breaks); 6,400-game strength measurement; full games played in WebKit at 393px and laptop width; screenshots of every tab.
- **Open:** real iPhone check; Tim's view on looks and wording.
- **Design pass (same day, builder from the manager):** Tim: "review them again for design improvements especially visually". A fresh read-only reviewer ranked 13 problems from before-screenshots; fixed the hand (fills phone height, laptop clipping), the fixed-height action panel, card shading, dim style, name splits, stage strip, tap targets, Score/Odds table backgrounds. Verified: 29 engine + 4 online + 27/27 ui-check; headless measurements show the act panel at the same spot before/after a tap and never under the tab bar; a name-split check over all 158 card faces fails on the old build (Workshop, Pawnshop) and passes on the new one.
- **QA round (same day):** fresh QA agent found no blockers and 7 smaller issues (Back button, Gizah B stage box, Score inputs, corrupt saves, text player count). All fixed and re-checked headless (fixed build 27/27, old build fails 18).
