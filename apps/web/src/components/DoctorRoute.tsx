import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasRole } from '@/lib/auth'

interface DoctorRouteProps {
  children: ReactNode
}

function DoctorRoute({ children }: DoctorRouteProps) {
  const location = useLocation()

  if (!hasRole('doctor', 'admin')) {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default DoctorRoute
