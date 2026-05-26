import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertService } from '../services/alertService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { useToast } from '@/components/ui/toast'

const QUERY_KEY_ALERTS = 'alerts'
const QUERY_KEY_UNREAD = 'alerts-unread'

/**
 * Retorna todas las alertas de la empresa activa.
 * Requirements: 10.2, 10.5
 */
export function useAlerts() {
  const { company } = useCompany()

  return useQuery({
    queryKey: [QUERY_KEY_ALERTS, company?.id],
    queryFn: () => alertService.getAll(company.id),
    enabled: Boolean(company?.id),
  })
}

/**
 * Retorna el conteo de alertas no leídas para el badge del sidebar.
 * Requirements: 10.4
 */
export function useUnreadAlertsCount() {
  const { company } = useCompany()

  const { data } = useQuery({
    queryKey: [QUERY_KEY_UNREAD, company?.id],
    queryFn: () => alertService.getUnread(company.id),
    enabled: Boolean(company?.id),
    // Refrescar cada 2 minutos para mantener el badge actualizado
    refetchInterval: 2 * 60 * 1000,
  })

  return data?.length ?? 0
}

/**
 * Marca una alerta individual como leída.
 * Requirements: 10.3
 */
export function useMarkAlertAsRead() {
  const queryClient = useQueryClient()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (alertId) => alertService.markAsRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ALERTS, company?.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_UNREAD, company?.id] })
    },
  })
}

/**
 * Marca todas las alertas de la empresa como leídas.
 * Requirements: 10.3
 */
export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient()
  const { company } = useCompany()
  const { toast } = useToast()

  return useMutation({
    mutationFn: () => alertService.markAllAsRead(company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ALERTS, company?.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_UNREAD, company?.id] })
      toast({ title: 'Todas las alertas marcadas como leídas', variant: 'success' })
    },
  })
}
