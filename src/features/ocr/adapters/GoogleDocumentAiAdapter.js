import { BaseOcrAdapter } from './BaseOcrAdapter'
import { supabase } from '@/lib/supabase'

/**
 * GoogleDocumentAiAdapter — llama a la Edge Function de Supabase
 * que a su vez invoca Google Document AI.
 * Req 6.1, 6.8
 */
export class GoogleDocumentAiAdapter extends BaseOcrAdapter {
  get providerName() {
    return 'google'
  }

  /**
   * @param {File} file
   * @returns {Promise<import('./BaseOcrAdapter').OcrRawResult>}
   */
  async extractText(file) {
    const start = Date.now()

    // Convertir archivo a base64
    const base64 = await this._fileToBase64(file)

    // Llamar a la Edge Function de Supabase (Req 6.8, 13.1)
    const { data, error } = await supabase.functions.invoke('ocr-google', {
      body: {
        fileBase64: base64,
        mimeType:   file.type,
        fileName:   file.name,
      },
    })

    if (error) throw new Error(`Google Document AI error: ${error.message}`)
    if (!data?.rawText) throw new Error('La Edge Function no retornó texto')

    return {
      rawText:        data.rawText,
      rawResponse:    data.rawResponse ?? {},
      provider:       this.providerName,
      processingTime: Date.now() - start,
    }
  }

  /**
   * Convierte un File a string base64.
   * @param {File} file
   * @returns {Promise<string>}
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result.split(',')[1])
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(file)
    })
  }
}
