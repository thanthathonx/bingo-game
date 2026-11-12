// Game state for one round, as a pure reducer. Timers live in the React layer.

import {
  makeClassicCard, makeCustomCard, makeDrawOrder, initialMarks, canDaub, validateClaim,
  autoMarks, placeItems, parseItems, itemsNeeded, shuffle, FREE, sameValue, patternOf,
} from './engine.js';
import { seededRng, hashText } from './roomCode.js';

export const YOU = 'you';
export const PENALTY_MS = 3000;

export const SPEEDS = { slow: 7000, normal: 5000, fast: 3000 };

export const SKILLS = {
  relaxed: { daub: [1500, 4000], claim: [1800, 3800], miss: 0.15 },
  normal: { daub: [900, 2500], claim: [900, 2400], miss: 0.05 },
  speedy: { daub: [400, 1200], claim: [350, 1100], miss: 0 },
};

export function poolFor(settings) {
  return parseItems(settings.itemsText);
}

/** Can the host start with these settings? Returns an error key or null. */
export function settingsProblem(settings) {
  if (settings.mode !== 'custom') return null;
  const have = poolFor(settings).length;
  const need = itemsNeeded(settings.size);
  return have < need ? { need, have } : null;
}

function makePlayer(base, settings, pool, rng) {
  const cells = settings.mode === 'classic' ? makeClassicCard(settings.size, rng) : makeCustomCard(pool, settings.size, rng);
  return { ...base, cells, marks: initialMarks(cells), ready: true };
}

/**
 * Fresh round.
 * @param {{ hostName: string, bigScreen: boolean, buddies: Array<{id:string,name:string,color:string}>, settings: object }} room
 */
export function newRound(room, rng = Math.random) {
  const { settings } = room;
  const pool = poolFor(settings);
  // With a room code, every device that uses the code draws the same calls in the same order.
  const shared = Number.isInteger(room.seed);
  const roundNo = room.roundNo ?? 0;
  const drawRng = shared ? seededRng(room.seed * 1000 + roundNo) : rng;
  // Online, every player gets their own card; offline the code + name pick the card.
  const selfName = room.selfName ?? room.hostName;
  const myCardRng = shared && !room.online ? seededRng(hashText(`${room.seed}:${roundNo}:${selfName}`)) : rng;
  // Online guests see the host's buddies as remote players; only the host runs them.
  const runsBuddies = !room.online || room.online.isHost;
  const bots = runsBuddies ? room.buddies.map((b) => makePlayer({ ...b, isBot: true }, settings, pool, rng)) : [];
  const players = [...bots];
  if (!room.bigScreen) {
    const you = { id: YOU, name: selfName, color: '#fd79a8', isBot: false };
    if (settings.mode === 'custom') {
      const cells = placeItems([], settings.size);
      players.unshift({ ...you, cells, marks: initialMarks(cells), ready: false });
    } else {
      players.unshift(makePlayer(you, settings, pool, myCardRng));
    }
  }
  const needsBuild = settings.mode === 'custom' && !room.bigScreen;
  return {
    phase: needsBuild ? 'build' : 'playing',
    settings,
    pool,
    players,
    order: makeDrawOrder(settings.mode, settings.size, pool, drawRng),
    called: [],
    paused: false,
    winner: null,
    lockedUntil: 0,
    notice: null,
    referee: runsBuddies,
    claimPending: false,
  };
}

/**
 * Put a saved card back on "you" (a guest who reloaded mid-round). A card that doesn't fit the
 * round is ignored. A ready card skips the build phase.
 */
export function withCard(state, card) {
  const n = state.settings.size * state.settings.size;
  if (!card || !Array.isArray(card.cells) || card.cells.length !== n || !Array.isArray(card.marks) || card.marks.length !== n) return state;
  const players = state.players.map((p) => (p.id === YOU
    ? { ...p, cells: [...card.cells], marks: card.marks.map(Boolean), ready: card.ready !== false }
    : p));
  const me = players.find((p) => p.id === YOU);
  return { ...state, players, phase: state.phase === 'build' && me?.ready ? 'playing' : state.phase };
}

const updatePlayer = (state, id, fn) => ({
  ...state,
  players: state.players.map((p) => (p.id === id ? fn(p) : p)),
});

function applyCall(state, value) {
  const called = [...state.called, value];
  const order = state.order.filter((v) => !sameValue(v, value));
  let next = { ...state, called, order, notice: null };
  if (!state.settings.interactiveDaub) {
    next = updatePlayer(next, YOU, (p) => ({ ...p, marks: autoMarks(p.cells, called) }));
  }
  // Out of balls with no line: only the referee (offline, or the online host) ends the round.
  if (order.length === 0 && !next.winner && state.referee !== false) {
    const anyWin = next.players.some((p) => validateClaim(p.cells, autoMarks(p.cells, called), state.settings.size, called, patternOf(state.settings)));
    if (!anyWin) return { ...next, phase: 'finished', winner: { id: null, line: [] } };
  }
  return next;
}

export function reducer(state, action) {
  if (!state) return state;
  switch (action.type) {
    case 'PLACE_ITEM': {
      if (state.phase !== 'build') return state;
      return updatePlayer(state, YOU, (p) => {
        if (p.cells.some((c) => c !== null && c !== FREE && sameValue(c, action.item))) return p;
        const i = p.cells.indexOf(null);
        if (i < 0) return p;
        const cells = p.cells.map((c, k) => (k === i ? action.item : c));
        return { ...p, cells };
      });
    }
    case 'REMOVE_CELL':
      if (state.phase !== 'build') return state;
      return updatePlayer(state, YOU, (p) => ({
        ...p,
        cells: p.cells.map((c, k) => (k === action.index && c !== FREE ? null : c)),
      }));
    case 'FILL_CARD':
      return updatePlayer(state, YOU, (p) => {
        const used = p.cells.filter((c) => c !== null && c !== FREE);
        const rest = shuffle(state.pool.filter((it) => !used.some((u) => sameValue(u, it))), action.rng ?? Math.random);
        let k = 0;
        const cells = p.cells.map((c) => {
          if (c !== null) return c;
          const v = rest[k] ?? null;
          k += 1;
          return v;
        });
        return { ...p, cells };
      });
    case 'CLEAR_CARD':
      return updatePlayer(state, YOU, (p) => ({ ...p, cells: placeItems([], state.settings.size) }));
    case 'READY': {
      const me = state.players.find((p) => p.id === YOU);
      if (!me || me.cells.includes(null)) return state;
      const next = updatePlayer(state, YOU, (p) => ({ ...p, marks: initialMarks(p.cells), ready: true }));
      return { ...next, phase: 'playing' };
    }
    case 'CALL': {
      if (state.phase !== 'playing' || state.order.length === 0) return state;
      return applyCall(state, action.value ?? state.order[0]);
    }
    case 'DAUB': {
      if (state.phase !== 'playing') return state;
      const me = state.players.find((p) => p.id === YOU);
      if (!me) return state;
      if (me.marks[action.index] && me.cells[action.index] !== FREE) {
        return updatePlayer(state, YOU, (p) => ({ ...p, marks: p.marks.map((m, k) => (k === action.index ? false : m)) }));
      }
      if (!canDaub(me.cells, action.index, state.called)) return { ...state, notice: { kind: 'notCalled', at: action.now } };
      return updatePlayer(state, YOU, (p) => ({ ...p, marks: p.marks.map((m, k) => (k === action.index ? true : m)) }));
    }
    case 'BOT_MARK':
      return updatePlayer(state, action.id, (p) => ({
        ...p,
        marks: p.marks.map((m, k) => (k === action.index ? true : m)),
      }));
    case 'CLAIM': {
      if (state.phase !== 'playing') return state;
      const p = state.players.find((x) => x.id === action.id);
      if (!p) return state;
      if (action.id === YOU && action.now < state.lockedUntil) return state;
      if (action.id !== YOU && state.paused) return state; // buddies wait for the game to resume
      const line = validateClaim(p.cells, p.marks, state.settings.size, state.called, patternOf(state.settings));
      // Online guests don't decide the win themselves: the host confirms it (see FINISH).
      if (line && action.deferWin) return { ...state, claimPending: true };
      if (line) return { ...state, phase: 'finished', winner: { id: p.id, line } };
      if (action.id === YOU) return { ...state, lockedUntil: action.now + PENALTY_MS, notice: { kind: 'falseBingo', at: action.now } };
      return state;
    }
    // ----- Online rooms -----
    case 'UPSERT_PLAYER': {
      if (action.player.id === YOU) return state;
      const existing = state.players.find((p) => p.id === action.player.id);
      if (existing && !existing.isRemote) return state; // never let the network replace our own buddies
      return existing
        ? updatePlayer(state, action.player.id, () => action.player)
        : { ...state, players: [...state.players, action.player] };
    }
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter((p) => p.id !== action.id || p.id === YOU) };
    case 'SYNC_CALLS': {
      if (state.phase === 'finished') return state;
      return action.called.reduce(
        (next, value) => (next.phase === 'finished' || next.called.some((c) => sameValue(c, value)) ? next : applyCall(next, value)),
        state,
      );
    }
    case 'REMOTE_CLAIM': {
      if (state.phase !== 'playing') return state;
      // The claim carries the card, so a claimant we have not heard from yet is added first.
      const next = reducer(state, { type: 'UPSERT_PLAYER', player: action.player });
      if (!next.players.some((p) => p.id === action.player.id && p.isRemote)) return state;
      const line = validateClaim(action.player.cells, action.player.marks, state.settings.size, state.called, patternOf(state.settings));
      return line ? { ...next, phase: 'finished', winner: { id: action.player.id, line } } : next;
    }
    case 'FINISH': {
      // The host's result wins over anything this device decided on its own, except a real winner.
      if (state.phase === 'finished' && state.winner?.id != null) return state;
      const next = action.player ? reducer(state, { type: 'UPSERT_PLAYER', player: action.player }) : state;
      return { ...next, phase: 'finished', winner: action.winner, claimPending: false };
    }
    case 'RENAME': {
      const name = String(action.name ?? '').trim().slice(0, 20);
      if (!name) return state;
      return updatePlayer(state, YOU, (p) => (p.name === name ? p : { ...p, name }));
    }
    case 'CLEAR_PENDING':
      return state.claimPending ? { ...state, claimPending: false } : state;
    case 'SET_PAUSE':
      return { ...state, paused: Boolean(action.paused) };
    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };
    case 'CLEAR_NOTICE':
      return { ...state, notice: null };
    default:
      return state;
  }
}
