import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { authService } from '@/features/auth/services/authService'
import RegisterPage from '@/features/auth/pages/RegisterPage'

vi.mock('@/features/auth/services/authService', () => ({
  authService: {
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
  },
}))

const fillAccount = () => {
  fireEvent.change(screen.getByPlaceholderText('Juan García'), { target: { value: 'Ana Pérez' } })
  fireEvent.change(screen.getByPlaceholderText('tu@empresa.com'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'segura123' } })
  fireEvent.change(screen.getByPlaceholderText('Repetí tu contraseña'), { target: { value: 'segura123' } })
}

describe('registro con empresa', () => {
  beforeEach(() => authService.signUpWithEmail.mockResolvedValue({}))
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('no crea la cuenta sin la ficha fiscal', async () => {
    render(<MemoryRouter><ToastProvider><RegisterPage /></ToastProvider></MemoryRouter>)
    fillAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta y guardar datos de empresa' }))

    expect(await screen.findByText('CUIT inválido. Formato esperado: XX-XXXXXXXX-X')).toBeTruthy()
    expect(authService.signUpWithEmail).not.toHaveBeenCalled()
  })

  it('envía la ficha fiscal junto con el alta de la cuenta', async () => {
    const { container } = render(<MemoryRouter><ToastProvider><RegisterPage /></ToastProvider></MemoryRouter>)
    fillAccount()
    fireEvent.change(screen.getByPlaceholderText('Mi Empresa S.A.'), { target: { value: 'Empresa de Ana S.A.' } })
    fireEvent.change(screen.getByPlaceholderText('30-12345678-9'), { target: { value: '30-12345678-9' } })
    fireEvent.change(screen.getByPlaceholderText('Av. Corrientes'), { target: { value: 'Av. Corrientes' } })
    fireEvent.change(screen.getByPlaceholderText('1234'), { target: { value: '1234' } })
    fireEvent.change(screen.getByPlaceholderText('Ciudad Autónoma de Buenos Aires'), { target: { value: 'Buenos Aires' } })
    fireEvent.change(container.querySelector('select[name="company.province"]'), { target: { value: 'Buenos Aires' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta y guardar datos de empresa' }))

    await waitFor(() => expect(authService.signUpWithEmail).toHaveBeenCalledOnce())
    expect(authService.signUpWithEmail).toHaveBeenCalledWith(
      'ana@example.com',
      'segura123',
      expect.objectContaining({
        full_name: 'Ana Pérez',
        company_profile: expect.objectContaining({
          name: 'Empresa de Ana S.A.',
          cuit: '30-12345678-9',
        }),
      })
    )
  })
})
