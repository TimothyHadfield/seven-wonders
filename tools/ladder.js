// The level ladder: one computer of level A among (n-1) of level B, seats rotated, random wonders and sides.
// Prints A's win share (vs the fair share 1/n) and its pairwise share: the fraction of B players it finished
// ahead of (ties on points broken by coins, as the rules do). The pairwise share is what the Elo ratings in
// js/swprofile.js come from: difference = 400·log10(p / (1 − p)).
// Usage: node tools/ladder.js [games=400] [players=3,4] [pairs=hard:medium,medium:easy,hard:easy] [edition=1] [leaders=0]
// leaders=1 plays every game with the Leaders module on.
// A level may be "hardx" = Hard with its small tie-break noise switched off (to measure what the noise costs).
const E = require('../js/engine.js');
const B = require('../js/bots.js');
const games = Number(process.argv[2]) || 400;
const counts = (process.argv[3] || '3,4').split(',').map(Number);
const pairs = (process.argv[4] || 'hard:medium,medium:easy,hard:easy').split(',').map(s => s.split(':'));
const ed = Number(process.argv[5]) || 1;
const leaders = process.argv[6] === '1';
const W = { hardx: Object.assign({}, B.HARD, { noise: 0 }) };
E.setBot((st, seat, kind) => { const l = st.players[seat].bot; return B.decide(st, seat, kind, W[l] || l); });
const out = {};
for (const [a, b] of pairs) {
  for (const n of counts) {
    let win = 0, pair = 0, ptsA = 0, ptsB = 0;
    for (let k = 0; k < games; k++) {
      const seat = k % n;
      const bots = Array.from({ length: n }, (_, i) => (i === seat ? a : b));
      const st = E.newGame({ ed, n, bots, seed: 104729 * k + 31 * n + 7, sides: 'random', leaders });
      const S = st.result.scores, w = st.result.winners;
      if (w.indexOf(seat) >= 0) win += 1 / w.length;
      const mine = S[seat].total, c = st.players[seat].coins;
      S.forEach((s, i) => {
        if (i === seat) return;
        const oc = st.players[i].coins;
        pair += s.total < mine || (s.total === mine && oc < c) ? 1 : s.total === mine && oc === c ? 0.5 : 0;
        ptsB += s.total / (n - 1);
      });
      ptsA += mine;
    }
    const key = a + ' vs ' + b + ' (' + n + 'p)';
    out[key] = { win: +(win / games).toFixed(3), fair: +(1 / n).toFixed(3), pair: +(pair / games / (n - 1)).toFixed(3), ptsA: +(ptsA / games).toFixed(1), ptsB: +(ptsB / games).toFixed(1) };
    console.log(key.padEnd(24), 'wins', (100 * win / games).toFixed(1) + '%', '(fair ' + (100 / n).toFixed(1) + '%)',
      'ahead of', (100 * pair / games / (n - 1)).toFixed(1) + '% of opponents', 'avg pts', (ptsA / games).toFixed(1), 'vs', (ptsB / games).toFixed(1));
  }
}
console.log(JSON.stringify(out));
