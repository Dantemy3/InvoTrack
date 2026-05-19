import { supabase } from '@/lib/supabase'

/**
 * companyService — operaciones sobre la tabla `companies`.
 *
 * userId se recibe siempre como parámetro explícito.
 * El servicio es agnóstico al contexto React — no importa AuthContext ni CompanyContext.
 * El RLS en Supabase garantiza aislamiento entre usuarios.
 *
 * Un usuario puede acceder a una empresa si:
 *   a) es el propietario (owner_id = userId), o
 *   b) tiene un registro en user_roles para esa empresa.
 *
 * Cada empresa retornada incluye un campo `role` con el rol del usuario:
 *   - 'admin' para empresas propias (owner_id = userId)
 *   - el rol de user_roles para empresas donde el usuario es miembro
 */
export const companyService = {
  /**
   * Retorna todas las empresas accesibles para el usuario:
   * las que posee (owner_id) más las que tiene asignadas via user_roles.
   * Cada empresa incluye el campo `role` del usuario en esa empresa.
   *
   * @param {string} userId — ID del usuario autenticado
   * @returns {Promise<Array<import('@/lib/database').Company & { role: import('@/lib/database').UserRole }>>}
   */
  async getAll(userId) {
    if (!userId) throw new Error('userId es requerido')

    // Empresas donde el usuario es propietario
    const { data: owned, error: ownedError } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .order('name', { ascending: true })

    if (ownedError) throw ownedError

    // Empresas donde el usuario tiene un rol asignado (incluye datos de la empresa)
    const { data: roleRows, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, company_id, companies(*)')
      .eq('user_id', userId)

    if (rolesError) throw rolesError

    // Construir mapa de role por company_id para acceso rápido
    const roleByCompanyId = {}
    for (const row of roleRows ?? []) {
      if (row.company_id) {
        roleByCompanyId[row.company_id] = row.role
      }
    }

    // Empresas propias siempre tienen rol 'admin'
    const ownedWithRole = (owned ?? []).map((c) => ({ ...c, role: 'admin' }))

    // Empresas de membresía: excluir las que ya están en owned
    const ownedIds = new Set((owned ?? []).map((c) => c.id))
    const memberCompanies = (roleRows ?? [])
      .filter((r) => r.companies && !ownedIds.has(r.company_id))
      .map((r) => ({ ...r.companies, role: r.role }))

    // Combinar: propias primero, luego las de membresía ordenadas por nombre
    const merged = [
      ...ownedWithRole,
      ...memberCompanies.sort((a, b) => a.name.localeCompare(b.name)),
    ]

    return merged
  },

  /**
   * Retorna una empresa por su ID.
   * El RLS garantiza que solo usuarios con acceso pueden leerla.
   *
   * @param {string} id — UUID de la empresa
   * @returns {Promise<import('@/lib/database').Company>}
   */
  async getById(id) {
    if (!id) throw new Error('id es requerido')

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Crea una nueva empresa.
   * El userId se usa como owner_id de la empresa creada.
   *
   * @param {{ name: string, cuit?: string, address?: string, tax_condition?: string, logo_url?: string }} data
   * @param {string} userId — ID del usuario que será propietario
   * @returns {Promise<import('@/lib/database').Company>}
   */
  async create(data, userId) {
    if (!userId) throw new Error('userId es requerido')
    if (!data?.name) throw new Error('El nombre de la empresa es requerido')

    const { data: created, error } = await supabase
      .from('companies')
      .insert({ ...data, owner_id: userId })
      .select()
      .single()

    if (error) throw error
    return created
  },

  /**
   * Actualiza los datos de una empresa existente.
   * El RLS garantiza que solo el propietario o un admin puede actualizar.
   *
   * @param {string} id — UUID de la empresa
   * @param {Partial<import('@/lib/database').Company>} updates — campos a actualizar
   * @returns {Promise<import('@/lib/database').Company>}
   */
  async update(id, updates) {
    if (!id) throw new Error('id es requerido')

    // Evitar que se sobreescriba owner_id, id o created_at accidentalmente
    const { id: _id, owner_id: _owner, created_at: _ca, role: _role, ...safeUpdates } = updates ?? {}

    const { data, error } = await supabase
      .from('companies')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
