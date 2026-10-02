import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  COMPANY_TAX_CONDITIONS,
  PERSONA_HUMANA_TAX_CONDITIONS,
  PROVINCIAS,
} from '@/features/companies/schemas/companySchemas'

const SELECT_CLASS =
  'flex h-9 w-full rounded-lg border border-gray-200 bg-gray-100/60 px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent'

function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

/**
 * Ficha fiscal de la empresa. Es presentacional: recibe los bindings de
 * react-hook-form del padre, así la usan tanto el onboarding como
 * Configuración → Empresa y registro sin duplicar los campos.
 *
 * @param {object} props
 * @param {Function} props.register — `register` de react-hook-form
 * @param {object}   props.errors  — `formState.errors`
 * @param {string}   props.entityType — 'empresa' | 'persona_humana'
 * @param {string}   props.namePrefix — ruta del objeto fiscal en formularios anidados
 */
export default function CompanyProfileForm({ register, errors = {}, entityType = 'empresa', namePrefix = '' }) {
  const esEmpresa = entityType === 'empresa'
  const condiciones = esEmpresa ? COMPANY_TAX_CONDITIONS : PERSONA_HUMANA_TAX_CONDITIONS
  const field = (name) => namePrefix ? `${namePrefix}.${name}` : name

  return (
    <div className="space-y-6">

      {/* ── Identificación ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={esEmpresa ? 'Razón social' : 'Nombre y apellido'}
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input
            placeholder={esEmpresa ? 'Mi Empresa S.A.' : 'Juan Pérez'}
            {...register(field('name'))}
          />
        </Field>

        <Field
          label="CUIT"
          required
          error={errors.cuit?.message}
          hint="Es el que va a figurar como emisor en tus facturas."
        >
          <Input placeholder="30-12345678-9" {...register(field('cuit'))} />
        </Field>

        <Field label="Condición fiscal" required error={errors.tax_condition?.message}>
          <select className={SELECT_CLASS} {...register(field('tax_condition'))}>
            {condiciones.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── Actividad ─────────────────────────────────────────────────── */}
      {esEmpresa && (
        <Field
          label="Actividad principal"
          error={errors.activity?.message}
          hint="Se imprime en el comprobante. Buscá tu código en la nomenclatura de ARCA."
        >
          <Input placeholder="620100 - Programación informática" {...register(field('activity'))} />
        </Field>
      )}

      {/* ── Domicilio fiscal ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Domicilio fiscal</p>
          <p className="text-xs text-gray-400">
            {esEmpresa
              ? 'Aparece en el comprobante. Todos los campos son obligatorios.'
              : 'Opcional: se imprime solo en los comprobantes que lo requieren.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field
            label="Calle"
            required={esEmpresa}
            error={errors.street?.message}
            className="sm:col-span-4"
          >
            <Input placeholder="Av. Corrientes" {...register(field('street'))} />
          </Field>
          <Field
            label="Número"
            required={esEmpresa}
            error={errors.street_number?.message}
            className="sm:col-span-2"
          >
            <Input placeholder="1234" {...register(field('street_number'))} />
          </Field>
          <Field label="Localidad" required={esEmpresa} error={errors.city?.message} className="sm:col-span-3">
            <Input placeholder="Ciudad Autónoma de Buenos Aires" {...register(field('city'))} />
          </Field>
          <Field label="Provincia" required={esEmpresa} error={errors.province?.message} className="sm:col-span-3">
            <select className={SELECT_CLASS} {...register(field('province'))}>
              <option value="">Seleccionar</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Contacto y numeración ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Teléfono" error={errors.phone?.message}>
          <Input placeholder="11-1234-5678" {...register(field('phone'))} />
        </Field>
        <Field label="Email de contacto" error={errors.email?.message}>
          <Input type="email" placeholder="facturacion@miempresa.com" {...register(field('email'))} />
        </Field>
        {esEmpresa && (
          <Field
            label="Punto de venta"
            error={errors.default_sale_point?.message}
            hint="Se usa por defecto al emitir."
          >
            <Input type="number" min={1} max={99999} {...register(field('default_sale_point'))} />
          </Field>
        )}
      </div>
    </div>
  )
}
