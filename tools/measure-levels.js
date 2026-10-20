// Measures computer strength: one computer of level A against (n-1) computers of level B, seats rotated,
// wonders and sides random. Prints A's win share (ties shared) and average points.
// Usage: node tools/measure-levels.js [gamesPerPairing=600] [players=3,4,5,7] [edition=1]
const E = require('../js/engine.js');
require('../js/bots.js');
const games = Number(process.argv[2]) || 600;
const counts = (process.argv[3] || '3,4,5,7').split(',').map(Number);
const ed = Number(process.argv[4]) || 1;
const pairs = [['hard', 'easy'], ['hard', 'medium'], ['medium', 'easy'], ['easy', 'easy']];
const out = {};
for (const [a, b] of pairs) {
  for (const n of counts) {
    let win = 0, ptsA = 0, ptsB = 0;
    for (let k = 0; k < games; k++) {
      const seat = k % n;
      const bots = Array.from({ length: n }, (_, i) => (i === seat ? a : b));
      const st = E.newGame({ ed, n, bots, seed: 7919 * k + 31 * n + (a + b).length * 101 + 13, sides: 'random' });
      const w = st.result.winners;
      if (w.indexOf(seat) >= 0) win += 1 / w.length;
      ptsA += st.result.scores[seat].total;
      st.result.scores.forEach((s, i) => { if (i !== seat) ptsB += s.total / (n - 1); });
    }
    const key = a + ' vs ' + b + ' (' + n + 'p)';
    out[key] = { win: +(win / games).toFixed(3), fair: +(1 / n).toFixed(3), ptsA: +(ptsA / games).toFixed(1), ptsB: +(ptsB / games).toFixed(1) };
    console.log(key.padEnd(24), 'wins', (100 * win / games).toFixed(1) + '%', '(fair ' + (100 / n).toFixed(1) + '%)', 'avg pts', (ptsA / games).toFixed(1), 'vs', (ptsB / games).toFixed(1));
  }
}
if (process.argv[5] === '--json') console.log(JSON.stringify(out));
