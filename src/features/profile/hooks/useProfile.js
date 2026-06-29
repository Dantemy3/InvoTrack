import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../services/profileService'
import { QUERY_KEYS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

export function useProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: profileService.getProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] })
      toast({ title: 'Perfil actualizado', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  })
}
