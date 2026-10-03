import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard component that requires authentication.
 * Redirects unauthenticated users to /login and shows loading state during auth check.
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Route component to render if authenticated
 * @returns {ReactNode}
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page-loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
