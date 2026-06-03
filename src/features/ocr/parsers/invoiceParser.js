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
 * Parsea un monto argentino: "$1.234,56" → 1234.56 o "$1234.56" → 1234.56
 * @param {string|null} str
 * @returns {number|null}
 */
function parseAmount(str) {
  if (!str) return null
  try {
    // Eliminar símbolo $ y espacios
    let cleaned = str.replace(/\$/g, '').trim()

    // Detectar formato argentino: punto como separador de miles, coma como decimal
    // Ej: "1.234,56" → "1234.56"
    if (/\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (/\d+(,\d{3})+(\.\d+)?$/.test(cleaned)) {
      // Formato con coma como miles y punto como decimal: "1,234.56"
      cleaned = cleaned.replace(/,/g, '')
    } else {
      // Formato simple: reemplazar coma por punto si hay
      cleaned = cleaned.replace(',', '.')
    }

    // Eliminar cualquier carácter no numérico excepto punto
    cleaned = cleaned.replace(/[^0-9.]/g, '')

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
    const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return null
    const [, day, month, year] = match
    // Validar rangos básicos
    const d = parseInt(day, 10)
    const m = parseInt(month, 10)
    const y = parseInt(year, 10)
    if (d < 1 || d > 31) return null
    if (m < 1 || m > 12) return null
    if (y < 1900 || y > 2100) return null
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
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
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

/**
 * Extrae la primera fecha que aparece después de una etiqueta dada.
 * @param {string} text
 * @param {RegExp} labelRegex
 * @returns {string|null} fecha en formato DD/MM/YYYY o null
 */
function extractDateAfterLabel(text, labelRegex) {
  const match = text.match(new RegExp(labelRegex.source + '[:\\s]*([\\d]{2}\\/[\\d]{2}\\/[\\d]{4})', labelRegex.flags))
  return match?.[1] ?? null
}

/**
 * Normaliza un CUIT: acepta "20123456789" (11 dígitos) o "20-12345678-9"
 * y retorna siempre en formato "XX-XXXXXXXX-X".
 * @param {string|null} raw
 * @returns {string|null}
 */
function normalizeCuit(raw) {
  if (!raw) return null
  // Ya tiene formato con guiones
  if (/^\d{2}-\d{8}-\d$/.test(raw)) return raw
  // 11 dígitos sin guiones
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
  }
  return null
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

  // ── Número de comprobante ─────────────────────────────────────────────────
  // Formato: XXXX-XXXXXXXX (punto de venta - número)
  const invoiceNumberMatch = text.match(/(?:Nro|N[°º]|Número)[:\s.]*([0-9]{4}-[0-9]{8})/i)
    ?? text.match(/\b([0-9]{4}-[0-9]{8})\b/)
  const invoice_number = invoiceNumberMatch?.[1] ?? null

  // ── Tipo de comprobante ───────────────────────────────────────────────────
  // Soporta: FACTURA A/B/C/M, NOTA DE CRÉDITO A/B/C, NOTA DE DÉBITO A/B/C, RECIBO
  let invoice_type = null
  const typePatterns = [
    { regex: /NOTA\s+DE\s+CR[EÉ]DITO\s+([A-Z])/i, prefix: 'Nota de Crédito' },
    { regex: /NOTA\s+DE\s+D[EÉ]BITO\s+([A-Z])/i,  prefix: 'Nota de Débito' },
    { regex: /FACTURA\s+([A-Z])/i,                  prefix: 'Factura' },
    { regex: /RECIBO/i,                              prefix: 'Recibo', noSuffix: true },
  ]
  for (const { regex, prefix, noSuffix } of typePatterns) {
    const m = text.match(regex)
    if (m) {
      invoice_type = noSuffix ? prefix : `${prefix} ${m[1].toUpperCase()}`
      break
    }
  }

  // ── Fechas ────────────────────────────────────────────────────────────────
  // Buscar específicamente por etiqueta para evitar capturar Venc. CAE
  const issueDateRaw = extractDateAfterLabel(text, /Fecha(?:\s+de\s+emisi[oó]n)?/i)
  const dueDateRaw   = extractDateAfterLabel(text, /Vencimiento(?:\s+de\s+pago)?/i)

  // Fallback: si no hay etiquetas, usar las primeras dos fechas del texto
  // (excluyendo fechas de CAE que suelen aparecer al final)
  let issue_date = parseDate(issueDateRaw)
  let due_date   = parseDate(dueDateRaw)

  if (!issue_date || !due_date) {
    // Extraer todas las fechas del texto, ignorando las que están en contexto de CAE
    const textWithoutCae = text.replace(/(?:Venc\.?\s*CAE|CAE\s+Venc\.?)[:\s]*\d{2}\/\d{2}\/\d{4}/gi, '')
    const allDates = [...textWithoutCae.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map(m => m[1])
    if (!issue_date && allDates[0]) issue_date = parseDate(allDates[0])
    if (!due_date   && allDates[1]) due_date   = parseDate(allDates[1])
  }

  // ── CUIT vendedor ─────────────────────────────────────────────────────────
  // Buscar en el bloque VENDEDOR
  const vendedorBlock = text.match(/VENDEDOR[\s\S]*?(?=COMPRADOR|DETALLE|$)/i)?.[0] ?? ''
  const sellerCuitRaw = vendedorBlock.match(/CUIT[:\s]+(\d{2}-\d{8}-\d|\d{11})/i)?.[1]
    ?? text.match(/CUIT[:\s]+(\d{2}-\d{8}-\d|\d{11})/i)?.[1]
    ?? null
  const seller_cuit = normalizeCuit(sellerCuitRaw)

  // ── Razón social vendedor ─────────────────────────────────────────────────
  // Línea inmediatamente después de "VENDEDOR:"
  const sellerNameMatch = text.match(/VENDEDOR[:\s]*\r?\n\s*(.+)/i)
  const seller_name = sellerNameMatch?.[1]?.trim() ?? null

  // ── CUIT comprador ────────────────────────────────────────────────────────
  const compradorBlock = text.match(/COMPRADOR[\s\S]*?(?=DETALLE|DESCRIPCI[OÓ]N|Neto|IVA|TOTAL|$)/i)?.[0] ?? ''
  const buyerCuitRaw = compradorBlock.match(/CUIT[:\s]+(\d{2}-\d{8}-\d|\d{11})/i)?.[1] ?? null
  const buyer_cuit = normalizeCuit(buyerCuitRaw)

  // ── Razón social comprador ────────────────────────────────────────────────
  const buyerNameMatch = text.match(/COMPRADOR[:\s]*\r?\n\s*(.+)/i)
  const buyer_name = buyerNameMatch?.[1]?.trim() ?? null

  // ── Domicilio vendedor ────────────────────────────────────────────────────
  const sellerAddressMatch = vendedorBlock.match(/Domicilio[:\s]+(.+)/i)
  const seller_address = sellerAddressMatch?.[1]?.trim() ?? null

  // ── Domicilio comprador ───────────────────────────────────────────────────
  const buyerAddressMatch = compradorBlock.match(/Domicilio[:\s]+(.+)/i)
  const buyer_address = buyerAddressMatch?.[1]?.trim() ?? null

  // ── CAE ───────────────────────────────────────────────────────────────────
  const caeMatch = text.match(/CAE[:\s]+(\d{14})/i)
  const cae = caeMatch?.[1] ?? null

  // ── Vencimiento CAE ───────────────────────────────────────────────────────
  const caeVencRaw = extractDateAfterLabel(text, /Venc\.?\s*CAE/i)
  const cae_vencimiento = parseDate(caeVencRaw)

  // ── Condición de pago ─────────────────────────────────────────────────────
  let condicion_pago = null
  if (/cuenta\s+corriente/i.test(text)) condicion_pago = 'cuenta_corriente'
  else if (/contado/i.test(text)) condicion_pago = 'contado'

  // ── Montos ────────────────────────────────────────────────────────────────
  // Subtotal / Neto gravado
  const subtotalMatch = text.match(/(?:Neto\s+gravado|Subtotal\s+neto|Subtotal)[:\s]+\$?([\d.,]+)/i)
  const subtotal = parseAmount(subtotalMatch?.[1] ?? null)

  // IVA total — buscar línea con "IVA" seguido de porcentaje o directamente el monto
  const ivaMatch = text.match(/IVA\s+\d+%[:\s]+\$?([\d.,]+)/i)
    ?? text.match(/Total\s+IVA[:\s]+\$?([\d.,]+)/i)
    ?? text.match(/IVA[:\s]+\$?([\d.,]+)/i)
  const total_iva = parseAmount(ivaMatch?.[1] ?? null)

  // Total del comprobante
  const totalMatch = text.match(/TOTAL[:\s]+\$?([\d.,]+)/i)
  const total_amount = parseAmount(totalMatch?.[1] ?? null)

  // ── Ítems de línea ────────────────────────────────────────────────────────
  const items = parseItems(text)

  return {
    invoice_number,
    invoice_type,
    issue_date,
    due_date,
    seller_name,
    seller_cuit,
    seller_address,
    buyer_name,
    buyer_cuit,
    buyer_address,
    cae,
    cae_vencimiento,
    condicion_pago,
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

// ── Parser de ítems ───────────────────────────────────────────────────────────

/**
 * Extrae los ítems de línea del texto OCR.
 * Soporta múltiples formatos de tabla de facturas argentinas.
 *
 * @param {string} text
 * @returns {import('../adapters/BaseOcrAdapter').OcrExtractedItem[]}
 */
function parseItems(text) {
  const items = []

  // Intentar extraer el bloque de detalle entre "DETALLE:" y los totales
  const detalleMatch = text.match(
    /DETALLE[:\s]*\r?\n([\s\S]*?)(?=\r?\nNeto\s+gravado|\r?\nSubtotal|\r?\nIVA|\r?\nTOTAL|CAE:|$)/i
  )
  const detalleBlock = detalleMatch?.[1] ?? text

  // Formato 1: tabla con columnas separadas por espacios
  // "Descripción    Cant.  P. Unit.    Alíc. IVA   Subtotal"
  // "Servicio IT    10     $12.500,00  21%         $125.000,00"
  const tableItemRegex = /^(.+?)\s{2,}(\d+(?:[.,]\d+)?)\s+\$?([\d.,]+)\s+(\d+(?:[.,]\d+)?)%\s+\$?([\d.,]+)\s*$/gm
  let match
  while ((match = tableItemRegex.exec(detalleBlock)) !== null) {
    const descripcion     = match[1].trim()
    const cantidad        = parseFloat(match[2].replace(',', '.'))
    const precio_unitario = parseAmount(match[3])
    const alicuota_iva    = parseFloat(match[4].replace(',', '.'))
    const subtotal_neto   = parseAmount(match[5])

    if (descripcion && !isNaN(cantidad) && precio_unitario !== null) {
      const iva = isNaN(alicuota_iva) ? 21 : alicuota_iva
      const neto = subtotal_neto ?? Math.round(cantidad * precio_unitario * 100) / 100
      items.push({
        descripcion,
        cantidad,
        unidad:          'un',
        precio_unitario,
        alicuota_iva:    iva,
        subtotal_neto:   neto,
        subtotal_iva:    Math.round(neto * (iva / 100) * 100) / 100,
      })
    }
  }

  // Formato 2: "Descripción - cantidad x $precio" (formato simple)
  if (items.length === 0) {
    const simpleItemRegex = /^(.+?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*[xX×]\s*\$?([\d.,]+)/gm
    while ((match = simpleItemRegex.exec(detalleBlock)) !== null) {
      const descripcion     = match[1].trim()
      const cantidad        = parseFloat(match[2].replace(',', '.'))
      const precio_unitario = parseAmount(match[3])

      if (descripcion && !isNaN(cantidad) && precio_unitario !== null) {
        const subtotal_neto = Math.round(cantidad * precio_unitario * 100) / 100
        items.push({
          descripcion,
          cantidad,
          unidad:          'un',
          precio_unitario,
          alicuota_iva:    21,
          subtotal_neto,
          subtotal_iva:    Math.round(subtotal_neto * 0.21 * 100) / 100,
        })
      }
    }
  }

  // Formato 3: líneas con cantidad al inicio
  // "10 Servicio IT $12.500,00 21% $125.000,00"
  if (items.length === 0) {
    const altItemRegex = /^(\d+(?:[.,]\d+)?)\s+(.+?)\s+\$?([\d.,]+)\s+(\d+(?:[.,]\d+)?)%/gm
    while ((match = altItemRegex.exec(detalleBlock)) !== null) {
      const cantidad        = parseFloat(match[1].replace(',', '.'))
      const descripcion     = match[2].trim()
      const precio_unitario = parseAmount(match[3])
      const alicuota_iva    = parseFloat(match[4].replace(',', '.'))

      if (descripcion && !isNaN(cantidad) && precio_unitario !== null) {
        const iva = isNaN(alicuota_iva) ? 21 : alicuota_iva
        const subtotal_neto = Math.round(cantidad * precio_unitario * 100) / 100
        items.push({
          descripcion,
          cantidad,
          unidad:          'un',
          precio_unitario,
          alicuota_iva:    iva,
          subtotal_neto,
          subtotal_iva:    Math.round(subtotal_neto * (iva / 100) * 100) / 100,
        })
      }
    }
  }

  return items
}

// ── Parser específico para respuestas de GPT-4 Vision ────────────────────────

/**
 * Parsea la respuesta estructurada de GPT-4 Vision.
 * GPT-4 devuelve el texto en el formato de etiquetas que le pedimos en el prompt.
 *
 * @param {string} rawText - Texto estructurado devuelto por GPT-4
 * @returns {import('../adapters/BaseOcrAdapter').OcrNormalizedInvoice}
 */
export function parseGpt4Response(rawText) {
  const text = rawText || ''

  // Helper para extraer valor de una etiqueta
  const get = (label) => {
    const match = text.match(new RegExp(`${label}:\\s*(.+)`, 'i'))
    return match?.[1]?.trim() || null
  }

  // Helper para extraer número limpio
  const getNum = (label) => {
    const val = get(label)
    if (!val) return null
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  // Mapear tipo de comprobante al formato del sistema
  const tipoRaw = get('TIPO') ?? ''
  const tipoMap = {
    'factura a': 'Factura A', 'factura b': 'Factura B', 'factura c': 'Factura C',
    'factura m': 'Factura M', 'nota de crédito a': 'Nota de Crédito A',
    'nota de crédito b': 'Nota de Crédito B', 'nota de crédito c': 'Nota de Crédito C',
    'nota de débito a': 'Nota de Débito A', 'nota de débito b': 'Nota de Débito B',
    'nota de débito c': 'Nota de Débito C', 'recibo': 'Recibo',
  }
  const invoice_type = (tipoMap[tipoRaw.toLowerCase()] ?? tipoRaw) || null

  const invoice_number = get('NUMERO')
  const issue_date     = parseDate(get('FECHA_EMISION'))
  const due_date       = parseDate(get('FECHA_VENCIMIENTO'))
  const cae            = get('CAE')
  const cae_vencimiento = parseDate(get('VENC_CAE'))

  const condPagoRaw = (get('CONDICION_PAGO') ?? '').toLowerCase()
  const condicion_pago = condPagoRaw.includes('corriente') ? 'cuenta_corriente'
    : condPagoRaw.includes('contado') ? 'contado' : null

  // Extraer bloque VENDEDOR
  const vendedorBlock = text.match(/VENDEDOR:\s*([\s\S]*?)(?=COMPRADOR:|$)/i)?.[1] ?? ''
  const getFromBlock = (block, label) => {
    const m = block.match(new RegExp(`${label}:\\s*(.+)`, 'i'))
    return m?.[1]?.trim() || null
  }

  const seller_name    = getFromBlock(vendedorBlock, 'RAZON_SOCIAL')
  const seller_cuit    = normalizeCuit(getFromBlock(vendedorBlock, 'CUIT'))
  const seller_address = getFromBlock(vendedorBlock, 'DOMICILIO')

  // Extraer bloque COMPRADOR
  const compradorBlock = text.match(/COMPRADOR:\s*([\s\S]*?)(?=ITEMS:|NETO_GRAVADO:|$)/i)?.[1] ?? ''
  const buyer_name    = getFromBlock(compradorBlock, 'RAZON_SOCIAL')
  const buyer_cuit    = normalizeCuit(getFromBlock(compradorBlock, 'CUIT'))
  const buyer_address = getFromBlock(compradorBlock, 'DOMICILIO')

  // Extraer ítems del bloque ITEMS
  const itemsBlock = text.match(/ITEMS:\s*([\s\S]*?)(?=NETO_GRAVADO:|$)/i)?.[1] ?? ''
  const items = []
  const itemRegex = /DESCRIPCION:\s*(.+?)\s*\|\s*CANTIDAD:\s*([\d.,]+)\s*\|\s*PRECIO_UNITARIO:\s*([\d.,]+)\s*\|\s*ALICUOTA_IVA:\s*([\d.,]+)\s*\|\s*SUBTOTAL_NETO:\s*([\d.,]+)/gi
  let m
  while ((m = itemRegex.exec(itemsBlock)) !== null) {
    const descripcion     = m[1].trim()
    const cantidad        = parseFloat(m[2].replace(',', '.'))
    const precio_unitario = parseFloat(m[3].replace(',', '.'))
    const alicuota_iva    = parseFloat(m[4].replace(',', '.'))
    const subtotal_neto   = parseFloat(m[5].replace(',', '.'))

    if (descripcion && !isNaN(cantidad) && !isNaN(precio_unitario)) {
      const iva = [0, 10.5, 21, 27].includes(alicuota_iva) ? alicuota_iva : 21
      items.push({
        descripcion,
        cantidad,
        unidad: 'un',
        precio_unitario,
        alicuota_iva: iva,
        subtotal_neto: isNaN(subtotal_neto) ? Math.round(cantidad * precio_unitario * 100) / 100 : subtotal_neto,
        subtotal_iva: Math.round((isNaN(subtotal_neto) ? cantidad * precio_unitario : subtotal_neto) * (iva / 100) * 100) / 100,
      })
    }
  }

  const subtotal     = getNum('NETO_GRAVADO')
  const iva_105      = getNum('IVA_105')
  const iva_21       = getNum('IVA_21')
  const iva_27       = getNum('IVA_27')
  const total_iva    = (iva_105 ?? 0) + (iva_21 ?? 0) + (iva_27 ?? 0) || null
  const total_amount = getNum('TOTAL')

  const s = (v) => (v !== null && v !== undefined && v !== '' ? 0.95 : 0.1)

  return {
    invoice_number,
    invoice_type,
    issue_date,
    due_date,
    seller_name,
    seller_cuit,
    seller_address,
    buyer_name,
    buyer_cuit,
    buyer_address,
    cae,
    cae_vencimiento,
    condicion_pago,
    subtotal,
    total_iva,
    total_amount,
    items,
    confidence: {
      invoice_number: s(invoice_number),
      invoice_type:   s(invoice_type),
      issue_date:     s(issue_date),
      due_date:       s(due_date),
      seller_name:    s(seller_name),
      seller_cuit:    s(seller_cuit),
      buyer_name:     s(buyer_name),
      buyer_cuit:     s(buyer_cuit),
      subtotal:       s(subtotal),
      total_iva:      s(total_iva),
      total_amount:   s(total_amount),
      items:          items.length > 0 ? 0.95 : 0.1,
    },
  }
}
