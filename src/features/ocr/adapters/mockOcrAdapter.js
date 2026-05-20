import { BaseOcrAdapter } from './BaseOcrAdapter'

/**
 * MockOcrAdapter — para desarrollo y testing.
 * Simula la extracción de texto de una factura argentina típica.
 * Req 6.5
 */
export class MockOcrAdapter extends BaseOcrAdapter {
  get providerName() {
    return 'mock'
  }

  /**
   * @param {File} file
   * @returns {Promise<import('./BaseOcrAdapter').OcrRawResult>}
   */
  async extractText(file) {
    // Simula latencia de red realista
    await new Promise((r) => setTimeout(r, 1200))

    const rawText = `
      FACTURA B
      Nro: 0001-00001234
      Fecha: 15/05/2025
      Vencimiento: 30/05/2025

      VENDEDOR:
      Empresa Ejemplo S.A.
      CUIT: 30-12345678-9
      Condición IVA: Responsable Inscripto
      Domicilio: Av. Corrientes 1234, CABA

      COMPRADOR:
      Cliente Demo S.R.L.
      CUIT: 20-87654321-0
      Condición IVA: Responsable Inscripto

      DETALLE:
      Servicio de consultoría - 1 x $50000,00
      Licencia software - 2 x $15000,00

      Subtotal: $80000,00
      IVA 21%: $16800,00
      TOTAL: $96800,00

      CAE: 12345678901234
      Venc. CAE: 25/05/2025
    `

    return {
      rawText: rawText.trim(),
      rawResponse: { text: rawText, pages: 1, confidence: 0.92 },
      provider: this.providerName,
      processingTime: 1200,
    }
  }
}
