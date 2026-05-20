import { supabase } from '@/lib/supabase'

/**
 * invoiceService — CRUD + analytics para facturas.
 *
 * company_id se recibe siempre como parámetro explícito.
 * El servicio es agnóstico al contexto React — no lee CompanyContext.
 * El RLS en Supabase garantiza aislamiento entre empresas.
 */
export const invoiceService = {
  /**
   * List invoices with optional filters and pagination.
   * Req 5.8, 9.1, 9.2, 9.4, 12.11
   * @param {{ page?: number, pageSize?: number, status?: string, type?: string, search?: string, companyId?: string, dateFrom?: string, dateTo?: string }} opts
   */
  async getAll({ page = 1, pageSize = 20, status, type, search, companyId, dateFrom, dateTo } = {}) {
    const safePage     = Math.max(1, page)
    const safePageSize = Math.min(100, Math.max(1, pageSize))

    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        clients(id, name, email),
        providers(id, name, email)
      `, { count: 'exact' })
      .order('fecha_emision', { ascending: false })
      .range((safePage - 1) * safePageSize, safePage * safePageSize - 1)

    if (companyId) query = query.eq('company_id', companyId)
    if (status)    query = query.eq('status', status)
    if (type)      query = query.eq('type', type)
    if (search)    query = query.ilike('invoice_number', `%${search}%`)
    if (dateFrom)  query = query.gte('fecha_emision', dateFrom)
    if (dateTo)    query = query.lte('fecha_emision', dateTo)

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
   * payload debe incluir company_id.
   * @param {{ items: object[], company_id: string, ...invoiceFields }} payload
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

    // Insert line items — rollback (delete invoice) if items fail (Req 5.3)
    if (items.length > 0) {
      const rows = items.map((item, idx) => ({
        ...item,
        invoice_id: newInvoice.id,
        sort_order: idx,
      }))
      const { error: itemsError } = await supabase.from('invoice_items').insert(rows)
      if (itemsError) {
        // Rollback: eliminar la factura para no dejar registros huérfanos
        await supabase.from('invoices').delete().eq('id', newInvoice.id)
        throw itemsError
      }
    }

    return newInvoice
  },

  /**
   * Update invoice fields (not items — handle separately).
   * El RLS garantiza que solo miembros con rol admin/accountant pueden actualizar.
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
   * El RLS garantiza que solo rol admin puede eliminar.
   * @param {string} id
   */
  async delete(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Dashboard stats — uses invoice_financial_summary view for real cash flow.
   * Filtra por company_id (no por user_id).
   * @param {string} companyId
   */
  async getDashboardStats(companyId) {
    if (!companyId) throw new Error('companyId requerido')

    const now      = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // Fetch financial summary for current month, scoped to company
    const { data: summaries, error } = await supabase
      .from('invoice_financial_summary')
      .select('*')
      .eq('company_id', companyId)
      .gte('issue_date', firstDay)

    if (error) throw error

    const receivable = summaries?.filter((s) => s.type === 'receivable') ?? []
    const payable    = summaries?.filter((s) => s.type === 'payable')    ?? []

    const totalFacturado = receivable.reduce((acc, s) => acc + Number(s.total_amount), 0)
    const totalIngresado = receivable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const totalPendiente = receivable.reduce((acc, s) => acc + Number(s.total_pending), 0)
    const totalGastos    = payable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const resultado      = totalIngresado - totalGastos

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
   * Filtra por company_id (no por user_id).
   * @param {string} companyId
   * @param {number} months
   */
  async getMonthlyChart(companyId, months = 6) {
    if (!companyId) throw new Error('companyId requerido')

    const from = new Date()
    from.setMonth(from.getMonth() - months + 1)
    from.setDate(1)
    const fromStr = from.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('invoice_financial_summary')
      .select('issue_date, type, total_paid, total_amount')
      .eq('company_id', companyId)
      .gte('issue_date', fromStr)
      .order('issue_date', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
