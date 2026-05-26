/**
 * useDashboard — hook centralizado para el dashboard financiero.
 *
 * Agrupa los KPIs del mes actual y los datos del gráfico mensual,
 * filtrando siempre por la empresa activa en CompanyContext.
 *
 * Requirements: 7.1, 7.2, 7.5, 7.7
 */
import { useDashboardStats, useMonthlyChart } from '@/features/invoices/hooks/useInvoices'

/**
 * Retorna todos los datos necesarios para el dashboard:
 * - KPIs del mes actual (total facturado, ingresado, gastos, resultado neto)
 * - Contadores por estado (pagadas, pendientes, vencidas, total)
 * - Datos del gráfico mensual (últimos N meses)
 *
 * @param {{ months?: number }} opts
 * @returns {{
 *   stats: object|undefined,
 *   statsLoading: boolean,
 *   statsError: Error|null,
 *   chartData: object[]|undefined,
 *   chartLoading: boolean,
 * }}
 */
export function useDashboard({ months = 6 } = {}) {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats()

  const {
    data: chartData,
    isLoading: chartLoading,
  } = useMonthlyChart(months)

  return {
    stats,
    statsLoading,
    statsError,
    chartData,
    chartLoading,
  }
}
