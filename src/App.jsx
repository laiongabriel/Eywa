import { useEffect, useSyncExternalStore } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import ResetPassword from './pages/ResetPassword'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import {
  completeRouteProgress,
  getRouteProgressSnapshot,
  subscribeRouteProgress,
} from './lib/routeProgress'

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

function RouteProgressBar() {
  const location = useLocation()
  const progress = useSyncExternalStore(subscribeRouteProgress, getRouteProgressSnapshot)

  useEffect(() => {
    if (!progress.active || !progress.targetPath) return
    if (location.pathname !== progress.targetPath) return

    const frame = window.requestAnimationFrame(() => completeRouteProgress())
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, progress.active, progress.targetPath])

  return (
    <div className={`route-progress${progress.visible ? ' visible' : ''}`} aria-hidden="true">
      <div
        className="route-progress-bar"
        style={{ transform: `scaleX(${progress.progress})` }}
      />
    </div>
  )
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()
  if (!toasts.length) return null

  function icon(type) {
    if (type === 'success') return (
      <svg className="toast-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
    if (type === 'error') return (
      <svg className="toast-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
    return (
      <svg className="toast-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 7.5v3.5M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}${t.removing ? ' toast--out' : ''}`} role="alert">
          {icon(t.type)}
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function AppContent() {
  return (
    <>
      <RouteProgressBar />
      <ToastContainer />
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedShell><TasksPage /></ProtectedShell>} />
          <Route path="/agenda" element={<ProtectedShell><CalendarPage /></ProtectedShell>} />
          <Route path="/settings" element={<ProtectedShell><SettingsPage /></ProtectedShell>} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SettingsProvider>
    </ToastProvider>
  )
}
