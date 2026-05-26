/**
 * demoData.js — datos de demostración para visualizar el dashboard sin Supabase.
 *
 * Empresa demo: "Tech Solutions S.A."
 * Incluye facturas emitidas (receivable) y recibidas (payable) con distintos estados.
 */

export const DEMO_COMPANY = {
  id: 'demo-company-001',
  name: 'Tech Solutions S.A.',
  cuit: '30-71234567-8',
  address: 'Av. Corrientes 1234 Piso 5, CABA',
  tax_condition: 'RI',
  owner_id: 'demo-user-001',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const now = new Date()
const m = (offset = 0) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 15)
  return d.toISOString().split('T')[0]
}
const past = (days) => {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
const future = (days) => {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── Facturas emitidas a clientes (receivable) ─────────────────────────────────
export const DEMO_INVOICES = [
  // Cobradas este mes
  {
    id: 'demo-inv-001',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00000001',
    tipo_comprobante: 'Factura A',
    type: 'receivable',
    status: 'paid',
    fecha_emision: m(0),
    fecha_vencimiento: future(15),
    total_amount: 260150,
    neto_gravado: 215000,
    iva_21: 45150,
    moneda: 'ARS',
    emisor_razon_social: 'Tech Solutions S.A.',
    emisor_cuit: '30-71234567-8',
    receptor_razon_social: 'Distribuidora del Sur S.R.L.',
    receptor_cuit: '30-68901234-5',
    invoice_items: [
      { id: 'item-001-1', descripcion: 'Servicio de consultoría IT', cantidad: 10, precio_unitario: 12500, alicuota_iva: 21, subtotal_neto: 125000, subtotal_iva: 26250 },
      { id: 'item-001-2', descripcion: 'Licencia software anual', cantidad: 2, precio_unitario: 45000, alicuota_iva: 21, subtotal_neto: 90000, subtotal_iva: 18900 },
    ],
    invoice_payments: [{ id: 'pay-001', amount: 260150, payment_method: 'transfer', payment_date: m(0) }],
  },
  {
    id: 'demo-inv-002',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00000002',
    tipo_comprobante: 'Factura A',
    type: 'receivable',
    status: 'paid',
    fecha_emision: m(0),
    fecha_vencimiento: future(20),
    total_amount: 181500,
    neto_gravado: 150000,
    iva_21: 31500,
    moneda: 'ARS',
    emisor_razon_social: 'Tech Solutions S.A.',
    emisor_cuit: '30-71234567-8',
    receptor_razon_social: 'Comercial Norte S.A.',
    receptor_cuit: '30-55443322-1',
    invoice_items: [
      { id: 'item-002-1', descripcion: 'Desarrollo web — 30 horas', cantidad: 30, precio_unitario: 5000, alicuota_iva: 21, subtotal_neto: 150000, subtotal_iva: 31500 },
    ],
    invoice_payments: [{ id: 'pay-002', amount: 181500, payment_method: 'transfer', payment_date: m(0) }],
  },
  // Pendiente de cobro
  {
    id: 'demo-inv-003',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00000003',
    tipo_comprobante: 'Factura B',
    type: 'receivable',
    status: 'pending',
    fecha_emision: m(0),
    fecha_vencimiento: future(10),
    total_amount: 96800,
    neto_gravado: 80000,
    iva_21: 16800,
    moneda: 'ARS',
    emisor_razon_social: 'Tech Solutions S.A.',
    emisor_cuit: '30-71234567-8',
    receptor_razon_social: 'Estudio Contable Pérez',
    receptor_cuit: '20-33445566-7',
    invoice_items: [
      { id: 'item-003-1', descripcion: 'Soporte técnico mensual', cantidad: 1, precio_unitario: 80000, alicuota_iva: 21, subtotal_neto: 80000, subtotal_iva: 16800 },
    ],
    invoice_payments: [],
  },
  // Próxima a vencer (3 días)
  {
    id: 'demo-inv-004',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00000004',
    tipo_comprobante: 'Factura A',
    type: 'receivable',
    status: 'pending',
    fecha_emision: past(27),
    fecha_vencimiento: future(3),
    total_amount: 145200,
    neto_gravado: 120000,
    iva_21: 25200,
    moneda: 'ARS',
    emisor_razon_social: 'Tech Solutions S.A.',
    emisor_cuit: '30-71234567-8',
    receptor_razon_social: 'Importadora Omega S.R.L.',
    receptor_cuit: '30-77889900-2',
    invoice_items: [
      { id: 'item-004-1', descripcion: 'Implementación ERP — Fase 1', cantidad: 1, precio_unitario: 120000, alicuota_iva: 21, subtotal_neto: 120000, subtotal_iva: 25200 },
    ],
    invoice_payments: [],
  },
  // Vencida
  {
    id: 'demo-inv-005',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00000005',
    tipo_comprobante: 'Factura A',
    type: 'receivable',
    status: 'overdue',
    fecha_emision: past(45),
    fecha_vencimiento: past(15),
    total_amount: 72600,
    neto_gravado: 60000,
    iva_21: 12600,
    moneda: 'ARS',
    emisor_razon_social: 'Tech Solutions S.A.',
    emisor_cuit: '30-71234567-8',
    receptor_razon_social: 'Servicios Generales S.A.',
    receptor_cuit: '30-11223344-5',
    invoice_items: [
      { id: 'item-005-1', descripcion: 'Capacitación equipo técnico', cantidad: 1, precio_unitario: 60000, alicuota_iva: 21, subtotal_neto: 60000, subtotal_iva: 12600 },
    ],
    invoice_payments: [],
  },

  // ── Facturas recibidas de proveedores (payable) ───────────────────────────
  {
    id: 'demo-inv-006',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0003-00004521',
    tipo_comprobante: 'Factura A',
    type: 'payable',
    status: 'paid',
    fecha_emision: m(0),
    fecha_vencimiento: future(30),
    total_amount: 48400,
    neto_gravado: 40000,
    iva_21: 8400,
    moneda: 'ARS',
    emisor_razon_social: 'Hosting Cloud S.A.',
    emisor_cuit: '30-99887766-3',
    receptor_razon_social: 'Tech Solutions S.A.',
    receptor_cuit: '30-71234567-8',
    invoice_items: [
      { id: 'item-006-1', descripcion: 'Servidores cloud — mes junio', cantidad: 1, precio_unitario: 40000, alicuota_iva: 21, subtotal_neto: 40000, subtotal_iva: 8400 },
    ],
    invoice_payments: [{ id: 'pay-006', amount: 48400, payment_method: 'transfer', payment_date: m(0) }],
  },
  {
    id: 'demo-inv-007',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0001-00012345',
    tipo_comprobante: 'Factura B',
    type: 'payable',
    status: 'paid',
    fecha_emision: m(0),
    fecha_vencimiento: future(15),
    total_amount: 36300,
    neto_gravado: 30000,
    iva_21: 6300,
    moneda: 'ARS',
    emisor_razon_social: 'Papelería Oficina Total',
    emisor_cuit: '20-44556677-8',
    receptor_razon_social: 'Tech Solutions S.A.',
    receptor_cuit: '30-71234567-8',
    invoice_items: [
      { id: 'item-007-1', descripcion: 'Insumos de oficina', cantidad: 1, precio_unitario: 30000, alicuota_iva: 21, subtotal_neto: 30000, subtotal_iva: 6300 },
    ],
    invoice_payments: [{ id: 'pay-007', amount: 36300, payment_method: 'cash', payment_date: m(0) }],
  },
  {
    id: 'demo-inv-008',
    company_id: DEMO_COMPANY.id,
    invoice_number: '0002-00008901',
    tipo_comprobante: 'Factura A',
    type: 'payable',
    status: 'pending',
    fecha_emision: m(0),
    fecha_vencimiento: future(20),
    total_amount: 60500,
    neto_gravado: 50000,
    iva_21: 10500,
    moneda: 'ARS',
    emisor_razon_social: 'Telecom Empresas S.A.',
    emisor_cuit: '30-66778899-0',
    receptor_razon_social: 'Tech Solutions S.A.',
    receptor_cuit: '30-71234567-8',
    invoice_items: [
      { id: 'item-008-1', descripcion: 'Servicio de internet y telefonía', cantidad: 1, precio_unitario: 50000, alicuota_iva: 21, subtotal_neto: 50000, subtotal_iva: 10500 },
    ],
    invoice_payments: [],
  },
]

// ── KPIs calculados a partir de los datos demo ────────────────────────────────
export const DEMO_STATS = (() => {
  const receivable = DEMO_INVOICES.filter((i) => i.type === 'receivable')
  const payable    = DEMO_INVOICES.filter((i) => i.type === 'payable')

  const totalFacturado = receivable.reduce((acc, i) => acc + i.total_amount, 0)
  const totalIngresado = receivable
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total_amount, 0)
  const totalPendiente = receivable
    .filter((i) => i.status !== 'paid')
    .reduce((acc, i) => acc + i.total_amount, 0)
  const totalGastos = payable
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total_amount, 0)
  const resultado = totalIngresado - totalGastos

  return {
    totalFacturado,
    totalIngresado,
    totalGastos,
    totalPendiente,
    resultado,
    paid:    receivable.filter((i) => i.status === 'paid').length,
    pending: receivable.filter((i) => i.status === 'pending').length,
    overdue: receivable.filter((i) => i.status === 'overdue').length,
    total:   receivable.length,
  }
})()

// ── Datos del gráfico mensual (últimos 6 meses simulados) ─────────────────────
export const DEMO_CHART_DATA = (() => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    // Simular variación realista
    const base = 200000 + Math.sin(i) * 80000
    months.push({
      month: label,
      ingresos: Math.round(base * (0.8 + Math.random() * 0.4)),
      gastos:   Math.round(base * (0.3 + Math.random() * 0.2)),
    })
  }
  // El último mes usa los datos reales de demo
  months[5] = {
    month: months[5].month,
    ingresos: DEMO_STATS.totalIngresado,
    gastos:   DEMO_STATS.totalGastos,
  }
  return months
})()
