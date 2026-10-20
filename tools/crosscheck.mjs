// Cross-checks js/cards.js against independent open-source card lists.
// Usage: node tools/crosscheck.mjs <dir-with-downloaded-sources>
// Sources (download with gh api ... -H "Accept: application/vnd.github.raw"):
//   1st edition: joffrey-bion/seven-wonders  sw-engine/.../data/cards.json + wonders.json  -> cards.json, wonders.json
//                zackgomez/7wonders cards.js -> zack_cards.js ; brdgme/brdgme rust/game/seven-wonders-1/src/card.rs -> brdgme_card.rs
//   2nd edition: IceboxDev/BoardGames packages/core/src/games/7-wonders/cards.ts + wonders.ts -> icebox_cards.mts, icebox_wonders.ts
//                thascoet/7Wonders back_end/data/cards.ts + wonders.ts -> thascoet_cards.ts, thascoet_wonders.ts
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const SW = require('../js/cards.js');
const dir = process.argv[2];
if (!dir) { console.error('give the sources folder'); process.exit(2); }
const P = f => path.join(dir, f);
const sortS = s => s.split('').sort().join('');
const counts = ps => [3, 4, 5, 6, 7].map(n => ps.filter(p => p <= n).length).join('');
const norm = s => s.toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '');
let problems = 0;
function cmp(label, ours, theirs, fields) {
  for (const k of fields) {
    if (theirs[k] === undefined) continue;
    if (String(ours[k]) !== String(theirs[k])) { problems++; console.log(`  DIFF ${label} ${ours.name} age ${ours.age} ${k}: ours=${ours[k]} theirs=${theirs[k]}`); }
  }
}
function ourRows(ed) {
  return SW.EDITIONS[ed].list.map(c => ({
    name: c.name, age: c.age, color: c.color, coin: c.coin, res: sortS(c.res), counts: c.color === 'purple' ? '' : counts(c.players),
    from: c.from.map(norm).sort().join(','), vp: c.e.vp || 0, sh: c.e.sh || 0, sci: c.e.sci || '',
    prod: c.e.prod ? sortS(c.e.prod.replace(/\//g, '')) : '',
  }));
}
function report(label, ed, theirs) {
  const ours = ourRows(ed);
  console.log(`\n== ${label} (edition ${ed}): ours ${ours.length} cards, theirs ${theirs.length}`);
  const key = r => norm(r.name) + '|' + r.age;
  const tm = new Map(theirs.map(r => [key(r), r]));
  for (const o of ours) {
    const t = tm.get(key(o));
    if (!t) { problems++; console.log(`  MISSING in theirs: ${o.name} age ${o.age}`); continue; }
    cmp(label, o, t, ['coin', 'res', 'counts', 'from', 'vp', 'sh', 'sci', 'prod']);
    tm.delete(key(o));
  }
  for (const t of tm.values()) { problems++; console.log(`  EXTRA in theirs: ${t.name} age ${t.age}`); }
}

// ---- joffrey (1st edition)
{
  const j = JSON.parse(fs.readFileSync(P('cards.json'), 'utf8'));
  const rows = [];
  const sci = { COMPASS: 'compass', WHEEL: 'gear', TABLET: 'tablet' };
  for (const [ak, age] of [['age1', 1], ['age2', 2], ['age3', 3]]) {
    for (const x of j[ak].cards) {
      const cp = x.countPerNbPlayer;
      rows.push({ name: x.name, age, coin: (x.requirements && x.requirements.gold) || 0, res: sortS((x.requirements && x.requirements.resources) || ''),
        counts: [3, 4, 5, 6, 7].map(n => cp[n]).join(''), from: (x.chainParents || []).map(norm).sort().join(','),
        vp: x.effect.points || 0, sh: x.effect.military || 0, sci: x.effect.science ? sci[x.effect.science] || '' : '',
        prod: x.effect.production ? sortS(x.effect.production.resources.replace(/\//g, '')) : '' });
    }
  }
  for (const x of j.guildCards) rows.push({ name: x.name, age: 3, coin: 0, res: sortS(x.requirements.resources), counts: '', from: '', vp: 0, sh: 0, sci: '', prod: '' });
  report('joffrey-bion/seven-wonders', 1, rows);
  const w = JSON.parse(fs.readFileSync(P('wonders.json'), 'utf8'));
  console.log('\n== joffrey wonders (edition 1)');
  for (const wd of w) {
    const id = norm(wd.name).replace('rhode', 'rhodo').replace('giza', 'gizah');
    const ours = SW.EDITIONS[1].wonders[Object.keys(SW.EDITIONS[1].wonders).find(k => norm(k) === id || norm(k).startsWith(id.slice(0, 5)))];
    if (!ours) { problems++; console.log('  no wonder', wd.name); continue; }
    for (const side of ['A', 'B']) {
      const ts = wd.sides[side];
      if (ts.initialResource !== ours.res) { problems++; console.log(`  DIFF ${wd.name} res ${ours.res} vs ${ts.initialResource}`); }
      if (ts.stages.length !== ours[side].length) { problems++; console.log(`  DIFF ${wd.name} ${side} stage count`); }
      ts.stages.forEach((st, i) => {
        const o = ours[side][i]; if (!o) return;
        const tr = sortS(st.requirements.resources || ''), or = sortS(o[0]);
        if (tr !== or) { problems++; console.log(`  DIFF ${wd.name} ${side}${i + 1} cost ours=${or} theirs=${tr}`); }
        const te = st.effects, oe = o[1];
        const tvp = te.points || 0, tsh = te.military || 0, tco = te.gold || 0;
        if (tvp !== (oe.vp || 0) || tsh !== (oe.sh || 0) || tco !== (oe.coins || 0)) { problems++; console.log(`  DIFF ${wd.name} ${side}${i + 1} effect ours=${JSON.stringify(oe)} theirs=${JSON.stringify(te)}`); }
        console.log(`  ok? ${wd.name} ${side}${i + 1} ${or} ${JSON.stringify(oe)} | theirs ${JSON.stringify(te)}`);
      });
    }
  }
}

// ---- zackgomez (1st edition): player counts + costs
{
  const s = fs.readFileSync(P('zack_cards.js'), 'utf8');
  const re = /\{age: (\d), type: '(\w+)', name: '([^']+)', players: (\d)([^\n]*)\}/g;
  const agg = new Map();
  let m;
  const mapR = { B: 'C', S: 'S', W: 'W', O: 'O', L: 'L', G: 'G', P: 'P' };
  while ((m = re.exec(s))) {
    const k = m[3] + '|' + m[1];
    const rest = m[5];
    const rc = (rest.match(/resource_cost: \[([^\]]*)\]/) || [, ''])[1].replace(/[' ,]/g, '').split('').map(c => mapR[c] || c).join('');
    const mc = Number((rest.match(/money_cost: (\d)/) || [, 0])[1]);
    const vp = Number((rest.match(/vps: (\d)/) || [, 0])[1]);
    const mil = Number((rest.match(/military: (\d)/) || [, 0])[1]);
    const r = agg.get(k) || { name: m[3], age: Number(m[1]), ps: [], coin: mc, res: sortS(rc), vp, sh: mil };
    r.ps.push(Number(m[4]));
    agg.set(k, r);
  }
  const rows = [...agg.values()].map(r => ({ name: r.name, age: r.age, coin: r.coin, res: r.res, counts: counts(r.ps), vp: r.vp, sh: r.sh }));
  const ours = ourRows(1).filter(o => o.color !== 'purple');
  console.log(`\n== zackgomez/7wonders (edition 1): ${rows.length} distinct cards`);
  const tm = new Map(rows.map(r => [norm(r.name) + '|' + r.age, r]));
  for (const o of ours) {
    const t = tm.get(norm(o.name) + '|' + o.age);
    if (!t) { problems++; console.log('  MISSING in zack:', o.name, o.age); continue; }
    cmp('zack', o, t, ['coin', 'res', 'counts', 'vp', 'sh']);
  }
}

// ---- brdgme (1st edition): costs, chains
{
  const s = fs.readFileSync(P('brdgme_card.rs'), 'utf8');
  const blocks = s.split(/\n\s*card\(\s*\n\s*"([A-Z][A-Za-z ]+)",/).slice(1);
  const rows = [];
  const G = { Wood: 'W', Stone: 'S', Ore: 'O', Clay: 'C', Papyrus: 'P', Textile: 'L', Glass: 'G' };
  for (let i = 0; i < blocks.length; i += 2) {
    const name = blocks[i], body = blocks[i + 1];
    const costM = body.match(/^\s*CardKind::\w+,\s*cost\(&\[([^\]]*)\]\)/);
    let coin = 0, res = '';
    if (costM) for (const mm of costM[1].matchAll(/\(Good::(\w+), (\d+)\)/g)) { if (mm[1] === 'Coin') coin = Number(mm[2]); else res += G[mm[1]].repeat(Number(mm[2])); }
    rows.push({ name, coin, res: sortS(res) });
  }
  console.log(`\n== brdgme (edition 1): ${rows.length} cards parsed`);
  const ours = ourRows(1);
  for (const t of rows) {
    const o = ours.find(x => norm(x.name) === norm(t.name));
    if (!o) { console.log('  (not a card of ours):', t.name); continue; }
    cmp('brdgme', o, t, ['coin', 'res']);
  }
}

// ---- IceboxDev (2nd edition)
{
  const m = await import(pathToFileURL(P('icebox_cards.mts')).href);
  const R = { wood: 'W', stone: 'S', clay: 'C', ore: 'O', glass: 'G', loom: 'L', papyrus: 'P' };
  const rows = [...m.CARDS, ...m.GUILDS].map(c => {
    const res = Object.entries((c.cost && c.cost.resources) || {}).map(([k, v]) => R[k].repeat(v)).join('');
    const e = c.effects;
    const pe = e.find(x => x.kind === 'production');
    return { name: c.name, age: c.age, coin: (c.cost && c.cost.coins) || 0, res: sortS(res), counts: c.color === 'purple' ? '' : counts(c.copies),
      from: (c.chainFrom || []).map(norm).sort().join(','), vp: (e.find(x => x.kind === 'points') || {}).amount || 0,
      sh: (e.find(x => x.kind === 'shields') || {}).amount || 0, sci: (e.find(x => x.kind === 'science') || {}).symbol || '',
      prod: pe ? sortS(pe.resources.map(r => R[r]).join('').repeat(pe.count || 1)) : '' };
  });
  report('IceboxDev/BoardGames', 2, rows);
  const ws = fs.readFileSync(P('icebox_wonders.ts'), 'utf8');
  console.log('\n== IceboxDev wonders (edition 2): compare by eye below');
  for (const id of SW.WONDER_IDS) {
    const w = SW.EDITIONS[2].wonders[id];
    console.log(`  ours ${id} res ${w.res} A: ${w.A.map(s => s[0] + JSON.stringify(s[1])).join(' ')} | B: ${w.B.map(s => s[0] + JSON.stringify(s[1])).join(' ')}`);
  }
  void ws;
}

// ---- thascoet (2nd edition): costs + chains
{
  const s = fs.readFileSync(P('thascoet_cards.ts'), 'utf8');
  const blocks = s.split(/\n    \{\n/).slice(1);
  const R = { wood: 'W', stone: 'S', clay: 'C', ore: 'O', glass: 'G', loom: 'L', papyrus: 'P' };
  const rows = [];
  const prov = {}; // token -> provider names
  const raw = blocks.map(b => {
    const g = re => { const mm = b.match(re); return mm ? mm[1] : null; };
    const name = g(/name: "([^"]+)"/);
    const cost = g(/cost: (null|\{[^}]*\})/);
    let coin = 0, res = '';
    if (cost && cost !== 'null') for (const mm of cost.matchAll(/(\w+): (\d+)/g)) { if (mm[1] === 'gold') coin = Number(mm[2]); else res += R[mm[1]].repeat(Number(mm[2])); }
    const chain = g(/chain: (\w+),/);
    const pv = JSON.parse(g(/chainsProvided: (\[[^\]]*\])/) || '[]');
    pv.forEach(t => { (prov[t] = prov[t] || []).push(name); });
    return { name, coin, res: sortS(res), chain };
  });
  for (const r of raw) rows.push({ name: r.name, coin: r.coin, res: r.res, from: r.chain && r.chain !== 'null' ? (prov[r.chain] || []).map(norm).sort().join(',') : '' });
  console.log(`\n== thascoet/7Wonders (edition 2): ${rows.length} cards`);
  const ours = ourRows(2);
  for (const t of rows) {
    const os = ours.filter(x => norm(x.name) === norm(t.name));
    if (!os.length) { problems++; console.log('  not ours:', t.name); continue; }
    for (const o of os) cmp('thascoet', o, t, ['coin', 'res', 'from']);
  }
}
console.log(`\n${problems} differences`);
