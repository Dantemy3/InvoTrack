/**
 * InvoTrack — Database Types (JSDoc)
 * Mirrors the Supabase schema for IDE autocompletion without TypeScript.
 *
 * Usage:
 *   @type {import('./database.types').Invoice}
 */

/**
 * @typedef {'admin' | 'accountant' | 'viewer'} UserRole
 */

/**
 * @typedef {'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'} InvoiceStatus
 */

/**
 * @typedef {'receivable' | 'payable'} InvoiceType
 * - receivable: a client owes us money (income)
 * - payable:    we owe a provider money (expense)
 */

/**
 * @typedef {'transfer' | 'cash' | 'check' | 'credit_card' | 'debit_card' | 'crypto' | 'other'} PaymentMethod
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} avatar_url
 * @property {UserRole} role
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 * @property {string|null} cuit
 * @property {string|null} address
 * @property {string|null} tax_condition
 * @property {string|null} logo_url
 * @property {string|null} owner_id
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} company_id
 * @property {string} user_id
 * @property {string} name
 * @property {string|null} cuit
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string|null} address
 * @property {string|null} tax_condition
 * @property {string|null} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} company_id
 * @property {string} user_id
 * @property {string} name
 * @property {string|null} cuit
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string|null} address
 * @property {string|null} tax_condition
 * @property {string|null} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} company_id
 * @property {string} user_id
 * @property {string|null} client_id
 * @property {string|null} provider_id
 * @property {string} invoice_number
 * @property {string} invoice_type
 * @property {InvoiceStatus} status
 * @property {InvoiceType} type        — 'receivable' | 'payable'
 * @property {string} issue_date
 * @property {string|null} due_date
 * @property {string} currency
 * @property {number} subtotal
 * @property {number} total_iva
 * @property {number} total_amount
 * @property {string|null} notes
 * @property {string|null} cae
 * @property {string|null} cae_expiry
 * @property {string|null} afip_status
 * @property {string|null} ocr_provider
 * @property {any|null} ocr_confidence
 * @property {string|null} ocr_raw_text
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} InvoiceItem
 * @property {string} id
 * @property {string} invoice_id
 * @property {string} description
 * @property {number} quantity
 * @property {number} unit_price
 * @property {number} iva_rate
 * @property {number} subtotal
 * @property {number} sort_order
 * @property {string} created_at
 */

/**
 * @typedef {Object} InvoicePayment
 * @property {string} id
 * @property {string} invoice_id
 * @property {string} company_id
 * @property {string} user_id
 * @property {number} amount
 * @property {PaymentMethod} payment_method
 * @property {string} payment_date
 * @property {string|null} notes
 * @property {string} created_at
 */

/**
 * @typedef {Object} InvoiceFinancialSummary
 * @property {string} invoice_id
 * @property {string} company_id
 * @property {string} user_id
 * @property {InvoiceType} type
 * @property {InvoiceStatus} status
 * @property {number} total_amount
 * @property {string|null} due_date
 * @property {string} issue_date
 * @property {string} currency
 * @property {number} total_paid       — sum of all payments registered
 * @property {number} total_pending    — total_amount - total_paid
 * @property {boolean} is_fully_paid
 * @property {boolean} is_overdue
 */

/**
 * @typedef {Object} CompanyCashFlow
 * @property {string} company_id
 * @property {InvoiceType} type
 * @property {string} currency
 * @property {number} invoice_count
 * @property {number} total_invoiced
 * @property {number} total_collected
 * @property {number} total_pending
 * @property {number} total_overdue
 */
