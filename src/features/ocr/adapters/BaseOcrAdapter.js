/**
 * @fileoverview Clase base abstracta para adaptadores OCR.
 * Todos los proveedores OCR deben extender esta clase e implementar `extractText`.
 *
 * @module features/ocr/adapters/BaseOcrAdapter
 */

// ---------------------------------------------------------------------------
// JSDoc Shapes
// ---------------------------------------------------------------------------

/**
 * Resultado crudo retornado por un adaptador OCR.
 *
 * @typedef {Object} OcrRawResult
 * @property {string} rawText     - Texto plano extraído del documento.
 * @property {Object} rawResponse - Respuesta completa del proveedor OCR (estructura varía por proveedor).
 */

/**
 * Scores de confianza por campo extraído (valores en el rango 0.0 – 1.0).
 * Un valor de 1.0 indica máxima confianza; 0.0 indica que el campo no pudo extraerse.
 *
 * @typedef {Object} OcrConfidenceScores
 * @property {number} invoice_number - Confianza en el número de comprobante.
 * @property {number} invoice_type   - Confianza en el tipo de comprobante (Factura A, B, C…).
 * @property {number} issue_date     - Confianza en la fecha de emisión.
 * @property {number} due_date       - Confianza en la fecha de vencimiento.
 * @property {number} seller_name    - Confianza en la razón social del vendedor.
 * @property {number} seller_cuit    - Confianza en el CUIT del vendedor.
 * @property {number} buyer_name     - Confianza en la razón social del comprador.
 * @property {number} buyer_cuit     - Confianza en el CUIT del comprador.
 * @property {number} subtotal       - Confianza en el subtotal neto.
 * @property {number} total_iva      - Confianza en el total de IVA.
 * @property {number} total_amount   - Confianza en el importe total.
 */

/**
 * Ítem de línea extraído de una factura.
 *
 * @typedef {Object} OcrExtractedItem
 * @property {string|null} descripcion      - Descripción del producto o servicio.
 * @property {number|null} cantidad         - Cantidad (puede ser decimal).
 * @property {number|null} precio_unitario  - Precio unitario sin IVA.
 * @property {number|null} alicuota_iva     - Alícuota de IVA aplicada (0, 10.5, 21 o 27).
 */

/**
 * Factura normalizada producida por el parser OCR, con scores de confianza por campo.
 *
 * @typedef {Object} OcrNormalizedInvoice
 * @property {string|null}          invoice_number - Número de comprobante (ej. "0001-00001234").
 * @property {string|null}          invoice_type   - Tipo de comprobante (ej. "Factura A").
 * @property {string|null}          issue_date     - Fecha de emisión en formato YYYY-MM-DD.
 * @property {string|null}          due_date       - Fecha de vencimiento en formato YYYY-MM-DD.
 * @property {string|null}          seller_name    - Razón social del vendedor.
 * @property {string|null}          seller_cuit    - CUIT del vendedor (ej. "20-12345678-9").
 * @property {string|null}          buyer_name     - Razón social del comprador.
 * @property {string|null}          buyer_cuit     - CUIT del comprador.
 * @property {number|null}          subtotal       - Subtotal neto gravado.
 * @property {number|null}          total_iva      - Total de IVA.
 * @property {number|null}          total_amount   - Importe total del comprobante.
 * @property {OcrExtractedItem[]}   items          - Ítems de línea extraídos.
 * @property {OcrConfidenceScores}  confidence     - Scores de confianza por campo (0.0 – 1.0).
 */

// ---------------------------------------------------------------------------
// Clase abstracta
// ---------------------------------------------------------------------------

/**
 * Clase base abstracta para adaptadores OCR.
 *
 * Cada proveedor OCR (Mock, Google Document AI, Gemini Vision, GPT-4 Vision, etc.)
 * debe extender esta clase e implementar el método `extractText`.
 *
 * @abstract
 * @example
 * class MyOcrAdapter extends BaseOcrAdapter {
 *   async extractText(file) {
 *     // llamada al proveedor externo…
 *     return { rawText: '...', rawResponse: { ... } }
 *   }
 * }
 */
class BaseOcrAdapter {
  /**
   * Extrae el texto crudo de un archivo (PDF o imagen).
   *
   * Las subclases DEBEN sobreescribir este método.
   * El resultado debe conformar el shape {@link OcrRawResult}.
   *
   * @abstract
   * @param {File} file - Archivo PDF o imagen (JPEG, PNG, WEBP) a procesar.
   * @returns {Promise<OcrRawResult>} Texto crudo y respuesta completa del proveedor.
   * @throws {Error} Si la subclase no implementa este método.
   */
  // eslint-disable-next-line no-unused-vars
  async extractText(file) {
    throw new Error(
      `${this.constructor.name} debe implementar el método extractText(file).`
    )
  }
}

export default BaseOcrAdapter
