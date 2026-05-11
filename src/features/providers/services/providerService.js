import { MOCK_PROVIDERS } from '@/lib/mockData'

let providers = [...MOCK_PROVIDERS]

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms))
}

export const providerService = {
  async getAll({ search, page = 1, pageSize = 20 } = {}) {
    await delay()
    let filtered = [...providers]
    if (search) filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), count: filtered.length }
  },

  async getById(id) {
    await delay()
    return providers.find((p) => p.id === id) || null
  },

  async create(provider) {
    await delay()
    const newProvider = { ...provider, id: `p-${Date.now()}`, created_at: new Date().toISOString() }
    providers = [newProvider, ...providers]
    return newProvider
  },

  async update(id, updates) {
    await delay()
    providers = providers.map((p) => p.id === id ? { ...p, ...updates } : p)
    return providers.find((p) => p.id === id)
  },

  async delete(id) {
    await delay()
    providers = providers.filter((p) => p.id !== id)
  },
}
