import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHotkeys } from 'react-hotkeys-hook'
import { Plus, Trash2, Loader2, Globe, BadgeCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/toast'
import { useEmitCae } from '../hooks/useEmitCae'
import {
  invoiceSchema,
  TAX_CONDITION_VALUES,
  CONDICIONES_PAGO, PAISES_EXPORTACION, UMBRAL_CF_ARS,
} from '../schemas/invoiceSchemas'
import { getComprobanteConfig, getTiposPermitidosPorEmisor } from '@/constants/comprobanteConfig'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, calculateInvoiceTotals } from '@/lib/utils'
import { IVA_RATES, SUPPORTED_CURRENCIES, CURRENCY_LABELS } from '@/lib/constants'
import ItemSearchInput from './ItemSearchInput'
import { useProducts } from '@/features/products/hooks/useProducts'
import { DEMO_CATALOG_ITEMS } from '../data/demoCatalogItems'

const defaultItem = { descripcion: '', cantidad: 1, unidad: '', precio_unitario: 0, alicuota_iva: 21 }

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent)
const modKey = isMac ? '⌘' : 'Ctrl'

function Kbd({ children }) {
  return (
    <kbd className="ml-1.5 hidden sm:inline-flex items-center rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-400">
      {children}
    </kbd>
  )
}

const TAX_CONDITION_LABELS = {
  RI: 'Responsable Inscripto',
  MO: 'Monotributista',
  EX: 'Exento',
  CF: 'Consumidor Final',
  RS: 'Responsable Sustituto',
}

export default function InvoiceForm({ defaultValues, onSubmit, isLoading, clients = [], providers = [] }) {
  const navigate = useNavigate()

  const {
    register, handleSubmit, control, watch, getValues, setValue, setError,
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
      receptor_condicion_iva: 'RI',
      consumidor_final_anonimo: false,
      neto_gravado: 0, neto_no_gravado: 0, exento: 0,
      iva_105: 0, iva_21: 0, iva_27: 0, otros_tributos: 0, total_amount: 0,
      items: [defaultItem],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' })

  const { data: productsData } = useProducts()
  const products = productsData?.data ?? []

  const items               = watch('items') ?? []
  const moneda              = watch('moneda') ?? 'ARS'
  const tipoComprobante     = watch('tipo_comprobante') ?? 'Factura B'
  const invoiceType         = watch('type') ?? 'receivable'
  const emisorCondicionIva  = watch('emisor_condicion_iva') ?? 'RI'
  const esAnonimo           = watch('consumidor_final_anonimo') ?? false

  const config = getComprobanteConfig(tipoComprobante)
  const tiposPermitidos = getTiposPermitidosPorEmisor(emisorCondicionIva)

  const { toast } = useToast()
  const emitCae = useEmitCae()

  const totals = calculateInvoiceTotals(items)
  const superaUmbral = totals.total_amount >= UMBRAL_CF_ARS

  const handleEmisorCondicionChange = (val) => {
    setValue('emisor_condicion_iva', val)
    const permitidos = getTiposPermitidosPorEmisor(val)
    if (!permitidos.includes(tipoComprobante)) {
      setValue('tipo_comprobante', permitidos[0])
    }
  }

  const handleFormSubmit = (data) => {
    const itemsNormalizados = config.permiteItems
      ? data.items
      : []

    if (data.type === 'receivable' && itemsNormalizados.length > 0) {
      const productNames = new Set(products.map((p) => p.name.toLowerCase()))
      for (let i = 0; i < itemsNormalizados.length; i++) {
        const desc = (itemsNormalizados[i].descripcion ?? '').trim()
        if (desc && !productNames.has(desc.toLowerCase())) {
          setError(`items.${i}.descripcion`, {
            message: `"${desc}" no es un producto existente. Seleccioná uno de la lista.`,
          })
          return
        }
      }
    }

    const enriched = config.permiteItems
      ? calculateInvoiceTotals(itemsNormalizados)
      : { ...data, items: [] }

    onSubmit({
      ...data,
      neto_gravado:  enriched.neto_gravado ?? data.neto_gravado,
      iva_105:       enriched.iva_105 ?? data.iva_105,
      iva_21:        enriched.iva_21 ?? data.iva_21,
      iva_27:        enriched.iva_27 ?? data.iva_27,
      total_amount:  enriched.total_amount ?? data.total_amount,
      items:         enriched.items ?? [],
    })
  }

  useHotkeys('alt+r', (e) => {
    e.preventDefault()
    fillDemoData()
  }, { enableOnFormTags: true }, [config, invoiceType, products, replace])

  // Autocompleta el formulario con datos demo válidos (solo dev).
  // Atajo: Alt+R. Pensado para agilizar las pruebas manuales de la app.
  const fillDemoData = () => {
    const today = new Date().toISOString().split('T')[0]
    const datePlus = (days) => {
      const d = new Date()
      d.setDate(d.getDate() + days)
      return d.toISOString().split('T')[0]
    }

    if (config.requierePuntoVenta) setValue('punto_de_venta', 1)
    if (config.requiereNumeroComprobante) setValue('numero_comprobante', 1)
    setValue('fecha_emision', today)
    setValue('fecha_vencimiento', config.requiereFechaVencimiento ? datePlus(15) : '')
    setValue('condicion_pago', 'contado')

    if (config.esExportacion) {
      setValue('moneda', 'USD')
      setValue('tipo_cambio', 1050)
      setValue('pais_destino', 'US')
      setValue('receptor_id_impositivo', 'US-EIN-123456789')
      setValue('receptor_razon_social', 'Foreign Corp LLC')
      setValue('receptor_domicilio', '123 Main St, New York')
    } else {
      setValue('moneda', 'ARS')
      setValue('tipo_cambio', 1)
      setValue('receptor_cuit', '20-33445566-7')
      setValue('receptor_razon_social', 'Cliente Demo S.R.L.')
      setValue('receptor_domicilio', 'Av. Santa Fe 5678, CABA')
    }

    setValue('emisor_cuit', '30-71234567-8')
    setValue('emisor_razon_social', 'InvoTrack Demo S.A.')
    setValue('emisor_domicilio', 'Av. Corrientes 1234, CABA')
    setValue('receptor_condicion_iva', 'RI')
    setValue('consumidor_final_anonimo', false)

    setValue('cae', config.requiereCAE ? '74123456789012' : '')
    setValue('cae_vencimiento', config.requiereVencimientoCAE ? datePlus(30) : '')
    setValue('notes', 'Formulario autocompletado con datos demo (Alt+R)')

    if (config.permiteItems) {
      const itemsDemo = invoiceType === 'receivable' && products.length > 0
        ? products.slice(0, 3).map((p) => ({
            descripcion: p.name,
            cantidad: 1,
            unidad: p.unit || 'un',
            precio_unitario: Number(p.price) || 1000,
            alicuota_iva: 21,
          }))
        : DEMO_CATALOG_ITEMS.slice(0, 3).map((item) => ({ ...item }))
      replace(itemsDemo)
    } else {
      setValue('total_amount', 150000)
    }

    toast({
      title: 'Formulario autocompletado',
      description: 'Se cargaron datos demo. Revisá y guardá.',
      variant: 'success',
    })
  }

  useHotkeys('mod+enter', (e) => {
    e.preventDefault()
    handleSubmit(handleFormSubmit)()
  }, { enableOnFormTags: true }, [handleSubmit, handleFormSubmit])

  useHotkeys('alt+i', (e) => {
    if (config.permiteItems) {
      e.preventDefault()
      append(defaultItem)
    }
  }, { enableOnFormTags: true }, [config.permiteItems, append])

  useHotkeys('alt+backspace', (e) => {
    if (fields.length > 1) {
      e.preventDefault()
      remove(fields.length - 1)
    }
  }, { enableOnFormTags: true }, [fields.length, remove])

  const receptorObligatorio = config.requiereReceptorCUIT ||
    config.requiereReceptorRazonSocial ||
    config.requiereReceptorCondicionIVA

  // Seleccionar un cliente de la lista completa los datos del receptor
  // (razón social, CUIT, domicilio, condición IVA) y lo vincula a la factura.
  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c.id === clientId)
    setValue('client_id', clientId)
    if (client) {
      setValue('receptor_razon_social', client.name ?? '')
      setValue('receptor_cuit', client.cuit ?? '')
      setValue('receptor_domicilio', client.address ?? '')
      setValue('receptor_condicion_iva', client.tax_condition ?? '')
    }
    setValue('consumidor_final_anonimo', false)
  }

  // Solicita el CAE a ARCA (WSFEv1 homologación) y completa los campos.
  // Solo aplica a comprobantes que requieren CAE emitidos (flujo "cobrar").
  const handleEmitCae = async () => {
    const values = getValues()

    if (!values.emisor_cuit) {
      toast({ title: 'Falta el CUIT del emisor', description: 'Completá el CUIT del emisor antes de pedir el CAE.', variant: 'error' })
      return
    }
    if (!values.punto_de_venta || !values.numero_comprobante) {
      toast({ title: 'Faltan datos de numeración', description: 'Punto de venta y número de comprobante son obligatorios.', variant: 'error' })
      return
    }
    const total = Number(values.total_amount)
    if (!total || total <= 0) {
      toast({ title: 'Total inválido', description: 'El total del comprobante debe ser mayor a 0.', variant: 'error' })
      return
    }

    try {
      const result = await emitCae.mutateAsync({ invoice: values })
      if (result?.cae) {
        setValue('cae', result.cae)
        setValue('cae_vencimiento', result.caeVencimiento ?? '')
        toast({
          title: 'CAE obtenido',
          description: `CAE ${result.cae} válido hasta ${result.caeVencimiento ?? '-'}. Completá el guardado de la factura.`,
          variant: 'success',
        })
      }
    } catch (err) {
      // El toast de error lo dispara el propio hook (useEmitCae)
      console.error('Error al solicitar CAE:', err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* ── Tipo y flujo ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tipo de comprobante</CardTitle>
          {import.meta.env.DEV && (
            <Button type="button" variant="outline" size="sm" onClick={fillDemoData}>
              Autocompletar demo
              <Kbd>Alt+R</Kbd>
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="space-y-1.5">
            <Label>Tipo de comprobante <span className="text-red-500">*</span></Label>
            <Controller name="tipo_comprobante" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposPermitidos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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

          {config.permiteCondicionPago && (
            <div className="space-y-1.5">
              <Label>Condición de pago <span className="text-red-500">*</span></Label>
              <Controller name="condicion_pago" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDICIONES_PAGO.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.condicion_pago && <p className="text-xs text-red-500">{errors.condicion_pago.message}</p>}
            </div>
          )}

          {config.requierePuntoVenta && (
            <div className="space-y-1.5">
              <Label>Punto de venta <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} max={99999} {...register('punto_de_venta')} />
              {errors.punto_de_venta && <p className="text-xs text-red-500">{errors.punto_de_venta.message}</p>}
            </div>
          )}

          {config.requiereNumeroComprobante && (
            <div className="space-y-1.5">
              <Label>Número de comprobante <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} {...register('numero_comprobante')} />
              {errors.numero_comprobante && <p className="text-xs text-red-500">{errors.numero_comprobante.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Fecha de emisión <span className="text-red-500">*</span></Label>
            <Input type="date" {...register('fecha_emision')} />
            {errors.fecha_emision && <p className="text-xs text-red-500">{errors.fecha_emision.message}</p>}
          </div>

          {config.requiereFechaVencimiento && (
            <div className="space-y-1.5">
              <Label>
                Fecha de vencimiento <span className="text-red-500">*</span>
              </Label>
              <Input type="date" {...register('fecha_vencimiento')} />
              {errors.fecha_vencimiento && <p className="text-xs text-red-500">{errors.fecha_vencimiento.message}</p>}
            </div>
          )}

          {config.requiereCAE && (
            <div className="space-y-1.5">
              <Label>CAE <span className="text-red-500">*</span></Label>
              <Input placeholder="12345678901234" maxLength={14} {...register('cae')} />
              {errors.cae && <p className="text-xs text-red-500">{errors.cae.message}</p>}
            </div>
          )}

          {config.requiereVencimientoCAE && (
            <div className="space-y-1.5">
              <Label>Vencimiento CAE <span className="text-red-500">*</span></Label>
              <Input type="date" {...register('cae_vencimiento')} />
              {errors.cae_vencimiento && <p className="text-xs text-red-500">{errors.cae_vencimiento.message}</p>}
            </div>
          )}

          {config.requiereCAE && invoiceType === 'receivable' && (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={emitCae.isPending || isLoading}
                onClick={handleEmitCae}
              >
                {emitCae.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                {emitCae.isPending ? 'Solicitando CAE…' : 'Solicitar CAE en ARCA (homologación)'}
              </Button>
              <p className="text-xs text-gray-400">
                Pide el CAE a ARCA con los datos del comprobante y completa los campos automáticamente.
              </p>
              {emitCae.isError && (
                <p className="text-xs text-red-500">{emitCae.error.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Moneda <span className="text-red-500">*</span></Label>
            <Controller name="moneda" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? 'ARS'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.moneda && <p className="text-xs text-red-500">{errors.moneda.message}</p>}
          </div>

          {moneda !== 'ARS' && (
            <div className="space-y-1.5">
              <Label>Tipo de cambio <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.0001" min="0.0001" placeholder="ej: 1050.0000" {...register('tipo_cambio')} />
              <p className="text-xs text-gray-400">1 {moneda} = X ARS</p>
              {errors.tipo_cambio && <p className="text-xs text-red-500">{errors.tipo_cambio.message}</p>}
            </div>
          )}

          {config.esExportacion && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                País de destino <span className="text-red-500">*</span>
              </Label>
              <Controller name="pais_destino" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                  <SelectContent>
                    {PAISES_EXPORTACION.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.pais_destino && <p className="text-xs text-red-500">{errors.pais_destino.message}</p>}
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── Emisor ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Datos del emisor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              Razón social
              {config.requiereEmisorRazonSocial && <span className="text-red-500"> *</span>}
            </Label>
            <Input placeholder="Empresa S.A." {...register('emisor_razon_social')} />
            {errors.emisor_razon_social && <p className="text-xs text-red-500">{errors.emisor_razon_social.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>
              CUIT
              {config.requiereEmisorCUIT && <span className="text-red-500"> *</span>}
            </Label>
            <Input placeholder="20-12345678-9" {...register('emisor_cuit')} />
            {errors.emisor_cuit && <p className="text-xs text-red-500">{errors.emisor_cuit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>
              Condición IVA
              {config.requiereEmisorCondicionIVA && <span className="text-red-500"> *</span>}
            </Label>
            <Controller name="emisor_condicion_iva" control={control} render={({ field }) => (
              <Select onValueChange={(val) => { field.onChange(val); handleEmisorCondicionChange(val) }} value={field.value ?? ''}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {TAX_CONDITION_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>{TAX_CONDITION_LABELS[v]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.emisor_condicion_iva && <p className="text-xs text-red-500">{errors.emisor_condicion_iva.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>
              Domicilio
              {config.requiereEmisorDomicilio && <span className="text-red-500"> *</span>}
            </Label>
            <Input placeholder="Av. Corrientes 1234, CABA" {...register('emisor_domicilio')} />
            {errors.emisor_domicilio && <p className="text-xs text-red-500">{errors.emisor_domicilio.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Receptor ─────────────────────────────────────────────────────── */}
      {config.muestraSeccionReceptor && (
        <Card>
          <CardHeader>
            <CardTitle>
              {config.esExportacion ? 'Destinatario (Exportación)' : 'Datos del receptor'}
            </CardTitle>
            {receptorObligatorio && (
              <p className="text-xs text-amber-600 mt-0.5">
                Para {tipoComprobante} el receptor debe estar identificado según las reglas fiscales.
              </p>
            )}
            {config.permiteConsumidorFinalAnonimo && !superaUmbral && (
              <p className="text-xs text-gray-400 mt-0.5">
                Opcional para totales menores a {formatCurrency(UMBRAL_CF_ARS)}.
              </p>
            )}
            {config.permiteConsumidorFinalAnonimo && superaUmbral && (
              <p className="text-xs text-amber-600 mt-0.5">
                El total supera {formatCurrency(UMBRAL_CF_ARS)} — ARCA exige identificar al receptor.
              </p>
            )}
            {config.esTicket && !receptorObligatorio && (
              <p className="text-xs text-gray-400 mt-0.5">
                Todos los datos del receptor son opcionales para este tipo de comprobante.
              </p>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* El receptor es un cliente de la lista — al seleccionarlo se completan sus datos */}
            {clients.length > 0 && !config.esExportacion && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label>
                  Cliente (receptor)
                  {(config.requiereReceptorRazonSocial || config.requiereReceptorCUIT) && <span className="text-red-500"> *</span>}
                </Label>
                <Controller name="client_id" control={control} render={({ field }) => (
                  <Select
                    onValueChange={(clientId) => { field.onChange(clientId); handleClientSelect(clientId) }}
                    value={field.value ?? ''}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente de la lista" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                <p className="text-xs text-gray-400">
                  El receptor debe ser un cliente de la lista. Al elegirlo se completan sus datos automáticamente.
                </p>
              </div>
            )}

            {config.permiteConsumidorFinalAnonimo && !superaUmbral && (
              <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  id="consumidor_final_anonimo"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('consumidor_final_anonimo')}
                />
                <label htmlFor="consumidor_final_anonimo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Consumidor Final Anónimo
                  <span className="ml-1.5 text-xs text-gray-400">(total bajo {formatCurrency(UMBRAL_CF_ARS)} — no requiere identificación)</span>
                </label>
              </div>
            )}

            {(!esAnonimo || superaUmbral || receptorObligatorio) && (
              <>
                {(config.esExportacion || config.requiereReceptorCUIT || !config.requiereReceptorCUIT) && (
                  <div className="space-y-1.5">
                    <Label>
                      {config.esExportacion ? 'ID Impositivo Extranjero' : 'CUIT'}
                      {(config.requiereReceptorCUIT || config.esExportacion) && <span className="text-red-500"> *</span>}
                    </Label>
                    {config.esExportacion
                      ? <Input placeholder="Tax ID, VAT, EIN, etc." {...register('receptor_id_impositivo')} />
                      : <Input placeholder="30-98765432-1" {...register('receptor_cuit')} />
                    }
                    {errors.receptor_id_impositivo && <p className="text-xs text-red-500">{errors.receptor_id_impositivo.message}</p>}
                    {errors.receptor_cuit && <p className="text-xs text-red-500">{errors.receptor_cuit.message}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>
                    {config.esExportacion ? 'Razón social / Nombre' : 'Razón social'}
                    {(config.requiereReceptorRazonSocial || config.esExportacion || (config.permiteConsumidorFinalAnonimo && superaUmbral)) && (
                      <span className="text-red-500"> *</span>
                    )}
                  </Label>
                  <Input placeholder={config.esExportacion ? 'Foreign Corp LLC' : 'Cliente S.R.L.'} {...register('receptor_razon_social')} />
                  {errors.receptor_razon_social && <p className="text-xs text-red-500">{errors.receptor_razon_social.message}</p>}
                </div>

              <div className="space-y-1.5">
                <Label>Domicilio</Label>
                <Input placeholder={config.esExportacion ? '123 Main St, New York' : 'Av. Santa Fe 5678, CABA'} {...register('receptor_domicilio')} />
              </div>
            </>
          )}

          {/* Vínculo con proveedor (solo para compras/pagar) */}
          {providers.length > 0 && !config.esExportacion && (
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
      )}

      {/* ── Ítems ────────────────────────────────────────────────────────── */}
      {config.permiteItems ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ítems</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append(defaultItem)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar ítem
              <Kbd>Alt+I</Kbd>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.items?.message && (
              <p className="text-xs text-red-500">{errors.items.message}</p>
            )}

            <div className="hidden sm:grid gap-2 px-0.5 grid-cols-12">
              <div className="col-span-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Descripción</div>
              <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Cantidad</div>
              <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Unidad</div>
              <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Precio unit.</div>
              <div className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wide">IVA</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 items-start grid-cols-12">
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs text-gray-400 mb-0.5 sm:hidden">Descripción</label>
                  <Controller
                    name={`items.${index}.descripcion`}
                    control={control}
                    render={({ field }) => (
                      <ItemSearchInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Buscar producto…"
                        error={errors.items?.[index]?.descripcion?.message}
                        products={products}
                        restrictToProducts={invoiceType === 'receivable'}
                        onSelectItem={(catalogItem) => {
                          setValue(`items.${index}.descripcion`, catalogItem.descripcion)
                          setValue(`items.${index}.unidad`, catalogItem.unidad)
                          setValue(`items.${index}.precio_unitario`, catalogItem.precio_unitario)
                        }}
                      />
                    )}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-0.5 sm:hidden">Cantidad</label>
                  <Input type="number" placeholder="1" step="0.0001" min="0" {...register(`items.${index}.cantidad`)} />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-0.5 sm:hidden">Unidad</label>
                  <Input placeholder="hs, kg, un" {...register(`items.${index}.unidad`)} />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-0.5 sm:hidden">Precio unitario</label>
                  <Input type="number" placeholder="0.00" step="0.01" min="0" {...register(`items.${index}.precio_unitario`)} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-gray-400 mb-0.5 sm:hidden">IVA</label>
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
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-9 w-9 text-red-400 hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="flex flex-col items-end gap-1 text-sm">
              {config.permiteIVA && config.discriminaIVA ? (
                <>
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
                </>
              ) : config.permiteIVA ? (
                <div className="flex gap-8">
                  <span className="text-xs text-gray-400 self-end pb-0.5">
                    {config.esExportacion ? 'Precio sin IVA (exportación)' : 'IVA incluido en precio'}
                  </span>
                  <span className="font-medium w-36 text-right">{formatCurrency(totals.neto_gravado)}</span>
                </div>
              ) : null}
              <Separator className="w-56 my-1" />
              <div className="flex gap-8">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 w-36 text-right text-base">
                  {formatCurrency(totals.total_amount)}
                  {moneda !== 'ARS' && <span className="text-xs text-gray-400 ml-1">{moneda}</span>}
                </span>
              </div>
            </div>

          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Importe total</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-w-xs">
              <Label>Monto total <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" {...register('total_amount')} />
              {errors.total_amount && <p className="text-xs text-red-500">{errors.total_amount.message}</p>}
            </div>
          </CardContent>
        </Card>
      )}

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
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar factura
          <Kbd>{modKey}+↵</Kbd>
        </Button>
      </div>

    </form>
  )
}
