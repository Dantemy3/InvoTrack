import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:brightness-110 shadow-[0_4px_18px_rgba(233,106,74,0.28)]',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        outline: 'border border-gray-200 bg-transparent text-gray-700 hover:bg-ink/5 hover:text-gray-900 shadow-sm',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900',
        ghost: 'hover:bg-ink/5 hover:text-gray-900',
        link: 'text-blue-600 underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Botón configurable con variantes de estilo y tamaño. Soporta renderizado como slot (asChild).
const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
