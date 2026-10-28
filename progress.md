# 7 Wonders Lab — progress

## START HERE
Read order: this file → CLAUDE.md → docs/rules-check.md → docs/ideas.md → chat.md.
Last updated: 2026-10-28 (wave 3: Leaders expansion, choose your wonder, Videos; on top of: improvement pass, first build, QA round, design pass, sounds, real-table look, edge pass, visibility pass).
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
| Visibility pass (2026-10-21 → 10-27, "the view of what's happening … very clear") | Done. Phone 393: hand cards 67→80 px, names 7.4→9 px, every overlapped card's name wraps inside its visible strip (no "Observa…"), far seats are name plates with stage pips (row 65→44 px), neighbour price chip shows both prices (raw 1¢ / glass-loom-press 2¢). 320: own colour stacks no longer run under the coin pile. Landscape phone: hand 42→91 px, no longer covers your board. Laptop: neighbours either side of your board with readable built cards (icons 11 px), stage icons 9→16–22 px, hand 124→~180 px, Log/Cities side panel only ≥1360 px. Picked-card panel: no squashed half-lines (odds line gives way to the payment choice). Check: `node tools/vis-check.mjs <local url>` (246 checks, WebKit; `ENGINE=chrome` too) — fails 80 on the old build. Shots: manager scratchpad `vis/seven-wonders/before|after/`. |
| Improvement pass (2026-10-27, manager brief: "the best version online on every metric", rivals in `../competitor-analysis/board-engine.md`) | Done. **Laptop**: decks moved to a slim column beside your city, no empty middle band; your and the neighbours' built cards fill the height with names + pictures (5-col grid with side panel ≥1360). **Art**: one original picture per card (`pic()` in art.js), paper grain, light behind pictures. **Kits** copied unchanged: `_profile` 1.1.0 (My stats, local Elo, 10 awards, Daily = same deal for everyone vs 3 Hard), `_coach` (Rules sheet + 11-step guided game vs two Easy computers, never counted), `_pwa` 1.2.0 (installable, offline, new-build pill), `_fx` re-copied. **Undo** (6 deep) vs computers, not in Daily/guided. **Study replay** turn by turn (rebuilt from seed + your actions). **Age-end battle banner**. Checks: pwa-check 18/18 (3/18 on the old build), tests/study.test.js 5, fx test 14 (new battle test fails on old sfx.js), vis 246/246, edge 124, ui 27. |
| Wave 3 (2026-10-28) | Done. **Leaders expansion** (Settings switch, off by default): 36 leaders (`js/leaders.js`, costs from 4 card lists, see rules-check "Leaders"), draft + recruit/stage/sell each age, every effect in the engine, computers draft and recruit at all levels, online rooms pass it, Study replay rebuilds it (20/20 games identical), Score tab gets a Leaders row, recruited leaders form a white column in the city, original portrait art (`portrait()` in art.js). **Your wonder** select in Settings (others stay random). **Videos** section in Rules (5 links, oEmbed-checked). Laptop: dashed "Your city" note fills the empty Age I area; far seats show the wonder name. Tests: tests/leaders.test.js 34 (0/34 on the old build), `tools/fingerprint.js` proves the base game unchanged. Ladder with leaders (`node tools/ladder.js 400 3,4 hard:medium,medium:easy,hard:easy 1 1`): Hard among Mediums 67/61% at 3/4p, Medium among Easys 80/77%, Hard among Easys 96/94%. |
| Strength ladder (2026-10-27, `node tools/ladder.js 400 3,4`) | Hard among Mediums wins 74%/62% at 3/4p (fair 33/25), ahead of 82% of them; Medium among Easys 78%/63%; Hard among Easys 95%/87%. Ratings in swprofile.js: Easy 1200, Medium 1480, Hard 1750. Hard has no tie-break noise on purpose (noise 0.25 / 0.1 cost 5–7 points of win share; deals are random anyway). |

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
- "for a lot of the games the cards or board layout is too small to easily see what's going on. Some games just need small design imporvements like filling the screen with the board view and fitting the cards and other things in the empty space ... Fix this so the view of what's happening and where everything is is very clear. Consider parts of the board that are dense in what's happening and if the user can reasonably see it." (2026-10-21)
- Common brief: exact rules and card counts, original art only, $0, phone-first with a real laptop layout, no page scroll on main screens, bottom tabs on phone, "?" explains why, choices in Settings, odds at the point of decision, measured computers behind "How strong?".

## Traps
- **Kits 2026-10-28 (sweep):** game-coach 1.2.0 (offer `place:'auto', avoid:['[data-start]']`; index.html sets `--coach-offer-top: 4px` on short landscape so the top spot clears Deal at 659×393) + game-pwa 1.4.0 (data-version 13).
- **Kits re-copied 2026-10-27 (kitfix):** game-coach 1.1.0 (rules tabs wrap; a note beside a tall target keeps title + 2 lines + buttons) and game-pwa 1.3.0 (`data-extra`). Copies stay byte-identical to `../_coach` / `../_pwa`.
- `js/online.js` is a COPY of `../_online/online.js`. Never edit it here. **Cache stamp (2026-10-27):** `js/app.js` imports `js/online.js?v=a3d0418b`, the `_online` content stamp. After a re-copy: put the new stamp from `node ../_online/tools/stamp.mjs` there, bump app.js's `?v=` (and pwa.js `data-version`), then `node ../_online/tools/stamp.mjs --check .` must say OK.
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
- Hand names: `layoutHand` sets `--nmr` (the hidden width of each overlapped card) so `.nm` wraps inside the visible strip; keep it if the fan step changes. There is no resize handler: the hand is sized only on render.
- Phone far seats hide their wonder board (pips instead); a neighbour with two trade prices hides its last-move line, never its colour stacks.
- vis-check in Chrome: the local python server sometimes stalls a script request (game never draws / "reading 'init'"); the check reloads once. Not seen in WebKit or live.
- `ui.pay` is a number (payment option) or `'oly'` (Olympia free build); read it through `pi` / `olyChoice`, never `Math.min(ui.pay, …)` directly.
- A second tab is kept in step by the `storage` event (app.js `load()`); keep `load` the only parser of the save.
- `js/profile.js`, `css/profile.css`, `js/coach.js`, `css/coach.css`, `js/pwa.js`, `sw.js`, `tools/pwa-check.mjs` are COPIES of the kits (`-text` in .gitattributes). Never edit them; game parts live in `js/swprofile.js` and `js/swcoach.js`.
- `js/pwa.js` must load BEFORE app.js (it creates `window.PWA` with `safeToReload: null`; loaded after, it wiped the game's hook). Bump its `data-version` with the other `?v=`.
- The guided-game offer sits over the bottom of the screen: browser check tools set `coach-offer:seven-wonders-first-game` in their init script, and app.js closes the offer whenever a game or the lobby draws.
- Replay depends on the engine being deterministic from `init` (seed) + your actions; `store.game.init/acts` must be kept in step with Undo (it trims `acts`). tests/study.test.js guards it.
- Leaders: leader ids are their names (`LD.byKey`), `E.card` falls back to them; colour `white`. Leader moves (`lkeep/lrec/lstage/lsell`) are never Study-recorded and don't trim `dec` on Undo. Log entries with `turn: 0` are a recruitment. Payments may carry `B` (Bilkis, bank coin): every place that sums a payment adds `B || 0`.
- Before engine/bot changes: `node tools/fingerprint.js` must still print `f42aa43d3380ae1bcf65ab797ac89c80ee82b66f` (or explain why the base game changed).
- Hand/mini-card names break only at the soft hyphens from `softName` (art.js `BREAK` table for compounds); never `overflow-wrap: anywhere` (it gave "Lumbe r Yard").

## Decisions
- 1st edition is the default (the most common copy); 2nd edition is a setting.
- Wonder sides default "Rulebook": 1st ed. random side, 2nd ed. choose.
- Lighthouse counts itself (see rules-check).
- Seat i's left neighbour is i+1; Ages I and III pass left.
- 2-player variant and 7 Wonders Duel not built (see docs/ideas.md).
- History: entries carry `g: 'game'|'lobby'` and `sheet: 1`; Back closes a sheet, leaves the lobby for setup, and never leaves the site mid-game (it re-pushes a guard entry).
- Score calculator limits: military -6..18, coins 0..199, wonder 0..40, other points 0..99, each science symbol 0..20, any-symbol 0..3. The box always shows the counted number.
- Stage boxes are sized in proportion to what they show (cost length + effect).
- My stats: quitting after your first pick = a loss; hint, Card values or Undo = "with help" (unrated); the guided game and online games are never counted. Daily = 4 players, 1st edition, random sides, 3 Hard computers, no Undo.
- My stats, Daily and Rules sit in one row under Play online on the setup screen (in the hero they squeezed the title at 320 px).

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
- Improvement pass: installing to the iPhone home screen and opening offline on a real phone (pwa-check runs WebKit at 393 px only); the guided game played to the end by a human (steps checked to step 1 + in node); battle banner timing felt by a human.
- Reviewer notes left as Tim's call: phone cities are colour stacks without names (tap to see). (Laptop bare wood and far-seat names done 10-28.)
- Leaders: online room with leaders between two browsers (node only); a whole Leaders game clicked through by hand (clicked through draft → recruit → Age I in WebKit only); the Score calculator tab has no Leaders row; Rome + the 4 Leaders guilds not built; bot leader values (`AVG`/`leaderValue` in bots.js) are estimates, not tuned.
- edge-check on 10-28: WebKit crashed mid-run on both this build and main (85–90 of 123 passed before the crash, no real FAIL); ui 27/27, vis 246/246, fx, pwa 18/18 passed.

## Rejected / parked
- ~~7 Wonders Duel~~: a different game; parked for its own build.
- ~~2-player Free City~~: rarely played.
- ~~Tie-break noise for Hard (anti-predictability)~~: measured −5 to −7 points of win share; every deal is shuffled, so there's nothing fixed to learn (2026-10-27).
