import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { invoiceSchema } from '@/features/invoices/schemas/invoiceSchemas'

/**
 * La validación fiscal depende de QUIÉN es el emisor, y eso lo decide el
 * flujo. En 'payable' el emisor es el proveedor, así que su condición fiscal
 * no puede vetar el tipo de comprobante que nos pasa a nosotros.
 */

const RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA = {
  type: 'payable',
  tipo_comprobante: 'Factura A',
  punto_de_venta: 1,
  numero_comprobante: 100,
  fecha_emision: '2026-03-01',
  fecha_vencimiento: '2026-03-31',
  condicion_pago: 'contado',
  emisor_cuit: '30-98765432-1',
  emisor_razon_social: 'Proveedor S.R.L.',
  emisor_condicion_iva: 'MO',
  receptor_cuit: '30-12345678-9',
  receptor_razon_social: 'Mi Empresa S.A.',
  receptor_condicion_iva: 'RI',
  receptor_domicilio: 'Av. Corrientes 1234, CABA',
  moneda: 'ARS',
  cae: '74123456789012',
  cae_vencimiento: '2026-03-31',
  total_amount: 1210,
  items: [{
    descripcion: 'Servicio',
    cantidad: 1,
    precio_unitario: 1000,
    alicuota_iva: 21,
  }],
}

const EMITIDA_POR_NOSOTROS = {
  ...RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA,
  type: 'receivable',
  emisor_cuit: '30-12345678-9',
  emisor_razon_social: 'Mi Empresa S.A.',
  emisor_condicion_iva: 'RI',
  receptor_cuit: '30-11223344-5',
  receptor_razon_social: 'Cliente S.A.',
  receptor_condicion_iva: 'RI',
  receptor_domicilio: 'Av. Santa Fe 100, Rosario',
}

describe('invoiceSchema según el flujo', () => {
  it('acepta una factura A que nos emite un proveedor Monotributista', () => {
    expect(invoiceSchema.safeParse(RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA).success).toBe(true)
  })

  it('sigue rechazando que una empresa RI emita una Factura C', () => {
    const r = invoiceSchema.safeParse({ ...EMITIDA_POR_NOSOTROS, tipo_comprobante: 'Factura C' })
    expect(r.success).toBe(false)
    expect(r.error.issues.some((i) => i.path[0] === 'tipo_comprobante')).toBe(true)
  })

  it('sigue rechazando que un emisor MO emita una Factura A', () => {
    const r = invoiceSchema.safeParse({
      ...EMITIDA_POR_NOSOTROS,
      emisor_condicion_iva: 'MO',
      tipo_comprobante: 'Factura A',
    })
    expect(r.success).toBe(false)
    expect(r.error.issues.some((i) => i.path[0] === 'tipo_comprobante')).toBe(true)
  })

  it('pide el CAE también en lo recibido: toda Factura A lo tiene', () => {
    const r = invoiceSchema.safeParse({ ...RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA, cae: '' })
    expect(r.success).toBe(false)
    expect(r.error.issues.some((i) => i.path[0] === 'cae')).toBe(true)
  })

  it('la condición del receptor sigue validándose también al recibir', () => {
    const r = invoiceSchema.safeParse({
      ...RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA,
      receptor_condicion_iva: 'CF',
    })
    expect(r.success).toBe(false)
    expect(r.error.issues.some((i) => i.path[0] === 'receptor_condicion_iva')).toBe(true)
  })

  it('la condición del emisor nunca filtra el tipo de una factura recibida', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('RI', 'MO', 'EX', 'RS', 'CF'),
        (condicion) =>
          invoiceSchema.safeParse({
            ...RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA,
            emisor_condicion_iva: condicion,
            tipo_comprobante: 'Factura A',
          }).success
      ),
      { numRuns: 50 }
    )
  })

  it('al cambiar de flujo los tipos de emisión siguen restringidos', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('MO', 'EX'),
        (condicion) => !invoiceSchema.safeParse({
          ...EMITIDA_POR_NOSOTROS,
          emisor_condicion_iva: condicion,
          tipo_comprobante: 'Factura A',
        }).success
      ),
      { numRuns: 20 }
    )
  })

  it('un RI puede recibir una Factura C de un proveedor Monotributista', () => {
    const r = invoiceSchema.safeParse({
      ...RECIBIDA_DE_PROVEEDOR_MONOTRIBUTISTA,
      tipo_comprobante: 'Factura C',
      receptor_condicion_iva: 'RI',
    })
    expect(r.error?.issues ?? []).toEqual([])
    expect(r.success).toBe(true)
  })
})

