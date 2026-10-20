# 7 Wonders Lab — project rules

Static site (GitHub Pages, repo `TimothyHadfield/seven-wonders`, live https://timothyhadfield.github.io/seven-wonders/).
7 Wonders base game (1st edition default, 2nd edition in Settings), 3–7 players vs measured computers,
odds at each pick, a real-table score calculator, theory tables, a Study tab, and online rooms through the
shared module in `../_online/`. Read `progress.md` first.

- **No build step.** Plain UMD scripts in `js/` shared by the browser and node tests. Bump `?v=N` on the
  script tags in `index.html` when a JS file changes after a deploy.
- **Engine contract** (`js/engine.js`): `newGame(opts)`, `apply(st, seat, move)` returns a new state and throws
  on illegal moves, `view(st, seat)` hides other hands, the decks and the discard pile. Picks are simultaneous;
  computers chosen before the start answer inside the engine. `js/online-game.js` adapts this to the shared
  online `game` interface; keep it that way.
- **Card data** (`js/cards.js`) is checked against several sources: see `docs/rules-check.md`. Change a card only
  with two agreeing sources, and keep the count tests passing.
- **`js/online.js` is a copy** of `../_online/online.js`. Never edit it here; recopy when the shared one changes.
- **Card text is our own words. Art is our own SVG** (`js/art.js`). No rulebook text, no publisher art.
- Tests: `node tests/engine.test.js` (29, ~50 s), `node tests/online.test.mjs` (4), `node tests/fx.test.mjs` (13; sounds/effects),
  plus headless `node tools/fx-check.mjs <local url>` and `node tools/ui-check.mjs <local url>`.
- **`js/fx.js` is a copy** of `../_fx/fx.js` (sounds/effects library). Never edit it; game events live in `js/sfx.js`.
  `node tools/mutate.js` (~25 min) proves each test can fail.
- Strength: `node tools/measure-levels.js 400 3,4,5,7 1 --json` (~10 min); put the numbers in `STRENGTH_NOTE`
  in `js/app.js`. Hard's weights come from `node tools/tune.js`. Draft table: `node tools/draft-stats.js 300`
  rewrites `js/draft-data.js`.
- Tim's global rules apply: $0, no permission prompts, explicit `git add` paths, nothing inside `.claude` folders.
