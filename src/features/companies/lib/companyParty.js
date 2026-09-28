/**
 * companyParty — lógica de dominio compartida por onboarding, configuración
 * y creación de facturas.
 *
 * Aquí vive el único lugar donde se decide cómo la empresa se traduce a
 * "parte de un comprobante" (emisor o receptor). Los servicios no lo usan:
 * solo functions puras, sin React ni Supabase.
 */

/**
 * Compone el domicilio fiscal en una línea, a partir de las partes
 * desglosadas. Si no hay partes, devuelve el `address` legacy tal cual.
 *
 * @param {{ street?: string, street_number?: string, city?: string,
 *           province?: string, address?: string } | null} source
 * @returns {string}
 */
export function buildCompanyAddress(source) {
  if (!source) return ''

  const calle = [source.street, source.street_number].filter(Boolean).join(' ').trim()
  const localidad = [source.city, source.province].filter(Boolean).join(', ').trim()

  if (calle || localidad) return [calle, localidad].filter(Boolean).join(', ')
  return (source.address ?? '').trim()
}

/**
 * Convierte la empresa en una "parte" de comprobante.
 * La forma devuelta es la misma para clientes y proveedores, así que
 * las facturas pueden tratar a las tres indistintamente.
 *
 * @param {object | null} company — registro de `companies`
 * @returns {{ cuit: string, razon_social: string, condicion_iva: string, domicilio: string }}
 */
export function companyToParty(company) {
  if (!company) return emptyParty()
  return {
    cuit: (company.cuit ?? '').trim(),
    razon_social: (company.name ?? '').trim(),
    condicion_iva: company.tax_condition ?? '',
    domicilio: buildCompanyAddress(company),
  }
}

/**
 * Convierte un cliente o un proveedor (misma forma de tabla) en una "parte".
 *
 * @param {object | null} contact
 */
export function contactToParty(contact) {
  if (!contact) return emptyParty()
  return {
    cuit: (contact.cuit ?? '').trim(),
    razon_social: (contact.name ?? '').trim(),
    condicion_iva: contact.tax_condition ?? '',
    domicilio: (contact.address ?? '').trim(),
  }
}

export function emptyParty() {
  return { cuit: '', razon_social: '', condicion_iva: '', domicilio: '' }
}

/**
 * Campos de la ficha fiscal que faltan para poder emitir sin tipear datos
 * en cada factura. Se usa para avisar con precisión qué corregir.
 *
 * @param {object | null} company
 * @returns {string[]} etiquetas de los campos faltantes
 */
export function missingCompanyProfileFields(company) {
  if (!company) return ['razón social', 'CUIT', 'condición IVA', 'domicilio']

  const party = companyToParty(company)
  const missing = []
  if (!party.razon_social) missing.push('razón social')
  if (!party.cuit) missing.push('CUIT')
  if (!party.condicion_iva) missing.push('condición IVA')
  if (!hasCompleteAddress(company)) missing.push('domicilio')
  return missing
}

/**
 * Un domicilio armado solo con la calle no sirve para emitir: la localidad
 * también es parte del domicilio fiscal. Se acepta el `address` legacy
 * (una sola línea ya compuesta) como domicilio completo.
 */
function hasCompleteAddress(company) {
  const calle = [company.street, company.street_number].filter(Boolean).join(' ').trim()
  const localidad = [company.city, company.province].filter(Boolean).join(', ').trim()
  if (calle && localidad) return true
  return Boolean((company.address ?? '').trim()) && !calle && !localidad
}

/** ¿La empresa tiene lo mínimo para emitir un comprobante? */
export function isCompanyProfileComplete(company) {
  return missingCompanyProfileFields(company).length === 0
}
