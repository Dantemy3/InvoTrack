import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/, 'CUIT inválido (formato: 20-12345678-9)').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_condition: z.string().optional(),
  notes: z.string().optional(),
})
