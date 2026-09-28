import { companyToParty, contactToParty, emptyParty } from '@/features/companies/lib/companyParty'
import { getTiposPermitidosPorEmisor, getTiposRecibibles } from '@/constants/comprobanteConfig'

/**
 * invoiceParties — decide quién es el emisor y quién el receptor en un
 * comprobante, según el flujo elegido.
 *
 * Regla del dominio:
 *   - "Yo emito"   (receivable) → nosotros somos el EMISOR, la contraparte es el CLIENTE.
 *   - "Me emitieron" (payable) → la contraparte (PROVEEDOR) es el EMISOR, nosotros somos el RECEPTOR.
 *
 * Funciones puras: sin React ni Supabase, para poder testearlas.
 */

export const FLOW_RECEIVABLE = 'receivable'
export const FLOW_PAYABLE = 'payable'

export const FLOW_OPTIONS = [
  {
    value: FLOW_RECEIVABLE,
    title: 'Yo emito',
    shortLabel: 'Yo emito',
    description: 'Facturás vos y querés cobrar. Vos sos el emisor y el cliente es el receptor.',
    counterpartyLabel: 'Cliente',
    counterpartyNoun: 'cliente',
  },
  {
    value: FLOW_PAYABLE,
    title: 'Me emitieron',
    shortLabel: 'Me emitieron',
    description: 'Una factura que recibiste y tenés que pagar. El proveedor es el emisor y vos sos el receptor.',
    counterpartyLabel: 'Proveedor',
    counterpartyNoun: 'proveedor',
  },
]

export function getFlowOption(flow) {
  return FLOW_OPTIONS.find((o) => o.value === flow) ?? null
}

/** Rol que ocupa la propia empresa en el comprobante. */
export function ownPartyRole(flow) {
  return flow === FLOW_PAYABLE ? 'receptor' : 'emisor'
}

/** Rol que ocupa la contraparte (cliente o proveedor). */
export function counterpartyRole(flow) {
  return flow === FLOW_PAYABLE ? 'emisor' : 'receptor'
}

export function isReceivable(flow) {
  return flow !== FLOW_PAYABLE
}

/**
 * Traduce una "parte" a los campos del formulario con el prefijo del rol.
 *
 * @param {'emisor'|'receptor'} role
 * @param {{ cuit: string, razon_social: string, condicion_iva: string, domicilio: string }} party
 * @returns {Record<string, string>} patch listo para `setValue` / `defaultValues`
 */
export function partyToFormFields(role, party) {
  const p = role === 'receptor' ? 'receptor' : 'emisor'
  const data = party ?? emptyParty()
  return {
    [`${p}_cuit`]: data.cuit ?? '',
    [`${p}_razon_social`]: data.razon_social ?? '',
    [`${p}_condicion_iva`]: data.condicion_iva ?? '',
    [`${p}_domicilio`]: data.domicilio ?? '',
  }
}

/** Campos de la contraparte a partir de un cliente o proveedor. */
export function counterpartyFormFields(flow, contact) {
  return partyToFormFields(counterpartyRole(flow), contactToParty(contact))
}

/** Campos de la propia empresa en el comprobante. */
export function ownPartyFormFields(flow, company) {
  return partyToFormFields(ownPartyRole(flow), companyToParty(company))
}

/** Patch que limpia los campos de un rol (para cuando se cambia de flujo). */
export function emptyPartyFormFields(role) {
  return partyToFormFields(role, emptyParty())
}

/**
 * Patch de valores iniciales para un flujo: nuestra parte sale de la empresa
 * y la contraparte arranca vacía (se completa al elegir cliente/proveedor).
 *
 * @param {'receivable'|'payable'} flow
 * @param {object | null} company
 * @param {object} [extra] — valores que tienen prioridad (ej: numeración de ARCA)
 */
export function flowFormDefaults(flow, company, extra = {}) {
  return {
    type: flow,
    ...ownPartyFormFields(flow, company),
    ...emptyPartyFormFields(counterpartyRole(flow)),
    client_id: null,
    provider_id: null,
    consumidor_final_anonimo: false,
    ...extra,
  }
}

/**
 * Tipos de comprobante permitidos, según el flujo y la condición fiscal
 * de nuestra empresa. Es distinto en cada caso:
 *  - al EMITIR manda nuestra condición (un Monotributista solo emite Factura C);
 *  - al RECIBIR también manda la nuestra, pero con las reglas invertidas
 *    (un Monotributista solo puede recibir Factura C, pero un Exento sí
 *    puede recibir una Factura A aunque no pueda emitirla).
 */
export function getTiposPermitidosParaFlujo(flow, propiaCondicion) {
  if (flow === FLOW_RECEIVABLE) {
    return getTiposPermitidosPorEmisor(propiaCondicion)
  }
  return getTiposRecibibles(propiaCondicion)
}

/**
 * Condición fiscal que manda sobre el tipo de comprobante.
 * En emisión es la del emisor; en recepción es la nuestra (receptor),
 * porque el tipo de comprobante recibido depende de quién lo recibe.
 */
export function resolveOwnTaxCondition(flow, company, fallback) {
  return company?.tax_condition ?? fallback ?? 'RI'
}

/**
 * ¿Falta el dato de la contraparte para poder validar el tipo de comprobante?
 * Solo informativo: el schema es la autoridad.
 */
export function counterpartyPlaceholder(flow) {
  return flow === FLOW_PAYABLE
    ? 'Seleccioná el proveedor que te emitió la factura'
    : 'Seleccioná el cliente al que le facturás'
}
