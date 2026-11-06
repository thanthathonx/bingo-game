import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeOnlineCode, isOnlineCode, presencePlayers, readPlayer, wirePlayer, readCalls, readWinner,
  readRoom, wireRoom, trustMessage, MSG,
} from '../src/online/protocol.js';
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

test('online codes use the safe alphabet and are recognised', () => {
  const code = makeOnlineCode(seededRng(7));
  assert.equal(code.length, 6);
  assert.ok(isOnlineCode(code));
  assert.equal(isOnlineCode('ABC10O'), false);
  assert.equal(isOnlineCode('ABCDE'), false);
});

test('presence lists the host first, then by join time, without duplicates', () => {
  const players = presencePlayers({
    a: [{ id: 'p-b', name: 'Bo', joinedAt: 5 }],
    b: [{ id: 'p-h', name: 'Host', isHost: true, joinedAt: 9 }],
    c: [{ id: 'p-a', name: '  Al  ', joinedAt: 1 }, { id: 'p-a', name: 'dup', joinedAt: 2 }],
    d: [{ name: 'no id' }],
  });
  assert.deepEqual(players.map((p) => p.id), ['p-h', 'p-a', 'p-b']);
  assert.equal(players[1].name, 'Al');
});

test('a player from the network is accepted only when the card fits the round', () => {
  const ok = readPlayer(card3(), 3, ME);
  assert.equal(ok.id, 'p-friend');
  assert.equal(ok.isRemote, true);
  assert.equal(readPlayer({ ...card3(), cells: [1, 2] }, 3, ME), null);
  assert.equal(readPlayer({ ...card3(), marks: card3().marks.map(() => 'yes') }, 3, ME), null);
  assert.equal(readPlayer({ ...card3(), color: 'red;}' }, 3, ME).color, '#a29bfe');
});

test('the network can never overwrite our own card', () => {
  assert.equal(readPlayer({ ...card3(), id: ME }, 3, ME), null);
});

test('our card goes out under our client id and comes back as someone else\'s', () => {
  const mine = { ...card3(), id: YOU };
  const wire = wirePlayer(mine, ME);
  assert.equal(wire.id, ME);
  assert.equal(readPlayer(wire, 3, 'p-other').id, ME);
});

test('called lists must be numbers or short strings', () => {
  assert.deepEqual(readCalls([4, 'Cake']), [4, 'Cake']);
  assert.equal(readCalls([{}]), null);
  assert.equal(readCalls('1,2'), null);
});

test('a winner names a full line of valid squares', () => {
  const res = readWinner({ id: 'p-friend', line: [0, 1, 2], player: card3() }, 3, ME);
  assert.equal(res.winner.id, 'p-friend');
  assert.equal(readWinner({ id: 'p-friend', line: [0, 1] }, 3, ME), null);
  assert.equal(readWinner({ id: ME, line: [3, 4, 5] }, 3, ME).winner.id, YOU);
  assert.deepEqual(readWinner({ id: null }, 3, ME).winner, { id: null, line: [] });
});

test('room state round-trips and rejects unknown settings', () => {
  const room = { hostName: 'Host', bigScreen: false, settings: SETTINGS, buddies: [{ id: 'bot-1', name: 'Bot', color: '#ffd166' }], wins: { [YOU]: 2, 'p-x': 1 } };
  const back = readRoom(wireRoom(room, 'p-host'), ME);
  assert.deepEqual(back.settings, SETTINGS);
  assert.equal(back.wins['p-host'], 2);
  assert.equal(readRoom({ ...wireRoom(room, 'p-host'), settings: { ...SETTINGS, size: 9 } }, ME), null);
});

function hostRound() {
  return newRound({ hostName: 'Host', bigScreen: false, buddies: [], settings: SETTINGS, seed: 42, roundNo: 0 }, seededRng(1));
}

test('guests apply the host\'s calls once, in order', () => {
  const state = reducer(hostRound(), { type: 'SYNC_CALLS', called: [5, 7] });
  const again = reducer(state, { type: 'SYNC_CALLS', called: [5, 7, 9] });
  assert.deepEqual(again.called, [5, 7, 9]);
  assert.equal(again.order.length, 30 - 3); // a 3×3 classic game draws from 1-30
});

test('remote players are added, updated and removed, never replacing you', () => {
  const friend = readPlayer(card3(), 3, ME);
  let state = reducer(hostRound(), { type: 'UPSERT_PLAYER', player: friend });
  state = reducer(state, { type: 'UPSERT_PLAYER', player: { ...friend, name: 'Ana B' } });
  assert.equal(state.players.filter((p) => p.id === 'p-friend').length, 1);
  assert.equal(state.players.find((p) => p.id === 'p-friend').name, 'Ana B');
  assert.equal(reducer(state, { type: 'REMOVE_PLAYER', id: YOU }).players.some((p) => p.id === YOU), true);
  assert.equal(reducer(state, { type: 'REMOVE_PLAYER', id: 'p-friend' }).players.length, 1);
});

test('the host accepts a guest\'s claim only when the line was really called', () => {
  let state = reducer(hostRound(), { type: 'SYNC_CALLS', called: [1, 11] });
  const friend = { ...readPlayer(card3(), 3, ME), marks: [true, true, true, false, true, false, false, false, false] };
  assert.equal(reducer(state, { type: 'REMOTE_CLAIM', player: friend }).phase, 'playing'); // 21 not called yet
  state = reducer(state, { type: 'SYNC_CALLS', called: [1, 11, 21] });
  const done = reducer(state, { type: 'REMOTE_CLAIM', player: friend });
  assert.equal(done.phase, 'finished');
  assert.deepEqual(done.winner, { id: 'p-friend', line: [0, 1, 2] });
});

test('a guest\'s good claim waits for the host instead of ending the round', () => {
  let state = hostRound();
  const me = state.players.find((p) => p.id === YOU);
  state = reducer(state, { type: 'SYNC_CALLS', called: me.cells.filter((c) => c !== FREE) });
  state = { ...state, players: state.players.map((p) => (p.id === YOU ? { ...p, marks: p.marks.map(() => true) } : p)) };
  const pending = reducer(state, { type: 'CLAIM', id: YOU, now: 0, deferWin: true });
  assert.equal(pending.phase, 'playing');
  assert.equal(pending.claimPending, true);
  const over = reducer(pending, { type: 'FINISH', winner: { id: YOU, line: [0, 1, 2] }, player: null });
  assert.equal(over.phase, 'finished');
  assert.equal(over.winner.id, YOU);
});

// ----- Review fixes -----

test('only the pinned host may send host messages; cards and claims must be the sender\'s own', () => {
  const peerIds = new Set(['p-host', 'p-a', 'p-b']);
  const ctx = { hostId: 'p-host', peerIds };
  assert.equal(trustMessage({ type: MSG.CLOSED, from: 'p-a' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.START, from: 'p-host' }, ctx), true);
  assert.equal(trustMessage({ type: MSG.PLAYER, from: 'p-a', player: { id: 'p-b' } }, ctx), false);
  assert.equal(trustMessage({ type: MSG.PLAYER, from: 'p-a', player: { id: 'p-a' } }, ctx), true);
  assert.equal(trustMessage({ type: MSG.PLAYER, from: 'p-host', player: { id: 'bot-1' } }, ctx), true);
  assert.equal(trustMessage({ type: MSG.CLAIM, from: 'p-x', player: { id: 'p-x' } }, ctx), false); // not in the room
  assert.equal(trustMessage({ type: MSG.SYNC, from: 'p-x' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.HELLO, from: 'p-x' }, ctx), true);
});

test('before the host is known only a room message is accepted (and pins the host)', () => {
  const ctx = { hostId: null, peerIds: new Set() };
  assert.equal(trustMessage({ type: MSG.ROOM, from: 'p-host' }, ctx), true);
  assert.equal(trustMessage({ type: MSG.START, from: 'p-host' }, ctx), false);
  assert.equal(trustMessage({ type: MSG.ROOM }, ctx), false);
});

test('the network cannot replace the host\'s own buddies', () => {
  const room = { hostName: 'Host', bigScreen: false, buddies: [{ id: 'bot-1', name: 'Mochi', color: '#ffd166' }], settings: SETTINGS, seed: 3, roundNo: 0, online: { isHost: true } };
  const state = newRound(room, seededRng(2));
  const fake = { ...readPlayer({ ...card3(), id: 'bot-1' }, 3, ME) };
  const after = reducer(state, { type: 'UPSERT_PLAYER', player: fake });
  assert.equal(after.players.find((p) => p.id === 'bot-1').isRemote, undefined);
  assert.equal(reducer(state, { type: 'REMOTE_CLAIM', player: fake }), state);
});

test('a claim from a player the host has not seen yet still names them as the winner', () => {
  const state = reducer(hostRound(), { type: 'SYNC_CALLS', called: [1, 11, 21] });
  const friend = { ...readPlayer(card3(), 3, ME), marks: [true, true, true, false, true, false, false, false, false] };
  const done = reducer(state, { type: 'REMOTE_CLAIM', player: friend });
  assert.equal(done.winner.id, 'p-friend');
  assert.ok(done.players.some((p) => p.id === 'p-friend'));
});

test('a guest never ends the round on its own when the balls run out; the host\'s result wins', () => {
  const guest = newRound({ hostName: 'Host', selfName: 'Ann', bigScreen: false, buddies: [], settings: SETTINGS, seed: 5, roundNo: 0, online: { isHost: false } }, seededRng(4));
  assert.equal(guest.referee, false);
  const all = Array.from({ length: 30 }, (_, i) => i + 1);
  const out = reducer(guest, { type: 'SYNC_CALLS', called: all });
  assert.equal(out.phase, 'playing');
  const over = reducer(out, { type: 'FINISH', winner: { id: 'p-friend', line: [0, 1, 2] }, player: readPlayer(card3(), 3, ME) });
  assert.equal(over.winner.id, 'p-friend');
});

test('a "nobody won" result can be corrected by the host, a real winner cannot be overwritten', () => {
  const finishedNobody = { ...hostRound(), phase: 'finished', winner: { id: null, line: [] } };
  const fixed = reducer(finishedNobody, { type: 'FINISH', winner: { id: 'p-friend', line: [0, 1, 2] }, player: null });
  assert.equal(fixed.winner.id, 'p-friend');
  assert.equal(reducer(fixed, { type: 'FINISH', winner: { id: null, line: [] }, player: null }).winner.id, 'p-friend');
});

test('a pending claim can be cleared when the host never answers', () => {
  const pending = { ...hostRound(), claimPending: true };
  assert.equal(reducer(pending, { type: 'CLEAR_PENDING' }).claimPending, false);
});