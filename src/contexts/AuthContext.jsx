/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [username, setUsername] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    async function fetchProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      if (data?.username) setUsername(data.username)
      setAvatarUrl(data?.avatar_url ?? null)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUsername(null); setAvatarUrl(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Allows settings page to update local state after a successful DB write
  // without triggering a full re-fetch
  function updateProfile({ username: u, avatarUrl: av } = {}) {
    if (u !== undefined) setUsername(u)
    if (av !== undefined) setAvatarUrl(av)
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, username, avatarUrl, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
