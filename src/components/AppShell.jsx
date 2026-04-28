import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resetRouteProgress, startRouteProgress } from '../lib/routeProgress'
import { Check, X } from 'lucide-react'
import UserMenu from './UserMenu'
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
          <UserMenu onSignOut={() => setShowSignOut(true)} />
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
                <X size={13} strokeWidth={2} aria-hidden="true" /> Cancelar
              </button>
              <button className="signout-confirm" onClick={confirmSignOut}>
                <Check size={13} strokeWidth={2.5} aria-hidden="true" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
