/**
 * OCR Adapter Interface
 * Todos los adaptadores OCR deben implementar este contrato.
 * Permite intercambiar el proveedor OCR sin modificar la UI.
 */

/**
 * @typedef {Object} OcrRawResult
 * @property {string} rawText - Texto extraído sin procesar
 * @property {Object} rawResponse - Respuesta original del proveedor
 * @property {string} provider - Nombre del proveedor OCR
 */

/**
 * @typedef {Object} OcrNormalizedInvoice
 * @property {string|null} invoice_number
 * @property {string|null} invoice_type
 * @property {string|null} issue_date
 * @property {string|null} due_date
 * @property {string|null} seller_name
 * @property {string|null} seller_cuit
 * @property {string|null} buyer_name
 * @property {string|null} buyer_cuit
 * @property {number|null} subtotal
 * @property {number|null} total_iva
 * @property {number|null} total_amount
 * @property {Array} items
 * @property {Object} confidence - Scores de confianza por campo
 */

export class BaseOcrAdapter {
  get name() {
    throw new Error('Adapter must implement name getter')
  }

  /**
   * @param {File} file
   * @returns {Promise<OcrRawResult>}
   */
  async extractText(file) {
    throw new Error('Adapter must implement extractText()')
  }
}
