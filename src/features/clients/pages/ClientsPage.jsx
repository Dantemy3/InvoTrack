import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Trash2, Edit, User } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema } from '../schemas/clientSchemas'
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients'
import { getInitials } from '@/lib/utils'
import { TAX_CONDITIONS } from '@/lib/constants'

// Dialogo de creación de cliente con formulario validado por Zod.
function ClientFormDialog({ open, onClose }) {
  const createClient = useCreateClient()
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(clientSchema),
  })

    // Crea el cliente, cierra el dialog y resetea el formulario al completar.
    const onSubmit = async (data) => {
    await createClient.mutateAsync(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Empresa S.A." {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>CUIT</Label>
            <Input placeholder="20-12345678-9" {...register('cuit')} />
            {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="contacto@empresa.com" {...register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="+54 11 1234-5678" {...register('phone')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Condición fiscal</Label>
            <Controller
              name="tax_condition"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TAX_CONDITIONS).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input placeholder="Av. Corrientes 1234, CABA" {...register('address')} />
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

// Página de listado de clientes con búsqueda, grilla de tarjetas y botón de creación.
export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useClients({ search })
  const deleteClient = useDeleteClient()
  const clients = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-400/80">// clientes</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.count || 0} clientes registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay clientes aún</p>
            <Button variant="link" onClick={() => setDialogOpen(true)}>Agregar el primero</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                      {client.cuit && <p className="text-xs text-gray-400">CUIT: {client.cuit}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteClient.mutate(client.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 space-y-1">
                  {client.email && <p className="text-xs text-gray-500 truncate">{client.email}</p>}
                  {client.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
                  {client.tax_condition && (
                    <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {client.tax_condition}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
