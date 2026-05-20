import { supabase } from '@/lib/supabase'

/**
 * invoicePaymentService — pagos parciales de facturas.
 *
 * Req 5.4, 5.5, 5.6 — el estado 'paid'/'pending' se determina
 * por la suma real de pagos, no por el campo status directamente.
 */
export const invoicePaymentService = {
  /**
   * Registra un pago parcial o total para una factura.
   * Luego recalcula la suma de pagos y actualiza el status de la factura:
   *   - sum(payments) >= total_amount → 'paid'
   *   - sum(payments) < total_amount  → 'pending'
   *
   * Req 5.4, 5.5, 5.6
   *
   * @param {string} invoiceId
   * @param {string} companyId
   * @param {{ amount: number, payment_method: string, payment_date: string, notes?: string }} payment
   * @returns {Promise<object>} El pago creado
   */
  async registerPayment(invoiceId, companyId, payment) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // 1. Insertar el pago
    const { data: newPayment, error: payError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id:     invoiceId,
        company_id:     companyId,
        user_id:        user.id,
        amount:         payment.amount,
        payment_method: payment.payment_method,
        payment_date:   payment.payment_date,
        notes:          payment.notes ?? null,
      })
      .select()
      .single()

    if (payError) throw payError

    // 2. Recalcular suma total de pagos para esta factura
    const { data: payments, error: sumError } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    if (sumError) throw sumError

    const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

    // 3. Obtener total_amount de la factura
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single()

    if (invError) throw invError

    // 4. Actualizar status según la regla de negocio (Req 5.4, 5.5, 5.6)
    const newStatus = totalPaid >= Number(invoice.total_amount) ? 'paid' : 'pending'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoiceId)

    if (updateError) throw updateError

    return newPayment
  },

  /**
   * Retorna todos los pagos de una factura, ordenados por fecha descendente.
   * Req 5.4
   *
   * @param {string} invoiceId
   * @param {string} companyId
   * @returns {Promise<object[]>}
   */
  async getByInvoice(invoiceId, companyId) {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('company_id', companyId)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Elimina un pago y recalcula el status de la factura.
   *
   * @param {string} paymentId
   * @param {string} invoiceId
   */
  async deletePayment(paymentId, invoiceId) {
    const { error } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', paymentId)

    if (error) throw error

    // Recalcular status tras eliminar
    const { data: payments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single()

    if (invoice) {
      const newStatus = totalPaid >= Number(invoice.total_amount) ? 'paid' : 'pending'
      await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
    }
  },

  /**
   * Resumen financiero de una factura desde la vista invoice_financial_summary.
   * Calcula total_paid, total_pending, is_fully_paid, is_overdue.
   *
   * @param {string} invoiceId
   * @returns {Promise<object>}
   */
  async getFinancialSummary(invoiceId) {
    const { data, error } = await supabase
      .from('invoice_financial_summary')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()

    if (error) throw error
    return data
  },
}
