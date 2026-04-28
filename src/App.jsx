import { useEffect, useSyncExternalStore } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import ResetPassword from './pages/ResetPassword'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
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
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar">
            ✕
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
        </Routes>
      </AuthProvider>
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  )
}
