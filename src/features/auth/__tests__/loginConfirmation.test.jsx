import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import { ToastProvider } from '@/components/ui/toast'
import { authService } from '@/features/auth/services/authService'

vi.mock('@/features/auth/services/authService', () => ({
  authService: {
    signInWithEmail: vi.fn(),
    resendConfirmation: vi.fn(),
  },
}))

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

const submitLogin = () => {
  render(<MemoryRouter><ToastProvider><LoginPage /></ToastProvider></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'segura123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('confirmación pendiente en login', () => {
  it('ofrece reenviar solo cuando Supabase informa un email sin confirmar', async () => {
    authService.signInWithEmail.mockRejectedValue({ code: 'email_not_confirmed' })
    authService.resendConfirmation.mockResolvedValue({})
    submitLogin()
    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar confirmación' }))
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(authService.resendConfirmation).toHaveBeenCalledWith('ana@example.com')
  })

  it('no atribuye credenciales incorrectas a falta de confirmación', async () => {
    authService.signInWithEmail.mockRejectedValue({ message: 'Invalid login credentials' })
    submitLogin()
    expect(await screen.findByText('Email o contraseña incorrectos.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reenviar confirmación' })).toBeNull()
  })

  it('informa restricciones del envío sin anunciar éxito', async () => {
    authService.signInWithEmail.mockRejectedValue({ code: 'email_not_confirmed' })
    authService.resendConfirmation.mockRejectedValue({ code: 'email_address_not_authorized' })
    submitLogin()
    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar confirmación' }))
    expect(await screen.findByText(/El servicio de correo no permite/)).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
