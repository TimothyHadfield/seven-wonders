# 7 Wonders Lab — progress

## START HERE
Read order: this file → CLAUDE.md → docs/rules-check.md → docs/ideas.md → chat.md.
Last updated: 2026-10-20 (first build, QA round, then a visual design pass).
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
| Online rooms (shared `_online` module, online.js from `_online` 0b193d8) | Done; node tests with createLocal; two-browser test by the QA agent. |
| QA pass (2026-10-20, fresh agent, evidence in the session scratchpad sw-qa/) | No blockers. 7 findings fixed: Back mid-game/sheet/lobby, Gizah B stage box overflow, Score clamps/caps and box = count, corrupt saved sections reset one at a time, text player count. Re-checked by a 27-check headless script that fails 18/26 on the old build and passes 27/27 on the fix. |
| Visual design pass (2026-10-20, Tim: "review them again for design improvements especially visually") | Done. Phone: hand cards fill the spare height (178 px tall in Age I, ~124 in Age III, were 134), action panel fixed at 180 px so picking a card moves nothing, Build/Stage/Sell pinned at its bottom. Laptop: all 7 cards fit (were clipped at both edges), 88×156 cards, action panel no longer a big empty box. Card faces shaded; unaffordable cards greyed by filter, not opacity; no mid-word name splits ("Worksho-p"). Bigger stage strip, emblem and top buttons; Score/Odds sticky cells match their panel; Score table sized to content on laptop. Screenshots before/after in the session scratchpad `design/seven-wonders/`. |

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
- Phone game grid: the hand row is `minmax(0,1fr)` and `.act` has a fixed height (180 px). Don't make `.act` 1fr again (it made the act panel mostly empty), and don't give the hand a fixed min-height (in Age III it pushed Build/Stage/Sell under the tab bar).
- Card names: a name with any word of 8+ letters gets the small `.long` type (art.js `face`), because `.nm` no longer breaks words anywhere.
- Local test servers used port 47391 (8765/8791 were taken by other agents).

## Decisions
- 1st edition is the default (the most common copy); 2nd edition is a setting.
- Wonder sides default "Rulebook": 1st ed. random side, 2nd ed. choose.
- Lighthouse counts itself (see rules-check).
- Seat i's left neighbour is i+1; Ages I and III pass left.
- 2-player variant and 7 Wonders Duel not built (see docs/ideas.md).
- History: entries carry `g: 'game'|'lobby'` and `sheet: 1`; Back closes a sheet, leaves the lobby for setup, and never leaves the site mid-game (it re-pushes a guard entry).
- Score calculator limits: military -6..18, coins 0..199, wonder 0..40, other points 0..99, each science symbol 0..20, any-symbol 0..3. The box always shows the counted number.
- Stage boxes are sized in proportion to what they show (cost length + effect).

## NOT verified
- A real iPhone (only Safari's engine at 393px via phone-view).
- Online with 3+ humans at once.
- Design pass on a small iPhone (SE, 375 px wide, shorter screen): only 393×659 and laptop widths were measured.
- Top-bar icon buttons are 36×38 on phone (40 would overflow the status row with 2-digit coins and points).
- 2nd-edition rules are checked against app data and rulespal, not an official 2nd-edition PDF.

## Rejected / parked
- ~~7 Wonders Duel~~: a different game; parked for its own build.
- ~~2-player Free City~~: rarely played.
