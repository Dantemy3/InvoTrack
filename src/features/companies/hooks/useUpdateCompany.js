import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { QUERY_KEYS } from '@/lib/constants'
import { useCompany } from '../context/CompanyContext'
import { useToast } from '@/components/ui/toast'

/**
 * Actualiza la ficha fiscal de una empresa y refresca el CompanyContext
 * para que el emisor autocompletado de las facturas use los datos nuevos.
 *
 * @param {string} id — id de la empresa (por defecto, la empresa activa)
 */
export function useUpdateCompany(defaultId) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { company, refetch } = useCompany()

  return useMutation({
    mutationFn: ({ id, ...updates }) => companyService.update(id ?? defaultId ?? company?.id, updates),
    onSuccess: async () => {
      await refetch()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMPANIES] })
      toast({ title: 'Datos de la empresa guardados', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
