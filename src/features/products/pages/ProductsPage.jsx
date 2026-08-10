import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, Trash2, Edit, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { productSchema } from '../schemas/productSchemas'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { formatCurrency } from '@/lib/utils'

function ProductFormDialog({ open, onClose, product = null }) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { data: providersData } = useProviders()
  const providers = providersData?.data || []
  const isEdit = !!product

  const defaultValues = useMemo(() =>
    product
      ? { name: product.name, description: product.description || '', price: String(product.price), unit: product.unit || 'un', stock: String(product.stock ?? 0), provider_id: product.provider_id || '' }
      : { name: '', description: '', price: '', unit: 'un', stock: '', provider_id: '' },
  [product])

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const onSubmit = async (data) => {
    const payload = { ...data, provider_id: data.provider_id || null }
    if (isEdit) {
      await updateProduct.mutateAsync({ id: product.id, ...payload })
    } else {
      await createProduct.mutateAsync(payload)
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Ej: Motor eléctrico" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input placeholder="Descripción opcional del producto" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio unitario *</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Input placeholder="un, kg, hs, m" {...register('unit')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stock inicial</Label>
            <Input type="number" step="1" min="0" placeholder="0" {...register('stock')} />
            {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Controller
              name="provider_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-gray-400">A quién le comprás este producto.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isEdit ? 'Actualizar' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const { data, isLoading } = useProducts({ search })
  const deleteProduct = useDeleteProduct()
  const products = data?.data || []

  const handleEdit = (product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingProduct(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.count || 0} productos registrados</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo producto
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar productos..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay productos aún</p>
            <Button variant="link" onClick={() => setDialogOpen(true)}>Agregar el primero</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{product.description}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteProduct.mutate(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-gray-400">/ {product.unit || 'un'}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Stock:</span>
                  <span className={`text-xs font-medium ${Number(product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(product.stock ?? 0).toFixed(2)}
                  </span>
                </div>
                {product.provider?.name && (
                  <p className="mt-1 text-xs text-gray-400">Proveedor: {product.provider.name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductFormDialog open={dialogOpen} onClose={handleDialogClose} product={editingProduct} />
    </div>
  )
}
