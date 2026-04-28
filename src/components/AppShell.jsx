import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resetRouteProgress, startRouteProgress } from '../lib/routeProgress'
import './AppShell.css'

export default function AppShell({ children }) {
  const [showSignOut, setShowSignOut] = useState(false)

  async function confirmSignOut() {
    setShowSignOut(false)
    startRouteProgress('/auth')

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch {
      resetRouteProgress()
    }
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

function CheckSmIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
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
