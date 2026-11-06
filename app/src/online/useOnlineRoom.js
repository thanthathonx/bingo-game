// The room side of online play: joins the channel, keeps the lobby in step with the host and
// routes game messages to the round that is currently mounted.

import { useEffect, useRef } from 'react';
import { useRoomChannel } from './useRoomChannel.js';
import { MSG, readRoom, readCalls, readPlayer, readWinner, wireRoom, trustMessage } from './protocol.js';

const JOIN_TIMEOUT_MS = 8000;
const HOST_GONE_MS = 4000;

/**
 * @param {{ room: object|null, setRoom: Function, name: string, myId: string,
 *   startRound: (room: object) => void, leaveRoom: (reason?: string) => void }} opts
 */
export function useOnlineRoom({ room, setRoom, name, myId, startRound, leaveRoom }) {
  const online = room?.online ?? null;
  const isHost = Boolean(online?.isHost);
  const gameApi = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;
  const hostIdRef = useRef(null); // the host, pinned from the first room message (the host itself: own id)
  const peersRef = useRef([]);

  useEffect(() => {
    hostIdRef.current = isHost ? myId : null;
  }, [online?.code, isHost, myId]);

  const forRound = (msg) => {
    const api = gameApi.current;
    return api && msg.round === api.round ? api : null;
  };

  const handle = (msg) => {
    const current = roomRef.current;
    if (!current?.online) return;
    if (msg.type !== '__connected') {
      const peerIds = new Set(peersRef.current.map((p) => p.id));
      if (!trustMessage(msg, { hostId: hostIdRef.current, peerIds })) return;
      if (msg.type === MSG.ROOM && !hostIdRef.current) hostIdRef.current = msg.from;
    }
    const api = forRound(msg);
    const size = api?.game?.settings.size;
    switch (msg.type) {
      case '__connected':
        if (isHost) send(MSG.ROOM, wireRoom(current, myId));
        else send(MSG.HELLO);
        break;
      case MSG.HELLO:
        if (isHost) send(MSG.ROOM, wireRoom(current, myId));
        break;
      case MSG.ROOM: {
        if (isHost) break;
        const r = readRoom(msg, myId);
        // A guest always plays with a card; the host's TV mode is only shown as a tag.
        if (r) setRoom((prev) => (prev?.online ? { ...prev, ...r, bigScreen: false, hostBigScreen: r.bigScreen, connecting: false } : prev));
        break;
      }
      case MSG.START: {
        if (isHost || !Number.isInteger(msg.seed) || !Number.isInteger(msg.round)) break;
        const r = readRoom(msg.room, myId);
        if (r) startRound({ ...current, ...r, bigScreen: false, connecting: false, seed: msg.seed, roundNo: msg.round });
        break;
      }
      case MSG.SYNC:
        api?.resend();
        break;
      case MSG.CALLS: {
        const called = readCalls(msg.called);
        if (api && !isHost && called) api.dispatch({ type: 'SYNC_CALLS', called });
        break;
      }
      case MSG.PLAYER: {
        const player = api && readPlayer(msg.player, size, myId);
        if (player) api.dispatch({ type: 'UPSERT_PLAYER', player });
        break;
      }
      case MSG.CLAIM: {
        const player = api && isHost && readPlayer(msg.player, size, myId);
        if (player) api.dispatch({ type: 'REMOTE_CLAIM', player });
        break;
      }
      case MSG.FINISH: {
        const result = api && !isHost && readWinner(msg, size, myId);
        if (result) api.dispatch({ type: 'FINISH', winner: result.winner, player: result.player });
        break;
      }
      case MSG.PAUSE:
        if (api && !isHost) api.dispatch({ type: 'SET_PAUSE', paused: msg.paused });
        break;
      case MSG.CLOSED:
        if (!isHost) leaveRoom('hostLeft');
        break;
      default:
        break;
    }
  };

  const me = online ? { id: myId, name, isHost } : null;
  const { status, peers, send } = useRoomChannel({ code: online?.code ?? null, me, onMessage: handle });
  peersRef.current = peers;

  // Host: share lobby changes (settings, buddies, wins, name).
  useEffect(() => {
    if (isHost && status === 'live') send(MSG.ROOM, wireRoom(room, myId));
  }, [isHost, status, room?.settings, room?.buddies, room?.wins, room?.hostName, room?.inGame]);

  // Guest: give up if the room never answers.
  useEffect(() => {
    if (!online || isHost || !room?.connecting) return undefined;
    const id = window.setTimeout(() => leaveRoom('roomNotFound'), JOIN_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [online?.code, isHost, room?.connecting]);

  // Guest: the host vanished without saying goodbye (closed the tab, lost connection).
  const hostHere = peers.some((p) => (hostIdRef.current ? p.id === hostIdRef.current : p.isHost));
  useEffect(() => {
    if (!online || isHost || room?.connecting || hostHere || status !== 'live') return undefined;
    const id = window.setTimeout(() => leaveRoom('hostLeft'), HOST_GONE_MS);
    return () => window.clearTimeout(id);
  }, [online?.code, isHost, room?.connecting, hostHere, status]);

  // Someone left the room: take their card off the wall (everyone does this, not just the host;
  // buddies stay — they live on the host).
  useEffect(() => {
    const api = gameApi.current;
    if (!online || !api?.game) return;
    const here = new Set(peers.map((p) => p.id));
    api.game.players
      .filter((p) => p.isRemote && !p.isBot && !here.has(p.id))
      .forEach((p) => api.dispatch({ type: 'REMOVE_PLAYER', id: p.id }));
  }, [peers]);

  // Host: say goodbye when the tab closes.
  useEffect(() => {
    if (!isHost) return undefined;
    const bye = () => send(MSG.CLOSED);
    window.addEventListener('pagehide', bye);
    return () => window.removeEventListener('pagehide', bye);
  }, [isHost, send]);

  const hostStart = (r, roundUsed) => {
    send(MSG.START, { round: roundUsed, seed: r.seed, room: wireRoom(r, myId) });
  };

  /** Leave on purpose. The host closes the room for everyone. */
  const leave = () => {
    if (isHost) send(MSG.CLOSED);
    leaveRoom();
  };

  return {
    status,
    peers,
    hostStart,
    leave,
    ctx: online ? { isHost, myId, send, gameApi } : null,
  };
}
