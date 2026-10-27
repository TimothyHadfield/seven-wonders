/* Computer players. They see only what a person at the table sees: every city, every coin pile,
   their own hand. Easy plays a random legal card. Medium scores every choice with a points estimate
   (with some randomness). Hard uses weights tuned by self-play, exact end-of-game points in Age III
   and keeps strong cards away from the next player. Strength is measured (tools/measure-levels.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cards.js'), require('./engine.js'));
  else root.SWBots = factory(root.SWCards, root.SWEngine);
})(typeof self !== 'undefined' ? self : this, function (Cards, E) {
  'use strict';
  const { RAW, MAN } = Cards;

  // Weights. Medium = BASE; Hard = HARD (tuned by tools/tune.js against Medium).
  const BASE = { raw1: 2.0, raw2: 1.1, man1: 1.7, man2: 1.2, coin: 0.36, low: 0.25, sci1: 1.6, sci2: 1.2, sciMul: 0.75,
    chain1: 1.1, chain2: 0.9, milNow: 1.0, milLater: 0.35, trade: 1.2, hate: 0, noise: 0.9, exact3: false, pay: 0.08,
    stageBias: 0.3, vpMul: 1, perMul: 0.8, sellPen: 0.4, near: 0.75, dim: 0.9 };
  // Tuned 2026-10-20 by tools/tune.js (hill climbing, ~150 rounds, 600-800 games per check, 1st edition).
  // Fresh-seed check over 2,400 games: +10.1 points and 61% wins against three-to-six Medium players.
  const HARD = Object.assign({}, BASE, { raw1: 2.563, raw2: 1.294, man1: 2.821, man2: 1.2, coin: 0.105, low: 0.17, sci1: 1.9, sci2: 1.195,
    sciMul: 0.609, chain1: 1.025, chain2: 0.573, milNow: 0.924, milLater: 0.34, trade: 1.271, hate: 0.339, noise: 0, exact3: true,
    pay: 0.141, stageBias: 0.414, vpMul: 0.492, perMul: 0.819, sellPen: 0.516, near: 0.906, dim: 0.9 });
  // Predictability (checked 2026-10-27, tools/ladder.js): Hard has no noise on purpose. Every deal is shuffled, so
  // the same spot hardly ever comes back, and tie-break noise cost Hard 5-7 points of win share at 4 players
  // (noise 0.25: 61.5% vs 67.0%; 0.1: 58.7% vs 65.5%, 400-600 games each against three Mediums).
  const LEVELS = { medium: BASE, hard: HARD };

  function produces(g, p, r) {
    let n = 0;
    for (const s of E.slots(g, p, true)) if (s.indexOf(r) >= 0) n += 1 / s.length;
    return n;
  }
  function nbProduces(g, seat, r) {
    let n = 0;
    for (const j of [E.left(g, seat), E.right(g, seat)]) for (const s of E.slots(g, g.players[j], false)) if (s.indexOf(r) >= 0) n += 1 / s.length;
    return n;
  }
  function prodValue(g, seat, units, W, sellable) {
    const p = g.players[seat];
    let v = 0;
    for (const u of units) { // u = 'W' or 'WC' (choice)
      let best = 0;
      for (const r of u) {
        const isRaw = RAW.indexOf(r) >= 0;
        const base = g.age === 1 ? (isRaw ? W.raw1 : W.man1) : g.age === 2 ? (isRaw ? W.raw2 : W.man2) : 0.15;
        const have = produces(g, p, r);
        const near = nbProduces(g, seat, r);
        const x = base / (1 + have * W.dim) * (near > 0 ? W.near : 1);
        if (x > best) best = x;
      }
      v += best * (u.length > 1 ? 1.15 : 1);
    }
    return v * (sellable ? 1.05 : 1);
  }
  function milDelta(g, seat, add, W) {
    if (!add) return 0;
    const p = g.players[seat];
    const mine = E.shields(g, p);
    let v = 0;
    const winOf = a => ({ 1: 1, 2: 3, 3: 5 })[a];
    const conf = 0.45 + 0.09 * g.turn;
    for (const j of [E.left(g, seat), E.right(g, seat)]) {
      const th = E.shields(g, g.players[j]);
      for (let a = g.age; a <= 3; a++) {
        const sc = x => (x > th ? winOf(a) : x < th ? -1 : 0);
        const d = sc(mine + add) - sc(mine);
        v += d * (a === g.age ? W.milNow * conf : W.milLater);
      }
    }
    return v;
  }
  function sciDelta(g, seat, sym, wild, W) {
    const p = g.players[seat];
    const s = E.sciSymbols(g, p);
    const now = E.sciBest(s.c, s.wild).pts;
    const c2 = Object.assign({}, s.c);
    if (sym) c2[sym]++;
    const after = E.sciBest(c2, s.wild + (wild ? 1 : 0)).pts;
    const future = g.age === 1 ? W.sci1 : g.age === 2 ? W.sci2 : 0;
    return (after - now) * (g.age === 3 ? 1 : W.sciMul) + future;
  }
  function coinValue(g, p, W) {
    return W.coin + (p.coins < 4 && g.age < 3 ? W.low : 0);
  }
  function withCard(g, seat, id, stageUp) {
    const players = g.players.slice();
    const p = g.players[seat];
    players[seat] = Object.assign({}, p, { city: id ? p.city.concat([id]) : p.city, stages: p.stages + (stageUp ? 1 : 0) });
    return Object.assign({}, g, { players });
  }
  // points-equivalent of having card id in seat's city (not counting what it costs)
  function cardValue(g, seat, id, W) {
    const c = E.card(g, id);
    const p = g.players[seat];
    const e = c.e;
    let v = 0;
    if (e.vp) v += e.vp * W.vpMul;
    if (e.prod) {
      const units = e.prod.indexOf('/') >= 0 ? [e.prod.replace(/\//g, '')] : e.prod.split('');
      v += prodValue(g, seat, units, W, c.color === 'brown' || c.color === 'grey');
    }
    if (e.sh) v += milDelta(g, seat, e.sh, W);
    if (e.sci || e.wild) v += sciDelta(g, seat, e.sci, e.wild, W);
    if (e.coins) v += e.coins * coinValue(g, p, W);
    if (e.trade) {
      let use = 0;
      const sides = e.trade.raw || e.trade.man;
      const kinds = e.trade.raw ? RAW : MAN;
      for (const sd of sides) {
        const j = sd === 'L' ? E.left(g, seat) : E.right(g, seat);
        for (const r of kinds) if (produces(g, g.players[j], r) > 0 && produces(g, p, r) === 0) use += 0.5;
      }
      v += Math.min(3, use) * W.trade * (g.age === 1 ? 1 : 0.6);
    }
    if (e.per) {
      const h = withCard(g, seat, id, false);
      for (const pe of e.per) {
        const n = E.countFor(h, seat, pe);
        if (pe.coin) v += pe.coin * n * coinValue(g, p, W);
        if (pe.vp) v += pe.vp * n * (g.age === 3 ? 1 : W.perMul) + (pe.who.indexOf('N') >= 0 ? 0.6 : 0.3);
      }
    }
    if (e.deco) {
      const total = E.stagesOf(g, p).length;
      v += p.stages >= total ? e.deco : e.deco * Math.max(0, 1 - (total - p.stages) * 0.3);
    }
    // chains: later cards it makes free
    if (c.to && c.to.length && g.age < 3) v += c.to.length * (g.age === 1 ? W.chain1 : W.chain2);
    return v;
  }
  function stageValue(g, seat, W) {
    const p = g.players[seat];
    const st = E.stagesOf(g, p)[p.stages];
    if (!st) return -99;
    const e = st[1];
    let v = W.stageBias;
    if (e.vp) v += e.vp * W.vpMul;
    if (e.coins) v += e.coins * coinValue(g, p, W);
    if (e.sh) v += milDelta(g, seat, e.sh, W);
    if (e.any) v += prodValue(g, seat, [e.any === 'raw' ? 'WSCO' : 'GLP'], W, false) * 1.2;
    if (e.wild) v += sciDelta(g, seat, null, true, W);
    if (e.free === 'age') v += 2.5 * (4 - g.age);
    if (e.free === 'color' || e.free === 'first' || e.free === 'last') v += 1.8 * (4 - g.age);
    if (e.discard) v += 3.5;
    if (e.seventh) v += 2 * (4 - g.age);
    if (e.tradeRaw) v += g.age < 3 ? 2.2 : 0.5;
    if (e.copy) v += g.age === 3 ? 5 : 4;
    return v;
  }

  // what a bot may look at: public cities + its own hand (never other hands or the discard pile)
  function botView(st, seat) { return E.view(st, seat); }

  function choices(g, seat, hand) {
    const out = [];
    const opts = E.options(g, seat, hand);
    for (const o of opts) {
      if (o.build.ok) out.push({ a: { t: 'build', i: o.i, pay: o.build.opts[0] }, kind: 'build', id: o.id, cost: o.build.coin + o.build.opts[0].L + o.build.opts[0].R, pay: o.build.opts[0], free: o.build.free });
      if (o.oly) out.push({ a: { t: 'build', i: o.i, oly: true }, kind: 'oly', id: o.id, cost: 0, pay: { L: 0, R: 0 } });
      if (o.wonder.ok) out.push({ a: { t: 'wonder', i: o.i, pay: o.wonder.opts[0] }, kind: 'wonder', id: o.id, cost: o.wonder.opts[0].L + o.wonder.opts[0].R, pay: o.wonder.opts[0] });
      out.push({ a: { t: 'sell', i: o.i }, kind: 'sell', id: o.id, cost: -3, pay: { L: 0, R: 0 } });
    }
    return out;
  }

  // exact end-of-game points change (without military) if this card / stage were in the city now
  function exactDelta(g, seat, id, stageUp) {
    const a = E.scoreOne(g, seat), b = E.scoreOne(withCard(g, seat, id, stageUp), seat);
    return (b.total - b.military) - (a.total - a.military);
  }
  function coinsNow(g, seat, id) {
    const c = E.card(g, id);
    let n = c.e.coins || 0;
    if (c.color === 'yellow' && c.e.per) {
      const h = withCard(g, seat, id, false);
      for (const pe of c.e.per) if (pe.coin) n += pe.coin * E.countFor(h, seat, pe);
    }
    return n;
  }

  function evaluate(g, seat, ch, W) {
    const p = g.players[seat];
    const cv = coinValue(g, p, W);
    let v;
    if (ch.kind === 'sell') v = 3 * cv - W.sellPen;
    else if (ch.kind === 'wonder') {
      v = stageValue(g, seat, W);
      const st = E.stagesOf(g, p)[p.stages];
      if (W.exact3 && g.age === 3 && !st[1].sh && !st[1].discard) v = exactDelta(g, seat, null, true) + (st[1].coins || 0) / 3 + W.stageBias;
      v -= ch.cost * cv + (ch.pay.L + ch.pay.R) * W.pay;
    } else {
      const c = E.card(g, ch.id);
      if (W.exact3 && g.age === 3 && !c.e.sh) v = exactDelta(g, seat, ch.id, false) + coinsNow(g, seat, ch.id) / 3;
      else v = cardValue(g, seat, ch.id, W);
      v -= ch.cost * cv + (ch.pay.L + ch.pay.R) * W.pay;
      if (ch.kind === 'oly') v -= 1.2 * (4 - g.age) / 3; // spending the once-per-age free build
    }
    return v;
  }

  // value of a card to whoever gets this hand next (for hate drafting)
  function nextValue(g, seat, id, W) {
    const nxt = g.age === 2 ? E.right(g, seat) : E.left(g, seat);
    const b = E.buildCost(g, nxt, id, false);
    if (!b.ok) return 0;
    return Math.max(0, cardValue(g, nxt, id, W) - (b.coin + b.opts[0].L + b.opts[0].R) * 0.33);
  }

  function weights(level) { return typeof level === 'object' ? level : LEVELS[level] || BASE; }

  function decide(st, seat, kind, level, rng) {
    const r = rng || (() => E.rnd(st));
    const g = botView(st, seat);
    const p = g.players[seat];
    if (kind === 'side') {
      if (level === 'easy') return { t: 'side', side: r() < 0.5 ? 'A' : 'B' };
      return { t: 'side', side: (SIDE_PREF[st.ed] && SIDE_PREF[st.ed][p.wonder]) || 'A' };
    }
    if (kind === 'discard') {
      const pile = E.discardChoices(st, seat); // Halikarnassos may look through the pile
      if (!pile.length) return { t: 'discard', id: null };
      if (level === 'easy') return { t: 'discard', id: pile[Math.floor(r() * pile.length)] };
      const W = weights(level);
      let best = null, bv = -1e9;
      for (const id of pile) {
        const v = W.exact3 && g.age === 3 && !E.card(g, id).e.sh ? exactDelta(g, seat, id, false) + coinsNow(g, seat, id) / 3 : cardValue(g, seat, id, W);
        if (v > bv) { bv = v; best = id; }
      }
      return { t: 'discard', id: best };
    }
    const hand = st.players[seat].hand;
    const ch = choices(g, seat, hand);
    if (level === 'easy') {
      const builds = ch.filter(c => c.kind === 'build');
      const wond = ch.filter(c => c.kind === 'wonder');
      const x = r();
      if (builds.length && x < 0.78) return builds[Math.floor(r() * builds.length)].a;
      if (wond.length && x < 0.93) return wond[Math.floor(r() * wond.length)].a;
      if (builds.length) return builds[Math.floor(r() * builds.length)].a;
      return ch.find(c => c.kind === 'sell').a;
    }
    const W = weights(level);
    let best = null, bv = -1e9;
    const hateCache = {};
    for (const c of ch) {
      let v = evaluate(g, seat, c, W);
      if (W.hate && hand.length > 1) {
        if (!(c.id in hateCache)) hateCache[c.id] = nextValue(g, seat, c.id, W);
        v += W.hate * hateCache[c.id];
      }
      if (W.noise) v += (r() - 0.5) * 2 * W.noise;
      if (v > bv) { bv = v; best = c; }
    }
    return best.a;
  }

  // which side the stronger computers pick (from measurements, see docs/ideas.md)
  const SIDE_PREF = { 1: {}, 2: {} };

  // Rank every choice for hints and the study screen (Hard's brain, no randomness).
  function rank(view, seat, hand) {
    const ch = choices(view, seat, hand);
    const out = ch.map(c => {
      let v = evaluate(view, seat, c, HARD);
      if (HARD.hate && hand.length > 1) v += HARD.hate * nextValue(view, seat, c.id, HARD);
      return Object.assign({ v }, c);
    });
    out.sort((a, b) => b.v - a.v);
    return out;
  }

  // seats with p.bot are answered inside the engine
  E.setBot((st, seat, kind) => decide(st, seat, kind, st.players[seat].bot || 'medium'));

  return { decide, rank, cardValue, stageValue, evaluate, choices, BASE, HARD, LEVELS, SIDE_PREF };
});
