import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

// ── Íconos inline simples ─────────────────────────────────────────────────────
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
)
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#BA7517"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
)

// ── Componente principal ──────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="lp-root">

      {/* NAV */}
      <nav className="lp-nav">
        <a href="/" className="lp-nav-logo">
          <div className="lp-logo-mark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="white" strokeWidth="1.4"/>
              <path d="M5 6h8M5 9h6M5 12h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="14" cy="4" r="3" fill="#1D9E75"/>
              <path d="M12.7 4l.9.9 1.5-1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="lp-logo-text">InvoTrack</span>
        </a>
        <ul className="lp-nav-links">
          <li><a href="#features">Funcionalidades</a></li>
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#precios">Precios</a></li>
          <li>
            <button className="lp-nav-cta" onClick={() => navigate('/register')}>
              Empezar gratis
            </button>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <span className="lp-dot" />
            OCR con IA — Facturas en segundos
          </div>
          <h1 className="lp-hero-title">
            Controlá tus facturas sin <em>perder tiempo</em>
          </h1>
          <p className="lp-hero-sub">
            Escaneá, registrá y organizá todas las facturas de tu negocio desde el celular. InvoTrack extrae los datos automáticamente y lleva el control por vos.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>
              <IconPlay /> Probar gratis
            </button>
            <a href="#como-funciona" className="lp-btn-secondary">
              Ver cómo funciona
            </a>
          </div>
          <div className="lp-hero-proof">
            <div className="lp-avatars">
              <div className="lp-avatar" style={{ background: '#185FA5' }}>DM</div>
              <div className="lp-avatar" style={{ background: '#1D9E75' }}>CP</div>
              <div className="lp-avatar" style={{ background: '#993C1D' }}>RP</div>
            </div>
            <p className="lp-proof-text"><strong>PyMEs argentinas</strong> ya usan InvoTrack</p>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-invoice-card">
            <div className="lp-scan-overlay" />
            <div className="lp-invoice-header">
              <span className="lp-invoice-type">FACTURA A</span>
              <span className="lp-invoice-num">0003-00004521</span>
            </div>
            <p className="lp-invoice-company">Tech Solutions S.A.</p>
            <p className="lp-invoice-cuit">CUIT: 30-71234567-8 · Resp. Inscripto</p>
            <hr className="lp-invoice-divider" />
            <div className="lp-invoice-row"><span>Consultoría IT (10 hs)</span><span>$125.000</span></div>
            <div className="lp-invoice-row"><span>Licencia software anual</span><span>$90.000</span></div>
            <hr className="lp-invoice-divider" />
            <div className="lp-invoice-row"><span>Neto gravado</span><span>$215.000</span></div>
            <div className="lp-invoice-row"><span>IVA 21%</span><span>$45.150</span></div>
            <div className="lp-invoice-row lp-invoice-total"><span>Total</span><span>$260.150</span></div>
            <hr className="lp-invoice-divider" />
            <div className="lp-invoice-row">
              <span style={{ fontSize: '10px', color: '#888780' }}>CAE: 74123456789012 · Venc: 22/06/2025</span>
            </div>
          </div>
          <div className="lp-extracted-badge">
            <div className="lp-check-icon">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>
            </div>
            <p>Datos extraídos</p>
            <div className="lp-extracted-row"><span>Emisor</span><span>Detectado ✓</span></div>
            <div className="lp-extracted-row"><span>Monto</span><span>$260.150 ✓</span></div>
            <div className="lp-extracted-row"><span>CAE</span><span>Válido ✓</span></div>
            <div className="lp-extracted-row"><span>IVA 21%</span><span>$45.150 ✓</span></div>
          </div>
        </div>
      </section>

      {/* LOGOS BAR */}
      <div className="lp-logos-bar">
        <p>Integrado con los sistemas que ya usás</p>
        <div className="lp-logos-row">
          {['AFIP / ARCA', 'Google Doc AI', 'GPT-4 Vision', 'Supabase', 'Resend'].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="lp-section">
        <p className="lp-section-label">Funcionalidades</p>
        <h2 className="lp-section-title">Todo lo que necesitás, nada de lo que no</h2>
        <p className="lp-section-sub">Diseñado para comercios y PyMEs que necesitan control financiero sin complejidad contable.</p>
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: f.iconBg }}>
                <f.Icon color={f.iconColor} />
              </div>
              <p className="lp-feature-title">{f.title}</p>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="lp-how-section">
        <div className="lp-how-inner">
          <p className="lp-section-label" style={{ color: '#B5D4F4' }}>Cómo funciona</p>
          <h2 className="lp-section-title" style={{ color: 'white' }}>Tres pasos. Sin complicaciones.</h2>
          <p className="lp-section-sub" style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '3rem' }}>
            Sin conocimientos contables. Sin configuración compleja. Empezás en minutos.
          </p>
          <div className="lp-steps-row">
            {STEPS.map((step, i) => (
              <div key={step.title} className="lp-step">
                <div className={`lp-step-num${i === 0 ? ' lp-step-num-active' : ''}`}>{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="lp-metrics-section">
        <div className="lp-metrics-inner">
          {METRICS.map((m) => (
            <div key={m.label} className="lp-metric">
              <p className="lp-metric-val">{m.val}</p>
              <p className="lp-metric-label">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="lp-testimonial-section">
        <div className="lp-stars">
          {[...Array(5)].map((_, i) => <IconStar key={i} />)}
        </div>
        <p className="lp-testimonial-quote">
          "Nos ahorraría muchísimo tiempo operativo. La persona que ingresa facturas tarda una semana entera. Esto cambiaría todo."
        </p>
        <div className="lp-testimonial-author">
          <div className="lp-author-avatar">RP</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#042C53' }}>Roberto P.</p>
            <p style={{ fontSize: 13, color: '#888780' }}>Empresa de repuestos Iveco, Buenos Aires</p>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="lp-roles-section">
        <div className="lp-roles-inner">
          <div>
            <p className="lp-section-label">Control por roles</p>
            <h2 className="lp-section-title">Cada persona hace lo suyo</h2>
            <p className="lp-section-sub">Un sistema de permisos pensado para negocios reales.</p>
            <div className="lp-roles-list">
              {ROLES.map((r) => (
                <div key={r.name} className="lp-role-item">
                  <div className="lp-role-dot" style={{ background: r.color }} />
                  <div>
                    <p className="lp-role-name">{r.name}</p>
                    <p className="lp-role-desc">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-roles-visual">
            <div className="lp-roles-vis-header">
              <div className="lp-vis-dots">
                <div className="lp-vis-dot" style={{ background: '#E24B4A' }} />
                <div className="lp-vis-dot" style={{ background: '#EF9F27' }} />
                <div className="lp-vis-dot" style={{ background: '#1D9E75' }} />
              </div>
              <span className="lp-vis-title">Gestión de usuarios — Empresa</span>
            </div>
            <div className="lp-roles-vis-body">
              {ROLE_USERS.map((u) => (
                <div key={u.name} className="lp-role-row">
                  <div className="lp-role-user">
                    <div className="lp-role-user-avatar" style={{ background: u.color }}>{u.initials}</div>
                    <div>
                      <p className="lp-role-user-name">{u.name}</p>
                      <p className="lp-role-user-email">{u.email}</p>
                    </div>
                  </div>
                  <span className="lp-role-badge" style={{ background: u.badgeBg, color: u.badgeColor }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="lp-section">
        <p className="lp-section-label">Precios</p>
        <h2 className="lp-section-title">Simple, predecible, sin sorpresas</h2>
        <p className="lp-section-sub">Empezá gratis y escalá cuando tu negocio lo necesite.</p>
        <div className="lp-pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`lp-pricing-card${plan.featured ? ' lp-featured' : ''}`}>
              {plan.featured && <div className="lp-featured-tag">Más popular</div>}
              <p className="lp-plan-name">{plan.name}</p>
              <p className="lp-plan-price">{plan.price} <span>/ mes</span></p>
              <p className="lp-plan-desc">{plan.desc}</p>
              <ul className="lp-plan-features">
                {plan.features.map((f) => (
                  <li key={f}><IconCheck /> {f}</li>
                ))}
              </ul>
              <button
                className={`lp-plan-btn ${plan.featured ? 'lp-plan-btn-solid' : 'lp-plan-btn-outline'}`}
                onClick={() => plan.href ? window.location.href = plan.href : navigate('/register')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta-section">
        <p className="lp-section-label" style={{ color: '#B5D4F4' }}>Empezá hoy</p>
        <h2 className="lp-cta-title">Escaneá. Registrá. Controlá.</h2>
        <p className="lp-cta-sub">Registrate gratis y en minutos tenés tu primera factura cargada. Sin tarjeta de crédito.</p>
        <div className="lp-cta-actions">
          <button className="lp-btn-white" onClick={() => navigate('/register')}>
            <IconPlay /> Crear cuenta gratis
          </button>
          <a href="mailto:hola@invotrack.app" className="lp-btn-ghost-white">
            Contactar al equipo →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span className="lp-footer-brand">InvoTrack</span>
        <span className="lp-footer-copy">© 2025 InvoTrack · Hecho en Argentina 🇦🇷</span>
        <div className="lp-footer-links">
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="mailto:hola@invotrack.app">Contacto</a>
        </div>
      </footer>

    </div>
  )
}

// ── Datos ─────────────────────────────────────────────────────────────────────

const ScanIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h6M7 16h4"/><path d="M18 3l3 3-3 3"/>
  </svg>
)
const DashIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 21V9"/>
  </svg>
)
const BellIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const UsersIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const PaymentIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ExportIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
  </svg>
)

const FEATURES = [
  { title: 'Escaneo OCR con IA', desc: 'Sacás foto y la app extrae emisor, receptor, CUIT, montos, IVA y CAE. Compatible con PDF, JPG y PNG.', iconBg: '#E1F5EE', iconColor: '#0F6E56', Icon: ScanIcon },
  { title: 'Dashboard financiero', desc: 'Resultado neto, dinero cobrado, gastos del mes y evolución de ingresos en un panel actualizado en tiempo real.', iconBg: '#E6F1FB', iconColor: '#185FA5', Icon: DashIcon },
  { title: 'Alertas de vencimiento', desc: 'Te avisamos antes de que venza una factura para que nunca pierdas un cobro ni una deuda. Notificaciones por email.', iconBg: '#FAECE7', iconColor: '#993C1D', Icon: BellIcon },
  { title: 'Gestión de roles', desc: 'Administrador, contador y visualizador. Cada usuario ve y hace solo lo que le corresponde.', iconBg: '#EEEDFE', iconColor: '#534AB7', Icon: UsersIcon },
  { title: 'Pagos parciales', desc: 'Registrá pagos en cuotas. El estado de la factura se actualiza automáticamente según lo cobrado.', iconBg: '#FAEEDA', iconColor: '#BA7517', Icon: PaymentIcon },
  { title: 'Exportación a CSV', desc: 'Descargá reportes de ingresos y gastos por período para compartir con tu contador sin intermediarios.', iconBg: '#EAF3DE', iconColor: '#3B6D11', Icon: ExportIcon },
]

const STEPS = [
  { title: 'Escaneá la factura', desc: 'Subís una foto o PDF. El OCR con IA lee todos los campos: CUIT, montos, IVA, CAE y vencimiento.' },
  { title: 'Revisás y guardás', desc: 'Los datos aparecen pre-completados con indicadores de confianza. Corregís lo que necesites y guardás en un click.' },
  { title: 'Controlás tus finanzas', desc: 'El dashboard te muestra qué cobrar, qué pagar, alertas de vencimiento y el resultado del mes.' },
]

const METRICS = [
  { val: '60%', label: 'Menos tiempo cargando facturas manualmente' },
  { val: '11', label: 'Tipos de comprobante AFIP soportados' },
  { val: '0', label: 'Conocimientos contables necesarios para empezar' },
  { val: 'ARS / USD / EUR', label: 'Multi-moneda con tipo de cambio' },
]

const ROLES = [
  { name: 'Administrador', desc: 'Acceso total: facturas, usuarios, reportes y configuración.', color: '#185FA5' },
  { name: 'Contador', desc: 'Puede cargar y editar facturas, registrar pagos y exportar datos.', color: '#0F6E56' },
  { name: 'Visualizador', desc: 'Solo lectura. Consulta facturas y reportes sin modificar nada.', color: '#888780' },
]

const ROLE_USERS = [
  { name: 'Dante Martínez', email: 'dante@empresa.com', initials: 'DM', color: '#185FA5', role: 'Admin', badgeBg: '#E6F1FB', badgeColor: '#0C447C' },
  { name: 'Ciro Perazzo', email: 'ciro@empresa.com', initials: 'CP', color: '#0F6E56', role: 'Contador', badgeBg: '#E1F5EE', badgeColor: '#085041' },
  { name: 'María González', email: 'maria@empresa.com', initials: 'MG', color: '#888780', role: 'Visualizador', badgeBg: '#F1EFE8', badgeColor: '#444441' },
]

const PLANS = [
  {
    name: 'Gratuito', price: '$0', desc: 'Para probar InvoTrack sin compromiso.',
    features: ['Hasta 20 facturas por mes', '1 empresa', 'OCR con modo mock', 'Dashboard básico'],
    cta: 'Empezar gratis', featured: false,
  },
  {
    name: 'PyME', price: '$9.990', desc: 'Para negocios que procesan facturas todos los días.',
    features: ['Facturas ilimitadas', 'OCR real con GPT-4 Vision', 'Alertas de vencimiento por email', 'Hasta 5 usuarios', 'Exportación CSV + reportes', 'Validación CAE con AFIP'],
    cta: 'Probar 14 días gratis', featured: true,
  },
  {
    name: 'Empresa', price: 'A medida', desc: 'Para operaciones con alto volumen o múltiples sucursales.',
    features: ['Multi-empresa sin límite', 'Usuarios ilimitados', 'Google Document AI', 'SLA y soporte prioritario', 'API REST para integraciones'],
    cta: 'Hablar con el equipo', featured: false, href: 'mailto:hola@invotrack.app',
  },
]