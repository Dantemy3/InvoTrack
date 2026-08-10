import { supabase } from '@/lib/supabase'

/**
 * afipService — validación y emisión de CAE contra AFIP/ARCA.
 *
 * La lógica real se delega a las Edge Functions `afip-validate` y `afip-emit`
 * para mantener las credenciales AFIP (certificado + clave privada) fuera del
 * browser.
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
   * @param {object} [opts] - Datos del comprobante para la consulta FECompConsultar
   * @param {string} [opts.tipoComprobante] - Nombre del tipo (ej: "Factura A")
   * @param {number} [opts.puntoDeVenta] - Punto de venta
   * @param {number} [opts.numeroComprobante] - Número de comprobante
   * @param {string} [opts.invoiceId] - Si se pasa, actualiza afip_status en la factura
   * @returns {Promise<{ isValid: boolean, status: string, message: string }>}
   */
  async validateCae(cae, caeVencimiento, cuit, opts = {}) {
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
        body: {
          cae,
          caeVencimiento,
          cuit,
          tipoComprobante: opts.tipoComprobante,
          puntoDeVenta: opts.puntoDeVenta,
          numeroComprobante: opts.numeroComprobante,
          invoiceId: opts.invoiceId,
        },
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

  /**
   * Emite un comprobante y solicita el CAE contra WSFEv1 (homologación).
   * Llama a la Edge Function `afip-emit` que tiene el certificado y la clave.
   *
   * @param {{ invoice: object, action?: string }} params
   *   action: 'cae' (default) | 'dummy' | 'ptosVenta'
   * @returns {Promise<{
   *   ok: boolean,
   *   resultado?: string,
   *   cae?: string,
   *   caeVencimiento?: string,
   *   errores?: Array<{code,msg}>,
   *   observaciones?: Array<{code,msg}>
   * }>}
   */
  async emitCae({ invoice, action = 'cae' } = {}) {
    const { data, error } = await supabase.functions.invoke('afip-emit', {
      body: { action, invoice },
    })

    if (error) {
      const afipError = data?.error ?? error.message ?? 'Error al comunicarse con ARCA'
      throw new Error(afipError)
    }
    if (data?.error) throw new Error(data.error)
    if (data?.errores?.length) {
      throw new Error(data.errores.map((e) => `[${e.code}] ${e.msg}`).join(' | '))
    }
    return data
  },
}
