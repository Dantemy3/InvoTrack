import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  FLOW_OPTIONS,
  FLOW_PAYABLE,
  FLOW_RECEIVABLE,
  getFlowOption,
  isReceivable,
  ownPartyRole,
  counterpartyRole,
  partyToFormFields,
  counterpartyFormFields,
  ownPartyFormFields,
  emptyPartyFormFields,
  flowFormDefaults,
  getTiposPermitidosParaFlujo,
} from '@/features/invoices/lib/invoiceParties'
import { getComprobanteConfig } from '@/constants/comprobanteConfig'

const COMPANY = {
  name: 'Mi Empresa S.A.',
  cuit: '30-12345678-9',
  tax_condition: 'RI',
  street: 'Av. Corrientes',
  street_number: '1234',
  city: 'CABA',
  province: 'Buenos Aires',
  default_sale_point: 7,
}

const PROVIDER = {
  name: 'Proveedor S.R.L.',
  cuit: '30-98765432-1',
  tax_condition: 'RI',
  address: 'Av. Córdoba 555, CABA',
}

const FLOWS = [FLOW_RECEIVABLE, FLOW_PAYABLE]

// ── Quién es el emisor ───────────────────────────────────────────────────────

describe('mapa flujo → partes del comprobante', () => {
  it('al emitir somos el emisor y el cliente el receptor', () => {
    expect(ownPartyRole(FLOW_RECEIVABLE)).toBe('emisor')
    expect(counterpartyRole(FLOW_RECEIVABLE)).toBe('receptor')
    expect(isReceivable(FLOW_RECEIVABLE)).toBe(true)
  })

  it('al recibir el proveedor es el emisor y nosotros el receptor', () => {
    expect(ownPartyRole(FLOW_PAYABLE)).toBe('receptor')
    expect(counterpartyRole(FLOW_PAYABLE)).toBe('emisor')
    expect(isReceivable(FLOW_PAYABLE)).toBe(false)
  })

  it('las dos partes nunca ocupan el mismo rol', () => {
    fc.assert(
      fc.property(fc.constantFrom(...FLOWS), (flow) => ownPartyRole(flow) !== counterpartyRole(flow)),
      { numRuns: 10 }
    )
  })

  it('el flujo siempre cae en uno de los dos roles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FLOWS),
        (flow) => ['emisor', 'receptor'].includes(ownPartyRole(flow)) &&
                   ['emisor', 'receptor'].includes(counterpartyRole(flow))
      ),
      { numRuns: 10 }
    )
  })
})

describe('FLOW_OPTIONS', () => {
  it('expone exactamente los dos flujos de alta', () => {
    expect(FLOW_OPTIONS.map((o) => o.value)).toEqual([FLOW_RECEIVABLE, FLOW_PAYABLE])
  })

  it('cada opción declara su contraparte', () => {
    expect(getFlowOption(FLOW_RECEIVABLE).counterpartyNoun).toBe('cliente')
    expect(getFlowOption(FLOW_PAYABLE).counterpartyNoun).toBe('proveedor')
  })

  it('getFlowOption tolera un flujo desconocido', () => {
    expect(getFlowOption('nope')).toBeNull()
  })
})

// ── Traducción a campos del formulario ───────────────────────────────────────

describe('partyToFormFields', () => {
  it('escribe en el prefijo del emisor', () => {
    expect(partyToFormFields('emisor', { cuit: '30-1', razon_social: 'A', condicion_iva: 'RI', domicilio: 'X' }))
      .toEqual({
        emisor_cuit: '30-1',
        emisor_razon_social: 'A',
        emisor_condicion_iva: 'RI',
        emisor_domicilio: 'X',
      })
  })

  it('escribe en el prefijo del receptor', () => {
    expect(partyToFormFields('receptor', { cuit: '20-1', razon_social: 'B', condicion_iva: 'CF', domicilio: 'Y' }))
      .toEqual({
        receptor_cuit: '20-1',
        receptor_razon_social: 'B',
        receptor_condicion_iva: 'CF',
        receptor_domicilio: 'Y',
      })
  })

  it('nunca escribe un campo del rol contrario', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('emisor', 'receptor'),
        (role) => {
          const contrario = role === 'emisor' ? 'receptor' : 'emisor'
          const campos = Object.keys(
            partyToFormFields(role, {
              cuit: 'x', razon_social: 'y', condicion_iva: 'z', domicilio: 'w',
            })
          )
          return campos.every((c) => c.startsWith(`${role}_`)) &&
                 campos.every((c) => !c.startsWith(`${contrario}_`))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('rellena vacíos si la parte no tiene datos', () => {
    expect(partyToFormFields('emisor', {})).toEqual({
      emisor_cuit: '', emisor_razon_social: '', emisor_condicion_iva: '', emisor_domicilio: '',
    })
  })
})

describe('ownPartyFormFields / counterpartyFormFields', () => {
  it('al emitir, la empresa ocupa el emisor con sus datos fiscales', () => {
    expect(ownPartyFormFields(FLOW_RECEIVABLE, COMPANY)).toEqual({
      emisor_cuit: '30-12345678-9',
      emisor_razon_social: 'Mi Empresa S.A.',
      emisor_condicion_iva: 'RI',
      emisor_domicilio: 'Av. Corrientes 1234, CABA, Buenos Aires',
    })
  })

  it('al recibir, la empresa ocupa el receptor y el proveedor el emisor', () => {
    expect(ownPartyFormFields(FLOW_PAYABLE, COMPANY).receptor_cuit).toBe('30-12345678-9')
    expect(counterpartyFormFields(FLOW_PAYABLE, PROVIDER).emisor_razon_social).toBe('Proveedor S.R.L.')
  })

  it('el CUIT de la empresa nunca aparece en el lado de la contraparte', () => {
    const vacio = emptyPartyFormFields(counterpartyRole(FLOW_RECEIVABLE))
    expect(Object.keys(vacio)).toEqual([
      'receptor_cuit', 'receptor_razon_social', 'receptor_condicion_iva', 'receptor_domicilio',
    ])
    expect(Object.values(counterpartyFormFields(FLOW_RECEIVABLE, PROVIDER)))
      .not.toContain('30-12345678-9')
    expect(Object.values(counterpartyFormFields(FLOW_PAYABLE, PROVIDER)))
      .not.toContain('30-12345678-9')
  })
})

// ── Valores iniciales ────────────────────────────────────────────────────────

describe('flowFormDefaults', () => {
  it('deja limpia la contraparte y sin vínculos a cliente/proveedor', () => {
    const defaults = flowFormDefaults(FLOW_RECEIVABLE, COMPANY)
    expect(defaults.type).toBe(FLOW_RECEIVABLE)
    expect(defaults.client_id).toBeNull()
    expect(defaults.provider_id).toBeNull()
    expect(defaults.receptor_cuit).toBe('')
  })

  it('para "me emitieron" la contraparte es el emisor y arranca vacío', () => {
    const defaults = flowFormDefaults(FLOW_PAYABLE, COMPANY)
    expect(defaults.type).toBe(FLOW_PAYABLE)
    expect(defaults.emisor_cuit).toBe('')
    expect(defaults.receptor_cuit).toBe('30-12345678-9')
  })

  it('permite pisar valores (ej: numeración de ARCA u OCR)', () => {
    expect(flowFormDefaults(FLOW_PAYABLE, COMPANY, { punto_de_venta: 3, numero_comprobante: 55 }))
      .toMatchObject({ punto_de_venta: 3, numero_comprobante: 55 })
  })

  it('funciona sin empresa (no rompe la creación)', () => {
    const defaults = flowFormDefaults(FLOW_RECEIVABLE, null)
    expect(defaults.emisor_cuit).toBe('')
    expect(defaults.type).toBe(FLOW_RECEIVABLE)
  })
})

// ── Tipos de comprobante permitidos ─────────────────────────────────────────

describe('getTiposPermitidosParaFlujo', () => {
  it('un Monotributista solo puede emitir Factura C', () => {
    const tipos = getTiposPermitidosParaFlujo(FLOW_RECEIVABLE, 'MO')
    expect(tipos).toContain('Factura C')
    expect(tipos).not.toContain('Factura A')
    expect(tipos).not.toContain('Factura B')
  })

  it('un Monotributista solo puede recibir Factura C', () => {
    const tipos = getTiposPermitidosParaFlujo(FLOW_PAYABLE, 'MO')
    expect(tipos).toContain('Factura C')
    expect(tipos).not.toContain('Factura A')
  })

  it('un Exento puede recibir una Factura A aunque no pueda emitirla', () => {
    expect(getTiposPermitidosParaFlujo(FLOW_RECEIVABLE, 'EX')).not.toContain('Factura A')
    expect(getTiposPermitidosParaFlujo(FLOW_PAYABLE, 'EX')).toContain('Factura A')
  })

  it('un Responsable Inscripto puede emitir y recibir de todo', () => {
    for (const flow of FLOWS) {
      const tipos = getTiposPermitidosParaFlujo(flow, 'RI')
      expect(tipos).toContain('Factura A')
      expect(tipos).toContain('Factura B')
    }
  })

  it('sin condición fiscal no deja el tipo sin opciones', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FLOWS),
        (flow) => getTiposPermitidosParaFlujo(flow, undefined).length > 0
      ),
      { numRuns: 10 }
    )
  })

  it('los tipos devueltos siempre tienen configuración asociada', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FLOWS),
        fc.constantFrom('RI', 'MO', 'EX', 'CF', 'RS'),
        (flow, condicion) =>
          getTiposPermitidosParaFlujo(flow, condicion).every((t) => getComprobanteConfig(t).nombre !== 'Desconocido')
      ),
      { numRuns: 50 }
    )
  })
})
