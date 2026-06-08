import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { Loader2 } from 'lucide-react'

// Guard para rutas privadas. Redirige al login si no está autenticado,
// al onboarding si no tiene empresa, o renderiza las páginas protegidas.
export default function ProtectedLayout() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { company, loading: companyLoading } = useCompany()

  // Mostrar spinner mientras se resuelve la sesión o las empresas
  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // No autenticado → ir al login
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Autenticado pero sin empresa real → ir al onboarding
  // NOTA: si company es null o es la empresa demo (_isDemo=true), redirigir.
  // El modo demo solo sirve para navegar si el usuario YA tiene empresa.
  if (!company || company._isDemo) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
