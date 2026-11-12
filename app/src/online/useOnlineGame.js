// One round of an online room. The host broadcasts the game state (calls, pause, leaderboard,
// result) on every change and every few seconds; guests report their progress to the host only.

import { useEffect, useRef } from 'react';
import { YOU } from '../bingo/gameState.js';
import { squaresAway, FREE, patternOf } from '../bingo/engine.js';
import { MSG, wirePlayer, wireState, leaderboard } from './protocol.js';

const STATE_EVERY_MS = 5000; // host: repeat the state this often, so a lost message heals quickly
const PROGRESS_DEBOUNCE_MS = 1000; // guest: daubs within this window go out as one report
const CLAIM_WAIT_MS = 6000; // guest: give up waiting for the host's answer to a BINGO after this long

/** Squares away from a line, daubs (free square not counted) and whether the card is ready. */
export function progressOf(player, size, pattern = 'line') {
  return {
    away: squaresAway(player.marks, size, pattern),
    daubs: player.marks.filter((m, i) => m && player.cells[i] !== FREE).length,
    ready: player.ready !== false,
  };
}

/** The host's result message for a finished round. */
export function finishMessage(game, myId) {
  const winner = game.players.find((p) => p.id === game.winner?.id);
  return {
    id: winner ? (winner.id === YOU ? myId : winner.id) : null,
    line: winner ? game.winner.line : [],
    player: winner ? wirePlayer(winner, myId) : null,
  };
}

/** Leaderboard entries from the host's own players (itself and buddies) plus the guests' reports. */
export function boardEntries(game, round, roster, myId) {
  const size = game.settings.size;
  const own = game.players
    .filter((p) => !p.isRemote)
    .map((p) => ({ id: p.id === YOU ? myId : p.id, name: p.name, isBot: Boolean(p.isBot), ...progressOf(p, size, patternOf(game.settings)) }));
  const guests = [...roster.values()]
    .filter((g) => g.progress?.round === round)
    .map((g) => ({ id: g.id, name: g.name, away: g.progress.away, daubs: g.progress.daubs }));
  return { entries: [...own, ...guests], count: own.length + guests.length }; // players in this round
}

/**
 * @param {{ online: object|null, active: boolean, game: object|null, dispatch: Function }} opts
 *   active: this round is on screen
 */
export function useOnlineGame({ online, active, game, dispatch }) {
  const isHost = Boolean(online?.isHost);
  const live = Boolean(online && active && game);
  const gameRef = useRef(game);
  gameRef.current = game;

  // Let the room's message handler reach this round, and only while it is on screen.
  useEffect(() => {
    if (!online) return;
    if (!live) {
      if (online.gameApi.current?.round === online.round) online.gameApi.current = null;
      // A guest who left the round (back to the lobby) is no longer on its leaderboard.
      if (!isHost && online.progressRef.current?.round === online.round) {
        online.progressRef.current = null;
        online.toHost(MSG.BEAT, { name: online.name, progress: null });
      }
      return;
    }
    online.gameApi.current = { round: online.round, dispatch, game, pushState: () => sendState() };
  });

  // Host: the game state for everyone.
  const sendState = () => {
    const g = gameRef.current;
    if (!live || !isHost || !g) return;
    const { entries, count } = boardEntries(g, online.round, online.rosterRef.current, online.myId);
    online.broadcast(MSG.STATE, wireState({
      round: online.round,
      called: g.called,
      paused: g.paused,
      board: leaderboard(entries),
      count,
      finish: g.phase === 'finished' ? finishMessage(g, online.myId) : null,
    }));
  };
  const calledCount = game?.called.length ?? 0;
  useEffect(sendState, [calledCount, game?.paused, game?.phase, live]);
  useEffect(() => {
    if (!live || !isHost) return undefined;
    const id = window.setInterval(sendState, STATE_EVERY_MS);
    return () => window.clearInterval(id);
  }, [live, isHost]);

  // Guest: report my progress to the host when it changes (and keep it for the heartbeat).
  // Quick daubs in a row are sent as one report; "ready" and "one away / BINGO" go out at once.
  const me = game?.players.find((p) => p.id === YOU);
  const progress = me && game ? progressOf(me, game.settings.size, patternOf(game.settings)) : null;
  const key = progress ? `${progress.away}/${progress.daubs}/${progress.ready}` : '';
  const urgent = progress ? progress.away <= 1 || !progress.ready : false;
  useEffect(() => {
    if (!live || isHost || !progress) return undefined;
    const report = { round: online.round, ...progress };
    online.progressRef.current = report;
    const id = window.setTimeout(() => online.toHost(MSG.PROGRESS, report), urgent ? 0 : PROGRESS_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [key, live]);

  // Guest: stop showing "checking your BINGO" if the host never answers.
  useEffect(() => {
    if (!game?.claimPending) return undefined;
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_PENDING' }), CLAIM_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [game?.claimPending]);
}
