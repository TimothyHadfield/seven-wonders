// Fingerprint of the base game: 210 computer-only games (3-7 players, every level, both editions, every side rule)
// hashed into one number. Print it before and after an engine/bot change that must not alter the base game.
// Usage: node tools/fingerprint.js
const E = require(process.env.SW_JS ? process.env.SW_JS + '/engine.js' : '../js/engine.js');
require(process.env.SW_JS ? process.env.SW_JS + '/bots.js' : '../js/bots.js');
const crypto = require('crypto');
const h = crypto.createHash('sha1');
let k = 0;
for (const ed of [1, 2]) for (let n = 3; n <= 7; n++) for (const lv of ['easy', 'medium', 'hard']) for (const sides of ['random', 'A', 'B', 'choose', undefined, 'random', 'A']) {
  const st = E.newGame({ ed, n, bots: Array(n).fill(lv), seed: 1000 + k++, sides });
  h.update(JSON.stringify([JSON.parse(JSON.stringify(st.result), (k, v) => (k === "leaders" && v === 0 ? undefined : v)), st.players.map(p => [p.city, p.coins, p.mil, p.stages, p.side, p.wonder]), st.log]));
}
console.log(k + ' games, fingerprint ' + h.digest('hex'));
