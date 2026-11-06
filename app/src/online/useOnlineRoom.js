// The room side of online play. The host keeps the roster (from guests' hellos and heartbeats)
// and shares the lobby; guests follow the host and report in. Game messages are routed to the
// round that is currently mounted (see useOnlineGame).

import { useEffect, useRef, useState } from 'react';
import { useRoomChannel } from './useRoomChannel.js';
import {
  MSG, MAX_ROOM_PLAYERS, readRoom, readPlayer, readProgress, readState, wireRoom, trustMessage,
} from './protocol.js';

const JOIN_TIMEOUT_MS = 8000; // guest: no answer from a host by then → no such room
// guest: the host has been missing this long → room closed. Long enough for a host whose
// network blipped or who reloaded the page to come back (the room is kept in their session).
const HOST_GONE_MS = 30000;
const BEAT_MS = 15000; // guest heartbeat
const GUEST_GONE_MS = 45000; // host: no heartbeat for this long → guest left
const ROOM_THROTTLE_MS = 600; // host: at most this often a lobby broadcast
const ROLLCALL_SPREAD_MS = 3000; // guests answer a roll call at a random moment within this window

/**
 * @param {{ room: object|null, setRoom: Function, name: string, myId: string,
 *   startRound: (room: object) => void, leaveRoom: (reason?: string) => void,
 *   resumeRef: { current: { round: number, seed: number, card: object }|null } }} opts
 *   resumeRef: a guest coming back after a reload, to be put back into the running round
 */
export function useOnlineRoom({ room, setRoom, name, myId, startRound, leaveRoom, resumeRef }) {
  const online = room?.online ?? null;
  const isHost = Boolean(online?.isHost);
  const gameApi = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;
  const hostIdRef = useRef(null);
  const rosterRef = useRef(new Map()); // host: id → { id, name, lastSeen, progress }
  const progressRef = useRef(null); // guest: my latest progress, sent with every heartbeat
  const [roster, setRoster] = useState([]); // host: roster for the screen
  const [board, setBoard] = useState(null); // guest: the host's leaderboard for the current round
  // The browser knows straight away when the device goes offline; the socket only notices
  // after its heartbeat times out (~30 s), so use both for the "reconnecting" banner.
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const off = () => setOffline(true);
    const on = () => setOffline(false);
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
    };
  }, []);

  useEffect(() => {
    hostIdRef.current = isHost ? myId : null;
    rosterRef.current = new Map();
    setRoster([]);
    setBoard(null);
  }, [online?.code, isHost, myId]);

  const forRound = (round) => {
    const api = gameApi.current;
    return api && round === api.round ? api : null;
  };

  // ----- host: roster -----
  const roomTimer = useRef(null);
  const stateTimer = useRef(null);
  const players = isHost
    ? [{ id: myId, name: room?.hostName ?? name, isHost: true }, ...roster.map(({ id, name: n }) => ({ id, name: n, isHost: false }))]
    : (room?.players ?? []);

  const publishRoster = () => setRoster([...rosterRef.current.values()].map(({ id, name: n }) => ({ id, name: n })));

  const scheduleRoom = () => {
    if (!isHost || roomTimer.current) return;
    roomTimer.current = window.setTimeout(() => {
      roomTimer.current = null;
      const current = roomRef.current;
      if (!current?.online) return;
      const list = [{ id: myId, name: current.hostName, isHost: true },
        ...[...rosterRef.current.values()].map(({ id, name: n }) => ({ id, name: n, isHost: false }))];
      broadcast(MSG.ROOM, wireRoom(current, myId, list, rosterRef.current.size >= MAX_ROOM_PLAYERS));
    }, ROOM_THROTTLE_MS);
  };

  const seeGuest = (msg) => {
    const roster0 = rosterRef.current;
    const known = roster0.get(msg.from);
    if (!known && roster0.size >= MAX_ROOM_PLAYERS) return;
    const name0 = String(msg.name ?? '').trim().slice(0, 20) || 'Player';
    roster0.set(msg.from, { id: msg.from, name: name0, lastSeen: Date.now(), progress: known?.progress ?? null });
    const renamed = Boolean(known) && known.name !== name0;
    if (!known || renamed) publishRoster();
    // A newcomer, someone back after a reload, or a new name: share the updated lobby.
    if (!known || renamed || msg.type === MSG.HELLO) scheduleRoom();
  };

  const handle = (msg) => {
    const current = roomRef.current;
    if (!current?.online) return;
    if (msg.type === '__connected') {
      if (isHost) {
        scheduleRoom();
        broadcast(MSG.ROLLCALL); // after a reconnect or reload the roster is rebuilt from the answers
      } else {
        toHost(MSG.HELLO, { name });
      }
      return;
    }
    const rosterIds = new Set(rosterRef.current.keys());
    if (!trustMessage(msg, { isHost, hostId: hostIdRef.current, rosterIds })) return;

    if (isHost) {
      handleAsHost(msg);
      return;
    }
    handleAsGuest(msg, current);
  };

  const handleAsHost = (msg) => {
    const api = forRound(msg.round ?? msg.progress?.round);
    const size = api?.game?.settings.size;
    switch (msg.type) {
      case MSG.HELLO:
      case MSG.BEAT: {
        seeGuest(msg);
        // Someone (re)joined mid-round: send the game state now rather than at the next
        // repeat, at most once a second however many come back together.
        if (msg.type === MSG.HELLO && gameApi.current?.pushState && !stateTimer.current) {
          stateTimer.current = window.setTimeout(() => {
            stateTimer.current = null;
            gameApi.current?.pushState?.();
          }, 1000);
        }
        const entry = rosterRef.current.get(msg.from);
        if (!entry) break;
        // A heartbeat always carries the guest's current progress: none means "not in this round".
        if (msg.type === MSG.BEAT) entry.progress = size && msg.progress ? readProgress(msg.progress, size) : null;
        break;
      }
      case MSG.PROGRESS: {
        const progress = size ? readProgress(msg, size) : null;
        const entry = rosterRef.current.get(msg.from);
        if (progress && entry) entry.progress = progress;
        break;
      }
      case MSG.CLAIM: {
        const player = api && readPlayer(msg.player, size, myId);
        if (player) api.dispatch({ type: 'REMOTE_CLAIM', player });
        break;
      }
      case MSG.LEAVE:
        if (rosterRef.current.delete(msg.from)) {
          publishRoster();
          scheduleRoom();
        }
        break;
      default:
        break;
    }
  };

  const handleAsGuest = (msg, current) => {
    switch (msg.type) {
      case MSG.ROOM: {
        const r = readRoom(msg, myId);
        if (!r) break;
        if (!hostIdRef.current) hostIdRef.current = msg.from;
        // The host's roster is full and we're not on it: we couldn't win, so say so and leave.
        if (r.full && !r.players.some((p) => p.id === myId)) {
          leaveRoom('roomFull');
          break;
        }
        // Back after a reload, and our round is still running: rejoin it with our saved card.
        const resume = resumeRef?.current;
        if (resume) {
          resumeRef.current = null;
          if (r.inGame && resume.round === r.roundNo - 1) {
            startRound({
              ...current, ...r, bigScreen: false, hostBigScreen: r.bigScreen, connecting: false,
              seed: resume.seed, roundNo: resume.round, resumeCard: resume.card,
            });
            break;
          }
        }
        // A guest always plays with a card; the host's TV mode is only shown as a tag.
        setRoom((prev) => (prev?.online ? { ...prev, ...r, bigScreen: false, hostBigScreen: r.bigScreen, connecting: false } : prev));
        break;
      }
      case MSG.ROLLCALL: {
        const wait = Math.random() * ROLLCALL_SPREAD_MS;
        window.setTimeout(() => toHost(MSG.BEAT, { name, progress: progressRef.current }), wait);
        break;
      }
      case MSG.START: {
        if (!Number.isInteger(msg.seed) || !Number.isInteger(msg.round)) break;
        const r = readRoom(msg.room, myId);
        if (!r) break;
        setBoard(null);
        startRound({ ...current, ...r, bigScreen: false, hostBigScreen: r.bigScreen, connecting: false, seed: msg.seed, roundNo: msg.round });
        break;
      }
      case MSG.STATE: {
        const api = forRound(msg.round);
        const state = api && readState(msg, api.game?.settings.size, myId);
        if (!state) break;
        api.dispatch({ type: 'SYNC_CALLS', called: state.called });
        api.dispatch({ type: 'SET_PAUSE', paused: state.paused });
        if (state.finish) api.dispatch({ type: 'FINISH', winner: state.finish.winner, player: state.finish.player });
        setBoard({ round: state.round, entries: state.board, count: state.count });
        break;
      }
      case MSG.CLOSED:
        leaveRoom('hostLeft');
        break;
      default:
        break;
    }
  };

  const me = online ? { id: myId, name, isHost } : null;
  const { status, hostPresent, broadcast, toHost } = useRoomChannel({ code: online?.code ?? null, me, onMessage: handle });

  // Host: share lobby changes (settings, buddies, wins, name, in-game flag).
  useEffect(() => {
    if (isHost && status === 'live') scheduleRoom();
  }, [isHost, status, room?.settings, room?.buddies, room?.wins, room?.hostName, room?.inGame]);

  // Host: guests that stopped sending heartbeats have left.
  useEffect(() => {
    if (!isHost || status !== 'live') return undefined;
    const id = window.setInterval(() => {
      const cutoff = Date.now() - GUEST_GONE_MS;
      let changed = false;
      rosterRef.current.forEach((g, gid) => {
        if (g.lastSeen < cutoff) {
          rosterRef.current.delete(gid);
          changed = true;
        }
      });
      if (changed) {
        publishRoster();
        scheduleRoom();
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [isHost, status]);

  // Guest: heartbeat with my progress; a rename is sent straight away.
  useEffect(() => {
    if (!online || isHost || status !== 'live') return undefined;
    const beat = () => toHost(MSG.BEAT, { name, progress: progressRef.current });
    beat();
    const id = window.setInterval(beat, BEAT_MS);
    return () => window.clearInterval(id);
  }, [online?.code, isHost, status, name]);

  // Guest: give up if the room never answers.
  useEffect(() => {
    if (!online || isHost || !room?.connecting) return undefined;
    const id = window.setTimeout(() => leaveRoom('roomNotFound'), JOIN_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [online?.code, isHost, room?.connecting]);

  // Guest: the host vanished without saying goodbye (closed the tab, lost connection).
  useEffect(() => {
    if (!online || isHost || room?.connecting || hostPresent || status !== 'live') return undefined;
    const id = window.setTimeout(() => leaveRoom('hostLeft'), HOST_GONE_MS);
    return () => window.clearTimeout(id);
  }, [online?.code, isHost, room?.connecting, hostPresent, status]);

  // A guest closing the tab says goodbye. The host does not: closing and reloading look the same
  // to the page, and after a reload the host comes back to the same room (guests wait for it).
  useEffect(() => {
    if (!online || isHost) return undefined;
    const bye = () => toHost(MSG.LEAVE);
    window.addEventListener('pagehide', bye);
    return () => window.removeEventListener('pagehide', bye);
  }, [online?.code, isHost, toHost]);

  useEffect(() => () => {
    window.clearTimeout(roomTimer.current);
    window.clearTimeout(stateTimer.current);
  }, []);

  const hostStart = (r, roundUsed) => {
    broadcast(MSG.START, { round: roundUsed, seed: r.seed, room: wireRoom(r, myId, players) });
  };

  /** Leave on purpose. The host closes the room for everyone. */
  const leave = () => {
    if (isHost) broadcast(MSG.CLOSED);
    else toHost(MSG.LEAVE);
    leaveRoom();
  };

  return {
    status,
    players,
    hostStart,
    leave,
    // guest: the host dropped out and we're waiting for it to come back (up to HOST_GONE_MS)
    hostMissing: Boolean(online && !isHost && !room?.connecting && status === 'live' && !offline && !hostPresent),
    // our own connection dropped and is coming back
    reconnecting: Boolean(online && !room?.connecting && (status === 'error' || offline)),
    ctx: online ? { isHost, myId, name, broadcast, toHost, gameApi, rosterRef, progressRef, board } : null,
  };
}
