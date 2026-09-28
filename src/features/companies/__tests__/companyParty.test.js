import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  buildCompanyAddress,
  companyToParty,
  contactToParty,
  missingCompanyProfileFields,
  isCompanyProfileComplete,
} from '@/features/companies/lib/companyParty'

// ── buildCompanyAddress ──────────────────────────────────────────────────────

describe('buildCompanyAddress', () => {
  it('compone calle, número, localidad y provincia en una línea', () => {
    expect(buildCompanyAddress({
      street: 'Av. Corrientes',
      street_number: '1234',
      city: 'Ciudad Autónoma de Buenos Aires',
      province: 'Buenos Aires',
    })).toBe('Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Buenos Aires')
  })

  it('omite las partes que no están completas', () => {
    expect(buildCompanyAddress({ street: 'Av. Santa Fe', city: 'Rosario' }))
      .toBe('Av. Santa Fe, Rosario')
  })

  it('cae al address legacy cuando no hay partes desglosadas', () => {
    expect(buildCompanyAddress({ address: 'Calle Legacy 100' })).toBe('Calle Legacy 100')
  })

  it('devuelve string vacío para una empresa inexistente', () => {
    expect(buildCompanyAddress(null)).toBe('')
  })

  it('nunca devuelve espacios sueltos', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        (street, street_number, city, province, address) => {
          const result = buildCompanyAddress({ street, street_number, city, province, address })
          return result === result.trim()
        }
      ),
      { numRuns: 200 }
    )
  })

  it('siempre incluye la calle cuando hay calle', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (street, street_number, city, province) => {
          const result = buildCompanyAddress({ street, street_number, city, province })
          return result.startsWith(street.trim()) || street.trim() === ''
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ── companyToParty ───────────────────────────────────────────────────────────

describe('companyToParty', () => {
  it('mapea la empresa a los campos de emisor del comprobante', () => {
    expect(companyToParty({
      name: 'Mi Empresa S.A.',
      cuit: '30-12345678-9',
      tax_condition: 'RI',
      street: 'Av. Corrientes',
      street_number: '1234',
      city: 'CABA',
      province: 'Buenos Aires',
    })).toEqual({
      cuit: '30-12345678-9',
      razon_social: 'Mi Empresa S.A.',
      condicion_iva: 'RI',
      domicilio: 'Av. Corrientes 1234, CABA, Buenos Aires',
    })
  })

  it('devuelve una parte vacía si no hay empresa', () => {
    expect(companyToParty(null)).toEqual({
      cuit: '', razon_social: '', condicion_iva: '', domicilio: '',
    })
  })

  it('usa la misma forma que para clientes y proveedores', () => {
    const contact = { name: 'Acme', cuit: '20-98765432-1', tax_condition: 'RI', address: 'Calle 1' }
    expect(Object.keys(contactToParty(contact)).sort())
      .toEqual(Object.keys(companyToParty({ name: 'X' })).sort())
  })
})

// ── Completitud de la ficha ──────────────────────────────────────────────────

describe('missingCompanyProfileFields', () => {
  it('no falta nada en una ficha completa', () => {
    expect(missingCompanyProfileFields({
      name: 'Mi Empresa S.A.',
      cuit: '30-12345678-9',
      tax_condition: 'RI',
      address: 'Av. Corrientes 1234, CABA',
    })).toEqual([])
    expect(isCompanyProfileComplete({
      name: 'Mi Empresa S.A.',
      cuit: '30-12345678-9',
      tax_condition: 'RI',
      address: 'Av. Corrientes 1234, CABA',
    })).toBe(true)
  })

  it('detecta cada dato faltante por separado', () => {
    expect(missingCompanyProfileFields({})).toEqual(['razón social', 'CUIT', 'condición IVA', 'domicilio'])
    expect(missingCompanyProfileFields({ name: 'X', cuit: '30-12345678-9' }))
      .toEqual(['condición IVA', 'domicilio'])
  })

  it('detecta el domicilio vacío aunque las partes existan incompletas', () => {
    expect(missingCompanyProfileFields({
      name: 'X', cuit: '30-12345678-9', tax_condition: 'RI', street: 'Av. Corrientes',
    })).toEqual(['domicilio'])
  })
})
