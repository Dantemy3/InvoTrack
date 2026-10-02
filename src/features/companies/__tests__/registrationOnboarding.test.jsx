import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { companyService } from '@/features/companies/services/companyService'
import { authService } from '@/features/auth/services/authService'
import OnboardingPage from '@/features/companies/pages/OnboardingPage'

vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/companies/context/CompanyContext', () => ({ useCompany: vi.fn() }))
vi.mock('@/features/companies/services/companyService', () => ({
  companyService: { getAll: vi.fn(), create: vi.fn() },
}))
vi.mock('@/features/auth/services/authService', () => ({
  authService: { clearPendingCompanyProfile: vi.fn() },
}))

describe('finalización del registro tras confirmar email', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        user_metadata: {
          company_profile: {
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
        },
      },
    })
    useCompany.mockReturnValue({ refetch: vi.fn().mockResolvedValue({ id: 'company-1' }) })
    companyService.getAll.mockResolvedValue([])
    companyService.create.mockResolvedValue({ id: 'company-1' })
    authService.clearPendingCompanyProfile.mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('crea una sola empresa y abre el dashboard', async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<p>Dashboard listo</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    )

    expect(await screen.findByText('Dashboard listo')).toBeTruthy()
    expect(companyService.create).toHaveBeenCalledOnce()
    expect(companyService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Empresa de Ana S.A.', cuit: '30-12345678-9' }),
      'user-1'
    )
    expect(authService.clearPendingCompanyProfile).toHaveBeenCalledOnce()
  })
})
