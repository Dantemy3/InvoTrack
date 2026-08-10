import { useMutation } from '@tanstack/react-query'
import { afipService } from '../services/afipService'
import { useToast } from '@/components/ui/toast'

/**
 * useEmitCae — solicita el CAE de un comprobante a ARCA (WSFEv1 homologación).
 *
 * El hook no lanza toasts de error: la página/formulario decide cómo mostrar
 * el resultado. Retorna la mutación de React Query con `.mutateAsync()`.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useEmitCae() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ invoice, action = 'cae' }) => afipService.emitCae({ invoice, action }),
    onError: (err) => {
      toast({ title: 'ARCA rechazó el comprobante', description: err.message, variant: 'error' })
    },
  })
}
