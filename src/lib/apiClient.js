import { supabase } from '@/lib/supabase'

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '')

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!session?.access_token) throw new Error('Iniciá sesión para continuar')

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  if (response.status === 204) return undefined
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error ?? `Error HTTP ${response.status}`)
  return payload
}

export function catalogPath(companyId, resource, id) {
  if (!companyId) throw new Error('companyId es requerido')
  return `/companies/${encodeURIComponent(companyId)}/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`
}

export function catalogService(resource) {
  return {
    getAll({ companyId, search, page = 1, pageSize } = {}) {
      const params = new URLSearchParams({ page: String(page) })
      if (pageSize) params.set('pageSize', String(pageSize))
      if (search) params.set('search', search)
      return apiRequest(`${catalogPath(companyId, resource)}?${params}`)
    },
    getById(id, companyId) {
      return apiRequest(catalogPath(companyId, resource, id))
    },
    create(payload) {
      const { company_id: companyId, ...fields } = payload
      return apiRequest(catalogPath(companyId, resource), { method: 'POST', body: fields })
    },
    update(id, updates, companyId) {
      return apiRequest(catalogPath(companyId, resource, id), { method: 'PATCH', body: updates })
    },
    delete(id, companyId) {
      return apiRequest(catalogPath(companyId, resource, id), { method: 'DELETE' })
    },
  }
}
