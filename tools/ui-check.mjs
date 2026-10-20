// node tools/ui-check.mjs <local url> : headless WebKit checks for Back, Score inputs, corrupt saves (Playwright from ~/.claude/tools)
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const url = process.argv[2];
const b = await pw.webkit.launch();
const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
async function page(local) {
  const ctx = await b.newContext(pw.devices['iPhone 15']);
  if (local !== undefined) await ctx.addInitScript(v => { try { localStorage.setItem('sevenwonders:v1', v); } catch (e) {} }, local);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // a page before ours, so "leaving the site" is detectable
  await p.goto('about:blank');
  await p.goto(url);
  await p.waitForTimeout(500);
  return { p, errs };
}
const onSite = p => p.url().startsWith(url);
const tab = p => p.evaluate(() => document.querySelector('[data-tab].on')?.dataset.tab);

// 1. Back mid-game stays in the game; Back closes a sheet; Back leaves the lobby for setup
{
  const { p, errs } = await page();
  await p.click('[data-start]'); await p.waitForTimeout(400);
  await p.goBack().catch(() => {}); await p.waitForTimeout(400);
  ok('back right after Deal stays in the game', onSite(p) && await p.$('.hand .card') !== null, p.url());
  await p.goBack().catch(() => {}); await p.waitForTimeout(400);
  ok('second back still in the game', onSite(p) && await p.$('.hand .card') !== null, p.url());
  if (!onSite(p)) { await p.goto(url); await p.waitForTimeout(400); }
  await p.click('[data-tab="odds"]'); await p.waitForTimeout(200);
  await p.goBack(); await p.waitForTimeout(400);
  ok('back from Odds mid-game returns to the game', await tab(p) === 'play' && await p.$('.hand .card') !== null);
  try {
  const menu = await p.$('#btn-menu, [aria-label="Menu"], [title="Menu"]');
  if (menu) {
    await menu.click(); await p.waitForTimeout(300);
    const had = await p.$('#sheet') !== null;
    await p.goBack(); await p.waitForTimeout(400);
    ok('back closes the sheet and stays in the game', had && await p.$('#sheet') === null && onSite(p) && await p.$('.hand .card') !== null);
    await menu.click().catch(() => {}); await p.waitForTimeout(300);
    await p.click('#sheet [data-close]'); await p.waitForTimeout(400);
    ok('Close button closes the sheet, still in game', await p.$('#sheet') === null && onSite(p) && await p.$('.hand .card') !== null);
    await p.goBack(); await p.waitForTimeout(400);
    if (!onSite(p)) { await p.goto(url); await p.waitForTimeout(400); }
    ok('back after closing a sheet still in game', onSite(p) && await p.$('.hand .card') !== null);
  } else ok('menu button found', false);
  } catch (e) { ok('sheet steps ran', false, e.message.split(String.fromCharCode(10))[0]); if (!onSite(p)) await p.goto(url); }
  // reload mid-game then back
  await p.reload(); await p.waitForTimeout(600);
  await p.goBack().catch(() => {}); await p.waitForTimeout(400);
  ok('after reload, back stays in the game', onSite(p) && await p.$('.hand .card') !== null, p.url());
  ok('no errors (back test)', errs.length === 0, errs.join(' | '));
}
{
  const { p, errs } = await page();
  await p.click('[data-on="open"]'); await p.waitForTimeout(500);
  const inLobby = await p.$('[data-start]') === null;
  await p.goBack(); await p.waitForTimeout(500);
  const lobbyOk = onSite(p);
  if (!lobbyOk) { await p.goto(url); await p.waitForTimeout(400); }
  ok('back from the online lobby returns to setup', inLobby && lobbyOk && await p.$('[data-start]') !== null, p.url());
  ok('no errors (lobby test)', errs.length === 0, errs.join(' | '));
}
// 3-5. Score inputs
{
  const { p, errs } = await page();
  await p.click('[data-tab="score"]');
  const box = (k, i = 0) => '[data-k="' + k + '"][data-i="' + i + '"]';
  const type = async (k, s, i = 0) => { await p.fill(box(k, i), ''); await p.type(box(k, i), s); await p.waitForTimeout(100); return p.inputValue(box(k, i)); };
  const total = i => p.textContent('[data-out="total"][data-i="' + i + '"]');
  { const c = await type('coins', '-9'); const t = await total(0); ok('coins never negative; box = count', !c.startsWith('-') && Number(t) === Math.floor(Number(c) / 3), c + ' / ' + t); }
  await type('coins', '');
  { const c = await type('compass', '-3'); const sc = await p.textContent('[data-out="sci"][data-i="0"]'); ok('compass never negative; science = count^2', !c.startsWith('-') && parseInt(sc) === Number(c) ** 2, c + ' / ' + sc); }
  await type('compass', '');
  ok('military may be -6, not -7', await type('mil', '-7') === '-6' && await total(0) === '-6');
  await type('mil', '');
  const v = await type('civil', '99999');
  ok('99999 shows what is counted (cap 99)', v === '99' && await total(0) === '99', v + ' / ' + await total(0));
  await type('civil', '');
  const v2 = await type('civil', '1-2');
  ok('"1-2" shows what is counted', v2 === '12' && await total(0) === '12', v2 + ' / ' + await total(0));
  await type('civil', '');
  const v3 = await type('tablet', '1022493');
  ok('symbol cap 20', v3 === '20' && (await p.textContent('[data-out="sci"][data-i="0"]')).startsWith('400'), v3 + ' / ' + await p.textContent('[data-out="sci"][data-i="0"]'));
  ok('no errors (score test)', errs.length === 0, errs.join(' | '));
}
// 6-7. Corrupt saves
const bad = ['{"v":1,"score":{"v":"x"}}', '{"v":1,"score":{"n":99,"v":{}}}', '{"v":1,"last":{"view":{"result":{}}}}', 'garbage', '{}', '{"v":1,"settings":{"n":99,"ed":5}}', '{"v":1,"game":{"state":null}}',
  '{"v":1,"score":{"n":4,"v":{"coins":[-50,"abc",1e9]}}}', '{"v":1,"last":{"view":{"ed":1,"players":[{},{},{}],"result":{"scores":[{"total":1},{"total":2},{"total":3}],"winners":[2]}},"me":0,"dec":[{"lost":"x"}]}}'];
for (const s of bad) {
  const { p, errs } = await page(s);
  const res = {};
  for (const t of ['play', 'score', 'study', 'odds', 'settings']) {
    await p.click('[data-tab="' + t + '"]'); await p.waitForTimeout(150);
    res[t] = await p.evaluate(t => (document.querySelector('#v-' + t)?.innerText || '').trim().length, t);
  }
  ok('corrupt save ' + s.slice(0, 50) + ': every tab draws', Object.values(res).every(x => x > 10) && errs.length === 0, JSON.stringify(res) + ' ' + errs.join(' | '));
}
{
  const { p } = await page('{"v":1,"settings":{"n":"5","ed":"2"}}');
  const sel = await p.evaluate(() => document.querySelector('[data-set="n"] [aria-pressed="true"]')?.dataset.v);
  ok('text player count "5" selects 5', sel === '5', String(sel));
}
console.log(out.join('\n'));
console.log(out.filter(x => x.startsWith('FAIL')).length + ' failed of ' + out.length);
await b.close();
