import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Truck, BarChart3,
  Bell, Settings, TrendingUp, Menu, X, LogOut, ScanLine, ChevronDown
} from 'lucide-react'
import { authService } from '@/features/auth/services/authService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useUnreadAlertsCount } from '@/features/alerts/hooks/useAlerts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Facturas' },
  { to: '/ocr', icon: ScanLine, label: 'Escanear' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/providers', icon: Truck, label: 'Proveedores' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
]

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">InvoTrack</span>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {/* Badge de alertas no leídas — Req 10.4 */}
              {to === '/alerts' && unreadCount > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* User */}
        <div className="p-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Settings className="h-4 w-4" />
            Configuración
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/alerts')}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
