import { useEffect, useRef, useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { searchDemoCatalogItems } from '../data/demoCatalogItems'

export default function ItemSearchInput({
  value,
  onChange,
  onBlur,
  onSelectItem,
  placeholder = 'Buscar ítem...',
  error,
  products,
}) {
  const containerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const query = value ?? ''

  const suggestions = useMemo(() => {
    if (products) {
      const normalized = query.trim().toLowerCase()
      if (!normalized) return products
      return products.filter((p) => p.name.toLowerCase().includes(normalized))
    }
    return searchDemoCatalogItems(query)
  }, [products, query])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const normalizeItem = (item) => ({
    descripcion: item.descripcion ?? item.name ?? '',
    unidad: item.unidad ?? item.unit ?? '',
    precio_unitario: item.precio_unitario ?? item.price ?? 0,
    alicuota_iva: item.alicuota_iva ?? 21,
  })

  const handleSelect = (item) => {
    onSelectItem(normalizeItem(item))
    setOpen(false)
  }

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      handleSelect(suggestions[highlightIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showSuggestions = open && suggestions.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          placeholder={placeholder}
          className="pl-8"
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>

      {showSuggestions && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === highlightIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                  index === highlightIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(item)}
              >
                <span className="font-medium">{item.descripcion ?? item.name}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {item.unidad ?? item.unit} · {formatCurrency(item.precio_unitario ?? item.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
