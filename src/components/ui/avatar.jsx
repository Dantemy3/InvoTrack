import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

// Contenedor circular del avatar, envuelve los subcomponentes Image y Fallback.
function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

// Renderiza la imagen del avatar con relación de aspecto cuadrada y cobertura total.
function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  )
}

// Muestra un fallback (iniciales u otro contenido) cuando la imagen no carga.
function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
