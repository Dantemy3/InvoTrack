import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ScanLine, CheckCircle, AlertCircle, Loader2, FileImage, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ZoomPanImageViewer from '@/components/ZoomPanImageViewer'
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
        'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer scan-frame',
        dragging
          ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_30px_rgba(233,106,74,0.15)]'
          : 'border-gray-300 hover:border-blue-400/60 hover:bg-blue-500/5 hover:shadow-[0_0_24px_rgba(233,106,74,0.08)]',
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
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-inset ring-blue-500/30 flex items-center justify-center">
          <Upload className="h-7 w-7 text-blue-400" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(233,106,74,0.8)] animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Arrastrá tu factura aquí</p>
          <p className="text-sm text-gray-500 mt-1">o hacé click para seleccionar</p>
          <p className="font-mono text-xs text-gray-500 mt-2">JPG, PNG, PDF — máx. 10MB</p>
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
  const [provider] = useState('gpt4v')

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
      const res = await ocrService.processInvoice(file, provider)
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
    navigate('/invoices/new', { state: { ocrData: normalized, ocrPreview: preview } })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-400/80">// captura inteligente</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Escanear factura</h1>
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
              <CardDescription>Factura, nota de crédito, débito, recibo o ticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <ZoomPanImageViewer
                  src={preview}
                  alt={file?.name ?? 'Factura'}
                  className="h-[calc(100vh-22rem)] min-h-[360px]"
                  minHeight={360}
                />
              ) : (
                <DropZone onFile={handleFile} disabled={processing} />
              )}

              {file && (
                <div className="flex items-center gap-3 p-3 bg-ink/5 ring-1 ring-inset ring-ink/10 rounded-lg">
                  <FileImage className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    disabled={processing}
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                      setResult(null)
                      setError(null)
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
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
                <div className="flex items-center gap-2 p-3 bg-red-500/10 ring-1 ring-inset ring-red-500/30 rounded-lg text-red-500 text-sm">
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
            <Card className="h-full scan-frame">
              <CardContent className="flex flex-col items-center justify-center h-full py-16 text-gray-500">
                <div className="relative h-20 w-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-blue-500/30" />
                  <div className="absolute inset-2 rounded-full border border-dashed border-violet-500/40" />
                  <ScanLine className="h-9 w-9 text-blue-400/70" />
                </div>
                <p className="text-sm mt-4">Los datos extraídos aparecerán aquí</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gray-600 mt-1.5">esperando documento</p>
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
                {/* Todos los campos extraídos con scores */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificación</p>
                  {[
                    { label: 'Tipo comprobante', value: result.normalized.invoice_type, key: 'invoice_type' },
                    { label: 'Número', value: result.normalized.invoice_number, key: 'invoice_number' },
                    { label: 'Fecha emisión', value: result.normalized.issue_date, key: 'issue_date' },
                    { label: 'Vencimiento', value: result.normalized.due_date, key: 'due_date' },
                    { label: 'CAE', value: result.normalized.cae, key: 'total_amount' },
                    { label: 'Cond. pago', value: result.normalized.condicion_pago?.replace('_', ' '), key: 'subtotal' },
                  ].map(({ label, value, key }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className={cn(
                          'font-medium text-right truncate max-w-[140px]',
                          label === 'CAE' ? 'money text-amber-500' : 'text-gray-900'
                        )}>{value || '-'}</span>
                        <ConfidenceBadge score={result.normalized.confidence[key] ?? 0.1} />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisor (Vendedor)</p>
                  {[
                    { label: 'Razón social', value: result.normalized.seller_name, key: 'seller_name' },
                    { label: 'CUIT', value: result.normalized.seller_cuit, key: 'seller_cuit' },
                    { label: 'Domicilio', value: result.normalized.seller_address, key: 'seller_name' },
                  ].map(({ label, value, key }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-gray-900 text-right truncate max-w-[140px]">{value || '-'}</span>
                        <ConfidenceBadge score={result.normalized.confidence[key] ?? 0.1} />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receptor (Comprador)</p>
                  {[
                    { label: 'Razón social', value: result.normalized.buyer_name, key: 'buyer_name' },
                    { label: 'CUIT', value: result.normalized.buyer_cuit, key: 'buyer_cuit' },
                    { label: 'Domicilio', value: result.normalized.buyer_address, key: 'buyer_name' },
                  ].map(({ label, value, key }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-gray-900 text-right truncate max-w-[140px]">{value || '-'}</span>
                        <ConfidenceBadge score={result.normalized.confidence[key] ?? 0.1} />
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Montos */}
                <div className="space-y-2 text-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Importes</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Neto gravado</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.normalized.subtotal ? formatCurrency(result.normalized.subtotal) : '-'}</span>
                      <ConfidenceBadge score={result.normalized.confidence.subtotal ?? 0.1} />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IVA</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.normalized.total_iva ? formatCurrency(result.normalized.total_iva) : '-'}</span>
                      <ConfidenceBadge score={result.normalized.confidence.total_iva ?? 0.1} />
                    </div>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">{result.normalized.total_amount ? formatCurrency(result.normalized.total_amount) : '-'}</span>
                      <ConfidenceBadge score={result.normalized.confidence.total_amount ?? 0.1} />
                    </div>
                  </div>
                </div>

                {result.normalized.items?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ítems detectados ({result.normalized.items.length})</p>
                      <div className="space-y-1.5">
                        {result.normalized.items.map((item, i) => (
                          <div key={i} className="text-xs bg-gray-100/60 rounded-lg p-2">
                            <p className="font-medium text-gray-700 truncate">{item.descripcion}</p>
                            <p className="text-gray-500 mt-0.5">
                              {item.cantidad} × {formatCurrency(item.precio_unitario)} · IVA {item.alicuota_iva}%
                              {item.subtotal_neto ? ` = ${formatCurrency(item.subtotal_neto)}` : ''}
                            </p>
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
