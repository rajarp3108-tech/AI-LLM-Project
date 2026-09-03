const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'aoc_token'

export const token = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (value) => value ? localStorage.setItem(TOKEN_KEY, value) : localStorage.removeItem(TOKEN_KEY)

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token()) headers.Authorization = `Bearer ${token()}`
  const response = await fetch(API + path, { ...opts, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`)
  return data
}

export const api = {
  register: (body) => req('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => req('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/api/auth/me'),

  chats: () => req('/api/chats'),
  newChat: (title = 'New Chat') => req('/api/chats', { method: 'POST', body: JSON.stringify({ title }) }),
  chatMessages: (id) => req(`/api/chats/${id}/messages`),
  renameChat: (id, title) => req(`/api/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteChat: (id) => req(`/api/chats/${id}`, { method: 'DELETE' }),

  tasks: (chatId) => req('/api/tasks' + (chatId ? `?chatId=${encodeURIComponent(chatId)}` : '')),
  addTask: (body) => req('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => req(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id) => req(`/api/tasks/${id}`, { method: 'DELETE' }),

  documents: () => req('/api/documents'),
  upload: async (file, chatId, scope = 'chat') => {
    const form = new FormData()
    form.append('document', file)
    form.append('scope', scope)
    if (chatId) form.append('chatId', chatId)
    return req('/api/documents', { method: 'POST', body: form })
  },
  deleteDocument: (id) => req(`/api/documents/${id}`, { method: 'DELETE' }),
}

export { API }
