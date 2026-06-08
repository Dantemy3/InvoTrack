import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import InvoiceForm from '../components/InvoiceForm'
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '../hooks/useInvoices'
import { useCompany } from '@/features/companies/context/CompanyContext'

// Mapea los datos normalizados del OCR al formato de defaultValues del InvoiceForm.
// Cubre todos los campos del formulario.
function mapOcrToFormValues(ocr) {
  if (!ocr) return undefined

  // Detectar tipo de comprobante desde invoice_type del OCR
  const tipoMap = {
    'factura a': 'Factura A',
    'factura b': 'Factura B',
    'factura c': 'Factura C',
    'factura m': 'Factura M',
    'nota de crédito a': 'Nota de Crédito A',
    'nota de crédito b': 'Nota de Crédito B',
    'nota de crédito c': 'Nota de Crédito C',
    'nota de débito a': 'Nota de Débito A',
    'nota de débito b': 'Nota de Débito B',
    'nota de débito c': 'Nota de Débito C',
    'recibo': 'Recibo',
  }
  const tipoRaw = (ocr.invoice_type ?? '').toLowerCase()
  const tipo_comprobante = tipoMap[tipoRaw] ?? 'Factura B'

  // Extraer punto de venta y número de comprobante del invoice_number (formato XXXX-XXXXXXXX)
  let punto_de_venta = 1
  let numero_comprobante = 1
  if (ocr.invoice_number) {
    const parts = ocr.invoice_number.split('-')
    if (parts.length === 2) {
      punto_de_venta = parseInt(parts[0], 10) || 1
      numero_comprobante = parseInt(parts[1], 10) || 1
    }
  }

  // Mapear ítems OCR al formato del formulario
  const items = (ocr.items ?? []).length > 0
    ? ocr.items.map((item) => ({
        descripcion: item.descripcion ?? '',
        cantidad: item.cantidad ?? 1,
        unidad: item.unidad ?? 'un',
        precio_unitario: item.precio_unitario ?? 0,
        alicuota_iva: [0, 10.5, 21, 27].includes(item.alicuota_iva) ? item.alicuota_iva : 21,
      }))
    : [{ descripcion: '', cantidad: 1, unidad: '', precio_unitario: 0, alicuota_iva: 21 }]

  return {
    tipo_comprobante,
    type: 'receivable', // default — el usuario puede cambiarlo
    punto_de_venta,
    numero_comprobante,
    fecha_emision: ocr.issue_date ?? new Date().toISOString().split('T')[0],
    fecha_vencimiento: ocr.due_date ?? '',
    condicion_pago: ocr.condicion_pago ?? 'contado',
    moneda: 'ARS',
    tipo_cambio: 1,
    // Emisor (vendedor en la factura)
    emisor_cuit: ocr.seller_cuit ?? '',
    emisor_razon_social: ocr.seller_name ?? '',
    emisor_condicion_iva: 'RI',
    emisor_domicilio: ocr.seller_address ?? '',
    // Receptor (comprador en la factura)
    receptor_cuit: ocr.buyer_cuit ?? '',
    receptor_razon_social: ocr.buyer_name ?? '',
    receptor_condicion_iva: 'RI',
    receptor_domicilio: ocr.buyer_address ?? '',
    // Totales
    neto_gravado: ocr.subtotal ?? 0,
    neto_no_gravado: 0,
    exento: 0,
    iva_105: 0,
    iva_21: ocr.total_iva ?? 0,
    iva_27: 0,
    otros_tributos: 0,
    total_amount: ocr.total_amount ?? 0,
    // CAE
    cae: ocr.cae ?? '',
    cae_vencimiento: ocr.cae_vencimiento ?? '',
    // OCR metadata
    ocr_provider: ocr.ocr_provider ?? 'mock',
    ocr_confidence: ocr.confidence ?? null,
    ocr_raw_text: ocr.raw_text ?? null,
    notes: '',
    items,
  }
}

/**
 * Página de creación y edición de facturas.
 * - Sin `id` en params: modo creación
 * - Con `id` en params: modo edición (carga la factura existente)
 *
 * Los totales fiscales los calcula InvoiceForm antes de llamar a onSubmit.
 * Req 5.9, 5.10, 5.11, 5.12
 */
// Página de creación y edición de facturas.
// Sin `id` en params: modo creación. Con `id`: modo edición (carga la factura existente).
// Los datos del OCR se reciben vía navigation state.
export default function NewInvoicePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  // Datos pre-cargados desde OCR (vienen via navigate('/invoices/new', { state: { ocrData } }))
  const ocrData = location.state?.ocrData ?? null

  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  // Solo carga la factura existente en modo edición
  const { data: existingInvoice, isLoading: isLoadingInvoice } = useInvoice(isEditMode ? id : null)

  const isLoading = createInvoice.isPending || updateInvoice.isPending

  // Crea o actualiza la factura y navega al listado al completar.
  const handleSubmit = async (data) => {
    if (isEditMode) {
      // data ya viene con totales calculados por InvoiceForm
      await updateInvoice.mutateAsync({ id, ...data })
    } else {
      await createInvoice.mutateAsync(data)
    }
    navigate('/invoices')
  }

  // Preparar defaultValues para el formulario
  // Prioridad: modo edición > datos OCR > valores por defecto
  // Retorna los defaultValues del formulario con prioridad: edición > OCR > vacío.
  const getDefaultValues = () => {
    if (isEditMode && existingInvoice) {
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

    // Si vienen datos de OCR, mapearlos al formulario
    if (ocrData) return mapOcrToFormValues(ocrData)

    return undefined
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

      {/* Banner OCR — avisamos que los datos vienen pre-cargados */}
      {ocrData && !isEditMode && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <span>✨</span>
          <span>
            <strong>Datos pre-cargados desde OCR.</strong> Revisá y corregí los campos antes de guardar.
            Los campos con baja confianza pueden necesitar corrección manual.
          </span>
        </div>
      )}

      <InvoiceForm
        defaultValues={getDefaultValues()}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
