/* The 7 Wonders engine as the shared online module's `game` object (see _online/README.md).
   Computers chosen before the start are answered inside the engine (fewer Firestore writes);
   game.bot only covers a seat handed to a computer mid-game. publicView never holds anyone's hand,
   the decks, the seed or the discard pile's contents. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./bots.js'));
  else root.SWOnlineGame = factory(root.SWEngine, root.SWBots);
})(typeof self !== 'undefined' ? self : this, function (E, Bots) {
  'use strict';
  const LEVELS = ['easy', 'medium', 'hard'];
  const game = {
    id: 'seven-wonders',
    minSeats: 3,
    maxSeats: 7,
    // options: {ed: 1|2, sides: 'random'|'choose'|'A'|'B', level: 'easy'|'medium'|'hard', leaders: bool}
    setup(nSeats, options, rng, seats) {
      const o = options || {};
      const level = LEVELS.indexOf(o.level) >= 0 ? o.level : 'medium';
      const n = Math.max(3, Math.min(7, nSeats | 0));
      const names = [], bots = [];
      for (let i = 0; i < n; i++) {
        const s = (seats && seats[i]) || { kind: 'computer' };
        bots.push(s.kind === 'computer' ? level : null);
        names.push(String(s.name || (s.kind === 'computer' ? 'Computer ' + (i + 1) : 'Player ' + (i + 1))).slice(0, 24));
      }
      const st = E.newGame({ ed: o.ed === 2 ? 2 : 1, n, names, bots, sides: ['random', 'choose', 'A', 'B'].indexOf(o.sides) >= 0 ? o.sides : undefined,
        seed: Math.floor(rng() * 4294967296) >>> 0, leaders: !!o.leaders });
      st.level = level;
      return st;
    },
    toAct(state) { return E.toAct(state); },
    apply(state, seat, action) { return E.apply(state, seat, action); },
    publicView(state) {
      const v = E.view(state, -1);
      v.level = state.level;
      return v;
    },
    privateView(state, seat) {
      const v = E.view(state, seat);
      const r = { hand: v.hand, pick: v.pick, discardPile: v.discardPile };
      if (v.lhand) r.lhand = v.lhand;
      return r;
    },
    // a seat handed to a computer mid-game
    bot(ctx, seat) {
      const st = ctx.state;
      const kind = ['side', 'discard', 'ldraft', 'recruit'].indexOf(st.phase) >= 0 ? st.phase : 'pick';
      return Bots.decide(st, seat, kind, st.level || 'medium');
    },
    isOver(state) { return E.isOver(state); },
  };
  // the screens use the same shape as SWEngine.view(state, seat)
  function viewFromSnap(snap) {
    const m = snap.mine || {};
    return Object.assign({}, snap.pub, { seat: snap.mySeat, hand: m.hand || [], pick: m.pick || null, discardPile: m.discardPile || null, lhand: m.lhand || null });
  }
  return { game, viewFromSnap };
});
