import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import './AppShell.css'

const THEME_OPTIONS = [
  { value: 'dark',   icon: '🌙', label: 'Escuro'  },
  { value: 'light',  icon: '☀️', label: 'Claro'   },
  { value: 'system', icon: '⊙',  label: 'Sistema' },
]

export default function AppShell({ children }) {
  const { theme, setTheme } = useTheme()

  async function handleSignOut(e) {
    e.preventDefault()
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
          <div className="theme-switcher">
            {THEME_OPTIONS.map(({ value, icon, label }) => (
              <button
                key={value}
                className={`theme-btn ${theme === value ? 'active' : ''}`}
                onClick={() => setTheme(value)}
                data-tooltip={label}
              >
                {icon}
              </button>
            ))}
          </div>
          <a className="link-signout" href="/auth" onClick={handleSignOut}>Sair</a>
        </div>
      </nav>
      <main className="shell-main">
        {children}
      </main>
    </div>
  )
}
