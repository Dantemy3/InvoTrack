import { MockOcrAdapter } from '../adapters/mockOcrAdapter'
import { GoogleDocumentAiAdapter } from '../adapters/GoogleDocumentAiAdapter'
import { parseInvoiceFromText } from '../parsers/invoiceParser'

/**
 * ocrService — orquesta el pipeline OCR completo.
 * Req 6.2, 6.4, 6.7, 6.8
 *
 * Pipeline:
 * 1. Validar tipo de archivo
 * 2. Extraer texto crudo via adaptador
 * 3. Parsear campos estructurados
 * 4. Clampear confidence scores a [0.0, 1.0]
 * 5. Retornar resultado normalizado
 */

// Tipos de archivo permitidos (Req 6.9)
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

// Registro de adaptadores disponibles (Req 6.8)
const adapters = {
  mock:   new MockOcrAdapter(),
  google: new GoogleDocumentAiAdapter(),
  // gpt4v:  new Gpt4VisionAdapter(),   — Fase 4
  // gemini: new GeminiVisionAdapter(), — Fase 4
}

/**
 * Clampea todos los scores de confianza al rango [0.0, 1.0].
 * Req 6.4 — si un proveedor retorna valores fuera del rango, se normalizan.
 *
 * @param {Object} scores - Objeto con scores por campo
 * @returns {Object} Scores clampeados
 */
export function clampConfidenceScores(scores) {
  if (!scores || typeof scores !== 'object') return {}
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [
      k,
      Math.min(1.0, Math.max(0.0, Number(v) || 0)),
    ])
  )
}

export const ocrService = {
  /**
   * Procesa un archivo de factura y retorna datos normalizados.
   * Req 6.2, 6.4, 6.7, 6.8
   *
   * @param {File} file
   * @param {'mock'|'google'|'gpt4v'|'gemini'} provider
   * @returns {Promise<{ raw: OcrRawResult, normalized: OcrNormalizedInvoice }>}
   */
  async processInvoice(file, provider = 'mock') {
    // Validar tipo de archivo (Req 6.9)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de archivo no soportado: ${file.type}. Usá PDF, JPEG, PNG o WEBP.`
      )
    }

    const adapter = adapters[provider]
    if (!adapter) throw new Error(`Adaptador OCR '${provider}' no encontrado`)

    // Paso 1: Extraer texto crudo
    const raw = await adapter.extractText(file)

    // Paso 2: Parsear campos estructurados
    const normalized = parseInvoiceFromText(raw.rawText)

    // Paso 3: Clampear confidence scores (Req 6.4)
    const clampedConfidence = clampConfidenceScores(normalized.confidence)

    return {
      raw,
      normalized: {
        ...normalized,
        confidence: clampedConfidence,
      },
    }
  },

  /**
   * Lista los proveedores OCR disponibles.
   * @returns {string[]}
   */
  getAvailableProviders() {
    return Object.keys(adapters)
  },
}
