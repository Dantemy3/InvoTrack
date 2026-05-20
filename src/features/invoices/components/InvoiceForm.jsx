import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { invoiceSchema, TIPOS_COMPROBANTE, TAX_CONDITION_VALUES } from '../schemas/invoiceSchemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, calculateInvoiceTotals } from '@/lib/utils'
import { IVA_RATES } from '@/lib/constants'

// ── Valores por defecto ───────────────────────────────────────────────────────
const defaultItem = {
  descripcion: '',
  cantidad: 1,
  unidad: '',
  precio_unitario: 0,
  alicuota_iva: 21,
}

const TAX_CONDITION_LABELS = {
  RI: 'Responsable Inscripto',
  MO: 'Monotributista',
  EX: 'Exento',
  CF: 'Consumidor Final',
  RS: 'Responsable Sustituto',
}

// ── Componente ────────────────────────────────────────────────────────────────
/**
 * Formulario completo de factura con todos los campos fiscales argentinos.
 * Req 5.9, 5.10, 5.11, 5.12
 *
 * @param {{ defaultValues?: object, onSubmit: Function, isLoading?: boolean, clients?: object[], providers?: object[] }} props
 */
export default function InvoiceForm({ defaultValues, onSubmit, isLoading, clients = [], providers = [] }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues ?? {
      tipo_comprobante: 'Factura B',
      type: 'receivable',
      punto_de_venta: 1,
      numero_comprobante: 1,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      condicion_pago: 'contado',
      moneda: 'ARS',
      tipo_cambio: 1,
      emisor_condicion_iva: 'RI',
      receptor_condicion_iva: 'CF',
      neto_gravado: 0,
      neto_no_gravado: 0,
      exento: 0,
      iva_105: 0,
      iva_21: 0,
      iva_27: 0,
      otros_tributos: 0,
      total_amount: 0,
      items: [defaultItem],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items') ?? []

  // Calcular totales en tiempo real
  const totals = calculateInvoiceTotals(items)

  // Handler que inyecta los totales calculados antes de llamar al onSubmit del padre
  const handleFormSubmit = (data) => {
    const enriched = calculateInvoiceTotals(data.items)
    onSubmit({
      ...data,
      neto_gravado: enriched.neto_gravado,
      iva_105: enriched.iva_105,
      iva_21: enriched.iva_21,
      iva_27: enriched.iva_27,
      total_amount: enriched.total_amount,
      items: enriched.items,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* ── Tipo y flujo ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Tipo de comprobante</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="space-y-1.5">
            <Label>Tipo de comprobante <span className="text-red-500">*</span></Label>
            <Controller name="tipo_comprobante" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.tipo_comprobante && <p className="text-xs text-red-500">{errors.tipo_comprobante.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Flujo <span className="text-red-500">*</span></Label>
            <Controller name="type" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receivable">Cobrar (ingreso)</SelectItem>
                  <SelectItem value="payable">Pagar (gasto)</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Condición de pago <span className="text-red-500">*</span></Label>
            <Controller name="condicion_pago" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="cuenta_corriente">Cuenta corriente</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Punto de venta <span className="text-red-500">*</span></Label>
            <Input type="number" min={1} max={99999} {...register('punto_de_venta')} />
            {errors.punto_de_venta && <p className="text-xs text-red-500">{errors.punto_de_venta.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Número de comprobante <span className="text-red-500">*</span></Label>
            <Input type="number" min={1} {...register('numero_comprobante')} />
            {errors.numero_comprobante && <p className="text-xs text-red-500">{errors.numero_comprobante.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de emisión <span className="text-red-500">*</span></Label>
            <Input type="date" {...register('fecha_emision')} />
            {errors.fecha_emision && <p className="text-xs text-red-500">{errors.fecha_emision.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de vencimiento</Label>
            <Input type="date" {...register('fecha_vencimiento')} />
          </div>

          <div className="space-y-1.5">
            <Label>CAE</Label>
            <Input placeholder="12345678901234" maxLength={14} {...register('cae')} />
          </div>

          <div className="space-y-1.5">
            <Label>Vencimiento CAE</Label>
            <Input type="date" {...register('cae_vencimiento')} />
          </div>
        </CardContent>
      </Card>

      {/* ── Emisor ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Datos del emisor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Razón social</Label>
            <Input placeholder="Empresa S.A." {...register('emisor_razon_social')} />
          </div>
          <div className="space-y-1.5">
            <Label>CUIT</Label>
            <Input placeholder="20-12345678-9" {...register('emisor_cuit')} />
            {errors.emisor_cuit && <p className="text-xs text-red-500">{errors.emisor_cuit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Condición IVA</Label>
            <Controller name="emisor_condicion_iva" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {TAX_CONDITION_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>{TAX_CONDITION_LABELS[v]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input placeholder="Av. Corrientes 1234, CABA" {...register('emisor_domicilio')} />
          </div>
        </CardContent>
      </Card>

      {/* ── Receptor ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Datos del receptor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Razón social</Label>
            <Input placeholder="Cliente S.R.L." {...register('receptor_razon_social')} />
          </div>
          <div className="space-y-1.5">
            <Label>CUIT</Label>
            <Input placeholder="30-98765432-1" {...register('receptor_cuit')} />
            {errors.receptor_cuit && <p className="text-xs text-red-500">{errors.receptor_cuit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Condición IVA</Label>
            <Controller name="receptor_condicion_iva" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {TAX_CONDITION_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>{TAX_CONDITION_LABELS[v]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input placeholder="Av. Santa Fe 5678, CABA" {...register('receptor_domicilio')} />
          </div>

          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label>Vincular cliente</Label>
              <Controller name="client_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
          )}

          {providers.length > 0 && (
            <div className="space-y-1.5">
              <Label>Vincular proveedor</Label>
              <Controller name="provider_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ítems ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ítems</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append(defaultItem)}>
            <Plus className="h-4 w-4 mr-1" /> Agregar ítem
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 sm:col-span-4">
                <Input placeholder="Descripción" {...register(`items.${index}.descripcion`)} />
                {errors.items?.[index]?.descripcion && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.items[index].descripcion.message}</p>
                )}
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input type="number" placeholder="Cant." step="0.0001" min="0" {...register(`items.${index}.cantidad`)} />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input placeholder="Unidad" {...register(`items.${index}.unidad`)} />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input type="number" placeholder="Precio" step="0.01" min="0" {...register(`items.${index}.precio_unitario`)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Controller
                  name={`items.${index}.alicuota_iva`}
                  control={control}
                  render={({ field: f }) => (
                    <Select onValueChange={(v) => f.onChange(parseFloat(v))} value={String(f.value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {IVA_RATES.map((r) => (
                          <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          {/* Totales fiscales */}
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-gray-500">Neto gravado</span>
              <span className="font-medium w-36 text-right">{formatCurrency(totals.neto_gravado)}</span>
            </div>
            {totals.iva_105 > 0 && (
              <div className="flex gap-8">
                <span className="text-gray-500">IVA 10.5%</span>
                <span className="font-medium w-36 text-right">{formatCurrency(totals.iva_105)}</span>
              </div>
            )}
            {totals.iva_21 > 0 && (
              <div className="flex gap-8">
                <span className="text-gray-500">IVA 21%</span>
                <span className="font-medium w-36 text-right">{formatCurrency(totals.iva_21)}</span>
              </div>
            )}
            {totals.iva_27 > 0 && (
              <div className="flex gap-8">
                <span className="text-gray-500">IVA 27%</span>
                <span className="font-medium w-36 text-right">{formatCurrency(totals.iva_27)}</span>
              </div>
            )}
            <Separator className="w-56 my-1" />
            <div className="flex gap-8">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 w-36 text-right text-base">{formatCurrency(totals.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Notas ────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1.5">
            <Label>Notas / Observaciones</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              placeholder="Condiciones de pago, observaciones..."
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar factura
        </Button>
      </div>
    </form>
  )
}
