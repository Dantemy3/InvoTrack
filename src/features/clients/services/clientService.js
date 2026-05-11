import { MOCK_CLIENTS } from '@/lib/mockData'

let clients = [...MOCK_CLIENTS]

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms))
}

export const clientService = {
  async getAll({ search, page = 1, pageSize = 20 } = {}) {
    await delay()
    let filtered = [...clients]
    if (search) filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), count: filtered.length }
  },

  async getById(id) {
    await delay()
    return clients.find((c) => c.id === id) || null
  },

  async create(client) {
    await delay()
    const newClient = { ...client, id: `c-${Date.now()}`, created_at: new Date().toISOString() }
    clients = [newClient, ...clients]
    return newClient
  },

  async update(id, updates) {
    await delay()
    clients = clients.map((c) => c.id === id ? { ...c, ...updates } : c)
    return clients.find((c) => c.id === id)
  },

  async delete(id) {
    await delay()
    clients = clients.filter((c) => c.id !== id)
  },
}
