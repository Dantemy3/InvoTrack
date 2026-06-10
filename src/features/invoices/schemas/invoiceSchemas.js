import { z } from 'zod'
import { IVA_VALID_RATES, SUPPORTED_CURRENCIES } from '@/lib/constants'
import { cuitSchema } from '@/features/auth/schemas/authSchemas'

// ── Tipos de comprobante AFIP ─────────────────────────────────────────────────
export const TIPOS_COMPROBANTE = [
  'Factura A', 'Factura B', 'Factura C', 'Factura M',
  'Nota de Crédito A', 'Nota de Crédito B', 'Nota de Crédito C',
  'Nota de Débito A', 'Nota de Débito B', 'Nota de Débito C',
  'Recibo',
]

// ── Tipos que requieren datos COMPLETOS del receptor (CUIT + razón social + condición IVA)
// Factura A y M: operaciones entre responsables inscriptos — receptor siempre identificado.
export const TIPOS_RECEPTOR_IDENTIFICADO = [
  'Factura A', 'Factura M',
  'Nota de Crédito A', 'Nota de Débito A',
]

// ── Tipos donde el receptor puede ser Consumidor Final (sin CUIT ni razón social)
// Factura C: emitida por Monotributistas a cualquier receptor.
// Factura B: para consumidor final (aunque técnicamente puede tener datos).
// Recibo, Notas B/C: idem.
export const TIPOS_RECEPTOR_OPCIONAL = [
  'Factura B', 'Factura C',
  'Nota de Crédito B', 'Nota de Débito B',
  'Nota de Crédito C', 'Nota de Débito C',
  'Recibo',
]
// Factura C: emitida por Monotributistas, no requiere vencimiento.
// Recibo: comprobante de pago, no tiene vencimiento.
// Notas de Crédito/Débito: ajustes, no tienen vencimiento propio.
export const TIPOS_SIN_VENCIMIENTO = [
  'Factura C',
  'Recibo',
  'Nota de Crédito A', 'Nota de Crédito B', 'Nota de Crédito C',
  'Nota de Débito A', 'Nota de Débito B', 'Nota de Débito C',
]

// ── Condiciones de pago ───────────────────────────────────────────────────────
// Bug 2 — Ampliar las condiciones de pago más allá de contado/cuenta_corriente
export const CONDICIONES_PAGO = [
  { value: 'contado',           label: 'Contado' },
  { value: 'cuenta_corriente',  label: 'Cuenta corriente' },
  { value: '15_dias',           label: '15 días' },
  { value: '30_dias',           label: '30 días' },
  { value: '60_dias',           label: '60 días' },
  { value: '90_dias',           label: '90 días' },
  { value: 'contra_entrega',    label: 'Contra entrega' },
  { value: 'anticipado',        label: 'Pago anticipado' },
]

export const CONDICIONES_PAGO_VALUES = CONDICIONES_PAGO.map((c) => c.value)

// z.enum() requiere un tuple de al menos 2 elementos, no un array dinámico.
// Lo casteamos con 'as const' equivalente para que Zod lo acepte.
export const CONDICIONES_PAGO_ENUM = /** @type {[string, ...string[]]} */ (CONDICIONES_PAGO_VALUES)

// ── Condiciones IVA ───────────────────────────────────────────────────────────
export const TAX_CONDITION_VALUES = ['RI', 'MO', 'EX', 'CF', 'RS']

// ── Schema de ítem de factura ─────────────────────────────────────────────────
// Bug 7 — Todos los mensajes de error en español
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
  subtotal_iva: z.coerce.number().optional(),
  sort_order: z.number().int().optional(),
})

// ── Schema principal de factura ───────────────────────────────────────────────
// Bug 2: condiciones de pago ampliadas
// Bug 4: fecha de vencimiento condicional según tipo de comprobante
// Bug 5: mismo que bug 4 — tipos sin vencimiento
// Bug 6: emisor y receptor obligatorios
// Bug 7: todos los mensajes en español
export const invoiceSchema = z.object({
  // Tipo y flujo
  tipo_comprobante: z.enum(TIPOS_COMPROBANTE, {
    errorMap: () => ({ message: 'Seleccioná un tipo de comprobante válido' }),
  }),
  type: z.enum(['receivable', 'payable'], {
    errorMap: () => ({ message: 'Seleccioná un tipo de flujo válido' }),
  }),

  // Numeración AFIP
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
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  // Bug 4/5 — Se valida condicionalmente en el .superRefine() de abajo
  fecha_vencimiento: z.string().optional().nullable(),

  // Bug 2 — Condiciones de pago ampliadas
  condicion_pago: z.enum(CONDICIONES_PAGO_ENUM, {
    errorMap: () => ({ message: 'Seleccioná una condición de pago válida' }),
  }),

  // Moneda
  moneda: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `Moneda inválida. Valores permitidos: ${SUPPORTED_CURRENCIES.join(', ')}` }),
  }).default('ARS'),
  tipo_cambio: z.coerce
    .number({ invalid_type_error: 'El tipo de cambio debe ser un número' })
    .positive('El tipo de cambio debe ser mayor a 0')
    .default(1.0),

  // Bug 6 — Emisor siempre obligatorio (el emisor es siempre la empresa)
  emisor_cuit: cuitSchema.or(z.literal('')).refine(
    (v) => v && v.trim() !== '',
    { message: 'El CUIT del emisor es requerido' }
  ),
  emisor_razon_social: z.string().min(1, 'La razón social del emisor es requerida'),
  emisor_condicion_iva: z.enum(TAX_CONDITION_VALUES, {
    errorMap: () => ({ message: 'Seleccioná la condición de IVA del emisor' }),
  }),
  emisor_domicilio: z.string().optional().nullable(),

  // Receptor — siempre obligatorio (igual que el emisor).
  receptor_cuit: cuitSchema.or(z.literal('')).refine(
    (v) => v && v.trim() !== '',
    { message: 'El CUIT del receptor es requerido' }
  ),
  receptor_razon_social: z.string().min(1, 'La razón social del receptor es requerida'),
  receptor_condicion_iva: z.enum(TAX_CONDITION_VALUES, {
    errorMap: () => ({ message: 'Seleccioná la condición de IVA del receptor' }),
  }),
  receptor_domicilio: z.string().optional().nullable(),

  // Totales fiscales (calculados en frontend antes de persistir)
  neto_gravado: z.coerce.number().min(0).default(0),
  neto_no_gravado: z.coerce.number().min(0).default(0),
  exento: z.coerce.number().min(0).default(0),
  iva_105: z.coerce.number().min(0).default(0),
  iva_21: z.coerce.number().min(0).default(0),
  iva_27: z.coerce.number().min(0).default(0),
  otros_tributos: z.coerce.number().min(0).default(0),
  total_amount: z.coerce.number().min(0).default(0),

  // CAE / AFIP
  cae: z.string().max(14).optional().nullable(),
  cae_vencimiento: z.string().optional().nullable(),

  // Relaciones opcionales
  client_id: z.string().uuid().optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),

  // Notas
  notes: z.string().optional().nullable(),

  // Ítems (array requerido, mínimo 1)
  items: z.array(invoiceItemSchema).min(1, 'La factura debe tener al menos un ítem'),
}).superRefine((data, ctx) => {
  // Validación 1 — Fecha de vencimiento condicional
  const requiereVencimiento = !TIPOS_SIN_VENCIMIENTO.includes(data.tipo_comprobante)
  if (requiereVencimiento && (!data.fecha_vencimiento || data.fecha_vencimiento.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fecha_vencimiento'],
      message: `La fecha de vencimiento es requerida para ${data.tipo_comprobante}`,
    })
  }

  // Validación 2 — El receptor siempre es requerido (validación a nivel campo arriba).
  // Se mantiene el bloque por compatibilidad pero ya no agrega issues adicionales.
})

// ── Schema de filtros para listado de facturas ────────────────────────────────
// Req 5.8, 9.1
export const invoiceFilterSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).optional(),
  type: z.enum(['receivable', 'payable']).optional(),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100, 'Máximo 100 por página').default(20),
})
