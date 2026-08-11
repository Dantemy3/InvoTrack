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
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
    <div className="relative">
      <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
      <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(233,106,74,0.4)]" />
    </div>
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500 animate-pulse">
      inicializando tu espacio
    </span>
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
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-400 mb-3">error // señal perdida</p>
        <p className="font-display text-8xl font-bold aurora-text">404</p>
        <p className="mt-3 text-gray-400">Página no encontrada en la consola</p>
        <a
          href="/dashboard"
          className="mt-6 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-semibold shadow-[0_0_24px_rgba(233,106,74,0.3)] hover:brightness-110 transition-all"
        >
          Volver al dashboard
        </a>
      </div>
    ),
  },
])
