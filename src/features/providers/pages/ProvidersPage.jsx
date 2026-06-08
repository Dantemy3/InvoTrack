import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Trash2, Edit, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { useProviders, useCreateProvider, useDeleteProvider } from '../hooks/useProviders'
import { getInitials } from '@/lib/utils'

// Dialog de creación de proveedor con formulario básico.
function ProviderFormDialog({ open, onClose }) {
  const createProvider = useCreateProvider()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

    // Crea el proveedor, cierra el dialog y resetea el formulario al completar.
    const onSubmit = async (data) => {
    await createProvider.mutateAsync(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Proveedor S.A." {...register('name', { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>CUIT</Label>
            <Input placeholder="20-12345678-9" {...register('cuit')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input {...register('phone')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input {...register('address')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Página de listado de proveedores con búsqueda, grilla de tarjetas y botón de creación.
export default function ProvidersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useProviders({ search })
  const deleteProvider = useDeleteProvider()
  const providers = data?.data || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.count || 0} proveedores registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo proveedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar proveedores..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay proveedores aún</p>
            <Button variant="link" onClick={() => setDialogOpen(true)}>Agregar el primero</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(provider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{provider.name}</p>
                      {provider.cuit && <p className="text-xs text-gray-400">CUIT: {provider.cuit}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteProvider.mutate(provider.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 space-y-1">
                  {provider.email && <p className="text-xs text-gray-500 truncate">{provider.email}</p>}
                  {provider.phone && <p className="text-xs text-gray-500">{provider.phone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProviderFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
