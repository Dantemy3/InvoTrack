import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clientSchema } from '@/features/clients/schemas/clientSchemas'
import { providerSchema } from '@/features/providers/schemas/providerSchemas'
import { useCreateClient } from '@/features/clients/hooks/useClients'
import { useCreateProvider } from '@/features/providers/hooks/useProviders'
import { COMPANY_TAX_CONDITIONS } from '@/features/companies/schemas/companySchemas'

const SELECT_CLASS =
  'flex h-9 w-full rounded-lg border border-gray-200 bg-gray-100/60 px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent'

const EMPTY = {
  name: '',
  cuit: '',
  tax_condition: 'RI',
  address: '',
  email: '',
  phone: '',
}

/**
 * Alta rápida de la contraparte desde la propia factura.
 *
 * Si no hay clientes (o proveedores) cargados, el usuario no debería estar
 * obligado a salir de la pantalla: se crea el registro acá, se guarda con
 * sus datos fiscales y queda vinculado a la factura vía `client_id` /
 * `provider_id`.
 *
 * @param {object} props
 * @param {'client'|'provider'} props.kind
 * @param {string} props.companyId
 * @param {boolean} props.open
 * @param {Function} props.onOpenChange
 * @param {Function} props.onCreated — recibe el registro creado
 */
export default function QuickCreatePartyDialog({ kind, companyId, open, onOpenChange, onCreated }) {
  const esCliente = kind === 'client'
  const createClient = useCreateClient()
  const createProvider = useCreateProvider()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esCliente ? clientSchema : providerSchema),
    defaultValues: { ...EMPTY, tax_condition: 'RI' },
  })

  const mutation = esCliente ? createClient : createProvider
  const noun = esCliente ? 'cliente' : 'proveedor'

  const onSubmit = async (data) => {
    setServerError(null)

    // Se descartan los campos vacíos: la tabla no los necesita.
    const payload = { company_id: companyId }
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.trim()) payload[key] = value.trim()
    }
    if (!payload.tax_condition) payload.tax_condition = 'RI'

    try {
      const created = await mutation.mutateAsync(payload)
      reset({ ...EMPTY, tax_condition: 'RI' })
      onOpenChange(false)
      onCreated?.(created)
    } catch (err) {
      setServerError(err?.message ?? `No se pudo crear el ${noun}.`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-500" /> Nuevo {noun}
            </span>
          </DialogTitle>
          <DialogDescription>
            Se guarda con estos datos y queda vinculado a la factura. Podés
            completarlo más adelante desde la sección de {noun}s.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-500">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre o razón social <span className="text-red-500">*</span></Label>
            <Input placeholder={esCliente ? 'Cliente Demo S.R.L.' : 'Proveedor Demo S.R.L.'} {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CUIT</Label>
              <Input placeholder="30-12345678-9" {...register('cuit')} />
              {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Condición fiscal</Label>
              <select className={SELECT_CLASS} {...register('tax_condition')}>
                {COMPANY_TAX_CONDITIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.tax_condition && <p className="text-xs text-red-500">{errors.tax_condition.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input placeholder="Av. Santa Fe 5678, CABA" {...register('address')} />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="contacto@empresa.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="11-1234-5678" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear {noun} y usar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
