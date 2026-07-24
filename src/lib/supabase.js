import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const isMockMode = !import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder') || 
  supabaseAnonKey === 'placeholder';

console.log('[Supabase Debug] Connecting to URL:', supabaseUrl, 'Mock Mode:', isMockMode);

if (isMockMode) {
  console.warn('Supabase credentials missing or placeholder. Running in MOCK MODE.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


