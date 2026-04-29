import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading, username, profileReady } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-dot" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  // Authenticated but no username yet (new user who bypassed /auth — e.g. email
  // confirmation token landed on / instead of /auth/callback). Send to /auth so
  // the choose-username flow runs. Only redirect once profileReady is true to
  // avoid redirecting while the profile fetch is still in flight.
  if (profileReady && !username) {
    return <Navigate to="/auth" replace />
  }

  return children
}
