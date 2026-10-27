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
  // 8-letter words got no break point before, so "Workshop" ran past a narrow overlapped card ("Vorkshop")
  const BREAK = { Marketplace: 6, Apothecary: 6, Brickyard: 5, Shipowners: 4, Magistrates: 5, Laboratory: 6,
    Pawnshop: 4, Stockade: 5, Barracks: 3, Workshop: 4, Aqueduct: 4, Vineyard: 4, Training: 5, Pantheon: 4, Commerce: 3, Builders: 5 };
  function softWord(w) {
    if (w.length < 8) return w;
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
  // ---------------------------------------------------------------- one small original scene per card (40×30)
  // Drawn for this site: a soft sky, a ground line with a shadow, and a motif in the card colour's ink with a
  // lit side (lighter fill) and a shaded side, so the cards read as illustrations rather than flat blocks.
  const INK = { brown: ['#6b4022', '#a4703f'], grey: ['#4f5563', '#8a90a0'], blue: ['#244f8a', '#5f8fd0'], yellow: ['#86610e', '#d2a640'],
    red: ['#8a2b24', '#cf6a5c'], green: ['#22643b', '#5aa877'], purple: ['#55306f', '#9a74c0'] };
  const M = {   // motifs: d = dark ink, l = light ink
    trees: (d, l) => '<path d="M5 26l6-15 6 15z" fill="' + l + '"/><path d="M11 11l6 15h-6z" fill="' + d + '"/><path d="M15 26l8-19 8 19z" fill="' + l + '"/><path d="M23 7l8 19h-8z" fill="' + d + '"/><path d="M10 26h2v3h-2zM22 26h2v3h-2z" fill="' + d + '"/>',
    stone: (d, l) => '<path d="M5 28l2-8h10l2 8z" fill="' + l + '"/><path d="M17 20l2 8h-3z" fill="' + d + '"/><path d="M19 28l3-11h11l2 11z" fill="' + l + '"/><path d="M33 17l2 11h-3z" fill="' + d + '"/><path d="M11 20l2-7h9l1 4" fill="' + l + '" stroke="' + d + '" stroke-width=".8"/><path d="M7 24h10M22 22h11" stroke="' + d + '" stroke-width=".7" opacity=".6"/>',
    clay: (d, l) => '<path d="M4 28c4-6 28-6 32 0z" fill="' + d + '" opacity=".55"/><path d="M12 20h7v4h-7zM20 20h7v4h-7zM16 15h7v4h-7z" fill="' + l + '" stroke="' + d + '" stroke-width=".7"/><path d="M28 14l4 8M30 14h-4" stroke="' + d + '" stroke-width="1.2" stroke-linecap="round"/>',
    ore: (d, l) => '<path d="M5 28V17a8 8 0 0 1 16 0v11z" fill="' + d + '"/><path d="M8 28V18a5 5 0 0 1 10 0v10z" fill="#1d1712" opacity=".85"/><path d="M23 21h12l-1.5 5h-9z" fill="' + l + '" stroke="' + d + '" stroke-width=".7"/><circle cx="26" cy="27" r="1.5" fill="' + d + '"/><circle cx="32" cy="27" r="1.5" fill="' + d + '"/><path d="M25 21l2-3h3l2 3" fill="#9aa5bb"/>',
    glass: (d, l) => '<path d="M15 5h7v4c4 2 6 6 6 10 0 5-4 8-9.5 8S9 24 9 19c0-4 2-8 6-10z" fill="' + l + '" opacity=".9"/><path d="M22 9c4 2 6 6 6 10 0 5-4 8-9.5 8 3-2 5-5 5-9s-1-7-1.5-9z" fill="' + d + '" opacity=".5"/><path d="M14 13c-2 2-2.5 5-2 8" stroke="#eef9ff" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M29 10l4-3M31 14h4" stroke="' + l + '" stroke-width="1" stroke-linecap="round"/>',
    loom: (d, l) => '<path d="M7 5v23M33 5v23M5 7h30M5 26h30" stroke="' + d + '" stroke-width="2" stroke-linecap="round"/><path d="M10 8v17M13 8v17M16 8v17M19 8v17M22 8v17M25 8v17M28 8v17" stroke="' + l + '" stroke-width=".8"/><path d="M9 13h22v6H9z" fill="' + l + '" opacity=".6"/>',
    press: (d, l) => '<path d="M8 8h22v16H8z" fill="#f4e7c2" stroke="' + d + '" stroke-width=".8"/><path d="M6 6a2.5 2.5 0 0 1 0 5h3V6zM32 21a2.5 2.5 0 0 1 0 5h-3v-5z" fill="' + l + '" stroke="' + d + '" stroke-width=".7"/><path d="M12 12h14M12 15h14M12 18h10" stroke="' + d + '" stroke-width=".9" stroke-linecap="round" opacity=".7"/>',
    temple: (d, l, n) => { n = n || 4; let c = ''; const w = 26 / n; for (let i = 0; i < n; i++) c += '<rect x="' + (8 + i * w + w * .25).toFixed(1) + '" y="12" width="' + (w * .5).toFixed(1) + '" height="12" fill="' + (i % 2 ? d : l) + '"/>'; return '<path d="M5 11L20 3l15 8z" fill="' + l + '"/><path d="M20 3l15 8H20z" fill="' + d + '" opacity=".6"/><path d="M6 11h28v1.6H6z" fill="' + d + '"/>' + c + '<path d="M5 24h30v2H5zM3 26h34v2.5H3z" fill="' + d + '"/>'; },
    statue: (d, l) => '<path d="M13 26h14v3H13z" fill="' + d + '"/><path d="M15 22h10v4H15z" fill="' + l + '"/><circle cx="20" cy="6" r="2.4" fill="' + l + '"/><path d="M17 9h6l1 7-2 1v5h-4v-5l-2-1z" fill="' + l + '"/><path d="M20 9h3l1 7-2 1v5h-2z" fill="' + d + '" opacity=".55"/><path d="M23 10l4-5" stroke="' + d + '" stroke-width="1.3" stroke-linecap="round"/>',
    altar: (d, l) => '<path d="M10 18h20v10H10z" fill="' + l + '"/><path d="M22 18h8v10h-8z" fill="' + d + '" opacity=".5"/><path d="M8 16h24v3H8z" fill="' + d + '"/><path d="M20 4c3 4 5 6 2 11h-4c-3-5 0-6 2-11z" fill="#f0a347"/><path d="M20 8c1.5 2.5 2 4 .5 7h-1c-1.5-3-.5-4 .5-7z" fill="#ffe08a"/>',
    theater: (d, l) => '<path d="M3 27a17 17 0 0 1 34 0z" fill="' + l + '"/><path d="M7 27a13 13 0 0 1 26 0M11 27a9 9 0 0 1 18 0" stroke="' + d + '" stroke-width="1.2" fill="none"/><path d="M15 27a5 5 0 0 1 10 0z" fill="' + d + '"/>',
    arches: (d, l) => '<path d="M3 8h34v4H3z" fill="' + d + '"/><path d="M4 12h32v16h-4v-8a4 4 0 0 0-8 0v8h-4v-8a4 4 0 0 0-8 0v8H4z" fill="' + l + '"/><path d="M3 9h34" stroke="#9fd3f0" stroke-width="1.6"/>',
    gardens: (d, l) => '<path d="M4 28h32v-3H4z" fill="' + d + '"/><circle cx="11" cy="15" r="6" fill="' + l + '"/><circle cx="21" cy="11" r="7" fill="' + d + '" opacity=".75"/><circle cx="30" cy="16" r="5" fill="' + l + '"/><path d="M11 21v4M21 18v7M30 21v4" stroke="' + d + '" stroke-width="1.4"/>',
    well: (d, l) => '<path d="M8 9L20 3l12 6z" fill="' + d + '"/><path d="M11 9v10M29 9v10" stroke="' + d + '" stroke-width="1.6"/><path d="M8 19h24v9H8z" fill="' + l + '"/><path d="M8 22h24M8 25h24M14 19v3M22 22v3M26 19v3" stroke="' + d + '" stroke-width=".7"/><path d="M20 9v6" stroke="' + d + '" stroke-width=".8"/><path d="M18 15h4v3h-4z" fill="' + d + '"/>',
    pot: (d, l) => '<path d="M12 10h16l-2 3c4 2 5 6 5 9 0 4-4 6-11 6s-11-2-11-6c0-3 1-7 5-9z" fill="' + l + '"/><path d="M26 13c4 2 5 6 5 9 0 4-4 6-11 6 5-1 7-4 7-8s-1-6-1-7z" fill="' + d + '" opacity=".5"/><circle cx="16" cy="8" r="2.6" fill="#e2b33c"/><circle cx="22" cy="7" r="2.6" fill="#f0c859"/>',
    stakes: (d, l) => { let s = ''; for (let i = 0; i < 7; i++) { const x = 5 + i * 4.4; s += '<path d="M' + x + ' 28V' + (12 + (i % 2) * 2) + 'l2-3 2 3V28z" fill="' + (i % 2 ? d : l) + '"/>'; } return s + '<path d="M4 17h32M4 23h32" stroke="' + d + '" stroke-width="1"/>'; },
    tent: (d, l) => '<path d="M4 27L14 9l10 18z" fill="' + l + '"/><path d="M14 9l10 18h-10z" fill="' + d + '" opacity=".6"/><path d="M12 27l2-6 2 6z" fill="#2b1810"/><path d="M20 27l8-14 8 14z" fill="' + l + '"/><path d="M28 13l8 14h-8z" fill="' + d + '" opacity=".6"/><path d="M14 9V5l4 1.5-4 1.5" fill="' + d + '"/>',
    tower: (d, l) => '<path d="M13 28V10h14v18z" fill="' + l + '"/><path d="M20 10h7v18h-7z" fill="' + d + '" opacity=".5"/><path d="M11 10V6h3v2h3V6h3v2h3V6h3v2h3V6h0v4z" fill="' + d + '"/><path d="M18 28v-6a2 2 0 0 1 4 0v6z" fill="#2b1810"/><path d="M19 13h2v4h-2z" fill="#2b1810"/>',
    walls: (d, l) => '<path d="M2 28V14h36v14z" fill="' + l + '"/><path d="M2 14V10h4v2h4v-2h4v2h4v-2h4v2h4v-2h4v2h4v-2h4v4z" fill="' + d + '"/><path d="M2 19h36M2 24h36M8 14v5M16 19v5M24 14v5M32 19v5M12 24v4M28 24v4" stroke="' + d + '" stroke-width=".7" opacity=".7"/>',
    horseshoe: (d, l) => '<path d="M11 6v10a9 9 0 0 0 18 0V6h-5v10a4 4 0 0 1-8 0V6z" fill="' + l + '" stroke="' + d + '" stroke-width="1"/><circle cx="13.5" cy="10" r=".9" fill="' + d + '"/><circle cx="13.5" cy="15" r=".9" fill="' + d + '"/><circle cx="26.5" cy="10" r=".9" fill="' + d + '"/><circle cx="26.5" cy="15" r=".9" fill="' + d + '"/>',
    target: (d, l) => '<circle cx="17" cy="16" r="11" fill="' + l + '"/><circle cx="17" cy="16" r="7.5" fill="#f4dcd6"/><circle cx="17" cy="16" r="4" fill="' + d + '"/><path d="M17 16L36 4" stroke="#3a2a1a" stroke-width="1.3"/><path d="M33 3l4 1-2 3z" fill="#3a2a1a"/>',
    swords: (d, l) => '<path d="M8 6l19 19M32 6L13 25" stroke="' + l + '" stroke-width="2.6" stroke-linecap="round"/><path d="M8 6l19 19" stroke="#fff" stroke-width=".7" opacity=".6"/><path d="M24 26l5-5M11 21l5 5" stroke="' + d + '" stroke-width="2.6" stroke-linecap="round"/>',
    fort: (d, l) => '<path d="M4 28V15h8v-5h16v5h8v13z" fill="' + l + '"/><path d="M20 10h8v18H20z" fill="' + d + '" opacity=".45"/><path d="M3 15v-3h2v1.5h2V12h2v1.5h2V12h2v3zM27 15v-3h2v1.5h2V12h2v1.5h2V12h2v3zM11 10V7h2v1.5h2V7h2v1.5h2V7h2v1.5h2V7h2v1.5h2V7h2v3z" fill="' + d + '"/><path d="M17 28v-7a3 3 0 0 1 6 0v7z" fill="#2b1810"/>',
    arena: (d, l) => '<ellipse cx="20" cy="18" rx="17" ry="9" fill="' + l + '"/><ellipse cx="20" cy="18" rx="11" ry="5" fill="#f1dcc0"/><path d="M3 18v4c0 5 8 6.5 17 6.5s17-1.5 17-6.5v-4c0 5-8 9-17 9s-17-4-17-9z" fill="' + d + '"/><path d="M8 25v-4M14 27v-4M20 27.5v-4M26 27v-4M32 25v-4" stroke="' + l + '" stroke-width="1"/>',
    arsenal: (d, l) => '<path d="M12 6l8 3v7c0 6-4 9-8 11-4-2-8-5-8-11V9z" fill="' + l + '"/><path d="M12 6l8 3v7c0 6-4 9-8 11z" fill="' + d + '" opacity=".5"/><path d="M26 28L33 4M24 10l9 3" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round"/><path d="M32 2l3 3-3 1z" fill="' + d + '"/>',
    catapult: (d, l) => '<path d="M5 24h26" stroke="' + d + '" stroke-width="2.4"/><circle cx="9" cy="26" r="2.6" fill="' + d + '"/><circle cx="27" cy="26" r="2.6" fill="' + d + '"/><path d="M12 24l6-10 2 10" fill="' + l + '"/><path d="M18 15L33 5" stroke="' + d + '" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="4.5" r="2.6" fill="' + l + '"/>',
    compass: (d, l) => '<circle cx="20" cy="6" r="2.6" fill="none" stroke="' + d + '" stroke-width="1.6"/><path d="M18.8 8L11 27M21.2 8L29 27" stroke="' + d + '" stroke-width="2" stroke-linecap="round"/><path d="M13.5 20h13" stroke="' + l + '" stroke-width="1.4"/><path d="M8 28a16 9 0 0 1 24 0" stroke="' + l + '" stroke-width="1" fill="none" stroke-dasharray="1.5 1.5"/>',
    gear: (d, l) => '<g transform="translate(14 16)"><path d="M0-11l2 3 3.5-1 .6 3.5 3.4 1.4-1.4 3.2 2 3-3 2 .4 3.5-3.5.3-1.4 3.3-3-1.7-3 1.7-1.4-3.3-3.5-.3.4-3.5-3-2 2-3-1.4-3.2 3.4-1.4.6-3.5 3.5 1z" fill="' + l + '"/><circle r="3.6" fill="#e3f2e6"/></g><g transform="translate(29 9) scale(.6)"><path d="M0-11l2 3 3.5-1 .6 3.5 3.4 1.4-1.4 3.2 2 3-3 2 .4 3.5-3.5.3-1.4 3.3-3-1.7-3 1.7-1.4-3.3-3.5-.3.4-3.5-3-2 2-3-1.4-3.2 3.4-1.4.6-3.5 3.5 1z" fill="' + d + '"/><circle r="3.6" fill="#e3f2e6"/></g>',
    tablet: (d, l) => '<path d="M10 4h16a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H10z" fill="' + l + '"/><path d="M26 4a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-3z" fill="' + d + '" opacity=".5"/><path d="M13 9h10M13 13h10M13 17h10M13 21h7" stroke="#e3f2e6" stroke-width="1.2" stroke-linecap="round"/><path d="M30 26l6-16" stroke="' + d + '" stroke-width="1.4" stroke-linecap="round"/>',
    amphora: (d, l) => '<path d="M16 4h8v3c5 3 7 8 7 12 0 5-4 9-11 9s-11-4-11-9c0-4 2-9 7-12z" fill="' + l + '"/><path d="M24 7c5 3 7 8 7 12 0 5-4 9-11 9 5-2 7-6 7-10s-1-8-3-11z" fill="' + d + '" opacity=".45"/><path d="M15 9c-4 0-5 4-3 6M25 9c4 0 5 4 3 6" stroke="' + d + '" stroke-width="1.3" fill="none"/><path d="M11 17h18" stroke="' + d + '" stroke-width="1.2" opacity=".6"/>',
    stall: (d, l) => '<path d="M5 12l3-7h24l3 7z" fill="' + l + '"/><path d="M8 5l-3 7h5l2-7M16 5l-1 7h5V5M24 5l1 7h5l-2-7" fill="' + d + '" opacity=".55"/><path d="M7 12v16M33 12v16" stroke="' + d + '" stroke-width="1.6"/><path d="M7 21h26v3H7z" fill="' + d + '"/><circle cx="13" cy="19" r="2" fill="#c8673f"/><circle cx="19" cy="19" r="2" fill="#9ccf6a"/><circle cx="25" cy="19" r="2" fill="#e2b33c"/>',
    cart: (d, l) => '<path d="M6 13h22v9H6z" fill="' + l + '"/><path d="M8 13l3-5h12l3 5" fill="' + d + '" opacity=".6"/><circle cx="12" cy="24" r="3.4" fill="none" stroke="' + d + '" stroke-width="1.6"/><circle cx="23" cy="24" r="3.4" fill="none" stroke="' + d + '" stroke-width="1.6"/><path d="M28 16h8" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round"/>',
    camel: (d, l) => '<path d="M6 17c2-6 6-6 8-2 2-5 7-5 9 0h4l3-5 3 1-1 3-4 4v9h-2v-7h-12v7h-2v-7c-3-1-5-2-6-3z" fill="' + l + '"/><path d="M14 15c2-5 7-5 9 0" fill="' + d + '" opacity=".5"/><path d="M2 28h36" stroke="' + d + '" stroke-width="1" opacity=".5"/>',
    grapes: (d, l) => '<path d="M20 4v4M20 6c3-2 6-2 8 0" stroke="#4f7a2c" stroke-width="1.4" fill="none"/>' + [[16, 11], [21, 11], [26, 11], [18.5, 15.5], [23.5, 15.5], [16, 20], [21, 20], [18.5, 24.5]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.8" fill="' + l + '" stroke="' + d + '" stroke-width=".6"/>').join(''),
    ship: (d, l) => '<path d="M4 20h32l-5 7H9z" fill="' + d + '"/><path d="M20 3v17M20 4l11 13H20z" fill="' + l + '"/><path d="M20 3v17" stroke="' + d + '" stroke-width="1.2"/><path d="M2 28c3-2 5-2 8 0s5 2 8 0 5-2 8 0 5 2 8 0" stroke="#5f8fd0" stroke-width="1.2" fill="none"/>',
    lighthouse: (d, l) => '<path d="M15 28l2-18h6l2 18z" fill="' + l + '"/><path d="M20 10h3l2 18h-5z" fill="' + d + '" opacity=".45"/><path d="M16 10h8V6h-8z" fill="' + d + '"/><circle cx="20" cy="5" r="2" fill="#ffd56b"/><path d="M20 5L4 1M20 5L36 1M20 5L5 9M20 5l15 4" stroke="#ffd56b" stroke-width=".8" opacity=".75"/>',
    scales: (d, l) => '<path d="M20 4v21M13 28h14" stroke="' + d + '" stroke-width="1.8" stroke-linecap="round"/><path d="M7 8h26" stroke="' + d + '" stroke-width="1.4"/><path d="M7 8l-4 9h8zM33 8l-4 9h8z" fill="none" stroke="' + d + '" stroke-width=".8"/><path d="M2 17a5 2.5 0 0 0 10 0zM28 17a5 2.5 0 0 0 10 0z" fill="' + l + '"/>',
    helmet: (d, l) => '<path d="M9 22c0-9 5-14 11-14s11 5 11 14v4h-6v-6h-10v6H9z" fill="' + l + '"/><path d="M20 8c6 0 11 5 11 14v4h-6v-6h-5z" fill="' + d + '" opacity=".5"/><path d="M14 6c2-4 10-4 12 0" stroke="#cf4b41" stroke-width="3" fill="none" stroke-linecap="round"/>',
    banner: (d, l, sym) => '<path d="M11 3h18v21l-9-5-9 5z" fill="' + l + '"/><path d="M20 3h9v21l-9-5z" fill="' + d + '" opacity=".45"/><path d="M9 3h22" stroke="' + d + '" stroke-width="1.8" stroke-linecap="round"/>' + (sym || ''),
  };
  // which motif each card shows (by name), else by what it makes / its science symbol, else by colour
  const BY_NAME = { Statue: 'statue', Altar: 'altar', Theater: 'theater', Baths: 'arches', Aqueduct: 'arches', Gardens: 'gardens', Well: 'well', Pawnshop: 'pot',
    Temple: ['temple', 4], Courthouse: ['temple', 5], Senate: ['temple', 6], 'Town Hall': ['temple', 5], Pantheon: ['temple', 6], Palace: ['temple', 7],
    Stockade: 'stakes', Barracks: 'tent', 'Guard Tower': 'tower', Walls: 'walls', Stables: 'horseshoe', 'Archery Range': 'target', 'Training Ground': 'swords',
    Fortifications: 'fort', Castrum: 'fort', Circus: 'arena', Arsenal: 'arsenal', 'Siege Workshop': 'catapult',
    Tavern: 'amphora', 'East Trading Post': 'cart', 'West Trading Post': 'cart', Marketplace: 'stall', Bazar: 'stall', Caravansery: 'camel', Forum: ['temple', 3],
    Vineyard: 'grapes', Haven: 'ship', Lighthouse: 'lighthouse', 'Chamber of Commerce': 'scales', Arena: 'arena', Ludus: 'helmet' };
  const RES_MOTIF = { W: 'trees', S: 'stone', C: 'clay', O: 'ore', G: 'glass', L: 'loom', P: 'press' };
  const GUILD_SYM = { brown: 'stone', grey: 'loom', blue: 'temple', green: 'compass', red: 'swords', yellow: 'scales', stage: 'temple', defeat: 'swords' };
  function pic(c) {
    const ink = INK[c.color] || INK.brown, d = ink[0], l = ink[1];
    const ground = '<ellipse cx="20" cy="28.5" rx="17" ry="1.8" fill="#000" opacity=".12"/>';
    const by = BY_NAME[c.name];
    let body = '';
    if (by) body = Array.isArray(by) ? M[by[0]](d, l, by[1]) : M[by](d, l);
    else if (c.e.prod) {
      const rs = c.e.prod.replace(/\//g, '').split('').filter((r, i, a) => a.indexOf(r) === i);
      if (rs.length === 1) body = M[RES_MOTIF[rs[0]]](d, l);
      else body = rs.slice(0, 2).map((r, i) => '<g transform="translate(' + (i ? 19 : 1) + ' 9) scale(.5)">' + M[RES_MOTIF[r]](d, l) + '</g>').join('');
    } else if (c.e.sci) body = M[c.e.sci](d, l);
    else if (c.color === 'purple') {
      const of = c.e.per ? c.e.per[0].of : c.e.wild ? 'green' : 'stage';
      const m = M[GUILD_SYM[of] || 'temple'];
      body = M.banner(d, l, '<g transform="translate(13 5) scale(.35)">' + m('#f3ead8', '#fff') + '</g>');
    } else return PIC[c.color] || '';
    return ground + body;
  }

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
      '<svg class="pic" viewBox="0 0 40 30" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + pic(c) + '</svg>' +
      // smaller type when the name is long or has a word of 8+ letters, so no word is ever split mid-way ("Worksho-p")
      '<div class="nm' + (c.name.length > 9 || c.name.split(' ').some(w => w.length >= 8) ? ' long' : '') + '" lang="en">' + softName(c.name) + '</div>' +
      (o.size === 'big' ? from + chain : '') + (o.badge || '') + '</div>';
  }
  // a built card in a city column: only its top banner shows, like a real overlapped stack
  function mini(c, o) {
    o = o || {};
    return '<div class="mc ' + c.color + (o.cls ? ' ' + o.cls : '') + '"' + (o.attr || '') + ' title="' + c.name + '"><div class="top">' + effect(c) + '</div><b class="mn" lang="en">' + softName(c.name) + '</b>' +
      '<svg class="mp" viewBox="0 0 40 30" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + pic(c) + '</svg></div>';
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

  root.SWArt = { res, coin, shield, sci, wild, laurel, chip, cost, resCost, effect, stageEffect, face, mini, back, emblem, pic, stageIc, COLOR_HEX, ICON, svg, DEFEAT };
})(typeof self !== 'undefined' ? self : this);
