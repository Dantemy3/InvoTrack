import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import ZoomPanImageViewer from '@/components/ZoomPanImageViewer'
import InvoiceForm from '../components/InvoiceForm'
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '../hooks/useInvoices'
import { providerService } from '@/features/providers/services/providerService'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { useToast } from '@/components/ui/toast'

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
 * ──────────────────────────────────────────────────────────────────────────────
 * FLUJO "CREAR FACTURA" — paso 1 de 4
 * ──────────────────────────────────────────────────────────────────────────────
 * El usuario accede a /invoices/new (o /invoices/:id para editar).
 *
 * Responsabilidades de esta página:
 *  1. Detectar si es modo creación o edición según el param `id` en la URL.
 *  2. En modo edición: cargar los datos existentes desde Supabase via useInvoice().
 *  3. Pasar los defaultValues al formulario (InvoiceForm).
 *  4. Recibir el evento onSubmit del formulario y llamar al hook de creación/edición.
 *  5. Redirigir a /invoices una vez que la operación finaliza.
 */
export default function NewInvoicePage() {
  // ── Hooks de navegación ──────────────────────────────────────────────────────
  // navigate: para redirigir después de guardar o cancelar.
  // location: para leer `state.ocrData` si la página se abrió desde el escáner OCR.
  // id: si existe en la URL (/invoices/:id) activa el modo edición.
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  // Paso 1a — Datos pre-cargados desde OCR
  // Si el usuario escaneó una factura, llega aquí con ocrData en el navigation state.
  // mapOcrToFormValues() convierte esos datos al formato del formulario.
  const ocrData = location.state?.ocrData ?? null
  const ocrPreview = location.state?.ocrPreview ?? null

  // Paso 1b — Hooks de mutación (creación y edición)
  // useCreateInvoice y useUpdateInvoice encapsulan la llamada a Supabase y el
  // manejo de caché de React Query. Se usan en handleSubmit más abajo.
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  // Paso 1c — Cargar factura existente solo en modo edición
  // Si no hay id (modo creación), el hook recibe null y no hace ninguna petición.
  const { data: existingInvoice, isLoading: isLoadingInvoice } = useInvoice(isEditMode ? id : null)

  // Paso 1d — Empresa activa para verificar proveedor del OCR
  const { company } = useCompany()

  // Paso 1e — Estado para verificar proveedor desde OCR
  const { toast } = useToast()
  const [providerDialog, setProviderDialog] = useState({
    open: false,
    name: '',
    cuit: '',
  })
  const [providerIdFromOcr, setProviderIdFromOcr] = useState(null)

  // Paso 1e — Verificar si el vendedor del OCR existe como proveedor
  useEffect(() => {
    if (!ocrData || !company?.id || isEditMode) return

    const sellerCuit = ocrData.seller_cuit?.trim()
    const sellerName = ocrData.seller_name?.trim()
    if (!sellerCuit && !sellerName) return

    providerService.findByCuit({ companyId: company.id, cuit: sellerCuit })
      .then((existing) => {
        if (existing) {
          setProviderIdFromOcr(existing.id)
        } else if (sellerName) {
          setProviderDialog({ open: true, name: sellerName, cuit: sellerCuit })
        }
      })
      .catch(() => {})
  }, [ocrData, company?.id, isEditMode])

  // Paso 1f — Crear proveedor desde el diálogo OCR
  const handleCreateProvider = async () => {
    try {
      const newProvider = await providerService.create({
        name: providerDialog.name || 'Proveedor',
        cuit: providerDialog.cuit || '',
        company_id: company.id,
      })
      setProviderIdFromOcr(newProvider.id)
      setProviderDialog({ open: false, name: '', cuit: '' })
      toast({ title: 'Proveedor creado', description: `Se vinculó ${newProvider.name} a la factura`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' })
    }
  }

  // isLoading es true mientras cualquiera de las dos mutaciones está en curso;
  // se pasa al formulario para deshabilitar el botón de envío y mostrar el spinner.
  const isLoading = createInvoice.isPending || updateInvoice.isPending

  // ── Paso 2 — Handler de envío ────────────────────────────────────────────────
  // InvoiceForm llama a esta función con todos los datos del formulario
  // (ya incluyen los totales fiscales calculados en InvoiceForm.handleFormSubmit).
  // Según el modo, se crea o actualiza la factura y luego se redirige al listado.
  const handleSubmit = async (data) => {
    if (isEditMode) {
      // Modo edición: actualizamos los campos de la factura con su id.
      await updateInvoice.mutateAsync({ id, ...data })
    } else {
      // Modo creación: creamos una nueva factura.
      // El hook agrega automáticamente el company_id desde CompanyContext.
      await createInvoice.mutateAsync(data)
    }
    // Al completar, volvemos al listado de facturas.
    navigate('/invoices')
  }

  // ── Paso 1d — Calcular defaultValues ────────────────────────────────────────
  // Prioridad de datos iniciales: edición > OCR > empresa > formulario vacío.
  // Retorna los defaultValues del formulario con prioridad: edición > OCR > empresa > vacío.
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

    // Si vienen datos de OCR, usar los del OCR (el emisor es el proveedor)
    if (ocrData) {
      const values = mapOcrToFormValues(ocrData)
      if (providerIdFromOcr) values.provider_id = providerIdFromOcr
      return values
    }

    // Pre-fill emisor con datos de la empresa para facturas de ingreso
    const companyDefaults = company ? {
      emisor_razon_social: company.name ?? '',
      emisor_cuit: company.cuit ?? '',
      emisor_condicion_iva: company.tax_condition ?? 'RI',
      emisor_domicilio: company.address ?? '',
    } : {}

    return {
      tipo_comprobante: 'Factura B',
      type: 'receivable',
      punto_de_venta: 1,
      numero_comprobante: 1,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      condicion_pago: 'contado',
      moneda: 'ARS',
      tipo_cambio: 1,
      ...companyDefaults,
      receptor_cuit: '',
      receptor_razon_social: '',
      receptor_condicion_iva: 'RI',
      receptor_domicilio: '',
      neto_gravado: 0, neto_no_gravado: 0, exento: 0,
      iva_105: 0, iva_21: 0, iva_27: 0, otros_tributos: 0, total_amount: 0,
      cae: '', cae_vencimiento: '',
      client_id: null, provider_id: null,
      notes: '',
      items: [{ descripcion: '', cantidad: 1, unidad: '', precio_unitario: 0, alicuota_iva: 21 }],
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

  const hasOcrPreview = Boolean(ocrPreview && !isEditMode)

  return (
    <div className={hasOcrPreview ? 'p-6 max-w-7xl mx-auto space-y-6' : 'p-6 max-w-4xl mx-auto space-y-6'}>
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

      {ocrData && !isEditMode && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <span>✨</span>
          <span>
            <strong>Datos pre-cargados desde OCR.</strong> Revisá y corregí los campos antes de guardar.
            Los campos con baja confianza pueden necesitar corrección manual.
          </span>
        </div>
      )}

      <Dialog open={providerDialog.open} onOpenChange={(open) => setProviderDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proveedor no registrado</DialogTitle>
            <DialogDescription>
              <strong>{providerDialog.name}</strong> no está registrado como proveedor en tu empresa.
              ¿Querés crearlo automáticamente y vincularlo a esta factura?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialog({ open: false, name: '', cuit: '' })}>
              No, ahora no
            </Button>
            <Button onClick={handleCreateProvider}>
              Sí, crear proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={hasOcrPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : undefined}>
        {hasOcrPreview && (
          <div className="lg:sticky lg:top-6">
            <ZoomPanImageViewer
              src={ocrPreview}
              alt="Factura escaneada"
              className="h-[calc(100vh-12rem)] min-h-[400px]"
              minHeight={400}
            />
          </div>
        )}

        <div className={hasOcrPreview ? 'min-w-0' : undefined}>
          <InvoiceForm
            defaultValues={getDefaultValues()}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
