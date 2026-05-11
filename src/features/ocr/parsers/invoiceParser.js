/**
 * Invoice Parser
 * Extrae campos estructurados del texto OCR crudo.
 * Preparado para ser reemplazado por un parser IA (GPT-4V, Gemini).
 */

function parseAmount(str) {
  if (!str) return null
  const cleaned = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(str) {
  if (!str) return null
  // DD/MM/YYYY → YYYY-MM-DD
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return null
}

function confidence(value) {
  return value !== null && value !== undefined && value !== '' ? 0.9 : 0.1
}

/**
 * @param {string} rawText
 * @returns {import('./ocrAdapter').OcrNormalizedInvoice}
 */
export function parseInvoiceFromText(rawText) {
  const text = rawText || ''

  // Invoice number
  const invoiceNumberMatch = text.match(/Nro[:\s]+([0-9]{4}-[0-9]{8})/i)
  const invoice_number = invoiceNumberMatch?.[1] || null

  // Invoice type
  const invoiceTypeMatch = text.match(/FACTURA\s+([A-Z])/i)
  const invoice_type = invoiceTypeMatch ? `Factura ${invoiceTypeMatch[1].toUpperCase()}` : null

  // Dates
  const dateMatches = [...text.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)]
  const issue_date = parseDate(dateMatches[0]?.[1])
  const due_date = parseDate(dateMatches[1]?.[1])

  // Seller
  const sellerCuitMatch = text.match(/VENDEDOR[\s\S]*?CUIT[:\s]+(\d{2}-\d{8}-\d)/i)
  const seller_cuit = sellerCuitMatch?.[1] || null

  // Buyer
  const buyerCuitMatch = text.match(/COMPRADOR[\s\S]*?CUIT[:\s]+(\d{2}-\d{8}-\d)/i)
  const buyer_cuit = buyerCuitMatch?.[1] || null

  // Amounts
  const subtotalMatch = text.match(/Subtotal[:\s]+\$?([\d.,]+)/i)
  const subtotal = parseAmount(subtotalMatch?.[1])

  const ivaMatch = text.match(/IVA[^:]*[:\s]+\$?([\d.,]+)/i)
  const total_iva = parseAmount(ivaMatch?.[1])

  const totalMatch = text.match(/TOTAL[:\s]+\$?([\d.,]+)/i)
  const total_amount = parseAmount(totalMatch?.[1])

  // Items (basic extraction)
  const items = []
  const itemRegex = /(.+?)\s*-\s*(\d+)\s*x\s*\$?([\d.,]+)/gi
  let match
  while ((match = itemRegex.exec(text)) !== null) {
    const qty = parseFloat(match[2])
    const price = parseAmount(match[3])
    items.push({
      description: match[1].trim(),
      quantity: qty,
      unit_price: price,
      iva_rate: 21,
      subtotal: qty * price,
    })
  }

  return {
    invoice_number,
    invoice_type,
    issue_date,
    due_date,
    seller_cuit,
    buyer_cuit,
    subtotal,
    total_iva,
    total_amount,
    items,
    confidence: {
      invoice_number: confidence(invoice_number),
      invoice_type: confidence(invoice_type),
      issue_date: confidence(issue_date),
      total_amount: confidence(total_amount),
      items: items.length > 0 ? 0.85 : 0.1,
    },
  }
}
