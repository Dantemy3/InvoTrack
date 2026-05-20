import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { companyService } from '@/features/companies/services/companyService'
import { useAuth } from '@/features/auth/context/AuthContext'

const CompanyContext = createContext(null)

const STORAGE_KEY = 'invotrack_company_id'

export function CompanyProvider({ children }) {
  const { user, isAuthenticated } = useAuth()

  const [company, setCompany]     = useState(null)
  const [companies, setCompanies] = useState([])
  const [role, setRole]           = useState(null)
  const [loading, setLoading]     = useState(true)

  /**
   * Load all companies accessible to the current user via companyService.
   * companyService.getAll() returns companies with a `role` field already resolved:
   *   - 'admin' for owned companies (owner_id === userId)
   *   - the user_roles.role value for member companies
   */
  const loadCompanies = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const allCompanies = await companyService.getAll(user.id)
      setCompanies(allCompanies)

      // Auto-select: restore from localStorage or fall back to first available
      const savedId  = localStorage.getItem(STORAGE_KEY)
      const selected = allCompanies.find((c) => c.id === savedId) ?? allCompanies[0] ?? null

      setCompany(selected)
      setRole(selected?.role ?? null)

      // Persist the resolved selection
      if (selected) {
        localStorage.setItem(STORAGE_KEY, selected.id)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('CompanyContext: error loading companies', err)
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

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
