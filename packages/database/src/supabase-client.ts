import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      error: 'Supabase is not configured'
    };
  }

  const { error } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);

  if (error) {
    return {
      connected: false,
      error: error.message
    };
  }

  return { connected: true };
}
