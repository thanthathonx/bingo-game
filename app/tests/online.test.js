import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MSG, makeOnlineCode, isOnlineCode, presencePlayers, readPlayer, wirePlayer, readCalls, readWinner,
  readRoom, wireRoom, trustMessage, readProgress, marksToBits, bitsToMarks, topCards, PHONE_BOARD_SIZE, leaderboard, wireState, readState, MAX_ROOM_PLAYERS, readFinish,
} from '../src/online/protocol.js';
import { progressOf, finishMessage, boardEntries } from '../src/online/useOnlineGame.js';
import { reducer, newRound, YOU } from '../src/bingo/gameState.js';
import { FREE } from '../src/bingo/engine.js';
import { seededRng } from '../src/bingo/roomCode.js';

const SETTINGS = {
  mode: 'classic', size: 3, autoCall: false, speed: 'normal', interactiveDaub: true,
  skill: 'normal', presetId: 'party', itemsText: 'a\nb',
};
const ME = 'p-me';
const card3 = () => ({
  id: 'p-friend', name: 'Ana', color: '#55efc4', isBot: false, ready: true,
  cells: [1, 11, 21, 2, FREE, 22, 3, 13, 23],
  marks: [false, false, false, false, true, false, false, false, false],
});
const hostRound = () => newRound({ hostName: 'Host', bigScreen: false, buddies: [], settings: SETTINGS, seed: 42, roundNo: 0 }, seededRng(1));

// ----- codes, presence, cards -----

test('online codes use the safe alphabet and are recognised', () => {
  const code = makeOnlineCode(seededRng(7));
  assert.equal(code.length, 6);
  assert.ok(isOnlineCode(code));
  assert.equal(isOnlineCode('ABC10O'), false);
  assert.equal(isOnlineCode('ABCDE'), false);
});

test('presence lists the host first and drops entries without an id', () => {
  const players = presencePlayers({ a: [{ id: 'p-b', joinedAt: 5 }], b: [{ id: 'p-h', isHost: true, joinedAt: 9 }], c: [{ name: 'x' }] });
  assert.deepEqual(players.map((p) => p.id), ['p-h', 'p-b']);
});

test('a card from the network is accepted only when it fits the round, and never as our own', () => {
  assert.equal(readPlayer(card3(), 3, ME).isRemote, true);
  assert.equal(readPlayer({ ...card3(), cells: [1, 2] }, 3, ME), null);
  assert.equal(readPlayer({ ...card3(), marks: card3().marks.map(() => 'yes') }, 3, ME), null);
  assert.equal(readPlayer({ ...card3(), color: 'red;}' }, 3, ME).color, '#a29bfe');
  assert.equal(readPlayer({ ...card3(), id: ME }, 3, ME), null);
  assert.equal(readPlayer(wirePlayer({ ...card3(), id: YOU }, ME), 3, 'p-other').id, ME);
});

test('called lists must be numbers or short strings', () => {
  assert.deepEqual(readCalls([4, 'Cake']), [4, 'Cake']);
  assert.equal(readCalls([{}]), null);
  assert.equal(readCalls('1,2'), null);
});

test('a winner names a full line of valid squares', () => {
  assert.equal(readWinner({ id: 'p-friend', line: [0, 1, 2], player: card3() }, 3, ME).winner.id, 'p-friend');
  assert.equal(readWinner({ id: 'p-friend', line: [0, 1] }, 3, ME), null);
  assert.equal(readWinner({ id: ME, line: [3, 4, 5] }, 3, ME).winner.id, YOU);
  assert.deepEqual(readWinner({ id: null }, 3, ME).winner, { id: null, line: [] });
});

// ----- who may say what -----

test('guests act only on room messages from the pinned host', () => {
  const ctx = { isHost: false, hostId: 'p-host', rosterIds: new Set() };
  assert.equal(trustMessage({ type: MSG.STATE, from: 'p-host' }, ctx), true);
  assert.equal(trustMessage({ type: MSG.CLOSED, from: 'p-a' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.CLAIM, from: 'p-host' }, ctx), false); // inbox messages are not for guests
  const fresh = { isHost: false, hostId: null, rosterIds: new Set() };
  assert.equal(trustMessage({ type: MSG.ROOM, from: 'p-host' }, fresh), true);
  assert.equal(trustMessage({ type: MSG.START, from: 'p-host' }, fresh), false);
});

test('the host acts only on inbox messages; claims need a roster member with their own card', () => {
  const ctx = { isHost: true, hostId: 'p-host', rosterIds: new Set(['p-a']) };
  assert.equal(trustMessage({ type: MSG.HELLO, from: 'p-new' }, ctx), true);
  assert.equal(trustMessage({ type: MSG.STATE, from: 'p-a' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.PROGRESS, from: 'p-x' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.CLAIM, from: 'p-a', player: { id: 'p-b' } }, ctx), false);
  assert.equal(trustMessage({ type: MSG.CLAIM, from: 'p-a', player: { id: 'p-a' } }, ctx), true);
  assert.equal(trustMessage({ type: MSG.HELLO }, ctx), false);
});

// ----- big rooms: progress, leaderboard, state, roster -----

test('progress reports are checked against the card size', () => {
  assert.deepEqual(readProgress({ round: 2, away: 1, daubs: 3, ready: true }, 3), { round: 2, away: 1, daubs: 3, ready: true, card: null });
  assert.equal(readProgress({ round: 2, away: 12, daubs: 3 }, 3), null);
  assert.equal(readProgress({ away: 1, daubs: 3 }, 3), null);
});

test('the leaderboard puts the closest players first and keeps only the top 10', () => {
  const entries = Array.from({ length: 200 }, (_, i) => ({ id: `p-${i}`, name: `P${i}`, away: (i % 5) + 1, daubs: i % 7 }));
  entries.push({ id: 'p-win', name: 'Winner', away: 0, daubs: 4 });
  const top = leaderboard(entries);
  assert.equal(top.length, 10);
  assert.equal(top[0].id, 'p-win');
  assert.ok(top.every((e, i) => i === 0 || top[i - 1].away <= e.away));
});

test('a 200-player game state stays small and round-trips', () => {
  const entries = Array.from({ length: 200 }, (_, i) => ({ id: `p-${i}`, name: `Player ${i}`, away: 3, daubs: 2 }));
  const wire = wireState({ round: 4, called: [1, 2, 3, 4, 5], paused: false, board: leaderboard(entries, PHONE_BOARD_SIZE), count: 201, finish: null });
  assert.ok(JSON.stringify(wire).length < 1000);
  const back = readState(wire, 3, 'p-3');
  assert.equal(back.board.length, 5); // phones show the 5 closest players
  // a longer list from an older host is cut to 5 too
  assert.equal(readState(wireState({ round: 4, called: [], board: leaderboard(entries), count: 201 }), 3, 'p-3').board.length, 5);
  assert.equal(back.count, 201);
  assert.equal(readState({ ...wire, called: 'x' }, 3, ME), null);
});

test('the lobby carries a roster of 200 players and rejects unknown settings', () => {
  const room = { hostName: 'Host', bigScreen: false, settings: SETTINGS, buddies: [], wins: { [YOU]: 2, 'p-7': 1 } };
  const players = [{ id: 'p-host', name: 'Host', isHost: true }, ...Array.from({ length: 200 }, (_, i) => ({ id: `p-${i}`, name: `P${i}` }))];
  const wire = wireRoom(room, 'p-host', players);
  assert.ok(JSON.stringify(wire).length < 16000);
  const back = readRoom(wire, 'p-7');
  assert.equal(back.players.length, 201);
  assert.equal(back.wins['p-host'], 2);
  assert.equal(back.wins[YOU], 1);
  assert.equal(readRoom({ ...wire, settings: { ...SETTINGS, size: 9 } }, ME), null);
  const huge = { ...wire, players: Array.from({ length: 999 }, (_, i) => ({ id: `p-${i}`, name: 'x' })) };
  assert.equal(readRoom(huge, ME).players.length, MAX_ROOM_PLAYERS + 1);
});

test('the host builds the board from its own players and the guests\' reports for this round', () => {
  const room = { hostName: 'Host', bigScreen: false, buddies: [{ id: 'bot-1', name: 'Mochi', color: '#ffd166' }], settings: SETTINGS, seed: 3, roundNo: 0, online: { isHost: true } };
  const game = newRound(room, seededRng(2));
  const roster = new Map([
    ['p-a', { id: 'p-a', name: 'Ann', progress: { round: 0, away: 1, daubs: 4, ready: true } }],
    ['p-b', { id: 'p-b', name: 'Bo', progress: { round: 9, away: 0, daubs: 9, ready: true } }], // old round: ignored
  ]);
  const { entries, count } = boardEntries(game, 0, roster, 'p-host');
  assert.deepEqual(entries.map((e) => e.id).sort(), ['bot-1', 'p-a', 'p-host']);
  assert.equal(count, 3); // host + buddy + Ann; Bo is not in this round
  assert.deepEqual(progressOf({ cells: [1, FREE, 3, 4], marks: [true, true, false, false] }, 2), { away: 0, daubs: 1, ready: true });
});

test('the finish message names the winner by wire id with their card', () => {
  const game = { ...hostRound(), phase: 'finished', winners: [{ id: YOU, line: [0, 1, 2] }] };
  const msg = finishMessage(game, 'p-host');
  assert.equal(msg.winners.length, 1);
  assert.equal(msg.winners[0].id, 'p-host');
  assert.equal(msg.winners[0].player.id, 'p-host');
  assert.equal(msg.aborted, false);
  assert.deepEqual(finishMessage({ ...game, winners: [] }, 'p-host').winners, []);
});

// ----- reducer: online actions -----

test('guests apply the host\'s calls once, in order', () => {
  const state = reducer(hostRound(), { type: 'SYNC_CALLS', called: [5, 7] });
  const again = reducer(state, { type: 'SYNC_CALLS', called: [5, 7, 9] });
  assert.deepEqual(again.called, [5, 7, 9]);
  assert.equal(again.order.length, 30 - 3); // a 3×3 classic game draws from 1-30
});

test('the host accepts a claim only when the line was really called, even from a first-time claimant', () => {
  let state = reducer(hostRound(), { type: 'SYNC_CALLS', called: [1, 11] });
  const friend = { ...readPlayer(card3(), 3, ME), marks: [true, true, true, false, true, false, false, false, false] };
  assert.equal(reducer(state, { type: 'REMOTE_CLAIM', player: friend }).phase, 'playing'); // 21 not called yet
  state = reducer(state, { type: 'SYNC_CALLS', called: [1, 11, 21] });
  const open = reducer(state, { type: 'REMOTE_CLAIM', player: friend, now: 100 });
  assert.equal(open.phase, 'playing'); // the claim window is open for others
  assert.equal(open.winners.length, 1);
  assert.ok(open.claimUntil > 100);
  const done = reducer(open, { type: 'CLOSE_WINDOW' });
  assert.equal(done.phase, 'finished');
  assert.deepEqual(done.winner, { id: 'p-friend', line: [0, 1, 2] });
});

test('the network cannot replace the host\'s own buddies', () => {
  const room = { hostName: 'Host', bigScreen: false, buddies: [{ id: 'bot-1', name: 'Mochi', color: '#ffd166' }], settings: SETTINGS, seed: 3, roundNo: 0, online: { isHost: true } };
  const state = newRound(room, seededRng(2));
  const fake = readPlayer({ ...card3(), id: 'bot-1' }, 3, ME);
  assert.equal(reducer(state, { type: 'UPSERT_PLAYER', player: fake }).players.find((p) => p.id === 'bot-1').isRemote, undefined);
  assert.equal(reducer(state, { type: 'REMOTE_CLAIM', player: fake }), state);
});

test('a guest\'s good claim waits for the host; the host\'s result is final', () => {
  let state = hostRound();
  const me = state.players.find((p) => p.id === YOU);
  state = reducer(state, { type: 'SYNC_CALLS', called: me.cells.filter((c) => c !== FREE) });
  state = { ...state, players: state.players.map((p) => (p.id === YOU ? { ...p, marks: p.marks.map(() => true) } : p)) };
  const pending = reducer(state, { type: 'CLAIM', id: YOU, now: 0, deferWin: true });
  assert.equal(pending.phase, 'playing');
  assert.equal(pending.claimPending, true);
  assert.equal(reducer(pending, { type: 'CLEAR_PENDING' }).claimPending, false);
  const over = reducer(pending, { type: 'FINISH', winners: [{ id: YOU, line: [0, 1, 2] }], players: [] });
  assert.equal(over.winner.id, YOU);
  assert.equal(reducer(over, { type: 'FINISH', winners: [], players: [] }).winner.id, YOU);
});

test('a guest never ends the round on its own when the balls run out', () => {
  const guest = newRound({ hostName: 'Host', selfName: 'Ann', bigScreen: false, buddies: [], settings: SETTINGS, seed: 5, roundNo: 0, online: { isHost: false } }, seededRng(4));
  assert.equal(guest.referee, false);
  const out = reducer(guest, { type: 'SYNC_CALLS', called: Array.from({ length: 30 }, (_, i) => i + 1) });
  assert.equal(out.phase, 'playing');
  const fixed = reducer({ ...out, phase: 'finished', winner: { id: null, line: [] } }, { type: 'FINISH', winners: [{ id: 'p-friend', line: [0, 1, 2] }], players: [readPlayer(card3(), 3, ME)] });
  assert.equal(fixed.winner.id, 'p-friend');
  assert.equal(fixed.winners.length, 1);
});

// ----- Resume after a reload -----
import { readSession, SESSION_MAX_AGE_MS, hostRoomSnapshot } from '../src/online/session.js';
import { withCard } from '../src/bingo/gameState.js';

test('a saved guest session comes back with its card; bad or old ones are ignored', () => {
  const now = 1_000_000_000;
  const card = { cells: [1, 11, 21, 2, FREE, 22, 3, 13, 23], marks: [true, false, false, false, true, false, false, false, false], ready: true };
  const good = readSession({ role: 'guest', code: 'ABC234', name: ' Ann ', round: 2, seed: 77, card, savedAt: now - 1000 }, now);
  assert.equal(good.name, 'Ann');
  assert.deepEqual(good.resume, { round: 2, seed: 77, card });
  assert.equal(readSession({ role: 'guest', code: 'ABC234', name: 'Ann', savedAt: now - SESSION_MAX_AGE_MS - 1 }, now), null);
  assert.equal(readSession({ role: 'guest', code: 'abc!!', name: 'Ann', savedAt: now }, now), null);
  assert.equal(readSession({ role: 'guest', code: 'ABC234', name: '', savedAt: now }, now), null);
  assert.equal(readSession({ role: 'guest', code: 'ABC234', name: 'Ann', card: { cells: [1], marks: ['x'] }, round: 1, seed: 1, savedAt: now }, now).resume, null);
  assert.equal(readSession({ role: 'boss', code: 'ABC234', name: 'Ann', savedAt: now }, now), null);
});

test('a saved host session keeps the room, and the game only when it looks like one', () => {
  const now = 5_000;
  const room = { settings: SETTINGS, hostName: 'Host', wins: {}, inGame: true, roundNo: 1 };
  const game = hostRound();
  assert.ok(readSession({ role: 'host', code: 'ABC234', name: 'Host', room, game, savedAt: now }, now).game);
  assert.equal(readSession({ role: 'host', code: 'ABC234', name: 'Host', room, game: { phase: 'nope' }, savedAt: now }, now).game, null);
  assert.deepEqual(Object.keys(hostRoomSnapshot({ ...room, online: {}, connecting: false, players: [] })).sort(), Object.keys(room).sort());
});

test('a saved card goes back on "you", and only if it fits the round', () => {
  const state = hostRound();
  const card = { cells: [1, 11, 21, 2, FREE, 22, 3, 13, 23], marks: [true, true, false, false, true, false, false, false, false], ready: true };
  const me = withCard(state, card).players.find((p) => p.id === YOU);
  assert.deepEqual(me.cells, card.cells);
  assert.deepEqual(me.marks, card.marks);
  assert.equal(withCard(state, { cells: [1, 2], marks: [true, false] }), state);
  const building = { ...state, phase: 'build' };
  assert.equal(withCard(building, card).phase, 'playing');
  assert.equal(withCard(building, { ...card, ready: false }).phase, 'build');
});
test('renaming changes your name in the running round, and ignores empty names', () => {
  const state = hostRound();
  const renamed = reducer(state, { type: 'RENAME', name: '  Nong May  ' });
  assert.equal(renamed.players.find((p) => p.id === YOU).name, 'Nong May');
  assert.equal(reducer(state, { type: 'RENAME', name: '   ' }), state);
});
test('the lobby says when the host has no room left, so an extra guest can be told', () => {
  const room = { hostName: 'Host', bigScreen: false, settings: SETTINGS, buddies: [], wins: {} };
  assert.equal(readRoom(wireRoom(room, 'p-host', [], true), ME).full, true);
  assert.equal(readRoom(wireRoom(room, 'p-host', []), ME).full, false);
  assert.ok(MAX_ROOM_PLAYERS > 350); // above the Realtime connection cap, so that limit comes first
});
// ----- Win patterns -----
import { findWin, squaresAway as away5, patternOf, winTargets, validateClaim as validate5 } from '../src/bingo/engine.js';

test('square and heart are exact shapes on a 5x5 card; other sizes always use lines', () => {
  const marks = (cells) => Array.from({ length: 25 }, (_, i) => cells.includes(i));
  const heart = [0, 1, 3, 4, 5, 7, 9, 10, 14, 16, 18, 22];
  const square = [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24];
  assert.deepEqual(findWin(marks(heart), 5, 'heart'), heart);
  assert.equal(findWin(marks(heart.slice(1)), 5, 'heart'), null);
  assert.equal(away5(marks(heart.slice(2)), 5, 'heart'), 2);
  assert.deepEqual(findWin(marks(square), 5, 'square'), square);
  assert.equal(findWin(marks([10, 11, 12, 13, 14]), 5, 'square'), null); // a row is not a square
  assert.ok(findWin(marks([10, 11, 12, 13, 14]), 5, 'line'));
  assert.equal(patternOf({ size: 5, pattern: 'heart' }), 'heart');
  assert.equal(patternOf({ size: 4, pattern: 'heart' }), 'line');
  assert.equal(patternOf({ size: 5, pattern: 'nope' }), 'line');
  assert.equal(winTargets(3, 'heart').length, 8); // falls back to the 8 lines of a 3x3
});

test('a heart claim must have every heart square called', () => {
  const cells = Array.from({ length: 25 }, (_, i) => (i === 12 ? FREE : i + 1));
  const heart = [0, 1, 3, 4, 5, 7, 9, 10, 14, 16, 18, 22];
  const marks = cells.map((_, i) => heart.includes(i) || i === 12);
  const calledAll = heart.map((i) => cells[i]);
  assert.ok(validate5(cells, marks, 5, calledAll, 'heart'));
  assert.equal(validate5(cells, marks, 5, calledAll.slice(1), 'heart'), null);
});

test('the pattern travels in the lobby message; a heart win announcement is accepted', () => {
  const room = { hostName: 'Host', bigScreen: false, settings: { ...SETTINGS, size: 5, pattern: 'heart' }, buddies: [], wins: {} };
  assert.equal(readRoom(wireRoom(room, 'p-host', []), ME).settings.pattern, 'heart');
  assert.equal(readRoom(wireRoom({ ...room, settings: { ...room.settings, pattern: 'star' } }, 'p-host', []), ME), null);
  const heart = [0, 1, 3, 4, 5, 7, 9, 10, 14, 16, 18, 22];
  assert.deepEqual(readWinner({ id: 'p-friend', line: heart, player: null }, 5, ME).winner.line, heart);
});
test('smiley and checkerboard shapes', () => {
  const marks = (cells) => Array.from({ length: 25 }, (_, i) => cells.includes(i));
  const smile = [1, 3, 10, 12, 14, 15, 19, 21, 22, 23];
  const checker = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  assert.deepEqual(findWin(marks(smile), 5, 'smile'), smile);
  assert.equal(away5(marks(smile.slice(1)), 5, 'smile'), 1);
  assert.deepEqual(findWin(marks(checker), 5, 'checker'), checker);
  assert.equal(findWin(marks(checker.filter((i) => i !== 12)), 5, 'checker'), null);
  assert.equal(patternOf({ size: 5, pattern: 'checker' }), 'checker');
});
test('candlestick and christmas tree shapes', () => {
  const marks = (cells) => Array.from({ length: 25 }, (_, i) => cells.includes(i));
  const candle = [0, 2, 4, 5, 7, 9, 10, 11, 12, 13, 14, 17, 22];
  const tree = [2, 6, 7, 8, 11, 12, 13, 15, 16, 17, 18, 19, 22];
  assert.deepEqual(findWin(marks(candle), 5, 'candle'), candle);
  assert.deepEqual(findWin(marks(tree), 5, 'tree'), tree);
  assert.equal(findWin(marks(tree.filter((i) => i !== 12)), 5, 'tree'), null); // the centre counts now
  assert.equal(away5(marks(candle.slice(3)), 5, 'candle'), 3);
});
test('blackout needs every square, on any card size', () => {
  for (const size of [3, 4, 5]) {
    const n = size * size;
    const all = Array.from({ length: n }, () => true);
    assert.equal(findWin(all, size, 'blackout').length, n);
    assert.equal(findWin(all.map((m, i) => i !== n - 1), size, 'blackout'), null);
    assert.equal(away5(all.map((m, i) => i >= 2), size, 'blackout'), 2);
    assert.equal(patternOf({ size, pattern: 'blackout' }), 'blackout');
  }
  assert.equal(patternOf({ size: 3, pattern: 'heart' }), 'line'); // shapes still 5x5 only
});
// ----- Three-round games: winners, claim window, history -----

test('the host\'s finish message reads back with every winner, and junk is refused', () => {
  const game = { ...hostRound(), phase: 'finished', winners: [{ id: YOU, line: [0, 1, 2] }] };
  const wire = JSON.parse(JSON.stringify(finishMessage(game, 'p-host')));
  const read = readFinish(wire, 3, ME);
  assert.equal(read.winners.length, 1);
  assert.equal(read.winners[0].id, 'p-host');
  assert.equal(read.aborted, false);
  assert.deepEqual(readFinish({ winners: [], aborted: true }, 3, ME), { winners: [], players: [], aborted: true });
  assert.equal(readFinish({ winners: [wire.winners[0], wire.winners[0], wire.winners[0], wire.winners[0]] }, 3, ME), null); // more than 3
  assert.equal(readFinish({ winners: 'x' }, 3, ME), null);
});

test('the claim countdown is passed on only when it makes sense', () => {
  const base = { round: 1, called: [1, 2], paused: false, board: [], count: 2 };
  assert.deepEqual(readState(wireState({ ...base, claim: { leftMs: 8000, count: 2 } }), 3, ME).claim, { leftMs: 8000, count: 2 });
  assert.equal(readState(wireState({ ...base, claim: { leftMs: 999999, count: 1 } }), 3, ME).claim, null);
  assert.equal(readState(wireState({ ...base, claim: { leftMs: 5000, count: 7 } }), 3, ME).claim, null);
  assert.equal(readState(wireState(base), 3, ME).claim, null);
});

test('the lobby carries the game stage and the rounds already played', () => {
  const room = {
    hostName: 'Host', bigScreen: false, settings: { ...SETTINGS, pattern: 'line' }, buddies: [], wins: {}, roundNo: 2,
    stage: 2, history: [{ stage: 1, pattern: 'line', winners: [{ id: YOU, name: 'Host' }, { id: 'p-friend', name: 'Ana' }] }],
  };
  const read = readRoom(JSON.parse(JSON.stringify(wireRoom(room, 'p-host', []))), ME);
  assert.equal(read.stage, 2);
  assert.equal(read.history.length, 1);
  assert.deepEqual(read.history[0].winners.map((w) => w.id), ['p-host', 'p-friend']);
  const bad = readRoom({ ...wireRoom(room, 'p-host', []), stage: 9, history: [{ stage: 1, pattern: 'nope', winners: [] }] }, ME);
  assert.equal(bad.stage, 1);
  assert.deepEqual(bad.history, []);
});

test('the "new card each round" choice travels in the lobby message; an older host without it still works', () => {
  const room = { hostName: 'Host', bigScreen: false, settings: { ...SETTINGS, newCardEachRound: true }, buddies: [], wins: {} };
  assert.equal(readRoom(wireRoom(room, 'p-host', []), ME).settings.newCardEachRound, true);
  const older = { ...room, settings: { ...SETTINGS } };
  assert.equal(readRoom(wireRoom(older, 'p-host', []), ME).settings.newCardEachRound, undefined);
  assert.equal(readRoom(wireRoom({ ...room, settings: { ...SETTINGS, newCardEachRound: 'yes' } }, 'p-host', []), ME), null);
});

test('a progress report can carry the card: daubs travel as one number and come back the same', () => {
  const marks = Array.from({ length: 25 }, (_, i) => i % 3 === 0 || i === 24);
  assert.deepEqual(bitsToMarks(marksToBits(marks), 25), marks);
  const cells = Array.from({ length: 25 }, (_, i) => i + 1);
  const read = readProgress({ round: 2, away: 3, daubs: 9, cells, marks: marksToBits(marks) }, 5);
  assert.deepEqual(read.card, { cells, marks });
  // no card, or a broken one: the progress still counts, just without a card
  assert.equal(readProgress({ round: 2, away: 3, daubs: 9 }, 5).card, null);
  assert.equal(readProgress({ round: 2, away: 3, daubs: 9, cells: cells.slice(1), marks: 1 }, 5).card, null);
  assert.equal(readProgress({ round: 2, away: 3, daubs: 9, cells, marks: 2 ** 25 }, 5).card, null);
  assert.equal(readProgress({ round: 2, away: 3, daubs: 9, cells, marks: -1 }, 5).card, null);
});

test('the big screen shows the five closest cards, skipping players whose card it has not got', () => {
  const card = { cells: Array(25).fill(1), marks: Array(25).fill(false) };
  const entries = [
    { id: 'a', name: 'Ann', away: 3, daubs: 5, ...card },
    { id: 'b', name: 'Bo', away: 1, daubs: 4, ...card },
    { id: 'c', name: 'Cy', away: 0, daubs: 6 }, // no card known yet
    { id: 'd', name: 'Dee', away: 1, daubs: 7, ...card },
    { id: 'e', name: 'Eve', away: 2, daubs: 2, ...card },
    { id: 'f', name: 'Fay', away: 4, daubs: 9, ...card },
    { id: 'g', name: 'Gus', away: 5, daubs: 1, ...card },
  ];
  const top = topCards(entries);
  assert.deepEqual(top.map((c) => c.id), ['d', 'b', 'e', 'a', 'f']);
  assert.ok(top.every((c) => c.cells.length === 25 && c.marks.length === 25));
});

test('the leaderboard sent to every phone never includes the cards', () => {
  const entries = [{ id: 'a', name: 'Ann', away: 1, daubs: 3, cells: Array(25).fill(1), marks: Array(25).fill(false) }];
  assert.deepEqual(Object.keys(leaderboard(entries)[0]).sort(), ['away', 'daubs', 'id', 'isBot', 'name']);
});
