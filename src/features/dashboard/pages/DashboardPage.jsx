import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, FileText,
  ArrowUpRight, ArrowDownRight, FlaskConical, Plus
} from 'lucide-react'
import { useDashboardStats, useMonthlyChart } from '@/features/invoices/hooks/useInvoices'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCompany } from '@/features/companies/context/CompanyContext'
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
      <div className="bg-panel rounded-2xl border border-gray-100 p-6 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }

  return (
    <div className="group relative bg-panel rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 transition-all hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(233,106,74,0.08)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-ink/10', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>

      <div>
        <p className="money text-[32px] leading-none font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
      </div>

      {trend !== undefined && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit font-mono',
          trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
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
    green:   { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500/10 ring-emerald-500/20' },
    amber:   { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-500/10 ring-amber-500/20' },
    red:     { dot: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-500/10 ring-red-500/20' },
    neutral: { dot: 'bg-gray-400',    text: 'text-gray-700',    bg: 'bg-gray-100 ring-gray-200' },
  }
  const c = colors[color]

  if (isLoading) return <Skeleton className="h-20 rounded-xl" />

  return (
    <div className={cn('rounded-xl p-4 flex items-center gap-4 ring-1 ring-inset', c.bg)}>
      <span className={cn('h-3 w-3 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor]', c.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', c.text)}>{label}</p>
        {amount !== undefined && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{formatCurrency(amount)}</p>
        )}
      </div>
      <span className={cn('money text-2xl font-bold', c.text)}>{count}</span>
    </div>
  )
}

// ── Separador visual con label ───────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="font-mono text-[10px] font-semibold text-gray-500 uppercase tracking-[0.22em] whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-100 to-transparent" />
    </div>
  )
}

// ── Dashboard principal ──────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { company } = useCompany()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useMonthlyChart(6)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'
  const now = new Date()
  const monthName = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const resultado = stats?.resultado ?? 0

  return (
    <div className="space-y-8">

      {/* Banner modo demo */}
      {company?._isDemo && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-500">
          <FlaskConical className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Modo demo</strong> — Estás viendo datos de ejemplo de "Tech Solutions S.A.".
            Para usar tus propios datos, <button className="underline font-medium" onClick={() => navigate('/onboarding')}>creá tu empresa</button>.
          </span>
        </div>
      )}

      {/* ── Hero misión control ── */}
      <div className="relative glass rounded-2xl p-6 sm:p-8 scan-frame scan-active overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-24 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500">resumen financiero · {monthName}</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Hola, <span className="aurora-text">{firstName}</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Controlá facturación, cobros y gastos desde un solo lugar.</p>
            <Button onClick={() => navigate('/invoices/new')} className="mt-5">
              <Plus className="h-4 w-4" />
              Nueva factura
            </Button>
          </div>

          <div className="rounded-2xl bg-ink/[0.04] ring-1 ring-inset ring-ink/10 px-6 py-5 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Resultado neto del mes</p>
            <p className="money text-4xl font-bold text-gray-900 mt-1">
              {statsLoading ? '—' : formatCurrency(resultado)}
            </p>
            <div className="flex gap-5 mt-3 text-xs justify-end">
              <span className="text-gray-500">Ingresado <strong className="text-emerald-600 money">{formatCurrency(stats?.totalIngresado || 0)}</strong></span>
              <span className="text-gray-500">Gastos <strong className="text-red-600 money">{formatCurrency(stats?.totalGastos || 0)}</strong></span>
              <span className="text-gray-500">Pendiente <strong className="text-amber-700 money">{formatCurrency(stats?.totalPendiente || 0)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Métricas financieras ── */}
      <div>
        <SectionLabel>Métricas del mes</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FinancialBlock
            label="Total facturado"
            value={statsLoading ? '—' : formatCurrency(stats?.totalFacturado || 0)}
            sub="Facturas emitidas este mes"
            icon={FileText}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
            isLoading={statsLoading}
          />
          <FinancialBlock
            label="Dinero ingresado"
            value={statsLoading ? '—' : formatCurrency(stats?.totalIngresado || 0)}
            sub="Facturas cobradas"
            icon={TrendingUp}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-500"
            trend={statsLoading ? undefined : `${stats?.paid || 0} facturas cobradas`}
            trendUp={true}
            isLoading={statsLoading}
          />
          <FinancialBlock
            label="Gastos del mes"
            value={statsLoading ? '—' : formatCurrency(stats?.totalGastos || 0)}
            sub="Pagos a proveedores"
            icon={TrendingDown}
            iconBg="bg-red-500/10"
            iconColor="text-red-500"
            trend={statsLoading ? undefined : 'Este mes'}
            trendUp={false}
            isLoading={statsLoading}
          />
        </div>
      </div>

      {/* ── Estado de facturas ── */}
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
            color="neutral"
            isLoading={statsLoading}
          />
        </div>
      </div>

      {/* ── Gráfico + Facturas recientes ── */}
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
