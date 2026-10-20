/* 7 Wonders base game data: every Age card and wonder board, 1st edition (2010) and 2nd edition (2020).
   Facts only (names, costs, counts, effects), checked source by source in docs/rules-check.md.
   Resources: W wood, S stone, C clay, O ore (raw) · G glass, L loom (textile), P papyrus (manufactured).
   A cost string lists one letter per resource; a leading number is a coin cost ("1" = 1 coin).
   p = the player counts printed on the card: one copy enters the deck for each value <= players. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SWCards = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RAW = ['W', 'S', 'C', 'O'];
  const MAN = ['G', 'L', 'P'];
  const RES_NAME = { W: 'Wood', S: 'Stone', C: 'Clay', O: 'Ore', G: 'Glass', L: 'Loom', P: 'Papyrus' };
  const SCI = ['compass', 'gear', 'tablet'];
  const COLORS = ['brown', 'grey', 'blue', 'yellow', 'red', 'green', 'purple'];
  const COLOR_NAME = { brown: 'Raw material', grey: 'Manufactured', blue: 'Civilian', yellow: 'Commercial', red: 'Military', green: 'Science', purple: 'Guild' };

  // [name, age, color, cost, playerCounts, effect, chainParents]
  // effect keys: prod (units joined by '', choices by '/'), vp, sh (shields), sci, wild (any science symbol),
  // coins, trade {raw:'L'|'R'|'LR', man:'LR'}, per [{of, who:'S'|'N'|'SN', coin, vp}], deco (vp if wonder done)
  const ED1 = [
    // ---------------------------------------------------------------- Age I
    ['Lumber Yard', 1, 'brown', '', [3, 4], { prod: 'W' }],
    ['Stone Pit', 1, 'brown', '', [3, 5], { prod: 'S' }],
    ['Clay Pool', 1, 'brown', '', [3, 5], { prod: 'C' }],
    ['Ore Vein', 1, 'brown', '', [3, 4], { prod: 'O' }],
    ['Tree Farm', 1, 'brown', '1', [6], { prod: 'W/C' }],
    ['Excavation', 1, 'brown', '1', [4], { prod: 'S/C' }],
    ['Clay Pit', 1, 'brown', '1', [3], { prod: 'C/O' }],
    ['Timber Yard', 1, 'brown', '1', [3], { prod: 'S/W' }],
    ['Forest Cave', 1, 'brown', '1', [5], { prod: 'W/O' }],
    ['Mine', 1, 'brown', '1', [6], { prod: 'S/O' }],
    ['Loom', 1, 'grey', '', [3, 6], { prod: 'L' }],
    ['Glassworks', 1, 'grey', '', [3, 6], { prod: 'G' }],
    ['Press', 1, 'grey', '', [3, 6], { prod: 'P' }],
    ['Pawnshop', 1, 'blue', '', [4, 7], { vp: 3 }],
    ['Baths', 1, 'blue', 'S', [3, 7], { vp: 3 }],
    ['Altar', 1, 'blue', '', [3, 5], { vp: 2 }],
    ['Theater', 1, 'blue', '', [3, 6], { vp: 2 }],
    ['Tavern', 1, 'yellow', '', [4, 5, 7], { coins: 5 }],
    ['East Trading Post', 1, 'yellow', '', [3, 7], { trade: { raw: 'R' } }],
    ['West Trading Post', 1, 'yellow', '', [3, 7], { trade: { raw: 'L' } }],
    ['Marketplace', 1, 'yellow', '', [3, 6], { trade: { man: 'LR' } }],
    ['Stockade', 1, 'red', 'W', [3, 7], { sh: 1 }],
    ['Barracks', 1, 'red', 'O', [3, 5], { sh: 1 }],
    ['Guard Tower', 1, 'red', 'C', [3, 4], { sh: 1 }],
    ['Apothecary', 1, 'green', 'L', [3, 5], { sci: 'compass' }],
    ['Workshop', 1, 'green', 'G', [3, 7], { sci: 'gear' }],
    ['Scriptorium', 1, 'green', 'P', [3, 4], { sci: 'tablet' }],
    // ---------------------------------------------------------------- Age II
    ['Sawmill', 2, 'brown', '1', [3, 4], { prod: 'WW' }],
    ['Quarry', 2, 'brown', '1', [3, 4], { prod: 'SS' }],
    ['Brickyard', 2, 'brown', '1', [3, 4], { prod: 'CC' }],
    ['Foundry', 2, 'brown', '1', [3, 4], { prod: 'OO' }],
    ['Loom', 2, 'grey', '', [3, 5], { prod: 'L' }],
    ['Glassworks', 2, 'grey', '', [3, 5], { prod: 'G' }],
    ['Press', 2, 'grey', '', [3, 5], { prod: 'P' }],
    ['Aqueduct', 2, 'blue', 'SSS', [3, 7], { vp: 5 }, ['Baths']],
    ['Temple', 2, 'blue', 'WCG', [3, 6], { vp: 3 }, ['Altar']],
    ['Statue', 2, 'blue', 'OOW', [3, 7], { vp: 4 }, ['Theater']],
    ['Courthouse', 2, 'blue', 'CCL', [3, 5], { vp: 4 }, ['Scriptorium']],
    ['Forum', 2, 'yellow', 'CC', [3, 6, 7], { prod: 'G/L/P' }, ['East Trading Post', 'West Trading Post']],
    ['Caravansery', 2, 'yellow', 'WW', [3, 5, 6], { prod: 'W/S/C/O' }, ['Marketplace']],
    ['Vineyard', 2, 'yellow', '', [3, 6], { per: [{ of: 'brown', who: 'SN', coin: 1 }] }],
    ['Bazar', 2, 'yellow', '', [4, 7], { per: [{ of: 'grey', who: 'SN', coin: 2 }] }],
    ['Walls', 2, 'red', 'SSS', [3, 7], { sh: 2 }],
    ['Training Ground', 2, 'red', 'OOW', [4, 6, 7], { sh: 2 }],
    ['Stables', 2, 'red', 'CWO', [3, 5], { sh: 2 }, ['Apothecary']],
    ['Archery Range', 2, 'red', 'WWO', [3, 6], { sh: 2 }, ['Workshop']],
    ['Dispensary', 2, 'green', 'OOG', [3, 4], { sci: 'compass' }, ['Apothecary']],
    ['Laboratory', 2, 'green', 'CCP', [3, 5], { sci: 'gear' }, ['Workshop']],
    ['Library', 2, 'green', 'SSL', [3, 6], { sci: 'tablet' }, ['Scriptorium']],
    ['School', 2, 'green', 'WP', [3, 7], { sci: 'tablet' }],
    // ---------------------------------------------------------------- Age III
    ['Pantheon', 3, 'blue', 'CCOGPL', [3, 6], { vp: 7 }, ['Temple']],
    ['Gardens', 3, 'blue', 'CCW', [3, 4], { vp: 5 }, ['Statue']],
    ['Town Hall', 3, 'blue', 'SSOG', [3, 5, 6], { vp: 6 }],
    ['Palace', 3, 'blue', 'WSCOGPL', [3, 7], { vp: 8 }],
    ['Senate', 3, 'blue', 'WWSO', [3, 5], { vp: 6 }, ['Library']],
    ['Haven', 3, 'yellow', 'WOL', [3, 4], { per: [{ of: 'brown', who: 'S', coin: 1, vp: 1 }] }, ['Forum']],
    ['Lighthouse', 3, 'yellow', 'SG', [3, 6], { per: [{ of: 'yellow', who: 'S', coin: 1, vp: 1 }] }, ['Caravansery']],
    ['Chamber of Commerce', 3, 'yellow', 'CCP', [4, 6], { per: [{ of: 'grey', who: 'S', coin: 2, vp: 2 }] }],
    ['Arena', 3, 'yellow', 'SSO', [3, 5, 7], { per: [{ of: 'stage', who: 'S', coin: 3, vp: 1 }] }, ['Dispensary']],
    ['Fortifications', 3, 'red', 'OOOS', [3, 7], { sh: 3 }, ['Walls']],
    ['Circus', 3, 'red', 'SSSO', [4, 5, 6], { sh: 3 }, ['Training Ground']],
    ['Arsenal', 3, 'red', 'WWOL', [3, 4, 7], { sh: 3 }],
    ['Siege Workshop', 3, 'red', 'CCCW', [3, 5], { sh: 3 }, ['Laboratory']],
    ['Lodge', 3, 'green', 'CCLP', [3, 6], { sci: 'compass' }, ['Dispensary']],
    ['Observatory', 3, 'green', 'OOGL', [3, 7], { sci: 'gear' }, ['Laboratory']],
    ['University', 3, 'green', 'WWGP', [3, 4], { sci: 'tablet' }, ['Library']],
    ['Academy', 3, 'green', 'SSSG', [3, 7], { sci: 'compass' }, ['School']],
    ['Study', 3, 'green', 'WPL', [3, 5], { sci: 'gear' }, ['School']],
    // Guilds: players + 2 of these are shuffled into Age III
    ['Workers Guild', 3, 'purple', 'OOCSW', [], { per: [{ of: 'brown', who: 'N', vp: 1 }] }],
    ['Craftsmens Guild', 3, 'purple', 'OOSS', [], { per: [{ of: 'grey', who: 'N', vp: 2 }] }],
    ['Traders Guild', 3, 'purple', 'LPG', [], { per: [{ of: 'yellow', who: 'N', vp: 1 }] }],
    ['Philosophers Guild', 3, 'purple', 'CCCLP', [], { per: [{ of: 'green', who: 'N', vp: 1 }] }],
    ['Spies Guild', 3, 'purple', 'CCCG', [], { per: [{ of: 'red', who: 'N', vp: 1 }] }],
    ['Strategists Guild', 3, 'purple', 'OOSL', [], { per: [{ of: 'defeat', who: 'N', vp: 1 }] }],
    ['Shipowners Guild', 3, 'purple', 'WWWGP', [], { per: [{ of: 'brown', who: 'S', vp: 1 }, { of: 'grey', who: 'S', vp: 1 }, { of: 'purple', who: 'S', vp: 1 }] }],
    ['Scientists Guild', 3, 'purple', 'WWOOP', [], { wild: 1 }],
    ['Magistrates Guild', 3, 'purple', 'WWWSL', [], { per: [{ of: 'blue', who: 'N', vp: 1 }] }],
    ['Builders Guild', 3, 'purple', 'SSCCG', [], { per: [{ of: 'stage', who: 'SN', vp: 1 }] }],
  ];

  // 2nd edition (2020): same structure; these rows replace or add to the 1st edition list.
  // null = the card is not in the 2nd edition.
  const ED2_PATCH = {
    'Pawnshop': null,
    'Well': ['Well', 1, 'blue', '', [4, 7], { vp: 3 }],
    'Altar': ['Altar', 1, 'blue', '', [3, 5], { vp: 3 }],
    'Theater': ['Theater', 1, 'blue', '', [3, 6], { vp: 3 }],
    'Temple': ['Temple', 2, 'blue', 'WCG', [3, 6], { vp: 4 }],
    'Statue': ['Statue', 2, 'blue', 'OOW', [3, 7], { vp: 4 }, ['Well']],
    'Pantheon': ['Pantheon', 3, 'blue', 'CCOGPL', [3, 6], { vp: 7 }, ['Altar']],
    'Gardens': ['Gardens', 3, 'blue', 'CCW', [3, 4], { vp: 5 }, ['Theater']],
    'Town Hall': ['Town Hall', 3, 'blue', 'SSOG', [3, 6], { vp: 6 }],
    'Arena': ['Arena', 3, 'yellow', 'SSO', [3, 5], { per: [{ of: 'stage', who: 'S', coin: 3, vp: 1 }] }, ['Dispensary']],
    'Ludus': ['Ludus', 3, 'yellow', 'SO', [5, 7], { per: [{ of: 'red', who: 'S', coin: 3, vp: 1 }] }],
    'Fortifications': ['Fortifications', 3, 'red', 'OOOC', [3, 7], { sh: 3 }, ['Walls']],
    'Circus': ['Circus', 3, 'red', 'SSSO', [4, 6], { sh: 3 }, ['Training Ground']],
    'Arsenal': ['Arsenal', 3, 'red', 'WWOL', [3, 5], { sh: 3 }],
    'Castrum': ['Castrum', 3, 'red', 'CCWP', [4, 7], { sh: 3 }],
    'Strategists Guild': null,
    'Spies Guild': ['Spies Guild', 3, 'purple', 'CCG', [], { per: [{ of: 'red', who: 'N', vp: 1 }] }],
    'Decorators Guild': ['Decorators Guild', 3, 'purple', 'OOSL', [], { deco: 7 }],
    'Builders Guild': ['Builders Guild', 3, 'purple', 'SSSCCG', [], { per: [{ of: 'stage', who: 'SN', vp: 1 }] }],
  };

  // Wonder boards. Stage: [cost, effect]. Effect keys: vp, sh, coins, any ('raw'|'man': one of those each turn,
  // not sellable), wild (science symbol), free ('age' once per age | 'color' first card of each colour |
  // 'first' first card each age | 'last' last card each age), discard (build one discarded card free),
  // seventh (play the last card of each age), tradeRaw (raw materials from both neighbours for 1 coin),
  // copy (copy a neighbour's guild at the end).
  const WONDERS1 = {
    rhodos: { name: 'Rhodos', full: 'The Colossus of Rhodos', res: 'O',
      A: [['WW', { vp: 3 }], ['CCC', { sh: 2 }], ['OOOO', { vp: 7 }]],
      B: [['SSS', { sh: 1, vp: 3, coins: 3 }], ['OOOO', { sh: 1, vp: 4, coins: 4 }]] },
    alexandria: { name: 'Alexandria', full: 'The Lighthouse of Alexandria', res: 'G',
      A: [['SS', { vp: 3 }], ['OO', { any: 'raw' }], ['GG', { vp: 7 }]],
      B: [['CC', { any: 'raw' }], ['WW', { any: 'man' }], ['SSS', { vp: 7 }]] },
    ephesos: { name: 'Ephesos', full: 'The Temple of Artemis in Ephesos', res: 'P',
      A: [['SS', { vp: 3 }], ['WW', { coins: 9 }], ['PP', { vp: 7 }]],
      B: [['SS', { vp: 2, coins: 4 }], ['WW', { vp: 3, coins: 4 }], ['PLG', { vp: 5, coins: 4 }]] },
    babylon: { name: 'Babylon', full: 'The Hanging Gardens of Babylon', res: 'C',
      A: [['CC', { vp: 3 }], ['WWW', { wild: 1 }], ['CCCC', { vp: 7 }]],
      B: [['CL', { vp: 3 }], ['WWG', { seventh: 1 }], ['CCCP', { wild: 1 }]] },
    olympia: { name: 'Olympia', full: 'The Statue of Zeus in Olympia', res: 'W',
      A: [['WW', { vp: 3 }], ['SS', { free: 'age' }], ['OO', { vp: 7 }]],
      B: [['WW', { tradeRaw: 1 }], ['SS', { vp: 5 }], ['LOO', { copy: 1 }]] },
    halikarnassos: { name: 'Halikarnassos', full: 'The Mausoleum of Halikarnassos', res: 'L',
      A: [['CC', { vp: 3 }], ['OOO', { discard: 1 }], ['LL', { vp: 7 }]],
      B: [['OO', { vp: 2, discard: 1 }], ['CCC', { vp: 1, discard: 1 }], ['GPL', { discard: 1 }]] },
    gizah: { name: 'Gizah', full: 'The Pyramids of Gizah', res: 'S',
      A: [['SS', { vp: 3 }], ['WWW', { vp: 5 }], ['SSSS', { vp: 7 }]],
      B: [['WW', { vp: 3 }], ['SSS', { vp: 5 }], ['CCC', { vp: 5 }], ['SSSSP', { vp: 7 }]] },
  };
  const WONDERS2 = {
    rhodos: { name: 'Rhodos', full: 'The Colossus of Rhodos', res: 'O',
      A: [['WW', { vp: 3 }], ['CCC', { sh: 2 }], ['OOOO', { vp: 7 }]],
      B: [['SSS', { sh: 1, vp: 3, coins: 3 }], ['OOOO', { sh: 1, vp: 4, coins: 4 }]] },
    alexandria: { name: 'Alexandria', full: 'The Lighthouse of Alexandria', res: 'G',
      A: [['SS', { vp: 3 }], ['OO', { any: 'raw' }], ['LP', { vp: 7 }]],
      B: [['CC', { any: 'raw' }], ['OOO', { any: 'man' }], ['WWWW', { vp: 7 }]] },
    ephesos: { name: 'Ephesos', full: 'The Temple of Artemis in Ephesos', res: 'P',
      A: [['CC', { vp: 3 }], ['WW', { coins: 9 }], ['OOG', { vp: 7 }]],
      B: [['SS', { vp: 2, coins: 4 }], ['WW', { vp: 3, coins: 4 }], ['OOL', { vp: 5, coins: 4 }]] },
    babylon: { name: 'Babylon', full: 'The Hanging Gardens of Babylon', res: 'W',
      A: [['CC', { vp: 3 }], ['OOL', { wild: 1 }], ['WWWW', { vp: 7 }]],
      B: [['SS', { seventh: 1 }], ['CCCG', { wild: 1 }]] },
    olympia: { name: 'Olympia', full: 'The Statue of Zeus in Olympia', res: 'C',
      A: [['SS', { vp: 3 }], ['WW', { free: 'color' }], ['CCC', { vp: 7 }]],
      B: [['OO', { vp: 2, free: 'first' }], ['CCC', { vp: 3, free: 'last' }], ['GLP', { vp: 5 }]] },
    halikarnassos: { name: 'Halikarnassos', full: 'The Mausoleum of Halikarnassos', res: 'L',
      A: [['OO', { vp: 3 }], ['GP', { discard: 1 }], ['SSS', { vp: 7 }]],
      B: [['CC', { vp: 2, discard: 1 }], ['GP', { vp: 1, discard: 1 }], ['WWW', { discard: 1 }]] },
    gizah: { name: 'Gizah', full: 'The Pyramids of Gizah', res: 'S',
      A: [['WW', { vp: 3 }], ['CCL', { vp: 5 }], ['SSSS', { vp: 7 }]],
      B: [['WW', { vp: 3 }], ['SSS', { vp: 5 }], ['CCC', { vp: 5 }], ['SSSSP', { vp: 7 }]] },
  };
  const WONDER_IDS = ['rhodos', 'alexandria', 'ephesos', 'babylon', 'olympia', 'halikarnassos', 'gizah'];

  function toCard(row) {
    const cost = row[3] || '';
    const m = cost.match(/^(\d+)/);
    return {
      name: row[0], age: row[1], color: row[2],
      coin: m ? Number(m[1]) : 0, res: cost.replace(/^\d+/, ''),
      players: row[4].slice(), e: row[5] || {}, from: (row[6] || []).slice(),
    };
  }

  function build(ed) {
    let rows = ED1.slice();
    if (ed === 2) {
      const seen = new Set();
      rows = rows.map(r => {
        if (!(r[0] in ED2_PATCH)) return r;
        seen.add(r[0]);
        return ED2_PATCH[r[0]];
      }).filter(Boolean);
      // new cards go next to their colour in the same age
      for (const k in ED2_PATCH) {
        if (seen.has(k) || !ED2_PATCH[k]) continue;
        const r = ED2_PATCH[k];
        let at = -1;
        rows.forEach((x, i) => { if (x[1] === r[1] && x[2] === r[2]) at = i; });
        rows.splice(at + 1, 0, r);
      }
    }
    const list = rows.map(toCard);
    // a card's id: "name|age" (Loom, Glassworks and Press appear in two ages)
    const byKey = {};
    const byName = {};
    list.forEach(c => { c.id = c.name + '|' + c.age; byKey[c.id] = c; byName[c.name] = c; });
    // which later cards a card makes free
    list.forEach(c => { c.to = list.filter(x => x.from.indexOf(c.name) >= 0).map(x => x.name); });
    return { ed, list, byKey, byName, wonders: ed === 2 ? WONDERS2 : WONDERS1 };
  }

  const EDITIONS = { 1: build(1), 2: build(2) };

  // The deck for one age at a given player count (guilds not included).
  function ageDeck(ed, age, n) {
    const out = [];
    for (const c of EDITIONS[ed].list) {
      if (c.age !== age || c.color === 'purple') continue;
      for (const p of c.players) if (p <= n) out.push(c.id);
    }
    return out;
  }
  function guilds(ed) { return EDITIONS[ed].list.filter(c => c.color === 'purple').map(c => c.id); }

  // Plain-English effect text (our own words).
  function effectText(c) {
    const e = c.e, out = [];
    if (e.prod) {
      const units = e.prod.split(/(?=[WSCOGLP](?!\/))/).filter(Boolean);
      if (e.prod.indexOf('/') >= 0) out.push('One of ' + e.prod.split('/').map(r => RES_NAME[r]).join(' / ') + ' each turn' + (c.color === 'yellow' ? ' (not for sale)' : ''));
      else if (units.length === 2) out.push('2 ' + RES_NAME[units[0]]);
      else out.push(RES_NAME[e.prod]);
    }
    if (e.vp) out.push(e.vp + ' points');
    if (e.sh) out.push(e.sh + (e.sh === 1 ? ' shield' : ' shields'));
    if (e.sci) out.push('Science: ' + e.sci);
    if (e.wild) out.push('Any one science symbol (chosen at the end)');
    if (e.coins) out.push(e.coins + ' coins now');
    if (e.trade) {
      if (e.trade.raw) out.push('Raw materials from ' + (e.trade.raw === 'L' ? 'the left' : e.trade.raw === 'R' ? 'the right' : 'both') + ' neighbour' + (e.trade.raw === 'LR' ? 's' : '') + ' cost 1 coin');
      if (e.trade.man) out.push('Glass, loom and papyrus from both neighbours cost 1 coin');
    }
    if (e.per) {
      const w = e.per[0].who === 'S' ? 'your city' : e.per[0].who === 'N' ? 'both neighbours' : 'your city and both neighbours';
      const what = e.per.map(p => p.of === 'stage' ? 'wonder stage' : p.of === 'defeat' ? 'defeat token' : p.of).join(', ');
      const p0 = e.per[0];
      const bits = [];
      if (p0.coin) bits.push(p0.coin + ' coin' + (p0.coin > 1 ? 's' : '') + ' now');
      if (p0.vp) bits.push(p0.vp + ' point' + (p0.vp > 1 ? 's' : '') + ' at the end');
      out.push(bits.join(' and ') + ' per ' + what + ' in ' + w);
    }
    if (e.deco) out.push(e.deco + ' points if your wonder is finished');
    return out.join('. ');
  }
  function stageText(s) {
    const e = s[1], out = [];
    if (e.vp) out.push(e.vp + ' points');
    if (e.sh) out.push(e.sh + (e.sh === 1 ? ' shield' : ' shields'));
    if (e.coins) out.push(e.coins + ' coins now');
    if (e.any === 'raw') out.push('One raw material of your choice each turn');
    if (e.any === 'man') out.push('One of glass, loom or papyrus each turn');
    if (e.wild) out.push('Any one science symbol');
    if (e.free === 'age') out.push('Once per age, build a card for free');
    if (e.free === 'color') out.push('The first card of each colour is free');
    if (e.free === 'first') out.push('The first card of each age is free');
    if (e.free === 'last') out.push('The last card of each age is free');
    if (e.discard) out.push('Build one discarded card for free');
    if (e.seventh) out.push('Play the 7th card of each age too');
    if (e.tradeRaw) out.push('Raw materials from both neighbours cost 1 coin');
    if (e.copy) out.push('Copy a neighbour’s guild at the end');
    return out.join('. ');
  }

  return { RAW, MAN, RES_NAME, SCI, COLORS, COLOR_NAME, EDITIONS, WONDER_IDS, ageDeck, guilds, effectText, stageText, _ED1: ED1, _ED2_PATCH: ED2_PATCH };
});
