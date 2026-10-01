import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providerService } from '../services/providerService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import { useCompany } from '@/features/companies/context/CompanyContext'

export function useProviders(filters = {}) {
  const { company } = useCompany()
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDERS, company?.id, filters],
    queryFn: () => providerService.getAll({ ...filters, companyId: company.id }),
    enabled: Boolean(company?.id),
  })
}

export function useCreateProvider() {
  const { company } = useCompany()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (payload) => providerService.create({ ...payload, company_id: company.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDERS] })
      toast({ title: 'Proveedor creado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useDeleteProvider() {
  const { company } = useCompany()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (id) => providerService.delete(id, company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDERS] })
      toast({ title: 'Proveedor eliminado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
