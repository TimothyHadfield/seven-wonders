/* Original SVG art for this site: resource, coin, shield, science and point icons, card faces and
   wonder emblems. Nothing here is traced from the published game. */
(function (root) {
  'use strict';
  const C = root.SWCards;
  const svg = (body, cls, vb) => '<svg class="' + (cls || 'ic') + '" viewBox="' + (vb || '0 0 20 20') + '" aria-hidden="true">' + body + '</svg>';

  // ---------------------------------------------------------------- resources
  const RES = {
    W: '<rect x="2.5" y="6" width="15" height="8" rx="4" fill="#9a6a3a"/><ellipse cx="15.5" cy="10" rx="2.6" ry="4" fill="#d9b07a"/><ellipse cx="15.5" cy="10" rx="1.2" ry="2" fill="none" stroke="#9a6a3a" stroke-width=".8"/><path d="M5 8.5h7M6 11.5h6" stroke="#6e4a26" stroke-width=".9" stroke-linecap="round"/>',
    S: '<path d="M3 15l2.5-7 4-3.5 5 2 2.5 5.5-2 3.5H5z" fill="#a9aebb"/><path d="M5.5 8l4 2 5-3M9.5 10l-1 5.5M9.5 10l5 2.5" stroke="#7d8291" stroke-width=".9" fill="none"/>',
    C: '<rect x="2.5" y="5.5" width="15" height="9" rx="1.2" fill="#c8673f"/><path d="M2.5 10h15M8 5.5v4.5M13 10v4.5" stroke="#8f3f22" stroke-width="1"/>',
    O: '<path d="M3.5 13l3-7.5h7l3 7.5-3 3h-7z" fill="#5b6475"/><path d="M6.5 5.5l2 4 3-4M8.5 9.5l-2 6.5M8.5 9.5h5" stroke="#9aa5bb" stroke-width=".9" fill="none"/><circle cx="12.5" cy="12.5" r="1.1" fill="#c9d3e6"/>',
    G: '<path d="M6 3.5h8l-1.2 5.5c-.4 1.7-1.5 2.6-2.8 2.6S7.6 10.7 7.2 9z" fill="#7fd3e8" opacity=".9"/><path d="M10 11.6v4.4M6.5 16.5h7" stroke="#7fd3e8" stroke-width="1.4" stroke-linecap="round"/><path d="M8 5l.6 3" stroke="#e8fbff" stroke-width=".9" stroke-linecap="round"/>',
    L: '<path d="M3 5h14v10H3z" fill="#8e5bb5"/><path d="M3 8h14M3 11h14M7 5v10M11 5v10M15 5v10" stroke="#c39be3" stroke-width=".8"/>',
    P: '<path d="M5 3.5h9.5v11.5a2 2 0 0 1-2 2H5z" fill="#ead9a6"/><path d="M5 3.5a1.6 1.6 0 0 0 0 3.2h1.6V3.5" fill="#cbb57a"/><path d="M8 8h5M8 10.5h5M8 13h3.5" stroke="#9a8650" stroke-width=".9" stroke-linecap="round"/>',
  };
  const res = (r, cls) => svg(RES[r] || '', cls || 'ic');

  // ---------------------------------------------------------------- other symbols
  const coin = n => '<span class="coin">' + (n == null ? '' : n) + '</span>';
  const SHIELD = '<path d="M10 2.5l6 2.2v4.8c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8V4.7z" fill="#d8524a"/><path d="M10 4.6l4 1.5v3.4c0 2.8-1.7 4.6-4 5.7z" fill="#ef8a7f"/>';
  const shield = () => svg(SHIELD);
  const SCI = {
    compass: '<circle cx="10" cy="4" r="1.6" fill="none" stroke="#2e7d4f" stroke-width="1.4"/><path d="M9.2 5.4L4.5 17M10.8 5.4L15.5 17M6 13.2h8" stroke="#2e7d4f" stroke-width="1.6" stroke-linecap="round"/>',
    gear: '<path d="M10 2.5l1.4 2 2.4-.6.4 2.4 2.3 1-1 2.2 1.4 2-2 1.4.3 2.4-2.4.2-1 2.3-2-1.2-2 1.2-1-2.3-2.4-.2.3-2.4-2-1.4 1.4-2-1-2.2 2.3-1 .4-2.4 2.4.6z" fill="#2e7d4f"/><circle cx="10" cy="10" r="2.6" fill="#e3f2e6"/>',
    tablet: '<path d="M5 3h10v14H5z" fill="#2e7d4f" rx="1"/><path d="M7 6h6M7 8.5h6M7 11h6M7 13.5h4" stroke="#e3f2e6" stroke-width="1" stroke-linecap="round"/>',
  };
  const sci = s => svg(SCI[s] || '');
  const WILD = '<circle cx="10" cy="10" r="8" fill="#2e7d4f"/><path d="M10 4.2l1.6 3.6 3.9.4-2.9 2.6.8 3.8L10 12.6l-3.4 2 .8-3.8-2.9-2.6 3.9-.4z" fill="#e3f2e6"/>';
  const wild = () => svg(WILD);
  const laurel = n => '<span class="vp">' + n + '</span>';
  const COLOR_HEX = { brown: '#8a5a32', grey: '#8d93a3', blue: '#3f7fd0', yellow: '#e2b33c', red: '#cf4b41', green: '#3d9a5d', purple: '#8a58b8' };
  const chip = color => '<i class="cchip" style="background:' + COLOR_HEX[color] + '"></i>';
  const arrows = who => '<span class="who">' + (who.indexOf('N') >= 0 ? '◀' : '') + (who.indexOf('S') >= 0 ? '●' : '') + (who.indexOf('N') >= 0 ? '▶' : '') + '</span>';
  const STAGE_IC = '<path d="M3 16h14M4.5 16V9.5L10 5l5.5 4.5V16" fill="none" stroke="#c9a54a" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 16v-4h4v4" fill="#c9a54a"/>';
  const stageIc = () => svg(STAGE_IC);
  const DEFEAT = '<circle cx="10" cy="10" r="7.5" fill="#3b2a2a" stroke="#cf4b41" stroke-width="1.2"/><path d="M6.5 10h7" stroke="#ef8a7f" stroke-width="2" stroke-linecap="round"/>';

  // cost row: '1' = coin, letters = resources
  function cost(c) {
    const out = [];
    if (c.coin) out.push(coin(c.coin));
    for (const r of c.res || '') out.push(res(r, 'ic s'));
    return out.join('');
  }
  function resCost(str) { return (str || '').split('').map(r => res(r, 'ic s')).join(''); }

  // the effect as icons
  function effect(c) {
    const e = c.e, out = [];
    if (e.prod) {
      if (e.prod.indexOf('/') >= 0) out.push('<span class="alt">' + e.prod.split('/').map(r => res(r)).join('<b>/</b>') + '</span>');
      else for (const r of e.prod) out.push(res(r));
    }
    if (e.vp) out.push(laurel(e.vp));
    if (e.sh) for (let i = 0; i < e.sh; i++) out.push(shield());
    if (e.sci) out.push(sci(e.sci));
    if (e.wild) out.push(wild());
    if (e.coins) out.push(coin(e.coins));
    if (e.trade) {
      if (e.trade.raw) out.push('<span class="trade">' + (e.trade.raw.indexOf('L') >= 0 ? '◀' : '') + res('W', 'ic s') + res('S', 'ic s') + (e.trade.raw.indexOf('R') >= 0 ? '▶' : '') + coin(1) + '</span>');
      if (e.trade.man) out.push('<span class="trade">◀' + res('G', 'ic s') + res('L', 'ic s') + res('P', 'ic s') + '▶' + coin(1) + '</span>');
    }
    if (e.per) {
      const p = e.per[0];
      const what = p.of === 'stage' ? stageIc() : p.of === 'defeat' ? svg(DEFEAT) : chip(p.of);
      out.push('<span class="per">' + (p.coin ? coin(p.coin) : '') + (p.vp ? laurel(p.vp) : '') + '<b>/</b>' + what + arrows(p.who) + '</span>');
    }
    if (e.deco) out.push('<span class="per">' + laurel(e.deco) + '<b>if</b>' + stageIc() + '</span>');
    return out.join('');
  }
  function stageEffect(s) {
    const e = s[1], out = [];
    if (e.vp) out.push(laurel(e.vp));
    if (e.sh) for (let i = 0; i < e.sh; i++) out.push(shield());
    if (e.coins) out.push(coin(e.coins));
    if (e.any === 'raw') out.push('<span class="alt">' + ['W', 'S', 'C', 'O'].map(r => res(r, 'ic s')).join('') + '</span>');
    if (e.any === 'man') out.push('<span class="alt">' + ['G', 'L', 'P'].map(r => res(r, 'ic s')).join('') + '</span>');
    if (e.wild) out.push(wild());
    if (e.free) out.push('<span class="tag">' + ({ age: 'Free 1/age', color: 'Free 1st colour', first: 'Free 1st', last: 'Free last' })[e.free] + '</span>');
    if (e.discard) out.push('<span class="tag">Discard build</span>');
    if (e.seventh) out.push('<span class="tag">7th card</span>');
    if (e.tradeRaw) out.push('<span class="trade">◀' + res('W', 'ic s') + '▶' + coin(1) + '</span>');
    if (e.copy) out.push('<span class="tag">Copy guild</span>');
    return out.join('');
  }

  // soft hyphen near the middle of long words, so narrow cards break "Forti-fications", not "Fortificatio-ns"
  // (Safari's own hyphenation isn't available everywhere, so the break points are chosen here)
  const VOW = /[aeiouy]/i;
  const BREAK = { Marketplace: 6, Apothecary: 6, Brickyard: 5, Shipowners: 4, Magistrates: 5, Laboratory: 6 };
  function softWord(w) {
    if (w.length < 9) return w;
    if (BREAK[w]) return w.slice(0, BREAK[w]) + '­' + w.slice(BREAK[w]);
    let best = -1, bestScore = 1e9;
    for (let i = 3; i <= w.length - 3; i++) {
      const a = w[i - 1], b = w[i], n = w[i + 1];
      let kind = 0;
      if (!VOW.test(a) && !VOW.test(b) && VOW.test(n)) kind = 1;      // con|con-vowel: Scrip|torium
      else if (VOW.test(a) && !VOW.test(b) && VOW.test(n)) kind = 2;  // vowel|con-vowel: Philo|sophers
      if (!kind) continue;
      const score = Math.abs(i - w.length / 2) + (kind === 2 ? 0.6 : 0);
      if (score < bestScore) { bestScore = score; best = i; }
    }
    return best < 0 ? w : w.slice(0, best) + '­' + w.slice(best);
  }
  function softName(s) { return s.split(' ').map(softWord).join(' '); }

  // a small original picture per card colour (the middle of a real card is an illustration)
  const PIC = {
    brown: '<path d="M0 30L10 14l7 8 9-13 14 21z" fill="#7a4b26" opacity=".55"/><path d="M4 30l6-6 6 6M22 30l5-5 5 5" stroke="#5c3518" stroke-width="1.2" fill="none" opacity=".6"/>',
    grey: '<path d="M8 30V14l6-5 6 5v16zM22 30V18h11v12z" fill="#5f6573" opacity=".5"/><path d="M27 18v-6h3v6" fill="#5f6573" opacity=".5"/>',
    blue: '<path d="M6 12L20 4l14 8zM7 13h26v2H7zM9 16h3v11H9zM15 16h3v11h-3zM22 16h3v11h-3zM28 16h3v11h-3zM6 27h28v3H6z" fill="#2c5fa3" opacity=".5"/>',
    yellow: '<path d="M4 14l4-7h24l4 7z" fill="#b58a20" opacity=".55"/><path d="M6 14h28v16H6z" fill="#b58a20" opacity=".3"/><circle cx="14" cy="22" r="3" fill="#b58a20" opacity=".6"/><circle cx="24" cy="23" r="2.4" fill="#b58a20" opacity=".6"/>',
    red: '<path d="M12 30V10h4V7h3v3h2V7h3v3h4v20z" fill="#9d342c" opacity=".5"/><path d="M18 30v-7a2 2 0 0 1 4 0v7z" fill="#f5dcd8" opacity=".8"/>',
    green: '<path d="M8 8h18a4 4 0 0 1 0 8H12v10a4 4 0 0 1-4 4z" fill="#2a7144" opacity=".45"/><circle cx="30" cy="23" r="5" fill="none" stroke="#2a7144" stroke-width="1.6" opacity=".55"/>',
    purple: '<path d="M10 4h20v20l-10-5-10 5z" fill="#643e8c" opacity=".5"/><path d="M14 9h12M14 13h12" stroke="#e9def3" stroke-width="1.2" opacity=".8"/>',
  };
  // a card face laid out like the real card: effect banner across the top, cost strip down the top-left,
  // a picture in the middle, the name on a scroll at the bottom. o: {cls, attr, size, badge}
  function face(c, o) {
    o = o || {};
    const nCost = (c.res || '').length + (c.coin ? 1 : 0);
    const chain = c.to && c.to.length ? '<div class="ch" title="Makes free: ' + c.to.join(', ') + '">⛓ ' + c.to.map(n => n.split(' ')[0]).join(', ') + '</div>' : '';
    const from = c.from && c.from.length ? '<div class="fr">free with ' + c.from[0] + '</div>' : '';
    return '<div class="card tbl-card ' + c.color + ' ' + (o.cls || '') + '"' + (o.attr || '') + '>' +
      '<div class="top">' + effect(c) + '</div>' +
      '<div class="cst' + (nCost >= 4 ? ' many' : '') + '">' + cost(c) + '</div>' +
      '<svg class="pic" viewBox="0 0 40 30" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + (PIC[c.color] || '') + '</svg>' +
      // smaller type when the name is long or has a word of 8+ letters, so no word is ever split mid-way ("Worksho-p")
      '<div class="nm' + (c.name.length > 9 || c.name.split(' ').some(w => w.length >= 8) ? ' long' : '') + '" lang="en">' + softName(c.name) + '</div>' +
      (o.size === 'big' ? from + chain : '') + (o.badge || '') + '</div>';
  }
  // a built card in a city column: only its top banner shows, like a real overlapped stack
  function mini(c, o) {
    o = o || {};
    return '<div class="mc ' + c.color + (o.cls ? ' ' + o.cls : '') + '"' + (o.attr || '') + ' title="' + c.name + '"><div class="top">' + effect(c) + '</div></div>';
  }
  // the back of an Age card: our own pattern, the Age numeral in the middle
  function back(age, cls) { return '<div class="tbl-card tbl-back swb a' + (age || 1) + (cls ? ' ' + cls : '') + '"><i>' + ['', 'I', 'II', 'III'][age || 1] + '</i></div>'; }

  // wonder emblems: simple silhouettes, one per wonder
  const EMB = {
    rhodos: '<path d="M30 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM27 15h6l2 12-2 1 1 12h-3l-1-10-1 10h-3l1-12-2-1zM33 16l7-6" stroke="#f3d38a" stroke-width="1.6" fill="#f3d38a"/><path d="M40 10l2-3" stroke="#ffb347" stroke-width="2.4" stroke-linecap="round"/>',
    alexandria: '<path d="M24 42h12l-2-8h-8zM26 34h8l-1.5-12h-5zM27.5 22h5l-1-8h-3z" fill="#f3d38a"/><circle cx="30" cy="11" r="3" fill="#ffd56b"/><path d="M30 11L14 6M30 11l16-5" stroke="#ffd56b" stroke-width="1.2" opacity=".7"/>',
    ephesos: '<path d="M14 20l16-9 16 9z" fill="#f3d38a"/><path d="M16 21h28v2H16zM18 24h2v14h-2zM24 24h2v14h-2zM34 24h2v14h-2zM40 24h2v14h-2zM14 38h32v3H14z" fill="#f3d38a"/>',
    babylon: '<path d="M14 40h32v-6H14zM18 34h24v-6H18zM22 28h16v-6H22z" fill="#f3d38a"/><path d="M15 33c2-3 4-3 6 0M39 33c2-3 4-3 6 0M19 27c2-3 4-3 6 0M35 27c2-3 4-3 6 0M25 21c2-4 8-4 10 0" stroke="#7fcf86" stroke-width="2" fill="none"/>',
    olympia: '<path d="M18 40h24v-3H18zM21 37h18l-2-6H23z" fill="#f3d38a"/><circle cx="30" cy="12" r="3.4" fill="#f3d38a"/><path d="M24 30l2-14h8l2 14zM36 18l5-6" stroke="#f3d38a" stroke-width="1.6" fill="#f3d38a"/>',
    halikarnassos: '<path d="M16 40h28v-4H16zM19 36h22V24H19zM18 24l12-12 12 12z" fill="#f3d38a"/><path d="M22 26v9M26 26v9M30 26v9M34 26v9M38 26v9" stroke="#8b6b2a" stroke-width="1.3"/>',
    gizah: '<path d="M10 40l16-26 16 26z" fill="#f3d38a"/><path d="M30 40l10-15 10 15z" fill="#d9b867"/><path d="M26 14l16 26" stroke="#b8963f" stroke-width="1"/>',
  };
  function emblem(w, cls) {
    return '<svg class="' + (cls || 'emb') + '" viewBox="0 0 60 48" aria-hidden="true"><rect width="60" height="48" rx="6" fill="#2a2f45"/><circle cx="48" cy="10" r="4" fill="#3a4060"/>' + (EMB[w] || '') + '</svg>';
  }

  // the site icon (also used in the header)
  const ICON = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#1a1e2b"/><path d="M12 50l20-34 20 34z" fill="#f0b354"/><path d="M32 16l20 34H38z" fill="#c98f36"/><circle cx="47" cy="15" r="5" fill="#6ea8fe"/><path d="M8 52h48" stroke="#6ea8fe" stroke-width="3" stroke-linecap="round"/></svg>';

  root.SWArt = { res, coin, shield, sci, wild, laurel, chip, cost, resCost, effect, stageEffect, face, mini, back, emblem, stageIc, COLOR_HEX, ICON, svg, DEFEAT };
})(typeof self !== 'undefined' ? self : this);
