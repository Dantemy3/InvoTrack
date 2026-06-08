import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import InvoiceStatusBadge from '@/features/invoices/components/InvoiceStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useInvoices } from '@/features/invoices/hooks/useInvoices'

// Muestra las últimas 5 facturas de la empresa activa con su monto, estado y fecha.
export default function RecentInvoices() {
  const navigate = useNavigate()
  const { data: invoices, isLoading } = useInvoices({ page: 1, pageSize: 5 })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Facturas recientes</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No hay facturas aún</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">{inv.client?.name || inv.provider?.name || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(inv.issue_date)}</p>
                </div>
                <InvoiceStatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
