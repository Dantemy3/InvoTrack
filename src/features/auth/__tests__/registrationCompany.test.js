import { describe, expect, it } from 'vitest'
import { registrationSchema } from '@/features/auth/schemas/registrationSchemas'
import { registrationMetadata, pendingCompanyFromUser } from '@/features/auth/lib/registrationCompany'

const validRegistration = {
  account: {
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    password: 'segura123',
    confirmPassword: 'segura123',
  },
  company: {
    entity_type: 'empresa',
    name: 'Empresa de Ana S.A.',
    cuit: '30-12345678-9',
    tax_condition: 'RI',
    street: 'Av. Corrientes',
    street_number: '1234',
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    default_sale_point: 1,
  },
}

describe('registro con ficha fiscal', () => {
  it('exige los datos fiscales antes de crear la cuenta', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true)
    const result = registrationSchema.safeParse({
      ...validRegistration,
      company: { ...validRegistration.company, cuit: '', street: '' },
    })
    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['company.cuit', 'company.street'])
    )
  })

  it('conserva la ficha fiscal tras confirmar el email, sin guardar la contraseña', () => {
    const data = registrationSchema.parse(validRegistration)
    const metadata = registrationMetadata(data)
    expect(JSON.stringify(metadata)).not.toContain(data.account.password)
    expect(metadata.company_profile).toMatchObject({
      name: 'Empresa de Ana S.A.',
      cuit: '30-12345678-9',
      address: 'Av. Corrientes 1234, Buenos Aires, Buenos Aires',
    })
    expect(pendingCompanyFromUser({ user_metadata: metadata })).toMatchObject(metadata.company_profile)
  })

  it('ignora una ficha fiscal incompleta en la metadata', () => {
    expect(pendingCompanyFromUser({ user_metadata: { company_profile: { name: 'Incompleta' } } })).toBeNull()
  })
})
