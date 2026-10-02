import { z } from 'zod'
import { registerSchema } from '@/features/auth/schemas/authSchemas'
import { companyFiscalSchema } from '@/features/companies/schemas/companySchemas'

// La cuenta y la ficha fiscal se validan juntas antes de llamar a Supabase Auth.
export const registrationSchema = z.object({
  account: registerSchema,
  company: companyFiscalSchema,
})
