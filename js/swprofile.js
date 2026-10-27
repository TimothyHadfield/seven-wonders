/* swprofile.js: 7 Wonders' part of the player profile (shared kit js/profile.js, never edit that one here):
   the computer levels' ratings, the achievements, the Daily game and turning a game into a result.

   What counts as one game: a whole game vs computers. Quitting after your first pick counts as a loss.
   A game where you used Undo, the hint or the card values counts as "with help" and isn't rated.
   The guided first game and online games aren't counted. Plain script: window.SWProfile in the browser,
   module.exports in node. */
(function (root) {
  'use strict';
  // Elo of each level from tools/ladder.js (one computer among the others, 3 and 4 players, 1st edition, 2026-10-27):
  // p = the share of opponents it finished ahead of; difference = 400·log10(p / (1 − p)), rounded to 10, Easy = 1200.
  // Measured: Medium ahead of 83% of Easys (+280), Hard ahead of 82% of Mediums (+270) and 96% of Easys (+550).
  const LEVELS = [{ id: 'easy', name: 'Easy', rating: 1200 }, { id: 'medium', name: 'Medium', rating: 1480 }, { id: 'hard', name: 'Hard', rating: 1750 }];
  const RANK = { easy: 0, medium: 1, hard: 2 };

  const won = c => !!(c.last && c.last.won);
  const ex = c => (c.last && c.last.extra) || {};
  const ACH = [
    { id: 'first', title: 'First win', desc: 'Win a game of 7 Wonders', test: c => c.stats.wins >= 1 },
    { id: 'medium', title: 'Rising city', desc: 'Win against Medium computers', test: c => won(c) && RANK[c.last.level] >= 1 },
    { id: 'hard', title: 'Wonder of the world', desc: 'Win against Hard computers', test: c => won(c) && c.last.level === 'hard' },
    { id: 'seven', title: 'Full table', desc: 'Win a 7-player game', test: c => won(c) && ex(c).n >= 7 },
    { id: 'stages', title: 'Master builder', desc: 'Finish every stage of your wonder', test: c => !!ex(c).allStages },
    { id: 'science', title: 'Scholar', desc: 'Score 30 or more from science', test: c => ex(c).science >= 30 },
    { id: 'military', title: 'Undefeated', desc: 'Win every battle (18 military points)', test: c => ex(c).military >= 18 },
    { id: 'sixty', title: 'Golden age', desc: 'Score 60 points or more', test: c => ex(c).total >= 60 },
    { id: 'streak', title: 'Hat trick', desc: 'Win 3 in a row', test: c => c.stats.bestStreak >= 3 },
    { id: 'daily', title: 'Daily builder', desc: '3-day Daily streak', test: c => c.daily.streak >= 3 },
  ];

  // Today's Daily game: the same wonders, sides, deals and computers for everyone that day (1st edition, you vs 3 Hard).
  const DAILY = { level: 'hard', n: 4, ed: 1, sides: 'random' };

  function init(onDaily) {
    if (!root.Profile) return false;
    root.Profile.init({
      game: 'seven-wonders', levels: LEVELS, achievements: ACH,
      modes: { computer: { name: 'vs computer' }, help: { name: 'With help' }, online: { hide: true } },
      daily: { title: 'Daily game', onPlay: () => onDaily && onDaily() },
    });
    return true;
  }

  /** A finished (or abandoned) game -> Profile.recordResult input. g: { v (engine view), me, level, helped, daily } */
  function result(g) {
    const v = g.v, me = g.me || 0;
    const p = v.players[me];
    let w = false, draw = false, extra = { n: v.n, quit: !v.result };
    if (v.result) {
      const R = v.result, s = R.scores[me];
      if (R.winners.indexOf(me) >= 0) { if (R.winners.length > 1) draw = true; else w = true; }
      extra = { n: v.n, total: s.total, science: s.science, military: s.military, wonder: s.wonder, coins: p.coins,
        allStages: !!(g.stagesTotal && p.stages >= g.stagesTotal), quit: false };
    }
    const mode = g.helped ? 'help' : 'computer';
    return { mode, level: mode === 'computer' ? g.level : null, won: w, draw, score: extra.total || 0, daily: !!g.daily, extra };
  }

  const api = { LEVELS, ACH, DAILY, RANK, init, result };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.SWProfile = api;
})(typeof window !== 'undefined' ? window : globalThis);
