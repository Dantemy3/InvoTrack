import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────────────────────────────────────────
// FLUJO AUTH — paso 3 de 3
// ──────────────────────────────────────────────────────────────────────────────
// AuthContext es el estado global de autenticación de toda la app.
//
// Responsabilidades:
//  1. Al montar: obtener la sesión activa con supabase.auth.getSession()
//     (sesión persistida en localStorage por el SDK de Supabase).
//  2. Suscribirse a onAuthStateChange: cada vez que el usuario hace login,
//     logout, o Supabase refresca el JWT automáticamente, este callback
//     actualiza user y session en el estado de React.
//  3. Exponer { user, session, loading, isAuthenticated } a toda la app
//     via el hook useAuth().
//
// Flujo de login:
//  LoginPage → authService.signIn() → Supabase emite evento SIGNED_IN
//  → onAuthStateChange recibe la sesión → setUser(session.user)
//  → todos los componentes que usen useAuth() se re-renderizan con el usuario.
//
// Flujo de registro:
//  RegisterPage → authService.signUp() → Supabase crea el usuario
//  → si hay confirmación de email: el usuario confirma y luego hace login
//  → si no: Supabase emite SIGNED_IN directamente y AuthContext lo captura.
// ──────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// Provider de autenticación. Obtiene la sesión inicial de Supabase y se suscribe
// a cambios de estado (login, logout, refresh de token). Expone user, session,
// loading e isAuthenticated a todos los componentes hijos.
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  // loading = true mientras no sabemos si hay sesión activa.
  // Evita mostrar la pantalla de login por un flash cuando el usuario ya está autenticado.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Paso 3a — Obtener la sesión persistida
    // El SDK de Supabase guarda la sesión en localStorage al hacer login.
    // Al recargar la página, getSession() la recupera sin pedir login de nuevo.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Paso 3b — Escuchar cambios de sesión en tiempo real
    // onAuthStateChange se dispara ante: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
    // USER_UPDATED, PASSWORD_RECOVERY. Cubre todos los casos de autenticación.
    // Esto es lo que hace que la app "sepa" que el usuario se logueó, sin que la
    // página de login tenga que actualizar el estado global manualmente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Limpiar la suscripción cuando el componente se desmonta para evitar memory leaks.
    return () => subscription.unsubscribe()
  }, [])

  // Paso 3c — Valores expuestos via useAuth()
  // isAuthenticated: shortcut booleano para los guards de rutas privadas.
  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para acceder al contexto de autenticación desde cualquier componente.
// Lanza error si se usa fuera de AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
