import BaseOcrAdapter from './BaseOcrAdapter'
import { supabase } from '@/lib/supabase'

/**
 * Gpt4VisionAdapter — usa GPT-4o Vision via Edge Function de Supabase.
 *
 * La API key de OpenAI vive en el servidor (Supabase Edge Function Secrets),
 * nunca llega al browser.
 *
 * @extends BaseOcrAdapter
 */
class Gpt4VisionAdapter extends BaseOcrAdapter {
  get providerName() {
    return 'gpt4v'
  }

  /**
   * Convierte un File a base64 (sin el prefijo data:...;base64,)
   * @param {File} file
   * @returns {Promise<string>}
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Extrae texto de una imagen de factura usando GPT-4o Vision.
   *
   * @param {File} file - Imagen de la factura (JPEG, PNG, WEBP)
   * @returns {Promise<import('./BaseOcrAdapter').OcrRawResult>}
   */
  async extractText(file) {
    // GPT-4 Vision no soporta PDFs directamente
    if (file.type === 'application/pdf') {
      throw new Error(
        'GPT-4 Vision no soporta PDFs directamente. Convertí el PDF a imagen (JPG/PNG) antes de escanear.'
      )
    }

    let fileBase64
    try {
      fileBase64 = await this._fileToBase64(file)
    } catch (err) {
      throw new Error(`No se pudo leer el archivo: ${err.message}`)
    }

    const { data, error } = await supabase.functions.invoke('ocr-gpt4v', {
      body: {
        fileBase64,
        mimeType: file.type,
      },
    })

    if (error) {
      throw new Error(`Error al invocar la Edge Function ocr-gpt4v: ${error.message}`)
    }

    return {
      rawText: data?.rawText ?? '',
      rawResponse: data?.rawResponse ?? {},
    }
  }
}

export default Gpt4VisionAdapter
