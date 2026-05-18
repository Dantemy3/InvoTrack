import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { invoiceSchema } from '../schemas/invoiceSchemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { INVOICE_TYPES, IVA_RATES, INVOICE_STATUS, INVOICE_FLOW_TYPE_LABELS } from '@/lib/constants'

const defaultItem = { description: '', quantity: 1, unit_price: 0, iva_rate: 21, subtotal: 0 }

export default function InvoiceForm({ defaultValues, onSubmit, isLoading, clients = [], providers = [] }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues || {
      invoice_number: '',
      invoice_type: 'Factura B',
      type: 'receivable',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pending',
      currency: 'ARS',
      notes: '',
      items: [defaultItem],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const flowType = watch('type')

  const subtotal = items?.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return acc + qty * price
  }, 0) || 0

  const totalIva = items?.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    const rate = parseFloat(item.iva_rate) || 0
    return acc + (qty * price * rate) / 100
  }, 0) || 0

  const total = subtotal + totalIva

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos generales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de la factura</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Número de factura</Label>
            <Input placeholder="0001-00000001" {...register('invoice_number')} />
            {errors.invoice_number && <p className="text-xs text-red-500">{errors.invoice_number.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Controller
              name="invoice_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(INVOICE_TYPES).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de emisión</Label>
            <Input type="date" {...register('issue_date')} />
            {errors.issue_date && <p className="text-xs text-red-500">{errors.issue_date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de vencimiento</Label>
            <Input type="date" {...register('due_date')} />
          </div>

          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {providers.length > 0 && (
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <Controller
                name="provider_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ítems */}
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
              <div className="col-span-12 sm:col-span-5">
                <Input placeholder="Descripción" {...register(`items.${index}.description`)} />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.items[index].description.message}</p>
                )}
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input type="number" placeholder="Cant." step="0.01" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input type="number" placeholder="Precio" step="0.01" {...register(`items.${index}.unit_price`)} />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Controller
                  name={`items.${index}.iva_rate`}
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value)}>
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

          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium w-32 text-right">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-500">IVA</span>
              <span className="font-medium w-32 text-right">{formatCurrency(totalIva)}</span>
            </div>
            <Separator className="w-48 my-1" />
            <div className="flex gap-8">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 w-32 text-right text-base">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
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
