import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import './AuthPage.css'

function validatePassword(password, confirm) {
  if (!password) return 'Senha é obrigatória.'
  if (password.length < 6) return 'Mínimo 6 caracteres.'
  if (password !== confirm) return 'As senhas não coincidem.'
  return null
}

function EyeIcon() {
  return <Eye size={16} aria-hidden="true" />
}

function EyeOffIcon() {
  return <EyeOff size={16} aria-hidden="true" />
}

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

// States: 'loading' | 'ready' | 'done' | 'invalid'
export default function ResetPassword() {
  const navigate = useNavigate()

  const [status,   setStatus]   = useState('loading')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [exiting,  setExiting]  = useState(false)

  useEffect(() => {
    // Supabase detects the token_hash in the URL automatically and fires
    // PASSWORD_RECOVERY once the token is exchanged for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
        subscription.unsubscribe()
      }
    })

    // Also check immediately — session may already be set if the page reloaded
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready')
        subscription.unsubscribe()
      }
    })

    // Safety: if token never arrives, show error after 12s
    const timeout = setTimeout(() => {
      setStatus(prev => prev === 'loading' ? 'invalid' : prev)
      subscription.unsubscribe()
    }, 12000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const err = validatePassword(password, confirm)
    if (err) { setError(err); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('Não foi possível redefinir a senha. Tente solicitar um novo link.')
      return
    }

    setStatus('done')
    setTimeout(() => setExiting(true), 2000)
  }

  function handleCardAnimEnd(e) {
    if (e.animationName === 'cardOut') navigate('/')
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="auth-root">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-inner" style={{ alignItems: 'center' }}>
            <svg className="btn-spinner" style={{ width: 28, height: 28 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--color-amber)" strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Verificando link…
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-inner">
            <div className="auth-confirm-box">
              <div className="auth-confirm-icon">⚠</div>
              <h2 className="auth-confirm-title">Link inválido</h2>
              <p className="auth-confirm-sub">
                Este link expirou ou já foi usado. Solicite um novo link de recuperação.
              </p>
            </div>
            <button className="btn-primary" type="button" onClick={() => navigate('/auth')}>
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="auth-root">
        <div className={`auth-card${exiting ? ' exiting' : ''}`} onAnimationEnd={handleCardAnimEnd}>
          <div className="auth-inner">
            <div className="auth-confirm-box">
              <div className="auth-confirm-icon">✓</div>
              <h2 className="auth-confirm-title">Senha redefinida</h2>
              <p className="auth-confirm-sub">
                Sua senha foi atualizada. Entrando no app…
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-inner">

          <div className="auth-logo">
            <span className="auth-logo-text">Eywa</span>
            <p className="auth-tagline">Escolha uma nova senha para sua conta.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            <div className="field-wrap">
              <label className="field-label">Nova senha</label>
              <div className="input-wrap">
                <input
                  className="auth-input with-eye"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nova senha"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  autoComplete="new-password"
                  autoFocus
                />
                <button type="button" className="input-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1} aria-label="Alternar visibilidade">
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="field-wrap">
              <label className="field-label">Confirmar nova senha</label>
              <div className="input-wrap">
                <input
                  className="auth-input with-eye"
                  type={showConf ? 'text' : 'password'}
                  placeholder="Confirmar nova senha"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(null) }}
                  autoComplete="new-password"
                />
                <button type="button" className="input-eye-btn"
                  onClick={() => setShowConf(p => !p)}
                  tabIndex={-1} aria-label="Alternar visibilidade">
                  {showConf ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="auth-server-error" role="alert">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <Spinner /> : 'Redefinir senha'}
            </button>

          </form>

          <div className="auth-mode-switch">
            <button type="button" className="auth-toggle-btn signin-cta"
              onClick={() => navigate('/auth')}>
              Voltar para o login
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
