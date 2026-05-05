import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_USERS_MAP } from '@/lib/mock'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInMock: (userId: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (MOCK_MODE) {
      const saved = sessionStorage.getItem('htf_mock_user')
      if (saved) setUser(JSON.parse(saved))
      setLoading(false)
      return
    }

    // Real Supabase session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(supabaseUserId: string) {
    const { data } = await supabase!
      .from('users')
      .select('*, location:locations(*)')
      .eq('id', supabaseUserId)
      .single()
    setUser(data ?? null)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: 'Geen Supabase verbinding' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  function signInMock(userId: string) {
    const profile = MOCK_USERS_MAP[userId]
    if (!profile) return
    sessionStorage.setItem('htf_mock_user', JSON.stringify(profile))
    setUser(profile)
  }

  async function signOut() {
    if (MOCK_MODE) {
      sessionStorage.removeItem('htf_mock_user')
      setUser(null)
      return
    }
    await supabase!.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInMock, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
