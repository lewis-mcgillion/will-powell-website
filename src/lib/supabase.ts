import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const forcedDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const isDemoMode = forcedDemoMode || !hasSupabaseConfig;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
