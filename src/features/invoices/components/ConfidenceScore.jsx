import { getConfidenceLevel } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Muestra el confidence score de la IA visualmente.
 * Verde = alta confianza, Amarillo = revisar, Rojo = posible error
 */
export default function ConfidenceScore({ score, showLabel = true, size = 'sm' }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-gray-400 italic">Sin IA</span>
    )
  }

  const level = getConfidenceLevel(score)
  const pct = Math.round(score * 100)

  const barColors = {
    success:     'bg-emerald-500',
    warning:     'bg-amber-400',
    destructive: 'bg-red-500',
  }

  const textColors = {
    success:     'text-emerald-700',
    warning:     'text-amber-700',
    destructive: 'text-red-700',
  }

  const bgColors = {
    success:     'bg-emerald-50',
    warning:     'bg-amber-50',
    destructive: 'bg-red-50',
  }

  if (size === 'lg') {
    return (
      <div className={cn('rounded-lg px-3 py-2 flex items-center gap-3', bgColors[level.color])}>
        <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', barColors[level.color])} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('text-xs font-semibold', textColors[level.color])}>{level.label}</span>
            <span className={cn('text-xs font-bold', textColors[level.color])}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColors[level.color])}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', barColors[level.color])} />
      {showLabel && (
        <span className={cn('text-xs font-medium', textColors[level.color])}>
          {pct}%
        </span>
      )}
    </div>
  )
}
