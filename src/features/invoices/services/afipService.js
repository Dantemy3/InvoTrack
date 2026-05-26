import { supabase } from '@/lib/supabase'

/**
 * afipService — validación de CAE contra AFIP.
 *
 * La validación real se delega a la Edge Function `afip-validate`
 * para mantener las credenciales AFIP fuera del browser.
 *
 * Requirements: 15.4
 */
export const afipService = {
  /**
   * Valida un CAE contra la API de AFIP.
   * Llama a la Edge Function `afip-validate` que tiene las credenciales.
   *
   * @param {string} cae - Código de Autorización Electrónico (14 dígitos)
   * @param {string} caeVencimiento - Fecha de vencimiento del CAE (YYYY-MM-DD)
   * @param {string} cuit - CUIT del emisor (XX-XXXXXXXX-X)
   * @returns {Promise<{ isValid: boolean, status: string, message: string }>}
   */
  async validateCae(cae, caeVencimiento, cuit) {
    if (!cae || !caeVencimiento || !cuit) {
      return {
        isValid: false,
        status: 'missing_data',
        message: 'CAE, fecha de vencimiento y CUIT son requeridos para la validación',
      }
    }

    // Verificar si el CAE ya venció localmente (sin llamar a AFIP)
    const today = new Date()
    const vencimiento = new Date(caeVencimiento)
    if (vencimiento < today) {
      return {
        isValid: false,
        status: 'expired',
        message: `El CAE venció el ${caeVencimiento}`,
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('afip-validate', {
        body: { cae, caeVencimiento, cuit },
      })

      if (error) throw error

      return {
        isValid: data?.isValid ?? false,
        status: data?.status ?? 'unknown',
        message: data?.message ?? 'Validación completada',
      }
    } catch (err) {
      // Si la Edge Function no está disponible, retornar estado desconocido
      // sin bloquear el flujo del usuario
      return {
        isValid: false,
        status: 'error',
        message: `No se pudo conectar con AFIP: ${err.message}`,
      }
    }
  },
}
