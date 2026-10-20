// Tunes the Hard computer's weights by self-play: a candidate sits in one seat against Medium computers,
// at 3, 4, 5 and 7 players. Objective = average (candidate points - average opponent points).
// Hill climbing with random steps, games spread over worker threads. Common seeds per round (fair comparison).
// Usage: node tools/tune.js [rounds=40] [gamesPerCount=120] [edition=1] [start=hard|medium]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');

if (!isMainThread) {
  const E = require('../js/engine.js');
  const B = require('../js/bots.js');
  parentPort.on('message', ({ W, opp, jobs, ed }) => {
    E.setBot((st, seat, kind) => {
      const b = st.players[seat].bot;
      return B.decide(st, seat, kind, b === 'cand' ? W : (opp || 'medium'));
    });
    let diff = 0, wins = 0, cnt = 0;
    for (const [n, seed] of jobs) {
      const seat = seed % n;
      const bots = Array.from({ length: n }, (_, i) => (i === seat ? 'cand' : 'opp'));
      const st = E.newGame({ ed, n, bots, seed, sides: 'random' });
      const sc = st.result.scores;
      let o = 0; sc.forEach((s, i) => { if (i !== seat) o += s.total / (n - 1); });
      diff += sc[seat].total - o;
      if (st.result.winners.indexOf(seat) >= 0) wins += 1 / st.result.winners.length;
      cnt++;
    }
    parentPort.postMessage({ diff, wins, cnt });
  });
  return;
}

const B = require('../js/bots.js');
const rounds = Number(process.argv[2]) || 40;
const per = Number(process.argv[3]) || 120;
const ed = Number(process.argv[4]) || 1;
const start = process.argv[5] || 'hard';
const COUNTS = [3, 4, 5, 7];
const NW = Math.max(1, os.cpus().length - 1);
const workers = Array.from({ length: NW }, () => new Worker(__filename));

function evalW(W, seeds) {
  const jobs = [];
  for (const n of COUNTS) for (const s of seeds) jobs.push([n, s * 7 + n]);
  const chunks = Array.from({ length: NW }, () => []);
  jobs.forEach((j, i) => chunks[i % NW].push(j));
  return Promise.all(workers.map((w, i) => new Promise(res => {
    w.once('message', res);
    w.postMessage({ W, jobs: chunks[i], ed });
  }))).then(rs => {
    const t = rs.reduce((a, r) => ({ diff: a.diff + r.diff, wins: a.wins + r.wins, cnt: a.cnt + r.cnt }), { diff: 0, wins: 0, cnt: 0 });
    return { obj: t.diff / t.cnt, win: t.wins / t.cnt };
  });
}

const KEYS = ['raw1', 'raw2', 'man1', 'man2', 'coin', 'low', 'sci1', 'sci2', 'sciMul', 'chain1', 'chain2', 'milNow', 'milLater',
  'trade', 'hate', 'pay', 'stageBias', 'vpMul', 'perMul', 'sellPen', 'near', 'dim'];

// node tools/tune.js eval weights.json [gamesPerCount]: score each weight set in the file on fresh seeds
if (process.argv[2] === 'eval') {
  (async () => {
    const list = JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8'));
    const seeds = Array.from({ length: Number(process.argv[4]) || 500 }, (_, i) => 5000000 + i);
    for (const [name, W] of Object.entries(list)) {
      const w = typeof W === 'string' ? Object.assign({}, B.LEVELS[W] || B.BASE) : Object.assign({}, B.HARD, W);
      console.log(name.padEnd(12), JSON.stringify(await evalW(w, seeds)));
    }
    workers.forEach(x => x.terminate());
  })();
  return;
}

(async () => {
  let best = Object.assign({}, start === 'medium' ? B.BASE : B.HARD,
    /\.json$/.test(start) ? JSON.parse(require('fs').readFileSync(start, 'utf8')) : {}, { noise: 0 });
  let seedBase = 1000;
  const mk = () => Array.from({ length: per }, (_, i) => seedBase + i);
  let seeds = mk();
  let bestScore = await evalW(best, seeds);
  console.log('start', bestScore);
  for (let r = 0; r < rounds; r++) {
    const cand = Object.assign({}, best);
    const k = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < k; i++) {
      const key = KEYS[Math.floor(Math.random() * KEYS.length)];
      cand[key] = Math.max(0, +(cand[key] * (0.7 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.1).toFixed(3));
    }
    const sc = await evalW(cand, seeds);
    if (sc.obj > bestScore.obj) {
      // confirm on fresh seeds so we do not keep lucky noise
      seedBase += 100000; seeds = mk();
      const a = await evalW(cand, seeds), b = await evalW(best, seeds);
      if (a.obj > b.obj) { best = cand; bestScore = a; console.log('round', r, 'kept', JSON.stringify(a), JSON.stringify(cand)); }
      else bestScore = b;
    }
  }
  console.log('BEST', JSON.stringify(best));
  console.log('score', bestScore);
  workers.forEach(w => w.terminate());
})();
