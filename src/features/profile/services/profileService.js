import { supabase } from '@/lib/supabase'

export const profileService = {
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

  async updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    if (updates.full_name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.full_name },
      })
      if (authError) throw authError
    }

    return data
  },
}
