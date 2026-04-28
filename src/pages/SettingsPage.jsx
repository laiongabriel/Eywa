import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { User, SlidersHorizontal, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import './SettingsPage.css'

// ── DiceBear avatar helpers ────────────────────────────────────────────────
const DICEBEAR_STYLES = [
  { id: 'notionists', label: 'Notionists' },
  { id: 'adventurer', label: 'Aventureiro' },
  { id: 'micah',      label: 'Micah'       },
  { id: 'pixel-art',  label: 'Pixel'       },
  { id: 'shapes',     label: 'Shapes'      },
  { id: 'fun-emoji',  label: 'Emoji'       },
]

function dicebearUrl(name, style) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name || '?')}`
}

function getAvatarStyle() {
  const stored = localStorage.getItem('eywa:avatarStyle')
  return DICEBEAR_STYLES.some(s => s.id === stored) ? stored : 'notionists'
}

// ── Avatar component ───────────────────────────────────────────────────────
function ProfileAvatar({ username }) {
  const [style, setStyle] = useState(getAvatarStyle)

  function handleStyleChange(s) {
    setStyle(s)
    localStorage.setItem('eywa:avatarStyle', s)
  }

  return (
    <div className="sp-avatar-wrap">
      <div className="sp-avatar">
        <img src={dicebearUrl(username, style)} alt="Avatar" />
      </div>
      <div className="sp-avatar-styles">
        {DICEBEAR_STYLES.map(({ id }) => (
          <button
            key={id}
            type="button"
            className={`sp-avatar-style-btn${style === id ? ' active' : ''}`}
            onClick={() => handleStyleChange(id)}
            aria-label={id}
          >
            <img src={dicebearUrl(username, id)} alt={id} />
          </button>
        ))}
      </div>
      <span className="sp-avatar-hint">Escolha seu estilo de avatar</span>
    </div>
  )
}

// ── Section: Perfil ────────────────────────────────────────────────────────
function SectionPerfil() {
  const { session, username, updateProfile } = useAuth()
  const { addToast } = useToast()

  // Username
  const [newUsername, setNewUsername]     = useState(username ?? '')
  const [savingUsername, setSavingUsername] = useState(false)

  // Email
  const [newEmail, setNewEmail]         = useState('')
  const [savingEmail, setSavingEmail]   = useState(false)
  const [emailSent, setEmailSent]       = useState(false)

  // Password
  const [currentPw, setCurrentPw]         = useState('')
  const [newPw, setNewPw]                 = useState('')
  const [confirmPw, setConfirmPw]         = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw]         = useState(false)
  const [savingPw, setSavingPw]           = useState(false)
  const [showForgotConfirm, setShowForgotConfirm] = useState(false)

  async function handleSaveUsername() {
    const val = newUsername.trim()
    if (!val || val === username) return
    if (val.length < 3 || val.length > 30) {
      addToast('Nome deve ter entre 3 e 30 caracteres')
      return
    }
    setSavingUsername(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: val })
        .eq('id', session.user.id)
      if (error) {
        if (error.code === '23505') addToast('Esse nome já está em uso')
        else addToast('Erro ao salvar nome')
      } else {
        updateProfile({ username: val })
        addToast('Nome atualizado', 'success')
      }
    } finally {
      setSavingUsername(false)
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
        addToast('Senha atualizada com sucesso', 'success')
      }
    } finally {
      setSavingPw(false)
    }
  }

  async function handleSendForgotEmail() {
    const email = session?.user?.email
    if (!email) return
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) addToast('Erro ao enviar o e-mail')
      else {
        setShowForgotConfirm(false)
        addToast('Link de redefinição enviado para ' + email, 'success')
      }
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Perfil</h2>

      {/* Avatar */}
      <ProfileAvatar username={username} />

      {/* Username */}
      <div className="sp-group">
        <h3 className="sp-group-title">Mudar nome de usuário</h3>
        <form
          className="sp-field-row"
          onSubmit={e => { e.preventDefault(); handleSaveUsername() }}
        >
          <input
            className="sp-input"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder={username ?? 'Seu nome'}
            maxLength={30}
            autoComplete="off"
          />
          <button
            className="sp-btn-save"
            type="submit"
            disabled={savingUsername || !newUsername.trim() || newUsername.trim() === username}
          >
            {savingUsername ? '…' : 'Salvar'}
          </button>
        </form>
        <p className="sp-hint">Entre 3 e 30 caracteres.</p>
      </div>

      {/* Email */}
      <div className="sp-group">
        <h3 className="sp-group-title">Mudar e-mail</h3>
        <p className="sp-current-value">{session?.user?.email}</p>
        {emailSent
          ? <p className="sp-success">Confirmação enviada. Verifique sua caixa de entrada.</p>
          : (
            <form
              className="sp-form-block"
              onSubmit={e => { e.preventDefault(); handleSaveEmail() }}
            >
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
                  className="sp-btn-save"
                  type="submit"
                  disabled={savingEmail || !newEmail.trim()}
                >
                  {savingEmail ? '…' : 'Alterar'}
                </button>
              </div>
              <p className="sp-hint">Um link de confirmação será enviado para o novo endereço.</p>
            </form>
          )
        }
      </div>

      {/* Password */}
      <div className="sp-group">
        <h3 className="sp-group-title">Mudar senha</h3>
        {showForgotConfirm ? (
          <div className="sp-forgot-confirm">
            <p className="sp-hint">
              Vamos enviar um link para <strong>{session?.user?.email}</strong> para você redefinir sua senha.
            </p>
            <div className="sp-pw-actions">
              <button
                className="sp-btn-save"
                type="button"
                disabled={savingPw}
                onClick={handleSendForgotEmail}
              >
                {savingPw ? 'Enviando…' : 'Enviar link'}
              </button>
              <button
                type="button"
                className="sp-link-btn"
                onClick={() => setShowForgotConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <form
            className="sp-form-block"
            onSubmit={e => { e.preventDefault(); handleSavePassword() }}
          >
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
              <button
                type="button"
                className="sp-link-btn"
                onClick={() => setShowForgotConfirm(true)}
              >
                Esqueceu a senha?
              </button>
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
            <div className="sp-pw-actions">
              <button
                className="sp-btn-save"
                type="submit"
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
              >
                {savingPw ? 'Salvando…' : 'Atualizar senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Section: Preferências ──────────────────────────────────────────────────
function SectionPreferencias() {
  const { theme, setTheme, weekStartsOn, setWeekStartsOn, language, setLanguage, soundEnabled, setSoundEnabled } = useSettings()

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Preferências</h2>

      <div className="sp-group">
        <h3 className="sp-group-title">Tema</h3>
        <div className="sp-option-group">
          {[
            { value: 'dark',   label: 'Escuro'  },
            { value: 'light',  label: 'Claro'   },
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
        {theme === 'system' && (
          <p className="sp-hint">Segue a preferência do sistema operacional.</p>
        )}
      </div>

      <div className="sp-group">
        <h3 className="sp-group-title">Início da semana</h3>
        <div className="sp-option-group">
          {[
            { value: 'sunday',   label: 'Domingo'       },
            { value: 'monday',   label: 'Segunda-feira' },
            { value: 'saturday', label: 'Sábado'        },
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
          <button className="sp-option-btn sp-option-btn--disabled" disabled>
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
            onClick={() => setSoundEnabled(!soundEnabled)}
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
          {active === 'preferencias' && <SectionPreferencias />}
        </div>
      </div>
    </div>
  )
}
