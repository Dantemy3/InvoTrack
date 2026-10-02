import { describe, expect, it } from 'vitest'
import { productSchema } from '@/features/products/schemas/productSchemas'

const product = { name: 'Motor', price: '100.50', stock: '', unit: 'un' }

describe('proveedor opcional de productos', () => {
  it('permite guardar sin seleccionar proveedor', () => {
    expect(productSchema.parse({ ...product, provider_id: '' })).toMatchObject({
      provider_id: null, price: 100.5, stock: 0,
    })
  })

  it('conserva un proveedor seleccionado', () => {
    const providerId = '11111111-1111-4111-8111-111111111111'
    expect(productSchema.parse({ ...product, provider_id: providerId }).provider_id).toBe(providerId)
  })

  it('rechaza un identificador inválido en lugar de descartarlo', () => {
    expect(productSchema.safeParse({ ...product, provider_id: 'invalido' }).success).toBe(false)
  })
})
