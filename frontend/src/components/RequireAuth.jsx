import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../services/api.js'

function RequireAuth({ children }) {
  const location = useLocation()
  if (!getToken()) return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  return children
}

export default RequireAuth
