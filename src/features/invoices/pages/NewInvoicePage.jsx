import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import InvoiceForm from '../components/InvoiceForm'
import { useCreateInvoice } from '../hooks/useInvoices'

/**
 * Página de creación de nueva factura.
 * Los totales fiscales los calcula InvoiceForm antes de llamar a onSubmit.
 * Req 5.9, 5.10, 5.11, 5.12
 */
export default function NewInvoicePage() {
  const navigate = useNavigate()
  const createInvoice = useCreateInvoice()

  const handleSubmit = async (data) => {
    // data ya viene con totales calculados por InvoiceForm (calculateInvoiceTotals)
    await createInvoice.mutateAsync(data)
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
          <p className="text-sm text-gray-500">Completá los datos del comprobante fiscal</p>
        </div>
      </div>
      <InvoiceForm onSubmit={handleSubmit} isLoading={createInvoice.isPending} />
    </div>
  )
}
