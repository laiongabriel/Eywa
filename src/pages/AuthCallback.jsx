import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// This page is only used when Google OAuth opens in a popup.
// Supabase automatically exchanges the OAuth code for a session and stores it
// in localStorage. The parent window detects this via the browser storage event
// (Supabase JS cross-tab session sync) and its onAuthStateChange fires.
// All we need to do here is confirm the session is ready and close the popup.
export default function AuthCallback() {
  useEffect(() => {
    let done = false

    function finish() {
      if (done) return
      done = true
      if (window.opener && !window.opener.closed) {
        // Close popup. Parent detects session via storage event automatically.
        window.close()
      } else {
        // Full-page redirect (email confirmation, popup blocked, etc.)
        // Go to /auth so AuthPage can check username and handle the flow.
        window.location.replace('/auth')
      }
    }

    // Listen for Supabase to finish exchanging the OAuth code
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        subscription.unsubscribe()
        finish()
      }
    })

    // Also check immediately in case exchange already completed before this ran
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        finish()
      }
    })

    // Safety timeout
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      finish()
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div className="loading-dot" style={{ margin: '0 auto' }} />
      <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--color-text-secondary)', fontFamily: 'inherit' }}>
        Autenticando...
      </p>
    </div>
  )
}
