import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-700',
        secondary: 'bg-gray-100 text-gray-700',
        destructive: 'bg-red-100 text-red-700',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        outline: 'border border-gray-200 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Etiqueta de estado visual (badge). Aplica variantes de color según el prop `variant`.
function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
