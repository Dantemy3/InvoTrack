import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Printer, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge'
import { useInvoice, useUpdateInvoiceStatus } from '../hooks/useInvoices'
import { formatCurrency, formatDateLong } from '@/lib/utils'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const updateStatus = useUpdateInvoiceStatus()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{invoice.invoice_type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'pending' && (
            <Button
              variant="success"
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
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client/Provider */}
          <Card>
            <CardHeader><CardTitle>Datos del cliente / proveedor</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Nombre</p>
                <p className="font-medium">{invoice.client?.name || invoice.provider?.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">CUIT</p>
                <p className="font-medium">{invoice.client?.cuit || invoice.provider?.cuit || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader><CardTitle>Ítems</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Descripción</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cant.</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Precio</th>
                    <th className="text-right py-2 text-gray-500 font-medium">IVA</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right">{item.quantity}</td>
                      <td className="py-2.5 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2.5 text-right">{item.iva_rate}%</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Separator className="my-4" />

              <div className="flex flex-col items-end gap-1 text-sm">
                <div className="flex gap-8">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="w-28 text-right">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-gray-500">IVA</span>
                  <span className="w-28 text-right">{formatCurrency(invoice.total_iva)}</span>
                </div>
                <Separator className="w-44 my-1" />
                <div className="flex gap-8">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 w-28 text-right text-base">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>
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
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Fecha de emisión</p>
                <p className="font-medium">{formatDateLong(invoice.issue_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-gray-500">Vencimiento</p>
                  <p className="font-medium">{formatDateLong(invoice.due_date)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Moneda</p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-gray-500">Estado</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
