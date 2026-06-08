import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { Loader2 } from 'lucide-react'

// Guard para rutas privadas. Redirige al login si no está autenticado,
// al onboarding si no tiene empresa, o renderiza las páginas protegidas.
export default function ProtectedLayout() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { company, loading: companyLoading } = useCompany()

  // Show loading spinner while auth or company state is resolving
  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Not authenticated → go to login
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Authenticated but no company → go to onboarding
  // (si la empresa es demo, _isDemo=true, no redirigir)
  if (!company) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
