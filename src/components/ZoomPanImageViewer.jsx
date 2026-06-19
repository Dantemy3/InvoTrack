import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MIN_SCALE = 0.5
const MAX_SCALE = 5
const ZOOM_STEP = 0.25

export default function ZoomPanImageViewer({
  src,
  alt = 'Factura',
  className,
  minHeight = 320,
}) {
  const viewportRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 })

  const clampScale = (value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const zoomIn = () => setScale((s) => clampScale(s + ZOOM_STEP))
  const zoomOut = () => setScale((s) => clampScale(s - ZOOM_STEP))

  const startDrag = useCallback((clientX, clientY) => {
    dragRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      posX: position.x,
      posY: position.y,
    }
    setDragging(true)
  }, [position.x, position.y])

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragRef.current.isDragging) return
    const { startX, startY, posX, posY } = dragRef.current
    setPosition({
      x: posX + (clientX - startX),
      y: posY + (clientY - startY),
    })
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current.isDragging = false
    setDragging(false)
  }, [])

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }

  const handleMouseMove = (e) => moveDrag(e.clientX, e.clientY)

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    startDrag(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return
    e.preventDefault()
    moveDrag(e.touches[0].clientX, e.touches[0].clientY)
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setScale((s) => clampScale(s + delta))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    resetView()
  }, [src, resetView])

  if (!src) return null

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Move className="h-3.5 w-3.5" />
          <span>Arrastrá para mover · rueda del mouse para zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Alejar">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 w-10 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Acercar">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Restablecer">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={cn(
          'relative flex-1 overflow-hidden select-none',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ minHeight }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-full max-w-full object-contain pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.05s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  )
}
