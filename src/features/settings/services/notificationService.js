import { supabase } from '@/lib/supabase'

/**
 * notificationService — gestión de notificaciones por email.
 *
 * Delega el envío a la Edge Function `send-notification` que usa Resend.
 * Las credenciales (RESEND_API_KEY) nunca llegan al browser.
 *
 * Requirements: 15.4
 */
export const notificationService = {
  /**
   * Envía un email de prueba para verificar que la configuración de Resend
   * está correctamente configurada en las variables de entorno de Supabase.
   *
   * @param {string} email - Dirección de email destino
   * @returns {Promise<{ success: boolean, emailId?: string, error?: string }>}
   */
  async sendTestEmail(email) {
    if (!email) throw new Error('Email requerido')

    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        to: email,
        template: 'weekly_summary',
        data: {
          companyName: 'Tu empresa',
          totalInvoiced: 0,
          totalCollected: 0,
          pendingCount: 0,
        },
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Envía una notificación de factura vencida.
   *
   * @param {{ to: string, companyName: string, invoiceNumber: string, amount: number, dueDate: string }} opts
   */
  async sendOverdueNotification({ to, companyName, invoiceNumber, amount, dueDate }) {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        to,
        template: 'overdue',
        data: { companyName, invoiceNumber, amount, dueDate },
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Envía una notificación de factura próxima a vencer.
   *
   * @param {{ to: string, companyName: string, invoiceNumber: string, amount: number, dueDate: string, daysUntilDue: number }} opts
   */
  async sendUpcomingNotification({ to, companyName, invoiceNumber, amount, dueDate, daysUntilDue }) {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        to,
        template: 'upcoming',
        data: { companyName, invoiceNumber, amount, dueDate, daysUntilDue },
      },
    })

    if (error) throw error
    return data
  },
}
