import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeClassicCard, makeCustomCard, findWin, squaresAway, validateClaim, initialMarks,
  canDaub, FREE, winningLines, parseItems, makeDrawOrder, letterFor, autoMarks, placeItems, itemsNeeded,
} from '../src/bingo/engine.js';

test('5x5 classic card uses column bands and a free centre', () => {
  const card = makeClassicCard(5);
  assert.equal(card.length, 25);
  assert.equal(card[12], FREE);
  for (let i = 0; i < 25; i += 1) {
    if (i === 12) continue;
    const col = i % 5;
    assert.ok(card[i] >= col * 15 + 1 && card[i] <= col * 15 + 15);
  }
  assert.equal(new Set(card).size, 25);
});

test('4x4 card has no free square', () => {
  const card = makeClassicCard(4);
  assert.equal(card.length, 16);
  assert.ok(!card.includes(FREE));
});

test('there are 2n+2 winning lines', () => {
  assert.equal(winningLines(5).length, 12);
  assert.equal(winningLines(3).length, 8);
});

test('a full row wins and squaresAway counts down', () => {
  const marks = new Array(25).fill(false);
  marks[12] = true;
  assert.equal(squaresAway(marks, 5), 4);
  [10, 11, 13].forEach((i) => { marks[i] = true; });
  assert.equal(squaresAway(marks, 5), 1);
  assert.equal(findWin(marks, 5), null);
  marks[14] = true;
  assert.deepEqual(findWin(marks, 5), [10, 11, 12, 13, 14]);
});

test('claims with uncalled daubs are rejected', () => {
  const cells = [1, 2, 3, 4, FREE, 6, 7, 8, 9];
  const marks = [true, true, true, false, true, false, false, false, false];
  assert.equal(validateClaim(cells, marks, 3, [1, 2]), null);
  assert.deepEqual(validateClaim(cells, marks, 3, [1, 2, 3]), [0, 1, 2]);
});

test('canDaub only allows called values', () => {
  const cells = ['Cake', FREE];
  assert.equal(canDaub(cells, 0, ['cake']), true);
  assert.equal(canDaub(cells, 0, ['pie']), false);
  assert.equal(canDaub(cells, 1, []), true);
});

test('custom cards draw unique items', () => {
  const items = parseItems('a\nb\nc\nd\ne\nf\ng\nh\ni\na');
  assert.equal(items.length, 9);
  const card = makeCustomCard(items, 3);
  assert.equal(card[4], FREE);
  assert.equal(new Set(card).size, 9);
  assert.equal(itemsNeeded(4), 16);
  assert.equal(placeItems(['x'], 3)[4], FREE);
});

test('draw order covers every number once', () => {
  const order = makeDrawOrder('classic', 5, []);
  assert.equal(order.length, 75);
  assert.equal(new Set(order).size, 75);
  assert.equal(letterFor(16, 5), 'I');
  assert.equal(letterFor(75, 5), 'O');
});

test('autoMarks daubs everything called', () => {
  const cells = [1, 2, 3, 4, FREE, 6, 7, 8, 9];
  assert.deepEqual(autoMarks(cells, [1, 9]), [true, false, false, false, true, false, false, false, true]);
});
