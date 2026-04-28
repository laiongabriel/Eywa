/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState(null)

  useEffect(() => {
    async function fetchProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle()
      if (data?.username) setUsername(data.username)
    }

    // loading is controlled exclusively by getSession — it becomes false
    // as soon as the initial session check resolves, regardless of result.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) fetchProfile(session.user.id)
    })

    // onAuthStateChange handles subsequent events (login, logout, token refresh)
    // but never touches loading — it was already resolved by getSession above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setUsername(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  function updateProfile({ username: u } = {}) {
    if (u !== undefined) setUsername(u)
  }

  return (
    <AuthContext.Provider value={{ session, loading, username, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
