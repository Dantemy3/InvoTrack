/**
 * BaseOcrAdapter — clase base abstracta para adaptadores OCR.
 * Req 6.1, 6.2
 *
 * Cada proveedor OCR (Google Document AI, GPT-4 Vision, Gemini, Mock)
 * debe extender esta clase e implementar el método `extractText`.
 *
 * El patrón Adapter permite intercambiar proveedores sin modificar
 * la UI ni el parser.
 */

/**
 * @typedef {Object} OcrRawResult
 * @property {string} rawText        - Texto crudo extraído del documento
 * @property {string} provider       - Nombre del proveedor OCR usado
 * @property {number} processingTime - Tiempo de procesamiento en ms
 * @property {Object} [metadata]     - Metadatos adicionales del proveedor
 */

/**
 * @typedef {Object} OcrConfidenceScores
 * @property {number} invoice_number   - Score 0.0–1.0
 * @property {number} invoice_type     - Score 0.0–1.0
 * @property {number} issue_date       - Score 0.0–1.0
 * @property {number} due_date         - Score 0.0–1.0
 * @property {number} seller_name      - Score 0.0–1.0
 * @property {number} seller_cuit      - Score 0.0–1.0
 * @property {number} buyer_name       - Score 0.0–1.0
 * @property {number} buyer_cuit       - Score 0.0–1.0
 * @property {number} subtotal         - Score 0.0–1.0
 * @property {number} total_iva        - Score 0.0–1.0
 * @property {number} total_amount     - Score 0.0–1.0
 * @property {number} items            - Score 0.0–1.0
 */

/**
 * @typedef {Object} OcrExtractedItem
 * @property {string|null}  descripcion      - Descripción del ítem
 * @property {number|null}  cantidad         - Cantidad
 * @property {string|null}  unidad           - Unidad de medida
 * @property {number|null}  precio_unitario  - Precio unitario
 * @property {number|null}  alicuota_iva     - Alícuota IVA (0, 10.5, 21, 27)
 * @property {number|null}  subtotal_neto    - Subtotal sin IVA
 */

/**
 * @typedef {Object} OcrNormalizedInvoice
 * @property {string|null}          invoice_number  - Número de comprobante
 * @property {string|null}          invoice_type    - Tipo de comprobante
 * @property {string|null}          issue_date      - Fecha emisión YYYY-MM-DD
 * @property {string|null}          due_date        - Fecha vencimiento YYYY-MM-DD
 * @property {string|null}          seller_name     - Razón social emisor
 * @property {string|null}          seller_cuit     - CUIT emisor
 * @property {string|null}          buyer_name      - Razón social receptor
 * @property {string|null}          buyer_cuit      - CUIT receptor
 * @property {number|null}          subtotal        - Neto gravado
 * @property {number|null}          total_iva       - Total IVA
 * @property {number|null}          total_amount    - Total factura
 * @property {OcrExtractedItem[]}   items           - Ítems extraídos
 * @property {OcrConfidenceScores}  confidence      - Scores de confianza por campo
 */

export class BaseOcrAdapter {
  /**
   * Extrae texto de un archivo (PDF, JPEG, PNG, WEBP).
   * Debe ser implementado por cada adaptador concreto.
   *
   * @param {File} file - Archivo a procesar
   * @returns {Promise<OcrRawResult>}
   * @throws {Error} Si el archivo no puede procesarse
   */
  async extractText(file) {
    throw new Error(`${this.constructor.name} debe implementar extractText()`)
  }

  /**
   * Nombre del proveedor — usado para logging y persistencia.
   * @returns {string}
   */
  get providerName() {
    return 'base'
  }
}
