// Demo mode — sin Supabase
export const authService = {
  async signInWithEmail() {
    return { user: null }
  },
  async signUpWithEmail() {
    return { user: null }
  },
  async signInWithGoogle() {
    return {}
  },
  async signOut() {
    // En demo mode no hace nada
    return
  },
  async resetPassword() {
    return {}
  },
  async updatePassword() {
    return {}
  },
  async getProfile() {
    return null
  },
}
