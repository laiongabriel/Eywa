import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <span className="dashboard-logo">Eywa</span>
        <button className="btn-signout" onClick={handleSignOut}>Sair</button>
      </header>
      <main className="dashboard-main">
        <p className="dashboard-welcome">
          Olá{session?.user?.email ? `, ${session.user.email}` : ''}
        </p>
        <p className="dashboard-hint">O app está sendo construído. Próximo: lista de tarefas.</p>
      </main>
    </div>
  )
}
