import { buildCompanyPayload, companyFiscalSchema } from '@/features/companies/schemas/companySchemas'

export function registrationMetadata({ account, company }) {
  return {
    full_name: account.fullName.trim(),
    company_profile: buildCompanyPayload(company),
  }
}

// Los datos fiscales quedan en la metadata de Auth mientras se confirma el email.
// Se vuelven a validar antes de crear la empresa con la sesión autenticada.
export function pendingCompanyFromUser(user) {
  const result = companyFiscalSchema.safeParse(user?.user_metadata?.company_profile)
  return result.success ? buildCompanyPayload(result.data) : null
}
