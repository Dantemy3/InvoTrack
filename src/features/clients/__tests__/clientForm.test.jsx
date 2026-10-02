import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ClientsPage from '@/features/clients/pages/ClientsPage'

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }))
vi.mock('@/features/clients/hooks/useClients', () => ({
  useClients: () => ({ data: { data: [], count: 0 }, isLoading: false }),
  useCreateClient: () => ({ mutateAsync }),
  useDeleteClient: () => ({ mutate: vi.fn() }),
}))

// Usar un select nativo permite comprobar el valor enviado por el formulario
// sin depender de los eventos de puntero del navegador en Radix.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }) => (
    <select aria-label="Condición fiscal" value={value} onChange={(event) => onValueChange(event.target.value)}>{children}</select>
  ),
  SelectTrigger: () => <option value="">Seleccionar</option>,
  SelectValue: () => null,
  SelectContent: ({ children }) => children,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}))

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

function openForm() {
  render(<ClientsPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }))
  fireEvent.change(screen.getByPlaceholderText('Empresa S.A.'), { target: { value: 'Cliente de prueba' } })
}

describe('guardar cliente', () => {
  it('envía RI al elegir Responsable Inscripto y cierra al guardar', async () => {
    mutateAsync.mockResolvedValue({ id: 'client-1' })
    openForm()
    expect(screen.getByRole('option', { name: 'Responsable Inscripto' }).value).toBe('RI')
    fireEvent.change(screen.getByLabelText('Condición fiscal'), { target: { value: 'RI' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cliente de prueba', tax_condition: 'RI' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('conserva los datos y habilita otro intento si falla la API', async () => {
    mutateAsync.mockRejectedValue(new Error('Error HTTP 502'))
    openForm()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    expect(screen.getByPlaceholderText('Empresa S.A.').value).toBe('Cliente de prueba')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(false))
  })

  it('muestra el email inválido en lugar de ignorar Guardar', async () => {
    openForm()
    fireEvent.change(screen.getByPlaceholderText('contacto@empresa.com'), { target: { value: 'invalido' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar' }).closest('form'))
    expect(await screen.findByText('Email inválido')).toBeTruthy()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
