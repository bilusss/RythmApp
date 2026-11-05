import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY; // publishable key (sb_publishable_...), safe for the app

let client;

// Lazy, so a missing key shows a readable error on login instead of crashing at import time.
export function getSupabase() {
  if (!url || !key) {
    throw new Error(
      'Brak konfiguracji Supabase (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY).'
    );
  }
  client ??= createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
