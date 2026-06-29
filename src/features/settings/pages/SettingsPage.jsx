import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, User, Building2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/context/AuthContext'
import { authService } from '@/features/auth/services/authService'
import { useToast } from '@/components/ui/toast'
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile'

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: profileSubmitting }, reset: resetProfile } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
    },
  })

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword } = useForm()

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
      })
    } else if (user) {
      resetProfile({
        full_name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
      })
    }
  }, [profile, user, resetProfile])

  const onProfileSubmit = async (data) => {
    await updateProfile.mutateAsync({ full_name: data.full_name })
  }

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'error' })
      return
    }
    setPasswordLoading(true)
    try {
      await authService.updatePassword(data.newPassword)
      toast({ title: 'Contraseña actualizada', variant: 'success' })
      resetPassword()
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administrá tu cuenta y preferencias</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Perfil</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="h-3.5 w-3.5 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1.5" />Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>Tu información de cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nombre completo</Label>
                  <Input {...regProfile('full_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" disabled {...regProfile('email')} />
                  <p className="text-xs text-gray-400">El email no se puede cambiar</p>
                </div>
                <Button type="submit" disabled={profileSubmitting || updateProfile.isPending}>
                  {(profileSubmitting || updateProfile.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la empresa</CardTitle>
              <CardDescription>Información fiscal y comercial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Razón social</Label>
                <Input placeholder="Mi Empresa S.A." />
              </div>
              <div className="space-y-1.5">
                <Label>CUIT</Label>
                <Input placeholder="30-12345678-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Dirección fiscal</Label>
                <Input placeholder="Av. Corrientes 1234, CABA" />
              </div>
              <div className="space-y-1.5">
                <Label>Condición IVA</Label>
                <Input placeholder="Responsable Inscripto" />
              </div>
              <Button>Guardar empresa</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>Actualizá tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nueva contraseña</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...regPassword('newPassword')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar contraseña</Label>
                  <Input type="password" placeholder="Repetí la contraseña" {...regPassword('confirmPassword')} />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Actualizar contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
