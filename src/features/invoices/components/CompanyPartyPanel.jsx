import { Link } from 'react-router-dom'
import { Building2, AlertTriangle, ExternalLink } from 'lucide-react'
import { companyToParty, missingCompanyProfileFields } from '@/features/companies/lib/companyParty'
import { TAX_CONDITION_LABELS } from '@/features/companies/schemas/companySchemas'

/**
 * Datos de la propia empresa dentro del comprobante.
 *
 * Cuando la empresa es una de las dos partes del comprobante, sus datos NO
 * se editan en la factura: salen de Configuración → Empresa. Así es
 * imposible emitir una factura con un CUIT emisor distinto al real, que es
 * lo que ARCA rechaza.
 */
export default function CompanyPartyPanel({ company, role = 'emisor' }) {
  const party = companyToParty(company)
  const faltantes = missingCompanyProfileFields(company)
  const esEmisor = role === 'emisor'

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-inset ring-blue-500/30">
          <Building2 className="h-3.5 w-3.5 text-blue-400" />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {esEmisor ? 'Vos sos el emisor' : 'Vos sos el receptor'}
          </p>
          <p className="text-xs text-gray-400">Datos de {company?.name || 'tu empresa'}</p>
        </div>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-gray-400">
          autocompletado
        </span>
      </div>

      {faltantes.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Te falta completar <strong>{faltantes.join(', ')}</strong> en la ficha de tu
            empresa. Mientras tanto el comprobante no va a ser válido.
          </span>
        </div>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Razón social</dt>
            <dd className="text-gray-900 font-medium">{party.razon_social || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">CUIT</dt>
            <dd className="text-gray-900 font-mono">{party.cuit || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Condición IVA</dt>
            <dd className="text-gray-900">{TAX_CONDITION_LABELS[party.condicion_iva] ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Domicilio</dt>
            <dd className="text-gray-900">{party.domicilio || '-'}</dd>
          </div>
        </dl>
      )}

      <Link
        to="/settings"
        className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-500 hover:underline"
      >
        Editar datos de la empresa
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}
