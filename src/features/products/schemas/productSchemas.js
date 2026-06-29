import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0'),
  unit: z.string().optional().default('un'),
})
