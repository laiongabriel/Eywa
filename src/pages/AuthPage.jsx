import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './AuthPage.css'

// ── Error translation ────────────────────────────────────────────────────────
function translateError(msg) {
  if (!msg) return 'Algo deu errado. Tente novamente.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email, usuário ou senha incorretos.'
  if (m.includes('email not confirmed'))
    return 'Confirme seu email antes de entrar.'
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Este email já está cadastrado.'
  if (m.includes('password should be at least') || m.includes('weak password'))
    return 'Senha muito fraca. Use pelo menos 6 caracteres.'
  if (m.includes('signup disabled'))
    return 'Cadastro temporariamente desativado.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos.'
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'Erro de conexão. Verifique sua internet.'
  return 'Algo deu errado. Tente novamente.'
}

// ── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(password)).length
  if (password.length < 6)              return { level: 1, label: 'Fraca', color: '#f87171' }
  if (password.length >= 12 && classes >= 3) return { level: 3, label: 'Forte', color: '#6ee7b7' }
  if (password.length >=  8 && classes >= 2) return { level: 2, label: 'Média', color: '#fbbf24' }
  return { level: 1, label: 'Fraca', color: '#f87171' }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateField(field, value, allValues, mode) {
  switch (field) {
    case 'username':
      if (!value) return 'Nome de usuário é obrigatório.'
      if (value.length < 3) return 'Mínimo 3 caracteres.'
      if (value.length > 20) return 'Máximo 20 caracteres.'
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Apenas letras, números e underscores.'
      return null
    case 'email':
      if (mode === 'signin') {
        if (!value) return 'Email ou nome de usuário é obrigatório.'
        // If it looks like a username (not an email), require at least 3 chars
        if (!value.includes('@') && value.length < 3)
          return 'Mínimo 3 caracteres.'
        return null
      }
      if (!value) return 'Email é obrigatório.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido.'
      return null
    case 'password':
      if (!value) return 'Senha é obrigatória.'
      if (value.length < 6) return 'Mínimo 6 caracteres.'
      return null
    case 'confirmPassword':
      if (!value) return 'Confirme sua senha.'
      if (value !== allValues.password) return 'As senhas não coincidem.'
      return null
    default:
      return null
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  // mode: 'signin' | 'signup' | 'forgot' | 'forgot-sent' | 'choose-username'
  const [mode, setMode]               = useState('signin')
  const [animKey, setAnimKey]         = useState(0)
  const [fields, setFields]           = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [touched, setTouched]         = useState({})
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState(null)
  const [info, setInfo]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [shake, setShake]             = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [exiting, setExiting]           = useState(false)
  const innerRef          = useRef(null)
  const profileCheckedRef = useRef(false)
  const exitPathRef       = useRef('/')

  function navigateTo(path) {
    exitPathRef.current = path
    setExiting(true)
  }

  function handleCardAnimEnd(e) {
    if (e.animationName === 'cardOut') navigate(exitPathRef.current)
  }

  // ── Session-based navigation ───────────────────────────────────────────────
  // This fires AFTER AuthContext confirms the session state, ensuring
  // ProtectedRoute never sees a stale null-session when we navigate.
  // Handles all auth methods: Google popup, email signin, any future provider.
  useEffect(() => {
    if (authLoading || !session) return
    if (profileCheckedRef.current) return
    profileCheckedRef.current = true

    supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.username) {
          navigateTo('/')
        } else {
          // New Google user or user without a profile — ask for username
          setMode('choose-username')
          setAnimKey(k => k + 1)
        }
      })
      .catch(() => navigateTo('/'))
  }, [session, authLoading, navigate])

  // Shake cleanup via animationend (avoids re-triggering cardIn)
  useEffect(() => {
    if (!shake) return
    const el = innerRef.current
    if (!el) return
    const onEnd = (e) => {
      if (e.animationName === 'shake') {
        setShake(false)
        el.removeEventListener('animationend', onEnd)
      }
    }
    el.addEventListener('animationend', onEnd)
    return () => el.removeEventListener('animationend', onEnd)
  }, [shake])

  const activeFields = {
    signin: ['email', 'password'],
    signup: ['email', 'password', 'confirmPassword'],
    forgot: ['email'],
    'choose-username': ['username'],
  }[mode] || ['email']

  function handleChange(field, value) {
    const next = { ...fields, [field]: value }
    setFields(next)
    if (touched[field])
      setErrors(prev => ({ ...prev, [field]: validateField(field, value, next, mode) }))
    if (field === 'password' && touched.confirmPassword)
      setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', next.confirmPassword, next, mode) }))
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validateField(field, fields[field], fields, mode) }))
  }

  function switchMode(next) {
    setMode(next); setAnimKey(k => k + 1); setServerError(null); setInfo(null)
    setErrors({}); setTouched({}); setShake(false); setShowPassword(false); setShowConfirm(false)
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────
  // Opens popup. AuthContext's onAuthStateChange subscription (always active)
  // receives SIGNED_IN via the browser's cross-tab localStorage storage event
  // and updates session state. The useEffect above then navigates.
  async function handleGoogleSignIn() {
    setServerError(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setServerError(translateError(error.message)); return }
    if (!data || !data.url) { setServerError('Erro ao iniciar autenticação.'); return }

    const w = 520, h = 640
    const popup = window.open(
      data.url,
      'eywa-google-auth',
      `width=${w},height=${h},left=${Math.round((screen.width - w) / 2)},top=${Math.round((screen.height - h) / 2)},menubar=no,toolbar=no`
    )
    if (!popup || popup.closed) {
      // Popup blocked — fall back to full redirect
      window.location.href = data.url
    }
    // Nothing else needed here. AuthContext detects the session change
    // automatically and the useEffect above handles navigation.
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setServerError(null); setInfo(null)

    const newTouched = {}, newErrors = {}
    for (const f of activeFields) {
      newTouched[f] = true
      const err = validateField(f, fields[f], fields, mode)
      if (err) newErrors[f] = err
    }
    setTouched(newTouched); setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) { setShake(true); return }

    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(fields.email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) throw error
        switchMode('forgot-sent')
        return
      }

      if (mode === 'signup') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: fields.email.trim(),
          password: fields.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        // Supabase returns a user with empty `identities` when the email is
        // already registered (email enumeration protection mode). Detect it.
        if (signUpData?.user && signUpData.user.identities?.length === 0) {
          setServerError('Este email já está cadastrado. Tente entrar ou recuperar a senha.')
          return
        }
        switchMode('signup-sent')
        return
      }

      // signin — accept email or username
      const loginVal = fields.email.trim()
      let emailToUse = loginVal
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginVal)) {
        // Exact case-sensitive match: if the user types "gabriel" but registered
        // as "Gabriel", this query returns no row and we reject the login.
        const { data: exactUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', loginVal)
          .maybeSingle()
        if (!exactUser) { setServerError('Usuário não encontrado.'); return }

        const { data: resolved, error: rpcErr } = await supabase
          .rpc('get_email_by_username', { p_username: loginVal })
        if (rpcErr || !resolved) { setServerError('Usuário não encontrado.'); return }
        emailToUse = resolved
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: fields.password,
      })
      if (error) throw error
      // No navigate() here — useEffect handles it once AuthContext confirms session

    } catch (err) {
      setServerError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Save username (Google users / accounts without profile) ───────────────
  async function handleSaveUsername(e) {
    e.preventDefault()
    setServerError(null)
    const usernameVal = fields.username.trim()
    setTouched(prev => ({ ...prev, username: true }))
    const err = validateField('username', usernameVal, fields, 'signup')
    if (err) { setErrors(prev => ({ ...prev, username: err })); setShake(true); return }

    setLoading(true)
    try {
      const { data: taken } = await supabase.from('profiles').select('id')
        .eq('username', usernameVal).maybeSingle()
      if (taken) {
        setErrors(prev => ({ ...prev, username: 'Nome de usuário já em uso.' }))
        setShake(true); return
      }
      const { error } = await supabase.from('profiles')
        .upsert({ id: session.user.id, username: usernameVal })
      if (error) throw error
      navigateTo('/')
    } catch (err) {
      setServerError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(fields.password)

  // ── Confirmation screens ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-root">
        <div className="auth-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
          <svg className="btn-spinner" style={{ width: 28, height: 28 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="var(--color-amber)" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
          </svg>
        </div>
      </div>
    )
  }

  if (mode === 'signup-sent' || mode === 'forgot-sent') {
    const isSignup = mode === 'signup-sent'
    return (
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-inner">
            <div className="auth-confirm-box">
              <div className="auth-confirm-icon">✉</div>
              <h2 className="auth-confirm-title">Verifique seu email</h2>
              <p className="auth-confirm-sub">
                {isSignup
                  ? 'Enviamos um link de confirmação. Clique nele para ativar sua conta.'
                  : 'Se esse email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também o spam.'}
              </p>
            </div>
            <button className="btn-primary" type="button" onClick={() => switchMode('signin')}>
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Username selection (post-Google signup) ────────────────────────────────
  if (mode === 'choose-username') {
    return (
      <div className="auth-root">
        <div className={`auth-card${exiting ? ' exiting' : ''}`} onAnimationEnd={handleCardAnimEnd}>
          <div ref={innerRef} className={`auth-inner${shake ? ' shake' : ''}`}>
            <div className="auth-logo">
              <span className="auth-logo-text">Eywa</span>
              <p className="auth-tagline">Quase lá. Escolha como quer ser conhecido.</p>
            </div>
            <form key={animKey} className="auth-form" onSubmit={handleSaveUsername} noValidate>
              <FieldWrap label="Nome de usuário" error={errors.username} touched={touched.username} value={fields.username}>
                <input
                  className={`auth-input ${touched.username ? (errors.username ? 'invalid' : 'valid') : ''}`}
                  type="text"
                  placeholder="Nome de usuário"
                  value={fields.username}
                  onChange={e => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  autoComplete="username"
                  maxLength={20}
                  autoFocus
                />
              </FieldWrap>
              {serverError && <p className="auth-server-error" role="alert">{serverError}</p>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <Spinner /> : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="auth-root">
      <div className={`auth-card${exiting ? ' exiting' : ''}`} onAnimationEnd={handleCardAnimEnd}>
        <div ref={innerRef} className={`auth-inner${shake ? ' shake' : ''}`}>

          {mode !== 'forgot' && (
            <div className="auth-logo">
              <span className="auth-logo-text">Eywa</span>
              <p className="auth-tagline">A rede está viva. Cada ação tem raízes.</p>
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <button className="btn-google" onClick={handleGoogleSignIn} type="button">
                <GoogleIcon /> Continuar com Google
              </button>
              <div className="auth-divider"><span>ou</span></div>
            </>
          )}

          {mode === 'forgot' && (
            <div className="auth-forgot-header">
              <h2 className="auth-forgot-title">Recuperar acesso</h2>
              <p className="auth-forgot-sub">
                Informe o email cadastrado e enviaremos um link para redefinir sua senha.
              </p>
            </div>
          )}

          <form key={animKey} className="auth-form" onSubmit={handleSubmit} noValidate>

            <FieldWrap
              label={mode === 'signin' ? 'Email ou nome de usuário' : 'Email'}
              error={errors.email} touched={touched.email} value={fields.email}
            >
              <input
                className={`auth-input ${touched.email ? (errors.email ? 'invalid' : 'valid') : ''}`}
                type={mode === 'signin' ? 'text' : 'email'}
                placeholder={mode === 'signin' ? 'seu@email.com ou nome de usuário' : 'seu@email.com'}
                value={fields.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
              />
            </FieldWrap>

            {mode !== 'forgot' && (
              <FieldWrap
                label="Senha"
                error={errors.password} touched={touched.password} value={fields.password}
                hideIcon
                hint={mode === 'signup' && fields.password ? (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="strength-bar"
                          style={n <= strength.level ? { background: strength.color, opacity: 1 } : {}} />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                ) : null}
              >
                <input
                  className={`auth-input with-eye ${touched.password ? (errors.password ? 'invalid' : 'valid') : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={fields.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button type="button" className="input-eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1} aria-label="Alternar visibilidade da senha">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </FieldWrap>
            )}

            {mode === 'signup' && (
              <FieldWrap label="Confirmar senha"
                error={errors.confirmPassword} touched={touched.confirmPassword} value={fields.confirmPassword}
                hideIcon
              >
                <input
                  className={`auth-input with-eye ${touched.confirmPassword ? (errors.confirmPassword ? 'invalid' : 'valid') : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar senha"
                  value={fields.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  autoComplete="new-password"
                />
                <button type="button" className="input-eye-btn"
                  onClick={() => setShowConfirm(p => !p)}
                  tabIndex={-1} aria-label="Alternar visibilidade da senha">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </FieldWrap>
            )}

            {mode === 'signin' && (
              <div className="auth-forgot-link-row">
                <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {serverError && <p className="auth-server-error" role="alert">{serverError}</p>}
            {info        && <p className="auth-info" role="status">{info}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <Spinner />
                : mode === 'signin' ? 'Entrar'
                : mode === 'signup' ? 'Criar conta'
                : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="auth-mode-switch">
            {mode !== 'forgot' ? (
              <>
                <span>{mode === 'signin' ? 'Não tem conta?' : 'Já tem conta?'}</span>
                <button type="button"
                  className={`auth-toggle-btn${mode === 'signup' ? ' signin-cta' : ''}`}
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                  {mode === 'signin' ? 'Criar conta' : 'Entrar'}
                </button>
              </>
            ) : (
              <button type="button" className="auth-toggle-btn signin-cta"
                onClick={() => switchMode('signin')}>
                Voltar para o login
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function FieldWrap({ error, touched, value, children, label, hideIcon, hint }) {
  const showValid = !hideIcon && touched && !error && value
  const showError = !hideIcon && touched && !!error
  const hasError  = touched && !!error
  return (
    <div className="field-wrap">
      {label && <label className="field-label">{label}</label>}
      <div className="input-wrap">
        {children}
        {showValid && <span className="field-icon valid"   aria-hidden="true"><FieldCheckIcon /></span>}
        {showError && <span className="field-icon invalid" aria-hidden="true">!</span>}
      </div>
      {hint}
      <div className="field-error-slot" aria-live="polite">
        {hasError && <p className="field-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}

function FieldCheckIcon() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
      <path d="M1 4.5L4.5 8L10 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
