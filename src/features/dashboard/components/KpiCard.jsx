import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Tarjeta de KPI con título, valor principal, subtexto, ícono y tendencia opcional.
export default function KpiCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', isLoading }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
