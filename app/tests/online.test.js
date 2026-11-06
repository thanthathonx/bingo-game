import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MSG, makeOnlineCode, isOnlineCode, presencePlayers, readPlayer, wirePlayer, readCalls, readWinner,
  readRoom, wireRoom, trustMessage, readProgress, leaderboard, wireState, readState, MAX_ROOM_PLAYERS,
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
  assert.deepEqual(readProgress({ round: 2, away: 1, daubs: 3, ready: true }, 3), { round: 2, away: 1, daubs: 3, ready: true });
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
  const wire = wireState({ round: 4, called: [1, 2, 3, 4, 5], paused: false, board: leaderboard(entries), count: 201, finish: null });
  assert.ok(JSON.stringify(wire).length < 2000);
  const back = readState(wire, 3, 'p-3');
  assert.equal(back.board.length, 10);
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
  const game = { ...hostRound(), phase: 'finished', winner: { id: YOU, line: [0, 1, 2] } };
  const msg = finishMessage(game, 'p-host');
  assert.equal(msg.id, 'p-host');
  assert.equal(msg.player.id, 'p-host');
  assert.equal(finishMessage({ ...game, winner: { id: null, line: [] } }, 'p-host').id, null);
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
  const done = reducer(state, { type: 'REMOTE_CLAIM', player: friend });
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
  const over = reducer(pending, { type: 'FINISH', winner: { id: YOU, line: [0, 1, 2] }, player: null });
  assert.equal(over.winner.id, YOU);
  assert.equal(reducer(over, { type: 'FINISH', winner: { id: null, line: [] }, player: null }).winner.id, YOU);
});

test('a guest never ends the round on its own when the balls run out', () => {
  const guest = newRound({ hostName: 'Host', selfName: 'Ann', bigScreen: false, buddies: [], settings: SETTINGS, seed: 5, roundNo: 0, online: { isHost: false } }, seededRng(4));
  assert.equal(guest.referee, false);
  const out = reducer(guest, { type: 'SYNC_CALLS', called: Array.from({ length: 30 }, (_, i) => i + 1) });
  assert.equal(out.phase, 'playing');
  const fixed = reducer({ ...out, phase: 'finished', winner: { id: null, line: [] } }, { type: 'FINISH', winner: { id: 'p-friend', line: [0, 1, 2] }, player: readPlayer(card3(), 3, ME) });
  assert.equal(fixed.winner.id, 'p-friend');
});
