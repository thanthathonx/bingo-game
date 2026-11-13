import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reducer, newRound, YOU, settingsProblem, continueRound, keepsCard, CLAIM_WINDOW_MS, MAX_WINNERS, ROUNDS_PER_GAME, SHAPE_POOL, patternForStage, nextStage,
} from '../src/bingo/gameState.js';
import { FREE, cellIndexOf, findWin, winningLines } from '../src/bingo/engine.js';

const baseSettings = {
  mode: 'classic', size: 5, autoCall: true, speed: 'normal', interactiveDaub: true, skill: 'normal',
  presetId: null, itemsText: Array.from({ length: 30 }, (_, i) => `item ${i}`).join('\n'),
};
const room = (patch = {}) => ({
  hostName: 'Ann', bigScreen: false, buddies: [{ id: 'b1', name: 'Mochi', color: '#fff' }], settings: { ...baseSettings, ...patch },
});

test('classic round starts in playing phase with you and buddies', () => {
  const g = newRound(room());
  assert.equal(g.phase, 'playing');
  assert.equal(g.players.length, 2);
  assert.equal(g.players[0].id, YOU);
  assert.equal(g.order.length, 75);
});

test('calling, daubing and a valid bingo finishes the round', () => {
  let g = newRound(room());
  const me = g.players[0];
  const line = winningLines(5)[0];
  for (const i of line) {
    if (me.cells[i] === FREE) continue;
    g = reducer(g, { type: 'CALL', value: me.cells[i] });
  }
  // daubing an uncalled square gives a notice
  const uncalled = me.cells.findIndex((v, i) => v !== FREE && !line.includes(i) && !g.called.includes(v));
  g = reducer(g, { type: 'DAUB', index: uncalled, now: 1 });
  assert.equal(g.notice.kind, 'notCalled');
  // false bingo before daubing locks the button
  g = reducer(g, { type: 'CLAIM', id: YOU, now: 1000 });
  assert.equal(g.phase, 'playing');
  assert.ok(g.lockedUntil > 1000);
  for (const i of line) g = reducer(g, { type: 'DAUB', index: i, now: 2 });
  g = reducer(g, { type: 'CLAIM', id: YOU, now: 500 }); // still locked
  assert.equal(g.phase, 'playing');
  g = reducer(g, { type: 'CLAIM', id: YOU, now: 99999 });
  // a good BINGO opens the claim window; the round ends when it closes
  assert.equal(g.phase, 'playing');
  assert.equal(g.winners[0].id, YOU);
  assert.equal(g.claimUntil, 99999 + CLAIM_WINDOW_MS);
  assert.equal(reducer(g, { type: 'CALL', value: g.order[0] }), g); // no calls during the window
  g = reducer(g, { type: 'CLOSE_WINDOW' });
  assert.equal(g.phase, 'finished');
  assert.equal(g.winner.id, YOU);
});

test('a third winner ends the round at once; repeats are ignored', () => {
  let g = newRound(room());
  g = { ...g, players: [0, 1, 2, 3].map((n) => ({ ...g.players[0], id: `p${n}`, marks: g.players[0].cells.map(() => true) })) };
  g = { ...g, called: [...g.players[0].cells] };
  g = reducer(g, { type: 'CLAIM', id: 'p0', now: 10 });
  g = reducer(g, { type: 'CLAIM', id: 'p0', now: 11 });
  assert.equal(g.winners.length, 1);
  g = reducer(g, { type: 'CLAIM', id: 'p1', now: 12 });
  assert.equal(g.claimUntil, 10 + CLAIM_WINDOW_MS); // the window does not restart
  g = reducer(g, { type: 'CLAIM', id: 'p2', now: 13 });
  assert.equal(g.phase, 'finished');
  assert.deepEqual(g.winners.map((w) => w.id), ['p0', 'p1', 'p2']);
  assert.equal(MAX_WINNERS, 3);
  assert.equal(reducer(g, { type: 'CLAIM', id: 'p3', now: 14 }).winners.length, 3);
});

test('three rounds: any line, a random shape, then blackout', () => {
  assert.equal(ROUNDS_PER_GAME, 3);
  assert.equal(patternForStage(1), 'line');
  assert.equal(patternForStage(3), 'blackout');
  assert.equal(patternForStage(2, () => 0), SHAPE_POOL[0]);
  assert.equal(patternForStage(2, () => 0.999), SHAPE_POOL[SHAPE_POOL.length - 1]);
  assert.deepEqual(SHAPE_POOL, ['square', 'heart', 'smile', 'checker', 'candle']);
  assert.equal(nextStage([]), 1);
  assert.equal(nextStage([{}]), 2);
  assert.equal(nextStage([{}, {}]), 3);
  assert.equal(nextStage([{}, {}, {}]), 1);
});

test('bots win when their marks form a line', () => {
  let g = newRound(room());
  const bot = g.players[1];
  for (const i of winningLines(5)[5]) {
    if (bot.cells[i] === FREE) continue;
    g = reducer(g, { type: 'CALL', value: bot.cells[i] });
    g = reducer(g, { type: 'BOT_MARK', id: 'b1', index: cellIndexOf(bot.cells, bot.cells[i]) });
  }
  assert.ok(findWin(g.players[1].marks, 5));
  g = reducer(g, { type: 'CLAIM', id: 'b1', now: 1 });
  assert.equal(g.winner.id, 'b1');
});

test('auto-daub marks your card on every call', () => {
  let g = newRound(room({ interactiveDaub: false }));
  const v = g.players[0].cells[0];
  g = reducer(g, { type: 'CALL', value: v });
  assert.equal(g.players[0].marks[0], true);
});

test('event cards: build phase, fill, ready, then manual item calls', () => {
  let g = newRound(room({ mode: 'custom', size: 3 }));
  assert.equal(g.phase, 'build');
  g = reducer(g, { type: 'PLACE_ITEM', item: 'item 3' });
  assert.equal(g.players[0].cells[0], 'item 3');
  g = reducer(g, { type: 'PLACE_ITEM', item: 'item 3' }); // no duplicates
  assert.equal(g.players[0].cells.filter((c) => c === 'item 3').length, 1);
  g = reducer(g, { type: 'READY' }); // not full yet
  assert.equal(g.phase, 'build');
  g = reducer(g, { type: 'FILL_CARD' });
  g = reducer(g, { type: 'READY' });
  assert.equal(g.phase, 'playing');
  g = reducer(g, { type: 'CALL', value: 'item 3' });
  assert.deepEqual(g.called, ['item 3']);
  assert.ok(!g.order.includes('item 3'));
});

test('big screen mode has no card for the host', () => {
  const g = newRound({ ...room({ mode: 'custom' }), bigScreen: true });
  assert.equal(g.phase, 'playing');
  assert.ok(g.players.every((p) => p.isBot));
});

test('custom mode needs enough items', () => {
  assert.deepEqual(settingsProblem({ ...baseSettings, mode: 'custom', itemsText: 'a\nb' }), { need: 25, have: 2 });
  assert.equal(settingsProblem(baseSettings), null);
});

test('rounds 2 and 3 keep the cards, the daubs and the calls of the round before', () => {
  let g = newRound(room());
  for (let i = 0; i < 10; i += 1) g = reducer(g, { type: 'CALL' });
  const me = g.players[0];
  const i0 = me.cells.findIndex((v) => g.called.includes(v));
  if (i0 >= 0) g = reducer(g, { type: 'DAUB', index: i0, now: 1 });
  const fresh = newRound(room({ pattern: 'heart' }));
  const next = continueRound(fresh, g);
  assert.equal(next.settings.pattern, 'heart');
  assert.deepEqual(next.called, g.called);
  assert.deepEqual(next.players[0].cells, me.cells);
  assert.deepEqual(next.players[0].marks, g.players[0].marks);
  assert.deepEqual(next.players[1].cells, g.players[1].cells);
  assert.equal(next.phase, 'playing');
  assert.deepEqual(next.winners, []);
  const more = reducer(next, { type: 'CALL' });
  assert.equal(more.called.length, 11);
  assert.ok(!g.called.includes(more.called[10])); // nothing is called twice
  assert.equal(continueRound(fresh, null), fresh);
  assert.equal(continueRound(newRound(room({ size: 3 })), g).called.length, 0); // other card size: fresh
});

test('a good BINGO from you is remembered, so a late one can be told apart', () => {
  let g = newRound(room());
  assert.equal(g.youClaimed, false);
  g = { ...g, called: [...g.players[0].cells], players: g.players.map((p, i) => (i === 0 ? { ...p, marks: p.cells.map(() => true) } : p)) };
  const pending = reducer(g, { type: 'CLAIM', id: YOU, now: 5, deferWin: true });
  assert.equal(pending.youClaimed, true);
  const over = reducer(pending, { type: 'FINISH', winners: [{ id: 'x1', line: [0] }, { id: 'x2', line: [0] }, { id: 'x3', line: [0] }], players: [] });
  assert.equal(over.youClaimed, true);
  assert.ok(!over.winners.some((w) => w.id === YOU));
});

test('rounds keep the same card unless the host picked a new card each round', () => {
  assert.equal(keepsCard({}), true);
  assert.equal(keepsCard({ newCardEachRound: false }), true);
  assert.equal(keepsCard({ newCardEachRound: true }), false);
  assert.equal(keepsCard(undefined), true);
});
