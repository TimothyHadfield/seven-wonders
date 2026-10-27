// node tools/vis-check.mjs <local url> [shots dir] : can you see what's happening? (WebKit) Card, icon and board sizes at
// 320 / 393 / phone landscape / 1280 / 1440 with 7 players late in Age III and 4 players mid-game. Prints PASS/FAIL lines.
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const S = createRequire(import.meta.url)('./edge-states.js')();
const url = process.argv[2];
const SHOTS = process.argv[3] || null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const engine = process.env.ENGINE === 'chrome' ? pw.chromium : pw.webkit;
const b = await engine.launch();
let fails = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) fails++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  ' + extra : '')); };
const VP = {
  p320: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  p393: { viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  land: { viewport: { width: 659, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  land15: { viewport: { width: 734, height: 343 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  d1280: { viewport: { width: 1280, height: 800 } },
  d1440: { viewport: { width: 1440, height: 900 } },
};
// floors per size: [hand card width, card name px, smallest cost/effect icon px, wonder stage icon px]. 320 px is height-bound (7 seats, SE height): a regression guard only.
const FLOOR = { p320: [45, 5, 5.5, 11], p393: [79, 8.8, 8.3, 12], land: [62, 7, 7, 11], land15: [58, 6.5, 6.5, 11], d1280: [140, 15, 15, 16], d1440: [145, 15, 15, 16] };
const measure = () => {
  const qa = s => Array.from(document.querySelectorAll(s)).filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).display !== 'none'; });
  const minsz = s => { const r = qa(s).map(e => e.getBoundingClientRect()); return r.length ? Math.min(...r.map(x => Math.min(x.width, x.height))) : null; };
  const fan = document.querySelector('#game .hand .fan');
  const cards = qa('#game .hand .fan > .card');
  const cw = fan ? parseFloat(fan.style.getPropertyValue('--card-w')) : null;
  const nm = cards.length ? Math.min(...cards.map(c => parseFloat(getComputedStyle(c.querySelector('.nm')).fontSize))) : null;
  const icons = minsz('#game .hand .card .top .ic, #game .hand .card .top .coin, #game .hand .card .cst .ic, #game .hand .card .cst .coin');
  const stg = minsz('#game .me .wboard .stg:not(.built) .ic');
  const board = document.querySelector('#game .me .wboard').getBoundingClientRect();
  const cardTop = cards.length ? Math.min(...cards.map(c => c.getBoundingClientRect().top)) : 1e9;
  const hand = document.querySelector('#game .hand').getBoundingClientRect();
  const cb = cards.map(c => c.getBoundingClientRect());
  const emptyAbove = cards.length ? Math.round(cardTop - hand.top) : null;
  const sells = Array.from(document.querySelectorAll('.nbs .seat[data-nb="R"] .sells')).map(e => e.textContent).join('');
  const nbIcon = minsz('.nbs .seat .mc .top .ic');
  const farH = (document.querySelector('#game .far') || {}).getBoundingClientRect?.().height || 0;
  const steps = cb.slice(1).map((r, i) => r.left - cb[i].left);
  const showShare = steps.length && cw ? Math.min(...steps) / cw : 1;
  // a hand card's name is readable when the end of every line of it is still on that card (not under the next card)
  const cutNames = cards.filter(c => {
    const nmEl = c.querySelector('.nm'); const rg = document.createRange(); rg.selectNodeContents(nmEl);
    return Array.from(rg.getClientRects()).some(r => { const y = r.top + r.height / 2;
      return [r.left + 1, r.right - 1].some(x => { const hit = document.elementFromPoint(x, y); return !hit || hit.closest('.card') !== c; }); });
  }).map(c => c.querySelector('.nm').textContent);
  // your own colour stacks end before your coin pile starts
  const cc = document.querySelector('#game .me .citycards'), mt = document.querySelector('#game .me .mine-tok');
  const lastCol = cc && cc.lastElementChild ? cc.lastElementChild.getBoundingClientRect().right : 0;
  const coinOverlap = mt ? Math.round(lastCol - mt.getBoundingClientRect().left) : 0;
  const nbStacks = qa('.nbs .seat .srow').filter(e => e.getBoundingClientRect().height > 8).length;
  return { coinOverlap, nbStacks, cutNames, showShare, cw, nm, icons, stg, overlapBoard: Math.round(board.bottom - cardTop), emptyAbove, sells, nbIcon, farH,
    overflow: document.documentElement.scrollWidth > innerWidth, cardsInView: cb.every(r => r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1) };
};
for (const [st, local] of [['late7', S.age3_7], ['mid4', S.mid4], ['late7t6', S.age3t6_7]]) {
  for (const vp of Object.keys(VP)) {
    const ctx = await b.newContext(VP[vp]);
    await ctx.addInitScript(() => { try { localStorage.setItem('coach-offer:seven-wonders-first-game', 'true'); } catch (e) {} });  // the guided-game offer stays out of the way
    await ctx.addInitScript(v => { try { localStorage.setItem('sevenwonders:v1', v); localStorage.setItem('fx:seven-wonders', JSON.stringify({ animations: false })); } catch (e) {} }, local);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    // one reload if the local test server stalls a request (seen now and then in Chrome under load)
    for (let t = 0; t < 2; t++) { await p.goto(url); if (await p.waitForSelector('#game .me .wboard', { timeout: 15000 }).then(() => 1, () => 0)) break; }
    await p.waitForTimeout(800);
    const m = await p.evaluate(measure);
    if (SHOTS) await p.screenshot({ path: join(SHOTS, st + '-' + vp + '.png') });
    const [fw, fnm, fic, fstg] = FLOOR[vp];
    const tag = st + ' ' + vp + ': ';
    ok(tag + 'hand cards at least ' + fw + ' px wide', m.cw >= fw, m.cw);
    ok(tag + 'card names at least ' + fnm + ' px', m.nm >= fnm, m.nm);
    ok(tag + 'card cost/effect icons at least ' + fic + ' px', m.icons >= fic, m.icons && m.icons.toFixed(1));
    ok(tag + 'next wonder stage icons at least ' + fstg + ' px', m.stg === null || m.stg >= fstg, m.stg && m.stg.toFixed(1));
    ok(tag + 'every hand card name readable (not under the next card)', m.cutNames.length === 0, m.cutNames.join(', '));
    ok(tag + 'hand does not cover your wonder board', m.overlapBoard <= 0, m.overlapBoard);
    ok(tag + 'your colour stacks do not run under your coins', m.coinOverlap <= 0, m.coinOverlap);
    ok(tag + 'all hand cards on screen, no sideways scroll', m.cardsInView && !m.overflow);
    if (vp.startsWith('d')) {
      ok(tag + 'each hand card shows >= 60% of its width (name readable)', m.showShare >= 0.6, m.showShare.toFixed(2));
      ok(tag + 'no empty band above the hand (<= 70 px)', m.emptyAbove <= 70, m.emptyAbove);
      ok(tag + 'neighbours\' built cards show their icons (>= 10 px)', m.nbIcon >= 10, m.nbIcon && m.nbIcon.toFixed(1));
    }
    if (vp === 'p393') ok(tag + 'far seats row at most 46 px', m.farH <= 46, Math.round(m.farH));
    if (vp === 'p393') ok(tag + 'both neighbours show their built-card colour stacks', m.nbStacks === 2, m.nbStacks);
    // late7: you have a raw-goods trading post on the right, so raw goods cost 1 there and glass/press/loom 2
    if (st === 'late7') ok(tag + 'right neighbour shows both prices (1 and 2)', /1¢/.test(m.sells) && /2¢/.test(m.sells), m.sells);
    // tapping a card still selects that card
    const k = await p.$$eval('#game .hand .fan > .card', cs => cs.length - 1);
    const box = await (await p.$('#game .hand .fan > .card[data-pick="' + k + '"]')).boundingBox();
    await p.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.6);
    await p.waitForTimeout(400);
    const sel = await p.evaluate(() => { const s = document.querySelector('#game .hand .card.sel'); return s ? s.dataset.pick : null; });
    ok(tag + 'tap on the last card selects it', sel === String(k), sel);
    const btn = await p.evaluate(() => { const r = document.querySelector('.act [data-do="build"]')?.getBoundingClientRect(); return r ? r.bottom <= innerHeight && r.height >= 40 : false; });
    ok(tag + 'Build button on screen and >= 40 px', btn);
    await p.click('#game .hand .fan > .card[data-pick="0"]', { force: true }); await p.waitForTimeout(400);
    // the picked card's panel: no line squashed below its own height, buttons inside the panel
    const actOk = await p.evaluate(() => { const a = document.querySelector('.act'), ar = a.getBoundingClientRect();
      const squashed = Array.from(a.querySelectorAll('.tx, .odds')).filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height < parseFloat(getComputedStyle(e).lineHeight) - 1).map(e => e.className);
      const b = a.querySelector('.btns').getBoundingClientRect(); return squashed.join(',') + (b.bottom > ar.bottom + 1 ? ' buttons-outside' : ''); });
    ok(tag + 'picked card panel: no squashed lines, buttons inside', actOk === '', actOk);
    ok(tag + 'no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
}
console.log(fails + ' failed of ' + n);
await b.close();
process.exit(fails ? 1 : 0);
