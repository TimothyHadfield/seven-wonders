// The end-of-game replay, Undo and the My stats result (node tests/study.test.js).
// The replay deals the game again from its saved options and applies only your saved actions: the computers
// must make exactly the same picks, or Study would show a different game.
const assert = require('assert/strict');
const path = require('path');
const J = path.join(__dirname, '..', 'js');
const E = require(path.join(J, 'engine.js'));
const B = require(path.join(J, 'bots.js'));
const SP = require(path.join(J, 'swprofile.js'));
const SC = require(path.join(J, 'swcoach.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message)); }
}
const kindOf = s => (s.phase === 'side' ? 'side' : s.phase === 'discard' ? 'discard' : 'pick');
// one game as the site plays it: you are seat 0 (here played by Medium), the rest are computers of `level`
function play(init, level) {
  let st = E.newGame(JSON.parse(JSON.stringify(init)));
  const acts = [];
  let r = 1;
  const dice = () => ((r = (r * 48271) % 2147483647) / 2147483647);
  for (let k = 0; k < 200 && st.phase !== 'over'; k++) {
    assert.deepEqual(E.toAct(st), [0], 'only you are waited for');
    const a = B.decide(st, 0, kindOf(st), level === 'easy' ? 'medium' : 'hard', dice);
    acts.push(a);
    st = E.apply(st, 0, a);
  }
  return { st, acts };
}
function replay(init, acts) {
  let st = E.newGame(JSON.parse(JSON.stringify(init)));
  for (const a of acts) st = E.apply(st, 0, a);
  return st;
}
const names = n => ['You'].concat(Array.from({ length: n - 1 }, (_, i) => 'Computer ' + (i + 1)));
const bots = (n, l) => [null].concat(Array.from({ length: n - 1 }, () => l));

t('replay from the saved deal + your actions ends exactly where the game ended (3-7 players, both editions)', () => {
  for (let k = 0; k < 10; k++) {
    const n = 3 + (k % 5), lv = ['easy', 'medium', 'hard'][k % 3];
    const init = { ed: 1 + (k % 2), n, names: names(n), bots: bots(n, lv), sides: ['random', 'choose', 'A', 'B'][k % 4], seed: (2654435761 * (k + 1)) >>> 0 };
    const g = play(init, lv);
    assert.equal(g.st.phase, 'over');
    const again = replay(init, g.acts);
    assert.equal(JSON.stringify(again), JSON.stringify(g.st), 'game ' + k);
  }
});
t('undo: going back to a saved state and playing on is the same as never having made that pick', () => {
  const init = { ed: 1, n: 4, names: names(4), bots: bots(4, 'hard'), seed: 99 };
  let st = E.newGame(JSON.parse(JSON.stringify(init)));
  const acts = [];
  let saved = null;
  for (let k = 0; k < 5; k++) {
    const a = B.decide(st, 0, kindOf(st), 'medium', () => 0.5);
    if (k === 3) saved = { state: JSON.stringify(st), acts: acts.length };
    acts.push(a); st = E.apply(st, 0, a);
  }
  // undo the 4th and 5th picks, then pick something else
  st = JSON.parse(saved.state); acts.length = saved.acts;
  const other = { t: 'sell', i: 0 };
  acts.push(other); st = E.apply(st, 0, other);
  assert.equal(JSON.stringify(replay(init, acts)), JSON.stringify(st));
});
t('My stats result: win, place-based loss, quit counts as a loss, help makes it unrated', () => {
  const init = { ed: 1, n: 3, names: names(3), bots: bots(3, 'easy'), seed: 5 };
  const g = play(init, 'easy');
  const v = E.view(g.st, 0);
  const r = SP.result({ v, me: 0, level: 'easy', helped: false, daily: false, stagesTotal: E.stagesOf(v, v.players[0]).length });
  const won = v.result.winners.length === 1 && v.result.winners[0] === 0;
  assert.equal(r.mode, 'computer'); assert.equal(r.level, 'easy'); assert.equal(r.won, won);
  assert.equal(r.score, v.result.scores[0].total); assert.equal(r.extra.n, 3); assert.equal(r.extra.quit, false);
  const h = SP.result({ v, me: 0, level: 'hard', helped: true });
  assert.equal(h.mode, 'help'); assert.equal(h.level, null);
  let mid = E.newGame(JSON.parse(JSON.stringify(init)));
  mid = E.apply(mid, 0, B.decide(mid, 0, kindOf(mid), 'medium', () => 0.5));
  const q = SP.result({ v: E.view(mid, 0), me: 0, level: 'medium', helped: false });
  assert.equal(q.won, false); assert.equal(q.draw, false); assert.equal(q.extra.quit, true); assert.equal(q.mode, 'computer');
});
t('levels are rated in ladder order and the Daily is a fixed Hard game', () => {
  const R = SP.LEVELS.map(l => l.rating);
  assert.ok(R[0] < R[1] && R[1] < R[2]);
  assert.equal(SP.DAILY.level, 'hard');
  const st = E.newGame({ ed: SP.DAILY.ed, n: SP.DAILY.n, names: names(SP.DAILY.n), bots: bots(SP.DAILY.n, SP.DAILY.level), sides: SP.DAILY.sides, seed: 1234 });
  const st2 = E.newGame({ ed: SP.DAILY.ed, n: SP.DAILY.n, names: names(SP.DAILY.n), bots: bots(SP.DAILY.n, SP.DAILY.level), sides: SP.DAILY.sides, seed: 1234 });
  assert.equal(JSON.stringify(E.view(st, 0)), JSON.stringify(E.view(st2, 0)), 'same seed, same deal');
});
t('the guided game is a 3-player game vs Easy with side A, and every rules section has text', () => {
  const G = SC.GAME;
  const st = E.newGame({ ed: G.ed, n: G.n, names: names(G.n), bots: bots(G.n, G.level), sides: G.sides, seed: G.seed });
  assert.equal(st.players.length, 3);
  assert.ok(st.players.every(p => p.side === 'A'));
  assert.ok(SC.RULES.sections.length >= 6 && SC.RULES.sections.every(s => s.html.length > 60));
  assert.ok(SC.steps(() => null).length >= 8);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
