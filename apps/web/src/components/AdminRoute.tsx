import { Navigate, useLocation } from 'react-router-dom'
import { hasRole, isAuthenticated } from '@/lib/auth'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation()
  if (!isAuthenticated()) {
    // Pass the intended destination so the login page can redirect back after
    // a successful login instead of always going to /doctor.
    return <Navigate to="/doctor/login" state={{ from: location }} replace />
  }
  if (!hasRole('admin')) {
    return <Navigate to="/doctor" replace />
  }
  return <>{children}</>
}
