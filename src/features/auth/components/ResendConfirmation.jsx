import { useState } from 'react'
import { authService } from '@/features/auth/services/authService'
import { Button } from '@/components/ui/button'

export default function ResendConfirmation({ email }) {
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  const handleResend = async () => {
    if (sending) return
    setSending(true)
    setMessage('')
    setFailed(false)
    try {
      await authService.resendConfirmation(email)
      setMessage('Solicitud enviada. Revisá tu bandeja de entrada y spam. Si no llega, contactá al administrador para revisar el envío de correos.')
    } catch (error) {
      setFailed(true)
      if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
        setMessage('Se alcanzó el límite de envíos. Esperá unos minutos antes de volver a intentar.')
      } else if (error.code === 'email_address_not_authorized') {
        setMessage('El servicio de correo no permite enviar a esta dirección. El administrador debe configurar el envío de correos.')
      } else {
        setMessage('No pudimos solicitar la confirmación. Verificá tu conexión; si persiste, contactá al administrador para revisar el envío de correos.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" disabled={sending || !email} onClick={handleResend}>
        {sending ? 'Solicitando confirmación…' : 'Reenviar confirmación'}
      </Button>
      {message && <p role={failed ? 'alert' : 'status'} className="text-sm text-gray-500">{message}</p>}
    </div>
  )
}
