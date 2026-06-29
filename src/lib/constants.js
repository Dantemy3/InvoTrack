export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
}

// receivable = cliente me paga | payable = yo pago al proveedor
export const INVOICE_FLOW_TYPE = {
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable',
}

export const INVOICE_FLOW_TYPE_LABELS = {
  receivable: 'Cobrar (ingreso)',
  payable: 'Pagar (gasto)',
}

export const PAYMENT_METHODS = {
  TRANSFER: 'transfer',
  CASH: 'cash',
  CHECK: 'check',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  CRYPTO: 'crypto',
  OTHER: 'other',
}

export const PAYMENT_METHOD_LABELS = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  check: 'Cheque',
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  crypto: 'Cripto',
  other: 'Otro',
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

/**
 * IVA rate options for UI selectors.
 * Each entry has a human-readable label and the numeric value.
 */
export const IVA_RATES = [
  { label: '0%', value: 0 },
  { label: '10.5%', value: 10.5 },
  { label: '21%', value: 21 },
  { label: '27%', value: 27 },
]

/**
 * Valid IVA rate values as a plain numeric array.
 * Use this in Zod schemas: z.number().refine(v => IVA_VALID_RATES.includes(v))
 * Alícuotas válidas según AFIP: 0%, 10.5%, 21%, 27%.
 */
export const IVA_VALID_RATES = [0, 10.5, 21, 27]

export const ROLES = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  INVOICES: '/invoices',
  INVOICE_NEW: '/invoices/new',
  INVOICE_DETAIL: '/invoices/:id',
  INVOICE_EDIT: '/invoices/:id/edit',
  CLIENTS: '/clients',
  PRODUCTS: '/products',
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
  COMPANIES: 'companies',
  COMPANY: 'company',
  DASHBOARD_STATS: 'dashboard-stats',
  ALERTS: 'alerts',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  PRODUCT: 'product',
  PROFILE: 'profile',
  REPORTS: 'reports',
  INVOICE_PAYMENTS: 'invoice-payments',
}

/**
 * Monedas soportadas por InvoTrack.
 * Requirements: 15.4 (multi-moneda)
 */
export const SUPPORTED_CURRENCIES = ['ARS', 'USD', 'EUR']

export const CURRENCY_LABELS = {
  ARS: 'Peso argentino (ARS)',
  USD: 'Dólar estadounidense (USD)',
  EUR: 'Euro (EUR)',
}

export const CURRENCY_SYMBOLS = {
  ARS: '$',
  USD: 'U$S',
  EUR: '€',
}
