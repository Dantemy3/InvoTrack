import { supabase } from '@/lib/supabase'

export const authService = {
  /**
   * Sign in with email + password.
   */
  async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /**
   * Register a new user.
   * @param {string} email
   * @param {string} password
   * @param {{ full_name: string }} metadata
   */
  async signUpWithEmail(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
  },

  /**
   * OAuth with Google — redirects back to /dashboard.
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
   * Sign out the current user.
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
