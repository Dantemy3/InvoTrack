import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase env vars not configured.\n' +
    '   Copy .env.example → .env and fill in your project values.\n' +
    '   NEVER use SERVICE_ROLE_KEY in the frontend.'
  )
}

/**
 * Supabase browser client.
 * Uses ANON key only — all access is controlled by Row Level Security policies.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
