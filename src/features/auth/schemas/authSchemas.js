import { z } from 'zod'

/**
 * Validates Argentine CUIT format: XX-XXXXXXXX-X
 * Requirement 8.6
 */
export const cuitSchema = z.string().regex(
  /^\d{2}-\d{8}-\d$/,
  'CUIT inválido. Formato esperado: XX-XXXXXXXX-X'
)

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})
