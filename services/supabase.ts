import { createClient } from '@supabase/supabase-js';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import Constants from 'expo-constants';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    console.debug("getItem", { key })
    return getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (value.length > 2048) {
      console.warn('Value being stored in SecureStore is larger than 2048 bytes and it may not be stored successfully. In a future SDK version, this call may throw an error.')
    }
    return setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return deleteItemAsync(key)
  },
};

const extra = Constants.expoConfig?.extra ?? {};

const supabaseUrl = (extra as { supabaseUrl?: string }).supabaseUrl ?? '';
const supabaseAnonKey = (extra as { supabaseAnonKey?: string }).supabaseAnonKey ?? '';

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing required environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);