// Keeps one round of an online room in step: sends what changed on this device and
// exposes the current game to the message handler in BingoApp.

import { useEffect, useRef } from 'react';
import { YOU } from '../bingo/gameState.js';
import { MSG, wirePlayer } from './protocol.js';

const RESYNC_MS = 8000; // guests re-ask for the state this often, in case a message was lost
const CLAIM_WAIT_MS = 6000; // give up waiting for the host's answer to a BINGO after this long

const sameCard = (a, b) => a && b && a.ready === b.ready
  && a.cells.every((c, i) => c === b.cells[i]) && a.marks.every((m, i) => m === b.marks[i]);

/** The host's result message for a finished round. */
export function finishMessage(game, online) {
  const winner = game.players.find((p) => p.id === game.winner?.id);
  return {
    round: online.round,
    id: winner ? (winner.id === YOU ? online.myId : winner.id) : null,
    line: winner ? game.winner.line : [],
    player: winner ? wirePlayer(winner, online.myId) : null,
  };
}

/**
 * @param {{ online: { isHost: boolean, myId: string, send: Function, round: number, gameApi: object }|null,
 *   active: boolean, game: object|null, dispatch: Function }} opts  active: this round is on screen
 */
export function useOnlineGame({ online, active, game, dispatch }) {
  const sent = useRef(new Map()); // player id → last card sent
  const isHost = Boolean(online?.isHost);
  const live = Boolean(online && active && game);

  const sendCards = (force) => {
    if (!live) return;
    const mine = game.players.filter((p) => p.id === YOU || (isHost && p.isBot && !p.isRemote));
    mine.forEach((p) => {
      if (!force && sameCard(sent.current.get(p.id), p)) return;
      sent.current.set(p.id, p);
      online.send(MSG.PLAYER, { round: online.round, player: wirePlayer(p, online.myId) });
    });
  };

  const sendHostState = () => {
    if (!live || !isHost) return;
    online.send(MSG.CALLS, { round: online.round, called: game.called });
    online.send(MSG.PAUSE, { round: online.round, paused: game.paused });
    if (game.phase === 'finished') online.send(MSG.FINISH, finishMessage(game, online));
  };

  // Let the room's message handler reach this round, and only while it is on screen.
  useEffect(() => {
    if (!online) return;
    if (!live) {
      if (online.gameApi.current?.round === online.round) online.gameApi.current = null;
      return;
    }
    online.gameApi.current = {
      round: online.round,
      dispatch,
      game,
      resend: () => {
        sendCards(true);
        sendHostState();
      },
    };
  });

  // A guest that just started this round asks everyone to send their cards and the calls again,
  // so nothing sent while the round was still being set up gets lost. While the round runs it
  // asks again now and then, which also recovers a lost result.
  const playing = game?.phase === 'playing' || game?.phase === 'build';
  useEffect(() => {
    if (!live || isHost) return undefined;
    online.send(MSG.SYNC, { round: online.round });
    if (!playing) return undefined;
    const id = window.setInterval(() => online.send(MSG.SYNC, { round: online.round }), RESYNC_MS);
    return () => window.clearInterval(id);
  }, [live, isHost, playing]);

  // Our own card (and, for the host, the buddies' cards) whenever they change.
  useEffect(() => sendCards(false));

  // Host: calls, pause and the result.
  const calledCount = game?.called.length ?? 0;
  useEffect(() => {
    if (live && isHost && game.phase !== 'finished') online.send(MSG.CALLS, { round: online.round, called: game.called });
  }, [calledCount, live]);

  useEffect(() => {
    if (live && isHost) online.send(MSG.PAUSE, { round: online.round, paused: game.paused });
  }, [game?.paused, live]);

  useEffect(() => {
    if (live && isHost && game.phase === 'finished') sendHostState();
  }, [game?.phase, live]);

  // Guest: stop showing "checking your BINGO" if the host never answers.
  useEffect(() => {
    if (!game?.claimPending) return undefined;
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_PENDING' }), CLAIM_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [game?.claimPending]);
}
