import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Package, Users, Truck, BarChart3,
  Bell, Settings, Menu, X, LogOut, Zap
} from 'lucide-react'
import { authService } from '@/features/auth/services/authService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useUnreadAlertsCount } from '@/features/alerts/hooks/useAlerts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Inicio',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/alerts', icon: Bell, label: 'Alertas' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/invoices', icon: FileText, label: 'Facturas' },
      { to: '/ocr', icon: Zap, label: 'Escanear' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/clients', icon: Users, label: 'Clientes' },
      { to: '/providers', icon: Truck, label: 'Proveedores' },
      { to: '/products', icon: Package, label: 'Productos' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reportes' },
    ],
  },
]

// Shell de la app autenticada con estética "control de vuelo financiero":
// sidebar de cristal, topbar con indicadores y área de contenido sobre ink espacial.
export default function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const unreadCount = useUnreadAlertsCount()

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      toast({ title: 'Error al cerrar sesión', description: err.message, variant: 'error' })
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email || 'Usuario'

  return (
    <div className="fixed inset-0 flex bg-transparent overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 glass border-r border-ink/10 flex flex-col min-h-0 overflow-hidden transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="relative flex items-center gap-3 px-5 h-16 border-b border-ink/10 flex-shrink-0">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(233,106,74,0.35)]">
            <Zap className="h-4.5 w-4.5 text-white" fill="currentColor" />
          </div>
          <div className="leading-tight">
            <span className="block font-display font-bold text-gray-900 text-base tracking-tight">InvoTrack</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-blue-400/80">control financiero</span>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0">
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-600">{group.label}</p>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-ink/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-blue-400 to-violet-500 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                        )}
                      />
                      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700')} />
                      {label}
                      {to === '/alerts' && unreadCount > 0 && (
                        <span className="ml-auto h-5 min-w-5 px-1 rounded-full bg-gradient-to-r from-red-500 to-red-400 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(229,72,77,0.5)]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-ink/10">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2',
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-ink/5 hover:text-gray-900'
              )
            }
          >
            <Settings className="h-4 w-4" />
            Configuración
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink/[0.05] ring-1 ring-inset ring-ink/10">
            <Avatar className="h-8 w-8 ring-2 ring-blue-500/40">
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/25 to-violet-500/25 text-cyan-300">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{displayName}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Topbar */}
        <header className="relative h-16 glass border-b border-ink/10 flex items-center px-4 gap-4 flex-shrink-0 z-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <button
            className="lg:hidden text-gray-400 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Indicadores de estado */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30 text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ARCA sincronizado
            </span>
          </div>

          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-cyan-300" onClick={() => navigate('/alerts')}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-gradient-to-r from-red-500 to-red-400 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(229,72,77,0.6)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-blue-500/40">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/25 to-violet-500/25 text-cyan-300">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-none grid-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
