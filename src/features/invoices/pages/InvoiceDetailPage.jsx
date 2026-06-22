import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Edit, CheckCircle, Plus, Trash2, Loader2, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge'
import { useInvoice, useUpdateInvoiceStatus } from '../hooks/useInvoices'
import { useInvoicePayments, useRegisterPayment, useDeletePayment } from '../hooks/useInvoicePayments'
import { afipService } from '../services/afipService'
import { formatCurrency, formatDate, formatDateLong } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getComprobanteConfig } from '@/constants/comprobanteConfig'

// ── Schema de pago ────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  payment_method: z.enum(
    ['transfer', 'cash', 'check', 'credit_card', 'debit_card', 'crypto', 'other'],
    { errorMap: () => ({ message: 'Seleccioná un método de pago' }) }
  ),
  payment_date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
})

// ── Formulario de pago ────────────────────────────────────────────────────────
// Formulario de registro de pago parcial o total de una factura.
function PaymentForm({ invoiceId, totalAmount, totalPaid }) {
  const registerPayment = useRegisterPayment(invoiceId)
  const remaining = Math.max(0, totalAmount - totalPaid)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remaining > 0 ? remaining : '',
      payment_method: 'transfer',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

    // Registra el pago y resetea el formulario si tiene éxito.
    const onSubmit = async (data) => {
    await registerPayment.mutateAsync(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto <span className="text-red-500">*</span></Label>
          <Input type="number" step="0.01" min="0.01" {...register('amount')} />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Fecha <span className="text-red-500">*</span></Label>
          <Input type="date" {...register('payment_date')} />
          {errors.payment_date && <p className="text-xs text-red-500">{errors.payment_date.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Método de pago <span className="text-red-500">*</span></Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          {...register('payment_method')}
        >
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.payment_method && <p className="text-xs text-red-500">{errors.payment_method.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Notas</Label>
        <Input placeholder="Referencia de transferencia, cheque N°..." {...register('notes')} />
      </div>

      <Button type="submit" size="sm" className="w-full" disabled={registerPayment.isPending}>
        {registerPayment.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        <Plus className="h-3 w-3" /> Registrar pago
      </Button>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
// Página de detalle de una factura. Muestra partes, ítems, historial de pagos
// e información fiscal. Permite marcar como pagada, editar y validar el CAE con AFIP.
export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const updateStatus = useUpdateInvoiceStatus()
  const { data: payments = [], isLoading: paymentsLoading } = useInvoicePayments(id)
  const deletePayment = useDeletePayment(id)
  const [afipResult, setAfipResult] = useState(null)
  const [afipLoading, setAfipLoading] = useState(false)

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPending = Math.max(0, (invoice?.total_amount ?? 0) - totalPaid)

  // Llama a la Edge Function AFIP para validar el CAE de la factura activa.
  const handleValidateCae = async () => {
    if (!invoice?.cae) return
    setAfipLoading(true)
    try {
      const result = await afipService.validateCae(
        invoice.cae,
        invoice.cae_vencimiento,
        invoice.emisor_cuit
      )
      setAfipResult(result)
    } finally {
      setAfipLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Factura no encontrada</p>
        <Button variant="link" onClick={() => navigate('/invoices')}>Volver a facturas</Button>
      </div>
    )
  }

  const invoiceNumber = invoice.invoice_number ||
    `${String(invoice.punto_de_venta ?? 0).padStart(4, '0')}-${String(invoice.numero_comprobante ?? 0).padStart(8, '0')}`

  const config = getComprobanteConfig(invoice.tipo_comprobante)
  const tieneReceptor = config.muestraSeccionReceptor && (
    invoice.receptor_razon_social ||
    invoice.receptor_cuit ||
    invoice.receptor_condicion_iva ||
    invoice.receptor_domicilio ||
    invoice.clients?.name ||
    invoice.providers?.name
  )
  const muestraIVA = config.permiteIVA && (
    config.discriminaIVA ||
    (invoice.iva_105 ?? 0) > 0 ||
    (invoice.iva_21 ?? 0) > 0 ||
    (invoice.iva_27 ?? 0) > 0
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
              <Badge variant="outline" className="text-xs">
                {invoice.type === 'receivable' ? 'Cobrar' : 'Pagar'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{invoice.tipo_comprobante}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => updateStatus.mutate({ id: invoice.id, status: 'paid' })}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Marcar pagada
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Emisor y Receptor */}
          <Card>
            <CardHeader><CardTitle>Partes del comprobante</CardTitle></CardHeader>
            <CardContent className={`grid grid-cols-1 gap-6 text-sm ${tieneReceptor ? 'sm:grid-cols-2' : ''}`}>
              <div>
                <p className="font-semibold text-gray-700 mb-2">Emisor</p>
                <p className="font-medium">{invoice.emisor_razon_social || '-'}</p>
                <p className="text-gray-500">{invoice.emisor_cuit || '-'}</p>
                <p className="text-gray-500">{invoice.emisor_condicion_iva || '-'}</p>
                {invoice.emisor_domicilio && (
                  <p className="text-gray-400 text-xs mt-1">{invoice.emisor_domicilio}</p>
                )}
              </div>
              {tieneReceptor && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">
                    {config.esExportacion ? 'Destinatario' : 'Receptor'}
                  </p>
                  <p className="font-medium">{invoice.receptor_razon_social || invoice.clients?.name || invoice.providers?.name || '-'}</p>
                  <p className="text-gray-500">
                    {config.esExportacion
                      ? (invoice.receptor_id_impositivo || '-')
                      : (invoice.receptor_cuit || invoice.clients?.cuit || invoice.providers?.cuit || '-')
                    }
                  </p>
                  {invoice.receptor_condicion_iva && (
                    <p className="text-gray-500">{invoice.receptor_condicion_iva}</p>
                  )}
                  {invoice.receptor_domicilio && (
                    <p className="text-gray-400 text-xs mt-1">{invoice.receptor_domicilio}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ítems o importe total */}
          {config.permiteItems ? (
            <Card>
              <CardHeader><CardTitle>Ítems</CardTitle></CardHeader>
              <CardContent>
                {(invoice.invoice_items ?? []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-gray-500 font-medium">Descripción</th>
                          <th className="text-right py-2 text-gray-500 font-medium">Cant.</th>
                          <th className="text-right py-2 text-gray-500 font-medium">Precio unit.</th>
                          {muestraIVA && config.discriminaIVA && (
                            <th className="text-right py-2 text-gray-500 font-medium">IVA</th>
                          )}
                          <th className="text-right py-2 text-gray-500 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(invoice.invoice_items ?? []).map((item, i) => (
                          <tr key={item.id ?? i}>
                            <td className="py-2.5">{item.descripcion}</td>
                            <td className="py-2.5 text-right">{item.cantidad}</td>
                            <td className="py-2.5 text-right">{formatCurrency(item.precio_unitario)}</td>
                            {muestraIVA && config.discriminaIVA && (
                              <td className="py-2.5 text-right">{item.alicuota_iva}%</td>
                            )}
                            <td className="py-2.5 text-right font-medium">
                              {formatCurrency((item.subtotal_neto ?? 0) + (item.subtotal_iva ?? 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin ítems registrados</p>
                )}

                <Separator className="my-4" />

                <div className="flex flex-col items-end gap-1 text-sm">
                  {muestraIVA && config.discriminaIVA && (
                    <>
                      <div className="flex gap-8">
                        <span className="text-gray-500">Neto gravado</span>
                        <span className="w-32 text-right">{formatCurrency(invoice.neto_gravado)}</span>
                      </div>
                      {invoice.iva_105 > 0 && (
                        <div className="flex gap-8">
                          <span className="text-gray-500">IVA 10.5%</span>
                          <span className="w-32 text-right">{formatCurrency(invoice.iva_105)}</span>
                        </div>
                      )}
                      {invoice.iva_21 > 0 && (
                        <div className="flex gap-8">
                          <span className="text-gray-500">IVA 21%</span>
                          <span className="w-32 text-right">{formatCurrency(invoice.iva_21)}</span>
                        </div>
                      )}
                      {invoice.iva_27 > 0 && (
                        <div className="flex gap-8">
                          <span className="text-gray-500">IVA 27%</span>
                          <span className="w-32 text-right">{formatCurrency(invoice.iva_27)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator className="w-52 my-1" />
                  <div className="flex gap-8">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900 w-32 text-right text-base">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Importe total</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
              </CardContent>
            </Card>
          )}

          {/* Pagos — Req 5.4 */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumen de saldo */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Total factura</p>
                  <p className="font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Pagado</p>
                  <p className="font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${totalPending > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className="text-gray-500 text-xs mb-1">Pendiente</p>
                  <p className={`font-bold ${totalPending > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {formatCurrency(totalPending)}
                  </p>
                </div>
              </div>

              {/* Historial de pagos */}
              {paymentsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : payments.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial</p>
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method} · {formatDate(p.payment_date)}
                        </p>
                        {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        onClick={() => deletePayment.mutate(p.id)}
                        disabled={deletePayment.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">Sin pagos registrados</p>
              )}

              {/* Formulario de nuevo pago (solo si no está pagada/cancelada) */}
              {!['paid', 'cancelled'].includes(invoice.status) && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registrar pago</p>
                  <PaymentForm
                    invoiceId={id}
                    totalAmount={invoice.total_amount}
                    totalPaid={totalPaid}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Información fiscal</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-medium">{invoice.tipo_comprobante}</p>
              </div>
              <div>
                <p className="text-gray-500">Punto de venta</p>
                <p className="font-medium">{String(invoice.punto_de_venta ?? '-').padStart(4, '0')}</p>
              </div>
              <div>
                <p className="text-gray-500">Número</p>
                <p className="font-medium">{String(invoice.numero_comprobante ?? '-').padStart(8, '0')}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha de emisión</p>
                <p className="font-medium">{formatDateLong(invoice.fecha_emision)}</p>
              </div>
              {invoice.fecha_vencimiento && (
                <div>
                  <p className="text-gray-500">Vencimiento</p>
                  <p className="font-medium">{formatDateLong(invoice.fecha_vencimiento)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Condición de pago</p>
                <p className="font-medium capitalize">{invoice.condicion_pago?.replace('_', ' ') ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Moneda</p>
                <p className="font-medium">{invoice.moneda ?? 'ARS'}</p>
              </div>
              {invoice.cae && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-500">CAE</p>
                    <p className="font-medium font-mono text-xs">{invoice.cae}</p>
                  </div>
                  {invoice.cae_vencimiento && (
                    <div>
                      <p className="text-gray-500">Venc. CAE</p>
                      <p className="font-medium">{formatDate(invoice.cae_vencimiento)}</p>
                    </div>
                  )}
                </>
              )}
              <Separator />
              <div>
                <p className="text-gray-500">Estado</p>
                <div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Validación AFIP — Req 15.4 */}
          {invoice.cae && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" /> Validación AFIP
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {/* Estado actual */}
                {invoice.afip_status && !afipResult && (
                  <div className="text-sm">
                    <p className="text-gray-500">Estado guardado</p>
                    <p className="font-medium capitalize">{invoice.afip_status.replace('_', ' ')}</p>
                  </div>
                )}

                {/* Resultado de la última validación */}
                {afipResult && (
                  <div className={cn(
                    'rounded-lg p-3 text-sm',
                    afipResult.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  )}>
                    <div className="flex items-center gap-2 font-medium mb-1">
                      {afipResult.isValid
                        ? <ShieldCheck className="h-4 w-4" />
                        : <ShieldX className="h-4 w-4" />
                      }
                      {afipResult.isValid ? 'CAE válido' : 'CAE inválido'}
                    </div>
                    <p className="text-xs opacity-80">{afipResult.message}</p>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleValidateCae}
                  disabled={afipLoading}
                >
                  {afipLoading
                    ? <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Validando...</>
                    : <><ShieldAlert className="h-3 w-3 mr-2" /> Validar CAE</>
                  }
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
