import { AlertTriangle, Clock, CheckCircle, Bell, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '../hooks/useAlerts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const ALERT_TYPE_CONFIG = {
  overdue:   { label: 'Vencida',    icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50',   badge: 'destructive' },
  upcoming:  { label: 'Próxima',    icon: Clock,         color: 'text-amber-500', bg: 'bg-amber-50', badge: 'warning' },
  duplicate: { label: 'Duplicado',  icon: Bell,          color: 'text-blue-500',  bg: 'bg-blue-50',  badge: 'secondary' },
  anomaly:   { label: 'Anomalía',   icon: AlertTriangle, color: 'text-purple-500',bg: 'bg-purple-50',badge: 'secondary' },
}

// Fila individual de alerta. Navega al detalle de factura al hacer click y
// permite marcarla como leída de forma individual.
function AlertRow({ alert, onMarkRead }) {
  const config = ALERT_TYPE_CONFIG[alert.type] ?? ALERT_TYPE_CONFIG.anomaly
  const Icon = config.icon
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex items-start gap-4 px-6 py-4 border-b border-gray-50 last:border-0 transition-colors',
        alert.is_read ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
      )}
      onClick={() => alert.invoice_id && navigate(`/invoices/${alert.invoice_id}`)}
    >
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-medium', alert.is_read ? 'text-gray-500' : 'text-gray-900')}>
            {alert.message}
          </p>
          {!alert.is_read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <Badge variant={config.badge} className="text-xs">{config.label}</Badge>
          {alert.invoices?.invoice_number && (
            <span className="text-xs text-gray-400">Factura {alert.invoices.invoice_number}</span>
          )}
          {alert.invoices?.total_amount && (
            <span className="text-xs text-gray-400">{formatCurrency(alert.invoices.total_amount)}</span>
          )}
          <span className="text-xs text-gray-300">{formatDate(alert.created_at)}</span>
        </div>
      </div>

      {!alert.is_read && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-700"
          onClick={(e) => { e.stopPropagation(); onMarkRead(alert.id) }}
        >
          Leída
        </Button>
      )}
    </div>
  )
}

// Página de alertas. Muestra un resumen de vencidas/próximas/sin leer y
// la lista completa de alertas con opción de marcar todas como leídas.
export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts()
  const markAsRead = useMarkAlertAsRead()
  const markAllAsRead = useMarkAllAlertsAsRead()

  const unreadCount = alerts.filter((a) => !a.is_read).length
  const overdueCount = alerts.filter((a) => a.type === 'overdue').length
  const upcomingCount = alerts.filter((a) => a.type === 'upcoming').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-100">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
              <p className="text-sm text-gray-500">Próximas a vencer</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Sin leer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
            <p className="font-medium text-gray-600">Todo al día</p>
            <p className="text-sm mt-1">No hay alertas pendientes</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todas las alertas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onMarkRead={(id) => markAsRead.mutate(id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
