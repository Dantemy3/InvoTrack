import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import InvoiceForm from '../components/InvoiceForm'
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '../hooks/useInvoices'

/**
 * Página de creación y edición de facturas.
 * - Sin `id` en params: modo creación
 * - Con `id` en params: modo edición (carga la factura existente)
 *
 * Los totales fiscales los calcula InvoiceForm antes de llamar a onSubmit.
 * Req 5.9, 5.10, 5.11, 5.12
 */
export default function NewInvoicePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  // Solo carga la factura existente en modo edición
  const { data: existingInvoice, isLoading: isLoadingInvoice } = useInvoice(isEditMode ? id : null)

  const isLoading = createInvoice.isPending || updateInvoice.isPending

  const handleSubmit = async (data) => {
    if (isEditMode) {
      // data ya viene con totales calculados por InvoiceForm
      await updateInvoice.mutateAsync({ id, ...data })
    } else {
      await createInvoice.mutateAsync(data)
    }
    navigate('/invoices')
  }

  // Preparar defaultValues para el formulario en modo edición
  const getDefaultValues = () => {
    if (!isEditMode || !existingInvoice) return undefined

    // Mapear los campos de la factura existente al formato del formulario
    return {
      tipo_comprobante: existingInvoice.tipo_comprobante ?? 'Factura B',
      type: existingInvoice.type ?? 'receivable',
      punto_de_venta: existingInvoice.punto_de_venta ?? 1,
      numero_comprobante: existingInvoice.numero_comprobante ?? 1,
      fecha_emision: existingInvoice.fecha_emision ?? new Date().toISOString().split('T')[0],
      fecha_vencimiento: existingInvoice.fecha_vencimiento ?? '',
      condicion_pago: existingInvoice.condicion_pago ?? 'contado',
      moneda: existingInvoice.moneda ?? 'ARS',
      tipo_cambio: existingInvoice.tipo_cambio ?? 1,
      emisor_cuit: existingInvoice.emisor_cuit ?? '',
      emisor_razon_social: existingInvoice.emisor_razon_social ?? '',
      emisor_condicion_iva: existingInvoice.emisor_condicion_iva ?? 'RI',
      emisor_domicilio: existingInvoice.emisor_domicilio ?? '',
      receptor_cuit: existingInvoice.receptor_cuit ?? '',
      receptor_razon_social: existingInvoice.receptor_razon_social ?? '',
      receptor_condicion_iva: existingInvoice.receptor_condicion_iva ?? 'CF',
      receptor_domicilio: existingInvoice.receptor_domicilio ?? '',
      neto_gravado: existingInvoice.neto_gravado ?? 0,
      neto_no_gravado: existingInvoice.neto_no_gravado ?? 0,
      exento: existingInvoice.exento ?? 0,
      iva_105: existingInvoice.iva_105 ?? 0,
      iva_21: existingInvoice.iva_21 ?? 0,
      iva_27: existingInvoice.iva_27 ?? 0,
      otros_tributos: existingInvoice.otros_tributos ?? 0,
      total_amount: existingInvoice.total_amount ?? 0,
      cae: existingInvoice.cae ?? '',
      cae_vencimiento: existingInvoice.cae_vencimiento ?? '',
      client_id: existingInvoice.client_id ?? null,
      provider_id: existingInvoice.provider_id ?? null,
      notes: existingInvoice.notes ?? '',
      items: existingInvoice.invoice_items?.length
        ? existingInvoice.invoice_items.map((item) => ({
            descripcion: item.descripcion ?? '',
            cantidad: item.cantidad ?? 1,
            unidad: item.unidad ?? '',
            precio_unitario: item.precio_unitario ?? 0,
            alicuota_iva: item.alicuota_iva ?? 21,
          }))
        : [{ descripcion: '', cantidad: 1, unidad: '', precio_unitario: 0, alicuota_iva: 21 }],
    }
  }

  // Mostrar skeleton mientras carga la factura en modo edición
  if (isEditMode && isLoadingInvoice) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Factura no encontrada en modo edición
  if (isEditMode && !isLoadingInvoice && !existingInvoice) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Factura no encontrada</p>
        <Button variant="link" onClick={() => navigate('/invoices')}>Volver a facturas</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar factura' : 'Nueva factura'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditMode
              ? 'Modificá los datos del comprobante fiscal'
              : 'Completá los datos del comprobante fiscal'}
          </p>
        </div>
      </div>

      <InvoiceForm
        defaultValues={getDefaultValues()}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
