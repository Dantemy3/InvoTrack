import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, TrendingUp, CheckCircle } from 'lucide-react'
import { registerSchema } from '../schemas/authSchemas'
import { authService } from '../services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

// Traduce errores de Supabase Auth a mensajes legibles en español para el registro.
function getAuthErrorMessage(err) {
  const msg = err?.message ?? ''
  if (msg.includes('User already registered') || msg.includes('already been registered')) {
    return 'Ya existe una cuenta con ese email. Intentá iniciar sesión.'
  }
  if (msg.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (msg.includes('Unable to validate email address') || msg.includes('invalid email')) {
    return 'El email ingresado no es válido.'
  }
  if (msg.includes('Too many requests') || msg.includes('rate limit')) {
    return 'Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Error de conexión. Verificá tu internet e intentá de nuevo.'
  }
  return msg || 'Ocurrió un error inesperado. Intentá de nuevo.'
}

// Página de registro. Crea la cuenta con email/contraseña y muestra confirmación.
export default function RegisterPage() {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

    // Registra el usuario en Supabase y muestra la pantalla de confirmación.
    const onSubmit = async (data) => {
    try {
      await authService.signUpWithEmail(data.email, data.password, {
        full_name: data.fullName,
      })
      setRegistered(true)
    } catch (err) {
      const msg = err?.message ?? ''
      // Supabase returns success even for duplicate emails (security by design),
      // but some configs throw this error
      if (msg.includes('User already registered') || msg.includes('already been registered')) {
        toast({
          title: 'Email ya registrado',
          description: 'Ya existe una cuenta con ese email. Intentá iniciar sesión.',
          variant: 'error',
        })
      } else {
        toast({
          title: 'Error al registrarse',
          description: getAuthErrorMessage(err),
          variant: 'error',
        })
      }
    }
  }

  // Success state — show confirmation message
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">InvoTrack</span>
            </div>
            <p className="text-gray-500 text-sm">Gestión de facturas para PyMEs</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Cuenta creada!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Tu cuenta fue creada con el email{' '}
              <span className="font-medium text-gray-700">{getValues('email')}</span>.
              Si recibís un email de confirmación, hacé clic en el enlace para activar tu cuenta.
              Si no, podés iniciar sesión directamente.
            </p>
            <Link
              to="/login"
              className="inline-block w-full text-center bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">InvoTrack</span>
          </div>
          <p className="text-gray-500 text-sm">Gestión de facturas para PyMEs</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mb-6">Empezá a gestionar tus facturas hoy</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" placeholder="Juan García" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repetí tu contraseña"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
