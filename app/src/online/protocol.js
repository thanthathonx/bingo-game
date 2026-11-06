// Online room protocol: pure helpers shared by host and guests. No network, no React.
//
// Model: the host's device is the referee. It calls the balls, runs the buddies and decides
// who won. Guests send their own card and claims; everything they receive is checked here
// before it reaches the game state, because it comes from other people's browsers.

import { YOU } from '../bingo/gameState.js';
import { CARD_SIZES, FREE } from '../bingo/engine.js';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ONLINE_CODE_LENGTH = 6;
export const NAME_MAX = 20;
const ID_MAX = 40;
const ITEM_MAX = 40;
const MAX_PLAYERS = 40;
const MAX_CALLS = 200;
const COLOR_RE = /^#[0-9a-f]{6}$/i;

export const MSG = {
  HELLO: 'hello', // guest → host: please send the room
  ROOM: 'room', // host → all: lobby state
  START: 'start', // host → all: a new round begins
  CALLS: 'calls', // host → all: everything called so far
  PLAYER: 'player', // anyone → all: my card and daubs
  CLAIM: 'claim', // guest → host: I have BINGO
  FINISH: 'finish', // host → all: the round is over
  PAUSE: 'pause', // host → all: caller paused or resumed
  SYNC: 'sync', // guest → all: please send your cards (and, host, the calls) again
  CLOSED: 'closed', // host → all: the host left
};

const HOST_ONLY = new Set([MSG.ROOM, MSG.START, MSG.CALLS, MSG.FINISH, MSG.PAUSE, MSG.CLOSED]);
const PEERS_ONLY = new Set([MSG.PLAYER, MSG.CLAIM, MSG.SYNC]);

/**
 * Should this device act on a message? Realtime has no server-side referee, so this only stops
 * honest mistakes and casual tampering: host-only messages must come from the pinned host,
 * cards and claims must come from someone in the room and describe the sender's own card
 * (the host also sends its buddies' cards).
 * @param {{ hostId: string|null, peerIds: Set<string> }} ctx  hostId: who sent the first room message
 */
export function trustMessage(msg, { hostId, peerIds }) {
  if (!msg || !isId(msg.from)) return false;
  if (HOST_ONLY.has(msg.type)) return hostId ? msg.from === hostId : msg.type === MSG.ROOM;
  if (PEERS_ONLY.has(msg.type) && !peerIds.has(msg.from)) return false;
  if (msg.type === MSG.CLAIM) return msg.player?.id === msg.from;
  if (msg.type === MSG.PLAYER) return msg.player?.id === msg.from || msg.from === hostId;
  return true;
}

export function channelName(code) {
  return `bingo-room:${code}`;
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

const isId = (v) => typeof v === 'string' && v.length > 0 && v.length <= ID_MAX;
const cleanName = (v) => String(v ?? '').trim().slice(0, NAME_MAX) || 'Player';
const isCell = (v) => v === null || v === FREE || (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 200)
  || (typeof v === 'string' && v.length <= ITEM_MAX);

/** Who is in the room right now, from Supabase presence state. Host first, then by join time. */
export function presencePlayers(state) {
  const seen = new Map();
  Object.values(state ?? {}).flat().forEach((meta) => {
    if (!meta || !isId(meta.id) || seen.has(meta.id)) return;
    seen.set(meta.id, { id: meta.id, name: cleanName(meta.name), isHost: meta.isHost === true, joinedAt: Number(meta.joinedAt) || 0 });
  });
  return [...seen.values()].sort((a, b) => (b.isHost - a.isHost) || (a.joinedAt - b.joinedAt)).slice(0, MAX_PLAYERS);
}

/** Our id for "you" inside the local game state is YOU; on the wire it is the client id. */
export function toWireId(id, myId) {
  return id === YOU ? myId : id;
}

export function fromWireId(id, myId) {
  return id === myId ? YOU : id;
}

/** A player's card as sent over the wire. */
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
 * Check a player that arrived from another device. Returns a clean player for the local
 * game state, or null when the data does not fit the round's card size.
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
  if (!isId(raw.id) || line.length !== size) return null;
  return { winner: { id: fromWireId(raw.id, myId), line }, player };
}

/** Lobby state the host shares. Buddies run on the host, guests only see them. */
export function wireRoom(room, myId) {
  return {
    hostName: room.hostName,
    bigScreen: Boolean(room.bigScreen),
    settings: room.settings,
    buddies: room.buddies,
    wins: Object.fromEntries(Object.entries(room.wins).map(([id, n]) => [toWireId(id, myId), n])),
    roundNo: room.roundNo ?? 0,
    inGame: Boolean(room.inGame),
  };
}

const SETTING_RULES = {
  mode: (v) => v === 'classic' || v === 'custom',
  size: (v) => CARD_SIZES.includes(v),
  autoCall: (v) => typeof v === 'boolean',
  speed: (v) => ['slow', 'normal', 'fast'].includes(v),
  interactiveDaub: (v) => typeof v === 'boolean',
  skill: (v) => ['relaxed', 'normal', 'speedy'].includes(v),
  presetId: (v) => v === null || typeof v === 'string',
  itemsText: (v) => typeof v === 'string' && v.length <= 4000,
};

/** Lobby state from the host, checked, in local ids. Returns null when it does not look right. */
export function readRoom(raw, myId) {
  if (!raw || typeof raw.settings !== 'object' || raw.settings === null) return null;
  const settings = {};
  for (const [key, ok] of Object.entries(SETTING_RULES)) {
    if (!ok(raw.settings[key])) return null;
    settings[key] = raw.settings[key];
  }
  const buddies = (Array.isArray(raw.buddies) ? raw.buddies : [])
    .filter((b) => b && isId(b.id))
    .slice(0, MAX_PLAYERS)
    .map((b) => ({ id: b.id, name: cleanName(b.name), color: COLOR_RE.test(b.color ?? '') ? b.color : '#a29bfe' }));
  const wins = {};
  Object.entries(raw.wins ?? {}).forEach(([id, n]) => {
    if (isId(id) && Number.isInteger(n) && n >= 0) wins[fromWireId(id, myId)] = n;
  });
  return {
    hostName: cleanName(raw.hostName),
    bigScreen: raw.bigScreen === true,
    settings,
    buddies,
    wins,
    roundNo: Number.isInteger(raw.roundNo) ? raw.roundNo : 0,
    inGame: raw.inGame === true,
  };
}
