// One Supabase Realtime channel per room: presence for "who is here", broadcast for game messages.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './client.js';
import { channelName, presencePlayers } from './protocol.js';

/**
 * @param {{ code: string|null, me: { id: string, name: string, isHost: boolean }|null,
 *   onMessage: (msg: object) => void }} opts
 * @returns {{ status: 'idle'|'connecting'|'live'|'error', peers: Array<object>, send: (type: string, data?: object) => void }}
 */
export function useRoomChannel({ code, me, onMessage }) {
  const [status, setStatus] = useState('idle');
  const [peers, setPeers] = useState([]);
  const channelRef = useRef(null);
  const joinedAtRef = useRef(0); // kept across name changes so the player list order stays put
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const meId = me?.id;
  const meName = me?.name;
  const meHost = me?.isHost;

  useEffect(() => {
    const client = supabase();
    if (!code || !meId || !client) return undefined;
    setStatus('connecting');
    let cancelled = false; // the room was left before the subscription finished
    const channel = client.channel(channelName(code), {
      config: { broadcast: { self: false, ack: false }, presence: { key: meId } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        if (cancelled) return;
        if (payload && typeof payload.type === 'string' && typeof payload.from === 'string' && payload.from !== meId) {
          onMessageRef.current(payload);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!cancelled) setPeers(presencePlayers(channel.presenceState()));
      })
      .subscribe(async (state, err) => {
        if (cancelled) return;
        if (state === 'SUBSCRIBED') {
          joinedAtRef.current = Date.now();
          await channel.track({ id: meId, name: meName, isHost: Boolean(meHost), joinedAt: joinedAtRef.current });
          if (cancelled) return;
          setStatus('live');
          onMessageRef.current({ type: '__connected' });
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          console.error('[bingo] realtime channel problem', state, err?.message);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      channelRef.current = null;
      client.removeChannel(channel);
      setPeers([]);
      setStatus('idle');
    };
  }, [code, meId, meHost]);

  // A name change only updates presence, it does not reconnect.
  useEffect(() => {
    const channel = channelRef.current;
    if (channel && status === 'live') channel.track({ id: meId, name: meName, isHost: Boolean(meHost), joinedAt: joinedAtRef.current });
  }, [meName]);

  const send = useCallback((type, data = {}) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({ type: 'broadcast', event: 'msg', payload: { ...data, type, from: meId } }).catch((err) => {
      console.error('[bingo] could not send', type, err?.message);
    });
  }, [meId]);

  return { status, peers, send };
}
