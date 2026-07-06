import { supabase } from '@/lib/supabase'

export const providerService = {
  /**
   * List providers for a given company.
   * Requirements: 8.7, 8.2
   * @param {{ companyId: string, search?: string, page?: number, pageSize?: number }} opts
   */
  async getAll({ companyId, search, page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('providers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (companyId) query = query.eq('company_id', companyId)
    if (search)    query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Find a provider by CUIT within a company.
   * @param {{ companyId: string, cuit: string }} opts
   */
  async findByCuit({ companyId, cuit }) {
    if (!cuit) return null
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('company_id', companyId)
      .eq('cuit', cuit)
      .maybeSingle()

    if (error) throw error
    return data
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
