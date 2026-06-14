import { Link } from 'react-router-dom'
import { TrendingUp, FileText, ScanLine, BarChart3, Bell, Shield, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Tarjeta de feature para la sección de características.
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

// Página de landing pública. Se muestra cuando el usuario no está logueado.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* ── Navbar ── */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">InvoTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link to="/register">
              <Button>Registrarse gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
          Gestión de facturas para PyMEs argentinas
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Controlá tus facturas y <span className="text-blue-600">flujo de caja</span> en un solo lugar
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Cargá facturas manualmente o escaneándolas con IA, seguí cobros y pagos,
          recibí alertas de vencimientos y exportá reportes. Todo pensado para la realidad argentina.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Todo lo que necesitás para gestionar tu facturación
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={FileText}
            title="Facturas A, B, C y más"
            description="Cargá todos los tipos de comprobantes AFIP con campos fiscales completos: CUIT, CAE, alícuotas de IVA y condiciones de pago."
          />
          <FeatureCard
            icon={ScanLine}
            title="Escaneo OCR con IA"
            description="Subí una foto o PDF de tu factura y la IA extrae los datos automáticamente. Revisá y guardá en segundos."
          />
          <FeatureCard
            icon={BarChart3}
            title="Reportes y gráficos"
            description="Visualizá ingresos vs gastos mes a mes, exportá a CSV y analizá el rendimiento de tu negocio."
          />
          <FeatureCard
            icon={Bell}
            title="Alertas de vencimiento"
            description="Recibí notificaciones antes de que venzan tus facturas para nunca perder un cobro ni incurrir en mora."
          />
          <FeatureCard
            icon={TrendingUp}
            title="Dashboard financiero"
            description="Un resumen claro del mes: total facturado, cobrado, gastos y resultado neto — todo en una sola pantalla."
          />
          <FeatureCard
            icon={Shield}
            title="Seguro y multi-empresa"
            description="Tus datos están protegidos con autenticación Supabase. Podés gestionar múltiples empresas desde una sola cuenta."
          />
        </div>
      </section>

      {/* ── Social proof / checklist ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Diseñado para la realidad argentina
            </h2>
            <ul className="space-y-3">
              {[
                'Validación de CUIT con dígito verificador',
                'Tipos de comprobante AFIP (Factura A, B, C, M, Notas)',
                'Validación de CAE y vencimiento',
                'Alícuotas IVA: 0%, 10.5%, 21%, 27%',
                'Soporte para ARS, USD y EUR',
                'Pagos parciales con historial de cobros',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              Creá tu cuenta gratis y empezá a gestionar tus facturas hoy mismo.
            </p>
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Crear cuenta gratis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} InvoTrack — Gestión de facturas para PyMEs
      </footer>

    </div>
  )
}
