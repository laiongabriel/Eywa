import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { Spinner, UserAvatar } from '../lib/ui'
import { User, SlidersHorizontal, ChevronLeft, Moon, Sun, Monitor } from 'lucide-react'
import './SettingsPage.css'

// ── Section: Perfil ────────────────────────────────────────────────────────
function SectionPerfil() {
  const { session, username, updateProfile } = useAuth()
  const { addToast } = useToast()

  // Username (editable)
  const [newUsername, setNewUsername]         = useState(username ?? '')
  const [savingName, setSavingName]           = useState(false)
  const [nameSaved, setNameSaved]             = useState(false)

  // Change password
  const [curPw, setCurPw]                     = useState('')
  const [newPw, setNewPw]                     = useState('')
  const [confirmPw, setConfirmPw]             = useState('')
  const [savingPw, setSavingPw]               = useState(false)
  const [pwError, setPwError]                 = useState(null)
  const [pwSaved, setPwSaved]                 = useState(false)

  // Change email
  const [newEmail, setNewEmail]               = useState('')
  const [savingEmail, setSavingEmail]         = useState(false)
  const [emailSent, setEmailSent]             = useState(false)
  const [emailError, setEmailError]           = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePw, setDeletePw]               = useState('')
  const [deletePwError, setDeletePwError]     = useState(null)
  const [deleting, setDeleting]               = useState(false)

  useEffect(() => { setNewUsername(username ?? '') }, [username])

  async function handleSaveName(e) {
    e?.preventDefault()
    const val = newUsername.trim()
    if (!val || val === (username ?? '')) return
    if (val.length > 50) { addToast('Máximo 50 caracteres'); return }
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles').update({ username: val }).eq('id', session.user.id)
      if (error) { addToast('Erro ao salvar nome'); return }
      updateProfile({ username: val })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    } finally { setSavingName(false) }
  }

  async function handleSavePassword(e) {
    e?.preventDefault()
    if (!curPw || !newPw || !confirmPw) return
    if (newPw !== confirmPw) { setPwError('As senhas não coincidem'); return }
    if (newPw.length < 6) { setPwError('A nova senha deve ter pelo menos 6 caracteres'); return }
    setPwError(null)
    setSavingPw(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: session.user.email, password: curPw,
      })
      if (authErr) { setPwError('Senha atual incorreta'); setSavingPw(false); return }
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { setPwError('Erro ao atualizar senha'); setSavingPw(false); return }
      setCurPw(''); setNewPw(''); setConfirmPw('')
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    } finally { setSavingPw(false) }
  }

  async function handleSaveEmail(e) {
    e?.preventDefault()
    const val = newEmail.trim()
    if (!val) return
    setEmailError(null)
    setSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: val })
      if (error) { setEmailError('Erro ao atualizar email'); setSavingEmail(false); return }
      setEmailSent(true)
      setNewEmail('')
    } finally { setSavingEmail(false) }
  }

  function closeDeleteModal() {
    setShowDeleteModal(false); setDeletePw(''); setDeletePwError(null)
  }

  async function handleDelete(e) {
    e?.preventDefault()
    if (!deletePw.trim()) return
    setDeletePwError(null)
    setDeleting(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: session?.user?.email, password: deletePw,
      })
      if (authErr) { setDeletePwError('Senha incorreta. Tente novamente.'); setDeleting(false); return }
      const { error } = await supabase.rpc('delete_account')
      if (error) { setDeletePwError('Erro ao excluir conta. Tente novamente.'); setDeleting(false); return }
      await supabase.auth.signOut()
    } catch {
      setDeletePwError('Erro ao excluir conta. Tente novamente.')
      setDeleting(false)
    }
  }

  const nameChanged = newUsername.trim() !== (username ?? '')

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Perfil</h2>

      {/* Avatar */}
      <div className="sp-group">
        <UserAvatar username={username} size={80} />
      </div>

      {/* Username (editable) */}
      <div className="sp-group">
        <label className="sp-field-label">Nome de usuário</label>
        <form className="sp-field-row" onSubmit={handleSaveName}>
          <input
            className="sp-input"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder="Nome de usuário"
            maxLength={50}
            autoComplete="off"
          />
          {nameChanged && (
            <button
              className="sp-btn-save"
              type="submit"
              disabled={savingName || !newUsername.trim()}
            >
              {savingName ? <><Spinner /> Salvando…</> : 'Salvar'}
            </button>
          )}
        </form>
        {nameSaved
          ? <p className="sp-field-success">Salvo</p>
          : <p className="sp-hint">Aparece em todo o app. Entre 1 e 50 caracteres.</p>
        }
      </div>

      {/* Email (read-only) */}
      <div className="sp-group">
        <label className="sp-field-label">Email</label>
        <p className="sp-field-value">{session?.user?.email}</p>
      </div>

      {/* Change email */}
      <div className="sp-group">
        <h3 className="sp-group-title">Alterar email</h3>
        {emailSent ? (
          <p className="sp-field-success">Confirmação enviada para o novo endereço.</p>
        ) : (
          <form className="sp-field-row" onSubmit={handleSaveEmail}>
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
              {savingEmail ? <><Spinner /> Enviando…</> : 'Alterar'}
            </button>
          </form>
        )}
        {emailError && <p className="sp-field-error">{emailError}</p>}
        {!emailSent && <p className="sp-hint">Um link de confirmação será enviado para o novo endereço.</p>}
      </div>

      {/* Change password */}
      <div className="sp-group">
        <h3 className="sp-group-title">Alterar senha</h3>
        <form className="sp-form-block" onSubmit={handleSavePassword}>
          <input
            className="sp-input"
            type="password"
            value={curPw}
            onChange={e => setCurPw(e.target.value)}
            placeholder="Senha atual"
            autoComplete="current-password"
          />
          <input
            className="sp-input"
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            autoComplete="new-password"
          />
          <input
            className="sp-input"
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Confirmar nova senha"
            autoComplete="new-password"
          />
          {pwError && <p className="sp-field-error">{pwError}</p>}
          {pwSaved && <p className="sp-field-success">Senha atualizada.</p>}
          <div className="sp-form-actions">
            <button
              className="sp-btn-save"
              type="submit"
              disabled={savingPw || !curPw || !newPw || !confirmPw}
            >
              {savingPw ? <><Spinner /> Salvando…</> : 'Atualizar senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="sp-group">
        <div className="sp-danger-row">
          <div>
            <p className="sp-danger-label">Excluir conta</p>
            <p className="sp-hint" style={{ margin: 0 }}>Remove permanentemente todos os seus dados.</p>
          </div>
          <button className="sp-delete-btn" type="button" onClick={() => setShowDeleteModal(true)}>
            Excluir conta
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeDeleteModal() }}>
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Excluir conta</h2>
              <button className="modal-close" onClick={closeDeleteModal} aria-label="Fechar">✕</button>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }} onSubmit={handleDelete}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="sp-field-label">Para confirmar, digite sua senha:</label>
                <input
                  className="sp-input"
                  type="password"
                  value={deletePw}
                  onChange={e => { setDeletePw(e.target.value); setDeletePwError(null) }}
                  placeholder="Sua senha atual"
                  autoComplete="current-password"
                  autoFocus
                />
                {deletePwError && <p className="sp-field-error" style={{ margin: 0 }}>{deletePwError}</p>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <button type="button" className="btn-cancel" onClick={closeDeleteModal}>Cancelar</button>
                <button
                  type="submit"
                  className="sp-btn-danger"
                  disabled={!deletePw.trim() || deleting}
                >
                  {deleting ? <><Spinner /> Excluindo…</> : 'Excluir minha conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section: Preferências ──────────────────────────────────────────────────
function SectionPreferencias() {
  const { theme, setTheme, weekStartsOn, setWeekStartsOn, soundEnabled, setSoundEnabled } = useSettings()
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  async function handleNotifToggle() {
    if (permission === 'denied') return
    if (notifEnabled) { setNotifEnabled(false); return }
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
    setNotifEnabled(result === 'granted')
  }

  return (
    <div className="sp-section">
      <h2 className="sp-section-title">Preferências</h2>

      <div className="sp-group">
        <h3 className="sp-group-title">Tema</h3>
        <div className="sp-option-group">
          <button
            className={`sp-option-btn${theme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={14} strokeWidth={2} /> Escuro
          </button>
          <button
            className={`sp-option-btn${theme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={14} strokeWidth={2} /> Claro
          </button>
          <button
            className={`sp-option-btn${theme === 'system' ? ' active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={14} strokeWidth={2} /> Sistema
          </button>
        </div>
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

      <div className="sp-group">
        <h3 className="sp-group-title">Notificações</h3>
        <div className="sp-toggle-row" style={{ alignItems: 'flex-start', gap: '1rem' }}>
          <div className="sp-notif-info">
            <span className="sp-toggle-label">Notificações do navegador</span>
            <span className="sp-notif-desc">Receba lembretes mesmo com o app em segundo plano.</span>
          </div>
          <button
            className={`sp-toggle${notifEnabled ? ' active' : ''}`}
            role="switch"
            aria-checked={notifEnabled}
            disabled={permission === 'denied'}
            onClick={handleNotifToggle}
            style={{ flexShrink: 0, marginTop: '0.125rem' }}
          >
            <span className="sp-toggle-thumb" />
          </button>
        </div>
        {permission === 'denied' && (
          <p className="sp-notif-denied">
            Notificações bloqueadas. Para reativar, clique no ícone de cadeado na barra de endereço e permita as notificações para este site.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'perfil',       label: 'Perfil',       Icon: User              },
  { id: 'preferencias', label: 'Preferências', Icon: SlidersHorizontal },
]

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
