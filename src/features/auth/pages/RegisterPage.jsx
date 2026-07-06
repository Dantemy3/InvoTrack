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

// ──────────────────────────────────────────────────────────────────────────────
// FLUJO "CREAR CUENTA" — paso 1 de 3
// ──────────────────────────────────────────────────────────────────────────────
// El usuario entra a /register. Esta página maneja el registro con email y contraseña.
//
// Pasos del flujo:
//  1. El usuario completa nombre, email, contraseña y confirmación.
//  2. Zod valida el formulario (registerSchema) antes de enviar.
//  3. authService.signUpWithEmail() llama a supabase.auth.signUp().
//  4. Supabase crea el usuario en su base de datos interna.
//  5. Si está configurado el email de confirmación, Supabase lo envía.
//  6. La página muestra la pantalla de "¡Cuenta creada!" para que el usuario
//     vaya a confirmar su email o inicie sesión directamente.
// ──────────────────────────────────────────────────────────────────────────────

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
  // registered controla si mostrar el formulario o la pantalla de "¡Cuenta creada!".
  const [registered, setRegistered] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Paso 1a — Inicializar el formulario con validación Zod
  // registerSchema valida: nombre (≥2 chars), email válido, contraseña (≥8 chars)
  // y que confirmPassword coincida con password.
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  // Paso 1b — Registrar el usuario
  // Se llama solo cuando todos los campos pasan la validación de Zod.
  // authService.signUpWithEmail() llama a supabase.auth.signUp() con el email,
  // contraseña y full_name como metadata del perfil.
  // Si tiene éxito: setRegistered(true) muestra la pantalla de confirmación.
  // Si falla (ej: email ya registrado): mostramos el error via toast.
  // Nota: Supabase por diseño de seguridad puede devolver éxito aunque el email
  // ya exista — por eso también manejamos ese caso en el catch.
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

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await authService.signInWithGoogle()
    } catch (err) {
      toast({
        title: 'Error con Google',
        description: getAuthErrorMessage(err),
        variant: 'error',
      })
      setGoogleLoading(false)
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

          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Registrarse con Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">o con email</span>
            </div>
          </div>

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
