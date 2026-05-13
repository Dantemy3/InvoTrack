import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentsByInvoice,
  createPayment,
  deletePayment,
  getInvoiceFinancialSummary,
  getCompanyCashFlow,
  calculateFinancialBalance,
} from '../services/invoicePaymentService'

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const paymentKeys = {
  all:             ['invoice_payments'],
  byInvoice:       (invoiceId) => ['invoice_payments', 'invoice', invoiceId],
  summary:         (invoiceId) => ['invoice_financial_summary', invoiceId],
  cashFlow:        (companyId, currency) => ['company_cash_flow', companyId, currency],
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * List all payments for an invoice.
 */
export function useInvoicePayments(invoiceId) {
  return useQuery({
    queryKey: paymentKeys.byInvoice(invoiceId),
    queryFn:  () => getPaymentsByInvoice(invoiceId),
    enabled:  Boolean(invoiceId),
  })
}

/**
 * Financial summary for a single invoice.
 * Returns total_paid, total_pending, is_fully_paid, is_overdue.
 * Source of truth: invoice_payments table, NOT the status field.
 */
export function useInvoiceFinancialSummary(invoiceId) {
  return useQuery({
    queryKey: paymentKeys.summary(invoiceId),
    queryFn:  () => getInvoiceFinancialSummary(invoiceId),
    enabled:  Boolean(invoiceId),
  })
}

/**
 * Company-level cash flow.
 * Returns receivable vs payable breakdown with collected/pending/overdue.
 */
export function useCompanyCashFlow(companyId, currency = 'ARS') {
  return useQuery({
    queryKey: paymentKeys.cashFlow(companyId, currency),
    queryFn:  async () => {
      const rows    = await getCompanyCashFlow(companyId, currency)
      const balance = calculateFinancialBalance(rows)
      return { rows, balance }
    },
    enabled: Boolean(companyId),
  })
}

/**
 * Register a new payment (supports partial amounts).
 * Invalidates the invoice summary and cash flow on success.
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.byInvoice(data.invoice_id) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.summary(data.invoice_id) })
      queryClient.invalidateQueries({ queryKey: ['company_cash_flow', data.company_id] })
    },
  })
}

/**
 * Delete a payment record.
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId }) => deletePayment(paymentId),
    onSuccess: (_data, { invoiceId, companyId }) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.byInvoice(invoiceId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.summary(invoiceId) })
      queryClient.invalidateQueries({ queryKey: ['company_cash_flow', companyId] })
    },
  })
}
