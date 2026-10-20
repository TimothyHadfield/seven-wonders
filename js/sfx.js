/* 7 Wonders Lab: sounds and small animations for what happens in a game, on top of js/fx.js.
   plan(prev, view, me, opts) compares the last screen snapshot with the new view and returns timed steps
   (sounds, floats, shakes, the end celebration). The same diff runs for local play and online snapshots,
   so other players' moves sound the same everywhere. run(plan, FX, find, hooks) plays the steps.
   Pure and DOM-free apart from run's `find`, so node tests can drive it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SWSfx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LAND = 320;          // ms a card takes to fly from your hand to your city
  const OTHER_GAP = 50;      // other players' reveals, one after another
  const WIN_TOKEN = { 1: 1, 2: 3, 3: 5 };
  const AGE = ['', 'I', 'II', 'III'];

  function setup(FX) {
    if (!FX || !FX.define) return;
    // two swords meeting: a bright metallic ring over a low thud, twice
    FX.define('clash', k => {
      [0, 0.16].forEach((at, j) => {
        k.noise({ f: 4200, filter: 'highpass', dur: 0.2, vol: 0.32 - j * 0.08, at });
        [1830, 2470, 3310].forEach(f => k.tone({ f: f * (j ? 1.12 : 1), f2: f * 0.98, dur: 0.45, vol: 0.05, type: 'triangle', at }));
        k.tone({ f: 150, f2: 70, dur: 0.14, vol: 0.28 - j * 0.1, at });
      });
    }, 'moves');
    // a stone block set into the wonder, then a short rising chime
    FX.define('stage', k => {
      k.tone({ f: 110, f2: 58, dur: 0.24, vol: 0.45 });
      k.noise({ f: 700, filter: 'lowpass', dur: 0.18, vol: 0.5 });
      k.tone({ f: 523, dur: 0.45, vol: 0.08, type: 'triangle', at: 0.1 });
      k.tone({ f: 784, dur: 0.55, vol: 0.08, type: 'triangle', at: 0.18 });
    }, 'moves');
  }

  const moveCount = v => (v.log || []).reduce((a, L) => a + L.moves.length, 0);
  function snap(v, me, toAct) {
    if (!v) return null;
    return { age: v.age, turn: v.turn, phase: v.phase, n: v.n, mv: moveCount(v), wars: (v.wars || []).length,
      coins: v.players.map(p => p.coins), sideMine: !!(v.players[me] && v.players[me].side), toAct: !!toAct,
      discardMine: v.phase === 'discard' && v.pendingDiscard === me };
  }
  // a snapshot from "before the game", so the first deal sounds
  function empty(n) { return { age: 0, turn: 0, phase: 'none', n, mv: 0, wars: 0, coins: null, sideMine: false, toAct: false, discardMine: false }; }

  // opts: { toAct, land (ms, your card's flight time or 0), fast, online, colors }
  function plan(prev, v, me, opts) {
    const o = opts || {};
    const sp = o.fast ? 0.55 : 1;
    const steps = [];
    const at = (t, s) => steps.push(Object.assign({ at: Math.round(t * sp) }, s));
    const out = { steps, handDelay: 0, land: 0, next: snap(v, me, o.toAct) };
    if (!prev || !v) return out;
    let p = prev;
    if (moveCount(v) < p.mv || v.age < p.age) p = empty(v.n); // a different game
    const left = (i) => (i + 1) % v.n, right = (i) => (i - 1 + v.n) % v.n;
    const L = left(me), R = right(me);
    const panOf = s => (s === L ? -0.6 : s === R ? 0.6 : 0);

    // 1. moves revealed since the last look (a turn, a free build from the discard)
    const flat = [];
    for (const lg of v.log || []) for (const m of lg.moves) flat.push(m);
    const fresh = flat.slice(p.mv);
    const land = o.land || 0;
    let t = 0, others = 0, mineAt = land;
    const mineMoves = fresh.filter(m => m.s === me), otherMoves = fresh.filter(m => m.s !== me);
    for (const m of mineMoves) {
      if (m.t === 'build') at(mineAt, { snd: 'stamp' });
      else if (m.t === 'wonder') { at(mineAt, { snd: 'stage' }); at(mineAt + 60, { fx: 'big', target: 'stage' }); }
      else at(mineAt, { snd: 'coins' });
      if (m.t !== 'sell' && m.pay && m.pay.L + m.pay.R > 0) at(mineAt + 140, { snd: 'coin', pan: m.pay.L && !m.pay.R ? -0.6 : m.pay.R && !m.pay.L ? 0.6 : 0 });
      t = Math.max(t, mineAt + 200);
    }
    for (const m of otherMoves) {
      const tt = land + OTHER_GAP * (++others);
      const snd = m.t === 'build' ? 'stamp' : m.t === 'wonder' ? 'stage' : 'coins';
      at(tt, { snd, vol: 0.45, pan: panOf(m.s) });
      if (m.t === 'wonder' && (m.s === L || m.s === R)) at(tt, { fx: 'pop', target: 'nb:' + m.s });
      // a neighbour buying from you: coins land in your stash
      if (m.t !== 'sell' && m.pay && ((m.pay.L && left(m.s) === me) || (m.pay.R && right(m.s) === me))) at(tt + 120, { snd: 'coin', vol: 0.7, pan: panOf(m.s) });
      t = Math.max(t, tt + 200);
    }
    // coins: count your stash up or down, and show what the neighbours got
    if (fresh.length && p.coins && v.players[me]) {
      const d = v.players[me].coins - p.coins[me];
      if (d) { at(land + 100, { fx: 'float', target: 'coin', text: (d > 0 ? '+' : '−') + Math.abs(d), color: d > 0 ? 'var(--good)' : 'var(--bad)' }); at(land + 100, { fx: 'count', target: 'coinNum', from: p.coins[me], to: v.players[me].coins }); }
      for (const s of [L, R]) {
        const dn = v.players[s].coins - p.coins[s];
        if (dn && s !== me) at(land + 140, { fx: 'float', target: 'nbcoin:' + s, text: (dn > 0 ? '+' : '−') + Math.abs(dn), color: dn > 0 ? 'var(--good)' : 'var(--bad)' });
      }
    }

    // 2. your wonder side chosen
    if (!p.sideMine && v.players[me] && v.players[me].side && p.phase !== 'none') at(0, { snd: 'place' });

    // 3. military at the end of an age
    const wars = v.wars || [];
    let tEnd = t;
    if (wars.length > p.wars) {
      const w = wars[wars.length - 1];
      const tc = t + 150;
      at(tc, { snd: 'clash' });
      at(tc, { fx: 'pulse', target: 'shield' });
      const mine = w.tokens.filter(x => x.s === me);
      mine.forEach((x, i) => {
        const tt = tc + 380 + i * 260;
        const side = x.vs === L ? -0.6 : 0.6;
        if (x.v > 0) { at(tt, { snd: 'place', pan: side }); at(tt, { fx: 'float', target: 'shield', text: '+' + x.v, color: 'var(--good)' }); }
        else { at(tt, { snd: 'hit', vol: 0.5, pan: side }); at(tt, { fx: 'shake', target: 'shield' }); at(tt, { fx: 'float', target: 'shield', text: '−1', color: 'var(--bad)' }); }
      });
      tEnd = tc + 380 + Math.max(1, mine.length) * 260;
      void WIN_TOKEN;
    }

    // 4. a new hand: dealt (new game / new age) or passed on
    const dealt = v.phase === 'pick' && v.turn === 1 && (v.age !== p.age || p.phase !== 'pick');
    const passed = !dealt && v.phase === 'pick' && v.age === p.age && v.turn > p.turn;
    const cards = Math.min(7, (v.hand || []).length);
    if (dealt) {
      const ts = p.age === 0 && p.phase !== 'side' ? 0 : tEnd + (wars.length > p.wars ? 150 : 0);
      if (v.age > 1) at(ts, { fx: 'float', target: 'age', text: 'Age ' + AGE[v.age], color: 'var(--accent-warm)' });
      at(ts, { snd: 'shuffle' });
      const td = ts + 420;
      for (let k = 0; k < cards; k++) at(td + k * 35, { snd: 'cardDeal', vol: 0.8 });
      out.handDelay = Math.round(td * sp);
    } else if (passed) {
      // Ages I and III pass left (the new hand comes from your right), Age II passes right
      const fromRight = v.age !== 2;
      const tp = Math.max(land, 60);
      at(tp, { snd: 'whoosh', pan: fromRight ? 0.5 : -0.5, vol: 0.8 });
      at(tp, { fx: 'slide', target: 'hand', dir: fromRight ? 1 : -1 });
      out.handDelay = Math.round(tp * sp);
    }

    // 5. your turn (only when you were waiting on someone else, e.g. online), or your free discard build
    const myTurnNow = o.toAct && (v.phase === 'pick' || v.phase === 'seventh' || v.phase === 'side' || v.phase === 'discard');
    const tTurn = Math.max(out.handDelay / sp, t) + 120;
    if (v.phase === 'discard' && v.pendingDiscard === me && !p.discardMine) { at(tTurn, { snd: 'turn' }); at(tTurn, { fx: 'pulse', target: 'act' }); }
    else if (o.online && myTurnNow && !p.toAct && p.phase !== 'none') { at(tTurn, { snd: 'turn' }); at(tTurn, { fx: 'pulse', target: 'act' }); }

    // 6. game over: count the score table up, then celebrate
    if (v.phase === 'over' && p.phase !== 'over' && v.result) {
      const ts = tEnd + 250;
      at(ts, { fx: 'scores' });
      const won = v.result.winners.indexOf(me) >= 0;
      at(ts + 8 * 220 + 200, { fx: 'celebrate', kind: won ? 'win' : 'lose', colors: o.colors });
    }
    out.land = Math.round(land * sp);
    steps.sort((a, b) => a.at - b.at);
    return out;
  }

  // Play the steps. find(target) returns an element or null; hooks[fx](step) handles app-specific steps.
  function run(pl, FX, find, hooks, timer) {
    const later = timer || ((fn, ms) => (ms > 0 ? setTimeout(fn, ms) : fn()));
    const h = hooks || {};
    for (const s of pl.steps) {
      later(() => {
        try {
          if (s.snd) { FX.play(s.snd, { vol: s.vol, pan: s.pan }); return; }
          if (h[s.fx]) { h[s.fx](s); return; }
          const el = find(s.target);
          if (s.fx === 'celebrate') { FX.celebrate({ kind: s.kind, colors: s.colors }); return; }
          if (!el) return;
          if (s.fx === 'big') FX.celebrate({ kind: 'big', at: el });
          else if (s.fx === 'float') FX.floatText(el, s.text, s.color);
          else if (s.fx === 'count') FX.countUp(el, s.from, s.to, { duration: 500 });
          else if (s.fx === 'shake') FX.shake(el);
          else if (s.fx === 'pulse') FX.pulse(el);
          else if (s.fx === 'pop') FX.pop(el);
        } catch (e) { /* effects never break the game */ }
      }, s.at);
    }
  }

  return { setup, snap, empty, plan, run, moveCount, LAND };
});
