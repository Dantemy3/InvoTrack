import { FileOutput, FileInput, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FLOW_OPTIONS } from '../lib/invoiceParties'

const ICONS = {
  receivable: FileOutput,
  payable: FileInput,
}

const ACCENTS = {
  receivable: 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/30',
  payable: 'text-amber-500 bg-amber-500/10 ring-amber-500/30',
}

/**
 * Paso 1 de la creación de una factura: elegir el flujo.
 *
 * No es un detalle cosmético — define quién es el emisor, quién el receptor
 * y qué datos se autocompletan:
 *   - "Yo emito"    → emisor = tu empresa, receptor = cliente.
 *   - "Me emitieron" → emisor = proveedor, receptor = tu empresa.
 *
 * Con `compact` se renderiza dentro del formulario (el valor elegido se
 * resalta y se puede cambiar sin volver atrás).
 */
export default function InvoiceFlowPicker({ onSelect, value, compact = false }) {
  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FLOW_OPTIONS.map((option) => {
          const Icon = ICONS[option.value]
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={selected}
              className={`flex items-start gap-3 text-left p-3 rounded-xl border transition-all ${
                selected
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-gray-200 bg-gray-100/40 hover:border-gray-300 hover:bg-gray-100/70'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset flex-shrink-0 ${ACCENTS[option.value]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
                <span className="block text-xs text-gray-500 leading-relaxed mt-0.5">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-400/80">// paso 1 de 2</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">¿Qué factura vas a cargar?</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define quién es el emisor y quién el receptor, y completa los datos solo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FLOW_OPTIONS.map((option) => {
          const Icon = ICONS[option.value]
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="group text-left bg-panel rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset mb-3 ${ACCENTS[option.value]}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="block text-lg font-semibold text-gray-900 group-hover:text-blue-500 transition-colors">
                {option.title}
              </span>
              <span className="block text-sm text-gray-500 mt-1 leading-relaxed">
                {option.description}
              </span>
              <span className="flex items-center gap-1.5 mt-4 text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
                <Users className="h-3.5 w-3.5" />
                {option.counterpartyLabel}: {option.counterpartyNoun === 'cliente' ? 'vos facturás' : 'te factura'}
              </span>
            </button>
          )
        })}
      </div>

      <Card className="bg-gray-100/40 border-gray-100">
        <CardContent className="py-3 text-xs text-gray-500 leading-relaxed">
          Los clientes y los proveedores se guardan con todos sus datos. Si todavía
          no tenés ninguno cargado, podés crearlo desde la pantalla siguiente.
        </CardContent>
      </Card>
    </div>
  )
}
