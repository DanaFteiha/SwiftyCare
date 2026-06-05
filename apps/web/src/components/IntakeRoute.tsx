import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasRole } from '@/lib/auth'

interface IntakeRouteProps {
  children: ReactNode
}

// Patient intake (case creation) runs on a kiosk/registration station that must
// be signed in. Any staff role may operate intake.
function IntakeRoute({ children }: IntakeRouteProps) {
  const location = useLocation()

  if (!hasRole('intake', 'nurse', 'doctor', 'admin')) {
    return <Navigate to="/intake/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default IntakeRoute
