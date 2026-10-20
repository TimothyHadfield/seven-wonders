// Draft statistics for the Odds tab: plays Hard-vs-Hard games and records, for every card, how often
// it is taken when it is in the hand, and how the players who built it finished.
// Usage: node tools/draft-stats.js [gamesPerCount=300]  -> writes js/draft-data.js
const fs = require('fs');
const path = require('path');
const E = require('../js/engine.js');
const B = require('../js/bots.js');
const C = require('../js/cards.js');
const per = Number(process.argv[2]) || 300;

const out = { made: new Date().toISOString().slice(0, 10), gamesPerCount: per, counts: [3, 4, 5, 6, 7], ed: {} };
for (const ed of [1, 2]) {
  const S = {}; // name -> [offered, taken, builtGames, winShare, fairShare, avgPtsDiffSum]
  const get = n => (S[n] = S[n] || [0, 0, 0, 0, 0, 0]);
  let pending = null;
  E.setBot((st, seat, kind) => {
    const a = B.decide(st, seat, kind, 'hard');
    if (kind === 'pick' && st.phase === 'pick') {
      const hand = st.players[seat].hand;
      const seen = new Set();
      for (const id of hand) { const nm = E.card(st, id).name; if (!seen.has(nm)) { seen.add(nm); get(nm)[0]++; } }
      if (a.t === 'build') get(E.card(st, hand[a.i]).name)[1]++;
    }
    return a;
  });
  for (const n of out.counts) {
    for (let k = 0; k < per; k++) {
      const st = E.newGame({ ed, n, seed: 900000 + k * 13 + n, bots: Array(n).fill('hard'), sides: 'random' });
      const sc = st.result.scores.map(r => r.total);
      const mean = sc.reduce((a, b) => a + b, 0) / n;
      st.players.forEach((p, i) => {
        const win = st.result.winners.indexOf(i) >= 0 ? 1 / st.result.winners.length : 0;
        for (const id of p.city) { const s = get(E.card(st, id).name); s[2]++; s[3] += win; s[4] += 1 / n; s[5] += sc[i] - mean; }
      });
    }
  }
  void pending;
  const rows = {};
  for (const c of C.EDITIONS[ed].list) {
    const s = S[c.name];
    if (!s || rows[c.name]) continue;
    rows[c.name] = { take: s[0] ? +(s[1] / s[0]).toFixed(3) : null, built: s[2], win: s[2] ? +(s[3] / s[4]).toFixed(3) : null, pts: s[2] ? +(s[5] / s[2]).toFixed(2) : null };
  }
  out.ed[ed] = rows;
}
const file = path.join(__dirname, '..', 'js', 'draft-data.js');
fs.writeFileSync(file, '/* Made by tools/draft-stats.js (Hard computers only). take = share of hands holding the card where it was built;\n   win = builders\' win share / fair share; pts = builders\' points minus the table average. */\nself.SWDraft = ' + JSON.stringify(out) + ';\n');
console.log('wrote', file, Object.keys(out.ed[1]).length, Object.keys(out.ed[2]).length);
