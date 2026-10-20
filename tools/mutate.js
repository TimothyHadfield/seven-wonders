// Proves the tests are not vacuous: breaks the engine on purpose, one rule at a time, and checks that
// the tests catch every break and that every test fails for at least one break.
// Usage: node tools/mutate.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const M = [ // [file, find, replace, what it breaks]
  ['engine.js', 'slice(0, n + 2)', 'slice(0, n + 1)', 'one guild too few'],
  ['cards.js', "['Lumber Yard', 1, 'brown', '', [3, 4]", "['Lumber Yard', 1, 'brown', '', [3]", 'Lumber Yard marker'],
  ['cards.js', "['Temple', 2, 'blue', 'WCG', [3, 6], { vp: 3 }, ['Altar']]", "['Temple', 2, 'blue', 'WCG', [3, 6], { vp: 3 }]", 'Altar->Temple chain'],
  ['cards.js', "['CCC', { vp: 5 }], ['SSSSP'", "['SSSSP'", 'Gizah B stage count'],
  ['engine.js', 'city: [], coins: 3', 'city: [], coins: 4', 'starting coins'],
  ['engine.js', '7 * Math.min(a, b, c)', '6 * Math.min(a, b, c)', 'science set value'],
  ['engine.js', 'for (let x = 0; x <= wild; x++)', 'for (let x = 0; x < wild; x++)', 'wildcard placement'],
  ['engine.js', "if (t.raw && t.raw.indexOf('L') >= 0) rawL = 1;", "if (t.raw && t.raw.indexOf('L') >= 0) rawR = 1;", 'trading post side'],
  ['engine.js', 'if (!own && !tradable) continue;', '', 'buying yellow production'],
  ['engine.js', 'const start = i > 0 && need[i - 1] === res1 ? minG : 0;', 'const start = i > 0 && need[i - 1] === res1 ? minG + 1 : 0;', 'payment search'],
  ['engine.js', [["p.city.push(a.id);\n        if (a.free === 'oly')", "p.city.push(a.id); gain[s] += coinsFrom(st, s, a.id);\n        if (a.free === 'oly')"],
    ["for (const [s, a] of picks) if (a.t === 'build') gain[s] += coinsFrom(st, s, a.id);", '']], null, 'coin effects before all cards are down'],
  ['engine.js', 'gain[left(st, s)] += a.pay.L;', 'gain[right(st, s)] += a.pay.L;', 'who gets trade coins'],
  ['engine.js', 'const dirLeft = st.age !== 2;', 'const dirLeft = st.age === 2;', 'passing direction'],
  ['engine.js', "if (hasName(g, p, c.name)) return { ok: false, why: 'You already have one' };", '', 'duplicate names'],
  ['engine.js', 'o.L + o.R + c.coin <= p.coins', 'o.L + o.R + c.coin <= p.coins + 1', 'coin costs'],
  ['engine.js', '{ 1: 1, 2: 3, 3: 5 }[st.age]', '{ 1: 1, 2: 2, 3: 5 }[st.age]', 'military tokens'],
  ['engine.js', 'k[1] > best[1]', 'k[1] < best[1]', 'coin tie-break'],
  ['engine.js', 'if (stg[1].discard) halik.push(s);', '', 'Halikarnassos'],
  ['engine.js', "stageHas(st, p, 'seventh') && p.hand.length === 1", "false && p.hand.length === 1", 'Babylon 7th card'],
  ['engine.js', 'p.olyAge !== g.age', 'true', 'Olympia once per age'],
  ['engine.js', 'if (best) {\n        r.copied', 'if (false) {\n        r.copied', 'Olympia B copy'],
  ['engine.js', "if (c.color === 'yellow' && c.e.per) {\n      for (const pe of c.e.per) {", "if (c.color === 'blue' && c.e.per) {\n      for (const pe of c.e.per) {", 'Lighthouse/Haven coins'],
  ['engine.js', 'p.coins -= out;', 'p.coins -= out + 1;', 'overcharging'],
  ['engine.js', 'function rnd(st) { // mulberry32 on st.seed', 'function rnd(st) { return Math.random();', 'randomness outside the seed'],
  ['engine.js', "const okPhase = st.phase === 'pick' ? !p.pick :", "const okPhase = st.phase === 'pick' ? true :", 'picking twice in one turn'],
  ['engine.js', 'hand: p.hand.length, picked', 'hand: p.hand.slice(), picked', 'hands leak in public view'],
  ['online-game.js', "const kind = st.phase === 'side' ? 'side' :", "const kind = false ? 'side' :", 'online computer takeover'],
];

const testNames = new Set();
const caughtBy = {};
let missed = 0;
for (const [file, from, to, label] of M) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-mut-'));
  for (const f of fs.readdirSync(path.join(ROOT, 'js'))) if (f.endsWith('.js')) fs.copyFileSync(path.join(ROOT, 'js', f), path.join(dir, f));
  let src = fs.readFileSync(path.join(dir, file), 'utf8');
  const pairs = Array.isArray(from) ? from : [[from, to]]; // several edits for one break
  if (pairs.some(([f]) => src.indexOf(f) < 0)) { console.log('MUTATION NOT FOUND:', label); missed++; continue; }
  for (const [f, r] of pairs) src = src.replace(f, r);
  fs.writeFileSync(path.join(dir, file), src);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', 'engine.test.js')], { env: Object.assign({}, process.env, { SW_JS: dir }), encoding: 'utf8', timeout: 600000 });
  const out = r.stdout || '';
  const fails = [...out.matchAll(/^\s+FAIL\s+(.*)$/gm)].map(m => m[1]);
  [...out.matchAll(/^\s+(?:PASS|FAIL)\s+(.*)$/gm)].forEach(m => testNames.add(m[1]));
  for (const f of fails) (caughtBy[f] = caughtBy[f] || []).push(label);
  const crashed = r.status !== 0 && !fails.length;
  console.log((fails.length || crashed ? 'caught ' : 'MISSED ') + label.padEnd(40) + (crashed ? '(crashed)' : fails.length + ' failing'));
  if (!fails.length && !crashed) missed++;
  fs.rmSync(dir, { recursive: true, force: true });
}
const never = [...testNames].filter(n => !caughtBy[n]);
console.log('\n' + (M.length - missed) + '/' + M.length + ' breaks caught; tests never seen failing: ' + (never.length ? '\n  ' + never.join('\n  ') : 'none'));
process.exit(missed || never.length ? 1 : 0);
