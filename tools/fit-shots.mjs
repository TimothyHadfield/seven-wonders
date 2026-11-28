// node tools/fit-shots.mjs <local url> <shots dir> : screenshots of the crowded (7 players, Age III turn 6, long names) and normal (4 players, Age II) states at 5 sizes (WebKit).
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
const require = createRequire(join(homedir(), '.claude', 'tools', 'package.json'));
const pw = require('playwright');
const S = createRequire(import.meta.url)('./edge-states.js')();
const [url, dir] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const VP = {
  p393: { viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  p320: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  land: { viewport: { width: 659, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  d1280: { viewport: { width: 1280, height: 800 } },
  d1440: { viewport: { width: 1440, height: 900 } },
};
const b = await pw.webkit.launch();
for (const [st, local] of [['crowded', S.crowd7], ['normal', S.mid4]]) {
  for (const vp of Object.keys(VP)) {
    const ctx = await b.newContext(VP[vp]);
    await ctx.addInitScript(v => { try { localStorage.setItem('coach-offer:seven-wonders-first-game', 'true'); localStorage.setItem('sevenwonders:v1', v); localStorage.setItem('fx:seven-wonders', JSON.stringify({ animations: false })); } catch (e) {} }, local);
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(url); await p.waitForSelector('#game .me .wboard', { timeout: 15000 }); await p.waitForTimeout(800);
    await p.screenshot({ path: join(dir, st + '-' + vp + '.png') });
    console.log(st, vp, errs.length ? 'ERR ' + errs.join(' | ') : 'ok');
    await ctx.close();
  }
}
await b.close();
