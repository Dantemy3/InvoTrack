import { Badge } from '@/components/ui/badge'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

// Badge que muestra el estado de una factura con color y etiqueta según su valor.
export default function InvoiceStatusBadge({ status }) {
  const label = INVOICE_STATUS_LABELS[status] || status
  const variant = INVOICE_STATUS_COLORS[status] || 'secondary'
  return <Badge variant={variant}>{label}</Badge>
}
