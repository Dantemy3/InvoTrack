import { MOCK_INVOICES, MOCK_MONTHLY_DATA, MOCK_EXPENSES } from '@/lib/mockData'

// Estado local mutable para simular CRUD
let invoices = [...MOCK_INVOICES]

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms))
}

export const invoiceService = {
  async getAll({ page = 1, pageSize = 20, status, search } = {}) {
    await delay()
    let filtered = [...invoices]
    if (status) filtered = filtered.filter((i) => i.status === status)
    if (search) filtered = filtered.filter((i) =>
      i.invoice_number.toLowerCase().includes(search.toLowerCase())
    )
    const count = filtered.length
    const data = filtered.slice((page - 1) * pageSize, page * pageSize)
    return { data, count }
  },

  async getById(id) {
    await delay()
    const inv = invoices.find((i) => i.id === id)
    if (!inv) throw new Error('Factura no encontrada')
    return inv
  },

  async create(invoice) {
    await delay()
    const newInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    invoices = [newInvoice, ...invoices]
    return newInvoice
  },

  async update(id, updates) {
    await delay()
    invoices = invoices.map((i) =>
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    )
    return invoices.find((i) => i.id === id)
  },

  async updateStatus(id, status) {
    await delay()
    invoices = invoices.map((i) =>
      i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i
    )
    return invoices.find((i) => i.id === id)
  },

  async delete(id) {
    await delay()
    invoices = invoices.filter((i) => i.id !== id)
  },

  async getDashboardStats() {
    await delay()
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    const monthly = invoices.filter((i) => new Date(i.issue_date) >= firstDay)
    const paidInvoices = monthly.filter((i) => i.status === 'paid')
    const pendingInvoices = monthly.filter((i) => i.status === 'pending')

    const totalFacturado = monthly.reduce((acc, i) => acc + (i.total_amount || 0), 0)
    const totalIngresado = paidInvoices.reduce((acc, i) => acc + (i.total_amount || 0), 0)
    const totalPendiente = pendingInvoices.reduce((acc, i) => acc + (i.total_amount || 0), 0)

    const monthlyExpenses = MOCK_EXPENSES.filter((e) => new Date(e.date) >= firstDay)
    const totalGastos = monthlyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)

    const resultado = totalIngresado - totalGastos

    return {
      totalFacturado,
      totalIngresado,
      totalGastos,
      totalPendiente,
      resultado,
      paid: paidInvoices.length,
      pending: pendingInvoices.length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      total: monthly.length,
    }
  },

  async getMonthlyChart() {
    await delay()
    // Combina ingresos y gastos por mes
    const combined = [
      ...MOCK_MONTHLY_DATA.map((d) => ({ ...d, type: 'income' })),
      ...MOCK_EXPENSES.map((e) => ({ issue_date: e.date, total_amount: e.amount, status: 'expense', type: 'expense' })),
    ]
    return combined
  },
}
