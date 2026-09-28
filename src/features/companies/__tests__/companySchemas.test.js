import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  companyFiscalSchema,
  buildCompanyPayload,
  fiscalValuesFromCompany,
  COMPANY_TAX_CONDITION_VALUES,
} from '@/features/companies/schemas/companySchemas'

const EMPRESA_COMPLETA = {
  entity_type: 'empresa',
  name: 'Mi Empresa S.A.',
  cuit: '30-12345678-9',
  tax_condition: 'RI',
  activity: '620100',
  street: 'Av. Corrientes',
  street_number: '1234',
  city: 'Ciudad Autónoma de Buenos Aires',
  province: 'Buenos Aires',
  phone: '11-1234-5678',
  email: 'facturacion@miempresa.com',
  default_sale_point: 4,
}

const PERSONA_COMPLETA = {
  entity_type: 'persona_humana',
  name: 'Juan Pérez',
  cuit: '20-12345678-9',
  tax_condition: 'MO',
  street: '',
  street_number: '',
  city: '',
  province: '',
  phone: '',
  email: '',
}

describe('companyFiscalSchema — ficha fiscal de la empresa', () => {
  it('acepta una empresa con todos los datos', () => {
    expect(companyFiscalSchema.safeParse(EMPRESA_COMPLETA).success).toBe(true)
  })

  it('acepta una persona humana sin domicilio', () => {
    expect(companyFiscalSchema.safeParse(PERSONA_COMPLETA).success).toBe(true)
  })

  it('exige el CUIT en formato XX-XXXXXXXX-X', () => {
    const r = companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, cuit: '30123456789' })
    expect(r.success).toBe(false)
    expect(r.error.issues.some((i) => i.path[0] === 'cuit')).toBe(true)
  })

  it('exige CUIT, nombre y condición fiscal siempre', () => {
    const r = companyFiscalSchema.safeParse({ entity_type: 'persona_humana' })
    expect(r.success).toBe(false)
    const paths = r.error.issues.map((i) => i.path[0])
    expect(paths).toContain('name')
    expect(paths).toContain('cuit')
    expect(paths).toContain('tax_condition')
  })

  it('exige domicilio fiscal completo solo para empresas', () => {
    const sinDomicilio = { ...EMPRESA_COMPLETA, city: '', province: '' }
    const r = companyFiscalSchema.safeParse(sinDomicilio)
    expect(r.success).toBe(false)
    const paths = r.error.issues.map((i) => i.path[0])
    expect(paths).toContain('city')
    expect(paths).toContain('province')
  })

  it('rechaza una condición fiscal inexistente', () => {
    expect(companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, tax_condition: 'XX' }).success).toBe(false)
  })

  it('rechaza emails inválidos', () => {
    expect(companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, email: 'no-es-mail' }).success).toBe(false)
  })

  it('acepta cualquier condición fiscal válida', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPANY_TAX_CONDITION_VALUES),
        (condicion) => companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, tax_condition: condicion }).success
      ),
      { numRuns: 20 }
    )
  })

  it('rechaza el punto de venta 0 o mayor a 99999', () => {
    expect(companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, default_sale_point: 0 }).success).toBe(false)
    expect(companyFiscalSchema.safeParse({ ...EMPRESA_COMPLETA, default_sale_point: 100000 }).success).toBe(false)
  })
})

describe('buildCompanyPayload', () => {
  it('compone el address y descarta los campos vacíos', () => {
    const payload = buildCompanyPayload({
      ...EMPRESA_COMPLETA,
      activity: '   ',
      phone: ' 11-1234-5678 ',
    })
    expect(payload.address).toBe('Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Buenos Aires')
    expect(payload).not.toHaveProperty('activity')
    expect(payload.phone).toBe('11-1234-5678')
  })

  it('no manda punto de venta para una persona humana', () => {
    expect(buildCompanyPayload({ ...PERSONA_COMPLETA, default_sale_point: 7 }))
      .not.toHaveProperty('default_sale_point')
  })

  it('siempre incluye los datos que identifican al emisor', () => {
    const payload = buildCompanyPayload(PERSONA_COMPLETA)
    expect(payload).toMatchObject({
      entity_type: 'persona_humana',
      name: 'Juan Pérez',
      cuit: '20-12345678-9',
      tax_condition: 'MO',
    })
  })
})

describe('fiscalValuesFromCompany', () => {
  it('prellena el wizard con lo que ya está guardado', () => {
    expect(fiscalValuesFromCompany({
      name: 'Mi Empresa S.A.',
      cuit: '30-12345678-9',
      tax_condition: 'RI',
      street: 'Av. Corrientes',
      street_number: '1234',
      city: 'CABA',
      province: 'Buenos Aires',
    })).toMatchObject({
      name: 'Mi Empresa S.A.',
      cuit: '30-12345678-9',
      street: 'Av. Corrientes',
    })
  })

  it('devuelve un objeto vacío sin empresa', () => {
    expect(fiscalValuesFromCompany(null)).toEqual({})
  })
})
