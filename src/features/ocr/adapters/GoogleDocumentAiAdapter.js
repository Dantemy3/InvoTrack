/**
 * @fileoverview GoogleDocumentAiAdapter — adaptador OCR que delega la extracción
 * a la Edge Function de Supabase `ocr-google`, la cual invoca Google Document AI.
 *
 * Flujo:
 *   1. Convierte el archivo a base64 usando FileReader.
 *   2. Invoca `supabase.functions.invoke('ocr-google', { body: { fileBase64, mimeType, fileName } })`.
 *   3. Si la Edge Function retorna error, lanza un error descriptivo.
 *   4. Si `rawText` viene vacío o null, retorna `{ rawText: '', rawResponse: data }` sin lanzar error
 *      (el parser lo manejará con confidence 0.1 en todos los campos).
 *
 * @module features/ocr/adapters/GoogleDocumentAiAdapter
 * @see Requirements 6.1, 6.8
 */

import BaseOcrAdapter from './BaseOcrAdapter'
import { supabase } from '@/lib/supabase'

/**
 * Adaptador OCR que utiliza Google Document AI a través de una Edge Function de Supabase.
 * Extiende {@link BaseOcrAdapter} e implementa `extractText`.
 *
 * @extends BaseOcrAdapter
 */
class GoogleDocumentAiAdapter extends BaseOcrAdapter {
  /**
   * Nombre del proveedor OCR. Usado para trazabilidad en `invoices.ocr_provider`.
   * @type {string}
   */
  get providerName() {
    return 'google'
  }

  /**
   * Extrae el texto crudo de un archivo invocando la Edge Function `ocr-google`.
   *
   * @param {File} file - Archivo PDF o imagen (JPEG, PNG, WEBP) a procesar.
   * @returns {Promise<import('./BaseOcrAdapter').OcrRawResult>} Texto crudo y respuesta del proveedor.
   * @throws {Error} Si la Edge Function retorna un error de red o de procesamiento.
   */
  async extractText(file) {
    // 1. Convertir el archivo a base64 para enviarlo en el body JSON — Req 6.8
    let fileBase64
    try {
      fileBase64 = await this._fileToBase64(file)
    } catch (readError) {
      throw new Error(
        `GoogleDocumentAiAdapter: no se pudo leer el archivo "${file.name}". ${readError.message}`
      )
    }

    // 2. Invocar la Edge Function de Supabase — Req 6.8, 13.1
    const { data, error } = await supabase.functions.invoke('ocr-google', {
      body: {
        fileBase64,
        mimeType: file.type,
        fileName: file.name,
      },
    })

    // 3. Manejar errores de red o de la Edge Function — Req 6.1
    if (error) {
      throw new Error(
        `GoogleDocumentAiAdapter: error al invocar la Edge Function "ocr-google". ${error.message}`
      )
    }

    // 4. Si rawText viene vacío o null, retornar sin lanzar error — el parser lo maneja
    //    El usuario verá el formulario vacío y podrá corregir manualmente.
    return {
      rawText:     data?.rawText ?? '',
      rawResponse: data ?? {},
    }
  }

  /**
   * Convierte un `File` a una cadena base64 (sin el prefijo `data:...;base64,`).
   *
   * @param {File} file - Archivo a convertir.
   * @returns {Promise<string>} Cadena base64 del contenido del archivo.
   * @throws {Error} Si el FileReader falla al leer el archivo.
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => {
        // reader.result tiene el formato "data:<mimeType>;base64,<datos>"
        // Extraemos solo la parte base64 después de la coma
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () =>
        reject(new Error('FileReader no pudo leer el archivo.'))
      reader.readAsDataURL(file)
    })
  }
}

export default GoogleDocumentAiAdapter
