// Supabase connection for online rooms. The URL and publishable key come from the build
// environment (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY); without them the game
// still works on one device with buddies.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const onlineEnabled = Boolean(url && key);

let client = null;

export function supabase() {
  if (!onlineEnabled) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}
