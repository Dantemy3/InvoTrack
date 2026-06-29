import { supabase } from '@/lib/supabase'

export const productService = {
  async getAll({ companyId, search, page = 1, pageSize = 50 } = {}) {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (companyId) query = query.eq('company_id', companyId)
    if (search)    query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('products')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}
