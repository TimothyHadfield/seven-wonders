/* swcoach.js: 7 Wonders' guided first game and rules sheet, for the shared kit js/coach.js (never edit that one here).
   SWCoach.RULES  -> COACH.rules() options (our own words, no rulebook text)
   SWCoach.steps(get) -> the tour steps; get() returns { v, sel } for the game on screen (or null)
   SWCoach.GAME   -> the guided game: 3 players, you vs 2 Easy computers, 1st edition, every wonder on side A, seed 11.
   The guided game is never counted in My stats. */
(function (root) {
  'use strict';
  const ID = 'seven-wonders-first-game';
  const GAME = { seed: 11, n: 3, level: 'easy', ed: 1, sides: 'A' };

  const RULES = {
    title: 'How to play 7 Wonders',
    intro: 'Three ages of card drafting. Build a city and a wonder; the most points after Age III wins.',
    sections: [
      { id: 'goal', title: 'Goal', short: 'Goal', html:
        '<p>Have the most points at the end of Age III. Points come from military tokens, coins, your wonder, blue buildings, science, yellow buildings and purple guilds.</p>' +
        '<p>On a tie, the player with more coins wins.</p>' },
      { id: 'turn', title: 'A turn', short: 'Turn', html:
        '<p>At the start of each age everyone gets 7 cards. Each turn, everyone secretly picks one card from their hand, then all picks are shown together.</p>' +
        '<p>With the card you picked you do one of three things:</p>' +
        '<ol><li><b>Build</b> it in your city, paying its cost.</li><li><b>Stage</b>: tuck it under your wonder to build its next stage (pay the stage cost; the card itself doesn\'t matter).</li>' +
        '<li><b>Sell</b> it: discard it face down for 3 coins.</li></ol>' +
        '<p>Then you pass the rest of your hand to a neighbour: <b>left</b> in Ages I and III, <b>right</b> in Age II. After six turns the 7th card is thrown away and the age ends.</p>' },
      { id: 'cost', title: 'Paying for cards', short: 'Costs', html:
        '<p>A card shows its cost down the left side: coins and/or resources. Your brown and grey cards (and your wonder) make one of each resource they show every turn; they are never used up.</p>' +
        '<p>Missing a resource? Buy it from the player on your left or right if their city makes it: <b>2 coins</b> each, paid to them. Trading posts and the marketplace make it 1 coin. You can\'t buy from players further away.</p>' +
        '<p class="tip">Chains: some cards name an earlier card. If you built that one, the later card is free.</p>' },
      { id: 'wonder', title: 'Your wonder', short: 'Wonder', html:
        '<p>Your board has 2 to 4 stages, built from left to right. Each stage costs the resources shown and gives points, coins, shields or a special power.</p>' +
        '<p>Side A is simpler; side B has different stages. Settings chooses how sides are dealt.</p>' },
      { id: 'military', title: 'Military', short: 'Military', html:
        '<p>Red cards give shields. At the end of each age you compare your shields with each neighbour on their own.</p>' +
        '<table><tr><th></th><th>More shields</th><th>Fewer</th></tr><tr><td>Age I</td><td>+1</td><td>−1</td></tr><tr><td>Age II</td><td>+3</td><td>−1</td></tr><tr><td>Age III</td><td>+5</td><td>−1</td></tr></table>' +
        '<p>A tie gives nothing. Shields stay in your city, so they count again in later ages.</p>' },
      { id: 'science', title: 'Science', short: 'Science', html:
        '<p>Green cards show one of three symbols. Each symbol type scores its count squared (3 tablets = 9), and every set of three different symbols adds 7.</p>' +
        '<p class="tip">That is why science snowballs: the 4th copy of a symbol is worth 7 on its own.</p>' },
      { id: 'end', title: 'Scoring', short: 'Score', html:
        '<ul><li>Military tokens (can be negative)</li><li>Coins: 1 point per 3</li><li>Wonder stages</li><li>Blue buildings</li><li>Science</li>' +
        '<li>Yellow buildings from Age III (some score for cards you own)</li><li>Purple guilds (score for what you and your neighbours built)</li></ul>' +
        '<p>Guilds come only in Age III: as many as there are players plus two.</p>' },
      { id: 'leaders', title: 'Leaders expansion (optional)', short: 'Leaders', html:
        '<p>Off by default; switch it on in Settings. Everyone starts with <b>6 coins</b> instead of 3.</p>' +
        '<p><b>Draft</b>: before Age I you get 4 leaders. Keep one and pass the rest to the right, three times; the last one handed to you is your fourth.</p>' +
        '<p><b>Each age</b> starts with everyone playing one kept leader at the same time: <b>recruit</b> it (pay its coins to the bank), use it to build your next <b>wonder stage</b> (pay the stage cost), or <b>sell</b> it for 3 coins.</p>' +
        '<p>You play three of your four leaders; the last one goes back to the box before Age III. Tap a city to read its leaders.</p>' +
        '<p class="tip">Cheap leaders that fit your plan early (a colour you collect, a science symbol) usually beat expensive ones you can\'t afford until Age III.</p>' },
      { id: 'videos', title: 'Videos', short: 'Videos', html:
        '<p>Free videos on YouTube (they open in a new tab).</p>' +
        '<ul class="vids">' +
        '<li><a href="https://www.youtube.com/watch?v=XnBLz61FJYw" target="_blank" rel="noopener">Learn to play in 10 minutes</a> · Repos Production (the publisher)</li>' +
        '<li><a href="https://www.youtube.com/watch?v=z_Wfdn5Es8U" target="_blank" rel="noopener">How to play (1st edition)</a> · Watch It Played</li>' +
        '<li><a href="https://www.youtube.com/watch?v=QVLUu7qkLWI" target="_blank" rel="noopener">How to play (2nd edition)</a> · Watch It Played</li>' +
        '<li><a href="https://www.youtube.com/watch?v=mQiPOeFLcXw" target="_blank" rel="noopener">12 basic strategy tips</a> · Wonderful Plays</li>' +
        '<li><a href="https://www.youtube.com/watch?v=f6QrBlHfGSQ" target="_blank" rel="noopener">How to play the Leaders expansion</a> · Prague Golf &amp; Games</li>' +
        '</ul>' },
      { id: 'site', title: 'This site', short: 'Site', html:
        '<ul><li><b>Odds line</b>: whether this hand comes back to you, whether the next player can build the card, how many copies are in the age.</li>' +
        '<li><b>Hint</b> (bulb): what Hard would pick. <b>Undo</b>: take back your last pick. A game with either counts as "with help" in My stats.</li>' +
        '<li><b>Daily</b>: the same deal for everyone today, against 3 Hard computers.</li>' +
        '<li><b>Study</b>: after a game, every pick next to Hard\'s and a turn-by-turn replay.</li></ul>' },
    ],
  };

  function steps(get) {
    const v = () => { const x = get(); return x && x.v; };
    const mine = () => { const x = v(); if (!x) return 0; let n = 0; (x.log || []).forEach(L => L.moves.forEach(m => { if (m.s === 0) n++; })); return n; };
    const age = () => (v() ? v().age : 0);
    const picking = () => { const x = v(); return !!(x && (x.phase === 'pick' || x.phase === 'seventh') && x.waiting.indexOf(0) >= 0); };
    return [
      { title: 'Your hand', target: '#game .hand', when: picking,
        text: 'Each age everyone gets 7 cards and picks one at the same time. The rest of your hand then passes to a neighbour.' },
      { title: 'Look at a card', target: '#game .hand', when: picking, until: () => { const x = get(); return !!(x && x.sel >= 0); },
        text: 'Tap a card. Bright cards you can build now; grey ones you can\'t pay for.' },
      { title: 'Build, Stage or Sell', target: '#game .act', until: () => mine() >= 1,
        text: 'Build puts the card in your city. Stage tucks it under your wonder for its next stage. Sell throws it away for 3 coins. Pick one.' },
      { title: 'Your city', target: '#game .me', when: () => mine() >= 1 && picking(),
        text: 'Built cards stack here by colour. Brown and grey make resources, blue are points, red are shields, green is science, yellow brings coins.' },
      { title: 'Your neighbours', target: '#game .nb[data-nb="L"]', when: () => mine() >= 1 && picking(),
        text: 'Missing a resource? Buy it from the player on your left or right. The chip shows what they make and the price per unit.' },
      { title: 'Your wonder', target: '#game .me .wboard', when: () => mine() >= 2 && picking(),
        text: 'Each stage costs what is shown before the arrow and gives what is after it. The blue box is your next stage.' },
      { title: 'Hands pass on', target: '#game .ctr', when: () => mine() >= 3 && picking(),
        text: 'Hands go left in Ages I and III and right in Age II. The 7th card of each age is thrown away.' },
      { title: 'Battles', target: '#game [data-fx="shield"]', when: () => age() >= 2 && picking(),
        text: 'Age I is over. Your shields were compared with each neighbour\'s: more wins a token (1, 3, 5 points by age), fewer loses 1.' },
      { title: 'Points so far', target: '#game .laurel', when: () => age() >= 2 && mine() >= 8 && picking(),
        text: 'This badge is your score if the game ended now. Coins count 1 point per 3. Green science scores each symbol squared, plus 7 a set.' },
      { title: 'Age III: guilds', target: '#game .hand', when: () => age() >= 3 && picking(),
        text: 'Purple guilds only come in Age III. They score for cards you and your neighbours built.' },
      { title: 'You\'re set', target: '#game', when: () => age() >= 3 && mine() >= 14, next: true,
        text: 'Finish against the two Easy computers. The rules are in Settings any time.' },
    ];
  }

  const api = { ID, GAME, RULES, steps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.SWCoach = api;
})(typeof window !== 'undefined' ? window : globalThis);
