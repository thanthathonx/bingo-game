import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reducer, newRound, YOU, settingsProblem } from '../src/bingo/gameState.js';
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
  assert.equal(g.phase, 'finished');
  assert.equal(g.winner.id, YOU);
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
