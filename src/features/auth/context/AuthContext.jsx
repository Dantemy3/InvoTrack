import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Usuario demo hardcodeado para pruebas — sin Supabase
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@invotrack.com',
  user_metadata: {
    full_name: 'Demo User',
  },
}

export function AuthProvider({ children }) {
  const [user] = useState(DEMO_USER)
  const [session] = useState({ user: DEMO_USER })

  const value = {
    user,
    session,
    loading: false,
    isAuthenticated: true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
