import { supabase } from '@/lib/supabase'

/**
 * alertService — gestión de alertas automáticas.
 *
 * Requirements: 10.2, 10.3, 10.5
 */
export const alertService = {
  /**
   * Retorna todas las alertas de una empresa (leídas y no leídas).
   * Ordenadas por fecha descendente.
   *
   * Requirements: 10.2, 10.5
   *
   * @param {string} companyId
   * @returns {Promise<object[]>}
   */
  async getAll(companyId) {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, invoices(invoice_number, total_amount, fecha_vencimiento)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Retorna solo las alertas no leídas de una empresa.
   * Usado para el badge del sidebar.
   *
   * Requirements: 10.4
   *
   * @param {string} companyId
   * @returns {Promise<object[]>}
   */
  async getUnread(companyId) {
    const { data, error } = await supabase
      .from('alerts')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_read', false)

    if (error) throw error
    return data ?? []
  },

  /**
   * Marca una alerta como leída.
   *
   * Requirements: 10.3
   *
   * @param {string} alertId
   * @returns {Promise<void>}
   */
  async markAsRead(alertId) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)

    if (error) throw error
  },

  /**
   * Marca todas las alertas de una empresa como leídas.
   *
   * Requirements: 10.3
   *
   * @param {string} companyId
   * @returns {Promise<void>}
   */
  async markAllAsRead(companyId) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('company_id', companyId)
      .eq('is_read', false)

    if (error) throw error
  },
}
