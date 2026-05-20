import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicePaymentService } from '../services/invoicePaymentService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

/**
 * Lista los pagos de una factura.
 * Req 5.4
 */
export function useInvoicePayments(invoiceId) {
  const { company } = useCompany()

  return useQuery({
    queryKey: [QUERY_KEYS.INVOICE_PAYMENTS, invoiceId],
    queryFn: () => invoicePaymentService.getByInvoice(invoiceId, company.id),
    enabled: Boolean(invoiceId) && Boolean(company?.id),
  })
}

/**
 * Resumen financiero de una factura (total_paid, total_pending, is_overdue).
 * Usa la vista invoice_financial_summary — basado en pagos reales.
 */
export function useInvoiceFinancialSummary(invoiceId) {
  return useQuery({
    queryKey: ['invoice_financial_summary', invoiceId],
    queryFn: () => invoicePaymentService.getFinancialSummary(invoiceId),
    enabled: Boolean(invoiceId),
  })
}

/**
 * Registra un pago parcial o total.
 * Actualiza automáticamente el status de la factura (paid/pending).
 * Req 5.4, 5.5, 5.6
 */
export function useRegisterPayment(invoiceId) {
  const queryClient = useQueryClient()
  const { company } = useCompany()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payment) =>
      invoicePaymentService.registerPayment(invoiceId, company.id, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICE_PAYMENTS, invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice_financial_summary', invoiceId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICE, invoiceId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Pago registrado', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al registrar pago', description: err.message, variant: 'error' })
    },
  })
}

/**
 * Elimina un pago y recalcula el status de la factura.
 */
export function useDeletePayment(invoiceId) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (paymentId) =>
      invoicePaymentService.deletePayment(paymentId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICE_PAYMENTS, invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice_financial_summary', invoiceId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICE, invoiceId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      toast({ title: 'Pago eliminado', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al eliminar pago', description: err.message, variant: 'error' })
    },
  })
}
