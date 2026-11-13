// Online room protocol: pure helpers shared by host and guests. No network, no React.
//
// Built for big rooms (200+ players). Supabase counts one message per receiver, so only the
// host talks to everyone:
//   room channel  (everyone listens, only the host speaks): lobby, round start, game state
//   host inbox    (only the host listens, guests post over REST): hello, heartbeat, progress, claims
// The host's device is the referee: it calls the balls, runs the buddies, keeps the roster and
// the score, and decides who won. Everything received is checked here first.

import { YOU } from '../bingo/gameState.js';
import { CARD_SIZES, FREE, PATTERNS } from '../bingo/engine.js';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ONLINE_CODE_LENGTH = 6;
export const NAME_MAX = 20;
// Above the Realtime connection cap (350), so in practice the project limit is reached first.
// A guest the host can't fit is told the room is full (see `full` in the lobby message).
export const MAX_ROOM_PLAYERS = 500;
export const BOARD_SIZE = 10;
const ID_MAX = 40;
const ITEM_MAX = 40;
const MAX_CALLS = 200;
const COLOR_RE = /^#[0-9a-f]{6}$/i;

export const MSG = {
  // room channel, host → everyone
  ROOM: 'room', // lobby: settings, buddies, roster, wins
  START: 'start', // a new round begins
  STATE: 'state', // calls, pause, leaderboard, result — on every change and every few seconds
  CLOSED: 'closed', // the host left
  ROLLCALL: 'rollcall', // the host (re)connected: everyone report in (spread over a few seconds)
  // host inbox, guest → host
  HELLO: 'hello', // I'm here (also asks for the room)
  BEAT: 'beat', // still here, with my progress
  PROGRESS: 'progress', // my card changed: squares away, daubs, ready
  CLAIM: 'claim', // BINGO, with my card
  LEAVE: 'leave', // I left
};

const HOST_ONLY = new Set([MSG.ROOM, MSG.START, MSG.STATE, MSG.CLOSED, MSG.ROLLCALL]);
const TO_HOST = new Set([MSG.HELLO, MSG.BEAT, MSG.PROGRESS, MSG.CLAIM, MSG.LEAVE]);

const isId = (v) => typeof v === 'string' && v.length > 0 && v.length <= ID_MAX;
const cleanName = (v) => String(v ?? '').trim().slice(0, NAME_MAX) || 'Player';
const isCount = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
const isCell = (v) => v === null || v === FREE || (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 200)
  || (typeof v === 'string' && v.length <= ITEM_MAX);

export function channelName(code) {
  return `bingo-room:${code}`;
}

export function inboxName(code) {
  return `bingo-inbox:${code}`;
}

export function makeOnlineCode(rng = Math.random) {
  let code = '';
  for (let i = 0; i < ONLINE_CODE_LENGTH; i += 1) code += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return code;
}

export function isOnlineCode(text) {
  return typeof text === 'string' && text.length === ONLINE_CODE_LENGTH && [...text].every((ch) => CODE_ALPHABET.includes(ch));
}

export function makeClientId(rng = Math.random) {
  return `p-${Math.floor(rng() * 2 ** 48).toString(36)}`;
}

/**
 * Should this device act on a message? Realtime has no server-side referee, so this only stops
 * honest mistakes and casual tampering.
 * - Guests act on room-channel messages only from the pinned host (the first room message pins it).
 * - The host acts on inbox messages only; claims and progress must come from someone on the roster,
 *   and a claim must carry the sender's own card.
 * @param {{ isHost: boolean, hostId: string|null, rosterIds: Set<string> }} ctx
 */
export function trustMessage(msg, { isHost, hostId, rosterIds }) {
  if (!msg || !isId(msg.from)) return false;
  if (isHost) {
    if (!TO_HOST.has(msg.type)) return false;
    if (msg.type === MSG.HELLO || msg.type === MSG.BEAT || msg.type === MSG.LEAVE) return true;
    if (!rosterIds.has(msg.from)) return false;
    return msg.type !== MSG.CLAIM || msg.player?.id === msg.from;
  }
  if (!HOST_ONLY.has(msg.type)) return false;
  return hostId ? msg.from === hostId : msg.type === MSG.ROOM;
}

/** Who is present on the room channel (only the host announces itself there). */
export function presencePlayers(state) {
  const seen = new Map();
  Object.values(state ?? {}).flat().forEach((meta) => {
    if (!meta || !isId(meta.id) || seen.has(meta.id)) return;
    seen.set(meta.id, { id: meta.id, name: cleanName(meta.name), isHost: meta.isHost === true, joinedAt: Number(meta.joinedAt) || 0 });
  });
  return [...seen.values()].sort((a, b) => (b.isHost - a.isHost) || (a.joinedAt - b.joinedAt));
}

/** Our id for "you" inside the local game state is YOU; on the wire it is the client id. */
export function toWireId(id, myId) {
  return id === YOU ? myId : id;
}

export function fromWireId(id, myId) {
  return id === myId ? YOU : id;
}

/** A player's card as sent over the wire (claims and the winner's card). */
export function wirePlayer(player, myId) {
  return {
    id: toWireId(player.id, myId),
    name: player.name,
    color: player.color,
    isBot: Boolean(player.isBot),
    ready: player.ready !== false,
    cells: player.cells,
    marks: player.marks,
  };
}

/**
 * Check a card that arrived from another device. Returns a clean player for the local game
 * state, or null when the data does not fit the round's card size.
 */
export function readPlayer(raw, size, myId) {
  if (!raw || !isId(raw.id) || !CARD_SIZES.includes(size)) return null;
  const n = size * size;
  if (!Array.isArray(raw.cells) || raw.cells.length !== n || !raw.cells.every(isCell)) return null;
  if (!Array.isArray(raw.marks) || raw.marks.length !== n || !raw.marks.every((m) => typeof m === 'boolean')) return null;
  const id = fromWireId(raw.id, myId);
  if (id === YOU) return null; // never let the network overwrite our own card
  return {
    id,
    name: cleanName(raw.name),
    color: COLOR_RE.test(raw.color ?? '') ? raw.color : '#a29bfe',
    isBot: raw.isBot === true,
    isRemote: true,
    ready: raw.ready !== false,
    cells: [...raw.cells],
    marks: [...raw.marks],
  };
}

/** The called list from the host, checked. */
export function readCalls(raw) {
  if (!Array.isArray(raw) || raw.length > MAX_CALLS) return null;
  return raw.every((v) => (typeof v === 'number' && Number.isInteger(v)) || (typeof v === 'string' && v.length <= ITEM_MAX)) ? [...raw] : null;
}

/** The winner announced by the host, in local ids. */
export function readWinner(raw, size, myId) {
  if (!raw) return null;
  if (raw.id === null) return { winner: { id: null, line: [] }, player: null };
  const player = readPlayer(raw.player, size, myId); // null when we are the winner: we have our own card
  const line = Array.isArray(raw.line) ? raw.line.filter((i) => Number.isInteger(i) && i >= 0 && i < size * size) : [];
  if (!isId(raw.id) || line.length < size || line.length > size * size) return null; // a line (size squares) or a shape
  return { winner: { id: fromWireId(raw.id, myId), line }, player };
}

/** A guest's progress report (squares away from a line, daubs, card ready). */
export function readProgress(raw, size) {
  const n = size * size;
  if (!raw || !Number.isInteger(raw.round) || !isCount(raw.away, n) || !isCount(raw.daubs, n)) return null;
  return { round: raw.round, away: raw.away, daubs: raw.daubs, ready: raw.ready !== false, card: readCardBits(raw, n) };
}

/** Marks as one number (bit i = square i daubed), so a progress report stays small. */
export function marksToBits(marks) {
  return marks.reduce((bits, m, i) => (m ? bits + 2 ** i : bits), 0);
}

export function bitsToMarks(bits, n) {
  return Array.from({ length: n }, (_, i) => Math.floor(bits / 2 ** i) % 2 === 1);
}

/** The card a progress report carries (for the big screen), or null when absent or malformed. */
function readCardBits(raw, n) {
  if (!Array.isArray(raw.cells) || raw.cells.length !== n || !raw.cells.every(isCell)) return null;
  if (!Number.isInteger(raw.marks) || raw.marks < 0 || raw.marks >= 2 ** n) return null;
  return { cells: [...raw.cells], marks: bitsToMarks(raw.marks, n) };
}

/**
 * The leaderboard: closest to BINGO first, then most daubs, then name.
 * @param {Array<{id:string,name:string,away:number,daubs:number,isBot?:boolean}>} entries
 */
const byClosest = (a, b) => (a.away - b.away) || (b.daubs - a.daubs) || a.name.localeCompare(b.name);

/** How many cards the big screen shows: the players closest to BINGO. */
export const SPOTLIGHT_SIZE = 5;

/** The cards of the players closest to BINGO (only entries whose card the host knows). */
export function topCards(entries, limit = SPOTLIGHT_SIZE) {
  return entries
    .filter((e) => Array.isArray(e.cells) && Array.isArray(e.marks))
    .sort(byClosest)
    .slice(0, limit)
    .map(({ id, name, away, daubs, cells, marks }) => ({ id, name, away, daubs, cells, marks }));
}

export function leaderboard(entries, limit = BOARD_SIZE) {
  return [...entries]
    .sort(byClosest)
    .slice(0, limit)
    .map(({ id, name, away, daubs, isBot }) => ({ id, name, away, daubs, isBot: Boolean(isBot) }));
}

/**
 * The host's game state for everyone.
 * finish: { winners: [{ id, line, player }] } once the round is over (no winners = nobody won).
 * claim: { leftMs, count } while the claim window after the first BINGO is open.
 */
export function wireState({ round, called, paused, board, count, finish, claim }) {
  return { round, called, paused: Boolean(paused), board, count, finish: finish ?? null, claim: claim ?? null };
}

/** The round's winners from the host (at most 3), in local ids. Null when it doesn't check out. */
export function readFinish(raw, size, myId) {
  if (!raw || !Array.isArray(raw.winners) || raw.winners.length > 3) return null;
  const read = raw.winners.map((w) => readWinner(w, size, myId));
  if (read.some((w) => !w || w.winner.id === null)) return null;
  return { winners: read.map((w) => w.winner), players: read.map((w) => w.player).filter(Boolean), aborted: raw.aborted === true };
}

/** Game state from the host, checked, in local ids. */
export function readState(raw, size, myId) {
  if (!raw || !Number.isInteger(raw.round) || !CARD_SIZES.includes(size)) return null;
  const called = readCalls(raw.called);
  if (!called) return null;
  const n = size * size;
  const board = (Array.isArray(raw.board) ? raw.board : [])
    .slice(0, BOARD_SIZE)
    .filter((e) => e && isId(e.id) && isCount(e.away, n) && isCount(e.daubs, n))
    .map((e) => ({ id: fromWireId(e.id, myId), name: cleanName(e.name), away: e.away, daubs: e.daubs, isBot: e.isBot === true }));
  const finish = raw.finish ? readFinish(raw.finish, size, myId) : null;
  const claim = raw.claim && isCount(raw.claim.leftMs, 60000) && isCount(raw.claim.count, 3)
    ? { leftMs: raw.claim.leftMs, count: raw.claim.count } : null;
  return {
    round: raw.round,
    called,
    paused: raw.paused === true,
    board,
    count: isCount(raw.count, MAX_ROOM_PLAYERS + 20) ? raw.count : board.length,
    finish,
    claim,
  };
}

/** Lobby state the host shares. Buddies run on the host, guests only see them. */
export function wireRoom(room, myId, players, full = false) {
  return {
    full: Boolean(full),
    hostName: room.hostName,
    bigScreen: Boolean(room.bigScreen),
    settings: room.settings,
    buddies: room.buddies,
    wins: Object.fromEntries(Object.entries(room.wins).map(([id, n]) => [toWireId(id, myId), n])),
    roundNo: room.roundNo ?? 0,
    inGame: Boolean(room.inGame),
    players: players.map((p) => ({ id: p.id, name: p.name, isHost: Boolean(p.isHost) })),
    stage: room.stage ?? 1,
    history: (room.history ?? []).map((h) => ({
      stage: h.stage, pattern: h.pattern, winners: h.winners.map((w) => ({ id: toWireId(w.id, myId), name: w.name })),
    })),
  };
}

/** The rounds already played in this game: [{ stage, pattern, winners: [{ id, name }] }]. */
function readHistory(raw, myId) {
  return (Array.isArray(raw) ? raw : []).slice(0, 3)
    .filter((h) => h && Number.isInteger(h.stage) && h.stage >= 1 && h.stage <= 3 && PATTERNS.includes(h.pattern) && Array.isArray(h.winners))
    .map((h) => ({
      stage: h.stage,
      pattern: h.pattern,
      winners: h.winners.slice(0, 3).filter((w) => w && isId(w.id)).map((w) => ({ id: fromWireId(w.id, myId), name: cleanName(w.name) })),
    }));
}

const SETTING_RULES = {
  mode: (v) => v === 'classic' || v === 'custom',
  size: (v) => CARD_SIZES.includes(v),
  autoCall: (v) => typeof v === 'boolean',
  speed: (v) => ['slow', 'normal', 'fast'].includes(v),
  interactiveDaub: (v) => typeof v === 'boolean',
  newCardEachRound: (v) => v === undefined || typeof v === 'boolean',
  skill: (v) => ['relaxed', 'normal', 'speedy'].includes(v),
  presetId: (v) => v === null || typeof v === 'string',
  itemsText: (v) => typeof v === 'string' && v.length <= 4000,
  pattern: (v) => v === undefined || PATTERNS.includes(v),
};

/** Lobby state from the host, checked, in local ids (the player list keeps wire ids). */
export function readRoom(raw, myId) {
  if (!raw || typeof raw.settings !== 'object' || raw.settings === null) return null;
  const settings = {};
  for (const [key, ok] of Object.entries(SETTING_RULES)) {
    if (!ok(raw.settings[key])) return null;
    settings[key] = raw.settings[key];
  }
  const buddies = (Array.isArray(raw.buddies) ? raw.buddies : [])
    .filter((b) => b && isId(b.id))
    .slice(0, 20)
    .map((b) => ({ id: b.id, name: cleanName(b.name), color: COLOR_RE.test(b.color ?? '') ? b.color : '#a29bfe' }));
  const wins = {};
  Object.entries(raw.wins ?? {}).slice(0, MAX_ROOM_PLAYERS + 20).forEach(([id, n]) => {
    if (isId(id) && Number.isInteger(n) && n >= 0) wins[fromWireId(id, myId)] = n;
  });
  const players = (Array.isArray(raw.players) ? raw.players : [])
    .filter((p) => p && isId(p.id))
    .slice(0, MAX_ROOM_PLAYERS + 1)
    .map((p) => ({ id: p.id, name: cleanName(p.name), isHost: p.isHost === true }));
  return {
    hostName: cleanName(raw.hostName),
    bigScreen: raw.bigScreen === true,
    settings,
    buddies,
    wins,
    roundNo: Number.isInteger(raw.roundNo) ? raw.roundNo : 0,
    inGame: raw.inGame === true,
    players,
    full: raw.full === true,
    stage: Number.isInteger(raw.stage) && raw.stage >= 1 && raw.stage <= 3 ? raw.stage : 1,
    history: readHistory(raw.history, myId),
  };
}
