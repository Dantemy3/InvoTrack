import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Zap, Loader2, Building2, User, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import {
  companyFiscalSchema,
  buildCompanyPayload,
  ENTITY_TYPES,
  PERSONA_HUMANA_TAX_CONDITIONS,
  COMPANY_TAX_CONDITIONS,
} from '@/features/companies/schemas/companySchemas'
import CompanyProfileForm from '@/features/companies/components/CompanyProfileForm'
import { companyService } from '@/features/companies/services/companyService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button } from '@/components/ui/button'

const STEP_ENTITY = 1
const STEP_FISCAL = 2

const ENTITY_ICONS = { empresa: Building2, persona_humana: User }

// ── Componente ────────────────────────────────────────────────────────────────
// Onboarding: pide el tipo de emisor y después la ficha fiscal completa.
// La ficha fiscal es la que después se autocompleta como emisor (o receptor)
// en cada comprobante, así que se pide una sola vez acá.
//
// Paso 1: ¿emitís como empresa o como persona humana?
// Paso 2: razón social, CUIT, condición IVA, domicilio fiscal y contacto.
// ──────────────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refetch } = useCompany()
  const [serverError, setServerError] = useState(null)

  // Paso 1 vive fuera del form: es una decisión de navegación, no un campo
  // que el usuario pueda editar mientras escribe la ficha fiscal.
  const [step, setStep] = useState(STEP_ENTITY)
  const [entityType, setEntityType] = useState('empresa')

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyFiscalSchema),
    mode: 'onTouched',
    defaultValues: {
      entity_type: 'empresa',
      name: '',
      cuit: '',
      tax_condition: 'RI',
      activity: '',
      street: '',
      street_number: '',
      city: '',
      province: '',
      phone: '',
      email: '',
      default_sale_point: 1,
    },
  })

  // Al cambiar el tipo de emisor se ajusta la condición fiscal por defecto,
  // porque una persona humana casi siempre es Monotributista o Consumidor Final.
  const handleSelectEntity = (value) => {
    setEntityType(value)
    setValue('entity_type', value, { shouldValidate: true })

    const actual = getValues('tax_condition')
    const permitidas = value === 'empresa' ? COMPANY_TAX_CONDITIONS : PERSONA_HUMANA_TAX_CONDITIONS
    if (!permitidas.some((c) => c.value === actual)) {
      setValue('tax_condition', permitidas[0].value, { shouldValidate: true })
    }
  }

  // Crea la empresa en Supabase, recarga el contexto y redirige al dashboard.
  // El paso 1 no tiene campos, así que un submit accidental solo avanza de paso.
  const onSubmit = handleSubmit(async (data) => {
    if (step !== STEP_FISCAL) {
      setStep(STEP_FISCAL)
      return
    }
    setServerError(null)
    try {
      await companyService.create(buildCompanyPayload(data), user.id)
      await refetch()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err?.message ?? 'Ocurrió un error al crear la empresa. Intentá de nuevo.')
    }
  })

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="w-full max-w-2xl relative">

        {/* Logo */}
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

        {/* Card */}
        <div className="bg-panel rounded-2xl border border-gray-100 p-8 shadow-2xl shadow-black/40 scan-frame">

          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 ring-1 ring-inset ring-blue-500/30 flex items-center justify-center flex-shrink-0">
              {step === STEP_ENTITY ? <Building2 className="h-5 w-5 text-blue-400" /> : <Check className="h-5 w-5 text-emerald-400" />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {step === STEP_ENTITY ? 'Creá tu empresa' : 'Datos fiscales'}
              </h1>
              <p className="text-sm text-gray-500">
                {step === STEP_ENTITY
                  ? 'Paso 1 de 2 — con esto sabemos qué datos pedirte'
                  : 'Paso 2 de 2 — se autocompletan en cada factura'}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6" aria-hidden="true">
            {[STEP_ENTITY, STEP_FISCAL].map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                    step >= n
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {step > n ? <Check className="h-3.5 w-3.5" /> : n}
                </span>
                {n === STEP_ENTITY && <span className="h-px flex-1 bg-gray-200" />}
              </div>
            ))}
          </div>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-500">
              {serverError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">

            {/* ── Paso 1: tipo de emisor ───────────────────────────────── */}
            {step === STEP_ENTITY && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  ¿A nombre de quién vas a emitir los comprobantes?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ENTITY_TYPES.map(({ value, label, description }) => {
                    const Icon = ENTITY_ICONS[value]
                    const selected = entityType === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleSelectEntity(value)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                            : 'border-gray-200 bg-gray-100/40 hover:border-gray-300 hover:bg-gray-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`h-4 w-4 ${selected ? 'text-blue-400' : 'text-gray-400'}`} />
                          <span className="text-sm font-semibold text-gray-900">{label}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                      </button>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep(STEP_FISCAL)}
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ── Paso 2: ficha fiscal ─────────────────────────────────── */}
            {step === STEP_FISCAL && (
              <>
                <CompanyProfileForm
                  register={register}
                  errors={errors}
                  entityType={entityType}
                />

                <p className="text-xs text-gray-400">
                  Estos datos son los que aparecen como emisor en las facturas que
                  emitas, y como receptor en las que te hagan. Podés actualizarlos
                  cuando quieras desde Configuración.
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(STEP_ENTITY)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Crear empresa y continuar
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {step === STEP_ENTITY && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Ya tenés cuenta. Solo falta cargar los datos fiscales.
          </p>
        )}
      </div>
    </div>
  )
}
