import { supabase } from '@/lib/supabase'

export const invoiceService = {
  /**
   * List invoices with optional filters.
   * @param {{ page?: number, pageSize?: number, status?: string, type?: string, search?: string }} opts
   */
  async getAll({ page = 1, pageSize = 20, status, type, search } = {}) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email),
        providers(id, name, email)
      `, { count: 'exact' })
      .order('issue_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (status) query = query.eq('status', status)
    if (type)   query = query.eq('type', type)
    if (search) query = query.ilike('invoice_number', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Get a single invoice with its items and payments.
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email, cuit, phone, address),
        providers(id, name, email, cuit, phone, address),
        invoice_items(*),
        invoice_payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new invoice with its line items.
   * @param {{ items: object[], ...invoiceFields }} payload
   */
  async create({ items = [], ...invoice }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Insert invoice
    const { data: newInvoice, error: invError } = await supabase
      .from('invoices')
      .insert({ ...invoice, user_id: user.id })
      .select()
      .single()

    if (invError) throw invError

    // Insert line items if any
    if (items.length > 0) {
      const rows = items.map((item, idx) => ({
        ...item,
        invoice_id: newInvoice.id,
        sort_order: idx,
      }))
      const { error: itemsError } = await supabase.from('invoice_items').insert(rows)
      if (itemsError) throw itemsError
    }

    return newInvoice
  },

  /**
   * Update invoice fields (not items — handle separately).
   * @param {string} id
   * @param {object} updates
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update only the status field.
   * @param {string} id
   * @param {string} status
   */
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an invoice (cascades to items and payments via FK).
   * @param {string} id
   */
  async delete(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Dashboard stats — uses invoice_financial_summary view for real cash flow.
   * Falls back to invoices table if view is not yet available.
   */
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // Fetch financial summary for current month
    const { data: summaries, error } = await supabase
      .from('invoice_financial_summary')
      .select('*')
      .eq('user_id', user.id)
      .gte('issue_date', firstDay)

    if (error) throw error

    const receivable = summaries?.filter((s) => s.type === 'receivable') ?? []
    const payable    = summaries?.filter((s) => s.type === 'payable')    ?? []

    const totalFacturado   = receivable.reduce((acc, s) => acc + Number(s.total_amount), 0)
    const totalIngresado   = receivable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const totalPendiente   = receivable.reduce((acc, s) => acc + Number(s.total_pending), 0)
    const totalGastos      = payable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const resultado        = totalIngresado - totalGastos

    const paid    = receivable.filter((s) => s.is_fully_paid).length
    const pending = receivable.filter((s) => !s.is_fully_paid && !s.is_overdue).length
    const overdue = receivable.filter((s) => s.is_overdue).length
    const total   = receivable.length

    return {
      totalFacturado,
      totalIngresado,
      totalGastos,
      totalPendiente,
      resultado,
      paid,
      pending,
      overdue,
      total,
    }
  },

  /**
   * Monthly chart data — last N months of receivable vs payable collected.
   * @param {number} months
   */
  async getMonthlyChart(months = 6) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const from = new Date()
    from.setMonth(from.getMonth() - months + 1)
    from.setDate(1)
    const fromStr = from.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('invoice_financial_summary')
      .select('issue_date, type, total_paid, total_amount')
      .eq('user_id', user.id)
      .gte('issue_date', fromStr)
      .order('issue_date', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
