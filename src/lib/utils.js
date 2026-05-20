import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date, formatStr = 'dd/MM/yyyy') {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR')
}

export function formatDateLong(date) {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

export function truncate(str, length = 50) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

/**
 * Calcula los totales fiscales de una factura a partir de sus ítems.
 * Req 5.7 — alícuotas válidas: 0, 10.5, 21, 27
 *
 * @param {Array<{cantidad: number, precio_unitario: number, alicuota_iva: number}>} items
 * @returns {{
 *   neto_gravado: number,
 *   iva_105: number,
 *   iva_21: number,
 *   iva_27: number,
 *   total_amount: number,
 *   items: Array<{subtotal_neto: number, subtotal_iva: number}>
 * }}
 */
export function calculateInvoiceTotals(items = []) {
  let neto_gravado = 0
  let iva_105 = 0
  let iva_21 = 0
  let iva_27 = 0

  const enrichedItems = items.map((item) => {
    const cantidad = Number(item.cantidad) || 0
    const precio = Number(item.precio_unitario) || 0
    const alicuota = Number(item.alicuota_iva) || 0

    const subtotal_neto = round2(cantidad * precio)
    const subtotal_iva = round2(subtotal_neto * (alicuota / 100))

    neto_gravado += subtotal_neto

    if (alicuota === 10.5) iva_105 += subtotal_iva
    else if (alicuota === 21) iva_21 += subtotal_iva
    else if (alicuota === 27) iva_27 += subtotal_iva
    // alicuota === 0: no suma IVA

    return { ...item, subtotal_neto, subtotal_iva }
  })

  const total_amount = round2(neto_gravado + iva_105 + iva_21 + iva_27)

  return {
    neto_gravado: round2(neto_gravado),
    iva_105: round2(iva_105),
    iva_21: round2(iva_21),
    iva_27: round2(iva_27),
    total_amount,
    items: enrichedItems,
  }
}

/** Redondea a 2 decimales evitando errores de punto flotante. */
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
