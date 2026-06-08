import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { companyService } from '@/features/companies/services/companyService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { DEMO_COMPANY } from '@/lib/demoData'

const CompanyContext = createContext(null)

const STORAGE_KEY = 'invotrack_company_id'

// Provider de empresa activa. Carga todas las empresas del usuario, selecciona
// la activa (persistida en localStorage) y expone helpers de rol y switchCompany.
// En modo demo (sin empresa en Supabase) usa DEMO_COMPANY para no bloquear al usuario.
export function CompanyProvider({ children }) {
  const { user, isAuthenticated } = useAuth()

  const [company, setCompany]     = useState(null)
  const [companies, setCompanies] = useState([])
  const [role, setRole]           = useState(null)
  const [loading, setLoading]     = useState(true)

  const loadCompanies = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const allCompanies = await companyService.getAll(user.id)

      // ── MODO DEMO ──────────────────────────────────────────────────────────
      // Si el usuario no tiene empresas en Supabase, usar la empresa demo
      // para poder visualizar el dashboard sin pasar por el onboarding.
      if (allCompanies.length === 0) {
        const demoCompany = { ...DEMO_COMPANY, _isDemo: true }
        setCompanies([demoCompany])
        setCompany(demoCompany)
        setRole('admin')
        setLoading(false)
        return
      }
      // ── FIN MODO DEMO ──────────────────────────────────────────────────────

      setCompanies(allCompanies)

      const savedId  = localStorage.getItem(STORAGE_KEY)
      const selected = allCompanies.find((c) => c.id === savedId) ?? allCompanies[0] ?? null

      setCompany(selected)
      setRole(selected?.role ?? null)

      if (selected) {
        localStorage.setItem(STORAGE_KEY, selected.id)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('CompanyContext: error loading companies', err)
      // En caso de error de red, también usar demo para no bloquear al usuario
      const demoCompany = { ...DEMO_COMPANY, _isDemo: true }
      setCompanies([demoCompany])
      setCompany(demoCompany)
      setRole('admin')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear state when user logs out
      setCompany(null)
      setCompanies([])
      setRole(null)
      setLoading(false)
      return
    }
    loadCompanies()
  }, [isAuthenticated, user, loadCompanies])

  /**
   * Switch the active company.
   * Persists the selection to localStorage and updates the role immediately
   * using the role already embedded in the companies list (no extra network call).
   *
   * @param {string} companyId - UUID of the company to activate
   */
  function switchCompany(companyId) {
    const found = companies.find((c) => c.id === companyId)
    if (!found) return

    setCompany(found)
    setRole(found.role ?? null)
    localStorage.setItem(STORAGE_KEY, companyId)
  }

  const value = {
    company,          // currently active company object (includes `role` field)
    companies,        // all accessible companies for the user
    role,             // 'admin' | 'accountant' | 'viewer' | null
    loading,
    switchCompany,
    refetch: loadCompanies,
    isAdmin:      role === 'admin',
    isAccountant: role === 'accountant',
    canWrite:     role === 'admin' || role === 'accountant',
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// Hook para acceder al contexto de empresa desde cualquier componente.
// Lanza error si se usa fuera de CompanyProvider.
export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
