// Saved-game strings for tools/edge-check.mjs, made by the real engine (odd states: ties, 7th card, Halikarnassos, Olympia, 7 players, huge cities, long names).
const path = require('path');
const J = path.join(__dirname, '..', 'js');
const C = require(path.join(J, 'cards.js'));
const E = require(path.join(J, 'engine.js'));
const B = require(path.join(J, 'bots.js'));
const settings = { ed: 1, sides: 'default', level: 'medium', n: 4, values: false, odds: true, name: '' };
const wrap = (st, extra) => JSON.stringify(Object.assign({ v: 1, settings: Object.assign({}, settings, { n: st.n }), game: { state: st, dec: [] }, last: null, online: false, score: null }, extra || {}));
function mk(n, o) {
  o = o || {};
  const names = ['You'].concat(Array.from({ length: n - 1 }, (_, i) => (o.names && o.names[i]) || 'Computer ' + (i + 1)));
  return E.newGame({ ed: o.ed || 1, n, names, bots: [null].concat(Array(n - 1).fill('medium')), sides: o.sides || 'A', wonders: o.wonders, seed: o.seed || 77 });
}
// play seat 0 with the medium bot until pred(st) is true
function playUntil(st, pred) {
  for (let k = 0; k < 400 && !pred(st) && st.phase !== 'over'; k++) {
    const kind = st.phase === 'side' ? 'side' : st.phase === 'discard' ? 'discard' : 'pick';
    st = E.apply(st, 0, B.decide(st, 0, kind, 'medium'));
  }
  return st;
}
module.exports = function states() {
const out = {};
let s = playUntil(mk(4), st => st.age === 2 && st.turn === 3); out.mid4 = wrap(s);
s = playUntil(mk(7, { seed: 5 }), st => st.age === 3 && st.turn === 1); out.age3_7 = wrap(s);
s = playUntil(mk(7, { seed: 5 }), st => st.age === 3 && st.turn === 6); out.age3t6_7 = wrap(s);
s = playUntil(mk(3, { seed: 3 }), st => st.age === 1 && st.turn === 1); out.start3 = wrap(s);
s = playUntil(mk(4, { seed: 9 }), () => false); out.over4 = wrap(s);
// tie on points, lose on coins: you have the same total as seat 1 but fewer coins
{
  const t = JSON.parse(JSON.stringify(s));
  const R = t.result; const top = Math.max(...R.scores.map(x => x.total));
  R.scores[0].total = top; R.scores[1].total = top; t.players[0].coins = 1; t.players[1].coins = 9;
  R.scores.forEach((x, i) => { if (i > 1 && x.total >= top) x.total = top - 1; });
  R.winners = [1];
  out.overTieCoins = wrap(t, { last: { view: E.view(t, 0), dec: [], me: 0, when: 1 } });
}
// Halikarnassos free build from discard, seat 0
{
  let t = playUntil(mk(4, { wonders: ['halikarnassos', 'rhodos', 'gizah', 'ephesos'], seed: 12 }), st => st.age === 2 && st.turn === 2);
  t = JSON.parse(JSON.stringify(t));
  t.phase = 'discard'; t.pendingDiscard = 0; t.players.forEach(p => { p.pick = null; });
  out.halik = wrap(t);
  const t2 = JSON.parse(JSON.stringify(t)); t2.discard = []; out.halikEmpty = wrap(t2);
}
// Babylon B 7th card, seat 0
{
  let t = playUntil(mk(4, { wonders: ['babylon', 'rhodos', 'gizah', 'ephesos'], sides: 'B', seed: 14 }), st => st.age === 1 && st.turn === 6);
  t = JSON.parse(JSON.stringify(t));
  t.players[0].stages = 2; t.players.forEach(p => { p.pick = null; p.hand = p.hand.slice(0, 1); });
  t.phase = 'seventh'; t.seventh = 0; t.halikAfter = [];
  out.seventh = wrap(t);
}
// Olympia A with the free-build stage, rich enough to pay for anything
{
  let t = playUntil(mk(4, { wonders: ['olympia', 'rhodos', 'gizah', 'ephesos'], seed: 21 }), st => st.age === 2 && st.turn === 1);
  t = JSON.parse(JSON.stringify(t));
  t.players[0].stages = 2; t.players[0].coins = 30; t.players[0].olyAge = 0;
  out.oly = wrap(t);
}
// side choice phase
out.side = wrap(E.newGame({ ed: 2, n: 5, names: ['You', 'Computer 1', 'Computer 2', 'Computer 3', 'Computer 4'], bots: [null, 'medium', 'medium', 'medium', 'medium'], sides: 'choose', seed: 4 }));
// huge city: 7 players, Age III turn 1, seat 0 gets lots of cards, coins and tokens
{
  const t = JSON.parse(out.age3_7 && JSON.stringify(JSON.parse(out.age3_7).game.state));
  const all = C.EDITIONS[1].list.filter(c => c.age < 3).map(c => c.name + '|' + c.age);
  const seen = new Set(); const mine = [];
  for (const id of all) { const nm = id.split('|')[0]; if (!seen.has(nm)) { seen.add(nm); mine.push(id); } }
  t.players[0].city = mine.slice(0, 30); t.players[0].coins = 87; t.players[0].mil = [1, -1, 3, 3, -1, -1];
  t.players[1].city = mine.slice(0, 26); t.players[1].coins = 123;
  out.huge = wrap(t);
}
// long and odd names
{
  const t = JSON.parse(JSON.stringify(JSON.parse(out.mid4).game.state));
  t.players[1].name = 'Bartholomew-Maximilian XV'.slice(0, 24); t.players[2].name = '🦄🦄🦄🦄🦄🦄🦄🦄'; t.players[3].name = 'WWWWWWWWWWWWWWWWWWWWWWWW';
  out.names = wrap(t);
  const t7 = JSON.parse(JSON.stringify(JSON.parse(out.age3_7).game.state));
  t7.players.forEach((p, i) => { if (i) p.name = 'WWWWWWWWWWWWWWWWWWWWWWW' + i; });
  out.names7 = wrap(t7);
}
return out;
};
