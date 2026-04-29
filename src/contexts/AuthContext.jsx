/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still resolving
  const [username, setUsername] = useState(null)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    async function fetchProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle()
      if (data?.username) setUsername(data.username)
      setProfileReady(true)
    }

    // loading = session === undefined. Resolves as soon as either source fires.
    // onAuthStateChange fires INITIAL_SESSION from localStorage almost synchronously.
    // getSession() is a fallback (may do a network round-trip to refresh the token).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(s => s !== undefined ? s : (session ?? null))
      if (session) fetchProfile(session.user.id)
      else setProfileReady(true) // no session — nothing to fetch
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      if (session) fetchProfile(session.user.id)
      else {
        setUsername(null)
        setProfileReady(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function updateProfile({ username: u } = {}) {
    if (u !== undefined) setUsername(u)
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, username, profileReady, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
