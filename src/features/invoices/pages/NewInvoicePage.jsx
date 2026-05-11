import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import InvoiceForm from '../components/InvoiceForm'
import { useCreateInvoice } from '../hooks/useInvoices'

export default function NewInvoicePage() {
  const navigate = useNavigate()
  const createInvoice = useCreateInvoice()

  const handleSubmit = async (data) => {
    const items = data.items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unit_price,
    }))
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0)
    const total_iva = items.reduce((acc, i) => acc + (i.subtotal * i.iva_rate) / 100, 0)
    const total_amount = subtotal + total_iva

    await createInvoice.mutateAsync({ ...data, items, subtotal, total_iva, total_amount })
    navigate('/invoices')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva factura</h1>
          <p className="text-sm text-gray-500">Completá los datos de la factura</p>
        </div>
      </div>
      <InvoiceForm onSubmit={handleSubmit} isLoading={createInvoice.isPending} />
    </div>
  )
}
