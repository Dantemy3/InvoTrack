import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ScanLine, CheckCircle, AlertCircle, Loader2, FileImage, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ocrService } from '../services/ocrService'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

function ConfidenceBadge({ score }) {
  if (score >= 0.8) return <Badge variant="success">Alta</Badge>
  if (score >= 0.5) return <Badge variant="warning">Media</Badge>
  return <Badge variant="destructive">Baja</Badge>
}

function DropZone({ onFile, disabled }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
        dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Upload className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Arrastrá tu factura aquí</p>
          <p className="text-sm text-gray-400 mt-1">o hacé click para seleccionar</p>
          <p className="text-xs text-gray-300 mt-2">JPG, PNG, PDF — máx. 10MB</p>
        </div>
      </div>
    </div>
  )
}

export default function OcrPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = (f) => {
    setFile(f)
    setResult(null)
    setError(null)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleProcess = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const res = await ocrService.processInvoice(file, 'mock')
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleUseData = () => {
    if (!result) return
    const { normalized } = result
    // Navegar a nueva factura con datos pre-cargados via state
    navigate('/invoices/new', { state: { ocrData: normalized } })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escanear factura</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Subí una imagen y extraemos los datos automáticamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" /> Subir imagen
              </CardTitle>
              <CardDescription>Factura A, B, C o ticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DropZone onFile={handleFile} disabled={processing} />

              {file && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileImage className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg border border-gray-100 max-h-48 object-contain"
                />
              )}

              <Button
                className="w-full"
                onClick={handleProcess}
                disabled={!file || processing}
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Procesando...</>
                ) : (
                  <><ScanLine className="h-4 w-4 mr-2" /> Extraer datos</>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div>
          {!result ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full py-16 text-gray-300">
                <ScanLine className="h-12 w-12 mb-3" />
                <p className="text-sm">Los datos extraídos aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Datos extraídos
                  </CardTitle>
                  <Badge variant="success">Completado</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fields */}
                <div className="space-y-3">
                  {[
                    { label: 'Número', value: result.normalized.invoice_number, key: 'invoice_number' },
                    { label: 'Tipo', value: result.normalized.invoice_type, key: 'invoice_type' },
                    { label: 'Fecha emisión', value: result.normalized.issue_date, key: 'issue_date' },
                    { label: 'Vencimiento', value: result.normalized.due_date, key: 'due_date' },
                    { label: 'CUIT Vendedor', value: result.normalized.seller_cuit, key: 'invoice_number' },
                    { label: 'CUIT Comprador', value: result.normalized.buyer_cuit, key: 'invoice_number' },
                  ].map(({ label, value, key }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{value || '-'}</span>
                        <ConfidenceBadge score={result.normalized.confidence[key] || 0.5} />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Amounts */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{result.normalized.subtotal ? formatCurrency(result.normalized.subtotal) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IVA</span>
                    <span className="font-medium">{result.normalized.total_iva ? formatCurrency(result.normalized.total_iva) : '-'}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">{result.normalized.total_amount ? formatCurrency(result.normalized.total_amount) : '-'}</span>
                  </div>
                </div>

                {result.normalized.items?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ítems detectados</p>
                      <div className="space-y-1">
                        {result.normalized.items.map((item, i) => (
                          <div key={i} className="text-xs text-gray-600 flex justify-between">
                            <span className="truncate flex-1">{item.description}</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button className="w-full" onClick={handleUseData}>
                  Usar estos datos <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
