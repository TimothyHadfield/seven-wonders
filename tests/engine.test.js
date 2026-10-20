// Rules tests for the 7 Wonders engine. Run: node tests/engine.test.js
// Every number here is traced in docs/rules-check.md.
const assert = require('assert/strict');
// SW_JS lets tools/mutate.js point the tests at a deliberately broken copy of js/
const path = require('path');
const J = process.env.SW_JS || path.join(__dirname, '..', 'js');
const C = require(path.join(J, 'cards.js'));
const E = require(path.join(J, 'engine.js'));
const B = require(path.join(J, 'bots.js'));
const OG = require(path.join(J, 'online-game.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message)); }
}

// a table where every seat is a person, sides fixed, wonders fixed; then we place cards by hand
function table(n, o) {
  o = o || {};
  const st = E.newGame({ ed: o.ed || 1, n, sides: o.side || 'A', wonders: o.wonders || E.newGame({ n: 7, seed: 5, sides: 'A' }).players.map(p => p.wonder).slice(0, n), seed: o.seed || 9 });
  return st;
}
const id = (name, age, ed) => { const c = C.EDITIONS[ed || 1].byName[name]; if (!c) throw new Error('no card ' + name); return name + '|' + (age || c.age); };
const W7 = ['rhodos', 'alexandria', 'ephesos', 'babylon', 'olympia', 'halikarnassos', 'gizah'];

// ---------------------------------------------------------------- card counts
t('deck sizes: 7 cards per player per age; Age III = 6n-2 non-guilds + (n+2) guilds', () => {
  for (const ed of [1, 2]) for (let n = 3; n <= 7; n++) {
    assert.equal(C.ageDeck(ed, 1, n).length, 7 * n);
    assert.equal(C.ageDeck(ed, 2, n).length, 7 * n);
    assert.equal(C.ageDeck(ed, 3, n).length, 6 * n - 2);
    const st = E.newGame({ ed, n, seed: n * 11, bots: Array(n).fill('easy') });
    // after the game every card dealt in Age III ended up in a city or the discard pile
    const all = st.players.reduce((a, p) => a.concat(p.city), []).concat(st.discard);
    const tucked = st.players.reduce((a, p) => a + p.stages, 0); // cards used for wonder stages leave play
    assert.equal(all.length + tucked, 21 * n, 'all cards accounted for');
  }
});
t('1st edition: 49/49/40 cards at 7 players, 10 guilds, 148 cards in the box', () => {
  assert.equal(C.ageDeck(1, 1, 7).length + C.ageDeck(1, 2, 7).length + C.ageDeck(1, 3, 7).length + C.guilds(1).length, 148);
  assert.equal(C.guilds(1).length, 10);
  assert.equal(C.guilds(2).length, 10);
});
t('player-count markers: Lumber Yard at 3 and 4 players, Tavern at 4, 5 and 7', () => {
  const cnt = (age, n, name) => C.ageDeck(1, age, n).filter(x => x.startsWith(name + '|')).length;
  assert.deepEqual([3, 4, 5, 6, 7].map(n => cnt(1, n, 'Lumber Yard')), [1, 2, 2, 2, 2]);
  assert.deepEqual([3, 4, 5, 6, 7].map(n => cnt(1, n, 'Tavern')), [0, 1, 2, 2, 3]);
  assert.deepEqual([3, 4, 5, 6, 7].map(n => cnt(3, n, 'Pantheon')), [1, 1, 1, 2, 2]);
});
t('Age III guilds dealt = players + 2', () => {
  for (let n = 3; n <= 7; n++) {
    const st = table(n, { wonders: W7.slice(0, n) });
    const age3 = st.decks[3];
    assert.equal(age3.length, 7 * n);
    assert.equal(age3.filter(x => E.card(st, x).color === 'purple').length, n + 2);
  }
});
t('chains: Altar -> Temple -> Pantheon (1st ed.), Theater -> Statue -> Gardens', () => {
  const b = C.EDITIONS[1].byName;
  assert.deepEqual(b.Temple.from, ['Altar']);
  assert.deepEqual(b.Pantheon.from, ['Temple']);
  assert.deepEqual(b.Statue.from, ['Theater']);
  assert.deepEqual(b.Gardens.from, ['Statue']);
});
t('wonder stages: side A has 3 stages; side B: Rhodos 2, Gizah 4, the rest 3 (1st ed.)', () => {
  const w = C.EDITIONS[1].wonders;
  for (const k of W7) assert.equal(w[k].A.length, 3, k);
  assert.deepEqual(W7.map(k => w[k].B.length), [2, 3, 3, 3, 3, 3, 4]);
});
t('everyone starts with 3 coins', () => {
  const st = table(5);
  assert.deepEqual(st.players.map(p => p.coins), [3, 3, 3, 3, 3]);
});

// ---------------------------------------------------------------- science
t('science: sets of 3 = 7 points plus squares', () => {
  assert.equal(E.sciScore(1, 1, 1), 10);
  assert.equal(E.sciScore(3, 2, 1), 21);
  assert.equal(E.sciScore(4, 0, 0), 16);
  assert.equal(E.sciScore(2, 2, 2), 26);
});
t('science wildcards are placed for the most points', () => {
  assert.equal(E.sciBest({ compass: 2, gear: 2, tablet: 1 }, 1).pts, 26);
  assert.equal(E.sciBest({ compass: 3, gear: 0, tablet: 0 }, 2).pts, 25);
  assert.equal(E.sciBest({ compass: 0, gear: 0, tablet: 0 }, 2).pts, 4);
  // brute force against every assignment
  for (let k = 0; k < 300; k++) {
    const c = { compass: k % 4, gear: (k >> 2) % 4, tablet: (k >> 4) % 4 };
    const w = k % 3;
    let best = 0;
    for (let x = 0; x <= w; x++) for (let y = 0; x + y <= w; y++) best = Math.max(best, E.sciScore(c.compass + x, c.gear + y, c.tablet + w - x - y));
    assert.equal(E.sciBest(c, w).pts, best);
  }
});

// ---------------------------------------------------------------- trading
t('trading: 2 coins per resource; trading posts make raw 1 coin on their side only', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] }); // olympia W, rhodos O, gizah S
  // seat 0 needs O: left (seat 1, Rhodos) makes ore
  assert.deepEqual(E.payOptions(st, 0, 'O'), [{ L: 2, R: 0 }]);
  st.players[0].city.push(id('West Trading Post'));
  assert.deepEqual(E.payOptions(st, 0, 'O'), [{ L: 1, R: 0 }]);
  st.players[0].city = [id('East Trading Post')];
  assert.deepEqual(E.payOptions(st, 0, 'O'), [{ L: 2, R: 0 }]);
  assert.deepEqual(E.payOptions(st, 0, 'S'), [{ L: 0, R: 1 }]); // right = seat 2, Gizah stone
});
t('trading: you cannot buy from a neighbour\'s yellow card; Forum-type cards are yours only', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  st.players[1].city = [id('Forum')]; // Forum makes G/L/P for its owner only
  assert.deepEqual(E.payOptions(st, 0, 'G'), []);
  st.players[0].city = [id('Forum')];
  assert.deepEqual(E.payOptions(st, 0, 'G'), [{ L: 0, R: 0 }]);
});
t('payOptions matches a brute force on 400 random cities', () => {
  const pool = C.EDITIONS[1].list.filter(c => c.e.prod).map(c => c.id);
  const res = ['W', 'S', 'C', 'O', 'G', 'L', 'P'];
  let r = 12345; const rnd = () => ((r = (r * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 400; k++) {
    const st = table(3, { wonders: W7.slice(k % 5, k % 5 + 3), seed: k + 1 });
    for (const p of st.players) { p.city = []; const m = Math.floor(rnd() * 5); for (let i = 0; i < m; i++) { const x = pool[Math.floor(rnd() * pool.length)]; if (!E.hasName(st, p, E.card(st, x).name)) p.city.push(x); } }
    if (rnd() < 0.3) st.players[0].city.push(id('East Trading Post'));
    if (rnd() < 0.3) st.players[0].city.push(id('Marketplace'));
    const need = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => res[Math.floor(rnd() * 7)]).join('');
    // brute force: each needed unit picks one slot, each slot used once
    const pr = E.prices(st, st.players[0]);
    const S = [].concat(E.slots(st, st.players[0], true).map(s => ['S', s]), E.slots(st, st.players[1], false).map(s => ['L', s]), E.slots(st, st.players[2], false).map(s => ['R', s]));
    let best = Infinity;
    (function go(i, used, l, rr) {
      if (i === need.length) { best = Math.min(best, l + rr); return; }
      for (let j = 0; j < S.length; j++) {
        if (used & (1 << j) || S[j][1].indexOf(need[i]) < 0) continue;
        const o = S[j][0];
        go(i + 1, used | (1 << j), l + (o === 'L' ? pr.L[need[i]] : 0), rr + (o === 'R' ? pr.R[need[i]] : 0));
      }
    })(0, 0, 0, 0);
    const got = E.payOptions(st, 0, need);
    if (best === Infinity) assert.deepEqual(got, [], need);
    else assert.equal(got[0].L + got[0].R, best, need + ' ' + JSON.stringify(got));
  }
});

// ---------------------------------------------------------------- turn resolution
function hands(st, hs) { st.players.forEach((p, i) => { p.hand = hs[i].slice(); }); }
t('same-turn: Vineyard counts a neighbour\'s brown card built that turn', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  const filler = [id('Altar'), id('Theater'), id('Baths'), id('Stockade'), id('Barracks'), id('Guard Tower')];
  st.age = 2;
  hands(st, [[id('Vineyard')].concat(filler), [id('Lumber Yard')].concat(filler), [id('Baths')].concat(filler.slice(0, 2), filler.slice(3))]);
  let s = E.apply(st, 0, { t: 'build', i: 0 });
  s = E.apply(s, 1, { t: 'build', i: 0 });
  s = E.apply(s, 2, { t: 'sell', i: 0 });
  // seat 0: Vineyard sees seat 1's Lumber Yard placed the same turn -> 1 coin; seat 2 sold -> +3
  assert.equal(s.players[0].coins, 3 + 1);
  assert.equal(s.players[2].coins, 3 + 3);
});
t('payments use coins held at the start of the turn; sellers are paid after', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  const f = [id('Altar'), id('Theater'), id('Baths'), id('Stockade'), id('Barracks'), id('Guard Tower')];
  hands(st, [[id('Barracks')].concat(f.slice(0, 4), [id('Clay Pool')]), [id('Altar')].concat(f.slice(1)), [id('Theater')].concat(f.slice(0, 1), f.slice(2))]);
  let s = E.apply(st, 0, { t: 'build', i: 0 }); // Barracks costs O: buy from Rhodos (left) for 2
  s = E.apply(s, 1, { t: 'build', i: 0 });
  s = E.apply(s, 2, { t: 'build', i: 0 });
  assert.equal(s.players[0].coins, 1);
  assert.equal(s.players[1].coins, 5);
  assert.equal(s.turn, 2);
});
t('hands pass left in Age I (you get your right neighbour\'s hand) and right in Age II', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  const before = st.players.map(p => p.hand.slice(1));
  let s = st; for (let i = 0; i < 3; i++) s = E.apply(s, i, { t: 'sell', i: 0 });
  assert.deepEqual(s.players[1].hand, before[0]); // seat 1's right neighbour is seat 0
  const s2 = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] }); s2.age = 2;
  const b2 = s2.players.map(p => p.hand.slice(1));
  let x = s2; for (let i = 0; i < 3; i++) x = E.apply(x, i, { t: 'sell', i: 0 });
  assert.deepEqual(x.players[1].hand, b2[2]); // Age II: from the left neighbour
});
t('you cannot build two cards with the same name; chains are free', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  st.players[0].city = [id('Altar')];
  assert.equal(E.buildCost(st, 0, id('Altar'), false).ok, false);
  st.age = 2;
  const tm = E.buildCost(st, 0, id('Temple'), false);
  assert.equal(tm.ok, true); assert.equal(tm.free, 'chain');
});
t('a card with a coin cost needs the coin', () => {
  const st = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  st.players[0].coins = 0;
  assert.equal(E.buildCost(st, 0, id('Mine'), false).ok, false); // Mine costs 1 coin
  st.players[0].coins = 1;
  assert.equal(E.buildCost(st, 0, id('Mine'), false).ok, true);
});

// ---------------------------------------------------------------- military + end of age
function playAge(s, pick) { // everybody plays their first card by `pick` until the age changes
  const a0 = s.age;
  for (let g = 0; g < 100 && s.age === a0 && s.phase !== 'over'; g++) {
    for (const seat of E.toAct(s)) s = E.apply(s, seat, pick(s, seat));
  }
  return s;
}
const sellAll = (s, seat) => (s.phase === 'discard' ? { t: 'discard', id: null } : { t: 'sell', i: 0 });
t('military: +1/+3/+5 for a win per age, -1 for a loss, nothing for a tie', () => {
  let s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] }); // Rhodos A stage 2 has shields but nobody builds
  s.players[0].city = [id('Barracks'), id('Stockade')]; // 2 shields
  s.players[1].city = [id('Guard Tower')]; // 1
  s = playAge(s, sellAll);
  assert.deepEqual(s.players[0].mil, [1, 1]);
  assert.deepEqual(s.players[1].mil, [1, -1].sort().length === 2 ? s.players[1].mil : null);
  assert.deepEqual(s.players[1].mil.slice().sort(), [-1, 1]);
  assert.deepEqual(s.players[2].mil, [-1, -1]);
  s = playAge(s, sellAll);
  assert.deepEqual(s.players[0].mil, [1, 1, 3, 3]);
  s = playAge(s, sellAll);
  assert.deepEqual(s.players[0].mil, [1, 1, 3, 3, 5, 5]);
  assert.equal(s.phase, 'over');
  assert.equal(s.result.scores[0].military, 18);
});
t('end: 1 point per 3 coins; ties broken by coins, then shared', () => {
  let s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  for (let a = 0; a < 3; a++) s = playAge(s, sellAll);
  // everyone sold 18 cards: 3 + 54 = 57 coins = 19 points; shared win
  assert.deepEqual(s.result.scores.map(r => r.coins), [19, 19, 19]);
  assert.deepEqual(s.result.winners, [0, 1, 2]);
  const st2 = JSON.parse(JSON.stringify(s));
  st2.players[1].coins = 58; // 19 points still, more coins
  assert.deepEqual(E.scoreAll(st2).winners, [1]);
});

// ---------------------------------------------------------------- wonders
t('Halikarnassos builds a card from the discard pile for free, at the end of that turn', () => {
  let s = table(3, { wonders: ['halikarnassos', 'rhodos', 'gizah'], side: 'B' });
  s.discard = [id('Altar'), id('Baths')];
  s.players[0].city = [id('Ore Vein'), id('Mine')]; // O + O/S: pays OO
  const h0 = s.players[0].hand[0];
  s = E.apply(s, 0, { t: 'wonder', i: 0 });
  s = E.apply(s, 1, { t: 'sell', i: 0 });
  s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.equal(s.phase, 'discard');
  assert.deepEqual(E.toAct(s), [0]);
  // seat 1 and 2's sold cards are in the pile too (discarded this turn)
  assert.ok(s.discard.length === 4);
  assert.throws(() => E.apply(s, 1, { t: 'discard', id: id('Altar') }));
  s = E.apply(s, 0, { t: 'discard', id: id('Baths') });
  assert.ok(s.players[0].city.indexOf(id('Baths')) >= 0);
  assert.equal(s.turn, 2);
  assert.equal(s.phase, 'pick');
  void h0;
});
t('Babylon B plays its 7th card instead of discarding it', () => {
  let s = table(3, { wonders: ['babylon', 'rhodos', 'gizah'], side: 'B' });
  const bp = s.players[0];
  bp.stages = 2; // stage 2 = play the 7th card
  for (let k = 0; k < 6; k++) for (let i = 0; i < 3; i++) s = E.apply(s, i, { t: 'sell', i: 0 });
  assert.equal(s.phase, 'seventh');
  assert.deepEqual(E.toAct(s), [0]);
  const last = s.players[0].hand[0];
  s = E.apply(s, 0, { t: 'sell', i: 0 });
  assert.equal(s.age, 2);
  assert.equal(s.players[0].coins, 3 + 18 + 3);
  assert.ok(s.discard.indexOf(last) >= 0);
});
t('Olympia A builds one card per age for free (1st ed.)', () => {
  let s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'], side: 'A' });
  s.players[0].stages = 2;
  s.players[0].hand[0] = id('Glassworks', 1);
  s.players[0].coins = 0;
  s.players[0].hand[1] = id('Scriptorium');
  assert.equal(E.buildCost(s, 0, id('Scriptorium'), false).ok, false);
  s = E.apply(s, 0, { t: 'build', i: 1, oly: true });
  assert.ok(s.players[0].pick);
  s = E.apply(s, 1, { t: 'sell', i: 0 });
  s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.ok(s.players[0].city.indexOf(id('Scriptorium')) >= 0);
  assert.equal(s.players[0].olyAge, 1);
  assert.equal(E.buildCost(s, 0, s.players[0].hand[0], true).ok, false, 'once per age');
});
t('Olympia B copies the best neighbour guild at the end', () => {
  const s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'], side: 'B' });
  s.players[0].stages = 3;
  s.players[1].city = [id('Workers Guild')];
  s.players[2].city = [id('Lumber Yard'), id('Ore Vein'), id('Clay Pool')]; // 3 brown next to seat 0
  const r = E.scoreOne(s, 0);
  assert.equal(r.copied, id('Workers Guild'));
  assert.equal(r.guilds, 3);
});
t('Lighthouse and Haven: coins once when built, points at the end', () => {
  const s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  s.players[0].city = [id('Lumber Yard'), id('Stone Pit'), id('Haven'), id('Tavern'), id('Lighthouse')];
  assert.equal(E.coinsFrom(s, 0, id('Haven')), 2);
  assert.equal(E.coinsFrom(s, 0, id('Lighthouse')), 3); // Haven + Tavern + itself (yellow)
  const r = E.scoreOne(s, 0);
  assert.equal(r.commerce, 2 + 3);
});

// ---------------------------------------------------------------- whole games
t('400 computer games (both editions, 3-7 players, every level) finish without errors', () => {
  const lv = ['easy', 'medium', 'hard'];
  for (let k = 0; k < 400; k++) {
    const n = 3 + (k % 5), ed = 1 + (k % 2);
    const st = E.newGame({ ed, n, seed: k + 1, sides: ['random', 'choose', 'A', 'B'][k % 4], bots: Array.from({ length: n }, (_, i) => lv[(i + k) % 3]) });
    assert.equal(st.phase, 'over');
    const all = st.players.reduce((a, p) => a.concat(p.city), []).concat(st.discard);
    assert.equal(all.length + st.players.reduce((a, p) => a + p.stages, 0), 21 * n);
    for (const p of st.players) assert.equal(new Set(p.city.map(x => E.card(st, x).name)).size, p.city.length, 'no duplicate names');
    for (const p of st.players) assert.ok(p.coins >= 0);
    assert.ok(st.result.winners.length >= 1);
  }
});
t('state survives JSON round trips mid-game and replays identically', () => {
  let s = E.newGame({ ed: 1, n: 4, seed: 77, bots: [null, 'hard', 'medium', 'easy'] });
  let s2 = JSON.parse(JSON.stringify(s));
  for (let k = 0; k < 30 && s.phase !== 'over'; k++) {
    const seat = E.toAct(s)[0];
    const a = B.decide(s, seat, s.phase === 'side' ? 'side' : s.phase === 'discard' ? 'discard' : 'pick', 'medium', () => 0.5);
    s = E.apply(s, seat, a);
    s2 = E.apply(JSON.parse(JSON.stringify(s2)), seat, a);
    assert.equal(JSON.stringify(s), JSON.stringify(s2));
  }
});
t('illegal moves throw: another seat, a card you do not hold, a stage you cannot pay', () => {
  const s = table(3, { wonders: ['olympia', 'rhodos', 'gizah'] });
  assert.throws(() => E.apply(s, 0, { t: 'build', i: 9 }));
  assert.throws(() => E.apply(s, 0, { t: 'teleport', i: 0 }));
  s.players[0].coins = 0;
  assert.throws(() => E.apply(s, 0, { t: 'wonder', i: 0 })); // Olympia A stage 1 needs WW, owns only W
  const s1 = E.apply(table(3), 0, { t: 'sell', i: 0 });
  assert.throws(() => E.apply(s1, 0, { t: 'sell', i: 0 }), 'already picked');
});

// ---------------------------------------------------------------- online game object + secrecy
t('secrecy: publicView holds no hand, deck, seed or discard contents; privateView only that seat', () => {
  let rng = 1; const r = () => ((rng = (rng * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 30; k++) {
    const n = 3 + (k % 5);
    let s = OG.game.setup(n, { ed: 1 + (k % 2), level: 'medium' }, r, Array.from({ length: n }, () => ({ kind: 'human' })));
    for (let step = 0; step < k * 3 && !OG.game.isOver(s); step++) {
      const seat = OG.game.toAct(s)[0];
      s = OG.game.apply(s, seat, OG.game.bot({ state: s }, seat));
    }
    const pub = OG.game.publicView(s);
    const ps = JSON.stringify(pub);
    assert.ok(!('decks' in pub) && !('seed' in pub) && !('discard' in pub));
    const shown = new Set([].concat(...s.players.map(p => p.city)));
    for (let i = 0; i < n; i++) {
      for (const h of s.players[i].hand) if (!shown.has(h)) assert.ok(ps.indexOf(h) < 0, 'hand card leaked in public view: ' + h);
      for (let j = 0; j < n; j++) if (j !== i) {
        const pv = JSON.stringify(OG.game.privateView(s, j));
        for (const h of s.players[i].hand) if (s.players[j].hand.indexOf(h) < 0 && !(OG.game.privateView(s, j).discardPile || []).includes(h)) assert.ok(pv.indexOf('"' + h + '"') < 0, 'seat ' + i + ' card in seat ' + j + ' private view');
      }
    }
    assert.ok(pub.players.every(p => typeof p.hand === 'number'));
  }
});
t('online game object: all-person game driven by game.bot reaches the end', () => {
  let x = 3; const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  let s = OG.game.setup(5, { ed: 2, sides: 'choose' }, r, Array.from({ length: 5 }, () => ({ kind: 'human' })));
  for (let g = 0; g < 2000 && !OG.game.isOver(s); g++) {
    const ta = OG.game.toAct(s);
    assert.ok(ta.length > 0);
    s = OG.game.apply(JSON.parse(JSON.stringify(s)), ta[0], OG.game.bot({ state: s, pub: OG.game.publicView(s), mine: OG.game.privateView(s, ta[0]) }, ta[0]));
  }
  assert.ok(OG.game.isOver(s));
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
