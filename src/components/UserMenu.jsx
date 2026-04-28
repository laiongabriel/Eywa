import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Settings, LogOut } from 'lucide-react'
import './UserMenu.css'

function avatarColor(str) {
  const palette = ['#4a7fe0', '#d97706', '#3a6fd0', '#b85e00']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

export default function UserMenu({ onSignOut }) {
  const { username, avatarUrl, session } = useAuth()
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

  const initial  = (username || '?')[0].toUpperCase()
  const bgColor  = username ? avatarColor(username) : '#4a7fe0'
  const email    = session?.user?.email ?? ''

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Menu do usuário"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl
          ? <img className="user-avatar-img" src={avatarUrl} alt={username ?? 'Avatar'} />
          : <span className="user-avatar-initial" style={{ background: bgColor }}>{initial}</span>
        }
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
