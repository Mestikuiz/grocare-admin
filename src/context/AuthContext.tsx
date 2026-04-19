import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getToken, clearToken, api } from '../api/client'

interface AuthUser { id: string; name: string; email: string; phone: string; role: string }
interface AuthCtx { user: AuthUser | null; loading: boolean; logout: () => void; setUser: (u: AuthUser) => void }

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, logout: () => {}, setUser: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      api.get('/users/me')
        .then((res) => {
          const u = res.data.data ?? res.data
          setUser({ id: u.id, phone: u.phone, role: u.role, name: u.name ?? '', email: u.email ?? '' })
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => { clearToken(); setUser(null); window.location.href = '/signin' }

  return <AuthContext.Provider value={{ user, loading, logout, setUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
