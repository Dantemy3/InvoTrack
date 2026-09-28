import { z } from 'zod'
import { cuitSchema } from '@/features/auth/schemas/authSchemas'
import { buildCompanyAddress } from '@/features/companies/lib/companyParty'

/**
 * Tipos de emisor soportados. Define qué campos pide el onboarding y
 * cómo se titulan en el formulario fiscal.
 * - persona_humana: monotributista / consumidor final que factura a nombre propio
 * - empresa: sociedad o persona con actividad económica registrada
 */
export const ENTITY_TYPES = [
  {
    value: 'empresa',
    label: 'Empresa',
    description: 'Sociedad, cooperative osucursal con CUIT propio.',
  },
  {
    value: 'persona_humana',
    label: 'Persona humana',
    description: 'Facturás a nombre propio (monotributista, consumidor final).',
  },
]

export const ENTITY_TYPE_VALUES = ENTITY_TYPES.map((t) => t.value)

// ── Condición frente al IVA ───────────────────────────────────────────────────
export const COMPANY_TAX_CONDITIONS = [
  { value: 'RI', label: 'Responsable Inscripto', hint: 'Factura A, B, C, M y E' },
  { value: 'MO', label: 'Monotributista', hint: 'Solo Factura C y Ticket' },
  { value: 'EX', label: 'Exento', hint: 'Comprobantes sin IVA' },
  { value: 'CF', label: 'Consumidor Final', hint: 'No genera crédito fiscal' },
  { value: 'RS', label: 'Responsable Sustituto', hint: 'Emite en lugar de terceros' },
]

export const COMPANY_TAX_CONDITION_VALUES = COMPANY_TAX_CONDITIONS.map((c) => c.value)

export const TAX_CONDITION_LABELS = Object.fromEntries(
  COMPANY_TAX_CONDITIONS.map((c) => [c.value, c.label])
)

/**
 * Condiciones ofrecidas a una persona humana. Monotributista y Consumidor
 * Final son las dos categorías reales; el resto solo aplica a sociedades.
 */
export const PERSONA_HUMANA_TAX_CONDITIONS = COMPANY_TAX_CONDITIONS.filter(
  (c) => c.value === 'MO' || c.value === 'CF'
)

// ── Provincias y jurisdicciones (para el domicilio fiscal) ─────────────────────
export const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur',
  'Tucumán',
]

// ── Paso 1: tipo de emisor ────────────────────────────────────────────────────
export const entityTypeSchema = z.enum(ENTITY_TYPE_VALUES, {
  errorMap: () => ({ message: 'Elegí si emitís como empresa o como persona humana' }),
})

// ── Paso 2: ficha fiscal ──────────────────────────────────────────────────────
const optionalText = (max = 200) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().or(z.literal(''))

export const companyFiscalSchema = z
  .object({
    entity_type: z.enum(ENTITY_TYPE_VALUES, {
      errorMap: () => ({ message: 'Seleccioná el tipo de emisor' }),
    }),
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    cuit: cuitSchema,
    tax_condition: z.enum(COMPANY_TAX_CONDITION_VALUES, {
      errorMap: () => ({ message: 'Seleccioná una condición fiscal' }),
    }),

    // Actividad principal (solo empresas)
    activity: optionalText(),

    // Domicilio fiscal
    street: optionalText(),
    street_number: optionalText(20),
    city: optionalText(),
    province: z.string().optional().or(z.literal('')),

    // Contacto
    phone: optionalText(40),
    email: z.string().trim().email('Email inválido').optional().or(z.literal('')),

    // Numeración propia de comprobantes (solo empresas)
    default_sale_point: z.coerce
      .number({ invalid_type_error: 'El punto de venta debe ser un número' })
      .int('El punto de venta debe ser un número entero')
      .min(1, 'El punto de venta mínimo es 1')
      .max(99999, 'El punto de venta máximo es 99999')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Una empresa necesita domicilio fiscal completo: sin él la factura
    // sale con el domicilio vacío. A una persona humana le alcanza con
    // nombre + CUIT, porque su comprobante es una Factura C o Ticket.
    if (data.entity_type !== 'empresa') return

    if (!data.street) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['street'], message: 'La calle es requerida' })
    }
    if (!data.street_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['street_number'], message: 'El número es requerido' })
    }
    if (!data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'La localidad es requerida' })
    }
    if (!data.province) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['province'], message: 'La provincia es requerida' })
    }
  })

/** Datos iniciales del wizard a partir de una empresa ya existente. */
export function fiscalValuesFromCompany(company) {
  if (!company) return {}
  return {
    entity_type: company.entity_type ?? 'empresa',
    name: company.name ?? '',
    cuit: company.cuit ?? '',
    tax_condition: company.tax_condition ?? 'RI',
    activity: company.activity ?? '',
    street: company.street ?? '',
    street_number: company.street_number ?? '',
    city: company.city ?? '',
    province: company.province ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    default_sale_point: company.default_sale_point ?? 1,
  }
}

/**
 * Normaliza la salida del schema fiscal a un payload de Supabase:
 * sin strings vacíos y con `address` compuesto desde las partes del domicilio.
 *
 * @param {object} data — datos ya validados por `companyFiscalSchema`
 * @returns {object} payload para `companyService.create` / `.update`
 */
export function buildCompanyPayload(data) {
  const payload = {
    entity_type: data.entity_type ?? 'empresa',
    name: data.name.trim(),
    cuit: data.cuit.trim(),
    tax_condition: data.tax_condition,
    address: buildCompanyAddress(data),
  }

  const opcionales = ['activity', 'street', 'street_number', 'city', 'province', 'phone', 'email']
  for (const key of opcionales) {
    const value = data[key]
    if (typeof value === 'string') {
      // Se descartan los strings vacíos o solo con espacios: la columna
      // queda en NULL en vez de guardar "   ".
      const trimmed = value.trim()
      if (trimmed) payload[key] = trimmed
    } else if (value != null) {
      payload[key] = value
    }
  }

  // El punto de venta solo aplica a empresas con numeración propia.
  if (payload.entity_type === 'empresa' && data.default_sale_point) {
    payload.default_sale_point = Number(data.default_sale_point)
  }

  return payload
}
