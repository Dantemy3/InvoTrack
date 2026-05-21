import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { cuitSchema } from '@/features/auth/schemas/authSchemas.js'

/**
 * Property 7: `cuitSchema` acepta exactamente strings con formato `XX-XXXXXXXX-X` y rechaza todos los demás
 * Validates: Requirements 8.6
 */

// Arbitrary that generates valid CUIT strings matching XX-XXXXXXXX-X
const validCuitArb = fc.tuple(
  fc.stringMatching(/^\d{2}$/),
  fc.stringMatching(/^\d{8}$/),
  fc.stringMatching(/^\d$/)
).map(([prefix, middle, suffix]) => `${prefix}-${middle}-${suffix}`)

// Arbitrary that generates strings that do NOT match XX-XXXXXXXX-X
const invalidCuitArb = fc.oneof(
  // Random strings (very unlikely to match the pattern)
  fc.string({ minLength: 0, maxLength: 30 }).filter(
    (s) => !/^\d{2}-\d{8}-\d$/.test(s)
  ),
  // Wrong segment lengths
  fc.tuple(
    fc.stringMatching(/^\d{1,3}$/),
    fc.stringMatching(/^\d{1,10}$/),
    fc.stringMatching(/^\d{1,3}$/)
  ).map(([a, b, c]) => `${a}-${b}-${c}`).filter(
    (s) => !/^\d{2}-\d{8}-\d$/.test(s)
  ),
  // Missing dashes
  fc.stringMatching(/^\d{11}$/),
  // Letters mixed in
  fc.stringMatching(/^[a-zA-Z]{2}-\d{8}-\d$/),
  // Extra characters appended
  fc.tuple(
    fc.stringMatching(/^\d{2}$/),
    fc.stringMatching(/^\d{8}$/),
    fc.stringMatching(/^\d$/)
  ).map(([a, b, c]) => `${a}-${b}-${c}X`)
)

describe('cuitSchema — Property 7: Validación de formato CUIT (Requirement 8.6)', () => {
  it('acepta cualquier string con formato XX-XXXXXXXX-X', () => {
    fc.assert(
      fc.property(validCuitArb, (cuit) => {
        const result = cuitSchema.safeParse(cuit)
        return result.success === true
      }),
      { numRuns: 100 }
    )
  })

  it('rechaza cualquier string que no tenga formato XX-XXXXXXXX-X', () => {
    fc.assert(
      fc.property(invalidCuitArb, (cuit) => {
        const result = cuitSchema.safeParse(cuit)
        return result.success === false
      }),
      { numRuns: 100 }
    )
  })
})
