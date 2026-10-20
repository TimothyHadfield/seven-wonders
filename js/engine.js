/* 7 Wonders rules engine (3-7 players, 1st or 2nd edition).
   Pure functions on a JSON-safe state. Every random draw comes from the seed kept inside the state.
   Seats sit clockwise: seat i's LEFT neighbour is i+1, RIGHT neighbour is i-1 (as seen from your chair).
   Age I and III hands pass left, Age II right.
   Turn flow: everyone picks a card face down (simultaneous), then all picks resolve together:
   payments first (with coins held at the start of the turn), cards placed, then coin effects
   (so a neighbour's same-turn brown card counts for Vineyard). See docs/rules-check.md. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cards.js'));
  else root.SWEngine = factory(root.SWCards);
})(typeof self !== 'undefined' ? self : this, function (Cards) {
  'use strict';
  const { EDITIONS, RAW, MAN, WONDER_IDS } = Cards;

  // ------------------------------------------------------------------ random
  function rnd(st) { // mulberry32 on st.seed
    let t = (st.seed = (st.seed + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(st, a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(st) * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------------ lookups
  const D = g => EDITIONS[g.ed];
  const card = (g, id) => D(g).byKey[id];
  const left = (g, i) => (i + 1) % g.n;
  const right = (g, i) => (i - 1 + g.n) % g.n;
  const wonderOf = (g, p) => D(g).wonders[p.wonder];
  const stagesOf = (g, p) => (p.side ? wonderOf(g, p)[p.side] : []);
  const builtStages = (g, p) => stagesOf(g, p).slice(0, p.stages);
  function hasName(g, p, name) { return p.city.some(id => card(g, id).name === name); }
  function countColor(g, p, color) { return p.city.reduce((n, id) => n + (card(g, id).color === color ? 1 : 0), 0); }
  function stageHas(g, p, key) { return builtStages(g, p).some(s => s[1][key]); }
  function shields(g, p) {
    let s = 0;
    for (const id of p.city) s += card(g, id).e.sh || 0;
    for (const st of builtStages(g, p)) s += st[1].sh || 0;
    return s;
  }
  function sciSymbols(g, p) {
    const c = { compass: 0, gear: 0, tablet: 0 };
    let wild = 0;
    for (const id of p.city) { const e = card(g, id).e; if (e.sci) c[e.sci]++; if (e.wild) wild++; }
    for (const st of builtStages(g, p)) if (st[1].wild) wild++;
    return { c, wild };
  }
  function sciScore(a, b, c) { return a * a + b * b + c * c + 7 * Math.min(a, b, c); }
  // best score with wildcards placed optimally (also returns the placement)
  function sciBest(c, wild) {
    let best = { pts: -1, add: [0, 0, 0] };
    for (let x = 0; x <= wild; x++) for (let y = 0; y + x <= wild; y++) {
      const z = wild - x - y;
      const pts = sciScore(c.compass + x, c.gear + y, c.tablet + z);
      if (pts > best.pts) best = { pts, add: [x, y, z] };
    }
    return best;
  }

  // ------------------------------------------------------------------ production and trading
  // Producer slots of a city. own=true: everything usable by the owner; own=false: what neighbours may buy.
  function slots(g, p, own) {
    const out = [];
    const W = wonderOf(g, p);
    out.push(W.res);
    for (const id of p.city) {
      const c = card(g, id);
      if (!c.e.prod) continue;
      const tradable = c.color === 'brown' || c.color === 'grey';
      if (!own && !tradable) continue;
      if (c.e.prod.indexOf('/') >= 0) out.push(c.e.prod.replace(/\//g, ''));
      else for (const r of c.e.prod) out.push(r);
    }
    if (own) for (const st of builtStages(g, p)) {
      if (st[1].any === 'raw') out.push(RAW.join(''));
      if (st[1].any === 'man') out.push(MAN.join(''));
    }
    return out;
  }
  function prices(g, p) {
    const pr = { L: {}, R: {} };
    let rawL = 2, rawR = 2, man = 2;
    for (const id of p.city) {
      const t = card(g, id).e.trade;
      if (!t) continue;
      if (t.raw && t.raw.indexOf('L') >= 0) rawL = 1;
      if (t.raw && t.raw.indexOf('R') >= 0) rawR = 1;
      if (t.man) man = 1;
    }
    if (stageHas(g, p, 'tradeRaw')) { rawL = 1; rawR = 1; }
    for (const r of RAW) { pr.L[r] = rawL; pr.R[r] = rawR; }
    for (const r of MAN) { pr.L[r] = man; pr.R[r] = man; }
    return pr;
  }
  // All cheapest ways to cover a resource cost: [{L, R}] (coins paid to each neighbour), Pareto-minimal,
  // sorted by total. [] if impossible. The coin balance is NOT checked here.
  function payOptions(g, seat, res) {
    if (!res) return [{ L: 0, R: 0 }];
    const p = g.players[seat];
    const groups = new Map();
    const add = (opts, owner) => {
      const k = owner + ':' + opts;
      const gr = groups.get(k);
      if (gr) gr.n++; else groups.set(k, { opts, owner, n: 1 });
    };
    const need = res.split('').sort();
    const needSet = new Set(need);
    const keep = s => s.split('').filter(r => needSet.has(r)).join('');
    for (const s of slots(g, p, true)) { const k = keep(s); if (k) add(k, 'S'); }
    for (const s of slots(g, g.players[left(g, seat)], false)) { const k = keep(s); if (k) add(k, 'L'); }
    for (const s of slots(g, g.players[right(g, seat)], false)) { const k = keep(s); if (k) add(k, 'R'); }
    // fixed own slots first, then flexible own, then neighbours: finds the free solution fast
    const G = [...groups.values()].sort((a, b) => (a.owner === 'S' ? 0 : 1) - (b.owner === 'S' ? 0 : 1) || a.opts.length - b.opts.length);
    const pr = prices(g, p);
    const found = [];
    const dominated = (l, r) => found.some(f => f.L <= l && f.R <= r);
    let steps = 0;
    (function dfs(i, minG, l, r) {
      if (++steps > 200000) return;
      if (dominated(l, r)) return;
      if (i === need.length) {
        for (let k = found.length - 1; k >= 0; k--) if (found[k].L >= l && found[k].R >= r) found.splice(k, 1);
        found.push({ L: l, R: r });
        return;
      }
      const res1 = need[i];
      const start = i > 0 && need[i - 1] === res1 ? minG : 0;
      for (let k = start; k < G.length; k++) {
        const gr = G[k];
        if (!gr.n || gr.opts.indexOf(res1) < 0) continue;
        gr.n--;
        if (gr.owner === 'S') dfs(i + 1, k, l, r);
        else if (gr.owner === 'L') dfs(i + 1, k, l + pr.L[res1], r);
        else dfs(i + 1, k, l, r + pr.R[res1]);
        gr.n++;
      }
    })(0, 0, 0, 0);
    return found.sort((a, b) => a.L + a.R - b.L - b.R || Math.abs(a.L - a.R) - Math.abs(b.L - b.R));
  }

  // ------------------------------------------------------------------ what a card or stage would cost
  // Returns {ok, free:'chain'|'oly'|'rule'|null, coin, opts:[{L,R}], why}
  function buildCost(g, seat, id, useOly) {
    const p = g.players[seat];
    const c = card(g, id);
    if (hasName(g, p, c.name)) return { ok: false, why: 'You already have one' };
    if (c.from.some(n => hasName(g, p, n))) return { ok: true, free: 'chain', coin: 0, opts: [{ L: 0, R: 0 }] };
    if (g.ed === 2) {
      const st = builtStages(g, p);
      const fr = st.map(s => s[1].free).filter(Boolean);
      if (fr.indexOf('color') >= 0 && countColor(g, p, c.color) === 0) return { ok: true, free: 'rule', coin: 0, opts: [{ L: 0, R: 0 }] };
      if (fr.indexOf('first') >= 0 && g.turn === 1 && g.phase === 'pick') return { ok: true, free: 'rule', coin: 0, opts: [{ L: 0, R: 0 }] };
      if (fr.indexOf('last') >= 0 && g.turn === 6 && g.phase === 'pick') return { ok: true, free: 'rule', coin: 0, opts: [{ L: 0, R: 0 }] };
    }
    if (useOly) {
      if (!olyReady(g, p)) return { ok: false, why: 'Free build already used this age' };
      return { ok: true, free: 'oly', coin: 0, opts: [{ L: 0, R: 0 }] };
    }
    const opts = payOptions(g, seat, c.res);
    if (!opts.length) return { ok: false, why: 'Not enough resources nearby', coin: c.coin, opts };
    const afford = opts.filter(o => o.L + o.R + c.coin <= p.coins);
    if (!afford.length) return { ok: false, why: 'Not enough coins', coin: c.coin, opts };
    return { ok: true, free: null, coin: c.coin, opts: afford };
  }
  function olyReady(g, p) { return g.ed === 1 && stageHas(g, p, 'free') && builtStages(g, p).some(s => s[1].free === 'age') && p.olyAge !== g.age; }
  function stageCost(g, seat) {
    const p = g.players[seat];
    const all = stagesOf(g, p);
    if (!p.side) return { ok: false, why: 'No wonder side yet' };
    if (p.stages >= all.length) return { ok: false, why: 'Wonder finished' };
    const st = all[p.stages];
    const opts = payOptions(g, seat, st[0]);
    if (!opts.length) return { ok: false, why: 'Not enough resources nearby', opts };
    const afford = opts.filter(o => o.L + o.R <= p.coins);
    if (!afford.length) return { ok: false, why: 'Not enough coins', opts };
    return { ok: true, coin: 0, opts: afford, stage: st };
  }

  // ------------------------------------------------------------------ setup
  // opts: {ed:1|2, n, names[], bots[] (null for a person, 'easy'|'medium'|'hard'), sides:'random'|'choose'|'A'|'B',
  //        wonders: optional array of wonder ids per seat, seed}
  function newGame(o) {
    const n = Math.max(3, Math.min(7, o.n | 0 || 3));
    const ed = o.ed === 2 ? 2 : 1;
    const st = { v: 1, ed, n, seed: (o.seed >>> 0) || 1, age: 1, turn: 1, phase: 'side', sides: o.sides || (ed === 2 ? 'choose' : 'random'),
      players: [], decks: {}, discard: [], log: [], last: null, pendingDiscard: -1, seventh: -1, result: null };
    const ws = Array.isArray(o.wonders) && o.wonders.length === n && new Set(o.wonders).size === n && o.wonders.every(w => WONDER_IDS.indexOf(w) >= 0)
      ? o.wonders.slice() : shuffle(st, WONDER_IDS.slice()).slice(0, n);
    for (let i = 0; i < n; i++) {
      const bot = o.bots && o.bots[i] ? o.bots[i] : null;
      st.players.push({ name: String((o.names && o.names[i]) || ('Player ' + (i + 1))).slice(0, 24), bot,
        wonder: ws[i], side: null, stages: 0, city: [], coins: 3, mil: [], hand: [], pick: null, olyAge: 0 });
    }
    // decks for all three ages, shuffled now (Age III gets players + 2 random guilds)
    for (const age of [1, 2, 3]) {
      const d = Cards.ageDeck(ed, age, n);
      if (age === 3) d.push.apply(d, shuffle(st, Cards.guilds(ed)).slice(0, n + 2));
      st.decks[age] = shuffle(st, d);
    }
    for (const p of st.players) {
      if (st.sides === 'A' || st.sides === 'B') p.side = st.sides;
      else if (st.sides === 'random') p.side = rnd(st) < 0.5 ? 'A' : 'B';
    }
    advance(st);
    return st;
  }
  function deal(st) {
    const d = st.decks[st.age];
    for (let i = 0; i < st.n; i++) st.players[i].hand = d.slice(i * 7, i * 7 + 7);
    st.decks[st.age] = [];
    st.turn = 1;
    st.phase = 'pick';
  }

  // ------------------------------------------------------------------ who must act
  function toAct(st) {
    if (st.phase === 'side') return st.players.map((p, i) => (!p.side ? i : -1)).filter(i => i >= 0 && !st.players[i].bot);
    if (st.phase === 'pick') return st.players.map((p, i) => (!p.pick ? i : -1)).filter(i => i >= 0 && !st.players[i].bot);
    if (st.phase === 'seventh') return st.players[st.seventh].bot ? [] : [st.seventh];
    if (st.phase === 'discard') return st.players[st.pendingDiscard].bot ? [] : [st.pendingDiscard];
    return [];
  }
  // seats whose input is awaited, people or computers (for "waiting for…" displays)
  function waitingFor(st) {
    if (st.phase === 'side') return st.players.map((p, i) => (!p.side ? i : -1)).filter(i => i >= 0);
    if (st.phase === 'pick') return st.players.map((p, i) => (!p.pick ? i : -1)).filter(i => i >= 0);
    if (st.phase === 'seventh') return [st.seventh];
    if (st.phase === 'discard') return [st.pendingDiscard];
    return [];
  }

  // ------------------------------------------------------------------ validating a pick
  // action: {t:'build', i, pay:{L,R}?, oly:bool} | {t:'wonder', i, pay} | {t:'sell', i} |
  //         {t:'side', side:'A'|'B'} | {t:'discard', id|null}
  function check(st, seat, a) {
    const p = st.players[seat];
    if (!a || typeof a !== 'object') throw new Error('Bad move');
    if (a.t === 'side') {
      if (st.phase !== 'side' || p.side) throw new Error('Not choosing sides now');
      if (a.side !== 'A' && a.side !== 'B') throw new Error('Pick side A or B');
      return { t: 'side', side: a.side };
    }
    if (a.t === 'discard') {
      if (st.phase !== 'discard' || st.pendingDiscard !== seat) throw new Error('Not your free build');
      if (a.id == null) return { t: 'discard', id: null };
      if (st.discard.indexOf(a.id) < 0) throw new Error('That card is not in the discard pile');
      if (hasName(st, p, card(st, a.id).name)) throw new Error('You already have one');
      return { t: 'discard', id: a.id };
    }
    const okPhase = st.phase === 'pick' ? !p.pick : st.phase === 'seventh' && st.seventh === seat;
    if (!okPhase) throw new Error('Not your turn');
    const i = a.i | 0;
    if (!(i >= 0 && i < p.hand.length) || a.i !== i) throw new Error('No such card');
    const id = p.hand[i];
    if (a.t === 'sell') return { t: 'sell', i, id };
    let info;
    if (a.t === 'build') info = buildCost(st, seat, id, !!a.oly);
    else if (a.t === 'wonder') info = stageCost(st, seat);
    else throw new Error('Unknown move');
    if (!info.ok) throw new Error(info.why || 'Can’t do that');
    let pay = info.opts[0];
    if (a.pay && typeof a.pay === 'object') {
      const m = info.opts.find(o => o.L === (a.pay.L | 0) && o.R === (a.pay.R | 0));
      if (!m) throw new Error('That payment doesn’t work');
      pay = m;
    }
    return { t: a.t, i, id, pay: { L: pay.L, R: pay.R }, coin: info.coin || 0, free: info.free || null };
  }

  // ------------------------------------------------------------------ apply
  function apply(state, seat, action) {
    const st = clone(state);
    if (st.phase === 'over') throw new Error('The game is over');
    const p = st.players[seat];
    if (!p) throw new Error('No such seat');
    const a = check(st, seat, action);
    if (a.t === 'side') p.side = a.side;
    else if (a.t === 'discard') doDiscardBuild(st, seat, a.id);
    else if (st.phase === 'seventh') { resolve(st, [[seat, a]]); finishAge(st); }
    else p.pick = a;
    advance(st);
    return st;
  }

  // Bots that sit in the game (chosen before the start) are answered here, then the game moves on
  // until a person has to act.
  let BOT = null; // set by bots.js: function(st, seat, kind) -> action
  function setBot(fn) { BOT = fn; }
  function advance(st) {
    for (let guard = 0; guard < 500; guard++) {
      if (st.phase === 'over') return;
      if (st.phase === 'side') {
        for (let i = 0; i < st.n; i++) {
          const p = st.players[i];
          if (!p.side && p.bot) p.side = BOT ? BOT(st, i, 'side').side : 'A';
        }
        if (st.players.every(p => p.side)) { deal(st); continue; }
        return;
      }
      if (st.phase === 'pick') {
        for (let i = 0; i < st.n; i++) {
          const p = st.players[i];
          if (!p.pick && p.bot) p.pick = botPick(st, i);
        }
        if (!st.players.every(p => p.pick)) return;
        const picks = st.players.map((p, i) => [i, p.pick]);
        st.players.forEach(p => { p.pick = null; });
        afterTurn(st, resolve(st, picks));
        continue;
      }
      if (st.phase === 'seventh') {
        const p = st.players[st.seventh];
        if (!p.bot) return;
        resolve(st, [[st.seventh, botPick(st, st.seventh)]]);
        finishAge(st);
        continue;
      }
      if (st.phase === 'discard') {
        const p = st.players[st.pendingDiscard];
        if (!p.bot) return;
        doDiscardBuild(st, st.pendingDiscard, BOT ? BOT(st, st.pendingDiscard, 'discard').id : null);
        continue;
      }
      return;
    }
  }

  function botPick(st, i) {
    try { if (BOT) return check(st, i, BOT(st, i, 'pick')); } catch (e) { /* a bot slip falls back to selling */ }
    return check(st, i, { t: 'sell', i: 0 });
  }

  // Resolve picks together. picks: [[seat, checkedAction]]
  function resolve(st, picks) {
    const moves = [];
    // 1. pay (using coins held at the start of the turn)
    const gain = new Array(st.n).fill(0);
    for (const [s, a] of picks) {
      const p = st.players[s];
      if (a.t === 'sell') continue;
      const out = (a.coin || 0) + a.pay.L + a.pay.R;
      if (out > p.coins) throw new Error('Not enough coins');
      p.coins -= out;
      gain[left(st, s)] += a.pay.L;
      gain[right(st, s)] += a.pay.R;
    }
    // 2. place the cards
    const halik = [];
    for (const [s, a] of picks) {
      const p = st.players[s];
      p.hand.splice(a.i, 1);
      if (a.t === 'sell') { st.discard.push(a.id); gain[s] += 3; moves.push({ s, t: 'sell' }); }
      else if (a.t === 'build') {
        p.city.push(a.id);
        if (a.free === 'oly') p.olyAge = st.age;
        moves.push({ s, t: 'build', id: a.id, pay: a.pay, coin: a.coin, free: a.free });
      } else {
        const stg = stagesOf(st, p)[p.stages];
        p.stages++;
        if (stg[1].coins) gain[s] += stg[1].coins;
        if (stg[1].discard) halik.push(s);
        moves.push({ s, t: 'wonder', stage: p.stages, pay: a.pay });
      }
    }
    // 3. coin effects, counted after every card is down
    for (const [s, a] of picks) if (a.t === 'build') gain[s] += coinsFrom(st, s, a.id);
    st.players.forEach((p, i) => { p.coins += gain[i]; });
    moves.forEach(m => { m.gain = gain[m.s]; });
    const turn = st.phase === 'seventh' ? 7 : st.turn;
    st.log.push({ age: st.age, turn, moves });
    st.last = { age: st.age, turn, moves };
    return halik;
  }
  function coinsFrom(st, s, id) {
    const c = card(st, id);
    const p = st.players[s];
    let g = c.e.coins || 0;
    if (c.color === 'yellow' && c.e.per) {
      for (const pe of c.e.per) {
        if (!pe.coin) continue;
        g += pe.coin * countFor(st, s, pe);
      }
    }
    void p;
    return g;
  }
  function countFor(st, s, pe) {
    const who = [];
    if (pe.who.indexOf('S') >= 0) who.push(s);
    if (pe.who.indexOf('N') >= 0) who.push(left(st, s), right(st, s));
    let n = 0;
    for (const w of who) {
      const q = st.players[w];
      if (pe.of === 'stage') n += q.stages;
      else if (pe.of === 'defeat') n += q.mil.filter(x => x < 0).length;
      else n += countColor(st, q, pe.of);
    }
    return n;
  }

  // After a normal turn: Halikarnassos' free build (end of that turn), then pass the hands.
  // After the 6th turn: Babylon's 7th card, then the last cards are discarded, then Halikarnassos
  // (it may take one of those discarded cards), then military.
  function afterTurn(st, halik) {
    if (st.turn < 6) {
      if (halik.length && discardChoices(st, halik[0]).length) { st.pendingDiscard = halik[0]; st.phase = 'discard'; return; }
      passHands(st);
      return;
    }
    st.halikAfter = halik;
    const sev = st.players.findIndex(p => stageHas(st, p, 'seventh') && p.hand.length === 1);
    if (sev >= 0) { st.seventh = sev; st.phase = 'seventh'; return; }
    finishAge(st);
  }
  function finishAge(st) {
    st.seventh = -1;
    for (const p of st.players) { while (p.hand.length) st.discard.push(p.hand.pop()); }
    const h = st.halikAfter || [];
    st.halikAfter = null;
    if (h.length && discardChoices(st, h[0]).length) { st.pendingDiscard = h[0]; st.phase = 'discard'; return; }
    endAge(st);
  }
  function passHands(st) {
    const hs = st.players.map(p => p.hand);
    const dirLeft = st.age !== 2;
    for (let i = 0; i < st.n; i++) {
      const from = dirLeft ? right(st, i) : left(st, i); // passing left: I receive from my right
      st.players[i].hand = hs[from];
    }
    st.turn++;
    st.phase = 'pick';
  }
  function discardChoices(st, seat) {
    const p = st.players[seat];
    const seen = new Set();
    return st.discard.filter(id => {
      const c = card(st, id);
      if (hasName(st, p, c.name) || seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }
  function doDiscardBuild(st, seat, id) {
    if (id != null) {
      const k = st.discard.indexOf(id);
      if (k >= 0) {
        st.discard.splice(k, 1);
        const p = st.players[seat];
        p.city.push(id);
        const g = coinsFrom(st, seat, id);
        p.coins += g;
        const mv = { s: seat, t: 'build', id, pay: { L: 0, R: 0 }, coin: 0, free: 'discard', gain: g };
        if (st.last) st.last.moves.push(mv);
        if (st.log.length) st.log[st.log.length - 1].moves.push(mv);
      }
    }
    finishDiscard(st);
  }
  function finishDiscard(st) {
    st.pendingDiscard = -1;
    if (st.turn < 6) { passHands(st); return; }
    endAge(st);
  }
  function endAge(st) {
    // military
    const sh = st.players.map(p => shields(st, p));
    const win = { 1: 1, 2: 3, 3: 5 }[st.age];
    const war = [];
    for (let i = 0; i < st.n; i++) {
      for (const j of [left(st, i), right(st, i)]) {
        if (sh[i] > sh[j]) { st.players[i].mil.push(win); war.push({ s: i, vs: j, v: win }); }
        else if (sh[i] < sh[j]) { st.players[i].mil.push(-1); war.push({ s: i, vs: j, v: -1 }); }
      }
    }
    st.wars = st.wars || [];
    st.wars.push({ age: st.age, shields: sh, tokens: war });
    if (st.age === 3) { st.phase = 'over'; st.result = scoreAll(st); return; }
    st.age++;
    deal(st);
  }

  // ------------------------------------------------------------------ scoring
  function guildPoints(st, s, c, defeats) {
    let v = 0;
    if (c.e.per) for (const pe of c.e.per) if (pe.vp) v += pe.vp * (pe.of === 'defeat' ? defeats(s, pe) : countFor(st, s, pe));
    if (c.e.deco) { const p = st.players[s]; if (p.stages >= stagesOf(st, p).length && p.stages > 0) v += c.e.deco; }
    return v;
  }
  function scoreOne(st, s) {
    const p = st.players[s];
    const r = { military: 0, coins: 0, wonder: 0, civil: 0, science: 0, commerce: 0, guilds: 0, total: 0, sci: null, copied: null };
    r.military = p.mil.reduce((a, b) => a + b, 0);
    r.coins = Math.floor(p.coins / 3);
    for (const stg of builtStages(st, p)) r.wonder += stg[1].vp || 0;
    const defeats = (who, pe) => countFor(st, who, pe);
    for (const id of p.city) {
      const c = card(st, id);
      if (c.color === 'blue') r.civil += c.e.vp || 0;
      if (c.color === 'yellow' && c.e.per) for (const pe of c.e.per) if (pe.vp) r.commerce += pe.vp * countFor(st, s, pe);
      if (c.color === 'purple') r.guilds += guildPoints(st, s, c, defeats);
    }
    const sy = sciSymbols(st, p);
    const base = sciBest(sy.c, sy.wild);
    r.science = base.pts; r.sci = { c: sy.c, wild: sy.wild, add: base.add };
    // Olympia B (1st ed): copy the best guild from a neighbour, chosen at the end
    if (stageHas(st, p, 'copy')) {
      let best = null;
      const mine = new Set(p.city.map(id => card(st, id).name));
      for (const nb of [left(st, s), right(st, s)]) {
        for (const id of st.players[nb].city) {
          const c = card(st, id);
          if (c.color !== 'purple' || mine.has(c.name)) continue;
          let gain;
          if (c.e.wild) gain = sciBest(sy.c, sy.wild + 1).pts - base.pts;
          else gain = guildPoints(st, s, c, defeats);
          if (!best || gain > best.gain) best = { id, gain, wild: !!c.e.wild };
        }
      }
      if (best) {
        r.copied = best.id;
        if (best.wild) { const b2 = sciBest(sy.c, sy.wild + 1); r.science = b2.pts; r.sci = { c: sy.c, wild: sy.wild + 1, add: b2.add }; }
        else r.guilds += best.gain;
      }
    }
    r.total = r.military + r.coins + r.wonder + r.civil + r.science + r.commerce + r.guilds;
    return r;
  }
  function scoreAll(st) {
    const scores = st.players.map((p, i) => scoreOne(st, i));
    // winner: most points, then most coins; a tie on both is shared
    let best = null;
    scores.forEach((r, i) => {
      const k = [r.total, st.players[i].coins];
      if (!best || k[0] > best[0] || (k[0] === best[0] && k[1] > best[1])) best = k;
    });
    const winners = scores.map((r, i) => i).filter(i => scores[i].total === best[0] && st.players[i].coins === best[1]);
    return { scores, winners };
  }

  // ------------------------------------------------------------------ views
  function publicPlayer(st, p, i) {
    return { name: p.name, bot: p.bot, wonder: p.wonder, side: p.side, stages: p.stages, city: p.city.slice(), coins: p.coins,
      mil: p.mil.slice(), hand: p.hand.length, picked: !!p.pick, sideChosen: !!p.side, shields: shields(st, p), olyAge: p.olyAge, seat: i };
  }
  function view(st, seat) {
    const v = {
      ed: st.ed, n: st.n, age: st.age, turn: st.turn, phase: st.phase, sides: st.sides,
      players: st.players.map((p, i) => publicPlayer(st, p, i)),
      discardCount: st.discard.length, last: st.last, log: st.log, wars: st.wars || [],
      seventh: st.seventh, pendingDiscard: st.pendingDiscard, waiting: waitingFor(st), result: st.result,
      guildsInAge3: st.n + 2,
    };
    if (seat >= 0 && seat < st.n) {
      const p = st.players[seat];
      v.seat = seat;
      v.hand = p.hand.slice();
      v.pick = p.pick ? { t: p.pick.t, i: p.pick.i, id: p.pick.id } : null;
      v.discardPile = st.pendingDiscard === seat && st.phase === 'discard' ? discardChoices(st, seat) : null;
    }
    return v;
  }
  function isOver(st) { return st.phase === 'over'; }

  // Legal choices for a seat in a view or state (cities are public, the hand is the seat's own).
  function options(g, seat, hand) {
    const out = [];
    const p = g.players[seat];
    const sc = stageCost(g, seat);
    hand.forEach((id, i) => {
      const b = buildCost(g, seat, id, false);
      const o = { i, id, build: b, wonder: sc };
      if (!b.ok && olyReady(g, p) && !hasName(g, p, card(g, id).name)) o.oly = true;
      out.push(o);
    });
    return out;
  }

  return {
    newGame, toAct, waitingFor, apply, view, isOver, check, advance, setBot, options,
    payOptions, buildCost, stageCost, olyReady, discardChoices,
    shields, sciSymbols, sciScore, sciBest, scoreOne, scoreAll, countFor, coinsFrom, prices, slots,
    left, right, card, stagesOf, builtStages, hasName, countColor, stageHas, wonderOf, clone, rnd, shuffle,
  };
});
