import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

// Layout de rutas públicas (login, register). Si el usuario ya está autenticado
// lo redirige al dashboard.
export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
