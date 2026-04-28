/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)

function getLS(key, def) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : def
  } catch {
    return def
  }
}

function setLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* noop */ }
}

export function SettingsProvider({ children }) {
  const [theme, setThemeState]               = useState(() => getLS('eywa:theme', 'dark'))
  const [weekStartsOn, setWeekStartsOnState] = useState(() => getLS('eywa:weekStartsOn', 'sunday'))
  const [soundEnabled, setSoundEnabledState] = useState(() => getLS('eywa:soundEnabled', true))

  // Apply theme to document whenever it changes
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      el.dataset.theme = mq.matches ? '' : 'light'
      const handler = (e) => { el.dataset.theme = e.matches ? '' : 'light' }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    el.dataset.theme = theme === 'light' ? 'light' : ''
  }, [theme])

  function setTheme(v)        { setLS('eywa:theme', v);         setThemeState(v) }
  function setWeekStartsOn(v) { setLS('eywa:weekStartsOn', v);  setWeekStartsOnState(v) }
  function setSoundEnabled(v) { setLS('eywa:soundEnabled', v);  setSoundEnabledState(v) }

  return (
    <SettingsContext.Provider value={{
      theme, setTheme,
      weekStartsOn, setWeekStartsOn,
      soundEnabled, setSoundEnabled,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
