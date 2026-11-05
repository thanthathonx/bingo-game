import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeRoom, decodeRoom, normalizeCode, randomSeed } from '../src/bingo/roomCode.js';
import { newRound } from '../src/bingo/gameState.js';
import { presetText } from '../src/bingo/presets.js';

const settings = {
  mode: 'custom', size: 4, autoCall: false, speed: 'fast', interactiveDaub: true, skill: 'speedy',
  presetId: 'movie', itemsText: presetText('movie'),
};

test('a code carries settings and seed both ways', () => {
  const code = encodeRoom(settings, 123456);
  assert.match(code, /^[A-Z2-9]{6}$/);
  const back = decodeRoom(code);
  assert.equal(back.seed, 123456);
  assert.deepEqual(back.settings, {
    mode: 'custom', size: 4, autoCall: false, speed: 'fast', interactiveDaub: true, skill: 'speedy', presetId: 'movie',
  });
  assert.equal(back.customItems, false);
});

test('typed codes are tidied and bad codes rejected', () => {
  const code = encodeRoom(settings, 42);
  assert.deepEqual(decodeRoom(` ${code.toLowerCase().slice(0, 3)}-${code.slice(3)} `), decodeRoom(code));
  assert.equal(normalizeCode('ab-c d1'), 'ABCD1');
  assert.equal(decodeRoom('ABC'), null);
  assert.equal(decodeRoom('ZZZZZZ'), null); // out-of-range settings
});

test('own item lists are flagged as custom', () => {
  const back = decodeRoom(encodeRoom({ ...settings, presetId: null }, 7));
  assert.equal(back.customItems, true);
});

test('two devices with the same code get the same calls in the same order', () => {
  const seed = randomSeed();
  const classic = { ...settings, mode: 'classic', size: 5 };
  const host = newRound({ hostName: 'Ann', bigScreen: false, buddies: [], settings: classic, seed, roundNo: 0 });
  const joined = decodeRoom(encodeRoom(classic, seed));
  const friend = newRound({ hostName: 'Ben', bigScreen: false, buddies: [], settings: { ...classic, ...joined.settings }, seed: joined.seed, roundNo: 0 });
  assert.deepEqual(friend.order, host.order);
  assert.notDeepEqual(friend.players[0].cells, host.players[0].cells); // each player still gets their own card
  const next = newRound({ hostName: 'Ann', bigScreen: false, buddies: [], settings: classic, seed, roundNo: 1 });
  assert.notDeepEqual(next.order, host.order); // a new round reshuffles, the same way on both devices
});
