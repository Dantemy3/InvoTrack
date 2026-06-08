import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Contenedor principal tipo tarjeta con borde y sombra.
const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border border-gray-100 bg-white shadow-sm', className)}
    {...props}
  />
))
Card.displayName = 'Card'

// Sección de encabezado de la Card, con espaciado vertical interno.
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

// Título principal de la Card, en negrita y color oscuro.
const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight text-gray-900', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

// Texto descriptivo secundario de la Card, en gris y tamaño reducido.
const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

// Cuerpo principal de la Card donde va el contenido.
const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

// Pie de la Card, con layout flex para alinear acciones.
const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
