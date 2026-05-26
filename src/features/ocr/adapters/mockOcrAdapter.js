/**
 * @fileoverview MockOcrAdapter — adaptador OCR para desarrollo y testing.
 * Simula la extracción de texto de una factura argentina típica (Factura A).
 *
 * Datos coherentes:
 *   Ítem 1: Servicio de consultoría IT — 10 hs × $12.500,00 = $125.000,00 neto
 *   Ítem 2: Licencia software anual    —  2 un × $45.000,00 = $90.000,00 neto
 *   Neto gravado total: $215.000,00
 *   IVA 21% (21% × $215.000,00): $45.150,00
 *   Total:              $260.150,00
 *
 * @module features/ocr/adapters/mockOcrAdapter
 * @see Requirements 6.5
 */

import BaseOcrAdapter from './BaseOcrAdapter'

/**
 * Adaptador OCR simulado para desarrollo y testing.
 * Extiende {@link BaseOcrAdapter} e implementa `extractText` retornando
 * texto de una factura argentina típica sin llamar a ningún servicio externo.
 *
 * @extends BaseOcrAdapter
 */
export class MockOcrAdapter extends BaseOcrAdapter {
  /**
   * Simula la extracción de texto de una factura argentina (Factura A).
   * Introduce un delay de ~500 ms para emular latencia de procesamiento OCR.
   *
   * @param {File} file - Archivo PDF o imagen (no se procesa realmente).
   * @returns {Promise<import('./BaseOcrAdapter').OcrRawResult>}
   */
  async extractText(file) {
    // Simula latencia de procesamiento OCR (~500 ms) — Req 6.5
    await new Promise((r) => setTimeout(r, 500))

    const rawText = `FACTURA A
Nro: 0003-00004521
Fecha: 12/06/2025
Vencimiento: 12/07/2025

VENDEDOR:
Tech Solutions S.A.
CUIT: 30-71234567-8
Condición IVA: Responsable Inscripto
Domicilio: Av. Corrientes 1234 Piso 5, CABA

COMPRADOR:
Distribuidora del Sur S.R.L.
CUIT: 30-68901234-5
Condición IVA: Responsable Inscripto
Domicilio: Belgrano 456, Rosario, Santa Fe

DETALLE:
Descripción                          Cant.  P. Unit.      Alíc. IVA   Subtotal
Servicio de consultoría IT           10     $12.500,00    21%         $125.000,00
Licencia software anual               2     $45.000,00    21%          $90.000,00

Neto gravado: $215.000,00
IVA 21%:       $45.150,00
TOTAL:        $260.150,00

CAE: 74123456789012
Venc. CAE: 22/06/2025

Condición de pago: Cuenta Corriente
Moneda: ARS`

    return {
      rawText,
      rawResponse: {
        pages: 1,
        confidence: 0.95,
      },
    }
  }
}
