import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FilePlus, Users, UserPlus,
  Truck, TruckIcon, Package, PackagePlus, BarChart3,
  Bell, Settings, Zap, Search, ArrowRight, Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// ── Definición de comandos ────────────────────────────────────────────────────
// Cada comando tiene: id, label, descripción, icono, ruta y grupo.
// Los grupos se usan para agrupar visualmente en la paleta.
const COMMANDS = [
  // Creación rápida
  {
    id: 'new-invoice',
    label: 'Nueva factura',
    description: 'Crear una factura de venta o compra',
    icon: FilePlus,
    to: '/invoices/new',
    group: 'Crear',
    keywords: ['factura', 'invoice', 'nueva', 'crear', 'comprobante'],
  },
  {
    id: 'new-client',
    label: 'Nuevo cliente',
    description: 'Agregar un cliente a la lista',
    icon: UserPlus,
    to: '/clients?new=1',
    group: 'Crear',
    keywords: ['cliente', 'client', 'nuevo', 'agregar'],
  },
  {
    id: 'new-provider',
    label: 'Nuevo proveedor',
    description: 'Agregar un proveedor a la lista',
    icon: TruckIcon,
    to: '/providers?new=1',
    group: 'Crear',
    keywords: ['proveedor', 'provider', 'nuevo', 'agregar'],
  },
  {
    id: 'new-product',
    label: 'Nuevo producto',
    description: 'Agregar un producto al inventario',
    icon: PackagePlus,
    to: '/products?new=1',
    group: 'Crear',
    keywords: ['producto', 'product', 'nuevo', 'inventario', 'stock'],
  },

  // Navegación
  {
    id: 'goto-dashboard',
    label: 'Dashboard',
    description: 'Ver KPIs y resumen financiero',
    icon: LayoutDashboard,
    to: '/dashboard',
    group: 'Ir a',
    keywords: ['dashboard', 'inicio', 'home', 'kpi', 'resumen'],
  },
  {
    id: 'goto-invoices',
    label: 'Facturas',
    description: 'Lista de facturas emitidas y recibidas',
    icon: FileText,
    to: '/invoices',
    group: 'Ir a',
    keywords: ['facturas', 'invoices', 'lista', 'comprobantes'],
  },
  {
    id: 'goto-clients',
    label: 'Clientes',
    description: 'Gestionar clientes',
    icon: Users,
    to: '/clients',
    group: 'Ir a',
    keywords: ['clientes', 'clients', 'lista'],
  },
  {
    id: 'goto-providers',
    label: 'Proveedores',
    description: 'Gestionar proveedores',
    icon: Truck,
    to: '/providers',
    group: 'Ir a',
    keywords: ['proveedores', 'providers', 'lista'],
  },
  {
    id: 'goto-products',
    label: 'Productos',
    description: 'Inventario y catálogo de productos',
    icon: Package,
    to: '/products',
    group: 'Ir a',
    keywords: ['productos', 'products', 'inventario', 'stock', 'catálogo'],
  },
  {
    id: 'goto-reports',
    label: 'Reportes',
    description: 'Análisis financiero y gráficos',
    icon: BarChart3,
    to: '/reports',
    group: 'Ir a',
    keywords: ['reportes', 'reports', 'análisis', 'gráficos', 'estadísticas'],
  },
  {
    id: 'goto-alerts',
    label: 'Alertas',
    description: 'Notificaciones y avisos pendientes',
    icon: Bell,
    to: '/alerts',
    group: 'Ir a',
    keywords: ['alertas', 'alerts', 'notificaciones', 'avisos'],
  },
  {
    id: 'goto-ocr',
    label: 'Escanear factura',
    description: 'Cargar factura por imagen con OCR',
    icon: Zap,
    to: '/ocr',
    group: 'Ir a',
    keywords: ['ocr', 'escanear', 'scan', 'imagen', 'foto', 'digitalizar'],
  },
  {
    id: 'goto-settings',
    label: 'Configuración',
    description: 'Ajustes de la cuenta y empresa',
    icon: Settings,
    to: '/settings',
    group: 'Ir a',
    keywords: ['configuración', 'settings', 'ajustes', 'cuenta', 'empresa'],
  },
]

// Agrupa los resultados filtrados por su campo `group`.
function groupResults(results) {
  return results.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})
}

// Filtra comandos por query — busca en label, description y keywords.
function filterCommands(query) {
  if (!query.trim()) return COMMANDS
  const q = query.toLowerCase()
  return COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const results = filterCommands(query)
  const grouped = groupResults(results)
  // Lista plana para el índice de navegación con teclado
  const flat = results

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Focus con pequeño delay para que el portal esté montado
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Resetear índice cuando cambia el query
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Scroll automático al ítem activo
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const runCommand = useCallback(
    (cmd) => {
      onClose()
      navigate(cmd.to)
    },
    [navigate, onClose]
  )

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((i) => (i + 1) % Math.max(1, flat.length))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((i) => (i - 1 + Math.max(1, flat.length)) % Math.max(1, flat.length))
          break
        case 'Enter':
          e.preventDefault()
          if (flat[activeIndex]) runCommand(flat[activeIndex])
          break
        case 'Escape':
          onClose()
          break
        default:
          break
      }
    },
    [flat, activeIndex, runCommand, onClose]
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-xl overflow-hidden bg-white"
        // Suprimir el botón X del DialogContent (no aplica en paleta)
        onInteractOutside={onClose}
      >
        {/* ── Barra de búsqueda ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar acción o página…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            aria-label="Buscar comando"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        {/* ── Lista de resultados ── */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto py-2"
          role="listbox"
          aria-label="Comandos disponibles"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  {group}
                </p>
                {items.map((cmd) => {
                  const globalIdx = flat.indexOf(cmd)
                  const isActive = globalIdx === activeIndex
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      data-active={isActive}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isActive ? 'bg-blue-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{cmd.label}</span>
                        <span className="block text-xs text-gray-400 truncate">{cmd.description}</span>
                      </span>
                      {isActive && <ArrowRight className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer con ayuda de teclado ── */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            abrir
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
            cerrar
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
            <Command className="h-3 w-3" />
            <span>Ctrl+K</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
