import { supabase } from '@/lib/supabase'

export const providerService = {
  /**
   * List providers for the current user.
   * @param {{ search?: string, page?: number, pageSize?: number }} opts
   */
  async getAll({ search, page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('providers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Get a single provider by id.
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new provider.
   * @param {object} provider
   */
  async create(provider) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('providers')
      .insert({ ...provider, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a provider.
   * @param {string} id
   * @param {object} updates
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a provider.
   * @param {string} id
   */
  async delete(id) {
    const { error } = await supabase.from('providers').delete().eq('id', id)
    if (error) throw error
  },
}
