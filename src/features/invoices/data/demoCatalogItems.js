// Catálogo demo de ítems para autocompletar en el formulario de factura.
export const DEMO_CATALOG_ITEMS = [
  {
    id: 'motor',
    descripcion: 'Motor',
    unidad: 'un',
    precio_unitario: 185000,
    alicuota_iva: 21,
  },
]

export function searchDemoCatalogItems(query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return DEMO_CATALOG_ITEMS

  return DEMO_CATALOG_ITEMS.filter((item) =>
    item.descripcion.toLowerCase().includes(normalized)
  )
}
