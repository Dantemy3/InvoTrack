import { Badge } from '@/components/ui/badge'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

export default function InvoiceStatusBadge({ status }) {
  const label = INVOICE_STATUS_LABELS[status] || status
  const variant = INVOICE_STATUS_COLORS[status] || 'secondary'
  return <Badge variant={variant}>{label}</Badge>
}
