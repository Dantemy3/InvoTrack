import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.coerce.number().positive('Debe ser mayor a 0'),
  unit_price: z.coerce.number().positive('Debe ser mayor a 0'),
  iva_rate: z.coerce.number().min(0),
  subtotal: z.coerce.number().optional(),
})

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Número de factura requerido'),
  invoice_type: z.string().min(1, 'Tipo de factura requerido'),
  // type: flujo financiero — receivable = cobrar (ingreso), payable = pagar (gasto)
  type: z.enum(['receivable', 'payable']).default('receivable'),
  issue_date: z.string().min(1, 'Fecha de emisión requerida'),
  due_date: z.string().optional(),
  client_id: z.string().uuid('Cliente inválido').optional().nullable(),
  provider_id: z.string().uuid('Proveedor inválido').optional().nullable(),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']),
  currency: z.string().default('ARS'),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Agregá al menos un ítem'),
})

export const invoiceFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})
