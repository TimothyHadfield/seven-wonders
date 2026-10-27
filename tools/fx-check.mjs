// node tools/fx-check.mjs <local url> : headless WebKit (iPhone 15) check of sounds + effects in the real page.
// A fake AudioContext is installed (Playwright's WebKit on Windows has none), FX.play / FX.celebrate are spied on,
// and a whole game is played by tapping. Checks: the right sounds per event, Sound off = silence,
// Animations off = no animation, the end celebration, no console errors. (Playwright from ~/.claude/tools)
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const url = process.argv[2];
const shots = process.argv[3]; // optional folder for screenshots
const b = await pw.webkit.launch();
const out = [];
const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));

const FAKE = () => {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = x => Object.assign({ connect() {}, start() {}, stop() {} }, x);
  window.AudioContext = class {
    constructor() { this.state = 'running'; this.sampleRate = 8000; this.destination = node(); }
    get currentTime() { return performance.now() / 1000; }
    createGain() { return node({ gain: param() }); } createOscillator() { return node({ frequency: param() }); }
    createBiquadFilter() { return node({ frequency: param(), Q: param() }); } createBufferSource() { return node({}); }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } createDynamicsCompressor() { return node(); }
    createStereoPanner() { return node({ pan: param() }); } resume() { return Promise.resolve(); }
  };
  window.__anim = 0;
  const A = Element.prototype.animate;
  Element.prototype.animate = function () { window.__anim++; return A.apply(this, arguments); };
  window.addEventListener('DOMContentLoaded', () => {
    const F = window.FX; window.__snd = []; window.__cel = [];
    const p = F.play, c = F.celebrate;
    F.play = (n, o) => { const r = p(n, o); window.__snd.push({ n, played: r, pan: o && o.pan }); return r; };
    F.celebrate = o => { window.__cel.push(o.kind); return c(o); };
  });
};

const ctx = await b.newContext(pw.devices['iPhone 15']);
await ctx.addInitScript(() => { try { localStorage.setItem('coach-offer:seven-wonders-first-game', 'true'); } catch (e) {} });  // the guided-game offer stays out of the way
await ctx.addInitScript(FAKE);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(url);
await p.waitForTimeout(400);
const hasFX = await p.evaluate(() => !!(window.FX && window.__snd));
ok('fx.js loaded and spied', hasFX);
if (!hasFX) { console.log(out.join('\n')); await b.close(); process.exit(1); }
const take = () => p.evaluate(() => { const s = window.__snd.slice(), c = window.__cel.slice(); window.__snd.length = 0; window.__cel.length = 0; return { s, c, plays: FX.stats.plays }; });
const names = r => r.s.map(x => x.n);

// first tap unlocks audio, then deal
await p.click('[data-start]');
await p.waitForTimeout(900);
let r = await take();
ok('Deal: shuffle + 7 card deals', names(r).includes('shuffle') && names(r).filter(n => n === 'cardDeal').length === 7, names(r).join(','));
ok('Deal: sounds really play (fake audio)', r.s.some(x => x.played));

// one turn: tap a card (card sound), then the first enabled action
async function turn() {
  const v = await p.evaluate(() => { const v = SWApp.table && SWApp.table.view(); return v ? { phase: v.phase, disc: v.pendingDiscard === 0 } : null; });
  if (!v || v.phase === 'over') return false;
  if (await p.$('[data-dskip]')) { await p.click('[data-dskip]'); return true; }
  if (await p.$('[data-side]')) { await p.click('[data-side="A"]'); return true; }
  await p.click('.hand [data-pick="0"]');
  for (const k of ['build', 'wonder', 'sell']) {
    const el = await p.$('[data-do="' + k + '"]:not([disabled])');
    if (el) { await el.click(); return k; }
  }
  return true;
}
let k = await turn();
await p.waitForTimeout(1000);
r = await take();
ok('Card tap: card flip sound', names(r).includes('cardFlip'));
ok('Your ' + k + ': ' + (k === 'build' ? 'stamp' : k === 'wonder' ? 'stage' : 'coins'), names(r).includes(k === 'build' ? 'stamp' : k === 'wonder' ? 'stage' : 'coins'), names(r).join(','));
const wh = r.s.find(x => x.n === 'whoosh');
ok('Hand passed in Age I: whoosh from the right', wh && wh.pan > 0);
ok('Animations ran (flight, slide, deal)', await p.evaluate(() => window.__anim > 0));

// Sound off: a turn makes no sound
await p.evaluate(() => FX.set('sound', false));
let before = (await take()).plays;
await turn(); await p.waitForTimeout(1000);
r = await take();
ok('Sound off: nothing plays', r.s.length > 0 && r.s.every(x => !x.played) && r.plays === before, r.s.length + ' asked, ' + (r.plays - before) + ' played');
await p.evaluate(() => FX.set('sound', true));

// Animations off: no Web Animation, no CSS animation on cards
await p.evaluate(() => { FX.set('animations', false); window.__anim = 0; });
await turn(); await p.waitForTimeout(150);
const cssAnim = await p.evaluate(() => document.getAnimations().filter(a => !(a.animationName === 'blink')).length);
ok('Animations off: nothing animates', await p.evaluate(() => window.__anim === 0) && cssAnim === 0, 'web ' + await p.evaluate(() => window.__anim) + ', css ' + cssAnim);
await p.evaluate(() => FX.set('animations', true));
await p.waitForTimeout(800);
await take();

// play to the end
let clash = 0, all = [];
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => SWApp.table.view().phase === 'over')) break;
  if (shots && i === 8) await p.screenshot({ path: join(shots, 'mid-game-393.png') });
  await turn();
  await p.waitForTimeout(i % 6 === 5 ? 2200 : 700);
  r = await take();
  all = all.concat(names(r));
  clash += names(r).filter(n => n === 'clash').length;
}
const won = await p.evaluate(() => SWApp.table.view().result.winners.indexOf(0) >= 0);
await p.waitForTimeout(1200);
if (shots) await p.screenshot({ path: join(shots, 'end-393.png') });
await p.waitForTimeout(2500);
r = await take();
all = all.concat(names(r));
clash += names(r).filter(n => n === 'clash').length;
ok('Military clash at the end of each age', clash === 3, 'clashes ' + clash);
const celAll = r.c;
ok('Game over: ' + (won ? 'win' : 'lose') + ' celebration', celAll.includes(won ? 'win' : 'lose'), celAll.join(','));
ok('Game over: scores counted (ticks)', all.filter(n => n === 'tick').length >= 8);
const cells = await p.evaluate(() => Array.from(document.querySelectorAll('table.sc td[data-v]')).every(td => td.textContent === td.dataset.v));
ok('Score table ends on the real numbers', cells);
ok('No console errors', errs.length === 0, errs.join(' | '));
const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
ok('No horizontal overflow', !ov);
console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL')).length;
console.log(fails ? fails + ' failed' : 'all passed');
await b.close();
process.exit(fails ? 1 : 0);
