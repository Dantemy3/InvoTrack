import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { companyService } from '@/features/companies/services/companyService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { DEMO_COMPANY } from '@/lib/demoData'

const CompanyContext = createContext(null)

const STORAGE_KEY = 'invotrack_company_id'

// Provider de empresa activa. Carga todas las empresas del usuario, selecciona
// la activa (persistida en localStorage) y expone helpers de rol y switchCompany.
export function CompanyProvider({ children }) {
  const { user, isAuthenticated } = useAuth()

  const [company, setCompany]     = useState(null)
  const [companies, setCompanies] = useState([])
  const [role, setRole]           = useState(null)
  const [loading, setLoading]     = useState(true)

  // Guardamos el userId en un ref para compararlo en el efecto.
  // Así evitamos re-ejecutar loadCompanies cuando Supabase refresca el token
  // y AuthContext re-crea el objeto `user` con la misma id pero distinta referencia,
  // lo cual causaba el "refresco" de página al volver de otra pestaña.
  const loadedForUserId = useRef(null)

  const loadCompanies = useCallback(async (userId, forceReload = false) => {
    if (!userId) return

    // Si ya cargamos para este usuario y no es un reload forzado (ej: después del onboarding),
    // no mostrar el spinner de carga de nuevo — evita el flash/refresco visual.
    const isFirstLoad = loadedForUserId.current !== userId
    if (isFirstLoad || forceReload) {
      setLoading(true)
    }

    try {
      const allCompanies = await companyService.getAll(userId)
      loadedForUserId.current = userId

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
      loadedForUserId.current = userId
      setCompanies([])
      setCompany(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Limpiar estado al cerrar sesión
      setCompany(null)
      setCompanies([])
      setRole(null)
      setLoading(false)
      loadedForUserId.current = null
      return
    }
    // Pasamos solo el id (string) para evitar dependencia del objeto user completo
    loadCompanies(user.id)
  }, [isAuthenticated, user?.id, loadCompanies])

  function switchCompany(companyId) {
    const found = companies.find((c) => c.id === companyId)
    if (!found) return

    setCompany(found)
    setRole(found.role ?? null)
    localStorage.setItem(STORAGE_KEY, companyId)
  }

  const value = {
    company,
    companies,
    role,
    loading,
    switchCompany,
    // refetch forzado: se usa después del onboarding para cargar la empresa recién creada
    refetch: () => user?.id ? loadCompanies(user.id, true) : Promise.resolve(),
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
