import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import LandingGuard from '@/layouts/LandingGuard'
import ProtectedLayout from '@/layouts/ProtectedLayout'
import OnboardingGuard from '@/layouts/OnboardingGuard'

// Lazy loaded pages
const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const AuthCallbackPage = lazy(() => import('@/features/auth/pages/AuthCallbackPage'))
const OnboardingPage = lazy(() => import('@/features/companies/pages/OnboardingPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const InvoicesPage = lazy(() => import('@/features/invoices/pages/InvoicesPage'))
const NewInvoicePage = lazy(() => import('@/features/invoices/pages/NewInvoicePage'))
const InvoiceDetailPage = lazy(() => import('@/features/invoices/pages/InvoiceDetailPage'))
const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage'))
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'))
const ProvidersPage = lazy(() => import('@/features/providers/pages/ProvidersPage'))
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'))
const AlertsPage = lazy(() => import('@/features/alerts/pages/AlertsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const OcrPage = lazy(() => import('@/features/ocr/pages/OcrPage'))

// Spinner de carga que se muestra mientras una página lazy se está descargando.
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
  </div>
)

// Envuelve un componente lazy en Suspense para mostrar el PageLoader mientras carga.
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    // Ruta raíz: landing para no logueados, redirige al dashboard si ya está autenticado.
    element: <LandingGuard />,
    children: [
      { path: '/', element: withSuspense(LandingPage) },
    ],
  },
  {
    // Rutas públicas de auth: redirigen al dashboard si el usuario ya está logueado.
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(LoginPage) },
      { path: '/register', element: withSuspense(RegisterPage) },
      // Callback de Supabase después de confirmar el email.
      { path: '/auth/callback', element: withSuspense(AuthCallbackPage) },
    ],
  },
  {
    // Onboarding: requires authentication but NOT a company (OnboardingGuard handles this)
    element: <OnboardingGuard />,
    children: [
      { path: '/onboarding', element: withSuspense(OnboardingPage) },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: withSuspense(DashboardPage) },
          { path: '/invoices', element: withSuspense(InvoicesPage) },
          { path: '/invoices/new', element: withSuspense(NewInvoicePage) },
          { path: '/invoices/:id', element: withSuspense(InvoiceDetailPage) },
          { path: '/invoices/:id/edit', element: withSuspense(NewInvoicePage) },
          { path: '/clients', element: withSuspense(ClientsPage) },
          { path: '/products', element: withSuspense(ProductsPage) },
          { path: '/providers', element: withSuspense(ProvidersPage) },
          { path: '/reports', element: withSuspense(ReportsPage) },
          { path: '/alerts', element: withSuspense(AlertsPage) },
          { path: '/settings', element: withSuspense(SettingsPage) },
          { path: '/ocr', element: withSuspense(OcrPage) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <p className="mt-2">Página no encontrada</p>
        <a href="/dashboard" className="mt-4 text-blue-600 hover:underline text-sm">
          Volver al dashboard
        </a>
      </div>
    ),
  },
])
