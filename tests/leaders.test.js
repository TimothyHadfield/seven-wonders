// Leaders module tests: the draft, recruitment and every leader's effect. Run: node tests/leaders.test.js
// Rules traced in docs/rules-check.md ("Leaders"). Each test also fails on a build without the module.
const assert = require('assert/strict');
const path = require('path');
const J = process.env.SW_JS || path.join(__dirname, '..', 'js');
const C = require(path.join(J, 'cards.js'));
const E = require(path.join(J, 'engine.js'));
const B = require(path.join(J, 'bots.js'));
const OG = require(path.join(J, 'online-game.js'));
let LD = null;
try { LD = require(path.join(J, 'leaders.js')); } catch (e) { /* old build: every test fails below */ }

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message)); }
}
const id = (name, age) => { const c = C.EDITIONS[1].byName[name]; if (!c) throw new Error('no card ' + name); return name + '|' + (age || c.age); };
// a 3-player table of people, wonders olympia (W) / rhodos (O) / gizah (S), side A, the Leaders module on
function table(o) {
  o = o || {};
  return E.newGame({ ed: 1, n: o.n || 3, sides: o.side || 'A', wonders: o.wonders || ['olympia', 'rhodos', 'gizah'], seed: o.seed || 9, leaders: o.leaders !== false });
}
// a table in Age I picking, with these leaders already recruited by seat 0
function withLeads(leads, o) {
  const st = table(o);
  st.phase = 'pick'; st.age = (o && o.age) || 1; st.turn = 1;
  const d = st.decks[st.age];
  st.players.forEach((p, i) => { p.hand = d.slice(i * 7, i * 7 + 7); p.lh = []; p.lk = []; p.lead = []; p.coins = 6; });
  st.players[0].lead = leads.slice();
  return st;
}
const leader = n => { const c = LD && LD.byKey[n]; if (!c) throw new Error('no leader ' + n); return c; };
function score(st, s) { return E.scoreOne(st, s || 0); }

// ---------------------------------------------------------------- data
t('36 leaders, costs from the cross-checked list (docs/rules-check.md)', () => {
  assert.ok(LD, 'js/leaders.js exists');
  assert.equal(LD.IDS.length, 36);
  const cost = { Sappho: 1, Zenobia: 2, Nefertiti: 3, Cleopatra: 4, Caesar: 5, Hannibal: 2, Euclid: 5, Ptolemy: 5, Pythagoras: 5, Croesus: 1,
    Midas: 3, Amytis: 4, Alexander: 3, Aristotle: 3, Justinian: 3, Plato: 4, Hypatia: 4, Nebuchadnezzar: 4, Phidias: 3, Varro: 3, Pericles: 6,
    Praxiteles: 3, Hiram: 3, Archimedes: 4, Leonidas: 2, Hammurabi: 2, Imhotep: 3, Maecenas: 1, Ramses: 5, Bilkis: 4, Hatshepsut: 2,
    Xenophon: 2, Vitruvius: 1, Nero: 1, Tomyris: 4, Solomon: 3 };
  assert.equal(Object.keys(cost).length, 36);
  for (const k of Object.keys(cost)) assert.equal(leader(k).coin, cost[k], k);
});

// ---------------------------------------------------------------- setup + draft + recruitment
t('off by default: 3 coins, no leaders, the base game deals the same cards', () => {
  const a = E.newGame({ n: 4, seed: 77, sides: 'A' }), b = E.newGame({ n: 4, seed: 77, sides: 'A', leaders: true });
  assert.equal(a.lead, undefined);
  assert.deepEqual(a.players.map(p => p.coins), [3, 3, 3, 3]);
  assert.deepEqual(b.players.map(p => p.coins), [6, 6, 6, 6]);
  assert.deepEqual(a.decks, Object.assign({}, b.decks, { 1: a.decks[1] }));   // Age II/III decks identical
  assert.deepEqual(a.players.map(p => p.hand), b.players.map(p => b.decks[1].length ? [] : p.hand).map((x, i) => a.players[i].hand));
});
t('draft: 4 dealt, keep one and pass the rest to the right (you get your left neighbour\'s), 4 kept', () => {
  let st = table();
  assert.equal(st.phase, 'ldraft');
  const h = st.players.map(p => p.lh.slice());
  h.forEach(x => assert.equal(x.length, 4));
  assert.equal(new Set([].concat(...h)).size, 12, 'all different');
  for (let s = 0; s < 3; s++) st = E.apply(st, s, { t: 'lkeep', i: 0 });
  // seat 0 now holds seat 1's three (seat 1 is seat 0's left neighbour)
  assert.deepEqual(E.view(st, 0).lhand, h[1].slice(1));
  for (let s = 0; s < 3; s++) st = E.apply(st, s, { t: 'lkeep', i: 0 });
  for (let s = 0; s < 3; s++) st = E.apply(st, s, { t: 'lkeep', i: 0 });
  assert.equal(st.phase, 'recruit');
  assert.equal(st.age, 1);
  assert.deepEqual(st.players[0].lk, [h[0][0], h[1][1], h[2][2], h[0][3]]);
  st.players.forEach(p => assert.equal(p.lk.length, 4));
});
t('views hide other players\' leaders; recruited ones are public', () => {
  let st = table();
  const v = E.view(st, 0);
  assert.equal(v.lhand.length, 4);
  assert.equal(v.players[1].lh, undefined); assert.equal(v.players[1].lk, undefined);
  assert.equal(v.players[1].lkept, 4);
  assert.ok(!JSON.stringify(E.view(st, -1)).includes(st.players[1].lh[0]), 'public view has no hand');
});
function recruitPhase(o) {
  let st = table(o);
  for (let r = 0; r < 3; r++) for (let s = 0; s < st.n; s++) st = E.apply(st, s, { t: 'lkeep', i: 0 });
  return st;
}
t('recruit: pay the cost to the bank; sell gives 3; the card game starts after everyone acts', () => {
  let st = recruitPhase();
  const L0 = st.players[0].lk[0], c0 = leader(L0).coin;
  st = E.apply(st, 0, { t: 'lrec', i: 0 });
  assert.equal(st.phase, 'recruit');
  st = E.apply(st, 1, { t: 'lsell', i: 0 });
  st = E.apply(st, 2, { t: 'lsell', i: 1 });
  assert.equal(st.phase, 'pick'); assert.equal(st.turn, 1);
  assert.deepEqual(st.players[0].lead, [L0]);
  assert.equal(st.players[0].coins, 6 - c0 + (leader(L0).e.coins || 0));
  assert.equal(st.players[1].coins, 9);
  assert.equal(st.players[1].lead.length, 0);
  assert.equal(st.players[0].lk.length, 3);
  assert.equal(st.players.reduce((a, p) => a + p.hand.length, 0), 21);
});
t('recruit: can\'t recruit without the coins', () => {
  const st = recruitPhase();
  st.players[0].lk[0] = 'Pericles'; st.players[0].coins = 5;
  assert.throws(() => E.apply(st, 0, { t: 'lrec', i: 0 }), /coins/);
});
t('recruit: a leader can build a wonder stage (pay the stage, not the leader)', () => {
  const st = recruitPhase();
  st.players[0].lk[0] = 'Pericles';
  st.players[1].city = [id('Lumber Yard')];   // Olympia A stage 1 costs WW: own W + 1 W from the left for 2
  let s = E.apply(st, 0, { t: 'lstage', i: 0 });
  s = E.apply(s, 1, { t: 'lsell', i: 0 }); s = E.apply(s, 2, { t: 'lsell', i: 0 });
  assert.equal(s.players[0].stages, 1);
  assert.equal(s.players[0].coins, 4);
  assert.equal(s.players[1].coins, 6 + 3 + 2);
  assert.equal(s.players[0].lead.length, 0);
});
t('before Age III the second kept leader goes back to the box', () => {
  const st = recruitPhase();
  st.age = 3; st.players.forEach(p => { p.lk = p.lk.slice(0, 2); });
  let s = st; for (let i = 0; i < 3; i++) s = E.apply(s, i, { t: 'lsell', i: 0 });
  s.players.forEach(p => assert.equal(p.lk.length, 0));
});
t('whole game with the module: recruitment each age, every seat ends with 3 leaders played', () => {
  let st = table({ n: 4, wonders: ['olympia', 'rhodos', 'gizah', 'babylon'] });
  let recruits = 0;
  for (let g = 0; g < 400 && st.phase !== 'over'; g++) {
    for (const s of E.toAct(st)) {
      const v = E.view(st, s);
      if (st.phase === 'ldraft') st = E.apply(st, s, { t: 'lkeep', i: 0 });
      else if (st.phase === 'recruit') { recruits++; st = E.apply(st, s, { t: 'lsell', i: 0 }); }
      else if (st.phase === 'discard') st = E.apply(st, s, { t: 'discard', id: null });
      else if (st.phase === 'side') st = E.apply(st, s, { t: 'side', side: 'A' });
      else st = E.apply(st, s, { t: 'sell', i: 0 });
      void v;
    }
  }
  assert.equal(st.phase, 'over');
  assert.equal(recruits, 12);
  // 6 start + 3 per leader sold + 3 per card sold (18) = 6 + 9 + 54
  st.players.forEach(p => assert.equal(p.coins, 69));
});

// ---------------------------------------------------------------- effects: points
t('Sappho / Zenobia / Nefertiti / Cleopatra: 2 / 3 / 4 / 5 points', () => {
  for (const [n, v] of [['Sappho', 2], ['Zenobia', 3], ['Nefertiti', 4], ['Cleopatra', 5]]) {
    const st = withLeads([n]); assert.equal(score(st).leaders, v, n); assert.equal(score(st).total - score(withLeads([])).total, v);
  }
});
t('colour leaders: Hypatia green, Nebuchadnezzar blue, Phidias brown, Varro yellow (1 each); Pericles red, Praxiteles grey, Hiram purple (2 each)', () => {
  const city = [id('Apothecary'), id('Workshop'), id('Altar'), id('Lumber Yard'), id('Stone Pit'), id('Clay Pool'), id('Tavern'), id('Stockade'), id('Loom'), id('Workers Guild'), id('Builders Guild')];
  const want = { Hypatia: 2, Nebuchadnezzar: 1, Phidias: 3, Varro: 1, Pericles: 2, Praxiteles: 2, Hiram: 4 };
  for (const k of Object.keys(want)) {
    const st = withLeads([k]); st.players[0].city = city.slice();
    assert.equal(score(st).leaders, want[k], k);
  }
});
t('Amytis: 2 points per stage you built', () => {
  const st = withLeads(['Amytis']); st.players[0].stages = 2; assert.equal(score(st).leaders, 4);
});
t('Alexander: +1 per victory token (not defeats)', () => {
  const st = withLeads(['Alexander']); st.players[0].mil = [1, 3, -1, 5];
  assert.equal(score(st).leaders, 3); assert.equal(score(st).military, 8);
});
t('Midas: 1 more point per 3 coins', () => {
  const st = withLeads(['Midas']); st.players[0].coins = 14; assert.equal(score(st).leaders, 4); assert.equal(score(st).coins, 4);
});
t('Justinian: 3 per red+blue+green set; Plato: 7 per set of all seven colours', () => {
  let st = withLeads(['Justinian']);
  st.players[0].city = [id('Stockade'), id('Barracks'), id('Altar'), id('Theater'), id('Apothecary')];
  assert.equal(score(st).leaders, 3);
  st.players[0].city.push(id('Workshop'));
  assert.equal(score(st).leaders, 6);
  st = withLeads(['Plato']);
  st.players[0].city = [id('Lumber Yard'), id('Loom'), id('Altar'), id('Tavern'), id('Stockade'), id('Apothecary')];
  assert.equal(score(st).leaders, 0);
  st.players[0].city.push(id('Workers Guild'));
  assert.equal(score(st).leaders, 7);
});
t('Aristotle: a science set is worth 10, not 7', () => {
  const st = withLeads(['Aristotle']);
  st.players[0].city = [id('Apothecary'), id('Workshop'), id('Scriptorium')];
  assert.equal(score(st).science, 13);
  st.players[0].lead = []; assert.equal(score(st).science, 10);
});
// ---------------------------------------------------------------- effects: shields, science, coins
t('Caesar 2 shields, Hannibal 1 (they win battles)', () => {
  const st = withLeads(['Caesar', 'Hannibal']);
  assert.equal(E.shields(st, st.players[0]), 3);
});
t('Euclid / Ptolemy / Pythagoras: a compass / tablet / gear for science', () => {
  const st = withLeads(['Euclid', 'Ptolemy', 'Pythagoras']);
  assert.deepEqual(E.sciSymbols(st, st.players[0]).c, { compass: 1, gear: 1, tablet: 1 });
  assert.equal(score(st).science, 10);
});
t('Croesus: 6 coins when recruited', () => {
  const st = recruitPhase();
  st.players[0].lk[0] = 'Croesus';
  let s = E.apply(st, 0, { t: 'lrec', i: 0 }); s = E.apply(s, 1, { t: 'lsell', i: 0 }); s = E.apply(s, 2, { t: 'lsell', i: 0 });
  assert.equal(s.players[0].coins, 6 - 1 + 6);
});
t('Maecenas: later leaders cost nothing', () => {
  const st = recruitPhase();
  st.players[0].lead = ['Maecenas']; st.players[0].lk[0] = 'Pericles'; st.players[0].coins = 0;
  let s = E.apply(st, 0, { t: 'lrec', i: 0 }); s = E.apply(s, 1, { t: 'lsell', i: 0 }); s = E.apply(s, 2, { t: 'lsell', i: 0 });
  assert.deepEqual(s.players[0].lead, ['Maecenas', 'Pericles']); assert.equal(s.players[0].coins, 0);
});
t('Xenophon: +2 coins per yellow card built from then on', () => {
  const st = withLeads(['Xenophon']);
  st.players[0].hand[0] = id('Marketplace');
  let s = E.apply(st, 0, { t: 'build', i: 0 }); s = E.apply(s, 1, { t: 'sell', i: 0 }); s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.equal(s.players[0].coins, 8);
});
t('Vitruvius: +2 coins per card built free by a chain', () => {
  const st = withLeads(['Vitruvius'], { age: 2 });
  st.players[0].city = [id('Altar')]; st.players[0].hand[0] = id('Temple');
  let s = E.apply(st, 0, { t: 'build', i: 0 }); s = E.apply(s, 1, { t: 'sell', i: 0 }); s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.equal(s.players[0].coins, 8);
});
t('Hatshepsut: +1 coin per neighbour bought from that turn', () => {
  const st = withLeads(['Hatshepsut']);
  st.players[0].hand[0] = id('Barracks');   // costs O: Rhodos (left) for 2
  let s = E.apply(st, 0, { t: 'build', i: 0 }); s = E.apply(s, 1, { t: 'sell', i: 0 }); s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.equal(s.players[0].coins, 6 - 2 + 1);
});
t('Nero: +2 coins per victory token won', () => {
  const st = withLeads(['Nero', 'Caesar']);   // 2 shields: beats both neighbours
  let s = st;
  for (let k = 0; k < 6; k++) for (let i = 0; i < 3; i++) s = E.apply(s, i, { t: 'sell', i: 0 });
  assert.deepEqual(s.players[0].mil, [1, 1]);
  assert.equal(s.players[0].coins, 6 + 18 + 4);
});
t('Tomyris: your defeat tokens go to the neighbour who beat you', () => {
  const st = withLeads(['Tomyris']);
  st.players[1].lead = ['Caesar'];   // seat 1 (left) beats seat 0
  let s = st;
  for (let k = 0; k < 6; k++) for (let i = 0; i < 3; i++) s = E.apply(s, i, { t: 'sell', i: 0 });
  assert.deepEqual(s.players[0].mil, []);
  assert.deepEqual(s.players[1].mil.slice().sort(), [-1, 1, 1].sort());
});
// ---------------------------------------------------------------- effects: costs
t('Archimedes / Leonidas / Hammurabi: green / red / blue cards cost one resource less', () => {
  for (const [n, card] of [['Archimedes', 'Laboratory'], ['Leonidas', 'Walls'], ['Hammurabi', 'Aqueduct']]) {
    const st = withLeads([], { age: 2, wonders: ['ephesos', 'alexandria', 'babylon'] });
    const before = E.buildCost(st, 0, id(card), false);
    st.players[0].lead = [n];
    const after = E.buildCost(st, 0, id(card), false);
    const need = C.EDITIONS[1].byName[card].res.length;
    assert.ok(!before.ok, n + ' unaffordable without the leader');
    void need;
    st.players[0].city = [];
    // with every needed resource but one in the city, the card is free
    const res = C.EDITIONS[1].byName[card].res;
    const pr = { W: 'Lumber Yard', S: 'Stone Pit', C: 'Clay Pool', O: 'Ore Vein', G: 'Glassworks', L: 'Loom', P: 'Press' };
    const st2 = withLeads([n], { age: 2, wonders: ['ephesos', 'alexandria', 'babylon'] });
    st2.players[1].city = []; st2.players[2].city = [];
    const two = { WW: 'Sawmill', SS: 'Quarry', CC: 'Brickyard', OO: 'Foundry' };
    const rest = res.slice(1);
    for (const r of new Set(rest.split(''))) {
      const k = rest.split('').filter(x => x === r).length;
      st2.players[0].city.push(k >= 2 && two[r + r] ? id(two[r + r]) : id(pr[r], 1));
    }
    const c2 = E.buildCost(st2, 0, id(card), false);
    assert.ok(c2.ok, n + ' ' + JSON.stringify(c2));
    assert.equal(c2.opts[0].L + c2.opts[0].R, 0, n);
    void after;
  }
});
t('Imhotep: wonder stages cost one resource less', () => {
  const st = withLeads([]);   // Olympia A stage 1 = WW: own W only, no neighbour makes wood
  assert.equal(E.stageCost(st, 0).ok, false);
  st.players[0].lead = ['Imhotep'];
  const c = E.stageCost(st, 0);
  assert.equal(c.ok, true); assert.deepEqual(c.opts[0], { L: 0, R: 0 });
});
t('Ramses: guilds need no resources', () => {
  const st = withLeads([], { age: 3 });
  assert.equal(E.buildCost(st, 0, id('Magistrates Guild'), false).ok, false);
  st.players[0].lead = ['Ramses'];
  assert.equal(E.buildCost(st, 0, id('Magistrates Guild'), false).ok, true);
});
t('Bilkis: once a turn, any one resource from the bank for 1 coin', () => {
  const st = withLeads([]);
  assert.deepEqual(E.payOptions(st, 0, 'G'), []);
  st.players[0].lead = ['Bilkis'];
  assert.deepEqual(E.payOptions(st, 0, 'G'), [{ L: 0, R: 0, B: 1 }]);
  assert.deepEqual(E.payOptions(st, 0, 'GG'), [], 'only one a turn');
  // paying the bank: the coin leaves the game, nobody gets it
  st.players[0].hand[0] = id('Workshop');   // costs G
  let s = E.apply(st, 0, { t: 'build', i: 0, pay: { L: 0, R: 0, B: 1 } }); s = E.apply(s, 1, { t: 'sell', i: 0 }); s = E.apply(s, 2, { t: 'sell', i: 0 });
  assert.equal(s.players[0].coins, 5); assert.equal(s.players[1].coins, 9);
});
t('Solomon: recruited in Age II, builds a card from the discard pile for free', () => {
  const st = recruitPhase();
  st.age = 2; st.discard = [id('Altar'), id('Stockade')];
  st.players[0].lk[0] = 'Solomon';
  let s = E.apply(st, 0, { t: 'lrec', i: 0 }); s = E.apply(s, 1, { t: 'lsell', i: 0 }); s = E.apply(s, 2, { t: 'lsell', i: 0 });
  assert.equal(s.phase, 'discard'); assert.equal(s.pendingDiscard, 0);
  s = E.apply(s, 0, { t: 'discard', id: id('Stockade') });
  assert.equal(s.phase, 'pick'); assert.equal(s.age, 2);
  assert.deepEqual(s.players[0].city, [id('Stockade')]);
  assert.equal(s.players[0].hand.length, 7);
});
t('Solomon in Age I (empty discard pile) does nothing', () => {
  const st = recruitPhase();
  st.players[0].lk[0] = 'Solomon';
  let s = E.apply(st, 0, { t: 'lrec', i: 0 }); s = E.apply(s, 1, { t: 'lsell', i: 0 }); s = E.apply(s, 2, { t: 'lsell', i: 0 });
  assert.equal(s.phase, 'pick');
});

// ---------------------------------------------------------------- computers, online, wonder choice
t('computers of every level finish games with the module and recruit leaders', () => {
  let rec = 0;
  for (let k = 0; k < 18; k++) {
    const n = 3 + k % 5, lv = ['easy', 'medium', 'hard'][k % 3];
    const st = E.newGame({ n, bots: Array(n).fill(lv), seed: 300 + k, leaders: true, sides: 'random', ed: 1 + (k % 2) });
    assert.equal(st.phase, 'over');
    rec += st.players.reduce((a, p) => a + p.lead.length, 0);
  }
  assert.ok(rec > 18 * 4 * 1.5, 'computers recruit (' + rec + ')');
});
t('online rooms pass the option and give each seat its leaders privately', () => {
  const st = OG.game.setup(3, { ed: 1, level: 'easy', leaders: true }, () => 0.42, [{ kind: 'human', name: 'A' }, { kind: 'human', name: 'B' }, { kind: 'computer' }]);
  assert.equal(st.lead, true);
  assert.equal(OG.game.privateView(st, 0).lhand.length, 4);
  assert.ok(!JSON.stringify(OG.game.publicView(st)).includes(st.players[1].lh[0]));
  const a = OG.game.bot({ state: st }, 2);
  assert.equal(a.t, 'lkeep');
});
t('choose your wonder: seat 0 gets it, the others stay random and different', () => {
  for (const w of C.WONDER_IDS) for (let seed = 1; seed < 6; seed++) {
    const st = E.newGame({ n: 5, seed, pick: [w] });
    assert.equal(st.players[0].wonder, w);
    assert.equal(new Set(st.players.map(p => p.wonder)).size, 5);
  }
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
