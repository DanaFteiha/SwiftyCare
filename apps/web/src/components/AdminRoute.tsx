import { Navigate } from 'react-router-dom'
import { hasRole, isAuthenticated } from '@/lib/auth'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/doctor/login" replace />
  }
  if (!hasRole('admin')) {
    return <Navigate to="/doctor" replace />
  }
  return <>{children}</>
}
