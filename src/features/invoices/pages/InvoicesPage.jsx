import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, ScanLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InvoiceTable from '../components/InvoiceTable'
import { useInvoices } from '../hooks/useInvoices'

/**
 * Página de listado de facturas.
 * Req 9.3 — debounce 300ms en búsqueda
 * Req 9.5 — filtros en URL params para compartir y navegar con atrás
 * Paginación server-side con pageSize=20
 */
// Página de listado de facturas con filtros (estado, tipo, fecha, búsqueda),
// paginación server-side y persistencia de filtros en URL params.
export default function InvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Leer filtros desde URL
  const urlStatus   = searchParams.get('status')   ?? ''
  const urlType     = searchParams.get('type')     ?? ''
  const urlSearch   = searchParams.get('search')   ?? ''
  const urlDateFrom = searchParams.get('dateFrom') ?? ''
  const urlDateTo   = searchParams.get('dateTo')   ?? ''
  const urlPage     = parseInt(searchParams.get('page') ?? '1', 10)

  // Estado local solo para el input de búsqueda (para el debounce)
  const [inputValue, setInputValue] = useState(urlSearch)
  // Ref para evitar loop: no sincronizar cuando el cambio de URL viene del propio debounce
  const isDebouncing = useRef(false)

  // Sincronizar inputValue cuando la URL cambia externamente (ej: botón atrás del navegador)
  useEffect(() => {
    if (!isDebouncing.current) {
      setInputValue(urlSearch)
    }
  }, [urlSearch])

  // Debounce 300ms: actualiza URL params solo después del delay (Req 9.3)
  useEffect(() => {
    isDebouncing.current = true
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (inputValue) next.set('search', inputValue)
        else next.delete('search')
        next.set('page', '1')
        return next
      })
      isDebouncing.current = false
    }, 300)
    return () => {
      clearTimeout(timer)
      isDebouncing.current = false
    }
  }, [inputValue, setSearchParams])

  const pageSize = 20

  const { data, count, isLoading } = useInvoices({
    status:   urlStatus   || undefined,
    type:     urlType     || undefined,
    search:   urlSearch   || undefined,
    dateFrom: urlDateFrom || undefined,
    dateTo:   urlDateTo   || undefined,
    page:     urlPage,
    pageSize,
  })

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  // Actualiza un filtro en los URL params y resetea la paginación a página 1.
  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.set('page', '1')
      return next
    })
  }

  // Navega a la página indicada actualizando el param `page` en la URL.
  const setPage = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  // Limpia todos los filtros activos y resetea la URL a su estado inicial.
  const clearFilters = () => {
    setInputValue('')
    setSearchParams({})
  }

  const hasActiveFilters = urlStatus || urlType || urlSearch || urlDateFrom || urlDateTo

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} facturas en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ocr')}>
            <ScanLine className="h-4 w-4 mr-2" />
            Escanear
          </Button>
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva factura
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Búsqueda con debounce */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número..."
                className="pl-9"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            {/* Filtro por estado */}
            <Select
              value={urlStatus || 'all'}
              onValueChange={(v) => setFilter('status', v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por tipo */}
            <Select
              value={urlType || 'all'}
              onValueChange={(v) => setFilter('type', v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="receivable">Cobrar (ingreso)</SelectItem>
                <SelectItem value="payable">Pagar (gasto)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de fecha */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Desde</Label>
              <Input
                type="date"
                className="w-full sm:w-40"
                value={urlDateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Hasta</Label>
              <Input
                type="date"
                className="w-full sm:w-40"
                value={urlDateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <InvoiceTable invoices={data} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Paginación server-side */}
      {count > pageSize && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {Math.min((urlPage - 1) * pageSize + 1, count)}–{Math.min(urlPage * pageSize, count)} de {count}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={urlPage <= 1}
              onClick={() => setPage(urlPage - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2">
              {urlPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={urlPage >= totalPages}
              onClick={() => setPage(urlPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
