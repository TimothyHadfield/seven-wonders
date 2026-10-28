# Rules check: 7 Wonders (base game)

Every rule and number the engine uses, where it comes from, and the test that pins it.
**Default: 1st edition (2010).** 2nd edition (2020) is a setting. Checked 2026-10-20.

## Sources

| Key | Source | Used for |
|---|---|---|
| **RB** | Official 1st-edition English rulebook (Repos Production), PDF from world-of-board-games.com.sg/docs/7-Wonders.pdf, read as text | every rule below marked RB |
| **QR** | Official quick rules sheet (US), cadl.org PDF | turn order, end scoring |
| **J** | github.com/joffrey-bion/seven-wonders `sw-engine/.../data/cards.json`, `wonders.json`, `global_rules.json` | 1st-ed card data, wonder boards, counts |
| **Z** | github.com/zackgomez/7wonders `cards.js` | 1st-ed card data (second opinion) |
| **Br** | github.com/brdgme/brdgme `rust/game/seven-wonders-1/src/card.rs` | 1st-ed costs (third opinion) |
| **I** | github.com/IceboxDev/BoardGames `packages/core/src/games/7-wonders/` (`cards.ts`, `wonders.ts`, `rules.ts`) | 2nd-ed card data, wonders |
| **T** | github.com/thascoet/7Wonders `back_end/data/cards.ts`, `wonders.ts` | 2nd-ed costs, chains, wonders (second opinion) |
| **RP** | rulespal.com/7-wonders-second-edition/rulebook | 2nd-ed card list, player counts, chains |

`tools/crosscheck.mjs <folder with the downloaded files>` re-runs the card and wonder comparison.
Last run: every 1st-ed card matches J; costs match Br; 11 differences found and resolved (below).
Every 2nd-ed card matches I; 2nd-ed wonders match I and T.

## Components and set-up

| Rule / number | Engine | Source | Test |
|---|---|---|---|
| 3 to 7 players | `newGame` clamps n | RB | deck sizes |
| Each player starts with 3 coins | `coins: 3` | RB, QR | "everyone starts with 3 coins" |
| Each age deals 7 cards to each player (deck = 7 × players) | `Cards.ageDeck`, `deal` | RB, J | "deck sizes" |
| Player-count marks on each card (a card is in the deck if players ≥ its mark; several marks = several copies) | card rows `[3,4]` etc. | RB, J, Z | "player-count markers" |
| Age III: players + 2 guilds, drawn at random from the 10 | `newGame` | RB ("3 players: 5 guilds" …) | "Age III guilds dealt = players + 2" |
| 1st ed.: 49 + 49 + 40 cards + 10 guilds = 148 at 7 players | data | RB component list, J | "148 cards in the box" |
| Wonder side: 1st ed. the side comes from the random wonder card; boards may be chosen if all agree; side A is suggested for a first game | `sides:'random'` default for ed. 1 | RB | — (setting) |
| 2nd ed.: everyone chooses a side | `sides:'choose'` default for ed. 2 | RP | — (setting) |

## A turn

| Rule | Engine | Source | Test |
|---|---|---|---|
| Everyone chooses one card at the same time, then all are revealed and resolved together | `pick` phase, `resolve(picks)` | RB, QR | Vineyard test |
| Three actions: build the card, build the next wonder stage with it (card hidden under the board), or discard it for 3 coins | `check` | RB | "illegal moves", military test (all sell) |
| You can't build a second card with the same name | `buildCost` | RB | "same name; chains are free" |
| Chains: a card naming an earlier card is free if you own that card | `c.from` | RB, J | same test |
| Coin costs go to the bank | `coin` in `buildCost`/`resolve` | RB | "a card with a coin cost" |
| Trading: 2 coins per resource to the neighbour who makes it; trading posts / Marketplace / Olympia B make it 1 | `prices`, `payOptions` | RB | trading tests, brute force |
| You may buy only what a neighbour's **brown and grey cards and wonder board** produce; not yellow-card or wonder-stage production | `slots(own=false)` | RB "Clarifications" | "cannot buy from a neighbour's yellow card" |
| Bought resources are for this turn only; the neighbour can't refuse; buying doesn't use up their production | `payOptions` per call | RB | brute force |
| You must have the coins at the start of the turn; coins earned this turn (trade, sales) can't be spent this turn | pay step before income step | RB example C | "payments use coins held at the start of the turn" |
| Coin effects of cards are counted after everyone's cards are placed (a neighbour's same-turn brown card counts for Vineyard) | step 3 of `resolve` | RB card clarifications (Vineyard / Bazar count the cards in play) | "same-turn: Vineyard" |
| Trading-post discounts start the turn after they are built | pay step uses cities before this turn's cards | RB | (follows from the order) |
| Hands pass left in Ages I and III, right in Age II | `passHands` | RB, QR | "hands pass left…" |
| Turn 6: the last card is discarded (not sold) | `finishAge` | RB "special case: sixth turn" | deck-size test counts all cards |

## Wonders (1st ed.)

| Rule | Engine | Source | Test |
|---|---|---|---|
| Stage costs and effects for all 14 sides | `WONDERS1` | RB board descriptions, J | "wonder stages" |
| Halikarnassos: at the end of the turn the stage is built, look through the discard pile and build one card free (cards discarded this turn included; on turn 6 the discarded last cards are included) | `afterTurn`, `finishAge`, `discardChoices` | RB wonder notes | "Halikarnassos…" |
| Babylon B stage 2: play the 7th card of each age instead of discarding it (build, stage or sell) | `seventh` phase | RB | "Babylon B plays its 7th card" |
| Olympia A stage 2: once per age, build a card **of your choice** for free (RB: "a building of his or her choice"), so also a card you could pay for. The Play screen offers "Free (wonder)" as a payment choice then (fixed 2026-10-20; it was only offered on cards you couldn't afford) | `olyReady`, `olyAge`; app `olyChoice` | RB | "Olympia A … once per age"; edge-check "Olympia free build" |
| Olympia B stage 1: raw materials from both neighbours cost 1 | `tradeRaw` | RB | (prices test pattern) |
| Olympia B stage 3: copy one guild from a neighbour at the end (chosen at scoring, best one taken) | `scoreOne` copy | RB | "Olympia B copies the best neighbour guild" |
| Rhodos: shields on the board count in conflicts | `shields` | RB | military test |

## Military and the end

| Rule | Engine | Source | Test |
|---|---|---|---|
| End of each age: compare shields with each neighbour; win = +1 / +3 / +5 (Age I / II / III), loss = −1, tie = nothing | `endAge` | RB, QR | "military" |
| 1 point per 3 coins (leftover coins score nothing) | `scoreOne` | RB | "end: 1 point per 3 coins" |
| Science: each symbol type scores its count squared, plus 7 per set of three different symbols | `sciScore` | RB | "science: sets of 3" |
| "Any symbol" cards (Scientists Guild, Babylon) are chosen at the end for the best score | `sciBest` | RB | "science wildcards", brute force |
| Arena, Haven, Lighthouse, Chamber of Commerce: coins once when built, points at the end | `coinsFrom`, `scoreOne` | RB card list | "Lighthouse and Haven" |
| Winner: most points; tie → most coins; still tied → shared. Places on the end and Study screens use the same order (fixed 2026-10-20: a points tie lost on coins said "place 1") | `scoreAll`; app `placeOf` | RB | "ties broken by coins, then shared"; edge-check "tie lost on coins" |

## Choices where the sources disagree or are silent

- **Lighthouse counts itself.** RB says it counts yellow cards "previously played"; the 2nd-edition rules and most apps count the Lighthouse itself. We count it (1 more coin and point). Test pins 3 coins with Haven + Tavern + Lighthouse.
- **Seventh card and Halikarnassos on turn 6.** RB: Babylon B plays the 7th card, then the leftover cards are discarded, then Halikarnassos (if it built its stage on turn 6) chooses, so it can take a 7th card just discarded. Engine order: resolve turn 6 → Babylon's 7th → discard leftovers → Halikarnassos → military.
- **Several Halikarnassos builds in one turn** can't happen (one Halikarnassos per game).
- **2nd-ed. Olympia B "first/last card of each age free"**: applied on turn 1 and turn 6 of the pick phase (not the 7th card).
- **2nd-ed. chains Walls→Fortifications and Training Ground→Circus**: in I and RP, missing in T. Kept.

## Cross-check differences (all resolved)

| # | Difference | Resolution |
|---|---|---|
| 1 | Spies Guild cost: ours CCG vs J/Br CCCG | fixed to CCCG (two sources + rulebook card list) |
| 2–3 | Observatory, Study costs in Z | Z is wrong; J and Br agree with ours |
| 4–7 | Z is missing four Age III yellow cards | Z incomplete; J has them |
| 8 | T calls Mine "CAVE" | name only |
| 9–10 | T lacks two 2nd-ed chains | kept (I and RP have them) |
| 11 | T gives 2nd-ed Olympia A stage 3 0 points | T bug; I and RP give 7 |

## Variants

| Variant | Status |
|---|---|
| 1st edition (default) / 2nd edition | both playable, Settings → Edition |
| Wonder sides: rulebook default / random / choose / all A / all B | Settings → Wonder sides |
| Your wonder (pick one, the others random) | Settings → Your wonder (Daily and guided game ignore it) |
| Leaders expansion (1st-edition rules) | Settings → Leaders expansion, off by default; see "Leaders" below |
| 2-player Free City (RB) | **not built** (the site plays 3–7) |
| 7 Wonders Duel | **not built**: a different game (pyramid card layout, science and military victories); left for later |

## Leaders (2026-10-28)

Rules: the official 1st-edition Leaders rulebook PDF (Repos Production), rules + FAQ read page by page.
6 starting coins; 4 leaders each; draft = keep one, pass the rest to the RIGHT (receive from your left), three
times, the last card handed to you is the 4th; at the start of each age everyone plays one kept leader at once
(recruit: its coins to the bank / build the next wonder stage with it: pay the stage / sell: 3 coins, back to the box);
before Age III the leftover kept leader goes back to the box. FAQ points kept: Halikarnassos chooses before Solomon;
Tomyris has no effect on battles before she was recruited; Nero, Xenophon, Vitruvius count only from then on;
Hatshepsut gives 1 coin per neighbour per turn you buy from them.

Costs: 4 independent card lists — karlaugustnybo (leaders.rs), godaup (leaders.json), mattiacci 7wjs (misc.js),
boarder-portal (leaders.ts). They agree on all 36 costs except **Plato: 3 (karl, godaup) vs 4 (mattiacci,
boarder, and the 2nd edition)** → 4 chosen. Effect wording on the cards is our own (js/leaders.js).

Not built: the Rome wonder and the 4 Leaders guilds (Gamers', Courtesan's, Diplomat's, Architect's); the
Leaders 2nd-edition rules. The Daily and the guided game always use the base game.
Tests: `node tests/leaders.test.js` (34; all fail on the build before the module). The base game is proved
unchanged by `node tools/fingerprint.js` (210 computer games hashed: `f42aa43d…` before and after).

## What the tests prove

`node tests/engine.test.js` (29 tests) and `node tests/online.test.mjs` (4). `node tools/mutate.js` breaks
the engine 27 different ways (one rule each) and confirms each break makes at least one test fail, and every
test fails for at least one break.
