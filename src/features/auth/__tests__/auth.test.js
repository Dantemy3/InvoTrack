import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Smoke test — verifies that Vitest + fast-check are correctly configured
describe('Auth setup smoke test', () => {
  it('should run a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should resolve the @/ alias', async () => {
    // Importing via alias confirms vitest.config.js alias is working
    const mod = await import('@/features/auth/schemas/authSchemas.js')
    expect(mod).toBeDefined()
  })

  it('fast-check: string is always a string', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(typeof s).toBe('string')
      }),
      { numRuns: 100 }
    )
  })
})
