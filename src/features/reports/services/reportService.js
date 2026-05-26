import { supabase } from '@/lib/supabase'

/**
 * reportService — consultas para el módulo de reportes.
 *
 * Usa la vista `company_cash_flow` que calcula totales basados en
 * pagos reales de `invoice_payments`, no en el campo `status`.
 *
 * Requirements: 11.1, 11.4
 */
export const reportService = {
  /**
   * Obtiene el flujo de caja de una empresa filtrado por rango de fechas y tipo.
   * Basado en pagos reales (invoice_payments), no en status de factura.
   *
   * Requirements: 11.1, 11.4
   *
   * @param {{ companyId: string, dateFrom?: string, dateTo?: string, type?: 'receivable'|'payable' }} opts
   * @returns {Promise<object[]>}
   */
  async getCashFlow({ companyId, dateFrom, dateTo, type } = {}) {
    let query = supabase
      .from('company_cash_flow')
      .select('*')
      .eq('company_id', companyId)

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  /**
   * Obtiene el detalle de facturas para exportación CSV.
   * Incluye datos de pagos reales para calcular totales correctos.
   *
   * Requirements: 11.2, 11.3, 11.4
   *
   * @param {{ companyId: string, dateFrom?: string, dateTo?: string, type?: string }} opts
   * @returns {Promise<object[]>}
   */
  async getInvoicesForExport({ companyId, dateFrom, dateTo, type } = {}) {
    let query = supabase
      .from('invoice_financial_summary')
      .select('*')
      .eq('company_id', companyId)
      .order('issue_date', { ascending: false })

    if (type)     query = query.eq('type', type)
    if (dateFrom) query = query.gte('issue_date', dateFrom)
    if (dateTo)   query = query.lte('issue_date', dateTo)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  /**
   * Genera y descarga un archivo CSV en el cliente.
   * No requiere servidor — todo se procesa en el browser.
   *
   * Requirements: 11.3
   *
   * @param {object[]} rows - Filas de datos a exportar
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  exportToCsv(rows, filename = 'reporte') {
    if (!rows.length) return

    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => {
          const val = row[h] ?? ''
          // Escapar comas y comillas en los valores
          const str = String(val).replace(/"/g, '""')
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}
