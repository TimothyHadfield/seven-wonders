// Sounds + effects: the event -> sound map over a scripted real game, the Sound / Animations switches,
// and the end celebration. Uses js/fx.js unchanged with a fake AudioContext and a tiny fake DOM.
// Run: node tests/fx.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// ---------- fake Web Audio (counts what would really sound) + fake DOM (counts animations)
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
const node = extra => Object.assign({ connect() {}, start() {}, stop() {} }, extra);
class FakeAC {
  constructor() { this.state = 'running'; this.t = 0; this.sampleRate = 8000; this.destination = node(); }
  get currentTime() { return (this.t += 0.05); } // time moves on, so the same-sound throttle doesn't kick in
  createGain() { return node({ gain: param() }); }
  createOscillator() { return node({ type: 'sine', frequency: param() }); }
  createBiquadFilter() { return node({ type: 'lowpass', frequency: param(), Q: param() }); }
  createBufferSource() { return node({ buffer: null, loop: false }); }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createDynamicsCompressor() { return node(); }
  createStereoPanner() { return node({ pan: param() }); }
  resume() { return Promise.resolve(); }
}
globalThis.AudioContext = FakeAC;
let animCount = 0;
const el = () => ({
  style: { cssText: '' }, textContent: '', dataset: {},
  animate() { animCount++; const a = {}; setTimeout(() => a.onfinish && a.onfinish(), 0); return a; },
  getBoundingClientRect: () => ({ left: 10, top: 10, width: 40, height: 40 }),
  cloneNode() { return el(); }, removeAttribute() {}, remove() {}, getContext: () => null,
});
globalThis.document = { body: { appendChild() {} }, head: { appendChild() {} }, createElement: el, getElementById: () => null, addEventListener() {} };
globalThis.getComputedStyle = () => ({ borderRadius: '0' });
globalThis.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
globalThis.innerWidth = 393; globalThis.innerHeight = 659;

require('../js/fx.js');
const FX = globalThis.FX;
const E = require('../js/engine.js');
require('../js/bots.js');
const S = require('../js/sfx.js');
FX.init({ game: 'sw-test', clicks: false });
S.setup(FX);
FX.unlock();

let pass = 0;
const ok = l => { pass++; console.log('  PASS  ' + l); };

// spy on what the game asks for
let calls = [], cels = [];
const realPlay = FX.play, realCel = FX.celebrate;
FX.play = (n, o) => { const r = realPlay(n, o); calls.push({ n, o: o || {}, played: r }); return r; };
FX.celebrate = o => { cels.push(o.kind); return realCel(o); };
const now = (fn) => fn(); // run steps at once
const find = () => el();

// ---------- a scripted short game: 3 players, you vs two Easy computers, every action kind used
function playGame(seed) {
  let st = E.newGame({ ed: 1, n: 3, names: ['You', 'C1', 'C2'], bots: [null, 'easy', 'easy'], sides: 'A', wonders: ['rhodos', 'gizah', 'ephesos'], seed });
  let prev = S.empty(3);
  const events = []; // [{label, sounds:[{n,pan,vol}], cels:[]}]
  const look = (label) => {
    const v = E.view(st, 0);
    const toAct = v.waiting.indexOf(0) >= 0 && !(v.phase === 'pick' && v.pick);
    const pl = S.plan(prev, v, 0, { toAct, land: label === 'deal' ? 0 : S.LAND, colors: ['#f0b354'] });
    prev = pl.next;
    calls = []; cels = [];
    S.run(pl, FX, find, {}, now);
    events.push({ label, v, pl, sounds: calls.slice(), cels: cels.slice() });
  };
  look('deal');
  let staged = 0;
  for (let guard = 0; guard < 60 && st.phase !== 'over'; guard++) {
    const v = E.view(st, 0);
    let a, label;
    if (v.phase === 'discard') { a = { t: 'discard', id: null }; label = 'discard'; }
    else {
      const opts = E.options(v, 0, v.hand);
      const w = opts.findIndex(o => o.wonder.ok);
      const b = opts.findIndex(o => o.build.ok);
      if (v.turn === 2 && v.phase === 'pick') { a = { t: 'sell', i: 0 }; label = 'sell'; }
      else if (w >= 0 && staged < 2 && v.turn >= 3) { a = { t: 'wonder', i: w, pay: opts[w].wonder.opts[0] }; label = 'wonder'; staged++; }
      else if (b >= 0) { a = { t: 'build', i: b, pay: opts[b].build.opts[0] }; label = 'build'; }
      else { a = { t: 'sell', i: 0 }; label = 'sell'; }
    }
    st = E.apply(st, 0, a);
    look(label + ' A' + v.age + 't' + v.turn);
  }
  assert.equal(st.phase, 'over', 'the scripted game finishes');
  return events;
}

const ev = playGame(11);
const names = e => e.sounds.map(s => s.n);

// (a) event -> sound map
{
  const d = ev[0];
  assert.ok(names(d).includes('shuffle'), 'deal shuffles');
  assert.equal(names(d).filter(n => n === 'cardDeal').length, 7, 'one card sound per card dealt');
  assert.ok(d.pl.handDelay > 0, 'the hand waits for the shuffle');
  ok('new game: shuffle, then 7 card deals');

  const b = ev.find(e => e.label.startsWith('build') && e.v.turn > 1);
  const mine = b.sounds.find(s => s.n === 'stamp' && s.o.vol == null);
  assert.ok(mine, 'your build stamps at full volume');
  assert.ok(b.sounds.filter(s => s.n === 'stamp' || s.n === 'coins' || s.n === 'stage').every(s => s.o.vol == null || s.o.vol < 1), 'computers are never louder than you');
  assert.equal(b.sounds.filter(s => s.o.vol === 0.45).length, 2, 'both computers\' reveals sound, quieter');
  ok('build: your stamp + both computers\' reveals (quieter)');

  const s = ev.find(e => e.label.startsWith('sell'));
  assert.ok(s.sounds.some(x => x.n === 'coins' && x.o.vol == null), 'selling = coins');
  assert.ok(s.pl.steps.some(x => x.fx === 'float' && x.target === 'coin' && /^\+\d/.test(x.text)), '+N floats over your coins');
  assert.ok(s.pl.steps.some(x => x.fx === 'count' && x.target === 'coinNum'), 'coins count up');
  ok('sell: coins sound, +N float, coin count-up');

  const w = ev.find(e => e.label.startsWith('wonder'));
  assert.ok(w.sounds.some(x => x.n === 'stage' && x.o.vol == null), 'wonder stage = stone + chime');
  assert.ok(w.cels.includes('big'), 'your wonder stage is a big moment');
  ok('wonder stage: stage sound + big sparkle');

  const passA1 = ev.find(e => e.v.age === 1 && e.v.turn === 2 && e.v.phase === 'pick');
  const passA2 = ev.find(e => e.v.age === 2 && e.v.turn === 2 && e.v.phase === 'pick');
  const wh1 = passA1.sounds.find(x => x.n === 'whoosh'), wh2 = passA2.sounds.find(x => x.n === 'whoosh');
  assert.ok(wh1 && wh1.o.pan > 0, 'Age I: the new hand comes from your right');
  assert.ok(wh2 && wh2.o.pan < 0, 'Age II: the new hand comes from your left');
  assert.ok(passA1.pl.steps.some(x => x.fx === 'slide' && x.dir === 1) && passA2.pl.steps.some(x => x.fx === 'slide' && x.dir === -1), 'hand slides in from that side');
  ok('hands passed: whoosh panned by age direction, hand slides from that side');

  const ageEnd = ev.filter(e => e.sounds.some(x => x.n === 'clash'));
  assert.equal(ageEnd.length, 3, 'one military clash per age');
  const a2 = ageEnd[0];
  assert.ok(a2.v.age === 2 && names(a2).includes('shuffle') && names(a2).filter(n => n === 'cardDeal').length === 7, 'after the clash Age II is dealt');
  const toks = a2.v.wars[0].tokens.filter(t => t.s === 0);
  for (const t of toks) assert.ok(a2.pl.steps.some(x => x.fx === 'float' && x.target === 'shield' && x.text === (t.v > 0 ? '+' + t.v : '−1')), 'token float ' + t.v);
  assert.ok(a2.pl.steps.some(x => x.fx === 'float' && x.target === 'age' && x.text === 'Age II'), 'Age II shows');
  const ci = a2.pl.steps.findIndex(x => x.snd === 'clash'), si = a2.pl.steps.findIndex(x => x.snd === 'shuffle');
  assert.ok(ci < si, 'the clash comes before the new age');
  ok('age end: clash, your tokens (+N / −1), then "Age II", shuffle and deal');

  // the key moment: one battle banner per age, with your result against each neighbour (0 = a tie)
  ageEnd.forEach((e, k) => {
    const b = e.pl.steps.filter(x => x.fx === 'battle');
    assert.equal(b.length, 1, 'one banner at the end of age ' + (k + 1));
    assert.equal(b[0].age, k + 1);
    const W = e.v.wars[k].tokens.filter(t => t.s === 0), L = E.left(e.v, 0), R = E.right(e.v, 0);
    const want = nb => { const t = W.find(x => x.vs === nb); return t ? t.v : 0; };
    assert.equal(b[0].L.v, want(L), 'left result'); assert.equal(b[0].R.v, want(R), 'right result');
    assert.equal(b[0].L.name, e.v.players[L].name);
  });
  assert.equal(ev.filter(e => e.pl.steps.some(x => x.fx === 'battle')).length, 3, 'no banner on other turns');
  ok('age end: a battle banner with the age and your result against each neighbour');

  const turnChimes = ev.filter(e => names(e).includes('turn'));
  assert.equal(turnChimes.length, 0, 'local play: no "your turn" chime every turn');
  ok('no your-turn chime in local play (the hand whoosh says it)');
}

// online: the chime only when it becomes your turn after waiting for others
{
  let st = E.newGame({ ed: 1, n: 3, names: ['You', 'P2', 'P3'], bots: [null, null, null], sides: 'A', seed: 4 });
  const toAct = v => v.waiting.indexOf(0) >= 0 && !(v.phase === 'pick' && v.pick);
  let v = E.view(st, 0), prev = S.plan(null, v, 0, { toAct: toAct(v), online: true }).next;
  st = E.apply(st, 0, { t: 'sell', i: 0 });
  v = E.view(st, 0);
  let pl = S.plan(prev, v, 0, { toAct: toAct(v), online: true }); prev = pl.next;
  assert.ok(!pl.steps.some(x => x.snd === 'turn'), 'no chime while you wait');
  st = E.apply(st, 1, { t: 'sell', i: 0 }); st = E.apply(st, 2, { t: 'sell', i: 0 });
  v = E.view(st, 0);
  pl = S.plan(prev, v, 0, { toAct: toAct(v), online: true });
  assert.ok(pl.steps.some(x => x.snd === 'turn'), 'chime when the others are done');
  assert.equal(pl.steps.filter(x => x.snd === 'coins').length, 3, 'every player\'s sale sounds');
  ok('online: other players\' moves sound; "your turn" chime only after waiting');
}

// (c) game over celebrates with the right kind
{
  const last = ev[ev.length - 1];
  const won = last.v.result.winners.indexOf(0) >= 0;
  assert.deepEqual(last.cels.filter(k => k !== 'big'), [won ? 'win' : 'lose']);
  assert.ok(last.pl.steps.some(x => x.fx === 'scores'), 'scores count up');
  const v = last.v;
  const prevSnap = S.snap(ev[ev.length - 2].v, 0, true);
  for (const [winners, kind] of [[[0], 'win'], [[1], 'lose'], [[0, 2], 'win']]) {
    const vv = Object.assign({}, v, { result: Object.assign({}, v.result, { winners }) });
    const pl = S.plan(prevSnap, vv, 0, {});
    assert.equal(pl.steps.find(x => x.fx === 'celebrate').kind, kind);
  }
  ok('game over: score count-up, then win / lose (shared win counts as a win)');
}

// (b) switches
{
  const plans = ev.map(e => e.pl);
  const runAll = () => { calls = []; cels = []; for (const pl of plans) S.run(pl, FX, find, {}, now); return calls; };

  FX.set('sound', true); FX.set('animations', true);
  let p0 = FX.stats.plays;
  runAll();
  assert.ok(FX.stats.plays - p0 > 50, 'with Sound on the game makes sound (' + (FX.stats.plays - p0) + ')');

  FX.set('sound', false);
  p0 = FX.stats.plays;
  const c = runAll();
  assert.ok(c.length > 50 && c.every(x => !x.played), 'every play refused');
  assert.equal(FX.stats.plays, p0, 'no sound at all with Sound off');
  FX.set('sound', true);
  FX.set('moves', false);
  const c2 = runAll();
  assert.ok(c2.length > 50 && c2.every(x => !x.played), 'Game sounds off: no game sound plays (celebrations have their own switch)');
  FX.set('moves', true);
  ok('Sound off / Game sounds off: nothing plays');

  animCount = 0;
  runAll();
  await new Promise(r => setTimeout(r, 50));
  assert.ok(animCount > 20, 'animations run when on (' + animCount + ')');
  FX.set('animations', false);
  animCount = 0;
  runAll();
  await new Promise(r => setTimeout(r, 50));
  assert.equal(animCount, 0, 'no animation with Animations off');
  FX.set('animations', true);
  ok('Animations off: no animation runs');

  FX.set('celebrations', false);
  const before = FX.stats.plays;
  realCel({ kind: 'win' });
  assert.equal(FX.stats.plays, before, 'Celebrations off: no fanfare');
  FX.set('celebrations', true);
  ok('Celebrations off: no fanfare');
}

// fast speed halves the timeline
{
  const v = ev[5].v;
  const slow = S.plan(S.snap(ev[4].v, 0, true), v, 0, { land: S.LAND });
  const fast = S.plan(S.snap(ev[4].v, 0, true), v, 0, { land: S.LAND, fast: true });
  const end = p => Math.max.apply(null, p.steps.map(s => s.at));
  assert.ok(end(fast) <= end(slow) * 0.56 + 1, 'fast = 0.55x');
  ok('Fast speed: 0.55x the timeline');
}

console.log(pass + ' passed');
