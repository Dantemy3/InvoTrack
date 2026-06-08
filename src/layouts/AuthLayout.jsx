import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

// Layout de rutas públicas (login, register, auth/callback).
// Si el usuario ya está autenticado lo redirige al dashboard,
// excepto en /auth/callback donde Supabase procesa el token de confirmación.
export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return null

  // Bug 1 — No redirigir en /auth/callback, Supabase necesita procesar el hash
  if (isAuthenticated && pathname !== '/auth/callback') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
