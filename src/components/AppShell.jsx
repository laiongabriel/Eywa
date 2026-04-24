import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AppShell.css'

export default function AppShell({ children }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.replace('/auth')
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
        <button className="btn-signout" onClick={handleSignOut}>Sair</button>
      </nav>
      <main className="shell-main">
        {children}
      </main>
    </div>
  )
}
