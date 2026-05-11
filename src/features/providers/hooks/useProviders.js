import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providerService } from '../services/providerService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

export function useProviders(filters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDERS, filters],
    queryFn: () => providerService.getAll(filters),
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: providerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDERS] })
      toast({ title: 'Proveedor creado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: providerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDERS] })
      toast({ title: 'Proveedor eliminado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
