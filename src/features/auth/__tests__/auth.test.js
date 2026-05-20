import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchemas.js'

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

// Requirement 3.1 — loginSchema validates credentials before calling Supabase Auth
describe('loginSchema — Zod validation (Requirement 3.1)', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret123' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('email')
  })

  it('rejects password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '123' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('password')
  })

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
  })
})

// Requirement 3.1 — registerSchema validates registration data before calling Supabase Auth
describe('registerSchema — Zod validation (Requirement 3.1)', () => {
  const validData = {
    fullName: 'Juan García',
    email: 'juan@empresa.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects fullName shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, fullName: 'J' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('fullName')
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'bad-email' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('email')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'short', confirmPassword: 'short' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('password')
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: 'different' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toContain('confirmPassword')
  })
})

// Requirement 3.1 — Zod rejects arbitrary invalid login inputs (property-based)
describe('loginSchema — property test: invalid inputs are rejected', () => {
  it('rejects non-email strings in the email field', () => {
    fc.assert(
      fc.property(
        // Generate strings that are clearly not valid emails (no @ symbol)
        fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
        (nonEmail) => {
          const result = loginSchema.safeParse({ email: nonEmail, password: 'validpass' })
          return result.success === false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 5 }),
        (shortPassword) => {
          const result = loginSchema.safeParse({ email: 'user@example.com', password: shortPassword })
          return result.success === false
        }
      ),
      { numRuns: 100 }
    )
  })
})
