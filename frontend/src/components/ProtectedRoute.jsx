import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!user || !user.token) {
    return <Navigate to="/login" replace />
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute