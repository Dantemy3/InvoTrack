import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

// DEV BYPASS: set to true to skip login during development
const DEV_BYPASS_AUTH = true
const DEV_MOCK_USER = { id: 'dev-user', email: 'dev@localhost' }

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(DEV_BYPASS_AUTH ? DEV_MOCK_USER : null)
  const [session, setSession] = useState(DEV_BYPASS_AUTH ? { user: DEV_MOCK_USER } : null)
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH)

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
