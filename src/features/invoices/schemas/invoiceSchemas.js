import { z } from 'zod'
import { IVA_VALID_RATES } from '@/lib/constants'
import { cuitSchema } from '@/features/auth/schemas/authSchemas'

// ── Tipos de comprobante AFIP ─────────────────────────────────────────────────
export const TIPOS_COMPROBANTE = [
  'Factura A', 'Factura B', 'Factura C', 'Factura M',
  'Nota de Crédito A', 'Nota de Crédito B', 'Nota de Crédito C',
  'Nota de Débito A', 'Nota de Débito B', 'Nota de Débito C',
  'Recibo',
]

// ── Condiciones IVA ───────────────────────────────────────────────────────────
export const TAX_CONDITION_VALUES = ['RI', 'MO', 'EX', 'CF', 'RS']

// ── Schema de ítem de factura ─────────────────────────────────────────────────
// Req 5.7, 5.13
export const invoiceItemSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.coerce
    .number({ invalid_type_error: 'Cantidad inválida' })
    .positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  precio_unitario: z.coerce
    .number({ invalid_type_error: 'Precio inválido' })
    .positive('El precio debe ser mayor a 0'),
  alicuota_iva: z.coerce
    .number({ invalid_type_error: 'Alícuota inválida' })
    .refine(
      (v) => IVA_VALID_RATES.includes(v),
      { message: `Alícuota IVA inválida. Valores permitidos: ${IVA_VALID_RATES.join(', ')}` }
    ),
  subtotal_neto: z.coerce.number().optional(),
  subtotal_iva: z.coerce.number().optional(),
  sort_order: z.number().int().optional(),
})

// ── Schema principal de factura ───────────────────────────────────────────────
// Req 5.9, 5.10, 5.11, 5.12
export const invoiceSchema = z.object({
  // Tipo y flujo
  tipo_comprobante: z.enum(TIPOS_COMPROBANTE, {
    errorMap: () => ({ message: 'Tipo de comprobante inválido' }),
  }),
  type: z.enum(['receivable', 'payable'], {
    errorMap: () => ({ message: 'Tipo de flujo inválido' }),
  }),

  // Numeración AFIP
  punto_de_venta: z.coerce
    .number({ invalid_type_error: 'Punto de venta inválido' })
    .int()
    .min(1, 'Mínimo 1')
    .max(99999, 'Máximo 99999'),
  numero_comprobante: z.coerce
    .number({ invalid_type_error: 'Número de comprobante inválido' })
    .int()
    .positive('Debe ser positivo'),

  // Fechas
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().optional().nullable(),

  // Condición de pago
  condicion_pago: z.enum(['contado', 'cuenta_corriente'], {
    errorMap: () => ({ message: 'Condición de pago inválida' }),
  }),

  // Moneda
  moneda: z.string().length(3, 'Código de moneda debe tener 3 caracteres').default('ARS'),
  tipo_cambio: z.coerce
    .number()
    .positive('El tipo de cambio debe ser positivo')
    .default(1.0),

  // Datos del emisor
  emisor_cuit: cuitSchema.or(z.literal('')).optional().nullable(),
  emisor_razon_social: z.string().optional().nullable(),
  emisor_condicion_iva: z.enum(TAX_CONDITION_VALUES).optional().nullable(),
  emisor_domicilio: z.string().optional().nullable(),

  // Datos del receptor
  receptor_cuit: cuitSchema.or(z.literal('')).optional().nullable(),
  receptor_razon_social: z.string().optional().nullable(),
  receptor_condicion_iva: z.enum(TAX_CONDITION_VALUES).optional().nullable(),
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
