import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { clampConfidenceScores } from '../services/ocrService'

/**
 * Property 1: Clamping de confidence scores
 * Validates: Requirements 6.4
 *
 * Para cualquier objeto de scores con valores arbitrarios,
 * `clampConfidenceScores` produce valores en [0.0, 1.0].
 */
describe('clampConfidenceScores', () => {
  it('Property 1 — todos los valores del resultado están en [0.0, 1.0] para cualquier input arbitrario', () => {
    /**
     * **Validates: Requirements 6.4**
     *
     * Generamos objetos con claves string y valores numéricos arbitrarios
     * (negativos, mayores a 1, NaN, Infinity, etc.) y verificamos que
     * clampConfidenceScores siempre produce valores en [0.0, 1.0].
     */
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.float({ noNaN: false }),          // floats incluyendo NaN
            fc.integer({ min: -1000, max: 1000 }), // enteros fuera de rango
            fc.constant(Infinity),
            fc.constant(-Infinity),
          )
        ),
        (scores) => {
          const result = clampConfidenceScores(scores)

          // El resultado debe tener las mismas claves que el input
          expect(Object.keys(result)).toEqual(Object.keys(scores))

          // Cada valor debe estar en [0.0, 1.0]
          for (const [key, value] of Object.entries(result)) {
            expect(value).toBeGreaterThanOrEqual(0.0)
            expect(value).toBeLessThanOrEqual(1.0)
            expect(typeof value).toBe('number')
            expect(Number.isFinite(value)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('retorna objeto vacío para input nulo o no-objeto', () => {
    expect(clampConfidenceScores(null)).toEqual({})
    expect(clampConfidenceScores(undefined)).toEqual({})
    expect(clampConfidenceScores('string')).toEqual({})
  })

  it('clampea valores negativos a 0.0', () => {
    const result = clampConfidenceScores({ field: -5 })
    expect(result.field).toBe(0.0)
  })

  it('clampea valores mayores a 1 a 1.0', () => {
    const result = clampConfidenceScores({ field: 99 })
    expect(result.field).toBe(1.0)
  })

  it('preserva valores ya dentro del rango [0.0, 1.0]', () => {
    const result = clampConfidenceScores({ a: 0.0, b: 0.5, c: 1.0 })
    expect(result.a).toBe(0.0)
    expect(result.b).toBe(0.5)
    expect(result.c).toBe(1.0)
  })
})
