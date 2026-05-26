// ============================================================
// InvoTrack — Validaciones de facturas argentinas
// CUIT, CAE, totales, duplicados
// ============================================================

/**
 * Valida un CUIT/CUIL argentino.
 * Formato esperado: XX-XXXXXXXX-X o XXXXXXXXXXX (11 dígitos)
 */
export function validateCuit(cuit) {
  if (!cuit) return { valid: false, error: 'CUIT requerido' }

  const cleaned = cuit.replace(/[-\s]/g, '')
  if (!/^\d{11}$/.test(cleaned)) {
    return { valid: false, error: 'CUIT debe tener 11 dígitos' }
  }

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digits = cleaned.split('').map(Number)
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0)
  const remainder = sum % 11
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder

  if (checkDigit !== digits[10]) {
    return { valid: false, error: 'CUIT inválido (dígito verificador incorrecto)' }
  }

  return { valid: true, error: null }
}

/**
 * Formatea un CUIT limpio a XX-XXXXXXXX-X
 */
export function formatCuit(cuit) {
  if (!cuit) return ''
  const cleaned = cuit.replace(/[-\s]/g, '')
  if (cleaned.length !== 11) return cuit
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`
}

/**
 * Valida un CAE (Código de Autorización Electrónica) de AFIP/ARCA.
 * Debe ser numérico de 14 dígitos.
 */
export function validateCae(cae) {
  if (!cae) return { valid: false, error: 'CAE requerido' }
  const cleaned = cae.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, error: 'CAE debe tener 14 dígitos numéricos' }
  }
  return { valid: true, error: null }
}

/**
 * Valida que la fecha de vencimiento del CAE no haya expirado.
 */
export function validateCaeExpiration(caeExpiration) {
  if (!caeExpiration) return { valid: true, error: null } // opcional
  const exp = new Date(caeExpiration)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (exp < today) {
    return { valid: false, error: 'El CAE está vencido' }
  }
  return { valid: true, error: null }
}

/**
 * Valida que subtotal + impuestos ≈ total (tolerancia $1)
 */
export function validateTotals({ subtotal = 0, taxes = [], total = 0 }) {
  const taxSum = taxes.reduce((acc, t) => acc + (t.amount || 0), 0)
  const calculated = subtotal + taxSum
  const diff = Math.abs(calculated - total)
  if (diff > 1) {
    return {
      valid: false,
      error: `Total inconsistente: subtotal + impuestos = ${calculated.toFixed(2)}, total declarado = ${total.toFixed(2)}`,
    }
  }
  return { valid: true, error: null }
}

/**
 * Detecta facturas duplicadas.
 * Criterio: mismo proveedor + mismo número + mismo total
 */
export function detectDuplicate(newInvoice, existingInvoices = []) {
  const duplicate = existingInvoices.find((inv) => {
    if (inv.id === newInvoice.id) return false // misma factura al editar
    const sameProvider =
      inv.issuer_cuit && newInvoice.issuer_cuit
        ? inv.issuer_cuit === newInvoice.issuer_cuit
        : inv.provider_id === newInvoice.provider_id
    const sameNumber = inv.invoice_number === newInvoice.invoice_number
    const sameTotal = Math.abs((inv.total_amount || 0) - (newInvoice.total_amount || 0)) < 1
    return sameProvider && sameNumber && sameTotal
  })

  return duplicate
    ? { isDuplicate: true, duplicateId: duplicate.id, duplicateNumber: duplicate.invoice_number }
    : { isDuplicate: false }
}

/**
 * Valida el número de factura argentino.
 * Formato: XXXX-XXXXXXXX (punto de venta - número)
 */
export function validateInvoiceNumber(number) {
  if (!number) return { valid: false, error: 'Número de factura requerido' }
  if (!/^\d{4}-\d{8}$/.test(number)) {
    return { valid: false, error: 'Formato: 0001-00000001' }
  }
  return { valid: true, error: null }
}

/**
 * Calcula el confidence score global de una factura.
 */
export function calculateOverallConfidence(fieldConfidences = {}) {
  const values = Object.values(fieldConfidences).filter((v) => typeof v === 'number')
  if (!values.length) return 0
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

/**
 * Ejecuta todas las validaciones sobre una factura y retorna un resumen.
 */
export function validateInvoice(invoice, existingInvoices = []) {
  const errors = []
  const warnings = []

  // CUIT emisor
  if (invoice.issuer_cuit) {
    const r = validateCuit(invoice.issuer_cuit)
    if (!r.valid) errors.push({ field: 'issuer_cuit', message: r.error })
  }

  // CUIT cliente
  if (invoice.customer_cuit) {
    const r = validateCuit(invoice.customer_cuit)
    if (!r.valid) errors.push({ field: 'customer_cuit', message: r.error })
  }

  // CAE
  if (invoice.cae) {
    const r = validateCae(invoice.cae)
    if (!r.valid) errors.push({ field: 'cae', message: r.error })
    const rExp = validateCaeExpiration(invoice.cae_expiration)
    if (!rExp.valid) warnings.push({ field: 'cae_expiration', message: rExp.error })
  }

  // Totales
  if (invoice.subtotal !== undefined && invoice.total_amount !== undefined) {
    const r = validateTotals({
      subtotal: invoice.subtotal,
      taxes: invoice.taxes || [],
      total: invoice.total_amount,
    })
    if (!r.valid) warnings.push({ field: 'total_amount', message: r.error })
  }

  // Duplicado
  const dupResult = detectDuplicate(invoice, existingInvoices)
  if (dupResult.isDuplicate) {
    warnings.push({
      field: 'invoice_number',
      message: `Posible duplicado de factura ${dupResult.duplicateNumber}`,
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isDuplicate: dupResult.isDuplicate,
  }
}
