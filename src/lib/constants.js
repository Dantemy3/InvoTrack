export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
}

export const INVOICE_STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  draft: 'Borrador',
}

export const INVOICE_STATUS_COLORS = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
  draft: 'secondary',
}

export const INVOICE_TYPES = {
  FACTURA_A: 'Factura A',
  FACTURA_B: 'Factura B',
  FACTURA_C: 'Factura C',
  FACTURA_M: 'Factura M',
  NOTA_CREDITO: 'Nota de Crédito',
  NOTA_DEBITO: 'Nota de Débito',
  RECIBO: 'Recibo',
}

export const TAX_CONDITIONS = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTISTA: 'Monotributista',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  NO_RESPONSABLE: 'No Responsable',
}

export const IVA_RATES = [
  { label: '0%', value: 0 },
  { label: '10.5%', value: 10.5 },
  { label: '21%', value: 21 },
  { label: '27%', value: 27 },
]

export const ROLES = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  INVOICES: '/invoices',
  INVOICE_NEW: '/invoices/new',
  INVOICE_DETAIL: '/invoices/:id',
  INVOICE_EDIT: '/invoices/:id/edit',
  CLIENTS: '/clients',
  PROVIDERS: '/providers',
  REPORTS: '/reports',
  ALERTS: '/alerts',
  SETTINGS: '/settings',
  OCR: '/ocr',
}

export const QUERY_KEYS = {
  INVOICES: 'invoices',
  INVOICE: 'invoice',
  CLIENTS: 'clients',
  CLIENT: 'client',
  PROVIDERS: 'providers',
  PROVIDER: 'provider',
  DASHBOARD_STATS: 'dashboard-stats',
  ALERTS: 'alerts',
  CATEGORIES: 'categories',
  PROFILE: 'profile',
  COMPANY: 'company',
}
