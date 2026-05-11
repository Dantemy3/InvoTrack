import { AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInvoices } from '@/features/invoices/hooks/useInvoices'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

function getDaysUntilDue(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  const due = new Date(dueDate)
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const { data: overdueData } = useInvoices({ status: 'overdue', pageSize: 50 })
  const { data: pendingData } = useInvoices({ status: 'pending', pageSize: 50 })

  const overdue = overdueData?.data || []
  const pending = pendingData?.data || []

  // Próximos a vencer (menos de 7 días)
  const upcoming = pending.filter((inv) => {
    const days = getDaysUntilDue(inv.due_date)
    return days !== null && days >= 0 && days <= 7
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Facturas que requieren tu atención</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-100">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdue.length}</p>
              <p className="text-sm text-gray-500">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
              <p className="text-sm text-gray-500">Vencen en 7 días</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
              <p className="text-sm text-gray-500">Pendientes total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Facturas vencidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {overdue.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">{inv.client?.name || inv.provider?.name || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                    <p className="text-xs text-red-500">Venció el {formatDate(inv.due_date)}</p>
                  </div>
                  <Badge variant="destructive">Vencida</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-4 w-4" /> Próximas a vencer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {upcoming.map((inv) => {
                const days = getDaysUntilDue(inv.due_date)
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-400">{inv.client?.name || inv.provider?.name || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                      <p className="text-xs text-amber-500">
                        {days === 0 ? 'Vence hoy' : `Vence en ${days} día${days !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <Badge variant="warning">Próxima</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {overdue.length === 0 && upcoming.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
            <p className="font-medium text-gray-600">Todo al día</p>
            <p className="text-sm mt-1">No hay alertas pendientes</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
