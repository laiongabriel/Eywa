import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import './AppShell.css'

const THEMES = [
  { value: 'light', label: 'Claro'  },
  { value: 'dark',  label: 'Escuro' },
]

export default function AppShell({ children }) {
  const { theme, setTheme } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const themeRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function confirmSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="shell">
      <nav className="shell-nav">
        <span className="shell-logo">Eywa</span>
        <div className="shell-nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Tarefas
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Agenda
          </NavLink>
        </div>
        <div className="shell-nav-right">
          {/* Theme dropdown */}
          <div className="theme-dropdown" ref={themeRef}>
            <button
              className={`theme-toggle ${themeOpen ? 'open' : ''}`}
              onClick={() => setThemeOpen(v => !v)}
              aria-label="Tema"
            >
              {theme === 'dark'  && <MoonIcon />}
              {theme === 'light' && <SunIcon />}
            </button>
            {themeOpen && (
              <div className="theme-menu" role="menu">
                {THEMES.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`theme-option ${theme === value ? 'active' : ''}`}
                    onClick={() => { setTheme(value); setThemeOpen(false) }}
                    role="menuitem"
                  >
                    <span className="theme-option-icon">
                      {value === 'dark'  && <MoonIcon />}
                      {value === 'light' && <SunIcon />}
                    </span>
                    {label}
                    {theme === value && <span className="theme-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sign out */}
          <button className="btn-signout" onClick={() => setShowSignOut(true)}>
            Sair
          </button>
        </div>
      </nav>

      <main className="shell-main">{children}</main>

      {/* Sign-out confirmation modal */}
      {showSignOut && (
        <div className="signout-overlay" onClick={() => setShowSignOut(false)}>
          <div
            className="signout-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="signout-title">Sair</h2>
            <p className="signout-body">Tem certeza que deseja sair?</p>
            <div className="signout-actions">
              <button className="signout-cancel" onClick={() => setShowSignOut(false)}>
                <XSmIcon /> Cancelar
              </button>
              <button className="signout-confirm" onClick={confirmSignOut}>
                <CheckSmIcon /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 9.5A5.5 5.5 0 0 0 12.5 7c0-.35-.03-.7-.1-1.03A4 4 0 0 1 5.53 2.6 5.5 5.5 0 0 0 3 9.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="2.25" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7.5 1.5v1.25M7.5 12.25V13.5M1.5 7.5h1.25M12.25 7.5H13.5M3.14 3.14l.88.88M11.1 11.1l.88.88M11.1 3.9l-.88.88M4.02 11.1l-.88.88" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function XSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function CheckSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 6l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
