import { supabase } from '../../../lib/supabase'

/**
 * Fetch all payments for a given invoice.
 *
 * @param {string} invoiceId
 * @returns {Promise<import('../../../lib/database.types').InvoicePayment[]>}
 */
export async function getPaymentsByInvoice(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Register a new payment for an invoice.
 * Supports partial payments — amount can be less than invoice total.
 *
 * @param {Omit<import('../../../lib/database.types').InvoicePayment, 'id' | 'created_at'>} payload
 * @returns {Promise<import('../../../lib/database.types').InvoicePayment>}
 */
export async function createPayment(payload) {
  const { data, error } = await supabase
    .from('invoice_payments')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a payment record.
 *
 * @param {string} paymentId
 */
export async function deletePayment(paymentId) {
  const { error } = await supabase
    .from('invoice_payments')
    .delete()
    .eq('id', paymentId)

  if (error) throw error
}

/**
 * Get the financial summary for a single invoice.
 * Uses the `invoice_financial_summary` view — calculates paid/pending
 * from real payment records, not just the status field.
 *
 * @param {string} invoiceId
 * @returns {Promise<import('../../../lib/database.types').InvoiceFinancialSummary>}
 */
export async function getInvoiceFinancialSummary(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_financial_summary')
    .select('*')
    .eq('invoice_id', invoiceId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get cash flow summary for a company.
 * Returns receivable vs payable totals with collected/pending breakdown.
 * Use this for dashboard KPIs and financial balance.
 *
 * @param {string} companyId
 * @param {string} [currency='ARS']
 * @returns {Promise<import('../../../lib/database.types').CompanyCashFlow[]>}
 */
export async function getCompanyCashFlow(companyId, currency = 'ARS') {
  const { data, error } = await supabase
    .from('company_cash_flow')
    .select('*')
    .eq('company_id', companyId)
    .eq('currency', currency)

  if (error) throw error
  return data
}

/**
 * Calculate financial balance from cash flow rows.
 * surplus = total receivable collected - total payable collected
 *
 * @param {import('../../../lib/database.types').CompanyCashFlow[]} cashFlowRows
 * @returns {{
 *   totalIncome: number,
 *   totalExpenses: number,
 *   surplus: number,
 *   deficit: number,
 *   pendingReceivable: number,
 *   pendingPayable: number,
 *   overdueReceivable: number,
 *   overduePayable: number,
 * }}
 */
export function calculateFinancialBalance(cashFlowRows) {
  const receivable = cashFlowRows.find((r) => r.type === 'receivable') ?? {}
  const payable    = cashFlowRows.find((r) => r.type === 'payable')    ?? {}

  const totalIncome   = Number(receivable.total_collected ?? 0)
  const totalExpenses = Number(payable.total_collected    ?? 0)
  const net           = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    surplus:            net > 0 ? net : 0,
    deficit:            net < 0 ? Math.abs(net) : 0,
    pendingReceivable:  Number(receivable.total_pending  ?? 0),
    pendingPayable:     Number(payable.total_pending     ?? 0),
    overdueReceivable:  Number(receivable.total_overdue  ?? 0),
    overduePayable:     Number(payable.total_overdue     ?? 0),
  }
}
