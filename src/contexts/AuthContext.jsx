/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [username, setUsername] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarStyle, setAvatarStyle] = useState('notionists')

  useEffect(() => {
    async function fetchProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, avatar_style, language')
        .eq('id', userId)
        .maybeSingle()
      if (data?.username) setUsername(data.username)
      setAvatarUrl(data?.avatar_url ?? null)
      setAvatarStyle(data?.avatar_style ?? 'notionists')
      // Sync language to localStorage so SettingsContext can pick it up
      if (data?.language) {
        const next = JSON.stringify(data.language)
        if (localStorage.getItem('eywa:language') !== next) {
          localStorage.setItem('eywa:language', next)
          window.dispatchEvent(new StorageEvent('storage', { key: 'eywa:language', newValue: next }))
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUsername(null); setAvatarUrl(null); setAvatarStyle('notionists') }
    })

    return () => subscription.unsubscribe()
  }, [])

  function updateProfile({ username: u, avatarUrl: av, avatarStyle: as } = {}) {
    if (u  !== undefined) setUsername(u)
    if (av !== undefined) setAvatarUrl(av)
    if (as !== undefined) setAvatarStyle(as)
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, username, avatarUrl, avatarStyle, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
