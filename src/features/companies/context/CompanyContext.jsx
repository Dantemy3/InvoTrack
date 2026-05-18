import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/context/AuthContext'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
  const { user, isAuthenticated } = useAuth()

  const [company, setCompany]     = useState(null)
  const [companies, setCompanies] = useState([])
  const [role, setRole]           = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }
    loadCompanies()
  }, [isAuthenticated, user])

  async function loadCompanies() {
    setLoading(true)
    try {
      // Fetch companies where user is owner
      const { data: owned } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)

      // Fetch companies where user has a role
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('*, companies(*)')
        .eq('user_id', user.id)

      const memberCompanies = roleRows?.map(r => r.companies).filter(Boolean) ?? []

      const allCompanies = [
        ...(owned ?? []),
        ...memberCompanies.filter(c => !owned?.find(o => o.id === c.id)),
      ]

      setCompanies(allCompanies)

      // Auto-select: persisted in localStorage or first available
      const savedId  = localStorage.getItem('invotrack_company_id')
      const selected = allCompanies.find(c => c.id === savedId) ?? allCompanies[0] ?? null
      setCompany(selected)

      // Set role for selected company
      if (selected) {
        const isOwner = selected.owner_id === user.id
        if (isOwner) {
          setRole('admin')
        } else {
          const roleRow = roleRows?.find(r => r.company_id === selected.id)
          setRole(roleRow?.role ?? 'viewer')
        }
      }
    } catch (err) {
      console.error('CompanyContext error:', err)
    } finally {
      setLoading(false)
    }
  }

  function switchCompany(companyId) {
    const found = companies.find(c => c.id === companyId)
    if (!found) return
    setCompany(found)
    localStorage.setItem('invotrack_company_id', companyId)

    // Recalculate role
    const isOwner = found.owner_id === user?.id
    if (isOwner) {
      setRole('admin')
    }
    // role from user_roles will be set on next loadCompanies if needed
  }

  const value = {
    company,       // currently selected company object
    companies,     // all accessible companies
    role,          // 'admin' | 'accountant' | 'viewer'
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
