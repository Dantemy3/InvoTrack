import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, DollarSign, Clock,
  AlertTriangle, FileText, Plus, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useDashboardStats, useMonthlyChart } from '@/features/invoices/hooks/useInvoices'
import { useAuth } from '@/features/auth/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import RevenueChart from '../components/RevenueChart'
import RecentInvoices from '../components/RecentInvoices'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Bloque financiero principal ──────────────────────────────
function FinancialBlock({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>

      {trend !== undefined && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit',
          trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        )}>
          {trendUp
            ? <ArrowUpRight className="h-3 w-3" />
            : <ArrowDownRight className="h-3 w-3" />
          }
          {trend}
        </div>
      )}
    </div>
  )
}

// ── Bloque de estado (contador) ──────────────────────────────
function StatusBlock({ label, count, amount, color, isLoading }) {
  const colors = {
    green:  { dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber:  { dot: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50'   },
    red:    { dot: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50'     },
    blue:   { dot: 'bg-blue-400',    text: 'text-blue-600',    bg: 'bg-blue-50'    },
  }
  const c = colors[color]

  if (isLoading) return <Skeleton className="h-20 rounded-xl" />

  return (
    <div className={cn('rounded-xl p-4 flex items-center gap-4', c.bg)}>
      <span className={cn('h-3 w-3 rounded-full flex-shrink-0', c.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', c.text)}>{label}</p>
        {amount !== undefined && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{formatCurrency(amount)}</p>
        )}
      </div>
      <span className={cn('text-2xl font-bold', c.text)}>{count}</span>
    </div>
  )
}

// ── Separador visual con label ───────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

// ── Dashboard principal ──────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useMonthlyChart(6)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'
  const now = new Date()
  const monthName = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{monthName}</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      {/* ── Bloque 1: Los 3 números principales ── */}
      <div>
        <SectionLabel>Resumen financiero del mes</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FinancialBlock
            label="Total facturado"
            value={statsLoading ? '—' : formatCurrency(stats?.totalFacturado || 0)}
            sub="Facturas emitidas este mes"
            icon={FileText}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            isLoading={statsLoading}
          />
          <FinancialBlock
            label="Dinero ingresado"
            value={statsLoading ? '—' : formatCurrency(stats?.totalIngresado || 0)}
            sub="Facturas cobradas"
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            trend={statsLoading ? undefined : `${stats?.paid || 0} facturas cobradas`}
            trendUp={true}
            isLoading={statsLoading}
          />
          <FinancialBlock
            label="Gastos del mes"
            value={statsLoading ? '—' : formatCurrency(stats?.totalGastos || 0)}
            sub="Pagos a proveedores"
            icon={TrendingDown}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            trend={statsLoading ? undefined : 'Este mes'}
            trendUp={false}
            isLoading={statsLoading}
          />
        </div>
      </div>

      {/* ── Bloque 2: Resultado neto ── */}
      <div>
        <SectionLabel>Resultado neto</SectionLabel>
        {statsLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <div className={cn(
            'rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
            (stats?.resultado || 0) >= 0
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          )}>
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresado − Gastos</p>
              <p className={cn(
                'text-4xl font-bold mt-1',
                (stats?.resultado || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
              )}>
                {formatCurrency(stats?.resultado || 0)}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-400">Ingresado</p>
                <p className="font-semibold text-emerald-600">{formatCurrency(stats?.totalIngresado || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Gastos</p>
                <p className="font-semibold text-red-500">{formatCurrency(stats?.totalGastos || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Pendiente</p>
                <p className="font-semibold text-amber-600">{formatCurrency(stats?.totalPendiente || 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bloque 3: Estado de facturas ── */}
      <div>
        <SectionLabel>Estado de facturas</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatusBlock
            label="Pagadas"
            count={stats?.paid ?? '—'}
            amount={stats?.totalIngresado}
            color="green"
            isLoading={statsLoading}
          />
          <StatusBlock
            label="Pendientes"
            count={stats?.pending ?? '—'}
            amount={stats?.totalPendiente}
            color="amber"
            isLoading={statsLoading}
          />
          <StatusBlock
            label="Vencidas"
            count={stats?.overdue ?? '—'}
            color="red"
            isLoading={statsLoading}
          />
          <StatusBlock
            label="Total del mes"
            count={stats?.total ?? '—'}
            color="blue"
            isLoading={statsLoading}
          />
        </div>
      </div>

      {/* ── Bloque 4: Gráfico + Facturas recientes ── */}
      <div>
        <SectionLabel>Evolución y actividad</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RevenueChart data={chartData} isLoading={chartLoading} />
          </div>
          <div className="lg:col-span-2">
            <RecentInvoices />
          </div>
        </div>
      </div>

    </div>
  )
}
