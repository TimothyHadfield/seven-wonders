// The shared online module with this game: local rooms (no network). Run: node tests/online.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createLocal } from '../js/online.js';
const require = createRequire(import.meta.url);
const { game, viewFromSnap } = require('../js/online-game.js');

let pass = 0;
const ok = l => { pass++; console.log('  PASS  ' + l); };
const wait = ms => new Promise(r => setTimeout(r, ms));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// 1. all computers: the room plays itself to the end
for (const n of [3, 5, 7]) {
  const room = createLocal({ game, seats: Array(n).fill('computer'), options: { ed: n === 5 ? 2 : 1, level: 'hard' }, botDelayMs: 0, rng: mulberry(n) });
  let last = null, errors = 0;
  room.on('change', s => { last = s; });
  room.on('error', () => errors++);
  room.start();
  for (let i = 0; i < 400 && last.status !== 'finished'; i++) await wait(5);
  assert.equal(last.status, 'finished', n + ' players finished');
  assert.equal(errors, 0);
  assert.equal(last.pub.phase, 'over');
  assert.ok(last.pub.result.winners.length >= 1);
  ok(n + ' computers play a whole local room to the end');
}

// 2. one person + computers: the person always picks the first legal card; snapshot -> view works
{
  const room = createLocal({ game, seats: ['human', 'computer', 'computer', 'computer'], names: ['You'], options: { ed: 1, sides: 'choose', level: 'medium' }, botDelayMs: 0, rng: mulberry(42) });
  let last = null, errors = 0, moves = 0;
  room.on('change', s => { last = s; });
  room.on('error', () => errors++);
  room.start();
  for (let i = 0; i < 2000 && last.status !== 'finished'; i++) {
    if (last.myTurn) {
      const v = viewFromSnap(last);
      assert.equal(v.seat, 0);
      let a;
      if (v.phase === 'side') a = { t: 'side', side: 'B' };
      else if (v.phase === 'discard') a = { t: 'discard', id: (v.discardPile || [])[0] || null };
      else a = { t: 'sell', i: 0 };
      room.act(a); moves++;
    }
    await wait(1);
  }
  assert.equal(last.status, 'finished');
  assert.equal(errors, 0);
  assert.ok(moves >= 18, 'the person made every pick');
  assert.equal(last.pub.players[0].side, 'B');
  ok('a person + 3 computers: side choice, 18 picks, game ends (' + moves + ' moves)');
}

console.log(`\n${pass} passed`);
process.exit(0);
