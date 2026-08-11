import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Zap, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * Bug 1 — Página de callback de confirmación de email.
 *
 * Cuando el usuario hace clic en el link del email de confirmación, Supabase
 * redirige a esta URL con un hash que contiene el token de sesión:
 *   /auth/callback#access_token=...&type=signup
 *
 * El SDK de Supabase lee ese hash automáticamente en onAuthStateChange.
 * Esta página solo espera a que la sesión se establezca y redirige al dashboard.
 *
 * Para que funcione, hay que configurar en Supabase Dashboard:
 *   Authentication → URL Configuration → Site URL = http://localhost:5173
 *   Redirect URLs: agregar http://localhost:5173/auth/callback
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // El SDK detecta el hash con el token y emite SIGNED_IN automáticamente.
    // Nos suscribimos para capturar ese evento y redirigir al onboarding.
    // El onboarding luego redirige al dashboard si ya tiene empresa.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success')
        // Redirigir al onboarding: si el usuario ya tiene empresa, OnboardingGuard
        // lo manda al dashboard automáticamente. Si no tiene, completa el onboarding.
        setTimeout(() => navigate('/onboarding', { replace: true }), 1500)
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        setStatus('success')
        setTimeout(() => navigate('/onboarding', { replace: true }), 1500)
      }
    })

    // También chequeamos si ya hay sesión activa (ej: el usuario ya confirmó antes)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setStatus('error')
        setErrorMsg('El link de confirmación es inválido o ya fue usado.')
        return
      }
      if (session) {
        setStatus('success')
        setTimeout(() => navigate('/onboarding', { replace: true }), 1500)
      }
    })

    // Timeout: si después de 8 segundos no hay sesión, mostramos error
    const timeout = setTimeout(() => {
      setStatus((prev) => {
        if (prev === 'loading') {
          setErrorMsg('El link de confirmación expiró o ya fue usado. Podés solicitar uno nuevo desde el login.')
          return 'error'
        }
        return prev
      })
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-[0_0_24px_rgba(233,106,74,0.35)]">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div className="text-left leading-tight">
              <span className="block font-display text-2xl font-bold text-gray-900 tracking-tight">InvoTrack</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-blue-400/80">control financiero</span>
            </div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-gray-100 p-8 text-center shadow-2xl shadow-black/40 scan-frame">
          {status === 'loading' && (
            <>
              <div className="relative w-fit mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-blue-500/40 blur-xl" />
                <Loader2 className="h-12 w-12 animate-spin text-blue-400 relative" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Confirmando tu cuenta...</h1>
              <p className="text-sm text-gray-500">Esperá un momento mientras verificamos tu email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative w-fit mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-xl" />
                <CheckCircle className="h-12 w-12 text-emerald-500 relative" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Email confirmado!</h1>
              <p className="text-sm text-gray-500">Tu cuenta está activa. Te redirigimos para crear tu empresa...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">No pudimos confirmar tu cuenta</h1>
              <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
              <a
                href="/login"
                className="inline-block w-full text-center bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 shadow-[0_4px_18px_rgba(233,106,74,0.28)] transition-all"
              >
                Ir al login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
