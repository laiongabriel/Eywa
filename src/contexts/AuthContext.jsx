/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [username, setUsername] = useState(null)
  const [avatarStyle, setAvatarStyle] = useState('adventurer-neutral')

  useEffect(() => {
    async function fetchProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_style')
        .eq('id', userId)
        .maybeSingle()
      if (data?.username) setUsername(data.username)
      setAvatarStyle(data?.avatar_style ?? 'adventurer-neutral')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUsername(null); setAvatarStyle('adventurer-neutral') }
    })

    return () => subscription.unsubscribe()
  }, [])

  function updateProfile({ username: u, avatarStyle: as } = {}) {
    if (u  !== undefined) setUsername(u)
    if (as !== undefined) setAvatarStyle(as)
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, username, avatarStyle, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
