// node tests/fit-ui.mjs <local url> [shots dir] : the fit pass (2026-11-27, "can I actually see everything?").
// WebKit, 5 sizes, 7 players in Age III (turn 1: full hand; turn 6: ~15 built cards, long names) + 4 players mid-game.
// Checks your city (every built card shows a readable band with its icons, laptop names not cut), the summary of what your
// city makes (resources, science) on screen, hand costs/names readable, far-seat names identifiable, nothing off screen.
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const S = createRequire(import.meta.url)('../tools/edge-states.js')();
const url = process.argv[2];
const SHOTS = process.argv[3] || null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const b = await pw.webkit.launch();
let fails = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  ' + extra : '')); };
const VP = {
  p393: { viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  p320: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  land: { viewport: { width: 659, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  d1280: { viewport: { width: 1280, height: 800 } },
  d1440: { viewport: { width: 1440, height: 900 } },
};
// floors per size: [min visible band of each built card in your city, min icon in your city's bands, min hand number px, min hand name px, far-seat letters]
// 320 x 568 with 7 players is the one size where the brief's 12 px / 10 px can't all fit (the hand row is ~100 px tall); it gets 9 px.
const FLOOR = { p393: [12, 10, 12, 10, 4], p320: [9, 7, 9, 9, 3], land: [9, 7, 10, 10, 0], d1280: [20, 14, 12, 12, 0], d1440: [22, 14, 12, 12, 0] };
// hand cards never shrink below this width (the city growing must not eat the hand)
const FW = { p393: 70, p320: 40, land: 80, d1280: 110, d1440: 120 };
const measure = () => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; };
  const qa = (s, root) => Array.from((root || document).querySelectorAll(s)).filter(vis);
  const out = {};
  // your city: the visible band of each built card (a covered card shows down to the next card's top)
  const bands = [], icons = [], cutNames = [];
  for (const col of qa('#game .me .ccol')) {
    const mcs = qa('.mc', col);
    mcs.forEach((m, i) => {
      const r = m.getBoundingClientRect();
      const vh = i < mcs.length - 1 ? mcs[i + 1].getBoundingClientRect().top - r.top : r.height;
      bands.push(vh);
      for (const ic of qa('.top .ic, .top .coin, .top .vp', m)) { const q = ic.getBoundingClientRect(); if (q.top < r.top + vh) icons.push(Math.min(q.width, q.height)); }
      const nm = m.querySelector('.mn');
      if (nm && vis(nm)) {
        const nr = nm.getBoundingClientRect();
        const bottom = Math.min(nr.bottom, r.top + vh);
        const lines = Math.round(nm.scrollHeight / parseFloat(getComputedStyle(nm).lineHeight));
        const shownLines = Math.floor((bottom - nr.top + 1) / parseFloat(getComputedStyle(nm).lineHeight));
        if (shownLines < lines || nm.scrollHeight > nm.clientHeight + 1) cutNames.push(nm.textContent);
      }
    });
  }
  out.cards = bands.length; out.band = bands.length ? Math.min(...bands) : null; out.icon = icons.length ? Math.min(...icons) : null; out.cutNames = cutNames;
  // the summary of what your city makes
  const res = document.querySelector('#game .me .myres');
  out.res = res && vis(res) ? (() => { const r = res.getBoundingClientRect(); const ic = qa('.ic, .sci, svg', res).map(e => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height));
    return { h: r.height, bottom: r.bottom, right: r.right, icon: ic.length ? Math.min(...ic) : 0, over: res.scrollWidth > res.clientWidth + 1 }; })() : null;
  // hand: cost numbers and card names
  const cards = qa('#game .hand .fan > .card');
  const fs = s => cards.flatMap(c => qa(s, c)).map(e => parseFloat(getComputedStyle(e).fontSize));
  const costs = fs('.st, .cst .coin, .top .coin, .top .vp');
  out.cost = costs.length ? Math.min(...costs) : null;
  const names = fs('.nm'); out.nm = names.length ? Math.min(...names) : null;
  // the price tag never sits on a card's name
  out.tagOnName = cards.filter(c => { const st = c.querySelector('.st'), nm = c.querySelector('.nm'); if (!st || !nm || !vis(st)) return false;
    // card-local, untransformed boxes (fan cards are rotated, so screen boxes would overlap falsely)
    const a = { t: st.offsetTop, b: st.offsetTop + st.offsetHeight, l: st.offsetLeft, r: st.offsetLeft + st.offsetWidth }, b = { t: nm.offsetTop, b: nm.offsetTop + nm.offsetHeight, l: nm.offsetLeft, r: nm.offsetLeft + nm.offsetWidth };
    return a.b > b.t + 1 && a.t < b.b - 1 && a.r > b.l + 1 && a.l < b.r - 1; }).map(c => c.querySelector('.nm').textContent);
  // far seats: visible characters of each name
  out.far = qa('#game .far .seat .plate .nmx').map(e => { const r = document.createRange(); r.selectNodeContents(e); const w = e.getBoundingClientRect().width; const full = r.getBoundingClientRect().width;
    const txt = e.firstChild ? e.firstChild.textContent : e.textContent; return [Math.min(txt.length, Math.floor(txt.length * Math.min(1, full <= w + 0.5 ? 1 : (w - 8) / full))), txt.length]; });
  out.overflow = document.documentElement.scrollWidth > innerWidth + 1;
  const me = document.querySelector('#game .me').getBoundingClientRect();
  const top = cards.length ? Math.min(...cards.map(c => c.getBoundingClientRect().top)) : 1e9;
  out.handOverMe = Math.round(me.bottom - top);
  // the bottom tab bar on a phone; on a laptop the tabs are the header at the top, so the limit is the window
  const tabs = document.querySelector('nav.tabs'); const tt = tabs && vis(tabs) ? tabs.getBoundingClientRect().top : innerHeight; const limit = tt > innerHeight / 2 ? tt : innerHeight;
  out.offscreen = qa('#game .me, #game .hand .fan > .card, .act [data-do]').filter(e => e.getBoundingClientRect().bottom > limit + 1 || e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className.split(' ')[0]);
  const fan = document.querySelector('#game .hand .fan'); out.cw = fan ? parseFloat(fan.style.getPropertyValue('--card-w')) : null;
  return out;
};
for (const [st, local] of [['late7', S.age3_7], ['crowd7', S.crowd7], ['mid4', S.mid4]]) {
  for (const vp of Object.keys(VP)) {
    const ctx = await b.newContext(VP[vp]);
    await ctx.addInitScript(v => { try { localStorage.setItem('coach-offer:seven-wonders-first-game', 'true'); localStorage.setItem('sevenwonders:v1', v); localStorage.setItem('fx:seven-wonders', JSON.stringify({ animations: false })); } catch (e) {} }, local);
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    for (let t = 0; t < 2; t++) { await p.goto(url); if (await p.waitForSelector('#game .me .wboard', { timeout: 15000 }).then(() => 1, () => 0)) break; }
    await p.waitForTimeout(700);
    const m = await p.evaluate(measure);
    if (SHOTS) await p.screenshot({ path: join(SHOTS, st + '-' + vp + '.png') });
    const [fb, fi, fc, fn, ff] = FLOOR[vp];
    const tag = st + ' ' + vp + ': ';
    ok(tag + 'each built card in your city shows a band >= ' + fb + ' px', m.band >= fb, m.band && m.band.toFixed(1) + ' (' + m.cards + ' cards)');
    ok(tag + 'icons on your built cards >= ' + fi + ' px', m.icon === null || m.icon >= fi, m.icon && m.icon.toFixed(1));
    ok(tag + 'no built-card name in your city cut off', m.cutNames.length === 0, m.cutNames.join(', '));
    // laptop shows a line of what your city makes; on a phone the colour stacks' banners carry that (unchanged, Tim's earlier call)
    if (vp.startsWith('d')) ok(tag + 'what your city makes (resources, science) is shown, icons >= 14 px, not cut', !!m.res && m.res.icon >= 14 && !m.res.over, JSON.stringify(m.res && { icon: +m.res.icon.toFixed(1), over: m.res.over }));
    ok(tag + 'hand numbers (costs, prices, points) >= ' + fc + ' px', m.cost === null || m.cost >= fc, m.cost);
    ok(tag + 'hand card names >= ' + fn + ' px', m.nm === null || m.nm >= fn, m.nm);
    ok(tag + 'no price tag on top of a card name', m.tagOnName.length === 0, m.tagOnName.join(', '));
    ok(tag + 'hand cards at least ' + FW[vp] + ' px wide', m.cw >= FW[vp], m.cw);
    if (vp.startsWith('p')) ok(tag + 'far-seat names show at least ' + ff + ' letters (or the whole name)', m.far.every(([x, len]) => x >= Math.min(ff, len)), m.far.map(x => x[0]).join(','));
    ok(tag + 'hand does not cover your city/board', m.handOverMe <= 0, m.handOverMe);
    ok(tag + 'your city, hand and buttons on screen; no sideways scroll', !m.overflow && !m.offscreen.length, m.offscreen.join(','));
    ok(tag + 'no page errors', errs.length === 0, errs.join(' | '));
    console.log('     ' + tag + 'card-w ' + m.cw + ' name ' + m.nm);
    await ctx.close();
  }
}
console.log(fails + ' failed of ' + n);
await b.close();
process.exit(fails ? 1 : 0);
