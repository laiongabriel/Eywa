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

    // loading is controlled by whichever resolves first: getSession() or
    // onAuthStateChange's INITIAL_SESSION event. INITIAL_SESSION fires from
    // localStorage almost synchronously; getSession() may do a network call
    // (token refresh). Both set loading=false so the faster one wins.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false) // no-op if getSession already resolved; wins if INITIAL_SESSION fires first
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
