import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import { useCompany } from '@/features/companies/context/CompanyContext'

export function useProducts(filters = {}) {
  const { company } = useCompany()

  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, company?.id, filters],
    queryFn: () => productService.getAll({ ...filters, companyId: company.id }),
    enabled: Boolean(company?.id),
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT, id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (payload) =>
      productService.create({ ...payload, company_id: company.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] })
      toast({ title: 'Producto creado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, ...data }) => productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] })
      toast({ title: 'Producto actualizado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] })
      toast({ title: 'Producto eliminado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
