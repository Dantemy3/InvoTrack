import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Zap, CheckCircle, Building2, User } from 'lucide-react'
import { registrationSchema } from '@/features/auth/schemas/registrationSchemas'
import { registrationMetadata } from '@/features/auth/lib/registrationCompany'
import { authService } from '@/features/auth/services/authService'
import ResendConfirmation from '@/features/auth/components/ResendConfirmation'
import CompanyProfileForm from '@/features/companies/components/CompanyProfileForm'
import {
  ENTITY_TYPES,
  COMPANY_TAX_CONDITIONS,
  PERSONA_HUMANA_TAX_CONDITIONS,
} from '@/features/companies/schemas/companySchemas'
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
//  1. El usuario completa los datos de acceso y la ficha fiscal de la empresa.
//  2. Zod valida ambas partes antes de enviar.
//  3. authService.signUpWithEmail() llama a supabase.auth.signUp().
//  4. Supabase conserva la ficha fiscal en la metadata mientras se confirma el email.
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
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [entityType, setEntityType] = useState('empresa')

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      company: {
        entity_type: 'empresa',
        tax_condition: 'RI',
        default_sale_point: 1,
        province: '',
      },
    },
  })

  const handleSelectEntity = (value) => {
    setEntityType(value)
    setValue('company.entity_type', value, { shouldValidate: true })
    const conditions = value === 'empresa' ? COMPANY_TAX_CONDITIONS : PERSONA_HUMANA_TAX_CONDITIONS
    if (!conditions.some(({ value: condition }) => condition === getValues('company.tax_condition'))) {
      setValue('company.tax_condition', conditions[0].value, { shouldValidate: true })
    }
  }

  // Paso 1b — Registrar el usuario
  // Se llama solo cuando todos los campos pasan la validación de Zod.
  // authService.signUpWithEmail() llama a supabase.auth.signUp() con el email,
  // contraseña y ficha fiscal como metadata temporal del perfil.
  // Si tiene éxito: setRegistered(true) muestra la pantalla de confirmación.
  // Si falla (ej: email ya registrado): mostramos el error via toast.
  // Nota: Supabase por diseño de seguridad puede devolver éxito aunque el email
  // ya exista — por eso también manejamos ese caso en el catch.
  const onSubmit = async (data) => {
    try {
      const result = await authService.signUpWithEmail(
        data.account.email,
        data.account.password,
        registrationMetadata(data)
      )
      setNeedsConfirmation(!result.session)
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
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-[0_0_24px_rgba(233,106,74,0.35)]">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div className="text-left leading-tight">
                <span className="block font-display text-2xl font-bold text-gray-900 tracking-tight">InvoTrack</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-blue-400/80">control financiero</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Gestión de facturas para PyMEs</p>
          </div>

          <div className="bg-panel rounded-2xl border border-gray-100 p-8 text-center shadow-2xl shadow-black/40 scan-frame">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-xl" />
                <CheckCircle className="h-14 w-14 text-emerald-500 relative" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{needsConfirmation ? 'Confirmá tu email' : '¡Cuenta creada!'}</h1>
            <p className="text-sm text-gray-500 mb-6">
              {needsConfirmation ? 'Recibimos la solicitud para el email ' : 'Tu cuenta fue creada con el email '}
              <span className="font-medium text-gray-700">{getValues('account.email')}</span>.
              {needsConfirmation && ' Revisá tu bandeja de entrada y spam. Necesitás confirmar el correo antes de iniciar sesión. Si ya tenías una cuenta, intentá ingresar con tus credenciales.'}
              Al iniciar sesión terminaremos de crear tu empresa con los datos que cargaste.
            </p>
            {needsConfirmation && (
              <div className="mb-4">
                <ResendConfirmation email={getValues('account.email')} />
              </div>
            )}
            <Link
              to="/login"
              className="inline-block w-full text-center bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 shadow-[0_4px_18px_rgba(233,106,74,0.28)] transition-all"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-start justify-center px-4 py-8 overflow-x-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="w-full max-w-2xl relative my-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-[0_0_24px_rgba(233,106,74,0.35)]">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div className="text-left leading-tight">
              <span className="block font-display text-2xl font-bold text-gray-900 tracking-tight">InvoTrack</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-blue-400/80">control financiero</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Gestión de facturas para PyMEs</p>
        </div>

        <div className="bg-panel rounded-2xl border border-gray-100 p-8 shadow-2xl shadow-black/40 scan-frame">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mb-6">Creá tu acceso y cargá los datos fiscales que aparecerán en tus facturas.</p>

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
          <p className="text-xs text-gray-500 mb-4">Con Google completarás la ficha fiscal después de iniciar sesión.</p>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-panel px-2 text-gray-500">o con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" placeholder="Juan García" {...register('account.fullName')} />
              {errors.account?.fullName && <p className="text-xs text-red-500">{errors.account.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" {...register('account.email')} />
              {errors.account?.email && <p className="text-xs text-red-500">{errors.account.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  {...register('account.password')}
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
              {errors.account?.password && <p className="text-xs text-red-500">{errors.account.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repetí tu contraseña"
                {...register('account.confirmPassword')}
              />
              {errors.account?.confirmPassword && (
                <p className="text-xs text-red-500">{errors.account.confirmPassword.message}</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Datos de tu empresa</h2>
                <p className="text-sm text-gray-500">Es la misma ficha que podrás editar en Configuración → Empresa.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ENTITY_TYPES.map(({ value, label, description }) => {
                  const Icon = value === 'empresa' ? Building2 : User
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSelectEntity(value)}
                      aria-pressed={entityType === value}
                      className={`text-left p-4 rounded-xl border transition-colors ${entityType === value
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Icon className="h-4 w-4 text-blue-500" />{label}
                      </span>
                      <span className="block mt-1 text-xs text-gray-500">{description}</span>
                    </button>
                  )
                })}
              </div>
              <CompanyProfileForm
                register={register}
                errors={errors.company}
                entityType={entityType}
                namePrefix="company"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta y guardar datos de empresa
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
