import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env (nunca uses la service_role key en el frontend).')
}

// createClient agrega /auth/v1 y /rest/v1 por su cuenta. Una URL copiada desde
// la API REST produciría /rest/v1/auth/v1 y rompería el inicio de sesión.
let projectUrl
try {
  projectUrl = new URL(supabaseUrl)
} catch {
  throw new Error('VITE_SUPABASE_URL debe ser la URL base del proyecto Supabase.')
}
if (projectUrl.pathname !== '/' || projectUrl.search || projectUrl.hash) {
  throw new Error('VITE_SUPABASE_URL debe ser la URL base del proyecto, sin /rest/v1 ni otra ruta.')
}

/**
 * Supabase browser client.
 * Uses ANON key only — all access is controlled by Row Level Security policies.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
