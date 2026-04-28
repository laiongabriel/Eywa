import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Settings, LogOut } from 'lucide-react'
import './UserMenu.css'

function getAvatarUrl(name) {
  const validStyles = ['notionists','adventurer','micah','pixel-art','shapes','fun-emoji']
  const stored = localStorage.getItem('eywa:avatarStyle')
  const style = validStyles.includes(stored) ? stored : 'notionists'
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name || '?')}`
}

export default function UserMenu({ onSignOut }) {
  const { username, session } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const email = session?.user?.email ?? ''

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Menu do usuário"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img
          className="user-avatar-img"
          src={getAvatarUrl(username)}
          alt={username ?? 'Avatar'}
        />
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-header">
            <span className="user-dropdown-name">{username}</span>
            {email && <span className="user-dropdown-email">{email}</span>}
          </div>

          <div className="user-dropdown-divider" />

          <button
            className="user-dropdown-item"
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/settings') }}
          >
            <Settings size={15} strokeWidth={2} />
            Configurações
          </button>

          <button
            className="user-dropdown-item user-dropdown-item--signout"
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut() }}
          >
            <LogOut size={15} strokeWidth={2} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
