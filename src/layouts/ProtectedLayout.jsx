import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}
