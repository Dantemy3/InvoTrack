import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../services/clientService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import { useCompany } from '@/features/companies/context/CompanyContext'

export function useClients(filters = {}) {
  const { company } = useCompany()
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, company?.id, filters],
    queryFn: () => clientService.getAll({ ...filters, companyId: company.id }),
    enabled: Boolean(company?.id),
  })
}

export function useClient(id) {
  const { company } = useCompany()
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENT, company?.id, id],
    queryFn: () => clientService.getById(id, company.id),
    enabled: Boolean(id && company?.id),
  })
}

export function useCreateClient() {
  const { company } = useCompany()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (payload) => clientService.create({ ...payload, company_id: company.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente creado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useUpdateClient() {
  const { company } = useCompany()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, ...data }) => clientService.update(id, data, company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente actualizado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useDeleteClient() {
  const { company } = useCompany()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id) => clientService.delete(id, company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      toast({ title: 'Cliente eliminado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
