import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedShell><TasksPage /></ProtectedShell>} />
          <Route path="/agenda" element={<ProtectedShell><CalendarPage /></ProtectedShell>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
