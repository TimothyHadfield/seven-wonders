# 7 Wonders Lab — chat log

## 2026-10-20 — first build (builder agent from the manager chat)
- **Asked:** build 7 Wonders per the common + phase-2 game briefs: exact base game (1st/2nd edition), real-table score calculator, odds and theory, measured computers, online seats, original art. Tim: "add … 7 wonders … to the list of games."
- **Decided:** 1st edition default; Lighthouse counts itself; Duel and 2-player variant skipped (docs/ideas.md); Hard = tuned weights (tools/tune.js).
- **Built:** js/cards.js, engine.js, bots.js, online-game.js, art.js, app.js, draft-data.js; index.html; tests; tools (measure-levels, tune, draft-stats, mutate, crosscheck); docs/rules-check.md, docs/ideas.md.
- **Verified:** 29 engine + 4 online node tests; mutation check (27 breaks); 6,400-game strength measurement; full games played in WebKit at 393px and laptop width; screenshots of every tab.
- **Open:** real iPhone check; Tim's view on looks and wording.
