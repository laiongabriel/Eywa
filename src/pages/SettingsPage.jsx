import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { User, Palette, SlidersHorizontal, ChevronLeft, Camera, Eye, EyeOff } from 'lucide-react'
import './SettingsPage.css'

// ── Shared: deterministic avatar color (mirrors UserMenu) ─────────────────
function avatarColor(str) {
  const palette = [
    '#4a7fe0', '#d97706', '#10b981', '#8b5cf6',
    '#ef4444', '#06b6d4', '#f59e0b', '#6366f1',
  ]
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

// ── Avatar component ───────────────────────────────────────────────────────
function ProfileAvatar({ username, avatarUrl, onUpload, uploading }) {
  const inputRef = useRef(null)
  const initial  = (username || '?')[0].toUpperCase()
  const bgColor  = username ? avatarColor(username) : '#4a7fe0'

  return (
    <div className="sp-avatar-wrap">
      <button
        className="sp-avatar"
        type="button"
        aria-label="Trocar foto de perfil"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {avatarUrl
          ? <img className="sp-avatar-img" src={avatarUrl} alt={username ?? 'Avatar'} />
          : <span className="sp-avatar-initial" style={{ background: bgColor }}>{initial}</span>
        }
        <span className="sp-avatar-overlay" aria-hidden="true">
          {uploading
            ? <span className="sp-avatar-spinner" />
            : <Camera size={22} strokeWidth={2} />
          }
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <span className="sp-avatar-hint">Clique para trocar a foto</span>
    </div>
  )
}

// ── Section: Perfil ────────────────────────────────────────────────────────
function SectionPerfil() {
  const { session, username, avatarUrl, updateProfile } = useAuth()
  const { addToast } = useToast()

  // Username
  const [newUsername, setNewUsername]     = useState(username ?? '')
  const [savingUsername, setSavingUsername] = useState(false)

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Email
  const [newEmail, setNewEmail]         = useState('')
  const [savingEmail, setSavingEmail]   = useState(false)
  const [emailSent, setEmailSent]       = useState(false)

  // Password
  const [currentPw, setCurrentPw]       = useState('')
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw]         = useState(false)
  const [savingPw, setSavingPw]           = useState(false)

  async function handleSaveUsername() {
    const val = newUsername.trim()
    if (!val || val === username) return
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
      addToast('Nome de usuário inválido — 3 a 20 caracteres (letras, números ou _)')
      return
    }
    setSavingUsername(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: val })
        .eq('id', session.user.id)
      if (error) {
        if (error.code === '23505') addToast('Esse nome de usuário já está em uso')
        else addToast('Erro ao salvar nome de usuário')
      } else {
        updateProfile({ username: val })
        addToast('Nome de usuário atualizado')
      }
    } finally {
      setSavingUsername(false)
    }
  }

  async function handleUploadAvatar(file) {
    if (file.size > 5 * 1024 * 1024) {
      addToast('Imagem muito grande — máximo 5 MB')
      return
    }
    setUploadingAvatar(true)
    try {
      const ext  = file.name.split('.').pop().toLowerCase()
      const path = `${session.user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { addToast('Erro ao enviar a foto'); return }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Bust cache with timestamp
      const url = `${publicUrl}?t=${Date.now()}`
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', session.user.id)
      if (dbErr) { addToast('Erro ao salvar a foto'); return }

      updateProfile({ avatarUrl: url })
      addToast('Foto de perfil atualizada')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveEmail() {
    const val = newEmail.trim()
    if (!val) return
    setSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: val })
      if (error) addToast('Erro ao atualizar e-mail')
      else { setEmailSent(true); setNewEmail('') }
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleSavePassword() {
    if (!currentPw || !newPw || !confirmPw) return
    if (newPw !== confirmPw) { addToast('As senhas não coincidem'); return }
    if (newPw.length < 8)    { addToast('A nova senha deve ter pelo menos 8 caracteres'); return }
    setSavingPw(true)
    try {
      // Verify current password first
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPw,
      })
      if (authErr) { addToast('Senha atual incorreta'); return }

      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) addToast('Erro ao atualizar senha')
      else {
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        addToast('Senha atualizada com sucesso')
      }
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Perfil</h2>

      {/* Avatar */}
      <ProfileAvatar
        username={username}
        avatarUrl={avatarUrl}
        onUpload={handleUploadAvatar}
        uploading={uploadingAvatar}
      />

      {/* Username */}
      <div className="sp-group">
        <h3 className="sp-group-title">Nome de usuário</h3>
        <div className="sp-field-row">
          <input
            className="sp-input"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder="usuario"
            maxLength={20}
            autoComplete="off"
          />
          <button
            className="sp-btn-primary"
            onClick={handleSaveUsername}
            disabled={savingUsername || !newUsername.trim() || newUsername.trim() === username}
          >
            {savingUsername ? '…' : 'Salvar'}
          </button>
        </div>
        <p className="sp-hint">3 a 20 caracteres: letras, números ou _</p>
      </div>

      {/* Email */}
      <div className="sp-group">
        <h3 className="sp-group-title">E-mail</h3>
        <p className="sp-current-value">{session?.user?.email}</p>
        {emailSent
          ? <p className="sp-success">Confirmação enviada. Verifique sua caixa de entrada.</p>
          : (
            <>
              <div className="sp-field-row">
                <input
                  className="sp-input"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="novo@email.com"
                  autoComplete="off"
                />
                <button
                  className="sp-btn-primary"
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !newEmail.trim()}
                >
                  {savingEmail ? '…' : 'Alterar'}
                </button>
              </div>
              <p className="sp-hint">Um link de confirmação será enviado para o novo endereço.</p>
            </>
          )
        }
      </div>

      {/* Password */}
      <div className="sp-group">
        <h3 className="sp-group-title">Senha</h3>
        <div className="sp-pw-fields">
          <div className="sp-pw-row">
            <input
              className="sp-input sp-input--pw"
              type={showCurrentPw ? 'text' : 'password'}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Senha atual"
              autoComplete="current-password"
            />
            <button
              className="sp-pw-eye"
              type="button"
              onClick={() => setShowCurrentPw(v => !v)}
              aria-label={showCurrentPw ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showCurrentPw ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
            </button>
          </div>
          <div className="sp-pw-row">
            <input
              className="sp-input sp-input--pw"
              type={showNewPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Nova senha (mín. 8 caracteres)"
              autoComplete="new-password"
            />
            <button
              className="sp-pw-eye"
              type="button"
              onClick={() => setShowNewPw(v => !v)}
              aria-label={showNewPw ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showNewPw ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
            </button>
          </div>
          <input
            className="sp-input"
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Confirmar nova senha"
            autoComplete="new-password"
          />
        </div>
        <button
          className="sp-btn-primary sp-btn-block"
          onClick={handleSavePassword}
          disabled={savingPw || !currentPw || !newPw || !confirmPw}
        >
          {savingPw ? 'Salvando…' : 'Atualizar senha'}
        </button>
      </div>
    </div>
  )
}

// ── Section: Aparência ─────────────────────────────────────────────────────
function SectionAparencia() {
  const { theme, setTheme } = useSettings()

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Aparência</h2>

      <div className="sp-group">
        <h3 className="sp-group-title">Tema</h3>
        <div className="sp-option-group">
          {[
            { value: 'dark',   label: 'Escuro' },
            { value: 'light',  label: 'Claro'  },
            { value: 'system', label: 'Sistema' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`sp-option-btn${theme === opt.value ? ' active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="sp-hint">
          {theme === 'system' ? 'Segue a preferência do sistema operacional.' : ''}
        </p>
      </div>
    </div>
  )
}

// ── Section: Preferências ──────────────────────────────────────────────────
function SectionPreferencias() {
  const { weekStartsOn, setWeekStartsOn, language, setLanguage, soundEnabled, setSoundEnabled } = useSettings()

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Preferências</h2>

      <div className="sp-group">
        <h3 className="sp-group-title">Início da semana</h3>
        <div className="sp-option-group">
          {[
            { value: 'sunday',   label: 'Domingo' },
            { value: 'monday',   label: 'Segunda-feira' },
            { value: 'saturday', label: 'Sábado' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`sp-option-btn${weekStartsOn === opt.value ? ' active' : ''}`}
              onClick={() => setWeekStartsOn(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sp-group">
        <h3 className="sp-group-title">Idioma</h3>
        <div className="sp-option-group">
          <button
            className={`sp-option-btn${language === 'pt' ? ' active' : ''}`}
            onClick={() => setLanguage('pt')}
          >
            Português
          </button>
          <button
            className="sp-option-btn sp-option-btn--disabled"
            disabled
          >
            English
            <span className="sp-badge-soon">em breve</span>
          </button>
        </div>
      </div>

      <div className="sp-group">
        <h3 className="sp-group-title">Sons</h3>
        <div className="sp-toggle-row">
          <span className="sp-toggle-label">Sons de interface</span>
          <button
            className={`sp-toggle${soundEnabled ? ' active' : ''}`}
            role="switch"
            aria-checked={soundEnabled}
            onClick={() => setSoundEnabled(v => !v)}
          >
            <span className="sp-toggle-thumb" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Nav config ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'perfil',       label: 'Perfil',       Icon: User              },
  { id: 'aparencia',    label: 'Aparência',    Icon: Palette           },
  { id: 'preferencias', label: 'Preferências', Icon: SlidersHorizontal },
]

// ── Main page ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active, setActive] = useState('perfil')
  const navigate = useNavigate()

  return (
    <div className="sp-root">
      <div className="sp-layout">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sp-sidebar">
          <div className="sp-sidebar-header">
            <button
              className="sp-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="sp-sidebar-title">Configurações</span>
          </div>

          <nav className="sp-nav">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`sp-nav-item${active === id ? ' active' : ''}`}
                onClick={() => setActive(id)}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="sp-content">
          {active === 'perfil'       && <SectionPerfil />}
          {active === 'aparencia'    && <SectionAparencia />}
          {active === 'preferencias' && <SectionPreferencias />}
        </div>
      </div>
    </div>
  )
}
