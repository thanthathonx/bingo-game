// Remembers the online room this tab is in, so a reload (or a phone that dropped the page)
// comes straight back: a guest to the same room with the same card, the host to the same room
// with the round still running. Stored in sessionStorage — this tab only, never sent anywhere.

import { isOnlineCode } from './protocol.js';

const KEY = 'bingo-friends-session';
export const SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000; // older than this: start fresh

const isCard = (c) => c && Array.isArray(c.cells) && Array.isArray(c.marks) && c.cells.length === c.marks.length
  && c.cells.length >= 9 && c.cells.length <= 25 && c.marks.every((m) => typeof m === 'boolean');

const isGame = (g) => g && typeof g === 'object' && g.settings && Array.isArray(g.players) && Array.isArray(g.called)
  && Array.isArray(g.order) && ['build', 'playing', 'finished'].includes(g.phase);

/**
 * Check a stored session (it lives in the player's own browser, but may be stale or edited).
 * Returns null when it can't be used.
 */
export function readSession(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || !isOnlineCode(raw.code)) return null;
  if (!Number.isFinite(raw.savedAt) || now - raw.savedAt > SESSION_MAX_AGE_MS || raw.savedAt > now + 60000) return null;
  const name = String(raw.name ?? '').trim().slice(0, 20);
  if (!name) return null;
  if (raw.role === 'guest') {
    const resumable = Number.isInteger(raw.round) && Number.isInteger(raw.seed) && isCard(raw.card);
    return {
      role: 'guest', code: raw.code, name,
      resume: resumable ? { round: raw.round, seed: raw.seed, card: { cells: raw.card.cells, marks: raw.card.marks, ready: raw.card.ready !== false } } : null,
    };
  }
  if (raw.role === 'host' && raw.room && typeof raw.room === 'object' && raw.room.settings) {
    return { role: 'host', code: raw.code, name, room: raw.room, game: isGame(raw.game) ? raw.game : null };
  }
  return null;
}

export function loadSession() {
  try {
    return readSession(JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null'));
  } catch {
    return null; // storage blocked or unreadable: just start fresh
  }
}

export function saveSession(data) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // storage full or blocked: resuming after a reload won't work, the game itself still does
  }
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // nothing to do
  }
}

/** The parts of the room worth keeping across a host reload (no connection state). */
export function hostRoomSnapshot(room) {
  const { online, connecting, players, ...rest } = room;
  return rest;
}
