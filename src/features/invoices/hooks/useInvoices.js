import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceService } from '../services/invoiceService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import { DEMO_STATS, DEMO_CHART_DATA, DEMO_INVOICES } from '@/lib/demoData'

/**
 * Lista facturas de la empresa activa con filtros opcionales.
 * En modo demo retorna los datos de demoData.js.
 * Req 1.4 — company_id se lee de CompanyContext, nunca hardcodeado.
 *
 * @param {object} filters - { status, type, search, dateFrom, dateTo, page, pageSize }
 * @returns {{ data: object[], count: number, isLoading: boolean, error: Error|null }}
 */
export function useInvoices(filters = {}) {
  const { company } = useCompany()

  const query = useQuery({
    queryKey: [QUERY_KEYS.INVOICES, company?.id, filters],
    queryFn: () => {
      // Modo demo: retornar datos locales sin llamar a Supabase
      if (company?._isDemo) {
        let result = [...DEMO_INVOICES]
        if (filters.status) result = result.filter((i) => i.status === filters.status)
        if (filters.type)   result = result.filter((i) => i.type === filters.type)
        if (filters.search) result = result.filter((i) => i.invoice_number.includes(filters.search))
        const page = filters.page ?? 1
        const pageSize = filters.pageSize ?? 20
        const paginated = result.slice((page - 1) * pageSize, page * pageSize)
        return { data: paginated, count: result.length }
      }
      return invoiceService.getAll({ ...filters, companyId: company.id })
    },
    enabled: Boolean(company?.id),
  })

  return {
    data: query.data?.data ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Obtiene una factura por ID con sus ítems y pagos.
 * En modo demo busca en DEMO_INVOICES.
 * @param {string|null} id
 */
export function useInvoice(id) {
  const { company } = useCompany()

  return useQuery({
    queryKey: [QUERY_KEYS.INVOICE, id],
    queryFn: () => {
      if (company?._isDemo) {
        const found = DEMO_INVOICES.find((i) => i.id === id) ?? null
        return Promise.resolve(found)
      }
      return invoiceService.getById(id)
    },
    enabled: Boolean(id),
  })
}

/**
 * Crea una nueva factura con sus ítems (atómico).
 * Invalida el caché de facturas y dashboard al completar.
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (payload) =>
      invoiceService.create({ ...payload, company_id: company.id }),
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

/**
 * Actualiza campos de una factura existente.
 */
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

/**
 * Actualiza solo el estado de una factura.
 */
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

/**
 * Elimina una factura (cascada a ítems y pagos via FK).
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id) => invoiceService.delete(id),
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

/**
 * KPIs del dashboard para la empresa activa.
 * En modo demo retorna DEMO_STATS sin llamar a Supabase.
 */
export function useDashboardStats() {
  const { company } = useCompany()

  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, company?.id],
    queryFn: () => {
      if (company?._isDemo) return Promise.resolve(DEMO_STATS)
      return invoiceService.getDashboardStats(company.id)
    },
    enabled: Boolean(company?.id),
  })
}

/**
 * Datos del gráfico mensual de ingresos vs gastos.
 * En modo demo retorna DEMO_CHART_DATA sin llamar a Supabase.
 * @param {number} months - Cantidad de meses hacia atrás (default 6)
 */
export function useMonthlyChart(months = 6) {
  const { company } = useCompany()

  return useQuery({
    queryKey: ['monthly-chart', company?.id, months],
    queryFn: () => {
      if (company?._isDemo) return Promise.resolve(DEMO_CHART_DATA)
      return invoiceService.getMonthlyChart(company.id, months)
    },
    enabled: Boolean(company?.id),
  })
}
