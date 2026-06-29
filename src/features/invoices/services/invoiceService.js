import { supabase } from '@/lib/supabase'

/**
 * invoiceService — CRUD + analytics para facturas.
 *
 * company_id se recibe siempre como parámetro explícito.
 * El servicio es agnóstico al contexto React — no lee CompanyContext.
 * El RLS en Supabase garantiza aislamiento entre empresas.
 */
export const invoiceService = {
  /**
   * List invoices with optional filters and pagination.
   * Req 5.8, 9.1, 9.2, 9.4, 12.11
   * @param {{ page?: number, pageSize?: number, status?: string, type?: string, search?: string, companyId?: string, dateFrom?: string, dateTo?: string }} opts
   */
  async getAll({ page = 1, pageSize = 20, status, type, search, companyId, dateFrom, dateTo } = {}) {
    const safePage     = Math.max(1, page)
    const safePageSize = Math.min(100, Math.max(1, pageSize))

    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        clients(id, name, email),
        providers(id, name, email)
      `, { count: 'exact' })
      .order('fecha_emision', { ascending: false })
      .range((safePage - 1) * safePageSize, safePage * safePageSize - 1)

    if (companyId) query = query.eq('company_id', companyId)
    if (status)    query = query.eq('status', status)
    if (type)      query = query.eq('type', type)
    if (search)    query = query.ilike('invoice_number', `%${search}%`)
    if (dateFrom)  query = query.gte('fecha_emision', dateFrom)
    if (dateTo)    query = query.lte('fecha_emision', dateTo)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data ?? [], count: count ?? 0 }
  },

  /**
   * Get a single invoice with its items and payments.
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(id, name, email, cuit, phone, address),
        providers(id, name, email, cuit, phone, address),
        invoice_items(*),
        invoice_payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * ──────────────────────────────────────────────────────────────────────────
   * FLUJO "CREAR FACTURA" — paso 4 de 4
   * ──────────────────────────────────────────────────────────────────────────
   * create() es la función que persiste la factura en la base de datos (Supabase).
   *
   * Pasos internos:
   *  1. Obtener el usuario autenticado con supabase.auth.getUser().
   *  2. Generar el invoice_number en formato AFIP: XXXX-XXXXXXXX.
   *  3. Insertar la fila en la tabla `invoices` con todos los campos fiscales.
   *  4. Insertar las filas de ítems en `invoice_items` vinculadas por invoice_id.
   *  5. Si los ítems fallan, hacer rollback borrando la factura para no dejar
   *     registros huérfanos.
   *
   * El RLS de Supabase garantiza que solo usuarios de esa empresa pueden
   * leer/escribir sus propias facturas (aislamiento multi-tenant).
   * ──────────────────────────────────────────────────────────────────────────
   * @param {{ items: object[], company_id: string, ...invoiceFields }} payload
   */
  async create({ items = [], ...invoice }) {
    // Paso 4a — Obtener usuario autenticado
    // En producción, user.id identifica al creador de la factura.
    // En desarrollo local, si no hay sesión activa se usa un id de prueba.
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id ?? 'dev-user-hardcoded'

    // Paso 4b — Generar número de factura en formato AFIP (XXXX-XXXXXXXX)
    const invoiceNumber = invoice.invoice_number ||
      `${String(invoice.punto_de_venta ?? 1).padStart(4, '0')}-${String(invoice.numero_comprobante ?? 1).padStart(8, '0')}`

    // Paso 4b.1 — Verificar que no exista ya una factura con el mismo número
    // y tipo de comprobante para esta empresa. AFIP no permite duplicados.
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('company_id', invoice.company_id)
      .eq('invoice_number', invoiceNumber)
      .eq('tipo_comprobante', invoice.tipo_comprobante)
      .maybeSingle()

    if (existing) {
      throw new Error(
        `Ya existe una ${invoice.tipo_comprobante} con el número ${invoiceNumber}. ` +
        `Cambiá el número de comprobante o el punto de venta.`
      )
    }

    // Paso 4b.1 — Limpiar campos de fecha vacíos antes de enviar a Supabase.
    // Postgres espera NULL o una fecha válida — un string vacío ("") tira
    // "invalid input syntax for type date". Esto ocurre en tipos de factura
    // que no tienen fecha de vencimiento (Factura C, Recibo, Notas).
    const cleanInvoice = { ...invoice }
    if (!cleanInvoice.fecha_vencimiento || cleanInvoice.fecha_vencimiento.trim() === '') {
      cleanInvoice.fecha_vencimiento = null
    }
    if (!cleanInvoice.cae_vencimiento || cleanInvoice.cae_vencimiento.trim() === '') {
      cleanInvoice.cae_vencimiento = null
    }
    if (!cleanInvoice.cae || cleanInvoice.cae.trim() === '') {
      cleanInvoice.cae = null
    }

    // Limpiar campos UI-only que no existen en la tabla invoices
    delete cleanInvoice.consumidor_final_anonimo

    // Paso 4c — Insertar la cabecera de la factura en la tabla `invoices`
    // .select().single() devuelve el registro recién creado con su id generado por Supabase.
    const { data: newInvoice, error: invError } = await supabase
      .from('invoices')
      .insert({ ...cleanInvoice, invoice_number: invoiceNumber, user_id: userId })
      .select()
      .single()

    if (invError) throw invError

    // Paso 4d — Insertar los ítems de la factura en `invoice_items`
    // Cada ítem lleva el invoice_id de la cabecera y un sort_order para mantener el orden.
    if (items.length > 0) {
      const rows = items.map((item, idx) => ({
        invoice_id:    newInvoice.id,
        sort_order:    idx,
        description:   item.description    ?? item.descripcion    ?? '',
        quantity:      item.quantity        ?? item.cantidad       ?? 1,
        unidad:        item.unidad          ?? item.unit           ?? null,
        unit_price:    item.unit_price      ?? item.precio_unitario ?? 0,
        alicuota_iva:  item.alicuota_iva    ?? item.iva_rate       ?? 0,
        subtotal_neto: item.subtotal_neto   ?? 0,
        subtotal_iva:  item.subtotal_iva    ?? 0,
      }))
      const { error: itemsError } = await supabase.from('invoice_items').insert(rows)

      if (itemsError) {
        // Paso 4e — Rollback manual: si los ítems fallan, eliminamos la factura
        // para no dejar una cabecera sin líneas (registro huérfano) en la base de datos.
        await supabase.from('invoices').delete().eq('id', newInvoice.id)
        throw itemsError
      }
    }

    // Paso 4f — Devolver la factura creada al hook (useCreateInvoice)
    // que a su vez invalida el caché y muestra el toast de éxito.
    return newInvoice
  },

  /**
   * Update invoice fields (not items — handle separately).
   * El RLS garantiza que solo miembros con rol admin/accountant pueden actualizar.
   * @param {string} id
   * @param {object} updates
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update only the status field.
   * @param {string} id
   * @param {string} status
   */
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an invoice (cascades to items and payments via FK).
   * El RLS garantiza que solo rol admin puede eliminar.
   * @param {string} id
   */
  async delete(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Dashboard stats — uses invoice_financial_summary view for real cash flow.
   * Filtra por company_id (no por user_id).
   * @param {string} companyId
   */
  async getDashboardStats(companyId) {
    if (!companyId) throw new Error('companyId requerido')

    const now      = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // Fetch financial summary for current month, scoped to company
    const { data: summaries, error } = await supabase
      .from('invoice_financial_summary')
      .select('*')
      .eq('company_id', companyId)
      .gte('issue_date', firstDay)

    if (error) throw error

    const receivable = summaries?.filter((s) => s.type === 'receivable') ?? []
    const payable    = summaries?.filter((s) => s.type === 'payable')    ?? []

    const totalFacturado = receivable.reduce((acc, s) => acc + Number(s.total_amount), 0)
    const totalIngresado = receivable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const totalPendiente = receivable.reduce((acc, s) => acc + Number(s.total_pending), 0)
    const totalGastos    = payable.reduce((acc, s) => acc + Number(s.total_paid), 0)
    const resultado      = totalIngresado - totalGastos

    const paid    = receivable.filter((s) => s.is_fully_paid).length
    const pending = receivable.filter((s) => !s.is_fully_paid && !s.is_overdue).length
    const overdue = receivable.filter((s) => s.is_overdue).length
    const total   = receivable.length

    return {
      totalFacturado,
      totalIngresado,
      totalGastos,
      totalPendiente,
      resultado,
      paid,
      pending,
      overdue,
      total,
    }
  },

  /**
   * Monthly chart data — last N months of receivable vs payable collected.
   * Filtra por company_id (no por user_id).
   * @param {string} companyId
   * @param {number} months
   */
  async getMonthlyChart(companyId, months = 6) {
    if (!companyId) throw new Error('companyId requerido')

    const from = new Date()
    from.setMonth(from.getMonth() - months + 1)
    from.setDate(1)
    const fromStr = from.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('invoice_financial_summary')
      .select('issue_date, type, total_paid, total_amount')
      .eq('company_id', companyId)
      .gte('issue_date', fromStr)
      .order('issue_date', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
