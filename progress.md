# 7 Wonders Lab — progress

## START HERE
Read order: this file → CLAUDE.md → docs/rules-check.md → docs/ideas.md → chat.md.
Last updated: 2026-10-20 (first build, QA round, visual design pass, sounds + effects, the real-table look, then the edge pass).
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
| Sounds, celebrations, animations (2026-10-20) | Done. `js/fx.js` = byte copy of `../_fx/fx.js` (never edit); game events in `js/sfx.js` (a diff of the last view vs the new one, so local and online sound the same); Settings tab has a "Sound & effects" panel (fx.js rows restyled to the game's own switch/seg look via `#fx-panel` CSS). Tests: `node tests/fx.test.mjs` (13, scripted 3-player game) and `node tools/fx-check.mjs <url>` (WebKit, fake audio, plays a whole game by tapping). Both seen failing on the old build. |
| Real-table look (2026-10-20) | Done. Wood table; your seat at the bottom: built cards in overlapped colour columns, coin pile + shield, your wonder board with stage boxes (a built stage shows the tucked card edge), hand as a fan of 65:100 cards (banner, cost strip, picture, name scroll; original SVG art) dealt from the age deck with a flip. Neighbours left/right with board, columns, card backs fanned and trade prices; other seats small across the top; centre = next age decks (thinning stacks) + face-down discard pile. Laptop: Log/Cities side panel. Research in session scratchpad `table/seven-wonders/real.md`, before/after shots beside it. Kit: `css/table.css` + `js/table.js` = byte copies of `../_table/` (never edit). |
| Edge pass (2026-10-20, "weird situations") | Done. 42 scenarios (list + evidence in session scratchpad `edge/seven-wonders/scenarios.md`), regression check `node tools/edge-check.mjs <local url>` (states from `tools/edge-states.js`). Fixed: coin tie-break place on end/Study screens, Olympia free build on any card, second tab overwriting the newer save, setup scrolling in phone landscape / 200% zoom, 7 players at 320 px (far boards overflowed, hand covered your board), neighbour price hidden by many resources or 3-digit coins, online double-tap recording a pick twice. Step-0 reviewer ran: oblong conflict tokens, bare-wood empty discard. |

## Edge pass scenario summary (2026-10-20)
| Family | Tested | Failed before | Fixed |
|---|---|---|---|
| Rare rules (ties, Olympia, Babylon 7th, Halikarnassos, side choice, last pick, 3 and 7 players) | 14 | 3 | 3 |
| Odd people (long/emoji names, offline online, two tabs) | 4 | 1 | 1 |
| Odd taps (double taps, rapid taps, Back, Settings mid-turn, dialogs, animations off) | 9 | 1 (reasoned) | 1 |
| Odd devices (6 sizes × 13 screens, reload, storage blocked) | 11 | 4 | 4 |
| Odd screens (30-card city, long log, end screens, confirm over sheet) | 4 | 0 | – |

**Event → sound map** (computers' reveals at 45% volume, panned by seat; times wait for your card's 320 ms flight):
| Event | Sound | Animation |
|---|---|---|
| New game / new age dealt | `shuffle`, then `cardDeal` ×7 (one per card) | hand deals in after the shuffle; "Age II/III" floats over the hand |
| Tap a card | `cardFlip` (quiet) | existing lift |
| Build a card | `stamp` | card flies hand → your city; new city chip pops when it lands |
| Wonder stage | `stage` (custom: stone thud + chime) | card flies to the stage box; `celebrate big` sparkle on it (yours); neighbour panel pops (theirs) |
| Sell | `coins` | card flies to your coin chip and fades; "+3" float, coin count-up |
| Trade (you pay / a neighbour pays you) | `coin`, panned to that side | "+N/−N" float on your coins and the neighbour's panel |
| Hands passed | `whoosh` panned: Ages I/III from the right, Age II from the left | hand slides in from that side |
| End of age military | `clash` (custom: two sword rings) | shield chip pulses; per token `place` + "+1/3/5" float, or `hit` + shake + "−1" |
| Your turn | `turn` chime only online after waiting for others, or for your free discard build | action panel pulses |
| Error (illegal move / server refused) | `error` | — |
| Game over | `tick` per score row as it counts up from 0 | then `celebrate win` (your seat colour + gold confetti) or `lose` |
| Buttons | fx.js auto `tap` | — |
Animations off: body class `fx-noanim` stops the CSS deal/pop/sheet animations too; Fast: `fx-fast` + 0.55× timeline.

**Measured strength** (`node tools/measure-levels.js 400 3,4,5,7 1 --json`, 2026-10-20, 1st edition, 400 games per cell; one stronger player in a field of weaker ones; win share at 3/4/5/7 players):
- Hard in a Medium field: 78 / 67 / 58 / 40% (fair share 33 / 25 / 20 / 14%)
- Medium in an Easy field: 76 / 68 / 58 / 46%
- Hard in an Easy field: 91 / 92 / 81 / 74%
- Average points: Hard ~55, Medium ~50, Easy ~38.
- Hard = Medium's value function with tuned weights and no noise (`tools/tune.js`, +10.1 points vs Medium on 2,400 fresh games). Medium = same function, untuned weights, noise 0.9. Easy = a random card it can afford (sometimes a random wonder stage), sells only when nothing fits.

## Standing instructions (Tim's words)
- "add risk, clue, battleship, connect four, stratego, clue, checkers, pandemic, splendor, king of tokyo, 7 wonders, and evolution to the list of games."
- "add opptional sounds you can add to the games that reflect what's happening in the game accurately as well as win celebrations, and other fun annimations to go along with everything. Just make sure everything is customizable in the settings so the user can play as preffered." (2026-10-20)
- "could you also make sure that each of the games also have a look to them so that the game (either board or card layout) looks almost identical to how the board or card layout looks like in real life, so it's easy to understand if you've already played it before, and also so it feels more like you're actually playing in real life rather than you're playing it online. Even things like how youre cards or other things are laid out infront of you, make it look like they are actual cards laid out similar to how it looks like in real life. Make the decks look like actual decks. Make the board have the same design as it does in real life with the same layouts. It should look kind of like you're looking through a camera that is connected to a user's glasses that is playing in real life (not actually, but the layout and style of everything should be similar)." (2026-10-20)
- "I've noticed the games often have good user interfaces but could be improved especially when a scenario happens that the game might've not really thought about or whatnot. Could you focus on making each game perfect especially in scenarios that the game doesn't expect or are a little weird." (2026-10-20)
- Common brief: exact rules and card counts, original art only, $0, phone-first with a real laptop layout, no page scroll on main screens, bottom tabs on phone, "?" explains why, choices in Settings, odds at the point of decision, measured computers behind "How strong?".

## Traps
- `js/online.js` is a COPY of `../_online/online.js`. Never edit it here.
- After changing `js/bots.js`: rerun measure-levels and update `STRENGTH_NOTE` in `js/app.js`; rerun draft-stats.
- `tools/mutate.js` and `tools/tune.js` use every CPU core; browser tests run at the same time get click timeouts. Run them apart.
- Card names are hyphenated by hand (`softName` in `js/art.js`), because Playwright's WebKit on Windows doesn't hyphenate.
- Phone game grid: the hand row is `minmax(0,1fr)` and `.act` has a fixed height (180 px). Don't make `.act` 1fr again (it made the act panel mostly empty), and don't give the hand a fixed min-height (in Age III it pushed Build/Stage/Sell under the tab bar).
- Card names: a name with any word of 8+ letters gets the small `.long` type (art.js `face`), because `.nm` no longer breaks words anywhere.
- `js/fx.js` is a COPY of `../_fx/fx.js`. Never edit it; custom sounds go in `js/sfx.js` via `FX.define`.
- fx.js's own switch CSS is green and loads after the page CSS; `#fx-panel` rules in index.html put the game's blue switch back. Keep them.
- Port 47613 was taken by another agent's server (served Clue) on 10-20; fx work used 58194.
- `css/table.css`, `js/table.js` are COPIES of `../_table/`. Never edit them.
- Hand fan (`layoutHand` in app.js): lay out under `.tbl-instant`, force a reflow, then lift the picked card in a rAF, else freshly rendered cards slide in from x=0 and look stacked.
- Seats use `data-nb="L|R"`, never `data-side` (that attribute is the wonder side picker; a clash made seat taps send a side move).
- Name chips are `.mcn/.citynames`; `.mc` is a built-card banner in the colour columns.
- Local test servers used port 47391 (8765/8791 were taken by other agents); the edge pass used 52317/52318.
- `ui.pay` is a number (payment option) or `'oly'` (Olympia free build); read it through `pi` / `olyChoice`, never `Math.min(ui.pay, …)` directly.
- A second tab is kept in step by the `storage` event (app.js `load()`); keep `load` the only parser of the save.

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
- Sounds heard by a human: tests run with a fake AudioContext (WebKit on Windows has no Web Audio), so loudness/feel of `clash` and `stage` is unheard. Online sounds checked in node (plan) only, not with two browsers.
- Storage blocked with fx: reasoned (fx.js wraps every storage call), not measured here.
- Table look reviewer (ran in the edge pass) also asked for: brown/grey cards tucked under the board's left edge, a taller 2.6:1 board, no live points bubble, no dark seat panels / app chrome, one picture per resource. Not done: Tim's call (looks/layout) or no room at 393 px.
- Page left in the background for 10 minutes; online with the network dropping mid-game (only "offline before Create" was tested).
- On iPhone SE-height screens (≤600 px tall) far seats hide their boards and neighbours their last-move line, to keep the hand clear of your board.
- 2nd-edition rules are checked against app data and rulespal, not an official 2nd-edition PDF.

## Rejected / parked
- ~~7 Wonders Duel~~: a different game; parked for its own build.
- ~~2-player Free City~~: rarely played.
