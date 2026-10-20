# 7 Wonders Lab — progress

## START HERE
Read order: this file → CLAUDE.md → docs/rules-check.md → docs/ideas.md → chat.md.
Last updated: 2026-10-20 (first build: engine, computers, UI, online, rules check, ideas).
Live: https://timothyhadfield.github.io/seven-wonders/ · Repo: https://github.com/TimothyHadfield/seven-wonders

## Goal right now
7 Wonders base game (1st edition default, 2nd in Settings), 3–7 players vs computers or online friends, with odds at each pick, a real-table score calculator, theory tables and a Study tab. First build done; waiting on Tim's feedback.

## Status
| Part | State |
|---|---|
| Engine: every card with player-count marks, chains, guilds, 14 wonder sides per edition, trading, military, science with wildcards | Done. 29 engine tests; 27 deliberate breaks all caught (`tools/mutate.js`). |
| Card data cross-check | Done: docs/rules-check.md (8 sources, 11 differences resolved). |
| Computers Easy / Medium / Hard | Done, measured (below). |
| Play tab: neighbours with prices, wonder, city, hand, Build/Stage/Sell with payment choice, odds line, hint | Done. |
| Score tab (real-table calculator) | Done. |
| Odds tab: Cards / Draft / Science / Military / Hands | Done. Draft table from 300 Hard games per player count. |
| Study tab: points lost vs Hard per pick | Done. |
| Online rooms (shared `_online` module) | Done; node tests with createLocal. Two-browser test: see NOT verified / QA line. |

**Measured strength** (`node tools/measure-levels.js 400 3,4,5,7 1 --json`, 2026-10-20, 1st edition, 400 games per cell; one stronger player in a field of weaker ones; win share at 3/4/5/7 players):
- Hard in a Medium field: 78 / 67 / 58 / 40% (fair share 33 / 25 / 20 / 14%)
- Medium in an Easy field: 76 / 68 / 58 / 46%
- Hard in an Easy field: 91 / 92 / 81 / 74%
- Average points: Hard ~55, Medium ~50, Easy ~38.
- Hard = Medium's value function with tuned weights and no noise (`tools/tune.js`, +10.1 points vs Medium on 2,400 fresh games). Medium = same function, untuned weights, noise 0.9. Easy = a random card it can afford (sometimes a random wonder stage), sells only when nothing fits.

## Standing instructions (Tim's words)
- "add risk, clue, battleship, connect four, stratego, clue, checkers, pandemic, splendor, king of tokyo, 7 wonders, and evolution to the list of games."
- Common brief: exact rules and card counts, original art only, $0, phone-first with a real laptop layout, no page scroll on main screens, bottom tabs on phone, "?" explains why, choices in Settings, odds at the point of decision, measured computers behind "How strong?".

## Traps
- `js/online.js` is a COPY of `../_online/online.js`. Never edit it here.
- After changing `js/bots.js`: rerun measure-levels and update `STRENGTH_NOTE` in `js/app.js`; rerun draft-stats.
- `tools/mutate.js` and `tools/tune.js` use every CPU core; browser tests run at the same time get click timeouts. Run them apart.
- Card names are hyphenated by hand (`softName` in `js/art.js`), because Playwright's WebKit on Windows doesn't hyphenate.
- Local test servers used port 47391 (8765/8791 were taken by other agents).

## Decisions
- 1st edition is the default (the most common copy); 2nd edition is a setting.
- Wonder sides default "Rulebook": 1st ed. random side, 2nd ed. choose.
- Lighthouse counts itself (see rules-check).
- Seat i's left neighbour is i+1; Ages I and III pass left.
- 2-player variant and 7 Wonders Duel not built (see docs/ideas.md).

## NOT verified
- A real iPhone (only Safari's engine at 393px via phone-view).
- Online with 3+ humans at once.
- 2nd-edition rules are checked against app data and rulespal, not an official 2nd-edition PDF.

## Rejected / parked
- ~~7 Wonders Duel~~: a different game; parked for its own build.
- ~~2-player Free City~~: rarely played.
