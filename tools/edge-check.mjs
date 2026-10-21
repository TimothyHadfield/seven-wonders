// node tools/edge-check.mjs <local url> [regex] [shots dir] : weird-situation checks (WebKit): every game state at 320/393/659-landscape/
// 640x400 (200% zoom)/1280/1920, ties, Olympia, two tabs, double taps, storage blocked, offline. Prints PASS/FAIL lines.
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const S = createRequire(import.meta.url)('./edge-states.js')();
const url = process.argv[2];
const only = process.argv[3] ? new RegExp(process.argv[3]) : null;
const SHOTS = process.argv[4] || null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const b = await pw.webkit.launch();
const out = [];
const ok = (name, cond, extra) => { out.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); console.log(out[out.length - 1]); };
const VP = {
  se: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  phone: { viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  land: { viewport: { width: 659, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  zoom: { viewport: { width: 640, height: 400 } },
  laptop: { viewport: { width: 1280, height: 800 } },
  huge: { viewport: { width: 1920, height: 1080 } },
};
async function open(vp, local, opts = {}) {
  const ctx = await b.newContext(VP[vp]);
  if (opts.blockStorage) await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError'); } }); });
  else if (local !== undefined && local !== null) await ctx.addInitScript(v => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sevenwonders:v1', v); sessionStorage.setItem('seeded', '1'); } } catch (e) {} }, local);
  if (opts.noAnim) await ctx.addInitScript(() => { try { localStorage.setItem('fx:settings', JSON.stringify({ animations: false })); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(url + (opts.hash || ''));
  await p.waitForTimeout(opts.wait || 900);
  return { p, ctx, errs };
}
// layout problems on the current screen
const layout = p => p.evaluate(() => {
  const bad = [];
  const W = innerWidth, H = innerHeight;
  if (document.documentElement.scrollWidth > W + 1) bad.push('page wider than screen ' + document.documentElement.scrollWidth);
  const view = document.querySelector('.view.on');
  if (view && view.scrollHeight > view.clientHeight + 2) bad.push('view scrolls ' + view.scrollHeight + '>' + view.clientHeight);
  const nav = document.querySelector('nav.tabs').getBoundingClientRect();
  const floor = nav.top > H / 2 ? nav.top : H;
  for (const el of document.querySelectorAll('#game .act .btn, [data-start], [data-end], #game .hand .card')) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.bottom > floor + 1 || r.right > W + 1 || r.left < -1 || r.top < -1) bad.push('off screen: ' + (el.dataset.do || el.dataset.end || el.dataset.pick || el.className.split(' ')[0]) + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + '-' + Math.round(r.right) + ',' + Math.round(r.bottom));
  }
  const me = document.querySelector('#game .me');
  if (me) { const mb = me.getBoundingClientRect().bottom; for (const c of document.querySelectorAll('#game .hand .card:not(.is-up), #game .hand .wboard')) { const r = c.getBoundingClientRect(); if (r.width && r.top < mb - 3) { bad.push('hand covers your board by ' + Math.round(mb - r.top) + 'px'); break; } } }
  const su = document.querySelector('.setup.home');
  if (su && su.scrollHeight > su.clientHeight + 2) bad.push('setup scrolls ' + su.scrollHeight + '>' + su.clientHeight);
  for (const el of document.querySelectorAll('.seat .sells')) { const r = el.getBoundingClientRect(), pr = el.parentElement.getBoundingClientRect(); if (r.width && r.right > pr.right + 1) { bad.push('sell price cut off'); break; } }
  for (const el of document.querySelectorAll('#game .seat, #game .me, #game .mytop, #game .wboard, #game .nbs, #game .status')) {
    if (el.scrollWidth > el.clientWidth + 2) bad.push('overflow ' + el.className.split(' ')[0] + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > W + 1 || r.left < -1)) bad.push('outside ' + el.className.split(' ')[0]);
  }
  return bad;
});
const shot = (p, n) => !SHOTS ? null : p.screenshot({ path: join(SHOTS, n + '.png') }).catch(() => {});
const run = async (name, fn) => { if (only && !only.test(name)) return; try { await fn(); } catch (e) { ok(name, false, 'threw ' + String(e.message).split('\n')[0]); } };
const state = p => p.evaluate(() => { const g = SWApp.store.game; return g && g.state ? { age: g.state.age, turn: g.state.turn, phase: g.state.phase, city: g.state.players[0].city.length, coins: g.state.players[0].coins, log: g.state.log.length } : null; });
const pickAndDo = async (p, k, what) => { await p.click('#game .hand [data-pick="' + k + '"]', { force: true }); await p.waitForTimeout(150); await p.click('#game [data-do="' + what + '"]'); };

// ---- layouts: every screen state at every size
for (const vp of ['se', 'phone', 'land', 'zoom', 'laptop', 'huge']) {
  await run('layout setup ' + vp, async () => { const { p, ctx, errs } = await open(vp, null); const l = await layout(p); await shot(p, 'setup-' + vp); ok('layout setup ' + vp, !l.length && !errs.length, l.concat(errs).join(' | ')); await ctx.close(); });
  for (const k of ['start3', 'mid4', 'age3_7', 'age3t6_7', 'huge', 'names', 'names7', 'seventh', 'halik', 'side', 'over4', 'oly']) {
    await run('layout ' + k + ' ' + vp, async () => {
      const { p, ctx, errs } = await open(vp, S[k]);
      if (await p.$('#game .hand [data-pick="0"]')) { await p.click('#game .hand [data-pick="0"]', { force: true }); await p.waitForTimeout(300); }
      const l = await layout(p); await shot(p, k + '-' + vp);
      ok('layout ' + k + ' ' + vp, !l.length && !errs.length, l.concat(errs).join(' | '));
      await ctx.close();
    });
  }
  for (const tab of ['score', 'odds', 'study', 'settings']) await run('layout tab ' + tab + ' ' + vp, async () => {
    const { p, ctx, errs } = await open(vp, S.overTieCoins, { hash: '#' + tab });
    const l = await layout(p); await shot(p, 'tab-' + tab + '-' + vp);
    ok('layout tab ' + tab + ' ' + vp, !l.length && !errs.length, l.concat(errs).join(' | ')); await ctx.close();
  });
}

// ---- odd taps
await run('double-tap Build plays one card', async () => {
  const { p, ctx, errs } = await open('phone', S.start3);
  const a = await state(p);
  await p.click('#game .hand [data-pick="0"]', { force: true }); await p.waitForTimeout(150);
  await p.dblclick('#game [data-do="sell"]');
  await p.waitForTimeout(600);
  const z = await state(p);
  ok('double-tap Sell plays exactly one turn', z.log === a.log + 1 && !errs.length, JSON.stringify([a, z]) + errs.join('|'));
  const toasts = await p.$$eval('.toast', t => t.map(x => x.textContent));
  ok('double-tap shows no error toast', !toasts.length, toasts.join('|'));
  await ctx.close();
});
await run('rapid taps on cards during the fly animation', async () => {
  const { p, ctx, errs } = await open('phone', S.start3);
  await pickAndDo(p, 0, 'sell');
  for (let i = 0; i < 6; i++) { await p.click('#game .hand .card >> nth=0', { force: true, timeout: 500 }).catch(() => {}); await p.waitForTimeout(30); }
  await p.waitForTimeout(800);
  const l = await layout(p);
  ok('rapid taps after a pick: no errors, layout fine', !errs.length && !l.length, l.concat(errs).join('|'));
  await ctx.close();
});
await run('Deal tapped twice quickly', async () => {
  const { p, ctx, errs } = await open('phone', null);
  await p.dblclick('[data-start]'); await p.waitForTimeout(800);
  const n = await p.$$eval('#game .hand .card', x => x.length);
  ok('double-tap Deal gives one dealt hand of 7', n === 7 && !errs.length, n + ' ' + errs.join('|'));
  await ctx.close();
});
await run('reload mid-turn restores the same state', async () => {
  const { p, ctx, errs } = await open('phone', S.mid4);
  const a = await state(p);
  await p.reload(); await p.waitForTimeout(900);
  const z = await state(p);
  ok('reload restores exactly', JSON.stringify(a) === JSON.stringify(z) && !errs.length, JSON.stringify([a, z]));
  await ctx.close();
});
await run('two tabs of the same game', async () => {
  const ctx = await b.newContext(VP.phone);
  await ctx.addInitScript(v => { try { if (!localStorage.getItem('sevenwonders:v1')) localStorage.setItem('sevenwonders:v1', v); } catch (e) {} }, S.start3);
  const A = await ctx.newPage(); await A.goto(url); await A.waitForTimeout(800);
  const B2 = await ctx.newPage(); await B2.goto(url); await B2.waitForTimeout(800);
  await pickAndDo(A, 0, 'sell'); await A.waitForTimeout(900);
  await pickAndDo(A, 0, 'sell'); await A.waitForTimeout(900);
  const afterA = await state(A);
  await B2.bringToFront(); await B2.waitForTimeout(500);
  const shownB = await state(B2);
  await pickAndDo(B2, 0, 'sell').catch(() => {}); await B2.waitForTimeout(900);
  const saved = await A.evaluate(() => JSON.parse(localStorage.getItem('sevenwonders:v1')).game.state.log.length);
  ok('second tab catches up with the first (no lost turns)', shownB.log === afterA.log && saved >= afterA.log + 1, 'A=' + afterA.log + ' B saw ' + shownB.log + ' saved ' + saved);
  await ctx.close();
});
await run('storage blocked (private mode)', async () => {
  const { p, ctx, errs } = await open('phone', null, { blockStorage: true });
  await p.click('[data-start]'); await p.waitForTimeout(700);
  await pickAndDo(p, 0, 'sell'); await p.waitForTimeout(900);
  const n = await p.$$eval('#game .hand .card', x => x.length);
  ok('storage blocked: deal and play work', n === 6 && !errs.length, n + ' ' + errs.join('|'));
  await ctx.close();
});
await run('animations off mid-game', async () => {
  const { p, ctx, errs } = await open('phone', S.mid4, { noAnim: true });
  await pickAndDo(p, 0, 'sell'); await p.waitForTimeout(500);
  const l = await layout(p);
  ok('animations off: play works', !errs.length && !l.length, l.concat(errs).join('|'));
  await ctx.close();
});
await run('Settings opened mid-turn and back', async () => {
  const { p, ctx, errs } = await open('phone', S.mid4);
  await p.click('#game .hand [data-pick="1"]', { force: true }); await p.waitForTimeout(200);
  await p.click('[data-tab="settings"]'); await p.waitForTimeout(200);
  await p.goBack(); await p.waitForTimeout(500);
  const t = await p.evaluate(() => document.querySelector('[data-tab].on').dataset.tab);
  const cards = await p.$$eval('#game .hand .card', x => x.length);
  ok('Back from Settings returns to the game', t === 'play' && cards > 0 && !errs.length, t + ' ' + cards);
  await ctx.close();
});
await run('Back at the end screen', async () => {
  const { p, ctx, errs } = await open('phone', S.over4);
  await p.goBack().catch(() => {}); await p.waitForTimeout(500);
  ok('Back on the end screen stays on the site', p.url().startsWith(url) && !errs.length, p.url());
  await ctx.close();
});
await run('end screen: tie on points lost on coins', async () => {
  const { p, ctx } = await open('phone', S.overTieCoins);
  const txt = await p.textContent('#v-play');
  ok('tie lost on coins says place 2, not place 1', /place 2 of/.test(txt) && !/place 1 of/.test(txt), (txt.match(/place \d of \d/) || [''])[0]);
  await ctx.close();
});
await run('study: tie lost on coins', async () => {
  const { p, ctx } = await open('phone', S.overTieCoins);
  await p.click('[data-end="study"]'); await p.waitForTimeout(400);
  const txt = await p.textContent('#v-study');
  ok('study place counts the coin tie-break', /place 2\/4/.test(txt), (txt.match(/place \d\/\d/) || [''])[0]);
  await ctx.close();
});
await run('Olympia free build on an affordable card', async () => {
  const { p, ctx, errs } = await open('phone', S.oly);
  const info = await p.evaluate(() => {
    const v = SWApp.table.view();
    const o = SWEngine.options(v, 0, v.hand);
    return o.map((x, i) => ({ i, ok: x.build.ok, free: x.build.free, cost: x.build.ok ? x.build.coin + x.build.opts[0].L + x.build.opts[0].R : -1 }));
  });
  const k = info.find(x => x.ok && !x.free && x.cost > 0) || info.find(x => x.ok && !x.free);
  if (!k) { ok('Olympia free build offered on an affordable card', false, 'no affordable card ' + JSON.stringify(info)); await ctx.close(); return; }
  await p.click('#game .hand [data-pick="' + k.i + '"]', { force: true }); await p.waitForTimeout(200);
  const freeBtn = await p.$('#game [data-pay="oly"]');
  if (freeBtn) { await freeBtn.click(); await p.waitForTimeout(150); await p.click('#game [data-do="build"]'); await p.waitForTimeout(900); }
  const s = await p.evaluate(() => { const p0 = SWApp.store.game.state.players[0]; return { coins: p0.coins, olyAge: p0.olyAge }; });
  ok('Olympia free build offered on an affordable card', !!freeBtn && s.olyAge === 2 && !errs.length, JSON.stringify(s) + ' cost ' + k.cost);
  await ctx.close();
});
await run('Babylon 7th card', async () => {
  const { p, ctx, errs } = await open('phone', S.seventh);
  const head = await p.textContent('#game .act');
  await pickAndDo(p, 0, 'sell'); await p.waitForTimeout(900);
  const s = await state(p);
  ok('Babylon plays its 7th card, then Age II starts', /7th card/.test(head) && s.age === 2 && !errs.length, JSON.stringify(s));
  await ctx.close();
});
await run('Halikarnassos discard build', async () => {
  const { p, ctx, errs } = await open('phone', S.halik);
  const n = await p.$$eval('#game [data-dpick]', x => x.length);
  await p.click('#game [data-dpick="0"]', { force: true }); await p.waitForTimeout(200);
  await p.dblclick('#game [data-dbuild]'); await p.waitForTimeout(900);
  const s = await state(p);
  ok('Halikarnassos builds one discarded card (double-tap safe)', n > 0 && s.phase === 'pick' && !errs.length, n + ' ' + JSON.stringify(s) + errs.join('|'));
  await ctx.close();
});
await run('wonder side choice', async () => {
  const { p, ctx, errs } = await open('phone', S.side);
  await p.dblclick('#game [data-side="B"]'); await p.waitForTimeout(900);
  const s = await p.evaluate(() => { const g = SWApp.store.game.state; return { phase: g.phase, side: g.players[0].side }; });
  ok('side B chosen once, game dealt', s.phase === 'pick' && s.side === 'B' && !errs.length, JSON.stringify(s) + errs.join('|'));
  await ctx.close();
});
await run('hint with one card left', async () => {
  const { p, ctx, errs } = await open('phone', S.age3t6_7);
  await p.click('#btn-hint'); await p.waitForTimeout(300);
  const t = await p.textContent('#game .act');
  ok('hint on the last pick of the game', /Hint/.test(t) && !errs.length, t.slice(0, 80));
  await ctx.close();
});
await run('play a whole game by tapping (7 players, SE)', async () => {
  const { p, ctx, errs } = await open('se', null, { noAnim: true });
  await p.click('[data-set="n"] [data-v="7"]'); await p.click('[data-start]'); await p.waitForTimeout(500);
  for (let k = 0; k < 40; k++) {
    if (await p.$('[data-end]')) break;
    if (await p.$('#game [data-side]')) { await p.click('#game [data-side="A"]'); await p.waitForTimeout(150); continue; }
    if (await p.$('#game [data-dskip]')) { await p.click('#game [data-dskip]'); await p.waitForTimeout(150); continue; }
    if (await p.$('#game .hand [data-pick="0"]')) { await pickAndDo(p, 0, 'sell'); await p.waitForTimeout(200); continue; }
    await p.waitForTimeout(200);
  }
  const end = await p.$('[data-end]');
  const l = await layout(p); await shot(p, 'end7-se');
  ok('whole 7-player game to the end screen at 320px', !!end && !errs.length && !l.length, l.concat(errs).join('|'));
  await ctx.close();
});
await run('online with no network', async () => {
  const { p, ctx, errs } = await open('phone', null);
  await ctx.setOffline(true);
  await p.click('[data-on="open"]'); await p.waitForTimeout(500);
  await p.fill('#on-name', 'Tester').catch(() => {});
  await p.click('[data-on="create"]').catch(() => {});
  await p.waitForTimeout(9000);
  const txt = await p.textContent('#v-play');
  ok('offline create room: not stuck on Connecting', !/Connecting/.test(txt), txt.slice(0, 120).replace(/\s+/g, ' '));
  await ctx.close();
});
await run('menu sheet then quit confirm then cancel', async () => {
  const { p, ctx, errs } = await open('phone', S.mid4);
  await p.click('#btn-menu'); await p.waitForTimeout(200);
  await p.click('[data-m="quit"]'); await p.waitForTimeout(200);
  await p.click('[data-c="no"]'); await p.waitForTimeout(200);
  const cards = await p.$$eval('#game .hand .card', x => x.length);
  await p.goBack(); await p.waitForTimeout(400);
  const still = await p.$$eval('#game .hand .card', x => x.length);
  ok('cancel quit keeps the game; Back after stays', cards > 0 && still > 0 && p.url().startsWith(url) && !errs.length, cards + '/' + still);
  await ctx.close();
});
await run('online lobby in landscape', async () => {
  const { p, ctx, errs } = await open('land', null);
  await p.click('[data-on="open"]'); await p.waitForTimeout(600);
  const l = await layout(p); await shot(p, 'lobby-land');
  const create = await p.$('[data-on="create"]'); const r = create && await create.boundingBox();
  ok('online lobby at 659x393: Create reachable', !!r && r.y + r.height <= 393 - 58 + 1, JSON.stringify(r) + l.join('|'));
  await ctx.close();
});
await run('stacked dialogs: city sheet then Log button', async () => {
  const { p, ctx, errs } = await open('phone', S.mid4);
  await p.click('#game .nb[data-nb="L"]'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('#btn-log').click()); await p.waitForTimeout(200);
  const sheets = await p.$$eval('#sheet', x => x.length);
  await p.goBack(); await p.waitForTimeout(400);
  const left = await p.$$eval('#sheet', x => x.length);
  ok('never two sheets at once; Back closes it', sheets === 1 && left === 0 && p.url().startsWith(url) && !errs.length, sheets + '/' + left);
  await ctx.close();
});

console.log(out.filter(x => x.startsWith('FAIL')).length + ' failed of ' + out.length);
await b.close();
