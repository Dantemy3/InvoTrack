import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCompany } from '@/features/companies/context/CompanyContext'
import { Loader2 } from 'lucide-react'

/**
 * OnboardingGuard — wraps the /onboarding route.
 *
 * Rules:
 * - Not authenticated → redirect to /login
 * - Authenticated AND already has a company → redirect to /dashboard
 * - Authenticated AND no company → render <Outlet /> (show OnboardingPage)
 */
export default function OnboardingGuard() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { company, loading: companyLoading } = useCompany()

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Solo redirigir al dashboard si tiene una empresa real (no demo)
  if (company && !company._isDemo) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
