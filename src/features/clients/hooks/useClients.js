import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../services/clientService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

export function useClients(filters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, filters],
    queryFn: () => clientService.getAll(filters),
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENT, id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente creado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, ...data }) => clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente actualizado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente eliminado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
