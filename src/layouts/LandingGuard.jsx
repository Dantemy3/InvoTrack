import { Outlet, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'

// Guard exclusivo para la ruta raíz (/).
// - Cargando → spinner centrado (evita parpadeo de la landing).
// - Autenticado → redirige directo al dashboard.
// - No autenticado → muestra la landing (Outlet).
export default function LandingGuard() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
