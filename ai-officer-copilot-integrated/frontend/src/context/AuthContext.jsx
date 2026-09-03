import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setToken, token } from '../services/api.js'

const AuthContext = createContext(null)

function initials(name = 'User') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U'
}

function normalizeUser(user) {
  if (!user) return null
  return { ...user, role: user.role || '', initials: initials(user.name) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let alive = true
    async function boot() {
      if (!token()) { setInitializing(false); return }
      try {
        const data = await api.me()
        if (alive) setUser(normalizeUser(data.user))
      } catch {
        setToken(null)
      } finally {
        if (alive) setInitializing(false)
      }
    }
    boot()
    return () => { alive = false }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const data = await api.login({ email, password })
    setToken(data.token)
    setUser(normalizeUser(data.user))
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    const data = await api.register({ name, email, password, role })
    setToken(data.token)
    setUser(normalizeUser({ ...data.user, role }))
  }, [])

  const loginWithProvider = useCallback(async () => {
    throw new Error('Google/Microsoft sign-in is not configured yet. Use email sign-in for this local build.')
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, loginWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}
