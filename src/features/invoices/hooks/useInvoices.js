import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceService } from '../services/invoiceService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

export function useInvoices(filters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, filters],
    queryFn: () => invoiceService.getAll(filters),
  })
}

export function useInvoice(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICE, id],
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: invoiceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Factura creada', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al crear factura', description: err.message, variant: 'error' })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, ...data }) => invoiceService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICE, id] })
      toast({ title: 'Factura actualizada', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al actualizar', description: err.message, variant: 'error' })
    },
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, status }) => invoiceService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Estado actualizado', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al actualizar estado', description: err.message, variant: 'error' })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: invoiceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Factura eliminada', variant: 'success' })
    },
    onError: (err) => {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'error' })
    },
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: invoiceService.getDashboardStats,
  })
}

export function useMonthlyChart(months = 6) {
  return useQuery({
    queryKey: ['monthly-chart', months],
    queryFn: () => invoiceService.getMonthlyChart(months),
  })
}
