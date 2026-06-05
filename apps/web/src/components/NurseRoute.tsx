import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasRole } from '@/lib/auth'

interface NurseRouteProps {
  children: ReactNode
}

function NurseRoute({ children }: NurseRouteProps) {
  const location = useLocation()

  if (!hasRole('nurse', 'admin')) {
    return <Navigate to="/nurse/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default NurseRoute
