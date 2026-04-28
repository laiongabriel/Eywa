import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { useT } from '../hooks/useT'
import { supabase } from '../lib/supabase'
import { AvatarImg, Spinner } from '../lib/ui'
import { User, SlidersHorizontal, ChevronLeft, Eye, EyeOff, Moon, Sun, Monitor } from 'lucide-react'
import './SettingsPage.css'

// ── DiceBear avatar helpers ────────────────────────────────────────────────
const DICEBEAR_STYLES = [
  { id: 'notionists', label: 'Notionists' },
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'micah',      label: 'Micah'      },
  { id: 'pixel-art',  label: 'Pixel'      },
  { id: 'shapes',     label: 'Shapes'     },
  { id: 'fun-emoji',  label: 'Emoji'      },
]

function dicebearUrl(name, style) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name || '?')}`
}

// ── Avatar component ───────────────────────────────────────────────────────
function ProfileAvatar({ username, avatarStyle, onStyleSaved }) {
  const t = useT()

  return (
    <div className="sp-avatar-wrap">
      <div className="sp-avatar">
        <AvatarImg src={dicebearUrl(username, avatarStyle)} alt="Avatar" size={80} />
      </div>
      <div className="sp-avatar-styles">
        {DICEBEAR_STYLES.map(({ id }) => (
          <button
            key={id}
            type="button"
            className={`sp-avatar-style-btn${avatarStyle === id ? ' active' : ''}`}
            onClick={() => onStyleSaved(id)}
            aria-label={id}
          >
            <AvatarImg src={dicebearUrl(username, id)} alt={id} size={42} />
          </button>
        ))}
      </div>
      <span className="sp-avatar-hint">{t('sp.avatarHint')}</span>
    </div>
  )
}

// ── Section: Perfil ────────────────────────────────────────────────────────
function SectionPerfil() {
  const { session, username, avatarStyle, updateProfile } = useAuth()
  const { addToast } = useToast()
  const t = useT()

  // Username
  const [newUsername, setNewUsername]       = useState(username ?? '')
  const [savingUsername, setSavingUsername] = useState(false)

  // Email
  const [newEmail, setNewEmail]       = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSent, setEmailSent]     = useState(false)

  // Password
  const [currentPw, setCurrentPw]         = useState('')
  const [newPw, setNewPw]                 = useState('')
  const [confirmPw, setConfirmPw]         = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw]         = useState(false)
  const [savingPw, setSavingPw]           = useState(false)
  const [showForgotConfirm, setShowForgotConfirm] = useState(false)

  async function handleSaveAvatarStyle(styleId) {
    updateProfile({ avatarStyle: styleId })
    await supabase.from('profiles').update({ avatar_style: styleId }).eq('id', session.user.id)
  }

  async function handleSaveUsername() {
    const val = newUsername.trim()
    if (!val || val === username) return
    if (val.length < 3 || val.length > 30) {
      addToast(t('sp.usernameHint'))
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
        addToast(t('sp.username') + ' atualizado', 'success')
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
        addToast(t('sp.sendLink') + ' enviado para ' + email, 'success')
      }
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">{t('settings.profile')}</h2>

      {/* Avatar */}
      <ProfileAvatar
        username={username}
        avatarStyle={avatarStyle}
        onStyleSaved={handleSaveAvatarStyle}
      />

      {/* Username */}
      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.username')}</h3>
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
            {savingUsername ? <><Spinner /> {t('common.saving')}</> : t('common.save')}
          </button>
        </form>
        <p className="sp-hint">{t('sp.usernameHint')}</p>
      </div>

      {/* Email */}
      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.email')}</h3>
        <p className="sp-current-value">{session?.user?.email}</p>
        {emailSent
          ? <p className="sp-success">{t('sp.emailSent')}</p>
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
                  placeholder={t('sp.emailNew')}
                  autoComplete="off"
                />
                <button
                  className="sp-btn-save"
                  type="submit"
                  disabled={savingEmail || !newEmail.trim()}
                >
                  {savingEmail ? <><Spinner /> {t('common.sending')}</> : t('sp.changeEmail')}
                </button>
              </div>
              <p className="sp-hint">{t('sp.emailHint')}</p>
            </form>
          )
        }
      </div>

      {/* Password */}
      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.password')}</h3>
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
                {savingPw ? <><Spinner /> {t('common.sending')}</> : t('sp.sendLink')}
              </button>
              <button
                type="button"
                className="sp-link-btn"
                onClick={() => setShowForgotConfirm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <form
            className="sp-form-block"
            onSubmit={e => { e.preventDefault(); handleSavePassword() }}
          >
            {/* 2-column labeled layout */}
            <div className="sp-labeled-form">
              {/* Current password row */}
              <span className="sp-labeled-form-label">{t('sp.currentPw')}</span>
              <div className="sp-pw-row">
                <input
                  className="sp-input sp-input--pw"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
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

              {/* Forgot password — aligned right col */}
              <span />
              <button
                type="button"
                className="sp-link-btn"
                onClick={() => setShowForgotConfirm(true)}
              >
                {t('sp.forgotPw')}
              </button>

              {/* New password row */}
              <span className="sp-labeled-form-label">{t('sp.newPw')}</span>
              <div className="sp-pw-row">
                <input
                  className="sp-input sp-input--pw"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder={t('sp.newPwHint')}
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

              {/* Confirm password row */}
              <span className="sp-labeled-form-label">{t('sp.confirmPw')}</span>
              <input
                className="sp-input"
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />

              {/* Actions — aligned right col */}
              <span />
              <div className="sp-pw-actions">
                <button
                  className="sp-btn-save"
                  type="submit"
                  disabled={savingPw || !currentPw || !newPw || !confirmPw}
                >
                  {savingPw ? <><Spinner /> {t('common.saving')}</> : t('sp.updatePw')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Section: Preferências ──────────────────────────────────────────────────
function SectionPreferencias() {
  const { session } = useAuth()
  const { theme, setTheme, weekStartsOn, setWeekStartsOn, language, setLanguage, soundEnabled, setSoundEnabled } = useSettings()
  const t = useT()

  async function handleSaveLanguage(lang) {
    setLanguage(lang)
    if (session?.user?.id) {
      await supabase.from('profiles').update({ language: lang }).eq('id', session.user.id)
    }
  }

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">{t('settings.preferences')}</h2>

      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.theme')}</h3>
        <div className="sp-option-group">
          <button
            className={`sp-option-btn${theme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={14} strokeWidth={2} /> {t('sp.dark')}
          </button>
          <button
            className={`sp-option-btn${theme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={14} strokeWidth={2} /> {t('sp.light')}
          </button>
          <button
            className={`sp-option-btn${theme === 'system' ? ' active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={14} strokeWidth={2} /> {t('sp.system')}
          </button>
        </div>
      </div>

      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.weekStart')}</h3>
        <div className="sp-option-group">
          {[
            { value: 'sunday',   label: t('sp.sunday')   },
            { value: 'monday',   label: t('sp.monday')   },
            { value: 'saturday', label: t('sp.saturday') },
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
        <h3 className="sp-group-title">{t('sp.language')}</h3>
        <div className="sp-option-group">
          <button
            className={`sp-option-btn${language === 'pt' ? ' active' : ''}`}
            onClick={() => handleSaveLanguage('pt')}
          >
            Português
          </button>
          <button
            className={`sp-option-btn${language === 'en' ? ' active' : ''}`}
            onClick={() => handleSaveLanguage('en')}
          >
            English
          </button>
        </div>
      </div>

      <div className="sp-group">
        <h3 className="sp-group-title">{t('sp.sounds')}</h3>
        <div className="sp-toggle-row">
          <span className="sp-toggle-label">{t('sp.soundLabel')}</span>
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

// ── Main page ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active, setActive] = useState('perfil')
  const navigate = useNavigate()
  const t = useT()

  const SECTIONS = [
    { id: 'perfil',       label: t('settings.profile'),     Icon: User              },
    { id: 'preferencias', label: t('settings.preferences'), Icon: SlidersHorizontal },
  ]

  return (
    <div className="sp-root">
      <div className="sp-layout">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sp-sidebar">
          <div className="sp-sidebar-header">
            <button
              className="sp-back-btn"
              onClick={() => navigate(-1)}
              aria-label={t('settings.back')}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="sp-sidebar-title">{t('settings.title')}</span>
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
