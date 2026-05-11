import { MockOcrAdapter } from '../adapters/mockOcrAdapter'
import { parseInvoiceFromText } from '../parsers/invoiceParser'

/**
 * OCR Service — orquesta el pipeline completo:
 * 1. Extrae texto con el adaptador configurado
 * 2. Parsea los campos estructurados
 * 3. Retorna resultado normalizado + raw + confidence scores
 *
 * Para cambiar el proveedor OCR, solo hay que cambiar el adaptador.
 * La UI y el parser no se modifican.
 */

// Registro de adaptadores disponibles
const adapters = {
  mock: new MockOcrAdapter(),
  // google: new GoogleDocumentAiAdapter(),
  // gpt4v: new Gpt4VisionAdapter(),
  // gemini: new GeminiVisionAdapter(),
}

function getAdapter(provider = 'mock') {
  const adapter = adapters[provider]
  if (!adapter) throw new Error(`OCR adapter '${provider}' not found`)
  return adapter
}

export const ocrService = {
  /**
   * Procesa una imagen de factura y retorna datos normalizados.
   * @param {File} file
   * @param {string} provider - 'mock' | 'google' | 'gpt4v' | 'gemini'
   * @returns {Promise<{raw: OcrRawResult, normalized: OcrNormalizedInvoice}>}
   */
  async processInvoice(file, provider = 'mock') {
    const adapter = getAdapter(provider)

    // Step 1: Extract raw text
    const raw = await adapter.extractText(file)

    // Step 2: Parse structured fields
    const normalized = parseInvoiceFromText(raw.rawText)

    return { raw, normalized }
  },

  getAvailableProviders() {
    return Object.keys(adapters)
  },
}
