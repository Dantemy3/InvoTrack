import { supabase } from '@/lib/supabase'

/**
 * clientService — CRUD para clientes.
 *
 * company_id se recibe siempre como parámetro explícito.
 * El servicio es agnóstico al contexto React — no lee CompanyContext.
 * El RLS en Supabase garantiza aislamiento entre empresas.
 */
export const clientService = {
  /**
   * List clients for a given company.
   * @param {{ companyId: string, search?: string, page?: number, pageSize?: number }} opts
   */
  async getAll({ companyId, search, page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('clients')
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
   * Get a single client by id.
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new client.
   * payload debe incluir company_id.
   * @param {object} payload — debe incluir company_id
   */
  async create(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a client.
   * El RLS garantiza que solo miembros con rol admin/accountant pueden actualizar.
   * @param {string} id
   * @param {object} updates
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a client.
   * El RLS garantiza que solo rol admin puede eliminar.
   * @param {string} id
   */
  async delete(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}
