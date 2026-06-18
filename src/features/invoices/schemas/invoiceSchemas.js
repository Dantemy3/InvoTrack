import { z } from 'zod'
import { IVA_VALID_RATES, SUPPORTED_CURRENCIES } from '@/lib/constants'
import { cuitSchema } from '@/features/auth/schemas/authSchemas'

// ── Tipos de comprobante AFIP/ARCA ────────────────────────────────────────────
export const TIPOS_COMPROBANTE = [
  'Factura A', 'Factura B', 'Factura C', 'Factura M', 'Factura E',
  'Nota de Crédito A', 'Nota de Crédito B', 'Nota de Crédito C',
  'Nota de Débito A', 'Nota de Débito B', 'Nota de Débito C',
  'Recibo',
]

// Tipos disponibles según la condición IVA del emisor.
// RI → puede emitir A, B, M, E. MO/EX → solo C, E.
export const TIPOS_PARA_RI    = ['Factura A', 'Factura B', 'Factura M', 'Factura E']
export const TIPOS_PARA_MO_EX = ['Factura C', 'Factura E']

// Tipos que exigen identificar completamente al receptor (CUIT + razón social + condición).
export const TIPOS_RECEPTOR_IDENTIFICADO = [
  'Factura A', 'Factura M',
  'Nota de Crédito A', 'Nota de Débito A',
]

// Tipos de exportación: receptor extranjero, moneda libre, sin CUIT arg.
export const TIPOS_EXPORTACION = ['Factura E']

// Tipos donde el IVA se discrimina en el comprobante (solo RI).
export const TIPOS_CON_IVA_DISCRIMINADO = [
  'Factura A', 'Factura M',
  'Nota de Crédito A', 'Nota de Débito A',
]

// Tipos donde el receptor puede ser Consumidor Final anónimo.
export const TIPOS_RECEPTOR_OPCIONAL = [
  'Factura B', 'Factura C',
  'Nota de Crédito B', 'Nota de Débito B',
  'Nota de Crédito C', 'Nota de Débito C',
  'Recibo',
]

// Tipos sin fecha de vencimiento propia.
export const TIPOS_SIN_VENCIMIENTO = [
  'Factura C', 'Factura E',
  'Recibo',
  'Nota de Crédito A', 'Nota de Crédito B', 'Nota de Crédito C',
  'Nota de Débito A',  'Nota de Débito B',  'Nota de Débito C',
]

// Umbral ARCA para identificar al receptor en Factura B/C (en ARS).
export const UMBRAL_CF_ARS = 100_000

// ── Condiciones de pago ───────────────────────────────────────────────────────
export const CONDICIONES_PAGO = [
  { value: 'contado',          label: 'Contado' },
  { value: 'cuenta_corriente', label: 'Cuenta corriente' },
  { value: '15_dias',          label: '15 días' },
  { value: '30_dias',          label: '30 días' },
  { value: '60_dias',          label: '60 días' },
  { value: '90_dias',          label: '90 días' },
  { value: 'contra_entrega',   label: 'Contra entrega' },
  { value: 'anticipado',       label: 'Pago anticipado' },
]

export const CONDICIONES_PAGO_VALUES = CONDICIONES_PAGO.map((c) => c.value)
export const CONDICIONES_PAGO_ENUM = /** @type {[string, ...string[]]} */ (CONDICIONES_PAGO_VALUES)

// ── Condiciones IVA ───────────────────────────────────────────────────────────
export const TAX_CONDITION_VALUES = ['RI', 'MO', 'EX', 'CF', 'RS']

// Condiciones válidas para receptor en Factura A/M (solo RI o RS aceptados por ARCA).
export const TAX_CONDITION_RECEPTOR_AM = ['RI', 'RS']

// ── Lista de países para Factura E ───────────────────────────────────────────
export const PAISES_EXPORTACION = [
  { value: 'US', label: 'Estados Unidos' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'PE', label: 'Perú' },
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'ES', label: 'España' },
  { value: 'DE', label: 'Alemania' },
  { value: 'FR', label: 'Francia' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'IT', label: 'Italia' },
  { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japón' },
  { value: 'OTHER', label: 'Otro' },
]

// ── Schema de ítem ────────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  descripcion: z.string().min(1, 'La descripción del ítem es requerida'),
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  precio_unitario: z.coerce
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio unitario debe ser mayor a 0'),
  alicuota_iva: z.coerce
    .number({ invalid_type_error: 'La alícuota de IVA debe ser un número' })
    .refine(
      (v) => IVA_VALID_RATES.includes(v),
      { message: `Alícuota de IVA inválida. Valores permitidos: ${IVA_VALID_RATES.join(', ')}%` }
    ),
  subtotal_neto: z.coerce.number().optional(),
  subtotal_iva:  z.coerce.number().optional(),
  sort_order:    z.number().int().optional(),
})

// ── Schema principal ──────────────────────────────────────────────────────────
export const invoiceSchema = z.object({
  // Tipo y flujo
  tipo_comprobante: z.enum(TIPOS_COMPROBANTE, {
    errorMap: () => ({ message: 'Seleccioná un tipo de comprobante válido' }),
  }),
  type: z.enum(['receivable', 'payable'], {
    errorMap: () => ({ message: 'Seleccioná un tipo de flujo válido' }),
  }),

  // Numeración ARCA
  punto_de_venta: z.coerce
    .number({ invalid_type_error: 'El punto de venta debe ser un número' })
    .int('El punto de venta debe ser un número entero')
    .min(1, 'El punto de venta mínimo es 1')
    .max(99999, 'El punto de venta máximo es 99999'),
  numero_comprobante: z.coerce
    .number({ invalid_type_error: 'El número de comprobante debe ser un número' })
    .int('El número de comprobante debe ser un número entero')
    .positive('El número de comprobante debe ser positivo'),

  // Fechas
  fecha_emision:    z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().optional().nullable(),

  // Condición de pago
  condicion_pago: z.enum(CONDICIONES_PAGO_ENUM, {
    errorMap: () => ({ message: 'Seleccioná una condición de pago válida' }),
  }),

  // Moneda y tipo de cambio
  moneda: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `Moneda inválida. Valores permitidos: ${SUPPORTED_CURRENCIES.join(', ')}` }),
  }).default('ARS'),
  tipo_cambio: z.coerce
    .number({ invalid_type_error: 'El tipo de cambio debe ser un número' })
    .positive('El tipo de cambio debe ser mayor a 0')
    .default(1.0),

  // País de destino — solo para Factura E
  pais_destino: z.string().optional().nullable(),

  // Emisor — siempre obligatorio
  emisor_cuit: cuitSchema.or(z.literal('')).refine(
    (v) => v && v.trim() !== '',
    { message: 'El CUIT del emisor es requerido' }
  ),
  emisor_razon_social: z.string().min(1, 'La razón social del emisor es requerida'),
  emisor_condicion_iva: z.enum(TAX_CONDITION_VALUES, {
    errorMap: () => ({ message: 'Seleccioná la condición de IVA del emisor' }),
  }),
  emisor_domicilio: z.string().optional().nullable(),

  // Receptor — obligatoriedad condicional resuelta en superRefine
  receptor_id_impositivo: z.string().optional().nullable(), // para exportación
  receptor_cuit:           z.string().optional().nullable(),
  receptor_razon_social:   z.string().optional().nullable(),
  receptor_condicion_iva:  z.enum(TAX_CONDITION_VALUES).optional().nullable(),
  receptor_domicilio:      z.string().optional().nullable(),

  // Flag UI — Consumidor Final Anónimo (Factura B/C bajo umbral)
  consumidor_final_anonimo: z.boolean().optional().default(false),

  // Totales fiscales
  neto_gravado:    z.coerce.number().min(0).default(0),
  neto_no_gravado: z.coerce.number().min(0).default(0),
  exento:          z.coerce.number().min(0).default(0),
  iva_105:         z.coerce.number().min(0).default(0),
  iva_21:          z.coerce.number().min(0).default(0),
  iva_27:          z.coerce.number().min(0).default(0),
  otros_tributos:  z.coerce.number().min(0).default(0),
  total_amount:    z.coerce.number().min(0).default(0),

  // CAE / ARCA
  cae:             z.string().max(14).optional().nullable(),
  cae_vencimiento: z.string().optional().nullable(),

  // Relaciones
  client_id:   z.string().uuid().optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),

  // Notas
  notes: z.string().optional().nullable(),

  // Ítems
  items: z.array(invoiceItemSchema).min(1, 'La factura debe tener al menos un ítem'),

}).superRefine((data, ctx) => {
  const tipo   = data.tipo_comprobante
  const emisor = data.emisor_condicion_iva

  // ── 1. Tipos permitidos según condición del emisor ──────────────────────
  if ((emisor === 'MO' || emisor === 'EX') && !TIPOS_PARA_MO_EX.includes(tipo)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tipo_comprobante'],
      message: `Un emisor ${emisor === 'MO' ? 'Monotributista' : 'Exento'} solo puede emitir: ${TIPOS_PARA_MO_EX.join(', ')}`,
    })
  }
  if (emisor === 'RI' && !TIPOS_PARA_RI.includes(tipo) && !tipo.startsWith('Nota') && tipo !== 'Recibo') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tipo_comprobante'],
      message: `Un Responsable Inscripto no puede emitir ${tipo}`,
    })
  }

  // ── 2. Fecha de vencimiento condicional ─────────────────────────────────
  if (!TIPOS_SIN_VENCIMIENTO.includes(tipo) &&
      (!data.fecha_vencimiento || data.fecha_vencimiento.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fecha_vencimiento'],
      message: `La fecha de vencimiento es requerida para ${tipo}`,
    })
  }

  // ── 3. Receptor en Factura A / M ────────────────────────────────────────
  if (TIPOS_RECEPTOR_IDENTIFICADO.includes(tipo)) {
    if (!data.receptor_cuit || data.receptor_cuit.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_cuit'],
        message: `El CUIT del receptor es obligatorio para ${tipo}`,
      })
    } else if (!/^\d{2}-\d{8}-\d$/.test(data.receptor_cuit.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_cuit'],
        message: 'CUIT inválido. Formato esperado: XX-XXXXXXXX-X',
      })
    }
    if (!data.receptor_razon_social || data.receptor_razon_social.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_razon_social'],
        message: `La razón social del receptor es obligatoria para ${tipo}`,
      })
    }
    if (!data.receptor_condicion_iva || !TAX_CONDITION_RECEPTOR_AM.includes(data.receptor_condicion_iva)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_condicion_iva'],
        message: `Para ${tipo} el receptor debe ser Responsable Inscripto o Responsable Sustituto`,
      })
    }
  }

  // ── 4. Receptor en Factura B / C — umbral $100.000 ──────────────────────
  if (TIPOS_RECEPTOR_OPCIONAL.includes(tipo) && tipo !== 'Recibo') {
    const superaUmbral = (data.total_amount ?? 0) >= UMBRAL_CF_ARS
    const esCF = data.consumidor_final_anonimo === true

    if (superaUmbral || !esCF) {
      if (!data.receptor_cuit && !data.receptor_razon_social) {
        // Solo advertimos si el total supera el umbral; si no, es libre.
        if (superaUmbral) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['receptor_razon_social'],
            message: `Para ${tipo} con total ≥ $${UMBRAL_CF_ARS.toLocaleString('es-AR')} el receptor debe estar identificado`,
          })
        }
      }
    }
  }

  // ── 5. Factura E — validaciones de exportación ──────────────────────────
  if (TIPOS_EXPORTACION.includes(tipo)) {
    if (!data.receptor_id_impositivo || data.receptor_id_impositivo.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_id_impositivo'],
        message: 'El ID impositivo extranjero es obligatorio para Factura E',
      })
    }
    if (!data.receptor_razon_social || data.receptor_razon_social.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receptor_razon_social'],
        message: 'La razón social del destinatario es obligatoria para Factura E',
      })
    }
    if (!data.pais_destino) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pais_destino'],
        message: 'El país de destino es obligatorio para Factura E',
      })
    }
    if (data.moneda !== 'ARS' && (!data.tipo_cambio || data.tipo_cambio <= 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tipo_cambio'],
        message: 'Para Factura E en moneda extranjera el tipo de cambio debe ser mayor a 1',
      })
    }
  }

  // ── 6. Tipo de cambio obligatorio cuando moneda ≠ ARS ───────────────────
  if (data.moneda !== 'ARS' && (!data.tipo_cambio || data.tipo_cambio <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tipo_cambio'],
      message: 'El tipo de cambio es obligatorio cuando la moneda no es ARS',
    })
  }
})

// ── Schema de filtros ─────────────────────────────────────────────────────────
export const invoiceFilterSchema = z.object({
  status:    z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).optional(),
  type:      z.enum(['receivable', 'payable']).optional(),
  search:    z.string().optional(),
  companyId: z.string().uuid().optional(),
  dateFrom:  z.string().optional(),
  dateTo:    z.string().optional(),
  page:      z.coerce.number().int().positive().default(1),
  pageSize:  z.coerce.number().int().positive().max(100, 'Máximo 100 por página').default(20),
})
