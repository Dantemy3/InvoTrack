import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp, Loader2, Building2 } from 'lucide-react'
import { cuitSchema } from '@/features/auth/schemas/authSchemas'
import { companyService } from '@/features/companies/services/companyService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Schema de validación ──────────────────────────────────────────────────────
const onboardingSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  cuit: cuitSchema.or(z.literal('')).optional(),
  address: z.string().optional(),
  tax_condition: z.enum(['RI', 'MO', 'EX', 'CF', 'RS'], {
    errorMap: () => ({ message: 'Seleccioná una condición fiscal' }),
  }),
})

// ── Opciones de condición fiscal ──────────────────────────────────────────────
const TAX_CONDITIONS = [
  { value: 'RI', label: 'Responsable Inscripto' },
  { value: 'MO', label: 'Monotributista' },
  { value: 'EX', label: 'Exento' },
  { value: 'CF', label: 'Consumidor Final' },
  { value: 'RS', label: 'Responsable Sustituto' },
]

// ── Componente ────────────────────────────────────────────────────────────────
// Página de onboarding: permite al usuario crear su primera empresa.
// Tras crear la empresa, recarga el CompanyContext y navega al dashboard.
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refetch } = useCompany()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { tax_condition: 'RI' },
  })

    // Crea la empresa en Supabase, recarga el contexto y redirige al dashboard.
    const onSubmit = async (data) => {
    setServerError(null)
    try {
      // Limpiar campos opcionales vacíos
      const payload = {
        name: data.name,
        tax_condition: data.tax_condition,
        ...(data.cuit ? { cuit: data.cuit } : {}),
        ...(data.address ? { address: data.address } : {}),
      }

      await companyService.create(payload, user.id)
      await refetch()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err?.message ?? 'Ocurrió un error al crear la empresa. Intentá de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">InvoTrack</span>
          </div>
          <p className="text-gray-500 text-sm">Gestión de facturas para PyMEs</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Creá tu empresa</h1>
              <p className="text-sm text-gray-500">Completá los datos para empezar</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nombre de la empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Mi Empresa S.A."
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* CUIT */}
            <div className="space-y-1.5">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                placeholder="20-12345678-9"
                {...register('cuit')}
              />
              {errors.cuit && (
                <p className="text-xs text-red-500">{errors.cuit.message}</p>
              )}
              <p className="text-xs text-gray-400">Formato: XX-XXXXXXXX-X</p>
            </div>

            {/* Condición fiscal */}
            <div className="space-y-1.5">
              <Label htmlFor="tax_condition">
                Condición fiscal <span className="text-red-500">*</span>
              </Label>
              <select
                id="tax_condition"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('tax_condition')}
              >
                {TAX_CONDITIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.tax_condition && (
                <p className="text-xs text-red-500">{errors.tax_condition.message}</p>
              )}
            </div>

            {/* Domicilio */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Domicilio</Label>
              <Input
                id="address"
                placeholder="Av. Corrientes 1234, CABA"
                {...register('address')}
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear empresa y continuar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Podés actualizar estos datos más adelante desde Configuración.
        </p>
      </div>
    </div>
  )
}
