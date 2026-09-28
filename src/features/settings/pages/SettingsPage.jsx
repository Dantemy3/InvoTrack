import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Loader2, User, Building2, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/context/AuthContext'
import { authService } from '@/features/auth/services/authService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import CompanyProfileForm from '@/features/companies/components/CompanyProfileForm'
import {
  companyFiscalSchema,
  buildCompanyPayload,
  fiscalValuesFromCompany,
  ENTITY_TYPE_VALUES,
} from '@/features/companies/schemas/companySchemas'
import { missingCompanyProfileFields } from '@/features/companies/lib/companyParty'
import { useToast } from '@/components/ui/toast'

const ENTITY_TYPE_LABELS = {
  empresa: 'Empresa',
  persona_humana: 'Persona humana',
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { company } = useCompany()
  const { toast } = useToast()
  const [passwordLoading, setPasswordLoading] = useState(false)

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: profileSubmitting } } = useForm({
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      email: user?.email || '',
    },
  })

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword } = useForm()

  // ── Ficha fiscal de la empresa ──────────────────────────────────────────────
  // Mismo schema que el onboarding: si el alta está completa, acá se mantiene.
  const updateCompany = useUpdateCompany(company?.id)
  const {
    register: regCompany,
    handleSubmit: handleCompany,
    watch: watchCompany,
    getValues: getCompanyValues,
    setValue: setCompanyValue,
    reset: resetCompany,
    formState: { errors: companyErrors, isSubmitting: companySubmitting },
  } = useForm({
    resolver: zodResolver(companyFiscalSchema),
    mode: 'onTouched',
    defaultValues: fiscalValuesFromCompany(company),
  })

  const entityType = watchCompany('entity_type')
  const faltantes = missingCompanyProfileFields(company)

  const onCompanySubmit = handleCompany(async (data) => {
    try {
      await updateCompany.mutateAsync({ id: company?.id, ...buildCompanyPayload(data) })
    } catch (err) {
      console.error('Error al guardar la empresa:', err.message)
    }
  })

  const onProfileSubmit = async (data) => {
    try {
      await authService.updateProfile(data.full_name)
      toast({ title: 'Perfil actualizado', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' })
    }
  }

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'error' })
      return
    }
    setPasswordLoading(true)
    try {
      await authService.updatePassword(data.newPassword)
      toast({ title: 'Contraseña actualizada', variant: 'success' })
      resetPassword()
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Cambiar el tipo de emisor ajusta la condición fiscal a una válida.
  const handleEntityChange = (value) => {
    setCompanyValue('entity_type', value, { shouldValidate: true })
    const actual = getCompanyValues('tax_condition')
    if (value === 'persona_humana' && actual !== 'MO' && actual !== 'CF') {
      setCompanyValue('tax_condition', 'MO', { shouldValidate: true })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-400/80">// preferencias</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administrá tu cuenta y los datos de tu empresa</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Perfil</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="h-3.5 w-3.5 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1.5" />Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>Tu información de cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nombre completo</Label>
                  <Input {...regProfile('full_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" disabled {...regProfile('email')} />
                  <p className="text-xs text-gray-400">El email no se puede cambiar</p>
                </div>
                <Button type="submit" disabled={profileSubmitting}>
                  {profileSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <div className="space-y-4">
            {faltantes.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Te falta completar: <strong>{faltantes.join(', ')}</strong>.
                  Sin esos datos no se puede emitir un comprobante válido.
                </span>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Datos de la empresa</CardTitle>
                <CardDescription>
                  Se autocompletan como emisor en las facturas que emitas y como
                  receptor en las que te hagan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onCompanySubmit} className="space-y-6">

                  <div className="space-y-1.5">
                    <Label>Tipo de emisor</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ENTITY_TYPE_VALUES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleEntityChange(value)}
                          className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                            entityType === value
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-medium'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {ENTITY_TYPE_LABELS[value]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CompanyProfileForm
                    register={regCompany}
                    errors={companyErrors}
                    entityType={entityType}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetCompany(fiscalValuesFromCompany(company))}
                    >
                      Descartar cambios
                    </Button>
                    <Button type="submit" className="flex-1" disabled={companySubmitting || updateCompany.isPending}>
                      {companySubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Guardar empresa
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400">
              ¿Necesitás cambiar de empresa? Usá el selector de la barra superior.{' '}
              <Link to="/invoices/new" className="text-blue-500 hover:underline">Crear una factura</Link>{' '}
              para ver los datos autocompletados.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>Actualizá tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nueva contraseña</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...regPassword('newPassword')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar contraseña</Label>
                  <Input type="password" placeholder="Repetí la contraseña" {...regPassword('confirmPassword')} />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Actualizar contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
