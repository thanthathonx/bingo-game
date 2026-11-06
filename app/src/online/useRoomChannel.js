// Supabase Realtime for one room.
//   room channel: everyone subscribes; only the host broadcasts and only the host tracks presence,
//                 so 200 guests joining don't flood each other.
//   host inbox:   only the host subscribes; guests post to it over REST (httpSend) without joining,
//                 so a guest's message reaches the host alone.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './client.js';
import { channelName, inboxName, presencePlayers } from './protocol.js';

const EVENT = 'msg';

/**
 * @param {{ code: string|null, me: { id: string, name: string, isHost: boolean }|null,
 *   onMessage: (msg: object) => void }} opts
 * @returns {{ status: 'idle'|'connecting'|'live'|'error', hostPresent: boolean,
 *   broadcast: (type: string, data?: object) => void, toHost: (type: string, data?: object) => void }}
 */
export function useRoomChannel({ code, me, onMessage }) {
  const [status, setStatus] = useState('idle');
  const [hostPresent, setHostPresent] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumped to reconnect after the server dropped us
  const failuresRef = useRef(0); // drops in a row, for the back-off; reset once connected
  const roomRef = useRef(null);
  const inboxRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const meId = me?.id;
  const meName = me?.name;
  const meHost = Boolean(me?.isHost);

  useEffect(() => {
    const client = supabase();
    if (!code || !meId || !client) return undefined;
    setStatus('connecting');
    let cancelled = false; // the room was left before the subscriptions finished
    const deliver = ({ payload }) => {
      if (cancelled) return;
      if (payload && typeof payload.type === 'string' && typeof payload.from === 'string' && payload.from !== meId) {
        onMessageRef.current(payload);
      }
    };

    const room = client.channel(channelName(code), {
      config: { broadcast: { self: false, ack: false }, presence: { key: meId } },
    });
    // Guests only post to the inbox; the host listens to it.
    const inbox = client.channel(inboxName(code), { config: { broadcast: { self: false, ack: false } } });
    roomRef.current = room;
    inboxRef.current = inbox;

    let roomReady = false;
    let inboxReady = !meHost;
    let retryTimer = null;
    const maybeLive = () => {
      if (cancelled || !roomReady || !inboxReady) return;
      failuresRef.current = 0;
      setStatus('live');
      onMessageRef.current({ type: '__connected' });
    };
    // The server can drop a channel (rate limit, network blip). Rejoin with a growing pause,
    // plus jitter so 200 players don't all come back in the same second.
    const dropped = (what, state, err) => {
      if (cancelled || retryTimer) return;
      console.error(`[bingo] ${what} channel problem`, state, err?.message);
      setStatus('error');
      failuresRef.current += 1;
      const wait = 1500 * 2 ** Math.min(failuresRef.current - 1, 3) + Math.random() * 2000; // ~1.5 s … 12 s
      retryTimer = window.setTimeout(() => setAttempt((n) => n + 1), wait);
    };

    room
      .on('broadcast', { event: EVENT }, deliver)
      .on('presence', { event: 'sync' }, () => {
        if (!cancelled) setHostPresent(presencePlayers(room.presenceState()).some((p) => p.isHost));
      })
      .subscribe(async (state, err) => {
        if (cancelled) return;
        if (state === 'SUBSCRIBED') {
          if (meHost) await room.track({ id: meId, name: meName, isHost: true, joinedAt: Date.now() });
          roomReady = true;
          maybeLive();
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          dropped('room', state, err);
        }
      });

    if (meHost) {
      inbox.on('broadcast', { event: EVENT }, deliver).subscribe((state, err) => {
        if (cancelled) return;
        if (state === 'SUBSCRIBED') {
          inboxReady = true;
          maybeLive();
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          dropped('inbox', state, err);
        }
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      roomRef.current = null;
      inboxRef.current = null;
      client.removeChannel(room);
      client.removeChannel(inbox);
      setHostPresent(false);
      setStatus('idle');
    };
  }, [code, meId, meHost, attempt]);

  /** Host → everyone in the room. */
  const broadcast = useCallback((type, data = {}) => {
    const room = roomRef.current;
    if (!room) return;
    room.send({ type: 'broadcast', event: EVENT, payload: { ...data, type, from: meId } }).catch((err) => {
      console.error('[bingo] could not broadcast', type, err?.message);
    });
  }, [meId]);

  /** Guest → host only. */
  const toHost = useCallback((type, data = {}) => {
    const inbox = inboxRef.current;
    if (!inbox) return;
    inbox.httpSend(EVENT, { ...data, type, from: meId }).catch((err) => {
      console.error('[bingo] could not reach the host', type, err?.message);
    });
  }, [meId]);

  return { status, hostPresent, broadcast, toHost };
}
