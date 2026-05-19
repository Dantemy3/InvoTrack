/**
 * InvoTrack — Database Shapes (JSDoc)
 * Mirrors the Supabase PostgreSQL schema for IDE autocompletion.
 * This project uses JavaScript (JSX/JS) — no TypeScript migration.
 *
 * Usage:
 *   /** @type {import('@/lib/database').Invoice} *\/
 *   const invoice = await invoiceService.getById(id)
 */

// ─── Scalar enums ────────────────────────────────────────────────────────────

/**
 * Role a user can hold within a company.
 * @typedef {'admin' | 'accountant' | 'viewer'} UserRole
 */

/**
 * Lifecycle status of an invoice.
 * @typedef {'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'} InvoiceStatus
 */

/**
 * Direction of the invoice cash flow.
 * - `receivable`: we issued the invoice to a client (accounts receivable / income)
 * - `payable`:    we received the invoice from a provider (accounts payable / expense)
 * @typedef {'receivable' | 'payable'} InvoiceFlowType
 */

/**
 * Argentine tax condition (condición frente al IVA).
 * - `RI`: Responsable Inscripto
 * - `MO`: Monotributista
 * - `EX`: Exento
 * - `CF`: Consumidor Final
 * - `RS`: Responsable Sustituto
 * @typedef {'RI' | 'MO' | 'EX' | 'CF' | 'RS'} TaxCondition
 */

/**
 * Payment terms for an invoice.
 * @typedef {'contado' | 'cuenta_corriente'} CondicionPago
 */

/**
 * Accepted payment methods for invoice payments.
 * @typedef {'transfer' | 'cash' | 'check' | 'credit_card' | 'debit_card' | 'crypto' | 'other'} PaymentMethod
 */

// ─── Entity shapes ────────────────────────────────────────────────────────────

/**
 * A company registered in InvoTrack. Unit of data isolation.
 * Maps to the `companies` table.
 *
 * @typedef {Object} Company
 * @property {string}          id             - UUID primary key
 * @property {string}          name           - Company display name
 * @property {string|null}     cuit           - Argentine tax ID (XX-XXXXXXXX-X)
 * @property {string|null}     address        - Physical address
 * @property {TaxCondition|null} tax_condition - IVA condition
 * @property {string|null}     logo_url       - URL to company logo in Supabase Storage
 * @property {string}          owner_id       - UUID of the owning auth.users record
 * @property {string}          created_at     - ISO 8601 timestamp
 * @property {string}          updated_at     - ISO 8601 timestamp
 */

/**
 * An invoice (factura, nota de crédito/débito, recibo) registered in the system.
 * Maps to the `invoices` table.
 *
 * @typedef {Object} Invoice
 * @property {string}            id                     - UUID primary key
 * @property {string}            company_id             - FK → companies.id
 * @property {string}            user_id                - FK → auth.users.id (creator)
 * @property {string|null}       client_id              - FK → clients.id (nullable, ON DELETE SET NULL)
 * @property {string|null}       provider_id            - FK → providers.id (nullable, ON DELETE SET NULL)
 * @property {string}            invoice_number         - Human-readable invoice number
 * @property {string}            tipo_comprobante       - AFIP document type (e.g. 'Factura A', 'Nota de Crédito B')
 * @property {number}            punto_de_venta         - AFIP sales point (1–99999)
 * @property {number}            numero_comprobante     - Sequential document number
 * @property {InvoiceFlowType}   type                   - 'receivable' | 'payable'
 * @property {InvoiceStatus}     status                 - Lifecycle status
 * @property {string}            fecha_emision          - Issue date (YYYY-MM-DD)
 * @property {string|null}       fecha_vencimiento      - Due date (YYYY-MM-DD)
 * @property {CondicionPago}     condicion_pago         - 'contado' | 'cuenta_corriente'
 * @property {string}            moneda                 - ISO 4217 currency code (default 'ARS')
 * @property {number}            tipo_cambio            - Exchange rate (NUMERIC 10,4; default 1.0000)
 * @property {string|null}       emisor_cuit            - Issuer CUIT (XX-XXXXXXXX-X)
 * @property {string|null}       emisor_razon_social    - Issuer legal name
 * @property {TaxCondition|null} emisor_condicion_iva   - Issuer IVA condition
 * @property {string|null}       emisor_domicilio       - Issuer address
 * @property {string|null}       receptor_cuit          - Receiver CUIT (XX-XXXXXXXX-X)
 * @property {string|null}       receptor_razon_social  - Receiver legal name
 * @property {TaxCondition|null} receptor_condicion_iva - Receiver IVA condition
 * @property {string|null}       receptor_domicilio     - Receiver address
 * @property {number}            neto_gravado           - Taxable net amount (NUMERIC 15,2)
 * @property {number}            neto_no_gravado        - Non-taxable net amount (NUMERIC 15,2)
 * @property {number}            exento                 - Exempt amount (NUMERIC 15,2)
 * @property {number}            iva_105                - IVA at 10.5% (NUMERIC 15,2)
 * @property {number}            iva_21                 - IVA at 21% (NUMERIC 15,2)
 * @property {number}            iva_27                 - IVA at 27% (NUMERIC 15,2)
 * @property {number}            otros_tributos         - Other taxes (NUMERIC 15,2)
 * @property {number}            total_amount           - Grand total (NUMERIC 15,2)
 * @property {string|null}       cae                    - AFIP CAE code (14 chars)
 * @property {string|null}       cae_vencimiento        - CAE expiry date (YYYY-MM-DD)
 * @property {string|null}       afip_status            - AFIP validation status
 * @property {string|null}       ocr_provider           - OCR provider used ('mock' | 'google' | 'gpt4v' | 'gemini')
 * @property {Object|null}       ocr_confidence         - JSONB map of field → confidence score (0.0–1.0)
 * @property {string|null}       ocr_raw_text           - Raw text extracted by OCR for traceability
 * @property {string|null}       notes                  - Free-form notes
 * @property {string}            created_at             - ISO 8601 timestamp
 * @property {string}            updated_at             - ISO 8601 timestamp
 * @property {InvoiceItem[]}     [invoice_items]        - Joined items (present when fetched with select)
 */

/**
 * A line item within an invoice.
 * Maps to the `invoice_items` table.
 *
 * @typedef {Object} InvoiceItem
 * @property {string}  id              - UUID primary key
 * @property {string}  invoice_id      - FK → invoices.id (ON DELETE CASCADE)
 * @property {string}  descripcion     - Item description
 * @property {number}  cantidad        - Quantity (NUMERIC 12,4)
 * @property {string}  [unidad]        - Unit of measure (e.g. 'kg', 'hs', 'u')
 * @property {number}  precio_unitario - Unit price (NUMERIC 15,2)
 * @property {number}  alicuota_iva    - IVA rate: 0 | 10.5 | 21 | 27 (NUMERIC 5,2)
 * @property {number}  subtotal_neto   - Net subtotal = cantidad × precio_unitario (NUMERIC 15,2)
 * @property {number}  subtotal_iva    - IVA subtotal = subtotal_neto × alicuota_iva/100 (NUMERIC 15,2)
 * @property {number}  sort_order      - Display order within the invoice
 * @property {string}  created_at      - ISO 8601 timestamp
 */

/**
 * A (partial or full) payment applied to an invoice.
 * Maps to the `invoice_payments` table.
 *
 * @typedef {Object} InvoicePayment
 * @property {string}        id             - UUID primary key
 * @property {string}        invoice_id     - FK → invoices.id (ON DELETE CASCADE)
 * @property {string}        company_id     - FK → companies.id (ON DELETE CASCADE)
 * @property {string}        user_id        - FK → auth.users.id (registrar)
 * @property {number}        amount         - Payment amount > 0 (NUMERIC 15,2)
 * @property {PaymentMethod} payment_method - Method used
 * @property {string}        payment_date   - Date of payment (YYYY-MM-DD)
 * @property {string|null}   notes          - Optional notes
 * @property {string}        created_at     - ISO 8601 timestamp
 */

/**
 * A client (customer) the company issues invoices to (accounts receivable).
 * Maps to the `clients` table.
 *
 * @typedef {Object} Client
 * @property {string}          id             - UUID primary key
 * @property {string}          company_id     - FK → companies.id (ON DELETE CASCADE)
 * @property {string}          user_id        - FK → auth.users.id (creator)
 * @property {string}          name           - Client display name
 * @property {string|null}     cuit           - Argentine tax ID (XX-XXXXXXXX-X)
 * @property {string|null}     email          - Contact email
 * @property {string|null}     phone          - Contact phone
 * @property {string|null}     address        - Physical address
 * @property {TaxCondition|null} tax_condition - IVA condition
 * @property {string|null}     notes          - Free-form notes
 * @property {string}          created_at     - ISO 8601 timestamp
 * @property {string}          updated_at     - ISO 8601 timestamp
 */

/**
 * A provider (supplier) the company receives invoices from (accounts payable).
 * Maps to the `providers` table. Same shape as {@link Client}.
 *
 * @typedef {Object} Provider
 * @property {string}          id             - UUID primary key
 * @property {string}          company_id     - FK → companies.id (ON DELETE CASCADE)
 * @property {string}          user_id        - FK → auth.users.id (creator)
 * @property {string}          name           - Provider display name
 * @property {string|null}     cuit           - Argentine tax ID (XX-XXXXXXXX-X)
 * @property {string|null}     email          - Contact email
 * @property {string|null}     phone          - Contact phone
 * @property {string|null}     address        - Physical address
 * @property {TaxCondition|null} tax_condition - IVA condition
 * @property {string|null}     notes          - Free-form notes
 * @property {string}          created_at     - ISO 8601 timestamp
 * @property {string}          updated_at     - ISO 8601 timestamp
 */

/**
 * Aggregated financial summary for a single invoice (from the `invoice_financial_summary` view).
 *
 * @typedef {Object} InvoiceFinancialSummary
 * @property {string}          invoice_id    - FK → invoices.id
 * @property {string}          company_id    - FK → companies.id
 * @property {InvoiceFlowType} type          - 'receivable' | 'payable'
 * @property {InvoiceStatus}   status        - Current invoice status
 * @property {number}          total_amount  - Invoice grand total
 * @property {string}          issue_date    - Issue date (YYYY-MM-DD)
 * @property {string|null}     due_date      - Due date (YYYY-MM-DD)
 * @property {string}          currency      - ISO 4217 currency code
 * @property {number}          total_paid    - Sum of all registered payments
 * @property {number}          total_pending - total_amount − total_paid (≥ 0)
 * @property {boolean}         is_fully_paid - true when total_paid >= total_amount
 * @property {boolean}         is_overdue    - true when due_date < today AND not fully paid
 */

/**
 * Aggregated cash-flow per company/type/currency (from the `company_cash_flow` view).
 *
 * @typedef {Object} CompanyCashFlow
 * @property {string}          company_id      - FK → companies.id
 * @property {InvoiceFlowType} type            - 'receivable' | 'payable'
 * @property {string}          currency        - ISO 4217 currency code
 * @property {number}          invoice_count   - Number of invoices
 * @property {number}          total_invoiced  - Sum of total_amount
 * @property {number}          total_collected - Sum of payments received
 * @property {number}          total_pending   - Sum of pending amounts
 * @property {number}          total_overdue   - Sum of overdue pending amounts
 */
