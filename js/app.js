/* 7 Wonders Lab: UI controller. One store object (localStorage 'sevenwonders:v1'), render*() functions
   writing template strings, one delegated click handler per view. The rules live in SWEngine; a "table"
   object is the seat transport (local state on this device, or an online room through js/online.js). */
(function () {
  'use strict';
  const VERSION = '1.0 · 2026-10-20';
  const E = SWEngine, Cd = SWCards, A = SWArt, Bt = SWBots, OG = SWOnlineGame;
  const KEY = 'sevenwonders:v1';
  let ME = 0;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SEAT_COL = ['#f0b354', '#6ea8fe', '#e98bd0', '#6ee7a8', '#c9a0ff', '#ff9f7a', '#7fe0e0'];
  const LEVEL_NOTE = { easy: 'Random cards', medium: 'Points guess', hard: 'Tuned + exact' };
  // Measured by tools/measure-levels.js (one computer vs the rest, seats rotated, 3/4/5/7 players), see progress.md.
  // 2026-10-20, 400 games per matchup and player count (1st edition): wins at 3/4/5/7 players.
  const STRENGTH_NOTE = { games: '6,400', hardMedium: '61% (78/67/58/40%)', mediumEasy: '62% (76/68/58/46%)', hardEasy: '85% (91/92/81/74%)', fair: '23% (33/25/20/14%)' };
  const AGE = ['', 'I', 'II', 'III'];

  // ------------------------------------------------------------------ storage
  function fresh() {
    return { v: 1, settings: { ed: 1, sides: 'default', level: 'medium', n: 4, values: false, odds: true, name: '' },
      game: null, last: null, online: false, score: null };
  }
  // raw: the saved JSON string; each section is checked, a bad one reset
  function load(raw) {
    try {
      const s = JSON.parse(raw);
      if (s && s.v === 1) {
        const out = Object.assign(fresh(), s, { settings: Object.assign(fresh().settings, s.settings || {}) });
        const st = out.settings, def = fresh().settings;
        st.ed = Number(st.ed); st.n = Number(st.n);
        // each section is checked on its own; a bad one is reset without touching the rest
        const L = out.last;
        const okLast = L && typeof L === 'object' && L.view && Array.isArray(L.view.players) && L.view.players.length >= 3 &&
          L.view.result && Array.isArray(L.view.result.scores) && L.view.result.scores.length === L.view.players.length &&
          L.view.result.scores.every(x => x && Number.isFinite(x.total)) &&
          Array.isArray(L.view.result.winners) && [1, 2].includes(L.view.ed) && Number.isInteger(L.me) && L.me >= 0 && L.me < L.view.players.length;
        if (!okLast) out.last = null;
        else L.dec = Array.isArray(L.dec) ? L.dec.filter(d => d && Number.isFinite(d.lost) && d.chose && d.best) : [];
        if (out.score != null && (typeof out.score !== 'object' || Array.isArray(out.score))) out.score = null;
        if (out.game != null && (typeof out.game !== 'object' || !out.game.state)) out.game = null;
        if (out.game && !Array.isArray(out.game.dec)) out.game.dec = [];
        if (out.game && !Array.isArray(out.game.undo)) out.game.undo = [];
        if (out.game && !Array.isArray(out.game.acts)) { out.game.acts = null; out.game.init = null; }
        if (out.last && !(out.last.init && typeof out.last.init === 'object' && Array.isArray(out.last.acts))) { out.last.init = null; out.last.acts = null; }
        if (![1, 2].includes(st.ed)) st.ed = def.ed;
        if (!['default', 'random', 'choose', 'A', 'B'].includes(st.sides)) st.sides = def.sides;
        if (!['easy', 'medium', 'hard'].includes(st.level)) st.level = def.level;
        if (!(st.n >= 3 && st.n <= 7)) st.n = def.n;
        st.values = !!st.values; st.odds = st.odds !== false;
        if (typeof st.name !== 'string') st.name = '';
        return out;
      }
    } catch (e) { /* bad JSON: start fresh */ }
    return fresh();
  }
  const store = (function () {
    try { return load(localStorage.getItem(KEY)); } catch (e) { return fresh(); }  // private mode: start fresh
  })();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage full or blocked: keep playing */ }
  }

  // ------------------------------------------------------------------ tables (seat transport)
  function LocalTable(g) { this.g = g; }
  LocalTable.prototype.view = function () { return E.view(this.g.state, ME); };
  LocalTable.prototype.act = function (a) { this.g.state = E.apply(this.g.state, ME, a); save(); return Promise.resolve({ ok: true }); };
  function OnlineTable() { this.online = true; }
  OnlineTable.prototype.view = function () { return OG.viewFromSnap(net.snap); };
  OnlineTable.prototype.act = function (a) { return net.room.act(a); };

  let table = null;
  if (store.game && store.game.state) {
    try { table = new LocalTable(store.game); table.view(); } catch (e) { table = null; store.game = null; save(); }
  }

  const net = { room: null, snap: null, busy: false, connecting: false, savedLast: false };
  function loadOnline() {
    if (net.room) return Promise.resolve(net.room);
    return import(new URL('js/online.js?v=1', location.href).href).then(mod => {
      if (net.room) return net.room;
      net.room = mod.createOnline({ game: OG.game, gameId: 'seven-wonders', botDelayMs: 700 });
      net.room.on('change', onNet);
      net.room.on('error', msg => { net.busy = false; toast(String(msg)); if (ui.tab === 'play') renderPlay(); });
      return net.room;
    });
  }
  // the same game open in a second tab: whichever tab moved last is saved, so the other one catches up
  window.addEventListener('storage', e => {
    if (e.key !== KEY && e.key !== null) return;
    const n = load(e.newValue);
    const wasGame = !!table && !table.online;
    store.settings = n.settings; store.last = n.last; store.score = n.score;
    if (table && table.online) return;
    store.game = n.game;
    table = store.game && store.game.state ? new LocalTable(store.game) : null;
    try { if (table) table.view(); } catch (err) { table = null; store.game = null; }
    if (table && !wasGame) guard('game');
    resetSel(); ui.prevKey = ''; ui.prevCities = null; ui.fx.prev = null;
    closeSheet(true);
    render();
  });
  function backToLocal() { ME = 0; net.savedLast = false; table = store.game && store.game.state ? new LocalTable(store.game) : null; }
  function onNet(snap) {
    net.snap = snap;
    net.busy = false;
    if (snap.status === 'playing' || snap.status === 'finished') {
      if (!table || !table.online) { table = new OnlineTable(); resetSel(); net.savedLast = false; ui.dec = []; guard('game'); ui.fx.prev = Sfx.empty((snap.pub && snap.pub.n) || 0); }
      ME = snap.mySeat >= 0 ? snap.mySeat : 0;
      // off the Play tab the game still sounds (the screen catches up when you come back)
      if (ui.tab !== 'play') { try { const v = table.view(); fxRun(fxStep(v, v.waiting.indexOf(ME) >= 0 && !(v.phase === 'pick' && v.pick))); } catch (e) { /* ignore */ } }
      if (snap.status === 'finished' && snap.pub && !net.savedLast) { net.savedLast = true; saveLast(table.view(), ui.dec || []); }
    } else if (table && table.online) backToLocal();
    if (snap.status === 'closed' || snap.status === 'left') {
      store.online = false; save();
      if (snap.status === 'closed') toast('The room was closed');
    }
    if (ui.tab === 'play') renderPlay();
  }
  function leaveOnline() {
    const r = net.room;
    store.online = false; ui.online = false; save();
    backToLocal(); resetSel();
    if (r) r.leave().catch(() => {});
    renderPlay();
  }

  // ------------------------------------------------------------------ ui state
  const ui = { tab: 'play', online: false, sel: -1, pay: 0, hint: null, prevKey: '', prevCities: null, dec: [], oddsTab: 'cards', oddsN: 4, oddsAge: 1, draftSort: 'win', sci: [0, 0, 0, 0], mil: null,
    fx: { prev: null, land: 0 } };
  function resetSel() { ui.sel = -1; ui.pay = 0; ui.hint = null; ui.fanSel = -1; }

  // ------------------------------------------------------------------ sounds + effects (js/fx.js, js/sfx.js)
  const FX = window.FX, Sfx = window.SWSfx;
  FX.init({ game: 'seven-wonders' });
  Sfx.setup(FX);
  function fxBody() {
    const s = FX.settings;
    document.body.classList.toggle('fx-noanim', !s.animations);
    document.body.classList.toggle('fx-fast', s.animSpeed === 'fast');
  }
  FX.onChange(fxBody); fxBody();
  const fxSp = () => (FX.settings.animSpeed === 'fast' ? 0.55 : 1);
  function fxFind(t) {
    if (ui.tab !== 'play' || !t) return null;
    if (t === 'coin') return $('#game [data-fx="coin"]');
    if (t === 'coinNum') return $('#game [data-fx="coin"] b');
    if (t === 'shield') return $('#game [data-fx="shield"]');
    if (t === 'stage') { const b = document.querySelectorAll('#game .me .stg.built'); return b[b.length - 1] || null; }
    if (t === 'age' || t === 'hand') return $('#game .hand');
    if (t === 'act') return $('#game .act');
    if (t.startsWith('nbcoin:')) return $('#game .nb[data-city="' + t.slice(7) + '"] .r');
    if (t.startsWith('nb:')) return $('#game .nb[data-city="' + t.slice(3) + '"]');
    return null;
  }
  const fxHooks = {
    // the passed hand slides in from the neighbour it came from
    slide(s) {
      const el = fxFind('hand');
      if (!el || !FX.settings.animations || !el.animate) return;
      try { el.animate([{ transform: 'translateX(' + (s.dir * 36) + 'px)' }, { transform: 'none' }], { duration: Math.round(300 * fxSp()), easing: 'ease-out' }); } catch (e) { /* ignore */ }
    },
    // end of game: each score row counts up in turn
    scores() {
      const rows = Array.from(document.querySelectorAll('#v-play table.sc tbody tr'));
      rows.forEach((tr, r) => setTimeout(() => {
        FX.play('tick', { cat: 'moves', pitch: 1 + r * 0.06 });
        tr.querySelectorAll('td[data-v]').forEach(td => FX.countUp(td, 0, Number(td.dataset.v), { duration: 400 }));
      }, Math.round(r * 220 * fxSp())));
    },
  };
  function fxStep(v, toAct) {
    const pl = Sfx.plan(ui.fx.prev, v, ME, { toAct, land: ui.fx.land, fast: FX.settings.animSpeed === 'fast', online: !!(table && table.online),
      colors: [SEAT_COL[ME], '#f0b354', '#6ea8fe', '#6ee7a8', '#e8eaf0'] });
    ui.fx.prev = pl.next; ui.fx.land = 0;
    if (!FX.settings.animations) { pl.handDelay = 0; pl.land = 0; }
    return pl;
  }
  const fxRun = pl => Sfx.run(pl, FX, fxFind, fxHooks);
  // your card flies from the hand to where it goes; returns the flight time the reveal sounds wait for
  function fxFly(k, kind) {
    if (!FX.settings.animations) return 0;
    const c = $('#game .hand [data-pick="' + k + '"]');
    // build: onto your city stacks; wonder: tucked under the next stage box; sell: face down onto the discard pile
    const to = kind === 'wonder' ? $('#game .me .stg.next') : kind === 'sell' ? ($('#game .discard') || $('#game [data-fx="coin"]')) : $('#game .me .citycards');
    if (!c || !to) return 0;
    FX.flyTo(c, to, { duration: Math.round(Sfx.LAND * fxSp()), fade: kind === 'sell' });
    return Sfx.LAND;
  }

  // ------------------------------------------------------------------ helpers
  const qBtn = text => '<button class="q" data-q="' + esc(text) + '" aria-label="Why?">?</button>';
  function heat(x, lo, hi) { const f = Math.max(0, Math.min(1, (x - lo) / (hi - lo))); return 'hsl(' + Math.round(f * 130) + ', 70%, 62%)'; }
  const cap = s => s[0].toUpperCase() + s.slice(1);
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
  function confirmBox(msg, yes, onYes) {
    const back = document.createElement('div');
    back.className = 'confirm-back';
    back.innerHTML = '<div class="panel"><p style="margin:0 0 14px">' + esc(msg) + '</p><div class="row" style="justify-content:flex-end">' +
      '<button class="btn ghost" data-c="no">Cancel</button><button class="btn primary" data-c="yes">' + esc(yes) + '</button></div></div>';
    back.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (e.target === back || b) { back.remove(); if (b && b.dataset.c === 'yes') onYes(); }
    });
    document.body.appendChild(back);
  }
  // History: Back closes a sheet, leaves the lobby for setup, and never leaves the site mid-game.
  // Entries carry g: 'game' | 'lobby' for the layer they belong to, and sheet: 1 while a sheet is open.
  function hist(state) { try { history.pushState(state, '', '#' + state.tab); } catch (e) { /* file:// */ } }
  function layer() { return table ? 'game' : ui.online ? 'lobby' : undefined; }
  function guard(g) { const h = history.state || {}; if (h.g !== g || h.sheet) hist({ tab: 'play', g }); }
  function sheet(title, html) {
    const had = !!$('#sheet');
    closeSheet(true);
    if (!had) hist(Object.assign({ tab: ui.tab }, history.state || {}, { sheet: 1 }));
    const back = document.createElement('div');
    back.className = 'sheet-back'; back.id = 'sheet';
    back.innerHTML = '<div class="sheet"><div class="row"><h3 class="grow">' + esc(title) + '</h3><button class="btn small ghost" data-close>Close</button></div><div class="scroll">' + html + '</div></div>';
    back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-close]')) closeSheet(); });
    document.body.appendChild(back);
  }
  function closeSheet(quiet) {
    const s = $('#sheet');
    if (!s) return;
    s.remove();
    if (!quiet && history.state && history.state.sheet) try { history.back(); } catch (e) { /* ignore */ }
  }
  const card = (g, id) => E.card(g, id);
  const nameOf = (v, s) => (s === ME ? 'You' : v.players[s].name);
  const wname = (v, p) => Cd.EDITIONS[v.ed].wonders[p.wonder].name;

  // ------------------------------------------------------------------ tabs + help bubbles
  $('#brand').insertAdjacentHTML('afterbegin', A.ICON);
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab, true); });
  function showTab(tab, push) {
    ui.tab = tab;
    closeSheet(true);
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + tab));
    if (push) hist({ tab, g: layer() });
    render();
  }
  window.addEventListener('popstate', e => {
    const s = e.state || { tab: 'play' };
    if (ui.skipPop) { ui.skipPop = false; return; }   // our own step back after a rules sheet or My stats closed by hand
    if ((window.COACH && COACH.rulesOpen()) || (window.Profile && window.Profile.isOpen())) { closeOverlays(); if (s.tab === ui.tab) return; }
    if ($('#sheet')) { closeSheet(true); if (s.tab === ui.tab) return; }
    if (table && !s.g) { guard('game'); showTab('play', false); return; }  // mid-game: Back stays in the game
    if (!table && ui.online && !s.g) {
      const st = net.snap && net.snap.status;
      if (st === 'lobby' || st === 'joining') { guard('lobby'); showTab('play', false); confirmBox('Leave this room?', 'Leave', leaveOnline); return; }
      ui.online = false;
    }
    showTab(s.tab || 'play', false);
  });
  document.addEventListener('click', e => {
    const old = $('.pop');
    const q = e.target.closest('[data-q]');
    if (old) old.remove();
    if (!q || (old && old.dataset.for === q.dataset.q)) return;
    const pop = document.createElement('div');
    pop.className = 'pop'; pop.textContent = q.dataset.q; pop.dataset.for = q.dataset.q;
    document.body.appendChild(pop);
    const r = q.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const x = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
    let y = r.bottom + 8;
    if (y + h > window.innerHeight - 8) y = r.top - h - 8;
    pop.style.left = x + 'px'; pop.style.top = Math.max(8, y) + 'px';
  });
  // a saved section that still breaks its screen is reset on its own (the rest of the save is kept)
  function safely(fn, reset) {
    try { fn(); } catch (e) { reset(); save(); fn(); }
  }
  function render() {
    if (ui.tab === 'play') renderPlay();
    else if (ui.tab === 'score') safely(renderScore, () => { store.score = null; });
    else if (ui.tab === 'odds') renderOdds();
    else if (ui.tab === 'study') safely(renderStudy, () => { store.last = null; });
    else renderSettings();
  }

  // ================================================================== PLAY
  const vPlay = $('#v-play');
  function renderPlay() { vPlay.classList.remove('ingame'); if (table) renderGame(); else if (ui.online) renderOnline(); else renderSetup(); }

  function strengthText() {
    const S = STRENGTH_NOTE;
    if (!S) return 'Easy plays a random legal card. Medium guesses each card\'s points. Hard uses weights tuned by self-play, counts exact points in Age III and keeps good cards from the next player.';
    return 'Measured over ' + S.games + ' simulated games (one computer against the others, 3–7 players): ' +
      'Hard wins ' + S.hardMedium + ' against Medium players, Medium wins ' + S.mediumEasy + ' against Easy, Hard wins ' + S.hardEasy + ' against Easy, at 3/4/5/7 players. A fair share would be ' + S.fair + '.';
  }
  function renderSetup() {
    const s = store.settings;
    vPlay.innerHTML = '<div class="setup home">' +
      '<div class="hero">' + A.ICON + '<div><h1>7 Wonders Lab</h1><p>Draft against measured computers, with live odds.</p></div></div>' +
      '<div class="panel">' +
      '<div class="label">Players</div><div class="seg" data-set="n">' + [3, 4, 5, 6, 7].map(n => '<button aria-pressed="' + (s.n === n) + '" data-v="' + n + '">' + n + '</button>').join('') + '</div>' +
      '<div class="row"><span class="label grow">Computers</span>' + qBtn(strengthText()) + '</div>' +
      '<div class="seg" data-set="level">' + ['easy', 'medium', 'hard'].map(l => '<button aria-pressed="' + (s.level === l) + '" data-v="' + l + '">' + cap(l) + '<small>' + LEVEL_NOTE[l] + '</small></button>').join('') + '</div>' +
      '<button class="btn primary" data-start style="width:100%">Deal</button>' +
      '<button class="btn" data-on="open" style="width:100%">Play online</button>' +
      (SP || SC ? '<div class="row">' + (SP ? '<button class="btn small grow" data-daily>' + (dailyDone() ? 'Daily ✓' : 'Daily') + '</button>' : '') +
        (SC ? '<button class="btn small grow" data-rules>Rules</button>' : '') + (SP ? '<button class="btn small grow" data-stats>My stats</button>' : '') + '</div>' : '') +
      '<p class="muted small" style="margin:0">' + (s.ed === 1 ? '1st' : '2nd') + ' edition · sides ' + esc(sidesWord()) + ' · change in Settings</p>' +
      '</div>' +
      (store.last ? '<button class="btn ghost" data-go="study">Study your last game</button>' : '') +
      '<details class="panel" style="gap:6px"><summary style="cursor:pointer;font-weight:650">How 7 Wonders works</summary>' +
      '<p class="muted" style="margin:8px 0 0;font-size:13.5px">Three ages, six turns each. Everyone picks one card from their hand at the same time, then passes the rest on. ' +
      'A card can be built (pay its cost, buying missing resources from your two neighbours for 2 coins each), used to build the next stage of your wonder, or sold for 3 coins. ' +
      'At the end of each age you fight both neighbours with shields. Most points after Age III wins; ties go to the most coins.</p></details>' +
      '</div>';
  }
  function sidesWord() {
    const s = store.settings.sides;
    if (s === 'default') return store.settings.ed === 1 ? 'random' : 'chosen';
    return s === 'choose' ? 'chosen' : s === 'random' ? 'random' : s + ' only';
  }
  function sidesOpt() { const s = store.settings.sides; return s === 'default' ? undefined : s; }
  // opt (all optional): { n, level, ed, sides, seed, daily: 'YYYY-MM-DD', tutorial: true }; the rest from Settings.
  // The game keeps how it was dealt (init) and your actions (acts), so Study can replay it turn by turn.
  function startGame(opt) {
    const o = opt || {}, s = store.settings;
    const n = o.n || s.n, level = o.level || s.level;
    if (window.COACH && COACH.closeOffer) COACH.closeOffer();   // the guided-game offer never stays over a game
    const names = ['You'];
    const bots = [null];
    for (let i = 1; i < n; i++) { names.push('Computer ' + i); bots.push(level); }
    const init = { ed: o.ed || s.ed, n, names, bots, sides: o.sides || sidesOpt(), seed: o.seed != null ? o.seed >>> 0 : (Math.random() * 4294967296) >>> 0 };
    if (init.sides === undefined) delete init.sides;
    const st = E.newGame(JSON.parse(JSON.stringify(init)));
    store.game = { state: st, dec: [], undo: [], init, acts: [], level, helped: false, recorded: false, finished: false, daily: o.daily || null, tutorial: !!o.tutorial };
    save();
    table = new LocalTable(store.game);
    ME = 0; resetSel(); ui.prevKey = ''; ui.prevCities = null; ui.fx.prev = Sfx.empty(n);
    guard('game');
    renderPlay();
  }
  // a game whose result still has to go to My stats (left mid-game) is recorded before it is dropped
  function dropGame() {
    if (table && !table.online) recordGame();
    table = null; store.game = null; save(); resetSel();
  }

  // ---- Undo (games vs computers only; not in the Daily or the guided game). Undo takes back your last pick,
  // after which you have seen the next hand, so a game with Undo counts as "with help" in My stats.
  const UNDO_MAX = 6;
  function undoShown() { const g = store.game; return !!(table && !table.online && g && !g.daily && !g.tutorial); }
  function canUndo() { const g = store.game; return undoShown() && !!(g.undo && g.undo.length) && !g.finished; }
  function undo() {
    if (!canUndo()) return;
    const g = store.game, u = g.undo.pop();
    let st;
    try { st = JSON.parse(u.state); E.view(st, ME); } catch (e) { g.undo = []; save(); renderPlay(); return; }
    g.state = st; g.helped = true;
    g.dec.length = Math.min(g.dec.length, u.dec);
    if (g.acts) g.acts.length = Math.min(g.acts.length, u.acts);
    resetSel(); ui.prevKey = ''; ui.prevCities = null; ui.fx.prev = null;   // no sounds for cards going back
    save(); renderPlay();
  }

  // ---- My stats (js/profile.js + js/swprofile.js): one result per game vs computers. Leaving after your first
  // pick counts as a loss; hint, card values or Undo make it "with help" (not rated); the guided game never counts.
  const SP = window.SWProfile && window.Profile ? window.SWProfile : null;
  function recordGame() {
    const g = store.game;
    if (!SP || !g || !g.state || g.recorded || g.tutorial || !g.level || !g.init) return;
    g.recorded = true;
    try {
      const v = E.view(g.state, 0);
      if (v.phase !== 'over' && !(g.acts || []).some(a => a.t !== 'side')) { save(); return; } // dealt and left at once: not a game
      const p = v.players[0];
      const r = SP.result({ v, me: 0, level: g.level, helped: g.helped, daily: !!g.daily, stagesTotal: p.side ? E.stagesOf(v, p).length : 0 });
      if (g.daily) r.date = g.daily;   // a Daily finished after midnight still belongs to the day it was dealt
      window.Profile.recordResult(r);
    } catch (e) { /* the stats never stop the game */ }
    save();
  }
  function dailyDone() { try { return !!(window.Profile && window.Profile.daily.played()); } catch (e) { return false; } }
  function busyMsg() {
    if (table && table.online) return 'Leave the online room first';
    if (table && store.game && !store.game.finished) return 'Finish or quit this game first';
    return '';
  }
  function startDaily() {
    const P = window.Profile;
    if (!P || !SP) return;
    if (dailyDone()) { openStats('daily'); return; }
    const m = busyMsg(); if (m) { toast(m); return; }
    if (P.isOpen()) P.closePanel();
    if (table) dropGame();
    const day = P.daily.date(), D = SP.DAILY;
    if (ui.tab !== 'play') showTab('play', true);
    startGame({ daily: day, seed: P.daily.seed(day, 'seven-wonders-deal') >>> 0, n: D.n, level: D.level, ed: D.ed, sides: D.sides });
  }

  // ---- Rules sheet + guided first game (js/coach.js + js/swcoach.js)
  const SC = window.COACH && window.SWCoach ? window.SWCoach : null;
  function pushModal() { try { history.pushState(Object.assign({ tab: ui.tab }, history.state || {}, { sheet: 1 }), '', '#' + ui.tab); } catch (e) { /* file:// */ } }
  function modalClosedByHand() {
    if (history.state && history.state.sheet) { ui.skipPop = true; try { history.back(); } catch (e) { ui.skipPop = false; } }
  }
  function closeOverlays() {
    closeSheet(true);
    document.querySelectorAll('.confirm-back, .pop').forEach(el => el.remove());
    if (window.COACH && COACH.rulesOpen()) { ui.closingQuiet = true; COACH.closeRules(); ui.closingQuiet = false; }
    if (window.Profile && window.Profile.isOpen()) { ui.closingQuiet = true; window.Profile.closePanel(); ui.closingQuiet = false; }
  }
  const modalOpen = () => !!$('#sheet') || !!$('.confirm-back') || !!(window.COACH && COACH.rulesOpen()) || !!(window.Profile && window.Profile.isOpen());
  function openRules() {
    if (!SC) return;
    const had = history.state && history.state.sheet;
    closeOverlays();
    COACH.rules(Object.assign({}, SC.RULES, { onClose: () => { if (!ui.closingQuiet) modalClosedByHand(); } }));
    if (!had) pushModal();
  }
  function openStats(t) {
    if (!window.Profile) return;
    const had = history.state && history.state.sheet;
    closeOverlays();
    window.Profile.openPanel(t ? { tab: t } : undefined);
    if (window.Profile.isOpen() && !had) pushModal();
  }
  let tour = null;
  function startTutorial() {
    if (!tour) return;
    const m = busyMsg(); if (m && !(store.game && store.game.tutorial)) { toast(m); return; }
    if (table) dropGame();
    tour.reset();
    if (ui.tab !== 'play') showTab('play', true);
    const G = SC.GAME;
    startGame({ tutorial: true, seed: G.seed, n: G.n, level: G.level, ed: G.ed, sides: G.sides });
    tour.start(0);
  }
  function offerTutorial() {
    if (!SC || !tour || table || ui.online || ui.tab !== 'play' || COACH.offered(SC.ID)) return;
    setTimeout(() => {
      if (table || ui.online || ui.tab !== 'play' || modalOpen()) return;
      COACH.offer({ id: SC.ID, title: 'New to 7 Wonders?', text: 'Play one guided game against two Easy computers. Each age\'s scoring is explained as it happens.', yes: 'Teach me', no: 'No thanks', onYes: startTutorial });
    }, 600);
  }
  vPlay.addEventListener('click', e => {
    const t = e.target;
    const segB = t.closest('[data-set] button');
    if (segB) {
      const k = segB.parentElement.dataset.set;
      store.settings[k] = k === 'level' ? segB.dataset.v : Number(segB.dataset.v);
      save(); renderPlay(); return;
    }
    if (t.closest('[data-start]')) { startGame(); return; }
    if (t.closest('[data-daily]')) { startDaily(); return; }
    if (t.closest('[data-rules]')) { openRules(); return; }
    if (t.closest('[data-stats]')) { openStats(); return; }
    const go = t.closest('[data-go]');
    if (go) { showTab(go.dataset.go, true); return; }
    const on = t.closest('[data-on]');
    if (on) { onlineBtn(on.dataset.on); return; }
    const seat = t.closest('[data-seat]');
    if (seat && net.room) { net.room.setSeat(Number(seat.dataset.seat), seat.dataset.kind).then(r => { if (!r.ok) toast(r.message); }); return; }
    if (table) onGameClick(e);
  });

  // ------------------------------------------------------------------ online lobby
  async function onlineBtn(k) {
    if (k === 'open') { ui.online = true; guard('lobby'); renderPlay(); loadOnline().catch(() => toast('Online play couldn’t load. Check your internet.')); return; }
    if (k === 'back') {
      if (net.snap && net.snap.status === 'lobby') { confirmBox('Leave this room?', 'Leave', leaveOnline); return; }
      ui.online = false; renderPlay();
      if (history.state && history.state.g === 'lobby') try { history.back(); } catch (e) { /* ignore */ }
      return;
    }
    if (k === 'start') {
      if (net.connecting) return;
      net.connecting = true; renderPlay();
      const r = await net.room.start();
      net.connecting = false;
      if (!r.ok) toast(r.message);
      renderPlay(); return;
    }
    if (k !== 'create' && k !== 'join') return;
    const nameEl = $('#on-name');
    if (nameEl) { store.settings.name = nameEl.value.trim().slice(0, 20); save(); }
    const name = store.settings.name || 'Player';
    const codeEl = $('#on-code');
    const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
    if (k === 'join' && code.length !== 5) { toast('Room codes have 5 letters'); return; }
    if (net.connecting) return;
    net.connecting = true; renderPlay();
    let r;
    try {
      const room = await loadOnline();
      if (k === 'create') {
        const s = store.settings;
        const seats = ['human'].concat(new Array(s.n - 1).fill('empty'));
        r = await room.createRoom({ name, seats, options: { ed: s.ed, sides: sidesOpt() || (s.ed === 1 ? 'random' : 'choose'), level: s.level } });
      } else r = await room.joinRoom(code, name);
    } catch (e) { r = { ok: false, message: 'Online play couldn’t load. Check your internet.' }; }
    net.connecting = false;
    if (r.ok) { store.online = true; save(); } else toast(r.message);
    renderPlay();
  }
  function renderOnline() {
    const s = net.snap;
    const st = s ? s.status : 'none';
    let body;
    if (net.connecting && st !== 'lobby') body = '<div class="panel"><b>Connecting…</b><p class="muted small" style="margin:0">Talking to the game server.</p></div>';
    else if (st === 'joining') body = '<div class="panel"><b>Joining…</b><p class="muted small" style="margin:0">' + (s.askingHost ? 'That seat is someone else\'s. Waiting for the host to Allow.' : 'Waiting for the host to give you a seat.') + '</p></div>';
    else if (st === 'lobby') {
      const host = s.isHost;
      const o = s.options || {};
      const seats = s.seats.map((x, i) => {
        const who = x.kind === 'human' ? esc(x.name || 'Player') + (i === s.mySeat ? ' <span class="muted">(you)</span>' : '') + (x.online ? '' : ' <span class="muted">· away</span>') :
          x.kind === 'computer' ? 'Computer' : '<span class="muted">Open seat</span>';
        let b = '';
        if (host && i !== s.mySeat) b = x.kind === 'empty' ? '<button class="btn small" data-seat="' + i + '" data-kind="computer">Computer</button>' :
          '<button class="btn small ghost" data-seat="' + i + '" data-kind="empty">' + (x.kind === 'human' ? 'Remove' : 'Open') + '</button>';
        return '<div class="seatrow"><span class="cchip" style="background:' + SEAT_COL[i] + ';width:9px;height:9px;border-radius:50%"></span><span class="grow">' + who + '</span>' + b + '</div>';
      }).join('');
      body = '<div class="panel" style="align-items:center;gap:4px"><span class="label">Room code</span><div class="code-big">' + esc(s.code) + '</div>' +
        '<p class="muted small" style="margin:0;text-align:center">Friends open this site, tap Play online and type the code.</p></div>' +
        '<div class="panel"><span class="label">Seats · ' + (o.ed === 2 ? '2nd' : '1st') + ' edition</span><div class="seats scroll" style="max-height:38dvh">' + seats + '</div>' +
        (host ? '<button class="btn primary" data-on="start" style="width:100%"' + (net.connecting ? ' disabled' : '') + '>' + (net.connecting ? 'Starting…' : 'Start') + '</button>' +
          '<p class="muted small" style="margin:0">Open seats become ' + esc(cap(o.level || 'medium')) + ' computers.</p>' :
          '<p class="muted small" style="margin:0">Waiting for the host to start…</p>') + '</div>';
    } else {
      body = '<div class="panel"><span class="label">Your name</span>' +
        '<input class="txt" id="on-name" maxlength="20" autocomplete="nickname" placeholder="Name" value="' + esc(store.settings.name || '') + '">' +
        '<button class="btn primary" data-on="create" style="width:100%">Create a room</button>' +
        '<p class="muted small" style="margin:0">Uses your player count, edition and computer level. Open seats can be friends or computers.</p></div>' +
        '<div class="panel"><span class="label">Join a friend</span><div class="row">' +
        '<input class="txt code" id="on-code" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code">' +
        '<button class="btn primary" data-on="join">Join</button></div></div>';
    }
    vPlay.innerHTML = '<div class="setup"><div class="row"><button class="btn small ghost" data-on="back">Back</button><span class="grow"></span><span class="label">Play online</span></div>' + body + '</div>';
  }

  // ------------------------------------------------------------------ game screen pieces
  function resIcons(str) { return str.split('').map(r => A.res(r)).join(''); }
  function produceRow(v, p) {
    // what this city makes for itself: fixed units counted, choices shown as a/b
    const fixed = {}, alts = [];
    for (const s of E.slots(v, p, true)) { if (s.length === 1) fixed[s] = (fixed[s] || 0) + 1; else alts.push(s); }
    const parts = [];
    for (const r of Cd.RAW.concat(Cd.MAN)) if (fixed[r]) parts.push('<span class="g">' + A.res(r) + (fixed[r] > 1 ? '<b>' + fixed[r] + '</b>' : '') + '</span>');
    for (const s of alts) parts.push('<span class="g alt">' + (s.length > 4 ? '<span class="small muted">any</span>' + (s.indexOf('W') >= 0 ? A.res('W', 'ic s') + A.res('O', 'ic s') : A.res('G', 'ic s') + A.res('P', 'ic s')) : s.split('').map(r => A.res(r, 'ic s')).join('<b>/</b>')) + '</span>');
    return parts.join('');
  }
  function sciRow(v, p) {
    const s = E.sciSymbols(v, p);
    const parts = [];
    for (const k of Cd.SCI) if (s.c[k]) parts.push('<span class="g">' + A.sci(k) + '<b>' + s.c[k] + '</b></span>');
    if (s.wild) parts.push('<span class="g">' + A.wild() + '<b>' + s.wild + '</b></span>');
    return parts.join('');
  }
  function colorCounts(v, p) {
    return '<span class="cols">' + Cd.COLORS.map(c => { const n = E.countColor(v, p, c); return n ? '<span class="cc" style="background:' + A.COLOR_HEX[c] + '">' + n + '</span>' : ''; }).join('') + '</span>';
  }
  function stagesHTML(v, p, big) {
    const all = E.stagesOf(v, p);
    if (!all.length) return '<span class="muted small">Side not chosen</span>';
    // each box gets room in proportion to what it shows, so a long cost (Gizah B: 4 stone + papyrus) fits
    const eff = e => (e.vp ? 1.4 : 0) + (e.sh || 0) + (e.coins ? 1.4 : 0) + (e.any ? 3 : 0) + (e.wild ? 1 : 0) +
      (e.free || e.discard || e.seventh || e.copy ? 3.2 : 0) + (e.tradeRaw ? 3.5 : 0);
    const grow = (s, k) => (k < p.stages ? 0 : String(s[0] || '').length + 1) + Math.max(1, eff(s[1] || {}));
    return all.map((s, k) => '<div class="stg ' + (k < p.stages ? 'built' : k === p.stages ? 'next' : '') + (k >= p.stages && String(s[0] || '').length >= 4 ? ' tight' : '') +
      '" style="flex-grow:' + grow(s, k) + '" title="' + esc(Cd.stageText(s)) + '">' +
      (k < p.stages ? '' : A.resCost(s[0]) + '<b class="arr">›</b>') + A.stageEffect(s) + '</div>').join('');
  }
  function milSum(p) { return p.mil.reduce((a, b) => a + b, 0); }
  function lastMove(v, s) {
    if (!v.last) return '';
    const m = v.last.moves.filter(x => x.s === s);
    if (!m.length) return '';
    return m.map(x => x.t === 'build' ? 'built <b>' + esc(card(v, x.id).name) + '</b>' + (x.free === 'discard' ? ' (from discard)' : '') : x.t === 'wonder' ? 'built <b>stage ' + x.stage + '</b>' : '<b>sold</b> a card').join(', ');
  }
  function cityChips(v, p, fresh) {
    const ids = p.city.slice().sort((a, b) => Cd.COLORS.indexOf(card(v, a).color) - Cd.COLORS.indexOf(card(v, b).color));
    return '<div class="citynames">' + ids.map(id => '<span class="mcn' + (fresh && fresh.has(id) ? ' new' : '') + '" style="background:' + A.COLOR_HEX[card(v, id).color] + '">' + esc(card(v, id).name) + '</span>').join('') + '</div>';
  }
  // ---- the table pieces: built cards stacked in colour columns, the wonder board, coins and tokens
  function cityCols(v, p, fresh) {
    const by = {};
    for (const id of p.city) { const c = card(v, id); (by[c.color] = by[c.color] || []).push(id); }
    const rows = Math.max(1, ...Object.values(by).map(a => a.length));
    return '<div class="citycards" style="--cols:' + Math.max(4, Object.keys(by).length) + ';--rows:' + rows + '">' + Cd.COLORS.filter(col => by[col]).map(col => '<div class="ccol" style="--n:' + by[col].length + '">' +
      by[col].map((id, i) => A.mini(card(v, id), { cls: fresh && fresh.has(id) ? 'new' : '', attr: ' style="--i:' + i + '"' })).join('') + '</div>').join('') + '</div>';
  }
  function milTokens(p) {
    return '<span class="mtoks">' + p.mil.map(x => '<span class="mtok ' + (x < 0 ? 'neg' : 'v' + x) + '">' + (x < 0 ? '−' + -x : x) + '</span>').join('') + '</span>';
  }
  function boardTile(v, p, extra) {
    const W = Cd.EDITIONS[v.ed].wonders[p.wonder];
    return '<div class="wboard">' + A.emblem(p.wonder) + '<div class="wb-in"><div class="wb-top">' + A.res(W.res) + '<b>' + esc(W.name) + '</b>' +
      (p.side ? '<span class="sd">' + p.side + '</span>' : '') + '<span class="grow"></span>' + milTokens(p) + (extra || '') + '</div>' +
      '<div class="stages">' + stagesHTML(v, p, false) + '</div></div></div>';
  }
  // real coins: 3s (gold) and 1s (silver), a few drawn in a small pile, the count beside them
  function coinPile(n) {
    const g = Math.floor(n / 3), s = n % 3, out = [];
    for (let i = 0; i < Math.min(g, 4); i++) out.push('<span class="tbl-coin">3</span>');
    for (let i = 0; i < s; i++) out.push('<span class="tbl-coin silver">1</span>');
    return '<span class="cpile">' + out.join('') + '</span>';
  }
  function backFan(v, p) {
    const n = Math.max(0, Math.min(7, p.hand || 0));
    let h = '';
    for (let i = 0; i < n; i++) h += A.back(v.age);
    if (p.picked && v.phase === 'pick') h += A.back(v.age, 'picked');
    return h ? '<span class="bfan" title="' + (p.picked ? 'Picked' : 'Choosing') + '">' + h + '</span>' : '';
  }
  // an opponent's place at the table: name plate, cards in hand (backs), built cards, board, coins
  function seatHTML(v, s, side, pr) {
    const p = v.players[s];
    let sells = '';
    if (side) {
      const got = {};
      for (const sl of E.slots(v, p, false)) for (const r of sl) got[r] = 1;
      const list = Object.keys(got).sort((a, b) => 'WSCOGLP'.indexOf(a) - 'WSCOGLP'.indexOf(b));
      // grouped by what each costs you (a trading post or marketplace makes raw goods and glass/press/loom differ)
      const byPrice = [];
      for (const r of list) { const c = pr[side][r]; let g = byPrice.find(x => x.c === c); if (!g) byPrice.push(g = { c, rs: [] }); g.rs.push(r); }
      sells = list.length ? '<span class="sells">' + byPrice.map(g => '<span class="si">' + g.rs.map(r => A.res(r)).join('') + '</span><b class="pr">' + g.c + '¢</b>').join('') + '</span>' : '<span class="sells">none</span>';
    }
    return '<div class="seat' + (side ? ' nb' : '') + '"' + (side ? ' data-nb="' + side + '"' : '') + ' data-city="' + s + '" style="--seat:' + SEAT_COL[s] + '">' +
      '<div class="plate">' + (side === 'L' ? '◀' : '') + '<span class="dot"></span><span class="nmx">' + esc(p.name.replace(/^Computer /, 'C') + (side ? ' · ' + wname(v, p) : '')) + '</span>' + (side ? backFan(v, p).replace('class="bfan"', 'class="bfan inplate"') : '') + (side === 'R' ? '▶' : '') + '</div>' +
      (side ? '' : '<div class="pips" title="Wonder stages">' + E.stagesOf(v, p).map((x, k) => '<i' + (k < p.stages ? ' class="on"' : '') + '></i>').join('') + '</div>') +
      '<div class="srow">' + cityCols(v, p) + backFan(v, p) + '</div>' + boardTile(v, p) +
      '<div class="r"><span class="tok"><span class="tbl-coin"></span>' + p.coins + '</span><span class="tok">' + A.shield() + p.shields + '</span>' + sells + '</div>' +
      '<div class="last">' + (lastMove(v, s) || '&nbsp;') + '</div></div>';
  }
  // the middle of the table: Age plate, the decks waiting for later ages, the face-down discard pile
  function deckHTML(age, n, cls) {
    if (!n) return '<div class="tbl-deck is-empty ' + (cls || '') + '"></div>';
    const st = TABLE.stackShadow(n, { perCard: 0.2, max: 8 });
    return '<div class="tbl-deck ' + (cls || '') + '" data-count="' + n + '">' + A.back(age).replace('class="', 'style="--tbl-stack:' + st.shadow + ';--tbl-rise:-' + st.thickness + 'px" class="') + '<span class="tbl-badge">' + n + '</span></div>';
  }
  function centreHTML(v) {
    const later = [];
    for (let a = v.age + 1; a <= 3; a++) later.push(deckHTML(a, Cd.ageDeck(v.ed, a, v.n).length));
    return '<div class="ctr"><span class="ageplate">Age ' + AGE[v.age] + ' · ' + (v.phase === 'seventh' ? '7th' : v.turn + '/6') + ' ' + (v.age === 2 ? '▶' : '◀') + '</span>' +
      '<div class="piles">' + (later.length ? '<div><div class="later">' + later.join('') + '</div><span class="lbl">Age ' + AGE[v.age + 1] + '</span></div>' : '') +
      '<div>' + deckHTML(v.age, v.discardCount, 'discard') + '<span class="lbl">Discard</span></div></div></div>';
  }
  function playerRow(v, s, fresh) {
    const p = v.players[s];
    return '<div class="prow' + (s === ME ? ' mine' : '') + '" data-city="' + s + '"><div class="t"><span class="cchip" style="background:' + SEAT_COL[s] + ';width:9px;height:9px;border-radius:50%"></span>' +
      '<span class="nmx">' + esc(nameOf(v, s)) + ' · ' + esc(wname(v, p)) + (p.side ? ' ' + p.side : '') + '</span>' +
      '<span class="chip">' + A.coin('') + '<b>' + p.coins + '</b></span><span class="chip">' + A.shield() + '<b>' + p.shields + '</b></span>' +
      '<span class="chip" title="Military tokens">⚔ <b>' + milSum(p) + '</b></span></div>' +
      '<div class="stages">' + stagesHTML(v, p, false) + '</div>' +
      '<div class="resrow">' + produceRow(v, p) + sciRow(v, p) + '</div>' + cityChips(v, p, fresh) + '</div>';
  }
  function logHTML(v) {
    const out = [];
    const log = v.log || [];
    for (let k = log.length - 1; k >= 0 && out.length < 120; k--) {
      const L = log[k];
      for (const m of L.moves) {
        const who = nameOf(v, m.s);
        const what = m.t === 'build' ? 'built <b>' + esc(card(v, m.id).name) + '</b>' + (m.free === 'chain' ? ' (chain)' : m.free === 'discard' ? ' from the discard' : m.free === 'oly' ? ' free' : (m.pay.L + m.pay.R ? ' paying ' + (m.pay.L + m.pay.R) : '')) :
          m.t === 'wonder' ? 'built wonder stage ' + m.stage : 'sold a card';
        out.push('<li>' + esc(who) + ' ' + what + (m.gain ? ' <span class="num">+' + m.gain + '</span>' : '') + '</li>');
      }
      out.push('<li class="h">Age ' + AGE[L.age] + ' · turn ' + L.turn + '</li>');
    }
    for (const w of (v.wars || []).slice().reverse()) {
      void w;
    }
    return out.length ? '<ul class="log">' + out.join('') + '</ul>' : '<p class="muted small">Nothing yet.</p>';
  }
  function boardHTML(v, s) {
    const p = v.players[s];
    const W = Cd.EDITIONS[v.ed].wonders[p.wonder];
    const all = E.stagesOf(v, p);
    return '<div class="board"><div class="row">' + A.emblem(p.wonder) + '<div class="grow"><b>' + esc(W.full) + '</b><div class="muted small">Side ' + (p.side || '?') + ' · makes ' + A.res(W.res) + '</div></div></div>' +
      '<div class="bs">' + all.map((st, k) => '<div class="stg ' + (k < p.stages ? 'built' : k === p.stages ? 'next' : '') + '"><span class="cost">' + A.resCost(st[0]) + '</span><span>' + A.stageEffect(st) + '</span></div>').join('') + '</div>' +
      '<div class="small muted">' + all.map((st, k) => 'Stage ' + (k + 1) + ': ' + esc(Cd.stageText(st))).join('<br>') + '</div></div>';
  }
  function citySheet(v, s) {
    const p = v.players[s];
    const sc = E.scoreOne(v, s);
    sheet(nameOf(v, s) + ' · ' + wname(v, p), boardHTML(v, s) +
      '<div style="margin-top:10px">' + playerRow(v, s) + '</div>' +
      '<p class="small muted" style="margin:8px 0 0">Points if the game ended now: <b class="num" style="color:var(--text)">' + sc.total + '</b> (military ' + sc.military + ', coins ' + sc.coins + ', wonder ' + sc.wonder + ', civil ' + sc.civil + ', science ' + sc.science + ', commerce ' + sc.commerce + ', guilds ' + sc.guilds + ')</p>');
  }

  // odds for the selected card at the moment of choosing
  function oddsFor(v, id) {
    const out = [];
    const t = v.turn;
    const back = t + v.n;
    if (v.phase === 'pick') out.push(back <= 6 ? 'Hand back on turn <b>' + back + '</b> with <b>' + (7 - back + 1) + '</b> cards' : 'You won’t see this hand again');
    const nxt = v.age === 2 ? E.right(v, ME) : E.left(v, ME);
    const b = E.buildCost(v, nxt, id, false);
    out.push(nameOf(v, nxt) + (b.ok ? ' <b>can</b> build it next' : ' can’t build it next'));
    const copies = Cd.ageDeck(v.ed, card(v, id).age, v.n).filter(x => x === id).length;
    if (card(v, id).color !== 'purple') out.push('<b>' + copies + '</b> in this age');
    return out.join(' · ');
  }
  function rankNow(v) {
    try { return Bt.rank(v, ME, v.hand); } catch (e) { return []; }
  }

  // ------------------------------------------------------------------ game screen
  function renderGame() {
    const v = table.view();
    const toAct = v.waiting.indexOf(ME) >= 0 && !(v.phase === 'pick' && v.pick);
    const pl = fxStep(v, toAct);
    if (v.phase === 'over') { renderEnd(v, pl); fxRun(pl); return; }
    const me = v.players[ME];
    const L = E.left(v, ME), R = E.right(v, ME);
    const key = v.age + ':' + v.turn + ':' + v.phase;
    const newTurn = key !== ui.prevKey;
    if (newTurn) { resetSel(); ui.prevKey = key; }
    // newly built cards (for the pop animation)
    const fresh = new Set();
    if (ui.prevCities) v.players.forEach((p, i) => p.city.forEach(id => { if ((ui.prevCities[i] || []).indexOf(id) < 0) fresh.add(id); }));
    ui.prevCities = v.players.map(p => p.city.slice());
    const est = E.scoreOne(v, ME).total;
    const pr = E.prices(v, me);

    let handHTML = '', actHTML = '', fanSel = -1, dealIn = false;
    if (v.phase === 'side') {
      if (!me.side) {
        const W = Cd.EDITIONS[v.ed].wonders[me.wonder];
        handHTML = '<div class="wpick">' + ['A', 'B'].map(sd => '<div class="wboard" data-side="' + sd + '"><div class="wb-top"><b>' + esc(W.name) + '</b><span class="sd">' + sd + '</span></div><div class="stages">' +
          W[sd].map(st => '<div class="stg"><span>' + A.resCost(st[0]) + '</span><span>' + A.stageEffect(st) + '</span></div>').join('') + '</div></div>').join('') + '</div>';
        actHTML = '<div class="head"><b>Pick a side for ' + esc(W.full) + '</b></div><div class="tx">Side A is the easier one. Tap a board.</div>';
      } else actHTML = waitHTML(v);
    } else if (v.phase === 'discard' && v.pendingDiscard === ME && v.discardPile) {
      handHTML = '<div class="fan">' + v.discardPile.map((id, k) => A.face(card(v, id), { cls: (ui.sel === k ? 'sel is-up' : '') + (newTurn ? ' fanin' : ''), attr: ' data-dpick="' + k + '"' })).join('') + '</div>';
      fanSel = ui.sel;
      const id = v.discardPile[ui.sel];
      actHTML = '<div class="head"><b>Free build from the discard pile</b></div><div class="tx">' + (id ? esc(card(v, id).name) + ': ' + esc(Cd.effectText(card(v, id))) : 'Your wonder lets you build one discarded card for free. Tap one.') + '</div>' +
        '<div class="btns" style="grid-template-columns:1fr 1fr"><button class="btn primary" data-dbuild' + (id ? '' : ' disabled') + '>Build free</button><button class="btn" data-dskip>Skip</button></div>';
    } else if ((v.phase === 'pick' || v.phase === 'seventh') && toAct) {
      const ranked = (store.settings.values || ui.hint) ? rankNow(v) : null;
      // the card values on show make this game "with help" in My stats
      if (store.settings.values && !table.online && store.game && !store.game.helped && !store.game.tutorial) { store.game.helped = true; save(); }
      const best = ranked && ranked[0];
      const val = {};
      if (ranked) for (const r of ranked) { const k = r.a.i; if (!(k in val) || r.v > val[k]) val[k] = r.v; }
      const vals = Object.values(val);
      const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      const opts = E.options(v, ME, v.hand);
      // a new age: the hand is dealt from the deck in the middle; other turns it is passed over (fxHooks.slide)
      dealIn = newTurn && v.turn === 1 && v.phase === 'pick';
      handHTML = '<div class="fan">' + v.hand.map((id, k) => {
        const o = opts[k];
        const can = o.build.ok || o.oly;
        const badge = (store.settings.values && ranked ? '<div class="val" style="color:' + heat(val[k], lo, hi) + '">' + (val[k] >= 0 ? '+' : '') + val[k].toFixed(1) + '</div>' : '') +
          (o.build.ok ? (o.build.free ? '<span class="st">free</span>' : (o.build.coin + o.build.opts[0].L + o.build.opts[0].R ? '<span class="st">' + (o.build.coin + o.build.opts[0].L + o.build.opts[0].R) + '¢</span>' : '')) : '');
        return A.face(card(v, id), { cls: (ui.sel === k ? 'sel is-up ' : '') + (can ? '' : 'dim ') + (ui.hint && best && best.a.i === k ? 'hint ' : '') + (newTurn && !dealIn ? 'fanin' : ''),
          attr: ' data-pick="' + k + '"' + (newTurn && !dealIn ? ' style="animation-delay:' + (pl.handDelay + k * Math.round(35 * fxSp())) + 'ms"' : ''), badge });
      }).join('') + '</div>';
      fanSel = ui.sel;
      actHTML = actPanel(v, opts, ranked);
    } else actHTML = waitHTML(v);

    // seats round the table from your left: left neighbour, the far side, right neighbour
    const farSeats = [];
    for (let s = E.left(v, ME); s !== R; s = E.left(v, s)) if (s !== L) farSeats.push(s);
    const all = v.players.map((p, i) => playerRow(v, i, fresh)).join('');
    vPlay.classList.add('ingame');
    vPlay.innerHTML = '<div id="game" style="--land:' + pl.land + 'ms">' +
      '<div class="status"><div class="far">' + farSeats.map(s => seatHTML(v, s, null, pr)).join('') + '</div><div class="tools">' +
      '<button class="icon-btn" id="btn-hint" title="Hint" aria-label="Hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg></button>' +
      (undoShown() ? '<button class="icon-btn" id="btn-undo" title="Undo your last pick" aria-label="Undo"' + (canUndo() ? '' : ' disabled') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/></svg></button>' : '') +
      '<button class="icon-btn" id="btn-all" title="All cities" aria-label="All cities"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V9l4-3 4 3v12M13 21V12l4-3 3 3v9"/></svg></button>' +
      '<button class="icon-btn" id="btn-log" title="Log" aria-label="Log"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></button>' +
      '<button class="icon-btn" id="btn-menu" title="Menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button></div></div>' +
      '<div class="nbs">' + seatHTML(v, L, 'L', pr) + centreHTML(v) + seatHTML(v, R, 'R', pr) + '</div>' +
      '<div class="me" data-city="' + ME + '"><div class="mytop">' + cityCols(v, me, fresh) +
      '<div class="mine-tok"><span class="tok" data-fx="coin" title="Coins">' + coinPile(me.coins) + '<b>' + coinStart(pl, me.coins) + '</b></span>' +
      '<span class="tok" data-fx="shield" title="Shields">' + A.shield() + '<b>' + me.shields + '</b></span></div></div>' +
      boardTile(v, me, '<span class="laurel" title="Points if the game ended now">' + est + '</span>') +
      '<div class="resrow myres">' + produceRow(v, me) + sciRow(v, me) + '</div></div>' +
      '<div class="hand">' + handHTML + '</div>' +
      '<div class="act">' + actHTML + '</div>' +
      '<div id="g-side"><div class="tabs2" data-sidetab>' + ['log', 'cities'].map(t => '<button data-st="' + t + '" aria-pressed="' + ((ui.sideTab || 'log') === t) + '">' + cap(t) + '</button>').join('') + '</div>' +
      '<div class="panel scroll" style="flex:1">' + ((ui.sideTab || 'log') === 'log' ? logHTML(v) : '<div style="display:flex;flex-direction:column;gap:6px">' + all + '</div>') + '</div>' +
      '<div class="panel small muted">' + (v.age === 3 ? 'Guilds in play: <b style="color:var(--text)">' + (v.n + 2) + '</b> of 10. ' : '') + 'Discard pile: <b style="color:var(--text)">' + v.discardCount + '</b> cards.' +
      (table.online ? ' Room <b style="color:var(--text)">' + esc(net.snap.code || '') + '</b>' : '') + '</div></div>' +
      '</div>';
    layoutHand(fanSel, dealIn ? pl.handDelay : -1, v.age);
    fxRun(pl);
  }
  // while your coins are about to count up or down, the chip starts from the old number
  function coinStart(pl, now) {
    const c = FX.settings.animations && pl.steps.find(s => s.fx === 'count');
    return c ? c.from : now;
  }
  function waitHTML(v) {
    const names = v.waiting.filter(s => s !== ME).map(s => v.players[s].name);
    return '<div class="wait"><span class="dots"><i></i><i></i><i></i></span>' + (names.length ? 'Waiting for ' + esc(names.slice(0, 3).join(', ')) + (names.length > 3 ? '…' : '') : 'Working…') + '</div>' +
      (v.pick ? '<div class="tx">Your pick: ' + esc(v.pick.t === 'sell' ? 'sell ' : v.pick.t === 'wonder' ? 'wonder stage with ' : 'build ') + esc(card(v, v.pick.id).name) + '</div>' : '');
  }
  function actPanel(v, opts, ranked) {
    const k = ui.sel;
    if (k < 0 || !v.hand[k]) {
      const sc = E.stageCost(v, ME);
      return '<div class="head"><b>' + (v.phase === 'seventh' ? 'Play your 7th card' : 'Pick a card') + '</b><span class="grow"></span>' + (ui.hint && ranked && ranked[0] ? '<span class="small">Hint: <b>' + hintWords(v, ranked[0]) + '</b></span>' : '') + '</div>' +
        '<div class="tx">' + (v.phase === 'pick' ? 'Hands pass ' + (v.age === 2 ? 'right ▶' : '◀ left') + ' this age. ' : '') + (sc.ok ? 'Your next wonder stage is affordable.' : 'Next wonder stage: ' + esc(sc.why || '')) + '</div>' +
        (store.settings.odds && v.phase === 'pick' ? '<div class="odds">' + (v.turn + v.n <= 6 ? 'This hand comes back on turn <b>' + (v.turn + v.n) + '</b>' : 'You won’t see this hand again') + (v.age === 3 ? ' · ' + (v.n + 2) + ' guilds in this age' : '') + '</div>' : '');
    }
    const id = v.hand[k];
    const c = card(v, id);
    const o = opts[k];
    const b = o.build;
    const w = o.wonder;
    const pays = b.ok ? b.opts : w.ok ? w.opts : [];
    const payLabel = p => (p.L ? '◀' + p.L : '') + (p.L && p.R ? ' · ' : '') + (p.R ? p.R + '▶' : '') || 'own';
    // Olympia A: the once-per-age free build may be used on any card, also one you could pay for
    const olyAlt = olyChoice(v, o);
    const useOly = olyAlt && ui.pay === 'oly';
    const pi = typeof ui.pay === 'number' ? ui.pay : 0;
    const bTot = b.ok && !b.free ? b.coin + (b.opts[pi] || b.opts[0]).L + (b.opts[pi] || b.opts[0]).R : 0;
    const bCost = useOly ? 'free (wonder)' : b.ok ? (b.free ? (b.free === 'chain' ? 'chain' : 'free') : bTot ? bTot + '¢' : (c.res ? 'own' : 'free')) : '';
    const wP = w.ok ? (w.opts[Math.min(pi, w.opts.length - 1)] || w.opts[0]) : null;
    const valOf = kind => { if (!ranked) return ''; const r = ranked.find(x => x.a.i === k && x.kind === kind); return r ? ' · ' + (r.v >= 0 ? '+' : '') + r.v.toFixed(1) : ''; };
    const multi = (b.ok && !b.free && (b.opts.length > 1 || olyAlt)) ? '<div class="pays">' + b.opts.slice(0, 5).map((p, j) => '<button data-pay="' + j + '" aria-pressed="' + (ui.pay === j) + '">' + payLabel(p) + '</button>').join('') +
      (olyAlt ? '<button data-pay="oly" aria-pressed="' + useOly + '">Free (wonder)</button>' : '') + '</div>' : '';
    return '<div class="head"><span class="cchip" style="background:' + A.COLOR_HEX[c.color] + '"></span><b>' + esc(c.name) + '</b><span class="grow"></span>' +
      (ui.hint && ranked && ranked[0] ? '<span class="small">Hint: <b>' + hintWords(v, ranked[0]) + '</b></span>' : '') + '</div>' +
      '<div class="tx">' + esc(Cd.effectText(c)) + (c.to.length ? '. Makes free later: ' + esc(c.to.join(', ')) : '') + (c.from.length ? '. Free if you have ' + esc(c.from.join(' or ')) : '') + '</div>' +
      (store.settings.odds ? '<div class="odds">' + oddsFor(v, id) + '</div>' : '') + multi +
      '<div class="btns">' +
      '<button class="btn primary" data-do="build"' + (b.ok || o.oly ? '' : ' disabled') + '>Build<small>' + (b.ok ? bCost : o.oly ? 'free (wonder)' : esc(shortWhy(b.why))) + valOf(b.ok && !useOly ? 'build' : 'oly') + '</small></button>' +
      '<button class="btn" data-do="wonder"' + (w.ok ? '' : ' disabled') + '>Stage<small>' + (w.ok ? (wP.L + wP.R ? wP.L + wP.R + '¢' : 'own') : esc(shortWhy(w.why))) + valOf('wonder') + '</small></button>' +
      '<button class="btn" data-do="sell">Sell<small>+3¢' + valOf('sell') + '</small></button></div>';
  }
  function olyChoice(v, o) { return !!(o && o.build.ok && !o.build.free && E.olyReady(v, v.players[ME])); }
  function shortWhy(w) { return !w ? 'no' : /coins/.test(w) ? 'coins' : /already/.test(w) ? 'have it' : /finished/.test(w) ? 'done' : 'resources'; }
  function hintWords(v, r) { return (r.kind === 'sell' ? 'Sell ' : r.kind === 'wonder' ? 'Stage with ' : 'Build ') + esc(card(v, r.id).name); }

  // the hand: real 65:100 cards sized to the free height, held as a fan (js/table.js); a new age is dealt from the middle
  let fanApi = null;
  function layoutHand(sel, dealDelay, age) {
    if (fanApi && fanApi.disconnect) fanApi.disconnect();
    fanApi = null;
    const hand = $('#game .hand'), f = hand && hand.querySelector('.fan');
    if (!f || !f.children.length) return;
    const cards = Array.from(f.children);
    const wide = window.innerWidth >= 900;
    const lift = wide ? 22 : 14;
    // laptop: as tall as the row allows, but narrow enough that every card still shows its name (about 72% of each card visible)
    const fitW = wide ? (hand.clientWidth - 8) / (1 + 0.72 * Math.max(0, cards.length - 1)) : 1e9;
    // a wide hand row that the cards can't fill (7 narrow cards) gives its spare height back to the table above it
    if (wide) {
      const g = $('#game'), need = Math.ceil(Math.min(200, fitW) / 0.65 * 1.03 + lift + 8);
      if (g && need < hand.clientHeight - 12) g.style.setProperty('--handh', Math.max(200, need) + 'px');
    }
    const ch = (hand.clientHeight - lift - 6) / 1.03;
    const cw = Math.max(40, Math.min(wide ? 200 : 108, ch * 0.65, fitW));
    f.style.setProperty('--card-w', cw.toFixed(1) + 'px');
    // place the cards without motion (a fresh render must not slide in from the left), then lift the picked card
    f.classList.add('tbl-instant');
    cards.forEach(c => c.classList.remove('is-up'));
    const api = fanApi = TABLE.fan(f, cards, { pick: false, spread: 1.04, lift, arc: 0.6, maxRot: 10 });
    // an overlapped card's name wraps inside the part of the card you can see, so the next card never hides it
    const step = cards.length > 1 ? parseFloat(cards[1].style.getPropertyValue('--x')) - parseFloat(cards[0].style.getPropertyValue('--x')) : cw;
    if (step < cw * 0.95) f.style.setProperty('--nmr', Math.max(cw * 0.05, cw - step + cw * 0.07).toFixed(1) + 'px');
    else f.style.removeProperty('--nmr');
    const was = ui.fanSel;
    ui.fanSel = sel;
    if (was >= 0 && cards[was]) api.select(was, true);
    void f.offsetWidth;
    f.classList.remove('tbl-instant');
    if (was !== sel) requestAnimationFrame(() => { if (sel >= 0) api.select(sel, true); else if (was >= 0) api.select(was, false); });
    if (dealDelay < 0 || !TABLE.animOn()) return;
    const from = $('#game .ctr .piles');
    cards.forEach((c, k) => {
      c.style.opacity = '0';
      setTimeout(() => TABLE.deal(from, c, { face: A.back(age), duration: Math.round(260 * fxSp()) }).then(() => { c.style.opacity = ''; }),
        dealDelay + k * Math.round(35 * fxSp()));
    });
  }

  // ------------------------------------------------------------------ game input
  function onGameClick(e) {
    const t = e.target;
    const v = table.view();
    if (t.closest('#btn-hint')) {
      ui.hint = !ui.hint;
      if (ui.hint) { const r = rankNow(v); if (r[0] && ui.sel < 0) ui.sel = r[0].a.i; if (!table.online && store.game && !store.game.helped) { store.game.helped = true; save(); } }
      renderGame(); return;
    }
    if (t.closest('#btn-undo')) { undo(); return; }
    if (t.closest('#btn-all')) { sheet('All cities', '<div style="display:flex;flex-direction:column;gap:6px">' + v.players.map((p, i) => playerRow(v, i)).join('') + '</div>'); return; }
    if (t.closest('#btn-log')) { sheet('Log', logHTML(v)); return; }
    if (t.closest('#btn-menu')) { menuSheet(); return; }
    const city = t.closest('[data-city]');
    if (city) { citySheet(v, Number(city.dataset.city)); return; }
    const side = t.closest('[data-side]');
    if (side) { doAct({ t: 'side', side: side.dataset.side }); return; }
    const st = t.closest('[data-st]');
    if (st) { ui.sideTab = st.dataset.st; renderGame(); return; }
    const pk = t.closest('[data-pick]');
    if (pk) { const k = Number(pk.dataset.pick); ui.sel = ui.sel === k ? -1 : k; ui.pay = 0; FX.play('cardFlip', { vol: 0.6 }); renderGame(); return; }
    const dp = t.closest('[data-dpick]');
    if (dp) { const k = Number(dp.dataset.dpick); ui.sel = ui.sel === k ? -1 : k; FX.play('cardFlip', { vol: 0.6 }); renderGame(); return; }
    if (t.closest('[data-dbuild]')) { doAct({ t: 'discard', id: v.discardPile[ui.sel] }); return; }
    if (t.closest('[data-dskip]')) { doAct({ t: 'discard', id: null }); return; }
    const pay = t.closest('[data-pay]');
    if (pay) { ui.pay = pay.dataset.pay === 'oly' ? 'oly' : Number(pay.dataset.pay); renderGame(); return; }
    const d = t.closest('[data-do]');
    if (d && ui.sel >= 0) {
      const k = ui.sel;
      const o = E.options(v, ME, v.hand)[k];
      const pi = typeof ui.pay === 'number' ? ui.pay : 0;
      let a;
      if (d.dataset.do === 'sell') a = { t: 'sell', i: k };
      else if (d.dataset.do === 'wonder') a = { t: 'wonder', i: k, pay: o.wonder.opts[Math.min(pi, o.wonder.opts.length - 1)] };
      else if (o.build.ok && !(ui.pay === 'oly' && olyChoice(v, o))) a = { t: 'build', i: k, pay: o.build.opts[Math.min(pi, o.build.opts.length - 1)] };
      else a = { t: 'build', i: k, oly: true };
      if (net.busy) return;   // a second tap while the room is still answering the first
      record(v, a);
      const fl = fxFly(k, a.t);
      if (table.online) FX.play('cardSlide');   // face down until everyone has picked
      else ui.fx.land = fl;
      doAct(a);
    }
  }
  function record(v, a) {
    // study mode: compare the choice with Hard's ranking at that moment
    const r = rankNow(v);
    if (!r.length) return;
    const kind = a.t === 'build' ? (a.oly ? 'oly' : 'build') : a.t;
    // a free Olympia build of a card you could pay for is ranked as building it
    const mine = r.find(x => x.a.i === a.i && x.kind === kind) || (kind === 'oly' && r.find(x => x.a.i === a.i && x.kind === 'build')) || r[r.length - 1];
    const d = { age: v.age, turn: v.phase === 'seventh' ? 7 : v.turn, chose: { kind, id: v.hand[a.i] }, best: { kind: r[0].kind, id: r[0].id }, lost: +Math.max(0, r[0].v - mine.v).toFixed(2), n: v.hand.length };
    if (table.online) ui.dec.push(d); else { store.game.dec = store.game.dec || []; store.game.dec.push(d); }
  }
  function doAct(a) {
    if (net.busy) return;
    if (table.online) {
      net.busy = true;
      table.act(a).then(r => { if (r && !r.ok) { net.busy = false; FX.play('error'); toast(r.message); renderGame(); } });
      renderGame();
      return;
    }
    const g = store.game;
    const before = JSON.stringify(g.state), nDec = Math.max(0, (g.dec || []).length - (a.t === 'side' || a.t === 'discard' ? 0 : 1)), nActs = (g.acts || []).length;
    let ok = true;
    try { table.act(a); } catch (err) { ok = false; ui.fx.land = 0; FX.play('error'); toast(err.message || 'Can’t do that'); }
    if (ok) {
      if (g.acts) g.acts.push(a);
      if (undoShown()) { g.undo.push({ state: before, dec: nDec, acts: nActs }); if (g.undo.length > UNDO_MAX) g.undo.shift(); }
    }
    resetSel();
    const v = table.view();
    if (v.phase === 'over' && !g.finished) {
      g.finished = true; g.undo = [];
      recordGame();
      saveLast(v, g.dec || [], g);
    }
    if (window.COACH) COACH.emit('acted');
    save();
    renderGame();
  }
  function saveLast(v, dec, g) {
    store.last = { view: v, dec, me: ME, when: Date.now(), init: g && g.init ? g.init : null, acts: g && g.acts ? g.acts.slice() : null };
    save();
  }
  function menuSheet() {
    sheet('Game', '<div style="display:flex;flex-direction:column;gap:8px">' +
      (table.online ? '<button class="btn" data-m="leave">Leave the room</button>' + (net.snap && net.snap.isHost ? '<button class="btn" data-m="close">End the room for everyone</button>' : '') :
        '<button class="btn" data-m="quit">Quit this game</button>') +
      '<p class="muted small" style="margin:0">Your game is saved on this phone after every move.</p></div>');
    $('#sheet').addEventListener('click', e => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      closeSheet();
      if (b.dataset.m === 'quit') {
        const g = store.game, counts = SP && g && !g.tutorial && (g.acts || []).some(x => x.t !== 'side');
        confirmBox('Quit this game? It can’t be resumed.' + (counts ? ' It counts as a loss in My stats.' : ''), 'Quit', () => { dropGame(); renderPlay(); });
      }
      if (b.dataset.m === 'leave') confirmBox('Leave the room? A computer takes your seat.', 'Leave', leaveOnline);
      if (b.dataset.m === 'close') confirmBox('End the room for everyone?', 'End', () => { net.room.close(); leaveOnline(); });
    });
  }

  // ------------------------------------------------------------------ end of game
  const CATS = [['military', 'Military', 'red'], ['coins', 'Coins', 'yellow'], ['wonder', 'Wonder', null], ['civil', 'Civil', 'blue'], ['science', 'Science', 'green'], ['commerce', 'Commerce', 'yellow'], ['guilds', 'Guilds', 'purple']];
  // zero: start every number at 0 (the end screen counts them up, see fxHooks.scores)
  function scoreTable(v, me, zero) {
    const R = v.result;
    const cell = (x, cls) => '<td' + (cls ? ' class="' + cls + '"' : '') + ' data-v="' + x + '">' + (zero ? 0 : x) + '</td>';
    const head = '<tr><th></th>' + v.players.map((p, i) => '<th title="' + esc(p.name) + '">' + esc(i === me ? 'You' : p.name.replace('Computer ', 'C')) + '</th>').join('') + '</tr>';
    const rows = CATS.map(([k, label, col]) => '<tr><td><span class="rowl">' + (col ? A.chip(col) : A.stageIc()) + label + '</span></td>' + R.scores.map(s => cell(s[k])).join('') + '</tr>').join('');
    const tot = '<tr class="tot"><td>Total</td>' + R.scores.map((s, i) => cell(s.total, R.winners.indexOf(i) >= 0 ? 'win' : '')).join('') + '</tr>';
    return '<table class="sc"><thead>' + head + '</thead><tbody>' + rows + tot + '</tbody></table>';
  }
  // place counts the rulebook tie-break: equal points, more coins ranks higher
  function placeOf(v, me) {
    const S = v.result.scores, mine = S[me].total, c = (v.players[me] || {}).coins || 0;
    return 1 + S.filter((s, i) => s.total > mine || (s.total === mine && ((v.players[i] || {}).coins || 0) > c)).length;
  }
  function renderEnd(v, pl) {
    const R = v.result;
    const zero = !!(pl && FX.settings.animations && pl.steps.some(s => s.fx === 'scores'));
    const won = R.winners.indexOf(ME) >= 0;
    const place = placeOf(v, ME);
    const dec = table.online ? ui.dec : (store.game && store.game.dec) || [];
    const lost = dec.reduce((a, d) => a + d.lost, 0);
    vPlay.innerHTML = '<div class="setup">' +
      '<div class="panel popin" style="align-items:center;text-align:center;gap:2px"><div class="label">Game over</div><div style="font-size:24px;font-weight:850">' +
      (won ? (R.winners.length > 1 ? 'Shared win!' : 'You win!') : esc(R.winners.map(w => nameOf(v, w)).join(' & ')) + ' win' + (R.winners.length > 1 ? '' : 's')) + '</div>' +
      '<div class="muted small">You: ' + R.scores[ME].total + ' points · place ' + place + ' of ' + v.n + (dec.length ? ' · ' + lost.toFixed(1) + ' points lost vs Hard' : '') + '</div></div>' +
      '<div class="panel pad scroll" style="overflow-x:auto">' + scoreTable(v, ME, zero) + '</div>' +
      '<div class="row"><button class="btn primary grow" data-end="new">New game</button><button class="btn grow" data-end="study">Study</button></div></div>';
    vPlay.onclick = null;
    $('[data-end="new"]', vPlay).addEventListener('click', () => {
      if (table.online) { leaveOnline(); return; }
      table = null; store.game = null; save(); renderPlay();
    });
    $('[data-end="study"]', vPlay).addEventListener('click', () => showTab('study', true));
  }

  // ================================================================== SCORE (real-table calculator)
  const vScore = $('#v-score');
  const SROWS = [['mil', 'Military', 'red'], ['coins', 'Coins', 'yellow'], ['wonder', 'Wonder', null], ['civil', 'Civil', 'blue'], ['commerce', 'Commerce', 'yellow'], ['guilds', 'Guilds', 'purple'],
    ['compass', 'Compass', 'sci'], ['gear', 'Gear', 'sci'], ['tablet', 'Tablet', 'sci'], ['wild', 'Any symbol', 'sci']];
  // [min, max] per row: military can go to -6 (six defeats), everything else starts at 0
  const SCAP = { mil: [-6, 18], coins: [0, 199], wonder: [0, 40], civil: [0, 99], commerce: [0, 99], guilds: [0, 99], compass: [0, 20], gear: [0, 20], tablet: [0, 20], wild: [0, 3] };
  function scoreData() {
    let s = store.score;
    if (!s || typeof s !== 'object' || !s.v || typeof s.v !== 'object' || Array.isArray(s.v)) s = store.score = { n: store.settings.n, names: [], v: {} };
    s.n = Number(s.n);
    if (!(s.n >= 3 && s.n <= 7) || s.n !== Math.floor(s.n)) s.n = store.settings.n;
    if (!Array.isArray(s.names)) s.names = [];
    s.names = s.names.map(x => typeof x === 'string' ? x.slice(0, 12) : '');
    for (const [k] of SROWS) {
      if (!Array.isArray(s.v[k])) s.v[k] = [];
      const [lo, hi] = SCAP[k];
      s.v[k] = s.v[k].map(x => x == null || !Number.isFinite(Number(x)) ? null : Math.max(lo, Math.min(hi, Math.round(Number(x)))));
    }
    return s;
  }
  function calc(s, i) {
    const g = k => Number(s.v[k][i]) || 0;
    const sci = E.sciBest({ compass: g('compass'), gear: g('gear'), tablet: g('tablet') }, g('wild'));
    const coinPts = Math.floor(g('coins') / 3);
    return { sci: sci.pts, add: sci.add, coinPts, total: g('mil') + coinPts + g('wonder') + g('civil') + g('commerce') + g('guilds') + sci.pts, coins: g('coins') };
  }
  function renderScore() {
    const s = scoreData();
    const n = s.n;
    const cols = Array.from({ length: n }, (_, i) => i);
    const icon = c => c === 'sci' ? '' : c ? A.chip(c) : A.stageIc();
    const row = ([k, label, c]) => '<tr' + (c === 'sci' ? ' class="sub"' : '') + '><td>' + (c === 'sci' ? A.sci(k === 'wild' ? 'gear' : k).replace('class="ic"', 'class="ic s"') + ' ' : '<span class="rowl">' + icon(c) + ' ') + label + (c === 'sci' ? '' : '</span>') + '</td>' +
      cols.map(i => '<td><input inputmode="numeric" pattern="-?[0-9]*" data-k="' + k + '" data-i="' + i + '" value="' + esc(s.v[k][i] == null ? '' : s.v[k][i]) + '" aria-label="' + label + ' player ' + (i + 1) + '"></td>').join('') + '</tr>';
    vScore.innerHTML = '<div class="page">' +
      '<div class="row"><span class="label grow">Score a real game</span>' + qBtn('Type each player\'s numbers from the table. Coins score 1 point per 3. Science is worked out for you: sets of three different symbols score 7, plus each symbol type squared; "any symbol" cards (Scientists Guild, Babylon) are placed for the most points. Ties go to the player with more coins.') +
      '<div class="seg sm" data-sn style="width:190px">' + [3, 4, 5, 6, 7].map(k => '<button aria-pressed="' + (k === n) + '" data-v="' + k + '">' + k + '</button>').join('') + '</div></div>' +
      '<div class="sgrid panel" style="padding:8px"><table class="calc"><thead><tr><th></th>' + cols.map(i => '<th><input class="nm" data-name="' + i + '" placeholder="P' + (i + 1) + '" value="' + esc(s.names[i] || '') + '" aria-label="Name ' + (i + 1) + '"></th>').join('') + '</tr></thead><tbody>' +
      SROWS.slice(0, 6).map(row).join('') +
      '<tr class="sub"><td>↳ coin points</td>' + cols.map(i => '<td class="out" data-out="coinPts" data-i="' + i + '"></td>').join('') + '</tr>' +
      SROWS.slice(6).map(row).join('') +
      '<tr class="sub"><td>↳ science</td>' + cols.map(i => '<td class="out" data-out="sci" data-i="' + i + '"></td>').join('') + '</tr>' +
      '<tr class="tot"><td>Total</td>' + cols.map(i => '<td data-out="total" data-i="' + i + '"></td>').join('') + '</tr>' +
      '</tbody></table></div>' +
      '<div class="row"><span class="grow small muted" id="sc-win"></span><button class="btn small ghost" data-sclear>Clear</button></div></div>';
    updateScore();
  }
  function updateScore() {
    const s = scoreData();
    const res = Array.from({ length: s.n }, (_, i) => calc(s, i));
    vScore.querySelectorAll('[data-out]').forEach(el => {
      const r = res[Number(el.dataset.i)];
      const k = el.dataset.out;
      el.textContent = k === 'sci' ? r.sci + (r.add.some(x => x) ? ' ★' : '') : r[k];
      if (k === 'sci') el.title = r.add.some(x => x) ? 'Wildcards as compass +' + r.add[0] + ', gear +' + r.add[1] + ', tablet +' + r.add[2] : '';
    });
    const any = res.some(r => r.total);
    let best = null;
    res.forEach((r, i) => { if (!best || r.total > best.total || (r.total === best.total && r.coins > best.coins)) best = Object.assign({ i }, r); });
    const winners = res.map((r, i) => i).filter(i => res[i].total === best.total && res[i].coins === best.coins);
    vScore.querySelectorAll('[data-out="total"]').forEach(el => { el.style.color = any && winners.indexOf(Number(el.dataset.i)) >= 0 ? 'var(--accent-warm)' : ''; });
    const nm = i => s.names[i] || 'P' + (i + 1);
    const tie = res.filter(r => r.total === best.total).length > 1;
    $('#sc-win').innerHTML = any ? 'Leader: <b style="color:var(--text)">' + esc(winners.map(nm).join(' & ')) + '</b>' + (tie && winners.length === 1 ? ' (more coins breaks the tie)' : '') : '';
  }
  vScore.addEventListener('input', e => {
    const s = scoreData();
    const el = e.target;
    if (el.dataset.name != null) { s.names[Number(el.dataset.name)] = el.value.slice(0, 12); save(); updateScore(); return; }
    if (!el.dataset.k) return;
    const [lo, hi] = SCAP[el.dataset.k] || [0, 99];
    const neg = lo < 0 && el.value.trim().startsWith('-');
    const digits = el.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    let num = digits === '' ? null : Math.max(lo, Math.min(hi, (neg ? -1 : 1) * parseInt(digits, 10)));
    if (num === 0) num = 0; // no -0
    // the box always shows exactly the number that is counted
    const shown = num == null ? (neg ? '-' : '') : String(num);
    if (shown !== el.value) el.value = shown;
    s.v[el.dataset.k][Number(el.dataset.i)] = num;
    save(); updateScore();
  });
  vScore.addEventListener('click', e => {
    const b = e.target.closest('[data-sn] button');
    if (b) { scoreData().n = Number(b.dataset.v); save(); renderScore(); return; }
    if (e.target.closest('[data-sclear]')) confirmBox('Clear all the numbers?', 'Clear', () => { const n = scoreData().n; store.score = { n, names: store.score.names, v: {} }; save(); renderScore(); });
  });

  // ================================================================== ODDS
  const vOdds = $('#v-odds');
  function renderOdds() {
    const tabs = [['cards', 'Cards'], ['draft', 'Draft'], ['science', 'Science'], ['military', 'Military'], ['hands', 'Hands']];
    let body = '';
    if (ui.oddsTab === 'cards') body = oddsCards();
    else if (ui.oddsTab === 'draft') body = oddsDraft();
    else if (ui.oddsTab === 'science') body = oddsScience();
    else if (ui.oddsTab === 'military') body = oddsMilitary();
    else body = oddsHands();
    vOdds.innerHTML = '<div class="page"><div class="tabs2">' + tabs.map(([k, l]) => '<button data-ot="' + k + '" aria-pressed="' + (ui.oddsTab === k) + '">' + l + '</button>').join('') + '</div>' + body + '</div>';
  }
  const nSeg = () => '<div class="seg sm" data-on2="n">' + [3, 4, 5, 6, 7].map(k => '<button aria-pressed="' + (k === ui.oddsN) + '" data-v="' + k + '">' + k + 'p</button>').join('') + '</div>';
  function oddsCards() {
    const ed = store.settings.ed, n = ui.oddsN, age = ui.oddsAge;
    const D = Cd.EDITIONS[ed];
    const list = D.list.filter(c => c.age === age && c.color !== 'purple').sort((a, b) => Cd.COLORS.indexOf(a.color) - Cd.COLORS.indexOf(b.color) || a.name.localeCompare(b.name));
    const cnt = (c, k) => c.players.filter(p => p <= k).length;
    const deck = Cd.ageDeck(ed, age, n).length;
    const rows = list.map(c => '<tr' + (cnt(c, n) ? '' : ' style="opacity:.4"') + '><td>' + A.chip(c.color) + ' ' + esc(c.name) + '</td>' + [3, 4, 5, 6, 7].map(k => '<td' + (k === n ? ' style="color:var(--text);font-weight:800"' : ' class="muted"') + '>' + (cnt(c, k) || '·') + '</td>').join('') +
      '<td>' + (cnt(c, n) ? Math.round(100 * (1 - hyper0(deck, cnt(c, n), 7))) + '%' : '–') + '</td></tr>').join('');
    const g = age === 3 ? '<p class="small muted" style="margin:0">Guilds: <b style="color:var(--text)">' + (n + 2) + '</b> of the 10 are shuffled into Age III, so each guild is in the game <b style="color:var(--text)">' + Math.round(100 * (n + 2) / 10) + '%</b> of the time.</p>' : '';
    return '<div class="row">' + nSeg() + '</div><div class="seg sm" data-on2="age">' + [1, 2, 3].map(a => '<button aria-pressed="' + (a === age) + '" data-v="' + a + '">Age ' + AGE[a] + '</button>').join('') + '</div>' + g +
      '<div class="panel scroll" style="flex:1;padding:6px 8px"><table class="dt"><thead><tr><th>Card · copies by players</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>In 1st hand ' + qBtn('Chance at least one copy is in your opening hand of 7 this age, with ' + n + ' players (' + deck + ' cards dealt).') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function hyper0(N, K, n) { // chance none of K copies is in a hand of n from N
    let p = 1;
    for (let i = 0; i < n; i++) p *= (N - K - i) / (N - i);
    return Math.max(0, p);
  }
  function oddsDraft() {
    const D = window.SWDraft;
    const ed = store.settings.ed;
    if (!D || !D.ed[ed]) return '<p class="muted">No simulation data.</p>';
    const rows = Object.entries(D.ed[ed]).filter(([, r]) => r.built > 20);
    const k = ui.draftSort;
    rows.sort((a, b) => (b[1][k] || 0) - (a[1][k] || 0));
    const col = name => A.chip(Cd.EDITIONS[ed].byName[name].color);
    const games = D.gamesPerCount * D.counts.length;
    const th = (key, label) => '<th data-ds="' + key + '"' + (k === key ? ' style="color:var(--accent)"' : '') + '>' + label + (k === key ? ' ▾' : '') + '</th>';
    return '<p class="small muted" style="margin:0">From ' + games.toLocaleString() + ' Hard-vs-Hard games (3–7 players). ' + qBtn('Take = how often Hard builds the card when it is in the hand. Win = how often the players who built it won, compared with a fair share (1.00 = average). Pts = their points minus the table average. Strong cards are taken early and go with wins; it is correlation, not proof.') + '</p>' +
      '<div class="panel scroll" style="flex:1;padding:6px 8px"><table class="dt"><thead><tr><th>Card</th>' + th('take', 'Take') + th('win', 'Win') + th('pts', 'Pts') + '</tr></thead><tbody>' +
      rows.map(([name, r]) => '<tr><td>' + col(name) + ' ' + esc(name) + '</td><td>' + Math.round(100 * r.take) + '%</td><td style="color:' + heat(r.win, 0.7, 1.4) + '">' + r.win.toFixed(2) + '</td><td style="color:' + heat(r.pts, -3, 4) + '">' + (r.pts >= 0 ? '+' : '') + r.pts.toFixed(1) + '</td></tr>').join('') +
      '</tbody></table></div>';
  }
  function oddsScience() {
    const [a, b, c, w] = ui.sci;
    const best = E.sciBest({ compass: a, gear: b, tablet: c }, w);
    const next = ['compass', 'gear', 'tablet'].map((k, j) => { const x = [a, b, c]; x[j]++; return E.sciBest({ compass: x[0], gear: x[1], tablet: x[2] }, w).pts - best.pts; });
    const wildNext = E.sciBest({ compass: a, gear: b, tablet: c }, w + 1).pts - best.pts;
    const step = (j, label, ic) => '<div class="row"><span class="grow">' + ic + ' ' + label + '</span><span class="stepper"><button data-sci="' + j + '" data-d="-1">−</button><b>' + ui.sci[j] + '</b><button data-sci="' + j + '" data-d="1">+</button></span><span class="small muted" style="width:52px;text-align:right">' + (j < 3 ? 'next +' + next[j] : 'next +' + wildNext) + '</span></div>';
    return '<div class="twocol"><div class="panel" style="display:flex;flex-direction:column;gap:8px">' +
      step(0, 'Compass', A.sci('compass')) + step(1, 'Gear', A.sci('gear')) + step(2, 'Tablet', A.sci('tablet')) + step(3, 'Any symbol', A.wild()) +
      '<div class="row"><span class="grow label">Science points</span><span class="bigval">' + best.pts + '</span></div>' +
      (w ? '<p class="small muted" style="margin:0">Best use of the wildcards: compass +' + best.add[0] + ', gear +' + best.add[1] + ', tablet +' + best.add[2] + '.</p>' : '') + '</div>' +
      '<div class="panel small"><div class="label" style="margin-bottom:6px">Why science snowballs ' + qBtn('Each symbol type scores its count squared, and every full set of three different symbols adds 7. So the 4th copy of one symbol is worth 7 points on its own, and finishing a set is worth 7 plus the square growth.') + '</div>' +
      '<table class="dt"><thead><tr><th>Symbols</th><th>Points</th><th>Per card</th></tr></thead><tbody>' +
      [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 0, 0], [3, 2, 1], [4, 2, 1], [5, 2, 2]].map(x => { const p = E.sciScore(x[0], x[1], x[2]); return '<tr><td>' + x.join(' / ') + '</td><td>' + p + '</td><td>' + (p / (x[0] + x[1] + x[2])).toFixed(1) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  function oddsMilitary() {
    const m = ui.mil || (ui.mil = { me: 3, l: 2, r: 4, age: 2 });
    const win = { 1: 1, 2: 3, 3: 5 }[m.age];
    const res = x => (m.me > x ? '+' + win : m.me < x ? '−1' : '0');
    const tot = [m.l, m.r].reduce((a, x) => a + (m.me > x ? win : m.me < x ? -1 : 0), 0);
    const step = (k, label) => '<div class="row"><span class="grow">' + label + '</span><span class="stepper"><button data-mil="' + k + '" data-d="-1">−</button><b>' + m[k] + '</b><button data-mil="' + k + '" data-d="1">+</button></span></div>';
    return '<div class="twocol"><div class="panel" style="display:flex;flex-direction:column;gap:8px">' +
      '<div class="seg sm" data-on2="milage">' + [1, 2, 3].map(a => '<button aria-pressed="' + (a === m.age) + '" data-v="' + a + '">End of Age ' + AGE[a] + '</button>').join('') + '</div>' +
      step('l', '◀ Left shields') + step('me', A.shield() + ' Your shields') + step('r', 'Right shields ▶') +
      '<div class="row"><span class="grow">Left: <b>' + res(m.l) + '</b> · Right: <b>' + res(m.r) + '</b></span><span class="bigval" style="color:' + heat(tot, -2, 10) + '">' + (tot > 0 ? '+' : '') + tot + '</span></div></div>' +
      '<div class="panel small"><div class="label" style="margin-bottom:6px">Tokens per age ' + qBtn('After each age you compare shields with each neighbour separately. More shields wins a token worth 1, 3 or 5 points by age; fewer loses 1 point; a tie gives nothing. Shields carry over between ages.') + '</div>' +
      '<table class="dt"><thead><tr><th></th><th>Win</th><th>Loss</th><th>Swing</th></tr></thead><tbody>' +
      [1, 2, 3].map(a => '<tr><td>Age ' + AGE[a] + '</td><td>+' + { 1: 1, 2: 3, 3: 5 }[a] + '</td><td>−1</td><td>' + ({ 1: 1, 2: 3, 3: 5 }[a] + 1) + '</td></tr>').join('') +
      '<tr><td>Most possible</td><td>+18</td><td>−6</td><td>24</td></tr></tbody></table>' +
      '<p class="muted" style="margin:8px 0 0">One shield more than a neighbour in Age III is worth up to 6 points against that neighbour alone.</p></div></div>';
  }
  function oddsHands() {
    const n = ui.oddsN;
    const L = 'ABCDEFG';
    const rows = [1, 2, 3, 4, 5, 6].map(t => { const h = (t - 1) % n; return '<tr><td>Turn ' + t + '</td><td><b>' + L[h] + '</b></td><td>' + (8 - t) + '</td><td>' + (t > n ? 'again (' + (t - n) + ' → ' + t + ')' : 'first look') + '</td></tr>'; }).join('');
    const twice = Math.max(0, 6 - n);
    return '<div class="row">' + nSeg() + '</div>' +
      '<div class="twocol"><div class="panel scroll" style="padding:6px 8px"><table class="dt"><thead><tr><th>Turn</th><th>Hand</th><th>Cards</th><th>Seen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="panel small"><p style="margin:0">With <b>' + n + '</b> players a hand comes back after <b>' + n + '</b> turns. ' +
      (twice ? 'You see <b>' + twice + '</b> hand' + (twice > 1 ? 's' : '') + ' twice each age: what you leave in them may come back to you.' : 'You never see a hand twice, so anything you pass is gone.') + '</p>' +
      '<p class="muted" style="margin:8px 0 0">' + qBtn('A card you pass reaches your next neighbour first (left in Ages I and III, right in Age II). If it is a strong card for them, taking it yourself, even to sell or to build a wonder stage, is called hate drafting. The game screen tells you whether the next player can build the card you are looking at.') + ' Passing direction: Age I ◀, Age II ▶, Age III ◀.</p></div></div>';
  }
  vOdds.addEventListener('click', e => {
    const t = e.target;
    const ot = t.closest('[data-ot]');
    if (ot) { ui.oddsTab = ot.dataset.ot; renderOdds(); return; }
    const o2 = t.closest('[data-on2] button');
    if (o2) {
      const k = o2.parentElement.dataset.on2;
      if (k === 'n') ui.oddsN = Number(o2.dataset.v);
      else if (k === 'age') ui.oddsAge = Number(o2.dataset.v);
      else if (k === 'milage') ui.mil.age = Number(o2.dataset.v);
      renderOdds(); return;
    }
    const ds = t.closest('[data-ds]');
    if (ds) { ui.draftSort = ds.dataset.ds; renderOdds(); return; }
    const sc = t.closest('[data-sci]');
    if (sc) { const j = Number(sc.dataset.sci); ui.sci[j] = Math.max(0, Math.min(12, ui.sci[j] + Number(sc.dataset.d))); renderOdds(); return; }
    const ml = t.closest('[data-mil]');
    if (ml) { const k = ml.dataset.mil; ui.mil[k] = Math.max(0, Math.min(25, ui.mil[k] + Number(ml.dataset.d))); renderOdds(); return; }
  });

  // ================================================================== STUDY
  const vStudy = $('#v-study');
  function renderStudy() {
    const L = store.last;
    if (!L || !L.view || !L.view.result) {
      vStudy.innerHTML = '<div class="page"><div class="panel"><b>No finished game yet</b><p class="muted small" style="margin:6px 0 0">Play a game to the end. Every pick you make is compared with what the Hard computer would have picked, and the points you gave up are added up here.</p></div></div>';
      return;
    }
    const v = L.view, me = L.me || 0, dec = L.dec || [];
    const R = v.result;
    const lost = dec.reduce((a, d) => a + d.lost, 0);
    const same = dec.filter(d => d.lost < 0.05).length;
    const byAge = [1, 2, 3].map(a => dec.filter(d => d.age === a).reduce((s, d) => s + d.lost, 0));
    const word = d => (d.kind === 'sell' ? 'Sell ' : d.kind === 'wonder' ? 'Stage: ' : '') + esc(E.card(v, d.id).name);
    const rows = dec.map(d => '<tr><td class="muted">' + AGE[d.age] + '·' + d.turn + '</td><td>' + word(d.chose) + '</td><td>' + (d.lost < 0.05 ? '<span class="ok">same</span>' : word(d.best)) + '</td><td style="color:' + heat(-d.lost, -3, 0) + '">' + (d.lost < 0.05 ? '0' : '−' + d.lost.toFixed(1)) + '</td></tr>').join('');
    vStudy.innerHTML = '<div class="page"><div class="twocol" style="flex:1;min-height:0">' +
      '<div style="display:flex;flex-direction:column;gap:8px;min-height:0">' +
      '<div class="panel"><div class="row"><span class="label grow">Your last game</span>' + qBtn('Points lost = how many points (Hard\'s estimate) your pick was worth less than Hard\'s favourite pick in the same spot. It is an estimate, not the truth: Hard can be wrong too.') + '</div>' +
      '<div class="row" style="gap:16px;margin-top:6px;flex-wrap:wrap"><div><div class="bigval">' + R.scores[me].total + '</div><div class="small muted">points · place ' + placeOf(v, me) + '/' + v.n + '</div></div>' +
      '<div><div class="bigval" style="color:' + heat(-lost, -15, 0) + '">' + lost.toFixed(1) + '</div><div class="small muted">points lost</div></div>' +
      '<div><div class="bigval">' + (dec.length ? Math.round(100 * same / dec.length) : 0) + '%</div><div class="small muted">same as Hard</div></div></div>' +
      '<div class="small muted" style="margin-top:6px">Lost by age: ' + byAge.map((x, i) => 'Age ' + AGE[i + 1] + ' <b style="color:var(--text)">' + x.toFixed(1) + '</b>').join(' · ') + '</div></div>' +
      '<div class="panel scroll" style="overflow-x:auto">' + scoreTable(v, me) + '</div></div>' +
      '<div class="panel scroll" style="min-height:0;padding:6px 8px">' + (dec.length ? '<table class="dt"><thead><tr><th>Turn</th><th>You</th><th>Hard</th><th>Lost</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<p class="muted small">No picks recorded for this game.</p>') + '</div>' +
      '</div>' + replayHTML(L) + '</div>';
  }

  // ---- Replay: the game is dealt again from its seed and your actions are applied one by one (the computers'
  // picks come from the same seeded dice, so every turn comes back exactly). One frame per turn that ended.
  function replayFrames(L) {
    if (!L.init || !L.acts) return null;
    if (ui.replay && ui.replay.when === L.when) return ui.replay.frames;
    let frames = null;
    try {
      let st = E.newGame(JSON.parse(JSON.stringify(L.init)));
      const seen = new Set(), out = [];
      const grab = () => { const v = E.view(st, L.me || 0); const k = (v.log || []).length; if (k && !seen.has(k)) { seen.add(k); out.push(v); } };
      grab();
      for (const a of L.acts) { st = E.apply(st, L.me || 0, a); grab(); }
      const fin = out[out.length - 1];
      // the replay must end where the game ended, or it isn't shown
      if (fin && fin.result && fin.result.scores.every((s, i) => s.total === L.view.result.scores[i].total)) frames = out;
    } catch (e) { frames = null; }
    ui.replay = { when: L.when, frames, i: frames ? 0 : -1 };
    return frames;
  }
  function replayHTML(L) {
    const F = replayFrames(L);
    if (!F || !F.length) return '';
    const i = Math.max(0, Math.min(F.length - 1, ui.replay.i)), v = F[i], T = v.log[v.log.length - 1];
    const me = L.me || 0;
    const d = (L.dec || []).find(x => x.age === T.age && x.turn === T.turn);
    const moves = T.moves.slice().sort((a, b) => (a.s === me ? -1 : b.s === me ? 1 : a.s - b.s)).map(m => '<li>' + esc(m.s === me ? 'You' : v.players[m.s].name) + ' ' +
      (m.t === 'build' ? 'built <b>' + esc(card(v, m.id).name) + '</b>' : m.t === 'wonder' ? 'built wonder stage ' + m.stage : 'sold a card') + '</li>').join('');
    const word = x => (x.kind === 'sell' ? 'Sell ' : x.kind === 'wonder' ? 'Stage: ' : '') + esc(E.card(v, x.id).name);
    return '<div class="panel replay" style="gap:6px"><div class="row"><span class="label grow">Replay</span>' +
      '<button class="btn small" data-rp="-1"' + (i ? '' : ' disabled') + ' aria-label="Previous turn">‹</button>' +
      '<b class="small" style="min-width:104px;text-align:center">Age ' + AGE[T.age] + ' · turn ' + T.turn + '</b>' +
      '<button class="btn small" data-rp="1"' + (i < F.length - 1 ? '' : ' disabled') + ' aria-label="Next turn">›</button></div>' +
      '<input type="range" min="0" max="' + (F.length - 1) + '" value="' + i + '" data-rpr aria-label="Turn" style="width:100%">' +
      (d && d.lost >= 0.05 ? '<div class="small muted">Hard would have: <b style="color:var(--text)">' + word(d.best) + '</b> (−' + d.lost.toFixed(1) + ')</div>' : '') +
      '<ul class="log">' + moves + '</ul>' +
      '<div class="rp-rows">' + v.players.map((p, s) => playerRow(v, s)).join('') + '</div></div>';
  }
  vStudy.addEventListener('click', e => {
    const b = e.target.closest('[data-rp]');
    if (!b || !ui.replay || !ui.replay.frames) return;
    ui.replay.i = Math.max(0, Math.min(ui.replay.frames.length - 1, ui.replay.i + Number(b.dataset.rp)));
    renderStudy();
  });
  vStudy.addEventListener('input', e => {
    if (!e.target.matches('[data-rpr]') || !ui.replay || !ui.replay.frames) return;
    ui.replay.i = Number(e.target.value);
    const keep = vStudy.querySelector('.replay');
    renderStudy();
    const r = vStudy.querySelector('[data-rpr]'); if (r && keep) r.focus();
  });

  // ================================================================== SETTINGS
  const vSet = $('#v-settings');
  function renderSettings() {
    const s = store.settings;
    const sw = (k, label, sub) => '<div class="setrow"><div class="grow"><b>' + label + '</b><span>' + sub + '</span></div><label class="switch"><input type="checkbox" data-sw="' + k + '"' + (s[k] ? ' checked' : '') + '><span></span></label></div>';
    vSet.innerHTML = '<div class="set scroll">' +
      '<div class="panel"><div class="row"><span class="label grow">Edition</span>' + qBtn('1st edition (2010) is the default and is checked card by card against the published rulebook. 2nd edition (2020) changes some costs, points and wonder boards, and swaps a few cards (Well for Pawnshop, Decorators for Strategists). Details: docs/rules-check.md.') + '</div>' +
      '<div class="seg" data-ed style="margin-top:8px"><button aria-pressed="' + (s.ed === 1) + '" data-v="1">1st edition</button><button aria-pressed="' + (s.ed === 2) + '" data-v="2">2nd edition</button></div></div>' +
      '<div class="panel"><div class="row"><span class="label grow">Wonder sides</span>' + qBtn('The 1st-edition rules deal each wonder with a random side; the 2nd edition lets everyone choose. Rulebook default follows your edition. Side A is easier; side B is trickier.') + '</div>' +
      '<div class="seg sm" data-sides style="margin-top:8px">' + [['default', 'Rulebook'], ['random', 'Random'], ['choose', 'Choose'], ['A', 'All A'], ['B', 'All B']].map(([k, l]) => '<button aria-pressed="' + (s.sides === k) + '" data-v="' + k + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="panel">' + sw('values', 'Card values', 'Hard’s points estimate on every card') + sw('odds', 'Odds line', 'Hand comes back, next player, copies') + '</div>' +
      (SC || SP ? '<div class="panel">' +
        (SP ? '<div class="setrow"><div class="grow"><b>My stats</b><span>Wins per level, rating, awards and the Daily.</span></div><button class="btn small" data-stats>Open</button></div>' : '') +
        (SC ? '<div class="setrow"><div class="grow"><b>Rules</b><span>How to play, in short sections.</span></div><button class="btn small" data-rules>Open</button></div>' +
          '<div class="setrow"><div class="grow"><b>Guided game</b><span>One game against two Easy computers with tips on screen.</span></div><button class="btn small" data-tutorial>Start</button></div>' : '') + '</div>' : '') +
      '<div class="panel" id="fx-panel"><div class="row"><span class="label grow">Sound &amp; effects</span></div></div>' +
      '<div class="panel"><div class="setrow"><div class="grow"><b>Online play</b><span>Friends on their own phones, any mix with computers.</span></div><button class="btn small" data-online>Open</button></div></div>' +
      '<div class="panel"><div class="setrow"><div class="grow"><b>Reset</b><span>Clears the saved game, last game, scores and settings.</span></div><button class="btn small" data-reset>Reset</button></div></div>' +
      '<p class="ver">7 Wonders Lab ' + VERSION + ' · <a href="../">more board &amp; card games</a><br>Fan-made study tool, not affiliated with the publisher. Art drawn for this site.</p>' +
      '</div>';
    FX.renderSettings($('#fx-panel', vSet));
  }
  vSet.addEventListener('click', e => {
    const b = e.target.closest('[data-ed] button');
    if (b) { store.settings.ed = Number(b.dataset.v); save(); renderSettings(); if (table && !table.online) toast('Applies to your next game'); return; }
    const sd = e.target.closest('[data-sides] button');
    if (sd) { store.settings.sides = sd.dataset.v; save(); renderSettings(); return; }
    if (e.target.closest('[data-rules]')) { openRules(); return; }
    if (e.target.closest('[data-stats]')) { openStats(); return; }
    if (e.target.closest('[data-tutorial]')) { startTutorial(); return; }
    if (e.target.closest('[data-online]')) { if (!table) ui.online = true; showTab('play', true); if (table && !table.online) toast('Finish or quit the current game first'); return; }
    if (e.target.closest('[data-reset]')) confirmBox('Clear everything saved on this device?', 'Reset', () => {
      try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
      location.reload();
    });
  });
  vSet.addEventListener('change', e => { const k = e.target.dataset.sw; if (k) { store.settings[k] = e.target.checked; save(); } });

  // ------------------------------------------------------------------ boot
  if (SP) {
    SP.init(startDaily);
    window.Profile.onChange(what => {
      if (what === 'close' && !ui.closingQuiet) modalClosedByHand();
      if ((what === 'result' || what === 'me' || what === 'reset' || what === 'import') && ui.tab === 'play' && !table && !ui.online) renderPlay();
    });
  }
  if (SC) {
    const live = () => (table && !table.online && store.game && store.game.tutorial ? { v: table.view(), sel: ui.sel } : null);
    tour = COACH.tour({ id: SC.ID, steps: SC.steps(live), pauseIf: () => ui.tab !== 'play' || !live() || modalOpen() });
    new MutationObserver(() => { if ((table || ui.online) && COACH.closeOffer) COACH.closeOffer(); COACH.update(); }).observe(vPlay, { childList: true });
  }
  if (window.PWA) window.PWA.safeToReload = () => {
    if (modalOpen() || (table && table.online) || store.online || ui.online) return false;
    // a game in progress is saved after every move; reload only between games or away from the table
    return !table || !!(store.game && store.game.finished) || ui.tab !== 'play';
  };
  const start = (location.hash || '').slice(1);
  if (['play', 'score', 'odds', 'study', 'settings'].indexOf(start) >= 0) ui.tab = start;
  try { history.replaceState({ tab: ui.tab }, '', '#' + ui.tab); } catch (e) { /* ignore */ }
  showTab(ui.tab, false);
  if (table) hist({ tab: ui.tab, g: 'game' });  // a resumed game: Back stays in the game
  if (store.online) {
    ui.online = true; net.connecting = true; renderPlay();
    loadOnline().then(r => r.resume()).then(ok => {
      net.connecting = false;
      if (!ok) { store.online = false; ui.online = false; save(); }
      renderPlay();
    }).catch(() => { net.connecting = false; renderPlay(); });
  }
  if (SC && store.game && store.game.tutorial && !store.game.finished && table) tour.resume();
  offerTutorial();
  window.SWApp = { store, get table() { return table; }, act: a => doAct(a), net, version: VERSION, ui, startGame, startDaily, startTutorial, undo, canUndo, openRules, openStats, recordGame };
})();
