import { supabase } from '@/lib/supabase'

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * FLUJO AUTH — paso 2 de 3
 * ──────────────────────────────────────────────────────────────────────────────
 * authService es la capa de acceso a Supabase Auth.
 * Centraliza todas las llamadas de autenticación para que las páginas no
 * dependan directamente del cliente de Supabase.
 *
 * Métodos del flujo principal:
 *  - signInWithEmail / signIn  → login con email + contraseña
 *  - signUpWithEmail / signUp  → registro de cuenta nueva
 *  - signInWithGoogle          → login OAuth con Google
 *  - signOut                   → cerrar sesión
 *
 * Todos los métodos lanzan el error si Supabase devuelve uno,
 * para que la capa superior (página) lo maneje con el toast apropiado.
 * ──────────────────────────────────────────────────────────────────────────────
 */
export const authService = {
  /**
   * Paso 2a — Login con email + contraseña.
   * Llama a supabase.auth.signInWithPassword(). Supabase valida las credenciales
   * contra su base de usuarios. Si son correctas devuelve { user, session }.
   * La session contiene el JWT que se usará en todas las peticiones posteriores.
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /**
   * Alias de signIn — mantenido para compatibilidad con llamadas existentes.
   */
  async signInWithEmail(email, password) {
    return this.signIn(email, password)
  },

  /**
   * Paso 2b — Registro de cuenta nueva.
   * Llama a supabase.auth.signUp(). Supabase crea el usuario en su sistema interno
   * y guarda el full_name como metadata del perfil (disponible en auth.users.raw_user_meta_data).
   * Si el proyecto tiene "Email confirmations" activado, Supabase envía un email
   * de verificación y el usuario debe hacer clic para activar la cuenta.
   */
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
  },

  /**
   * Alias de signUp — mantenido para compatibilidad con llamadas existentes.
   */
  async signUpWithEmail(email, password, metadata = {}) {
    return this.signUp(email, password, metadata)
  },

  /**
   * Paso 2c — Login OAuth con Google.
   * supabase.auth.signInWithOAuth() redirige el navegador a la pantalla de Google.
   * El usuario aprueba los permisos y Google devuelve el control a redirectTo (/dashboard).
   * Supabase intercambia el código OAuth por una sesión y AuthContext la captura
   * automáticamente via onAuthStateChange.
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
    return data
  },

  /**
   * Cierra la sesión del usuario actual.
   * Supabase invalida el JWT en el servidor y limpia el storage local.
   * AuthContext detecta el cambio via onAuthStateChange y pone user = null.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Send a password reset email.
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return data
  },

  /**
   * Update the current user's password (after reset flow).
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  },

  /**
   * Fetch the profile row for the current user.
   */
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },
}
