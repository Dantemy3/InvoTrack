import { BaseOcrAdapter } from './ocrAdapter'

/**
 * Mock OCR Adapter — para desarrollo y testing.
 * Simula la extracción de texto de una factura argentina.
 */
export class MockOcrAdapter extends BaseOcrAdapter {
  get name() {
    return 'mock'
  }

  async extractText(file) {
    // Simula latencia de red
    await new Promise((r) => setTimeout(r, 1500))

    const rawText = `
      FACTURA B
      Nro: 0001-00001234
      Fecha: 15/05/2026
      Vencimiento: 30/05/2026
      
      VENDEDOR:
      Empresa Ejemplo S.A.
      CUIT: 30-12345678-9
      Condición IVA: Responsable Inscripto
      
      COMPRADOR:
      Cliente Demo S.R.L.
      CUIT: 20-87654321-0
      
      DETALLE:
      Servicio de consultoría - 1 x $50.000,00
      Licencia software - 2 x $15.000,00
      
      Subtotal: $80.000,00
      IVA 21%: $16.800,00
      TOTAL: $96.800,00
    `

    return {
      rawText,
      rawResponse: { text: rawText, pages: 1 },
      provider: this.name,
    }
  }
}
