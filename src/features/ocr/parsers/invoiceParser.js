/**
 * invoiceParser — extrae campos estructurados del texto OCR crudo.
 * Req 6.3, 6.10
 *
 * Reglas:
 * - NUNCA lanza excepciones — retorna campos null con confidence 0.1 si no parseable
 * - Convierte fechas DD/MM/YYYY → YYYY-MM-DD (Req 6.10)
 * - Usa nombres de campo del schema: descripcion, cantidad, precio_unitario, alicuota_iva
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parsea un monto argentino: "1.234,56" → 1234.56
 * @param {string|null} str
 * @returns {number|null}
 */
function parseAmount(str) {
  if (!str) return null
  try {
    const cleaned = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  } catch {
    return null
  }
}

/**
 * Convierte fecha DD/MM/YYYY → YYYY-MM-DD (Req 6.10)
 * @param {string|null} str
 * @returns {string|null}
 */
export function parseDate(str) {
  if (!str) return null
  try {
    const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (!match) return null
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

/**
 * Formatea fecha YYYY-MM-DD → DD/MM/YYYY (para round-trip, Req 6.11)
 * @param {string|null} str
 * @returns {string|null}
 */
export function formatDateArg(str) {
  if (!str) return null
  try {
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  } catch {
    return null
  }
}

/** Score de confianza: 0.9 si tiene valor, 0.1 si no */
function score(value) {
  return value !== null && value !== undefined && value !== '' ? 0.9 : 0.1
}

// ── Parser principal ──────────────────────────────────────────────────────────

/**
 * Parsea texto crudo OCR y retorna campos estructurados de factura argentina.
 * Req 6.3, 6.10
 *
 * @param {string} rawText
 * @returns {import('../adapters/BaseOcrAdapter').OcrNormalizedInvoice}
 */
export function parseInvoiceFromText(rawText) {
  const text = rawText || ''

  // Número de comprobante (ej: 0001-00001234)
  const invoiceNumberMatch = text.match(/Nro[:\s]+([0-9]{4}-[0-9]{8})/i)
  const invoice_number = invoiceNumberMatch?.[1] ?? null

  // Tipo de comprobante
  const invoiceTypeMatch = text.match(/FACTURA\s+([A-Z])/i)
  const invoice_type = invoiceTypeMatch ? `Factura ${invoiceTypeMatch[1].toUpperCase()}` : null

  // Fechas — primera = emisión, segunda = vencimiento
  const dateMatches = [...text.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)]
  const issue_date = parseDate(dateMatches[0]?.[1] ?? null)
  const due_date   = parseDate(dateMatches[1]?.[1] ?? null)

  // CUIT vendedor
  const sellerCuitMatch = text.match(/VENDEDOR[\s\S]*?CUIT[:\s]+(\d{2}-\d{8}-\d)/i)
  const seller_cuit = sellerCuitMatch?.[1] ?? null

  // Razón social vendedor (línea después de VENDEDOR:)
  const sellerNameMatch = text.match(/VENDEDOR[:\s]*\n\s*(.+)/i)
  const seller_name = sellerNameMatch?.[1]?.trim() ?? null

  // CUIT comprador
  const buyerCuitMatch = text.match(/COMPRADOR[\s\S]*?CUIT[:\s]+(\d{2}-\d{8}-\d)/i)
  const buyer_cuit = buyerCuitMatch?.[1] ?? null

  // Razón social comprador
  const buyerNameMatch = text.match(/COMPRADOR[:\s]*\n\s*(.+)/i)
  const buyer_name = buyerNameMatch?.[1]?.trim() ?? null

  // Montos
  const subtotalMatch  = text.match(/Subtotal[:\s]+\$?([\d.,]+)/i)
  const subtotal       = parseAmount(subtotalMatch?.[1] ?? null)

  const ivaMatch  = text.match(/IVA[^:]*[:\s]+\$?([\d.,]+)/i)
  const total_iva = parseAmount(ivaMatch?.[1] ?? null)

  const totalMatch    = text.match(/TOTAL[:\s]+\$?([\d.,]+)/i)
  const total_amount  = parseAmount(totalMatch?.[1] ?? null)

  // Ítems — formato: "Descripción - cantidad x $precio"
  const items = []
  const itemRegex = /(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*x\s*\$?([\d.,]+)/gi
  let match
  while ((match = itemRegex.exec(text)) !== null) {
    const cantidad        = parseFloat(match[2])
    const precio_unitario = parseAmount(match[3])
    if (!isNaN(cantidad) && precio_unitario !== null) {
      const subtotal_neto = Math.round(cantidad * precio_unitario * 100) / 100
      items.push({
        descripcion:     match[1].trim(),
        cantidad,
        unidad:          'un',
        precio_unitario,
        alicuota_iva:    21,   // default — el usuario puede corregir
        subtotal_neto,
        subtotal_iva:    Math.round(subtotal_neto * 0.21 * 100) / 100,
      })
    }
  }

  return {
    invoice_number,
    invoice_type,
    issue_date,
    due_date,
    seller_name,
    seller_cuit,
    buyer_name,
    buyer_cuit,
    subtotal,
    total_iva,
    total_amount,
    items,
    confidence: {
      invoice_number: score(invoice_number),
      invoice_type:   score(invoice_type),
      issue_date:     score(issue_date),
      due_date:       score(due_date),
      seller_name:    score(seller_name),
      seller_cuit:    score(seller_cuit),
      buyer_name:     score(buyer_name),
      buyer_cuit:     score(buyer_cuit),
      subtotal:       score(subtotal),
      total_iva:      score(total_iva),
      total_amount:   score(total_amount),
      items:          items.length > 0 ? 0.85 : 0.1,
    },
  }
}
